# 为什么 MySQL 不建议使用 delete 删除数据？ & Truncate 相关命令用法

`delete`物理删除其实不能释放磁盘空间，而且会产生大量的碎片，导致索引频繁**分裂**，影响`SQL`执行计划的稳定性；
同时在碎片回收时，会耗用大量的`CPU`，磁盘空间，影响表上正常的`DML`操作。

我们在业务代码中，建议做逻辑标记删除，避免物理删除。

## 页合并 & 页分裂

[B+ Trees](https://www.cs.usfca.edu/~galles/visualization/BPlusTree.html)动态演示。


`MySQL`物理删除记录时，不会实际删除这条记录，而是将这条**记录标记为已删除**，并记录数据页的可回收空间阈值。
当数据页的可回收空间阈值等于`MERGE_THRESHOLD`（默认为页面大小的`50％`）时，`InnoDB`开始寻找最近的页面（`NEXT`和`PREVIOUS`），以查看是否有机会合并这数据页（**碎片回收**）。

在`B+Tree`中，所有的叶子节点都是按键值的大小顺序存放在同一层的叶子节点上，由各叶子节点指针双向链表关联起来。 
如果你自定义了主键索引，且这个主键索引不是自增的，那么随着数据的写入，导致要写入数据页已满且后面一个数据页中数据页也满，无法正常写入，触发页分裂的逻辑。

页分裂的`B+Tree`实际上在物理上可能是乱序的，并且大多数情况下是不同程度的物理上乱序。这就是为啥，我们要求**使用自增长`ID`的原因**。


## DROP TABLE (DDL)

使用`DROP TABLE`命令可以快速删除MySQL中的数据表。该命令的语法如下：
```sql
DROP TABLE table_name1, table_name2, ...;
```

## TRUNCATE TABLE (DDL)

`TRUNCATE TABLE`命令用于清空`MySQL`中的数据表中的数据，
```sql
TRUNCATE TABLE table_name;
TRUNCATE table_name;
```

## DELETE FROM (DML)

DELETE FROM命令用于删除表中的数据。该命令仅删除表中的记录，如果您需要删除特定的行，可以使用WHERE子句。该命令的语法如下：
```sql
DELETE FROM table_name [WHERE condition];
```

## DROP DATABASE (DDL)

可以使用`DROP DATABASE`删除整个数据库。
```sql
DROP DATABASE database_name;
```

## TRUNCATE 与 DELETE FROM 区别

1. `TRUNCATE TABLE`在功能上与不带`WHERE`子句的`DELETE`语句相同：二者均删除表中的全部行。但`TRUNCATE TABLE`比`DELETE`速度快，且使用的系统和事务日志资源少。
2. **`DELETE`语句每次删除一行，并在事务日志中为所删除的每行记录一项。`TRUNCATE TABLE`通过释放存储表数据所用的数据页来删除数据，并且只在事务日志中记录页的释放。**
3. `TRUNCATE TABLE`删除表中的所有行，但表结构及其列、约束、索引等保持不变，并且能针对具有自动递增值的字段，做计数重置归零重新计算的作用。
4. 对于由`FOREIGN KEY`约束引用的表，不能使用`TRUNCATE TABLE`，而应使用不带`WHERE`子句的`DELETE`语句。由于`TRUNCATE TABLE`不记录在日志中，所以它不能激活触发器。
5. `TRUNCATE TABLE`不能用于参与了索引视图的表。
6. 对用`TRUNCATE TABLE`删除数据的表上增加数据时，要使用`UPDATE STATISTICS`来维护索引信息。
7. **如果有`ROLLBACK`语句，`DELETE`操作将被撤销，但`TRUNCATE`不会撤销。**
8. 执行`TRUNCATE TABLE`需要`DROP`权限。



---

**参考文档**

- [小弟问我：为什么MySQL不建议使用delete删除数据？](https://mp.weixin.qq.com/s/7dpNkLaglIyb_9DKdH43eQ)
- [InnoDB Page Merging and Page Splitting](https://www.percona.com/blog/2017/04/10/innodb-page-merging-and-page-splitting/)
