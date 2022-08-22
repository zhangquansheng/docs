# ConcurrentHashMap 

- `JDK1.7`中是采用`Segment` + `HashEntry` + `ReentrantLock`的方式进行实现的。
- `JDK1.8`中是采用`自旋锁` + [CAS](../concurrent/cas) + `synchronized`来保证并发安全进行实现。

本次源码解析基于`JDK1.8`。

## put() 
```java
public V put(K key, V value) {
    return putVal(key, value, false);
}

final V putVal(K key, V value, boolean onlyIfAbsent) {
    // HashMap 是可以存在null值，但是 ConcurrentHashMap 不允许存在null，会直接抛出NPE
    if (key == null || value == null) throw new NullPointerException();
    // 根据key获取hash值
    int hash = spread(key.hashCode());
    int binCount = 0;
    for (Node<K,V>[] tab = table;;) {
        Node<K,V> f; int n, i, fh;
        // 如果tab为空，那么初始化数组
        if (tab == null || (n = tab.length) == 0)
            tab = initTable();
        // 通过key的hash值判断数组中的位置是否为null
        else if ((f = tabAt(tab, i = (n - 1) & hash)) == null) {
            // 通过CAS写入数据
            if (casTabAt(tab, i, null,
                         new Node<K,V>(hash, key, value, null)))
                break;                   // no lock when adding to empty bin
        }
        // 如果位置的节点不是null，而且节点的hash为MOVED（-1），则表示数组正在扩容，则去尝试帮助扩容数组
        else if ((fh = f.hash) == MOVED)
            tab = helpTransfer(tab, f);
        else {
            V oldVal = null;
            // 通过 synchronized 锁住头节点
            synchronized (f) {
                // 判断是否头节点
                if (tabAt(tab, i) == f) {
                    // 判断是否链表节点
                    if (fh >= 0) {
                        binCount = 1;
                        // 从头节点向后遍历
                        for (Node<K,V> e = f;; ++binCount) {
                            K ek;
                            // 如果节点的key和待插入的key相同，则覆盖value的值
                            if (e.hash == hash &&
                                ((ek = e.key) == key ||
                                 (ek != null && key.equals(ek)))) {
                                oldVal = e.val;
                                if (!onlyIfAbsent)
                                    e.val = value;
                                break;
                            }
                            Node<K,V> pred = e;
                            // 直到遍历到最后没有发现key相同的，则把新的数据插入链表尾部（jdk8采用的是尾插法）
                            if ((e = e.next) == null) {
                                pred.next = new Node<K,V>(hash, key,
                                                          value, null);
                                break;
                            }
                        }
                    }
                    // 判断当前节点是否是红黑树节点
                    else if (f instanceof TreeBin) {
                        Node<K,V> p;
                        binCount = 2;
                        // 返回key相同的节点或者新增红黑树节点
                        if ((p = ((TreeBin<K,V>)f).putTreeVal(hash, key,
                                                       value)) != null) {
                            oldVal = p.val;
                            if (!onlyIfAbsent)
                                p.val = value;
                        }
                    }
                }
            }
            if (binCount != 0) {
                // 判断链表长度是否大于8
                if (binCount >= TREEIFY_THRESHOLD)
                    // 链表转红黑树
                    treeifyBin(tab, i);
                if (oldVal != null)
                    return oldVal;
                break;
            }
        }
    }
    // 增加键值对数量
    addCount(1L, binCount);
    return null;
}
```

1. 如果`key`是空值或者`value`是空值，那么直接抛出`NPE`；
2. 判断数组是否已经初始化，如果未初始化，会先去初始化数组；
3. 如果当前要插入的节点位置为`null`，则尝试使用`CAS`插入数据；
4. 如果要插入的节点位置不为`null`，则判断节点`hash`值是否为`-1`，`-1`表示数组正在扩容，会先去协助扩容，在回来继续插入数据；
5. 使用`synchronized`锁住头节点，插入数据，最后判断是否需要返回旧值，如果不是覆盖旧值，需要更新`map`中的节点数，也就是执行`addCount`方法；

::: tip 为什么 ConcurrentHashMap  不允许存在 null ？
首先我们知道，`HashMap` 是可以存在`null`值，但是 `ConcurrentHashMap` 不允许存在`null`，会直接抛出`NPE`。
如果允许`value`空值，那么`get`方法返回`null`时存在两种情况：一、未找到`key`，二、找到了`key`但是`value`为`null`；
当`get`方法返回`null`时无法判断是那种情况，在并发的环境下`containsKey`方法不可靠。当然可以通过逻辑处理来允许`key`空值，
但这样占用数组空间，且并没有多大的实用价值。
:::

## get()
```java
public V get(Object key) {
    Node<K,V>[] tab; Node<K,V> e, p; int n, eh; K ek;
     int h = spread(key.hashCode());
     if ((tab = table) != null && (n = tab.length) > 0 &&
         (e = tabAt(tab, (n - 1) & h)) != null) {
         if ((eh = e.hash) == h) {
             if ((ek = e.key) == key || (ek != null && key.equals(ek)))
                 return e.val;
         }
         else if (eh < 0)
             return (p = e.find(h, key)) != null ? p.val : null;
         while ((e = e.next) != null) {
             if (e.hash == h &&
                 ((ek = e.key) == key || (ek != null && key.equals(ek))))
                 return e.val;
         }
     }
     return null;
 }
```

## initTable()
```java
private final Node<K,V>[] initTable() {
    Node<K,V>[] tab; int sc;
    // 自旋锁
    while ((tab = table) == null || tab.length == 0) {
        // sizeCtl 默认为0，-1表示正在初始化，<-1表示有多少个线程正在帮助扩容，>0表示阈值
        if ((sc = sizeCtl) < 0)
            Thread.yield(); // 让出cpu执行时间
        // 通过CAS 设置 sc 为 -1，表示获取到自旋锁，其他的线程则无法进入初始化，自旋等待
        else if (U.compareAndSwapInt(this, SIZECTL, sc, -1)) {
            try {
                // 在一次判断自旋条件
                if ((tab = table) == null || tab.length == 0) {
                    int n = (sc > 0) ? sc : DEFAULT_CAPACITY;
                    @SuppressWarnings("unchecked")
                    Node<K,V>[] nt = (Node<K,V>[])new Node<?,?>[n];
                    table = tab = nt;
                    // 设置sc 为阈值，位运算，n>>>2表示1/4*n，也就相当于0.75n
                    sc = n - (n >>> 2);
                }
            } finally {
                // 把sc赋值给sizeCtl
                sizeCtl = sc;
            }
            break;
        }
    }
    return tab;
}
```

初始化的重点是：**保证多个线程并发调用此方法，且只有一个线程成功，采用`CAS`+自旋的方法解决并发的问题。**

总结如下：
1. 首先判断数组是否为`null`，如果不为`null`，说明另一个线程初始化结束，直接返回该数组；
2. 判断是否正在初始化，如果是，则会让出`cpu`执行时间，当前线程自旋等待；
3. 如果数组为`null`，且没有另外的线程正在初始化，那么会尝试获取自旋锁，获取成功则进行初始化，获取失败则表示发生并发冲突，继续循环`1`,`2`；


## addCount()
```java
private final void addCount(long x, int check) {
    CounterCell[] as; long b, s;
    if ((as = counterCells) != null ||
        !U.compareAndSwapLong(this, BASECOUNT, b = baseCount, s = b + x)) {
        CounterCell a; long v; int m;
        boolean uncontended = true;
        if (as == null || (m = as.length - 1) < 0 ||
            (a = as[ThreadLocalRandom.getProbe() & m]) == null ||
            !(uncontended =
              U.compareAndSwapLong(a, CELLVALUE, v = a.value, v + x))) {
            fullAddCount(x, uncontended);
            return;
        }
        if (check <= 1)
            return;
        s = sumCount();
    }
    if (check >= 0) {
        Node<K,V>[] tab, nt; int n, sc;
        while (s >= (long)(sc = sizeCtl) && (tab = table) != null &&
               (n = tab.length) < MAXIMUM_CAPACITY) {
            int rs = resizeStamp(n);
            if (sc < 0) {
                if ((sc >>> RESIZE_STAMP_SHIFT) != rs || sc == rs + 1 ||
                    sc == rs + MAX_RESIZERS || (nt = nextTable) == null ||
                    transferIndex <= 0)
                    break;
                if (U.compareAndSwapInt(this, SIZECTL, sc, sc + 1))
                    transfer(tab, nt);
            }
            else if (U.compareAndSwapInt(this, SIZECTL, sc,
                                         (rs << RESIZE_STAMP_SHIFT) + 2))
                transfer(tab, null);
            s = sumCount();
        }
    }
}
```

## fullAddCount()
```java
private final void fullAddCount(long x, boolean wasUncontended) {
    int h;
    if ((h = ThreadLocalRandom.getProbe()) == 0) {
        ThreadLocalRandom.localInit();      // force initialization
        h = ThreadLocalRandom.getProbe();
        wasUncontended = true;
    }
    boolean collide = false;                // True if last slot nonempty
    for (;;) {
        CounterCell[] as; CounterCell a; int n; long v;
        if ((as = counterCells) != null && (n = as.length) > 0) {
            if ((a = as[(n - 1) & h]) == null) {
                if (cellsBusy == 0) {            // Try to attach new Cell
                    CounterCell r = new CounterCell(x); // Optimistic create
                    if (cellsBusy == 0 &&
                        U.compareAndSwapInt(this, CELLSBUSY, 0, 1)) {
                        boolean created = false;
                        try {               // Recheck under lock
                            CounterCell[] rs; int m, j;
                            if ((rs = counterCells) != null &&
                                (m = rs.length) > 0 &&
                                rs[j = (m - 1) & h] == null) {
                                rs[j] = r;
                                created = true;
                            }
                        } finally {
                            cellsBusy = 0;
                        }
                        if (created)
                            break;
                        continue;           // Slot is now non-empty
                    }
                }
                collide = false;
            }
            else if (!wasUncontended)       // CAS already known to fail
                wasUncontended = true;      // Continue after rehash
            else if (U.compareAndSwapLong(a, CELLVALUE, v = a.value, v + x))
                break;
            else if (counterCells != as || n >= NCPU)
                collide = false;            // At max size or stale
            else if (!collide)
                collide = true;
            else if (cellsBusy == 0 &&
                     U.compareAndSwapInt(this, CELLSBUSY, 0, 1)) {
                try {
                    if (counterCells == as) {// Expand table unless stale
                        CounterCell[] rs = new CounterCell[n << 1];
                        for (int i = 0; i < n; ++i)
                            rs[i] = as[i];
                        counterCells = rs;
                    }
                } finally {
                    cellsBusy = 0;
                }
                collide = false;
                continue;                   // Retry with expanded table
            }
            h = ThreadLocalRandom.advanceProbe(h);
        }
        else if (cellsBusy == 0 && counterCells == as &&
                 U.compareAndSwapInt(this, CELLSBUSY, 0, 1)) {
            boolean init = false;
            try {                           // Initialize table
                if (counterCells == as) {
                    CounterCell[] rs = new CounterCell[2];
                    rs[h & 1] = new CounterCell(x);
                    counterCells = rs;
                    init = true;
                }
            } finally {
                cellsBusy = 0;
            }
            if (init)
                break;
        }
        else if (U.compareAndSwapLong(this, BASECOUNT, v = baseCount, v + x))
            break;                          // Fall back on using base
    }
}
```

`ConcurrentHashMap`的`size`变量并不是一个单独的，它把`size`进行了拆分，好处是每个线程可以单独修改对应的`size`变量；多个线程可以同时进行自增操作，
且完全没有任何的性能消耗；当需要获取节点总数时，只需要把全部加起来即可。在`ConcurrentHashMap`中，每个`size`被用一个`CounterCell`表示。

## CounterCell 类
```java
@sun.misc.Contended static final class CounterCell {
    volatile long value;
    CounterCell(long x) { value = x; }
}
```
只是对`value`值使用`volatile`关键字进行修饰，保证当前线程对`value`的修改后，其他的线程马上可以知道。

## 总结
**《java编程思想》中提到，对于并发问题，如果不是专家，老老实实上个锁，不要整这些花里胡哨的。**

