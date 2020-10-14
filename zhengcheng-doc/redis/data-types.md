# Redis数据类型简介

## String

`String` 数据类型是最基本的Redis值。我们知道`Redis`是用C语言写的，但是`Redis`并没有使用C语言的字符串，而是自己构建了一种**简单动态字符串**（simple dynamic string，SDS）。相比于C语言原生字符串，
`Redis`的SDS是二进制安全的，这意味着字符串类型可以包含任何类型的数据，例如JPEG图像或序列化的Ruby对象，并且获取字符串长度的复杂度为` O(1)`（C 字符串为` O(N)`）

字符串值的最大长度为`512 MB`。

**应用场景：** 
- 使用`INCR`系列中的命令将字符串用作原子计数器：`INCR`，`DECR`，`INCRBY`。
- 使用`APPEND`命令附加到字符串。
- 使用字符串作为`GETRANGE`和`SETRANGE`的随机访问向量。
- 在很小的空间中编码大量数据，或者使用`GETBIT`和`SETBIT`创建一个Redis支持的`Bloom Filter` 。

## List

`List` 是**双向链表**。因为它是链表，所以随机定位性能较弱，首尾插入删除性能较优。如果`List`的列表长度很长，使用时我们一定要关注链表相关操作的时间复杂度。

一个列表的最大长度为：`2的32次方-1`（超过40亿）。

**应用场景：** 
- 发布与订阅或者说消息队列。
- 在社交网络中为时间线建模，请使用`LPUSH`以便在用户时间线中添加新元素，并使用`LRANGE`来检索一些最近插入的项目。
- 您可以将`LPUSH`与`LTRIM`一起使用，以创建一个列表，该列表从不超过给定数量的元素，而只记住最新的N个元素。

## Hash

`Hash`哈希是一个 `string` 类型的`field`和`value`的映射表(键值对)，因此它们是表示对象的理想数据类型（例如，具有多个字段（例如姓名，姓氏，年龄等）的User），后续操作的时候，你可以直接仅仅修改这个对象中的某个字段的值。

内部实现类似`Java`语言的`HashMap`，哈希二维结构图（数据+链表）如下：
![哈希二维结构图](/img/hash.png)

一个哈希最多可以存储`2的32次方-1` 键值对（超过40亿）。

**应用场景：** 
- 系统中对象数据的存储

## Set

`Set`类型是一种无序集合，集合中的元素没有先后顺序。当你需要存储一个列表数据，又不希望出现重复数据时，`set`是一个很好的选择，并且`set`提供了判断某个成员是否在一个`set`集合内的重要接口，这个也是`list`所不能提供的。

**可以基于`set`轻易实现交集、并集、差集的操作，比如：你可以将一个用户所有的关注人存在一个集合中，将其所有粉丝存在一个集合。Redis 可以非常方便的实现如共同关注、共同粉丝、共同喜好等功能。这个过程也就是求交集的过程。**

**应用场景：** 
- 需要存放的数据不能重复以及需要获取多个数据源交集和并集等场景

## Sorted set

 和`set`相比`sorted set`增加了一个权重参数`score`，使得集合中的元素能够按`score`进行有序排列，还可以通过`score`的范围来获取元素的列表。有点像是`Java`中`HashMap`和`TreeSet`的结合体。

**应用场景：** 
- 需要对数据根据某个权重进行排序的场景。比如在直播系统中，实时排行信息包含直播间在线用户列表，各种礼物排行榜，弹幕消息（可以理解为按消息维度的消息排行榜）等信息。


## Bitmaps and HyperLogLogs

Redis also supports Bitmaps and HyperLogLogs which are actually data types based on the String base type, but having their own semantics.

Please refer to the [introduction to Redis data types](https://redis.io/topics/data-types-intro) for information about those types.

---

**参考文档**
- [Redis Documentation Data types](https://redis.io/topics/data-types)
- [Redis数据类型简介](https://redis.io/topics/data-types-intro)
- [通俗易懂的 Redis 数据结构基础教程](https://juejin.im/post/6844903644798664712)