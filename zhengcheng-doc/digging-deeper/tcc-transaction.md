# TCC 分布式事务

## XA 协议

`XA`协议是由`X/Open`组织提出的分布式事务处理规范，主要定义了事务管理器`TM`和局部资源管理器`RM`之间的接口。目前主流的数据库，比如`oracle`、`DB2` 都是支持`XA`协议的。

## 分布式事务解决方案

## 2PC(两段提交)

## 3PC(三段提交)

## TCC(补偿事务)

**参考文档**
- [SEATA]
- [tcc-transaction是TCC型事务java实现](https://github.com/changmingxie/tcc-transaction)
- [hmily](https://github.com/dromara/hmily)