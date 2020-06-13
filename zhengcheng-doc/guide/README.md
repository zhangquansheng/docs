# 简介

`zhengcheng`云服务父项目，所有微服务项目的框架支持项目,基于Spring Cloud


`zhengcheng`是一个基于Spring Cloud 的框架支持项目，只需简单配置，即可快速接入各种通用组件，从而节省大量时间,让我们在开发业务时能够专注于业务的编写而不必过多的关注框架的配置，并且可以促进团队合作，降低维护成本，减少低级BUG，有助于代码审查。



### **环境准备**

- 4.x
    - `JDK 1.8 or later`
    - [Maven 3.2+](https://maven.apache.org/download.cgi)
    - [SpringBoot 2.1.11.RELEASE](https://spring.io/projects/spring-boot)
    - [SpringCloud Greenwich.SR4](https://cloud.spring.io/spring-cloud-static/Greenwich.SR4/single/spring-cloud.html)
- 3.x
    - `JDK 1.8 or later`
    - [Maven 3.2+](https://maven.apache.org/download.cgi)
    - [SpringBoot 2.0.8.RELEASE](https://spring.io/projects/spring-boot)
    - [SpringCloud Finchley.SR3](https://cloud.spring.io/spring-cloud-static/Finchley.SR4/single/spring-cloud.html)

## 包含组件

 name | description
---|---
zc-web-spring-boot-starter | WEB模块通用组件
zc-auth-client-spring-boot-starter | 认证客户端通用组件
zc-feign-spring-boot-starter | 远程通信通用组件
zc-db-spring-boot-starter | Mysql数据库通用组件
zc-cache-spring-boot-starter | 缓存通用组件
zc-sentinel-spring-boot-starter | 服务降级、熔断和限流通用组件
zc-job-spring-boot-starter | XXL-JOB定时任务通用组件
zc-swagger-spring-boot-starter | swagger通用组件
zc-sharding-jdbc-spring-boot-starter | 分库分表通用组件
zc-common-spring-boot-starter | 公共库通用组件(module之间的公共部分)
zc-cat-spring-boot-starter | CAT监控通用组件
zc-netty-socketio-spring-boot-starter | 即时聊天通用组件
zc-aliyun-spring-boot-starter | 阿里云通用组件(OSS，短信服务，RocketMQ，内容安全，日志服务，DTS)
zc-tencentcloud-spring-boot-starter | 腾讯云通用组件（云对象存储 COS，内容安全，自然语言自动配置）
zc-dict-spring-boot-starter | 数据字典通用组件（架构设计）
zc-zk-spring-boot-starter | Zookeeper通用组件

## 安装

### Maven

把项目的pom.xml的parent中替换以下内容:
```xml
    <parent>
        <groupId>com.zhengcheng</groupId>
        <artifactId>zhengcheng-parent</artifactId>
        <version>4.6.0</version>
    </parent>
```

::: danger 禁止
禁止在项目的pom.xml的dependencies中加入以下内容（我们不认为有人会这样做，但如果有，建议去重新学习下`SpringBoot`）
```xml
    <parent>
        <groupId>com.zhengcheng</groupId>
        <artifactId>zhengcheng-parent</artifactId>
    </parent>
```
:::

## 三方包

`zhengcheng` 引入了很多优秀的三方包，在此一并表示感谢。

- Java工具类库[hutool](https://hutool.cn/docs/#/)
- [MyBatis-Plus](https://mp.baomidou.com/)为简化开发而生
- [XXL-JOB](http://www.xuxueli.com/xxl-job/)分布式任务调度平台
- [Apollo配置中心](https://github.com/ctripcorp/apollo)
- [面向云原生微服务的高可用流控防护组件Sentinel](https://github.com/alibaba/Sentinel)
- [netty-socketio](https://github.com/mrniko/netty-socketio)
- [红薯 开源中国 J2Cache](https://gitee.com/ld/J2Cache)

## 关于作者

`zhengcheng` 是个人学习作品，如果您觉得还不错，欢迎使用，如有问题，联系作者（微信：`z088600`、邮箱：`952547584@qq.com`），必定竭诚为您解决。

## 添砖加瓦

### 提供bug反馈或建议

提交问题反馈请说明正在使用的JDK版本号、`zhengcheng`版本和相关依赖库版本。

- GitHub issue
