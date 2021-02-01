# 核心概念

## SQL

### 逻辑表

水平拆分的数据库（表）的相同逻辑和数据结构表的总称。例：订单数据根据主键尾数拆分为`10`张表，分别是`t_order_0`到`t_order_9`，他们的逻辑表名为`t_order`。

### 真实表
在分片的数据库中真实存在的物理表。即上个示例中的`t_order_0`到`t_order_9`。

### 数据节点

数据分片的最小单元。由数据源名称和数据表组成，例：`ds_0.t_order_0`。

### 绑定表

指分片规则一致的主表和子表。例如`t_order`表和`t_order_item`表，均按照`order_id`分片，则此两张表互为绑定表关系。绑定表之间的多表关联查询不会出现笛卡尔积关联，关联查询效率将大大提升。举例说明，如果 `SQL` 为：

```sql
SELECT i.* FROM t_order o JOIN t_order_item i ON o.order_id=i.order_id WHERE o.order_id in (10, 11);
```
在不配置绑定表关系时，假设分片键 `order_id` 将数值 `10` 路由至第 `0` 片，将数值 `11` 路由至第 `1` 片，那么路由后的 `SQL` 应该为 `4` 条，它们呈现为笛卡尔积：

```sql
SELECT i.* FROM t_order_0 o JOIN t_order_item_0 i ON o.order_id=i.order_id WHERE o.order_id in (10, 11);

SELECT i.* FROM t_order_0 o JOIN t_order_item_1 i ON o.order_id=i.order_id WHERE o.order_id in (10, 11);

SELECT i.* FROM t_order_1 o JOIN t_order_item_0 i ON o.order_id=i.order_id WHERE o.order_id in (10, 11);

SELECT i.* FROM t_order_1 o JOIN t_order_item_1 i ON o.order_id=i.order_id WHERE o.order_id in (10, 11);
```

在配置绑定表关系后，路由的 SQL 应该为 2 条：

```sql
SELECT i.* FROM t_order_0 o JOIN t_order_item_0 i ON o.order_id=i.order_id WHERE o.order_id in (10, 11);

SELECT i.* FROM t_order_1 o JOIN t_order_item_1 i ON o.order_id=i.order_id WHERE o.order_id in (10, 11);
```

其中 t_order 在 FROM 的最左侧，`ShardingSphere` 将会以它作为整个绑定表的主表。 所有路由计算将会只使用主表的策略，那么 `t_order_item` 表的分片计算将会使用 `t_order` 的条件。故绑定表之间的分区键要完全相同。

### 广播表

指所有的分片数据源中都存在的表，表结构和表中的数据在每个数据库中均完全一致。适用于数据量不大且需要与海量数据的表进行关联查询的场景，例如：字典表。

## 分片

### 分片键

用于分片的数据库字段，是将数据库（表）水平拆分的关键字段。例：将订单表中的订单主键的尾数取模分片，则订单主键为分片字段。 SQL 中如果无分片字段，将执行全路由，性能较差。 除了对单分片字段的支持，Apache ShardingSphere 也支持根据多个字段进行分片。

### 分片算法

通过分片算法将数据分片，支持通过 `=`、`>=`、`<=`、`>`、`<`、`BETWEEN` 和 `IN` 分片。 分片算法需要**应用方开发者自行实现**，可实现的灵活度非常高。

目前提供`4`种分片算法。 **由于分片算法和业务实现紧密相关，因此并未提供内置分片算法，而是通过分片策略将各种场景提炼出来，提供更高层级的抽象，并提供接口让应用开发者自行实现分片算法。**

- 标准分片算法

> 对应 `StandardShardingAlgorithm`，用于处理使用单一键作为分片键的 =、IN、BETWEEN AND、>、<、>=、<=进行分片的场景。需要配合 `StandardShardingStrategy` 使用。

- 复合分片算法

> 对应 `ComplexKeysShardingAlgorithm`，用于处理使用多键作为分片键进行分片的场景，包含多个分片键的逻辑较复杂，需要应用开发者自行处理其中的复杂度。需要配合 `ComplexShardingStrategy` 使用。

- Hint分片算法

> 对应 `HintShardingAlgorithm`，用于处理使用 Hint 行分片的场景。需要配合 `HintShardingStrategy` 使用。

### 分片策略

 包含分片键和分片算法，由于分片算法的独立性，将其独立抽离。真正可用于分片操作的是分片键 + 分片算法，也就是分片策略。目前提供 5 种分片策略。
 
- 标准分片策略

> 对应 `StandardShardingStrategy`。提供对`SQL`语句中的 `=`, `>`, `<`, `>=`, `<=`, `IN` 和 `BETWEEN AND` 的分片操作支持。 `StandardShardingStrategy` 只支持单分片键，提供 `PreciseShardingAlgorithm` 和 `RangeShardingAlgorithm` 两个分片算法。 `PreciseShardingAlgorithm` 是必选的，用于处理 = 和 IN 的分片。 
> `RangeShardingAlgorithm` 是可选的，用于处理 `BETWEEN AND`, `>`, `<`, `>=`, `<=`分片，如果不配置 `RangeShardingAlgorithm`，`SQL` 中的 `BETWEEN AND` 将按照全库路由处理。
 
- 复合分片策略

> 对应 `ComplexShardingStrategy`。复合分片策略。提供对 SQL 语句中的 `=`, `>`, `<`, `>=`, `<=`, `IN` 和 `BETWEEN AND` 的分片操作支持。 `ComplexShardingStrategy` 支持多分片键，由于多分片键之间的关系复杂，因此并未进行过多的封装，而是直接将分片键值组合以及分片操作符透传至分片算法，完全由应用开发者实现，提供最大的灵活度。
 
- Hint分片策略

> 对应 `HintShardingStrategy`。通过 `Hint` 指定分片值而非从 SQL 中提取分片值的方式进行分片的策略。
 
- 不分片策略

> 对应 `NoneShardingStrategy`。不分片的策略。
 
### SQL Hint

 对于分片字段非 `SQL` 决定，而由其他外置条件决定的场景，可使用 `SQL Hint`灵活的注入分片字段。 例：内部系统，按照员工登录主键分库，而数据库中并无此字段。SQL Hint 支持通过 Java API 和 SQL 注释（待实现）两种方式使用。 详情请参见强制分片路由。