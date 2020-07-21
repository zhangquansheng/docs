# spring-kafka

::: tip 提示
本文基于 `spring-kafka 2.2.12` (`SpringBoot2.1.13`)， 非常详细的介绍请参考[官方文档](https://spring.io/projects/spring-kafka)
:::

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
    String value = JSONUtil.toJsonStr(data);
    final ProducerRecord<String, String> record = new ProducerRecord<>(KafkaTopic.TOPIC_MY, value);
    ListenableFuture<SendResult<String, String>> future = kafkaTemplate.send(record);
    future.addCallback(new ListenableFutureCallback<SendResult<String, String>>() {
        @Override
        public void onSuccess(SendResult<String, String> result) {
            log.info("handleSuccess,result:[{}] ", result);
        }

        @Override
        public void onFailure(Throwable ex) {
            log.error("record: [{}] handleFailure", record, ex);
        }
    });
}
```

```shell script
2020-07-20 17:33:01,588 [kafka-producer-network-thread | producer-1] INFO   [com.zhengcheng.magic.kafka.KafkaProducerSend] KafkaProducerSend.java:34 - handleSuccess,result:[SendResult [producerRecord=ProducerRecord(topic=zc_magic_topic_my, partition=null, headers=RecordHeaders(headers = [], isReadOnly = true), key=null, value={"userId":0,"dataId":"932bc38e6d3e4bc995a5e28489f18d71","teamId":0}, timestamp=null), recordMetadata=zc_magic_topic_my-37@26]]
```

- 阻塞（同步）
```java
public void sendToKafka2(final MyOutputData data) {
    String value = JSONUtil.toJsonStr(data);
    final ProducerRecord<String, String> record = new ProducerRecord<>(KafkaTopic.TOPIC_MY, value);
    try {
        kafkaTemplate.send(record).get(10, TimeUnit.SECONDS);
        log.info("handleSuccess,data:[{}] ", data);
        //handleSuccess(data);
    } catch (ExecutionException | TimeoutException | InterruptedException e) {
        log.error("handleFailure,data:[{}]", data, e);
        // handleFailure(data, record, e.getCause());
    }
}
```

## 接收消息

当使用`@KafkaListener`注解来接收消息时，spring-kafka为我们做了什么？下面通过阅读源码的方式来剖析整个过程。

类的的加载顺序如下：
`KafkaAutoConfiguration` -> `KafkaAnnotationDrivenConfiguration` -> `@EnableKafka` -> `KafkaBootstrapConfiguration` -> (`KafkaListenerAnnotationBeanPostProcessor`,`KafkaListenerEndpointRegistry`)
