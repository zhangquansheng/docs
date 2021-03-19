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
