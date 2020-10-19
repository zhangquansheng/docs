# SpringBoot 配置多 Kafka 中心

## Kafka 配置
```java
@Configuration
public class KafkaConfig {

    @Primary
    @Bean
    @ConfigurationProperties("spring.kafka")
    public KafkaProperties kafkaProperties() {
        return new KafkaProperties();
    }

    @Primary
    @Bean
    public KafkaListenerContainerFactory kafkaFactory(@Autowired @Qualifier("consumerFactory") ConsumerFactory consumerFactory) {
        ConcurrentKafkaListenerContainerFactory factory = new ConcurrentKafkaListenerContainerFactory();
        factory.setConsumerFactory(consumerFactory);
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL_IMMEDIATE);
        return factory;
    }

    @Primary
    @Bean
    public ConsumerFactory consumerFactory(@Autowired @Qualifier("kafkaProperties") KafkaProperties kafkaProperties) {
        return new DefaultKafkaConsumerFactory(kafkaProperties.buildConsumerProperties());
    }

    /**
     * 数据同步 canal kafka的配置
     *
     * @param consumerFactory 消费工厂
     * @return 监听容器工厂
     */
    @Bean
    public KafkaListenerContainerFactory canalKafkaFactory(@Autowired @Qualifier("canalConsumerFactory") ConsumerFactory consumerFactory) {
        ConcurrentKafkaListenerContainerFactory factory = new ConcurrentKafkaListenerContainerFactory();
        factory.setConcurrency(3);
        factory.getContainerProperties().setPollTimeout(3000);
        factory.setConsumerFactory(consumerFactory);
        return factory;
    }

    @Bean
    public ConsumerFactory canalConsumerFactory(@Autowired @Qualifier("kafkaProperties") KafkaProperties kafkaProperties) {
        return new DefaultKafkaConsumerFactory<>(consumerConfigs(kafkaProperties));
    }

    private Map<String, Object> consumerConfigs(KafkaProperties kafkaProperties) {
        Map<String, Object> props = new HashMap<>(16);
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, kafkaProperties.getBootstrapServers());
        props.put(ConsumerConfig.GROUP_ID_CONFIG, kafkaProperties.getConsumer().getGroupId());
        props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, kafkaProperties.getConsumer().getMaxPollRecords());
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, true);
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, CanalMessageDeserializer.class);
        return props;
    }
}
```

## KafkaListener 打印MDC日志
```java
/**
 * {@link org.springframework.kafka.annotation.KafkaListener} 切面增强类
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

## 消费者使用示例
```java
    @KafkaListener(topics = KafkaTopic.TOPIC)
    public void listenAllocationRequestMessage(ConsumerRecord<String, String> record,Acknowledgment ack) {
        
        //do something
        ack.acknowledge();
    }

    @KafkaListener(topics = KafkaTopic.TOPIC_CANAL_REQUEST, containerFactory = "canalKafkaFactory")
    public void listBin(ConsumerRecord<String, List<OperationInfo>> record,Acknowledgment ack) {   
        
        //do something
        ack.acknowledge();
    }
```