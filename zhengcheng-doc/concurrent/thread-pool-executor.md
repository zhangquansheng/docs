# ThreadPoolExecutor（线程池）

`ThreadPoolExecutor`提供了四个构造方法
![thread-pool-executor-constructor](/img/concurrent/thread-pool-executor-constructor.webp)

序号 | 属性 | 类型 | 含义
---|---|---|---
1 | corePoolSize | int | 核心线程数线程数定义了最小可以同时运行的线程数量。
2 | maximumPoolSize | int | 核心线程数线程数定义了最小可以同时运行的线程数量。
3 | workQueue | BlockingQueue | 当新任务来的时候会先判断当前运行的线程数量是否达到核心线程数，如果达到的话，新任务就会被存放在队列中。
4 | keepAliveTime | long | 当线程池中的线程数量大于 `corePoolSize` 的时候，如果这时没有新的任务提交，核心线程外的线程不会立即销毁，而是会等待，直到等待的时间超过了`keepAliveTime`才会被回收销毁；
5 | unit | TimeUnit | keepAliveTime 参数的时间单位。
6 | threadFactory | int | executor 创建新线程的时候会用到。
7 | handler | int | 饱和策略。
