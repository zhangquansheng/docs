# Spring Event 业务解耦

[官方文档](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#context-functionality-events)

`Spring Event（Application Event`）其实就是一个观察者设计模式，一个 `Bean` 处理完成任务后希望通知其它人 `Bean` 或者说一个 `Bean` 想观察监听另一个`Bean` 的行为。