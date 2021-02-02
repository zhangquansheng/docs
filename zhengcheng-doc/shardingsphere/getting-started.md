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

### 2. 规则配置

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