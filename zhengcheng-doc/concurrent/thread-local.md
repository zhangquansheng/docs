# ThreadLocal （线程局部变量） :hammer:

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

## ThreadLocal 的源码分析

## 内存泄露

`ThreadLocalMap`中使用的`key`为`ThreadLocal`的弱引用，而`value`是强引用。所以，如果`ThreadLocal`没有被外部强引用的情况下，在垃圾回收的时候`key`会被清理掉，而`value`不会被清理掉。这样一来，**`ThreadLocalMap`中就会出现`key`为`null`的`Entry`**。假如我们不做任何措施的话`value`永远无法被`GC`回收，这个时候就可能会产生内存泄露。

## 如何避免内存泄露

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