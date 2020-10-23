# @ConfigurationProperties

## 使用示例

- 注解在类上使用：
```java
@Component
@ConfigurationProperties("rocketmq")
@Data
public class RocketMQProperties {

    private String accessKey;
    private String secretKey;
    private String nameSrvAddr;
    private String topic;
    private String groupId;
    private String tag;
    private String orderTopic;
    private String orderGroupId;
    private String orderTag;

    public Properties getMqProperties() {
        Properties properties = new Properties();
        properties.setProperty(PropertyKeyConst.AccessKey, this.accessKey);
        properties.setProperty(PropertyKeyConst.SecretKey, this.secretKey);
        properties.setProperty(PropertyKeyConst.NAMESRV_ADDR, this.nameSrvAddr);
        return properties;
    }

    public Properties getMqConsumerProperties() {
        //配置文件
        Properties properties = this.getMqProperties();
        properties.setProperty(PropertyKeyConst.GROUP_ID, this.getGroupId());
        //将消费者线程数固定为20个 20为默认值
        properties.setProperty(PropertyKeyConst.ConsumeThreadNums, "20");
        return properties;
    }

}
```

- 注解方法上
```java
  @Bean
    @ConfigurationProperties("rocketmq")
    public RocketMQProperties rocketMQProperties() {
        return new RocketMQProperties();
    }
```

没有使用`@Component`相关注解的情况下，可以使用以下的方式
```java
@EnableConfigurationProperties({RocketMQProperties.class})
```


- 属性配置
```properties
rocketmq.access-key = 您的access-key
rocketmq.secret-key = 您的secret-key
# 设置 TCP 接入域名，进入控制台的实例管理页面的“获取接入点信息”区域查看
rocketmq.name-srv-addr = http://onsaddr.cn-hangzhou.mq-internal.aliyuncs.com:8080
# 您在控制台创建的 Group ID
rocketmq.group-id = GID_BRAIN_TR_TOOL_FAT
rocketmq.topic = BRAIN_TR_TOOL_FAT
```

## 实现原理

您应该应用@EnableConfigurationProperties配置以启用对的支持@ConfigurationProperties
@EnableConfigurationProperties(CustomProperties.class)

`@ConfigurationProperties`需要和`@Bean`或者`@Component`等只要能生成`spring bean`的注解结合起来使用。
这样当其他类注入`Spring`容器时，在`bean`加载过程中，会调用`AbstractAutowireCapableBeanFactory#applyBeanPostProcessorsBeforeInitialization`，因此会触发`ConfigurationPropertiesBindingPostProcessor#postProcessBeforeInitialization`的调用。
这就是`@ConfigurationProperties`实现原理的起点。

`org.springframework.boot.context.properties.ConfigurationPropertiesBindingPostProcessor.java`
```java
    // bean初始化方法调用前被调用
	@Override
	public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
		ConfigurationProperties annotation = getAnnotation(bean, beanName, ConfigurationProperties.class);
		if (annotation != null) {
			bind(bean, beanName, annotation);
		}
		return bean;
	}

	private void bind(Object bean, String beanName, ConfigurationProperties annotation) {
		ResolvableType type = getBeanType(bean, beanName);
		Validated validated = getAnnotation(bean, beanName, Validated.class);
		Annotation[] annotations = (validated != null) ? new Annotation[] { annotation, validated }
				: new Annotation[] { annotation };
		Bindable<?> target = Bindable.of(type).withExistingValue(bean).withAnnotations(annotations);
		try {
			this.configurationPropertiesBinder.bind(target);
		}
		catch (Exception ex) {
			throw new ConfigurationPropertiesBindException(beanName, bean, annotation, ex);
		}
	}
```

`org.springframework.boot.context.properties.ConfigurationPropertiesBinder.java`
```java
	public void bind(Bindable<?> target) {
		ConfigurationProperties annotation = target.getAnnotation(ConfigurationProperties.class);
		Assert.state(annotation != null, () -> "Missing @ConfigurationProperties on " + target);
		List<Validator> validators = getValidators(target);
		BindHandler bindHandler = getBindHandler(annotation, validators);
		getBinder().bind(annotation.prefix(), target, bindHandler);
	}
```

`org.springframework.boot.context.properties.bind.Binder.java`
```java
package org.springframework.boot.context.properties.bind;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.Deque;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Consumer;
import java.util.function.Supplier;
import java.util.stream.Stream;

import org.springframework.beans.PropertyEditorRegistry;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.boot.context.properties.source.ConfigurationProperty;
import org.springframework.boot.context.properties.source.ConfigurationPropertyName;
import org.springframework.boot.context.properties.source.ConfigurationPropertySource;
import org.springframework.boot.context.properties.source.ConfigurationPropertySources;
import org.springframework.boot.context.properties.source.ConfigurationPropertyState;
import org.springframework.boot.convert.ApplicationConversionService;
import org.springframework.core.convert.ConversionService;
import org.springframework.core.convert.ConverterNotFoundException;
import org.springframework.core.env.Environment;
import org.springframework.format.support.DefaultFormattingConversionService;
import org.springframework.util.Assert;

/**
 * A container object which Binds objects from one or more
 * {@link ConfigurationPropertySource ConfigurationPropertySources}.
 *
 * @author Phillip Webb
 * @author Madhura Bhave
 * @since 2.0.0
 */
public class Binder {

	private static final Set<Class<?>> NON_BEAN_CLASSES = Collections
			.unmodifiableSet(new HashSet<>(Arrays.asList(Object.class, Class.class)));

	private static final List<BeanBinder> BEAN_BINDERS;

	static {
		List<BeanBinder> binders = new ArrayList<>();
		binders.add(new JavaBeanBinder());
		BEAN_BINDERS = Collections.unmodifiableList(binders);
	}

	private final Iterable<ConfigurationPropertySource> sources;

	private final PlaceholdersResolver placeholdersResolver;

	private final ConversionService conversionService;

	private final Consumer<PropertyEditorRegistry> propertyEditorInitializer;

	/**
	 * Create a new {@link Binder} instance for the specified sources. A
	 * {@link DefaultFormattingConversionService} will be used for all conversion.
	 * @param sources the sources used for binding
	 */
	public Binder(ConfigurationPropertySource... sources) {
		this(Arrays.asList(sources), null, null, null);
	}

	/**
	 * Create a new {@link Binder} instance for the specified sources. A
	 * {@link DefaultFormattingConversionService} will be used for all conversion.
	 * @param sources the sources used for binding
	 */
	public Binder(Iterable<ConfigurationPropertySource> sources) {
		this(sources, null, null, null);
	}

	/**
	 * Create a new {@link Binder} instance for the specified sources.
	 * @param sources the sources used for binding
	 * @param placeholdersResolver strategy to resolve any property placeholders
	 */
	public Binder(Iterable<ConfigurationPropertySource> sources, PlaceholdersResolver placeholdersResolver) {
		this(sources, placeholdersResolver, null, null);
	}

	/**
	 * Create a new {@link Binder} instance for the specified sources.
	 * @param sources the sources used for binding
	 * @param placeholdersResolver strategy to resolve any property placeholders
	 * @param conversionService the conversion service to convert values (or {@code null}
	 * to use {@link ApplicationConversionService})
	 */
	public Binder(Iterable<ConfigurationPropertySource> sources, PlaceholdersResolver placeholdersResolver,
			ConversionService conversionService) {
		this(sources, placeholdersResolver, conversionService, null);
	}

	/**
	 * Create a new {@link Binder} instance for the specified sources.
	 * @param sources the sources used for binding
	 * @param placeholdersResolver strategy to resolve any property placeholders
	 * @param conversionService the conversion service to convert values (or {@code null}
	 * to use {@link ApplicationConversionService})
	 * @param propertyEditorInitializer initializer used to configure the property editors
	 * that can convert values (or {@code null} if no initialization is required). Often
	 * used to call {@link ConfigurableListableBeanFactory#copyRegisteredEditorsTo}.
	 */
	public Binder(Iterable<ConfigurationPropertySource> sources, PlaceholdersResolver placeholdersResolver,
			ConversionService conversionService, Consumer<PropertyEditorRegistry> propertyEditorInitializer) {
		Assert.notNull(sources, "Sources must not be null");
		this.sources = sources;
		this.placeholdersResolver = (placeholdersResolver != null) ? placeholdersResolver : PlaceholdersResolver.NONE;
		this.conversionService = (conversionService != null) ? conversionService
				: ApplicationConversionService.getSharedInstance();
		this.propertyEditorInitializer = propertyEditorInitializer;
	}

	/**
	 * Bind the specified target {@link Class} using this binder's
	 * {@link ConfigurationPropertySource property sources}.
	 * @param name the configuration property name to bind
	 * @param target the target class
	 * @param <T> the bound type
	 * @return the binding result (never {@code null})
	 * @see #bind(ConfigurationPropertyName, Bindable, BindHandler)
	 */
	public <T> BindResult<T> bind(String name, Class<T> target) {
		return bind(name, Bindable.of(target));
	}

	/**
	 * Bind the specified target {@link Bindable} using this binder's
	 * {@link ConfigurationPropertySource property sources}.
	 * @param name the configuration property name to bind
	 * @param target the target bindable
	 * @param <T> the bound type
	 * @return the binding result (never {@code null})
	 * @see #bind(ConfigurationPropertyName, Bindable, BindHandler)
	 */
	public <T> BindResult<T> bind(String name, Bindable<T> target) {
		return bind(ConfigurationPropertyName.of(name), target, null);
	}

	/**
	 * Bind the specified target {@link Bindable} using this binder's
	 * {@link ConfigurationPropertySource property sources}.
	 * @param name the configuration property name to bind
	 * @param target the target bindable
	 * @param <T> the bound type
	 * @return the binding result (never {@code null})
	 * @see #bind(ConfigurationPropertyName, Bindable, BindHandler)
	 */
	public <T> BindResult<T> bind(ConfigurationPropertyName name, Bindable<T> target) {
		return bind(name, target, null);
	}

	/**
	 * Bind the specified target {@link Bindable} using this binder's
	 * {@link ConfigurationPropertySource property sources}.
	 * @param name the configuration property name to bind
	 * @param target the target bindable
	 * @param handler the bind handler (may be {@code null})
	 * @param <T> the bound type
	 * @return the binding result (never {@code null})
	 */
	public <T> BindResult<T> bind(String name, Bindable<T> target, BindHandler handler) {
		return bind(ConfigurationPropertyName.of(name), target, handler);
	}

	/**
	 * Bind the specified target {@link Bindable} using this binder's
	 * {@link ConfigurationPropertySource property sources}.
	 * @param name the configuration property name to bind
	 * @param target the target bindable
	 * @param handler the bind handler (may be {@code null})
	 * @param <T> the bound type
	 * @return the binding result (never {@code null})
	 */
	public <T> BindResult<T> bind(ConfigurationPropertyName name, Bindable<T> target, BindHandler handler) {
		Assert.notNull(name, "Name must not be null");
		Assert.notNull(target, "Target must not be null");
		handler = (handler != null) ? handler : BindHandler.DEFAULT;
		Context context = new Context();
		T bound = bind(name, target, handler, context, false);
		return BindResult.of(bound);
	}

	protected final <T> T bind(ConfigurationPropertyName name, Bindable<T> target, BindHandler handler, Context context,
			boolean allowRecursiveBinding) {
		context.clearConfigurationProperty();
		try {
			target = handler.onStart(name, target, context);
			if (target == null) {
				return null;
			}
			Object bound = bindObject(name, target, handler, context, allowRecursiveBinding);
			return handleBindResult(name, target, handler, context, bound);
		}
		catch (Exception ex) {
			return handleBindError(name, target, handler, context, ex);
		}
	}

	private <T> T handleBindResult(ConfigurationPropertyName name, Bindable<T> target, BindHandler handler,
			Context context, Object result) throws Exception {
		if (result != null) {
			result = handler.onSuccess(name, target, context, result);
			result = context.getConverter().convert(result, target);
		}
		handler.onFinish(name, target, context, result);
		return context.getConverter().convert(result, target);
	}

	private <T> T handleBindError(ConfigurationPropertyName name, Bindable<T> target, BindHandler handler,
			Context context, Exception error) {
		try {
			Object result = handler.onFailure(name, target, context, error);
			return context.getConverter().convert(result, target);
		}
		catch (Exception ex) {
			if (ex instanceof BindException) {
				throw (BindException) ex;
			}
			throw new BindException(name, target, context.getConfigurationProperty(), ex);
		}
	}

	private <T> Object bindObject(ConfigurationPropertyName name, Bindable<T> target, BindHandler handler,
			Context context, boolean allowRecursiveBinding) {
		ConfigurationProperty property = findProperty(name, context);
		if (property == null && containsNoDescendantOf(context.getSources(), name)) {
			return null;
		}
		AggregateBinder<?> aggregateBinder = getAggregateBinder(target, context);
		if (aggregateBinder != null) {
			return bindAggregate(name, target, handler, context, aggregateBinder);
		}
		if (property != null) {
			try {
				return bindProperty(target, context, property);
			}
			catch (ConverterNotFoundException ex) {
				// We might still be able to bind it as a bean
				Object bean = bindBean(name, target, handler, context, allowRecursiveBinding);
				if (bean != null) {
					return bean;
				}
				throw ex;
			}
		}
		return bindBean(name, target, handler, context, allowRecursiveBinding);
	}

	private AggregateBinder<?> getAggregateBinder(Bindable<?> target, Context context) {
		Class<?> resolvedType = target.getType().resolve(Object.class);
		if (Map.class.isAssignableFrom(resolvedType)) {
			return new MapBinder(context);
		}
		if (Collection.class.isAssignableFrom(resolvedType)) {
			return new CollectionBinder(context);
		}
		if (target.getType().isArray()) {
			return new ArrayBinder(context);
		}
		return null;
	}

	private <T> Object bindAggregate(ConfigurationPropertyName name, Bindable<T> target, BindHandler handler,
			Context context, AggregateBinder<?> aggregateBinder) {
		AggregateElementBinder elementBinder = (itemName, itemTarget, source) -> {
			boolean allowRecursiveBinding = aggregateBinder.isAllowRecursiveBinding(source);
			Supplier<?> supplier = () -> bind(itemName, itemTarget, handler, context, allowRecursiveBinding);
			return context.withSource(source, supplier);
		};
		return context.withIncreasedDepth(() -> aggregateBinder.bind(name, target, elementBinder));
	}

	private ConfigurationProperty findProperty(ConfigurationPropertyName name, Context context) {
		if (name.isEmpty()) {
			return null;
		}
		for (ConfigurationPropertySource source : context.getSources()) {
			ConfigurationProperty property = source.getConfigurationProperty(name);
			if (property != null) {
				return property;
			}
		}
		return null;
	}

	private <T> Object bindProperty(Bindable<T> target, Context context, ConfigurationProperty property) {
		context.setConfigurationProperty(property);
		Object result = property.getValue();
		result = this.placeholdersResolver.resolvePlaceholders(result);
		result = context.getConverter().convert(result, target);
		return result;
	}

	private Object bindBean(ConfigurationPropertyName name, Bindable<?> target, BindHandler handler, Context context,
			boolean allowRecursiveBinding) {
		if (containsNoDescendantOf(context.getSources(), name) || isUnbindableBean(name, target, context)) {
			return null;
		}
		BeanPropertyBinder propertyBinder = (propertyName, propertyTarget) -> bind(name.append(propertyName),
				propertyTarget, handler, context, false);
		Class<?> type = target.getType().resolve(Object.class);
		if (!allowRecursiveBinding && context.hasBoundBean(type)) {
			return null;
		}
		return context.withBean(type, () -> {
			Stream<?> boundBeans = BEAN_BINDERS.stream().map((b) -> b.bind(name, target, context, propertyBinder));
			return boundBeans.filter(Objects::nonNull).findFirst().orElse(null);
		});
	}

	private boolean isUnbindableBean(ConfigurationPropertyName name, Bindable<?> target, Context context) {
		for (ConfigurationPropertySource source : context.getSources()) {
			if (source.containsDescendantOf(name) == ConfigurationPropertyState.PRESENT) {
				// We know there are properties to bind so we can't bypass anything
				return false;
			}
		}
		Class<?> resolved = target.getType().resolve(Object.class);
		if (resolved.isPrimitive() || NON_BEAN_CLASSES.contains(resolved)) {
			return true;
		}
		return resolved.getName().startsWith("java.");
	}

	private boolean containsNoDescendantOf(Iterable<ConfigurationPropertySource> sources,
			ConfigurationPropertyName name) {
		for (ConfigurationPropertySource source : sources) {
			if (source.containsDescendantOf(name) != ConfigurationPropertyState.ABSENT) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Create a new {@link Binder} instance from the specified environment.
	 * @param environment the environment source (must have attached
	 * {@link ConfigurationPropertySources})
	 * @return a {@link Binder} instance
	 */
	public static Binder get(Environment environment) {
		return new Binder(ConfigurationPropertySources.get(environment),
				new PropertySourcesPlaceholdersResolver(environment));
	}

	/**
	 * Context used when binding and the {@link BindContext} implementation.
	 */
	final class Context implements BindContext {

		private final BindConverter converter;

		private int depth;

		private final List<ConfigurationPropertySource> source = Arrays.asList((ConfigurationPropertySource) null);

		private int sourcePushCount;

		private final Deque<Class<?>> beans = new ArrayDeque<>();

		private ConfigurationProperty configurationProperty;

		Context() {
			this.converter = BindConverter.get(Binder.this.conversionService, Binder.this.propertyEditorInitializer);
		}

		private void increaseDepth() {
			this.depth++;
		}

		private void decreaseDepth() {
			this.depth--;
		}

		private <T> T withSource(ConfigurationPropertySource source, Supplier<T> supplier) {
			if (source == null) {
				return supplier.get();
			}
			this.source.set(0, source);
			this.sourcePushCount++;
			try {
				return supplier.get();
			}
			finally {
				this.sourcePushCount--;
			}
		}

		private <T> T withBean(Class<?> bean, Supplier<T> supplier) {
			this.beans.push(bean);
			try {
				return withIncreasedDepth(supplier);
			}
			finally {
				this.beans.pop();
			}
		}

		private boolean hasBoundBean(Class<?> bean) {
			return this.beans.contains(bean);
		}

		private <T> T withIncreasedDepth(Supplier<T> supplier) {
			increaseDepth();
			try {
				return supplier.get();
			}
			finally {
				decreaseDepth();
			}
		}

		private void setConfigurationProperty(ConfigurationProperty configurationProperty) {
			this.configurationProperty = configurationProperty;
		}

		private void clearConfigurationProperty() {
			this.configurationProperty = null;
		}

		public PlaceholdersResolver getPlaceholdersResolver() {
			return Binder.this.placeholdersResolver;
		}

		public BindConverter getConverter() {
			return this.converter;
		}

		@Override
		public Binder getBinder() {
			return Binder.this;
		}

		@Override
		public int getDepth() {
			return this.depth;
		}

		@Override
		public Iterable<ConfigurationPropertySource> getSources() {
			if (this.sourcePushCount > 0) {
				return this.source;
			}
			return Binder.this.sources;
		}

		@Override
		public ConfigurationProperty getConfigurationProperty() {
			return this.configurationProperty;
		}

	}

}
```

---

参考文档

- [spring bean-生命周期](/spring/beans.html#bean-%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F)
- [Type-safe Configuration Properties](https://docs.spring.io/spring-boot/docs/2.1.13.RELEASE/reference/html/boot-features-external-config.html#boot-features-external-config-typesafe-configuration-properties)