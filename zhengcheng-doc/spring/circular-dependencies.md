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
**获取单例`Bean`步骤分析**：
1. 先从一级缓存`singletonObjects`中去获取，如果获取到就直接`return`（我们知道在`Spring`中，所有**单例的**`bean`初始化完成后都会存放在一个`ConcurrentHashMap`（`singletonObjects`，一级缓存）中，`beanName`为`key`，单例`bean`为`value`）；
2. 如果获取不到或者对象正在创建中（`isSingletonCurrentlyInCreation()`），那就再从二级缓存`earlySingletonObjects`中获取，如果获取到就直接`return`；
3. 如果获取不到并且允许`singletonFactories`（`allowEarlyReference=true`）通过`getObject()`获取，那么就从三级缓存`singletonFactory.getObject()`获取； 如果获取到了就从`singletonFactories`中移除，并且放进`earlySingletonObjects`；
   > 加入`singletonFactories`三级缓存的前提是执行了构造器，所以构造器的循环依赖没法解决。


那么当`A`、`B`类的互相依赖注入时，初始化流程图（**借用大佬的图，学习使用，如有侵权，请联系作者删除**）如下：
![循环依赖初始化流程图](/img/spring/circular-dependencies-a-b.png)
整个流程步骤总结如下：
1. 实例化**单例`beanA`**，并将它的创建工厂放入三级缓存(`singletonFactories`)，强调说明：**加入`singletonFactories`三级缓存的前提是执行了构造器，所以构造器的循环依赖没法解决**；
2. 填充`beanA`时，发现依赖`beanB`，那么此时需要去容器内获取单例`beanB`；
3. 当在容器内没有获取到`beanB`，则开始创建**单例`beanB`**；
4. 同操作**1**，实例化**单例`beanB`**，并将它的创建工厂放入三级缓存(`singletonFactories`)；
5. 同操作**2**，填充`beanB`时，发现依赖`beanA`，那么此时需要去容器内获取单例`beanA`；
6. 因为在三级缓存中存在`beanA`，那么就从三级缓存`singletonFactory.getObject()`获取`beanA`，获取成功以后，就从`singletonFactories`中移除，并且放进二级缓存`earlySingletonObjects`中；
7. `beanB`获取到了一个不完整的`beanA`，已经成功持有`beanA`的**引用**，所以`beanB`初始化成功，并且把`beanB`放入到`singletonObjects`一级缓存中；
8. 继续初始化`beanA`，依赖的`beanB`存在于一级缓存，直接可以获取到，所以`beanA`也可以初始化成功。


### 为啥是三级缓存，二级缓存是否可以

想要弄清楚这个问题，我们先了解一下**循环依赖对AOP代理对象创建流程和结果的影响**。

```java
@Service
public class HelloServiceImpl implements HelloService {

    @Autowired
    private HelloService helloService;
    
    @Transactional
    @Override
    public Object hello(Integer id) {
        return "service hello";
    }
}
```
此`Service`类使用到了事务，所以最终会生成一个**JDK动态代理对象**。刚好它又存在自己引用自己的循环依赖。那么这个Bean的创建概要描述如下：

查看`AbstractAutowireCapableBeanFactory.createBean`的源码。

---

**参考文档**

- [博客园 一文告诉你Spring是如何利用"三级缓存"巧妙解决Bean的循环依赖问题的【享学Spring】](https://www.cnblogs.com/like5635/articles/13597943.html)
- [Dependency Resolution Process](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#beans-dependency-resolution)