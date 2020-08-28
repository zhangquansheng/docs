'./guide/Spring-Data-Redis',


{
    title: '突击面试',
    collapsable: false,
    children: [
        './interview/',
        './interview/concurrent',
        './interview/ThreadLocal',
        './interview/redis',
        './interview/MySQL',
        './interview/kafka'
    ]
},


## 与Redisson分布式锁的比较

- 从实现的复杂性角度
- redis分布式锁，其实需要自己不断去尝试获取锁，比较消耗性能；
- zk分布式锁，获取不到锁，注册个监听器即可，不需要不断主动尝试获取锁，性能开销较小。


### 代码示例

- [Gitee Samples](https://gitee.com/zhangquansheng/magic/tree/feign/)

[java-proxy](https://github.com/Snailclimb/JavaGuide/blob/master/docs/java/basic/java-proxy.md)