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

以上的解释大致的意思是：**在`Redis`中单线程已经够用了，`CPU`不是`Redis`的瓶颈，`Redis`的瓶颈最有可能是机器内存或者网络带宽。**

::: warning 注意
因为处理请求是单线程的，所以不要在生产环境运行**长命令**，比如`keys`、`flushall`、`flushdb`，否则会导致请求被阻塞。
:::

## 非阻塞的IO多路复用机制 :hammer:

`redis`服务端对于命令的处理是单线程的，但是在`I/O`层面却可以同时面对多个客户端并发的提供服务，并发到内部单线程的转化通过多路复用框架实现。

-[IO多路复用底层原理](https://gitee.com/oslo/LearningNotes/blob/master/Redis/IO%E5%A4%9A%E8%B7%AF%E5%A4%8D%E7%94%A8%E5%BA%95%E5%B1%82%E5%8E%9F%E7%90%86/README.md)

## 多线程I/O :hammer:


---
**参考文档**
- [redis-is-single-threaded-how-can-i-exploit-multiple-cpu--cores](https://redis.io/topics/faq#redis-is-single-threaded-how-can-i-exploit-multiple-cpu--cores)
- [为什么 Redis 选择单线程模型](https://draveness.me/whys-the-design-redis-single-thread/)
