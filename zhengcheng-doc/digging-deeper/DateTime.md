# JAVA开发规范-日期时间

1. **【强制】** 日期格式化时，传入`pattern`中表示年份统一使用小写的 y。
> 说明：日期格式化时，yyyy 表示当天所在的年，而大写的 YYYY 代表是 week in which year（JDK7 之后引入的概念），
> 意思是当天所在的周属于的年份，一周从周日开始，周六结束，只要本周跨年，返回的 YYYY 就是下一年。

2. **【强制】** 在日期格式中分清楚大写的 M 和小写的 m，大写的 H 和小写的 h 分别指代的意义。
> 说明：日期格式中的这两对字母表意如下：
>   - 表示月份是大写的 M；
>   - 表示分钟则是小写的 m；
>   - 24 小时制的是大写的 H；
>   - 12 小时制的则是小写的 h。

3. **【强制】** 获取当前毫秒数：System.currentTimeMillis(); 而不是 new Date().getTime()。
> 说明：如果想获取更加精确的纳秒级时间值，使用 System.nanoTime 的方式。在 JDK8 中，针对统计时间等场景，推荐使用 Instant 类。

- 参考《阿里巴巴JAVA开发手册》

4. **【强制】** 不允许在程序任何地方中使用：1）java.sql.Date。 2）java.sql.Time。 3）java.sql.Timestamp。
> 说明：第 1 个不记录时间，getHours()抛出异常；第 2 个不记录日期，getYear()抛出异常；第 3 个在构造方法 super((time/1000)*1000)，在 Timestamp 属性 fastTime 和 nanos 分别存储秒和纳秒信息。
   
> **反例**： java.util.Date.after(Date)进行时间比较时，当入参是 java.sql.Timestamp 时，会触发 JDK BUG(JDK9 已修复)，可能导致比较时的意外结果。

5. **MYSQL 时间类型 DATE 、 DATETIME 、 TIMESTAMP**
![/img/digging-deeper/datetime.png](/img/digging-deeper/datetime.png)

   - **受时区影响不同**： 对于`timestamp`，它把客户端插入的时间从当前时区转化为UTC（世界标准时间）进行存储；查询时，将其又转化为客户端当前时区进行返回。而对于`DATETIME`，不做任何改变。
   - 占用存储空间不同：date储存占用3个字节，timestamp储存占用4个字节，datetime储存占用8个字节
   - 可表示的时间范围不同：datetime 支持的范围更宽 :+1:
   - 索引速度不同：timestamp更轻量，索引相对datetime更快（个人认为这点没那么重要）

正常情况下，**强烈推荐使用`datetime`存储日期时间**。
