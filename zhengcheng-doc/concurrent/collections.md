# collections

## Queue

- ConcurrentLinkedQueue
- BlockingQueue

	- ArrayBlockingQueue
	    `ArrayBlockingQueue`的底层是基于**数组实现**的阻塞队列，是**有界队列**。
	- DelayQueue
	    `DelayQueue`中的元素只有当其指定的延迟时间到了，才能够从队列中获取到该元素，是**无界队列**。
	- LinkedBlockingQueue
	    `LinkedBlockingQueue`的底层是基于**单向链表**实现的阻塞队列，可以当做**无界队列（容量等于 Integer.MAX_VALUE）**，也可以当做有界队列。
	- PriorityBlockingQueue
	- SynchronousQueue
	- TransferQueue 

		- LinkedTransferQueue 

- Deque

	- ArrayDeque
	- LinkedList
	- BlockingDeque

		- LinkedBlockingDeque

## CopyOnWriteArrayList

## CopyOnWriteArraySet

## ConcurrentSkipListSet

## ConcurrentMap

- ConcurrentHashMap
- ConcurrentNavigableMap

	- ConcurrentSkipListMap