# BlockingQueue 阻塞队列

阻塞队列（`BlockingQueue`）被广泛使用在**生产者-消费者**问题中，其原因是`BlockingQueue`提供了可阻塞的插入和移除的方法。当队列容器已满，生产者线程会被阻塞，直到队列未满；当队列容器为空时，消费者线程会被阻塞，直至队列非空时为止。

`BlockingQueue`是一个接口，继承自`Queue`，所以其实现类也可以作为`Queue`的实现来使用，而`Queue`又继承自`Collection`接口。下图是`BlockingQueue`的相关实现类：
![blocking-queue-impl](/img/concurrent/blocking-queue-impl.png)

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

`ArrayBlockingQueue`的底层是基于**数组实现**的阻塞队列，是**有界队列**。

## LinkedBlockingQueue

`LinkedBlockingQueue`的底层是基于**单向链表**实现的阻塞队列，可以当做**无界队列（容量等于 Integer.MAX_VALUE）**，也可以当做有界队列。

## DelayQueue

`DelayQueue`中的元素只有当其指定的延迟时间到了，才能够从队列中获取到该元素，是**无界队列**。