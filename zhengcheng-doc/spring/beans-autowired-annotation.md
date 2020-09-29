# @Autowired

如何正确使用，请参考[官方文档](https://docs.spring.io/spring-framework/docs/current/spring-framework-reference/core.html#beans-autowired-annotation), 本篇主要讲它的实现原理。


`@Autowired`的源码如下：
```java
@Target({ElementType.CONSTRUCTOR, ElementType.METHOD, ElementType.PARAMETER, ElementType.FIELD, ElementType.ANNOTATION_TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Autowired {

	/**
	 * Declares whether the annotated dependency is required.
	 * <p>Defaults to {@code true}.
	 */
	boolean required() default true;

}
```

从源码我们知道，`@Autowired`注解可以被标注在**构造函数**、**属性**、**setter方法**或**配置方法**上，用于实现依赖自动注入。

`@Autowired`注解的作用是由**AutowiredAnnotationBeanPostProcessor**实现的，它实现了`MergedBeanDefinitionPostProcessor`接口中的`postProcessMergedBeanDefinition`方法，
`@Autowired`注解正是通过这个方法实现注入**类型**的预解析，将需要依赖注入的属性信息封装到`InjectionMetadata`类中，`InjectionMetadata`类中包含了哪些需要注入的元素及元素要注入到哪个目标类中。

## AutowiredAnnotationBeanPostProcessor 源码解析

`postProcessMergedBeanDefinition` 方法的源码如下：
```java
	@Override
	public void postProcessMergedBeanDefinition(RootBeanDefinition beanDefinition, Class<?> beanType, String beanName) {
		InjectionMetadata metadata = findAutowiringMetadata(beanName, beanType, null);
		metadata.checkConfigMembers(beanDefinition);
	}
```

`findAutowiringMetadata`方法源码如下：
```java
// AutowiredAnnotationBeanPostProcessor.java

private InjectionMetadata findAutowiringMetadata(String beanName, Class<?> clazz, @Nullable PropertyValues pvs) {
		// Fall back to class name as cache key, for backwards compatibility with custom callers.
		String cacheKey = (StringUtils.hasLength(beanName) ? beanName : clazz.getName());
		// Quick check on the concurrent map first, with minimal locking.
		InjectionMetadata metadata = this.injectionMetadataCache.get(cacheKey);
		if (InjectionMetadata.needsRefresh(metadata, clazz)) {
			synchronized (this.injectionMetadataCache) {
				metadata = this.injectionMetadataCache.get(cacheKey);
				if (InjectionMetadata.needsRefresh(metadata, clazz)) {
					if (metadata != null) {
						metadata.clear(pvs);
					}
					metadata = buildAutowiringMetadata(clazz);
					this.injectionMetadataCache.put(cacheKey, metadata);
				}
			}
		}
		return metadata;
	}
```

`buildAutowiringMetadata` 方法的源码如下：
```java
private InjectionMetadata buildAutowiringMetadata(final Class<?> clazz) {
		List<InjectionMetadata.InjectedElement> elements = new ArrayList<>();
		Class<?> targetClass = clazz;

		do {
			final List<InjectionMetadata.InjectedElement> currElements = new ArrayList<>();

			ReflectionUtils.doWithLocalFields(targetClass, field -> {
				AnnotationAttributes ann = findAutowiredAnnotation(field);
				if (ann != null) {
					if (Modifier.isStatic(field.getModifiers())) {
						if (logger.isInfoEnabled()) {
							logger.info("Autowired annotation is not supported on static fields: " + field);
						}
						return;
					}
					boolean required = determineRequiredStatus(ann);
					currElements.add(new AutowiredFieldElement(field, required));
				}
			});

			ReflectionUtils.doWithLocalMethods(targetClass, method -> {
				Method bridgedMethod = BridgeMethodResolver.findBridgedMethod(method);
				if (!BridgeMethodResolver.isVisibilityBridgeMethodPair(method, bridgedMethod)) {
					return;
				}
				AnnotationAttributes ann = findAutowiredAnnotation(bridgedMethod);
				if (ann != null && method.equals(ClassUtils.getMostSpecificMethod(method, clazz))) {
					if (Modifier.isStatic(method.getModifiers())) {
						if (logger.isInfoEnabled()) {
							logger.info("Autowired annotation is not supported on static methods: " + method);
						}
						return;
					}
					if (method.getParameterCount() == 0) {
						if (logger.isInfoEnabled()) {
							logger.info("Autowired annotation should only be used on methods with parameters: " +
									method);
						}
					}
					boolean required = determineRequiredStatus(ann);
					PropertyDescriptor pd = BeanUtils.findPropertyForMethod(bridgedMethod, clazz);
					currElements.add(new AutowiredMethodElement(method, required, pd));
				}
			});

			elements.addAll(0, currElements);
			targetClass = targetClass.getSuperclass();
		}
		while (targetClass != null && targetClass != Object.class);

		return new InjectionMetadata(clazz, elements);
	}
```
::: tip 为什么 @Autowired 不支持静态变量、静态方法？
首先我们知道**静态变量**它是属于**类**的，而非属于**实例对象**的属性；同样的**静态方法**也是属于**类**的，普通方法（实例方法）才属于**实例对象**。

然而`Spring`容器管理的都是**实例对象**，包括它的`@Autowired`依赖注入的均是容器内的**对象实例**，所以对于`static`成员是不能直接使用`@Autowired`注入的。
:::


上面的`InjectedElement`有两个子类，分别是`AutowiredFieldElement`和`AutowiredMethodElement`。

`AutowiredFieldElement`用于对标注在属性上的注入，`AutowiredMethodElement`用于对标注在方法上的注入。

两种方式的注入过程都差不多，根据需要注入的元素的描述信息，**按类型查找需要的依赖值**，如果依赖没有实例化则先实例化依赖，然后使用反射进行赋值。