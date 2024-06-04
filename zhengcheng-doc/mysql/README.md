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

## MySQL Connector/J 8.0 Developer Guide

### Configuration Properties

列举几个重要的参数，如下表所示：

| 参数名                 | 参数说明                                                         | 默认值       | 最低版本要求                                     |
|------------------------|--------------------------------------------------------------|--------------|-----------------------------------------------|
| user                   | 数据库用户名                                                 |          |  所有版本                                  |
| password               | 数据库用户密码                                               |          |  所有版本                                |
| useSSL                 | 是否使用SSL加密连接                                           | false        | 3.0.2                                    |
| requireSSL             | 连接是否必须使用SSL，useSSL=true？                                           | false        | 3.1.0                                 |
| serverTimezone         | 服务器时区设置，解决时区问题，时区ID，如`UTC`、`Asia/Shanghai`                                   |        |  3.0.2                |
| useUnicode             | 是否使用Unicode字符集，如果参数characterEncoding设置为GBK或UTF-8，本参数值必须设置为true                                         | false         | 1.1g                                    |
| characterEncoding      | 当useUnicode设置为true时，指定字符编码。比如可设置为GBK或UTF-8                                                     | false| 1.1g                               |
| autoReconnect          | 当数据库连接异常中断时，是否自动重新连接                                                  | false        | 1.1                                    |
| maxReconnects          | autoReconnect设置为true时，重试连接的次数                                       | 3            | 1.1                                       |
| initialTimeout          | autoReconnect设置为true时，两次重连之间的时间间隔，单位：秒                                       | 2            | 1.1                                       |
| autoReconnectForPools          | 是否使用针对数据库连接池的重连策略                                       |   false            | 3.1.3                                        |
| connectTimeout         | 和数据库服务器建立socket连接时的超时，单位：毫秒。 0表示永不超时，适用于JDK 1.4及更高版本                                          | 0       | 3.0.1                                        |
| socketTimeout          | socket操作（网络读写）超时，单位：毫秒。 0表示永不超时                                      | 0       | 3.0.1                                        |
| allowMultiQueries      | 在一条语句中，允许使用“;”来分隔多条查询                                 | false        | 3.1.1                                    |
| useAffectedRows        | `UPDATE`和`DELETE`操作返回受影响的行数而非记录数              | false        | 5.1.7                           |


::: tip 重要提示
在使用数据库连接池的情况下，**最好设置如下两个参数**：
```
autoReconnect=true&failOverReadOnly=false
```
**确保数据库出现秒级别的连接闪断时，业务具备重连机制，并且重连连接读写权限不受影响。**
:::


原版手册参考地址如下：[官方文档](https://dev.mysql.com/doc/connector-j/8.0/en/connector-j-reference-configuration-properties.html)

**参考文档**

- [官方文档](https://dev.mysql.com/doc/)
