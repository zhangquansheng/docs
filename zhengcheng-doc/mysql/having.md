# HAVING

在`SQL`中增加`HAVING`子句原因是: `WHERE`关键字无法与**聚合函数**一起使用。

- `having`关键字对`group by`分组后的数据进行过滤
- `having`支持`where`的所有操作符和语法

## where 和 having 的一些差异性

where | having
---|---
**不可以**使用聚合函数 | **可以**使用聚合函数
数据 group by **前**过滤 | 数据 group by **后**过滤
查询条件中**不可以**使用字段别名 | 查询条件中**可以**使用字段别名
用于**过滤数据行** | 用于**过滤分组后的结果集** 
根据数据表的字段直接过滤 | 根据已查询出的字段进行过滤 

## SQL HAVING 语法

```sql
SELECT column_name, aggregate_function(column_name)
FROM table_name
WHERE column_name operator value
GROUP BY column_name
HAVING aggregate_function(column_name) operator value
```



