# IoC

## 什么是 IoC

`IoC` （Inversion of control ）控制反转。**它是一种思想并不是一个技术实现**。描述的是`Java`开发领域对象的创建以及管理的问题。

例如：现有类`A`依赖于类`B`

- **传统的开发方式** ：往往是在类`A`中手动通过`new`关键字来`new`一个`B`的对象出来
- **使用`IoC`思想的开发方式** ：不通过`new`关键字来创建对象，而是通过`IoC`容器(`Spring`框架) 来帮助我们实例化对象。我们需要哪个对象，直接从`IoC`容器里面过去即可。

从以上两种开发方式的对比来看：我们 “丧失了一个权力” (创建、管理对象的权力)，从而也得到了一个好处（不用再考虑对象的创建、管理等一系列的事情）。

- `IoC` 解决了什么问题/有什么好处？
    
    - 对象之间的耦合度或者说依赖程度降低；
    - 资源变的容易管理；
    
- `IoC` 和 `DI` 的区别？

    `IoC`最常见以及最合理的**实现方式**叫做**依赖注入**（Dependency Injection，简称 `DI`）并且，老马（Martin Fowler）在一篇文章中提到将`IoC`改名为`DI`，[原文地址](https://martinfowler.com/articles/injection.html)。
    
    `DI`的主要两种方式，分别为：
    - 基于构造函数的依赖注入
    - 基于Setter的依赖注入 

## IoC 容器

- **org.springframework.beans.factory.BeanFactory**: 是`Spring`里面最低层的接口，提供了最简单的容器的功能，只提供了实例化对象和获取对象的功能。
```java
public interface BeanFactory {

	String FACTORY_BEAN_PREFIX = "&";

	Object getBean(String name) throws BeansException;

	<T> T getBean(String name, Class<T> requiredType) throws BeansException;

	Object getBean(String name, Object... args) throws BeansException;

	<T> T getBean(Class<T> requiredType) throws BeansException;

	<T> T getBean(Class<T> requiredType, Object... args) throws BeansException;

	<T> ObjectProvider<T> getBeanProvider(Class<T> requiredType);

	<T> ObjectProvider<T> getBeanProvider(ResolvableType requiredType);

	boolean containsBean(String name);

	boolean isSingleton(String name) throws NoSuchBeanDefinitionException;

	boolean isPrototype(String name) throws NoSuchBeanDefinitionException;

	boolean isTypeMatch(String name, ResolvableType typeToMatch) throws NoSuchBeanDefinitionException;

	boolean isTypeMatch(String name, Class<?> typeToMatch) throws NoSuchBeanDefinitionException;

	@Nullable
	Class<?> getType(String name) throws NoSuchBeanDefinitionException;

	String[] getAliases(String name);

}
```
- **org.springframework.context.ApplicationContext**: 应用上下文，继承`BeanFactory`接口，它是`Spring`的一各更高级的容器，提供了更多的有用的功能；
   - 与`Spring`的`AOP`功能轻松集成
   - 消息资源处理（用于国际化）
   - 活动发布
   - 应用层特定的上下文，例如`WebApplicationContext`用于Web应用程序中的

