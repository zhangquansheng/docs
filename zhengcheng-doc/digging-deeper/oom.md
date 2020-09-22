# OOM 异常分析 -JDK1.8

::: tip 示例项目源码：
👉 [oom](https://gitee.com/zhangquansheng/oom)
:::

> 以下知识全部基于jdk1.8

   在Java虚拟机规范的描述中，除了程序计数器外，虚拟机内存的其他几个运行时区域都有可能发生 OutOfMemoryError（简称OOM）异常的可能。
本次分享的目的有两个：
* 第一，通过代码验证Java虚拟机规范中描述的各个运行时区域存储的内容；
* 第二，希望大家在日常的工作中遇到实际的内存溢出异常时，能否根据异常的信息快速判断是哪一个区域的内存溢出，知道在什么样的代码会导致这些区域内存溢出，以及出现这些异常后改如何处理。

## Java 堆溢出（java.lang.OutOfMemoryError: java heap space）

Java 堆用于存储对象实例，只要不断地创建对象，并且保证GC Roots到对象之间有可达路径来避免垃圾回收机制清除这些对象， 那么在对象数量到达最大队的容量限制后就会产生内存溢出异常。

通过-Xms参数设置堆的最小值，并把堆的最大值-Xmx设置为一样，避免堆自动扩展

代码清单：

```java
    public Result<Void> heapOOM() {
        List<OOMObject> list = new ArrayList<>();
        while (true) {
            list.add(new OOMObject());
        }
    }

```

启动参数：
```shell script
 -Xms60m -Xmx60m -XX:MetaspaceSize=128m -XX:MaxMetaspaceSize=128m -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -Denv=dev -Deureka.client.register-with-eureka=false -Deureka.client.enabled=false
```

运行结果：

```
Exception in thread "http-nio-80-exec-9" java.lang.OutOfMemoryError: Java heap space
2019-12-12 17:37:51,576 [NioBlockingSelector.BlockPoller-1] ERROR [org.apache.tomcat.util.net.NioBlockingSelector] DirectJDKLog.java:182 - 
java.lang.OutOfMemoryError: Java heap space
2019-12-12 17:37:51,626 [http-nio-80-exec-8] ERROR [o.a.c.c.C.[.[localhost].[/].[dispatcherServlet]] DirectJDKLog.java:182 - Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception [Handler dispatch failed; nested exception is java.lang.OutOfMemoryError: Java heap space] with root cause
java.lang.OutOfMemoryError: Java heap space
```

解决办法，一般的手段是先通过内存映像分析工具（MAT）对Dump出来的堆转储快照进行分析，重点是确认内存中的对象是否是必要的， 也就是要先分清楚是出现了内存泄露（Memory Leak）还是内存溢出（Memory Overflow）

如果是内存泄露，可进一步通过工具查看泄露对象到GC Roots的引用链。于是就能找到泄露对象是通过怎样的路径与CG Roots相关联 并导致垃圾收集器无法自动回收它们的。掌握了泄露对象的类型信息以及GC Roots 引用链的信息，就可以比较准确地定位出泄露代码的位置。

如果不存在泄露，那就应当检查虚拟机的堆参数（-Xms -Xmx），与机器物理内存对比看是否还可以调大一点，也可以从代码检查是否存在某些 对象声明周期过长，持有状态时间过长的情况，尝试减少程序运行期的内存消耗。

## 虚拟机栈和本地方法栈溢出

由于在HotSpot虚拟机中并不区分虚拟机栈和本地方法栈，因此，对于HotSpot来说，虽然-Xoss参数（这是本地方法栈大小）存在，但是实际上无效的， 栈容量只由-Xss参数设定。关于虚拟机栈和本地方法栈，在Java虚拟机规范中描述了两种异常：

* 如果线程请求的栈深度大于虚拟机所允许的最大深度，将抛出StackOverFlowError异常。
* 如果虚拟机在扩展栈时无法申请足够的内存空间，则抛出OutOfMemoryError异常。

测试代码:
```java
public class JavaVMStackSOF {

    private int stackLength = 1;

    public void stackLeak() {
        stackLength++;
        stackLeak();
    }

}
```

运行结果：
```
2019-12-13 11:01:00,511 [http-nio-80-exec-9] ERROR [o.a.c.c.C.[.[localhost].[/].[dispatcherServlet]] DirectJDKLog.java:182 - Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception [Handler dispatch failed; nested exception is java.lang.StackOverflowError] with root cause
java.lang.StackOverflowError: null
	at com.gaodun.ts.oom.JavaVMStackSOF.stackLeak(JavaVMStackSOF.java:15)
```

在单线程中，由于栈帧太大（虚拟机栈容量太小），当内存无法分配的时候，抛出 StackOverflowError 异常。

也可以使用-Xss参数减少栈内存，也是可以抛出 StackOverflowError 异常。


## 元空间溢出

元空间的本质和永久代类似，都是对JVM规范中方法区的实现。不过元空间与永久代之间最大的区别在于： 元空间并不在虚拟机中，而是使用本地内存。因此，默认情况下，元空间的大小仅受本地内存限制， 但可以通过以下参数来指定元空间的大小：

* -XX:MetaspaceSize，初始空间大小，达到该值就会触发垃圾收集进行类型卸载，同时GC会对该值进行调整：如果释放了大量的空间，就适当降低该值；如果释放了很少的空间，那么在不超过MaxMetaspaceSize时，适当提高该值。
* -XX:MaxMetaspaceSize，最大空间，默认是没有限制的。

测试代码:
```java
        while (true) {
            Enhancer enhancer = new Enhancer();
            enhancer.setSuperclass(OOMObject.class);
            enhancer.setUseCache(false);
            enhancer.setCallback(new MethodInterceptor() {
                @Override
                public Object intercept(Object o, Method method, Object[] objects, MethodProxy methodProxy) throws Throwable {
                    return methodProxy.invokeSuper(o, objects);
                }
            });
            enhancer.create();
        }
```
启动参数： -Xms1024m -Xmx1024m -XX:MetaspaceSize=128m -XX:MaxMetaspaceSize=128m -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -Denv=dev -Deureka.client.register-with-eureka=false -Deureka.client.enabled=false

![metaspace](/img/oom/metaspace.png)

运行结果：
```
Exception in thread "SimplePauseDetectorThread_0" Exception in thread "http-nio-80-exec-1" java.lang.OutOfMemoryError: Metaspace
java.lang.OutOfMemoryError: Metaspace
```

> * Java7，将常量池是存放到了堆中，常量池就相当于是在永久代中，所以永久代存放在堆中。
> * Java8，取消了整个永久代区域，取而代之的是元空间。没有再对常量池进行调整。


## 本机直接内存溢出

DirectMemory 容量可通过-XX:MaxDirectMemorySize指定，如果不指定，则默认与Java堆最大值（-Xmx指定）一样

直接通过反射获取Unsafe实例进行内存分配（Unsafe类的getUnsafe()方法限制了只有引导类加载器才会返回实例，
也就是设计者希望只有rt.jar中的类才能使用Unsafe的功能）。
测试代码:
```java
        Field unsafeField = Unsafe.class.getDeclaredFields()[0];
        unsafeField.setAccessible(true);
        Unsafe unsafe = (Unsafe) unsafeField.get(null);
        while (true) {
            // 1M
            unsafe.allocateMemory(1024 * 1024);
        }
```

启动参数：-Xms100m -Xmx100m  -XX:MaxDirectMemorySize=100m -XX:MetaspaceSize=128m -XX:MaxMetaspaceSize=128m -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -Denv=dev -Deureka.client.register-with-eureka=false -Deureka.client.enabled=false

运行结果：
```
2019-12-13 13:12:32,547 [http-nio-80-exec-1] ERROR [o.a.c.c.C.[.[localhost].[/].[dispatcherServlet]] DirectJDKLog.java:182 - Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception [Handler dispatch failed; nested exception is java.lang.OutOfMemoryError] with root cause
java.lang.OutOfMemoryError: null
	at sun.misc.Unsafe.allocateMemory(Native Method)
```

由于直接内存溢出，一个明显的特征是在Heap Dump 文件中不会看到明显的异常，如果你发现OOM之后Dump文件很小， 而程序中有直接或者间接使用了NIO，可以考虑一下是不是这方面的原因。

## 问题延伸

* JVM 运行时数据区域&JVM内存模型
  > * 介绍下 Java 内存区域（运行时数据区）
  > * Java 对象的创建过程（五步，建议能默写出来并且要知道每一步虚拟机做了什么）
  > * 对象的访问定位的两种方式（句柄和直接指针两种方式）
  > * 方法区和永久代的关系
  > * 为什么要将永久代 (PermGen) 替换为元空间 (MetaSpace) 呢?
  > * String 类和常量池
  > * 8种基本类型的包装类和常量池
* OOM分析
* JVM垃圾收集器有哪些，分别对应的垃圾收集算法是怎样的
* JVM调优经验


#### 参考文档

*  《深入理解Java虚拟机》