# BlockingQueue

阻塞队列（`BlockingQueue`）被广泛使用在**生产者-消费者**问题中，其原因是`BlockingQueue`提供了**可阻塞的插入和移除的方法**。当队列容器已满，生产者线程会被阻塞，直到队列未满；当队列容器为空时，消费者线程会被阻塞，直至队列非空时为止。

## 核心方法

- 放入数据
    - **boolean offer(E e);** 将指定的元素添加此队列，如果它是立即可行且不会违反容量限制的，则返回`true`，否则返回`false` 。（本方法不阻塞当前执行方法的线程）
    - **boolean offer(E e, long timeout, TimeUnit unit) throws InterruptedException;** 将指定的元素添加到此队列，并将在指定的时间内等待空间变得可用。
    - **void put(E e) throws InterruptedException;** 将指定的元素插入到此队列，如有队列没有空间可用，则调用此方法的线程被阻塞直到队列里面有空间在继续。
- 拿出数据
    - **E take() throws InterruptedException;** 检索并移除此队列的头部，如果队列为空，则阻塞并进入等待状态直到队列有新的数据加入。
    - **E poll(long timeout, TimeUnit unit) throws InterruptedException;** 检索并移除此队列的头，并将在指定的时间内等待队列中有数据可取。
    - **int drainTo(Collection<? super E> c);** 移除此队列中所有可用的元素，并将它们添加到给定`collection`，此操作可能比反复轮询此队列更有效。
    - **int drainTo(Collection<? super E> c, int maxElements);** 移除此队列中指定个数的元素，并将它们添加到给定`collection`。

## ArrayBlockingQueue

`ArrayBlockingQueue`的底层是基于**数组实现**的阻塞队列，是**无界队列**。

### 实际应用


作为`ThreadPoolExecutor`的等待线程池TODO
```java
  ExecutorService executorService = new ThreadPoolExecutor(2, 5, 100, TimeUnit.SECONDS, new ArrayBlockingQueue<Runnable>(2000), new ThreadFactory() {
           @Override
           public Thread newThread(Runnable r) {
               Thread thread = new Thread(r);
               thread.setName("client-transaction-msg-check-thread");
               return thread;
           }
       });
```

    
## LinkedBlockingQueue

`LinkedBlockingQueue`的底层是基于**单向链表**实现的阻塞队列，**有界队列**，也可以当做**无界队列（容量等于 Integer.MAX_VALUE）**。

### 实际应用

在`RocketMQ` 消费端的本地消息缓存就是使用`LinkedBlockingQueue`来实现的，源码如下：
```java
package io.openmessaging.rocketmq.consumer;

class LocalMessageCache implements ServiceLifecycle {
    private final BlockingQueue<ConsumeRequest> consumeRequestCache;
    
    // ... 
    
    LocalMessageCache(final DefaultMQPullConsumer rocketmqPullConsumer, final ClientConfig clientConfig) {
        consumeRequestCache = new LinkedBlockingQueue<>(clientConfig.getRmqPullMessageCacheCapacity());
        // ... 
    }

    // ... 

    MessageExt poll() {
        return poll(clientConfig.getOperationTimeout());
    }

    MessageExt poll(final KeyValue properties) {
        int currentPollTimeout = clientConfig.getOperationTimeout();
        if (properties.containsKey(Message.BuiltinKeys.TIMEOUT)) {
            currentPollTimeout = properties.getInt(Message.BuiltinKeys.TIMEOUT);
        }
        return poll(currentPollTimeout);
    }

    private MessageExt poll(long timeout) {
        try {
            ConsumeRequest consumeRequest = consumeRequestCache.poll(timeout, TimeUnit.MILLISECONDS);
            if (consumeRequest != null) {
                MessageExt messageExt = consumeRequest.getMessageExt();
                consumeRequest.setStartConsumeTimeMillis(System.currentTimeMillis());
                MessageAccessor.setConsumeStartTimeStamp(messageExt, String.valueOf(consumeRequest.getStartConsumeTimeMillis()));
                consumedRequest.put(messageExt.getMsgId(), consumeRequest);
                return messageExt;
            }
        } catch (InterruptedException ignore) {
        }
        return null;
    }

    // ... 
}
```