# 分布式事务概述 & TCC 分布式事务实战 :hammer:

分布式事务是指事务的参与者、支持事务的服务器、资源服务器以及事务管理器分别位于不同的分布式系统的不同节点之上。

本质上来说，分布式事务就是为了保证不同数据库的数据一致性。

## 理论知识

### CAP 原则 

CAP原则指的是在一个分布式系统中，一致性(Consistency)、可用性(Availability)、分区容错性(Partition tolerance)，这三个属性最多只能同时实现两点，不可能三者兼顾。

![cap](/img/digging-deeper/cap.webp)

- 一致性(Consistency)：所有的数据备份在同一时刻具有同样的值；
- 可用性(Availability)：保证无论请求成功或失败，系统都会给出响应；
- 分区容错性(Partition tolerance)：指的是系统任意信息的丢失都不会影响系统的继续运行，或任意节点的丢失，都不影响其他节点的继续运行。

- AP
  - Nacos 
  - Eureka : Eureka保证每个服务节点的独立性，保证某个服务节点的连接失败或者某个接点挂掉其他节点不受影响。但是Eureka的缺陷就是无法保证数据的一致性，也就是说，某个节点获取的注册服务列表，可能不是最新的数据。
- CP
  - Zookeeper : CP设计，保证了一致性，集群搭建的时候，某个节点失效，则会进行选举行的leader，或者半数以上节点不可用，则无法提供服务，因此可用性没法满足
  - Consul

### BASE

理论的核心思想就是：我们无法做到强一致，但每个应用都可以根据自身的业务特点，采用适当的方式来使系统达到**最终一致性**。

- **Basically Available（基本可用）**：允许损失部分可用性，保证核心可用
- **Soft-state（ 软状态/柔性事务）**：允许系统在不同节点间副本同步的时候存在延时
- **Eventual Consistency（最终一致性）**：系统中的所有数据副本经过一定时间后，最终能够达到一致的状态，不需要实时保证系统数据的强一致性。

## XA 协议

`XA`协议是由`X/Open`组织提出的分布式事务处理规范，主要定义了事务管理器`TM`和局部资源管理器`RM`之间的接口。目前主流的数据库，比如`oracle`、`DB2` 都是支持`XA`协议的。

## 2PC(两段提交)

## 3PC(三段提交)

与两阶段提交不同的是，三阶段提交有两个改动点。

- 1、 引入超时机制。同时在协调者和参与者中都引入超时机制。
- 2、 在第一阶段和第二阶段中插入一个准备阶段。保证了在最后提交阶段之前各参与节点的状态是一致的。

无论是二阶段提交还是三阶段提交都无法彻底解决分布式的一致性问题。`Google Chubby`的作者`Mike Burrows`说过， 
`there is only one consensus protocol, and that’s Paxos” – all other approaches are just broken versions of Paxos`. 
意即世上只有一种一致性算法，那就是`Paxos`算法。


## TCC(补偿事务)

**两阶段事务**


**参考文档**
- [seata](https://github.com/seata/seata)
- [tcc-transaction是TCC型事务java实现](https://github.com/changmingxie/tcc-transaction)
- [hmily](https://github.com/dromara/hmily)
