# 面向对象设计原则

`SOLID`原则 + 迪米特法则

## 单一责任原则（Single Responsibility Principle）

> 一个类只允许有一个职责，即只有一个导致该类变更的原因。

类的职责要单一

## 开放封闭原则（Open/Closed Principle）

> 一个软件实体如类、模块和函数应该**对扩展开放，对修改关闭**。

总纲，对扩展开放，对修改关闭

## 里氏替换原则（Liskov Substitution Principle）

> 所有引用基类的地方必须能透明地使用其子类的对象，也就是说子类对象可以替换其父类对象，而程序执行效果不变。

子类可以透明替换父类

## 接口隔离原则（Interface Segregation Principle）

> 多个特定的客户端接口要好于一个通用性的总接口。

接口的职责要单一

## 依赖倒置原则（Dependency Inversion Principle）

> 1. 依赖抽象，而不是依赖实现。
> 2. 抽象不应该依赖细节；细节应该依赖抽象。
> 3. 高层模块不能依赖低层模块，二者都应该依赖抽象。

面向接口编程

## 迪米特法则（Law of Demeter）

> 一个对象应该对尽可能少的对象有接触，也就是只接触那些真正需要接触的对象。

降低耦合

--- 
**参考文档**
- [object-oriented-design](https://github.com/knightsj/object-oriented-design)
- [Java Design Patterns](https://java-design-patterns.com/principles)