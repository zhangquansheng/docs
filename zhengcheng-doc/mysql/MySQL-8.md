# MySQL8.0 新特性

## MySQL 5.7 与 8.0 的对比分析

1. **性能**：MySQL 8.0 相较于 MySQL 5.7 提供了显著的性能提升，官方声称 MySQL 8.0 大约比 MySQL 5.7 快两倍。
2. **窗口函数与SQL标准支持**：MySQL 8.0 新增了对窗口函数的支持，这是 SQL:2003 标准的一部分，极大地丰富了数据分析和处理的能力。
3. **隐藏索引**：：在 MySQL 8.0 中，索引可以被“隐藏”和“显示”。当对索引进行隐藏时，它不会被查询优化器所使用。我们可以使用这个特性用于性能调试，例如我们先隐藏一个索引，然后观察其对数据库的影响。如果数据库性能有所下降，说明这个索引是有用的，然后将其“恢复显示”即可；如果数据库性能看不出变化，说明这个索引是多余的，可以考虑删掉。
4. **JSON功能增强**：MySQL 8 大幅改进了对 JSON 的支持，添加了基于路径查询参数从 JSON 字段中抽取数据的 JSON_EXTRACT() 函数，以及用于将数据分别组合到 JSON 数组和对象中的 JSON_ARRAYAGG() 和 JSON_OBJECTAGG() 聚合函数。
5. **UTF-8 编码**：从 MySQL 8 开始，使用 utf8mb4 作为 MySQL 的默认字符集。
6. ......

## Window Functions 窗口函数

[官方文档](https://dev.mysql.com/doc/refman/8.0/en/window-functions.html)

MySQL 的窗口函数（Window Function）是一种高级的SQL查询功能，它允许你在**数据集中的一组相关行（即“窗口”）上执行聚合操作，而不仅仅是在整个查询结果集上**。
窗口函数扩展了传统聚合函数（如SUM、AVG、COUNT、MAX、MIN等）的功能，使你能对每行数据应用聚合计算，同时保留了该行的其他详细信息。这种特性对于**复杂的数据分析和报表制作特别有用**。

### window_function_name

| Name |	Description | 函数说明 |
| --- | --- | --|
|CUME_DIST() |	Cumulative distribution value | 累积分布值 |
|DENSE_RANK() |	Rank of current row within its partition, without gaps | 并列排序，不会跳过重复的序号，比如序号为1、1、2 |
|FIRST_VALUE() |	Value of argument from first row of window frame | 返回第一个行 |
|LAG() |	Value of argument from row lagging current row within partition | 返回当前行的前N行 |
|LAST_VALUE() |	Value of argument from last row of window frame | 返回最后一个行 |
|LEAD() |	Value of argument from row leading current row within partition | 返回当前行的后N行 |
|NTH_VALUE() |	Value of argument from N-th row of window frame | 返回第N行 |
|NTILE()	| Bucket number of current row within its partition. | 将分区中的有序数据分为N个桶，并记录桶编号 | 
|PERCENT_RANK() |	Percentage rank value | 分布函数：等级值百分比 | 
|RANK()	| Rank of current row within its partition, with gaps | 并列排序，会跳过重复的序号，比如序号为1、1、3 |
|ROW_NUMBER() |	Number of current row within its partition | 顺序排序 |

窗口函数总体上可以分为序号函数、分布函数、前后函数、首尾函数和其他函数：
1. **序号函数**：用于为窗口内的每一行生成一个序号，例如 ROW_NUMBER()，RANK()，DENSE_RANK() 等。
2. **分布函数**：用于计算窗口内的每一行在整个分区中的相对位置，例如 PERCENT_RANK()，CUME_DIST() 等。
3. **前后函数**：用于获取窗口内的当前行的前后某一行的值，例如 LAG()，LEAD() 等。
4. **头尾函数**：用于获取窗口内的第一行或最后一行的值，例如 FIRST_VALUE()，LAST_VALUE() 等。

### 使用示例

假设我们有一个销售数据表 sales，包含 id, sale_amount, year, country, 和 product 列，我们想为每个国家每年的销售记录进行排名，使用窗口函数可以轻松实现：
```sql
SELECT 
    id, 
    sale_amount, 
    year, 
    country, 
    product,
    ROW_NUMBER() OVER (PARTITION BY country, year ORDER BY sale_amount DESC) as row_num
FROM 
    sales;
```
