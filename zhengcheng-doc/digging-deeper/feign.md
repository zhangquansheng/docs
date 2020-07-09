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

    for (Method method : target.type().getMethods()) {
      if (method.getDeclaringClass() == Object.class) {
        continue;
      } else if (Util.isDefault(method)) {
        DefaultMethodHandler handler = new DefaultMethodHandler(method);
        defaultMethodHandlers.add(handler);
        methodToHandler.put(method, handler);
      } else {
        methodToHandler.put(method, nameToHandler.get(Feign.configKey(target.type(), method)));
      }
    }
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
    
  // ...
}   
```

解析后的效果如下：
![feign-contract](/img/spring-cloud-feign/feign-contract.png)

Feign 默认的协议规范:
![feign-default-contract](/img/spring-cloud-feign/feign-default-contract.png)
[官方文档](https://github.com/OpenFeign/feign#interface-annotations)


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
 

### 3. 基于 RequestBean，动态生成Request

### 4. 使用Encoder 将Bean转换成 Http报文正文（消息解析和转码逻辑）

### 5. 拦截器负责对请求和返回进行装饰处理

### 6. 日志记录

### 7. 基于重试器发送HTTP请求

## 实现原理

## 最佳实践

## 常见问题