# 消息幂等的通用解决方案

## Exactly Once

::: tips Exactly Once的解释：
Exactly-Once 是指发送到消息系统的消息只能被消费端处理且仅处理一次，即使生产端重试消息发送导致某消息重复投递，该消息在消费端也只被消费一次。
:::

## 基于消息幂等表的非事务方案



---
**参考文档**

- [RocketMQ消息幂等的通用解决方案](https://mp.weixin.qq.com/s/X25Jw-sz3XItVrXRS6IQdg)