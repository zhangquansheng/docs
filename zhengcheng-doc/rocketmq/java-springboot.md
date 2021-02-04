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

## 正常消费单个消息

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