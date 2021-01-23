# Spring 循环依赖

`Spring`中的循环依赖包括: 构造器循环依赖、`setter`循环依赖。

## 构造器的依赖

`Spring`对于构造器的依赖、无法解决。只会抛出`BeanCurrentlyInCreationException`异常。
```java
// org.springframework.beans.factory.support.DefaultSingletonBeanRegistry

/**
 * Callback before singleton creation.
 * <p>The default implementation register the singleton as currently in creation.
 * @param beanName the name of the singleton about to be created
 * @see #isSingletonCurrentlyInCreation
 */
protected void beforeSingletonCreation(String beanName) {
    if (!this.inCreationCheckExclusions.contains(beanName) && !this.singletonsCurrentlyInCreation.add(beanName)) {
        throw new BeanCurrentlyInCreationException(beanName);
    }
}
```

**因为无法创建出这么一个不完整的`bean`在一个构造函数依赖的关系中**，所以`Spring`不能解决构造器循环依赖。

官方文档说明如下：

::: tip Circular dependencies
If you use predominantly constructor injection, it is possible to create an unresolvable circular dependency scenario.

For example: Class A requires an instance of class B through constructor injection, and class B requires an instance of class A through constructor injection. If you configure beans for classes A and B to be injected into each other, the Spring IoC container detects this circular reference at runtime, and throws a BeanCurrentlyInCreationException.

One possible solution is to edit the source code of some classes to be configured by setters rather than constructors. Alternatively, avoid constructor injection and use setter injection only. In other words, although it is not recommended, you can configure circular dependencies with setter injection.

Unlike the typical case (with no circular dependencies), a circular dependency between bean A and bean B forces one of the beans to be injected into the other prior to being fully initialized itself (a classic chicken-and-egg scenario).
:::


## setter 循环依赖

那`Spring`是如何解决的？其实很简单，在`Spring`获取单例中有一个**三级缓存**，代码如下：
```java
// org.springframework.beans.factory.support.DefaultSingletonBeanRegistry

/** 一级缓存，保存singletonBean实例: bean name --> bean instance */
/** Cache of singleton objects: bean name to bean instance. */
private final Map<String, Object> singletonObjects = new ConcurrentHashMap<>(256);

/** 三级缓存，保存singletonBean生产工厂: bean name --> ObjectFactory */
/** Cache of singleton factories: bean name to ObjectFactory. */
private final Map<String, ObjectFactory<?>> singletonFactories = new HashMap<>(16);

/** 二级缓存，保存早期未完全创建的Singleton实例: bean name --> bean instance */
/** Cache of early singleton objects: bean name to bean instance. */
private final Map<String, Object> earlySingletonObjects = new ConcurrentHashMap<>(16);

// ...

/**
 * Return the (raw) singleton object registered under the given name.
 * <p>Checks already instantiated singletons and also allows for an early
 * reference to a currently created singleton (resolving a circular reference).
 * @param beanName the name of the bean to look for
 * @param allowEarlyReference whether early references should be created or not
 * @return the registered singleton object, or {@code null} if none found
 */
@Nullable
protected Object getSingleton(String beanName, boolean allowEarlyReference) {
    // Quick check for existing instance without full singleton lock
    Object singletonObject = this.singletonObjects.get(beanName);
    if (singletonObject == null && isSingletonCurrentlyInCreation(beanName)) {
        singletonObject = this.earlySingletonObjects.get(beanName);
        if (singletonObject == null && allowEarlyReference) {
            synchronized (this.singletonObjects) {
                // Consistent creation of early reference within full singleton lock
                singletonObject = this.singletonObjects.get(beanName);
                if (singletonObject == null) {
                    singletonObject = this.earlySingletonObjects.get(beanName);
                    if (singletonObject == null) {
                        ObjectFactory<?> singletonFactory = this.singletonFactories.get(beanName);
                        if (singletonFactory != null) {
                            singletonObject = singletonFactory.getObject();
                            this.earlySingletonObjects.put(beanName, singletonObject);
                            this.singletonFactories.remove(beanName);
                        }
                    }
                }
            }
        }
    }
    return singletonObject;
}
```
`Spring`解决`setter`循环依赖的关键点就是在这里，主要是`singletonFactories`这个`HashMap`中。

首先，我们知道在`Spring`中，所有**单例的**`bean`初始化完成后都会存放在一个`ConcurrentHashMap`（`singletonObjects`，一级缓存）中，`beanName`为`key`，单例`bean`为`value`。


### 为啥是三级缓存，二级不行是否可以

---
## 参考文档

- [Spring 循环依赖及三级缓存 CSDN](https://blog.csdn.net/u012098021/article/details/107352463)
- [Dependency Resolution Process](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#beans-dependency-resolution)