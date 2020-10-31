# j.U.C 概览

![j.U.C](/img/concurrent/j.U.C.png)

## collections

### Queue

- ConcurrentLinkedQueue
- BlockingQueue

	- ArrayBlockingQueue
	- DelayQueue
	- LinkedBlockingQueue
	- PriorityBlockingQueue
	- SynchronousQueue
	- TransferQueue 

		- LinkedTransferQueue 

- Deque

	- ArrayDeque
	- LinkedList
	- BlockingDeque

		- LinkedBlockingDeque

### CopyOnWriteArrayList

### CopyOnWriteArraySet

### ConcurrentSkipListSet

### ConcurrentMap

- ConcurrentHashMap
- ConcurrentNavigableMap

	- ConcurrentSkipListMap

## executor

### Future

- RunnableFuture

	- RunnableScheduledFuture
	- FutureTask

- ScheduledFuture
- ForkJoinTask

### Callable

### Executor

- ExecutorService

	- ScheduledExecutorService

		- ScheduledThreadPoolExecutor

	- AbstractExecutorService

		- ThreadPoolExecutor
		- ForkJoinPool

### CompletionService

- ExecutorCompletionService

### RejectedExecutionHandler

- ThreadPoolExecutor.DiscardPolicy
- ThreadPoolExecutor.DiscardOldestPolicy
- ThreadPoolExecutor.CallerRunsPolicy
- ThreadPoolExecutor.AbortPolicy

### TimeUnit

## atomic

### AtomicBoolean

### AtomicInteger

### AtomicIntegerArray

### AtomicIntegerFiledUpdater

### AtomicLong

### AtomicLongArray

### AtomicLongFiledUpdater

### AtomicMarkableReference

### AtomicReference

### AtomicReferenceArray

### AtomicReferenceFieldUpdater

### AtomicStampledReference

## locks

### Lock

- ReentrantLock

	- ReentrantReadWriteLock.ReadLock
	- ReentrantReadWriteLock.WriteLock

### Condition

Condition的应用破坏了线程对临界资源占用的连续性，所以在编程的时候需要注意到这一点。也就是说在Condition里面需要注意await前后并不是原子操作<br>，分别是两个原子操作。所以需要一再强调，连续的两个原子操作并不一定就是原子操作，哪怕是同一个锁！

### ReadWriteLock

- ReentrantReadWriteLock

### LockSupport

## tools

### CountDownLatch

### CyclicBarrier

### Semaphore

### Executors

### Exchanger