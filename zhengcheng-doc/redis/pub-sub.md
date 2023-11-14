# SpringBoot Redis 发布订阅

## 概述

`Redis`提供了发布/订阅（`Publish/Subscribe`）模式，用于实现消息的**广播**和**异步通信**。下面是关于`Redis`发布/订阅模式的介绍。

### 发布/订阅模式（Pub/Sub）

发布/订阅模式是一种消息通信模式，其中消息的发布者（`Publisher`）将消息发送到特定的频道（`Channel`），而订阅者（`Subscriber`）可以订阅一个或多个频道以接收消息。这种模式允许消息的广播和异步传递，发送者和接收者之间解耦。

### Redis 的发布/订阅功能

`Redis`提供了原生的发布/订阅功能，使得开发者可以使用`Redis`作为消息中间件来实现高效的消息传递。以下是与`Redis`发布/订阅相关的关键概念和操作：

| 概念 | 说明                                                                  |
| --- |---------------------------------------------------------------------|
| 频道（`Channel`） | `Redis`中用于发布和订阅消息的通道。每个消息都被发布到一个特定的频道，而订阅者可以选择订阅一个或多个感兴趣的频道。         |
| 发布消息（`Publish`） | 通过使用`PUBLISH`命令，发布者可以将消息发送到指定的频道。一旦消息被发布到频道，所有订阅该频道的客户端将接收到该消息。      |
| 订阅频道（`Subscribe`） | 通过使用`SUBSCRIBE`命令，客户端可以订阅一个或多个频道。一旦订阅成功，客户端将成为该频道的订阅者，可以接收到该频道上发布的消息。|
| 取消订阅频道（`Unsubscribe`） | 通过使用`UNSUBSCRIBE`命令，客户端可以取消对一个或多个频道的订阅。当客户端不再对某个频道感兴趣时，可以选择取消订阅。    |
| 模式匹配订阅（`Pattern Subscription`） | `Redis`支持使用`PSUBSCRIBE`命令进行模式匹配订阅。通过指定一个模式，可以订阅与该模式匹配的多个频道。      |

## 核心源码实现

基于`spring-boot-starter-data-redis`实现`Redis`发布订阅。

### 消息发布

```java
redisTemplate.convertAndSend("MY_CHANNEL", "message");
```

### 消息订阅

实现`MessageListener`
```java
@Slf4j
public class MyMessageListener implements MessageListener {

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String channel = new String(pattern);
        String key = new String(message.getBody());
        log.info("MyMessageListener key message:[{}] from channel: [{}]", key, channel);
        // TODO 业务逻辑
    }
}
```

配置监听规则

```java
@Slf4j
@Configuration
public class RedisAutoConfiguration {
    
    @Bean
    public ChannelTopic topic() {
        return new ChannelTopic("MY_CHANNEL"); // 定义消息队列的通道名称
    }

  
    @Bean
    public MyMessageListener myMessageListener() {
        return new MyMessageListener();
    }

    @ConditionalOnBean(MyMessageListener.class)
    @Bean
    public MessageListenerAdapter messageListenerAdapter(MyMessageListener messageSubscriber) {
        return new MessageListenerAdapter(messageSubscriber);
    }

    /**
     * 配置redis监听容器
     */
    @Bean
    public RedisMessageListenerContainer container(RedisConnectionFactory connectionFactory, MessageListenerAdapter messageListenerAdapter, ChannelTopic topic) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.addMessageListener(messageListenerAdapter, topic);

        //模式匹配订阅频道
//        List<PatternTopic> topicList = Arrays.asList(new PatternTopic("life.*"),new PatternTopic("*.life"));
//        container.addMessageListener(lifeRedisMessageListener, topicList);
        
        return container;
    }
   
}
```

`Redis`发布/订阅（`Pub/Sub`）适用于需要即时通知、实时事件处理和实时数据传递的场景，例如：**二级缓存实时通知其他服务删除缓存**、**配置中心长轮询获取实时配置**。

## 参考文档	

- Redis官方文档 -  [发布/订阅](https://redis.io/topics/pubsub)
	



