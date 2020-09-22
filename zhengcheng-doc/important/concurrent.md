---
sidebarDepth: 3
---

# JAVA并发包

[[toc]]

## synchronized 关键字

Java语言的关键字，可用来给**对象**和**方法**或者**代码块**加锁，当它锁定一个方法或者一个代码块的时候，同一时刻最多只有一个线程执行这段代码。

### synchronized 修饰范围

![synchronized](/img/concurrent/synchronized.webp)

```java
public class SynchronizedTest {

    //静态方法，锁住的是类对象(SynchronizedTest.class)
    public static synchronized void staticMethod() {
        //...
    }

    //实例方法，锁住的是类的实例对象(this)
    public synchronized void method() {
        //...
    }

    public void methodClass() {
        //同步代码块，锁住的是类对象(SynchronizedTest.class)
        synchronized (SynchronizedTest.class) {
            //...
        }
    }

    public void methodThis() {
        //同步代码块，锁住的是类的实例对象(this)
        synchronized (SynchronizedTest.this) {
            //...
        }
    }

    public void methodObject(Object object) {
        //同步代码块，锁住的是配置的实例对象
        synchronized (object) {
            //...
        }
    }
}
```

1. 当修饰静态方法时，`synchronized`锁定的是整个class对象，即不同线程操作该类的不同实例对象时，只要被`synchronized`修饰的代码都无法同步访问。
2. 当修饰普通方法时，`synchronized`锁定的是具体的一个实例对象，即该类的不同实例对象之间的锁是隔离的，当多个线程操作的实例对象不一样的，可以同时访问相同的被`synchronized`修饰的方法。
3. 当修饰代码块时，锁的粒度取决于`()`里面指定的对象，当`synchronized(SynchronizedTest.class)`时，是和`1`一样的类锁，当`synchronized (SynchronizedTest.this)`时，是和`2`一样的实例对象锁。
4. 代码中没有被`synchronized`修饰的其他方法是不受上诉各种锁的影响的。

**构造方法不能使用`synchronized`关键字修饰，构造方法本身就属于线程安全的，不存在同步的构造方法一说。**

### synchronized 实现原理

关键字：`锁` `ACC_SYNCHRONIZED` `monitor` `MarkWord` `自旋` `CAS` 

对于同步方法，`JVM`采用`ACC_SYNCHRONIZED`标记符来实现同步。 
对于同步代码块,JVM采用`monitor enter`、`monitor exit`两个指令来实现同步。

关于这部分内容，在JVM规范[Synchronization](https://docs.oracle.com/javase/specs/jvms/se8/html/jvms-3.html#jvms-3.14)中也可以找到相关的描述。

Java 6 `synchronized` 的实现方法主要是指重量级锁的实现，即**监视器锁**（`monitor`）是依赖于底层的操作系统的`Mutex Lock`来实现的，而操作系统实现线程之间的切换时需要从用户态转换到核心态，这个状态之间的转换需要相对比较长的时间，时间成本相对较高，效率低下。

所以Java 6 之后，为了减少获得锁和释放锁所带来的性能消耗，引入了**偏向锁**，和**轻量级锁**等。

锁一共有四种状态，级别从低到高依次是：**无锁状态**、**偏向锁状态**、**轻量级锁状态**和**重量级锁状态**，这几个状态随着竞争情况逐渐升级。**为了提高获得锁和释放锁的效率，锁可以升级但不能降级**，意味着偏向锁升级为轻量级锁后不能降级为偏向锁。

其中`偏向锁`、`轻量级锁`不在这里详细阐述，这里重点介绍下它们在获取锁的时使用到的**自旋锁**

自旋锁是指当一个线程尝试获取某个锁时，如果该锁已被其他线程占用，就一直循环检测锁是否被释放，而不是进入线程挂起或睡眠状态。

线程的阻塞和唤醒需要CPU从用户态转为核心态，频繁的阻塞和唤醒显然对CPU来说苦不吭言。其实很多时候，锁状态只持续很短一段时间，为了这段短暂的光阴，频繁去阻塞和唤醒线程肯定不值得。因此**自旋锁**应运而生。

自旋锁适用于锁保护的临界区很小的情况，临界区很小的话，锁占用的时间就很短。

为什么ConcurrentHashMap放弃分段锁(JDK 7)，而使用**CAS自旋方式**(JDK 8)，其实也是这个道理。

## CAS(乐观锁)

`synchronized` 实际上是一种**悲观锁**，这种线程一旦得到锁，其他需要锁的线程就挂起的情况就是**悲观锁**。CAS操作的就是乐观锁，每次不加锁而是假设没有冲突而去完成某项操作，如果因为冲突失败就重试，直到成功为止。

`CAS`是英文单词`Compare And Swap`的缩写，翻译过来就是比较并替换。

`CAS`机制当中使用了3个基本操作数：`内存地址V`，`旧的预期值A`，`要修改的新值B`。

更新一个变量的时候，只有当变量的预期值A和内存地址V当中的实际值相同时，才会将内存地址V对应的值修改为B。

原子操作类，指的是`java.util.concurrent.atomic`包下，一系列以`Atomic`开头的包装类。例如`AtomicBoolean`，`AtomicInteger`，`AtomicLong`。它们分别用于`Boolean`，`Integer`，`Long`类型的原子性操作,而`Atomic`操作的底层实现正是利用的**CAS机制**。

**CAS机制**也是有缺点的，如下几点：
1. CPU开销较大: 在并发量比较高的情况下，如果许多线程反复尝试更新某一个变量，却又一直更新不成功，循环往复，会给CPU带来很大的压力。
2. 不能保证代码块的原子性: CAS机制所保证的只是一个变量的原子性操作，而不能保证整个代码块的原子性。比如需要保证3个变量共同进行原子性的更新，就不得不使用Synchronized了。
3. ABA问题： 就是说从A变成B，然后就变成A，但是并不能说明其他线程并没改变过它，利用CAS就发现不了这种改变。

### ABA 的解决办法

- 在变量前面追加版本号：每次变量更新就把版本号+1。
- `atomic`包下的`AtomicStampedReference`、`AtomicMarkableReference`是JDK中解决**CAS**中**ABA**问题的两种解决方案,他们的原理是相同的，就是添加一个标记来记录更改，两者的区别如下：
  - `AtomicStampedReference` :  利用一个int类型的标记来记录，它能够记录改变的次数。
  - `AtomicMarkableReference`: 利用一个boolean类型的标记来记录，只能记录它改变过，不能记录改变的次数。
  
## Unsafe

查看 `AtomicLong` 实现CAS的源码，它是通过调用`sun.misc.Unsafe`完成**CAS操作**
```java
    // java.util.concurrent.atomic.AtomicLong.class
public class AtomicLong extends Number implements java.io.Serializable {
   
   // ...

   /**
     * Atomically sets the value to the given updated value
     * if the current value {@code ==} the expected value.
     *
     * @param expect the expected value
     * @param update the new value
     * @return {@code true} if successful. False return indicates that
     * the actual value was not equal to the expected value.
     */
    public final boolean compareAndSet(long expect, long update) {
        return unsafe.compareAndSwapLong(this, valueOffset, expect, update);
    }
    
    // ...
}
```

`Unsafe` 是 `sun.misc` 包下的一个类，可以直接操作**堆外内存**，可以随意查看及修改**JVM**中运行时的数据，使`Java`语言拥有了类似`C`语言指针一样操作内存空间的能力。

`Unsafe`的操作粒度不是类，而是内存地址和所对应的数据，增强了`Java`语言操作底层资源的能力。

::: tip 特别提示
Unsafe 功能有很多，我也不是很懂，以后有时间在详细研究一下。
::: 

## volatile 关键字

`volatile` 关键字最重要的两点功能点是：**防止JVM的指令重排**和**保证变量的内存可见性**。

::: warning volatile 实现原理
简单的说当把变量声明为`volatile`时，JVM认为这个变量是共享且不稳定的，每次使用它都到**主存**中进行读取。 

这里重点要理解 **CPU 缓存模型**，具体原理，有机会在深入研究。
:::

### 并发编程的三个重要特性

1. 原子性: 一个的操作或者多次操作，要么所有的操作全部都得到执行并且不会收到任何因素的干扰而中断，要么所有的操作都执行，要么都不执行。`synchronized` 可以保证代码片段的原子性。
2. 可见性：当一个线程对共享变量进行了修改，那么另外的线程都是立即可以看到修改后的最新值。`volatile` 关键字可以保证共享变量的可见性。
3. 有序性：代码在执行的过程中的先后顺序，`Java` 在编译器以及运行期间的优化，代码的执行顺序未必就是编写代码时候的顺序。`volatile` 关键字可以禁止指令进行重排序优化。

### synchronized和volatile的区别

`synchronized` 关键字和 `volatile` 关键字是两个互补的存在，而不是对立的存在！

- `volatile` 关键字主要用于解决**变量**在多个线程之间的可见性，而`synchronized`关键字解决的是多个线程之间访问资源的同步性。
- `volatile`关键字是线程同步的轻量级实现，所以 `volatile` 性能肯定比 `synchronized` 关键字要好。但是 `volatile` 关键字只能用于变量而 `synchronized` 关键字可以修饰方法以及代码块。
- `volatile` 关键字能保证数据的可见性，但不能保证数据的原子性。`synchronized` 关键字两者都能保证。

## ThreadLocal

关键词: `线程局部变量` `ThreadLocalMap`

```java
/**
 * This class provides thread-local variables.  These variables differ from
 * their normal counterparts in that each thread that accesses one (via its
 * {@code get} or {@code set} method) has its own, independently initialized
 * copy of the variable.  {@code ThreadLocal} instances are typically private
 * static fields in classes that wish to associate state with a thread (e.g.,
 * a user ID or Transaction ID).
 *
 * <p>For example, the class below generates unique identifiers local to each
 * thread.
 * A thread's id is assigned the first time it invokes {@code ThreadId.get()}
 * and remains unchanged on subsequent calls.
 * <pre>
 * import java.util.concurrent.atomic.AtomicInteger;
 *
 * public class ThreadId {
 *     // Atomic integer containing the next thread ID to be assigned
 *     private static final AtomicInteger nextId = new AtomicInteger(0);
 *
 *     // Thread local variable containing each thread's ID
 *     private static final ThreadLocal&lt;Integer&gt; threadId =
 *         new ThreadLocal&lt;Integer&gt;() {
 *             &#64;Override protected Integer initialValue() {
 *                 return nextId.getAndIncrement();
 *         }
 *     };
 *
 *     // Returns the current thread's unique ID, assigning it if necessary
 *     public static int get() {
 *         return threadId.get();
 *     }
 * }
 * </pre>
 * <p>Each thread holds an implicit reference to its copy of a thread-local
 * variable as long as the thread is alive and the {@code ThreadLocal}
 * instance is accessible; after a thread goes away, all of its copies of
 * thread-local instances are subject to garbage collection (unless other
 * references to these copies exist).
 *
 * @author  Josh Bloch and Doug Lea
 * @since   1.2
 */
```

### ThreadLocalMap

```java
    /**
     * ThreadLocalMap is a customized hash map suitable only for
     * maintaining thread local values. No operations are exported
     * outside of the ThreadLocal class. The class is package private to
     * allow declaration of fields in class Thread.  To help deal with
     * very large and long-lived usages, the hash table entries use
     * WeakReferences for keys. However, since reference queues are not
     * used, stale entries are guaranteed to be removed only when
     * the table starts running out of space.
     */
```

::: warning ThreadLocal 的实现原理
  后续会结合日常使用的实例，来详细研究`ThreadLocal`的实现原理
:::

### ThreadLocal 内存泄露问题

`ThreadLocalMap` 中使用的`key`为`ThreadLocal`的弱引用,而`value`是强引用。所以，如果`ThreadLocal`没有被外部强引用的情况下，在垃圾回收的时候`key`会被清理掉，而`value`不会被清理掉。这样一来，`ThreadLocalMap`中就会出现`key`为`null`的`Entry`。假如我们不做任何措施的话`value`永远无法被`GC`回收，这个时候就可能会产生内存泄露。

`ThreadLocalMap` 实现中已经考虑了这种情况，在调用 `set()`、`get()`、`remove()` 方法的时候，会清理掉 `key` 为 `null` 的记录。**使用完 `ThreadLocal`方法后,手动调用`remove()`方法**

## 线程池

### ThreadPoolExecutor 构造函数重要参数分析

ThreadPoolExecutor 3 个最重要的参数：
- corePoolSize : 核心线程数线程数定义了最小可以同时运行的线程数量。
- maximumPoolSize : 当队列中存放的任务达到队列容量的时候，当前可以同时运行的线程数量变为最大线程数。
- workQueue: 当新任务来的时候会先判断当前运行的线程数量是否达到核心线程数，如果达到的话，新任务就会被存放在队列中。

ThreadPoolExecutor其他常见参数:
- keepAliveTime:当线程池中的线程数量大于 corePoolSize 的时候，如果这时没有新的任务提交，核心线程外的线程不会立即销毁，而是会等待，直到等待的时间超过了 keepAliveTime才会被回收销毁；
- unit : keepAliveTime 参数的时间单位。
- threadFactory :executor 创建新线程的时候会用到。
- handler :饱和策略。

### 如何创建线程池

`Executors` 返回线程池对象的弊端如下：

- `FixedThreadPool` 和 `SingleThreadExecutor` ： **允许请求的队列长度为** ` Integer.MAX_VALUE` ，可能**堆积大量的请求**，从而导致 `OOM`。
- `CachedThreadPool` ： **允许创建的线程数量为** `Integer.MAX_VALUE` ，可能会**创建大量线程**，从而导致 `OOM`。

### 线程池原理分析

![thread-pool.png](/img/concurrent/thread-pool.png)

 