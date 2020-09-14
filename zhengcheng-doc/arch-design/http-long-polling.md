# Spring Web MVC Asynchronous Requests(异步请求) 和 Http Long Polling（HTTP长轮询）

## 异步请求

- `Servlet`异步请求处理的非常简洁的概述：



## 携程`Apollo`配置中心的场景使用示例

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