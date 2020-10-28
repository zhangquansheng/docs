# HikariCP - connection is not available

我们的项目中有Spring-boot / Hibernate / MySQL应用程序，并使用Hikari作为连接池. 完整的堆栈和问题如下：
```java
Caused by: org.hibernate.exception.JDBCConnectionException: Unable to acquire JDBC Connection
	at org.hibernate.exception.internal.SQLExceptionTypeDelegate.convert(SQLExceptionTypeDelegate.java:48)
	at org.hibernate.exception.internal.StandardSQLExceptionConverter.convert(StandardSQLExceptionConverter.java:42)
	at org.hibernate.engine.jdbc.spi.SqlExceptionHelper.convert(SqlExceptionHelper.java:113)
	at org.hibernate.engine.jdbc.spi.SqlExceptionHelper.convert(SqlExceptionHelper.java:99)
	at org.hibernate.resource.jdbc.internal.LogicalConnectionManagedImpl.acquireConnectionIfNeeded(LogicalConnectionManagedImpl.java:109)
	at org.hibernate.resource.jdbc.internal.LogicalConnectionManagedImpl.getPhysicalConnection(LogicalConnectionManagedImpl.java:136)
	at org.hibernate.engine.jdbc.internal.StatementPreparerImpl.connection(StatementPreparerImpl.java:47)
	at org.hibernate.engine.jdbc.internal.StatementPreparerImpl$5.doPrepare(StatementPreparerImpl.java:146)
	at org.hibernate.engine.jdbc.internal.StatementPreparerImpl$StatementPreparationTemplate.prepareStatement(StatementPreparerImpl.java:172)
	at org.hibernate.engine.jdbc.internal.StatementPreparerImpl.prepareQueryStatement(StatementPreparerImpl.java:148)
	at org.hibernate.loader.Loader.prepareQueryStatement(Loader.java:1984)
	at org.hibernate.loader.Loader.executeQueryStatement(Loader.java:1914)
	at org.hibernate.loader.Loader.executeQueryStatement(Loader.java:1892)
	at org.hibernate.loader.Loader.doQuery(Loader.java:937)
	at org.hibernate.loader.Loader.doQueryAndInitializeNonLazyCollections(Loader.java:340)
	at org.hibernate.loader.Loader.doList(Loader.java:2689)
	at org.hibernate.loader.Loader.doList(Loader.java:2672)
	at org.hibernate.loader.Loader.listIgnoreQueryCache(Loader.java:2506)
	at org.hibernate.loader.Loader.list(Loader.java:2501)
	at org.hibernate.loader.hql.QueryLoader.list(QueryLoader.java:504)
	at org.hibernate.hql.internal.ast.QueryTranslatorImpl.list(QueryTranslatorImpl.java:395)
	at org.hibernate.engine.query.spi.HQLQueryPlan.performList(HQLQueryPlan.java:220)
	at org.hibernate.internal.SessionImpl.list(SessionImpl.java:1508)
	at org.hibernate.query.internal.AbstractProducedQuery.doList(AbstractProducedQuery.java:1537)
	at org.hibernate.query.internal.AbstractProducedQuery.list(AbstractProducedQuery.java:1505)
	at org.hibernate.query.internal.AbstractProducedQuery.getSingleResult(AbstractProducedQuery.java:1553)
	at org.hibernate.query.criteria.internal.compile.CriteriaQueryTypeQueryAdapter.getSingleResult(CriteriaQueryTypeQueryAdapter.java:109)
	at sun.reflect.GeneratedMethodAccessor556.invoke(Unknown Source)
	at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
	at java.lang.reflect.Method.invoke(Method.java:498)
	at org.springframework.orm.jpa.SharedEntityManagerCreator$DeferredQueryInvocationHandler.invoke(SharedEntityManagerCreator.java:402)
	at com.sun.proxy.$Proxy382.getSingleResult(Unknown Source)
	at org.springframework.data.jpa.repository.query.JpaQueryExecution$SingleEntityExecution.doExecute(JpaQueryExecution.java:214)
	at org.springframework.data.jpa.repository.query.JpaQueryExecution.execute(JpaQueryExecution.java:91)
	at org.springframework.data.jpa.repository.query.AbstractJpaQuery.doExecute(AbstractJpaQuery.java:136)
	at org.springframework.data.jpa.repository.query.AbstractJpaQuery.execute(AbstractJpaQuery.java:125)
	at org.springframework.data.repository.core.support.RepositoryFactorySupport$QueryExecutorMethodInterceptor.doInvoke(RepositoryFactorySupport.java:605)
	at org.springframework.data.repository.core.support.RepositoryFactorySupport$QueryExecutorMethodInterceptor.lambda$invoke$3(RepositoryFactorySupport.java:595)
	at org.springframework.data.repository.core.support.RepositoryFactorySupport$QueryExecutorMethodInterceptor.invoke(RepositoryFactorySupport.java:595)
	at org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:186)
	at org.springframework.data.projection.DefaultMethodInvokingMethodInterceptor.invoke(DefaultMethodInvokingMethodInterceptor.java:59)
	at org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:186)
	at org.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:294)
	at org.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:98)
	at org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:186)
	at org.springframework.dao.support.PersistenceExceptionTranslationInterceptor.invoke(PersistenceExceptionTranslationInterceptor.java:139)
	... 33 more
Caused by: java.sql.SQLTransientConnectionException: HikariPool-1 - Connection is not available, request timed out after 30000ms.
	at com.zaxxer.hikari.pool.HikariPool.createTimeoutException(HikariPool.java:676)
	at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:190)
	at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:155)
	at com.zaxxer.hikari.HikariDataSource.getConnection(HikariDataSource.java:128)
	at org.hibernate.engine.jdbc.connections.internal.DatasourceConnectionProviderImpl.getConnection(DatasourceConnectionProviderImpl.java:122)
	at org.hibernate.internal.NonContextualJdbcConnectionAccess.obtainConnection(NonContextualJdbcConnectionAccess.java:35)
	at org.hibernate.resource.jdbc.internal.LogicalConnectionManagedImpl.acquireConnectionIfNeeded(LogicalConnectionManagedImpl.java:106)
```

Here is the version info:

```shell script
Spring-boot version:   2.1.2.RELEASE
HikariCP version:      3.2.0
Hibernate version:     5.3.7.Final
MySQL jdbc:            5.7
Server version:        Apache Tomcat/8.0.23
JVM Version:           1.8.0_231
```

JPA/Hibernate config:
```yaml
spring:
  datasource:
    hikari:
      driver-class-name: com.mysql.cj.jdbc.Driver
      url: jdbc:mysql://127.0.0.1:3306?useSSL=false&characterEncoding=utf-8&serverTimezone=Asia/Shanghai&autoReconnect=true&zeroDateTimeBehavior=convertToNull
      username: root
      password: root
  jpa:
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQL5Dialect
    show-sql: true
```

## 原因一：连接泄漏(在从池中借用之后连接没有关闭)

首先通过配置[HikariCP连接池监控](https://github.com/brettwooldridge/HikariCP/wiki/MBean-(JMX)-Monitoring-and-Management)，可以动态的观察到HikariCP连接池信息，配置方法如下：

```yaml
# 配置 HikariConfig poolName isRegisterMbeans ，其他的参数都是默认的
spring:
  datasource:
    hikari:
      hermes:
        jdbc-url: jdbc:mysql://127.0.0.1:3306/hermes?useSSL=false&characterEncoding=utf-8&serverTimezone=Asia/Shanghai&zeroDateTimeBehavior=convertToNull&autoReconnect=true&failOverReadOnly=false&maxReconnects=5
        username: root
        password: root
        driver-class-name: com.mysql.jdbc.Driver
        pool-name: hermes
        register-mbeans: true
```

增加定时任务，每隔5s打印线程池的信息:
```java
// 解决注册重复问题
@EnableMBeanExport(registration = RegistrationPolicy.IGNORE_EXISTING)
@Slf4j
@EnableScheduling
public class HikariMonitorApplication {

    @Scheduled(fixedRate = 5000)
    public void HikariMonitor() throws MalformedObjectNameException {
        MBeanServer mBeanServer = ManagementFactory.getPlatformMBeanServer();
        // 其中hermes是上面配置的线程池的名字
        ObjectName poolName = new ObjectName("com.zaxxer.hikari:type=Pool (hermes)");
        HikariPoolMXBean poolProxy = JMX.newMXBeanProxy(mBeanServer, poolName, HikariPoolMXBean.class);

        if (poolProxy == null) {
            log.info("Hikari not initialized,please wait...");
        } else {
            log.info("HikariPoolState: Active=[{}] Idle=[{}] Wait=[{}] Total=[{}]",
                    poolProxy.getActiveConnections(),
                    poolProxy.getIdleConnections(),
                    poolProxy.getThreadsAwaitingConnection(),
                    poolProxy.getTotalConnections());
        }
    }
}
```

正常情况下(Wait<=Total)，打印信息如下：
```shell script
Active=[0] Idle=[10] Wait=[0] Total=[10]
```
或者是这样的：
```shell script
Active=[10] Idle=[0] Wait=[10] Total=[10]
```

那么我在代码中，增加主动尝试获取`connection`，核心代码如下：
```java
    // 配置数据源
    @Primary
    @Bean(name = "hermesHikariDataSource")
    @Qualifier("hermesHikariDataSource")
    @ConfigurationProperties("spring.datasource.hikari.hermes")
    public DataSource hermesHikariDataSource() {
        return DataSourceBuilder.create().type(HikariDataSource.class).build();
    }


    @Resource(name = "hermesHikariDataSource")
    private DataSource ds;

    try {
        // 尝试与数据源建立连接
        ds.getConnection();
    } catch (SQLException e) {
        log.error(e.getMessage(), e);
    }
```

使用`jmeter`并发请求后，出现 `Active=[10] Idle=[0] Wait=[20] Total=[10]`(Wait>Total) 和 `HikariCP - connection is not available` 异常。

## 连接池泄露检测 

::: tip leakDetectionThreshold
用来设置连接被占用的超时时间，单位为毫秒，默认为0，表示禁用连接泄露检测。
如果大于0且不是单元测试，则进一步判断：(leakDetectionThreshold < SECONDS.toMillis(2) or (leakDetectionThreshold > maxLifetime && maxLifetime > 0)，会被重置为0 .
即如果要生效则必须>0，同时满足：不能小于2秒，而且当maxLifetime > 0时不能大于maxLifetime，该值默认为1800000，即30分钟。
:::

配置
```yaml
spring:
  datasource:
    hikari:
      hermes:
        leak-detection-threshold: 10000  # 单位ms，配置10s
```

输出
```java
13:28:00.130 [hermes housekeeper] WARN   com.zaxxer.hikari.pool.ProxyLeakTask - Connection leak detection triggered for com.mysql.jdbc.JDBC4Connection@57a6bf7 on thread http-nio-8080-exec-6, stack trace follows
java.lang.Exception: Apparent connection leak detected
	at com.zaxxer.hikari.HikariDataSource.getConnection(HikariDataSource.java:128) ~[HikariCP-3.2.0.jar:?]
	at org.hibernate.engine.jdbc.connections.internal.DatasourceConnectionProviderImpl.getConnection(DatasourceConnectionProviderImpl.java:122) ~[hibernate-core-5.3.7.Final.jar:5.3.7.Final]
	at org.hibernate.internal.NonContextualJdbcConnectionAccess.obtainConnection(NonContextualJdbcConnectionAccess.java:35) ~[hibernate-core-5.3.7.Final.jar:5.3.7.Final]
	at org.hibernate.resource.jdbc.internal.LogicalConnectionManagedImpl.acquireConnectionIfNeeded(LogicalConnectionManagedImpl.java:106) ~[hibernate-core-5.3.7.Final.jar:5.3.7.Final]
	at org.hibernate.resource.jdbc.internal.LogicalConnectionManagedImpl.getPhysicalConnection(LogicalConnectionManagedImpl.java:136) ~[hibernate-core-5.3.7.Final.jar:5.3.7.Final]
	at org.hibernate.internal.SessionImpl.connection(SessionImpl.java:541) ~[hibernate-core-5.3.7.Final.jar:5.3.7.Final]
	at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method) ~[?:1.8.0_231]
	at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62) ~[?:1.8.0_231]
	at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43) ~[?:1.8.0_231]
	at java.lang.reflect.Method.invoke(Method.java:498) ~[?:1.8.0_231]
	at org.springframework.util.ReflectionUtils.invokeMethod(ReflectionUtils.java:246) ~[spring-core-5.1.4.RELEASE.jar:5.1.4.RELEASE]
```

> 可以看到ProxyLeakTask抛出java.lang.Exception: Apparent connection leak detected，但是这个是在Runnable中抛出的，并不影响主线程，主线程在超时过后，仍旧继续执行，最后输出结果。

## 解决方案

保证**数据库连接正常**和没有大量慢SQL占用`connection`的情况下，可以尝试以下的方法：
- **重启服务**
- 其实该问题与HikariCP无关。由于REST控制器中一些复杂的方法通过**JPA**存储库在数据库中执行了多个更改，因此问题仍然存在。由于某些原因，对这些接口的调用导致越来越多的“冻结”活动连接耗尽了池。
  将这些方法注释为@Transactional或在一次调用事务服务方法中包含所有逻辑似乎可以解决此问题。
- 使用Mybatis似乎也可以解决此问题。

---

**参考文档**
- [HikariCP issues](https://github.com/brettwooldridge/HikariCP/issues)