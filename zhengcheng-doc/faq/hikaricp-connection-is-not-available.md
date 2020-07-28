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

导致以上问题的可能原因有：
- 数据库连接不上
- 同时使用两个数据库池引起的，当超过一个池时，会收到来自另一个池的超时错误消息。
- 该问题与HikariCP无关。由于REST控制器中一些复杂的方法通过JPA存储库在数据库中执行了多个更改，因此问题仍然存在。由于某些原因，对这些接口的调用导致越来越多的“冻结”活动连接耗尽了池。将这些方法注释为@Transactional或在一次调用事务服务方法中包含所有逻辑似乎可以解决此问题。