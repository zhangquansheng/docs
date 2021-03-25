# Reference 引用

如果`Reference`类型的数据中**存储的数值**代表的是**另外一块内存的起始地址**，就称**这块内存代表着一个引用**。
引用不等同于对象本身，根据虚拟机种类的不同，可能是一个**指向对象起始地址的引用指针**，也可能是**指向一个代表对象的句柄**或**其他与此对象相关的位置**。

引用类放在`java.lang.ref`包下，类的继承体系如下图
![Reference类结构](/img/java/Reference.webp)

## 强引用

例如`Object object = new Object()`这样就是典型的强引用，被强引用引用的对象不会被垃圾收集器主动回收。
```java
public static void main(String[] args) throws IOException {
    M m = new M(1, "1");
    m = null;

    System.gc();

    System.in.read();
}
```

## 软引用（SoftReference）

如果一个对象具有软引用，只要内存空间足够，垃圾回收器就不会回收它。如果内存空间不足了，就会回收这些对象的内存。只要垃圾回收器没有回收它，该对象就可以被程序使用。

软引用可用来实现内存敏感的**高速缓存**，比如网页缓存、图片缓存等。使用软引用能防止内存泄露，增强程序的健壮性。  
```java
public static void main(String[] args) throws InterruptedException {
    SoftReference<byte[]> m = new SoftReference<>(new byte[1024 * 1024*10]);

    System.out.println(m.get());

    System.gc();
    Thread.sleep(500);
    System.out.println(m.get());
    /*
    这里设置虚拟机栈内存为20M，执行下面语句后内存就不够了，需要回收堆内存
    于是m里面的堆内存就被回收了
     */
    byte[] b = new byte[1024 * 1024 * 15];
    System.out.println(m.get());
}
```

## 弱引用（WeakReference）

弱引用也是用来描述非必需对象的，当`JVM`进行垃圾回收时，无论内存是否充足，都会回收被弱引用关联的对象。

`ThreadLocal` 就是`WeakReference`的一个典型使用场景。
```java
public static void main(String[] args) throws IOException {
    WeakReference<M> m = new WeakReference<>(new M(10, "1"));
    System.gc();
    System.in.read();

}
```

## 虚引用（PhantomReference）

虚引用也称为幽灵引用或者幻影引用，它是最弱的一种引用关系。一个对象是否有虚引用的存在，完全不会对其生存时间构成影响，也无法通过虚引用来取得一个对象实例。为一个对象设置虚引用关联的唯一目的就是**能在这个对象被收集器回收时收到一个系统通知**。

**虚引用用于管理堆外内存**，比如网络中传输过来一堆数据，`JVM`需要将其拷贝到`JVM`内存里面，否则就无法进行垃圾回收，但是这个拷贝是要耗时的，于是提供了直接内存，直接对堆外内存【操作系统管理的内存】进行操作这里就用到虚引用。
```java
private static final List<Object> LIST = new LinkedList<>();
private static final ReferenceQueue<M> QUEUE = new ReferenceQueue<>();

public static void main(String[] args) {
    //虚引用被回收的时候会将信息记录在第二个参数的队列中
    PhantomReference<M> phantomReference = new PhantomReference<>(new M(1, "1"), QUEUE);
}
```

## 引用队列（ReferenceQueue）

`Reference`和引用队列`ReferenceQueue`联合使用时，如果`Reference`持有的对象被垃圾回收，`Java`虚拟机就会把这个引用加入到与之关联的引用队列中。