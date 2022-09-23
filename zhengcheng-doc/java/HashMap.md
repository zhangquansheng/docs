# HashMap

`HashMap`主要用来存放键值对，它基于哈希表的`Map`接口实现，是常用的`Java`集合之一。

`JDK1.8`之前`HashMap`由**数组+链表**组成的，数组是`HashMap`的主体，链表则是主要为了解决哈希冲突而存在的（“拉链法”解决冲突）。

`JDK1.8`之后`HashMap`的组成多了**红黑树**，在满足下面两个条件之后，会执行链表转红黑树操作，以此来加快搜索速度。
- 链表长度大于阈值(`TREEIFY_THRESHOLD`)`8`
- `HashMap`数组长度超过(`MIN_TREEIFY_CAPACITY`)`64`

本次源码解析基于`JDK1.8`。

## 类的关键属性

```java
public class HashMap<K,V> extends AbstractMap<K,V>
    implements Map<K,V>, Cloneable, Serializable {

    private static final long serialVersionUID = 362498820763181265L;
    
    // 默认的初始容量是16（1左移4位，表示2的4次方） 
    static final int DEFAULT_INITIAL_CAPACITY = 1 << 4; // aka 16
    // 最大容量 （1左移30位，表示2的30次方）
    static final int MAXIMUM_CAPACITY = 1 << 30;
    // 默认的负载因子
    static final float DEFAULT_LOAD_FACTOR = 0.75f;
    // 当链表上的结点数大于这个值时会转成红黑树
    static final int TREEIFY_THRESHOLD = 8;
    // 当链表上的结点数小于这个值时树转成链表
    static final int UNTREEIFY_THRESHOLD = 6;
    // 链表结构转成红黑树对应的数组长度
    static final int MIN_TREEIFY_CAPACITY = 64;
    // 存储元素的数组，总是2的幂次倍
    transient Node<K,V>[] table;
    // 存放具体元素的集
    transient Set<Map.Entry<K,V>> entrySet;
    // 存放元素的个数
    transient int size;

    // 结构上被修改的次数
    transient int modCount;

    // 临界值 = (容量*负载因子)
    int threshold;

    // 负载因子
    final float loadFactor;

}
```

::: tip loadFactor 负载因子
`loadFactor` 加载因子是控制数组存放数据的疏密程度，`loadFactor`越趋近于 1，那么 数组中存放的数据(`entry`)也就越多，也就越密，也就是会让链表的长度增加，`loadFactor`越小，也就是趋近于`0`，数组中存放的数据(`entry`)也就越少，也就越稀疏。

**`loadFactor`太大导致查找元素效率低，太小导致数组的利用率低，存放的数据会很分散。`loadFactor`的默认值为`0.75f`是官方给出的一个比较好的临界值**。
:::

## Node

```java
static class Node<K,V> implements Map.Entry<K,V> {
        final int hash;
        final K key;
        V value;
        Node<K,V> next;

        Node(int hash, K key, V value, Node<K,V> next) {
            this.hash = hash;
            this.key = key;
            this.value = value;
            this.next = next;
        }

        public final K getKey()        { return key; }
        public final V getValue()      { return value; }
        public final String toString() { return key + "=" + value; }

        public final int hashCode() {
            return Objects.hashCode(key) ^ Objects.hashCode(value);
        }

        public final V setValue(V newValue) {
            V oldValue = value;
            value = newValue;
            return oldValue;
        }

        public final boolean equals(Object o) {
            if (o == this)
                return true;
            if (o instanceof Map.Entry) {
                Map.Entry<?,?> e = (Map.Entry<?,?>)o;
                if (Objects.equals(key, e.getKey()) &&
                    Objects.equals(value, e.getValue()))
                    return true;
            }
            return false;
        }
    }
```

## TreeNode

```java
static final class TreeNode<K,V> extends LinkedHashMap.Entry<K,V> {
        TreeNode<K,V> parent;  // red-black tree links
        TreeNode<K,V> left;
        TreeNode<K,V> right;
        TreeNode<K,V> prev;    // needed to unlink next upon deletion
        boolean red;
        TreeNode(int hash, K key, V val, Node<K,V> next) {
            super(hash, key, val, next);
        }

        /**
         * Returns root of tree containing this node.
         */
        final TreeNode<K,V> root() {
            for (TreeNode<K,V> r = this, p;;) {
                if ((p = r.parent) == null)
                    return r;
                r = p;
            }
        }

        // ......

}
```

## hash() 扰乱函数

```java
    static final int hash(Object key) {
        int h;
        return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
    }
```

## 与运算

```java
static int indexFor(int h, int length){
     return h & (length - 1);
}
```

::: tip 如何计算 hash 值
1. 扰乱函数
   - 将 key.hashCode() 向右移动16位，在异或运算（二进制位相同为0，不同为1），如上代码所示；
   - 其实就是将 key.hashCode() 的【高半区16位】数据不变，【低半区16位】数据与高半区16位数据进行异或操作；
   - 目的是让散列的分布更加均匀，增加随机性，减少碰撞；
2. 与运算
   - 为了存储空间的考虑，必须根据当前 hashmap 的容量进行与算法；
   - key.hashCode()计算出hash值，则范围为：-2147483648到2147483648，大约40亿的映射空间，这么大范围无法放入内存中；
:::

## put() 

```java
    public V put(K key, V value) {
        return putVal(hash(key), key, value, false, true);
    }

    final V putVal(int hash, K key, V value, boolean onlyIfAbsent,
                   boolean evict) {
        Node<K,V>[] tab; Node<K,V> p; int n, i;
        if ((tab = table) == null || (n = tab.length) == 0)
            n = (tab = resize()).length;
        if ((p = tab[i = (n - 1) & hash]) == null)
            tab[i] = newNode(hash, key, value, null);
        else {
            Node<K,V> e; K k;
            if (p.hash == hash &&
                ((k = p.key) == key || (key != null && key.equals(k))))
                e = p;
            else if (p instanceof TreeNode)
                e = ((TreeNode<K,V>)p).putTreeVal(this, tab, hash, key, value);
            else {
                for (int binCount = 0; ; ++binCount) {
                    if ((e = p.next) == null) {
                        p.next = newNode(hash, key, value, null);
                        if (binCount >= TREEIFY_THRESHOLD - 1) // -1 for 1st
                            treeifyBin(tab, hash);
                        break;
                    }
                    if (e.hash == hash &&
                        ((k = e.key) == key || (key != null && key.equals(k))))
                        break;
                    p = e;
                }
            }
            if (e != null) { // existing mapping for key
                V oldValue = e.value;
                if (!onlyIfAbsent || oldValue == null)
                    e.value = value;
                afterNodeAccess(e);
                return oldValue;
            }
        }
        ++modCount;
        if (++size > threshold)
            resize();
        afterNodeInsertion(evict);
        return null;
    }
```

![put方法流程图](/img/digging-deeper/hashmap-put.image)

## get()

```java
    public V get(Object key) {
        Node<K,V> e;
        return (e = getNode(hash(key), key)) == null ? null : e.value;
    }

    final Node<K,V> getNode(int hash, Object key) {
        Node<K,V>[] tab; Node<K,V> first, e; int n; K k;
        if ((tab = table) != null && (n = tab.length) > 0 &&
            (first = tab[(n - 1) & hash]) != null) {
            if (first.hash == hash && // always check first node
                ((k = first.key) == key || (key != null && key.equals(k))))
                return first;
            if ((e = first.next) != null) {
                if (first instanceof TreeNode)
                    return ((TreeNode<K,V>)first).getTreeNode(hash, key);
                do {
                    if (e.hash == hash &&
                        ((k = e.key) == key || (key != null && key.equals(k))))
                        return e;
                } while ((e = e.next) != null);
            }
        }
        return null;
    }
```

## resize() 

每次扩容，都会伴随着一次重新`hash`分配，并且会遍历`hash`表中所有的元素，是非常耗时的。在编写程序中，要尽量避免`resize`。
```java
final Node<K,V>[] resize() {
        Node<K,V>[] oldTab = table;
        int oldCap = (oldTab == null) ? 0 : oldTab.length;
        int oldThr = threshold;
        int newCap, newThr = 0;
        if (oldCap > 0) {
            if (oldCap >= MAXIMUM_CAPACITY) {
                threshold = Integer.MAX_VALUE;
                return oldTab;
            }
            else if ((newCap = oldCap << 1) < MAXIMUM_CAPACITY &&
                     oldCap >= DEFAULT_INITIAL_CAPACITY)
                newThr = oldThr << 1; // double threshold
        }
        else if (oldThr > 0) // initial capacity was placed in threshold
            newCap = oldThr;
        else {               // zero initial threshold signifies using defaults
            newCap = DEFAULT_INITIAL_CAPACITY;
            newThr = (int)(DEFAULT_LOAD_FACTOR * DEFAULT_INITIAL_CAPACITY);
        }
        if (newThr == 0) {
            float ft = (float)newCap * loadFactor;
            newThr = (newCap < MAXIMUM_CAPACITY && ft < (float)MAXIMUM_CAPACITY ?
                      (int)ft : Integer.MAX_VALUE);
        }
        threshold = newThr;
        @SuppressWarnings({"rawtypes","unchecked"})
        Node<K,V>[] newTab = (Node<K,V>[])new Node[newCap];
        table = newTab;
        if (oldTab != null) {
            for (int j = 0; j < oldCap; ++j) {
                Node<K,V> e;
                if ((e = oldTab[j]) != null) {
                    oldTab[j] = null;
                    if (e.next == null)
                        newTab[e.hash & (newCap - 1)] = e;
                    else if (e instanceof TreeNode)
                        ((TreeNode<K,V>)e).split(this, newTab, j, oldCap);
                    else { // preserve order
                        Node<K,V> loHead = null, loTail = null;
                        Node<K,V> hiHead = null, hiTail = null;
                        Node<K,V> next;
                        do {
                            next = e.next;
                            if ((e.hash & oldCap) == 0) {
                                if (loTail == null)
                                    loHead = e;
                                else
                                    loTail.next = e;
                                loTail = e;
                            }
                            else {
                                if (hiTail == null)
                                    hiHead = e;
                                else
                                    hiTail.next = e;
                                hiTail = e;
                            }
                        } while ((e = next) != null);
                        if (loTail != null) {
                            loTail.next = null;
                            newTab[j] = loHead;
                        }
                        if (hiTail != null) {
                            hiTail.next = null;
                            newTab[j + oldCap] = hiHead;
                        }
                    }
                }
            }
        }
        return newTab;
    }
```

## 线程不安全 

::: tip 什么是线程安全？
**多个线程同一时刻对同一个全局变量(同一份资源)做写操作(读操作不会涉及线程安全)时**，如果跟我们预期的结果一样，我们就称之为线程安全，反之，线程不安全。
:::

`HashMap`的线程不安全性主要表现有：:tada:
1. **`size`不准确**：size 只是用了 transient 关键字修饰（不参与序列化）,也就是说，在各个线程中的 size 副本不会及时同步，在多个线程操作的时候，size 将会被覆盖。
2. **`put`方法数据丢失**：多线程同时执行 put 操作，如果计算出来的**索引位置是相同的**，那会造成前一个 key 被后一个 key 覆盖，从而导致元素的丢失。
3. 多线程下扩容死循环：JDK1.7中的 HashMap 使用头插法插入元素，在多线程的环境下，扩容的时候有可能导致环形链表的出现，形成死循环。因此，**JDK1.8使用尾插法插入元素，在扩容时会保持链表元素原本的顺序，不会出现环形链表的问题**。
4. `put`和`get`并发时，可能导致`get`为`null`: 线程1执行`put`时，因为元素个数超出`threshold`而导致`rehash`，线程2此时执行`get`，有可能导致这个问题。

测试代码：
```java
/**
 * MapSizeThread
 *
 * @author quansheng1.zhang
 * @since 2021/3/17 15:42
 */
@Slf4j
@Component
public class MapTest {

//    public static HashMap<Integer, Integer> hashMap = new HashMap<>();

    // 验证 putVal方法 是否会丢失，固定容量，那么测试时不会调用 resize 方法，
    public static HashMap<Integer, Integer> hashMap = new HashMap<>(10000);

    public static AtomicInteger atomicInteger = new AtomicInteger();

    // 验证size不准确
    @Async
    public void size() {
        for (int i = 0; i < 10; i++) {
            hashMap.put(atomicInteger.get(), atomicInteger.get());
            log.info("插入的数据为：[{}], 此时容量为:[{}]", atomicInteger.get(), hashMap.size());
            hashMap.remove(atomicInteger.get(), atomicInteger.get());
            atomicInteger.incrementAndGet();
        }
    }

    // 验证put数据会丢失
    @Async
    public Future<Boolean> put() {
        hashMap.put(atomicInteger.get(), atomicInteger.get());
        atomicInteger.incrementAndGet();
        return new AsyncResult(Boolean.TRUE);
    }

}
```

1. **`size`不准确**

测试代码如下：
```java
for (int i = 0; i < threadCount; i++) {
    mapTest.size();
}
```

当只有一个线程时，运行结果如下：
```java
 插入的数据为：[0], 此时容量为:[1]
 插入的数据为：[1], 此时容量为:[1]
 插入的数据为：[2], 此时容量为:[1]
 插入的数据为：[3], 此时容量为:[1]
 插入的数据为：[4], 此时容量为:[1]
 插入的数据为：[5], 此时容量为:[1]
 插入的数据为：[6], 此时容量为:[1]
 插入的数据为：[7], 此时容量为:[1]
 插入的数据为：[8], 此时容量为:[1]
 插入的数据为：[9], 此时容量为:[1]
```

当有多个线程时，运行结果如下：
```java
 插入的数据为：[223], 此时容量为:[1]
 插入的数据为：[234], 此时容量为:[1]
 插入的数据为：[236], 此时容量为:[0]
 插入的数据为：[237], 此时容量为:[0]
 插入的数据为：[238], 此时容量为:[0]
 插入的数据为：[236], 此时容量为:[0]
```

造成这种偏差的原因，分析源码:
```java
 transient int size;
```
`size`只是用了`transient`关键字修饰（不参与序列化）,也就是说，在各个线程中的`size`副本不会及时同步，在多个线程操作的时候，`size`将会被覆盖。

2. **数据丢失**

```java
List<Future<Boolean>> futureList = new ArrayList<>();
for (int i = 0; i < threadCount; i++) {
    futureList.add(mapTest.put());
}

futureList.forEach(booleanFuture -> {
    try {
        booleanFuture.get();
    } catch (InterruptedException | ExecutionException e) {
        e.printStackTrace();
    }
});

MapTest.hashMap.forEach((k, v) -> log.info("key: {}, value: {}", k, v));
```

## HashMap 中 Key 类型的选择

1. 从`HashMap`的语法上来讲，**一切对象都可以作为`Key`值**。如：`Integer`、`Long`、`String`、`Object`等。（但是在实际工作中，最常用的使用`String`作为`Key`值）:tada:
> - 使用`Object`作为`Key`值的时候，如`Class Person` (包含，姓名，年龄等属性，它是**可变对象**)作为`Key`。
> 当`Person`类中的属性改变时，导致`hashCode`的值也发生变化，变化后，`map.get(key)`因为`hashCode`值的变化，
> 而无法找到之前保存的`value`值，同样，删除也取不到值。**解决方案是重写`HashCode`方法，使其在属性变化时，`hashCode值`不变。**
> - 尽量避免使用`Long`，`Integer`做`key`，可能由于拆箱装箱问题，导致取不到数据，如下所示：
```java
    @Test
    public void testInteger() {
        Map<Integer, String> map1 = new HashMap<>();
        map1.put(11, "11");
        map1.put(22, "22");
        long key1 = 11;
        Map<Long, String> map2 = new HashMap<>();
        map2.put(11L, "11");
        map2.put(22L, "22");
        map2.put(null, "33");
        int key2 = 11;

        System.out.println(map1.get(key1)); // null
        System.out.println(map1.get(key2)); // 11
        System.out.println(map2.get(key2)); // null
        System.out.println(map2.get(null)); // 33
    }
```
2. 不能使用基本数据类型作为`Key`值。:tada:
> `HashMap`存储元素采用的是`hash表`存储数据，每存储一个对象的时候，都会调用其`hashCode()`方法，算出其`hash值`，
> 如果相同，则认为是相同的数据，直接不存储，如果`hash值`不同，则再调用其`equals`方法进行比较，如果返回`true`，
> 则认为是相同的对象，不存储，如果返回`false`，则认为是不同的对象，可以存储到`HashMap`集合中。
> 
> 之所以`key`不能为基本数据类型，则是因为基本数据类型不能调用其`hashcode()`方法和`equals()`方法，进行比较，
> 所以`HashMap`集合的`key`只能为引用数据类型，不能为基本数据类型，可以使用基本数据类型的包装类，例如`Integer`等。

3. `HashMap`中`key`是可以为`null`，只能存储一个`null`，因为计算`key`的`hash`值的时候，如果`key`为`null`，则其`hash`值为`0`。
```java
    // 当key为null时，hash值为0
    static final int hash(Object key) {
        int h;
        return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
    }
```
