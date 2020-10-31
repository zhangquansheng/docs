# 核心模块

`zc-web-core-spring-boot-starter` 是 `zhengcheng` 框架Web服务核心通用组件。

## 安装

```xml
  <dependency>
        <groupId>com.zhengcheng</groupId>
        <artifactId>zc-web-core-spring-boot-starter</artifactId>
  </dependency>
```

## 属性配置
```properties
server.port=${port:8080}

# 注意数据库URL中链接的配置参数（这里使用了主从配置方式） 
spring.datasource.url=jdbc:mysql:replication://127.0.0.1:3306,127.0.0.1:3306/magic?characterEncoding=UTF-8&useSSL=false&autoReconnect=true&allowMasterDownConnections=true&serverTimezone=GMT%2B8&zeroDateTimeBehavior=convertToNull&allowMultiQueries=true
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.datasource.type=com.zaxxer.hikari.HikariDataSource
spring.datasource.hikari.username=root
spring.datasource.hikari.password=root
spring.datasource.hikari.minimum-idle=2
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.idle-timeout=60000
spring.datasource.hikari.max-lifetime=600000
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.connection-test-query=SELECT 1
spring.datasource.hikari.auto-commit=true

mybatis-plus.mapper-locations = classpath*:**/*Mapper.xml
mybatis-plus.type-aliases-package = com.zhengcheng.user.entity
mybatis-plus.configuration.map-underscore-to-camel-case = true
mybatis-plus.type-enums-package = com.zhengcheng.user.enums

spring.swagger.enable = true
spring.swagger.title = magic
spring.swagger.description = zhengcheng-parent magic
spring.swagger.license = Apache License, Version 2.0
spring.swagger.license-url = https://www.apache.org/licenses/LICENSE-2.0.html
spring.swagger.base-package = com.zhengcheng.magic.controller
spring.swagger.base-path = /**
spring.swagger.exclude-path = /error, /ops/**
```

## 核心功能

在`zhengcheng`的`SpringBoot`中，只需要引入此包即可，它包含了以下组件
- zc-mybatis-plus-spring-boot-starter
- zc-cache-spring-boot-starter
- zc-feign-spring-boot-starter
- zc-swagger-spring-boot-starter

---

核心组件通过 `@RestControllerAdvice` + `@ExceptionHandler` 的方式实现了**全局统一异常处理**，参考文档如下：
- [ExceptionControllerAdvice 源码](https://gitee.com/zhangquansheng/zhengcheng-parent/blob/master/zc-web-core-spring-boot-starter/src/main/java/com/zhengcheng/core/web/advice/ExceptionControllerAdvice.java)
- [Spring MVC Exceptions](https://docs.spring.io/spring-framework/docs/current/spring-framework-reference/web.html#mvc-ann-exceptionhandler)
- [有关 @ControllerAdvice  更多详细信息，请参见 javadoc。](https://docs.spring.io/spring-framework/docs/5.2.8.RELEASE/javadoc-api/org/springframework/web/bind/annotation/ControllerAdvice.html)

---

在现实的项目中我们经常会遇到系统出现异常或者问题, 为了方便定位问题，需要知道`Controller`调用入参和`traceId`（链路ID），
核心组件使用的是**Spring AOP**对`Controller`进行切面打印日志以及使用`Interceptor`结合`MDC`实现**链路日志**，参考文档如下：
- [TraceIdInterceptor 链路日志拦截器源码](https://gitee.com/zhangquansheng/zhengcheng-parent/blob/master/zc-web-core-spring-boot-starter/src/main/java/com/zhengcheng/core/web/interceptor/TraceIdInterceptor.java)
- [ControllerLogAspect 源码](https://gitee.com/zhangquansheng/zhengcheng-parent/blob/master/zc-web-core-spring-boot-starter/src/main/java/com/zhengcheng/core/web/aspect/ControllerLogAspect.java)

::: tip 特别提示
**X-ZHENGCHENG-TRACE-ID** 是`zhengcheng`约定的`traceId` 的`key`，在`HTTP request header`中传递。
:::

