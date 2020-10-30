# 简介

`zhengcheng`是一个基于**SpringBoot**的框架支持项目，只需简单配置，即可快速接入各种通用组件，从而节省大量时间,让我们在开发业务时能够专注于业务的编写而不必过多的关注框架的配置，并且可以促进团队合作，降低维护成本，减少低级BUG，有助于代码审查。

## 环境准备

- `JDK 1.8 or later`
- [Maven 3.2+](https://maven.apache.org/download.cgi)
- [SpringBoot 2.1.13.RELEASE](https://spring.io/projects/spring-boot)
- [SpringCloud Greenwich.SR4](https://cloud.spring.io/spring-cloud-static/Greenwich.SR4/single/spring-cloud.html)

## 安装

把项目中的`pom.xml`的 parent 中替换以下内容:
```xml
    <parent>
        <groupId>com.zhengcheng</groupId>
        <artifactId>zhengcheng-parent</artifactId>
        <version>4.8.0</version>
    </parent>
```

## 通用组件

 name | description
---|---
zc-web-core-spring-boot-starter | WEB服务核心模块通用组件
zc-feign-spring-boot-starter | 远程通信（Feign）通用组件
zc-mybatis-plus-spring-boot-starter | MyBatis-Plus 通用组件
zc-cache-spring-boot-starter | 缓存（Redis @EnableCaching caffeine）通用组件
zc-xx-job-spring-boot-starter | XXL-JOB 定时任务通用组件
zc-swagger-spring-boot-starter | swagger2.8.0 通用组件

## 三方包

`zhengcheng` 引入了很多优秀的三方包，在此一并表示感谢（如有侵权，请联系作者删除）。

- [SpringCloud Alibaba](https://spring.io/projects/spring-cloud-alibaba)
- Java工具类库[hutool](https://hutool.cn/docs/#/)
- [MyBatis-Plus](https://mp.baomidou.com/)为简化开发而生
- [XXL-JOB](http://www.xuxueli.com/xxl-job/)分布式任务调度平台
- [Apollo配置中心](https://github.com/ctripcorp/apollo)
- [面向云原生微服务的高可用流控防护组件Sentinel](https://github.com/alibaba/Sentinel)
- [netty-socketio](https://github.com/mrniko/netty-socketio)
- [红薯 开源中国 J2Cache](https://gitee.com/ld/J2Cache)

## 关于作者

`zhengcheng` 是个人学习作品，如果您觉得还不错，欢迎使用，如有问题，联系作者（微信：`z088600`、邮箱：`952547584@qq.com`），必定竭诚为您解决。

### 座右铭

- **不傲娇，要能延迟满足感**
- **对不确定性保持乐观**

## 添砖加瓦

### 提供bug反馈或建议

提交问题反馈请说明正在使用的JDK版本号、`zhengcheng`版本和相关依赖库版本。

- [GitHub issue](https://github.com/zhangquansheng/zhengcheng-parent/issues)
- [Gitee issue](https://gitee.com/zhangquansheng/zhengcheng-parent/issues)