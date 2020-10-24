# RocketMQ 消息消费

[阿里云消息队列（Message Queue）使用示例](https://code.aliyun.com/aliware_rocketmq/rocketmq-demo/tree/master)

maven
```xml
    <dependency>
        <groupId>com.aliyun.openservices</groupId>
        <artifactId>ons-client</artifactId>
        <version>1.8.4.Final</version>
    </dependency>
```

```java
    @Autowired
    private RocketMQMessageListener rocketMQMessageListener;

    @Primary
    @Bean(initMethod = "start", destroyMethod = "shutdown")
    public ConsumerBean buildTrToolConsumer(@Qualifier("rocketMQProperties") RocketMQProperties rocketMQProperties) {
        ConsumerBean consumerBean = new ConsumerBean();
        consumerBean.setProperties(rocketMQProperties.getMqConsumerProperties());
        //订阅关系
        Map<Subscription, MessageListener> subscriptionTable = new HashMap<>();
        Subscription subscription = new Subscription();
        subscription.setTopic(rocketMQProperties.getTopic());
        subscription.setExpression(rocketMQProperties.getTag());
        subscriptionTable.put(subscription, rocketMQMessageListener);
        //订阅多个topic如上面设置
        consumerBean.setSubscriptionTable(subscriptionTable);
        return consumerBean;
    }
```