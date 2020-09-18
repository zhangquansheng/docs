# Redis 单线程模型详解

## 为什么 Redis 选择单线程模型

- **`Redis`服务中运行的绝大多数操作的性能瓶颈都不是`CPU`**；
- 使用单线程模型也能并发的处理客户端的请求，核心是**基于非阻塞的IO多路复用机制**；
- 单线程同时也避免了多线程的上下文频繁切换问题,预防了多线程可能产生的竞争问题；
- 使用单线程模型能带来更好的可维护性，方便开发和调试；

::: tip Redis is single threaded. How can I exploit multiple CPU / cores?

It's not very frequent that CPU becomes your bottleneck with Redis, as usually Redis is either memory or network bound. For instance, using pipelining Redis running on an average Linux system can deliver even 1 million requests per second, so if your application mainly uses O(N) or O(log(N)) commands, it is hardly going to use too much CPU.

However, to maximize CPU usage you can start multiple instances of Redis in the same box and treat them as different servers. At some point a single box may not be enough anyway, so if you want to use multiple CPUs you can start thinking of some way to shard earlier.

You can find more information about using multiple Redis instances in the [Partitioning page](https://redis.io/topics/partitioning).

However with Redis 4.0 we started to make Redis more threaded. For now this is limited to deleting objects in the background, and to blocking commands implemented via Redis modules. For future releases, the plan is to make Redis more and more threaded.

::: 

## 参考文档
- [redis-is-single-threaded-how-can-i-exploit-multiple-cpu--cores](https://redis.io/topics/faq#redis-is-single-threaded-how-can-i-exploit-multiple-cpu--cores)
- [为什么 Redis 选择单线程模型](https://draveness.me/whys-the-design-redis-single-thread/)
