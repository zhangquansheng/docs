# RocketMQ 消息消费

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