# MySQL 中 UPDATE 语句的返回值问题汇总

关键字：**更新的行数**，**影响的行数**

数据库表中原始数据如下：
![update-table-data.png](/img/mysql/update-table-data.png)

## Navicat 12 for MySQL

1. 当`UPDATE`的`sql`语句中的`where`条件不成立时，返回结果是`0`
   ![update-sql-1](/img/mysql/update-sql-1.png)
2. 当`UPDATE`的`sql`语句在更新时，更新的数据与原数据一致返回结果为`0`
   ![update-sql-2](/img/mysql/update-sql-2.png)

## MyBatis（数据库连接默认情况下useAffectedRows=false）

1. 当`UPDATE`的`sql`语句中的`where`条件不成立时（未存在对应的记录），`mapper.update`返回结果是`0`
2. 当`UPDATE`的`sql`语句在更新时，更新的数据与原数据一致，`mapper.update`返回结果为大于`0`
3. 当`UPDATE`的`sql`语句在更新时，更新的数据与原数据不一致，`mapper.update`返回结果为大于`0`

如果需要返回值是**受影响的行数**，修改数据库链接配置：增加 `useAffectedRows=true`




