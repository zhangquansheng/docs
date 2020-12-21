# @RefreshScope 

RefreshScope(org.springframework.cloud.context.scope.refresh)是`Spring Cloud`提供的一种特殊的`scope`实现，用来实现配置、实例热加载。

## 实现原理

### RefreshScope 注解源码
```java
package org.springframework.cloud.context.config.annotation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;

/**
 * Convenience annotation to put a <code>@Bean</code> definition in
 * {@link org.springframework.cloud.context.scope.refresh.RefreshScope refresh scope}.
 * Beans annotated this way can be refreshed at runtime and any components that are using
 * them will get a new instance on the next method call, fully initialized and injected
 * with all dependencies.
 *
 * @author Dave Syer
 *
 */
@Target({ ElementType.TYPE, ElementType.METHOD })
@Retention(RetentionPolicy.RUNTIME)
@Scope("refresh")
@Documented
public @interface RefreshScope {

	/**
	 * @see Scope#proxyMode()
	 * @return proxy mode
	 */
	ScopedProxyMode proxyMode() default ScopedProxyMode.TARGET_CLASS;

}
```

所有`@RefreshScope`的`Bean`都是延迟加载的，只有在第一次访问时才会初始化。


## 最佳实践