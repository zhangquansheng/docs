# @ConfigurationProperties

## 使用示例

`@ConfigurationProperties`注解结合`@Component`在类上使用
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

`@ConfigurationProperties`注解结合`@Bean`在方法上使用
```java
    @Bean
    @ConfigurationProperties("rocketmq")
    public RocketMQProperties rocketMQProperties() {
        return new RocketMQProperties();
    }
```

`@ConfigurationProperties`注解结合`@EnableConfigurationProperties`在类上使用，这个时候不需要使用`@Component`相关注解了
```java
@EnableConfigurationProperties({RocketMQProperties.class})
```

属性
```properties
rocketmq.access-key = 您的access-key
rocketmq.secret-key = 您的secret-key
# 设置 TCP 接入域名，进入控制台的实例管理页面的“获取接入点信息”区域查看
rocketmq.name-srv-addr = http://onsaddr.cn-hangzhou.mq-internal.aliyuncs.com:8080
# 您在控制台创建的 Group ID
rocketmq.group-id = GID_BRAIN_TR_TOOL_FAT
rocketmq.topic = BRAIN_TR_TOOL_FAT
```

## @ConfigurationProperties vs. @Value

The @Value annotation is a core container feature, and it does not provide the same features as type-safe configuration properties. The following table summarizes the features that are supported by @ConfigurationProperties and @Value:

特征 | @ConfigurationProperties | @Value
---|---|---
[宽松的绑定](https://docs.spring.io/spring-boot/docs/2.1.13.RELEASE/reference/html/boot-features-external-config.html#boot-features-external-config-relaxed-binding) | Yes | No
[元数据支持](https://docs.spring.io/spring-boot/docs/2.1.13.RELEASE/reference/html/configuration-metadata.html) | Yes| No
SpEL 表达式 | No | Yes

If you define a set of configuration keys for your own components, we recommend you group them in a POJO annotated with @ConfigurationProperties. You should also be aware that, since @Value does not support relaxed binding, it is not a good candidate if you need to provide the value by using environment variables.

Finally, while you can write a SpEL expression in @Value, such expressions are not processed from application property files.

## 实现原理

**首先`@ConfigurationProperties`需要和`@Bean`或者`@Component`等只要能生成`spring bean`的注解结合起来使用**。

这样当其他类注入`Spring`容器时，在`bean`加载过程中，会调用`AbstractAutowireCapableBeanFactory#applyBeanPostProcessorsBeforeInitialization`，因此会触发`ConfigurationPropertiesBindingPostProcessor#postProcessBeforeInitialization`的调用。

涉及到的相关实现类和方法如下：

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

最后调用`org.springframework.boot.context.properties.bind.Binder.java`中的方法来完成绑定。

---

参考文档

- [spring bean-生命周期](/spring/beans.html#bean-%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F)
- [Type-safe Configuration Properties](https://docs.spring.io/spring-boot/docs/2.1.13.RELEASE/reference/html/boot-features-external-config.html#boot-features-external-config-typesafe-configuration-properties)