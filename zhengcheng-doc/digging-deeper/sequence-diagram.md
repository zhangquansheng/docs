# 时序图

> 转载 https://mp.weixin.qq.com/s/TTG6-KxbYwmAanzgxr638g 侵权联系作者删除

## 什么是时序图？

时序图(Sequence Diagram)，又名序列图、循序图，是一种UML交互图。它通过描述对象之间发送消息的时间顺序显示多个对象之间的动态协作，包括发送消息、接收消息、处理消息、返回消息等。
时序图重在展示对象之间的交互顺序，尤其强调交互的时间顺序，它可以直观的描述并发进程。

## 时序图的组成元素

时序图的组成元素主要有5种：

1. 角色(Actor)
   系统角色，可以是人或者其他系统和子系统，以一个小人图标表示。

2. 对象(Object)
   对象位于时序图的顶部，以一个矩形表示。对象的命名方式一般有三种： 1）对象名和类名。例如：华为手机:手机。 2）只显示类名，不显示对象，即为一个匿名对象。例如：:手机，在时序图中，用“：类”表示。
   3）只显示对象名，不显示类名。例如：华为手机:，在时序图中，用“对象:”表示。

3. 生命线(LifeLine)
   时序图中每个对象和底部中心都有一条垂直的虚线，这就是对象的生命线(对象的时间线)，以一条垂直的虚线表示。对象间的消息存在于两条虚线间。

4. 激活期(Activation)
   又叫控制焦点，它代表时序图中在对象时间线上某段时期执行的操作，以一个很窄的矩形表示。

5. 消息(Message)
   表示对象之间发送的信息。消息分为三种类型。

    - 1）同步消息(Synchronous Message)。消息的发送者把控制传递给消息的接收者，然后停止活动，等待消息的接收者放弃或者返回控制。用来表示同步的意义，以一条实线和实心箭头表示。
    - 2）异步消息(Asynchronous Message)。消息发送者通过消息把信号传递给消息的接收者，然后继续自己的活动，不等待接受者返回消息或者控制。异步消息的接收者和发送者是并发工作的，以一条实线和大于号表示。
    - 3）返回消息(Return Message)。返回消息表示从过程调用返回，以小于号和虚线表示。

## 时序图优质模板

### 微信支付时序图

![微信支付时序图](/img/digging-deeper/wxpay-sequence-diagram.png)
