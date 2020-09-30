# `InnoDB`下死锁产生原因和解决方法

## 死锁

死锁是**指两个或两个以上的事务在执行过程中，因争夺资源而造成的一种互相等待的现象，若无外力作用，它们都将无法推进下去**。


查看数据库当前版本：
```sql
select @@version;
```

查看数据库事务数据库隔离级别：
```sql
-- `MySQL 8.0` 该命令改为`SELECT @@transaction_isolation;`

SELECT @@tx_isolation;
```