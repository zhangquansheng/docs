---
sidebarDepth: 3
---


# kafka

## 简介

::: tip 特别提示
这里根据几张图，来重点记忆kafka，非常详细的介绍，请参考[官方文档](http://kafka.apache.org/intro)
:::


### 术语

- **Broker** : kafka 集群包含一个或多个服务器，这种服务器被称为 broker
- **Topic** : 每条发布到 kafka 集群的消息都有一个类别，这个类别被称为 Topic。（物理上不同 Topic 的消息分开存储，逻辑上一个 Topic 的消息虽然保存于一个或多个 broker 上但用户只需指定消息的 Topic 即可生产或消费数据而不必关心数据存于何处）
- **Partition** : 是物理上的概念，每个 Topic 包含一个或多个 Partition.
- **Producer** : 负责发布消息到 kafka broker
- **Consumer** : 消息消费者，向 kafka broker 读取消息的客户端。
- **Consumer Group** : 每个 Consumer 属于一个特定的 Consumer Group（可为每个 Consumer 指定 group name，若不指定 group name 则属于默认的 group）

### kafka 拓扑结构

![topic](/img/kafka/kafka.png)


如上图所示，一个典型的 kafka 集群中包含若干 Producer（可以是 web 前端产生的 Page View，或者是服务器日志，系统 CPU、Memory 等），若干 broker（kafka 支持水平扩展，一般 broker 数量越多，集群吞吐率越高），若干 Consumer Group，以及一个 Zookeeper 集群。kafka 通过 Zookeeper 管理集群配置，选举 leader，以及在 Consumer Group 发生变化时进行 rebalance。Producer 使用 push 模式将消息发布到 broker，Consumer 使用 pull 模式从 broker 订阅并消费消息。

### topic 结构

![topic](/img/kafka/log_anatomy.png)

### 日志消费

![topic](/img/kafka/log_consumer.png)

### Consumer Group

![topic](/img/kafka/log_consumer.png)

## 参考地址

[kafka 官方文档](http://kafka.apache.org/intro)
[kafka 设计解析（一）：kafka 背景及架构介绍](https://www.infoq.cn/article/kafka-analysis-part-1)