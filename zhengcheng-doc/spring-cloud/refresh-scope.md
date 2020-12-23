# @RefreshScope 

RefreshScope(org.springframework.cloud.context.scope.refresh)是`Spring Cloud`提供的一种特殊的`scope`实现，用来实现配置、实例热加载。

进行配置更改时，`@Bean`标记为的`Spring` `@RefreshScope`会得到特殊处理。此功能解决了有状态`Bean`的问题，只有在初始化它们时才注入配置。

## 实现原理

**动态代理（CGLIB代理）** 

### RefreshScope 注解源码
```java
package org.springframework.cloud.context.config.annotation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;

/**
 * Convenience annotation to put a <code>@Bean</code> definition in
 * {@link org.springframework.cloud.context.scope.refresh.RefreshScope refresh scope}.
 * Beans annotated this way can be refreshed at runtime and any components that are using
 * them will get a new instance on the next method call, fully initialized and injected
 * with all dependencies.
 *
 * @author Dave Syer
 *
 */
@Target({ ElementType.TYPE, ElementType.METHOD })
@Retention(RetentionPolicy.RUNTIME)
@Scope("refresh")
@Documented
public @interface RefreshScope {

	/**
	 * @see Scope#proxyMode()
	 * @return proxy mode
	 */
	ScopedProxyMode proxyMode() default ScopedProxyMode.TARGET_CLASS;

}
```

### RefreshScope
```java
package org.springframework.cloud.context.scope.refresh;

import java.io.Serializable;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.beans.factory.support.BeanDefinitionRegistry;
import org.springframework.cloud.context.scope.GenericScope;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.core.Ordered;
import org.springframework.jmx.export.annotation.ManagedOperation;
import org.springframework.jmx.export.annotation.ManagedResource;

/**
 * <p>
 * A Scope implementation that allows for beans to be refreshed dynamically at runtime
 * (see {@link #refresh(String)} and {@link #refreshAll()}). If a bean is refreshed then
 * the next time the bean is accessed (i.e. a method is executed) a new instance is
 * created. All lifecycle methods are applied to the bean instances, so any destruction
 * callbacks that were registered in the bean factory are called when it is refreshed, and
 * then the initialization callbacks are invoked as normal when the new instance is
 * created. A new bean instance is created from the original bean definition, so any
 * externalized content (property placeholders or expressions in string literals) is
 * re-evaluated when it is created.
 * </p>
 *
 * <p>
 * Note that all beans in this scope are <em>only</em> initialized when first accessed, so
 * the scope forces lazy initialization semantics. The implementation involves creating a
 * proxy for every bean in the scope, so there is a flag
 * {@link #setProxyTargetClass(boolean) proxyTargetClass} which controls the proxy
 * creation, defaulting to JDK dynamic proxies and therefore only exposing the interfaces
 * implemented by a bean. If callers need access to other methods, then the flag needs to
 * be set (and CGLib must be present on the classpath). Because this scope automatically
 * proxies all its beans, there is no need to add <code>&lt;aop:auto-proxy/&gt;</code> to
 * any bean definitions.
 * </p>
 *
 * <p>
 * The scoped proxy approach adopted here has a side benefit that bean instances are
 * automatically {@link Serializable}, and can be sent across the wire as long as the
 * receiver has an identical application context on the other side. To ensure that the two
 * contexts agree that they are identical, they have to have the same serialization ID.
 * One will be generated automatically by default from the bean names, so two contexts
 * with the same bean names are by default able to exchange beans by name. If you need to
 * override the default ID, then provide an explicit {@link #setId(String) id} when the
 * Scope is declared.
 * </p>
 *
 * @author Dave Syer
 * @since 3.1
 *
 */
@ManagedResource
public class RefreshScope extends GenericScope implements ApplicationContextAware,
		ApplicationListener<ContextRefreshedEvent>, Ordered {

	private ApplicationContext context;

	private BeanDefinitionRegistry registry;

	private boolean eager = true;

	private int order = Ordered.LOWEST_PRECEDENCE - 100;

	/**
	 * Creates a scope instance and gives it the default name: "refresh".
	 */
	public RefreshScope() {
		super.setName("refresh");
	}

	@Override
	public int getOrder() {
		return this.order;
	}

	public void setOrder(int order) {
		this.order = order;
	}

	/**
	 * Flag to determine whether all beans in refresh scope should be instantiated eagerly
	 * on startup. Default true.
	 * @param eager The flag to set.
	 */
	public void setEager(boolean eager) {
		this.eager = eager;
	}

	@Override
	public void postProcessBeanDefinitionRegistry(BeanDefinitionRegistry registry)
			throws BeansException {
		this.registry = registry;
		super.postProcessBeanDefinitionRegistry(registry);
	}

	@Override
	public void onApplicationEvent(ContextRefreshedEvent event) {
		start(event);
	}

	public void start(ContextRefreshedEvent event) {
		if (event.getApplicationContext() == this.context && this.eager
				&& this.registry != null) {
			eagerlyInitialize();
		}
	}

	private void eagerlyInitialize() {
		for (String name : this.context.getBeanDefinitionNames()) {
			BeanDefinition definition = this.registry.getBeanDefinition(name);
			if (this.getName().equals(definition.getScope())
					&& !definition.isLazyInit()) {
				Object bean = this.context.getBean(name);
				if (bean != null) {
					bean.getClass();
				}
			}
		}
	}

	@ManagedOperation(description = "Dispose of the current instance of bean name "
			+ "provided and force a refresh on next method execution.")
	public boolean refresh(String name) {
		if (!name.startsWith(SCOPED_TARGET_PREFIX)) {
			// User wants to refresh the bean with this name but that isn't the one in the
			// cache...
			name = SCOPED_TARGET_PREFIX + name;
		}
		// Ensure lifecycle is finished if bean was disposable
		if (super.destroy(name)) {
			this.context.publishEvent(new RefreshScopeRefreshedEvent(name));
			return true;
		}
		return false;
	}

	@ManagedOperation(description = "Dispose of the current instance of all beans "
			+ "in this scope and force a refresh on next method execution.")
	public void refreshAll() {
		super.destroy();
		this.context.publishEvent(new RefreshScopeRefreshedEvent());
	}

	@Override
	public void setApplicationContext(ApplicationContext context) throws BeansException {
		this.context = context;
	}

}

```

### @Scope 注解源码
```java
package org.springframework.beans.factory.config;

import org.springframework.beans.factory.ObjectFactory;
import org.springframework.lang.Nullable;

/**
 * Strategy interface used by a {@link ConfigurableBeanFactory},
 * representing a target scope to hold bean instances in.
 * This allows for extending the BeanFactory's standard scopes
 * {@link ConfigurableBeanFactory#SCOPE_SINGLETON "singleton"} and
 * {@link ConfigurableBeanFactory#SCOPE_PROTOTYPE "prototype"}
 * with custom further scopes, registered for a
 * {@link ConfigurableBeanFactory#registerScope(String, Scope) specific key}.
 *
 * <p>{@link org.springframework.context.ApplicationContext} implementations
 * such as a {@link org.springframework.web.context.WebApplicationContext}
 * may register additional standard scopes specific to their environment,
 * e.g. {@link org.springframework.web.context.WebApplicationContext#SCOPE_REQUEST "request"}
 * and {@link org.springframework.web.context.WebApplicationContext#SCOPE_SESSION "session"},
 * based on this Scope SPI.
 *
 * <p>Even if its primary use is for extended scopes in a web environment,
 * this SPI is completely generic: It provides the ability to get and put
 * objects from any underlying storage mechanism, such as an HTTP session
 * or a custom conversation mechanism. The name passed into this class's
 * {@code get} and {@code remove} methods will identify the
 * target object in the current scope.
 *
 * <p>{@code Scope} implementations are expected to be thread-safe.
 * One {@code Scope} instance can be used with multiple bean factories
 * at the same time, if desired (unless it explicitly wants to be aware of
 * the containing BeanFactory), with any number of threads accessing
 * the {@code Scope} concurrently from any number of factories.
 *
 * @author Juergen Hoeller
 * @author Rob Harrop
 * @since 2.0
 * @see ConfigurableBeanFactory#registerScope
 * @see CustomScopeConfigurer
 * @see org.springframework.aop.scope.ScopedProxyFactoryBean
 * @see org.springframework.web.context.request.RequestScope
 * @see org.springframework.web.context.request.SessionScope
 */
public interface Scope {

	/**
	 * Return the object with the given name from the underlying scope,
	 * {@link org.springframework.beans.factory.ObjectFactory#getObject() creating it}
	 * if not found in the underlying storage mechanism.
	 * <p>This is the central operation of a Scope, and the only operation
	 * that is absolutely required.
	 * @param name the name of the object to retrieve
	 * @param objectFactory the {@link ObjectFactory} to use to create the scoped
	 * object if it is not present in the underlying storage mechanism
	 * @return the desired object (never {@code null})
	 * @throws IllegalStateException if the underlying scope is not currently active
	 */
	Object get(String name, ObjectFactory<?> objectFactory);

	/**
	 * Remove the object with the given {@code name} from the underlying scope.
	 * <p>Returns {@code null} if no object was found; otherwise
	 * returns the removed {@code Object}.
	 * <p>Note that an implementation should also remove a registered destruction
	 * callback for the specified object, if any. It does, however, <i>not</i>
	 * need to <i>execute</i> a registered destruction callback in this case,
	 * since the object will be destroyed by the caller (if appropriate).
	 * <p><b>Note: This is an optional operation.</b> Implementations may throw
	 * {@link UnsupportedOperationException} if they do not support explicitly
	 * removing an object.
	 * @param name the name of the object to remove
	 * @return the removed object, or {@code null} if no object was present
	 * @throws IllegalStateException if the underlying scope is not currently active
	 * @see #registerDestructionCallback
	 */
	@Nullable
	Object remove(String name);

	/**
	 * Register a callback to be executed on destruction of the specified
	 * object in the scope (or at destruction of the entire scope, if the
	 * scope does not destroy individual objects but rather only terminates
	 * in its entirety).
	 * <p><b>Note: This is an optional operation.</b> This method will only
	 * be called for scoped beans with actual destruction configuration
	 * (DisposableBean, destroy-method, DestructionAwareBeanPostProcessor).
	 * Implementations should do their best to execute a given callback
	 * at the appropriate time. If such a callback is not supported by the
	 * underlying runtime environment at all, the callback <i>must be
	 * ignored and a corresponding warning should be logged</i>.
	 * <p>Note that 'destruction' refers to automatic destruction of
	 * the object as part of the scope's own lifecycle, not to the individual
	 * scoped object having been explicitly removed by the application.
	 * If a scoped object gets removed via this facade's {@link #remove(String)}
	 * method, any registered destruction callback should be removed as well,
	 * assuming that the removed object will be reused or manually destroyed.
	 * @param name the name of the object to execute the destruction callback for
	 * @param callback the destruction callback to be executed.
	 * Note that the passed-in Runnable will never throw an exception,
	 * so it can safely be executed without an enclosing try-catch block.
	 * Furthermore, the Runnable will usually be serializable, provided
	 * that its target object is serializable as well.
	 * @throws IllegalStateException if the underlying scope is not currently active
	 * @see org.springframework.beans.factory.DisposableBean
	 * @see org.springframework.beans.factory.support.AbstractBeanDefinition#getDestroyMethodName()
	 * @see DestructionAwareBeanPostProcessor
	 */
	void registerDestructionCallback(String name, Runnable callback);

	/**
	 * Resolve the contextual object for the given key, if any.
	 * E.g. the HttpServletRequest object for key "request".
	 * @param key the contextual key
	 * @return the corresponding object, or {@code null} if none found
	 * @throws IllegalStateException if the underlying scope is not currently active
	 */
	@Nullable
	Object resolveContextualObject(String key);

	/**
	 * Return the <em>conversation ID</em> for the current underlying scope, if any.
	 * <p>The exact meaning of the conversation ID depends on the underlying
	 * storage mechanism. In the case of session-scoped objects, the
	 * conversation ID would typically be equal to (or derived from) the
	 * {@link javax.servlet.http.HttpSession#getId() session ID}; in the
	 * case of a custom conversation that sits within the overall session,
	 * the specific ID for the current conversation would be appropriate.
	 * <p><b>Note: This is an optional operation.</b> It is perfectly valid to
	 * return {@code null} in an implementation of this method if the
	 * underlying storage mechanism has no obvious candidate for such an ID.
	 * @return the conversation ID, or {@code null} if there is no
	 * conversation ID for the current scope
	 * @throws IllegalStateException if the underlying scope is not currently active
	 */
	@Nullable
	String getConversationId();

}
```

### RefreshAutoConfiguration
```java
package org.springframework.cloud.autoconfigure;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

import javax.annotation.PostConstruct;

import org.springframework.aop.scope.ScopedProxyUtils;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanFactory;
import org.springframework.beans.factory.ListableBeanFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.beans.factory.config.BeanDefinitionHolder;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.beans.factory.support.BeanDefinitionRegistry;
import org.springframework.beans.factory.support.BeanDefinitionRegistryPostProcessor;
import org.springframework.boot.autoconfigure.AutoConfigureBefore;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.cloud.context.refresh.ContextRefresher;
import org.springframework.cloud.context.scope.refresh.RefreshScope;
import org.springframework.cloud.endpoint.event.RefreshEventListener;
import org.springframework.cloud.logging.LoggingRebinder;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.EnvironmentAware;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.weaving.LoadTimeWeaverAware;
import org.springframework.core.env.Environment;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.instrument.classloading.LoadTimeWeaver;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Autoconfiguration for the refresh scope and associated features to do with changes in
 * the Environment (e.g. rebinding logger levels).
 *
 * @author Dave Syer
 * @author Venil Noronha
 */
@Configuration
@ConditionalOnClass(RefreshScope.class)
@ConditionalOnProperty(name = RefreshAutoConfiguration.REFRESH_SCOPE_ENABLED, matchIfMissing = true)
@AutoConfigureBefore(HibernateJpaAutoConfiguration.class)
public class RefreshAutoConfiguration {

	/**
	 * Name of the refresh scope name.
	 */
	public static final String REFRESH_SCOPE_NAME = "refresh";

	/**
	 * Name of the prefix for refresh scope.
	 */
	public static final String REFRESH_SCOPE_PREFIX = "spring.cloud.refresh";

	/**
	 * Name of the enabled prefix for refresh scope.
	 */
	public static final String REFRESH_SCOPE_ENABLED = REFRESH_SCOPE_PREFIX + ".enabled";

	@Bean
	@ConditionalOnMissingBean(RefreshScope.class)
	public static RefreshScope refreshScope() {
		return new RefreshScope();
	}

	@Bean
	@ConditionalOnMissingBean
	public static LoggingRebinder loggingRebinder() {
		return new LoggingRebinder();
	}

	@Bean
	@ConditionalOnMissingBean
	public ContextRefresher contextRefresher(ConfigurableApplicationContext context,
			RefreshScope scope) {
		return new ContextRefresher(context, scope);
	}

	@Bean
	public RefreshEventListener refreshEventListener(ContextRefresher contextRefresher) {
		return new RefreshEventListener(contextRefresher);
	}

	@Configuration
	@ConditionalOnClass(name = "javax.persistence.EntityManagerFactory")
	protected static class JpaInvokerConfiguration implements LoadTimeWeaverAware {

		@Autowired
		private ListableBeanFactory beanFactory;

		@PostConstruct
		public void init() {
			String cls = "org.springframework.boot.autoconfigure.jdbc.DataSourceInitializerInvoker";
			if (this.beanFactory.containsBean(cls)) {
				this.beanFactory.getBean(cls);
			}
		}

		@Override
		public void setLoadTimeWeaver(LoadTimeWeaver ltw) {
		}

	}

	@Component
	protected static class RefreshScopeBeanDefinitionEnhancer
			implements BeanDefinitionRegistryPostProcessor, EnvironmentAware {

		private Environment environment;

		private boolean bound = false;

		/**
		 * Class names for beans to post process into refresh scope. Useful when you don't
		 * control the bean definition (e.g. it came from auto-configuration).
		 */
		private Set<String> refreshables = new HashSet<>(
				Arrays.asList("com.zaxxer.hikari.HikariDataSource"));

		public Set<String> getRefreshable() {
			return this.refreshables;
		}

		public void setRefreshable(Set<String> refreshables) {
			if (this.refreshables != refreshables) {
				this.refreshables.clear();
				this.refreshables.addAll(refreshables);
			}
		}

		public void setExtraRefreshable(Set<String> refreshables) {
			this.refreshables.addAll(refreshables);
		}

		@Override
		public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory)
				throws BeansException {
		}

		@Override
		public void postProcessBeanDefinitionRegistry(BeanDefinitionRegistry registry)
				throws BeansException {
			bindEnvironmentIfNeeded(registry);
			for (String name : registry.getBeanDefinitionNames()) {
				BeanDefinition definition = registry.getBeanDefinition(name);
				if (isApplicable(registry, name, definition)) {
					BeanDefinitionHolder holder = new BeanDefinitionHolder(definition,
							name);
					BeanDefinitionHolder proxy = ScopedProxyUtils
							.createScopedProxy(holder, registry, true);
					definition.setScope("refresh");
					if (registry.containsBeanDefinition(proxy.getBeanName())) {
						registry.removeBeanDefinition(proxy.getBeanName());
					}
					registry.registerBeanDefinition(proxy.getBeanName(),
							proxy.getBeanDefinition());
				}
			}
		}

		private boolean isApplicable(BeanDefinitionRegistry registry, String name,
				BeanDefinition definition) {
			String scope = definition.getScope();
			if (REFRESH_SCOPE_NAME.equals(scope)) {
				// Already refresh scoped
				return false;
			}
			String type = definition.getBeanClassName();
			if (!StringUtils.hasText(type) && registry instanceof BeanFactory) {
				Class<?> cls = ((BeanFactory) registry).getType(name);
				if (cls != null) {
					type = cls.getName();
				}
			}
			if (type != null) {
				return this.refreshables.contains(type);
			}
			return false;
		}

		private void bindEnvironmentIfNeeded(BeanDefinitionRegistry registry) {
			if (!this.bound) { // only bind once
				if (this.environment == null) {
					this.environment = new StandardEnvironment();
				}
				Binder.get(this.environment).bind("spring.cloud.refresh",
						Bindable.ofInstance(this));
				this.bound = true;
			}
		}

		@Override
		public void setEnvironment(Environment environment) {
			this.environment = environment;
		}

	}

}
```

---
**参考文档**
- [2.9 Refresh Scope](https://cloud.spring.io/spring-cloud-static/Greenwich.SR5/single/spring-cloud.html)
- [Spring Cloud动态配置实现原理与源码分析](https://juejin.cn/post/6845166890461954062)