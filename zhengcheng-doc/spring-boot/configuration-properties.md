# @ConfigurationProperties

`@ConfigurationProperties`需要和`@Bean`或者`@Component`等只要能生成`spring bean`的注解结合起来使用。
这样当其他类注入`Spring`容器时，在`bean`加载过程中，会调用`AbstractAutowireCapableBeanFactory#applyBeanPostProcessorsBeforeInitialization`，因此会触发`ConfigurationPropertiesBindingPostProcessor#postProcessBeforeInitialization`的调用。
这就是`@ConfigurationProperties`实现原理的起点。

`ConfigurationPropertiesBindingPostProcessor`
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
```
---

参考文档

- [spring bean-生命周期](/spring/beans.html#bean-%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F)
- [Type-safe Configuration Properties](https://docs.spring.io/spring-boot/docs/2.1.13.RELEASE/reference/html/boot-features-external-config.html#boot-features-external-config-typesafe-configuration-properties)