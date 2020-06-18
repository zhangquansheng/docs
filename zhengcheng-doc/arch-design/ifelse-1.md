# 消除代码中的if(一)

::: tip 代码地址
[aliyun-mq](https://gitee.com/zhangquansheng/zhengcheng-parent/tree/master/zc-aliyun-spring-boot-starter/src/main/java/com/zhengcheng/aliyun/mq)
:::

在有些时候，我们代码中会有很多分支，而且分支下面的代码又有一些复杂的逻辑，一般会使用 if-else/switch-case 去实现。

这里我们通过一个案例，来分享**如何使用注解+策略模式+简单工厂的方式消除 if-else/switch-case。**

消息队列 RocketMQ 版,可以通过它的高级特性-消息过滤来确保消费者最终只消费到其关注的消息类型；

一般的写法如下：

订阅多个 Tag 消费者如需订阅某 Topic 下多种类型的消息，请在多个 Tag 之间用 || 分隔：
```java
    consumer.subscribe("MQ_TOPIC","TagA||TagB",new MessageListener() {
        public Action consume (Message message, ConsumeContext context){
            String event = message.getTag();
            String body = new String(message.getBody());
            switch (event) {
                case "TagA":
                    // do something
                    break;
                case "TagB":
                    // do something
                    break;
                default:
                    break;
            }
            return Action.CommitMessage;
        }
    });
```
以上代码不仅冗长，读起来也非常的困难,并且随着订阅的TAG越多，所需要的分支越多，整个代码块越来越长。


重构代码思路如下：

## 1. 定义一个注解，用来消除 if/else switch/case

```java
/**
 * 事件
 *
 * @author :    quansheng.zhang
 * @date :    2019/8/12 22:41
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Event {
    String[] value();
}
```

### 2. 定义消费事件处理者接口，所有的消费事件需要实现该接口

```java
/**
 * 消费者处理
 *
 * @author :    quansheng.zhang
 * @date :    2019/8/13 0:17
 */
public interface IConsumerHandler {

    /**
     * 消费消息
     *
     * @param body 消息data
     * @return 执行结果，成功则消费消息成功，否则消费消息失败
     * @throws Exception
     */
    Action execute(String body);
}
```

## 3. 定义消费工厂，用于根据消息事件生成不同的消费事件实例

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
     * @return
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
        Map<String, Object> evenMap = applicationContext.getBeansWithAnnotation(Event.class);
        evenMap.forEach((k, v) -> {
            Class<IConsumerHandler> consumerHandlerClass = (Class<IConsumerHandler>) v.getClass();
            for (String e : consumerHandlerClass.getAnnotation(Event.class).value()) {
                consumerHandlerBeanMap.put(e, consumerHandlerClass);
            }
        });
    }
}
```
说明：通过获取spring中Event这个注解，获取到对应的消费事件实例，并把它们的关系存放到静态变量 consumerHandlerBeanMap（线程安全的）中，当需要根据事件名称获取消费事件实例时，直接从 consumerHandlerBeanMap 获取即可。


## 4. 重构消费者订阅处理逻辑
```java
  @Override
    public void run(String... strings) throws Exception {
        Consumer consumer = applicationContext.getBean(Consumer.class);
        List<SubscriptionTable> subscriptions = consumerProperties.getSubscriptions();
        if (!CollectionUtils.isEmpty(subscriptions)) {
            subscriptions.forEach(subscriptionTable -> {
                log.info("subscribe topic:{},expression:{}", subscriptionTable.getTopic(), subscriptionTable.getExpression());
                consumer.subscribe(subscriptionTable.getTopic(), subscriptionTable.getExpression(), (message, context) -> {
                    String event = message.getTag();
                    String body = new String(message.getBody());
                    IConsumerHandler consumerHandler = consumerFactory.create(event);
                    if (consumerHandler != null) {
                        log.info("Receive: event: {}, body: {}", event, body);
                        return consumerHandler.execute(body);
                    } else {
                        log.error("commit message, but create handler IllegalArgumentException, event:{}, body:{}", event, body);
                    }
                    return Action.CommitMessage;
                });
            });
        }
        consumer.start();
        log.info("Consumer server started");
    }
```

## 5. 使用
```java
    @Component
    @Event("TagA")
    public class TagAConsumer implements IConsumerHandler {
        @Override
        public Action execute(String body) {
            // do something
            return Action.CommitMessage;
        }
    }
```
## 6. 总结

只有当可预期的分支足够多的情况下，推荐使用此方法，而不是所有的if-else switch/case 都需要这样设计，避免过度设计。

