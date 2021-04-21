---
sidebarDepth: 3
---

# B+树索引

## 概述

B+树索引的本质就是[B+树](/algorithms/balanced-tree)在数据库中的实现。

B+树索引可以分为**聚集索引(`clustered index`)**和**非聚集索引(`secondary index`)**（`辅助索引`、`二级索引`），但是不管是聚集索引还是非聚集索引，其内部都是B+树的，即高度平衡的，叶子节点存放着所有的数据。
**聚集索引和非聚集索引的区别是：叶子节点存放的是否是一整行的信息。**

### 聚集索引

> 也叫`主键索引`

聚集索引就是按照每张表的**主键**构造一颗`B+树`，同时叶子节点存放的即为整张表的**行记录数据**，也将聚集索引的叶子节点称为**数据页**。一个表不可能有两个地方存放数据，所以一个表只能有一个聚集索引。
`InnoDB`表中聚集索引的索引列就是主键，所以聚集索引也叫`主键索引`。

### 非聚集索引

> 也叫`辅助索引`或`二级索引`

辅助索引叶子节点的数据不是存储实际的数据，而是主键的值(或者叫做**聚集索引键**、**bookmark**)。要想拿到实际的数据需要再通过主键索引找到对应的行记录然后才能拿到实际的数据，这个过程称为**回表**。

如果查询语句可以从非聚集索引（`辅助索引`）（包括联合索引）中获取到所有需要的列，这时不需要再通过主键索引找到对应的行记录，这种情况称为**覆盖索引**（索引覆盖）。

## Cardinality 值

不是所有的查询条件出现的列都需要添加索引。对于什么时候添加B+树索引。一般的经验是，在访问表中很少一部分时使用B+树索引才有意义。对于性别字段、地区字段、类型字段，它们可取值范围很小，称为**低选择性**。

怎样查看索引是否有**高选择性**？可以通过以下`SQL`查询结果中的列`Cardinality`来观察。
```sql
mysql>SHOW INDEX FROM `TABLE_NAME`
```
![SHOW-INDEX-FROM-TABLE](/img/mysql/SHOW-INDEX-FROM-TABLE.png)

`Cardinality`值非常关键，表示**索引中不重复记录数量的预估值**。同时需要注意的是，`Cardinality`一个预估值，而不是一个准确值，基本上用户也不可能得到一个准确的值。

## B+树索引的使用

### 联合索引

联合索引是指对**表上的多个列进行索引**。联合索引也是`B+索引`，不同的是联合索引的键值的数量不是`1`，而是大于等于`2`。

联合索引中**列的顺序很重要**。`InnoDB`首先根据联合索引中最左边的、也就是第一列进行排序，在第一列排序的基础上，再对联合索引中后面的第二列进行排序，依此类推。

所以如果想使用联合索引的第`n`列，查询条件中必须包括联合索引前面的第1列到第n-1列的查询信息。如`(group, score)`，可能出现以下排序`(1, 46)`, `(1,58)`, `(2,23)`, `(2,96)`, `(3,25)`, `(3,67)`。

如果要使用该索引的`score`，查询条件中必须包含`group`，如`where group = 2 and score = 96`，`InnoDB`通过`group`查询后，再通过`score`查询，这个规则称为**最左前缀匹配原则**。

### 覆盖索引

如果一个索引包含(或覆盖)所有需要查询的字段的值，称为**覆盖索引**。即只需扫描索引而无须**回表**。

## 索引条件下推 ICP（Index Condition Pushdown） :hammer:

`MySQL 5.6`开始支持`ICP`（`Index Condition Pushdown`），不支持`ICP`之前，当进行索引查询时，首先根据索引来查找数据，然后再根据`where`条件来过滤，扫描了大量不必要的数据，增加了数据库`IO`操作。

在支持`ICP`后，`MySQL`在取出索引数据的同时，判断是否可以进行`where`条件过滤，**将`where`的部分过滤操作放在存储引擎层**，提前过滤掉不必要的数据，减少了不必要数据被扫描带来的`IO`开销。

在某些查询下，可以减少`Server`层对存储引擎层数据的读取，从而提供数据库的整体性能。

### ICP 特性

1. 支持`range`，`ref`，`eq_ref`，`ref_or_null`，并且需要回表查询的`非聚集索引`
2. 支持`InnoDB`、`MyISAM`的普通表及分区表
3. 对于`InnoDB`表，仅支持走`非聚集索引`的查询
4. `Explain` 中 `Extra = "Using index condition; "`

所以它不支持以下几点
1. 不支持`主键索引`
2. 不支持基于虚拟列的`辅助索引`
3. 不支持`where`条件涉及子查询的
4. 不支持`where`条件包含存储过程、函数的

### ICP索引下推 性能分析

`index_condition_pushdown`：索引条件下推默认开启的，可以设置为`off`关闭`ICP`特性后，验证`ICP`优化效果。
```sql
mysql>show variables like 'optimizer_switch';

# 开启或者关闭ICP特性
mysql>set optimizer_switch = 'index_condition_pushdown=on | off';
```

![Using-index-condition](/img/mysql/Using-index-condition.png)

`Extra`显示的索引扫描方式如下:
- `using where`：查询使用索引的情况下，需要回表去查询所需的数据。
- `using index condition`：查询使用了索引，但是需要回表查询数据。
- `using index`：查询使用覆盖索引的时候会出现。
- `using index & using where`：查询使用了索引，但是需要的数据都在索引列中能找到，不需要回表查询数据。

## 全模糊查询使用索引（索引扫描不回表）

![idx_name_like_out](/img/mysql/idx_name_like_out.png)
从执行计划看到 `type=ALL，Extra=Using where` 走的是全部扫描，没有利用到`ICP`特性。

![idx_name_like_in](/img/mysql/idx_name_like_in.jpg)
从执行计划看到，`type=index，Extra=Using where; Using index`，索引全扫描，但是需要的数据都在索引列中能找到，不需要回表。利用这个特点，将原始的`SQL`语句先获取主键`id`，然后通过`id`跟原表进行关联。
并且我们可以看到，走了索引`idx_name`不需要回表访问数据，`type = index` 说明没有用到`ICP`特性，但是可以利用 `Using where; Using index` 这种**索引扫描不回表的方式减少资源开销来提升性能**。
