---
sidebarDepth: 3
---

# WEB核心模块

`zc-web-spring-boot-starter` 是 `zhengcheng` 框架核心通用组件，聚合了以下的组件：

- [Mysql数据库通用组件](./db.md)
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

通过 `@RestControllerAdvice` + `@ExceptionHandler` 的方式统一异常处理

## ~~GlobalResponseBodyAdvice~~

::: danger 警告
从 `4.6.0` 开始去掉全局返回值的封装，为feign的继承做准备
:::

通 `@RestControllerAdvice` 注解并实现 `ResponseBodyAdvice` ,对`controller`的返回值统一加上`Result`, `String` 类型的需要单独处理。

```java
/**
 * com.zhengcheng 下 ResponseBodyAdvice 统一返回结果处理
 *
 * @author :    quansheng.zhang
 * @date :    2019/2/28 21:00
 */
@RestControllerAdvice(
        basePackages = {"com.zhengcheng"}
)
public class GlobalResponseBodyAdvice implements ResponseBodyAdvice<Object> {

    @Override
    public Object beforeBodyWrite(Object body, MethodParameter returnType, MediaType selectedContentType,
                                  Class<? extends HttpMessageConverter<?>> selectedConverterType,
                                  ServerHttpRequest request, ServerHttpResponse response) {
        if (body instanceof Result || body instanceof PageResult) {
            return body;
        }
        Result result = Result.successData(body);
        if (body instanceof String) {
            return JSONUtil.toJsonStr(result);
        }
        return result;
    }

    @Override
    public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
        // 此处可通过returnType.getDeclaringClass()  returnType.getMethod().getName() 过滤不想拦截的类或者方法。
        return true;
    }
}
```

以前的写法：

```java
    @GetMapping("/roles")
    public Result<IPage<Role>> roles(RoleQueryCommand roleQueryCommand) {
        return Result.successData(roleService.selectPageVo(queryDto));
    }
```

::: tip  现在可以这样写：
```java
    @GetMapping("/roles")
    public IPage<Role> roles(RoleQueryCommand roleQueryCommand) {
        return roleService.selectPageVo(queryDto);
    }
```
::: 
    

## ControllerLogAspect

在现实的项目中我们经常会遇到系统出现异常或者问题, 为了方便定位问题，需要知道controller 调用的入参和traceId（链路ID）

这里使用的是Spring AOP结合注解对Controller进行切面打印日志

```java
/**
 * 控制层日志打印
 *
 * @author :    quansheng.zhang
 * @date :    2019/11/28 16:04
 */
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
    @Pointcut("@within(org.springframework.web.bind.annotation.RequestMapping) && execution(* com.zhengcheng..*.*(..))")
    public void controllerMethodPointcut() {
    }

    @Around("controllerMethodPointcut()")
    public Object around(ProceedingJoinPoint pjp) throws Throwable {
        long beginTime = System.currentTimeMillis();
        Object retObj = pjp.proceed();
        long costMs = System.currentTimeMillis() - beginTime;
        log.info("{}请求结束，耗时：{}ms", this.getMethodInfo(pjp), costMs);
        return retObj;
    }

    private String getMethodInfo(JoinPoint point) {
        StrBuilder sb = StrBuilder.create();
        try {
            HttpServletRequest request = ((ServletRequestAttributes) Objects.requireNonNull(RequestContextHolder.getRequestAttributes())).getRequest();
            String method = request.getMethod();
            String className = point.getSignature().getDeclaringType().getSimpleName();
            String methodName = point.getSignature().getName();
            sb.append(className).append(".").append(methodName);
            if (Method.POST.toString().equalsIgnoreCase(method)) {
                Object[] args = point.getArgs();
                if (args.length > 0) {
                    sb.append(" | args:");
                    for (Object arg : args) {
                        if (arg instanceof Serializable && !(arg instanceof MultipartFile)) {
                            sb.append("[").append(objectMapper.writeValueAsString(arg)).append("]");
                        }
                    }
                }
                Map<String, String[]> parameterMap = request.getParameterMap();
                if (parameterMap != null && parameterMap.size() > 0) {
                    sb.append(" | param:[").append(objectMapper.writeValueAsString(parameterMap)).append("]");
                }
            } else {
                String queryString = request.getQueryString();
                if (StrUtil.isNotBlank(queryString)) {
                    sb.append(" | param:[").append(queryString).append("]");
                }
            }
        } catch (Exception e) {
            sb.append("|Exception:").append(e.getMessage());
        }
        return sb.toString();
    }
}
```

## ~~RequestLimitAspect~~

限流技术在平台中也是异常重要的一个措施，尤其是对网关的调用。我知道的有以下几种比较好实现方式：

- **阿里开源限流神器Sentinel**
- 可以采用令牌桶的方法，实现方式是Guava RateLimiter，简单有效，在结合统一配置中心(apollo)，可以动态调整限流阈值。

以上是一些成熟的方案，但是实现它需要额外的服务器，在资源有限的情况下，我们考虑使用redis lua脚本的方式来实现接口限流，虽然此种方式缺点很明显，不能动态调整限流的阈值，也没有管理和监控页面，在不久的将来可能会被成熟的方案替换，但是以下代码的实现思路还是非常不错的。

### 定义接口限流注解

> 其中name和value互为别名，所以需要使用 AnnotationUtils.findAnnotation 去获取注解，这样 @AliasFor 注解才能发挥作用（原理是AOP）

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@Documented
public @interface RequestLimit {

    @AliasFor("name")
    String value() default "";

    @AliasFor("value")
    String name() default "";

    /**
     * 允许访问的最大次数
     */
    int count() default Integer.MAX_VALUE;

    /**
     * 时间段，单位为毫秒，默认值1秒
     */
    long time() default 1000;
}
```


### 切面通知实现类

> 优先使用注解的name(value)作为限流接口的KEY，如果name为空，则获取当前方法的字符串来作为限流接口的KEY（不建议，导致KEY长度过长）

```java
@Slf4j
@Aspect
@Component
@DependsOn("redisScript")
@ConditionalOnClass({DefaultRedisScript.class, StringRedisTemplate.class})
public class RequestLimitAspect {

    @Autowired
    private DefaultRedisScript<Boolean> redisScript;

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    @Pointcut("@annotation(com.gaodun.storm.vod.common.annotation.RequestLimit)")
    public void pointcut() {
    }

    @Before("pointcut()")
    public void doBefore(JoinPoint joinPoint) {
        try {
            // 获取封装了署名信息的对象,在该对象中可以获取到目标方法名,所属类的Class等信息
            Signature signature = joinPoint.getSignature();
            //拦截的方法名称
            String methodName = signature.getName();
            //拦截的放参数类型
            Class[] parameterTypes = ((MethodSignature) signature).getMethod().getParameterTypes();
            Method method = joinPoint.getSignature().getDeclaringType().getMethod(methodName, parameterTypes);
            // 必须要用AnnotationUtils，才能获取到 name 和 value上@AliasFor(互为别名)的作用
            // AOP原理
            RequestLimit requestLimit = AnnotationUtils.findAnnotation(method, RequestLimit.class);
            if (Objects.isNull(requestLimit)) {
                return;
            }

            String name = requestLimit.name();
            if (StrUtil.isBlank(name)) {
                // 一个描述此方法的字符串
                name = method.toGenericString();
            }
            String key = CacheConstants.getRequestLimitKey(name);
            if (log.isDebugEnabled()) {
                log.debug("限流接口的KEY:[{}]", key);
            }

            Boolean allow = stringRedisTemplate.execute(
                    redisScript,
                    Collections.singletonList(key),
                    String.valueOf(requestLimit.count()), //limit
                    String.valueOf(requestLimit.time())); //expire

            if (Objects.equals(Boolean.FALSE, allow)) {
                throw new BusinessException(StatusCode.REQUEST_EXCEED_LIMIT);
            }
        } catch (NoSuchMethodException e) {
            log.error("{}", e.getMessage(), e);
        }
    }

}
```

### redis之lua脚本

#### lua脚本

```sql
local key = KEYS[1]
local value = 1
local limit = tonumber(ARGV[1])
local expire = ARGV[2]

if redis.call("SET", key, value, "NX", "PX", expire) then
    return 1
else
    if redis.call("INCR", key) <= limit then
        return 1
    end
    if redis.call("TTL", key) == -1 then
        redis.call("PEXPIRE", key, expire)
    end
end
return 0
```
当你使用阿里云集群版Redis的情况下，执行此脚本会出现：

```java
Exception:Error in execution; nested exception is io.lettuce.core.RedisCommandExecutionException: ERR bad lua script for redis cluster, all the keys that the script uses should be passed using the KEYS array, and KEYS should not be in expression
```
详细见[Lua脚本支持与限制](https://helpcdn.aliyun.com/document_detail/92942.html)

修改lua脚本如下：

```sql
local value = 1
local limit = tonumber(ARGV[1])
local expire = ARGV[2]

if redis.call("SET", KEYS[1], value, "NX", "PX", expire) then
    return 1
else
    if redis.call("INCR", KEYS[1]) <= limit then
        return 1
    end
    if redis.call("TTL", KEYS[1]) == -1 then
        redis.call("PEXPIRE", KEYS[1], expire)
    end
end
return 0
```


#### 使用DefaultRedisScript加载lua脚本

> 应该在应用上下文中配置一个DefaultRedisScript 的单例，避免在每个脚本执行的时候重复创建脚本的SHA1
```java
    @Bean("redisScript")
    public DefaultRedisScript<Boolean> redisScript() {
        DefaultRedisScript<Boolean> redisScript = new DefaultRedisScript<>();
        redisScript.setScriptSource(new ResourceScriptSource(new ClassPathResource("/META-INF/scripts/request_limit.lua")));
        redisScript.setResultType(Boolean.class);
        return redisScript;
    }
```

### 验证RequestLimit注解是否配置正确

> 通过以上方式，你会发现当我在接口上使用RequestLimit注解时，设置相同的name（你有可能会主动检查，设置不同），那么使用同样name的接口共用了一个KEY，这个不是我们想要的。为了避免这个问题，在项目启动时验证RequestLimit注解是否配置正确，具体实现如下：

```java
@Slf4j
@Configuration
public class RequestLimitConfiguration implements ApplicationContextAware {

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        // 验证RequestLimit注解是否配置正确
        if (Objects.nonNull(applicationContext)) {
            Set<String> requestLimitSet = new HashSet<>();
            String[] beanDefinitionNames = applicationContext.getBeanDefinitionNames();
            for (String beanDefinitionName : beanDefinitionNames) {
                Object bean = applicationContext.getBean(beanDefinitionName);
                Method[] methods = bean.getClass().getDeclaredMethods();
                for (Method method : methods) {
                    RequestLimit requestLimit = AnnotationUtils.findAnnotation(method, RequestLimit.class);
                    if (Objects.isNull(requestLimit)) {
                        continue;
                    }

                    String name = requestLimit.name();
                    if (StrUtil.isBlank(name)) {
                        continue;
                    }
                    if (requestLimitSet.contains(name)) {
                        throw new RuntimeException("request-limit[" + name + "] naming conflicts.");
                    } else {
                        requestLimitSet.add(name);
                        log.info("Generating unique request-limit operation named: {}", name);
                    }
                }
            }
        }
    }
}
```

那么配置相同的name，启动项目报错如下：

```java
	at org.springframework.boot.devtools.restart.RestartLauncher.run(RestartLauncher.java:49) [spring-boot-devtools-2.1.2.RELEASE.jar:2.1.2.RELEASE]
Caused by: java.lang.RuntimeException: request-limit[b] naming conflicts.
	at com.gaodun.storm.vod.common.config.RequestLimitConfiguration.setApplicationContext(RequestLimitConfiguration.java:47) 
```


### 注解的使用

```java
    @ApiOperation(value = "分页获取已结束列表")
    @RequestLimit(name = "f", count = 100) // 接口限量，qps=100，这个参数目前是拍脑袋设置的
    @GetMapping("/xxx/xxx")
    public BusinessResponse<Void> finished() {
        return BusinessResponse.ok();
    }
```

### 压测验证

![Image](https://gitee.com/zhangquansheng/zhengcheng-parent/raw/master/doc/image/requestLimit.png)

57.3/157.3 = 36.42% ，符合预期结果。

### 自定义回退方法

> 这个限流是否支持自定义的返回值？当我的业务场景存在不同的接口需要返回不一样的提示

#### 修改注解，增加回退方法的配置

```java
/**
 * 请求限流
 *
 * @author :    zhangquansheng
 * @date :    2020/5/12 16:11
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@Documented
public @interface RequestLimit {

    @AliasFor("name")
    String value() default "";

    @AliasFor("value")
    String name() default "";

    /**
     * 允许访问的最大次数
     */
    int count() default Integer.MAX_VALUE;

    /**
     * 时间段，单位为毫秒，默认值1秒
     */
    long time() default 1000;

    /**
     * 限流后降级的方法, 参数和返回值类型必须和原方法一致
     */
    String fallback() default "";
}
```

#### 修改AOP拦截的实现

```java
/**
 * 访问接口限流
 *
 * @author :    zhangquansheng
 * @date :    2020/5/12 16:15
 */
@Slf4j
@Aspect
@Component
@DependsOn("redisScript")
@ConditionalOnClass({DefaultRedisScript.class, StringRedisTemplate.class})
public class RequestLimitAspect {

    @Autowired
    private DefaultRedisScript<Boolean> redisScript;

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    @Pointcut("@annotation(com.gaodun.storm.vod.common.annotation.RequestLimit)")
    public void pointcut() {
    }

    @Around("pointcut()")
    public Object doBefore(ProceedingJoinPoint pjp) throws Throwable {
        Object[] args = pjp.getArgs();
        // 获取封装了署名信息的对象,在该对象中可以获取到目标方法名,所属类的Class等信息
        Signature signature = pjp.getSignature();
        //拦截的方法名称
        String methodName = signature.getName();
        //拦截的放参数类型
        Class[] parameterTypes = ((MethodSignature) signature).getMethod().getParameterTypes();
        Method method = pjp.getSignature().getDeclaringType().getMethod(methodName, parameterTypes);
        // 必须要用AnnotationUtils，才能获取到 name 和 value上@AliasFor(互为别名)的作用
        // AOP原理
        RequestLimit requestLimit = AnnotationUtils.findAnnotation(method, RequestLimit.class);
        if (Objects.isNull(requestLimit)) {
            return pjp.proceed(args);
        }

        String name = requestLimit.name();
        if (StrUtil.isBlank(name)) {
            // 一个描述此方法的字符串
            name = method.toGenericString();
        }
        String key = CacheConstants.getRequestLimitKey(name);
        if (log.isDebugEnabled()) {
            log.debug("限流接口的KEY:[{}]", key);
        }

        Boolean allow = stringRedisTemplate.execute(
                redisScript,
                Collections.singletonList(key),
                String.valueOf(requestLimit.count()), //limit
                String.valueOf(requestLimit.time())); //expire

        if (Objects.equals(Boolean.FALSE, allow)) {
            String fallback = requestLimit.fallback();
            if (StrUtil.isNotBlank(fallback)) {
                return ReflectUtil.invoke(pjp.getTarget(), fallback, args);
            }
            throw new BusinessException(StatusCode.REQUEST_EXCEED_LIMIT);
        }
        return pjp.proceed(args);
    }

}
```

#### 使用范例

```java
    @RequestLimit(count = 1, fallback = "liveAppFallback")
    @ApiOperation(value = "根据ID获取第三方直播应用配置")
    @GetMapping("/{id}")
    public BusinessResponse<LiveAppDTO> liveApp(@PathVariable("id") Integer id) {
        return BusinessResponse.ok(liveAppService.findById(id));
    }

    private BusinessResponse<LiveAppDTO> liveAppFallback(@PathVariable("id") Integer id) {
        return BusinessResponse.fallbackResult();
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

![Image Text](https://gitee.com/zhangquansheng/zhengcheng-parent/raw/master/doc/image/sign_postman.png)

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
![Image Text](https://gitee.com/zhangquansheng/zhengcheng-parent/raw/master/doc/image/variable_postman.png)

#### 对中文参数进行转码
选中需要进行转码的参数，然后点击鼠标右键选中 EncodeURLComponent
![Image Text](https://gitee.com/zhangquansheng/zhengcheng-parent/raw/master/doc/image/url_postman.png)

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

