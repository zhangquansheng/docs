# Arthas 

## trace 命令

> 方法内部调用路径，并输出方法路径上的每个节点上耗时

`trace`命令能主动搜索`class-pattern／method-pattern`对应的方法调用路径，渲染和统计整个调用链路上的所有性能开销和追踪调用链路。

`trace`函数
```shell script
# trace 类路径 方法名
trace com.zhangmen.zmbiz.domain.* initPreCheckEntity* '#cost > 10'
```

**参考文档**
- [命令列表](https://arthas.aliyun.com/doc/commands.html)
- [trace在线教程](https://arthas.aliyun.com/doc/arthas-tutorials.html?language=cn&id=command-trace)