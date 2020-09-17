# Redis数据类型简介

## String

Redis字符串是二进制安全的，这意味着Redis字符串可以包含任何类型的数据，例如JPEG图像或序列化的Ruby对象。

Redis的字符串是**动态字符串**，是可以修改的字符串，内部结构实现上类似于`Java`的`ArrayList`，采用预分配冗余空间的方式来减少内存的频繁分配。

字符串值的最大长度为`512 MB`。

## List

`Redis`将列表数据结构命名为`List`而不是`Array`，是因为列表的**存储结构用的是双向链表**而不是数组。因为它是链表，所以随机定位性能较弱，首尾插入删除性能较优。如果list的列表长度很长，使用时我们一定要关注链表相关操作的时间复杂度。

一个列表的最大长度为：2的32次方-1（4294967295，超过4十亿每列表中的元素）。

## Hash

哈希结构图：
![哈希结构图](/img/hash.png)

## Set

## Sorted set

## Bitmaps and HyperLogLogs

## 参考文档

- [Redis Documentation Data types](https://redis.io/topics/data-types)
- [Redis数据类型简介](https://redis.io/topics/data-types-intro)
- [通俗易懂的 Redis 数据结构基础教程](https://juejin.im/post/6844903644798664712)