# 动态代理

**从 JVM 角度来说，动态代理是在运行时动态生成类字节码，并加载到 JVM 中的。**

就 Java 来说，动态代理的实现方式有很多种，比如 **JDK 动态代理**、**CGLIB 动态代理**等。

## JDK 动态代理机制

::: tip 重点提示
JDK动态代理是基于Java的反射机制实现的，主要涉及到java.lang.reflect包中的Proxy和InvocationHandler。
:::

InvocationHandler是一个接口，通过实现这个接口定义一个横切的逻辑！然后通过反射机制调用目标类的方法，这样就能动态的把非业务逻辑和业务逻辑动态的拼接在一起！

proxy则利用InvocationHandler创建代理实例，来间接的调用代理的方法！

### JDK 动态代理类使用步骤

1. 定义一个接口及其实现类；
2. 自定义 InvocationHandler 并重写invoke方法，在 invoke 方法中我们会调用原生方法（被代理类的方法）并自定义一些处理逻辑；
3. 通过 Proxy.newProxyInstance(ClassLoader loader,Class<?>[] interfaces,InvocationHandler h) 方法创建代理对象；

### 代码示例

- [Gitee Samples](https://gitee.com/zhangquansheng/magic/tree/feign/)

[java-proxy](https://github.com/Snailclimb/JavaGuide/blob/master/docs/java/basic/java-proxy.md)