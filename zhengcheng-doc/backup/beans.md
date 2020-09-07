---
sidebarDepth: 3
---

# IoC容器

[[toc]]

## 1. Spring IoC容器和Bean简介

### 什么是 IoC

`IoC` （Inversion of control ）控制反转。**它是一种思想并不是一个技术实现**。描述的是：Java 开发领域对象的创建以及管理的问题。

例如：现有类 A 依赖于类 B

- **传统的开发方式** ：往往是在类 `A` 中手动通过 `new` 关键字来 `new` 一个 `B` 的对象出来
- **使用`IoC`思想的开发方式** ：不通过 `new` 关键字来创建对象，而是通过 `IoC` 容器(Spring 框架) 来帮助我们实例化对象。我们需要哪个对象，直接从 `IoC` 容器里面过去即可。

从以上两种开发方式的对比来看：我们 “丧失了一个权力” (创建、管理对象的权力)，从而也得到了一个好处（不用再考虑对象的创建、管理等一系列的事情）。

### IoC 解决了什么问题

`IoC` 的思想就是两方之间不互相依赖，由第三方容器来管理相关资源。这样有什么好处呢？

- 对象之间的耦合度或者说依赖程度降低；
- 资源变的容易管理；

### IoC 和 DI 

`IoC` 最常见以及最合理的**实现方式**叫做**依赖注入**（Dependency Injection，简称 `DI`）并且，老马（Martin Fowler）在一篇文章中提到将`IoC`改名为`DI`，[原文地址](https://martinfowler.com/articles/injection.html)。

`DI`的主要两种方式，分别为：

- 基于构造函数的依赖注入
- 基于Setter的依赖注入

### IoC 容器

- **org.springframework.beans.BeanFactory**: 是`Spring`里面最低层的接口，提供了最简单的容器的功能，只提供了实例化对象和拿对象的功能；
- **org.springframework.context.ApplicationContext**: 应用上下文，继承BeanFactory接口，它是Spring的一各更高级的容器，提供了更多的有用的功能；
   - 与Spring的AOP功能轻松集成
   - 消息资源处理（用于国际化）
   - 活动发布
   - 应用层特定的上下文，例如WebApplicationContext 用于Web应用程序中的。
   
 
## 2. Bean 总览

在**容器**内，这些bean定义表示为`org.springframework.beans.factory.config.BeanDefinition`对象，这些对象包含（除其他信息外）以下元数据：

Property | Explained in…​
---|---
Class | [Instantiating Beans](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#beans-factory-class)
Name | [Naming Beans](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#beans-beanname)
Scope | [Bean Scopes](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#beans-factory-scopes)
Constructor arguments | [Dependency Injection](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#beans-factory-collaborators)
Properties | [Dependency Injection](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#beans-factory-collaborators)
Autowiring mode | [Autowiring Collaborators](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#beans-factory-autowire)
Lazy initialization mode | [Lazy-initialized Beans](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#beans-factory-lazy-init)
Initialization method | [Initialization Callbacks](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#beans-factory-lifecycle-initializingbean)
Destruction method | [Destruction Callbacks](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#beans-factory-lifecycle-disposablebean)

### Bean 命名

每个bean具有一个或多个标识符。这些标识符在**Bean的容器内必须唯一**。

::: tip Bean命名约定
bean名称推荐小驼峰的命名约定。
:::

### bean 实例化

Bean定义实质上是**创建一个或多个对象的方法**。

- 用构造函数实例化
- 用静态工厂方法实例化
- 使用实例工厂方法实例化

#### Bean的运行时类型

确定特定bean的运行时类型并非易事。Bean元数据定义中的指定类只是初始类引用，可能与声明的工厂方法结合使用，或者是FactoryBean可能导致Bean的运行时类型不同的类，或者在实例的情况下根本不设置-级别工厂方法（通过指定factory-bean名称解析）。此外，AOP代理可以使用基于接口的代理包装Bean实例，而目标Bean的实际类型（仅是其实现的接口）的暴露程度有限。

找出特定bean的实际运行时类型的推荐方法是BeanFactory.getType调用指定的bean名称。这考虑了上述所有情况，并返回了BeanFactory.getBean要针对相同bean名称返回的对象的类型。

在Spring文档中，“factory bean”是指在`Spring`容器中配置并通过实例或静态工厂方法创建对象的bean。相反， FactoryBean`（注意大写）是指特定于Spring的FactoryBean实现类。




## 重点/疑惑的知识点

- 默认情况下，ApplicationContext实现会在初始化过程中积极创建和配置所有 单例 bean
- Spring容器可以自动装配协作bean之间的关系
- 可以使用元素的autowire属性为 bean定义指定自动装配模式

- CGLIB final





