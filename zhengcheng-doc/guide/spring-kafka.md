# spring-kafka

::: tip 特别提示
本文基于 `spring-kafka 2.2.12` 并结合在`SpringBoot2.1.13`的实际开发过程中的最佳实践，非常详细的介绍，请参考[官方文档](https://spring.io/projects/spring-kafka)
:::

## 安装

在 Maven 工程中使用

```xml
    <dependency>
        <groupId>org.springframework.kafka</groupId>
        <artifactId>spring-kafka</artifactId>
    </dependency>
```

## 属性设置

Kafka 的配置由 `spring.kafka.*.` 属性控制，例如：

```properties
# kafka 配置
spring.kafka.bootstrap-servers=127.0.0.1:9092
spring.kafka.consumer.group-id=magic
spring.kafka.consumer.enable-auto-commit=false
spring.kafka.consumer.key-deserializer=org.apache.kafka.common.serialization.StringDeserializer
spring.kafka.consumer.value-deserializer=org.apache.kafka.common.serialization.StringDeserializer
spring.kafka.consumer.properties.spring.json.trusted.packages=*
spring.kafka.consumer.max-poll-records=150
spring.kafka.producer.retries=2
spring.kafka.producer.key-serializer=org.apache.kafka.common.serialization.StringSerializer
spring.kafka.producer.value-serializer=org.apache.kafka.common.serialization.StringDeserializer
spring.kafka.listener.ack-mode=manual_immediate
```

> 更多设置请参考[KafkaProperties](https://github.com/spring-projects/spring-boot/blob/v2.3.1.RELEASE/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/kafka/KafkaProperties.java)

在 `zhengcheng` 项目中，推荐统一使用 `org.apache.kafka.common.serialization.StringDeserializer`对key/value进行序列化；

## KafkaTemplate 发送消息及结果回调

Spring’s KafkaTemplate 是自动配置的，有关发送的接口如下:
```java
ListenableFuture<SendResult<K, V>> send(String topic, V data);
ListenableFuture<SendResult<K, V>> send(String topic, K key, V data);
ListenableFuture<SendResult<K, V>> send(String topic, Integer partition, K key, V data);
ListenableFuture<SendResult<K, V>> send(String topic, Integer partition, Long timestamp, K key, V data);
ListenableFuture<SendResult<K, V>> send(ProducerRecord<K, V> record);
ListenableFuture<SendResult<K, V>> send(Message<?> message);
ListenableFuture<SendResult<K, V>> sendDefault(V data);
ListenableFuture<SendResult<K, V>> sendDefault(K key, V data);
ListenableFuture<SendResult<K, V>> sendDefault(Integer partition, K key, V data);
ListenableFuture<SendResult<K, V>> sendDefault(Integer partition, Long timestamp, K key, V data);
```

参数 | 解释
---|---
topic | Topic的名字
partition | 分区的id，其实就是第几个分区，id从0开始。表示指定发送到该分区中
timestamp | 时间戳，一般默认当前时间戳
key | 消息的键
data | 消息的数据
ProducerRecord | 消息对应的封装类，包含上述字段
Message | Spring自带的Message封装类，包含消息及消息头

### KafkaTemplate 异步发送消息

KafkaTemplate 发送消息是采取异步方式发送，如下：

```java
@Autowired
private KafkaTemplate<String, String> kafkaTemplate;

kafkaTemplate.send("zc_magic_topic_dict", JSONUtil.toJsonStr(dictItemMessageDTO));
```

如果设置了默认主题，可以稍微简化 send() 方法，通过设置 `spring.kafka.template.default-topic` 属性，将默认主题设置为 `zc_magic_topic_dict`：
```properties
spring.kafka.template.default-topic=zc_magic_topic_dict
```

然后可以调用 sendDefault() 而不是 send()
```java
kafkaTemplate.sendDefault(JSONUtil.toJsonStr(dictItemMessageDTO));
```