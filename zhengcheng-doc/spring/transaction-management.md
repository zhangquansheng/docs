---
sidebarDepth: 3
---

# Transaction Management

[[toc]]

## 事务

数据库**事务**是访问并可能操作各种数据项的一个数据库操作序列，这些操作**要么全部执行,要么全部不执行**，是一个不可分割的工作单位。

一般来说，数据库事务具有**ACID**这4个**特性**：

- **原子性（Atomicity）：**  一个事务（`transaction`）中的所有操作，要么全部完成，要么全部不完成，不会结束在中间某个环节。事务在执行过程中发生错误，会被回滚（`Rollback`）到事务开始前的状态，就像这个事务从来没有执行过一样。
- **一致性（Consistency）：**  在事务开始之前和事务结束以后，数据库的完整性没有被破坏。
- **隔离性（Isolation）：**  数据库允许多个并发事务同时对其数据进行读写和修改的能力，隔离性可以防止多个事务并发执行时由于交叉执行而导致数据的不一致。事务隔离分为不同级别，包括读未提交（`Read uncommitted`）、读提交（`read committed`）、可重复读（`repeatable read`）和串行化（`Serializable`）。
- **持久性（Durability）:**  事务处理结束后，对数据的修改就是永久的，即便系统故障也不会丢失。


数据库**事务**是由数据库系统保证的，我们只需要根据业务逻辑使用它就可以了。在`MySQL`中只有使用了`Innodb`数据库引擎的数据库或表才支持事务。

::: tip MySQL怎么保证原子性的?
在 `MySQL` 中，恢复机制是通过 `回滚日志`（`undo log`）实现的，所有事务进行的修改都会先先记录到这个回滚日志中，然后再执行相关的操作。

如果执行过程中遇到异常的话，我们直接利用`回滚日志`中的信息将数据回滚到修改之前的样子即可！

并且，`回滚日志`会先于`数据`持久化到磁盘上。这样就保证了即使遇到数据库突然宕机等情况，当用户再次启动数据库的时候，数据库还能够通过查询`回滚日志`来回滚将之前未完成的`事务`。
:::

### MySQL事务的四个隔离级别

| 序号  | 英文名   | 中文名  |  并发问题 |
| ------------ | ------------ | ------------ | ------------ |
| 1  |  read_uncommited | 读未提交  | 都有问题 |
| 2  | read_commited  |  读已提交/不可重复读 | 脏读(Dirty Read)  |
| 3  | repeatable_read  | 可重复读  | 幻读  |
| 4  |  serilizable |  序列化读 | 没有问题  |	


- 脏读

序号 | 事务A | 事务B
---|---|---
1 | Begin | 
2 |  | Begin
3 | select balance from account where id=1; (结果为100) | 
4 |  | update account set balance = 200 where id=1;
5 | select balance from account where id=1;(结果为200) | 

脏读重点在于`A事务`读取`B事务`尚未提交的`更改数据(UPDATE)`并在这个数据的基础上进行操作，这时候如果`事务B`回滚，那么`事务A`读到的数据是不被承认的。

- 幻读

序号 | 事务A | 事务B
---|---|---
1 | Begin | 
2 |  | Begin
3 | select count(*) from account_transfer_record where account_id=1; (结果为0) | 
4 |  | insert into account_transfer_record(id,account_id,amount) values(1,1,100);
5 |  | commit
6 | select count(*) from account_transfer_record where account_id=1; (结果为1) | 

幻读重点在于`A事务`读取`B事务`提交的`新增数据(INSERT),`会引发幻读问题。幻读一般发生在计算统计数据的`事务`中。


`MySQL` `Innodb存储引擎`的默认支持的隔离级别是`REPEATABLE-READ（可重读）`。可以通过`SELECT @@tx_isolation;`命令来查看，`MySQL 8.0` 该命令改为`SELECT @@transaction_isolation;`

::: tip 延伸思考
MySQL Innodb存储引擎如何避免幻读的？
:::

## 参考文档

- [Spring Framework Documentation](https://docs.spring.io/spring-framework/docs/current/spring-framework-reference/data-access.html#transaction-declarative)

