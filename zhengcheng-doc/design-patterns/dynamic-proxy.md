---
sidebarDepth: 3
---

# 动态代理的实现

[[toc]]

**从 JVM 角度来说，动态代理是在运行时动态生成类字节码，并加载到 JVM 中的。**

就 Java 来说，动态代理的实现方式有很多种，比如 **JDK 动态代理**、**CGLIB 动态代理**等。

## 1. JDK 动态代理机制

### 1.1 介绍

::: tip 重点提示
JDK动态代理是基于Java的反射机制实现的，主要涉及到`java.lang.reflect`包中的`Proxy`和`InvocationHandler`。
:::

`InvocationHandler`是一个接口，通过实现这个接口定义一个横切的逻辑！然后通过反射机制调用目标类的方法，这样就能动态的把非业务逻辑和业务逻辑动态的拼接在一起！

`proxy`则利用`InvocationHandler`创建代理实例，来间接的调用代理的方法！

### 1.2 JDK 动态代理类使用步骤

1. 定义一个接口及其实现类；
2. 自定义 `InvocationHandler` 并重写`invoke`方法，在`invoke`方法中我们会调用原生方法（被代理类的方法）并自定义一些处理逻辑；
3. 通过`Proxy.newProxyInstance(ClassLoader loader,Class<?>[] interfaces,InvocationHandler h)`方法创建代理对象；

### 1.3 代码示例

1.定义发送短信的接口
```java
package com.zhengcheng.magic.service;

/**
 * SmsService
 *
 * @author :    zhangquansheng
 * @date :    2020/8/28 11:36
 */
public interface SmsService {

    /**
     * 发送短信
     *
     * @param msg 短信内容
     * @return 发送结果
     */
    String send(String msg);
}

```

2.实现发送短信的接口
```java
package com.zhengcheng.magic.service.impl;

import com.zhengcheng.magic.service.SmsService;

/**
 * SmsServiceImpl
 *
 * @author :    zhangquansheng
 * @date :    2020/8/28 11:37
 */
public class SmsServiceImpl implements SmsService {
    @Override
    public String send(String msg) {
        System.out.println("send message: " + msg);
        return "success";
    }
}

```

**3.定义一个 JDK 动态代理类**
```java
package com.zhengcheng.magic.proxy;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;

/**
 * DebugInvocationHandler
 *
 * @author :    zhangquansheng
 * @date :    2020/8/28 11:39
 */
public class SmsInvocationHandler implements InvocationHandler {

    /**
     * 代理类中的真实对象
     */
    private final Object target;

    public SmsInvocationHandler(Object target) {
        this.target = target;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        //调用方法之前，我们可以添加自己的操作
        System.out.println("before method " + method.getName());
        Object result = method.invoke(target, args);
        //调用方法之后，我们同样可以添加自己的操作
        System.out.println("after method " + method.getName());
        return result;
    }

}
```
`invoke()` 方法: 当我们的动态代理对象调用原生方法的时候，最终实际上调用到的是 `invoke()` 方法，然后 `invoke()` 方法代替我们去调用了被代理对象的原生方法。

4.获取代理对象并使用
```java
public class ProxyApplication {

 public static void main(String[] args) {
    SmsService smsService = new SmsServiceImpl();
    SmsService smsServiceProxyInstance = (SmsService) Proxy.newProxyInstance(
            smsService.getClass().getClassLoader(), // 目标类的类加载
            smsService.getClass().getInterfaces(),  // 代理需要实现的接口，可指定多个
            new SmsInvocationHandler(smsService)   // 代理对象对应的自定义 InvocationHandler
    );
    smsServiceProxyInstance.send("java");
 }

}
```

运行上述代码之后，控制台打印出：
```shell script
before method send
send message:java
after method send
```

## 2. CGLIB 动态代理机制

### 2.1 介绍

::: tip 特别提示
 JDK 动态代理有一个最致命的问题是其只能代理实现了接口的类。为了解决这个问题，我们可以用 CGLIB 动态代理机制来避免。
:::

[CGLIB](https://github.com/cglib/cglib)(Code Generation Library)是一个基于**ASM**的字节码生成库，它允许我们在运行时对字节码进行修改和动态生成。CGLIB 通过继承方式实现代理。很多知名的开源框架都使用到了[CGLIB](https://github.com/cglib/cglib)， 例如`Spring`中的`AOP`模块中：如果目标对象实现了接口，则默认采用 JDK 动态代理，否则采用 [CGLIB](https://github.com/cglib/cglib) 动态代理。

**在 CGLIB 动态代理机制中 `MethodInterceptor` 接口和 `Enhancer` 类是核心。**

### 2.2 CGLIB 动态代理类使用步骤

- 定义一个需要被代理的类；
- 自定义 `MethodInterceptor` 并重写 `intercept` 方法，`intercept` 用于拦截增强被代理类的方法，和 JDK 动态代理中的 `invoke` 方法类似；
- 通过 `Enhancer` 类的 `create()` 创建代理类；

### 2.3 代码示例

1.实现一个使用阿里云发送短信的类
```java
package com.zhengcheng.magic.service;

/**
 * AliSmsServiceImpl
 *
 * @author :    zhangquansheng
 * @date :    2020/8/28 13:47
 */
public class AliSmsService {

    public String send(String message) {
        System.out.println("send message:" + message);
        return "success";
    }

}
```

2.自定义 MethodInterceptor（方法拦截器）
```java
package com.zhengcheng.magic.proxy;


import org.springframework.cglib.proxy.MethodInterceptor;
import org.springframework.cglib.proxy.MethodProxy;

import java.lang.reflect.Method;

/**
 * AliSmsMethodInterceptor
 *
 * @author :    zhangquansheng
 * @date :    2020/8/28 13:48
 */
public class AliSmsMethodInterceptor implements MethodInterceptor {

    /**
     * @param o           被代理的对象（需要增强的对象）
     * @param method      被拦截的方法（需要增强的方法）
     * @param objects     方法入参
     * @param methodProxy 用于调用原始方法
     */
    @Override
    public Object intercept(Object o, Method method, Object[] objects, MethodProxy methodProxy) throws Throwable {
        //调用方法之前，我们可以添加自己的操作
        System.out.println("before method " + method.getName());
        Object object = methodProxy.invokeSuper(o, objects);
        //调用方法之后，我们同样可以添加自己的操作
        System.out.println("after method " + method.getName());
        return object;
    }

}
```

3.获取代理类并使用
```java

import org.springframework.cglib.proxy.Enhancer;

public class CGLibApplication {

 public static void main(String[] args) {
    AliSmsService aliSmsService = new AliSmsService();
    // 创建动态代理增强类
    Enhancer enhancer = new Enhancer();
    // 设置类加载器
    enhancer.setClassLoader(aliSmsService.getClass().getClassLoader());
    // 设置被代理类
    enhancer.setSuperclass(aliSmsService.getClass());
    // 设置方法拦截器
    enhancer.setCallback(new AliSmsMethodInterceptor());
    AliSmsService aliSmsServiceEnhancer = (AliSmsService) enhancer.create();
    aliSmsServiceEnhancer.send("java");
   }

}
```

运行上述代码之后，控制台打印出：
```shell script
before method send
send message:java
after method send
```

## 3. JDK 动态代理和 CGLIB 动态代理对比

- **JDK 动态代理只能代理实现了接口的类，而 `CGLIB` 可以代理未实现任何接口的类。** 
- `CGLIB`动态代理是通过生成一个被代理类的子类来拦截被代理类的方法调用，因此不能代理声明为 `final` 类型的类和方法。
- 就二者的效率来说，大部分情况都是 `JDK` 动态代理更优秀，随着 `JDK` 版本的升级，这个优势更加明显。



