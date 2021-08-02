# 部门工资最高的员工

- 来源：力扣（LeetCode）
- 链接：https://leetcode-cn.com/problems/department-highest-salary
- 著作权归领扣网络所有。商业转载请联系官方授权，非商业转载请注明出处。

`Employee` 表包含所有员工信息，每个员工有其对应的 `Id`, `salary` 和 `departmentId`。
```markdown
+----+-------+--------+--------------+
| Id | Name  | Salary | DepartmentId |
+----+-------+--------+--------------+
| 1  | Joe   | 70000  | 1            |
| 2  | Jim   | 90000  | 1            |
| 3  | Henry | 80000  | 2            |
| 4  | Sam   | 60000  | 2            |
| 5  | Max   | 90000  | 1            |
+----+-------+--------+--------------+
```

`Department` 表包含公司所有部门的信息。
```markdown
+----+----------+
| Id | Name     |
+----+----------+
| 1  | IT       |
| 2  | Sales    |
+----+----------+
```

编写一个 `SQL` 查询，找出每个部门工资最高的员工。对于上述表，您的 `SQL` 查询应返回以下行（行的顺序无关紧要）。

```markdown
+------------+----------+--------+
| Department | Employee | Salary |
+------------+----------+--------+
| IT         | Max      | 90000  |
| IT         | Jim      | 90000  |
| Sales      | Henry    | 80000  |
+------------+----------+--------+
```

解释：

`Max` 和 `Jim` 在 `IT` 部门的工资都是最高的，`Henry` 在销售部的工资最高。

## MySQL 8.0 窗口函数

在`SQL`中我们经常遇到一种需求：**分组排序**，**分组求和**等需求。要解决此类问题，最方便的就是使用窗口函数。

`MySQL`从`8.0`开始支持窗口函数，这个功能在大多商业数据库和部分开源数据库中早已支持，有的也叫**分析函数**。

::: tip 什么叫窗口?
窗口的概念非常重要，它可以理解为记录集合，窗口函数也就是在满足某种条件的记录集合上执行的特殊函数。
对于每条记录都要在此窗口内执行函数，有的函数随着记录不同，窗口大小都是固定的，这种属于静态窗口；
有的函数则相反，不同的记录对应着不同的窗口，这种动态变化的窗口叫滑动窗口。
::: 

窗口函数和普通聚合函数也很容易混淆，二者区别如下：
- 聚合函数是将多条记录聚合为一条；而窗口函数是每条记录都会执行，有几条记录执行完还是几条；
- 聚合函数也可以用于窗口函数中；


按照功能划分，可以把`MySQL`支持的窗口函数分为如下几类：
- 序号函数：`row_number()` / `rank()` / `dense_rank()`
- 分布函数：`percent_rank()` / `cume_dist()`
- 前后函数：`lag()` / `lead()`
- 头尾函数：`first_val()` / `last_val()`
- 其他函数：`nth_value()` / `nfile()`

序号函数的一般语法如下：
> select 序号函数 over (partition by 用于分组的列名 order by 用于排序的列名)

其中，`over`是关键字，用来指定函数执行的窗口范围。

那么题解`SQL`如下：
```sql
select Department, Employee, Salary
from 
(
select 
    D.Name as Department, 
    E.Name as Employee, 
    E.Salary as Salary, 
    rank() over(partition by D.Name order by E.Salary desc) as rank_
from Employee E join Department D on E.DepartmentId = D.Id
) as tmp
where rank_ = 1
```

## MySQL 5.6/5.7 题解

```sql
SELECT
    Department.name AS 'Department',
    Employee.name AS 'Employee',
    Salary
FROM
    Employee
        JOIN
    Department ON Employee.DepartmentId = Department.Id
WHERE
    (Employee.DepartmentId , Salary) IN
    (   SELECT
            DepartmentId, MAX(Salary)
        FROM
            Employee
        GROUP BY DepartmentId
	)
```

平时的`IN`都是一个字段的，其实也可以使用两个字段`IN`的，这是本题解的最大亮点。


--- 
**参考文档**

- [MySQL 8.0窗口函数](https://www.cnblogs.com/DataArt/p/9961676.html)