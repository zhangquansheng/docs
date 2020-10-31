# locks

## Lock

- ReentrantLock

	- ReentrantReadWriteLock.ReadLock
	- ReentrantReadWriteLock.WriteLock

## Condition

Condition的应用破坏了线程对临界资源占用的连续性，所以在编程的时候需要注意到这一点。也就是说在Condition里面需要注意await前后并不是原子操作<br>，分别是两个原子操作。所以需要一再强调，连续的两个原子操作并不一定就是原子操作，哪怕是同一个锁！

## ReadWriteLock

- ReentrantReadWriteLock

## LockSupport