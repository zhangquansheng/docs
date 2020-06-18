---
sidebarDepth: 3
---

# Mybatis3通过provider注解结合动态sql实现CRUD

::: tip 特别提示
实际项目中推荐使用[Mybatis-Plus](/guide/db.md),此篇文章重点在于它的架构思路，并且它的实现方式也借鉴了Mybatis-Plus。

代码地址 [zc-mybatis-spring-boot-starter](https://gitee.com/zhangquansheng/zhengcheng-parent/tree/master/zc-mybatis-spring-boot-starter)
:::

## 注解

### [@TableName](https://gitee.com/zhangquansheng/zhengcheng-parent/blob/master/zc-mybatis-spring-boot-starter/src/main/java/com/zhengcheng/mybatis/annotation/TableName.java)
- 描述：表名注解

| 属性 | 类型 | 必须指定 | 默认值 | 描述 |
| :-: | :-: | :-: | :-: | --- |
| value | String | 否 | "" | 表名 |


### [@TableId](https://gitee.com/zhangquansheng/zhengcheng-parent/blob/master/zc-mybatis-spring-boot-starter/src/main/java/com/zhengcheng/mybatis/annotation/TableId.java)
- 描述：主键注解

| 属性 | 类型 | 必须指定 | 默认值 | 描述 |
| :-: | :-: | :-: | :-: | :-: |
| value | String | 否 | "" | 主键字段名 |
| type | Enum | 否 | IdType.NONE | 主键类型 |



### [@TableField](https://gitee.com/zhangquansheng/zhengcheng-parent/blob/master/zc-mybatis-spring-boot-starter/src/main/java/com/zhengcheng/mybatis/annotation/TableField.java)
- 描述：字段注解(非主键)

| 属性 | 类型 | 必须指定 | 默认值 | 描述 |
| :-: | :-: | :-: | :-: | --- |
| value | String | 否 | "" | 表名 |
| exist | boolean | 否 | true | 是否为数据库表字段 |
| select | boolean | 否 | true | 是否进行 select 查询 |


## CRUD 接口

::: tip 说明:
- 通用 CRUD 封装[BaseMapper](https://gitee.com/zhangquansheng/zhengcheng-parent/blob/master/zc-mybatis-spring-boot-starter/src/main/java/com/zhengcheng/mybatis/mapper/BaseMapper.java)接口，为 `zc-Mybatis` 启动时自动解析实体表关系映射转换为 `Mybatis` 内部对象注入容器
- 泛型 `T` 为任意实体对象
- 参数 `Serializable` 为任意类型主键 `zc-Mybatis` 不推荐使用复合主键约定每一张表都有自己的唯一 `id` 主键
:::

### Insert
``` java
    /**
     * 插入一条记录
     *
     * @param entity 实体对象
     * @return 新增的记录个数
     */
    @InsertProvider(type = DefaultSqlProvider.class, method = "insert")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(T entity);
```
##### 参数说明
| 类型 | 参数名 | 描述 |
| :-: | :-: | :-: |
| T | entity | 实体对象 |

### Delete
``` java
    /**
     * 根据 ID 删除
     *
     * @param id 主键ID
     * @return 被删除记录个数
     */
    @DeleteProvider(type = DefaultSqlProvider.class, method = "deleteById")
    int deleteById(Serializable id);

    /**
     * 根据 ID列表 批量删除
     *
     * @param id 主键ID列表
     * @return 被删除记录个数
     */
    @DeleteProvider(type = DefaultSqlProvider.class, method = "deleteBatchIds")
    int deleteBatchIds(@Param("id") Collection<? extends Serializable> id);
```
##### 参数说明
| 类型 | 参数名 | 描述 |
| :-: | :-: | :-: |
| Collection&#60;? extends Serializable&#62; | idList | 主键ID列表(不能为 null 以及 empty) |
| Serializable | id | 主键ID |

### Update
``` java
    /**
     * 根据 ID 修改
     *
     * @param entity 实体对象
     * @return 被修改记录个数
     */
    @UpdateProvider(type = DefaultSqlProvider.class, method = "updateById")
    int updateById(T entity);
```
##### 参数说明
| 类型 | 参数名 | 描述 |
| :-: | :-: | :-: |
| T | entity | 实体对象 (set 条件值,可为 null) |


### Select
``` java
/**
     * 根据 ID 查询
     *
     * @param id 主键ID
     * @return 实体
     */
    @SelectProvider(type = DefaultSqlProvider.class, method = "selectById")
    T selectById(Serializable id);

    /**
     * 查询（根据ID 批量查询）
     *
     * @param id 主键ID列表(不能为 null 以及 empty)
     * @return 实体
     */
    @SelectProvider(type = DefaultSqlProvider.class, method = "selectBatchIds")
    List<T> selectBatchIds(@Param("id") Collection<? extends Serializable> id);

    /**
     * 查询所有
     *
     * @return 实体
     */
    @SelectProvider(type = DefaultSqlProvider.class, method = "list")
    List<T> list();
```
##### 参数说明
| 类型 | 参数名 | 描述 |
| :-: | :-: | :-: |
| Serializable | id | 主键ID |
| Collection&#60;? extends Serializable&#62; | idList | 主键ID列表(不能为 null 以及 empty) |