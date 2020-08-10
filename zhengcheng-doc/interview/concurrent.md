# 并发包 java.util.concurrent

## CAS

关键字：`比较与交换` `ABA` 

CAS，全称Compare And Swap（比较与交换），解决多线程并行情况下使用锁造成性能损耗的一种机制。

实现思想 CAS（V, A, B），V为内存地址、A为预期原值，B为新值。如果内存地址的值与预期原值相匹配，那么将该位置值更新为新值。否则，说明已经被其他线程更新，处理器不做任何操作；无论哪种情况，它都会在 CAS 指令之前返回该位置的值。而我们可以使用自旋锁，循环CAS，重新读取该变量再尝试再次修改该变量，也可以放弃操作。

### 缺点：

1. ABA问题。当第一个线程执行CAS操作，尚未修改为新值之前，内存中的值已经被其他线程连续修改了两次，使得变量值经历 A -> B -> A的过程。
> 解决方案：添加版本号作为标识，每次修改变量值时，对应增加版本号； 做CAS操作前需要校验版本号。JDK1.5之后，新增AtomicStampedReference类来处理这种情况。
2. 循环时间长开销大。如果有很多个线程并发，CAS自旋可能会长时间不成功，会增大CPU的执行开销。
3. 只能对一个变量进原子操作。JDK1.5之后，新增AtomicReference类来处理这种情况，可以将多个变量放到一个对象中。


## ConcurrentHashMap
   
### 存储结构
   
- JDK1.7 : `Segment 数组 + HashEntry 数组 + 链表`
- JDK1.8 :  `Node 数组 + 链表 / 红黑树`

### 初始化 initTable

```java
 /**
     * Initializes table, using the size recorded in sizeCtl.
     */
    private final Node<K,V>[] initTable() {
        Node<K,V>[] tab; int sc;
        while ((tab = table) == null || tab.length == 0) {
            if ((sc = sizeCtl) < 0)
                Thread.yield(); // lost initialization race; just spin
            else if (U.compareAndSwapInt(this, SIZECTL, sc, -1)) {
                try {
                    if ((tab = table) == null || tab.length == 0) {
                        int n = (sc > 0) ? sc : DEFAULT_CAPACITY;
                        @SuppressWarnings("unchecked")
                        Node<K,V>[] nt = (Node<K,V>[])new Node<?,?>[n];
                        table = tab = nt;
                        sc = n - (n >>> 2);
                    }
                } finally {
                    sizeCtl = sc;
                }
                break;
            }
        }
        return tab;
    }
```

初始化是通过**自旋和CAS**操作完成的。里面需要注意的是变量 sizeCtl ，它的值决定着当前的初始化状态。

```java
    /**
     * Table initialization and resizing control.  When negative, the
     * table is being initialized or resized: -1 for initialization,
     * else -(1 + the number of active resizing threads).  Otherwise,
     * when table is null, holds the initial table size to use upon
     * creation, or 0 for default. After initialization, holds the
     * next element count value upon which to resize the table.
     */
    private transient volatile int sizeCtl;
```

