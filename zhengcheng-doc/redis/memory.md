# Redis 内存 

`Redis`的所有的数据都是存在了内存中的。换句话说，`Redis`是一种内存数据库，将数据保存在内存中，读写效率要比传统的将数据保存在磁盘上的数据库要快很多。

`Redis`通过一个叫做**过期字典**（可以看作是`hash`表）来保存数据过期的时间。过期字典的键指向`Redis`数据库中的某个 key(键)，过期字典的值是一个 long long 类型的整数，这个整数保存了`key`所指向的数据库键的过期时间（毫秒精度的 UNIX 时间戳）。

![redis过期时间](/img/redis/redis过期时间.png)

过期字典是存储在`redisDb`这个结构里的：

```
typedef struct redisDb {
...

    dict *dict;     //数据库键空间,保存着数据库中所有键值对
    dict *expires   // 过期字典,保存着键的过期时间
    ...
} redisDb;
```

## Redis 内存淘汰机制

Redis 提供 6 种数据淘汰策略：

1. volatile-lru（least recently used）：从已设置过期时间的数据集（server.db[i].expires）中挑选最近最少使用的数据淘汰
2. volatile-ttl：从已设置过期时间的数据集（server.db[i].expires）中挑选将要过期的数据淘汰
3. volatile-random：从已设置过期时间的数据集（server.db[i].expires）中任意选择数据淘汰
4. allkeys-lru（least recently used）：当内存不足以容纳新写入数据时，在键空间中，移除最近最少使用的 key（这个是最常用的）
5. allkeys-random：从数据集（server.db[i].dict）中任意选择数据淘汰
6. no-eviction：禁止驱逐数据，也就是说当内存不足以容纳新写入数据时，新写入操作会报错。这个应该没人使用吧！

4.0 版本后增加以下两种：

7. volatile-lfu（least frequently used）：从已设置过期时间的数据集（server.db[i].expires）中挑选最不经常使用的数据淘汰
8. allkeys-lfu（least frequently used）：当内存不足以容纳新写入数据时，在键空间中，移除最不经常使用的 key

::: tip MySQL 里有 2000w 数据，Redis 中只存 20w 的数据，如何保证 Redis 中的数据都是热点数据?
1. 保留热点数据：对于保留 Redis 热点数据来说，我们可以使用 Redis 的内存淘汰策略来实现，可以使用allkeys-lru淘汰策略，该淘汰策略是从 Redis 的数据中挑选最近最少使用的数据删除，这样频繁被访问的数据就可以保留下来了。
2. 保证 Redis 只存20w的数据：1个中文占2个字节，假如1条数据有100个中文，则1条数据占200字节，20w数据 乘以 200字节 等于 4000 字节（大概等于38M）;所以要保证能存20w数据，Redis 需要38M的内存。
:::

## 数据持久化

### RDB（Redis DataBase）

`RDB`方式也叫快照方式，这种方式会在一定的触发时机下，将当前`redis`的内存快照保存到磁盘上的`dump.rdb`文件中。这个过程中，主要执行一个命令`bgsave`。

非常适用于备份，全量复制等场景，但是无法做到实时持久化/秒级持久化。

### AOF（Append Only File）

`AOF`的`appendfsync`触发机制是上面配置的三个参数决定的：`no`、`always`、`everysec`。
可以根据对性能和持久化的实时性要求，具体配置。如果不知道哪种合适，就使用默认的`everysec`，可能会有`1s`的数据丢失。

`AOF`文件远大于`RDB`文件，数据恢复速度比`rdb`慢。
 

---
**参考文档**
- [内存优化](https://redis.io/topics/memory-optimization)