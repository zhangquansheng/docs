# AOP 

如何正确使用`Spring`进行面向切面编程，请参考[官方文档](https://docs.spring.io/spring-framework/docs/current/spring-framework-reference/core.html#aop), 本篇主要讲它的实现原理。

面向切面编程（Aspect-oriented Programming `AOP`）是面向对象编程（Object-oriented Programming `OOP`）的补充，它提供了另一种关于程序结构的思考方式。

## OOP 和 AOP 分别解决的问题

下面我们先看一个`OOP`的例子：

例如：现有三个类，`Horse`、`Pig`、`Dog`，这三个类中都有 `eat()` 和 `run()` 两个方法。

通过 `OOP` 思想中的继承，我们可以提取出一个 `Animal` 的父类，然后将 `eat` 和 `run` 方法放入父类中，`Horse`、`Pig`、`Dog`通过继承`Animal`类即可自动获得`eat()`和`run()`方法，这样将会少些很多重复的代码。

图示：
![oop](/img/spring/oop.png)

`OOP`编程思想可以解决大部分的代码重复问题。但是有一些问题是处理不了的。比如在父类`Animal`中的多个方法的相同位置出现了重复的代码，OOP 就解决不了,示例代码如下：
```java
/**
 * 动物父类
 */
public class Animal {

    /** 身高 */
    private String height;

    /** 体重 */
    private double weight;

    public void eat() {
        // 性能监控代码
        long start = System.currentTimeMillis();

        // 业务逻辑代码
        System.out.println("I can eat...");

        // 性能监控代码
        System.out.println("执行时长：" + (System.currentTimeMillis() - start)/1000f + "s");
    }

    public void run() {
        // 性能监控代码
        long start = System.currentTimeMillis();

        // 业务逻辑代码
        System.out.println("I can run...");

        // 性能监控代码
        System.out.println("执行时长：" + (System.currentTimeMillis() - start)/1000f + "s");
    }
}
```
这部分重复的代码，一般统称为**横切逻辑代码**。
图示：
![aop-code](/img/spring/aop-code.webp)

横切逻辑代码存在的问题：
- 代码重复问题
- 横切逻辑代码和业务代码混杂在一起，代码臃肿，不变维护

通过上面的分析可以发现，`AOP`主要用来解决：**在不改变原有业务逻辑的情况下，增强横切逻辑代码，根本上解耦合，避免横切逻辑代码重复。**

## Spring AOP

`AOP`在`Spring Framework`中用于：
- 提供**声明式服务**。此类服务最重要的是**声明式事务管理**。
- 用户可以实现自定义切面，以AOP补充其对OOP的使用。例如**ControllerLogAspect**。

`Spring AOP`默认将**标准JDK动态代理**用于`AOP`代理。所以它可以代理任何接口（或一组接口）。

`Spring AOP`也可以使用**CGLIB代理**，默认情况下，如果业务对象未实现接口，则使用`CGLIB`。**由于对接口而不是对类进行编程是一种好习惯(As it is good practice to program to interfaces rather than classes)**，因此业务类通常实现一个或多个业务接口。
