---
sidebarDepth: 3
---

# 1. IoC容器

[[toc]]

## Spring IoC容器和Bean简介

### 什么是 IoC

`IoC` （Inversion of control ）控制反转。**它是一种思想并不是一个技术实现**。描述的是：Java 开发领域对象的创建以及管理的问题。

例如：现有类 A 依赖于类 B

- **传统的开发方式** ：往往是在类 `A` 中手动通过 `new` 关键字来 `new` 一个 `B` 的对象出来
- **使用`IoC`思想的开发方式** ：不通过 `new` 关键字来创建对象，而是通过 `IoC` 容器(Spring 框架) 来帮助我们实例化对象。我们需要哪个对象，直接从 `IoC` 容器里面过去即可。

从以上两种开发方式的对比来看：我们 “丧失了一个权力” (创建、管理对象的权力)，从而也得到了一个好处（不用再考虑对象的创建、管理等一系列的事情）

### IoC 解决了什么问题

`IoC` 的思想就是两方之间不互相依赖，由第三方容器来管理相关资源。这样有什么好处呢？

- 对象之间的耦合度或者说依赖程度降低；
- 资源变的容易管理；

### IoC 和 DI 

`IoC` 最常见以及最合理的**实现方式**叫做**依赖注入**（Dependency Injection，简称 `DI`）并且，老马（Martin Fowler）在一篇文章中提到将`IoC`改名为`DI`，[原文地址](https://martinfowler.com/articles/injection.html)。

### IoC 容器

- **org.springframework.beans.BeanFactory**:
- **org.springframework.context.ApplicationContext**:

