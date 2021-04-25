# 概述

::: tip 特别提醒
版本`5.7` 
:::

查看数据库当前版本：
```sql
select @@version;
```

关键词: `B+树` `Innodb`


## 基本概览

### schema
> 在MySQL中，schema 和 数据库（DATABASE）是同义的。

In MySQL, physically, a schema is synonymous with a database. You can
substitute the keyword SCHEMA instead of DATABASE in MySQL SQL syntax,
for example using CREATE SCHEMA instead of CREATE DATABASE.

### DDL

DDL is `Data Definition Language` statements. 数据定义语言，用于定义和管理`SQL`数据库中的所有对象的语言。例如：
1. CREATE - to create objects in the database 创建
2. ALTER - alters the structure of the database 修改
3. DROP - delete objects from the database 删除
4. TRUNCATE  - remove all records from a table, including all spaces allocated for the records are removed

### DML

DML is `Data Manipulation Language` statements. 数据操作语言，`SQL`中处理数据等操作统称为数据操作语言。例如：
1. SELECT - retrieve data from the a database 查询
2. INSERT - insert data into a table 添加
3. UPDATE - updates existing data within a table 更新
4. DELETE - deletes all records from a table, the space for the records remain 删除
5. CALL - call a PL/SQL or Java subprogram
6. EXPLAIN PLAN - explain access path to data

### DCL

DCL is `Data Control Language` statements. 数据控制语言，用来授予或回收访问数据库的某种特权，并控制数据库操纵事务发生的时间及效果，对数据库实行监视等。例如：
1. COMMIT - save work done 提交
2. SAVEPOINT - identify a point in a transaction to which you can later roll back 保存点
3. ROLLBACK - restore database to original since the last COMMIT 回滚
4. SET TRANSACTION - Change transaction options like what rollback segment to use 设置当前事务的特性，它对后面的事务没有影响.

---

**参考文档**
- [官方文档](https://dev.mysql.com/doc/)