# Spring Transactional

[官方文档](https://docs.spring.io/spring-framework/docs/current/spring-framework-reference/data-access.html#transaction)

事务：逻辑上的一组操作，**要么都执行，要么都不执行**。

## 事物的特性（ACID）

- **原子性（Atomicity）**： 一个事务（transaction）中的所有操作，或者全部完成，或者全部不完成，不会结束在中间某个环节。事务在执行过程中发生错误，会被回滚（Rollback）到事务开始前的状态，就像这个事务从来没有执行过一样。即，事务不可分割、不可约简。
- **一致性（Consistency）**： 在事务开始之前和事务结束以后，数据库的完整性没有被破坏。这表示写入的资料必须完全符合所有的预设约束、触发器、级联回滚等。
- **隔离性（Isolation）**： 数据库允许多个并发事务同时对其数据进行读写和修改的能力，隔离性可以防止多个事务并发执行时由于交叉执行而导致数据的不一致。事务隔离分为不同级别，包括未提交读（Read uncommitted）、提交读（read committed）、可重复读（repeatable read）和串行化（Serializable）。
- **持久性（Durability）**: 事务处理结束后，对数据的修改就是永久的，即便系统故障也不会丢失。

## Spring框架的声明式事务实现

下图显示了在事务代理上调用方法的概念图：
![tx](/img/spring/tx.png)

### @Transactional 注解的属性信息

```java
// org.springframework.transaction.annotation

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
value | String | Optional qualifier that specifies the transaction manager to be used.
propagation | enum: Propagation | Optional propagation setting.
isolation | enum: Isolation | Optional isolation level. Applies only to propagation values of REQUIRED or REQUIRES_NEW.
timeout | int (in seconds of granularity) | Optional transaction timeout. Applies only to propagation values of REQUIRED or REQUIRES_NEW.
readOnly | boolean | Read-write versus read-only transaction. Only applicable to values of REQUIRED or REQUIRES_NEW.
rollbackFor | Array of Class objects, which must be derived from Throwable. | Optional array of exception classes that must cause rollback.
rollbackForClassName | Array of class names. The classes must be derived from Throwable. | Optional array of names of exception classes that must cause rollback.
noRollbackFor | Array of Class objects, which must be derived from Throwable. | Optional array of exception classes that must not cause rollback.
noRollbackForClassName | Array of String class names, which must be derived from Throwable. | Optional array of names of exception classes that must not cause rollback.


### Spring 中事务传播

#### PROPAGATION_REQUIRED
![tx_prop_required](/img/spring/tx_prop_required.png)

#### PROPAGATION_REQUIRES_NEW
![tx_prop_requires_new](/img/spring/tx_prop_requires_new.png)

#### PROPAGATION_NESTED

`PROPAGATION_NESTED` uses a single physical transaction with multiple savepoints that it can roll back to. Such partial rollbacks let an inner transaction scope trigger a rollback for its scope, with the outer transaction being able to continue the physical transaction despite some operations having been rolled back. This setting is typically mapped onto JDBC savepoints, so it works only with JDBC resource transactions. See Spring’s `DataSourceTransactionManager`.

