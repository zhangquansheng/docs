# 多数据源配置整合

> 参考[动态数据源](https://github.com/baomidou/dynamic-datasource-spring-boot-starter)

## 数据源配置

```java
    @Bean(name = "masterHikariDataSource")
    @Qualifier("masterHikariDataSource")
    @ConfigurationProperties("spring.datasource.hikari.master")
    public DataSource masterHikariDataSource() {
        return DataSourceBuilder.create().type(HikariDataSource.class).build();
    }
```

## MybatisPlus 配置

```java
@Configuration
@MapperScan(basePackages = "com.zhengcheng.mapper*", sqlSessionTemplateRef = "masterSqlSessionTemplate")
@ConditionalOnClass({SqlSessionFactory.class, SqlSessionFactoryBean.class})
public class MasterMybatisPlusConfig {

    private final DataSource dataSource;

    public MasterMybatisPlusConfig(@Qualifier("masterHikariDataSource") DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Bean
    public SqlSessionFactory masterSqlSessionFactory() throws Exception {
        /**
         *  SqlSessionFactoryBean factoryBean = new SqlSessionFactoryBean();
         *  需要兼容mybatis-plus需要使用MybatisSqlSessionFactoryBean 代替 SqlSessionFactoryBean
         */
        MybatisSqlSessionFactoryBean sqlSessionFactory = new MybatisSqlSessionFactoryBean();
        sqlSessionFactory.setDataSource(dataSource);
        sqlSessionFactory.setTypeEnumsPackage("com.zhengcheng.enums");
        sqlSessionFactory.setTypeAliasesPackage("com.zhengcheng.entity");
        sqlSessionFactory.setMapperLocations(new PathMatchingResourcePatternResolver()
                .getResources("classpath*:**/*Mapper.xml"));

        MybatisConfiguration configuration = new MybatisConfiguration();
        configuration.setMapUnderscoreToCamelCase(true);
        configuration.setDefaultEnumTypeHandler(MybatisEnumTypeHandler.class);
        sqlSessionFactory.setConfiguration(configuration);

        GlobalConfig globalConfig = new GlobalConfig();
        globalConfig.setMetaObjectHandler(new DefaultMetaObjectHandler());
        sqlSessionFactory.setGlobalConfig(globalConfig);

        PaginationInterceptor paginationInterceptor = new PaginationInterceptor();
        paginationInterceptor.setLimit(CommonConstants.DEFAULT_PAGINATION_LIMIT);
        sqlSessionFactory.setPlugins(new Interceptor[]{paginationInterceptor});
        return sqlSessionFactory.getObject();
    }

    @Bean("masterSqlSessionTemplate")
    public SqlSessionTemplate masterSqlSessionTemplate() throws Exception {
        return new SqlSessionTemplate(masterSqlSessionFactory());
    }

    @Bean
    public PlatformTransactionManager masterTransactionManager() {
        return new DataSourceTransactionManager(dataSource);
    }

}
```

## 属性信息

::: tip 特别提示
请注意`mysql-connector-java 5.1` 升级到 `mysql-connector-java 8.0`后属性配置的区别，也需要注意[mysql-connector-java与Mysql、Java的对应版本](https://dev.mysql.com/doc/connector-j/5.1/en/connector-j-versions.html)
:::

```properties
spring.datasource.url=jdbc:mysql://127.0.0.1:3306/master?useUnicode=true&characterEncoding=UTF-8&autoReconnect=true&useSSL=false&zeroDateTimeBehavior=convertToNull&allowMultiQueries=true&serverTimezone=GMT%2B8
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.datasource.hikari.master.type=com.zaxxer.hikari.HikariDataSource
spring.datasource.hikari.master.hikari.auto-commit=true
spring.datasource.hikari.master.hikari.connection-test-query=SELECT 1
spring.datasource.hikari.master.hikari.connection-timeout=30000
spring.datasource.hikari.master.hikari.idle-timeout=180000
spring.datasource.hikari.master.hikari.max-lifetime=1800000
spring.datasource.hikari.master.hikari.maximum-pool-size=10
spring.datasource.hikari.master.hikari.minimum-idle=5
spring.datasource.hikari.master.name=master
spring.datasource.hikari.master.username=root
spring.datasource.hikari.master.password=root
```

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
