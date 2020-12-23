# 携程 Apollo 整合 Zuul 网关实现动态网关刷新

## ZuulPropertiesRefresher

```java
import com.ctrip.framework.apollo.model.ConfigChangeEvent;
import com.ctrip.framework.apollo.spring.annotation.ApolloConfigChangeListener;
import com.zhangmen.brain.tr.gateway.common.constant.GatewayConstants;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.context.environment.EnvironmentChangeEvent;
import org.springframework.cloud.context.scope.refresh.RefreshScope;
import org.springframework.cloud.netflix.zuul.RoutesRefreshedEvent;
import org.springframework.cloud.netflix.zuul.filters.RouteLocator;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Component;

/**
 * ZuulPropertiesRefresher
 *
 * @author quansheng1.zhang
 * @since 2020/12/14 16:04
 */
@Slf4j
@Component
public class ZuulPropertiesRefresher implements ApplicationContextAware {

    private ApplicationContext applicationContext;

    private final RefreshScope refreshScope;

    public ZuulPropertiesRefresher(RefreshScope refreshScope) {
        this.refreshScope = refreshScope;
    }

    @Autowired
    private RouteLocator routeLocator;

    @ApolloConfigChangeListener(interestedKeyPrefixes = "zuul.")
    public void onChange(ConfigChangeEvent changeEvent) {
        refreshZuulProperties(changeEvent);
    }

    private void refreshZuulProperties(ConfigChangeEvent changeEvent) {
        log.info("Refreshing zuul properties!");

        /**
         * rebind configuration beans, e.g. ZuulProperties
         * @see org.springframework.cloud.context.properties.ConfigurationPropertiesRebinder#onApplicationEvent
         */
        this.applicationContext.publishEvent(new EnvironmentChangeEvent(changeEvent.changedKeys()));

        refreshScope.refresh(GatewayConstants.ZUUL_PROPERTIES_BEAN);

        /**
         * refresh routes
         * @see org.springframework.cloud.netflix.zuul.ZuulServerAutoConfiguration.ZuulRefreshListener#onApplicationEvent
         */
        this.applicationContext.publishEvent(new RoutesRefreshedEvent(routeLocator));

        log.info("Zuul properties refreshed!");
    }

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        this.applicationContext = applicationContext;
    }

}
```

## 重新定义 ZuulProperties ，加上 @RefreshScope 注解，动态刷新

```java
  /**
     * 重新定义 ZuulProperties ，加上 @RefreshScope 注解，动态刷新
     *
     * @return ZuulProperties
     */
    @Primary
    @Bean(GatewayConstants.ZUUL_PROPERTIES_BEAN)
    @ConfigurationProperties("zuul")
    @RefreshScope
    public ZuulProperties zuulProperties() {
        return new ZuulProperties();
    }
```

`DiscoveryClientRouteLocator` 中使用`ZuulProperties`如下（不能使用`@Resource`或`@Autowired`注解方式引用）
```java
// ...
	public DiscoveryClientRouteLocator(String servletPath, DiscoveryClient discovery,
			ZuulProperties properties, ServiceInstance localServiceInstance) {
		super(servletPath, properties);

		if (properties.isIgnoreLocalService() && localServiceInstance != null) {
			String localServiceId = localServiceInstance.getServiceId();
			if (!properties.getIgnoredServices().contains(localServiceId)) {
				properties.getIgnoredServices().add(localServiceId);
			}
		}
		this.serviceRouteMapper = new SimpleServiceRouteMapper();
		this.discovery = discovery;
		this.properties = properties;
	}
// ...
```

## 网关配置

```properties
# app-name 是项目名
zuul.routes.app-name.path = /api/app-name/**
zuul.routes.app-name.serviceId = app-name
```

---
**参考文档**
- [Spring Cloud Zuul](https://cloud.spring.io/spring-cloud-static/Greenwich.SR5/single/spring-cloud.html#_router_and_filter_zuul)
- [演示Spring Cloud Zuul如何通过Apollo配置中心实现动态路由](https://github.com/ctripcorp/apollo-use-cases/tree/master/spring-cloud-zuul)