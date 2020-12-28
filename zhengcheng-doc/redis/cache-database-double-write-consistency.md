# 如何保证缓存与数据库的双写一致性

## Cache Aside Pattern(旁路模式)

最经典的缓存+数据库读写的模式，就是 `Cache Aside Pattern`。

- 读的时候，先读缓存，缓存没有的话，就读数据库，然后取出数据后放入缓存，同时返回响应。
- 更新的时候，**先更新数据库，然后再删除缓存**。

![cache-aside-diagram](/img/redis/cache-aside-diagram.png)

**为什么是删除缓存，而不是更新缓存？**



---

**参考文档**
[Cache-Aside pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/cache-aside)