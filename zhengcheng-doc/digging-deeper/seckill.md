# 如何设计一个秒杀系统？ :+1:

秒杀业务的典型特点有：
1. 瞬时流量大
2. 参与用户多，可秒杀商品数量少
3. 请求读多写少
4. 秒杀状态转换实时性要求高

秒杀系统本质上就是一个满足**高并发**、**高性能**和**高可用**的分布式系统

参考流程图：

![newseckill](/img/digging-deeper/newseckill.png)

## 限流

1. 接入层（nginx）**漏桶算法**限流
2. 网关层面添加**sentinel**限流（窗口算法）

## 如何保证不超卖 

### 一、数据库解决（一般不可行）

1. 在查询商品库存时加排它锁（for update）
2. 更新数据库减库存，加上乐观锁（stock > 0 ）

数据库加锁的解决方案，性能很不好，在高并发的情况下，还可能存在因为获取不到数据库连接或者因为超时等待而报错。

### 二、分布式锁

1. Redisson 分布式锁对商品加锁，只有获取到锁的才能去扣库存。

这种方案的缺点是：很多用户对一个商品同时下单时，因为是基于分布式锁的串行处理，导致无法同时处理同一个商品的大量下单请求。

### 三、分布式锁 + 分库存

1. 把商品的库存分为N个KEY
2. 用户下单对用户ID进行%N计算，看选中哪个KEY。
3. 当其中KEY库存不足时，可以自动释放锁，并自动换成下一个分段的KEY，在尝试去扣库存。

### 四、redis lua 脚本 + 异步队列/MQ

1. 首先在redis中进行预减库存（lua 脚本 写判断条件，然后执行 decr 指令），当redis中的库存不足时，直接返回失败；
2. 将预减库存成功的，放入请求异步队列；
3. 服务端从异步队列，根据业务判断（例如：是否已经秒杀过了）取出请求，生成秒杀订单，**减少数据库库存**；

> 以上的异步队列，也可以换成异步消息（MQ）

缺点：由于异步写入DB，可能存在数据不一致。