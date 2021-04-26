# 为什么 MySQL 不建议使用 delete 删除数据？

`delete`物理删除其实不能释放磁盘空间，而且会产生大量的碎片，导致索引频繁**分裂**，影响`SQL`执行计划的稳定性；
同时在碎片回收时，会耗用大量的`CPU`，磁盘空间，影响表上正常的`DML`操作。

我们在业务代码中，建议做逻辑标记删除，避免物理删除。

## 页合并 & 页分裂

[B+ Trees](https://www.cs.usfca.edu/~galles/visualization/BPlusTree.html)动态演示。


`MySQL`物理删除记录时，不能实际删除这条记录，而是将**记录标记为已删除**，并记录数据页的可回收空间。
当数据页的可回收空间等于`MERGE_THRESHOLD`（默认为页面大小的`50％`）时，`InnoDB`开始寻找最近的页面（`NEXT`和`PREVIOUS`），以查看是否有机会合并这两数据页。

在`B+Tree`中，所有的叶子节点都是按键值的大小顺序存放在同一层的叶子节点上，有各叶子节点指针双向链表关联起来。 
如果你自定义了主键索引，而这个主键索引不是自增的，那么随着数据的写入，导致写入数据页已满且后面一个数据页中数据页也满，无法正常写入，触发分裂的逻辑。

页分裂的`B+Tree`实际上在物理上可能是乱序的，并且大多数情况下是不同程度的物理上乱序。这就是为啥，我们要求**使用自增长`ID`的原因**。


---

**参考文档**

- [小弟问我：为什么MySQL不建议使用delete删除数据？](https://mp.weixin.qq.com/s/7dpNkLaglIyb_9DKdH43eQ)
- [InnoDB Page Merging and Page Splitting](https://www.percona.com/blog/2017/04/10/innodb-page-merging-and-page-splitting/)