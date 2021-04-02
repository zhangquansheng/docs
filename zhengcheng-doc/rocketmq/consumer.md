---
sidebarDepth: 3
---

# RocketMQ 消息消费

重点剖析消息消费的过程中需要解决以下问题：
- 消息队列负载与重新分布
- 消息消费模式
- 消息拉取方式
- 消息进度反馈
- 消息过滤
- 顺序消息

## RocketMQ 消息消费概述

消息消费以组的模式开展，消费者组之间有集群模式与广播方式，消费者服务器与消费者之间的消息传送也有两种方式：`PUSH`（推模式），`PULL`(（拉模式）。

`RocketMQ`支持局部顺序消息，也就是保证同一个消息队列上的消息顺序消费。不支持消息全局消费，如果要实现某一个主题的全局顺序消息消费，可以将该主题的队列数量设置为`1`，牺牲高可用性。

`RocketMQ`支持两种消息过滤模式：表达式（`Tag`、`SQL92`）和类过滤模式。

涉及到的概念如下所述：
- **消费者组（Consumer Group）**：同一类`Consumer`的集合，这类`Consumer`通常消费同一类消息且消费逻辑一致。消费者组使得在消息消费方面，实现负载均衡和容错的目标变得非常容易。要注意的是，消费者组的消费者实例必须订阅完全相同的`Topic`。`RocketMQ`支持两种消息模式：集群消费（`Clustering`）和广播消费（`Broadcasting`）。
- **拉取式消费（Pull Consumer）**：`Consumer`消费的一种类型，应用通常主动调用`Consumer`的拉消息方法从`Broker`服务器拉消息、主动权由应用控制。一旦获取了批量消息，应用就会启动消费过程。
- **推动式消费（Push Consumer）**：`Consumer`消费的一种类型，该模式下`Broker`收到数据后会主动推送给消费端，该消费模式一般实时性较高。
- **集群消费（Clustering）**：集群消费模式下,相同`Consumer Group`的每个`Consumer`实例平均分摊消息。
- **广播消费（Broadcasting）**：广播消费模式下，相同`Consumer Group`的每个`Consumer`实例都接收全量的消息。
- **普通顺序消息（Normal Ordered Message）**：普通顺序消费模式下，消费者通过同一个消费队列收到的消息是有顺序的，不同消息队列收到的消息则可能是无顺序的。
- **严格顺序消息（Strictly Ordered Message）**：严格顺序消息模式下，消费者收到的所有消息均是有顺序的。
- **消息（Message）**：消息系统所传输信息的物理载体，生产和消费数据的最小单位，每条消息必须属于一个主题。`RocketMQ`中每个消息拥有唯一的`Message ID`，且可以携带具有业务标识的Key。系统提供了通过`Message ID`和`Key`查询消息的功能。
- **标签（Tag）**：为消息设置的标志，用于同一主题下区分不同类型的消息。来自同一业务单元的消息，可以根据不同业务目的在同一主题下设置不同标签。标签能够有效地保持代码的清晰度和连贯性，并优化`RocketMQ`提供的查询系统。消费者可以根据`Tag`实现对不同子主题的不同消费逻辑，实现更好的扩展性。


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

## 消息拉取

本节将基于`PUSH`模式来详细分析消息拉取机制。从`MQClientInstance`的启动流程可以看出，`RocketMQ`使用一个单独的线程`PullMessageService`来负责消息的拉取。

### PullMessageService 实现机制

`PullMessageService`继承的是`ServiceThread`（服务线程），通过`run()`方法启动，具体代码如下：
```java
    public void run() {
        log.info(this.getServiceName() + " service started");

        while (!this.isStopped()) {
            try {
                PullRequest pullRequest = this.pullRequestQueue.take();
                this.pullMessage(pullRequest);
            } catch (InterruptedException ignored) {
            } catch (Exception e) {
                log.error("Pull Message Service Run Method exception", e);
            }
        }

        log.info(this.getServiceName() + " service end");
    }
```

核心要点如下：
- `while (!this.isStopped())` 这是一种通用的设计技巧，`stopped`声明为`volatile`，每次执行一次业务逻辑检测一下其运行状态，可以通过其他的线程将`stopped`设置为`true`从而停止该线程。
- 从`pullRequestQueue`（`LinkedBlockingQueue` 无界阻塞队列）中获取一个`PullRequest`消息拉取任务，如果`pullRequestQueue`为空，则线程阻塞，直到有拉取任务被放入。
- 调用`pullMessage`方法进行消息拉取

来介绍一下`PullRequest`的核心属性：
```java
public class PullRequest {
    private String consumerGroup;
    private MessageQueue messageQueue;
    private ProcessQueue processQueue;
    private long nextOffset;
    private boolean lockedFirst = false;
}
```
1. consumerGroup : 消费者组。
2. messageQueue ： 待拉取得消费队列。
3. processQueue : 消息处理队列，从`Broker`拉取到的消息先存入`ProcessQueue`，然后在提交到消费者消费线程池消费。
4. nextOffset : 待拉取得`MessageQueue`偏移量。
5. lockedFirst : 是否被锁定。

```java
private void pullMessage(final PullRequest pullRequest) {
    final MQConsumerInner consumer = this.mQClientFactory.selectConsumer(pullRequest.getConsumerGroup());
    if (consumer != null) {
        DefaultMQPushConsumerImpl impl = (DefaultMQPushConsumerImpl) consumer;
        impl.pullMessage(pullRequest);
    } else {
        log.warn("No matched consumer for the PullRequest {}, drop it", pullRequest);
    }
}
```
从`pullMessage`方法可以看到，是根据消费者组名从`MQClientInstance`中获取消费者内部实现类`MQConsumerInner`，这里直接强制转换成为`DefaultMQPushConsumerImpl`，也就是`PullMessageService`，该线程只为`PUSH`模式服务。
（`PULL`模式如何拉取消息呢？`PULL`模式下，`RocketMQ`只需要提供拉取消息`API`即可，具体有应用程序显示调用拉取`API`。）

### ProcessQueue 实现机制

`PullRequest.ProcessQueue` 是 `PullRequest.MessageQueue`在消费端的重现、快照。`PullMessageService`从消息服务器**默认每次拉取32条消息**，按照消息的队列偏移量顺序存放在`PullRequest.ProcessQueue`中，
`PullMessageService`然后将消息提交到消费者消费线程池，消息成功消费后从`PullRequest.ProcessQueue`中移除。`PullRequest.ProcessQueue`的类图如下：
![ProcessQueue](/img/rocketmq/ProcessQueue.png)

::: tip 提示
ProcessQueue 的核心属性、方法可自己去看源码熟悉。
:::

## 消息拉取基本流程

本节以并发消息消费来探讨整个消息消费流程，顺序消息的实现原理不在此范围。

消息拉取分为3个主要步骤：
- 消息客户端分装拉取消息请求
- 消费服务器查找并返回消息
- 消息客户端处理返回的消息

## 订阅关系一致

订阅关系一致指的是同一个消费者Group ID下所有Consumer实例所订阅的Topic、Group ID、Tag必须完全一致。一旦订阅关系不一致，消息消费的逻辑就会混乱，甚至导致消息丢失。

[本文提供订阅关系一致的正确示例代码以及订阅关系不一致的错误示例代码，帮助您顺畅地订阅消息。](https://help.aliyun.com/document_detail/43523.html?spm=a2c4g.11186623.6.626.532f4fe1WoEYbq)



