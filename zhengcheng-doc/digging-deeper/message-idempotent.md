# 消息幂等的通用解决方案

## Exactly Once

::: tips Exactly Once的解释：
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
        UserGameEvent userGameEvent = JSONUtil.toBean(body, UserGameEvent.class);
        if (Objects.isNull(userGameEvent) ||
                CollectionUtil.isEmpty(userGameEvent.getUserGameRecordEvents())) {
            return Action.CommitMessage;
        }

        // 插入去重表（消费中），带过期时间的
        String dedupKey = userGameEvent.getDataId();
        Boolean execute = redisTemplate.execute((RedisCallback<Boolean>)
                redisConnection ->
                        redisConnection.set(dedupKey.getBytes(),
                                (CONSUME_STATUS_CONSUMING).getBytes(),
                                Expiration.milliseconds(dedupProcessingExpireMilliSeconds),
                                RedisStringCommands.SetOption.SET_IF_ABSENT));
        if (ObjectUtil.equal(execute, Boolean.TRUE)) {
            // 没有消费过
            try {
                // 业务代码（只有这块是你的业务）
                xxService.handleUserGameEvent(userGameEvent);

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

---
**参考文档**

- [SETNX](http://redisdoc.com/string/setnx.html)
- [RocketMQ消息幂等的通用解决方案](https://mp.weixin.qq.com/s/X25Jw-sz3XItVrXRS6IQdg)