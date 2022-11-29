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

::: tip 实际项目中如何使用代理？
按照我们目前的编程习惯，`Mapper`接口使用的`JDK动态代理`，`Service`、`Facade`、`Controller`都是使用`CGLIB`代理。

可以通过在项目启动时，`debug` `AutowiredFieldElement`类来查看注入属性时，使用的是哪种方式实现的代理类。
:::

如下图所示：

![Spring AOP Process](/img/spring/spring-aop-process.jpg)

参考源码如下：
```java
// org.springframework.aop.framework.AopProxyFactory.java
public interface AopProxyFactory {

	AopProxy createAopProxy(AdvisedSupport config) throws AopConfigException;

}
```

```java
// org.springframework.aop.framework.DefaultAopProxyFactory.java
public class DefaultAopProxyFactory implements AopProxyFactory, Serializable {

	@Override
	public AopProxy createAopProxy(AdvisedSupport config) throws AopConfigException {
		if (config.isOptimize() || config.isProxyTargetClass() || hasNoUserSuppliedProxyInterfaces(config)) {
			Class<?> targetClass = config.getTargetClass();
			if (targetClass == null) {
				throw new AopConfigException("TargetSource cannot determine target class: " +
						"Either an interface or a target is required for proxy creation.");
			}
            //  如果是接口，使用JDK动态代理
			if (targetClass.isInterface() || Proxy.isProxyClass(targetClass)) {
				return new JdkDynamicAopProxy(config);
			}
            // 否则使用 cglib
			return new ObjenesisCglibAopProxy(config);
		}
		else {
			return new JdkDynamicAopProxy(config);
		}
	}

	private boolean hasNoUserSuppliedProxyInterfaces(AdvisedSupport config) {
		Class<?>[] ifcs = config.getProxiedInterfaces();
		return (ifcs.length == 0 || (ifcs.length == 1 && SpringProxy.class.isAssignableFrom(ifcs[0])));
	}

}
```

除了以上两种代理方式外，当然你也可以使用`AspectJ` ，`Spring AOP`已经集成了`AspectJ` ，`AspectJ`应该算的上是`Java`生态系统中最完整的`AOP`框架了。

## @EnableAspectJAutoProxy

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Import(AspectJAutoProxyRegistrar.class)
public @interface EnableAspectJAutoProxy {
    // 是否强制指定使用CGLIB代理
	boolean proxyTargetClass() default false;
   /**
     * @since 4.3.1 代理的暴露方式：解决内部调用不能使用代理的场景  默认为false表示不处理
     * true：这个代理就可以通过AopContext.currentProxy()获得这个代理对象的一个副本（ThreadLocal里面）,从而我们可以很方便得在Spring框架上下文中拿到当前代理对象（处理事务时很方便）
     * 必须为true才能调用AopContext得方法，否则报错：Cannot find current proxy: Set 'exposeProxy' property on Advised to 'true' to make it available.
     */
	boolean exposeProxy() default false;
}
```

```java
// org.springframework.context.annotation.AspectJAutoProxyRegistrar.java
class AspectJAutoProxyRegistrar implements ImportBeanDefinitionRegistrar {

	@Override
	public void registerBeanDefinitions(
			AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry) {

		AopConfigUtils.registerAspectJAnnotationAutoProxyCreatorIfNecessary(registry);

		AnnotationAttributes enableAspectJAutoProxy =
				AnnotationConfigUtils.attributesFor(importingClassMetadata, EnableAspectJAutoProxy.class);
		if (enableAspectJAutoProxy != null) {
            // 是否强制指定使用CGLIB代理
			if (enableAspectJAutoProxy.getBoolean("proxyTargetClass")) {
				AopConfigUtils.forceAutoProxyCreatorToUseClassProxying(registry);
			}
            // 代理的暴露方式：解决内部调用不能使用代理的场景
			if (enableAspectJAutoProxy.getBoolean("exposeProxy")) {
				AopConfigUtils.forceAutoProxyCreatorToExposeProxy(registry);
			}
		}
	}
}
```

解决内部方法调用导致`AOP`失效的问题：

- 第一步：需要在启动类中增加以下注解
```java
@EnableAspectJAutoProxy(proxyTargetClass = true, exposeProxy = true)
```

- 第二步：使用 `AopContext.currentProxy()` 获取当前代理，调用内部方法
```java
  CurrentImpl currentProxy = (CurrentImpl) AopContext.currentProxy();
  // 使用代理调用
  currentProxy.method();
```

### AspectJAutoProxyRegistrar :hammer:



##  Spring AOP 和 AspectJ AOP 的区别

`Spring AOP`属于运行时增强，而`AspectJ`是编译时增强。 `Spring AOP`基于代理(`Proxying`)，而`AspectJ`基于字节码操作(`Bytecode Manipulation`)。

`AspectJ`相比于`Spring AOP`功能更加强大，但是`Spring AOP`相对来说更简单，

如果我们的切面比较少，那么两者性能差异不大。但是，当切面太多的话，最好选择`AspectJ` ，它比`Spring AOP`快很多。

##  Spring AOP final 方法

由于在项目里面用到模板方法设计模式，在抽象类里面有一个`final`方法。**这个`final`方法调用`@Autowired`注解的属性字段时候报空指针异常**。

我们知道在默认情况下，如果业务对象未实现接口，则使用`CGLIB`（例如：`controller`类，抽象类的子类）。我们称代理的对象为`proxy`，
被代理的对象是`target`。而对于`final`方法，子类是不能覆盖的，走的代码流程依然是`target`里面的。

`@Autowired` `AutowiredFieldElement` 实现属性依赖注入核心源码如下:
```java
// 根据容器中`Bean`定义，解析指定的依赖关系，获取依赖对象
value = beanFactory.resolveDependency(desc, beanName, autowiredBeanNames, typeConverter);
```

其实最核心还是在`Bean`工厂里，也就是它的唯一内建实现类`org.springframework.beans.factory.support.DefaultListableBeanFactory`。

