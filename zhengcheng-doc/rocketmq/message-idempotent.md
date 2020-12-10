# 消息幂等的通用解决方案

## Exactly Once

::: tip Exactly Once的解释：
Exactly-Once 是指发送到消息系统的消息只能被消费端处理且仅处理一次，即使生产端重试消息发送导致某消息重复投递，该消息在消费端也只被消费一次。
:::

## 基于消息幂等表的非事务方案

### 流水式代码如下：
```java
/**
 * RocketMQ 消息消费
 *
 * @author quansheng1.zhang
 * @since 2020/10/19 14:43
 */
@Slf4j
@Component
public class RocketMQMessageListener implements MessageListener {

    @Autowired
    private IXXService xxService;
    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    /**
     * 对于消费中的消息，多少毫秒内认为重复，默认一分钟，即一分钟内的重复消息都会串行处理（等待前一个消息消费成功/失败），超过这个时间如果消息还在消费就不认为重复了（为了防止消息丢失）
     */
    private long dedupProcessingExpireMilliSeconds = 60 * 1000;

    /**
     * 消息消费成功后，记录保留多少分钟，默认一天，即一天内的消息不会重复
     */
    private long dedupRecordReserveMinutes = 60 * 24;

    private String CONSUME_STATUS_CONSUMING = "CONSUMING";
    private String CONSUME_STATUS_CONSUMED = "CONSUMED";

    @Override
    public Action consume(Message message, ConsumeContext context) {
        String body = new String(message.getBody());
        log.info("Receive tag:{} ,body:{} ,message: {},", message.getTag(), body, message);
        XXEvent xxEvent = JSONUtil.toBean(body, XXEvent.class);
        if (Objects.isNull(xxEvent)) {
            return Action.CommitMessage;
        }

        // 插入去重表（消费中），带过期时间的
        String dedupKey = xxEvent.getDataId();
        Boolean execute = redisTemplate.execute((RedisCallback<Boolean>)
                redisConnection ->
                        redisConnection.set(dedupKey.getBytes(),
                                (CONSUME_STATUS_CONSUMING).getBytes(),
                                Expiration.milliseconds(dedupProcessingExpireMilliSeconds),
                                RedisStringCommands.SetOption.SET_IF_ABSENT));
          if (Objects.nonNull(execute) && execute) {
            // 没有消费过
            try {
                // 业务代码（只有这块是你的业务）
                xxService.handleEvent(xxEvent);

                // 更新消息表状态为成功
                redisTemplate.opsForValue().set(dedupKey, CONSUME_STATUS_CONSUMED, dedupRecordReserveMinutes, TimeUnit.MINUTES);
                //消费成功
                return Action.CommitMessage;
            } catch (Exception e) {
                // 删除消息表记录，消息重试
                redisTemplate.delete(dedupKey);
                //消息重试
                return Action.ReconsumeLater;
            }
        } else {
            // 判断记录状态是否已成功
            String val = redisTemplate.opsForValue().get(dedupKey);
            if (CONSUME_STATUS_CONSUMING.equals(val)) {//正在消费中，稍后重试
                log.warn("the same message is considered consuming, try consume later dedupKey : {}", dedupKey);
                // 延迟消费
                return Action.ReconsumeLater;
            } else if (CONSUME_STATUS_CONSUMED.equals(val)) {//证明消费过了，直接消费认为成功
                log.warn("message has been consumed before! dedupKey : {}, so just ack.", dedupKey);
                // 直接返回消费成功
                return Action.CommitMessage;
            } else {//非法结果，降级，直接消费
                log.warn("unknown consume result {}, ignore dedup, continue consuming,  dedupKey : {}", val, dedupKey);
                return Action.CommitMessage;
            }
        }
    }

}
```

### AOP 

#### 自定义 RocketMQ 消息去重 注解
```java
/**
 * RocketMQ 消息去重
 *
 * @author quansheng1.zhang
 * @since 2020/12/8 18:01
 */
public @interface RocketMQDedup {
}
```

#### 定义切面
```java
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;
import com.aliyun.openservices.ons.api.Action;
import com.aliyun.openservices.ons.api.Message;
import com.zhangmen.brain.solar.common.message.BaseMessage;
import com.zhangmen.brain.solar.rocket.mq.enums.ConsumeStatusEnum;
import com.zhangmen.brain.solar.rocket.mq.properties.RocketMQDedupProperties;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.redis.connection.RedisStringCommands;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.types.Expiration;
import org.springframework.stereotype.Component;

import java.util.Objects;
import java.util.concurrent.TimeUnit;

/**
 * {@link com.zhangmen.brain.solar.rocket.mq.annotation.RocketMQDedup}  切面
 *
 * @author quansheng1.zhang
 * @since 2020/12/8 18:03
 */
@Slf4j
@ConditionalOnClass(StringRedisTemplate.class)
@EnableConfigurationProperties({RocketMQDedupProperties.class})
@Aspect
@Component
public class RocketMQDedupAspect {

    public final static String TRACE_ID = "X-ZM-BRAIN-ROCKET-MQ-TRACE-ID";

    @Autowired
    private StringRedisTemplate stringRedisTemplate;
    @Autowired
    private RocketMQDedupProperties rocketMQDedupProperties;


    @Pointcut(value = "@annotation(com.zhangmen.brain.solar.rocket.mq.annotation.RocketMQDedup)")
    public void annotationPointCut() {
    }

    @Around("annotationPointCut()")
    public Object around(ProceedingJoinPoint pjp) throws Throwable {
        //只要有 Message 这个参数，那么就开始去重，否则不满足去重条件，例如：public Action consume(Message message, ConsumeContext context)
        Message message = null;
        Object[] args = pjp.getArgs();
        for (Object arg : args) {
            if (arg instanceof Message) {
                message = (Message) arg;
            }
        }
        if (Objects.isNull(message)) {
            return pjp.proceed();
        }

        // 是正常的消费消息
        String body = new String(message.getBody());
        log.info("Receive tag:{} ,body:{} ,message: {}", message.getTag(), body, message);

        BaseMessage baseMessage = JSONUtil.toBean(body, BaseMessage.class);
        // 没有继承 BaseMessage，默认UUID生成dataId
        if (Objects.isNull(baseMessage) || StrUtil.isBlank(baseMessage.getDataId())) {
            return pjp.proceed();
        }

        long beginTime = System.currentTimeMillis();
        MDC.put(TRACE_ID, baseMessage.getDataId());
        log.info("message body:{} prepare consume.", body);

        // 插入去重表（消费中），带过期时间的
        String dedupKey = StrUtil.format("zm:brain:mq:dedup:key:{}", baseMessage.getDataId());
        Boolean execute = stringRedisTemplate.execute((RedisCallback<Boolean>)
                redisConnection ->
                        redisConnection.set(dedupKey.getBytes(),
                                (ConsumeStatusEnum.CONSUMING.getValue()).getBytes(),
                                Expiration.milliseconds(rocketMQDedupProperties.getProcessingExpire().toMillis()),
                                RedisStringCommands.SetOption.SET_IF_ABSENT));
        if (Objects.nonNull(execute) && execute) {
            // 没有消费过
            try {
                // 业务代码（只有这块是你的业务）
                pjp.proceed();

                // 更新消息表状态为成功
                stringRedisTemplate.opsForValue().set(dedupKey, ConsumeStatusEnum.CONSUMED.getValue(), rocketMQDedupProperties.getRecordReserve().toMinutes(), TimeUnit.MINUTES);

                long costMs = System.currentTimeMillis() - beginTime;
                log.info("dataId:{} 消费成功 | 耗时：{}ms", baseMessage.getDataId(), costMs);
                //消费成功
                MDC.clear();
                return Action.CommitMessage;
            } catch (Exception e) {
                log.error("consume fail, message:{}, exceptionMessage:{}", body, e.getMessage(), e);
                // 删除消息表记录，消息重试
                stringRedisTemplate.delete(dedupKey);

                //消息重试
                MDC.clear();
                return Action.ReconsumeLater;
            }
        } else {
            // 判断记录状态是否已成功
            String val = stringRedisTemplate.opsForValue().get(dedupKey);
            if (ConsumeStatusEnum.CONSUMING.getValue().equals(val)) {//正在消费中，稍后重试
                log.warn("the same message is considered consuming, try consume later dedupKey : {}", dedupKey);

                // 延迟消费
                MDC.clear();
                return Action.ReconsumeLater;
            } else if (ConsumeStatusEnum.CONSUMED.getValue().equals(val)) {//证明消费过了，直接消费认为成功
                log.warn("message has been consumed before! dedupKey : {}, so just ack.", dedupKey);

                // 直接返回消费成功
                MDC.clear();
                return Action.CommitMessage;
            } else {//非法结果，降级，直接消费
                log.warn("unknown consume result {}, ignore dedup, continue consuming,  dedupKey : {}", val, dedupKey);

                MDC.clear();
                return Action.CommitMessage;
            }
        }
    }
}
```

#### ConsumeStatusEnum
```java
import lombok.Getter;

/**
 * 消费状态枚举
 *
 * @author quansheng1.zhang
 * @since 2020/12/8 20:51
 */
@Getter
public enum ConsumeStatusEnum {
    /**
     * 消费中
     */
    CONSUMING("CONSUMING", "消费中"),
    /**
     * 已消费
     */
    CONSUMED("CONSUMED", "已消费");

    private String value;

    private String desc;

    ConsumeStatusEnum(String value, String desc) {
        this.value = value;
        this.desc = desc;
    }

}
```

#### RocketMQDedupProperties
```java
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

/**
 * RocketMQDedupProperties
 *
 * @author quansheng1.zhang
 * @since 2020/12/8 20:42
 */
@Data
@ConfigurationProperties("rocketmq.dedup")
public class RocketMQDedupProperties {

    /**
     * 对于消费中的消息，多少毫秒内认为重复，默认一分钟，即一分钟内的重复消息都会串行处理（等待前一个消息消费成功/失败），超过这个时间如果消息还在消费就不认为重复了（为了防止消息丢失）
     */
    private Duration processingExpire = Duration.ofMillis(60 * 1000);

    /**
     * 消息消费成功后，记录保留多少分钟，默认一天，即一天内的消息不会重复
     */
    private Duration recordReserve = Duration.ofMinutes(60 * 24);
}
```


---
**参考文档**

- [SETNX](http://redisdoc.com/string/setnx.html)
- [RocketMQ消息幂等的通用解决方案](https://mp.weixin.qq.com/s/X25Jw-sz3XItVrXRS6IQdg)