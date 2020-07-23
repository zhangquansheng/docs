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

## 发送消息

### 使用 KafkaTemplate

KafkaTemplate 发送消息的相关方法如下：
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

发送消息示例如下：

- 非阻塞（异步）
```java
public void sendToKafka(final MyOutputData data) {
    final ProducerRecord<String, String> record = createRecord(data);

    ListenableFuture<SendResult<Integer, String>> future = template.send(record);
    future.addCallback(new KafkaSendCallback<SendResult<Integer, String>>() {

        @Override
        public void onSuccess(SendResult<Integer, String> result) {
            handleSuccess(data);
        }

        @Override
        public void onFailure(KafkaProducerException ex) {
            handleFailure(data, record, ex);
        }

    });
}
```

- 阻塞（同步）
```java
public void sendToKafka(final MyOutputData data) {
    final ProducerRecord<String, String> record = createRecord(data);

    try {
        template.send(record).get(10, TimeUnit.SECONDS);
        handleSuccess(data);
    }
    catch (ExecutionException e) {
        handleFailure(data, record, e.getCause());
    }
    catch (TimeoutException | InterruptedException e) {
        handleFailure(data, record, e);
    }
}
```

## 接收消息

使用`@KafkaListener`注解来接收消息,以下示例显示了如何使用它：
```java
public class Listener {
    @KafkaListener(id = "foo", topics = "myTopic", clientIdPrefix = "myClientId")
    public void listen(String data) {
        //...
    }
}
```

要求配置`@EnableKafka`注解，以及一个用于配置底层的侦听器容器工厂`ConcurrentMessageListenerContainer`。默认情况下，会使用名称为`kafkaListenerContainerFactory`的bean。

以下示例显示如何使用`ConcurrentMessageListenerContainer`：
```java
@Configuration
@EnableKafka
public class KafkaConfig {

    @Bean
    KafkaListenerContainerFactory<ConcurrentMessageListenerContainer<Integer, String>>
                        kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<Integer, String> factory =
                                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        factory.setConcurrency(3);
        factory.getContainerProperties().setPollTimeout(3000);
        return factory;
    }

    @Bean
    public ConsumerFactory<Integer, String> consumerFactory() {
        return new DefaultKafkaConsumerFactory<>(consumerConfigs());
    }

    @Bean
    public Map<String, Object> consumerConfigs() {
        Map<String, Object> props = new HashMap<>();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, embeddedKafka.getBrokersAsString());
        //...
        return props;
    }
}
```
请注意，要设置容器属性，必须在工厂使用`getContainerProperties()`方法。它用作注入到容器中的实际属性的模板。

### 消息元数据

有关消息的元数据可从消息头获得。可以使用以下**标题名称**来检索消息的标题：

- KafkaHeaders.OFFSET
- KafkaHeaders.RECEIVED_MESSAGE_KEY
- KafkaHeaders.RECEIVED_TOPIC
- KafkaHeaders.RECEIVED_PARTITION_ID
- KafkaHeaders.RECEIVED_TIMESTAMP
- KafkaHeaders.TIMESTAMP_TYPE

从2.5版本开始，RECEIVED_MESSAGE_KEY如果传入消息具有null密钥，则不存在；之前，标头中填充了一个null值。进行此更改是为了使框架与不存在有价值的标头的spring-messaging约定保持一致null。

以下示例显示了如何使用消息头：
```java
@KafkaListener(id = "qux", topicPattern = "myTopic1")
public void listen(@Payload String foo,
        @Header(name = KafkaHeaders.RECEIVED_MESSAGE_KEY, required = false) Integer key,
        @Header(KafkaHeaders.RECEIVED_PARTITION_ID) int partition,
        @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
        @Header(KafkaHeaders.RECEIVED_TIMESTAMP) long ts
        ) {
    //...
}
```
从2.5版开始，您可以使用`ConsumerRecordMetadata`参数接收消息元数据。

```java
@KafkaListener(...)
public void listen(String str, ConsumerRecordMetadata meta) {
    //...
}
```

### 批处理

可以配置`@KafkaListener`底层的侦听器容器工厂`ConcurrentMessageListenerContainer`来设置batchListener属性。以下示例显示了如何执行此操作：
```java
@Bean
public KafkaListenerContainerFactory<?, ?> batchFactory() {
    ConcurrentKafkaListenerContainerFactory<Integer, String> factory =
            new ConcurrentKafkaListenerContainerFactory<>();
    factory.setConsumerFactory(consumerFactory());
    factory.setBatchListener(true);  // <<<<<<<<<<<<<<<<<<<<<<<<<
    return factory;
}
```

以下示例显示了如何批量接收消息列表：

```java
@KafkaListener(id = "list", topics = "myTopic", containerFactory = "batchFactory")
public void listen(List<String> list) {
    //...
}
```

```java
@KafkaListener(id = "list", topics = "myTopic", containerFactory = "batchFactory")
public void listen(List<String> list,
        @Header(KafkaHeaders.RECEIVED_MESSAGE_KEY) List<Integer> keys,
        @Header(KafkaHeaders.RECEIVED_PARTITION_ID) List<Integer> partitions,
        @Header(KafkaHeaders.RECEIVED_TOPIC) List<String> topics,
        @Header(KafkaHeaders.OFFSET) List<Long> offsets) {
    //...
}
```

```java
@KafkaListener(id = "listMsg", topics = "myTopic", containerFactory = "batchFactory")
public void listen14(List<Message<?>> list) {
    //...
}

@KafkaListener(id = "listMsgAck", topics = "myTopic", containerFactory = "batchFactory")
public void listen15(List<Message<?>> list, Acknowledgment ack) {
    //...
}

@KafkaListener(id = "listMsgAckConsumer", topics = "myTopic", containerFactory = "batchFactory")
public void listen16(List<Message<?>> list, Acknowledgment ack, Consumer<?, ?> consumer) {
    //...
}
```

还可以接收ConsumerRecord<?, ?>对象列表，但它必须是方法上定义的唯一参数（除了使用可选的Acknowledgment，当使用手动提交和Consumer<?, ?>参数时，该参数除外）。以下示例显示了如何执行此操作：

```java
@KafkaListener(id = "listCRs", topics = "myTopic", containerFactory = "batchFactory")
public void listen(List<ConsumerRecord<Integer, String>> list) {
    //...
}

@KafkaListener(id = "listCRsAck", topics = "myTopic", containerFactory = "batchFactory")
public void listen(List<ConsumerRecord<Integer, String>> list, Acknowledgment ack) {
    //...
}
```


Class | 主要作用
---|---
org.springframework.kafka.annotation.KafkaListenerAnnotationBeanPostProcessor | 扫描`@KafkaListener`
org.springframework.kafka.config.KafkaListenerEndpointRegistry | 为已注册的`KafkaListenerEndpoint `创建`MessageListenerContainer`,并管理消息监听器的生命周期，特别是在生命周期内应用程序上下文。与手动创建的`MessageListenerContainer`相反，消息监听器由`registry`管理而不是应用程序上下文中的bean或`@Autowired`的对象。如果需要访问特定的消息监听器容器，请使用{@link #getListenerContainer(String)}

`KafkaAutoConfiguration` -> `KafkaAnnotationDrivenConfiguration` -> (`ConcurrentKafkaListenerContainerFactory`,`@EnableKafka`) -> `KafkaBootstrapConfiguration` -> (`KafkaListenerAnnotationBeanPostProcessor`,`KafkaListenerEndpointRegistry`)

```properties
#当Kafka中没有初始偏移量或者服务器上不存在当前偏移量时该怎么办，默认值为latest，表示自动将偏移重置为最新的偏移量
#可选的值为latest, earliest, none
spring.kafka.consumer.auto-offset-reset=latest
#一次调用poll()操作时返回的最大记录数，默认值为500
spring.kafka.consumer.max-poll-records = 150
# 默认自动提交，设为false，需要设置ack-mode
spring.kafka.consumer.enable-auto-commit=false

# 手动调用Acknowledgment.acknowledge()后立即提交
spring.kafka.listener.ack-mode=manual_immediate
#在侦听器容器中运行的线程数
spring.kafka.listener.concurrency = 1;
```

