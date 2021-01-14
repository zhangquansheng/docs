# Spring Boot 实现 Redis 消息的发布订阅功能

`Redis`的发布订阅模式，其本质和传统的`MQ`的发布订阅是差不多的，相对来说，`Redis`的使用更加便捷，也更加轻量化，不需要单独去搭建集成一套繁重的`MQ`框架。
但缺点也很明显，`Redis`发布的消息不会持久化，所以当某一台服务器出现问题的时候，这个消息会被丢失掉。所以在考虑使用之前要慎重，当前的业务是否对**数据一致性要求很高，如果要求很高，还是建议使用`MQ`产品**。

## MAVEN 
```xml
<!-- 添加redis依赖 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

## 发布消息
```java
   private RedisTemplate<String, String> redisTemplate;

   redisTemplate.convertAndSend(String channel, Object message);
```

## 订阅消息

### 实现`MessageListener`
```java
@Slf4j
@Service
public class MyMessageListener implements MessageListener {

    @Override
    public void onMessage(Message message, byte[] pattern) {
        log.info("接收数据: [{}] , 订阅频道: [{}]", message.toString(), new String(message.getChannel()));
    }

}
``` 

### RedisMessageListenerContainer 配置
```java
@ConditionalOnBean(MyMessageListener.class)
@Configuration
public class MyRedisMessageListenerContainer {

    @Autowired
    private MyMessageListener myMessageListener;

    @Bean
    public MessageListenerAdapter messageListener() {
        return new MessageListenerAdapter(myMessageListener);
    }

    @Bean
    public RedisMessageListenerContainer redisContainer(RedisConnectionFactory factory) {
        final RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(factory);
        // 设置 container 其他的配置,例如：setRecoveryInterval
        
        // 也可以使用 PatternTopic 匹配多个频道
        container.addMessageListener(messageListener(), new ChannelTopic("topic"));
        return container;
    }

}
```

---

# 参考文档
- [Redis Messaging (Pub/Sub)](https://docs.spring.io/spring-data/redis/docs/current/reference/html/#pubsub)