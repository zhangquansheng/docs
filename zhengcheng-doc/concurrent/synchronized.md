# synchronized

Java语言的关键字，可用来给**对象**和**方法**或者**代码块**加锁，当它锁定一个方法或者一个代码块的时候，同一时刻最多只有一个线程执行这段代码。

## 修饰范围

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

## 实现原理

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

为什么`ConcurrentHashMap`放弃分段锁(JDK 7)，而使用**CAS自旋方式**(JDK 8)，其实也是这个道理。