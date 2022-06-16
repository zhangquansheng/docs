---
sidebarDepth: 3
---

# 商品管理

## 一、SPU 与 SKU

- `SPU`：标准化产品单元(`Standard Product Unit`),是商品信息聚合的最小单位，是一组可复用标准化信息的集合；
- `SKU`：最小的库存单位(`StockKeeping Unit`),可以以件，盒，箱，千克等为单位存储，商品的进货、销售、售价、库存等最终都是以`SKU`为准的；

一个`SPU`可以包含多个`SKU`，`SKU`一般是根据`SPU`的销售属性组合（笛卡尔乘积）；

如华为`Mate30`手机是一个产品，但是它有白色、金色、黑色三种颜色可选，根据规格属性又有64G、128G、256G存储，这时就共会产生9个SKU（3种颜色*3种内存规格）。

## 二、商品分类

商品分类是系统中非常重要的部分，它分为**前端分类**与**后端分类**。


## 三、前端组件：SkuTable 组件

[在线演示](https://www.jq22.com/yanshi24163)

### 单规格

![](https://s3.bmp.ovh/imgs/2021/12/149b1ebd0c1e9640.png)

### **多规格**

![](https://s3.bmp.ovh/imgs/2021/12/b4b94b777937150a.png)

## 四、ER图

> 

## 五、数据表

### 商品SPU表

```sql
CREATE TABLE `product_spu` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `spu_no` varchar(64) NOT NULL COMMENT '编号',
  `name` varchar(128) NOT NULL COMMENT '名称',
  `image` varchar(255) DEFAULT NULL COMMENT '展示图片',
  `unit` varchar(64) DEFAULT NULL COMMENT '单位',
  `weight` int(11) DEFAULT NULL COMMENT '重量',
  `is_marketable` tinyint(3) NOT NULL COMMENT '是否上架',
  `is_top` tinyint(3) NOT NULL COMMENT '是否置顶',
  `introduction` varchar(1024) DEFAULT NULL COMMENT '介绍',
  `memo` varchar(255) DEFAULT NULL COMMENT '备注',
  `keyword` varchar(255) DEFAULT NULL COMMENT '搜索关键词',
  `specification_mode` int(1) unsigned NOT NULL DEFAULT '0' COMMENT '商品规格模式，0单规格 1多规格',
  `product_category_id` bigint(20) NOT NULL COMMENT '商品分类',
  `brand_id` bigint(20) NOT NULL COMMENT '商品品牌',
  `is_deleted` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '是否删除',
  `create_user_id` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '创建人',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间，默认当前时间',
  `update_user_id` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '更新人',
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间，默认当前时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `unique_spu_no` (`spu_no`),
  KEY `idx_create_time` (`create_time`) USING BTREE,
  KEY `idx_update_time` (`update_time`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='商品SPU表';
```

### 商品SKU表

```sql
CREATE TABLE `product_sku` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `sku_no` varchar(64) NOT NULL COMMENT '编号',
  `full_name` varchar(255) DEFAULT NULL COMMENT '全称',
  `price` int(11) NOT NULL COMMENT '销售价，单位分',
  `cost` int(11) NOT NULL COMMENT '成本价',
  `market_price` int(11) NOT NULL COMMENT '市场价',
  `stock` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '库存',
  `allocated_stock` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '已分配库存',
  `stock_memo` varchar(128) DEFAULT NULL COMMENT '库存备注',
  `is_enable` tinyint(3) NOT NULL COMMENT '是否启用',
  `spu_id` bigint(20) NOT NULL COMMENT 'SPU ID',
  `spu_no` varchar(64) NOT NULL COMMENT ' SPU 编号',
  `is_deleted` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '是否删除',
  `create_user_id` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '创建人',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间，默认当前时间',
  `update_user_id` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '更新人',
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间，默认当前时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `unique_sku_no` (`sku_no`),
  KEY `idx_create_time` (`create_time`) USING BTREE,
  KEY `idx_update_time` (`update_time`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=107 DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='商品SKU表';
```

### 商品规格值表

```sql
CREATE TABLE `product_specification_value` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `product_sku_id` bigint(20) NOT NULL COMMENT 'skuId',
  `specification_value_id` bigint(20) NOT NULL COMMENT '规格值ID',
  `is_deleted` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '是否删除',
  `create_user_id` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '创建人',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间，默认当前时间',
  `update_user_id` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '更新人',
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间，默认当前时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_create_time` (`create_time`) USING BTREE,
  KEY `idx_update_time` (`update_time`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=2566 DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='商品规格值表';
```

### 商品属性表

```sql
CREATE TABLE `product_attribute` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `product_spu_id` bigint(20) NOT NULL COMMENT 'spuId',
  `attribute_id` bigint(20) NOT NULL COMMENT '属性ID',
  `value` varchar(255) DEFAULT NULL COMMENT '属性值',
  `is_deleted` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '是否删除',
  `create_user_id` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '创建人',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间，默认当前时间',
  `update_user_id` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '更新人',
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间，默认当前时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_create_time` (`create_time`) USING BTREE,
  KEY `idx_update_time` (`update_time`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='商品属性表';
```

### 规格表

```sql
CREATE TABLE `specification` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `product_category_id` bigint(20) NOT NULL COMMENT '商品分类ID',
  `name` varchar(32) NOT NULL COMMENT '规格值',
  `memo` varchar(255) DEFAULT NULL COMMENT '备注',
  `sort` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '排序值',
  `is_deleted` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '是否删除',
  `create_user_id` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '创建人',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间，默认当前时间',
  `update_user_id` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '更新人',
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间，默认当前时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_create_time` (`create_time`) USING BTREE,
  KEY `idx_update_time` (`update_time`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='规格表';
```

### 规格值表

```sql
CREATE TABLE `specification_value` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `specification_id` bigint(20) NOT NULL COMMENT '规格ID',
  `name` varchar(32) NOT NULL COMMENT '规格值',
  `is_deleted` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '是否删除',
  `create_user_id` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '创建人',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间，默认当前时间',
  `update_user_id` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '更新人',
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间，默认当前时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_create_time` (`create_time`) USING BTREE,
  KEY `idx_update_time` (`update_time`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='规格值表';
```

### 属性表

```sql
CREATE TABLE `attribute` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `title` varchar(64) NOT NULL COMMENT '属性标题',
  `type` tinyint(3) NOT NULL COMMENT '类型：1-输入框，2-单选，3-多选',
  `sort` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '排序值',
  `is_deleted` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '是否删除',
  `create_user_id` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '创建人',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间，默认当前时间',
  `update_user_id` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '更新人',
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间，默认当前时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_create_time` (`create_time`) USING BTREE,
  KEY `idx_update_time` (`update_time`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='属性表';
```

### 属性选项表

```sql
CREATE TABLE `attribute_option` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `attribute_id` bigint(20) NOT NULL COMMENT '属性ID',
  `value` varchar(64) NOT NULL COMMENT '选项值',
  `sort` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '排序值',
  `is_deleted` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '是否删除',
  `create_user_id` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '创建人',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间，默认当前时间',
  `update_user_id` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '更新人',
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间，默认当前时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_create_time` (`create_time`) USING BTREE,
  KEY `idx_update_time` (`update_time`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='属性选项表';
```