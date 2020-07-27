---
sidebarDepth: 3
---


# kafka

## 简介

::: tip 特别提示
本文基于 `kafka 2.5.0` 介绍实际开发中常用的一些概念，非常详细的介绍，请参考[官方文档](http://kafka.apache.org/intro)
:::


### 术语

- **Broker** : kafka 集群包含一个或多个服务器，这种服务器被称为 broker
- **Topic** : 每条发布到 kafka 集群的消息都有一个类别，这个类别被称为 **Topic**（物理上不同 **Topic** 的消息分开存储，逻辑上一个 **Topic** 的消息虽然保存于一个或多个 **broker** 上，但用户只需指定消息的 **Topic** 即可生产或消费数据，不必关心数据存于何处）
- **Partition** : 是物理上的概念，每个 Topic 包含一个或多个 Partition.
- **Producer** : 负责发布消息到 kafka broker
- **Consumer** : 消息消费者，向 kafka broker 读取消息的客户端。
- **Consumer Group** : 每个 Consumer 属于一个特定的 **Consumer Group**（可为每个 Consumer 指定 group name，若不指定 group name 则属于默认的 group）

::: tip Kafka的记录（消息）
每条记录都包含 一个 key, 一个 value, 一个 timestamp.
:::

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

::: tip (阿里云)Topic的取值：
- 只能包含字母、数字、下划线（_）和短划线（-）
- 长度限制为3~64字符
- Topic名称一旦创建，将无法修改
:::

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

如果所有的 Consumer 实例拥有相同的**Consumer Group**，那么记录会均衡的分配到 Consumer 实例中。

如果所有的 Consumer 实例拥有不同的**Consumer Group**，那么每天记录都会广播到所有的 Consumer进程中。

![topic](/img/kafka/consumer-groups.png)

如上图所示：一个Kafka集群拥有两台服务器、4个**Partition(P0-P3)**、2个**Consumer Group**，**Consumer Group A**有2个消费实例，**Consumer Group A**有4个消费实例，

::: tip 总结
同一 **Topic** 的一条消息只能被同一个 **Consumer Group** 内的一个 Consumer 消费，但多个 **Consumer Group** 可同时消费这一消息。
:::


在Kafka中，Consumer Rebalance 算法如下：
```html
1. 将目标 topic 下的所有 partition 排序，存于PT
2. 对某 **Consumer Group** 下所有 Consumer 排序，存于 CG，第 i 个consumer 记为 Ci
3. N = size(PT)/size(CG)，向上取整
4. 解除 Ci 对原来分配的 partition 的消费权（i从0开始）
5. 将第 i*N 到 (i+1)*N-1 个 partition 分配给 Ci
```

Consumer rebalance 的控制策略是由每一个 Consumer 通过 Zookeeper 完成的。具体的控制方式如下：
```html
1. 在 /consumers/[consumer-group]/ 下注册id
2. 设置对 /consumers/[consumer-group] 的watcher
3. 设置对 /brokers/ids 的watcher
4. zk 下设置 watcher 的路径节点更改，触发 Consumer rebalance
```
　
::: tip 羊群效应理论
任何broker或者consumer的增减都会触发所有的consumer的rebalance
::: 


Kafka 仅仅提供 一个**Partition** 内的记录顺序，而不能提供在同一 **Topic**下不同 **Partition**的顺序。当你需要同一 **Topic**的记录是顺序的，则可以使用一个**Partition**的**Topic**来实现：
- 发送消息到只有一个**Partition**的**Topic**
- 发送消息指定**Partition**
- 发送消息的**KEY相同**（消息KEY相同，那么消息提交的到**Partition**是相同的）

## 应用场景

### 异步解耦

构建应用系统和分析系统的桥梁，并将它们之间的关联解耦，通过上、下游业务系统的松耦合设计，即便下游子系统（如物流、积分等）出现不可用甚至宕机，都不会影响到核心交易系统的正常运转；


### 高可扩展性

具有高可扩展性，即当数据量增加时可通过增加节点快速水平扩展。

### 削峰填谷
    
MQ 超高性能的消息处理能力可以承接流量脉冲而不被击垮，在确保系统可用性同时，因快速有效的请求响应而提升用户的体验；

确保下游业务在安全水位内平滑稳定的运行，避免超高流量的冲击；

通过削弱填谷可控制下游业务系统的集群规模，从而降低投入成本；

### 顺序消息

在大多使用场景下，数据处理的顺序都很重要。大部分消息队列本来就是排序的，并且能保证数据会按照特定的顺序来处理。Kafka 保证一个 Partition 内的消息的有序性。

## HA机制

## 性能

[对Apache Kafka进行基准测试：每秒200万次写入（在三台便宜的机器上）](https://engineering.linkedin.com/kafka/benchmarking-apache-kafka-2-million-writes-second-three-cheap-machines)

