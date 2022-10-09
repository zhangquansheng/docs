# CAS 乐观锁 :hammer:

`synchronized` 实际上是一种**悲观锁**，这种线程一旦得到锁，其他需要锁的线程就挂起的情况就是**悲观锁**。`CAS`操作的就是乐观锁，每次不加锁而是假设没有冲突而去完成某项操作，如果因为冲突失败就重试，直到成功为止。

`CAS`是英文单词`Compare And Swap`的缩写，翻译过来就是比较并替换。

`CAS`机制当中使用了3个基本操作数：`内存地址V`，`旧的预期值A`，`要修改的新值B`。

更新一个变量的时候，只有当变量的预期值A和内存地址V当中的实际值相同时，才会将内存地址V对应的值修改为B。

原子操作类，指的是`java.util.concurrent.atomic`包下，一系列以`Atomic`开头的包装类。例如`AtomicBoolean`，`AtomicInteger`，`AtomicLong`。它们分别用于`Boolean`，`Integer`，`Long`类型的原子性操作,而`Atomic`操作的底层实现正是利用的**CAS机制**。

**CAS机制** 也是有缺点的，如下几点：
1. `CPU`开销较大: 在并发量比较高的情况下，如果许多线程反复尝试更新某一个变量，却又一直更新不成功，循环往复，会给`CPU`带来很大的压力。
2. 不能保证代码块的原子性: `CAS`机制所保证的只是一个变量的原子性操作，而不能保证整个代码块的原子性。比如需要保证`3`个变量共同进行原子性的更新，就不得不使用`synchronized`了。
3. `ABA`问题： 就是说从`A`变成`B`，然后就变成`A`，但是并不能说明其他线程并没改变过它，利用`CAS`就发现不了这种改变。

## ABA 的解决办法

- 在变量前面追加版本号：每次变量更新就把版本号`+1`。
- `atomic`包下的`AtomicStampedReference`、`AtomicMarkableReference`是`JDK`中解决**CAS**中**ABA**问题的两种解决方案,他们的原理是相同的，就是添加一个标记来记录更改，两者的区别如下：
  - `AtomicStampedReference` :  利用一个int类型的标记来记录，它能够记录改变的次数。
  - `AtomicMarkableReference`: 利用一个boolean类型的标记来记录，只能记录它改变过，不能记录改变的次数。
  
## Unsafe

查看 `AtomicLong` 实现CAS的源码，它是通过调用`sun.misc.Unsafe`完成 **CAS操作**
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
