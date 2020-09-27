# CAT

[`cat`](https://github.com/dianping/cat) 
[`部署`](https://github.com/dianping/cat/wiki/readme_server)
[`vi`](https://github.com/ctripcorp/vi)

## 持续集成maven打包

**使用jenkins或者阿里云云效等持续集成工具，需要把cat-client-3.0.0.jar 和 cornerstone-0.2.1.jar 先导入到依赖的私服中**

## 部署点评Cat监控项目

- 使用maven本地编译CAT找不到org.unidal.maven.plugins:codegen-maven-plugin:2.3.2的解决办法
    1. 需要把cat-mvn-repo.zip下cat所需要的包放在本地maven仓库中或者私服
    2. 下载codegen-2.3.2.jar放在本地maven仓库中或者私服,需要在这里面下载https://github.com/dianping/cat/tree/mvn-repo
    3. 删除本地仓库的报错位置的 _remote.repositories 文件
    4. 执行mvn命令； mvn clean install -Dmaven.test.skip=true  -U
    
[windows 下 war 包部署开发环境](https://www.cnblogs.com/harrychinese/p/dianping-cat-server-setup.html)

## 埋点

- spring boot 
- mybatis
  > 需要使用MybatisPlus或者zc-db-spring-boot-starter
- SpringService
- feign-okhttp
  > 需要使用 feign.okhttp.OkHttpClient 或者 zc-feign-spring-boot-stater


CAT服务端，客户端对机器均有一定的配置要求。

## 插件

### Logback配置

如果需要使用Cat自定义的Appender，需要在logback.xml中添加如下配置：

```xml
    <appender name="CatAppender" class="com.dianping.cat.logback.CatLogbackAppender"></appender>

    <root level="info">
        <appender-ref ref="CatAppender" />
    </root>
```

## 常见问题

- java.lang.IllegalArgumentException: warning no match for this type name: 原因： SpringAop注解的时候,写错了类名会导致的这个问题

- 显示“有问题的CAT服务器[ip]”,请核查一下配置文件以及客户端路由中，都修改为内网ip

- CAT的TOMCAT启动以后，重启请不要使用./shutdown.sh ，使用 ps -ef|grep tomcat 关闭(kill -9 )所有cat启动的进程
   
