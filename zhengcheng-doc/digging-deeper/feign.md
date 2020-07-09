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


### 3. 基于 RequestBean，动态生成Request

### 4. 使用Encoder 将Bean转换成 Http报文正文（消息解析和转码逻辑）

### 5. 拦截器负责对请求和返回进行装饰处理

### 6. 日志记录

### 7. 基于重试器发送HTTP请求

## 实现原理

## 最佳实践

## 常见问题