---
sidebarDepth: 3
---

# 快速入门

[[toc]]

## ShardingSphere-JDBC

### 1. 引入 maven 依赖

```xml
    <dependency>
        <groupId>org.apache.shardingsphere</groupId>
        <artifactId>sharding-jdbc-spring-boot-starter</artifactId>
        <version>${shardingsphere.version}</version>
    </dependency>
```
注意：请将 `${shardingsphere.version}` 更改为实际的版本号，这里使用的`4.1.1`。

### 2. 数据分片

```properties
spring.shardingsphere.datasource.names=ds

spring.shardingsphere.datasource.ds.type=com.zaxxer.hikari.HikariDataSource
spring.shardingsphere.datasource.ds.driver-class-name=com.mysql.cj.jdbc.Driver
spring.shardingsphere.datasource.ds.jdbc-url=jdbc:mysql://127.0.0.1:3306/sharding?characterEncoding=UTF-8&useSSL=false&autoReconnect=true&allowMasterDownConnections=true&serverTimezone=GMT%2B8&zeroDateTimeBehavior=convertToNull&allowMultiQueries=true&allowPublicKeyRetrieval=true
spring.shardingsphere.datasource.ds.username=root
spring.shardingsphere.datasource.ds.password=root

spring.shardingsphere.sharding.tables.zm_xtc_user.actualDataNodes=ds.zm_xtc_user_${0..1}
# 行表达式分片策略
spring.shardingsphere.sharding.tables.zm_xtc_user.tableStrategy.inline.shardingColumn=user_id
spring.shardingsphere.sharding.tables.zm_xtc_user.tableStrategy.inline.algorithmExpression=zm_xtc_user_${user_id % 2}

# 开发环境配置 
spring.shardingsphere.props.sql.show=true
```

### 3. 读写分离

```yaml
##数据源配置
spring:
  shardingsphere:
    datasource:           #数据源配置信息
      names: master,slave0,slave1,slave2
      master:
        type: com.zaxxer.hikari.HikariDataSource
        driver-class-name: com.mysql.cj.jdbc.Driver
        url: jdbc:mysql://127.0.0.1:3306/sharding?characterEncoding=UTF-8&useSSL=false&autoReconnect=true&allowMasterDownConnections=true&serverTimezone=GMT%2B8&zeroDateTimeBehavior=convertToNull&allowMultiQueries=true&allowPublicKeyRetrieval=true
        username: root
        password: root
      slave0:
        type: com.zaxxer.hikari.HikariDataSource
        driver-class-name: com.mysql.cj.jdbc.Driver
        url: jdbc:mysql://127.0.0.1:3306/sharding?characterEncoding=UTF-8&useSSL=false&autoReconnect=true&allowMasterDownConnections=true&serverTimezone=GMT%2B8&zeroDateTimeBehavior=convertToNull&allowMultiQueries=true&allowPublicKeyRetrieval=true
        username: root
        password: root
      slave1:
        type: com.zaxxer.hikari.HikariDataSource
        driver-class-name: com.mysql.cj.jdbc.Driver
        url:jdbc:mysql://127.0.0.1:3306/sharding?characterEncoding=UTF-8&useSSL=false&autoReconnect=true&allowMasterDownConnections=true&serverTimezone=GMT%2B8&zeroDateTimeBehavior=convertToNull&allowMultiQueries=true&allowPublicKeyRetrieval=true
        username: root
        password: root
      slave2:
        type: com.zaxxer.hikari.HikariDataSource
        driver-class-name: com.mysql.cj.jdbc.Driver
        url: jdbc:mysql://127.0.0.1:3306/sharding?characterEncoding=UTF-8&useSSL=false&autoReconnect=true&allowMasterDownConnections=true&serverTimezone=GMT%2B8&zeroDateTimeBehavior=convertToNull&allowMultiQueries=true&allowPublicKeyRetrieval=true
        username: root
        password: root
        
    masterslave:        #主从关系配置  
      name: ms
      master-data-source-name: master
      slave-data-source-names: slave0,slave1,slave2
    props:
      sql: 
        show: true    # 开发环境打开SQL显示，其他的环境需要关闭 
```