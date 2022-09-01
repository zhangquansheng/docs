# ThreadPoolExecutor 线程池 :tada:

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

## keepAliveTime 的作用

- 非核心线程在空闲状态下，超过`keepAliveTime`时间，就会被回收；
- 如果核心线程设置了`allowCoreThreadTimeOut(true)`的话（默认设置`false`），那么在空闲时，超过`keepAliveTime`时间，也会被回收；

ThreadPoolExecutor#getTask()
```java
private Runnable getTask() {
        boolean timedOut = false; // Did the last poll() time out?

        for (;;) {//自旋
            int c = ctl.get();
            int rs = runStateOf(c);
            /** 对线程池状态的判断，两种情况会 workerCount-1，并且返回 null
             1. 线程池状态为 shutdown，且 workQueue 为空（反映了 shutdown 状态的线程池还是
            要执行 workQueue 中剩余的任务的）
             2. 线程池状态为 stop（shutdownNow()会导致变成 STOP）（此时不用考虑 workQueue
            的情况）
            **/

            // Check if queue empty only if necessary.
            if (rs >= SHUTDOWN && (rs >= STOP || workQueue.isEmpty())) {
                decrementWorkerCount();
                return null;;//返回 null，则当前 worker 线程会退出
            }

            int wc = workerCountOf(c);

            // timed 变量用于判断是否需要进行超时控制。
            // allowCoreThreadTimeOut 默认是 false，也就是核心线程不允许进行超时；
            // wc > corePoolSize，表示当前线程池中的线程数量大于核心线程数量；
            // 对于超过核心线程数量的这些线程，需要进行超时控制
            // Are workers subject to culling?
            boolean timed = allowCoreThreadTimeOut || wc > corePoolSize;

            /**
              1. 线程数量超过 maximumPoolSize 可能是线程池在运行时被调用了 setMaximumPoolSize()
              被改变了大小，否则已经 addWorker()成功不会超过 maximumPoolSize
              2. timed && timedOut 如果为 true，表示当前操作需要进行超时控制，并且上次从阻塞队列中
              获取任务发生了超时.其实就是体现了空闲线程的存活时间
            **/
            if ((wc > maximumPoolSize || (timed && timedOut))
                && (wc > 1 || workQueue.isEmpty())) {
                if (compareAndDecrementWorkerCount(c))
                    return null;
                continue;
            }

            try {
            /**
            根据 timed 来判断，如果为 true，则通过阻塞队列 poll 方法进行超时控制，如果在
            keepaliveTime 时间内没有获取到任务，则返回 null.
            否则通过 take 方法阻塞式获取队列中的任务
            **/
                Runnable r = timed ?
                    workQueue.poll(keepAliveTime, TimeUnit.NANOSECONDS) :
                    workQueue.take();
                if (r != null) //如果拿到的任务不为空，则直接返回给 worker 进行处理
                    return r;
                timedOut = true;// 如果 r==null，说明已经超时了,队列中仍然没有任务，此时设置timedOut=true，在下次自旋的时候进行回收

            } catch (InterruptedException retry) {
            // 如果获取任务时当前线程发生了中断，则设置 timedOut 为false 并返回循环重试
                timedOut = false;
            }
        }
    }
```

## workQueue

用于保存等待执行任务的阻塞队列
1. **ArrayBlockingQueue**：是一个基于数组结构的有界阻塞队列，此队列按 FIFO（先进先出）原则对元素进行排序。
2. **LinkedBlockingQueue**：一个基于链表结构的阻塞队列，此队列按FIFO （先进先出） 排序元素，吞吐量通常要高于`ArrayBlockingQueue`。静态工厂方法Executors.newFixedThreadPool()使用了这个队列
3. **SynchronousQueue**：一个不存储元素的阻塞队列。每个插入操作必须等到另一个线程调用移除操作，否则插入操作一直处于阻塞状态，吞吐量通常要高于`LinkedBlockingQueue`，静态工厂方法Executors.newCachedThreadPool使用了这个队列。
4. **PriorityBlockingQueue**：一个具有优先级的无限阻塞队列。

## execute() & submit() 的区别

没有引用线程池的时候，需要我们通过**继承Thread类**和**实现Runnable、Callable接口**，最终调用`start()`方法启动线程

在线程池中，提交线程的方法有以下两种，源码如下：
```java
// ExecutorService.java 接口
   <T> Future<T> submit(Callable<T> task);

   <T> Future<T> submit(Runnable task, T result);

// ThreadPoolTaskExecutor.java
```

```java
// Executor.java 接口
 void execute(Runnable command);

// ThreadPoolTaskExecutor.java
```

1. submit() 可以提交 Runnable 类型的任务、Callable 类型的任务 ，execute() 可以提交 Runnable 类型的任务
2. submit() 有返回值，execute() 没有返回值，可以通过 Future 的 get()获取返回值

**参考文档**
- 《Java 并发编程的艺术》