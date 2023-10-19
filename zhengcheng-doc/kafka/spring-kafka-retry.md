# Kafka 重试机制

::: tip 特别提示
本文基于 `spring-kafka-2.5.14`源码
:::

在默认配置下，当消费异常会进行重试，重试多次后会跳过当前消息，继续进行后续消息的消费，不会一直卡在当前消息，保证了业务的正常进行。

## 默认会重试多少次？

默认配置下，消费异常会进行重试，重试次数是多少, 重试是否有时间间隔？

`org.springframework.kafka.listener.SeekUtils`
```java
public final class SeekUtils {

    /**
     * The number of times a topic/partition/offset can fail before being rejected.
     */
    public static final int DEFAULT_MAX_FAILURES = 10;

    /**
     * The default back off - a {@link FixedBackOff} with 0 interval and
     * {@link #DEFAULT_MAX_FAILURES} - 1 retry attempts.
     */
    public static final FixedBackOff DEFAULT_BACK_OFF = new FixedBackOff(0, DEFAULT_MAX_FAILURES - 1);

    private static final LoggingCommitCallback LOGGING_COMMIT_CALLBACK = new LoggingCommitCallback();

    private SeekUtils() {
    }
    
    ...
}
```

从源码看，`Kafka`消费者在默认配置下会进行最多`10`次的重试，每次重试的时间间隔为`0`，即立即进行重试。如果在`10`次重试后仍然无法成功消费消息，则不再进行重试，消息将被视为消费失败。
