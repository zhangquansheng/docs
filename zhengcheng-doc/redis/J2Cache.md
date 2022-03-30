# J2Cache

::: tip 开源中国 J2Cache二级缓存框架
`Java`两级缓存框架，可以让应用支持两级缓存框架`ehcache(Caffeine) + redis`。避免完全使用独立缓存系统所带来的`网络IO`开销问题。
[https://gitee.com/ld/J2Cache](https://gitee.com/ld/J2Cache)
::: 

## Maven 
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

## 属性配置

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
推荐`L1`缓存使用`caffeine`，`L2`缓存使用`lettuce`客户端的`redis`

`Caffeine`是基于`JAVA 1.8 Version`的高性能缓存库。`Caffeine`提供的内存缓存使用参考`Google guava`的`API`。
`Caffeine`是基于`Google Guava Cache`设计经验上改进的成果，**Caffeine效率明显的高于其他缓存**。
:::


## 代码示例

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
  
## 业务场景

就算是使用了`redis`缓存，也会存在一定程度的网络传输上的消耗，在实际应用当中，会存在一些变更频率非常低的数据，就可以直接缓存在应用内部，对于一些实时性要求不太高的数据，也可以在应用内部缓存一定时间，减少对`redis`的访问，提高响应速度。

## 推荐阅读

- [Redis+Caffeine 两级缓存实战！性能爆表](https://mp.weixin.qq.com/s/4a-nIjS4Z55XzEdZQPl7tQ)