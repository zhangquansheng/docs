---
sidebarDepth: 3
---

# Spring Boot Starter 原理

[[toc]]

## @Enable* 注解的工作原理

### @EnableAsync
```java
/**
 * Enables Spring's asynchronous method execution capability, similar to functionality
 * found in Spring's {@code <task:*>} XML namespace.
 *
 * <p>To be used together with @{@link Configuration Configuration} classes as follows,
 * enabling annotation-driven async processing for an entire Spring application context:
 *
 * <pre class="code">
 * &#064;Configuration
 * &#064;EnableAsync
 * public class AppConfig {
 *
 * }</pre>
 *
 * {@code MyAsyncBean} is a user-defined type with one or more methods annotated with
 * either Spring's {@code @Async} annotation, the EJB 3.1 {@code @javax.ejb.Asynchronous}
 * annotation, or any custom annotation specified via the {@link #annotation} attribute.
 * The aspect is added transparently for any registered bean, for instance via this
 * configuration:
 *
 * <pre class="code">
 * &#064;Configuration
 * public class AnotherAppConfig {
 *
 *     &#064;Bean
 *     public MyAsyncBean asyncBean() {
 *         return new MyAsyncBean();
 *     }
 * }</pre>
 *
 * <p>By default, Spring will be searching for an associated thread pool definition:
 * either a unique {@link org.springframework.core.task.TaskExecutor} bean in the context,
 * or an {@link java.util.concurrent.Executor} bean named "taskExecutor" otherwise. If
 * neither of the two is resolvable, a {@link org.springframework.core.task.SimpleAsyncTaskExecutor}
 * will be used to process async method invocations. Besides, annotated methods having a
 * {@code void} return type cannot transmit any exception back to the caller. By default,
 * such uncaught exceptions are only logged.
 *
 * <p>To customize all this, implement {@link AsyncConfigurer} and provide:
 * <ul>
 * <li>your own {@link java.util.concurrent.Executor Executor} through the
 * {@link AsyncConfigurer#getAsyncExecutor getAsyncExecutor()} method, and</li>
 * <li>your own {@link org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler
 * AsyncUncaughtExceptionHandler} through the {@link AsyncConfigurer#getAsyncUncaughtExceptionHandler
 * getAsyncUncaughtExceptionHandler()}
 * method.</li>
 * </ul>
 *
 * <p><b>NOTE: {@link AsyncConfigurer} configuration classes get initialized early
 * in the application context bootstrap. If you need any dependencies on other beans
 * there, make sure to declare them 'lazy' as far as possible in order to let them
 * go through other post-processors as well.</b>
 *
 * <pre class="code">
 * &#064;Configuration
 * &#064;EnableAsync
 * public class AppConfig implements AsyncConfigurer {
 *
 *     &#064;Override
 *     public Executor getAsyncExecutor() {
 *         ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
 *         executor.setCorePoolSize(7);
 *         executor.setMaxPoolSize(42);
 *         executor.setQueueCapacity(11);
 *         executor.setThreadNamePrefix("MyExecutor-");
 *         executor.initialize();
 *         return executor;
 *     }
 *
 *     &#064;Override
 *     public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
 *         return new MyAsyncUncaughtExceptionHandler();
 *     }
 * }</pre>
 *
 * <p>If only one item needs to be customized, {@code null} can be returned to
 * keep the default settings. Consider also extending from {@link AsyncConfigurerSupport}
 * when possible.
 *
 * <p>Note: In the above example the {@code ThreadPoolTaskExecutor} is not a fully managed
 * Spring bean. Add the {@code @Bean} annotation to the {@code getAsyncExecutor()} method
 * if you want a fully managed bean. In such circumstances it is no longer necessary to
 * manually call the {@code executor.initialize()} method as this will be invoked
 * automatically when the bean is initialized.
 *
 * <p>For reference, the example above can be compared to the following Spring XML
 * configuration:
 *
 * <pre class="code">
 * &lt;beans&gt;
 *
 *     &lt;task:annotation-driven executor="myExecutor" exception-handler="exceptionHandler"/&gt;
 *
 *     &lt;task:executor id="myExecutor" pool-size="7-42" queue-capacity="11"/&gt;
 *
 *     &lt;bean id="asyncBean" class="com.foo.MyAsyncBean"/&gt;
 *
 *     &lt;bean id="exceptionHandler" class="com.foo.MyAsyncUncaughtExceptionHandler"/&gt;
 *
 * &lt;/beans&gt;
 * </pre>
 *
 * The above XML-based and JavaConfig-based examples are equivalent except for the
 * setting of the <em>thread name prefix</em> of the {@code Executor}; this is because
 * the {@code <task:executor>} element does not expose such an attribute. This
 * demonstrates how the JavaConfig-based approach allows for maximum configurability
 * through direct access to actual componentry.
 *
 * <p>The {@link #mode} attribute controls how advice is applied: If the mode is
 * {@link AdviceMode#PROXY} (the default), then the other attributes control the behavior
 * of the proxying. Please note that proxy mode allows for interception of calls through
 * the proxy only; local calls within the same class cannot get intercepted that way.
 *
 * <p>Note that if the {@linkplain #mode} is set to {@link AdviceMode#ASPECTJ}, then the
 * value of the {@link #proxyTargetClass} attribute will be ignored. Note also that in
 * this case the {@code spring-aspects} module JAR must be present on the classpath, with
 * compile-time weaving or load-time weaving applying the aspect to the affected classes.
 * There is no proxy involved in such a scenario; local calls will be intercepted as well.
 *
 * @author Chris Beams
 * @author Juergen Hoeller
 * @author Stephane Nicoll
 * @author Sam Brannen
 * @since 3.1
 * @see Async
 * @see AsyncConfigurer
 * @see AsyncConfigurationSelector
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Import(AsyncConfigurationSelector.class)
public @interface EnableAsync {

	/**
	 * Indicate the 'async' annotation type to be detected at either class
	 * or method level.
	 * <p>By default, both Spring's @{@link Async} annotation and the EJB 3.1
	 * {@code @javax.ejb.Asynchronous} annotation will be detected.
	 * <p>This attribute exists so that developers can provide their own
	 * custom annotation type to indicate that a method (or all methods of
	 * a given class) should be invoked asynchronously.
	 */
	Class<? extends Annotation> annotation() default Annotation.class;

	/**
	 * Indicate whether subclass-based (CGLIB) proxies are to be created as opposed
	 * to standard Java interface-based proxies.
	 * <p><strong>Applicable only if the {@link #mode} is set to {@link AdviceMode#PROXY}</strong>.
	 * <p>The default is {@code false}.
	 * <p>Note that setting this attribute to {@code true} will affect <em>all</em>
	 * Spring-managed beans requiring proxying, not just those marked with {@code @Async}.
	 * For example, other beans marked with Spring's {@code @Transactional} annotation
	 * will be upgraded to subclass proxying at the same time. This approach has no
	 * negative impact in practice unless one is explicitly expecting one type of proxy
	 * vs. another &mdash; for example, in tests.
	 */
	boolean proxyTargetClass() default false;

	/**
	 * Indicate how async advice should be applied.
	 * <p><b>The default is {@link AdviceMode#PROXY}.</b>
	 * Please note that proxy mode allows for interception of calls through the proxy
	 * only. Local calls within the same class cannot get intercepted that way; an
	 * {@link Async} annotation on such a method within a local call will be ignored
	 * since Spring's interceptor does not even kick in for such a runtime scenario.
	 * For a more advanced mode of interception, consider switching this to
	 * {@link AdviceMode#ASPECTJ}.
	 */
	AdviceMode mode() default AdviceMode.PROXY;

	/**
	 * Indicate the order in which the {@link AsyncAnnotationBeanPostProcessor}
	 * should be applied.
	 * <p>The default is {@link Ordered#LOWEST_PRECEDENCE} in order to run
	 * after all other post-processors, so that it can add an advisor to
	 * existing proxies rather than double-proxy.
	 */
	int order() default Ordered.LOWEST_PRECEDENCE;

}
```

### @EnableScheduling
```java
/**
 * Enables Spring's scheduled task execution capability, similar to
 * functionality found in Spring's {@code <task:*>} XML namespace. To be used
 * on @{@link Configuration} classes as follows:
 *
 * <pre class="code">
 * &#064;Configuration
 * &#064;EnableScheduling
 * public class AppConfig {
 *
 *     // various &#064;Bean definitions
 * }</pre>
 *
 * This enables detection of @{@link Scheduled} annotations on any Spring-managed
 * bean in the container. For example, given a class {@code MyTask}
 *
 * <pre class="code">
 * package com.myco.tasks;
 *
 * public class MyTask {
 *
 *     &#064;Scheduled(fixedRate=1000)
 *     public void work() {
 *         // task execution logic
 *     }
 * }</pre>
 *
 * the following configuration would ensure that {@code MyTask.work()} is called
 * once every 1000 ms:
 *
 * <pre class="code">
 * &#064;Configuration
 * &#064;EnableScheduling
 * public class AppConfig {
 *
 *     &#064;Bean
 *     public MyTask task() {
 *         return new MyTask();
 *     }
 * }</pre>
 *
 * Alternatively, if {@code MyTask} were annotated with {@code @Component}, the
 * following configuration would ensure that its {@code @Scheduled} method is
 * invoked at the desired interval:
 *
 * <pre class="code">
 * &#064;Configuration
 * &#064;EnableScheduling
 * &#064;ComponentScan(basePackages="com.myco.tasks")
 * public class AppConfig {
 * }</pre>
 *
 * Methods annotated with {@code @Scheduled} may even be declared directly within
 * {@code @Configuration} classes:
 *
 * <pre class="code">
 * &#064;Configuration
 * &#064;EnableScheduling
 * public class AppConfig {
 *
 *     &#064;Scheduled(fixedRate=1000)
 *     public void work() {
 *         // task execution logic
 *     }
 * }</pre>
 *
 * <p>By default, will be searching for an associated scheduler definition: either
 * a unique {@link org.springframework.scheduling.TaskScheduler} bean in the context,
 * or a {@code TaskScheduler} bean named "taskScheduler" otherwise; the same lookup
 * will also be performed for a {@link java.util.concurrent.ScheduledExecutorService}
 * bean. If neither of the two is resolvable, a local single-threaded default
 * scheduler will be created and used within the registrar.
 *
 * <p>When more control is desired, a {@code @Configuration} class may implement
 * {@link SchedulingConfigurer}. This allows access to the underlying
 * {@link ScheduledTaskRegistrar} instance. For example, the following example
 * demonstrates how to customize the {@link Executor} used to execute scheduled
 * tasks:
 *
 * <pre class="code">
 * &#064;Configuration
 * &#064;EnableScheduling
 * public class AppConfig implements SchedulingConfigurer {
 *
 *     &#064;Override
 *     public void configureTasks(ScheduledTaskRegistrar taskRegistrar) {
 *         taskRegistrar.setScheduler(taskExecutor());
 *     }
 *
 *     &#064;Bean(destroyMethod="shutdown")
 *     public Executor taskExecutor() {
 *         return Executors.newScheduledThreadPool(100);
 *     }
 * }</pre>
 *
 * <p>Note in the example above the use of {@code @Bean(destroyMethod="shutdown")}.
 * This ensures that the task executor is properly shut down when the Spring
 * application context itself is closed.
 *
 * <p>Implementing {@code SchedulingConfigurer} also allows for fine-grained
 * control over task registration via the {@code ScheduledTaskRegistrar}.
 * For example, the following configures the execution of a particular bean
 * method per a custom {@code Trigger} implementation:
 *
 * <pre class="code">
 * &#064;Configuration
 * &#064;EnableScheduling
 * public class AppConfig implements SchedulingConfigurer {
 *
 *     &#064;Override
 *     public void configureTasks(ScheduledTaskRegistrar taskRegistrar) {
 *         taskRegistrar.setScheduler(taskScheduler());
 *         taskRegistrar.addTriggerTask(
 *             new Runnable() {
 *                 public void run() {
 *                     myTask().work();
 *                 }
 *             },
 *             new CustomTrigger()
 *         );
 *     }
 *
 *     &#064;Bean(destroyMethod="shutdown")
 *     public Executor taskScheduler() {
 *         return Executors.newScheduledThreadPool(42);
 *     }
 *
 *     &#064;Bean
 *     public MyTask myTask() {
 *         return new MyTask();
 *     }
 * }</pre>
 *
 * <p>For reference, the example above can be compared to the following Spring XML
 * configuration:
 *
 * <pre class="code">
 * &lt;beans>
 *
 *     &lt;task:annotation-driven scheduler="taskScheduler"/&gt;
 *
 *     &lt;task:scheduler id="taskScheduler" pool-size="42"/&gt;
 *
 *     &lt;task:scheduled-tasks scheduler="taskScheduler"&gt;
 *         &lt;task:scheduled ref="myTask" method="work" fixed-rate="1000"/&gt;
 *     &lt;/task:scheduled-tasks&gt;
 *
 *     &lt;bean id="myTask" class="com.foo.MyTask"/&gt;
 *
 * &lt;/beans&gt;
 * </pre>
 *
 * The examples are equivalent save that in XML a <em>fixed-rate</em> period is used
 * instead of a custom <em>{@code Trigger}</em> implementation; this is because the
 * {@code task:} namespace {@code scheduled} cannot easily expose such support. This is
 * but one demonstration how the code-based approach allows for maximum configurability
 * through direct access to actual componentry.<p>
 *
 * <b>Note: {@code @EnableScheduling} applies to its local application context only,
 * allowing for selective scheduling of beans at different levels.</b> Please redeclare
 * {@code @EnableScheduling} in each individual context, e.g. the common root web
 * application context and any separate {@code DispatcherServlet} application contexts,
 * if you need to apply its behavior at multiple levels.
 *
 * @author Chris Beams
 * @author Juergen Hoeller
 * @since 3.1
 * @see Scheduled
 * @see SchedulingConfiguration
 * @see SchedulingConfigurer
 * @see ScheduledTaskRegistrar
 * @see Trigger
 * @see ScheduledAnnotationBeanPostProcessor
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Import(SchedulingConfiguration.class)
@Documented
public @interface EnableScheduling {

}
``` 

### @EnableWebMvc
```java
/**
 * Adding this annotation to an {@code @Configuration} class imports the Spring MVC
 * configuration from {@link WebMvcConfigurationSupport}, e.g.:
 *
 * <pre class="code">
 * &#064;Configuration
 * &#064;EnableWebMvc
 * &#064;ComponentScan(basePackageClasses = MyConfiguration.class)
 * public class MyConfiguration {
 *
 * }
 * </pre>
 *
 * <p>To customize the imported configuration, implement the interface
 * {@link WebMvcConfigurer} and override individual methods, e.g.:
 *
 * <pre class="code">
 * &#064;Configuration
 * &#064;EnableWebMvc
 * &#064;ComponentScan(basePackageClasses = MyConfiguration.class)
 * public class MyConfiguration implements WebMvcConfigurer {
 *
 * 	   &#064;Override
 * 	   public void addFormatters(FormatterRegistry formatterRegistry) {
 *         formatterRegistry.addConverter(new MyConverter());
 * 	   }
 *
 * 	   &#064;Override
 * 	   public void configureMessageConverters(List&lt;HttpMessageConverter&lt;?&gt;&gt; converters) {
 *         converters.add(new MyHttpMessageConverter());
 * 	   }
 *
 * }
 * </pre>
 *
 * <p><strong>Note:</strong> only one {@code @Configuration} class may have the
 * {@code @EnableWebMvc} annotation to import the Spring Web MVC
 * configuration. There can however be multiple {@code @Configuration} classes
 * implementing {@code WebMvcConfigurer} in order to customize the provided
 * configuration.
 *
 * <p>If {@link WebMvcConfigurer} does not expose some more advanced setting that
 * needs to be configured consider removing the {@code @EnableWebMvc}
 * annotation and extending directly from {@link WebMvcConfigurationSupport}
 * or {@link DelegatingWebMvcConfiguration}, e.g.:
 *
 * <pre class="code">
 * &#064;Configuration
 * &#064;ComponentScan(basePackageClasses = { MyConfiguration.class })
 * public class MyConfiguration extends WebMvcConfigurationSupport {
 *
 * 	   &#064;Override
 *	   public void addFormatters(FormatterRegistry formatterRegistry) {
 *         formatterRegistry.addConverter(new MyConverter());
 *	   }
 *
 *	   &#064;Bean
 *	   public RequestMappingHandlerAdapter requestMappingHandlerAdapter() {
 *         // Create or delegate to "super" to create and
 *         // customize properties of RequestMappingHandlerAdapter
 *	   }
 * }
 * </pre>
 *
 * @author Dave Syer
 * @author Rossen Stoyanchev
 * @since 3.1
 * @see org.springframework.web.servlet.config.annotation.WebMvcConfigurer
 * @see org.springframework.web.servlet.config.annotation.WebMvcConfigurationSupport
 * @see org.springframework.web.servlet.config.annotation.DelegatingWebMvcConfiguration
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@Documented
@Import(DelegatingWebMvcConfiguration.class)
public @interface EnableWebMvc {
}
```

### @EnableConfigurationProperties
```java
/**
 * Enable support for {@link ConfigurationProperties} annotated beans.
 * {@link ConfigurationProperties} beans can be registered in the standard way (for
 * example using {@link Bean @Bean} methods) or, for convenience, can be specified
 * directly on this annotation.
 *
 * @author Dave Syer
 * @since 1.0.0
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Import(EnableConfigurationPropertiesImportSelector.class)
public @interface EnableConfigurationProperties {

	/**
	 * Convenient way to quickly register {@link ConfigurationProperties} annotated beans
	 * with Spring. Standard Spring Beans will also be scanned regardless of this value.
	 * @return {@link ConfigurationProperties} annotated beans to register
	 */
	Class<?>[] value() default {};

}
```
### @EnableTransactionManagement
```java
/**
 * Enables Spring's annotation-driven transaction management capability, similar to
 * the support found in Spring's {@code <tx:*>} XML namespace. To be used on
 * {@link org.springframework.context.annotation.Configuration @Configuration}
 * classes as follows:
 *
 * <pre class="code">
 * &#064;Configuration
 * &#064;EnableTransactionManagement
 * public class AppConfig {
 *
 *     &#064;Bean
 *     public FooRepository fooRepository() {
 *         // configure and return a class having &#064;Transactional methods
 *         return new JdbcFooRepository(dataSource());
 *     }
 *
 *     &#064;Bean
 *     public DataSource dataSource() {
 *         // configure and return the necessary JDBC DataSource
 *     }
 *
 *     &#064;Bean
 *     public PlatformTransactionManager txManager() {
 *         return new DataSourceTransactionManager(dataSource());
 *     }
 * }</pre>
 *
 * <p>For reference, the example above can be compared to the following Spring XML
 * configuration:
 *
 * <pre class="code">
 * &lt;beans&gt;
 *
 *     &lt;tx:annotation-driven/&gt;
 *
 *     &lt;bean id="fooRepository" class="com.foo.JdbcFooRepository"&gt;
 *         &lt;constructor-arg ref="dataSource"/&gt;
 *     &lt;/bean&gt;
 *
 *     &lt;bean id="dataSource" class="com.vendor.VendorDataSource"/&gt;
 *
 *     &lt;bean id="transactionManager" class="org.sfwk...DataSourceTransactionManager"&gt;
 *         &lt;constructor-arg ref="dataSource"/&gt;
 *     &lt;/bean&gt;
 *
 * &lt;/beans&gt;
 * </pre>
 *
 * In both of the scenarios above, {@code @EnableTransactionManagement} and {@code
 * <tx:annotation-driven/>} are responsible for registering the necessary Spring
 * components that power annotation-driven transaction management, such as the
 * TransactionInterceptor and the proxy- or AspectJ-based advice that weave the
 * interceptor into the call stack when {@code JdbcFooRepository}'s {@code @Transactional}
 * methods are invoked.
 *
 * <p>A minor difference between the two examples lies in the naming of the {@code
 * PlatformTransactionManager} bean: In the {@code @Bean} case, the name is
 * <em>"txManager"</em> (per the name of the method); in the XML case, the name is
 * <em>"transactionManager"</em>. The {@code <tx:annotation-driven/>} is hard-wired to
 * look for a bean named "transactionManager" by default, however
 * {@code @EnableTransactionManagement} is more flexible; it will fall back to a by-type
 * lookup for any {@code PlatformTransactionManager} bean in the container. Thus the name
 * can be "txManager", "transactionManager", or "tm": it simply does not matter.
 *
 * <p>For those that wish to establish a more direct relationship between
 * {@code @EnableTransactionManagement} and the exact transaction manager bean to be used,
 * the {@link TransactionManagementConfigurer} callback interface may be implemented -
 * notice the {@code implements} clause and the {@code @Override}-annotated method below:
 *
 * <pre class="code">
 * &#064;Configuration
 * &#064;EnableTransactionManagement
 * public class AppConfig implements TransactionManagementConfigurer {
 *
 *     &#064;Bean
 *     public FooRepository fooRepository() {
 *         // configure and return a class having &#064;Transactional methods
 *         return new JdbcFooRepository(dataSource());
 *     }
 *
 *     &#064;Bean
 *     public DataSource dataSource() {
 *         // configure and return the necessary JDBC DataSource
 *     }
 *
 *     &#064;Bean
 *     public PlatformTransactionManager txManager() {
 *         return new DataSourceTransactionManager(dataSource());
 *     }
 *
 *     &#064;Override
 *     public PlatformTransactionManager annotationDrivenTransactionManager() {
 *         return txManager();
 *     }
 * }</pre>
 *
 * This approach may be desirable simply because it is more explicit, or it may be
 * necessary in order to distinguish between two {@code PlatformTransactionManager} beans
 * present in the same container.  As the name suggests, the
 * {@code annotationDrivenTransactionManager()} will be the one used for processing
 * {@code @Transactional} methods. See {@link TransactionManagementConfigurer} Javadoc
 * for further details.
 *
 * <p>The {@link #mode} attribute controls how advice is applied: If the mode is
 * {@link AdviceMode#PROXY} (the default), then the other attributes control the behavior
 * of the proxying. Please note that proxy mode allows for interception of calls through
 * the proxy only; local calls within the same class cannot get intercepted that way.
 *
 * <p>Note that if the {@linkplain #mode} is set to {@link AdviceMode#ASPECTJ}, then the
 * value of the {@link #proxyTargetClass} attribute will be ignored. Note also that in
 * this case the {@code spring-aspects} module JAR must be present on the classpath, with
 * compile-time weaving or load-time weaving applying the aspect to the affected classes.
 * There is no proxy involved in such a scenario; local calls will be intercepted as well.
 *
 * @author Chris Beams
 * @author Juergen Hoeller
 * @since 3.1
 * @see TransactionManagementConfigurer
 * @see TransactionManagementConfigurationSelector
 * @see ProxyTransactionManagementConfiguration
 * @see org.springframework.transaction.aspectj.AspectJTransactionManagementConfiguration
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Import(TransactionManagementConfigurationSelector.class)
public @interface EnableTransactionManagement {

	/**
	 * Indicate whether subclass-based (CGLIB) proxies are to be created ({@code true}) as
	 * opposed to standard Java interface-based proxies ({@code false}). The default is
	 * {@code false}. <strong>Applicable only if {@link #mode()} is set to
	 * {@link AdviceMode#PROXY}</strong>.
	 * <p>Note that setting this attribute to {@code true} will affect <em>all</em>
	 * Spring-managed beans requiring proxying, not just those marked with
	 * {@code @Transactional}. For example, other beans marked with Spring's
	 * {@code @Async} annotation will be upgraded to subclass proxying at the same
	 * time. This approach has no negative impact in practice unless one is explicitly
	 * expecting one type of proxy vs another, e.g. in tests.
	 */
	boolean proxyTargetClass() default false;

	/**
	 * Indicate how transactional advice should be applied.
	 * <p><b>The default is {@link AdviceMode#PROXY}.</b>
	 * Please note that proxy mode allows for interception of calls through the proxy
	 * only. Local calls within the same class cannot get intercepted that way; an
	 * {@link Transactional} annotation on such a method within a local call will be
	 * ignored since Spring's interceptor does not even kick in for such a runtime
	 * scenario. For a more advanced mode of interception, consider switching this to
	 * {@link AdviceMode#ASPECTJ}.
	 */
	AdviceMode mode() default AdviceMode.PROXY;

	/**
	 * Indicate the ordering of the execution of the transaction advisor
	 * when multiple advices are applied at a specific joinpoint.
	 * <p>The default is {@link Ordered#LOWEST_PRECEDENCE}.
	 */
	int order() default Ordered.LOWEST_PRECEDENCE;

}
```
### @EnableCaching
```java
/**
 * Enables Spring's annotation-driven cache management capability, similar to the
 * support found in Spring's {@code <cache:*>} XML namespace. To be used together
 * with @{@link org.springframework.context.annotation.Configuration Configuration}
 * classes as follows:
 *
 * <pre class="code">
 * &#064;Configuration
 * &#064;EnableCaching
 * public class AppConfig {
 *
 *     &#064;Bean
 *     public MyService myService() {
 *         // configure and return a class having &#064;Cacheable methods
 *         return new MyService();
 *     }
 *
 *     &#064;Bean
 *     public CacheManager cacheManager() {
 *         // configure and return an implementation of Spring's CacheManager SPI
 *         SimpleCacheManager cacheManager = new SimpleCacheManager();
 *         cacheManager.setCaches(Arrays.asList(new ConcurrentMapCache("default")));
 *         return cacheManager;
 *     }
 * }</pre>
 *
 * <p>For reference, the example above can be compared to the following Spring XML
 * configuration:
 *
 * <pre class="code">
 * &lt;beans&gt;
 *
 *     &lt;cache:annotation-driven/&gt;
 *
 *     &lt;bean id="myService" class="com.foo.MyService"/&gt;
 *
 *     &lt;bean id="cacheManager" class="org.springframework.cache.support.SimpleCacheManager"&gt;
 *         &lt;property name="caches"&gt;
 *             &lt;set&gt;
 *                 &lt;bean class="org.springframework.cache.concurrent.ConcurrentMapCacheFactoryBean"&gt;
 *                     &lt;property name="name" value="default"/&gt;
 *                 &lt;/bean&gt;
 *             &lt;/set&gt;
 *         &lt;/property&gt;
 *     &lt;/bean&gt;
 *
 * &lt;/beans&gt;
 * </pre>
 *
 * In both of the scenarios above, {@code @EnableCaching} and {@code
 * <cache:annotation-driven/>} are responsible for registering the necessary Spring
 * components that power annotation-driven cache management, such as the
 * {@link org.springframework.cache.interceptor.CacheInterceptor CacheInterceptor} and the
 * proxy- or AspectJ-based advice that weaves the interceptor into the call stack when
 * {@link org.springframework.cache.annotation.Cacheable @Cacheable} methods are invoked.
 *
 * <p>If the JSR-107 API and Spring's JCache implementation are present, the necessary
 * components to manage standard cache annotations are also registered. This creates the
 * proxy- or AspectJ-based advice that weaves the interceptor into the call stack when
 * methods annotated with {@code CacheResult}, {@code CachePut}, {@code CacheRemove} or
 * {@code CacheRemoveAll} are invoked.
 *
 * <p><strong>A bean of type {@link org.springframework.cache.CacheManager CacheManager}
 * must be registered</strong>, as there is no reasonable default that the framework can
 * use as a convention. And whereas the {@code <cache:annotation-driven>} element assumes
 * a bean <em>named</em> "cacheManager", {@code @EnableCaching} searches for a cache
 * manager bean <em>by type</em>. Therefore, naming of the cache manager bean method is
 * not significant.
 *
 * <p>For those that wish to establish a more direct relationship between
 * {@code @EnableCaching} and the exact cache manager bean to be used,
 * the {@link CachingConfigurer} callback interface may be implemented.
 * Notice the {@code @Override}-annotated methods below:
 *
 * <pre class="code">
 * &#064;Configuration
 * &#064;EnableCaching
 * public class AppConfig extends CachingConfigurerSupport {
 *
 *     &#064;Bean
 *     public MyService myService() {
 *         // configure and return a class having &#064;Cacheable methods
 *         return new MyService();
 *     }
 *
 *     &#064;Bean
 *     &#064;Override
 *     public CacheManager cacheManager() {
 *         // configure and return an implementation of Spring's CacheManager SPI
 *         SimpleCacheManager cacheManager = new SimpleCacheManager();
 *         cacheManager.setCaches(Arrays.asList(new ConcurrentMapCache("default")));
 *         return cacheManager;
 *     }
 *
 *     &#064;Bean
 *     &#064;Override
 *     public KeyGenerator keyGenerator() {
 *         // configure and return an implementation of Spring's KeyGenerator SPI
 *         return new MyKeyGenerator();
 *     }
 * }</pre>
 *
 * This approach may be desirable simply because it is more explicit, or it may be
 * necessary in order to distinguish between two {@code CacheManager} beans present in the
 * same container.
 *
 * <p>Notice also the {@code keyGenerator} method in the example above. This allows for
 * customizing the strategy for cache key generation, per Spring's {@link
 * org.springframework.cache.interceptor.KeyGenerator KeyGenerator} SPI. Normally,
 * {@code @EnableCaching} will configure Spring's
 * {@link org.springframework.cache.interceptor.SimpleKeyGenerator SimpleKeyGenerator}
 * for this purpose, but when implementing {@code CachingConfigurer}, a key generator
 * must be provided explicitly. Return {@code null} or {@code new SimpleKeyGenerator()}
 * from this method if no customization is necessary.
 *
 * <p>{@link CachingConfigurer} offers additional customization options: it is recommended
 * to extend from {@link org.springframework.cache.annotation.CachingConfigurerSupport
 * CachingConfigurerSupport} that provides a default implementation for all methods which
 * can be useful if you do not need to customize everything. See {@link CachingConfigurer}
 * Javadoc for further details.
 *
 * <p>The {@link #mode} attribute controls how advice is applied: If the mode is
 * {@link AdviceMode#PROXY} (the default), then the other attributes control the behavior
 * of the proxying. Please note that proxy mode allows for interception of calls through
 * the proxy only; local calls within the same class cannot get intercepted that way.
 *
 * <p>Note that if the {@linkplain #mode} is set to {@link AdviceMode#ASPECTJ}, then the
 * value of the {@link #proxyTargetClass} attribute will be ignored. Note also that in
 * this case the {@code spring-aspects} module JAR must be present on the classpath, with
 * compile-time weaving or load-time weaving applying the aspect to the affected classes.
 * There is no proxy involved in such a scenario; local calls will be intercepted as well.
 *
 * @author Chris Beams
 * @author Juergen Hoeller
 * @since 3.1
 * @see CachingConfigurer
 * @see CachingConfigurationSelector
 * @see ProxyCachingConfiguration
 * @see org.springframework.cache.aspectj.AspectJCachingConfiguration
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Import(CachingConfigurationSelector.class)
public @interface EnableCaching {

	/**
	 * Indicate whether subclass-based (CGLIB) proxies are to be created as opposed
	 * to standard Java interface-based proxies. The default is {@code false}. <strong>
	 * Applicable only if {@link #mode()} is set to {@link AdviceMode#PROXY}</strong>.
	 * <p>Note that setting this attribute to {@code true} will affect <em>all</em>
	 * Spring-managed beans requiring proxying, not just those marked with {@code @Cacheable}.
	 * For example, other beans marked with Spring's {@code @Transactional} annotation will
	 * be upgraded to subclass proxying at the same time. This approach has no negative
	 * impact in practice unless one is explicitly expecting one type of proxy vs another,
	 * e.g. in tests.
	 */
	boolean proxyTargetClass() default false;

	/**
	 * Indicate how caching advice should be applied.
	 * <p><b>The default is {@link AdviceMode#PROXY}.</b>
	 * Please note that proxy mode allows for interception of calls through the proxy
	 * only. Local calls within the same class cannot get intercepted that way;
	 * a caching annotation on such a method within a local call will be ignored
	 * since Spring's interceptor does not even kick in for such a runtime scenario.
	 * For a more advanced mode of interception, consider switching this to
	 * {@link AdviceMode#ASPECTJ}.
	 */
	AdviceMode mode() default AdviceMode.PROXY;

	/**
	 * Indicate the ordering of the execution of the caching advisor
	 * when multiple advices are applied at a specific joinpoint.
	 * <p>The default is {@link Ordered#LOWEST_PRECEDENCE}.
	 */
	int order() default Ordered.LOWEST_PRECEDENCE;

}
```

以上所有的注解都有一个`@Import`注解，`@Import`是用来导入配置类的，这也意味着这些自动开启的实现其实是导入一些自动配置的`bean`。这些导入的配置方式主要分为以下三种类型。