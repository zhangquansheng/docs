## 包含组件

 name | description
---|---
zc-web-spring-boot-starter | WEB模块通用组件
zc-auth-client-spring-boot-starter | 认证客户端通用组件
zc-feign-spring-boot-starter | 远程通信通用组件
zc-mybatis-plus-spring-boot-starter | MyBatis-Plus通用组件
zc-tk-mybatis-spring-boot-starter | tk.mybatis通用组件
zc-mybatis-spring-boot-starter | Mybatis3通过provider注解结合动态sql实现CRUD
zc-cache-spring-boot-starter | 缓存通用组件
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
        <version>4.8.0</version>
    </parent>
```