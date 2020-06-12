# ZooKeeper

## 简介

ZooKeeper is a centralized service for maintaining configuration information, naming, providing distributed synchronization, and providing group services.

它是一个针对大型分布式系统的可靠协调系统，提供的功能包括：配置维护、名字服务、分布式同步、组服务等

[ZooKeeper wiki](https://cwiki.apache.org/confluence/display/ZooKeeper/Index) 、[Curator](http://curator.apache.org)

`zhengcheng` 提供了`ZkDistributedLock` 分布式锁

## **安装**

在 Maven 工程中使用

```xml
  <dependency>
        <groupId>com.zhengcheng</groupId>
        <artifactId>zc-zk-spring-boot-starter</artifactId>
  </dependency>
```

## 分布式锁

`zhengcheng` 定义了DistributedLock接口用于分布式锁，除了这里的ZK RLock 实现外，还有[Redisson的分布式锁实现](cache.md#redisson-分布式锁)。


- curator 客户端配置
```properties
curator.zookeeper-connection-string = zk链接地址
curator.base-sleep-time-ms = 1000 
curator.max-retries = 3
```
- 开启ZK 分布式锁
```properties
zk.lock.enable = true
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
