---
sidebarDepth: 3
---

# spring-kafka

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