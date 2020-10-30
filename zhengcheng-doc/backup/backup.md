## 包含组件

 name | description
---|---
zc-web-spring-boot-starter | WEB模块通用组件
zc-auth-client-spring-boot-starter | 认证客户端通用组件
zc-feign-spring-boot-starter | 远程通信通用组件
zc-mybatis-plus-spring-boot-starter | MyBatis-Plus通用组件
zc-tk-mybatis-spring-boot-starter | tk.mybatis通用组件
zc-mybatis-spring-boot-starter | Mybatis3通过provider注解结合动态sql实现CRUD
zc-cache-spring-boot-starter | 缓存通用组件
zc-job-spring-boot-starter | XXL-JOB定时任务通用组件
zc-swagger-spring-boot-starter | swagger通用组件
zc-sharding-jdbc-spring-boot-starter | 分库分表通用组件
zc-common-spring-boot-starter | 公共库通用组件(module之间的公共部分)
zc-cat-spring-boot-starter | CAT监控通用组件
zc-netty-socketio-spring-boot-starter | 即时聊天通用组件
zc-aliyun-spring-boot-starter | 阿里云通用组件(OSS，短信服务，RocketMQ，内容安全，日志服务，DTS)
zc-tencentcloud-spring-boot-starter | 腾讯云通用组件（云对象存储 COS，内容安全，自然语言自动配置）
zc-dict-spring-boot-starter | 数据字典通用组件（架构设计）
zc-zk-spring-boot-starter | Zookeeper通用组件

## 安装

### Maven

把项目的pom.xml的parent中替换以下内容:
```xml
    <parent>
        <groupId>com.zhengcheng</groupId>
        <artifactId>zhengcheng-parent</artifactId>
        <version>4.8.0</version>
    </parent>
```



----
mybatis-plus

自动配置如下（**注意mapper路径**）：
```java
package com.zhengcheng.mybatis.plus;

import com.zhengcheng.mybatis.plus.aspect.ReadOnlyConnectionAspect;
import com.zhengcheng.mybatis.plus.config.DefaultMybatisPlusConfig;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * mybatis-plus配置
 *
 * @author :    quansheng.zhang
 * @date :    2019/7/28 21:31
 */
@EnableTransactionManagement
@MapperScan(basePackages = "com.zhengcheng.**.mapper*")
@Configuration
@Import({ReadOnlyConnectionAspect.class})
public class MybatisPlusAutoConfiguration extends DefaultMybatisPlusConfig {

}
```

`DefaultMybatisPlusConfig.java` 源码如下：
```java
/**
 * mybatis-plus配置
 *
 * @author :    quansheng.zhang
 * @date :    2019/7/28 21:31
 */
@Import(DateMetaObjectHandler.class)
public class DefaultMybatisPlusConfig {

    /**
     * 分页插件，自动识别数据库类型
     */
    @Bean
    public PaginationInterceptor paginationInterceptor() {
        PaginationInterceptor paginationInterceptor = new PaginationInterceptor();
        paginationInterceptor.setLimit(CommonConstants.DEFAULT_PAGINATION_LIMIT);
        return paginationInterceptor;
    }

    @Bean
    public OptimisticLockerInterceptor optimisticLockerInterceptor() {
        return new OptimisticLockerInterceptor();
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