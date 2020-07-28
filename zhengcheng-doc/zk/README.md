# ZooKeeper

ZooKeeper is a centralized service for maintaining configuration information, naming, providing distributed synchronization, and providing group services.

它是一个针对大型分布式系统的可靠协调系统，提供的功能包括：配置维护、名字服务、分布式同步、组服务等


## 语义保证

Zookeeper 简单高效，同时提供如下语义保证，从而使得我们可以利用这些特性提供复杂的服务。

- **顺序性**　客户端发起的更新会按发送顺序被应用到 Zookeeper 上
- **原子性** 更新操作要么成功要么失败，不会出现中间状态
- **可靠性**　一个更新操作一旦被接受即不会意外丢失，除非被其它更新操作覆盖
- **最终一致性**　写操作最终（而非立即）会对客户端可见

## Watch机制

`Watch`（事件监听器），是`Zookeeper`中的一个很重要的特性。`Zookeeper`允许用户在指定节点上注册一些`Watch`，并且在一些特定事件触发的时候，`ZooKeeper`服务端会将事件通知到感兴趣的客户端上去，**该机制是Zookeeper实现分布式协调服务的重要特性**。

Watch 有如下特点

- **主动推送**　`Watch`被触发时，由`Zookeeper`服务器主动将更新推送给客户端，而不需要客户端轮询。
- **一次性**　数据变化时，Watch 只会被触发一次。如果客户端想得到后续更新的通知，必须要在`Watch`被触发后重新注册一个`Watch`。
- **可见性**　如果一个客户端在读请求中附带`Watch`，`Watch`被触发的同时再次读取数据，客户端在得到`Watch`消息之前肯定不可能看到更新后的数据。换句话说，更新通知先于更新结果。
- **顺序性**　如果多个更新触发了多个`Watch`，那`Watch`被触发的顺序与更新顺序一致。

## ACL

在`Zookeeper`中，`node`的`ACL`是没有继承关系的，是独立控制的。

`Zookeeper`定义了如下5种权限:
- **CREATE(c)**: 创建权限，可以在在当前node下创建child node
- **DELETE(d)**: 删除权限，可以删除当前的node
- **READ(r)**: 读权限，可以获取当前node的数据，可以list当前node所有的child nodes
- **WRITE(w)**: 写权限，可以向当前node写数据
- **ADMIN(a)**: 管理权限，可以设置当前node的permission

## 领导选举算法

`FastLeaderElection`选举算法是标准的`Fast Paxos`算法实现，可解决`LeaderElection`选举算法收敛速度慢的问题。

