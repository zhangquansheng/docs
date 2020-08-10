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

### put
```java
/**
     * Maps the specified key to the specified value in this table.
     * Neither the key nor the value can be null.
     *
     * <p>The value can be retrieved by calling the {@code get} method
     * with a key that is equal to the original key.
     *
     * @param key key with which the specified value is to be associated
     * @param value value to be associated with the specified key
     * @return the previous value associated with {@code key}, or
     *         {@code null} if there was no mapping for {@code key}
     * @throws NullPointerException if the specified key or value is null
     */
    public V put(K key, V value) {
        return putVal(key, value, false);
    }

    /** Implementation for put and putIfAbsent */
    final V putVal(K key, V value, boolean onlyIfAbsent) {
        if (key == null || value == null) throw new NullPointerException();
        int hash = spread(key.hashCode());
        int binCount = 0;
        for (Node<K,V>[] tab = table;;) {
            Node<K,V> f; int n, i, fh;
            if (tab == null || (n = tab.length) == 0)
                tab = initTable();
            else if ((f = tabAt(tab, i = (n - 1) & hash)) == null) {
                if (casTabAt(tab, i, null,
                             new Node<K,V>(hash, key, value, null)))
                    break;                   // no lock when adding to empty bin
            }
            else if ((fh = f.hash) == MOVED)
                tab = helpTransfer(tab, f);
            else {
                V oldVal = null;
                synchronized (f) {
                    if (tabAt(tab, i) == f) {
                        if (fh >= 0) {
                            binCount = 1;
                            for (Node<K,V> e = f;; ++binCount) {
                                K ek;
                                if (e.hash == hash &&
                                    ((ek = e.key) == key ||
                                     (ek != null && key.equals(ek)))) {
                                    oldVal = e.val;
                                    if (!onlyIfAbsent)
                                        e.val = value;
                                    break;
                                }
                                Node<K,V> pred = e;
                                if ((e = e.next) == null) {
                                    pred.next = new Node<K,V>(hash, key,
                                                              value, null);
                                    break;
                                }
                            }
                        }
                        else if (f instanceof TreeBin) {
                            Node<K,V> p;
                            binCount = 2;
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
                    if (binCount >= TREEIFY_THRESHOLD)
                        treeifyBin(tab, i);
                    if (oldVal != null)
                        return oldVal;
                    break;
                }
            }
        }
        addCount(1L, binCount);
        return null;
    }
```

1. 根据 key 计算出 hashcode
2. 判断是否需要进行初始化
3. 为当前 key 定位出的 Node，如果为空表示当前位置可以写入数据，利用 CAS 尝试写入，失败则自旋保证成功
4. 如果当前位置的 hashcode == MOVED == -1, 则需要进行扩容
5. 如果都不满足，则利用 synchronized 锁写入数据
4. 如果数量大于 TREEIFY_THRESHOLD（默认8） 则要转换为红黑树

### get

```java
/**
     * Returns the value to which the specified key is mapped,
     * or {@code null} if this map contains no mapping for the key.
     *
     * <p>More formally, if this map contains a mapping from a key
     * {@code k} to a value {@code v} such that {@code key.equals(k)},
     * then this method returns {@code v}; otherwise it returns
     * {@code null}.  (There can be at most one such mapping.)
     *
     * @throws NullPointerException if the specified key is null
     */
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

1. 根据 key 计算出 hashcode
2. 查找到指定位置，如果头节点就是要找的，直接返回它的 value
3. 如果头节点 hash 值小于 0 ，说明正在扩容或者是红黑树，查找之
4. 如果是链表，遍历查找之

## ThreadPoolExecutor 线程池

### 常见四种线程池

1. 可缓存线程池 newCachedThreadPool()
2. 定长线程池 newFixedThreadPool()
3. newSingleThreadExecutor()
4. newScheduledThreadPool()






