# Spring中 Bean 的作用域与生命周期

## Bean Scopes

- singleton : 唯一 bean 实例，Spring 中的 bean 默认都是单例的。
- prototype : 每次请求都会创建一个新的 bean 实例。
- request : 每一次HTTP请求都会产生一个新的bean，该bean仅在当前HTTP request内有效。
- session : 每一次HTTP请求都会产生一个新的 bean，该bean仅在当前 HTTP session 内有效。


详细描述请参考[官方文档](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#beans-factory-scopes)


## bean 的生命周期

图示：
![sping-bean-life-cycle](/img/spring/sping-bean-life-cycle.png)

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

## 示例代码

### 1. 定义类并实现*.Aware接口、InitializingBean接口

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

### 2. 创建一个Bean的实例，使用构造器实例化。

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

### 3. BeanPostProcessor
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

### 控制台打印如下：
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


## 参考资料

- [Spring Framework Documentation](https://docs.spring.io/spring/docs/current/spring-framework-reference/)
- [https://www.cnblogs.com/zrtqsk/p/3735273.html](https://www.cnblogs.com/zrtqsk/p/3735273.html)