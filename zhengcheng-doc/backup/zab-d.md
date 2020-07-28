ZooKeeper is a centralized service for maintaining configuration information, naming, providing distributed synchronization, and providing group services.

它是一个针对大型分布式系统的可靠协调系统，提供的功能包括：配置维护、名字服务、分布式同步、组服务等


- 事务ID(`Zxid`):  `Zxid` 是一个 64 位的数字，其中低 32 位是一个简单的单调递增的计数器，针对客户端每一个事务请求，计数器加 1；
而高 32 位则代表`Leader`周期`epoch`的编号，每个当选产生一个新的`Leader`服务器，就会从这个`Leader`服务器上取出其本地日志中最大事务的`Zxid`，并从中读取`epoch`值，然后加 1，以此作为新的`epoch`，并将低 32 位从 0 开始计数。

::: tip  epoch
可以理解为当前集群所处的年代或者周期，每个 leader 就像皇帝，都有自己的年号，所以每次改朝换代，leader 变更之后，都会在前一个年代的基础上加 1。这样就算旧的 leader 崩溃恢复之后，也没有人听他的了，因为 follower 只听从当前年代的 leader 的命令。
:::