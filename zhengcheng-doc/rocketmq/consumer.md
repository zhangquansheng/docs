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

## 消费者启动流程

com.aliyun.openservices.shade.com.alibaba.rocketmq.client.impl.consumer.DefaultMQPushConsumerImpl.java

```java
private void copySubscription() throws MQClientException {
        try {
            Map<String, String> sub = this.defaultMQPushConsumer.getSubscription();
            if (sub != null) {
                for (final Map.Entry<String, String> entry : sub.entrySet()) {
                    final String topic = entry.getKey();
                    final String subString = entry.getValue();
                    SubscriptionData subscriptionData = FilterAPI.buildSubscriptionData(this.defaultMQPushConsumer.getConsumerGroup(),
                        topic, subString);
                    this.rebalanceImpl.getSubscriptionInner().put(topic, subscriptionData);
                }
            }

            if (null == this.messageListenerInner) {
                this.messageListenerInner = this.defaultMQPushConsumer.getMessageListener();
            }

            switch (this.defaultMQPushConsumer.getMessageModel()) {
                case BROADCASTING:
                    break;
                case CLUSTERING:
                    final String retryTopic = MixAll.getRetryTopic(this.defaultMQPushConsumer.getConsumerGroup());
                    SubscriptionData subscriptionData = FilterAPI.buildSubscriptionData(this.defaultMQPushConsumer.getConsumerGroup(),
                        retryTopic, SubscriptionData.SUB_ALL);
                    this.rebalanceImpl.getSubscriptionInner().put(retryTopic, subscriptionData);
                    break;
                default:
                    break;
            }
        } catch (Exception e) {
            throw new MQClientException("subscription exception", e);
        }
    }
```