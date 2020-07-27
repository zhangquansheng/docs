---
sidebarDepth: 3
---

# spring-kafka的使用和原理

::: tip 提示
本文基于 `spring-kafka 2.2.12` (`SpringBoot2.1.13`)， 非常详细的介绍请参考[官方文档](https://spring.io/projects/spring-kafka)
:::

[[toc]]

## 发送消息

### 使用 KafkaTemplate

KafkaTemplate 发送消息的相关方法如下：
```java
ListenableFuture<SendResult<K, V>> send(String topic, V data);
ListenableFuture<SendResult<K, V>> send(String topic, K key, V data);
ListenableFuture<SendResult<K, V>> send(String topic, Integer partition, K key, V data);
ListenableFuture<SendResult<K, V>> send(String topic, Integer partition, Long timestamp, K key, V data);
ListenableFuture<SendResult<K, V>> send(ProducerRecord<K, V> record);
ListenableFuture<SendResult<K, V>> send(Message<?> message);
ListenableFuture<SendResult<K, V>> sendDefault(V data);
ListenableFuture<SendResult<K, V>> sendDefault(K key, V data);
ListenableFuture<SendResult<K, V>> sendDefault(Integer partition, K key, V data);
ListenableFuture<SendResult<K, V>> sendDefault(Integer partition, Long timestamp, K key, V data);
```

发送消息示例如下：

- 非阻塞（异步）
```java
public void sendToKafka(final MyOutputData data) {
    String value = JSONUtil.toJsonStr(data);
    final ProducerRecord<String, String> record = new ProducerRecord<>(KafkaTopic.TOPIC_MY, value);
    ListenableFuture<SendResult<String, String>> future = kafkaTemplate.send(record);
    future.addCallback(new ListenableFutureCallback<SendResult<String, String>>() {
        @Override
        public void onSuccess(SendResult<String, String> result) {
            log.info("handleSuccess,result:[{}] ", result);
        }

        @Override
        public void onFailure(Throwable ex) {
            log.error("record: [{}] handleFailure", record, ex);
        }
    });
}
```

```shell script
2020-07-20 17:33:01,588 [kafka-producer-network-thread | producer-1] INFO   [com.zhengcheng.magic.kafka.KafkaProducerSend] KafkaProducerSend.java:34 - handleSuccess,result:[SendResult [producerRecord=ProducerRecord(topic=zc_magic_topic_my, partition=null, headers=RecordHeaders(headers = [], isReadOnly = true), key=null, value={"userId":0,"dataId":"932bc38e6d3e4bc995a5e28489f18d71","teamId":0}, timestamp=null), recordMetadata=zc_magic_topic_my-37@26]]
```

- 阻塞（同步）
```java
public void sendToKafka2(final MyOutputData data) {
    String value = JSONUtil.toJsonStr(data);
    final ProducerRecord<String, String> record = new ProducerRecord<>(KafkaTopic.TOPIC_MY, value);
    try {
        kafkaTemplate.send(record).get(10, TimeUnit.SECONDS);
        log.info("handleSuccess,data:[{}] ", data);
        //handleSuccess(data);
    } catch (ExecutionException | TimeoutException | InterruptedException e) {
        log.error("handleFailure,data:[{}]", data, e);
        // handleFailure(data, record, e.getCause());
    }
}
```

生产者的配置如下：
```properties
# 参考 org.springframework.boot.autoconfigure.kafka.KafkaProperties.java Producer的说明

#procedure要求leader在考虑完成请求之前收到的确认数，用于控制发送记录在服务端的持久化，其值可以为如下：
#acks = 0 如果设置为零，则生产者将不会等待来自服务器的任何确认，该记录将立即添加到套接字缓冲区并视为已发送。在这种情况下，无法保证服务器已收到记录，并且重试配置将不会生效（因为客户端通常不会知道任何故障），为每条记录返回的偏移量始终设置为-1。
#acks = 1 这意味着leader会将记录写入其本地日志，但无需等待所有副本服务器的完全确认即可做出回应，在这种情况下，如果leader在确认记录后立即失败，但在将数据复制到所有的副本服务器之前，则记录将会丢失。
#acks = all 这意味着leader将等待完整的同步副本集以确认记录，这保证了只要至少一个同步副本服务器仍然存活，记录就不会丢失，这是最强有力的保证，这相当于acks = -1的设置。
#可以设置的值为：all, -1, 0, 1
spring.kafka.producer.acks=1

#如果该值大于零时，表示启用重试失败的发送次数
spring.kafka.producer.retries=2
```

### ProducerInterceptor


## 接收消息过程分析

当使用`@KafkaListener`注解来接收消息时，spring-kafka为我们做了什么？下面通过阅读源码的方式来剖析整个过程。

流程图如下：

![feign-proxy](/img/kafka/kafka-listener.png)


### KafkaListenerAnnotationBeanPostProcessor

扫描`@KafkaListener`注解的方法创建Kafka消息监听容器 `org.springframework.kafka.config.KafkaListenerContainerFactory`

**重要源码如下：**
```java
// org.springframework.kafka.annotation.KafkaListenerAnnotationBeanPostProcessor.java

    @Override
	public Object postProcessAfterInitialization(final Object bean, final String beanName) throws BeansException {
		if (!this.nonAnnotatedClasses.contains(bean.getClass())) {
			Class<?> targetClass = AopUtils.getTargetClass(bean);
            
            // 查询所有 @KafkaListener 的注解，包括 @KafkaListeners 注解的 @KafkaListener 组合。@KafkaListeners是@KafkaListener的Container Annotation，这也是jdk8的新特性之一，注解可以重复标注。
			Collection<KafkaListener> classLevelListeners = findListenerAnnotations(targetClass);
			final boolean hasClassLevelListeners = classLevelListeners.size() > 0;
			final List<Method> multiMethods = new ArrayList<>();
            
            // 查询所有 @KafkaListener 的注解对应的实现方法，不同的@KafkaListener可以使用到同一个方法
			Map<Method, Set<KafkaListener>> annotatedMethods = MethodIntrospector.selectMethods(targetClass,
					(MethodIntrospector.MetadataLookup<Set<KafkaListener>>) method -> {
						Set<KafkaListener> listenerMethods = findListenerAnnotations(method);
						return (!listenerMethods.isEmpty() ? listenerMethods : null);
					});
             
			// 处理在类上注解@KafkaListener，对应的方法需要@KafkaHandler注解
			if (hasClassLevelListeners) {
				Set<Method> methodsWithHandler = MethodIntrospector.selectMethods(targetClass,
						(ReflectionUtils.MethodFilter) method ->
								AnnotationUtils.findAnnotation(method, KafkaHandler.class) != null);
				multiMethods.addAll(methodsWithHandler);
			}

			if (annotatedMethods.isEmpty()) {
				this.nonAnnotatedClasses.add(bean.getClass());
				if (this.logger.isTraceEnabled()) {
					this.logger.trace("No @KafkaListener annotations found on bean type: " + bean.getClass());
				}
			}
			else {
				// Non-empty set of methods
				for (Map.Entry<Method, Set<KafkaListener>> entry : annotatedMethods.entrySet()) {
					Method method = entry.getKey();
					for (KafkaListener listener : entry.getValue()) {
                        // 把@KafkaListener注解中的属性 封装成 MethodKafkaListenerEndpoint，然后调用 processListener 方法
						processKafkaListener(listener, method, bean, beanName);
					}
				}
				if (this.logger.isDebugEnabled()) {
					this.logger.debug(annotatedMethods.size() + " @KafkaListener methods processed on bean '"
							+ beanName + "': " + annotatedMethods);
				}
			}
			
			if (hasClassLevelListeners) {
                 // 把@KafkaHandler注解中的属性 封装成 MethodKafkaListenerEndpoint，然后调用 processListener 方法
				processMultiMethodListeners(classLevelListeners, multiMethods, bean, beanName);
			}
		}
		return bean;
	}
```

调用`processListener`方法，创建底层Kafka消息监听容器 `org.springframework.kafka.config.KafkaListenerContainerFactory`
```java
// org.springframework.kafka.annotation.KafkaListenerAnnotationBeanPostProcessor.java

protected void processListener(MethodKafkaListenerEndpoint<?, ?> endpoint, KafkaListener kafkaListener,
			Object bean, Object adminTarget, String beanName) {
        // ...
		
        this.registrar.registerEndpoint(endpoint, factory);
        
        // ...
}
```

项目开启DEBUG日志后，打印日志如下：
```shell script
2020-07-22 13:33:50,592 [main] DEBUG  [o.s.k.a.KafkaListenerAnnotationBeanPostProcessor] KafkaListenerAnnotationBeanPostProcessor.java:305 - 1 @KafkaListener methods processed on bean 'kafkaConsumerListener': {public void com.zhengcheng.magic.kafka.KafkaConsumerListener.listen(org.apache.kafka.clients.consumer.ConsumerRecord,org.springframework.kafka.support.Acknowledgment)=[@org.springframework.kafka.annotation.KafkaListener(topicPattern=, containerFactory=, beanRef=__listener, topics=[zc_magic_topic_my], groupId=, topicPartitions=[], clientIdPrefix=, concurrency=, autoStartup=, idIsGroup=true, containerGroup=, errorHandler=, id=magicCRAck, properties=[])]}
```

### KafkaListenerEndpointRegistry

通过 `KafkaListenerEndpointRegistrar` 的帮助完成注册 `KafkaListenerEndpointRegistry`，**重要源码如下：**
```java
// org.springframework.kafka.config.KafkaListenerEndpointRegistrar.java

protected void registerAllEndpoints() {
    synchronized (this.endpointDescriptors) {
        for (KafkaListenerEndpointDescriptor descriptor : this.endpointDescriptors) {
            this.endpointRegistry.registerListenerContainer(
                    descriptor.endpoint, resolveContainerFactory(descriptor));
        }
        this.startImmediately = true;  // trigger immediate startup
    }
}


public void registerEndpoint(KafkaListenerEndpoint endpoint, KafkaListenerContainerFactory<?> factory) {
		Assert.notNull(endpoint, "Endpoint must be set");
		Assert.hasText(endpoint.getId(), "Endpoint id must be set");
		// Factory may be null, we defer the resolution right before actually creating the container
		KafkaListenerEndpointDescriptor descriptor = new KafkaListenerEndpointDescriptor(endpoint, factory);
		synchronized (this.endpointDescriptors) {
			if (this.startImmediately) { // Register and start immediately
				this.endpointRegistry.registerListenerContainer(descriptor.endpoint,
						resolveContainerFactory(descriptor), true);
			}
			else {
			    
				this.endpointDescriptors.add(descriptor);
			}
		}
	}
```

`KafkaListenerEndpointRegistry` 调用`registerListenerContainer`方法，根据`KafkaListenerEndpoint`对象创建`ConcurrentMessageListenerContainer`
```java
// org.springframework.kafka.config.KafkaListenerEndpointRegistry.java

public void registerListenerContainer(KafkaListenerEndpoint endpoint, KafkaListenerContainerFactory<?> factory,
			boolean startImmediately) {
		Assert.notNull(endpoint, "Endpoint must not be null");
		Assert.notNull(factory, "Factory must not be null");

		String id = endpoint.getId();
		Assert.hasText(id, "Endpoint id must not be empty");
		synchronized (this.listenerContainers) {
			Assert.state(!this.listenerContainers.containsKey(id),
					"Another endpoint is already registered with id '" + id + "'");

            // 根据KafkaListenerEndpoint创建ConcurrentMessageListenerContainer然后根据ID添加到底层监听容器中
			MessageListenerContainer container = createListenerContainer(endpoint, factory);
			this.listenerContainers.put(id, container);

			if (StringUtils.hasText(endpoint.getGroup()) && this.applicationContext != null) {
				List<MessageListenerContainer> containerGroup;
				if (this.applicationContext.containsBean(endpoint.getGroup())) {
					containerGroup = this.applicationContext.getBean(endpoint.getGroup(), List.class);
				}
				else {
					containerGroup = new ArrayList<MessageListenerContainer>();
					this.applicationContext.getBeanFactory().registerSingleton(endpoint.getGroup(), containerGroup);
				}
				containerGroup.add(container);
			}
			if (startImmediately) {
				startIfNecessary(container);
			}
		}
	}
```

默认的情况下，使用`ConcurrentKafkaListenerContainerFactory`,创建`ConcurrentMessageListenerContainer`的源码如下：
````java
    // org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory.java

	@Override
	protected ConcurrentMessageListenerContainer<K, V> createContainerInstance(KafkaListenerEndpoint endpoint) {
		Collection<TopicPartitionInitialOffset> topicPartitions = endpoint.getTopicPartitions();
		if (!topicPartitions.isEmpty()) {
			ContainerProperties properties = new ContainerProperties(
					topicPartitions.toArray(new TopicPartitionInitialOffset[topicPartitions.size()]));
			return new ConcurrentMessageListenerContainer<K, V>(getConsumerFactory(), properties);
		}
		else {
			Collection<String> topics = endpoint.getTopics();
			if (!topics.isEmpty()) {
				ContainerProperties properties = new ContainerProperties(topics.toArray(new String[topics.size()]));
				return new ConcurrentMessageListenerContainer<K, V>(getConsumerFactory(), properties);
			}
			else {
				ContainerProperties properties = new ContainerProperties(endpoint.getTopicPattern());
				return new ConcurrentMessageListenerContainer<K, V>(getConsumerFactory(), properties);
			}
		}
	}
````

### ConcurrentMessageListenerContainer

间接实现了`ApplicationEventPublisherAware`接口，用于发布事件

调用`doStart`方法，根据配置的`concurrency`数量和主题中的分区数创建`KafkaMessageListenerContainer`
```java
// org.springframework.kafka.listener.ConcurrentMessageListenerContainer.java

    /*
	 * Under lifecycle lock.
	 */
	@Override
	protected void doStart() {
		if (!isRunning()) {
			checkTopics();
			ContainerProperties containerProperties = getContainerProperties();
			TopicPartitionInitialOffset[] topicPartitions = containerProperties.getTopicPartitions();
			// 当topicPartitions的长度（主题中的分区数）不为空且当设置的concurrency数量大于分区数时，把concurrency调整为分区数（低级消费）
			if (topicPartitions != null && this.concurrency > topicPartitions.length) {
				this.logger.warn("When specific partitions are provided, the concurrency must be less than or "
						+ "equal to the number of partitions; reduced from " + this.concurrency + " to "
						+ topicPartitions.length);
				this.concurrency = topicPartitions.length;
			}
			
            //设置标志位
			setRunning(true);
    
            //循环创建KafkaMessageListenerContainer，一个KafkaMessageListenerContainer启动一个线程
			for (int i = 0; i < this.concurrency; i++) {
				KafkaMessageListenerContainer<K, V> container;
			    // 高级消费(推荐的)
				if (topicPartitions == null) {
					container = new KafkaMessageListenerContainer<>(this, this.consumerFactory, containerProperties);
				}
				// 低级消费，通过partitionSubset方法分配
				else {
					container = new KafkaMessageListenerContainer<>(this, this.consumerFactory,
							containerProperties, partitionSubset(containerProperties, i));
				}
				String beanName = getBeanName();
				container.setBeanName((beanName != null ? beanName : "consumer") + "-" + i);
				if (getApplicationEventPublisher() != null) {
					container.setApplicationEventPublisher(getApplicationEventPublisher());
				}
				container.setClientIdSuffix("-" + i);
				container.setGenericErrorHandler(getGenericErrorHandler());
				container.setAfterRollbackProcessor(getAfterRollbackProcessor());
				container.setRecordInterceptor(getRecordInterceptor());
				container.setEmergencyStop(() -> {
					stop(() -> {
						// NOSONAR
					});
					publishContainerStoppedEvent();
				});
				if (isPaused()) {
					container.pause();
				}

                //调用KafkaMessageListenerContainer的start方法
				container.start();
				this.containers.add(container);
			}
		}
	}
```

### KafkaMessageListenerContainer

调用`AbstractMessageListenerContainer`的`start`方法,该方法调用`KafkaMessageListenerContainer`的`doStart()`方法；`doStart()`初始化`container`，创建`ListenerConsumer`；`ListenerConsumer`间接实现了`Runnable`接口。
```java
// org.springframework.kafka.listener.KafkaMessageListenerContainer.java

	@Override
	protected void doStart() {
		if (isRunning()) {
			return;
		}
		if (this.clientIdSuffix == null) { // stand-alone container
			checkTopics();
		}
		ContainerProperties containerProperties = getContainerProperties();
		checkAckMode(containerProperties);

		Object messageListener = containerProperties.getMessageListener();
		Assert.state(messageListener != null, "A MessageListener is required");
		if (containerProperties.getConsumerTaskExecutor() == null) {
			SimpleAsyncTaskExecutor consumerExecutor = new SimpleAsyncTaskExecutor(
					(getBeanName() == null ? "" : getBeanName()) + "-C-");
			containerProperties.setConsumerTaskExecutor(consumerExecutor);
		}
		Assert.state(messageListener instanceof GenericMessageListener, "Listener must be a GenericListener");
		GenericMessageListener<?> listener = (GenericMessageListener<?>) messageListener;
		ListenerType listenerType = deteremineListenerType(listener);
		
		//创建ListenerConsumer
		this.listenerConsumer = new ListenerConsumer(listener, listenerType);
		setRunning(true);
         
		//开启ListenerConsumer线程
		this.listenerConsumerFuture = containerProperties
				.getConsumerTaskExecutor()
				.submitListenable(this.listenerConsumer);
	}
```

### ListenerConsumer

`run()`方法去循环调用`consumer.poll`拉取消息，封装成`ConsumerRecords`对象。
```java
// org.springframework.kafka.listener.KafkaMessageListenerContainer.ListenerConsumer

        @Override
		public void run() {
			this.consumerThread = Thread.currentThread();
			if (this.genericListener instanceof ConsumerSeekAware) {
				((ConsumerSeekAware) this.genericListener).registerSeekCallback(this);
			}
			if (this.transactionManager != null) {
				ProducerFactoryUtils.setConsumerGroupId(this.consumerGroupId);
			}
			this.count = 0;
			this.last = System.currentTimeMillis();
			initAsignedPartitions();
			while (isRunning()) {
				try {
                    //拉取消息并唤醒消费监听
					pollAndInvoke();
				}
				catch (@SuppressWarnings(UNUSED) WakeupException e) {
					// Ignore, we're stopping or applying immediate foreign acks
				}
				catch (NoOffsetForPartitionException nofpe) {
					this.fatalError = true;
					ListenerConsumer.this.logger.error("No offset and no reset policy", nofpe);
					break;
				}
				catch (AuthorizationException ae) {
					this.fatalError = true;
					ListenerConsumer.this.logger.error("Authorization Exception", ae);
					break;
				}
				catch (Exception e) {
					handleConsumerException(e);
				}
				catch (Error e) { // NOSONAR - rethrown
					Runnable runnable = KafkaMessageListenerContainer.this.emergencyStop;
					if (runnable != null) {
						runnable.run();
					}
					this.logger.error("Stopping container due to an Error", e);
					 // 异常情况下，关闭监听者容器
					wrapUp();
					throw e;
				}
			}
            // 关闭监听者容器
			wrapUp();
		}
```

````java
// org.springframework.kafka.listener.KafkaMessageListenerContainer.ListenerConsumer

protected void pollAndInvoke() {
            // 是否自动提交
			if (!this.autoCommit && !this.isRecordAck) {
                // 处理非自动提交的相关配置
				processCommits();
			}
			processSeeks();
			checkPaused();
			this.polling.set(true);

            // pollTimeout默认为5秒，可以通过spring.kafka.listener.poll-timeout配置修改;
			ConsumerRecords<K, V> records = this.consumer.poll(this.pollTimeout);
            
            // 如果存在冲突，那么丢弃轮询的记录，容器会停止（乐观锁）
			if (!this.polling.compareAndSet(true, false)) {
				/*
				 * There is a small race condition where wakeIfNecessary was called between
				 * exiting the poll and before we reset the boolean.
				 */
				if (records.count() > 0 && this.logger.isDebugEnabled()) {
					this.logger.debug("Discarding polled records, container stopped: " + records.count());
				}
				return;
			}
			this.lastPoll = System.currentTimeMillis();
			checkResumed();
            
            // 打印日志
			debugRecords(records);
			if (records != null && records.count() > 0) {
				if (this.containerProperties.getIdleEventInterval() != null) {
					this.lastReceive = System.currentTimeMillis();
				}
                //读取到的数据交给invokeListener方法处理，invokeListener反射调用@KafkaListener注解的方法
				invokeListener(records);
			}
			else {
                // spring.kafka.listener.idle-event-interval= ＃发布空闲消费者事件（未收到数据）之间的时间。
				checkIdle();
			}
		}
````

```shell script
2020-07-22 21:11:49,779 [magicCRAck-0-C-1] DEBUG  [o.s.k.l.KafkaMessageListenerContainer$ListenerConsumer] KafkaMessageListenerContainer.java:787 - Received: 0 records
2020-07-22 21:11:54,781 [magicCRAck-0-C-1] DEBUG  [o.s.k.l.KafkaMessageListenerContainer$ListenerConsumer] KafkaMessageListenerContainer.java:787 - Received: 0 records
2020-07-22 21:11:59,782 [magicCRAck-0-C-1] DEBUG  [o.s.k.l.KafkaMessageListenerContainer$ListenerConsumer] KafkaMessageListenerContainer.java:787 - Received: 0 records
```

## Commit Offset

消息提交的配置如下：
```properties
# 默认自动提交，设为false，需要设置ack-mode
spring.kafka.consumer.enable-auto-commit=false
# 手动调用Acknowledgment.acknowledge()后立即提交
spring.kafka.listener.ack-mode=manual_immediate
```

```java
// org.springframework.kafka.listener.AckMode

   /**
	 * The offset commit behavior enumeration.
	 */
	public enum AckMode {

		/**
		 * Commit after each record is processed by the listener. 处理完一条记录后提交
		 */
		RECORD,

		/**
		 * Commit whatever has already been processed before the next poll. 处理完poll的一批数据后提交（默认设置）
		 */
		BATCH,

		/**
		 * Commit pending updates after
		 * {@link ContainerProperties#setAckTime(long) ackTime} has elapsed.  处理完poll的一批数据后并且距离上次提交超过了设置的ackTime
		 */
		TIME,

		/**
		 * Commit pending updates after
		 * {@link ContainerProperties#setAckCount(int) ackCount} has been
		 * exceeded.   处理完poll的一批数据后并且距离上次提交处理的记录数超过了设置的ackCount
		 */
		COUNT,

		/**
		 * Commit pending updates after
		 * {@link ContainerProperties#setAckCount(int) ackCount} has been
		 * exceeded or after {@link ContainerProperties#setAckTime(long)
		 * ackTime} has elapsed.  TIME和COUNT中任意一条满足即提交.
		 */
		COUNT_TIME,

		/**
		 * User takes responsibility for acks using an
		 * {@link AcknowledgingMessageListener}.  手动调用Acknowledgment.acknowledge()后，并且处理完poll的这批数据后提交
		 */
		MANUAL,

		/**
		 * User takes responsibility for acks using an
		 * {@link AcknowledgingMessageListener}. The consumer
		 * immediately processes the commit.  手动调用Acknowledgment.acknowledge()后立即提交
		 */
		MANUAL_IMMEDIATE,

	}
```

::: tip 如何选择
**为了保证消息消费不丢失**，我们会使用非自动提交，并设置`spring.kafka.listener.ack-mode=manual_immediate`的方式。
:::

## 接收消息

使用`@KafkaListener`注解来接收消息,以下示例显示了如何使用它：
```java
   /**
     * @param record ConsumerRecord类里面包含分区信息、消息头、消息体等内容
     * @param ack    Ack机制
     */
    @KafkaListener(id = "magicCRAck", topics = KafkaTopic.TOPIC_MY)
    public void listen(ConsumerRecord<String, String> record,
                       Acknowledgment ack) {

        log.info("ConsumerRecord: [{}]", record);

        // spring.kafka.listener.ack-mode=manual_immediate
        ack.acknowledge();
    }
```
要求配置`@EnableKafka`注解，以及一个用于配置底层的侦听器容器工厂`ConcurrentMessageListenerContainer`。默认情况下，会使用名称为`kafkaListenerContainerFactory`的bean。

### 批处理

可以配置`@KafkaListener`底层的侦听器容器工厂`ConcurrentMessageListenerContainer`来设置batchListener属性。以下示例显示了如何执行此操作：
````java
@Configuration
public class KafkaConfig {

    @Primary
    @Bean
    @ConfigurationProperties("spring.kafka")
    public KafkaProperties kafkaProperties() {
        return new KafkaProperties();
    }

    @Bean
    public KafkaListenerContainerFactory batchFactory(@Autowired @Qualifier("consumerFactory") ConsumerFactory consumerFactory) {
        ConcurrentKafkaListenerContainerFactory factory = new ConcurrentKafkaListenerContainerFactory();
        factory.setConsumerFactory(consumerFactory);
        factory.setConcurrency(1);
        factory.setBatchListener(true); // <<<<<<<<<<<<<<<<<<<<<<<<<
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL_IMMEDIATE);
        return factory;
    }

    @Primary
    @Bean
    public ConsumerFactory consumerFactory(@Autowired @Qualifier("kafkaProperties") KafkaProperties kafkaProperties) {
        return new DefaultKafkaConsumerFactory(kafkaProperties.buildConsumerProperties());
    }

}
````

以下示例显示了如何批量接收消息列表：
```java
    /**
     * @param records ConsumerRecord类里面包含分区信息、消息头、消息体等内容
     * @param ack     Ack机制
     */
    @KafkaListener(id = "magicCRAck", topics = KafkaTopic.TOPIC_MY, containerFactory = "batchFactory")
    public void listen(List<ConsumerRecord<String, String>> records,
                       Acknowledgment ack) {

        log.info("ConsumerRecord: [{}]", records);

        // spring.kafka.listener.ack-mode=manual_immediate
        ack.acknowledge();
    }
```
当接收ConsumerRecord<?, ?>对象列表，要求它必须是方法上定义的唯一参数（除了使用可选的Acknowledgment，当使用手动提交和Consumer<?, ?>参数时，该参数除外）。

```shell script
2020-07-23 16:59:16,419 [magicCRAck-0-C-1] INFO   [com.zhengcheng.magic.kafka.KafkaConsumerListener] KafkaConsumerListener.java:30 - ConsumerRecord: [[ConsumerRecord(topic = zc_magic_topic_my, partition = 35, offset = 26, CreateTime = 1595494756203, serialized key size = -1, serialized value size = 67, headers = RecordHeaders(headers = [], isReadOnly = false), key = null, value = {"userId":0,"dataId":"0f831ebb4d394610bfd24b8b00785003","teamId":0})]]
2020-07-23 16:59:16,441 [magicCRAck-0-C-1] INFO   [com.zhengcheng.magic.kafka.KafkaConsumerListener] KafkaConsumerListener.java:30 - ConsumerRecord: [[ConsumerRecord(topic = zc_magic_topic_my, partition = 17, offset = 26, CreateTime = 1595494756372, serialized key size = -1, serialized value size = 67, headers = RecordHeaders(headers = [], isReadOnly = false), key = null, value = {"userId":1,"dataId":"1f32096da75d45eb844eaeb1ad3dfc3c","teamId":1}), ConsumerRecord(topic = zc_magic_topic_my, partition = 8, offset = 26, CreateTime = 1595494756374, serialized key size = -1, serialized value size = 67, headers = RecordHeaders(headers = [], isReadOnly = false), key = null, value = {"userId":1,"dataId":"be7e6a37b2524cca82f198f6a3dcdb30","teamId":1})]]
```

