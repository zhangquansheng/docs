# ZooKeeper

## 简介

ZooKeeper is a centralized service for maintaining configuration information, naming, providing distributed synchronization, and providing group services.

它是一个针对大型分布式系统的可靠协调系统，提供的功能包括：配置维护、名字服务、分布式同步、组服务等

我个人觉得在使用`ZooKeeper`的时候，最好是使用 集群版的`ZooKeeper`而不是单机版的。官网给出的架构图就描述的是一个集群版的`ZooKeeper`。通常 3 台服务器就可以构成一个`ZooKeeper`集群了。

::: tip 为什么最好使用奇数台服务器构成 ZooKeeper 集群？
所谓的zookeeper容错是指，当宕掉几个`ZooKeeper`服务器之后，剩下的个数必须大于宕掉的个数的话整个`ZooKeeper`才依然可用。假如我们的集群中有n台`ZooKeeper`服务器，那么也就是剩下的服务数必须大于n/2。先说一下结论，2n和2n-1的容忍度是一样的，都是n-1，大家可以先自己仔细想一想，这应该是一个很简单的数学问题了。
比如假如我们有3台，那么最大允许宕掉1台`ZooKeeper`服务器，如果我们有4台的的时候也同样只允许宕掉1台。 假如我们有5台，那么最大允许宕掉2台`ZooKeeper`服务器，如果我们有6台的的时候也同样只允许宕掉2台。
::: 

## 语义保证

Zookeeper 简单高效，同时提供如下语义保证，从而使得我们可以利用这些特性提供复杂的服务。

- **顺序性**　客户端发起的更新会按发送顺序被应用到 Zookeeper 上
- **原子性** 更新操作要么成功要么失败，不会出现中间状态
- **单一系统镜像**　一个客户端无论连接到哪一个服务器都能看到完全一样的系统镜像（即完全一样的树形结构）。注：根据上文《Zookeeper架构及FastLeaderElection机制》介绍的`ZAB`协议，写操作并不保证更新被所有的`Follower`立即确认，因此通过部分`Follower`读取数据并不能保证读到最新的数据，而部分 Follwer 及 Leader 可读到最新数据。如果一定要保证单一系统镜像，可在读操作前使用`sync`方法。
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

`Zookeeper`定义了如下5种`permission`:
- **CREATE(c)**: 创建权限，可以在在当前`node`下创建`child node`
- **DELETE(d)**: 删除权限，可以删除当前的`node`
- **READ(r)**: 读权限，可以获取当前`node`的数据，可以`list`当前`node`所有的`child nodes`
- **WRITE(w)**: 写权限，可以向当前`node`写数据
- **ADMIN(a)**: 管理权限，可以设置当前`node`的`permission`

## 领导选举算法

`FastLeaderElection`选举算法是标准的`Fast Paxos`算法实现，可解决`LeaderElection`选举算法收敛速度慢的问题。

## 重要概念总结

- `ZooKeeper` 本身就是一个分布式程序（只要半数以上节点存活，ZooKeeper 就能正常服务）。
- `ZooKeeper` 将数据保存在内存中，这也就保证了 **高吞吐量和低延迟**（但是内存限制了能够存储的容量不太大，此限制也是保持znode中存储的数据量较小的进一步原因）。
- `ZooKeeper` 是高性能的。 在“读”多于“写”的应用程序中尤其地高性能，因为“写”会导致所有的服务器间同步状态。（“读”多于“写”是协调服务的典型场景。）
- `ZooKeeper` 底层其实只提供了两个功能：①管理（存储、读取）用户程序提交的数据；②为用户程序提供数据节点监听服务。

