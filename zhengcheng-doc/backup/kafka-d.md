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

### 消息MDC 切面

```java
/**
 * {@org.springframework.kafka.annotation.KafkaListener} 切面增强类
 *
 * @author :    zhangquansheng
 * @date :    2020/8/25 13:52
 */
@Slf4j
@Aspect
@Component
public class KafkaListenerAspect {

    /**
     * 定义拦截规则：
     * 有@KafkaListener注解的方法。
     */
    @Pointcut("@annotation(org.springframework.kafka.annotation.KafkaListener)")
    public void kafkaListenerMethodPointcut() {
    }

    @Around("kafkaListenerMethodPointcut()")
    public Object around(ProceedingJoinPoint pjp) throws Throwable {
        Object[] args = pjp.getArgs();
        // 只有当第一个参数为 ConsumerRecord<String, String> record 时，才打印日志
        if (this.isConsumerRecord(args)) {
            ConsumerRecord record = (ConsumerRecord) args[0];
            if (record.value() instanceof String) {
                BaseMessageDTO baseMessage = JSONUtil.toBean((String) record.value(), BaseMessageDTO.class);
                if (Objects.nonNull(baseMessage)) {
                    MDC.put(TraceIdInterceptor.TRACE_ID, baseMessage.getDataId());
                }
                log.info("{}.{} ConsumerRecord: [{}]", pjp.getSignature().getDeclaringType().getSimpleName(), pjp.getSignature().getName(), record);
            }
        }

        Object retObj = pjp.proceed();

        MDC.remove(TraceIdInterceptor.TRACE_ID);
        return retObj;
    }

    private boolean isConsumerRecord(Object[] args) {
        return Objects.nonNull(args) && args.length > 0 && args[0] instanceof ConsumerRecord;
    }

}
```


## 应用场景

### 异步解耦

构建应用系统和分析系统的桥梁，并将它们之间的关联解耦，通过上、下游业务系统的松耦合设计，即便下游子系统（如物流、积分等）出现不可用甚至宕机，都不会影响到核心交易系统的正常运转；


### 高可扩展性

具有高可扩展性，即当数据量增加时可通过增加节点快速水平扩展。

### 削峰填谷
    
MQ 超高性能的消息处理能力可以承接流量脉冲而不被击垮，在确保系统可用性同时，因快速有效的请求响应而提升用户的体验；

确保下游业务在安全水位内平滑稳定的运行，避免超高流量的冲击；

通过削弱填谷可控制下游业务系统的集群规模，从而降低投入成本；

### 顺序消息

在大多使用场景下，数据处理的顺序都很重要。大部分消息队列本来就是排序的，并且能保证数据会按照特定的顺序来处理。Kafka 保证一个 Partition 内的消息的有序性。

## HA机制

::: tip 提示
学习中，内容待补充
:::

## 性能

[对Apache Kafka进行基准测试：每秒200万次写入（在三台便宜的机器上）](https://engineering.linkedin.com/kafka/benchmarking-apache-kafka-2-million-writes-second-three-cheap-machines)
