# TCC 分布式事务

## XA 协议

`XA`协议是由`X/Open`组织提出的分布式事务处理规范，主要定义了事务管理器`TM`和局部资源管理器`RM`之间的接口。目前主流的数据库，比如`oracle`、`DB2` 都是支持`XA`协议的。

## 分布式事务解决方案

### 2PC(两段提交)

### 3PC(三段提交)

与两阶段提交不同的是，三阶段提交有两个改动点。

1、 引入超时机制。同时在协调者和参与者中都引入超时机制。
2、 在第一阶段和第二阶段中插入一个准备阶段。保证了在最后提交阶段之前各参与节点的状态是一致的。

无论是二阶段提交还是三阶段提交都无法彻底解决分布式的一致性问题。`Google Chubby`的作者`Mike Burrows`说过， 
`there is only one consensus protocol, and that’s Paxos” – all other approaches are just broken versions of Paxos`. 
意即世上只有一种一致性算法，那就是`Paxos`算法。

### TCC(补偿事务)

### SAGA

**参考文档**
- [seata](https://github.com/seata/seata)
- [tcc-transaction是TCC型事务java实现](https://github.com/changmingxie/tcc-transaction)
- [hmily](https://github.com/dromara/hmily)