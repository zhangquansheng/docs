# ConcurrentHashMap 源码解析 :hammer:

`JDK1.7`中是采用`Segment` + `HashEntry` + `ReentrantLock`的方式进行实现的。`JDK1.8`中是采用`Node` + `CAS` + `Synchronized`来保证并发安全进行实现。

本次源码解析基于`JDK1.8`。