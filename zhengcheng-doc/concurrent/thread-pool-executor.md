# ThreadPoolExecutor 线程池

## UML

![ThreadPoolExecutor](/img/concurrent/ThreadPoolExecutor.png)

## 参数说明

`ThreadPoolExecutor` 提供了四个构造方法
![thread-pool-executor-constructor](/img/concurrent/thread-pool-executor-constructor.webp)

这里以最后一个构造方法（参数最多的那个），对其参数进行解释：
```java
/**
 * Creates a new {@code ThreadPoolExecutor} with the given initial
 * parameters.
 *
 * @param corePoolSize the number of threads to keep in the pool, even
 *        if they are idle, unless {@code allowCoreThreadTimeOut} is set
 * @param maximumPoolSize the maximum number of threads to allow in the
 *        pool
 * @param keepAliveTime when the number of threads is greater than
 *        the core, this is the maximum time that excess idle threads
 *        will wait for new tasks before terminating.
 * @param unit the time unit for the {@code keepAliveTime} argument
 * @param workQueue the queue to use for holding tasks before they are
 *        executed.  This queue will hold only the {@code Runnable}
 *        tasks submitted by the {@code execute} method.
 * @param threadFactory the factory to use when the executor
 *        creates a new thread
 * @param handler the handler to use when execution is blocked
 *        because the thread bounds and queue capacities are reached
 * @throws IllegalArgumentException if one of the following holds:<br>
 *         {@code corePoolSize < 0}<br>
 *         {@code keepAliveTime < 0}<br>
 *         {@code maximumPoolSize <= 0}<br>
 *         {@code maximumPoolSize < corePoolSize}
 * @throws NullPointerException if {@code workQueue}
 *         or {@code threadFactory} or {@code handler} is null
 */
public ThreadPoolExecutor(int corePoolSize,
                          int maximumPoolSize,
                          long keepAliveTime,
                          TimeUnit unit,
                          BlockingQueue<Runnable> workQueue,
                          ThreadFactory threadFactory,
                          RejectedExecutionHandler handler) {
    if (corePoolSize < 0 ||
        maximumPoolSize <= 0 ||
        maximumPoolSize < corePoolSize ||
        keepAliveTime < 0)
        throw new IllegalArgumentException();
    if (workQueue == null || threadFactory == null || handler == null)
        throw new NullPointerException();
    this.acc = System.getSecurityManager() == null ?
            null :
            AccessController.getContext();
    this.corePoolSize = corePoolSize;
    this.maximumPoolSize = maximumPoolSize;
    this.workQueue = workQueue;
    this.keepAliveTime = unit.toNanos(keepAliveTime);
    this.threadFactory = threadFactory;
    this.handler = handler;
}
```

序号 | 属性 | 类型 | 含义
---|---|---|---
1 | corePoolSize | int | 核心线程数线程数定义了最小可以同时运行的线程数量。
2 | maximumPoolSize | int | 线程池中允许的最大线程数，线程池中的当前线程数目不会超过该值。
3 | workQueue | BlockingQueue | 当新任务来的时候会先判断当前运行的线程数量是否达到核心线程数，如果达到的话，新任务就会被存放在队列中。
4 | keepAliveTime | long | 当线程池中的线程数量大于 `corePoolSize` 的时候，如果这时没有新的任务提交，核心线程外的线程不会立即销毁，而是会等待，直到等待的时间超过了`keepAliveTime`才会被回收销毁；
5 | unit | TimeUnit | keepAliveTime 参数的时间单位。
6 | threadFactory | int | executor 创建新线程的时候会用到。
7 | handler | int | 饱和策略。

`handler`的饱和（拒绝）策略
1. `AbortPolicy`: 不执行新任务，直接抛出异常，提示线程池已满
2. `DisCardPolicy`: 不执行新任务，也不抛出异常
3. `DisCardOldSetPolicy`: 将消息队列中的第一个任务替换为当前新进来的任务执行
4. `CallerRunsPolicy`: 直接调用`execute`来执行当前任务

## 实现原理

![thread-pool.png](/img/concurrent/thread-pool.png)

## 阿里Java编程规范

2. 【强制】创建线程或线程池时请指定有意义的线程名称，方便出错时回溯。
> 正例：自定义线程工厂，并且根据外部特征进行分组，比如，来自同一机房的调用，把机房编号赋值给`whatFeatureOfGroup`
```java
public class UserThreadFactory implements ThreadFactory {
    private final String namePrefix;
    private final AtomicInteger nextId = new AtomicInteger(1);
    
    // 定义线程组名称，在利用 jstack 来排查问题时，非常有帮助
    UserThreadFactory(String whatFeatureOfGroup) {
        namePrefix = "From UserThreadFactory's " + whatFeatureOfGroup + "-Worker-";
    }

    @Override
    public Thread newThread(Runnable task) {
        String name = namePrefix + nextId.getAndIncrement();
        Thread thread = new Thread(null, task, name, 0, false);
        System.out.println(thread.getName());
        return thread;
    }
}
```

3. 【强制】线程资源必须通过线程池提供，不允许在应用中自行显式创建线程。
> 线程池的好处是减少在创建和销毁线程上所消耗的时间以及系统资源的开销，解决资源不足的问题。如果不使用线程池，有可能造成系统创建大量同类线程而导致消耗完内存或者“过度切换”的问题。

4. 【强制】线程池不允许使用`Executors`去创建，而是通过`ThreadPoolExecutor`的方式，这样的处理方式让写的同学更加明确线程池的运行规则，规避资源耗尽的风险。
> 说明：`Executors` 返回的线程池对象的弊端如下：
> - 1） `FixedThreadPool` 和 `SingleThreadPool`：允许的请求队列长度为 `Integer.MAX_VALUE`，可能会堆积大量的请求，从而导致`OOM`。
> - 2） `CachedThreadPool`：允许的创建线程数量为` Integer.MAX_VALUE`，可能会创建大量的线程，从而导致`OOM`。

**参考文档**
- 《Java 并发编程的艺术》