# 消除代码中的if(二)

::: tip 代码地址
[aliyun-mq](https://gitee.com/zhangquansheng/zhengcheng-parent/tree/master/zc-aliyun-spring-boot-starter/src/main/java/com/zhengcheng/aliyun/mq)
:::

通过[消除代码中的if(一)](/arch-design/ifelse-1.md), 我也发现了缺点：如果 if 的条件很多，那么就需要创建很多个Class类来实现 IConsumerHandler ，这样代码不够简洁。（思路借鉴了XXL-JOB的源码）

当我们看到 KafkaListener 注解的实现方式以后，也可以按照它的方式进一步优化。

一个类中，通过方法上的注解，完成 if - else 的简化。

实现原理代码

## 定义个方法上的新注解[@RocketmqListener](https://gitee.com/zhangquansheng/zhengcheng-parent/blob/master/zc-aliyun-spring-boot-starter/src/main/java/com/zhengcheng/aliyun/mq/annotation/RocketmqListener.java) 

注解作用在方法上
```java
/**
 * 消费者工厂
 *
 * @author :    quansheng.zhang
 * @date :    2019/8/13 0:21
 */
@Slf4j
public class ConsumerFactory implements ApplicationContextAware {
 
    @Autowired
    private ApplicationContext applicationContext;
 
    public static Map<String, Class<IConsumerHandler>> consumerHandlerBeanMap = Maps.newConcurrentMap();
 
    /**
     * 获取实体
     *
     * @param event 事件
     * @return IConsumerHandler
     */
    public IConsumerHandler create(String event) {
        Class<IConsumerHandler> consumerHandlerClass = consumerHandlerBeanMap.get(event);
        if (consumerHandlerClass == null) {
            return null;
        }
        return applicationContext.getBean(consumerHandlerClass);
    }
 
    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
 
        // init ConsumerHandler Repository
        initConsumerHandlerRepository(applicationContext);
 
        // init ConsumerHandler Repository (for method)
        initConsumerHandlerMethodRepository(applicationContext);
    }
 
    private void initConsumerHandlerRepository(ApplicationContext applicationContext) {
        if (applicationContext == null) {
            return;
        }
        Map<String, Object> evenMap = applicationContext.getBeansWithAnnotation(Event.class);
        evenMap.forEach((k, v) -> {
            Class<IConsumerHandler> consumerHandlerClass = (Class<IConsumerHandler>) v.getClass();
            for (String tag : consumerHandlerClass.getAnnotation(Event.class).tags()) {
                consumerHandlerBeanMap.put(tag, consumerHandlerClass);
            }
        });
    }
 
    private void initConsumerHandlerMethodRepository(ApplicationContext applicationContext) {
        if (applicationContext == null) {
            return;
        }
 
        // init consumer handler from method
        String[] beanDefinitionNames = applicationContext.getBeanDefinitionNames();
        for (String beanDefinitionName : beanDefinitionNames) {
            Object bean = applicationContext.getBean(beanDefinitionName);
            Method[] methods = bean.getClass().getDeclaredMethods();
            for (Method method : methods) {
                RocketmqListener rocketmqListener = AnnotationUtils.findAnnotation(method, RocketmqListener.class);
                if (rocketmqListener != null) {
                    // tags
                    String[] tags = rocketmqListener.tags();
                    if (tags.length == 0) {
                        throw new RuntimeException("rocketmq-listener method-consumerHandler name invalid, for[" + bean.getClass() + "#" + method.getName() + "] .");
                    }
                    for (String tag : tags) {
                        if (consumerHandlerBeanMap.get(tag) != null) {
                            throw new RuntimeException("rocketmq-listener consumerHandler[" + tag + "] naming conflicts.");
                        }
                    }
 
                    // execute method
                    if (!(method.getParameterTypes() != null && method.getParameterTypes().length == 1 && method.getParameterTypes()[0].isAssignableFrom(String.class))) {
                        throw new RuntimeException("rocketmq-listener method-consumerHandler param-class-type invalid, for[" + bean.getClass() + "#" + method.getName() + "] , " +
                                "The correct method format like \" public Action execute(String param) \" .");
                    }
                    if (!method.getReturnType().isAssignableFrom(Action.class)) {
                        throw new RuntimeException("rocketmq-listener method-consumerHandler return-class-type invalid, for[" + bean.getClass() + "#" + method.getName() + "] , " +
                                "The correct method format like \" public Action execute(String param) \" .");
                    }
                    method.setAccessible(true);
 
 
                    for (String tag : tags) {
                        consumerHandlerBeanMap.put(tag, (Class<IConsumerHandler>) new MethodConsumerHandler(bean, method).getClass());
                    }
                }
            }
        }
    }
}
```

## 消费者工厂[ConsumerFactory](https://gitee.com/zhangquansheng/zhengcheng-parent/blob/master/zc-aliyun-spring-boot-starter/src/main/java/com/zhengcheng/aliyun/mq/factory/ConsumerFactory.java)

增加
initConsumerHandlerMethodRepository 用于初始化 RocketmqListener 注解的方法，然后根据当前bean那么和方法名，动态生成对应的class（这里就是简化类的数量的核心逻辑）

```java
/**
 * 方法 消费者处理
 *
 * @author :    zhangquansheng
 * @date :    2020/4/15 16:31
 */
@Slf4j
public class MethodConsumerHandler implements IConsumerHandler {
 
    private final Object target;
    private final Method method;
 
    public MethodConsumerHandler(Object target, Method method) {
        this.target = target;
        this.method = method;
    }
 
    @Override
    public Action execute(String body) {
        try {
            return (Action) method.invoke(target, new Object[]{body});
        } catch (Exception e) {
            log.error("method:[{}],body:[{}],execute exception:[{}]", method, body, e.getMessage(), e);
            return Action.ReconsumeLater;
        }
    }
}
```

## 方法 消费者处理[MethodConsumerHandler](https://gitee.com/zhangquansheng/zhengcheng-parent/blob/master/zc-aliyun-spring-boot-starter/src/main/java/com/zhengcheng/aliyun/mq/handler/impl/MethodConsumerHandler.java)

方法消费者处理者，实现 IConsumerHandler ，通过反射找到对应的方法

```java
/**
 * 方法 消费者处理
 *
 * @author :    zhangquansheng
 * @date :    2020/4/15 16:31
 */
@Slf4j
public class MethodConsumerHandler implements IConsumerHandler {
 
    private final Object target;
    private final Method method;
 
    public MethodConsumerHandler(Object target, Method method) {
        this.target = target;
        this.method = method;
    }
 
    @Override
    public Action execute(String body) {
        try {
            return (Action) method.invoke(target, new Object[]{body});
        } catch (Exception e) {
            log.error("method:[{}],body:[{}],execute exception:[{}]", method, body, e.getMessage(), e);
            return Action.ReconsumeLater;
        }
    }
}
```

::: tip 总结
通过以上的注解，可以大量的减少类的个数，推荐使用此注解。
:::