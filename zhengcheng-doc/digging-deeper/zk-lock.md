---
sidebarDepth: 3
---

# Curator的ZK分布式锁实现原理

[[toc]]

## **环境准备**
            
```xml
<dependency>
    <groupId>org.apache.curator</groupId>
    <artifactId>curator-recipes</artifactId>
    <version>4.3.0</version>
</dependency>
```

先看下Curator的几种锁的实现

![Curator的几种锁](https://gitee.com/zhangquansheng/zhengcheng-parent/raw/master/doc/image/curator.png)

- InterProcessMutex：分布式可重入排它锁
- InterProcessSemaphoreMutex：分布式排它锁
- InterProcessMultiLock：将多个锁作为单个实体管理的容器


## InterProcessMutex分布式可重入排它锁的实现原理

### 加锁流程图

![加锁流程图](https://gitee.com/zhangquansheng/zhengcheng-parent/raw/master/doc/image/zk-lock.jpg)

::: tip 加锁思路：
1. 首先在ZooKeeper中创建一个/key持久化节点，再在同样的路径下创建一个节点，节点名字由uuid + 递增序列组成
2. 判断自己创建的节点是否最小值
3. 如果不是，则需要监听自己创建节点前一位节点的数据变化，并阻塞
4. 当前一位节点被删除时，我们通过递归来判断当前节点是否是最小值，如果是执行⑤，如果不是，则执行③
5. 如果是，则获取得到锁，执行自己的业务逻辑，最后删除这个临时节点
:::

### 代码解析

#### 一). 实例化InterProcessMutex

```java
// 代码进入：InterProcessMutex.java

   /**
     * @param client client
     * @param path   the path to lock
     */
    public InterProcessMutex(CuratorFramework client, String path)
    {
        this(client, path, new StandardLockInternalsDriver());
    }

    /**
     * @param client client
     * @param path   the path to lock
     * @param driver lock driver
     */
    public InterProcessMutex(CuratorFramework client, String path, LockInternalsDriver driver)
    {
        this(client, path, LOCK_NAME, 1, driver);
    }
```

入参：
client： curator实现的ZooKeeper客户端
path: 要在zookeeper加锁的路径，即后面创建临时节点的父节点

构造函数的代码
```java
// 代码进入：InterProcessMutex.java

    InterProcessMutex(CuratorFramework client, String path, String lockName, int maxLeases, LockInternalsDriver driver)
    {
        basePath = PathUtils.validatePath(path);
        internals = new LockInternals(client, driver, path, lockName, maxLeases);
    }
```
1. 验证入参path的合法性 
2. 实例化了一个LockInternals对象

```java
// 代码进入：LockInternals.java

    LockInternals(CuratorFramework client, LockInternalsDriver driver, String path, String lockName, int maxLeases)
    {
        this.driver = driver;
        this.lockName = lockName;
        this.maxLeases = maxLeases;

        this.client = client.newWatcherRemoveCuratorFramework();
        this.basePath = PathUtils.validatePath(path);
        this.path = ZKPaths.makePath(path, lockName);
    }
```

#### 二).加锁方法acquire

```java
// 代码进入：InterProcessMutex.java

    /**
     * Acquire the mutex - blocking until it's available. Note: the same thread
     * can call acquire re-entrantly. Each call to acquire must be balanced by a call
     * to {@link #release()}
     *
     * @throws Exception ZK errors, connection interruptions
     */
    @Override
    public void acquire() throws Exception
    {
        if ( !internalLock(-1, null) )
        {
            throw new IOException("Lost connection while trying to acquire lock: " + basePath);
        }
    }

    /**
     * Acquire the mutex - blocks until it's available or the given time expires. Note: the same thread
     * can call acquire re-entrantly. Each call to acquire that returns true must be balanced by a call
     * to {@link #release()}
     *
     * @param time time to wait
     * @param unit time unit
     * @return true if the mutex was acquired, false if not
     * @throws Exception ZK errors, connection interruptions
     */
    @Override
    public boolean acquire(long time, TimeUnit unit) throws Exception
    {
        return internalLock(time, unit);
    }
```
- acquire() :入参为空，调用该方法后，会一直堵塞，直到抢夺到锁资源，或者zookeeper连接中断后，上抛异常
- acquire(long time, TimeUnit unit)：传入超时时间以及单位，抢夺时，如果出现堵塞，会在超过该时间后，返回false

对比两种方式，可以选择适合自己业务逻辑的方法。但是一般情况下，我极力推荐后者，传入超时时间，避免出现大量的临时节点累积以及线程堵塞的问题

##### 2.1 锁的可重入

```java
// 代码进入：InterProcessMutex.java

private boolean internalLock(long time, TimeUnit unit) throws Exception
    {
        /*
           Note on concurrency: a given lockData instance
           can be only acted on by a single thread so locking isn't necessary
        */

        Thread currentThread = Thread.currentThread();

        LockData lockData = threadData.get(currentThread);
        if ( lockData != null )
        {
            // re-entering
            lockData.lockCount.incrementAndGet();
            return true;
        }

        String lockPath = internals.attemptLock(time, unit, getLockNodeBytes());
        if ( lockPath != null )
        {
            LockData newLockData = new LockData(currentThread, lockPath);
            threadData.put(currentThread, newLockData);
            return true;
        }

        return false;
    }
```
这段代码里面，实现了锁的可重入。

每个InterProcessMutex实例，都会持有一个ConcurrentMap类型的threadData对象，以线程对象作为Key，以LockData作为Value值;通过判断当前线程threadData是否有值，如果有，则表示线程可以重入该锁，于是将lockData的lockCount进行累加,如果没有，则进行锁的抢夺。

internals.attemptLock方法返回lockPath!=null时，表明了该线程已经成功持有了这把锁，于是乎LockData对象被new了出来，并存放到threadData中。

##### 2.2 抢夺锁

**attemptLock方法就是核心部分**

```java
// 代码进入：LockInternals.java

String attemptLock(long time, TimeUnit unit, byte[] lockNodeBytes) throws Exception
    {
        final long      startMillis = System.currentTimeMillis();
        final Long      millisToWait = (unit != null) ? unit.toMillis(time) : null;
        final byte[]    localLockNodeBytes = (revocable.get() != null) ? new byte[0] : lockNodeBytes;
        int             retryCount = 0;

        String          ourPath = null;
        boolean         hasTheLock = false;
        boolean         isDone = false;
        // 1. 正常情况下，这个循环会在下一次结束。但是当出现NoNodeException异常时，会根据zookeeper客户端的重试策略，进行有限次数的重新获取锁
        while ( !isDone )
        {
            isDone = true;

            try
            {
                // 2. 创建临时序列节点
                ourPath = driver.createsTheLock(client, path, localLockNodeBytes);
               // 3. 判断自身是否能够持有锁。如果不能，进入wait，等待被唤醒
               hasTheLock = internalLockLoop(startMillis, millisToWait, ourPath);
            }
            catch ( KeeperException.NoNodeException e )
            {
                // gets thrown by StandardLockInternalsDriver when it can't find the lock node
                // this can happen when the session expires, etc. So, if the retry allows, just try it all again
                if ( client.getZookeeperClient().getRetryPolicy().allowRetry(retryCount++, System.currentTimeMillis() - startMillis, RetryLoop.getDefaultRetrySleeper()) )
                {
                    isDone = false;
                }
                else
                {
                    throw e;
                }
            }
        }

        if ( hasTheLock )
        {
            return ourPath;
        }

        return null;
    }
```
主要完成两个操作：
- 创建临时序列节点

```java
// 代码进入：StandardLockInternalsDriver.java

    @Override
    public String createsTheLock(CuratorFramework client, String path, byte[] lockNodeBytes) throws Exception
    {
        String ourPath;
        if ( lockNodeBytes != null )
        {
            ourPath = client.create().creatingParentContainersIfNeeded().withProtection().withMode(CreateMode.EPHEMERAL_SEQUENTIAL).forPath(path, lockNodeBytes);
        }
        else
        {
            ourPath = client.create().creatingParentContainersIfNeeded().withProtection().withMode(CreateMode.EPHEMERAL_SEQUENTIAL).forPath(path);
        }
        return ourPath;
    }
```

- 判断自身是否能够持有锁。如果不能，进入wait，等待被唤醒

```java
private boolean internalLockLoop(long startMillis, Long millisToWait, String ourPath) throws Exception
    {
        boolean     haveTheLock = false;
        boolean     doDelete = false;
        try
        {
            if ( revocable.get() != null )
            {
                client.getData().usingWatcher(revocableWatcher).forPath(ourPath);
            }

            while ( (client.getState() == CuratorFrameworkState.STARTED) && !haveTheLock )
            {
            // 获取到所有子节点列表，并且从小到大根据节点名称后10位数字进行排序
                List<String>        children = getSortedChildren();
                String              sequenceNodeName = ourPath.substring(basePath.length() + 1); // +1 to include the slash

// 获取锁
                PredicateResults    predicateResults = driver.getsTheLock(client, children, sequenceNodeName, maxLeases);
                if ( predicateResults.getsTheLock() )
                {
                    haveTheLock = true;
                }
                else
                {
                    String  previousSequencePath = basePath + "/" + predicateResults.getPathToWatch();

                    synchronized(this)
                    {
                        try
                        {
                            // use getData() instead of exists() to avoid leaving unneeded watchers which is a type of resource leak
                            client.getData().usingWatcher(watcher).forPath(previousSequencePath);
                            if ( millisToWait != null )
                            {
                                millisToWait -= (System.currentTimeMillis() - startMillis);
                                startMillis = System.currentTimeMillis();
                                if ( millisToWait <= 0 )
                                {
                                    doDelete = true;    // timed out - delete our node
                                    break;
                                }

                                wait(millisToWait);
                            }
                            else
                            {
                                wait();
                            }
                        }
                        catch ( KeeperException.NoNodeException e )
                        {
                            // it has been deleted (i.e. lock released). Try to acquire again
                        }
                    }
                }
            }
        }
        catch ( Exception e )
        {
            ThreadUtils.checkInterrupted(e);
            doDelete = true;
            throw e;
        }
        finally
        {
            if ( doDelete )
            {
                deleteOurPath(ourPath);
            }
        }
        return haveTheLock;
    }
```


- driver.getsTheLock 获取到锁 
```java
    @Override
    public PredicateResults getsTheLock(CuratorFramework client, List<String> children, String sequenceNodeName, int maxLeases) throws Exception
    {
        int             ourIndex = children.indexOf(sequenceNodeName);
        validateOurIndex(sequenceNodeName, ourIndex);

        boolean         getsTheLock = ourIndex < maxLeases;
        String          pathToWatch = getsTheLock ? null : children.get(ourIndex - maxLeases);

        return new PredicateResults(pathToWatch, getsTheLock);
    }
```
判断是否可以持有锁，判断规则：当前创建的节点是否在上一步获取到的子节点列表的首位。
如果是，说明可以持有锁，那么getsTheLock = true，封装进PredicateResults返回。
如果不是，说明有其他线程早已先持有了锁，那么getsTheLock = false，此处还需要获取到自己前一个临时节点的名称**pathToWatch**

- synchronized(this)
> 这块代码在争夺锁失败以后的逻辑中。那么此处该线程应该做什么呢？
首先添加一个watcher监听，而监听的地址正是上面一步返回的pathToWatch进行basePath + "/" 拼接以后的地址。也就是说当前线程会监听自己前一个节点的变动，而不是父节点下所有节点的变动。然后华丽丽的...wait(millisToWait)。线程交出cpu的占用，进入等待状态，等到被唤醒。
接下来的逻辑就很自然了，如果自己监听的节点发生了变动，那么就将线程从等待状态唤醒，重新一轮的锁的争夺。

#### 三). 释放锁 release

```java
// 代码进入：InterProcessMutex.java

   /**
     * Perform one release of the mutex if the calling thread is the same thread that acquired it. If the
     * thread had made multiple calls to acquire, the mutex will still be held when this method returns.
     *
     * @throws Exception ZK errors, interruptions, current thread does not own the lock
     */
    @Override
    public void release() throws Exception
    {
        /*
            Note on concurrency: a given lockData instance
            can be only acted on by a single thread so locking isn't necessary
         */
// 减少重入锁的计数，直到变成0
        Thread currentThread = Thread.currentThread();
        LockData lockData = threadData.get(currentThread);
        if ( lockData == null )
        {
            throw new IllegalMonitorStateException("You do not own the lock: " + basePath);
        }

        int newLockCount = lockData.lockCount.decrementAndGet();
        if ( newLockCount > 0 )
        {
            return;
        }
        if ( newLockCount < 0 )
        {
            throw new IllegalMonitorStateException("Lock count has gone negative for lock: " + basePath);
        }
        try
        {
           // 释放锁，即移除移除Watchers & 删除创建的节点 internals.releaseLock(lockData.lockPath);
        }
        finally
        {
           
           // 从threadData中，删除自己线程的缓存 threadData.remove(currentThread);
        }
    }
```


- 减少重入锁的计数，直到变成0。
- 释放锁，即移除移除Watchers & 删除创建的节点
- 从threadData中，删除自己线程的缓存

#### 四).锁驱动类
上面我们使用的是StandardLockInternalsDriver-标准锁驱动类。我们可以传入自定义的驱动类，它提供的功能接口：

```java
// 代码进入LockInternalsDriver.java
public interface LockInternalsDriver extends LockInternalsSorter
{
    public PredicateResults getsTheLock(CuratorFramework client, List<String> children, String sequenceNodeName, int maxLeases) throws Exception;

    public String createsTheLock(CuratorFramework client,  String path, byte[] lockNodeBytes) throws Exception;
}
```
借助于这个类，我们可以尝试实现自己的锁机制

## 与Redisson分布式锁的比较

 - | ZooKeeper  | Redisson
---|---|---
性能 |低| 高
可靠性 |高 | 低

## 参考资料
- [curator笔记-分布式锁的实现与原理](https://www.jianshu.com/p/6618471f6e75?tdsourcetag=s_pcqq_aiomsg)
- [Curator](http://curator.apache.org/)

