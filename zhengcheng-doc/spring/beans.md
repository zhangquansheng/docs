---
sidebarDepth: 3
---

# Bean 

[[toc]]

在**IoC容器**内，这些`bean`定义表示为`org.springframework.beans.factory.config.BeanDefinition`对象，这些对象包含（除其他信息外）以下元数据：

Property | Explained in…​
---|---
Class | [Instantiating Beans](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#beans-factory-class)
Name | [Naming Beans](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#beans-beanname)
Scope | [Bean Scopes](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#beans-factory-scopes)
Constructor arguments | [Dependency Injection](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#beans-factory-collaborators)
Properties | [Dependency Injection](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#beans-factory-collaborators)
Autowiring mode | [Autowiring Collaborators](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#beans-factory-autowire)
Lazy initialization mode | [Lazy-initialized Beans](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#beans-factory-lazy-init)
Initialization method | [Initialization Callbacks](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#beans-factory-lifecycle-initializingbean)
Destruction method | [Destruction Callbacks](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#beans-factory-lifecycle-disposablebean)

## Bean 作用域

Scope |	描述
---|---
singleton | (默认)一个**IoC容器**只会对一个`bean`定义一个实例（[单例模式](https://www.runoob.com/design-pattern/singleton-pattern.html)）。
prototype | 每次请求`bean`时**IoC容器**都会创建一个**新**的实例（多例模式）。
request | Scopes a single bean definition to the lifecycle of a single HTTP request. That is, each HTTP request has its own instance of a bean created off the back of a single bean definition. Only valid in the context of a web-aware Spring ApplicationContext.
session | Scopes a single bean definition to the lifecycle of an HTTP Session. Only valid in the context of a web-aware Spring ApplicationContext.
application | Scopes a single bean definition to the lifecycle of a ServletContext. Only valid in the context of a web-aware Spring ApplicationContext.
websocket |  Scopes a single bean definition to the lifecycle of a WebSocket. Only valid in the context of a web-aware Spring ApplicationContext.

## Bean 生命周期

图示：
![spring-bean-life-cycle](/img/spring/spring-bean-life-cycle.png)

- 创建一个Bean的实例，使用构造器实例化。
- 如果涉及到一些属性值，则利用`setXXX()`方法注入属性。
- 如果Bean 实现了 `BeanNameAware` 接口，调用 `setBeanName()` 方法，传入Bean的名字。
- 如果Bean 实现了 `BeanClassLoaderAware` 接口，调用 `setBeanClassLoader()` 方法，传入 `ClassLoader` 对象的实例。
- 与上面的类似，如果实现了其他 *.Aware接口，就调用相应的方法。
- 如果有和这个Bean的**Spring容器相关的**`BeanPostProcessor`对象，执行`postProcessBeforeInitialization()`方法。
- 如果Bean实现了`InitializingBean`接口，执行`afterPropertiesSet()`方法。
- 如果Bean定义包含`init-method`属性，执行指定的方法。
- 如果有和这个Bean的**Spring容器相关的**`BeanPostProcessor`对象，执行postProcessAfterInitialization()方法。
- 当要销毁Bean的时候，如果Bean实现了`DisposableBean`接口，执行`destroy()`方法。
- 当要销毁Bean的时候，如果Bean定义包含`destroy-method`属性，执行指定的方法。

### 示例代码

#### 1. 定义类并实现*.Aware接口、InitializingBean接口

```java
/**
 * 实现Bean的生命周期接口，四个接口，要实现其中的四个方法，实例化和初始化完成后会自动被调用
 *
 * @author :    zhangquansheng
 * @date :    2020/9/1 13:18
 */
@Slf4j
public class SmsBean implements BeanNameAware, BeanClassLoaderAware, BeanFactoryAware, InitializingBean, DisposableBean, ApplicationContextAware {


    private String content;

    private BeanFactory beanFactory;
    private String beanName;

    public SmsBean() {
        log.info("【构造器】调用SmsBean的构造器实例化");
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        log.info("【注入属性】注入属性content={}", content);
        this.content = content;
    }

    @Override
    public void setBeanFactory(BeanFactory beanFactory) throws BeansException {
        log.info("【BeanFactoryAware接口】调用BeanFactoryAware.setBeanFactory()");
        this.beanFactory = beanFactory;
    }

    @Override
    public void setBeanName(String name) {
        log.info("【BeanNameAware接口】调用BeanNameAware.setBeanName(), beanName={}", name);
        this.beanName = name;
    }

    @Override
    public void afterPropertiesSet() throws Exception {
        //同一级的生命周期方法中最后一个被调用的,但是只会调用一次，之后在调用bean的setxx()方法更改属性时将不会再被被调用到
        log.info("【InitializingBean接口】调用InitializingBean.afterPropertiesSet()");
    }

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        log.info("【ApplicationContextAware】调用setApplicationContext()");
    }

    @Override
    public void destroy() throws Exception {
        log.info("【DisposableBean接口】调用DisposableBean.destroy()");
    }

    public void myInit() {
        log.info("【init-method】调用<bean>的init-method属性指定的初始化方法");
    }

    public void myDestroy() {
        log.info("【destroy-method】调用<bean>destroy-method属性指定的初始化方法");
    }

    @Override
    public void setBeanClassLoader(ClassLoader classLoader) {
        log.info("【BeanClassLoaderAware】调用setBeanClassLoader()");
    }
}
```

#### 2. 创建一个Bean的实例，使用构造器实例化。

```java
/**
 * BeanConfig
 *
 * @author :    zhangquansheng
 * @date :    2020/9/1 17:09
 */
@Configuration
public class BeanConfig {

    @Bean(initMethod = "myInit", destroyMethod = "myDestroy")
    public SmsBean sms() {
        SmsBean sms = new SmsBean();
        sms.setContent("007");
        return sms;
    }

}
```

#### 3. BeanPostProcessor
```java
/**
 * MyBeanPostProcessor
 *
 * @author :    zhangquansheng
 * @date :    2020/9/1 17:44
 */
@Slf4j
@Component
public class MyBeanPostProcessor implements BeanPostProcessor {

    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
        if (bean instanceof SmsBean) {
            log.info("调用postProcessBeforeInitialization() 对{}进行加工", beanName);
        }
        return bean;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (bean instanceof SmsBean) {
            log.info("调用postProcessAfterInitialization() 再次获得{}加工机会", beanName);
        }
        return bean;
    }

}
```

#### 控制台打印如下：
```
SmsBean.java:25 - 【构造器】调用SmsBean的构造器实例化
SmsBean.java:33 - 【注入属性】注入属性content=007
SmsBean.java:45 - 【BeanNameAware接口】调用BeanNameAware.setBeanName(), beanName=sms
SmsBean.java:75 - 【BeanClassLoaderAware】调用setBeanClassLoader()
SmsBean.java:39 - 【BeanFactoryAware接口】调用BeanFactoryAware.setBeanFactory()
SmsBean.java:57 - 【ApplicationContextAware】调用setApplicationContext()
MyBeanPostProcessor.java:21 - 调用postProcessBeforeInitialization() 对sms进行加工
SmsBean.java:52 - 【InitializingBean接口】调用InitializingBean.afterPropertiesSet()
SmsBean.java:66 - 【init-method】调用<bean>的init-method属性指定的初始化方法
MyBeanPostProcessor.java:31 - 调用postProcessAfterInitialization() 再次获得sms加工机会
```

### InitializingBean和DisposableBean接口

`bean`实现`InitializingBean`和`DisposableBean`接口是为了让**Spring容器**对`bean`的生命周期进行管理，**Spring容器**可以在`afterPropertiesSet()`和`destroy()`方法中执行某些操作。

::: tip 特别提示	
在JSR-250中， `@PostConstruct`和`@PreDestroy`注释被认为是`Spring`应用程序中接收生命周期回调的最佳实践。使用这些注释意味着`bean`不耦合到`Spring`特定的接口。有关详细信息，请参见[使用@PostConstruct和@PreDestroy](https://docs.spring.io/spring-framework/docs/current/spring-framework-reference/core.html#beans-postconstruct-and-predestroy-annotations)。

如果你不希望使用JSR-250注解，但希望`bean`不耦合到`Spring`特定的接口，考虑`init-method`和`destroy-method`。
:::

#### 初始化回调

`org.springframework.beans.factory.InitializingBean`容器在bean上设置了所有必需的属性后，该接口可让`bean`执行初始化工作。
```java
public interface InitializingBean {

	void afterPropertiesSet() throws Exception;

}
```

我们建议您不要使用InitializingBean接口，因为它将代码与Spring耦合。

#### 销毁回调

`org.springframework.beans.factory.DisposableBean`当包含该接口的容器被销毁时，实现该接口可使`Bean`获得回调。建议使用`@PostConstruct注释`或者在`bean`上使用`init method`属性
```java
public interface DisposableBean {

	void destroy() throws Exception;

}
```

我们建议您不要使用DisposableBean回调接口，因为它不必要地将代码与Spring耦合。建议使用`@PreDestroy注释`或者在`bean`上使用`destroy method`属性

## FactoryBean

一般情况下，`Spring`通过**反射机制**利用`bean`的`class`属性指定实现类实例化`Bean`，在某些情况下，实例化`Bean`过程比较复杂，如果按照传统的方式，则需要在`bean`中提供大量的配置信息。配置方式的灵活性是受限的，这时采用编码的方式可能会得到一个简单的方案。

`Spring`为此提供了一个`org.springframework.bean.factory.FactoryBean`的工厂类接口，用户可以通过实现该接口定制`实例化Bean`的逻辑。`FactoryBean`接口对于Spring框架来说占用重要的地位，Spring自身就提供了50多个FactoryBean的实现。

它们隐藏了实例化一些复杂`Bean`的细节，给上层应用带来了便利。从`Spring3.0`开始，`FactoryBean`开始支持泛型，即接口声明改为`FactoryBean<T>`的形式。

源码如下：
```java
public interface FactoryBean<T> {

	@Nullable
	T getObject() throws Exception;

	@Nullable
	Class<?> getObjectType();

	default boolean isSingleton() {
		return true;
	}

}
```
`FactoryBean` 接口提供了三种方法：
- `Object getObject()`：返回由FactoryBean创建的Bean实例，如果isSingleton()返回true，则该实例会放到Spring容器中单实例缓存池中；
- `boolean isSingleton()`：返回由FactoryBean创建的Bean实例的作用域是singleton还是prototype；
- `Class getObjectType()`：返回FactoryBean创建的Bean类型。