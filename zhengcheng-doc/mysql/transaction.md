---
sidebarDepth: 3
---

# 事务

## 概述

数据库**事务**是访问并可能操作各种数据项的一个数据库操作序列，这些操作**要么全部执行,要么全部不执行**，是一个不可分割的工作单位。

一般来说，数据库事务具有**ACID**这4个**特性**：

- **原子性（Atomicity）：**  一个事务（`transaction`）中的所有操作，要么全部完成，要么全部不完成，不会结束在中间某个环节。事务在执行过程中发生错误，会被回滚（`Rollback`）到事务开始前的状态，就像这个事务从来没有执行过一样。
- **一致性（Consistency）：**  在事务开始之前和事务结束以后，数据库的完整性没有被破坏。
- **隔离性（Isolation）：**  数据库允许多个并发事务同时对其数据进行读写和修改的能力，隔离性可以防止多个事务并发执行时由于交叉执行而导致数据的不一致。事务隔离分为不同级别，包括读未提交（`Read uncommitted`）、读提交（`read committed`）、可重复读（`repeatable read`）和串行化（`Serializable`）。
- **持久性（Durability）:**  事务处理结束后，对数据的修改就是永久的，即便系统故障也不会丢失。


数据库**事务**是由数据库系统保证的，我们只需要根据业务逻辑使用它就可以了。在`MySQL`中只有使用了`Innodb`数据库引擎的数据库表才支持事务。

## 事务的实现

事务隔离性是锁来实现的，原子性、一致性、持久性通过数据库的 `redo log` 和 `undo log` 来完成的。 `redo log`被称为重做日志，用来保证事务的原子性和持久性，`undo log`用来保证事务的一致性。

有人或许认为`redo`是`undo`的逆过程，其实不对的。`redo`和`undo`的作用都可以看做是一种恢复操作，`redo`恢复提交事务修改的页，而`undo`回滚行记录。因此两者记录的内容不同，`redo`通常是物理日志，记录的是页的物理修改操作，`undo`是逻辑日志，根据每行记录进行记录。

### Redo Log

[官方文档](https://dev.mysql.com/doc/refman/5.7/en/innodb-redo-log.html)

#### 1. 基本概念 

`redo log`包括两部分：一是内存中的日志缓冲(`redo log buffer`)，其易失性的；二是磁盘上的重做日志文件(`redo log file`)，其是持久的。

`InnoDB`是事务的存储引擎，在概念上，其通过**Force Log at Commit**机制实现事务的持久性，即在事务提交（COMMIT）时，必须先将该事务的所有事务日志写入到磁盘上的`redo log file`和`undo log file`中进行持久化，待事务的`COMMIT`操作完成才算完成。

为了确保每次日志都能写入到事务日志文件中，在每次将日志缓冲(`redo log buffer`)写入重做日志文件(`redo log file`)之后，`InnoDB`存储引擎都需要调用一次`fsync`操作(即fsync()系统调用)。
之所以要经过一层`os buffer`，是因为`open`日志文件的时候，`open`没有使用**O_DIRECT**标志位，该标志位意味着绕过操作系统层的`os buffer`，`IO`直写到底层存储设备。
不使用该标志位意味着将日志进行缓冲，缓冲到了一定容量或者显式调用`fsync()`才会将缓冲中的日志刷到存储设备。如果使用该标志位，则意味着每次都要发起系统调用。

![fsync](/img/mysql/fsync.png)

`InnoDB`存储引擎允许用户手工设置非持久性的情况发生，以此提高数据库的性能。既当事务提交时，日志不写入事务日志文件，而是等待一个时间周期后再执行`fsync`操作。
由于并非强制在事务提交时进行一次`fsync`操作，显然这可以显著提高数据库的性能，但当数据库发生宕机时，由于部分日志未刷新到磁盘，因此会丢失最后一段时间的事务。

参数`innodb_flush_log_at_trx_commit`用来控制重做日志刷新到磁盘的策略，该参数的默认值为**1**。可以通过命令查看此参数的设置：
```sql
select @@innodb_flush_log_at_trx_commit;
```
其中参数值含义如下：
- 1  表示事务提交时必须调用一次`fsync`操作；
- 0  表示事务提交时不进行写入`redo`日志操作，这个操作仅在 `master thread` 中完成，而在 `master thread` 中每`1秒`会进行一次`redo`日志文件的`fsync`操作；
- 2  表示事务提交时把`redo`日志写入磁盘文件对应的文件系统的缓存中，不进行`fsync`操作；
![innodb_flush_log_at_trx_commit](/img/mysql/innodb_flush_log_at_trx_commit.png)

#### 2. 日志块(log block)

`InnoDB`存储引擎中，`redo log`以块为单位进行存储的，每个块占512字节，这称为`redo log block`。

#### 3. log group 和 redo log file

`log group` 是逻辑上的概念，并没有一个实际存储的物理文件来表示`log group`信息。`log group`表示的是`redo log group`，一个组内由多个大小完全相同的`redo log file`组成。

#### 4. redo log 格式

由于`InnoDB`存储引擎的存储管理是基于页的，故其`redo log`也是基于页的。

#### LSN 

**LSN**称为日志序列号(Log Sequence Number)。在`InnoDB`存储引擎中，**LSN**占用8个字节，并且单调递增。**LSN**表示的含义有：
- 重做日志写入的总量，通过LSN开始号码和结束号码可以计算出写入的日志量
- checkpoint（检查点） 的位置
- 页的版本                                                            
      
### Undo Logs

[官方文档](https://dev.mysql.com/doc/refman/5.7/en/innodb-undo-logs.html)

#### 1. 基本概念

`undo log`有两个作用：提供**回滚**和**MVCC**(多版本并发控制)。                                                               

对数据库进行修改时，`InnoDB`存储引擎不但会产生`redo`，还会产生相对应的`undo`，如果用户执行的事务或语句由于某种原因失败了，又或者用户用一条**ROLLBACK**语句请求回滚，就可以借助该`undo`进行**回滚**。

`undo log` 存放在数据库内部的一个特殊段(segment)中，这个段称为`undo log segment`。

`undo log`和`redo log`记录物理日志不一样，它是**逻辑日志**。`InnoDB`存储引擎回滚时，它实际上做的是与先前相反的工作。对于每个`INSERT`，`InnoDB`存储引擎会完成一个`DELETE`；
对于每个`DELETE`，`InnoDB`存储引擎会执行一个`INSERT`；对于每个`UPDATE`，`InnoDB`存储引擎会执行一个相反的`UPDATE`。

除了**回滚**操作，`undo`的两一个作用是**MVCC**，即在`InnoDB`存储引擎中**MVCC**的实现是通过`undo`来完成的。当用户读取一行记录时，若该记录已经被其他的事务占用，当前事务可以通过`undo`读取之前的行版本信息，以此实现非锁定读取。

最后也是最重要的一点是，**`undo log`也会产生`redo log`，因为`undo log`也要实现持久性保护**。

#### 2. undo log 的存储方式

`InnoDB`存储引擎对`undo`的管理采用段的方式。`rollback segment`称为**回滚段**，每个回滚段中有1024个`undo log segment`。

### purge 


### group commit


## 事务隔离级别

| 序号  | 英文名   | 中文名  |  脏读 | 不可重复读 | 幻读
| ------------ | ------------ | ------------ | ------------ | ------------ | ------------ |
| 1  |  read_uncommited | 读未提交  |  :x: | :x: | :x: |
| 2  | read_commited  |  读已提交 |  :white_check_mark: | :x: | :x: |
| 3  | repeatable_read  | 可重复读  | :white_check_mark: | :white_check_mark: | :x: |
| 4  |  serilizable |  序列化读 |  :white_check_mark: | :white_check_mark: | :white_check_mark: |

- :x:  表示当前事务级别未解决了此问题
- :white_check_mark: 表示当前事务级别已经解决了此问题

### 脏读

**脏读**重点在于`事务A`读取`事务B`尚未提交的**更改数据(UPDATE)**并在这个数据的基础上进行操作，这时候如果`事务B`回滚，那么`事务A`读到的数据是不被承认的。产生的流程如下：

序号 | 事务A | 事务B
---|---|---
1 | start transaction; | 
2 |  | start transaction;
3 | select balance from account where id=1;  (结果为100) | 
4 |  | update account set balance = 200 where id=1;
5 | select balance from account where id=1;  (结果为200) | 

### 不可重复读

**不可重复读**是指在同一个事务内，两次相同的查询返回了不同的结果。`事务A`第一次读取某一条数据后，`事务B`**更新该数据并提交了事务**，`事务A`再次读取该数据，两次读取便得到了不同的结果。

不可重复读和脏读的区别是：脏读是读到未提交的数据，而不可重复读读到的却是已经提交的数据，但是其违反了数据库一致性的要求。

产生的流程如下：

序号 | 事务A | 事务B
---|---|---
1 | start transaction; |  |
2 |  | start transaction; |
3 | select balance from account where id=1;  (结果为100) |  |
4 |  | update account set balance = 200 where id=1; |
5 | | commit; |
6 | select balance from account where id=1;  (结果为200) |  |

不可重复读有一种特殊情况，两个事务更新同一条数据资源，后完成的事务会造成先完成的事务更新丢失，这种情况就是**第二类丢失更新**。产生的流程如下：

序号 | 事务A | 事务B
---|---|---
1 | start transaction; |  |
2 |  | start transaction; |
3 | select balance from account where id=1;  (结果为100) |  |
4 | | select balance from account where id=1;  (结果为100)  |
5 |  | update account set balance = 0 where id=1; （取出100元） |
6 | | commit; |
5 | update account set balance = 200 where id=1; （存入100元） | |
6 | commit; | |
6 | select balance from account where id=1;  (结果为200，丢失更新) |  |

我们在平时写代码的时候，需要特别注意**第二类丢失更新**的问题，可以使用乐观锁的解决这个问题。

::: tip 延伸思考
什么是**第一类丢失更新**？MySQL是如何屏蔽了第一类丢失更新问题？
::: 

### 幻读

**幻读**重点在于`A事务`读取`B事务`提交的**新增数据(INSERT)**,会引发幻读问题。幻读一般发生在计算统计数据的事务中。产生的流程如下：

序号 | 事务A | 事务B
---|---|---
1 | start transaction; | 
2 |  | start transaction;
3 | select count(*) from account_transfer_record where account_id=1;  (结果为0) | 
4 |  | insert into account_transfer_record(id,account_id,amount) values(1,1,100); |
5 |  | commit; |
6 | select count(*) from account_transfer_record where account_id=1;  (结果为1) | 


`MySQL Innodb存储引擎`的默认支持的隔离级别是`REPEATABLE-READ（可重读）`。可以通过命令查看数据库事务数据库隔离级别：
```sql
-- `MySQL 8.0` 该命令改为`SELECT @@transaction_isolation;`

SELECT @@tx_isolation;
```

很多公司把`MySQL Innodb存储引擎`的隔离级别设置成`READ-COMMITTED`，是为了防止频繁的出现死锁，所以我们平时在写代码的时候需要注意。

::: tip 延伸思考
我们知道，`MySQL Innodb`存储引擎默认的事务隔离级别是`RR`，是会出现幻读的，那么它是如何避免幻读的呢？
:::


