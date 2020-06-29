# spring-kafka

::: tip 特别提示
本文基于 `spring-kafka 2.5.3` 并结合在`SpringBoot2.0`的实际开发过程中的最佳实践，非常详细的介绍，请参考[官方文档](https://spring.io/projects/spring-kafka)
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
spring.kafka.consumer.value-deserializer=org.springframework.kafka.support.serializer.JsonDeserializer
spring.kafka.consumer.properties.spring.json.trusted.packages=*
spring.kafka.consumer.max-poll-records=150
spring.kafka.producer.retries=2
spring.kafka.producer.key-serializer=org.apache.kafka.common.serialization.StringSerializer
spring.kafka.producer.value-serializer=org.springframework.kafka.support.serializer.JsonSerializer
spring.kafka.listener.ack-mode=manual_immediate
```

> 更多设置请参考[KafkaProperties](https://github.com/spring-projects/spring-boot/blob/v2.3.1.RELEASE/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/kafka/KafkaProperties.java)

## KafkaTemplate 发送消息及结果回调

