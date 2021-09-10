# Http Long Polling

关键词: `HTTP长轮询` `Spring Web MVC Asynchronous Requests(异步请求)` `DeferredResult` `Callable`

## 数据交互两种模式

### Push（推模式）

推模式指的是客户端与服务端建立好网络长连接，服务方有相关数据，直接通过长连接通道推送到客户端。其优点是及时，一旦有数据变更，客户端立马能感知到；另外对客户端来说逻辑简单，不需要关心有无数据这些逻辑处理。缺点是不知道客户端的数据消费能力，可能导致数据积压在客户端，来不及处理。

### Pull（拉模式）

拉模式指的是客户端主动向服务端发出请求，拉取相关数据。其优点是此过程由客户端发起请求，故不存在推模式中数据积压的问题。缺点是可能不够及时，对客户端来说需要考虑数据拉取相关逻辑，何时去拉，拉的频率怎么控制等等。

## 异步请求

`Servlet`异步请求处理的非常简洁的概述：
- 一个`servlet`请求`ServletRequest`可以通过调用`request.startAsync()` 方法而进入异步模式。这样做的主要效果是`Servlet`（以及任何过滤器）都可以退出，但是响应（response）仍然是开放的，以便稍后处理完成。
- `request.startAsync()`返回一个`AsyncContext`对象，可用它进一步控制异步处理。例如，它提供了`dispatch`方法，类似于`Servlet API`的转发（forward），只是它允许应用程序在`Servlet`容器线程上恢复请求处理。
- `ServletRequest`提供了获取当前`DispatcherType`的方式，可以使用它来区分处理初始请求、异步调度、转发和其他调度程序类型。

`DeferredResult` 处理流程如下：
- `Controller`先返回一个`DeferredResult`对象，并将其保存在内存队列或列表中，以便访问它。
- `Spring MVC` 调用`request.startAsync()`。
- 同时，`DispatcherServlet`和所有配置的过滤器退出请求处理线程，但响应保持打开状态。
- 在应用程序中的某一个线程设置`DeferredResult`，然后`Spring MVC` 调度`request`请求返回到`Servlet`容器中。
- `DispatcherServlet`再次调用，恢复对该异步返回结果的处理。

`Callable` 处理流程如下：
- `Controller`先返回一个`Callable`对象。
- `Spring MVC`调用`request.startAsync()`并把该`Callable`对象提交给独立线程的执行器`TaskExecutor`处理
- 同时，`DispatcherServlet`和所有过滤器退出`Servlet`容器线程，但响应保持打开状态。
- 最终，`Callable`生成一个返回结果，此时`Spring MVC`将重新把请求发送回`Servlet`容器，恢复处理。
- `DispatcherServlet`再次被调用，恢复对该异步返回结果的处理。

## 简述 polling 和 long polling 的区别

> 这里暂时抛开某些场景webSocket的解决方案

举一个栗子来说明长轮询的好处，例如携程`Apollo`配置中心，怎么实时查询配置中心有数据更新呢？`polling`和`long polling`的方式分别如下：
- polling: 轮询会每隔`1s`去向服务器发起一次查询请求，返回是否有数据更新，数据最长有`1s`的延时。
- long polling: 首先发起查询请求，服务端没有更新的话就不回复，直到`60s`后或者有数据变更时立即返回给客户端，客户端收到服务器响应后，立即发起下一次请求。长轮询保证了数据变更获取的实时性，也极大的较少了与服务器的交互，基于web异步处理技术，大大的提升了服务性能。

::: tip 延伸思考
  `long polling`的方式和`发布订阅`的模式的不同点有哪些？
:::


## 携程`Apollo`配置中心 Http Long Polling 的具体实现

服务端:
```java
// com.ctrip.framework.apollo.configservice.controller.NotificationControllerV2.java

@RestController
@RequestMapping("/notifications/v2")
public class NotificationControllerV2 implements ReleaseMessageListener {
    
    // ...

    @GetMapping
    public DeferredResult<ResponseEntity<List<ApolloConfigNotification>>> pollNotification(
            @RequestParam(value = "appId") String appId,
            @RequestParam(value = "cluster") String cluster,
            @RequestParam(value = "notifications") String notificationsAsString,
            @RequestParam(value = "dataCenter", required = false) String dataCenter,
            @RequestParam(value = "ip", required = false) String clientIp) {
        List<ApolloConfigNotification> notifications = null;

        try {
            notifications = gson.fromJson(notificationsAsString, notificationsTypeReference);
        } catch (Throwable ex) {
            Tracer.logError(ex);
        }

        if (CollectionUtils.isEmpty(notifications)) {
            throw new BadRequestException("Invalid format of notifications: " + notificationsAsString);
        }

        Map<String, ApolloConfigNotification> filteredNotifications = filterNotifications(appId, notifications);

        if (CollectionUtils.isEmpty(filteredNotifications)) {
            throw new BadRequestException("Invalid format of notifications: " + notificationsAsString);
        }

        DeferredResultWrapper deferredResultWrapper = new DeferredResultWrapper(bizConfig.longPollingTimeoutInMilli());
        Set<String> namespaces = Sets.newHashSetWithExpectedSize(filteredNotifications.size());
        Map<String, Long> clientSideNotifications = Maps.newHashMapWithExpectedSize(filteredNotifications.size());

        for (Map.Entry<String, ApolloConfigNotification> notificationEntry : filteredNotifications.entrySet()) {
            String normalizedNamespace = notificationEntry.getKey();
            ApolloConfigNotification notification = notificationEntry.getValue();
            namespaces.add(normalizedNamespace);
            clientSideNotifications.put(normalizedNamespace, notification.getNotificationId());
            if (!Objects.equals(notification.getNamespaceName(), normalizedNamespace)) {
                deferredResultWrapper.recordNamespaceNameNormalizedResult(notification.getNamespaceName(), normalizedNamespace);
            }
        }

        Multimap<String, String> watchedKeysMap = watchKeysUtil.assembleAllWatchKeys(appId, cluster, namespaces, dataCenter);
        
        // ...

        return deferredResultWrapper.getResult();
    }

}
```

客户端:
```java
com.ctrip.framework.apollo.internals.RemoteConfigLongPollService.java

public class RemoteConfigLongPollService {
    
    // ...

    private void doLongPollingRefresh(String appId, String cluster, String dataCenter, String secret) {
        final Random random = new Random();
        ServiceDTO lastServiceDto = null;
        while (!m_longPollingStopped.get() && !Thread.currentThread().isInterrupted()) {
            if (!m_longPollRateLimiter.tryAcquire(5, TimeUnit.SECONDS)) {
                //wait at most 5 seconds
                try {
                    TimeUnit.SECONDS.sleep(5);
                } catch (InterruptedException e) {
                }
            }
            Transaction transaction = Tracer.newTransaction("Apollo.ConfigService", "pollNotification");
            String url = null;
            try {
                if (lastServiceDto == null) {
                    List<ServiceDTO> configServices = getConfigServices();
                    lastServiceDto = configServices.get(random.nextInt(configServices.size()));
                }

                url = assembleLongPollRefreshUrl(lastServiceDto.getHomepageUrl(), appId, cluster, dataCenter, m_notifications);

                logger.debug("Long polling from {}", url);

                HttpRequest request = new HttpRequest(url);
                request.setReadTimeout(LONG_POLLING_READ_TIMEOUT);
                if (!StringUtils.isBlank(secret)) {
                    Map<String, String> headers = Signature.buildHttpHeaders(url, appId, secret);
                    request.setHeaders(headers);
                }

                transaction.addData("Url", url);

                final HttpResponse<List<ApolloConfigNotification>> response = m_httpUtil.doGet(request, m_responseType);

                logger.debug("Long polling response: {}, url: {}", response.getStatusCode(), url);
                if (response.getStatusCode() == 200 && response.getBody() != null) {
                    updateNotifications(response.getBody());
                    updateRemoteNotifications(response.getBody());
                    transaction.addData("Result", response.getBody().toString());
                    notify(lastServiceDto, response.getBody());
                }

                //try to load balance
                if (response.getStatusCode() == 304 && random.nextBoolean()) {
                    lastServiceDto = null;
                }

                m_longPollFailSchedulePolicyInSecond.success();
                transaction.addData("StatusCode", response.getStatusCode());
                transaction.setStatus(Transaction.SUCCESS);
            } catch (Throwable ex) {
                lastServiceDto = null;
                Tracer.logEvent("ApolloConfigException", ExceptionUtil.getDetailMessage(ex));
                transaction.setStatus(ex);
                long sleepTimeInSecond = m_longPollFailSchedulePolicyInSecond.fail();
                logger.warn(
                        "Long polling failed, will retry in {} seconds. appId: {}, cluster: {}, namespaces: {}, long polling url: {}, reason: {}",
                        sleepTimeInSecond, appId, cluster, assembleNamespaces(), url, ExceptionUtil.getDetailMessage(ex));
                try {
                    TimeUnit.SECONDS.sleep(sleepTimeInSecond);
                } catch (InterruptedException ie) {
                    //ignore
                }
            } finally {
                transaction.complete();
            }
        }
    }

    // ...
}
```

`Apollo`客户端和服务端保持了一个长连接，从而能第一时间获得配置更新的推送。

长连接实际上我们是通过`Http Long Polling`实现的，具体而言：

1. 客户端发起一个Http请求到服务端
2. 服务端会保持住这个连接60秒
   - 如果在60秒内有客户端关心的配置变化，被保持住的客户端请求会立即返回，并告知客户端有配置变化的`namespace`信息，客户端会据此拉取对应`namespace`的最新配置
   - 如果在60秒内没有客户端关心的配置变化，那么会返回Http`状态码304`给客户端
3. 客户端在收到服务端请求后会立即重新发起连接，回到第一步

考虑到会有数万客户端向服务端发起长连，在服务端我们使用了`async servlet(Spring DeferredResult)`来服务`Http Long Polling`请求。

## Nacos 配置中心 Http Long Polling 的具体实现




## PC 端实时查询用户个人消息 Http Long Polling 的具体实现 :100:

定义 `DeferredResult` 封装器
```java
public class UserNewMessageDeferredResultWrapper implements Comparable<UserNewMessageDeferredResultWrapper> {


    private DeferredResult<UserNewMessageDTO> result;

    public UserNewMessageDeferredResultWrapper(long timeoutInMilli) {
        result = new DeferredResult<>(timeoutInMilli);
    }

    public void onTimeout(Runnable timeoutCallback) {
        result.onTimeout(timeoutCallback);
    }

    public void onCompletion(Runnable completionCallback) {
        result.onCompletion(completionCallback);
    }

    public void setResult(UserNewMessageDTO userNewMessage) {
        result.setResult(userNewMessage);
    }


    public DeferredResult<UserNewMessageDTO> getResult() {
        return result;
    }

    @Override
    public int compareTo(@NonNull UserNewMessageDeferredResultWrapper deferredResultWrapper) {
        return Integer.compare(this.hashCode(), deferredResultWrapper.hashCode());
    }
}
```

`Controller`接口定义返回`DeferredResult`,具体实现如下：
```java
    // ...

    @ApiOperation("新消息 - HTTP LONG POLLING")
    @GetMapping("/new")
    public DeferredResult<UserNewMessageDTO> pollUserNewMessage(
            @RequestAttribute("userId") Long userId,
            @RequestParam(value = "newMessageId", required = false) Long newMessageId) {
        
        // `DeferredResult` 封装器，设置超时时间
        UserNewMessageDeferredResultWrapper deferredResultWrapper = new UserNewMessageDeferredResultWrapper(CommonConstants.DEFAULT_LONG_POLLING_TIMEOUT);
        
        //查询当前用户的新消息
        UserNewMessageDTO userNewMessage = this.qaUserMessageServiceFacade.findUserNewMessage(userId);
        //比较当前新消息是否最新的消息，如果是立即返回，如果不是，则等待， 其中setResult方法是关键
        if (Objects.nonNull(userNewMessage.getId()) && ObjectUtil.notEqual(userNewMessage.getId(), newMessageId)) {
            deferredResultWrapper.setResult(userNewMessage);
        } else {
            // 没有新消息，进入等待中的状态，保存当前请求的 UserNewMessageDeferredResultWrapper
            this.qaUserMessageServiceFacade.process(newMessageId, userId, deferredResultWrapper);
        }

        return deferredResultWrapper.getResult();
    }
```

`process` 方法处理逻辑如下：
```java
     // ...

    @Override
    public void process(@Nullable Long newMessageId, Long userId, UserNewMessageDeferredResultWrapper deferredResultWrapper) {
        String watchedKey = CacheConstants.getUserMessageWatchedKey(userId);
        
        // 设置超时后，接口的返回值
        deferredResultWrapper.onTimeout(() -> deferredResultWrapper.setResult(new UserNewMessageDTO(HttpStatus.NOT_MODIFIED.value(), newMessageId)));
        
        // 设置完成后，移除缓存中的deferredResultWrapper
        deferredResultWrapper.onCompletion(() -> deferredResults.remove(watchedKey, deferredResultWrapper));
            
        // 缓存deferredResultWrapper，当有新消息时会根据watchedKey来获取deferredResultWrapper
        deferredResults.put(watchedKey, deferredResultWrapper);
    }
```

用户有新消息的处理逻辑如下：
```java
     // ...
     @Override
    public void settingResult(@NonNull Long userId, @NonNull UserNewMessageDTO userNewMessage) {
        String watchedKey = CacheConstants.getUserMessageWatchedKey(userId);
        if (deferredResults.containsKey(watchedKey)) {
            // 获取到UserNewMessageDeferredResultWrapper，在调用setResult方法设置值，前面的接口立即返回值
            List<UserNewMessageDeferredResultWrapper> results = Lists.newArrayList(deferredResults.get(watchedKey));
            if (CollectionUtil.isNotEmpty(results)) {
                results.forEach(result -> result.setResult(userNewMessage));
            }
        }
    }
```

由于我们日常工作中，所有的服务都是集群部署的，那么有可能缓存的`deferredResultWrapper`和处理新消息的线程不在一个服务中，导致无法调用setResult方法设置值。所以当有新消息的情况下，需要使用**广播的方式**通知集群下所有的服务都执行新消息处理逻辑。


## Long Polling 的实现为什么需要设置超时时间？

主要原因是网络传输层主要走的是`tcp协议`，`tcp协议`是可靠面向连接的协议，通过三次握手建立连接。但是所建立的连接是虚拟的，
可能存在某段时间网络不通，或者服务端程序非正常关闭，亦或服务端机器非正常关机，面对这些情况客户端根本不知道服务端此时已经不能互通，
还在傻傻的等服务端发数据过来，而这一等一般都是很长时间。

当然`tcp协议`在实现上有保活计时器来保证的，但是等到保活计时器发现连接已经断开需要很长时间，如果没有专门配置过相关的`tcp参数`，一般需要`2`个小时，而且这些参数是机器操作系统层面。
所以，以此方式来保活不太靠谱，故`Long Polling`的实现上一般是需要设置超时时间的。

---

**参考文档**
- [Javadoc DeferredResult](https://docs.spring.io/spring-framework/docs/5.2.8.RELEASE/javadoc-api/org/springframework/web/context/request/async/DeferredResult.html)
- [Spring Web MVC 异步请求](https://docs.spring.io/spring-framework/docs/current/spring-framework-reference/web.html#mvc-ann-async)
- [apollo](https://gitee.com/nobodyiam/apollo)