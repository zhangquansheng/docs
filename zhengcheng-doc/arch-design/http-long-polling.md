# Spring Web MVC Asynchronous Requests(异步请求) 和 Http Long Polling（HTTP长轮询）

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

## 参考文档

- [Javadoc DeferredResult](https://docs.spring.io/spring-framework/docs/5.2.8.RELEASE/javadoc-api/org/springframework/web/context/request/async/DeferredResult.html)
- [Spring Web MVC 异步请求](https://docs.spring.io/spring-framework/docs/current/spring-framework-reference/web.html#mvc-ann-async)
- [apollo](https://gitee.com/nobodyiam/apollo)