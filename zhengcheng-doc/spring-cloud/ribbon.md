# Ribbon :hammer:

`Ribbon`是`Netflix`发布的一个负载均衡器，有助于控制`HTTP`和`TCP`客户端行为。`Ribbon`**提供了客户端负载均衡的功能**，`Ribbon`利用从`Eureka`中读取到的服务信息，在调用服务节点提供的服务时，
就可以基于某种负载均衡算法，自动地帮助服务消费者去请求。另外`Feign`已经使用了`Ribbon`，因此，如果使用`@FeignClient`，则此部分也适用。

## 为服务消费者整合 Ribbon

- 为项目添加`Ribbon`依赖，`Ribbon`的依赖如下（`spring-cloud-starter-netflix-eureka-client`已经包含`spring-cloud-starter-netflix-ribbon`，因此无须再次引入）：
```xml
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-ribbon</artifactId>
    </dependency>
```

- 为 RestTemplate 添加 @LoadBalanced 注解。
```java
    //添加LoadBalanced注解来整合Ribbon使其具有负载均衡的能力
    @Bean
    @LoadBalanced
    public RestTemplate restTemplate(){
        return new RestTemplate();
    }
```

## 饥饿加载

`Spring Cloud` 会为每一个命名的`Ribbon`客户端维护一个子应用程序上下文，默认是`lazy load`。指定名称的`Ribbon`客户端第一次请求时，对应的上下文才会被加载，因此，**首次请求往往会比较慢**。 
从 `Spring Cloud Dalston ` 开始，我们可配置饥饿加载。例如：
```yaml
ribbon:
    eager-load:
        enabled: true
        clients: client1, client2, client3
```

这样，对于名为 client1、client2、client3 的`Ribbon`客户端，将在启动时就加载对应的子应用程序上下文，从而**提高首次请求的访问速度**。



---
**参考文档**
- [7. Client Side Load Balancer: Ribbon](https://docs.spring.io/spring-cloud-netflix/docs/2.2.5.RELEASE/reference/html/#spring-cloud-ribbon)