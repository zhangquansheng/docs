# @Autowired

如何正确使用，请参考[官方文档](https://docs.spring.io/spring-framework/docs/current/spring-framework-reference/core.html#beans-autowired-annotation), 本篇主要讲它的实现原理。

`@Autowired`可以被标注在**构造函数**、**属性**、**setter方法**或**配置方法**上，用于实现依赖自动注入。

`@Autowired`注解的作用是由`AutowiredAnnotationBeanPostProcessor`实现的，它实现了`MergedBeanDefinitionPostProcessor`接口中的`postProcessMergedBeanDefinition`方法，
`@Autowired`注解正是通过这个方法实现注入类型的预解析，将需要依赖注入的属性信息封装到`InjectionMetadata`类中，`InjectionMetadata`类中包含了哪些需要注入的元素及元素要注入到哪个目标类中。

## 工作原理

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

查询自动注入的元数据源码如下：
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