# RocketMQ 消息消费

## 消费者启动流程

消息消费者是如何启动的？来分析下`com.aliyun.openservices.shade.com.alibaba.rocketmq.client.impl.consumer.DefaultMQPushConsumerImpl.java`的`start`方法。

- 第一步：构建主题订阅信息`SubscriptionData`并加入到`RebalanceImpl`的订阅消息中，订阅关系来源主要有两个：
    - 通过调用`this.defaultMQPushConsumer.getConsumerGroup(),topic, subString)`
    - 订阅重试主题消息（仅在`CLUSTERING`集群模式下）。从这里可以看出，`RocketMQ`消息重试是以消费组为单位，而不是主题，消息重试主题名`"%RETRY%"`+消费者组名。消费者在启动的时候会自动订阅该主题，参与该主题的消息队列负载。

具体代码如下：
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

- 第二步：初始化`MQClientInstance`、`RebalanceImpl`（消息重新负载实现类）等。具体代码如下：
```java
if (this.defaultMQPushConsumer.getMessageModel() == MessageModel.CLUSTERING) {
    this.defaultMQPushConsumer.changeInstanceNameToPID();
}

this.mQClientFactory = MQClientManager.getInstance().getOrCreateMQClientInstance(this.defaultMQPushConsumer, this.rpcHook);

this.rebalanceImpl.setConsumerGroup(this.defaultMQPushConsumer.getConsumerGroup());
this.rebalanceImpl.setMessageModel(this.defaultMQPushConsumer.getMessageModel());
this.rebalanceImpl.setAllocateMessageQueueStrategy(this.defaultMQPushConsumer.getAllocateMessageQueueStrategy());
this.rebalanceImpl.setmQClientFactory(this.mQClientFactory);

this.pullAPIWrapper = new PullAPIWrapper(
    mQClientFactory,
    this.defaultMQPushConsumer.getConsumerGroup(), isUnitMode());
this.pullAPIWrapper.registerFilterMessageHook(filterMessageHookList);
```

- 第三步：初始化消息进度。如果消息消费是`CLUSTERING`集群模式，那么消息进度（`offsetStore`）保存在Broker上；如果是`BROADCASTING`广播模式，那么消息消费进度存储在消费端。具体代码如下：
```java
if (this.defaultMQPushConsumer.getOffsetStore() != null) {
    this.offsetStore = this.defaultMQPushConsumer.getOffsetStore();
} else {
    switch (this.defaultMQPushConsumer.getMessageModel()) {
        case BROADCASTING:
            this.offsetStore = new LocalFileOffsetStore(this.mQClientFactory, this.defaultMQPushConsumer.getConsumerGroup());
            break;
        case CLUSTERING:
            this.offsetStore = new RemoteBrokerOffsetStore(this.mQClientFactory, this.defaultMQPushConsumer.getConsumerGroup());
            break;
        default:
            break;
    }
    this.defaultMQPushConsumer.setOffsetStore(this.offsetStore);
}
this.offsetStore.load();
```

- 第四步：根据是否是顺序消费，创建消费端消费线程服务。`ConsumeMessageService`主要负责消息消费，内部维护一个线程池。具体代码如下：
```java
if (this.getMessageListenerInner() instanceof MessageListenerOrderly) {
    this.consumeOrderly = true;
    this.consumeMessageService =
        new ConsumeMessageOrderlyService(this, (MessageListenerOrderly) this.getMessageListenerInner());
} else if (this.getMessageListenerInner() instanceof MessageListenerConcurrently) {
    this.consumeOrderly = false;
    this.consumeMessageService =
        new ConsumeMessageConcurrentlyService(this, (MessageListenerConcurrently) this.getMessageListenerInner());
}

this.consumeMessageService.start();
```

- 第五步：向`MQClientInstance`注册消费者，并启动`MQClientInstance`，在一个 JVM 中的所有消费者、生产者持有同一个`MQClientInstance`、且`MQClientInstance`只会启动一次。具体代码如下：
```java
boolean registerOK = mQClientFactory.registerConsumer(this.defaultMQPushConsumer.getConsumerGroup(), this);
if (!registerOK) {
    this.serviceState = ServiceState.CREATE_JUST;
    this.consumeMessageService.shutdown(defaultMQPushConsumer.getAwaitTerminationMillisWhenShutdown());
    throw new MQClientException("The consumer group[" + this.defaultMQPushConsumer.getConsumerGroup()
        + "] has been created before, specify another name please." + FAQUrl.suggestTodo(FAQUrl.GROUP_NAME_DUPLICATE_URL),
        null);
}

mQClientFactory.start();
```
