# ZAB的体系结构-ZooKeeper原子广播协议

`ZAB`协议的全称是 `Zookeeper Atomic Broadcast` （`Zookeeper`原子广播）。`Zookeeper` 是通过`ZAB`协议来保证分布式系统数据最终一致性。

## 定义

- `leader`和`follower(s)` -- 在ZooKeeper集群中，一个节点是`leader`角色，其余的是`follower(s)`角色。`leader`负责接收所有来自客户端的状态变更（**写请求**），
并将这些变更复制到`leader`或者`follower(s)`上。**读请求**在所有`follower(s)`和`leader`之间进行负载均衡；
- `transactions` -- 事务，即Client状态变更, 它(们)会由leader传播到它的`follower(s)`；
- `e` -- leader的epoch。epoch是由普通节点变为leader时，生成的一个整数。它应该大于任何先前leader的epoch；
- `c` -- 一个由leader生成的序数，从0开始，向上增加。它和epoch一起被用作对不断到来的Client(s)状态改变/事务进行排序；
- `F.history` -- `follower`的`history`队列。用于确保到达事务，按照它们到达的先后顺序被提交；
- `outstanding transactions` -- `F.history`中序号小于当前COMMIT序号的事务集合。

## ZAB要求
1. 复制保证
    - 可靠递送 -- 如果一个事务M被一个服务器提交，它最后也会被所有服务器提交。
    - 绝对顺序 -- 如果一个服务器提交的事务A先于事务B, 那么对于所有服务器，A都将先于B被提交。
    - 因果顺序 -- 如果事务B发送的时间，是在B的发送者提交事务A之后，A必须是排在B之前。如果在发送B之后，某个发送者发出C ，那么C必须排在B之后。
2. 只要过半的节点是正常的，事务就会被复制。
3. 在事务复制期间，因down机错过的失败节点，恢复运行时应能再次获得。

## ZAB 实现

客户端可以从任何ZooKeeper节点发起**读操作**，对任何ZooKeeper节点执行**写操作**，状态变更会被先转发到leader节点。

ZooKeeper使用一种`二阶段提交协议`的变体，复制事务到`follower(s)`。当`leader`接收到来自某个客户端的状态更新时，它用序数`c`(32位)和leader epoch `e`(32位)生成一个事务(`Zxid`)，并将其发送给所有`follower(s)`。

`follower`接收后，会将`transactions`添加到它的`F.history`队列中，并向`leader`回送`ACK`。