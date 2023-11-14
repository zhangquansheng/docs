# 基于 Redis 实现延迟队列

`Redis`实现延时队列有两种实现方式：
- `key`失效监听回调
  - `Redis`的`pubsub`不会被持久化，服务器宕机就会被丢弃
  - 没有高级特性，没有ack机制，可靠性不高
- `zset`分数存时间戳
  - `zset`的实现是，轮询队列头部来获取超期的时间戳，实现延时效果，可靠性更高

## zset 实现的延时队列

`Redission`的`RDelayedQueue`是一个封装好的`zset`实现的延时队列。

```java
public static void main(String[] args) throws InterruptedException, UnsupportedEncodingException {
	Config config = new Config();
	config.useSingleServer().setAddress("redis://localhost:6379");
	RedissonClient redisson = Redisson.create(config);
	RBlockingQueue<String> blockingQueue = redisson.getBlockingQueue("test_queue1");
	RDelayedQueue<String> delayedQueue = redisson.getDelayedQueue(blockingQueue);
	new Thread() {
		public void run() {
			while(true) {
				try {
                                        //阻塞队列有数据就返回，否则wait
					System.err.println( blockingQueue.take());
				} catch (InterruptedException e) {
					e.printStackTrace();
				}
			}
		};
	}.start();
	
	for(int i=1;i<=5;i++) {
                // 向阻塞队列放入数据
		delayedQueue.offer("test"+i, 13, TimeUnit.SECONDS);
	}
}
```

## Redis 实现过期监听 （不推荐）

```java
package cn.seczone.iast.framework.redis.config.vh2cache;

import com.github.benmanes.caffeine.cache.Cache;

import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.listener.KeyExpirationEventMessageListener;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;

import cn.hutool.core.text.CharSequenceUtil;
import lombok.extern.slf4j.Slf4j;

/**
 * MyRedisKeyExpirationListener
 *
 * @author quansheng1.zhang
 * @since 2023/11/6 17:54
 */
@Slf4j
@Component
public class MyRedisKeyExpirationListener  extends KeyExpirationEventMessageListener {

    public Vh2CacheRedisKeyExpirationListener(RedisMessageListenerContainer listenerContainer) {
        super(listenerContainer);
    }

    // spring.redis.listener.channels=__keyevent@*:expired 默认监听所有的过期key，且是广播通知
    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            String expiredKey = message.toString();
            if (CharSequenceUtil.isNotBlank(expiredKey)) {
                if (log.isDebugEnabled()) {
                    log.debug("key message: " + expiredKey + " expired.");
                }
                //TODO 需要处理的业务，例如关闭订单
            }
        } catch (Exception ignored) {

        }
    }
}
```

::: tip
Redis不能确保`key`在指定时间被删除，可能会造成了通知的延期。

官方文档在`Timing of expired events`中，明确的说明了
"Basically expired events are generated when the Redis server deletes the key and not when the time to live theoretically reaches the value of zero."
:::


## 参考文档

- [基于Redis实现延时队列——Redisson延时队列解析](https://juejin.cn/post/6931288745844932621)
