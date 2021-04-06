# ConcurrentHashMap 源码解析 :hammer:

`JDK1.7`中是采用`Segment` + `HashEntry` + `ReentrantLock`的方式进行实现的。`JDK1.8`中是采用`Node` + `CAS` + `synchronized`来保证并发安全进行实现。

本次源码解析基于`JDK1.8`。

## put 

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
