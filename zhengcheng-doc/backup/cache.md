# 缓存

## 简介

SpringBoot整合**Redis**、Redisson分布式锁、Caffeine、 CacheManager、开发规范、最佳实践

## **安装**

在 Maven 工程中使用

```xml
  <dependency>
        <groupId>com.zhengcheng</groupId>
        <artifactId>zc-cache-boot-starter</artifactId>
  </dependency>
```

## Lettuce

SpringBoot2.x 默认采用Lettuce客户端来连接Redis服务端的

Lettuce：高级Redis客户端，用于线程安全同步，异步和响应使用，支持集群，Sentinel，管道和编码器

- 属性配置
```yaml
spring:
  redis:
    host: 127.0.0.1
    port: 6379
    # 密码 没有则可以不填
    password: 123456
    # 如果使用的jedis 则将lettuce改成jedis即可
    lettuce:
      pool:
        # 最大活跃链接数 默认8
        max-active: 8
        # 最大空闲连接数 默认8
        max-idle: 8
        # 最小空闲连接数 默认0
        min-idle: 0
```

::: tip 如何使用Redis
   详细见[RedisTemplate](https://docs.spring.io/spring-data/data-redis/docs/current/reference/html/#redis:template)
::: 
## Redisson

实现了分布式和可扩展的Java数据结构。redisson官方发布了[redisson-spring-boot-starter](https://github.com/redisson/redisson/tree/master/redisson-spring-boot-starter#spring-boot-starter)

`zhengcheng` 内置了单机模式、哨兵模式,配置如下：

- 单机模式

```properties
# redisson lock
redisson.address=redis://127.0.0.1:6379
redisson.password=123456
# 默认0
redisson.database=0 
# 默认3000
redisson.timeout=3000
```

- 哨兵模式

```properties
redisson.master-name=mymaster
redisson.password=123456
redisson.sentinel-addresses=127.0.0.1:26379,127.0.0.1:26380,127.0.0.1:26381
# 默认0
redisson.database=0 
# 默认3000
redisson.timeout=3000
```

### 布隆过滤器（Bloom Filter)

#### 6.8. 布隆过滤器（Bloom Filter）
Redisson利用Redis实现了Java分布式布隆过滤器（Bloom Filter）。所含最大比特数量为2^32。


```java
RBloomFilter<SomeObject> bloomFilter = redisson.getBloomFilter("sample");
// 初始化布隆过滤器，预计统计元素数量为55000000，期望误差率为0.03
bloomFilter.tryInit(55000000L, 0.03);
bloomFilter.add(new SomeObject("field1Value", "field2Value"));
bloomFilter.add(new SomeObject("field5Value", "field8Value"));
bloomFilter.contains(new SomeObject("field1Value", "field8Value"));
```

##### 6.8.1. 布隆过滤器数据分片（Sharding）
基于Redis的Redisson集群分布式布隆过滤器通过RClusteredBloomFilter接口，为集群状态下的Redis环境提供了布隆过滤器数据分片的功能。 通过优化后更加有效的算法，通过压缩未使用的比特位来释放集群内存空间。每个对象的状态都将被分布在整个集群中。所含最大比特数量为2^64。在这里可以获取更多的内部信息。


```java
RClusteredBloomFilter<SomeObject> bloomFilter = redisson.getClusteredBloomFilter("sample");
// 采用以下参数创建布隆过滤器
// expectedInsertions = 255000000
// falseProbability = 0.03
bloomFilter.tryInit(255000000L, 0.03);
bloomFilter.add(new SomeObject("field1Value", "field2Value"));
bloomFilter.add(new SomeObject("field5Value", "field8Value"));
bloomFilter.contains(new SomeObject("field1Value", "field8Value"));
```

该功能仅限于`Redisson PRO`版本。


参考[redisson官方文档](https://github.com/redisson/redisson/wiki/6.-%E5%88%86%E5%B8%83%E5%BC%8F%E5%AF%B9%E8%B1%A1#68-%E5%B8%83%E9%9A%86%E8%BF%87%E6%BB%A4%E5%99%A8bloom-filter)

## Redisson 分布式锁

`zhengcheng` 定义了DistributedLock接口用于分布式锁，除了这里的Redisson RLock 实现外，还有[ZK的分布式锁实现](zookeeper.md#分布式锁)。

- 属性配置
```properties
redisson.lock.enable = true
```

- Recipes

```java
    @Autowired
    private DistributedLock lock;


    if ( lock.acquire(maxWait, waitUnit) ) 
    {
        try 
        {
            // do some work inside of the critical section here
        }
        finally
        {
            lock.release();
        }
    }
```

## CacheManager

::: tip caching

`zhengcheng` 中 @EnableCaching 默认是使用 CacheType.SIMPLE
 
 具体如何使用，请查看[Caching 官方文档](https://docs.spring.io/spring-boot/docs/current/reference/html/spring-boot-features.html#boot-features-caching)
::: 

- 属性配置
```properties
spring.cache.type=caffeine
spring.cache.caffeine.spec=initialCapacity=10,maximumSize=200,expireAfterWrite=3s
```

## J2Cache

::: tip [开源中国 J2Cache二级缓存框架](https://gitee.com/ld/J2Cache)

Java 两级缓存框架，可以让应用支持两级缓存框架 ehcache(Caffeine) + redis 。避免完全使用独立缓存系统所带来的网络IO开销问题
https://gitee.com/ld/J2Cache
::: 

- 在 Maven 工程中使用
```xml
   <dependency>
        <groupId>net.oschina.j2cache</groupId>
        <artifactId>j2cache-core</artifactId>
        <exclusions>
            <exclusion>
                <artifactId>slf4j-api</artifactId>
                <groupId>org.slf4j</groupId>
            </exclusion>
            <exclusion>
                <artifactId>slf4j-simple</artifactId>
                <groupId>org.slf4j</groupId>
            </exclusion>
        </exclusions>
    </dependency>
    <dependency>
        <groupId>net.oschina.j2cache</groupId>
        <artifactId>j2cache-spring-boot2-starter</artifactId>
    </dependency>
```

- 属性配置

```properties
# 参考 https://blog.csdn.net/chengtouque9610/article/details/100992097
j2cache.L1.provider_class = caffeine
j2cache.L2.provider_class = lettuce
# 可以设置spring cache是否缓存null值，默认是true
j2cache.allow-null-values=true
# 缓存清除模式:active:
# 主动清除，二级缓存过期主动通知各节点清除，优点在于所有节点可以同时收到缓存清除
# passive:被动清除，一级缓存过期进行通知各节点清除一二级缓存
# blend:两种模式一起运作，对于各个节点缓存准确性以及及时性要求高的可以使用（推荐使用前面两种模式中一种）
j2cache.cache-clean-mode=passive
# 可以使用springRedis进行广播通知缓失效
j2cache.broadcast = net.oschina.j2cache.cache.support.redis.SpringRedisPubSubPolicy
# 在j2cache.properties中配置,使用springRedis替换二级缓存
# 支持关闭二级缓存,默认开启
j2cache.l2-cache-open = true
# redis客户端
# jedis
# lettuce
j2cache.redis-client=lettuce
# Redis 连接信息
lettuce.namespace =
lettuce.storage = hash
lettuce.channel = j2cache
#其中 lettuce.scheme 包含如下几种模式：
#redis : 连接单个 Redis 服务
#rediss : 使用 SSH 连接单个 Redis 服务
#redis-sentinel : 连接到 Redis Sentinel 集群（结合 sentinelMasterId 进行使用）
#redis-cluster : 连接到 Redis Cluster
lettuce.scheme = redis
lettuce.hosts = 127.0.0.1:6379
lettuce.password = 123456
lettuce.database = 0
lettuce.sentinelMasterId =
lettuce.minIdle = 10
lettuce.maxIdle = 100
lettuce.maxTotal = 200
lettuce.maxWaitMillis = 5000
lettuce.timeout = 10000
lettuce.testOnBorrow = true
lettuce.testOnReturn = false
lettuce.testWhileIdle = true

#########################################
# Caffeine configuration
# caffeine.region.[name] = size, xxxx[s|m|h|d]
#
#########################################
caffeine.region.default=1000, 30m
caffeine.region.testCache=10000, 6s
```

::: tip 特别提示
`zhengcheng` 推荐L1缓存使用caffeine，L2缓存使用lettuce客户端的redis

Caffeine是基于JAVA 1.8 Version的高性能缓存库。Caffeine提供的内存缓存使用参考Google guava的API。Caffeine是基于Google Guava Cache设计经验上改进的成果,**Caffeine效率明显的高于其他缓存**
:::


- 编写代码

```java
@Slf4j
@RunWith(SpringRunner.class)
@SpringBootTest(classes = MagicApplication.class)
public class RedisSampleServiceImplTest {

    @Autowired
    private CacheChannel cache;

    @Test
    public void testCacheChannel() {
        //缓存操作
        cache.set("default", "1", "Hello J2Cache");
        System.out.println(cache.get("default", "1"));
        cache.evict("default", "1");
        System.out.println(cache.get("default", "1"));
    }
}

```
  
- 使用业务场景：
    - 就算是使用了redis缓存，也会存在一定程度的网络传输上的消耗，在实际应用当中，会存在一些变更频率非常低的数据，
    - 就可以直接缓存在应用内部，对于一些实时性要求不太高的数据，也可以在应用内部缓存一定时间，减少对redis的访问，提高响应速度。
  
  
