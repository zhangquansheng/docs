# Redisson 分布式锁 :+1:

其实[Redis官网](https://redis.io/topics/distlock)已经给出了实现，建议用 `Redlock` 实现（区别于 `setnx`、`expire` ），这样更规范、更安全。

Redisson分布式锁方案优点：
1. 和`Zookeeper`相比较，`Redisson`基于`Redis`性能更高，适合对性能要求高的场景
2. Redisson 通过 **Watch Dog（看门狗）** 机制很好的解决了锁的续期问题
3. 通过 Redisson 实现分布式**可重入锁**，比原生的`SET mylock userId NX PX milliseconds + lua`实现的效果更好些，虽然基本原理都一样，但是它帮我们屏蔽了内部的执行细节。

存在的问题：
1. 存在分布式问题，解决办法引入RedLock解决方案（有争议）

加锁机制如下图：
![redisson-lock](/img/redis/redisson-lock.png)

## RLock 加锁

1. 执行**lua脚本**，获取锁
2. 如果获取锁失败，则通过while循环尝试获取锁
3. 加锁成功，启动定时任务，每隔10秒检查，如果还持有锁，则为锁续期30s（ **Watch Dog（看门狗） 机制**）

### Lua脚本 

原理如下：
1. 查询**加锁key**是否在`redis`中存在
   - 使用 exists 命令
   - 加锁key = KEYS[1]
   - 若 key 存在返回 1 ，否则返回 0
2. 新增该锁并且hash中该线程id对应的count置1，设置过期时间，默认30秒
   - 使用 [hincrby](https://www.runoob.com/redis/hashes-hincrby.html) 命令
   - hash中的field = Redisson客户端ID(UUID)+线程ID
   - 使用 pexpire 命令设置过期时间
3. 存在该key 并且 hash中线程id的key也存在，则线程重入次数+1（可重入锁），否则返回该key的剩余过期时间
   - 使用 hexists 命令，查看哈希表的指定字段是否存在
   - 使用 Pttl 命令，以毫秒为单位返回 key 的剩余过期时间

Lua脚本如下:
```sql
-- 不存在该key时
if (redis.call('exists', KEYS[1]) == 0) then 
  -- 新增该锁并且hash中该线程id对应的count置1
  redis.call('hincrby', KEYS[1], ARGV[2], 1);
  -- 设置过期时间
  redis.call('pexpire', KEYS[1], ARGV[1]);
  return nil;
end;

-- 存在该key 并且 hash中线程id的key也存在
if (redis.call('hexists', KEYS[1], ARGV[2]) == 1) then 
  -- 线程重入次数++
  redis.call('hincrby', KEYS[1], ARGV[2], 1);
  redis.call('pexpire', KEYS[1], ARGV[1]);
  return nil;
end;
return redis.call('pttl', KEYS[1]);
```

## RLock 释放锁

RLock 是可重入锁，当执行 unlock() 方法，存在该key并且hash中线程id的key也存在，则线程重入次数-1，
直到线程重入次数等于0，执行del 命令，删除改key。

## Watch Dog 的自动延期机制

如果拿到分布式锁的节点宕机，且这个锁正好处于锁住的状态时，会出现锁死的状态，为了避免这种情况的发生，**锁都会设置一个过期时间**。
但这样也存在一个问题，假如一个线程拿到了锁设置了30s超时，**在30s后这个线程还没有执行完毕，锁超时释放了**，就会导致问题。

Redisson 使用 **Watch Dog 自动延期机制**解决这个问题。

Redisson提供了一个监控锁的看门狗，它的作用是在Redisson实例被关闭前，不断的延长锁的有效期，也就是说，如果一个拿到锁的线程一直没有完成逻辑，那么看门狗会帮助线程不断的延长锁超时时间，锁不会因为超时而被释放。
- 默认情况下，看门狗的续期时间是30s，也可以通过修改`Config.lockWatchdogTimeout`来另行指定
- Redisson 还提供了可以指定leaseTime参数的加锁方法来指定加锁的时间，超过这个时间后锁便自动解开了，不会延长锁的有效期

源码：scheduleExpirationRenewal() 方法
```java
private void scheduleExpirationRenewal(long threadId) {
    ExpirationEntry entry = new ExpirationEntry();
    //将线程放入缓存中
    ExpirationEntry oldEntry = EXPIRATION_RENEWAL_MAP.putIfAbsent(getEntryName(), entry);
    //第二次获得锁后 不会进行延期操作
    if (oldEntry != null) {
        oldEntry.addThreadId(threadId);
    } else {
        entry.addThreadId(threadId);
        
        // 第一次获得锁 延期操作
        renewExpiration();
    }
}

// 进入 renewExpiration()
private void renewExpiration() {
    ExpirationEntry ee = EXPIRATION_RENEWAL_MAP.get(getEntryName());
    //如果缓存不存在，那不再锁续期
    if (ee == null) {
        return;
    }
    
    Timeout task = commandExecutor.getConnectionManager().newTimeout(new TimerTask() {
        @Override
        public void run(Timeout timeout) throws Exception {
            ExpirationEntry ent = EXPIRATION_RENEWAL_MAP.get(getEntryName());
            if (ent == null) {
                return;
            }
            Long threadId = ent.getFirstThreadId();
            if (threadId == null) {
                return;
            }
            
            //执行lua 进行续期
            RFuture<Boolean> future = renewExpirationAsync(threadId);
            future.onComplete((res, e) -> {
                if (e != null) {
                    log.error("Can't update lock " + getName() + " expiration", e);
                    return;
                }
                
                if (res) {
                    //延期成功，继续循环操作
                    renewExpiration();
                }
            });
        }
        //每隔internalLockLeaseTime/3=10秒检查一次
    }, internalLockLeaseTime / 3, TimeUnit.MILLISECONDS);
    
    ee.setTimeout(task);
}

//lua脚本 执行包装好的lua脚本进行key续期
protected RFuture<Boolean> renewExpirationAsync(long threadId) {
    return evalWriteAsync(getName(), LongCodec.INSTANCE, RedisCommands.EVAL_BOOLEAN,
            "if (redis.call('hexists', KEYS[1], ARGV[2]) == 1) then " +
                    "redis.call('pexpire', KEYS[1], ARGV[1]); " +
                    "return 1; " +
                    "end; " +
                    "return 0;",
            Collections.singletonList(getName()),
            internalLockLeaseTime, getLockName(threadId));
}
```

## RLock 加锁的方法

```java
public interface RLock extends Lock, RLockAsync {

    void lockInterruptibly(long leaseTime, TimeUnit unit) throws InterruptedException;

    boolean tryLock(long waitTime, long leaseTime, TimeUnit unit) throws InterruptedException;

    void lock(long leaseTime, TimeUnit unit);
}
```

- 当 leaseTime=-1 的时，使用Config.lockWatchdogTimeout（默认30秒）作为过期时间，并通过`Watch Dog`自动延期机制续期；
- 当 leaseTime（锁有效时间） 指定加锁时间时，直接设置过期时间，并且不会开启`Watch Dog`；

## 使用 Lua 脚本的好处

1. **原子操作**：redis 将会脚本作为一个整体执行，中间不会被其他命令插入，就不用担心出现竞争状态条件
2. 减少网络开销
3. 复用：客户端发送的脚本会永远存储在redis中，其他的客户端可以复用脚本

## 参考文档

- [Redis Pttl 命令](https://www.runoob.com/redis/keys-pttl.html)
- [Redis Hincrby 命令](https://www.runoob.com/redis/hashes-hincrby.html)
- [Redis PEXPIRE 命令](https://www.runoob.com/redis/keys-pexpire.html)
- [Redis Hexists 命令](https://www.runoob.com/redis/hashes-hexists.html)
- [Redis 哈希(Hash)](https://www.runoob.com/redis/redis-hashes.html)
- [Redis EXISTS 命令](https://www.runoob.com/redis/keys-exists.html)
