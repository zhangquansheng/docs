# MySQL

## 事务的四个隔离级别

| 序号  | 英文名   | 中文名  |  并发问题 |
| ------------ | ------------ | ------------ | ------------ |
| 1  |  read_uncommited | 读未提交  | 都有问题 |
| 2  | read_commited  |  读已提交/不可重复读 | 脏读(Dirty Read)  |
| 3  | repeatable_read  | 可重复读  | 幻读  |
| 4  |  serilizable |  序列化读 | 没有问题  |		

1. 脏读(Dirty Read)
   
   A事务读取B事务尚未提交的更改数据(UPDATE)，并在这个数据的基础上进行操作，这时候如果事务B回滚，那么A事务读到的数据是不被承认的。例如常见的取款事务和转账事务：
   
   ![Image Text](https://img-blog.csdn.net/20170731153307604?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvc3RhcmxoMzU=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

2. 幻读
   
   A事务读取B事务提交的新增数据(INSERT),会引发幻读问题。幻读一般发生在计算统计数据的事务中，例如银行系统在同一个事务中两次统计存款账户的总金额，在两次统计中，刚好新增了一个存款账户，存入了100，这时候两次统计的总金额不一致。
 
   ![Image Text]( https://img-blog.csdn.net/20170731153407212?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvc3RhcmxoMzU=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

## 数据库中的锁

1. 共享锁（又称为读锁和S锁）: 若事务T对数据对象A加上S锁，则事务T可以读A但不能修改A，其他事务只能再对A加S锁，而不能加X锁，直到T释放A上的S锁为止。
2. 排它锁（又称为写锁和X锁）: 若事务T对数据对象A加上X锁，则只允许T读取和修改A，其他任何事务都不能再对A加任何类型的锁，直到T释放A上的锁为止。

**通过锁来实现隔离,通过对事务的读写操作加锁情况的不同，划分出不同的事务隔离级别**
