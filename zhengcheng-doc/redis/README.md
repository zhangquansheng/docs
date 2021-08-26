# 概述

::: tip 特别提醒
版本 `Redis server v=3.2.100 sha=00000000:0 malloc=jemalloc-3.6.0 bits=64 build=dd26f1f93c5130ee`
:::

查看Redis的版本号：
```shell script
redis-server --version
```
```shell script
redis-server -v
```

关键词: `空间换时间`

Redis哈希槽

Redis集群

Redis事务

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
- Redis 官网：[https://redis.io/](https://redis.io/)
- 源码地址：[https://github.com/redis/redis](https://github.com/redis/redis)
- Redis 在线测试：[http://try.redis.io/](http://try.redis.io/)
- Redis 命令参考：[http://doc.redisfans.com/](http://doc.redisfans.com/)
