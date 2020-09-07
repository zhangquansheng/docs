# AOP 

面向切面编程（Aspect-oriented Programming `AOP`）是面向对象编程（Object-oriented Programming `OOP`）的补充，它提供了另一种关于程序结构的思考方式。

## OOP 和 AOP 分别解决的问题

下面我们先看一个`OOP`的例子：

例如：现有三个类，`Horse`、`Pig`、`Dog`，这三个类中都有 `eat()` 和 `run()` 两个方法。

通过 `OOP` 思想中的继承，我们可以提取出一个 `Animal` 的父类，然后将 `eat` 和 `run` 方法放入父类中，`Horse`、`Pig`、`Dog`通过继承`Animal`类即可自动获得`eat()`和`run()`方法，这样将会少些很多重复的代码。

图示：
![oop](/img/spring/oop.png)
