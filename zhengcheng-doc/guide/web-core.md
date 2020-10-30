---
sidebarDepth: 3
---

# 核心模块

`zc-web-core-spring-boot-starter` 是 `zhengcheng` 框架Web服务核心通用组件。

## 安装

maven
```xml
  <dependency>
        <groupId>com.zhengcheng</groupId>
        <artifactId>zc-web-core-spring-boot-starter</artifactId>
  </dependency>
```

## 属性配置
```properties
server.port=${port:8080}

# 注意数据库URL中链接的配置参数（这里使用了主从配置方式） 
spring.datasource.url=jdbc:mysql:replication://127.0.0.1:3306,127.0.0.1:3306/magic?characterEncoding=UTF-8&useSSL=false&autoReconnect=true&allowMasterDownConnections=true&serverTimezone=GMT%2B8&zeroDateTimeBehavior=convertToNull&allowMultiQueries=true
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.datasource.type=com.zaxxer.hikari.HikariDataSource
spring.datasource.hikari.username=root
spring.datasource.hikari.password=root
spring.datasource.hikari.minimum-idle=2
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.idle-timeout=60000
spring.datasource.hikari.max-lifetime=600000
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.connection-test-query=SELECT 1
spring.datasource.hikari.auto-commit=true

spring.swagger.enable = true
spring.swagger.title = magic
spring.swagger.description = zhengcheng-parent magic
spring.swagger.license = Apache License, Version 2.0
spring.swagger.license-url = https://www.apache.org/licenses/LICENSE-2.0.html
spring.swagger.base-package = com.zhengcheng.magic.controller
spring.swagger.base-path = /**
spring.swagger.exclude-path = /error, /ops/**
```

## ExceptionControllerAdvice

通过 `@RestControllerAdvice` + `@ExceptionHandler` 的方式统一异常处理，

- [Spring MVC Exceptions](https://docs.spring.io/spring-framework/docs/current/spring-framework-reference/web.html#mvc-ann-exceptionhandler)
- 有关[@ControllerAdvice](https://docs.spring.io/spring-framework/docs/5.2.8.RELEASE/javadoc-api/org/springframework/web/bind/annotation/ControllerAdvice.html) 更多详细信息，请参见 javadoc。

## ControllerLogAspect

在现实的项目中我们经常会遇到系统出现异常或者问题, 为了方便定位问题，需要知道controller 调用的入参和traceId（链路ID）

这里使用的是Spring AOP结合注解对Controller进行切面打印日志

```java
@Slf4j
@Aspect
@ConditionalOnClass({ObjectMapper.class})
@Component
public class ControllerLogAspect {

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * 定义拦截规则：
     * 有@RequestMapping注解的方法。
     */
    @Pointcut("@within(org.springframework.web.bind.annotation.RequestMapping)")
    public void controllerMethodPointcut() {
    }

    @Around("controllerMethodPointcut()")
    public Object around(ProceedingJoinPoint pjp) throws Throwable {
        String pjpMethodInfo = this.getMethodInfo(pjp);
        log.info("{} | {}", pjpMethodInfo, this.getRequestInfo(pjp));
        long beginTime = System.currentTimeMillis();
        Object retObj = pjp.proceed();
        long costMs = System.currentTimeMillis() - beginTime;
        log.info("{} | {} | cost:{}ms", pjpMethodInfo, objectMapper.writeValueAsString(retObj), costMs);
        return retObj;
    }

    private String getMethodInfo(JoinPoint point) {
        StrBuilder sb = StrBuilder.create();
        String className = point.getSignature().getDeclaringType().getSimpleName();
        String methodName = point.getSignature().getName();
        sb.append(className).append(".").append(methodName);
        return sb.toString();
    }

    private String getRequestInfo(JoinPoint point) {
        StrBuilder sb = StrBuilder.create();
        try {
            HttpServletRequest request = ((ServletRequestAttributes) Objects.requireNonNull(RequestContextHolder.getRequestAttributes())).getRequest();
            String xGatewayUid = request.getHeader(CommonConstants.GATEWAY_UID_HEADER);
            String method = request.getMethod();
            sb.append("method:[").append(method).append("] | ");
            sb.append("requestPath:[").append(request.getRequestURI()).append("] | ");
            sb.append("X-GATEWAY-UID:[").append(Objects.isNull(xGatewayUid) ? "" : xGatewayUid).append("] | ");
            if (Method.POST.toString().equalsIgnoreCase(method)) {
                Object[] args = point.getArgs();
                if (args.length > 0) {
                    sb.append("args:");
                    for (Object arg : args) {
                        if (arg instanceof Serializable && !(arg instanceof MultipartFile)) {
                            sb.append(objectMapper.writeValueAsString(arg)).append(",");
                        }
                    }
                }
                Map<String, String[]> parameterMap = request.getParameterMap();
                if (parameterMap != null && parameterMap.size() > 0) {
                    sb.append("param:").append(objectMapper.writeValueAsString(parameterMap));
                }
            } else {
                sb.append("queryString:").append(request.getQueryString());
            }
        } catch (Exception e) {
            sb.append("Exception:").append(e.getMessage());
        }
        return sb.toString();
    }
}
```

## TraceIdInterceptor

### 链路日志拦截器

```java
/**
 * 路径拦截器
 *
 * @author :    zhangquansheng
 * @date :    2020/3/24 13:55
 */
@Slf4j
public class TraceIdInterceptor implements HandlerInterceptor {

    private String applicationName;

    public TraceIdInterceptor(String applicationName) {
        this.applicationName = applicationName;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object o) throws Exception {
        if (HttpMethod.OPTIONS.toString().equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String uri = request.getRequestURI();
        String xForwardedForHeader = request.getHeader("X-Forwarded-For");
        String remoteIp = request.getRemoteAddr();
        String traceId = request.getHeader(CommonConstants.TRACE_ID);
        if (StrUtil.isBlankOrUndefined(traceId)) {
            traceId = IdUtil.fastSimpleUUID();
            request.setAttribute(CommonConstants.TRACE_ID, traceId);
        }
        MDC.put(CommonConstants.TRACE_ID, traceId);
        log.info("applicationName:[{}], clientIp:[{}], X-Forwarded-For:[{}]", applicationName, remoteIp, xForwardedForHeader);
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object o, Exception e) throws Exception {
        MDC.clear();
    }

}
```

::: tip 特别提示
**X-ZHENGCHENG-TRACE-ID** 是我们约定的traceId 的key，在HTTP request header中传递
:::

### 配置

`zhengcheng` 在项目的 `WebMvcConfigurer` 配置实现中默认增加路径拦截器：

```java
// com.zhengcheng.web.WebAutoConfiguration 
/**
 * Web模块自动配置
 *
 * @author :    quansheng.zhang
 * @date :    2019/1/26 7:59
 */
@Slf4j
@EnableWebMvc
@Configuration
@ComponentScan({
        "com.zhengcheng.web.advice",
        "com.zhengcheng.web.aspect"})
public class WebAutoConfiguration implements WebMvcConfigurer {

    @Value("${spring.application.name:appName}")
    private String name;

    public WebAutoConfiguration() {
        if (log.isDebugEnabled()) {
            log.debug("Web模块自动配置成功");
        }
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 解决静态资源无法访问
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/");
        // 解决swagger无法访问
        registry.addResourceHandler("/swagger-ui.html")
                .addResourceLocations("classpath:/META-INF/resources/");
        // 解决swagger的js文件无法访问
        registry.addResourceHandler("/webjars/**")
                .addResourceLocations("classpath:/META-INF/resources/webjars/");
    }

    //添加拦截
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new TraceIdInterceptor(name))//路径拦截器
                .addPathPatterns("/**")  //拦截的请求路径
                .excludePathPatterns("/static/*")// 忽略静态文件
                .excludePathPatterns("/")
                .excludePathPatterns("/csrf")
                .excludePathPatterns("/error")
                .excludePathPatterns(SwaggerConstants.PATTERNS);
    }
}
```

