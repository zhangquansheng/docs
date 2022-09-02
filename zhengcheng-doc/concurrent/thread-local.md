# ThreadLocal （线程局部变量） :+1:

## ThreadLocal 底层原理图

![thread-local](/img/concurrent/thread-local.png)

## ThreadLocal 底层实现原理

1. **数据结构**：
    - 每个 Thread 都有一个 ThreadLocalMap 的成员变量，变量名：threadLocals
    - ThreadLocalMap 使用一个 Entry 对象的数组存储当前线程所有的 ThreadLocal 对象
    - Entry 对象的 key 是 ThreadLocal 的弱引用，value 是 Object
2. **set() 方法**:
    - 获取当前线程，取出当前线程的 ThreadLocalMap 
    - 如果不存在，则创建一个 ThreadLocalMap
    - 如果存在，则把当前的ThreadLocal（引用）作为键，传入的value作为值存入ThreadLocalMap中
3. **get() 方法**：
    - 获取当前线程，取出当前线程的 ThreadLocalMap（同 set() 方法）
    - 如果不存在，就会执行初始化并返回默认的值
    - 如果存在，则把当前的ThreadLocal作为键去获取Entry，如果Entry不为空，则返回value，否则也会执行初始化并返回默认的值（第二步）
4. **remove() 方法**：
   - 获取当前线程，取出当前线程的 ThreadLocalMap（同 set() 方法）
   - 如果存在就调用 ThreadLocalMap 的 remove() 方法
   - ThreadLocalMap 确定元素的位置，把Entry的键值对都设为NULL，最后把Entry也设置为NULL

## 哈希冲突

![ThreadLocal](/img/concurrent/threadLocal-thread.webp)

![ThreadLocal](/img/concurrent/ThreadLocal.jpeg)

可以看出，它是数组结构的实现，那么有`hash`冲突的情况下，怎么办？先看`ThreadLocalMap`的`set`源码
```java
 private void set(ThreadLocal<?> key, Object value) {
    Entry[] tab = table;
    int len = tab.length;
    int i = key.threadLocalHashCode & (len-1);

    for (Entry e = tab[i];
         e != null;
         e = tab[i = nextIndex(i, len)]) {
        ThreadLocal<?> k = e.get();

        if (k == key) {
            e.value = value;
            return;
        }

        if (k == null) {
            replaceStaleEntry(key, value, i);
            return;
        }
    }

    tab[i] = new Entry(key, value);
    int sz = ++size;
    if (!cleanSomeSlots(i, sz) && sz >= threshold)
        rehash();
}
```
1. **hash code 是通过 `AtomicInteger.getAndAdd()`来获取，默认是`0x61c88647`**。
2. **如果当前位置为空，那么就初始化一个`Entry`对象放在此位置上**。
3. **如果当前位置已经存在`Entry`，且它们的`key`相同，则重新设置`Entry`中的`value`**。
4. **如果当前位置已经存在`Entry`，且它们的`key`不相同，则重新找下一个空位置，然后在重复 2、3、4**


## 内存泄露 

1. `ThreadLocalMap`中使用的`key`为`ThreadLocal`的**弱引用**，而`value`是**强引用**。
2. 如果`ThreadLocal`没有被外部强引用的情况下，在垃圾回收的时候`key`会被清理掉，而`value`不会被清理掉。
3. 那么，**`ThreadLocalMap`中就会出现`key`为`null`的`Entry`**。假如我们不做任何措施的话`value`永远无法被`GC`回收，这个时候就可能会产生内存泄露。

### 如何避免内存泄露

必须回收自定义的`ThreadLocal`变量，尤其在线程池场景下，线程经常会被复用，如果不清理自定义的 `ThreadLocal` 变量，可能会影响后续业务逻辑和造成内存泄露等问题。

尽量在代理中使用 `try-finally` 块进行回收。
```java
objectThreadLocal.set(userInfo);
try {
 // ...
} finally {
   objectThreadLocal.remove();
}
```

## ThreadLocal 为什么使用弱引用

> 官方文档：为了应对非常大和长时间的使用

## ThreadLocal 是线程安全吗

> 线程不安全

## ThreadLocal

`ThreadLocal`提供了线程内存储变量的能力，**线程局部变量**不同之处在于每个线程读取的变量是相互独立的。

代码示例：
```java
/**
 * 需求：线程隔离
 * 在多线程并发的场景下，每个线程中的变量都是相互独立
 * 线程A：设置（变量1）获取（变量1）
 * 线程B：设置（变量2）获取（变量2）
 * <p>
 * ThreadLocal：
 * 1.set()：将变量绑定到当前线程中
 * 2.get()：获取当前线程绑定的变量
 */
public class ThreadLocalDemo {

    ThreadLocal<String> t1 = new ThreadLocal<String>();

    //变量
    private String content;

    private String getContent() {
        //return content;
        return t1.get();
    }

    private void setContent(String content) {
        //this.content = content;
        //变量绑定到当前线程
        t1.set(content);
    }

    public static void main(String[] args) {
        ThreadLocalDemo demo = new ThreadLocalDemo();
        for (int i = 0; i < 5; i++) {
            Thread thread = new Thread(new Runnable() {
                @Override
                public void run() {
                    demo.setContent(Thread.currentThread().getName() + "的数据");
                    System.out.println("----------------");
                    System.out.println(Thread.currentThread().getName() + "-->" + demo.getContent());
                }
            });
            thread.setName("线程" + i);
            thread.start();
        }
    }
}
```

## ThreadLocal 源码分析

1. Thread 类中存在`threadLocals`变量，类型为`ThreadLocal.ThreadLocalMap`，这个变量就是保存每个线程的私有数据。
```java
// java.lang.Thread
public
class Thread implements Runnable {
    // ...
    ThreadLocal.ThreadLocalMap threadLocals = null;

    ThreadLocal.ThreadLocalMap inheritableThreadLocals = null;
    //...
}
```

2. ThreadLocalMap 是`ThreadLocal`的内部类，每个数据都用`Entry`保存，其中`Entry`继承`WeakReference`，用一个键值对存储，键为`ThreadLocal`的引用。
> `Entry`为什么是弱引用，如果是强引用，即使把`ThreadLocalMap`设置为null，`GC`也不会回收，因为`ThreadLocalMap`对它有强引用。
```java
static class ThreadLocalMap {
        static class Entry extends WeakReference<ThreadLocal<?>> {
            /** The value associated with this ThreadLocal. */
            Object value;

            Entry(ThreadLocal<?> k, Object v) {
                super(k);
                value = v;
            }
        }
}
```

3. ThreadLocal 中的`set`方法：先获取当前线程，取出当前线程的`ThreadLocalMap`，如果不存在就会创建一个`ThreadLocalMap`，
   如果存在就会把**当前的`ThreadLocal`的引用作为键**，传入的参数作为值存入`map`中。
```java
public void set(T value) {
    Thread t = Thread.currentThread();
    ThreadLocalMap map = getMap(t);
    if (map != null)
        map.set(this, value);
    else
        createMap(t, value);
}
```

4. ThreadLocal 中的`get`方法：获取当前线程，取出当前线程的`ThreadLocalMap`，用当前的`threadLocals`作为`key`在`ThreadLocalMap`查找，
   如果存在不为空的`Entry`，就返回`Entry`中的`value`，否则就会执行初始化并返回默认的值。
```java
public T get() {
    Thread t = Thread.currentThread();
    ThreadLocalMap map = getMap(t);
    if (map != null) {
        ThreadLocalMap.Entry e = map.getEntry(this);
        if (e != null) {
            @SuppressWarnings("unchecked")
            T result = (T)e.value;
            return result;
        }
    }
    return setInitialValue();
}

private T setInitialValue() {
    T value = initialValue();
    Thread t = Thread.currentThread();
    ThreadLocalMap map = getMap(t);
    if (map != null)
        map.set(this, value);
    else
        createMap(t, value);
    return value;
}
```

5. ThreadLocal 中的`remove`方法：先获取当前线程的`ThreadLocalMap`变量，如果存在就调用`ThreadLocalMap`的`remove`方法。
   `ThreadLocalMap`需要确定元素的位置（数组实现，存在**哈希冲突**），把`Entry`的键值对都设为`NULL`，最后把`Entry`也设置为`NULL`。
```java
public void remove() {
 ThreadLocalMap m = getMap(Thread.currentThread());
 if (m != null)
     m.remove(this);
}


//ThreadLocal.ThreadLocalMap
/**
 * Remove the entry for key.
 */
private void remove(ThreadLocal<?> key) {
    Entry[] tab = table;
    int len = tab.length;
    int i = key.threadLocalHashCode & (len-1);
    for (Entry e = tab[i];
         e != null;
         e = tab[i = nextIndex(i, len)]) {
        if (e.get() == key) {
            e.clear();
            expungeStaleEntry(i);
            return;
        }
    }
}
```

## 使用场景

- 数据库连接池
- ORM 框架的`Session`管理
