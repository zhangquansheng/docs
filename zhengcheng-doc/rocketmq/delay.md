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

```java
public class ScheduleMessageService extends ConfigManager {
    private static final InternalLogger log = InternalLoggerFactory.getLogger(LoggerName.STORE_LOGGER_NAME);

    public static final String SCHEDULE_TOPIC = "SCHEDULE_TOPIC_XXXX";
    private static final long FIRST_DELAY_TIME = 1000L;
    private static final long DELAY_FOR_A_WHILE = 100L;
    private static final long DELAY_FOR_A_PERIOD = 10000L;

    private final ConcurrentMap<Integer /* level */, Long/* delay timeMillis */> delayLevelTable =
        new ConcurrentHashMap<Integer, Long>(32);

    private final ConcurrentMap<Integer /* level */, Long/* offset */> offsetTable =
        new ConcurrentHashMap<Integer, Long>(32);
    private final DefaultMessageStore defaultMessageStore;
    private final AtomicBoolean started = new AtomicBoolean(false);
    private Timer timer;
    private MessageStore writeMessageStore;
    private int maxDelayLevel;

    public ScheduleMessageService(final DefaultMessageStore defaultMessageStore) {
        this.defaultMessageStore = defaultMessageStore;
        this.writeMessageStore = defaultMessageStore;
    }

    public static int queueId2DelayLevel(final int queueId) {
        return queueId + 1;
    }

    public static int delayLevel2QueueId(final int delayLevel) {
        return delayLevel - 1;
    }

    //......

    private void updateOffset(int delayLevel, long offset) {
        this.offsetTable.put(delayLevel, offset);
    }

    public long computeDeliverTimestamp(final int delayLevel, final long storeTimestamp) {
        Long time = this.delayLevelTable.get(delayLevel);
        if (time != null) {
            return time + storeTimestamp;
        }

        return storeTimestamp + 1000;
    }

    public void start() {
        if (started.compareAndSet(false, true)) {
            this.timer = new Timer("ScheduleMessageTimerThread", true);
            for (Map.Entry<Integer, Long> entry : this.delayLevelTable.entrySet()) {
                Integer level = entry.getKey();
                Long timeDelay = entry.getValue();
                Long offset = this.offsetTable.get(level);
                if (null == offset) {
                    offset = 0L;
                }

                if (timeDelay != null) {
                    this.timer.schedule(new DeliverDelayedMessageTimerTask(level, offset), FIRST_DELAY_TIME);
                }
            }

            this.timer.scheduleAtFixedRate(new TimerTask() {

                @Override
                public void run() {
                    try {
                        if (started.get()) ScheduleMessageService.this.persist();
                    } catch (Throwable e) {
                        log.error("scheduleAtFixedRate flush exception", e);
                    }
                }
            }, 10000, this.defaultMessageStore.getMessageStoreConfig().getFlushDelayOffsetInterval());
        }
    }

    public void shutdown() {
        if (this.started.compareAndSet(true, false)) {
            if (null != this.timer)
                this.timer.cancel();
        }

    }

    //......

    public boolean load() {
        boolean result = super.load();
        result = result && this.parseDelayLevel();
        return result;
    }

    @Override
    public String configFilePath() {
        return StorePathConfigHelper.getDelayOffsetStorePath(this.defaultMessageStore.getMessageStoreConfig()
            .getStorePathRootDir());
    }

    @Override
    public void decode(String jsonString) {
        if (jsonString != null) {
            DelayOffsetSerializeWrapper delayOffsetSerializeWrapper =
                DelayOffsetSerializeWrapper.fromJson(jsonString, DelayOffsetSerializeWrapper.class);
            if (delayOffsetSerializeWrapper != null) {
                this.offsetTable.putAll(delayOffsetSerializeWrapper.getOffsetTable());
            }
        }
    }

    public String encode(final boolean prettyFormat) {
        DelayOffsetSerializeWrapper delayOffsetSerializeWrapper = new DelayOffsetSerializeWrapper();
        delayOffsetSerializeWrapper.setOffsetTable(this.offsetTable);
        return delayOffsetSerializeWrapper.toJson(prettyFormat);
    }

    public boolean parseDelayLevel() {
        HashMap<String, Long> timeUnitTable = new HashMap<String, Long>();
        timeUnitTable.put("s", 1000L);
        timeUnitTable.put("m", 1000L * 60);
        timeUnitTable.put("h", 1000L * 60 * 60);
        timeUnitTable.put("d", 1000L * 60 * 60 * 24);

        String levelString = this.defaultMessageStore.getMessageStoreConfig().getMessageDelayLevel();
        try {
            String[] levelArray = levelString.split(" ");
            for (int i = 0; i < levelArray.length; i++) {
                String value = levelArray[i];
                String ch = value.substring(value.length() - 1);
                Long tu = timeUnitTable.get(ch);

                int level = i + 1;
                if (level > this.maxDelayLevel) {
                    this.maxDelayLevel = level;
                }
                long num = Long.parseLong(value.substring(0, value.length() - 1));
                long delayTimeMillis = tu * num;
                this.delayLevelTable.put(level, delayTimeMillis);
            }
        } catch (Exception e) {
            log.error("parseDelayLevel exception", e);
            log.info("levelString String = {}", levelString);
            return false;
        }

        return true;
    }

    //......
}
```

ScheduleMessageService继承了ConfigManager；定义了delayLevelTable，其key为level，value为delay timeMillis；其start方法会先延时FIRST_DELAY_TIME调度DeliverDelayedMessageTimerTask；之后注册了另一个定时任务，每隔flushDelayOffsetInterval执行persist方法(ConfigManager.persist)

## DeliverDelayedMessageTimerTask

```java
class DeliverDelayedMessageTimerTask extends TimerTask {
    private final int delayLevel;
    private final long offset;

    public DeliverDelayedMessageTimerTask(int delayLevel, long offset) {
        this.delayLevel = delayLevel;
        this.offset = offset;
    }

    @Override
    public void run() {
        try {
            if (isStarted()) {
                this.executeOnTimeup();
            }
        } catch (Exception e) {
            // XXX: warn and notify me
            log.error("ScheduleMessageService, executeOnTimeup exception", e);
            ScheduleMessageService.this.timer.schedule(new DeliverDelayedMessageTimerTask(
                this.delayLevel, this.offset), DELAY_FOR_A_PERIOD);
        }
    }

    /**
     * @return
     */
    private long correctDeliverTimestamp(final long now, final long deliverTimestamp) {

        long result = deliverTimestamp;

        long maxTimestamp = now + ScheduleMessageService.this.delayLevelTable.get(this.delayLevel);
        if (deliverTimestamp > maxTimestamp) {
            result = now;
        }

        return result;
    }

    public void executeOnTimeup() {
        ConsumeQueue cq =
            ScheduleMessageService.this.defaultMessageStore.findConsumeQueue(SCHEDULE_TOPIC,
                delayLevel2QueueId(delayLevel));

        long failScheduleOffset = offset;

        if (cq != null) {
            SelectMappedBufferResult bufferCQ = cq.getIndexBuffer(this.offset);
            if (bufferCQ != null) {
                try {
                    long nextOffset = offset;
                    int i = 0;
                    ConsumeQueueExt.CqExtUnit cqExtUnit = new ConsumeQueueExt.CqExtUnit();
                    for (; i < bufferCQ.getSize(); i += ConsumeQueue.CQ_STORE_UNIT_SIZE) {
                        long offsetPy = bufferCQ.getByteBuffer().getLong();
                        int sizePy = bufferCQ.getByteBuffer().getInt();
                        long tagsCode = bufferCQ.getByteBuffer().getLong();

                        if (cq.isExtAddr(tagsCode)) {
                            if (cq.getExt(tagsCode, cqExtUnit)) {
                                tagsCode = cqExtUnit.getTagsCode();
                            } else {
                                //can't find ext content.So re compute tags code.
                                log.error("[BUG] can't find consume queue extend file content!addr={}, offsetPy={}, sizePy={}",
                                    tagsCode, offsetPy, sizePy);
                                long msgStoreTime = defaultMessageStore.getCommitLog().pickupStoreTimestamp(offsetPy, sizePy);
                                tagsCode = computeDeliverTimestamp(delayLevel, msgStoreTime);
                            }
                        }

                        long now = System.currentTimeMillis();
                        long deliverTimestamp = this.correctDeliverTimestamp(now, tagsCode);

                        nextOffset = offset + (i / ConsumeQueue.CQ_STORE_UNIT_SIZE);

                        long countdown = deliverTimestamp - now;

                        if (countdown <= 0) {
                            MessageExt msgExt =
                                ScheduleMessageService.this.defaultMessageStore.lookMessageByOffset(
                                    offsetPy, sizePy);

                            if (msgExt != null) {
                                try {
                                    MessageExtBrokerInner msgInner = this.messageTimeup(msgExt);
                                    PutMessageResult putMessageResult =
                                        ScheduleMessageService.this.writeMessageStore
                                            .putMessage(msgInner);

                                    if (putMessageResult != null
                                        && putMessageResult.getPutMessageStatus() == PutMessageStatus.PUT_OK) {
                                        continue;
                                    } else {
                                        // XXX: warn and notify me
                                        log.error(
                                            "ScheduleMessageService, a message time up, but reput it failed, topic: {} msgId {}",
                                            msgExt.getTopic(), msgExt.getMsgId());
                                        ScheduleMessageService.this.timer.schedule(
                                            new DeliverDelayedMessageTimerTask(this.delayLevel,
                                                nextOffset), DELAY_FOR_A_PERIOD);
                                        ScheduleMessageService.this.updateOffset(this.delayLevel,
                                            nextOffset);
                                        return;
                                    }
                                } catch (Exception e) {
                                    /*
                                     * XXX: warn and notify me



                                     */
                                    log.error(
                                        "ScheduleMessageService, messageTimeup execute error, drop it. msgExt="
                                            + msgExt + ", nextOffset=" + nextOffset + ",offsetPy="
                                            + offsetPy + ",sizePy=" + sizePy, e);
                                }
                            }
                        } else {
                            ScheduleMessageService.this.timer.schedule(
                                new DeliverDelayedMessageTimerTask(this.delayLevel, nextOffset),
                                countdown);
                            ScheduleMessageService.this.updateOffset(this.delayLevel, nextOffset);
                            return;
                        }
                    } // end of for

                    nextOffset = offset + (i / ConsumeQueue.CQ_STORE_UNIT_SIZE);
                    ScheduleMessageService.this.timer.schedule(new DeliverDelayedMessageTimerTask(
                        this.delayLevel, nextOffset), DELAY_FOR_A_WHILE);
                    ScheduleMessageService.this.updateOffset(this.delayLevel, nextOffset);
                    return;
                } finally {

                    bufferCQ.release();
                }
            } // end of if (bufferCQ != null)
            else {

                long cqMinOffset = cq.getMinOffsetInQueue();
                if (offset < cqMinOffset) {
                    failScheduleOffset = cqMinOffset;
                    log.error("schedule CQ offset invalid. offset=" + offset + ", cqMinOffset="
                        + cqMinOffset + ", queueId=" + cq.getQueueId());
                }
            }
        } // end of if (cq != null)

        ScheduleMessageService.this.timer.schedule(new DeliverDelayedMessageTimerTask(this.delayLevel,
            failScheduleOffset), DELAY_FOR_A_WHILE);
    }

    private MessageExtBrokerInner messageTimeup(MessageExt msgExt) {
        MessageExtBrokerInner msgInner = new MessageExtBrokerInner();
        msgInner.setBody(msgExt.getBody());
        msgInner.setFlag(msgExt.getFlag());
        MessageAccessor.setProperties(msgInner, msgExt.getProperties());

        TopicFilterType topicFilterType = MessageExt.parseTopicFilterType(msgInner.getSysFlag());
        long tagsCodeValue =
            MessageExtBrokerInner.tagsString2tagsCode(topicFilterType, msgInner.getTags());
        msgInner.setTagsCode(tagsCodeValue);
        msgInner.setPropertiesString(MessageDecoder.messageProperties2String(msgExt.getProperties()));

        msgInner.setSysFlag(msgExt.getSysFlag());
        msgInner.setBornTimestamp(msgExt.getBornTimestamp());
        msgInner.setBornHost(msgExt.getBornHost());
        msgInner.setStoreHost(msgExt.getStoreHost());
        msgInner.setReconsumeTimes(msgExt.getReconsumeTimes());

        msgInner.setWaitStoreMsgOK(false);
        MessageAccessor.clearProperty(msgInner, MessageConst.PROPERTY_DELAY_TIME_LEVEL);

        msgInner.setTopic(msgInner.getProperty(MessageConst.PROPERTY_REAL_TOPIC));

        String queueIdStr = msgInner.getProperty(MessageConst.PROPERTY_REAL_QUEUE_ID);
        int queueId = Integer.parseInt(queueIdStr);
        msgInner.setQueueId(queueId);

        return msgInner;
    }
}
```

- DeliverDelayedMessageTimerTask继承了TimerTask，其run方法执行executeOnTimeup，若出现异常则使用timer.schedule(new DeliverDelayedMessageTimerTask(this.delayLevel, this.offset), DELAY_FOR_A_PERIOD)重新调度
- executeOnTimeup方法首先通过defaultMessageStore.findConsumeQueue(SCHEDULE_TOPIC, delayLevel2QueueId(delayLevel))方法找到ConsumeQueue，然后取出SelectMappedBufferResult，进行遍历计算tagsCode，从而通过correctDeliverTimestamp方法计算deliverTimestamp
- 若deliverTimestamp小于等于当前时间则构造MessageExtBrokerInner然后执行writeMessageStore.putMessage(msgInner)；没有put成功则重新调度DeliverDelayedMessageTimerTask；如果deliverTimestamp大于当前时间也会重新调度DeliverDelayedMessageTimerTask

## RocketMQ 的延时消息最大延时级别只支持延时 2 小时，那么如何实现延迟 3 小时？

先借助于 redis 缓存消息ID，在延迟2个小时（级别=18），当消费端拉取到消息后，判断是否有缓存，如果存在缓存则再次发送一个（1h）的延时消息并删除缓存。

## 问题

**延时消息的延时时间并不精确**，这个时间是 Broker 调度线程把消息重新投递到原始的 MessageQueue 的时间，如果发生消息积压或者 RocketMQ 客户端发生流量管控，客户端拉取到消息后进行处理的时间可能会超出预设的延时时间。



