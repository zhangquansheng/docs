# 整合Apollo


::: tip 说明：

示例项目源码： 👉 [magic-apollo](https://gitee.com/zhangquansheng/magic/tree/apollo/)

[Apollo - Spring Boot接入配置中心Apollo](https://github.com/ctripcorp/apollo/wiki/Java%E5%AE%A2%E6%88%B7%E7%AB%AF%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97)
:::


## 安装

在 Maven 工程中使用

```xml
       <dependency>
            <groupId>com.ctrip.framework.apollo</groupId>
            <artifactId>apollo-client</artifactId>
        </dependency>
        <dependency>
            <groupId>com.ctrip.framework.apollo</groupId>
            <artifactId>apollo-core</artifactId>
        </dependency>
```

## 修改配置

- application.properties
```properties
apollo.bootstrap.enabled=true
# will inject 'application', 'FX.apollo' and 'application.yml' namespaces in bootstrap phase
apollo.bootstrap.namespaces=application
```

- apollo-env.properties
```properties
dev.meta= http://127.0.0.1:8080
pro.meta= http://172.16.33.177:8080
```

## 启用配置

```java
@EnableApolloConfig
```

启动命令中指定环境 -Denv=pro



