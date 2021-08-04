# SQL HAVING 子句

在`SQL`中增加`HAVING`子句原因是: `WHERE`关键字无法与**聚合函数**一起使用。

`HAVING`子句可以让我们筛选分组后的各组数据。

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

## 实战： 超过5名学生的课

有一个`courses`表 ，有: `student` (学生) 和 `class` (课程)。

请列出所有超过或等于`5`名学生的课。

例如，表：
```markdown
+---------+------------+
| student | class      |
+---------+------------+
| A       | Math       |
| B       | English    |
| C       | Math       |
| D       | Biology    |
| E       | Math       |
| F       | Computer   |
| G       | Math       |
| H       | Math       |
| I       | Math       |
+---------+------------+
```

应该输出:
```markdown
+---------+
| class   |
+---------+
| Math    |
+---------+
```

提示：学生在每个课中不应被重复计算。

- 来源：力扣（LeetCode）
- 链接：https://leetcode-cn.com/problems/classes-more-than-5-students
- 著作权归领扣网络所有。商业转载请联系官方授权，非商业转载请注明出处。

### 题解

**方法一：使用 GROUP BY 子句和子查询**

思路: 先统计每门课程的学生数量，再从中选择超过 5 名学生的课程。

算法: 使用 `GROUP BY` 和 `COUNT` 获得每门课程的学生数量。
````sql
SELECT
    class, COUNT(DISTINCT student)
FROM
    courses
GROUP BY class
````
注：使用 `DISTINCT` 防止在同一门课中学生被重复计算。
```markdown
| class    | COUNT(student) |
|----------|----------------|
| Biology  | 1              |
| Computer | 1              |
| English  | 1              |
| Math     | 6              |
```
使用上面查询结果的临时表进行子查询，筛选学生数量超过`5`的课程。
```sql
SELECT
    class
FROM
    (SELECT
        class, COUNT(DISTINCT student) AS num
    FROM
        courses
    GROUP BY class) AS temp_table
WHERE
    num >= 5
```
注：`COUNT(student)` 不能直接在 `WHERE` 子句中使用，这里将其重命名为 `num`。

**方法二：使用 `GROUP BY` 和 `HAVING` 条件【通过】**

算法: 在 `GROUP BY` 子句后使用 `HAVING` 条件是实现子查询的一种更加简单直接的方法。
```sql
SELECT
    class
FROM
    courses
GROUP BY class
HAVING COUNT(DISTINCT student) >= 5
```

---

**参考文档**
- [SQL HAVING 子句 | 菜鸟教程](https://www.runoob.com/sql/sql-having.html)
- [596. 超过5名学生的课](https://www.runoob.com/sql/sql-having.html)

