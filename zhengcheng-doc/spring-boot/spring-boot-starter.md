---
sidebarDepth: 3
---

# Spring Boot Starter 原理

[[toc]]

## @Enable* 注解的工作原理

### @EnableAsync
```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Import(AsyncConfigurationSelector.class)
public @interface EnableAsync {

	Class<? extends Annotation> annotation() default Annotation.class;

	boolean proxyTargetClass() default false;

	AdviceMode mode() default AdviceMode.PROXY;

	int order() default Ordered.LOWEST_PRECEDENCE;

}
```

### @EnableScheduling
```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Import(SchedulingConfiguration.class)
@Documented
public @interface EnableScheduling {

}
``` 

### @EnableWebMvc
```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@Documented
@Import(DelegatingWebMvcConfiguration.class)
public @interface EnableWebMvc {
}
```

### @EnableConfigurationProperties
```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Import(EnableConfigurationPropertiesImportSelector.class)
public @interface EnableConfigurationProperties {

	Class<?>[] value() default {};

}
```

### @EnableTransactionManagement
```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Import(TransactionManagementConfigurationSelector.class)
public @interface EnableTransactionManagement {

	boolean proxyTargetClass() default false;

	AdviceMode mode() default AdviceMode.PROXY;

	int order() default Ordered.LOWEST_PRECEDENCE;

}
```

### @EnableCaching
```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Import(CachingConfigurationSelector.class)
public @interface EnableCaching {

	boolean proxyTargetClass() default false;

	AdviceMode mode() default AdviceMode.PROXY;

	int order() default Ordered.LOWEST_PRECEDENCE;

}
```

以上所有的注解都有一个`@Import`注解，`@Import`是用来导入配置类的，这也意味着这些自动开启的实现其实是导入一些自动配置的`bean`。这些导入的配置方式主要分为以下三种类型：
1. 直接导入配置类，被`@Configuration`修饰的类。
2. `ImportSelector`接口的实现类，返回一个配置类名称的数组，然后再导入这些配置类。
3. `ImportBeanDefinitionRegistrar`接口的实现类，直接在接口方法中注册`Bean`。

`ImportSelector`接口的一个实现类`AutoConfigurationImportSelector`完成了从`ClassPath`下各个`starter`中的`META-INF/spring.factories`文件中读取需要导入的自动配置类。
`@SpringBootApplication`注解则间接继承了`AutoConfigurationImportSelector`的功能。

## 什么是 SpringBoot 自动装配？

我们现在提到自动装配的时候，一般会和`Spring Boot`联系在一起。但是，实际上`Spring Framework`早就实现了这个功能。`Spring Boot`只是在其基础上，通过`SPI`的方式，做了进一步优化。

`SpringBoot`定义了一套接口规范，这套规范规定：`SpringBoot`在启动时会扫描外部引用`jar`包中的`META-INF/spring.factories`文件，将文件中配置的类型信息加载到`Spring`容器（此处涉及到`JVM`类加载机制与`Spring`的容器知识），
并执行类中定义的各种操作。对于外部`jar`来说，只需要按照`SpringBoot`定义的标准，就能将自己的功能装置进`SpringBoot`。

没有`Spring Boot`的情况下，如果我们需要引入第三方依赖，需要手动配置，非常麻烦。但是，`Spring Boot`中，我们直接引入一个`starter`即可。
比如你想要在项目中使用`redis`的话，直接在项目中引入对应的`starter`即可。
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```
引入`starter`之后，我们通过少量注解和一些简单的配置就能使用第三方组件提供的功能了。

在我看来，自动装配可以简单理解为：**通过注解或者一些简单的配置就能在`Spring Boot`的帮助下实现某块功能**。

## SpringBoot 是如何实现自动装配的？

先看一下`SpringBoot`的核心注解`SpringBootApplication`
```java
/**
 * Indicates a {@link Configuration configuration} class that declares one or more
 * {@link Bean @Bean} methods and also triggers {@link EnableAutoConfiguration
 * auto-configuration} and {@link ComponentScan component scanning}. This is a convenience
 * annotation that is equivalent to declaring {@code @Configuration},
 * {@code @EnableAutoConfiguration} and {@code @ComponentScan}.
 *
 * @author Phillip Webb
 * @author Stephane Nicoll
 * @since 1.2.0
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@SpringBootConfiguration
@EnableAutoConfiguration
@ComponentScan(excludeFilters = { @Filter(type = FilterType.CUSTOM, classes = TypeExcludeFilter.class),
		@Filter(type = FilterType.CUSTOM, classes = AutoConfigurationExcludeFilter.class) })
public @interface SpringBootApplication {

	/**
	 * Exclude specific auto-configuration classes such that they will never be applied.
	 * @return the classes to exclude
	 */
	@AliasFor(annotation = EnableAutoConfiguration.class)
	Class<?>[] exclude() default {};

	/**
	 * Exclude specific auto-configuration class names such that they will never be
	 * applied.
	 * @return the class names to exclude
	 * @since 1.3.0
	 */
	@AliasFor(annotation = EnableAutoConfiguration.class)
	String[] excludeName() default {};

	/**
	 * Base packages to scan for annotated components. Use {@link #scanBasePackageClasses}
	 * for a type-safe alternative to String-based package names.
	 * <p>
	 * <strong>Note:</strong> this setting is an alias for
	 * {@link ComponentScan @ComponentScan} only. It has no effect on {@code @Entity}
	 * scanning or Spring Data {@link Repository} scanning. For those you should add
	 * {@link org.springframework.boot.autoconfigure.domain.EntityScan @EntityScan} and
	 * {@code @Enable...Repositories} annotations.
	 * @return base packages to scan
	 * @since 1.3.0
	 */
	@AliasFor(annotation = ComponentScan.class, attribute = "basePackages")
	String[] scanBasePackages() default {};

	/**
	 * Type-safe alternative to {@link #scanBasePackages} for specifying the packages to
	 * scan for annotated components. The package of each class specified will be scanned.
	 * <p>
	 * Consider creating a special no-op marker class or interface in each package that
	 * serves no purpose other than being referenced by this attribute.
	 * <p>
	 * <strong>Note:</strong> this setting is an alias for
	 * {@link ComponentScan @ComponentScan} only. It has no effect on {@code @Entity}
	 * scanning or Spring Data {@link Repository} scanning. For those you should add
	 * {@link org.springframework.boot.autoconfigure.domain.EntityScan @EntityScan} and
	 * {@code @Enable...Repositories} annotations.
	 * @return base packages to scan
	 * @since 1.3.0
	 */
	@AliasFor(annotation = ComponentScan.class, attribute = "basePackageClasses")
	Class<?>[] scanBasePackageClasses() default {};

}
```
大概可以把`@SpringBootApplication`看作是`@Configuration`、`@EnableAutoConfiguration`、`@ComponentScan`注解的集合。
根据`SpringBoot`官网，这三个注解的作用分别是：
- `@EnableAutoConfiguration`：启用`SpringBoot`的自动配置机制
- `@Configuration`：允许在上下文中注册额外的`bean`或导入其他配置类
- `@ComponentScan`： 扫描被`@Component` (`@Service`,`@Controller`)注解的`bean`，注解默认会扫描启动类所在的包下所有的类 ，可以自定义不扫描某些`bean`。如上面的源码所示，容器中将排除`TypeExcludeFilter`和`AutoConfigurationExcludeFilter`。

---
**参考文档**
- [淘宝一面：“说一下 Spring Boot 自动装配原理呗？”](https://www.cnblogs.com/javaguide/p/springboot-auto-config.html)