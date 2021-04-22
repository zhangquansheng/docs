# 概述

::: tip 特别提醒
版本`5.7` 
:::

查看数据库当前版本：
```sql
select @@version;
```

关键词: `B+树` `Innodb`


::: tip schema
In MySQL, physically, a schema is synonymous with a database. You can
substitute the keyword SCHEMA instead of DATABASE in MySQL SQL syntax,
for example using CREATE SCHEMA instead of CREATE DATABASE.
:::
> 在MySQL中，schema 和 数据库（DATABASE）是同义的。

---

**参考文档**
- [官方文档](https://dev.mysql.com/doc/)