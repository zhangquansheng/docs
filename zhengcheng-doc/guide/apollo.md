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

## Spring Placeholder 的使用

详细请看[官方文档](https://github.com/ctripcorp/apollo/wiki/Java%E5%AE%A2%E6%88%B7%E7%AB%AF%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97#322-spring-placeholder%E7%9A%84%E4%BD%BF%E7%94%A8)。

需要注意的是，在`Spring Boot`项目中，`@ConfigurationProperties`如果需要在`Apollo`配置变化时自动更新注入的值，需要配合使用`EnvironmentChangeEvent`或`RefreshScope`。具体代码如下：

```java
import com.ctrip.framework.apollo.model.ConfigChangeEvent;
import com.ctrip.framework.apollo.spring.annotation.ApolloConfigChangeListener;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeansException;
import org.springframework.boot.autoconfigure.AutoConfigureAfter;
import org.springframework.boot.autoconfigure.AutoConfigureOrder;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.web.servlet.WebMvcAutoConfiguration;
import org.springframework.cloud.context.environment.EnvironmentChangeEvent;
import org.springframework.cloud.context.scope.refresh.RefreshScope;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.lang.NonNull;

/**
 * ApolloRefreshConfiguration
 *
 * @author quansheng1.zhang
 * @since 2020/11/5 19:28
 */
@Slf4j
@AutoConfigureAfter(WebMvcAutoConfiguration.class)
@AutoConfigureOrder
@ConditionalOnProperty(value = "apollo.refresh.enabled", matchIfMissing = true)
@ConditionalOnClass(RefreshScope.class)
public class SpringBootApolloRefreshConfiguration implements ApplicationContextAware {

    ApplicationContext applicationContext;

    private final RefreshScope refreshScope;

    public SpringBootApolloRefreshConfiguration(final RefreshScope refreshScope) {
        this.refreshScope = refreshScope;

        log.info("------ SpringBoot Apollo 自动刷新配置 -----------------------------");
        log.info("------ 默认配置 apollo.refresh.enabled = true --------");
        log.info("----------------------------------------------------------------------------------------------------------------------");
    }

    /**
     * 这里指定Apollo的namespace，非常重要，如果不指定，默认只使用application
     *
     * @param changeEvent ConfigChangeEvent
     */
    @ApolloConfigChangeListener
    public void onChange(ConfigChangeEvent changeEvent) {
        for (String changedKey : changeEvent.changedKeys()) {
            log.info("apollo changed namespace:{} Key:{} value:{}", changeEvent.getNamespace(), changedKey, changeEvent.getChange(changedKey));
        }

        refreshProperties(changeEvent);
    }

    public void refreshProperties(ConfigChangeEvent changeEvent) {
        this.applicationContext.publishEvent(new EnvironmentChangeEvent(changeEvent.changedKeys()));
        refreshScope.refreshAll();
    }

    @Override
    public void setApplicationContext(@NonNull ApplicationContext applicationContext) throws BeansException {
        this.applicationContext = applicationContext;
    }

}

```





