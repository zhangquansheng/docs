# ICP

> ICP（Index Condition Pushdown） 索引条件下推

`MySQL 5.6`开始支持`ICP`（`Index Condition Pushdown`），用于优化数据查询。 

- 不支持`ICP`之前，当进行索引查询时，首先根据索引来查找数据，然后再根据`where`条件来过滤，扫描了大量不必要的数据，增加了数据库`IO`操作。
- 在支持`ICP`后，`MySQL`在取出索引数据的同时，判断是否可以进行`where`条件过滤，**将`where`的部分过滤操作放在存储引擎层**，提前过滤掉不必要的数据，减少了不必要数据被扫描带来的`IO`开销。
 
 索引条件下推的关键操作就是将与索引相关的条件有`MySQL`服务器向下传递至存储引擎层，由此减少`IO`次数。
 
## ICP 特性
 
 1. 支持`range`，`ref`，`eq_ref`，`ref_or_null`，并且需要回表查询的`非聚集索引`
 2. 支持`InnoDB`、`MyISAM`的普通表及分区表
 3. 对于`InnoDB`表，仅支持走`非聚集索引`的查询
 4. `Explain` 中 `Extra = "Using index condition; "`
 
 所以它不支持以下几点
 1. 不支持`主键索引`
 2. 不支持基于虚拟列的`辅助索引`
 3. 不支持`where`条件涉及子查询的
 4. 不支持`where`条件包含存储过程、函数的
 
## EXPLAIN 分析
 
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
