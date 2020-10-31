## **MySQL官方驱动**主从分离

> ReplicationDriver

### 配置信息

- Spring Boot 1.5.x

```properties
# 改jdbc连接 jdbc:mysql://127.0.0.1:3306/test?characterEncoding=UTF-8
spring.datasource.url=jdbc:mysql:replication://127.0.0.1:3306,127.0.0.1:3306,127.0.0.1:3306/zc-im?useUnicode=true&characterEncoding=UTF-8&autoReconnect=false&loadBalanceStrategy=random&autoReconnect=true&rewriteBatchedStatements=TRUE&zeroDateTimeBehavior=convertToNull
# 改驱动类 com.mysql.jdbc.Driver
spring.datasource.jdbc-driver=com.mysql.jdbc.ReplicationDriver
```

- Spring Boot 2.1.x
```properties
# 参数 allowSlavesDownConnections=true
spring.datasource.url=jdbc:mysql:replication://127.0.0.1:3306,127.0.0.1:3306,127.0.0.1:3306/db?characterEncoding=UTF-8&useSSL=false&autoReconnect=true&allowMasterDownConnections=true&serverTimezone=GMT%2B8&zeroDateTimeBehavior=convertToNull&allowMultiQueries=true
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
```

这种情况下 `DataSource.getConnection()` 获取的连接，实际上是`ReplicationConnection`，这个连接是虚拟的，和真实的数据库连接是个一对多的关系，所以记得给每一个MySQL都做上相应的机器授权。

如何来区别本次请求是读是写？其实是通过`Connection`中的`readonly`属性传递的。`readonly=true`的时，走从库查询。

对于Spring来说，就可以**使用@Transactional注解**来控制这个属性了。一个事务不可能跨两个连接，所以是读是写，有最高层决定。

```java
  // 只读事务，走从库查询
  @Transactional(readOnly = true)
```

有些情况下，我们不需要为了一个读写分离，在复杂的查询中增加一个事务的开销，所以本项目中**提供了@ReadOnlyConnection注解**，作用是把`Connection`的`readonly`设置成`true`。
