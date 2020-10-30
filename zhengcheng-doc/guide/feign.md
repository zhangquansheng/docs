# Feign

## 安装

在 Maven 工程中使用

```xml
  <dependency>
        <groupId>com.zhengcheng</groupId>
        <artifactId>zc-feign-spring-boot-starter</artifactId>
  </dependency>
```

## 配置

启用`okhttp3`的属性配置
```properties
feign.httpclient.enabled = false
feign.okhttp.enabled = true
feign.okhttp3.read-timeout.milliseconds = 3000
feign.okhttp3.connect-timeout.milliseconds = 3000
feign.okhttp3.write-timeout.milliseconds = 60000
```

> 更多设置请参考[Feign官方文档]

- 推荐设置 `feign.hystrix.enabled = true` , 打开`Feign`的熔断
- 自动配置修改了`Feign`的日志输出为**INFO**级别
- 增加了开启`hystrix`以后，对`Feign`的分布式链路日志追踪的配置

要求`Feign`接口的包路径满足以下条件（**否则不能自动扫描到FeignClient**）：
```java
@EnableFeignClients("com.zhengcheng.**.feign.**")
```

## 最佳实践

::: tip 特别说明
 feign 的请求使用`SpringMvc`的注解，并且要求必须有回退且使用工厂模式
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

> 在使用 `spring-security-oauth2` 的情况下，服务之间传递当前登录用户信息需要手动配置 Feign OAuth2 拦截器

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


