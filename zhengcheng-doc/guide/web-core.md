---
sidebarDepth: 3
---

# WEB核心模块

`zc-web-spring-boot-starter` 是 `zhengcheng` 框架核心通用组件，并且还聚合了以下的组件：

- [缓存通用组件](./cache.md)
- [多线程通用组件](./async.md)
- [远程通信通用组件](./feign.md)
- swagger通用组件

## 安装

maven
```xml
  <dependency>
        <groupId>com.zhengcheng</groupId>
        <artifactId>zc-web-spring-boot-starter</artifactId>
  </dependency>
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

## SignAuthInterceptor

此拦截器作用为**防止参数篡改和重放攻击**

API重放攻击: 就是把之前窃听到的数据原封不动的重新发送给接收方(测试大佬肯定知道)

常用的其他业务场景还有：
- 发送短信接口
- 支付接口

### 基于timestamp和nonce的方案

> 微信支付的接口就是这样做的

#### timestamp的作用

每次HTTP请求，都需要加上timestamp参数，然后把timestamp和其他参数一起进行数字签名。HTTP请求从发出到达服务器一般都不会超过60s，所以服务器收到HTTP请求之后，首先判断时间戳参数与当前时间相比较，是否超过了60s，如果超过了则认为是非法的请求。

一般情况下,从抓包重放请求耗时远远超过了60s，所以此时请求中的timestamp参数已经失效了,如果修改timestamp参数为当前的时间戳，则signature参数对应的数字签名就会失效，因为不知道签名秘钥，没有办法生成新的数字签名。

但这种方式的漏洞也是显而易见的，如果在60s之后进行重放攻击，那就没办法了，所以这种方式不能保证请求仅一次有效

#### nonce的作用

nonce的意思是仅一次有效的随机字符串，要求每次请求时，该参数要保证不同。我们将每次请求的nonce参数存储到一个“集合”中，每次处理HTTP请求时，首先判断该请求的nonce参数是否在该“集合”中，如果存在则认为是非法请求。

nonce参数在首次请求时，已经被存储到了服务器上的“集合”中，再次发送请求会被识别并拒绝。

nonce参数作为数字签名的一部分，是无法篡改的，因为不知道签名秘钥，没有办法生成新的数字签名。

这种方式也有很大的问题，那就是存储nonce参数的“集合”会越来越大。

**nonce的一次性可以解决timestamp参数60s(防止重放攻击)的问题，timestamp可以解决nonce参数“集合”越来越大的问题。**

### 防篡改、防重放攻击 拦截器

```java
package com.zhengcheng.web.interceptor;

import cn.hutool.core.date.DateUnit;
import cn.hutool.core.date.DateUtil;
import cn.hutool.core.util.StrUtil;
import com.zhengcheng.common.constant.CommonConstants;
import com.zhengcheng.common.exception.BizException;
import com.zhengcheng.common.util.SignAuthUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.TimeUnit;

/**
 * 防篡改、防重放攻击 拦截器
 *
 * @author :    quansheng.zhang
 * @date :    2020/4/18 17:33
 */
@Slf4j
public class SignAuthInterceptor implements HandlerInterceptor {

    private RedisTemplate<String, String> redisTemplate;

    private String key;

    public SignAuthInterceptor(RedisTemplate<String, String> redisTemplate, String key) {
        this.redisTemplate = redisTemplate;
        this.key = key;
    }

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response, Object handler) throws Exception{
        // 获取时间戳
        String timestamp = request.getHeader(CommonConstants.SIGN_AUTH_TIMESTAMP);
        // 获取随机字符串
        String nonceStr = request.getHeader(CommonConstants.SIGN_AUTH_NONCE_STR);
        // 获取签名
        String signature = request.getHeader(CommonConstants.SIGN_AUTH_SIGNATURE);

        // 判断时间是否大于xx秒(防止重放攻击)
        long NONCE_STR_TIMEOUT_SECONDS = 60L;
        if (StrUtil.isEmpty(timestamp) || DateUtil.between(DateUtil.date(Long.parseLong(timestamp) * 1000), DateUtil.date(), DateUnit.SECOND) > NONCE_STR_TIMEOUT_SECONDS) {
            throw new BizException("invalid  timestamp");
        }

        // 判断该用户的nonceStr参数是否已经在redis中（防止短时间内的重放攻击）
        Boolean haveNonceStr = redisTemplate.hasKey(nonceStr);
        if (StrUtil.isEmpty(nonceStr) || Objects.isNull(haveNonceStr) || haveNonceStr) {
            throw new BizException("invalid nonceStr");
        }

        // 对请求头参数进行签名
        if (StrUtil.isEmpty(signature) || !Objects.equals(signature, this.signature(timestamp, nonceStr, request))) {
            throw new BizException("invalid signature");
        }

        // 将本次用户请求的nonceStr参数存到redis中设置xx秒后自动删除
        redisTemplate.opsForValue().set(nonceStr, nonceStr, NONCE_STR_TIMEOUT_SECONDS, TimeUnit.SECONDS);

        return true;
    }

    private String signature(String timestamp, String nonceStr, HttpServletRequest request) {
        Map<String, Object> params = new HashMap<>(16);
        Enumeration<String> enumeration = request.getParameterNames();
        while (enumeration.hasMoreElements()) {
            String name = enumeration.nextElement();
            params.put(name, request.getParameter(name));
        }
        String qs = SignAuthUtils.sortQueryParamString(params);
        return SignAuthUtils.signMd5(qs, timestamp, nonceStr, key);
    }
}
```

### 配置拦截器

```java
    @Autowired
    private RedisTemplate<String, String> redisTemplate;
    @Value("${security.api.key}")
    private String key;
```

```java
    registry.addInterceptor(new SignAuthInterceptor(redisTemplate, key))
            .addPathPatterns("/live-text/check/**")
```

### Postman接口测试

> 借助Postman的Pre-request Scritp可以实现自动签名功能，每次请求都会生成一个新的签名

#### 使用Pre-request Script脚本实现签名功能

![sign_postman](/img/web-core/sign_postman.png)

输入`Pre-request Script`，请复制粘贴下面提供的`Java Script`代码到文本框当中

```javascript
//设置当前时间戳（毫秒）
var timestamp =  Math.round(new Date()/1000);
pm.globals.set("timestamp",timestamp);
var nonceStr = createUuid();
pm.globals.set("nonceStr",nonceStr);
var key =pm.environment.get("key"); 
console.log(key);

var qs = urlToSign();
qs += '&timestamp='+timestamp+'&nonceStr='+nonceStr+'&key='+key;
console.log(qs);
var signature = CryptoJS.MD5(qs).toString();
console.log(signature);
pm.environment.set("signature", signature);


function urlToSign() {
    var params = new Map();
    var contentType = request.headers["content-type"];
    if (contentType && contentType.startsWith('application/x-www-form-urlencoded')) {
        const formParams = request.data.split("&");
        formParams.forEach((p) => {
            const ss = p.split('=');
            params.set(ss[0], ss[1]);
        })
    }
    
    const ss = request.url.split('?');
    if (ss.length > 1 && ss[1]) {
        const queryParams = ss[1].split('&');
        queryParams.forEach((p) => {
            const ss = p.split('=');
            params.set(ss[0], ss[1]);
        })
    }
    
    var sortedKeys = Array.from(params.keys())
    sortedKeys.sort();
    
    var l1 = ss[0].lastIndexOf('/');
    var first = true;
    var qs
    for (var k of sortedKeys) {
        var s = k + "=" + params.get(k);
        qs = qs ? qs + "&" + s : s;
        console.log("key=" + k + " value=" + params.get(k));
    }
    return qs;
}

function createUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

```
#### 设置环境变量/全局变量
![variable_postman](/img/web-core/variable_postman.png)

#### 对中文参数进行转码
选中需要进行转码的参数，然后点击鼠标右键选中 EncodeURLComponent
![url_postman](/img/web-core/url_postman.png)

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

