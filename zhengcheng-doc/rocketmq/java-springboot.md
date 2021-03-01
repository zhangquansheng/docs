# Spring 集成

## 背景信息

消息队列`RocketMQ`版支持以下消息类型的生产者和消费者与`Spring`集成：
- 普通消息的生产者和消费者
- 事务消息的生产者和消费者
- 顺序消息的生产者和消费者

## 参数说明

与`Spring`集成中所需配置的参数如下所示。
|  参数   | 说明  |
|  ----  | ----  |
| GROUP_ID  | 您在控制台创建的Group ID，用于对消费者或生产者实例进行分类。|
| AccessKey  | 阿里云身份验证AccessKey ID，在阿里云用户信息管理控制台获取。 |
| SecretKey  | 阿里云身份验证AccessKey Secret，在阿里云用户信息管理控制台获取。 |
| NAMESRV_ADDR  | 设置TCP接入域名，进入控制台的实例详情页面的TCP协议客户端接入点区域查看。 |
| expression  | 消息过滤表达式，例如“Tag A||Tag B”，说明消费者订阅了带有Tag A和Tag B两种Tag的消息。 |

Spring框架下支持的更多配置参数请参见`Java SDK`[接口和参数说明](https://www.alibabacloud.com/help/zh/doc-detail/52591.htm)。

## Demo下载

可以通过以下链接获取相关Demo：

- [spring/java-spring-demo](https://code.aliyun.com/aliware_rocketmq/rocketmq-demo/tree/master/spring/java-spring-demo)
- [springboot/java-springboot-demo](https://code.aliyun.com/aliware_rocketmq/rocketmq-demo/tree/master/springboot/java-springboot-demo)

## 正常消费

`DemoMessageListener.java`
```java
@Component
public class DemoMessageListener implements MessageListener {

    @Override
    public Action consume(Message message, ConsumeContext context) throws Exception{

        System.out.println("Receive: " + message);
        try {
            //do something..
            return Action.CommitMessage;
        } catch (Exception e) {
            //消费失败
            return Action.ReconsumeLater;
        }
    }
}
```

消费者配置：`ConsumerClient.java`

```java
//项目中加上 @Configuration 注解，这样服务启动时consumer也启动了
public class ConsumerClient {

    @Autowired
    private MqConfig mqConfig;

    @Autowired
    private DemoMessageListener messageListener;

    @Bean(initMethod = "start", destroyMethod = "shutdown")
    public ConsumerBean buildConsumer() {
        ConsumerBean consumerBean = new ConsumerBean();
        //配置文件
        Properties properties = mqConfig.getMqPropertie();
        properties.setProperty(PropertyKeyConst.GROUP_ID, mqConfig.getGroupId());
        //将消费者线程数固定为20个 20为默认值
        properties.setProperty(PropertyKeyConst.ConsumeThreadNums, "20");
        consumerBean.setProperties(properties);
        //订阅关系
        Map<Subscription, MessageListener> subscriptionTable = new HashMap<Subscription, MessageListener>();
        Subscription subscription = new Subscription();
        subscription.setTopic(mqConfig.getTopic());
        subscription.setExpression(mqConfig.getTag());
        subscriptionTable.put(subscription, messageListener);
        //订阅多个topic如上面设置

        consumerBean.setSubscriptionTable(subscriptionTable);
        return consumerBean;
    }

}
```

## 批量消费

`BatchDemoMessageListener.java`
```java
@Component
public class BatchDemoMessageListener implements BatchMessageListener {

    @Override
    public Action consume(final List<Message> messages, final ConsumeContext context) {
        System.out.println("Receive: " + messages.size() + " messages");
        for (Message message : messages) {
            System.out.println(message);
        }
        try {
            //do something..
            return Action.CommitMessage;
        } catch (Exception e) {
            //消费失败
            return Action.ReconsumeLater;
        }
    }
}
```

消费者配置：`BatchConsumerClient.java`
```java
//项目中加上 @Configuration 注解，这样服务启动时consumer也启动了
public class BatchConsumerClient {

    @Autowired
    private MqConfig mqConfig;

    @Autowired
    private BatchDemoMessageListener messageListener;

    @Bean(initMethod = "start", destroyMethod = "shutdown")
    public BatchConsumerBean buildBatchConsumer() {
        BatchConsumerBean batchConsumerBean = new BatchConsumerBean();
        //配置文件
        Properties properties = mqConfig.getMqPropertie();
        properties.setProperty(PropertyKeyConst.GROUP_ID, mqConfig.getGroupId());
        //将消费者线程数固定为20个 20为默认值
        properties.setProperty(PropertyKeyConst.ConsumeThreadNums, "20");
        batchConsumerBean.setProperties(properties);
        //订阅关系
        Map<Subscription, BatchMessageListener> subscriptionTable = new HashMap<Subscription, BatchMessageListener>();
        Subscription subscription = new Subscription();
        subscription.setTopic(mqConfig.getTopic());
        subscription.setExpression(mqConfig.getTag());
        subscriptionTable.put(subscription, messageListener);
        //订阅多个topic如上面设置

        batchConsumerBean.setSubscriptionTable(subscriptionTable);
        return batchConsumerBean;
    }

}
```

## 自定义 @RocketMQListener 注解

借鉴`@KafkaListener`实现自定义的`@RocketMQListener`来简化消费者配置，参考文档[Spring for Apache Kafka](https://spring.io/projects/spring-kafka)，源码如下

### RocketMQListener
```java
import com.aliyun.openservices.ons.api.ExpressionType;
import com.aliyun.openservices.shade.com.alibaba.rocketmq.common.protocol.heartbeat.MessageModel;

import java.lang.annotation.*;

/**
 * 借鉴 @KafkaListener 实现自定义的 @RocketMQListener
 *
 * @author quansheng1.zhang
 * @since 2021/2/2 17:18
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RocketMQListener {

    String GROUP_ID_PLACEHOLDER = "${rocketmq.group-id:}";
    String TOPIC_PLACEHOLDER = "${rocketmq.topic:}";
    String NAME_SRV_ADDR_PLACEHOLDER = "${rocketmq.name-srv-addr:http://onsaddr.cn-hangzhou.mq-internal.aliyuncs.com:8080}";

    /**
     * nameSrvAddr
     */
    String nameSrvAddr() default NAME_SRV_ADDR_PLACEHOLDER;

    /**
     * Consumers of the same role is required to have exactly same subscriptions and consumerGroup to correctly achieve
     * load balance. It's required and needs to be globally unique.
     * <p>
     * <p>
     * See <a href="http://rocketmq.apache.org/docs/core-concept/">here</a> for further discussion.
     */
    String groupId() default GROUP_ID_PLACEHOLDER;

    /**
     * Topic name.
     */
    String topic() default TOPIC_PLACEHOLDER;

    /**
     * TAG or SQL92
     * <br>if null, equals to TAG
     *
     * @see com.aliyun.openservices.ons.api.ExpressionType#TAG
     * @see com.aliyun.openservices.ons.api.ExpressionType#SQL92
     */
    ExpressionType type() default ExpressionType.TAG;

    /**
     * Control which message can be select. Grammar please see {@link com.aliyun.openservices.ons.api.ExpressionType#TAG} and {@link com.aliyun.openservices.ons.api.ExpressionType#SQL92}
     */
    String expression() default "*";

    /**
     * Control message mode, if you want all subscribers receive message all message, broadcasting is a good choice.
     */
    MessageModel messageModel() default MessageModel.CLUSTERING;

    /**
     * 消费线程数量
     */
    int consumeThreadNums() default 20;
}
```

### ConsumerAutoConfiguration
```java
import cn.hutool.core.util.StrUtil;
import com.aliyun.openservices.ons.api.MessageListener;
import com.aliyun.openservices.ons.api.PropertyKeyConst;
import com.aliyun.openservices.ons.api.batch.BatchMessageListener;
import com.aliyun.openservices.ons.api.bean.BatchConsumerBean;
import com.aliyun.openservices.ons.api.bean.ConsumerBean;
import com.aliyun.openservices.ons.api.bean.Subscription;
import com.zhangmen.ak.properties.AliyunAkProperties;
import com.zhangmen.brain.solar.rocket.mq.annotation.RocketMQListener;
import lombok.extern.slf4j.Slf4j;
import org.springframework.aop.framework.AopProxyUtils;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.SmartInitializingSingleton;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.GenericApplicationContext;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.lang.NonNull;

import java.util.HashMap;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.atomic.AtomicLong;

/**
 * ConsumerAutoConfiguration
 *
 * @author quansheng1.zhang
 * @since 2021/2/2 18:57
 */
@Slf4j
@ConditionalOnBean({AliyunAkProperties.class, StandardEnvironment.class})
@Configuration
public class ConsumerAutoConfiguration implements ApplicationContextAware, SmartInitializingSingleton {

    @Autowired
    private AliyunAkProperties aliyunAkProperties;

    @Autowired
    private StandardEnvironment environment;

    private ConfigurableApplicationContext applicationContext;

    private AtomicLong counter = new AtomicLong(0);

    @Override
    public void setApplicationContext(@NonNull ApplicationContext applicationContext) throws BeansException {
        this.applicationContext = (ConfigurableApplicationContext) applicationContext;
    }

    @Override
    public void afterSingletonsInstantiated() {
        Map<String, Object> rocketMQListenerMap = applicationContext.getBeansWithAnnotation(RocketMQListener.class);
        rocketMQListenerMap.forEach(this::registerConsumerBean);
    }

    private void registerConsumerBean(String beanName, Object bean) {
        Class<?> clazz = AopProxyUtils.ultimateTargetClass(bean);
        if (!MessageListener.class.isAssignableFrom(bean.getClass()) &&
                !BatchMessageListener.class.isAssignableFrom(bean.getClass())) {
            throw new IllegalStateException(StrUtil.format("{} is not instance of {} or {}", clazz, MessageListener.class.getName(), BatchMessageListener.class.getName()));
        }

        RocketMQListener annotation = clazz.getAnnotation(RocketMQListener.class);
        GenericApplicationContext genericApplicationContext = (GenericApplicationContext) applicationContext;

        if (bean instanceof MessageListener) {
            String consumerBeanName = StrUtil.format("{}_{}", ConsumerBean.class.getName(), counter.incrementAndGet());
            genericApplicationContext.registerBean(consumerBeanName, ConsumerBean.class,
                    () -> buildConsumer((MessageListener) bean, annotation));
            ConsumerBean consumerBean = genericApplicationContext.getBean(consumerBeanName, ConsumerBean.class);
            consumerBean.start();
        } else {
            String batchConsumerBeanName = StrUtil.format("{}_{}", BatchConsumerBean.class.getName(), counter.incrementAndGet());
            genericApplicationContext.registerBean(batchConsumerBeanName, BatchConsumerBean.class,
                    () -> buildBatchConsumer((BatchMessageListener) bean, annotation));
            BatchConsumerBean batchConsumerBean = genericApplicationContext.getBean(batchConsumerBeanName, BatchConsumerBean.class);
            batchConsumerBean.start();
        }

        log.info("Register RocketMQ {} success,access-key:{} ,nameSrvAddr:{} ,topic:{} ,expression:{} ,groupId:{} ,listenerBeanName:{}",
                bean instanceof MessageListener ? "ConsumerBean" : "BatchConsumerBean",
                aliyunAkProperties.getAk(),
                environment.resolvePlaceholders(annotation.nameSrvAddr()),
                environment.resolvePlaceholders(annotation.topic()),
                environment.resolvePlaceholders(annotation.expression()),
                environment.resolvePlaceholders(annotation.groupId()),
                beanName);
    }

    private BatchConsumerBean buildBatchConsumer(BatchMessageListener batchMessageListener, RocketMQListener annotation) {
        BatchConsumerBean batchConsumerBean = new BatchConsumerBean();
        // 设置属性
        batchConsumerBean.setProperties(getMqProperties(annotation));
        //订阅关系
        Map<Subscription, BatchMessageListener> subscriptionTable = new HashMap<>();
        //订阅多个topic如上面设置
        subscriptionTable.put(getMqSubscription(annotation), batchMessageListener);
        batchConsumerBean.setSubscriptionTable(subscriptionTable);
        return batchConsumerBean;
    }

    private ConsumerBean buildConsumer(MessageListener messageListener, RocketMQListener annotation) {
        ConsumerBean consumerBean = new ConsumerBean();

        // 设置属性
        consumerBean.setProperties(getMqProperties(annotation));
        //订阅关系
        Map<Subscription, MessageListener> subscriptionTable = new HashMap<>();
        //订阅多个topic如上面设置
        subscriptionTable.put(getMqSubscription(annotation), messageListener);

        consumerBean.setSubscriptionTable(subscriptionTable);

        return consumerBean;
    }

    private Subscription getMqSubscription(RocketMQListener annotation) {
        Subscription subscription = new Subscription();
        subscription.setTopic(environment.resolvePlaceholders(annotation.topic()));
        subscription.setType(annotation.type().name());
        subscription.setExpression(environment.resolvePlaceholders(annotation.expression()));
        return subscription;
    }

    private Properties getMqProperties(RocketMQListener annotation) {
        Properties properties = new Properties();
        properties.setProperty(PropertyKeyConst.AccessKey, aliyunAkProperties.getAk());
        properties.setProperty(PropertyKeyConst.SecretKey, aliyunAkProperties.getSec());
        properties.setProperty(PropertyKeyConst.NAMESRV_ADDR, environment.resolvePlaceholders(annotation.nameSrvAddr()));
        properties.setProperty(PropertyKeyConst.GROUP_ID, environment.resolvePlaceholders(annotation.groupId()));
        properties.setProperty(PropertyKeyConst.ConsumeThreadNums, String.valueOf(annotation.consumeThreadNums()));
        properties.setProperty(PropertyKeyConst.MessageModel, annotation.messageModel().getModeCN());
        return properties;
    }

}
```