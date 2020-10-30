# Feign

## **安装**

在 Maven 工程中使用

```xml
  <dependency>
        <groupId>com.zhengcheng</groupId>
        <artifactId>zc-feign-spring-boot-starter</artifactId>
  </dependency>
```

自动配置如下（**注意FeignClient路径**）：
```java
package com.zhengcheng.feign;

import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;
import com.netflix.hystrix.strategy.HystrixPlugins;
import com.netflix.hystrix.strategy.concurrency.HystrixConcurrencyStrategy;
import com.netflix.hystrix.strategy.eventnotifier.HystrixEventNotifier;
import com.netflix.hystrix.strategy.executionhook.HystrixCommandExecutionHook;
import com.netflix.hystrix.strategy.metrics.HystrixMetricsPublisher;
import com.netflix.hystrix.strategy.properties.HystrixPropertiesStrategy;
import com.zhengcheng.common.constant.CommonConstants;
import com.zhengcheng.feign.strategy.MdcHystrixConcurrencyStrategy;
import feign.Logger;
import feign.RequestInterceptor;
import feign.RequestTemplate;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.cloud.openfeign.FeignLoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Feign 统一配置
 *
 * @author :    quansheng.zhang
 * @date :    2019/7/28 21:31
 */
@Slf4j
@EnableFeignClients("com.zhengcheng.**.feign.**")
@ConditionalOnClass(RequestInterceptor.class)
@Configuration
public class FeignAutoConfiguration implements RequestInterceptor {

    /**
     * Feign 日志级别
     */
    @Bean
    Logger.Level feignLoggerLevel() {
        return Logger.Level.FULL;
    }

    /**
     * 自定义INFO日志
     */
    @Bean
    FeignLoggerFactory infoFeignLoggerFactory() {
        return new InfoFeignLoggerFactory();
    }

    @Override
    public void apply(RequestTemplate requestTemplate) {
        String traceId = MDC.get(CommonConstants.TRACE_ID);
        if (StrUtil.isEmptyOrUndefined(traceId)) {
            // 一些接口的调用需要实现幂等，比如消息发送，如果使用requestId就可以方便服务方实现幂等
            requestTemplate.header(CommonConstants.TRACE_ID, IdUtil.fastSimpleUUID());
        } else {
            requestTemplate.header(CommonConstants.TRACE_ID, traceId);
        }
    }

    public FeignAutoConfiguration() {
        try {
            HystrixConcurrencyStrategy mdcTarget = new MdcHystrixConcurrencyStrategy();
            HystrixConcurrencyStrategy strategy = HystrixPlugins.getInstance().getConcurrencyStrategy();
            if (strategy instanceof MdcHystrixConcurrencyStrategy) {
                return;
            }
            HystrixCommandExecutionHook commandExecutionHook = HystrixPlugins.getInstance().getCommandExecutionHook();
            HystrixEventNotifier eventNotifier = HystrixPlugins.getInstance().getEventNotifier();
            HystrixMetricsPublisher metricsPublisher = HystrixPlugins.getInstance().getMetricsPublisher();
            HystrixPropertiesStrategy propertiesStrategy = HystrixPlugins.getInstance().getPropertiesStrategy();
            HystrixPlugins.reset();
            HystrixPlugins.getInstance().registerConcurrencyStrategy(mdcTarget);
            HystrixPlugins.getInstance().registerCommandExecutionHook(commandExecutionHook);
            HystrixPlugins.getInstance().registerEventNotifier(eventNotifier);
            HystrixPlugins.getInstance().registerMetricsPublisher(metricsPublisher);
            HystrixPlugins.getInstance().registerPropertiesStrategy(propertiesStrategy);
        } catch (Exception e) {
            log.error("Failed to register Hystrix Concurrency Strategy", e);
        }
    }
}
```

## 属性配置

启用okhttp3的配置

```properties
feign.httpclient.enabled = false
feign.okhttp.enabled = true
feign.okhttp3.read-timeout.milliseconds = 3000
feign.okhttp3.connect-timeout.milliseconds = 3000
feign.okhttp3.write-timeout.milliseconds = 60000
```

> 更多设置请参考[Feign官方文档]

- 推荐设置 feign.hystrix.enabled=true , 打开feign的熔断
- 自动配置修改了Feign的日志输出为**INFO**级别
- 增加了开启hystrix以后，对Feign的分布式链路日志追踪的配置


## 最佳实践

::: tip 特别说明
 feign 的请求使用SpringMvc的注解，并且要求必须有回退且使用工厂模式
:::

### FeignClient

```java
@FeignClient(name = "MARRY", fallbackFactory = MarryFeignClientFallbackFactory.class)
public interface MarryFeignClient {

    @GetMapping("/activities/match")
    Result<List<Long>> match();

    @GetMapping("/activities/match/{id}")
    Result<List<Long>> match(@PathVariable("id") Long id);
}
```

### FallbackFactory

```java
@Slf4j
@Component
public class MarryFeignClientFallbackFactory implements FallbackFactory<MarryFeignClient> {
    @Override
    public MarryFeignClient create(Throwable throwable) {
        return new MarryFeignClient() {
            @Override
            public Result<List<Long>> match() {
                log.error("match,fallback;reason was:{}", throwable.getMessage(), throwable);
                return Result.fallbackResult();
            }

            @Override
            public Result<List<Long>> match(Long id) {
                log.error("match,fallback;reason was:{}", throwable.getMessage(), throwable);
                return Result.fallbackResult();
            }
        };
    }
}
```


::: warning 注意
禁止使用原生Feign注解调用feign接口
```java
    @RequestLine(value = "GET /activities/match")
    Result<List<Long>> match();
```
:::


::: warning 注意
禁止使用非工厂模式的fallback
```java
@FeignClient(name = "MARRY", fallbackFactory = MarryFeignClientFallback.class)
```
:::


## Feign OAuth2

> 在使用`spring-security-oauth2` 的情况下，服务之间传递当前登录用户信息需要手动配置Feign OAuth2 拦截器

```java
public class FeignInterceptorConfig {

    /**
     * 使用feign client访问别的微服务时，将access_token放入参数或者header ，Authorization:Bearer xxx
     * 或者url?access_token=xxx
     */
    @Bean
    public RequestInterceptor requestInterceptor() {
        RequestInterceptor requestInterceptor = template -> {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null) {
                if (authentication instanceof OAuth2Authentication) {
                    OAuth2AuthenticationDetails details = (OAuth2AuthenticationDetails) authentication.getDetails();
                    template.header("Authorization", OAuth2AccessToken.BEARER_TYPE + " " + details.getTokenValue());
                    template.header(FeignAutoConfiguration.REQUEST_ID, IdUtil.fastSimpleUUID());
                }
            }
        };
        return requestInterceptor;
    }
}
```


