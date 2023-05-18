# SpringBoot 事务提交之后的操作保证

## 业务场景

在一个事务操作中，当数据入库之后，继续做其他异步或同步操作，如消息通知、远程接口调用等。

这样会存在几个问题：

1. 事务原子性不能保证：如果出现事务回滚，则数据入库失败，然而异步操作却不能回滚，继续执行，这就会出现与业务预期不一致的结果（如数据入库失败，但是消息通知则照常触发）；
2. 数据正确性无法保证：如果异步操作需要**反查数据库上一步入库的结果**，而上一步的事务由于数据库压力或`IO`等原因导致事务提交延迟，这时异步操作去数据库里查询数据就会失败；

这就要求我们保证事务的原子性，数据库入库失败，那异步操作也不能执行；另外还要保证在异步操作执行前事务一定要是已提交状态。

## TransactionSynchronizationManager

使用`TransactionSynchronizationManager`保证异步操作只在事务正确`commit`之后才执行。这也是个人较为推荐的一种做法,示例代码如下：

```java
@Transactional
@Override
public void handle() {
    // 业务代码
        
    //判断是否在事务当中,如果在事务中则,则在事务提交以后调用，否则直接调用
    if (TransactionSynchronizationManager.isSynchronizationActive()) {
        //如果在事务中，则在事务结束后调用
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronizationAdapter() {
            @Override
            public void afterCommit() {
                // 事务提交以后的调用的方法，例如MQ，第三方接口调用
            }
        });
    } else {
        // 事务提交以后的调用的方法，例如MQ，第三方接口调用
    }

}    
```
