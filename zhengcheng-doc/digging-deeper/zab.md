# ZAB的体系结构-ZooKeeper原子广播协议

`ZAB`协议的全称是 `Zookeeper Atomic Broadcast` （`Zookeeper`原子广播）。`Zookeeper` 是通过`ZAB`协议来保证分布式系统数据最终一致性。

## 定义

- `leader`和`followers`:  在ZooKeeper集群中，一个节点是`leader`角色，其余的是`followers`角色。`leader`负责接收所有来自客户端的状态变更（**写请求**），
并将这些变更复制到`leader`或者`followers`上。**读请求**在所有followers和leader之间进行负载均衡。
- 事务: `leader`传播给其`followers`的客户状态更改。
- `F.history` : 
- `outstanding transactions` : 

## `ZAB`协议如何保证数据一致性

