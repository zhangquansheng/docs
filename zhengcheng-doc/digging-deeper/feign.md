---
sidebarDepth: 3
---

# 使用 Feign 实现声明式 REST 调用

[[toc]]

以`根据学生ID获取用户信息` 为例：

```java
/**
 * 公共服务
 *
 * @author :    quansheng.zhang
 * @date :    2020/3/2 11:07
 */
@FeignClient(name = "sso", url = "https://t-sso.gaodun.com", fallbackFactory = SsoFeignClientFallbackFactory.class)
public interface SsoFeignClient {
    /**
     * 根据学生ID获取用户信息
     *
     * @param userId 学生 ID
     * @return 用户信息
     */
    @GetMapping(value = "/getbaseuserinfo/{userid}", headers = {"x-origin=gaodun.com"})
    BaseUserInfoResponse getBaseUserInfo(@PathVariable("userid") String userId);
}
```

## 设计原理

Feign 的设计
![feign-design](/img/spring-cloud-feign/feign-design.png)

### 1. 基于面向接口的动态代理方式生成实现类

```java
// feign.ReflectiveFeign.java
public class ReflectiveFeign extends Feign {

  //...

  /**
   * creates an api binding to the {@code target}. As this invokes reflection, care should be taken
   * to cache the result.
   */
  @SuppressWarnings("unchecked")
  @Override
  public <T> T newInstance(Target<T> target) {
    //根据接口类和Contract协议解析方式，解析接口类上的方法和注解，转换成内部的MethodHandler处理方式
    Map<String, MethodHandler> nameToHandler = targetToHandlersByName.apply(target);
    Map<Method, MethodHandler> methodToHandler = new LinkedHashMap<Method, MethodHandler>();
    List<DefaultMethodHandler> defaultMethodHandlers = new LinkedList<DefaultMethodHandler>();
    
    //...
    
    InvocationHandler handler = factory.create(target, methodToHandler);
    // 基于Proxy.newProxyInstance 为接口类创建动态实现，将所有的请求转换给InvocationHandler处理
    T proxy = (T) Proxy.newProxyInstance(target.type().getClassLoader(),
        new Class<?>[] {target.type()}, handler);

    for (DefaultMethodHandler defaultMethodHandler : defaultMethodHandlers) {
      defaultMethodHandler.bindTo(proxy);
    }
    return proxy;
  }

  //...
}
```

**项目启动时**的效果如下：
![feign-proxy](/img/spring-cloud-feign/feign-proxy.png)


### 2. 根据Contract协议规则，解析接口类的注解信息

```java
// feign.Contract.java
/**
 * Defines what annotations and values are valid on interfaces.
 */
public interface Contract {

  /**
   * Called to parse the methods in the class that are linked to HTTP requests.
   *
   * @param targetType {@link feign.Target#type() type} of the Feign interface.
   */
  // TODO: break this and correct spelling at some point
  List<MethodMetadata> parseAndValidatateMetadata(Class<?> targetType);
    
  //...
}   
```

**项目启动时**的效果如下：
![feign-contract](/img/spring-cloud-feign/feign-contract.png)

Feign 默认的协议规范: [官方文档](https://github.com/OpenFeign/feign#interface-annotations)
![feign-default-contract](/img/spring-cloud-feign/feign-default-contract.png)


在Spring Boot(Cloud)中，Feign 默认使用的契约是 SpringMvcContract, 因此它可以使用 SpringMvc 的注解。

如果让它使用 Feign 自带的注解进行工作，需要自定义 Feign 的配置：
```java
/**
 * 该类为Feign的配置类
 * <p>
 * 注意：该类可以不写 @Configuration 注解；如果加了 @Configuration 注解，那么该类不能放在主应用程序上下文 @ComponentScan 所扫描的包中，否则会使项目中默认的 Feign 配置类发生变化
 *
 * @author :    zhangquansheng
 * @date :    2020/7/9 18:40
 */
public class FeignConfiguration {

    /**
     * 将契约改为feign原生的默认契约。这样就可以使用feign自带的注解了。
     *
     * @return 默认的feign契约
     */
    @Bean
    public Contract feignContract() {
        return new feign.Contract.Default();
    }
}
```

::: warning 禁止使用原生Feign注解调用feign接口
1. 书写不方便，极容易出错
2. Spring Cloud [官方文档](https://cloud.spring.io/spring-cloud-static/spring-cloud-openfeign/3.0.0.M1/reference/html/#spring-cloud-feign-overriding-defaults)中默认使用 `SpringMvcContract`            
:::
 

### 3. 基于 RequestBean，动态生成 Request

`feign.ReflectiveFeign.BuildTemplateByResolvingArgs` 实现了`RequestTemplate.Factory`,通过以上动态代理生成的`MethodHandler` 和 `Object[] argv` 生成 `RequestTemplate` , 源码如下：
```java
// feign.ReflectiveFeign.BuildTemplateByResolvingArgs.java
 //...
    @Override
    public RequestTemplate create(Object[] argv) {
      RequestTemplate mutable = RequestTemplate.from(metadata.template());
      // ...
      return template;
    }
 //...
```
然后 `RequestTemplate` 根据`targetRequest`方法转换成真正的`Request`请求, 源码如下：
```java
// feign.SynchronousMethodHandler.java
//...

  Request targetRequest(RequestTemplate template) {
    for (RequestInterceptor interceptor : requestInterceptors) {
      interceptor.apply(template);
    }
    return target.apply(template);
  }

//...
```

### 4. 使用Encoder 将Bean转换成 Http报文正文（消息解析和转码逻辑）
```java
// feign.SynchronousMethodHandler

Object executeAndDecode(RequestTemplate template, Options options) throws Throwable {
    //...
        response = client.execute(request, options);
    //...
}
```

**程序运行时**数据结构如下：
![feign-request-response.png](/img/spring-cloud-feign/feign-request-response.png)



### 5. 拦截器负责对请求和返回进行装饰处理

在请求转换的过程中，Feign 抽象出来了拦截器接口，用于用户自定义对请求的操作：
```java
// feign.RequestInterceptor.java

public interface RequestInterceptor {

  /**
   * 可以在构造RequestTemplate 请求时，增加或者修改Header, Method, Body 等信息
   * Called for every request. Add data using methods on the supplied {@link RequestTemplate}.
   */
  void apply(RequestTemplate template);
}
```

### 6. 日志记录

在发送和接收请求的时候，Feign定义了统一的日志门面来输出日志信息 , 并且将日志的输出定义了四个等级：

| 级别        | 说明    | 
| --------   | -----:   | 
| NONE        | 不做任何记录      |  
| BASIC        | 只记录输出Http 方法名称、请求URL、返回状态码和执行时间      |  
| HEADERS        | 记录输出Http 方法名称、请求URL、返回状态码和执行时间 和 Header 信息      |   
| FULL           | 记录Request 和Response的Header，Body和一些请求元数据      |   

::: tip 特别提示
日志规范中，对于外部接口部分的要求是：调用第三方时的调用参数和调用结果要打印Info级别的日志,由于Feign配置FULL级别的情况下，需要配置Debug级别才能打印所需要的日志。

在最佳实践中，配置修改了Feign的日志输出为INFO级别。
:::

### 7. 基于重试器发送HTTP请求

Feign 内置了一个重试器，当HTTP请求出现IO异常时，Feign会有一个最大尝试次数发送请求

重试器有如下几个控制参数：

| 重试参数 |	说明	|  默认值 |
| --------   | -----:   |  -----: |
| period	| 初始重试时间间隔，当请求失败后，重试器将会暂停 初始时间间隔(线程 sleep 的方式)后再开始，避免强刷请求，浪费性能	| 100ms
|  maxPeriod	|  当请求连续失败时，重试的时间间隔将按照：long interval = (long) (period * Math.pow(1.5, attempt - 1)); 计算，按照等比例方式延长，但是最大间隔时间为  maxPeriod, 设置此值能够避免 重试次数过多的情况下执行周期太长	|  1000ms | 
|  maxAttempts	|  最大重试次数	|  5 | 

**使用微服务(Spring Cloud)一般情况下，都是 ribbon 的超时时间（<）hystrix的超时时间（因为涉及到ribbon的重试机制）因为ribbon的重试机制和Feign的重试机制有冲突，所以源码中默认关闭Feign的重试机制** 


## 实现原理

### 1. Feign client 通过 OkHttpClient 完成 request 到 Response 的一次请求

使用 feign.okhttp.OkHttpClient   (注意和okhttp3.OkHttpClient是不一样的), 

实际上处理 HTTP URL 请求的是 feignClient(…) 方法中的 feign.okhttp.OkHttpClient.execute(…) 方法，源码如下：
```java
//feign.okhttp.OkHttpClient.java
 
  @Override
  public feign.Response execute(feign.Request input, feign.Request.Options options)
      throws IOException {
    okhttp3.OkHttpClient requestScoped;
    if (delegate.connectTimeoutMillis() != options.connectTimeoutMillis()
        || delegate.readTimeoutMillis() != options.readTimeoutMillis()) {
      requestScoped = delegate.newBuilder()
          .connectTimeout(options.connectTimeoutMillis(), TimeUnit.MILLISECONDS)
          .readTimeout(options.readTimeoutMillis(), TimeUnit.MILLISECONDS)
          .followRedirects(options.isFollowRedirects())
          .build();
    } else {
      requestScoped = delegate;
    }
    Request request = toOkHttpRequest(input);
    // okhttp 执行层, 其中requestScoped 是 okhttp3.OkHttpClient 的实例
    Response response = requestScoped.newCall(request).execute();
    return toFeignResponse(response, input).toBuilder().request(input).build();
  }
```

在默认没有配置的情况下，Options的初始化参数如下：
```java
public Options() {
  this(10 * 1000, 60 * 1000);
}
// connectTimeoutMillis = 10_000
// readTimeoutMillis = 60_000
```

也可以通过配置文件来修改默认配置，配置如下：
```properties
// default 为默认的，也可以根据feign的value值，单独配置
feign.client.config.default.connectTimeout=1000
feign.client.config.default.readTimeout=10000
```

从源码可以看到，feign使用okhttp时，超时时间优先根据client的时间来设置。

### 2. okhttp 执行层

```java
// 其中requestScoped 是 okhttp3.OkHttpClient 的实例
Response response = requestScoped.newCall(request).execute();
```

这是应用程序中发起网络请求最顶端的调用，newCall(request) 方法返回 RealCall 对象。

RealCall 封装了一个 request 代表一个请求调用任务，RealCall 有两个重要的方法 execute() 和 enqueue(Callback responseCallback)。

execute() 是直接在当前线程执行请求，enqueue(Callback responseCallback) 是将当前任务加到任务队列中，执行异步请求。

### 3. 同步请求

```java
// okhttp3.RealCall.java

  @Override public Response execute() throws IOException {
    synchronized (this) {
      if (executed) throw new IllegalStateException("Already Executed");
      executed = true;
    }
    captureCallStackTrace();
    try {
      client.dispatcher().executed(this);
      Response result = getResponseWithInterceptorChain();
      if (result == null) throw new IOException("Canceled");
      return result;
    } finally {
      client.dispatcher().finished(this);
    }
  }
```

从执行层说到连接层，涉及到 `getResponseWithInterceptorChain` 方法中组织的各个拦截器的执行过程，其中 `getResponseWithInterceptorChain` 是关键，它使用了**责任链设计模式** 

### 4. 连接器执行过程

```java
// okhttp3.RealCall.java

  Response getResponseWithInterceptorChain() throws IOException {
    // Build a full stack of interceptors.
    List<Interceptor> interceptors = new ArrayList<>();
    interceptors.addAll(client.interceptors());
    interceptors.add(retryAndFollowUpInterceptor);
    interceptors.add(new BridgeInterceptor(client.cookieJar()));
    interceptors.add(new CacheInterceptor(client.internalCache()));
    interceptors.add(new ConnectInterceptor(client));
    if (!forWebSocket) {
      interceptors.addAll(client.networkInterceptors());
    }
    interceptors.add(new CallServerInterceptor(forWebSocket));

    Interceptor.Chain chain = new RealInterceptorChain(
        interceptors, null, null, null, 0, originalRequest);
    return chain.proceed(originalRequest);
  }
```

### 5. Okhttp 拦截器 RetryAndFollowUpInterceptor 重试机制

此拦截器将从故障中恢复，并根据需要执行重定向。如果调用被取消，它会抛出 *{@link IOException}

关于重定向次数：
```java
/**
 * How many redirects and auth challenges should we attempt? Chrome follows 21 redirects; Firefox,
 * curl, and wget follow 20; Safari follows 16; and HTTP/1.0 recommends 5.
 */
private static final int MAX_FOLLOW_UPS = 20;
```

### 6. Okhttp 拦截器 BridgeInterceptor 桥梁
> 一个实现应用层和网络层直接的数据格式编码的桥。
> - 第一： 把应用层客户端传过来的请求对象转换为 Http 网络协议所需字段的请求对象。 
> - 第二:  把下游网络请求结果转换为应用层客户所需要的响应对象

默认设置HTTP长连接（开启Keep-Alive功能可使客户端到服务器端的连接持续有效,当出现对服务器的后继请求时,Keep-Alive功能避免了建立或者重新建立连接。）
```java
if (userRequest.header("Connection") == null) {
  requestBuilder.header("Connection", "Keep-Alive");
}
```

### 7. Okhttp3 拦截器  CacheInterceptor 缓存

为来自缓存的请求提供服务，并将响应写入缓存

### 8. Okhttp3 拦截器 ConnectInterceptor 连接

打开到目标服务器的连接并继续到下一个拦截器。

### 9. Okhttp3 拦截器 CallServerInterceptor 网络调用

这是链中的最后一个拦截器。它对服务器进行网络调用。
![okhttp3](/img/spring-cloud-feign/okhttp3-1.png)

### 10. ConnectionPool 实现

![okhttp3](/img/spring-cloud-feign/okhttp3-2.png)

> 管理HTTP和HTTP/2连接的重用以减少网络延迟
> HTTP请求共享同一{@link Address} ，共享同一{@link Connection}
> 实现策略为将来使用而保持开放的连接。


默认实现中，使用一个双向队列来缓存所有连接， 这些连接中最多只能存在 5 个空闲连接，空闲连接最多只能存活 5 分钟。
```java
/**
 * Create a new connection pool with tuning parameters appropriate for a single-user application.
 * The tuning parameters in this pool are subject to change in future OkHttp releases. Currently
 * this pool holds up to 5 idle connections which will be evicted after 5 minutes of inactivity.
 */
public ConnectionPool() {
  this(5, 5, TimeUnit.MINUTES);
}
```

如何复用Connection：遍历了所有的连接，然后判断某个连接是否可以复用；http1.x协议下当前socket没有其他流正在读写时可以复用，否则不行，http2.0对流数量没有限制。

如何清理连接池：每次put一个新连接的时候都会判断是否需要清理。遍历当前所有连接，跳过正在使用的连接，其他没有用的连接，如果哪个连接超过了规定的时间，就关掉这个socket。如果都没有超过规定时间的，就返回离规定时间最近的那个差值。拿到那个时间值后，我们再回到上面那个cleanupRunnable中，在那里会wait线程，然后醒来继续清理


## 最佳实践

### 整合 Feign

### 自定义Feign配置

### 使用Feign构造多参数请求

### 使用Feign上传文件

### Feign 对继承的支持

Feign支持继承。使用继承，可将一些公共操作分组到一些父接口中，从而简化Feign的开发。

UserService.java
```java
public interface UserService {

    @RequestMapping(method = RequestMethod.GET, value ="/users/{id}")
    User getUser(@PathVariable("id") long id);
}
```
UserResource.java
```java
@RestController
public class UserResource implements UserService {

}
```
UserClient.java
```java
package project.user;

@FeignClient("users")
public interface UserClient extends UserService {

}
```
::: warning 注意
尽管Feign的继承可帮助我们进一步简化开发，但是Spring Cloud指出——通常情况下，不建议服务器端和客户端之间共享接口，因为这种方式会造成服务器端和客户端代码的紧耦合。
并且，Feign本身并不使用Spring MVC的工作机制（方法参数映射不被继承）。
:::

应客观看待“紧耦性”与“方便性”，并在权衡利弊后作出取舍，**个人推荐内部接口服务可使用继承的方式提供一个feign的客户端,这样会大大方便内部接口的对接。**
　　

### Feign 对压缩的支持

在一些场景下，可能需要对请求或响应进行压缩，此时可使用启用Feign的压缩功能。
```properties
feign.compression.request.enabled=true
feign.compression.response.enabled=true
```
对于请求的压缩，Feign还提供了更为详细的设置，例如：
```properties
feign.compression.request.enabled=true
feign.compression.request.mime-types=text/xml,application/xml,application/json
feign.compression.request.min-request-size=2048
```
其中，feign.compression.request.mime-types 用于支持的媒体类型列表，默认是 text/xml,application/xml,application/json
feign.compression.request.min-request-size 用于设置请求的最小阈值，默认是2048

### Feign 的日志

## 常见问题