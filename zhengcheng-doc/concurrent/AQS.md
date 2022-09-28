# AQS 抽象队列同步器 :hammer:

AQS 的全称为（AbstractQueuedSynchronizer），这个类在java.util.concurrent.locks包下面。

![AQS.awebp](/img/concurrent/AQS.awebp)

## 基本属性：state 双向队列

```java
//头节点
private transient volatile Node head;
//尾节点
private transient volatile Node tail;
//状态值
private volatile int state;
```

AQS的实现依赖内部的同步队列，也就是FIFO的双向队列（双向链表），如果当前线程竞争锁失败，
那么AQS会把当前线程以及等待状态信息构造成一个Node加入到同步队列中，同时再阻塞该线程。
当获取锁的线程释放锁以后，会从队列中唤醒一个阻塞的节点(线程)。

## 独占锁 、 共享锁

1. 独占锁 ： 同一时间只有一个线程能拿到锁执行，锁的状态只有0和1两种情况
   -  ReentrantLock
2. 共享锁 ： 同一时间有多个线程可以拿到锁协同工作，锁的状态大于或等于0
   - CountDownLatch

## 为什么要用双向链表

1. 因为处于锁阻塞的线程允许被中断，被中断的线程是不需要去竞争锁的，但是它仍然存在于双向链表里面。
在后续的锁竞争中，需要把这个节点从链表里面移除，如果是单向列表，就需要从head节点开始往下逐个便利，效率低下。

## CountDownLatch （倒计时器）

CountDownLatch允许 count 个线程去阻塞等待其他线程。实现流程如下：
1. CountDownLatch 是共享锁的一种实现,它默认构造 AQS 的 state 值为 count。当线程使用 countDown() 方法时,其实使用了tryReleaseShared方法以 CAS 的操作来减少 state,直至 state 为 0 。
2. 当调用 await() 方法的时候，如果 state 不为 0，那就证明任务还没有执行完毕，await() 方法就会一直阻塞，也就是说 await() 方法之后的语句不会被执行。
3. 然后，CountDownLatch 会自旋 CAS 判断 state == 0，如果 state == 0 的话，就会释放所有等待的线程，await() 方法之后的语句得到执行。

两种典型的使用场景：
1. 某一线程在开始运行前等待 n 个线程执行完毕
   - 将 CountDownLatch 的计数器初始化为 n （new CountDownLatch(n)），每当一个任务线程执行完毕，就将计数器减 1 （countdownlatch.countDown()），当计数器的值变为 0 时，在 CountDownLatch 上 await() 的线程就会被唤醒。
   - 一个典型应用场景就是启动一个服务时，主线程需要等待多个组件加载完毕，之后再继续执行。
2. 实现多个线程开始执行任务的最大**并行性**。
   - 初始化一个共享的 CountDownLatch 对象，将其计数器初始化为 1 （new CountDownLatch(1)），多个线程在开始执行任务前首先 coundownlatch.await()，当主线程调用 countDown() 时，计数器变为 0，多个线程同时被唤醒。

## CyclicBarrier（循环栅栏）

## ReentrantLock（可重入锁）

## ReentrantReadWriteLock（可重入读写锁）

## 参考文档

- [大白话聊聊Java并发面试问题之谈谈你对AQS的理解？【石杉的架构笔记】](https://juejin.cn/post/6844903732061159437)
