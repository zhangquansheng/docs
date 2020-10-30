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

::: tip 提示
   如何使用Redis，详细见 [RedisTemplate 官方文档](https://docs.spring.io/spring-data/data-redis/docs/current/reference/html/#redis:template)
::: 

## CacheManager

`zhengcheng` 中`@EnableCaching`默认是使用 `CacheType.SIMPLE`，具体如何使用，请查看 [Caching 官方文档](https://docs.spring.io/spring-boot/docs/current/reference/html/spring-boot-features.html#boot-features-caching)

如果要开启`caffeine` ，需要增加属性配置，具体如下：
```properties
spring.cache.type = caffeine
spring.cache.caffeine.spec = initialCapacity=10,maximumSize=200,expireAfterWrite=3s
```