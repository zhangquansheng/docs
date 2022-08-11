# 如何保证缓存与数据库的双写一致性

## Cache Aside Pattern(旁路模式)

最经典的缓存+数据库读写的模式，就是 `Cache Aside Pattern`。

- 读的时候，先读缓存，缓存没有的话，就读数据库，然后取出数据后放入缓存，同时返回响应。
- 更新的时候，**先更新数据库，然后再删除缓存**。

![cache-aside-diagram](/img/redis/cache-aside-diagram.png)


## 为什么是删除缓存，而不是更新缓存？

1. 如果一个缓存涉及到表字段，在`10`分钟之内，修改了`100`次，那么缓存就要更新`100`次，但是这个缓存在这段时间内仅仅被读取了`1`次，**存在大量的冷数据**。
如果只是删除缓存的话，那么在这段时间内，缓存不过就重新计算了一次而已，开销大幅度降低。（`lazy`加载的思想）
2. 微服务下，更新缓存也会带来分布式下的并发问题，而删除缓存不会。

## 删除缓存失败，如何保证缓存一致性？

只需要缓存设置一个有效期，过了这个有效期以后，就会再去重新计算一次，并设置缓存，大大降低了缓存不一致问题出现的频率。

---

**参考文档**

- [Cache-Aside pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/cache-aside)
- [如何保证数据库和缓存双写一致性](https://blog.csdn.net/zhiyikeji/article/details/123940351)
- [解决缓存和数据库双写数据一致性问题](https://blog.csdn.net/D812359/article/details/121645548)