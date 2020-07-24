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

### KafkaTemplate 同步发送消息

KafkaTemplate 异步发送消息大大的提升了生产者的并发能力，但某些场景下我们需要明确知道此次发送消息是否成功，参考 [Future] 模式

```java
kafkaTemplate.send("zc_magic_topic_dict", JSONUtil.toJsonStr(dictItemMessageDTO)).get();
```

### 消息结果回调

一般来说我们都会去获取 KafkaTemplate 发送消息的结果去判断消息是否发送成功，如果消息发送失败，则会重新发送或者执行对应的业务逻辑，参考代码如下：

```java
 ListenableFuture<SendResult<String, String>> future = kafkaTemplate.send("zc_magic_topic_dict", JSONUtil.toJsonStr(dictItemMessageDTO));
    future.addCallback(new ListenableFutureCallback<SendResult<String, String>>() {
        @Override
        public void onFailure(@NonNull Throwable throwable) {
            log.error("sent message=[{}] failed!", msg, throwable);
            // 消息发送失败的逻辑
        }
 
        @Override
        public void onSuccess(SendResult<String, String> result) {
            log.info("sent message=[{}] with offset=[{}] success!", msg, result.getRecordMetadata().offset());
        }
    });
    try {
        // 因为是异步发送，所以我们等待，最多10s
        future.get(10, TimeUnit.SECONDS);
    } catch (InterruptedException | ExecutionException | TimeoutException e) {
        log.error("waiting for kafka send finish failed!", e);
        // 消息发送超时的逻辑
    }
```