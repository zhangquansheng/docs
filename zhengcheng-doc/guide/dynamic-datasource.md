# 多数据源配置 & dynamic-datasource-spring-boot-starter

如果使用`MyBatis-Plus`多数据源，推荐的[dynamic-datasource-spring-boot-starter](https://gitee.com/baomidou/dynamic-datasource-spring-boot-starter)。

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
     
    // 在原来的多数据源配置的基础之上，使用 dynamic-datasource-spring-boot-starter
    @Bean(name = "slaveHikariDataSource")
    @Qualifier("slaveHikariDataSource")
    public DataSource slaveHikariDataSource(DynamicDataSourceProperties properties,
        DynamicDataSourceProvider dynamicDataSourceProvider) {
        DynamicRoutingDataSource dataSource = new DynamicRoutingDataSource();
        dataSource.setPrimary(properties.getPrimary());
        dataSource.setStrict(properties.getStrict());
        dataSource.setStrategy(properties.getStrategy());
        dataSource.setProvider(dynamicDataSourceProvider);
        dataSource.setP6spy(properties.getP6spy());
        dataSource.setSeata(properties.getSeata());
        return dataSource;
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

## dynamic-datasource-spring-boot-starter 源码分析 

`Spring boot`提供了`AbstractRoutingDataSource`根据用户定义的规则选择当前的数据源，这样我们可以在执行查询之前，设置使用的数据源。
实现可动态路由的数据源，在每次数据库查询操作前执行。它的抽象方法 `determineCurrentLookupKey()` 决定使用哪个数据源。

`org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource` 源码的介绍：
```java
/**
 * Abstract {@link javax.sql.DataSource} implementation that routes {@link #getConnection()}
 * calls to one of various target DataSources based on a lookup key. The latter is usually
 * (but not necessarily) determined through some thread-bound transaction context.
 *
 * @author Juergen Hoeller
 * @since 2.0.1
 * @see #setTargetDataSources
 * @see #setDefaultTargetDataSource
 * @see #determineCurrentLookupKey()
 */
public abstract class AbstractRoutingDataSource extends AbstractDataSource implements InitializingBean {

	@Nullable
	private Map<Object, Object> targetDataSources;

	@Nullable
	private Object defaultTargetDataSource;

	private boolean lenientFallback = true;

	private DataSourceLookup dataSourceLookup = new JndiDataSourceLookup();

	@Nullable
	private Map<Object, DataSource> resolvedDataSources;

	@Nullable
	private DataSource resolvedDefaultDataSource;

	public void setTargetDataSources(Map<Object, Object> targetDataSources) {
		this.targetDataSources = targetDataSources;
	}

	public void setDefaultTargetDataSource(Object defaultTargetDataSource) {
		this.defaultTargetDataSource = defaultTargetDataSource;
	}

	public void setLenientFallback(boolean lenientFallback) {
		this.lenientFallback = lenientFallback;
	}

	public void setDataSourceLookup(@Nullable DataSourceLookup dataSourceLookup) {
		this.dataSourceLookup = (dataSourceLookup != null ? dataSourceLookup : new JndiDataSourceLookup());
	}

	@Override
	public void afterPropertiesSet() {
		if (this.targetDataSources == null) {
			throw new IllegalArgumentException("Property 'targetDataSources' is required");
		}
		this.resolvedDataSources = new HashMap<>(this.targetDataSources.size());
		this.targetDataSources.forEach((key, value) -> {
			Object lookupKey = resolveSpecifiedLookupKey(key);
			DataSource dataSource = resolveSpecifiedDataSource(value);
			this.resolvedDataSources.put(lookupKey, dataSource);
		});
		if (this.defaultTargetDataSource != null) {
			this.resolvedDefaultDataSource = resolveSpecifiedDataSource(this.defaultTargetDataSource);
		}
	}

	protected Object resolveSpecifiedLookupKey(Object lookupKey) {
		return lookupKey;
	}

	protected DataSource resolveSpecifiedDataSource(Object dataSource) throws IllegalArgumentException {
		if (dataSource instanceof DataSource) {
			return (DataSource) dataSource;
		}
		else if (dataSource instanceof String) {
			return this.dataSourceLookup.getDataSource((String) dataSource);
		}
		else {
			throw new IllegalArgumentException(
					"Illegal data source value - only [javax.sql.DataSource] and String supported: " + dataSource);
		}
	}


	@Override
	public Connection getConnection() throws SQLException {
		return determineTargetDataSource().getConnection();
	}

	@Override
	public Connection getConnection(String username, String password) throws SQLException {
		return determineTargetDataSource().getConnection(username, password);
	}

	@Override
	@SuppressWarnings("unchecked")
	public <T> T unwrap(Class<T> iface) throws SQLException {
		if (iface.isInstance(this)) {
			return (T) this;
		}
		return determineTargetDataSource().unwrap(iface);
	}

	@Override
	public boolean isWrapperFor(Class<?> iface) throws SQLException {
		return (iface.isInstance(this) || determineTargetDataSource().isWrapperFor(iface));
	}

	protected DataSource determineTargetDataSource() {
		Assert.notNull(this.resolvedDataSources, "DataSource router not initialized");
		Object lookupKey = determineCurrentLookupKey();
		DataSource dataSource = this.resolvedDataSources.get(lookupKey);
		if (dataSource == null && (this.lenientFallback || lookupKey == null)) {
			dataSource = this.resolvedDefaultDataSource;
		}
		if (dataSource == null) {
			throw new IllegalStateException("Cannot determine target DataSource for lookup key [" + lookupKey + "]");
		}
		return dataSource;
	}

	@Nullable
	protected abstract Object determineCurrentLookupKey();

}
```

同理，`dynamic-datasource-spring-boot-starter` 的具体实现如下：

### 动态数据源核心自动配置类 DynamicDataSourceAutoConfiguration

```java
/**
 * 动态数据源核心自动配置类
 *
 * @author TaoYu Kanyuxia
 * @see DynamicDataSourceProvider
 * @see DynamicDataSourceStrategy
 * @see DynamicRoutingDataSource
 * @since 1.0.0
 */
@Slf4j
@Configuration
@AllArgsConstructor
@EnableConfigurationProperties(DynamicDataSourceProperties.class)
@AutoConfigureBefore(value = DataSourceAutoConfiguration.class, name = "com.alibaba.druid.spring.boot.autoconfigure.DruidDataSourceAutoConfigure")
@Import(value = {DruidDynamicDataSourceConfiguration.class, DynamicDataSourceCreatorAutoConfiguration.class, DynamicDataSourceHealthCheckConfiguration.class})
@ConditionalOnProperty(prefix = DynamicDataSourceProperties.PREFIX, name = "enabled", havingValue = "true", matchIfMissing = true)
public class DynamicDataSourceAutoConfiguration {

    private final DynamicDataSourceProperties properties;

    @Bean
    @ConditionalOnMissingBean
    public DynamicDataSourceProvider dynamicDataSourceProvider() {
        Map<String, DataSourceProperty> datasourceMap = properties.getDatasource();
        return new YmlDynamicDataSourceProvider(datasourceMap);
    }

        
   // 定义DataSource的Bean，DynamicRoutingDataSource利用DynamicDataSourceProvider生成了“库名->数据源”的map
   // 在获取真实数据源的时候，再根据ThreadLocal里的变量，决定选取map中的那个datasource
   // 注意properties.getPrimary()，这个默认是master，即默认走主库
    @Bean
    @ConditionalOnMissingBean
    public DataSource dataSource(DynamicDataSourceProvider dynamicDataSourceProvider) {
        DynamicRoutingDataSource dataSource = new DynamicRoutingDataSource();
        dataSource.setPrimary(properties.getPrimary());
        dataSource.setStrict(properties.getStrict());
        dataSource.setStrategy(properties.getStrategy());
        dataSource.setProvider(dynamicDataSourceProvider);
        dataSource.setP6spy(properties.getP6spy());
        dataSource.setSeata(properties.getSeata());
        return dataSource;
    }

    @Role(value = BeanDefinition.ROLE_INFRASTRUCTURE)
    @Bean
    public Advisor dynamicDatasourceAnnotationAdvisor(DsProcessor dsProcessor) {
        DynamicDataSourceAnnotationInterceptor interceptor = new DynamicDataSourceAnnotationInterceptor(properties.isAllowedPublicOnly(), dsProcessor);
        DynamicDataSourceAnnotationAdvisor advisor = new DynamicDataSourceAnnotationAdvisor(interceptor);
        advisor.setOrder(properties.getOrder());
        return advisor;
    }

    @Role(value = BeanDefinition.ROLE_INFRASTRUCTURE)
    @ConditionalOnProperty(prefix = DynamicDataSourceProperties.PREFIX, name = "seata", havingValue = "false", matchIfMissing = true)
    @Bean
    public Advisor dynamicTransactionAdvisor() {
        AspectJExpressionPointcut pointcut = new AspectJExpressionPointcut();
        pointcut.setExpression("@annotation(com.baomidou.dynamic.datasource.annotation.DSTransactional)");
        return new DefaultPointcutAdvisor(pointcut, new DynamicLocalTransactionAdvisor());
    }

    @Bean
    @ConditionalOnMissingBean
    public DsProcessor dsProcessor(BeanFactory beanFactory) {
        DsHeaderProcessor headerProcessor = new DsHeaderProcessor();
        DsSessionProcessor sessionProcessor = new DsSessionProcessor();
        DsSpelExpressionProcessor spelExpressionProcessor = new DsSpelExpressionProcessor();
        spelExpressionProcessor.setBeanResolver(new BeanFactoryResolver(beanFactory));
        headerProcessor.setNextProcessor(sessionProcessor);
        sessionProcessor.setNextProcessor(spelExpressionProcessor);
        return headerProcessor;
    }

}
``` 

### 核心动态数据源组件 DynamicRoutingDataSource

```java
/**
 * 核心动态数据源组件
 *
 * @author TaoYu Kanyuxia
 * @since 1.0.0
 */
@Slf4j
public class DynamicRoutingDataSource extends AbstractRoutingDataSource implements InitializingBean, DisposableBean {

    private static final String UNDERLINE = "_";
    /**
     * 所有数据库
     */
    private final Map<String, DataSource> dataSourceMap = new ConcurrentHashMap<>();
    /**
     * 分组数据库
     */
    private final Map<String, GroupDataSource> groupDataSources = new ConcurrentHashMap<>();
    @Setter
    private DynamicDataSourceProvider provider;
    @Setter
    private Class<? extends DynamicDataSourceStrategy> strategy = LoadBalanceDynamicDataSourceStrategy.class;
    @Setter
    private String primary = "master";
    @Setter
    private Boolean strict = false;
    @Setter
    private Boolean p6spy = false;
    @Setter
    private Boolean seata = false;

    @Override
    public DataSource determineDataSource() {
        String dsKey = DynamicDataSourceContextHolder.peek();
        return getDataSource(dsKey);
    }

    private DataSource determinePrimaryDataSource() {
        log.debug("dynamic-datasource switch to the primary datasource");
        DataSource dataSource = dataSourceMap.get(primary);
        if (dataSource != null) {
            return dataSource;
        }
        GroupDataSource groupDataSource = groupDataSources.get(primary);
        if (groupDataSource != null) {
            return groupDataSource.determineDataSource();
        }
        throw new CannotFindDataSourceException("dynamic-datasource can not find primary datasource");
    }

    /**
     * 获取当前所有的数据源
     *
     * @return 当前所有数据源
     */
    public Map<String, DataSource> getCurrentDataSources() {
        return dataSourceMap;
    }

    /**
     * 获取的当前所有的分组数据源
     *
     * @return 当前所有的分组数据源
     */
    public Map<String, GroupDataSource> getCurrentGroupDataSources() {
        return groupDataSources;
    }

    /**
     * 获取数据源
     *
     * @param ds 数据源名称
     * @return 数据源
     */
    public DataSource getDataSource(String ds) {
        if (StringUtils.isEmpty(ds)) {
            return determinePrimaryDataSource();
        } else if (!groupDataSources.isEmpty() && groupDataSources.containsKey(ds)) {
            log.debug("dynamic-datasource switch to the datasource named [{}]", ds);
            return groupDataSources.get(ds).determineDataSource();
        } else if (dataSourceMap.containsKey(ds)) {
            log.debug("dynamic-datasource switch to the datasource named [{}]", ds);
            return dataSourceMap.get(ds);
        }
        if (strict) {
            throw new CannotFindDataSourceException("dynamic-datasource could not find a datasource named" + ds);
        }
        return determinePrimaryDataSource();
    }

    /**
     * 添加数据源
     *
     * @param ds         数据源名称
     * @param dataSource 数据源
     */
    public synchronized void addDataSource(String ds, DataSource dataSource) {
        DataSource oldDataSource = dataSourceMap.put(ds, dataSource);
        // 新数据源添加到分组
        this.addGroupDataSource(ds, dataSource);
        // 关闭老的数据源
        if (oldDataSource != null) {
            try {
                closeDataSource(oldDataSource);
            } catch (Exception e) {
                log.error("dynamic-datasource - remove the database named [{}]  failed", ds, e);
            }
        }
        log.info("dynamic-datasource - add a datasource named [{}] success", ds);
    }

    /**
     * 新数据源添加到分组
     *
     * @param ds         新数据源的名字
     * @param dataSource 新数据源
     */
    private void addGroupDataSource(String ds, DataSource dataSource) {
        if (ds.contains(UNDERLINE)) {
            String group = ds.split(UNDERLINE)[0];
            GroupDataSource groupDataSource = groupDataSources.get(group);
            if (groupDataSource == null) {
                try {
                    groupDataSource = new GroupDataSource(group, strategy.getDeclaredConstructor().newInstance());
                    groupDataSources.put(group, groupDataSource);
                } catch (Exception e) {
                    throw new RuntimeException("dynamic-datasource - add the datasource named " + ds + " error", e);
                }
            }
            groupDataSource.addDatasource(ds, dataSource);
        }
    }

    /**
     * 删除数据源
     *
     * @param ds 数据源名称
     */
    public synchronized void removeDataSource(String ds) {
        if (!StringUtils.hasText(ds)) {
            throw new RuntimeException("remove parameter could not be empty");
        }
        if (primary.equals(ds)) {
            throw new RuntimeException("could not remove primary datasource");
        }
        if (dataSourceMap.containsKey(ds)) {
            DataSource dataSource = dataSourceMap.remove(ds);
            try {
                closeDataSource(dataSource);
            } catch (Exception e) {
                log.error("dynamic-datasource - remove the database named [{}]  failed", ds, e);
            }

            if (ds.contains(UNDERLINE)) {
                String group = ds.split(UNDERLINE)[0];
                if (groupDataSources.containsKey(group)) {
                    DataSource oldDataSource = groupDataSources.get(group).removeDatasource(ds);
                    if (oldDataSource == null) {
                        if (log.isWarnEnabled()) {
                            log.warn("fail for remove datasource from group. dataSource: {} ,group: {}", ds, group);
                        }
                    }
                }
            }
            log.info("dynamic-datasource - remove the database named [{}] success", ds);
        } else {
            log.warn("dynamic-datasource - could not find a database named [{}]", ds);
        }
    }

    /**
     * 关闭数据源
     */
    private void closeDataSource(DataSource dataSource) throws Exception {
        ((ItemDataSource) dataSource).close();
    }

    @Override
    public void destroy() throws Exception {
        log.info("dynamic-datasource start closing ....");
        for (Map.Entry<String, DataSource> item : dataSourceMap.entrySet()) {
            closeDataSource(item.getValue());
        }
        log.info("dynamic-datasource all closed success,bye");
    }

    @Override
    public void afterPropertiesSet() throws Exception {
        // 检查开启了配置但没有相关依赖
        checkEnv();
        // 添加并分组数据源
        Map<String, DataSource> dataSources = provider.loadDataSources();
        for (Map.Entry<String, DataSource> dsItem : dataSources.entrySet()) {
            addDataSource(dsItem.getKey(), dsItem.getValue());
        }
        // 检测默认数据源是否设置
        if (groupDataSources.containsKey(primary)) {
            log.info("dynamic-datasource initial loaded [{}] datasource,primary group datasource named [{}]", dataSources.size(), primary);
        } else if (dataSourceMap.containsKey(primary)) {
            log.info("dynamic-datasource initial loaded [{}] datasource,primary datasource named [{}]", dataSources.size(), primary);
        } else {
            log.warn("dynamic-datasource initial loaded [{}] datasource,Please add your primary datasource or check your configuration", dataSources.size());
        }
    }

    private void checkEnv() {
        if (p6spy) {
            try {
                Class.forName("com.p6spy.engine.spy.P6DataSource");
                log.info("dynamic-datasource detect P6SPY plugin and enabled it");
            } catch (Exception e) {
                throw new RuntimeException("dynamic-datasource enabled P6SPY ,however without p6spy dependency", e);
            }
        }
        if (seata) {
            try {
                Class.forName("io.seata.rm.datasource.DataSourceProxy");
                log.info("dynamic-datasource detect ALIBABA SEATA and enabled it");
            } catch (Exception e) {
                throw new RuntimeException("dynamic-datasource enabled ALIBABA SEATA,however without seata dependency", e);
            }
        }
    }
}
```

主要原理是：
1. 自定义一个动态数据源上下文类`DynamicDataSourceContextHolder`，该类依靠一个`ThreadLocal`的类变量类标识当前线程是需要访问哪一个数据源
```java
/**
 * 核心基于ThreadLocal的切换数据源工具类
 *
 * @author TaoYu Kanyuxia
 * @since 1.0.0
 */
public final class DynamicDataSourceContextHolder {

    /**
     * 为什么要用链表存储(准确的是栈)
     * <pre>
     * 为了支持嵌套切换，如ABC三个service都是不同的数据源
     * 其中A的某个业务要调B的方法，B的方法需要调用C的方法。一级一级调用切换，形成了链。
     * 传统的只设置当前线程的方式不能满足此业务需求，必须使用栈，后进先出。
     * </pre>
     */
    private static final ThreadLocal<Deque<String>> LOOKUP_KEY_HOLDER = new NamedThreadLocal<Deque<String>>("dynamic-datasource") {
        @Override
        protected Deque<String> initialValue() {
            return new ArrayDeque<>();
        }
    };

    private DynamicDataSourceContextHolder() {
    }

    /**
     * 获得当前线程数据源
     *
     * @return 数据源名称
     */
    public static String peek() {
        return LOOKUP_KEY_HOLDER.get().peek();
    }

    /**
     * 设置当前线程数据源
     * <p>
     * 如非必要不要手动调用，调用后确保最终清除
     * </p>
     *
     * @param ds 数据源名称
     */
    public static String push(String ds) {
        String dataSourceStr = StringUtils.isEmpty(ds) ? "" : ds;
        LOOKUP_KEY_HOLDER.get().push(dataSourceStr);
        return dataSourceStr;
    }

    /**
     * 清空当前线程数据源
     * <p>
     * 如果当前线程是连续切换数据源 只会移除掉当前线程的数据源名称
     * </p>
     */
    public static void poll() {
        Deque<String> deque = LOOKUP_KEY_HOLDER.get();
        deque.poll();
        if (deque.isEmpty()) {
            LOOKUP_KEY_HOLDER.remove();
        }
    }

    /**
     * 强制清空本地线程
     * <p>
     * 防止内存泄漏，如手动调用了push可调用此方法确保清除
     * </p>
     */
    public static void clear() {
        LOOKUP_KEY_HOLDER.remove();
    }
}
```

2. 创建一个动态数据源，继承自`自定义`的`com.baomidou.dynamic.datasource.ds.AbstractRoutingDataSource`。实现了`determineDataSource`方法，该方法唯一需要做的事情就是从`DynamicDataSourceContextHolder`获取当前需要访问的数据库名称。
```java
/**
 * 抽象动态获取数据源
 *
 * @author TaoYu
 * @since 2.2.0
 */
public abstract class AbstractRoutingDataSource extends AbstractDataSource {

    protected abstract DataSource determineDataSource();

    @Override
    public Connection getConnection() throws SQLException {
        String xid = TransactionContext.getXID();
        if (StringUtils.isEmpty(xid)) {
            return determineDataSource().getConnection();
        } else {
            String ds = DynamicDataSourceContextHolder.peek();
            ConnectionProxy connection = ConnectionFactory.getConnection(ds);
            return connection == null ? getConnectionProxy(ds, determineDataSource().getConnection()) : connection;
        }
    }

    @Override
    public Connection getConnection(String username, String password) throws SQLException {
        String xid = TransactionContext.getXID();
        if (StringUtils.isEmpty(xid)) {
            return determineDataSource().getConnection(username, password);
        } else {
            String ds = DynamicDataSourceContextHolder.peek();
            ConnectionProxy connection = ConnectionFactory.getConnection(ds);
            return connection == null ? getConnectionProxy(ds, determineDataSource().getConnection(username, password))
                    : connection;
        }
    }

    private Connection getConnectionProxy(String ds, Connection connection) {
        ConnectionProxy connectionProxy = new ConnectionProxy(connection, ds);
        ConnectionFactory.putConnection(ds, connectionProxy);
        return connectionProxy;
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> T unwrap(Class<T> iface) throws SQLException {
        if (iface.isInstance(this)) {
            return (T) this;
        }
        return determineDataSource().unwrap(iface);
    }

    @Override
    public boolean isWrapperFor(Class<?> iface) throws SQLException {
        return (iface.isInstance(this) || determineDataSource().isWrapperFor(iface));
    }
}
```

3. 自定义注解`@DS`，用于标识方法查询的数据库，然后利用一个切面，根据注解的属性，设置需要访问的数据源。
```java
/**
 * The core Annotation to switch datasource. It can be annotate at class or method.
 *
 * @author TaoYu Kanyuxia
 * @since 1.0.0
 */
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface DS {

    /**
     * groupName or specific database name or spring SPEL name.
     *
     * @return the database you want to switch
     */
    String value();
}
```
`AOP`如下：
```java
/**
 * Core Interceptor of Dynamic Datasource
 *
 * @author TaoYu
 * @since 1.2.0
 */
public class DynamicDataSourceAnnotationInterceptor implements MethodInterceptor {

    /**
     * The identification of SPEL.
     */
    private static final String DYNAMIC_PREFIX = "#";

    private final DataSourceClassResolver dataSourceClassResolver;
    private final DsProcessor dsProcessor;

    public DynamicDataSourceAnnotationInterceptor(Boolean allowedPublicOnly, DsProcessor dsProcessor) {
        dataSourceClassResolver = new DataSourceClassResolver(allowedPublicOnly);
        this.dsProcessor = dsProcessor;
    }

    @Override
    public Object invoke(MethodInvocation invocation) throws Throwable {
        String dsKey = determineDatasourceKey(invocation);
        //根据数据源的名称，获取数据源 
        DynamicDataSourceContextHolder.push(dsKey);
        try {
            return invocation.proceed();
        } finally {
            DynamicDataSourceContextHolder.poll();
        }
    }

    private String determineDatasourceKey(MethodInvocation invocation) {
        String key = dataSourceClassResolver.findDSKey(invocation.getMethod(), invocation.getThis());
        return (!key.isEmpty() && key.startsWith(DYNAMIC_PREFIX)) ? dsProcessor.determineDatasource(invocation, key) : key;
    }
}
```

## dynamic-datasource-spring-boot-starter 根据方法名实现读写分离（不推荐）

> 推荐[ShardingSphere-JDBC](https://shardingsphere.apache.org/document/current/cn/overview/)来实现读写分离，毕竟`dynamic-datasource-spring-boot-starter`更适合做切换数据源的工作。 

```java
/**
 * DataSourceAspect
 *
 * @author quansheng1.zhang
 * @since 2021/6/5 13:41
 */
@Aspect
@Component
@Slf4j
public class DataSourceAspect {

    private static final String MASTER = "master";

    private static final String SLAVE = "slave";

    @Pointcut("execution(* com.zhengcheng.magic.service..*.*(..)) || execution(* com.baomidou.mybatisplus.extension.service..*.*(..))")
    public void checkMethod() {}

    @SuppressWarnings({"RawTypeCanBeGeneric", "rawtypes"})
    @Before("checkMethod()")
    public void process(JoinPoint joinPoint) throws NoSuchMethodException, SecurityException {
        String methodName = joinPoint.getSignature().getName();
        Class clazz = joinPoint.getTarget().getClass();
        if (clazz.isAnnotationPresent(DS.class)) {
            return;
        }

        Class[] parameterTypes = ((MethodSignature)joinPoint.getSignature()).getMethod().getParameterTypes();
        Method method = clazz.getMethod(methodName, parameterTypes);
        if (method.isAnnotationPresent(DS.class)) {
            return;
        }
        if (methodName.startsWith("get") || methodName.startsWith("count") || methodName.startsWith("find")
            || methodName.startsWith("list") || methodName.startsWith("select") || methodName.startsWith("check")
            || methodName.startsWith("page")) {

            log.info("当前执行的读库：" + SLAVE);
            DynamicDataSourceContextHolder.push(SLAVE);
        } else {
            log.info("当前执行的写库：" + MASTER);
            DynamicDataSourceContextHolder.push(MASTER);
        }
    }

    @After("checkMethod()")
    public void afterAdvice() {
        DynamicDataSourceContextHolder.clear();
    }

}
```

在执行目标方法前，通过 `DynamicDataSourceContextHolder.push(SLAVE);` 设置数据源，执行完成以后，通过`DynamicDataSourceContextHolder.clear();`释放内存，以免产生内存泄漏（`ThreadLocal`）。

---
**参考文档**

- [动态数据源](https://github.com/baomidou/dynamic-datasource-spring-boot-starter)
