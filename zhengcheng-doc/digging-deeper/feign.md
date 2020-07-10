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

### Feign 的设计
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

解析后的效果如下：
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

解析后的效果如下：
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
2. Spring Cloud 官方文档中推荐使用SpringMvc，以便项目框架的版本升级            
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

运行时数据结构如下：
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

**使用微服务(Spring Cloud)d一般情况下，都是 ribbon 的超时时间（<）hystrix的超时时间（因为涉及到ribbon的重试机制）因为ribbon的重试机制和Feign的重试机制有冲突，所以源码中默认关闭Feign的重试机制** 


## 实现原理

## 最佳实践

## 常见问题