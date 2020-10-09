# InnoDB MVCC 机制

https://blog.csdn.net/u012164509/article/details/105294421

https://www.codercto.com/a/88775.html

https://www.jianshu.com/p/dd3724fc0f66

*   MVCC是被Mysql中 `事务型存储引擎InnoDB` 所支持的;
*   **应对高并发事务, MVCC比`单纯的加锁`更高效**;
*   MVCC只在 `READ COMMITTED` 和 `REPEATABLE READ` 两个隔离级别下工作;
*   MVCC可以使用 `乐观(optimistic)锁` 和 `悲观(pessimistic)锁`来实现;
*   各数据库中MVCC实现并不统一
*   但是书中提到 "InnoDB的MVCC是通过在每行记录后面保存**两个隐藏的列**来实现的"(网上也有很多此类观点), 但其实并不准确, 可以参考[MySQL官方文档](https://dev.mysql.com/doc/refman/5.7/en/innodb-multi-versioning.html), 可以看到, InnoDB存储引擎在数据库每行数据的后面添加了**三个字段**, 不是两个!!


https://zhuanlan.zhihu.com/p/75737955


https://blog.csdn.net/m0_37730732/article/details/79325397

https://baijiahao.baidu.com/s?id=1669272579360136533&wfr=spider&for=pc

https://www.cnblogs.com/f-ck-need-u/archive/2018/05/08/9010872.html
