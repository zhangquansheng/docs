# BlockingQueue 阻塞队列

阻塞队列（`BlockingQueue`）被广泛使用在**生产者-消费者**问题中，其原因是`BlockingQueue`提供了可阻塞的插入和移除的方法。当队列容器已满，生产者线程会被阻塞，直到队列未满；当队列容器为空时，消费者线程会被阻塞，直至队列非空时为止。

`BlockingQueue`是一个接口，继承自`Queue`，所以其实现类也可以作为`Queue`的实现来使用，而`Queue`又继承自`Collection`接口。下图是`BlockingQueue`的相关实现类：
![blocking-queue-impl](/img/concurrent/blocking-queue-impl.png)

## ArrayBlockingQueue

`ArrayBlockingQueue`的底层是基于**数组实现**的阻塞队列，是**有界队列**。

## LinkedBlockingQueue

`LinkedBlockingQueue`的底层是基于**单向链表**实现的阻塞队列，可以当做**无界队列（容量等于 Integer.MAX_VALUE）**，也可以当做有界队列。