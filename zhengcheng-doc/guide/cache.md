# Redis 缓存

## 安装

在 Maven 工程中使用

```xml
  <dependency>
        <groupId>com.zhengcheng</groupId>
        <artifactId>zc-cache-spring-boot-starter</artifactId>
  </dependency>
```

**Lettuce**
> 高级`Redis`客户端，用于线程安全同步，异步和响应使用，支持集群，Sentinel，管道和编码器

`SpringBoot2.x`默认采用`Lettuce`客户端来连接`Redis`服务端的。

## 属性配置

```properties
spring.redis.database = 0
spring.redis.host = 127.0.0.1
spring.redis.port = 6379
spring.redis.password = 123456
spring.redis.timeout = 20000
spring.redis.lettuce.pool.max-active = 8
spring.redis.lettuce.pool.max-idle = 8
spring.redis.lettuce.pool.min-idle = 0
```

## 使用

### mGet 批量获取值

```java
List<String> keys = new ArrayList<>();
//初始keys
List<YourObject> list = this.redisTemplate.opsForValue().multiGet(keys);
```
注意：如果对应的key没有值，则`YourObject`为`NULL`；也就是说，`list`不可能是`NULL`，但是`YourObject`可能为`NULL`。

### PipeLine
```java
List<YourObject> list = this.redisTemplate.executePipelined(new RedisCallback<YourObject>() {
    @Override
    public YourObject doInRedis(RedisConnection connection) throws DataAccessException {
        StringRedisConnection conn = (StringRedisConnection)connection;
        for (String key : keys) {
            conn.get(key);
        }
        return null;
    }
```

它们底层都是用到`execute`方法，`multiGet`是一条命令直接传给`Redis`，而`executePipelined`实际上是一条或多条命令，但是**共用一个连接**。

### execute 方法
```java
/**
	 * Executes the given action object within a connection that can be exposed or not. Additionally, the connection can
	 * be pipelined. Note the results of the pipeline are discarded (making it suitable for write-only scenarios).
	 * 
	 * @param <T> return type
	 * @param action callback object to execute
	 * @param exposeConnection whether to enforce exposure of the native Redis Connection to callback code
	 * @param pipeline whether to pipeline or not the connection for the execution
	 * @return object returned by the action
	 */
	public <T> T execute(RedisCallback<T> action, boolean exposeConnection, boolean pipeline) {
		Assert.isTrue(initialized, "template not initialized; call afterPropertiesSet() before using it");
		Assert.notNull(action, "Callback object must not be null");

		RedisConnectionFactory factory = getConnectionFactory();
		RedisConnection conn = null;
		try {

			if (enableTransactionSupport) {
				// only bind resources in case of potential transaction synchronization
				conn = RedisConnectionUtils.bindConnection(factory, enableTransactionSupport);
			} else {
				conn = RedisConnectionUtils.getConnection(factory);
			}

			boolean existingConnection = TransactionSynchronizationManager.hasResource(factory);

			RedisConnection connToUse = preProcessConnection(conn, existingConnection);

			boolean pipelineStatus = connToUse.isPipelined();
			if (pipeline && !pipelineStatus) {
				connToUse.openPipeline();
			}

			RedisConnection connToExpose = (exposeConnection ? connToUse : createRedisConnectionProxy(connToUse));
			T result = action.doInRedis(connToExpose);

			// close pipeline
			if (pipeline && !pipelineStatus) {
				connToUse.closePipeline();
			}

			// TODO: any other connection processing?
			return postProcessResult(result, connToUse, existingConnection);
		} finally {
			RedisConnectionUtils.releaseConnection(conn, factory);
		}
	}
```

## CacheManager

`zhengcheng` 中`@EnableCaching`默认是使用 `CacheType.SIMPLE`。

如果要开启`caffeine` ，需要增加属性配置，具体如下：
```properties
spring.cache.type = caffeine
spring.cache.caffeine.spec = initialCapacity=10,maximumSize=200,expireAfterWrite=3s
```

## redisson

- 1. Add `redisson-spring-boot-starter` dependency into your project:
```xml
<dependency>
    <groupId>org.redisson</groupId>
    <artifactId>redisson-spring-boot-starter</artifactId>
</dependency>
```

Downgrade `redisson-spring-data module` if necessary to support required Spring Boot version:

|redisson-spring-data<br/>module name|Spring Boot<br/>version|
|----------------------------|-------------------|
|redisson-spring-data-16     |1.3.x              |
|redisson-spring-data-17     |1.4.x              |
|redisson-spring-data-18     |1.5.x              |
|redisson-spring-data-20     |2.0.x              |
|redisson-spring-data-21     |2.1.x              |
|redisson-spring-data-22     |2.2.x              |
|redisson-spring-data-23     |2.3.x              |

目前`Spring Boot version 2.1.x`对应的`redisson-spring-boot-starter`最高版本是`3.11.5`

- Add settings into application.settings file

Common spring boot settings or Redisson settings could be used.
```yaml
# common spring boot settings

spring:
  redis:
    database: 
    host:
    port:
    password:
    ssl: 
    timeout:
    cluster:
      nodes:
    sentinel:
      master:
      nodes:

  # Redisson settings
    
  #path to config - redisson.yaml
  redisson: 
    file: classpath:redisson.yaml
    config: |
      clusterServersConfig:
        idleConnectionTimeout: 10000
        connectTimeout: 10000
        timeout: 3000
        retryAttempts: 3
        retryInterval: 1500
        failedSlaveReconnectionInterval: 3000
        failedSlaveCheckInterval: 60000
        password: null
        subscriptionsPerConnection: 5
        clientName: null
        loadBalancer: !<org.redisson.connection.balancer.RoundRobinLoadBalancer> {}
        subscriptionConnectionMinimumIdleSize: 1
        subscriptionConnectionPoolSize: 50
        slaveConnectionMinimumIdleSize: 24
        slaveConnectionPoolSize: 64
        masterConnectionMinimumIdleSize: 24
        masterConnectionPoolSize: 64
        readMode: "SLAVE"
        subscriptionMode: "SLAVE"
        nodeAddresses:
        - "redis://127.0.0.1:7004"
        - "redis://127.0.0.1:7001"
        - "redis://127.0.0.1:7000"
        scanInterval: 1000
        pingConnectionInterval: 0
        keepAlive: false
        tcpNoDelay: false
      threads: 16
      nettyThreads: 32
      codec: !<org.redisson.codec.FstCodec> {}
      transportMode: "NIO"
```

- Use Redisson through spring bean with RedissonClient interface or RedisTemplate/ReactiveRedisTemplate objects

###  Reentrant Lock （可重入锁）

```java
    String lockName = StrUtil.format("zmbiz-brain-record-b-update-question-{}", question.getId());
    // 可重入锁（Reentrant Lock）
    RLock lock = redissonClient.getLock(lockName);
    try {
          // 获取锁
          if (lock.tryLock(5, 3, TimeUnit.SECONDS)) {
              
                // TODO Something
          }
      } catch (Exception e) {
          // 释放锁
          if (lock.isLocked() && lock.isHeldByCurrentThread()) {
              lock.unlock();
          }
      }
```

---

**参考文档**

- [redisson Quick start](https://github.com/redisson/redisson#quick-start)
- [redisson Documentation](https://github.com/redisson/redisson/wiki/Table-of-Content)
- [redisson Code examples](https://github.com/redisson/redisson-examples)
- [redisson](https://github.com/redisson/redisson/)
- [redisson-spring-boot-starter](https://github.com/redisson/redisson/tree/master/redisson-spring-boot-starter)
- [RedisTemplate 官方文档](https://docs.spring.io/spring-data/data-redis/docs/current/reference/html/#redis:template)
- [Caching 官方文档](https://docs.spring.io/spring-boot/docs/current/reference/html/spring-boot-features.html#boot-features-caching)
