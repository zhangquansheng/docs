---
sidebarDepth: 3
---

# Spring框架的声明式事务实现

[[toc]]


在`Spring`中使用事务非常简单，首先使用注解`@EnableTransactionManagement`开启事务支持后，然后添加注解`@Transactional`便可。为了提供更深入的理解，本文介绍了在与事务相关的问题的上下文中，`Spring`框架的声明式事务基础结构的内部工作方式。

Spring Frameworks `TransactionInterceptor`为命令式和响应式编程模型提供事务管理。拦截器通过**检查方法返回类型**来检测所需的事务管理风格。

命令式事务需要使用`PlatformTransactionManager`，而响应式事务则使用`ReactiveTransactionManager`实现。

下图显示了在事务代理上调用方法的概念图：
![tx](/img/spring/tx.png)

## @Transactional

```java
// org.springframework.transaction.annotation.Transactional.java

@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@Documented
public @interface Transactional {

	@AliasFor("transactionManager")
	String value() default "";

	@AliasFor("value")
	String transactionManager() default "";

	Propagation propagation() default Propagation.REQUIRED;

	Isolation isolation() default Isolation.DEFAULT;

	int timeout() default TransactionDefinition.TIMEOUT_DEFAULT;

	boolean readOnly() default false;

	Class<? extends Throwable>[] rollbackFor() default {};

	String[] rollbackForClassName() default {};

	Class<? extends Throwable>[] noRollbackFor() default {};

	String[] noRollbackForClassName() default {};

}
```

Property|Type|Description
---|---|---
value | String | 当在配置文件中有多个 TransactionManager , 可以用该属性指定选择哪个事务管理器。
propagation | enum: Propagation | 事务的传播行为，默认值为 REQUIRED。
isolation | enum: Isolation | 事务的隔离级别. Applies only to propagation values of REQUIRED or REQUIRES_NEW.
timeout | int (in seconds of granularity) | 事务的超时时间，单位秒，默认值为-1。如果超过该时间限制但事务还没有完成，则自动回滚事务。
readOnly | boolean | 指定事务是否为只读事务. Only applicable to values of REQUIRED or REQUIRES_NEW.
rollbackFor | Array of Class objects, which must be derived from Throwable. | Optional array of exception classes that must cause rollback.
rollbackForClassName | Array of class names. The classes must be derived from Throwable. | Optional array of names of exception classes that must cause rollback.
noRollbackFor | Array of Class objects, which must be derived from Throwable. | Optional array of exception classes that must not cause rollback.
noRollbackForClassName | Array of String class names, which must be derived from Throwable. | Optional array of names of exception classes that must not cause rollback.

### 事务传播(propagation)

事务传播行为是为了解决业务层方法之间互相调用的事务问题。

当事务方法被另一个事务方法调用时，必须指定事务应该如何传播。例如：方法可能继续在现有事务中运行，也可能开启一个新事务，并在自己的事务中运行。

在`TransactionDefinition`定义中包括了如下几个表示传播行为的常量：
```java
// org.springframework.transaction.TransactionDefinition.java
public interface TransactionDefinition {

	int PROPAGATION_REQUIRED = 0;

	int PROPAGATION_SUPPORTS = 1;

	int PROPAGATION_MANDATORY = 2;

	int PROPAGATION_REQUIRES_NEW = 3;

	int PROPAGATION_NOT_SUPPORTED = 4;

	int PROPAGATION_NEVER = 5;

	int PROPAGATION_NESTED = 6;
    
    //...

}
```

为了方便使用，`Spring`相应地定义了一个枚举类：`Propagation`

```java
// org.springframework.transaction.annotation.Propagation.java

public enum Propagation {

	REQUIRED(TransactionDefinition.PROPAGATION_REQUIRED),

	SUPPORTS(TransactionDefinition.PROPAGATION_SUPPORTS),

	MANDATORY(TransactionDefinition.PROPAGATION_MANDATORY),

	REQUIRES_NEW(TransactionDefinition.PROPAGATION_REQUIRES_NEW),

	NOT_SUPPORTED(TransactionDefinition.PROPAGATION_NOT_SUPPORTED),

	NEVER(TransactionDefinition.PROPAGATION_NEVER),

	NESTED(TransactionDefinition.PROPAGATION_NESTED);


	private final int value;


	Propagation(int value) {
		this.value = value;
	}

	public int value() {
		return this.value;
	}

}
```

1. TransactionDefinition.PROPAGATION_REQUIRED (默认)

如果当前存在事务，则加入该事务；如果当前没有事务，则创建一个新的事务。也就是说：

   - 如果`外部方法`没有开启事务的话，那么`Propagation.REQUIRED`修饰的`内部方法`会新开启自己的事务，且开启的事务相互独立，互不干扰。
   - 如果`外部方法`开启事务并且被`Propagation.REQUIRED`的话，那么所有`Propagation.REQUIRED`修饰的`内部方法`和`外部方法`均属于`同一事务` ，只要一个方法回滚，整个事务均回滚。

![tx_prop_required](/img/spring/tx_prop_required.png)

2. TransactionDefinition.PROPAGATION_REQUIRES_NEW

**创建一个新的事务**，如果当前存在事务，则把当前事务挂起。也就是说不管`外部方法`是否开启事务，`Propagation.REQUIRES_NEW`修饰的`内部方法`会新开启自己的事务，且开启的事务相互独立，互不干扰。

![tx_prop_requires_new](/img/spring/tx_prop_requires_new.png)

3. TransactionDefinition.PROPAGATION_NESTED

如果当前存在事务，则创建一个事务作为当前事务的嵌套事务来运行；如果当前没有事务，则该取值等价于`TransactionDefinition.PROPAGATION_REQUIRED`。也就是说：

   - 在外部方法未开启事务的情况下`Propagation.NESTED`和`Propagation.REQUIRED`作用相同，修饰的内部方法都会新开启自己的事务，且开启的事务相互独立，互不干扰。
   - 如果外部方法开启事务的话，`Propagation.NESTED`修饰的内部方法属于外部事务的子事务，外部主事务回滚的话，子事务也会回滚，而内部子事务可以单独回滚而不影响外部主事务和其他子事务。

4. TransactionDefinition.PROPAGATION_SUPPORTS

如果当前存在事务，则加入该事务；如果当前没有事务，则以非事务的方式继续运行。
    
5. TransactionDefinition.PROPAGATION_NOT_SUPPORTED

以非事务方式运行，如果当前存在事务，则把当前事务挂起。

6. TransactionDefinition.PROPAGATION_NEVER

以非事务方式运行，如果当前存在事务，则抛出异常。

### 事务隔离级别(isolation)

```java
// org.springframework.transaction.annotation.Isolation.java

public enum Isolation {

	DEFAULT(TransactionDefinition.ISOLATION_DEFAULT),

	READ_UNCOMMITTED(TransactionDefinition.ISOLATION_READ_UNCOMMITTED),

	READ_COMMITTED(TransactionDefinition.ISOLATION_READ_COMMITTED),

	REPEATABLE_READ(TransactionDefinition.ISOLATION_REPEATABLE_READ),

	SERIALIZABLE(TransactionDefinition.ISOLATION_SERIALIZABLE);

	private final int value;

	Isolation(int value) {
		this.value = value;
	}

	public int value() {
		return this.value;
	}

}
```

1. TransactionDefinition.ISOLATION_DEFAULT 

使用后端数据库默认的隔离级别，MySQL 默认采用的 REPEATABLE_READ 隔离级别 Oracle 默认采用的 READ_COMMITTED 隔离级别.

2. TransactionDefinition.ISOLATION_READ_UNCOMMITTED

最低的隔离级别，使用这个隔离级别很少，因为它允许读取尚未提交的数据变更，可能会导致脏读、幻读或不可重复读

3. TransactionDefinition.ISOLATION_READ_COMMITTED

允许读取并发事务已经提交的数据，可以阻止脏读，但是幻读或不可重复读仍有可能发生

4. TransactionDefinition.ISOLATION_REPEATABLE_READ

对同一字段的多次读取结果都是一致的，除非数据是被本身事务自己所修改，可以阻止脏读和不可重复读，但幻读仍有可能发生。

5. TransactionDefinition.ISOLATION_SERIALIZABLE

最高的隔离级别，完全服从 ACID 的隔离级别。所有的事务依次逐个执行，这样事务之间就完全不可能产生干扰，也就是说，该级别可以防止脏读、不可重复读以及幻读。但是这将严重影响程序的性能。通常情况下也不会用到该级别。

### 事务超时属性(timeout)

所谓事务超时，就是指一个事务所允许执行的最长时间，如果超过该时间限制但事务还没有完成，则自动回滚事务。在`TransactionDefinition`中以`int`的值来表示超时时间，其单位是`秒`，默认值为`-1`。

### 事务只读属性(readOnly)

对于只有读取数据查询的事务，可以指定事务类型为`readonly`，即只读事务。只读事务不涉及数据的修改，数据库会提供一些优化手段，适合用在有多条数据库查询操作的方法中。

:point_right:
::: tip  延伸思考
为什么一个数据查询操作还要启用事务支持呢？
:::

### 事务回滚规则

`rollbackFor` `rollbackForClassName` `noRollbackFor` `noRollbackForClassName`

这些规则定义了哪些异常会导致事务回滚而哪些不会。默认情况下，事务只有遇到运行期异常（`RuntimeException` 的子类）时才会回滚，`Error`也会导致事务回滚。

如果你想要回滚自定义异常类型的话，可以这样：
```java
@Transactional(rollbackFor= MyException.class)
```

## @Transactional 作用范围

- **方法：** 推荐将注解使用于方法上，不过需要注意的是：该注解只能应用到 `public` 方法上，否则不生效。
- **类：** 如果这个注解使用在类上的话，表明该注解对该类中所有的 public 方法都生效。
- **接口：** 不推荐在接口上使用。

:point_right:
::: tip 延伸思考
为什么不推荐在接口上使用`@Transactional`注解？
:::

`@Transactional`注解应用到 `public` 方法，才能进行事务管理。源码如下：
```java
// org.springframework.transaction.interceptor.AbstractFallbackTransactionAttributeSource.java

public abstract class AbstractFallbackTransactionAttributeSource implements TransactionAttributeSource {
             
    //...

	@Nullable
	protected TransactionAttribute computeTransactionAttribute(Method method, @Nullable Class<?> targetClass) {
		// Don't allow no-public methods as required.
		if (allowPublicMethodsOnly() && !Modifier.isPublic(method.getModifiers())) {
			return null;
		}

		//...

		return null;
	}

    //...

}
```

## @Transactional 实现原理

`@Transactional`的工作机制是基于`AOP`实现的，`AOP`是使用**动态代理**实现的。默认情况下如果目标对象实现了接口，会采用**JDK的动态代理**，如果目标对象没有实现了接口,会使用**CGLIB动态代理**。源码如下：

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
			if (targetClass.isInterface() || Proxy.isProxyClass(targetClass)) {
				return new JdkDynamicAopProxy(config);
			}
			return new ObjenesisCglibAopProxy(config);
		}
		else {
			return new JdkDynamicAopProxy(config);
		}
	}

	/**
	 * Determine whether the supplied {@link AdvisedSupport} has only the
	 * {@link org.springframework.aop.SpringProxy} interface specified
	 * (or no proxy interfaces specified at all).
	 */
	private boolean hasNoUserSuppliedProxyInterfaces(AdvisedSupport config) {
		Class<?>[] ifcs = config.getProxiedInterfaces();
		return (ifcs.length == 0 || (ifcs.length == 1 && SpringProxy.class.isAssignableFrom(ifcs[0])));
	}

}
```

`Spring AOP`自调用问题：若`同一类`中的其他没有`@Transactional`注解的方法内部调用有`@Transactional`注解的方法，有`@Transactional`注解的方法的事务会失效。

解决办法就是避免同一类中自调用或者使用`AspectJ`取代`Spring AOP`代理。

## @Transactional 使用

[官方文档](https://docs.spring.io/spring-framework/docs/current/spring-framework-reference/data-access.html#transaction-declarative-annotations)
 
使用总结：
- `@Transactional` 注解只有作用到 `public` 方法上事务才生效，不推荐在接口上使用；
- 避免同一个类中调用 `@Transactional` 注解的方法，这样会导致事务失效；
- 正确的设置 `@Transactional` 的 `rollbackFor` 和 `propagation` 属性，否则事务可能会回滚失败；


