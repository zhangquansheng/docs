# `Alibaba Nacos` 替换 `Eureka` 注册中心

[Nacos Github](https://github.com/alibaba/nacos)

## 安装

Maven
```xml
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
    </dependency>
```

## 配置

```properties
spring.cloud.nacos.discovery=true 
#配置服务集群名字
spring.cloud.nacos.discovery.cluster-name=rt-server
#配置注册中心地址
spring.cloud.nacos.discovery.server-addr=zhengcheng.plus:8848
```

::: warning 注意
Nacos 对服务名**大小写敏感**，而 Eureka 对大小写不敏感，所以需要在迁移的过程中注意。
:::
