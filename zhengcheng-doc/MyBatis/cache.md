# 缓存

`MyBatis`内置了一个强大的事务性查询缓存机制，它可以非常方便地配置和定制。

默认情况下，只启用了本地的会话缓存(**一级缓存**)，它仅仅对一个会话（`SqlSession`）中的数据进行缓存。 要启用全局的**二级缓存**，只需要在你的 SQL 映射文件中添加一行：
```xml
<cache/>
```
基本上就是这样。这个简单语句的效果如下:

- 映射语句文件中的所有 select 语句的结果将会被缓存。
- 映射语句文件中的所有 insert、update 和 delete 语句会刷新缓存。
- 缓存会使用最近最少使用算法（LRU, Least Recently Used）算法来清除不需要的缓存。
- 缓存不会定时进行刷新（也就是说，没有刷新间隔）。
- 缓存会保存列表或对象（无论查询方法返回哪种）的 1024 个引用。
- 缓存会被视为读/写缓存，这意味着获取到的对象并不是共享的，可以安全地被调用者修改，而不干扰其他调用者或线程所做的潜在修改。

## 一级缓存

一级缓存`Local Cache`的查询和写入是在`Executor`内部完成的。在`org.apache.ibatis.executor.BaseExecutor`源码中，`Local Cache`就是它内部的一个成员变量。
`BaseExecutor`相关构造函数如下：
```java
 protected BaseExecutor(Configuration configuration, Transaction transaction) {
    this.transaction = transaction;
    this.deferredLoads = new ConcurrentLinkedQueue<>();
    this.localCache = new PerpetualCache("LocalCache");
    this.localOutputParameterCache = new PerpetualCache("LocalOutputParameterCache");
    this.closed = false;
    this.configuration = configuration;
    this.wrapper = this;
  }
```

`BaseExecutor`成员变量之一的`PerpetualCache`，就是对`Cache`接口最基本的实现，其实现非常的简内部持有了`HashMap`，对一级缓存的操作其实就是对这个`HashMap`的操作。`PerpetualCache`代码如下：
```java
/**
 * @author Clinton Begin
 */
public class PerpetualCache implements Cache {

  private final String id;

  private final Map<Object, Object> cache = new HashMap<>();
    
  // ...

}
```

`BaseExecutor`的`query`核心方法源码如下：
```java
@SuppressWarnings("unchecked")
  @Override
  public <E> List<E> query(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, CacheKey key, BoundSql boundSql) throws SQLException {
    ErrorContext.instance().resource(ms.getResource()).activity("executing a query").object(ms.getId());
    if (closed) {
      throw new ExecutorException("Executor was closed.");
    }
    if (queryStack == 0 && ms.isFlushCacheRequired()) {
      clearLocalCache();
    }
    List<E> list;
    try {
      queryStack++;
      // 从缓存中获取
      list = resultHandler == null ? (List<E>) localCache.getObject(key) : null;
      if (list != null) {
        handleLocallyCachedOutputParameters(ms, key, parameter, boundSql);
      } else {
        // 缓存中不存在，则从数据库查询，并且对查询的结果缓存到本地缓存
        list = queryFromDatabase(ms, parameter, rowBounds, resultHandler, key, boundSql);
      }
    } finally {
      queryStack--;
    }
    if (queryStack == 0) {
      for (DeferredLoad deferredLoad : deferredLoads) {
        deferredLoad.load();
      }
      // issue #601
      deferredLoads.clear();
      // 判断本地缓存的级别（作用域）是否是 STATEMENT 级别，如果是，则清空缓存。这也就是 STATEMENT 级别的一级缓存失效的原因。
      if (configuration.getLocalCacheScope() == LocalCacheScope.STATEMENT) {
        // issue #482
        clearLocalCache();
      }
    }
    return list;
  }
```

`queryFromDatabase` 方法源码如下：
```java
  private <E> List<E> queryFromDatabase(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, CacheKey key, BoundSql boundSql) throws SQLException {
    List<E> list;
    localCache.putObject(key, EXECUTION_PLACEHOLDER);
    try {
      list = doQuery(ms, parameter, rowBounds, resultHandler, boundSql);
    } finally {
      localCache.removeObject(key);
    }
    // 添加本地缓存
    localCache.putObject(key, list);
    if (ms.getStatementType() == StatementType.CALLABLE) {
      localOutputParameterCache.putObject(key, parameter);
    }
    return list;
  }
```

`insert`/`delete`/`update`方法，缓存就会刷新的原因，源码如下:
```java
@Override
public int update(MappedStatement ms, Object parameter) throws SQLException {
    ErrorContext.instance().resource(ms.getResource()).activity("executing an update").object(ms.getId());
    if (closed) {
      throw new ExecutorException("Executor was closed.");
    }
    // 清空本地缓存
    clearLocalCache();
    return doUpdate(ms, parameter);
}
```


## 二级缓存

二级缓存只作用于`cache`标签所在的映射文件中的语句。如果你混合使用 `Java API` 和`XML`映射文件，在共用接口中的语句将不会被默认缓存。你需要使用`@CacheNamespaceRef`注解指定缓存作用域。

这些属性可以通过 `cache` 元素的属性来修改。比如：
```xml
<cache
  eviction="FIFO"
  flushInterval="60000"
  size="512"
  readOnly="true"/>
```

这个更高级的配置创建了一个`FIFO`缓存，每隔`60`秒刷新，最多可以存储结果对象或列表的`512`个引用，而且返回的对象被认为是只读的，因此对它们进行修改可能会在不同线程中的调用者产生冲突。

可用的清除策略有：

- LRU – 最近最少使用：移除最长时间不被使用的对象。
- FIFO – 先进先出：按对象进入缓存的顺序来移除它们。
- SOFT – 软引用：基于垃圾回收器状态和软引用规则移除对象。
- WEAK – 弱引用：更积极地基于垃圾收集器状态和弱引用规则移除对象。

默认的清除策略是`LRU`。

**`flushInterval`**（刷新间隔）属性可以被设置为任意的正整数，设置的值应该是一个以毫秒为单位的合理时间量。 默认情况是不设置，也就是没有刷新间隔，缓存仅仅会在调用语句时刷新。

**`size`**（引用数目）属性可以被设置为任意正整数，要注意欲缓存对象的大小和运行环境中可用的内存资源。默认值是`1024`。

**`readOnly`**（只读）属性可以被设置为`true`或`false`。只读的缓存会给所有调用者返回缓存对象的相同实例。 因此这些对象不能被修改。这就提供了可观的性能提升。而可读写的缓存会（通过序列化）返回缓存对象的拷贝。 速度上会慢一些，但是更安全，因此默认值是 false。

::: tip 提示
二级缓存是事务性的。这意味着，当`SqlSession`完成并提交时，或是完成并回滚，但没有执行`flushCache=true`的`insert/delete/update`语句时，缓存会获得更新。
:::

最后特别注意的是，强烈推荐**放弃使用二级缓存，在业务层使用可控制的缓存代替更好！**