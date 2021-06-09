# 整合 Apollo


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
import cn.hutool.core.collection.CollectionUtil;
import cn.hutool.core.collection.ConcurrentHashSet;
import cn.hutool.core.util.StrUtil;
import com.ctrip.framework.apollo.model.ConfigChangeEvent;
import com.ctrip.framework.apollo.spring.annotation.ApolloConfigChangeListener;
import com.zhangmen.brain.solar.common.constant.CommonConstants;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.annotation.Value;
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

import java.util.List;

/**
 * ApolloRefreshConfiguration
 *
 * @author quansheng1.zhang
 * @since 2020/11/5 19:28
 */
@Slf4j
@AutoConfigureAfter(WebMvcAutoConfiguration.class)
@AutoConfigureOrder
@ConditionalOnProperty(value = "brain-solar.apollo.refresh.enabled", havingValue = "true", matchIfMissing = true)
@ConditionalOnClass(RefreshScope.class)
public class SpringBootApolloRefreshConfiguration implements ApplicationContextAware {

    ApplicationContext applicationContext;

    private final RefreshScope refreshScope;

    public SpringBootApolloRefreshConfiguration(final RefreshScope refreshScope) {
        this.refreshScope = refreshScope;

        log.info("------ SpringBoot Apollo 自动刷新配置 -----------------------------");
        log.info("------ 默认配置 brain-solar.apollo.refresh.enabled = true --------");
        log.info("----------------------------------------------------------------------------------------------------------------------");
    }

    @Value("#{'${brain-solar.apollo.refresh.name:}'.split(',')}")
    private List<String> names;

    private static ConcurrentHashSet<String> refreshedBeanSet = new ConcurrentHashSet<>(16);

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

        //使用 refreshScope.refreshAll(); 的风险很大，我们已经在生产上遇到过很多次事务相关的空值报错。
        if (CollectionUtil.isNotEmpty(names)) {
            names.forEach(name -> {
                if (StrUtil.isNotBlank(name)) {
                    refreshScope.refresh(name);
                    log.info("refresh bean {} success.", name);
                }
            });
        }

        // brain-solar-parent 中默认使用属性刷新
        changeEvent.changedKeys().forEach(changedKey -> {
            if (StrUtil.isBlank(changedKey)) {
                return;
            }

            String name = "";
            if (changedKey.startsWith(CommonConstants.ALIYUN_AK_PREFIX)) {
                name = "aliyunAkProperties";
            } else if (changedKey.startsWith(CommonConstants.OSS_PREFIX)) {
                name = "ossProperties";
            } else if (changedKey.startsWith(CommonConstants.ROCKETMQ_DEDUP_PREFIX)) {
                name = "rocketMQDedupProperties";
            } else if (changedKey.startsWith(CommonConstants.APP_PREFIX)) {
                name = "appProperties";
            }

            if (StrUtil.isNotBlank(name) && !refreshedBeanSet.contains(name)) {
                refreshScope.refresh(name);
                log.info("refresh bean {} success.", name);
                refreshedBeanSet.add(name);
            }

            // 支持对aop日志采集的关闭，默认打开，可通过配置api.log.enabled=false来关闭； ②、支持aop日志采样率配置，默认全部采集，可通过配置api.log.sampler.probability=x，其中x取值（0<=x<=1）。同时采样率支持动态更新，项目依赖apollo的刷新策略，具体使用如下：
            if (changedKey.startsWith("api.log.sampler")) {
                refreshScope.refresh("samplerProperties");
                refreshedBeanSet.add("samplerProperties");

                refreshScope.refresh("probabilityBasedSampler");
                refreshedBeanSet.add("probabilityBasedSampler");
            }
        });
        refreshedBeanSet.clear();
    }

    @Override
    public void setApplicationContext(@NonNull ApplicationContext applicationContext) throws BeansException {
        this.applicationContext = applicationContext;
    }

    public List<String> getNames() {
        return names;
    }

    public void setNames(List<String> names) {
        this.names = names;
    }

}
```

::: warning 注意
禁止直接使用 `refreshScope.refreshAll()`来刷新，这样会导致一些正在使用的单例`bean`被删除后，引发的错误。
:::

## 客户端设计

![client-architecture](/img/apollo/client-architecture.png)

上图简要描述了Apollo客户端的实现原理：

1. 客户端和服务端保持了一个长连接，从而能第一时间获得配置更新的推送。（通过`Http Long Polling`实现）`DeferredResult`
2. 客户端还会定时从Apollo配置中心服务端拉取应用的最新配置。
    - 这是一个fallback机制，为了防止推送机制失效导致配置不更新
    - 客户端定时拉取会上报本地版本，所以一般情况下，对于定时拉取的操作，服务端都会返回304 - Not Modified
    - 定时频率默认为每5分钟拉取一次，客户端也可以通过在运行时指定System Property: apollo.refreshInterval来覆盖，单位为分钟。
3. 客户端从Apollo配置中心服务端获取到应用的最新配置后，会保存在内存中
4. 客户端会把从服务端获取到的配置在本地文件系统缓存一份
    - 在遇到服务不可用，或网络不通的时候，依然能从本地恢复配置
5. 应用程序可以从Apollo客户端获取最新的配置、订阅配置更新通知



