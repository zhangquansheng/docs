# 自定义接口幂等性注解 @Idempotent （基于redis缓存）

## 自定义注解

```java
/**
 * 幂等或防重复提交
 *
 * @author quansheng.zhang
 * @since 2022/8/16 15:16
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Idempotent {
    /**
     * 幂等的key，不设置则取所有参数toString
     * spel表达式，支持多项拼接
     */
    String[] keys() default {};

    /**
     * keys的分隔符
     */
    String split() default "-";

    /**
     * 锁过期时间
     */
    int timeout() default 5000;

    /**
     * 锁过期时间单位
     */
    TimeUnit timeUnit() default TimeUnit.MILLISECONDS;

    /**
     * 锁的位置，不设置则取URI
     */
    String location() default "";

    /**
     * 提醒信息
     */
    String message() default "操作过于频繁，请稍后重试！";

    /**
     * 执行完成后是否释放key
     */
    boolean delKey() default false;
}
```

## 定义切面

```java
import com.zhengcheng.cache.expression.KeyResolver;
import com.zhengcheng.cache.idempotent.annotation.Idempotent;
import com.zhengcheng.common.exception.IdempotentException;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.reflect.MethodSignature;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.lang.reflect.Method;
import java.util.Arrays;

/**
 * IdempotentAspect
 *
 * @author quansheng.zhang
 * @since 2022/8/16 15:25
 */
@Slf4j
@Aspect
public class IdempotentAspect {

    private static final String REPEAT_LOCK_PREFIX = "zc:idempotent:";

    @Resource
    private RedissonClient redissonClient;
    @Resource
    private KeyResolver keyResolver;

    @Pointcut("@annotation(com.zhengcheng.cache.idempotent.annotation.Idempotent)")
    public void pointCut() {
    }

    /**
     * around
     */
    @Around("pointCut()")
    public Object doAround(ProceedingJoinPoint joinPoint) throws Throwable {
        Method method = ((MethodSignature) joinPoint.getSignature()).getMethod();
        Object[] args = joinPoint.getArgs();
        if (!method.isAnnotationPresent(Idempotent.class)) {
            return joinPoint.proceed(args);
        }

        Idempotent idempotent = method.getAnnotation(Idempotent.class);
        String lockKey = getLockKey(idempotent, joinPoint);
        RLock lock = redissonClient.getLock(lockKey);
        if (lock == null || !lock.tryLock(0, idempotent.timeout(), idempotent.timeUnit())) {
            log.error("handle present repeat submission tryLock failed, lockKey: {}", lockKey);
            throw new IdempotentException(idempotent.message());
        }

        try {
            return joinPoint.proceed(args);
        } finally {
            if (idempotent.delKey() && lock.isLocked() && lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }

    private String getLockKey(Idempotent idempotent, ProceedingJoinPoint joinPoint) {
        String suffix;
        if ((idempotent.keys() == null || idempotent.keys().length == 0) && (joinPoint.getArgs() != null && joinPoint.getArgs().length > 0)) {
            suffix = Arrays.asList(joinPoint.getArgs()).toString();
        } else {
            suffix = keyResolver.resolver(idempotent.keys(), idempotent.split(), joinPoint);
        }

        String location;
        if (!StringUtils.hasText(idempotent.location())) {
            ServletRequestAttributes requestAttributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            assert requestAttributes != null;
            HttpServletRequest request = requestAttributes.getRequest();
            location = request.getRequestURI();
        } else {
            location = idempotent.location();
        }
        return REPEAT_LOCK_PREFIX + location + ":" + suffix;
    }

}
```

## 自定义异常类

```java
/**
 * 幂等性异常
 *
 * @author :    quansheng.zhang
 * @date :    2019/9/23 0:50
 */
public class IdempotentException extends RuntimeException {
    private static final long serialVersionUID = 6610083281801529147L;

    public IdempotentException(String message) {
        super(message);
    }
}
```
