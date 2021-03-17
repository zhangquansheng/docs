# HashMap 源码解析

`HashMap`主要用来存放键值对，它基于哈希表的`Map`接口实现，是常用的`Java`集合之一。

`JDK1.8`之前`HashMap`由**数组+链表**组成的，数组是`HashMap`的主体，链表则是主要为了解决哈希冲突而存在的（“拉链法”解决冲突）。

`JDK1.8` 之后`HashMap`的组成多了**红黑树**，在满足下面两个条件之后，会执行链表转红黑树操作，以此来加快搜索速度。
- 链表长度大于阈值（默认为`8`）
- `HashMap`数组长度超过`64`

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