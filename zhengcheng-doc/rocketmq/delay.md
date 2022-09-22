# 深入理解 RocketMQ 延迟消息 :hammer:

延时消息的关键点在于Producer生产者需要给消息设置特定延时级别，消费端代码与正常消费者没有差别。

设置消息延时级别的方法是setDelayTimeLevel()，目前RocketMQ不支持任意时间间隔的延时消息，只支持特定级别的延时消息。

> private String messageDelayLevel = "1s 5s 10s 30s 1m 2m 3m 4m 5m 6m 7m 8m 9m 10m 20m 30m 1h 2h";

- 延时级别1对应延时1秒后发送消息
- 延时级别2对应延时5秒后发送消息
- 延时级别3对应延时10秒后发送消息

## 实现原理

1. producer端设置消息delayLevel延迟级别，消息属性DELAY中存储了对应了延时级别
2. broker端收到消息后，判断延时消息延迟级别，如果大于0，则备份消息原始topic，queueId，并将消息topic改为延时消息队列特定topic(SCHEDULE_TOPIC)，queueId改为延时级别-1
3. mq服务端ScheduleMessageService中，为每一个延迟级别单独设置一个定时器，定时(每隔1秒)拉取对应延迟级别的消费队列，根据消费偏移量offset从commitLog中解析出对应消息
4. 从消息tagsCode中解析出消息应当被投递的时间，与当前时间做比较，判断是否应该进行投递，若到达了投递时间，则构建一个新的消息，并从消息属性中恢复出原始的topic，queueId，并清除消息延迟属性，从新进行消息投递

> 定时消息会暂存在名为SCHEDULE_TOPIC_XXXX的topic中，并根据delayTimeLevel存入特定的queue，queueId = delayTimeLevel – 1，即一个queue只存相同延迟的消息，保证具有相同发送延迟的消息能够顺序消费。broker会调度地消费SCHEDULE_TOPIC_XXXX，将消息写入真实的topic。

## ScheduleMessageService 分析

## RocketMQ 的延时消息最大延时级别只支持延时 2 小时，那么如何实现延迟 3 小时？

先借助于 redis 缓存消息ID，在延迟2个小时（级别=18），当消费端拉取到消息后，判断是否有缓存，如果存在缓存则再次发送一个（1h）的延时消息并删除缓存。

## 问题

**延时消息的延时时间并不精确**，这个时间是 Broker 调度线程把消息重新投递到原始的 MessageQueue 的时间，如果发生消息积压或者 RocketMQ 客户端发生流量管控，客户端拉取到消息后进行处理的时间可能会超出预设的延时时间。



