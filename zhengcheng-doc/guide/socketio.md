# 即时通讯

## 简介

即时通讯基于[socket.io](https://github.com/socketio/socket.io)，使用[netty-socketio](https://github.com/mrniko/netty-socketio)


## **安装**

在 Maven 工程中使用

```xml
  <dependency>
        <groupId>com.zhengcheng</groupId>
        <artifactId>zc-netty-socketio-spring-boot-starter</artifactId>
  </dependency>
```

- 属性配置

```properties
rt-server.host=localhost
rt-server.port=9092
rt-server.ping-interval=300000
rt-server.upgrade-timeout=25000
rt-server.ping-timeout=60000
rt-server.token=123456
rt-server.redisson.enable=true 
rt-server.redisson.host=127.0.0.1
rt-server.redisson.port=6379
rt-server.redisson.password=123456
```

