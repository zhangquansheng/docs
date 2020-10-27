# RocketMQ 消息幂等的通用解决方案

## 去重表

流程图:
![dedup-flow](/img/rocketmq/dedup-flow.png)

建立一张消息去重表，结构如下:
```sql
CREATE TABLE `zm_xtc_tr_tool_mq_dedup` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL COMMENT '创建时间',
  `update_time` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `consumer_group` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '消费者组名称',
  `topic` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '消息主题（不同topic消息不会认为重复）',
  `tag` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '消息的tag（同一个topic不同的tag，就算去重键一样也不会认为重复），没有tag则存""字符串',
  `data_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '消息的唯一键（建议使用业务主键）',
  `status` tinyint(4) NOT NULL COMMENT '这条消息的消费状态',
  `expire_time` bigint(20) NOT NULL COMMENT '这个去重记录的过期时间（时间戳）',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_key` (`consumer_group`,`topic`,`tag`,`data_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=155 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='教研工具-MQ消息去重表';
```

---

参考文档
- [RocketMQ消息幂等的通用解决方案](https://mp.weixin.qq.com/s/X25Jw-sz3XItVrXRS6IQdg)