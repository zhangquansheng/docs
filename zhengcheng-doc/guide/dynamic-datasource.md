# 多数据源配置

## 数据源配置

```java
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

/**
 * DataSourceConfig
 *
 * @author quansheng1.zhang
 * @since 2020/10/30 17:36
 */
@Configuration
public class DataSourceConfig {

    @Primary
    @Bean(name = "masterHikariDataSource")
    @Qualifier("masterHikariDataSource")
    @ConfigurationProperties("spring.datasource.hikari.master")
    public DataSource masterHikariDataSource() {
        return DataSourceBuilder.create().type(HikariDataSource.class).build();
    }

    @Bean(name = "slaveHikariDataSource")
    @Qualifier("slaveHikariDataSource")
    @ConfigurationProperties("spring.datasource.hikari.slave")
    public DataSource slaveHikariDataSource() {
        return DataSourceBuilder.create().type(HikariDataSource.class).build();
    }

}
```

## Master MybatisPlus 配置

```java
import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.config.GlobalConfig;
import com.baomidou.mybatisplus.extension.handlers.MybatisEnumTypeHandler;
import com.baomidou.mybatisplus.extension.plugins.PaginationInterceptor;
import com.baomidou.mybatisplus.extension.spring.MybatisSqlSessionFactoryBean;
import com.zhengcheng.common.constant.CommonConstants;
import com.zhengcheng.mybatis.plus.config.DateMetaObjectHandler;
import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.SqlSessionTemplate;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;

/**
 * MasterMybatisPlusConfig
 *
 * @author quansheng1.zhang
 * @since 2020/10/30 17:39
 */
@Configuration
@MapperScan(basePackages = "com.zhengcheng.magic.master.domain.mapper*", sqlSessionTemplateRef = "masterSqlSessionTemplate")
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
        sqlSessionFactory.setTypeEnumsPackage("com.zhengcheng.magic.master.domain.enums");
        sqlSessionFactory.setTypeAliasesPackage("com.zhengcheng.magic.master.domain.entity");
        sqlSessionFactory.setMapperLocations(new PathMatchingResourcePatternResolver()
                .getResources("classpath*:mapper/master/*Mapper.xml"));

        MybatisConfiguration configuration = new MybatisConfiguration();
        configuration.setMapUnderscoreToCamelCase(true);
        configuration.setDefaultEnumTypeHandler(MybatisEnumTypeHandler.class);
        sqlSessionFactory.setConfiguration(configuration);

        GlobalConfig globalConfig = new GlobalConfig();
        globalConfig.setMetaObjectHandler(new DateMetaObjectHandler());
        sqlSessionFactory.setGlobalConfig(globalConfig);

        PaginationInterceptor paginationInterceptor = new PaginationInterceptor();
        paginationInterceptor.setLimit(CommonConstants.DEFAULT_PAGINATION_LIMIT);
        sqlSessionFactory.setPlugins(paginationInterceptor);
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

## Slave MybatisPlus 配置
```java
import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.config.GlobalConfig;
import com.baomidou.mybatisplus.extension.handlers.MybatisEnumTypeHandler;
import com.baomidou.mybatisplus.extension.plugins.PaginationInterceptor;
import com.baomidou.mybatisplus.extension.spring.MybatisSqlSessionFactoryBean;
import com.zhengcheng.common.constant.CommonConstants;
import com.zhengcheng.mybatis.plus.config.DateMetaObjectHandler;
import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.SqlSessionTemplate;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;

/**
 * SlaveMybatisPlusConfig
 *
 * @author quansheng1.zhang
 * @since 2020/10/30 17:39
 */
@Configuration
@MapperScan(basePackages = "com.zhengcheng.magic.domain.mapper.slave*", sqlSessionTemplateRef = "slaveSqlSessionTemplate")
@ConditionalOnClass({SqlSessionFactory.class, SqlSessionFactoryBean.class})
public class SlaveMybatisPlusConfig {

    private final DataSource dataSource;

    public SlaveMybatisPlusConfig(@Qualifier("slaveHikariDataSource") DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Bean
    public SqlSessionFactory slaveSqlSessionFactory() throws Exception {
        MybatisSqlSessionFactoryBean sqlSessionFactory = new MybatisSqlSessionFactoryBean();
        sqlSessionFactory.setDataSource(dataSource);
        sqlSessionFactory.setTypeEnumsPackage("com.zhengcheng.magic.slave.domain.enums");
        sqlSessionFactory.setTypeAliasesPackage("com.zhengcheng.magic.slave.domain.enums");
        sqlSessionFactory.setMapperLocations(new PathMatchingResourcePatternResolver()
                .getResources("classpath*:mapper/slave/*Mapper.xml"));

        MybatisConfiguration configuration = new MybatisConfiguration();
        configuration.setMapUnderscoreToCamelCase(true);
        configuration.setDefaultEnumTypeHandler(MybatisEnumTypeHandler.class);
        sqlSessionFactory.setConfiguration(configuration);

        GlobalConfig globalConfig = new GlobalConfig();
        globalConfig.setMetaObjectHandler(new DateMetaObjectHandler());
        sqlSessionFactory.setGlobalConfig(globalConfig);

        PaginationInterceptor paginationInterceptor = new PaginationInterceptor();
        paginationInterceptor.setLimit(CommonConstants.DEFAULT_PAGINATION_LIMIT);
        sqlSessionFactory.setPlugins(paginationInterceptor);
        return sqlSessionFactory.getObject();
    }

    @Bean("slaveSqlSessionTemplate")
    public SqlSessionTemplate slaveSqlSessionTemplate() throws Exception {
        return new SqlSessionTemplate(slaveSqlSessionFactory());
    }

    @Bean
    public PlatformTransactionManager slaveTransactionManager() {
        return new DataSourceTransactionManager(dataSource);
    }

}
```

## 属性信息

::: tip 特别提示
请注意`mysql-connector-java 5.1` 升级到 `mysql-connector-java 8.0`后属性配置的区别，也需要注意[mysql-connector-java与Mysql、Java的对应版本](https://dev.mysql.com/doc/connector-j/5.1/en/connector-j-versions.html)
:::

```properties
spring.datasource.hikari.master.jdbc-url=jdbc:mysql://127.0.0.1:3306/zm-ai?useUnicode=true&characterEncoding=UTF-8&autoReconnect=true&useSSL=false&zeroDateTimeBehavior=convertToNull&allowMultiQueries=true&serverTimezone=GMT%2B8
spring.datasource.hikari.master.driver-class-name=com.mysql.cj.jdbc.Driver
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

spring.datasource.hikari.slave.jdbc-url=jdbc:mysql://127.0.0.1:3306/zm-ai?useUnicode=true&characterEncoding=UTF-8&autoReconnect=true&useSSL=false&zeroDateTimeBehavior=convertToNull&allowMultiQueries=true&serverTimezone=GMT%2B8
spring.datasource.hikari.slave.driver-class-name=com.mysql.cj.jdbc.Driver
spring.datasource.hikari.slave.type=com.zaxxer.hikari.HikariDataSource
spring.datasource.hikari.slave.hikari.auto-commit=true
spring.datasource.hikari.slave.hikari.connection-test-query=SELECT 1
spring.datasource.hikari.slave.hikari.connection-timeout=30000
spring.datasource.hikari.slave.hikari.idle-timeout=180000
spring.datasource.hikari.slave.hikari.max-lifetime=1800000
spring.datasource.hikari.slave.hikari.maximum-pool-size=10
spring.datasource.hikari.slave.hikari.minimum-idle=5
spring.datasource.hikari.slave.name=slave
spring.datasource.hikari.slave.username=root
spring.datasource.hikari.slave.password=root
```

---

**参考文档**
- [动态数据源](https://github.com/baomidou/dynamic-datasource-spring-boot-starter)
