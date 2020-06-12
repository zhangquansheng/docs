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

