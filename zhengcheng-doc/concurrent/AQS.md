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

## 参考文档

- [大白话聊聊Java并发面试问题之谈谈你对AQS的理解？【石杉的架构笔记】](https://juejin.cn/post/6844903732061159437)
