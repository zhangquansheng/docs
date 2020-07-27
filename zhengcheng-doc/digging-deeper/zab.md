# ZAB的体系结构-ZooKeeper原子广播协议

`ZAB`协议的全称是 `Zookeeper Atomic Broadcast` （`Zookeeper`原子广播）。`Zookeeper` 是通过`ZAB`协议来保证分布式系统数据最终一致性。

## 定义

- `leader`和`followers` -- 在ZooKeeper集群中，一个节点是`leader`角色，其余的是`followers`角色。`leader`负责接收所有来自客户端的状态变更（**写请求**），
并将这些变更复制到`leader`或者`followers`上。**读请求**在所有followers和leader之间进行负载均衡；
- `transactions` -- 事务，即Client状态变更, 它(们)会由leader传播到它的follower(s)；
- `e` -- leader的epoch。epoch是由普通节点变为leader时，生成的一个整数。它应该大于任何先前leader的epoch；
- `c` -- 一个由leader生成的序数，从0开始，向上增加。它和epoch一起被用作对不断到来的Client(s)状态改变/事务进行排序；
- `F.history` -- `follower`的`history`队列。用于确保到达事务，按照它们到达的先后顺序被提交；
- `outstanding transactions` -- `F.history`中序号小于当前COMMIT序号的事务集合。

