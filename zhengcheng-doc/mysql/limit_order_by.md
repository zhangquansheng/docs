# MySQL 排序分页查询数据顺序错乱

## 问题现象

MySql 对**无索引字段**进行 `ORDER BY` 后 `Limit`，当被排序字段有相同值时并且在`Limit`范围内，取的值并不是正常排序后的值，
有可能第一页查询的记录，重复出现在第二页的查询记录中，而且第二页的查询结果乱序，导致分页结果查询错乱问题。

## 问题原因

官方文档说明：
[limit-optimization](https://dev.mysql.com/doc/refman/5.7/en/limit-optimization.html)

```html
If multiple rows have identical values in the ORDER BY columns, the server is free to return those rows in any order, and may do so differently depending on the overall execution plan. In other words, the sort order of those rows is nondeterministic with respect to the nonordered columns.
```
如果ORDER BY列中有多行具有相同的值，则服务器可以自由地按任何顺序返回这些行，并且根据总体执行计划的不同，返回方式可能会有所不同。换句话说，**这些行的排序顺序相对于未排序的列是不确定的**。

.....

```html
If it is important to ensure the same row order with and without LIMIT, include additional columns in the ORDER BY clause to make the order deterministic. For example, if id values are unique, you can make rows for a given category value appear in id order by sorting like this:
```

**在 ORDER BY 子句中包含额外的列，以使顺序具有确定性。**

## 解决方案

1. ORDER BY 的列包含一个索引列
2. （推荐）ORDER BY 子句中包含额外的列，例如`ID`,以使顺序具有确定性。
