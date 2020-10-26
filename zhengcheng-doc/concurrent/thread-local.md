# ThreadLocal

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

## ThreadLocalMap

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

## 内存泄露问题

`ThreadLocalMap` 中使用的`key`为`ThreadLocal`的弱引用,而`value`是强引用。所以，如果`ThreadLocal`没有被外部强引用的情况下，在垃圾回收的时候`key`会被清理掉，而`value`不会被清理掉。这样一来，`ThreadLocalMap`中就会出现`key`为`null`的`Entry`。假如我们不做任何措施的话`value`永远无法被`GC`回收，这个时候就可能会产生内存泄露。

`ThreadLocalMap` 实现中已经考虑了这种情况，在调用 `set()`、`get()`、`remove()` 方法的时候，会清理掉 `key` 为 `null` 的记录。**使用完 `ThreadLocal`方法后,手动调用`remove()`方法**

- `SimpleDateFormat` 是线程不安全的类，一般不要定义为 `static` 变量，如果定义为
`static`，必须加锁，或者使用 `DateUtils` 工具类。
正例： 注意线程安全，使用 `DateUtils`。亦推荐如下处理：
```java
private static final ThreadLocal<DateFormat> df = new ThreadLocal<DateFormat>() {
    @Override
    protected DateFormat initialValue() {
        return new SimpleDateFormat("yyyy-MM-dd");
    }
};
```
> 说明： 如果是 `JDK8` 的应用，可以使用 `Instant` 代替 `Date`， `LocalDateTime` 代替 `Calendar`，
`DateTimeFormatter` 代替 `SimpleDateFormat`，官方给出的解释： `simple beautiful strong immutable
thread-safe`。
- 必须回收自定义的 `ThreadLocal` 变量，尤其在线程池场景下，线程经常会被复用，
如果不清理自定义的 `ThreadLocal` 变量，可能会影响后续业务逻辑和造成内存泄露等问题。
尽量在代理中使用 `try-finally` 块进行回收。
正例：
```java
  objectThreadLocal.set(userInfo);
    try {
    // ...
    } finally {
    objectThreadLocal.remove();
    }
```