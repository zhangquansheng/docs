---
sidebarDepth: 3
---


# Kafka

## 简介

::: tip 特别提示
本文基于 kafka 2.5.0 介绍实际开发中常用的一些概念，非常详细的介绍，请参考[官方文档](http://kafka.apache.org/intro)
:::


### 术语

- **Broker** : kafka 集群包含一个或多个服务器，这种服务器被称为 broker
- **Topic** : 每条发布到 kafka 集群的消息都有一个类别，这个类别被称为 **Topic**（物理上不同 **Topic** 的消息分开存储，逻辑上一个 **Topic** 的消息虽然保存于一个或多个 **broker** 上，但用户只需指定消息的 **Topic** 即可生产或消费数据，不必关心数据存于何处）
- **Partition** : 是物理上的概念，每个 Topic 包含一个或多个 Partition.
- **Producer** : 负责发布消息到 kafka broker
- **Consumer** : 消息消费者，向 kafka broker 读取消息的客户端。
- **Consumer Group** : 每个 Consumer 属于一个特定的 **Consumer Group**（可为每个 Consumer 指定 group name，若不指定 group name 则属于默认的 group）

### kafka 拓扑结构

![topic](/img/kafka/kafka.png)


如上图所示，一个典型的 kafka 集群中包含：
- 若干 Producer（可以是 web 前端产生的 Page View，或者是服务器日志，系统 CPU、Memory 等）
- 若干 broker（kafka 支持水平扩展，一般 broker 数量越多，集群吞吐率越高）
- 若干 Consumer Group
- 一个 Zookeeper 集群

kafka 通过 Zookeeper 管理集群配置，选举 leader，以及在 Consumer Group 发生变化时进行 rebalance。

Producer 使用 push 模式将消息发布到 broker，Consumer 使用 pull 模式从 broker 订阅并消费消息。

### Topics and Logs

kafka 中的 Topic 始终是多用户的；也就是说，一个主题可以有零个，一个或多个消费者来订阅或写入该 Topic 的数据。

对于每个 Topic ，Kafka集群 都会维护一个分区日志，如下所示：

![topic](/img/kafka/log_anatomy.png)

每个 Partition 都是有序的, 不变的记录队列， 新提交的记录顺序追加到这个队列中。 每个 Partition 中的记录都会分配一个 offset (偏移量) 的顺序 ID ，该 ID 唯一地标识 Partition 中的每个记录。

Kafka集群根据配置持久保存所有已发布的记录（无论是否已使用它们）。例如：如果保留策略设置为两天，则在发布记录后的两天内，该记录都可被使用，之后将被丢弃以释放空间。**Kafka的性能相对于数据大小实际上是不变的，因此长时间存储数据不是问题。**

![topic](/img/kafka/log_consumer.png)

实际上，基于每个 Consumer 保留的唯一元数据是该 Consumer 在记录中的 offset(偏移量或位置)。此 offset 由使用者控制：通常使用者在读取记录时会顺序的移动其 offset，但实际上，由于位置是有使用者控制的，因此它可以按喜欢的任何顺序使用记录。例如，使用者重置到较早的 offset 重新处理过去的数据，或者跳到最近的记录并从“现在”开始使用。


::: tip Kafka中的Topic为什么要进行分区?

> 为了性能考虑，方便水平扩展

Kafka 中的**Topic**是逻辑概念，而**Partition**是物理概念，对用户是透明的。用户只需指定消息的**Topic**即可生产或消费数据，不必关心数据存于何处。

如果**Topic**内的消息只能存在一个**Broker**,那么**Broker**就会成为瓶颈，无法做到水平扩展。所以把**Topic**内的消息分布到集群就是并且引入**Partition**就是为了解决水平扩展问题的。

从上我们知道每个 Partition 都是有序的, 不变的记录队列，新提交的记录顺序追加到这个队列中。在物理上，每个 Partition 对应一个文件夹。一个**Broker**上可以存放多个**Partition**。
这样 Producer 可以将数据发送给多个**Broker**上的多个**Partition**，**Consumer**也可以**并行**从多个**Broker**上的不同**Partition**上读数据，实现了水平扩展。

:::

### Producers

Producer 将数据发布到指定的主题。你可以简单地为负载均衡而采取循环方式完成此操作，也可以根据某些规则（例如基于记录的KEY）来完成此操作。

### Consumers

**Consumer**使用group name 标记自己, 并且发布到**Topic**的每条记录都会传递到每个订阅**Consumer Group**中的一个 Consumer 实例。

If all the consumer instances have the same consumer group, then the records will effectively be load balanced over the consumer instances.

If all the consumer instances have different consumer groups, then each record will be broadcast to all the consumer processes.

![topic](/img/kafka/log_consumer.png)

A two server Kafka cluster hosting four partitions (P0-P3) with two consumer groups. Consumer group A has two consumer instances and group B has four.

More commonly, however, we have found that topics have a small number of consumer groups, one for each "logical subscriber". Each group is composed of many consumer instances for scalability and fault tolerance. This is nothing more than publish-subscribe semantics where the subscriber is a cluster of consumers instead of a single process.

The way consumption is implemented in Kafka is by dividing up the partitions in the log over the consumer instances so that each instance is the exclusive consumer of a "fair share" of partitions at any point in time. This process of maintaining membership in the group is handled by the Kafka protocol dynamically. If new instances join the group they will take over some partitions from other members of the group; if an instance dies, its partitions will be distributed to the remaining instances.

Kafka only provides a total order over records within a partition, not between different partitions in a topic. Per-partition ordering combined with the ability to partition data by key is sufficient for most applications. However, if you require a total order over records this can be achieved with a topic that has only one partition, though this will mean only one consumer process per consumer group.


## 参考地址

[kafka 官方文档](http://kafka.apache.org/intro)
[kafka 设计解析（一）：kafka 背景及架构介绍](https://www.infoq.cn/article/kafka-analysis-part-1)