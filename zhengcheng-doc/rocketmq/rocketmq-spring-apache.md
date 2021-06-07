# Spring Boot 集成 （二） apache

## RocketMQ-Spring

帮助开发者在`Spring Boot`中快速集成`RocketMQ`。支持`Spring Message`规范，方便开发者从其它`MQ`快速切换到`RocketMQ`。

## 功能特性

- 同步发送
- 异步发送
- one-way发送
- 发送顺序消息
- 批量发送
- 发送事务消息
- 发送延迟消息
- 并发消费（广播/集群）
- 顺序消费
- 支持消息过滤（使用tag/sql）
- 支持消息轨迹
- 认证和授权
- request-reply模式

## 使用方法

添加`maven`依赖：

```xml
<!--在pom.xml中添加依赖-->
<dependency>
    <groupId>org.apache.rocketmq</groupId>
    <artifactId>rocketmq-spring-boot-starter</artifactId>
    <version>${RELEASE.VERSION}</version>
</dependency>
```

## ACL功能

`Producer` 端要想使用 `ACL` 功能，需要多配置两个配置项:
```properties
## application.properties
rocketmq.name-server=127.0.0.1:9876
rocketmq.producer.group=my-group

rocketmq.producer.access-key=AK
rocketmq.producer.secret-key=SK
```

`Consumer` 端 `ACL` 功能需要在 `@RocketMQMessageListener `中进行配置
```java
@Service
@RocketMQMessageListener(
    topic = "test-topic-1", 
    consumerGroup = "my-consumer_test-topic-1",
    accessKey = "AK",
    secretKey = "SK"
)
public class MyConsumer implements RocketMQListener<String> {
    ...
}
```
> 注意:
> 可以不用为每个 @RocketMQMessageListener 注解配置 AK/SK，在配置文件中配置 rocketmq.consumer.access-key 和 rocketmq.consumer.secret-key 配置项，这两个配置项的值就是默认值


## 支持配置多个 RocketMQTemplate 

参考`org.apache.rocketmq.spring.autoconfigure.RocketMQAutoConfiguration` 的配置。


---
**参考文档**

- [RocketMQ-Spring 毕业两周年，为什么能成为 Spring 生态中最受欢迎的 messaging 实现？](https://mp.weixin.qq.com/s/N5koHVHEylibP7jnJpH2dw)
- [用户手册](https://github.com/apache/rocketmq-spring/wiki/%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C)
