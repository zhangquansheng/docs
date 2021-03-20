# LRU :hammer:

`LRU`，全称`Least Recently Used`，即**最近最少使用**，用于操作系统的**页面置换算法**，以及一些常见的框架。

## 用 LinkedHashMap 实现 LRU 缓存算法

```java
public class LRUCache<K, V> extends LinkedHashMap<K, V> {

    private final int MAX_CACHE_SIZE;

    public LRUCache(int cacheSize) {
        // 使用构造方法 public LinkedHashMap(int initialCapacity, float loadFactor, boolean accessOrder)
        // initialCapacity、loadFactor都不重要
        // accessOrder要设置为true，按访问排序
        super((int) Math.ceil(cacheSize / 0.75) + 1, 0.75f, true);
        MAX_CACHE_SIZE = cacheSize;
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry eldest) {
        // 超过阈值时返回true，进行LRU淘汰
        return size() > MAX_CACHE_SIZE;
    }

}
```