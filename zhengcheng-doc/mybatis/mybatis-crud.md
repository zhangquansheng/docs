---
sidebarDepth: 3
---

# Mybatis3 通过 provider 注解结合动态 sql 实现 CRUD

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

## DefaultSqlProvider

```java
import cn.hutool.core.text.StrBuilder;
import cn.hutool.core.util.StrUtil;
import com.zhengcheng.mybatis.mapper.BaseMapper;
import com.zhengcheng.mybatis.metadata.TableInfo;
import com.zhengcheng.mybatis.metadata.TableInfoHelper;
import com.zhengcheng.mybatis.model.BaseEntity;
import lombok.extern.slf4j.Slf4j;
import org.apache.ibatis.builder.annotation.ProviderContext;
import org.apache.ibatis.jdbc.SQL;
import org.springframework.core.ResolvableType;

import java.io.Serializable;
import java.lang.reflect.Type;
import java.text.MessageFormat;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Objects;

/**
 * 默认 SQL 提供者
 *
 * @author :    zhangquansheng
 * @date :    2020/3/28 14:45
 */
@Slf4j
public class DefaultSqlProvider<T extends BaseEntity> {

    private final static int MAX_SIZE = 1000;

    public String insert(BaseEntity baseEntity) {
        baseEntity.setGmtCreate(LocalDateTime.now());
        baseEntity.setGmtModified(LocalDateTime.now());

        TableInfo tableInfo = getTableInfo(baseEntity.getClass());
        SQL sql = new SQL();
        sql.INSERT_INTO(tableInfo.getTableName());
        tableInfo.getFieldList().forEach(tableFieldInfo -> {
            if (StrUtil.equals(tableFieldInfo.getColumn(), tableInfo.getKeyColumn())) {
                return;
            }
            sql.VALUES(String.format("`%s`", tableFieldInfo.getColumn()), String.format("#{%s}", tableFieldInfo.getProperty()));
        });
        return getSql(sql);
    }

    public String deleteById(ProviderContext context) {
        TableInfo tableInfo = getTableInfo(getEntityClass(context));
        SQL sql = new SQL();
        sql.DELETE_FROM(tableInfo.getTableName());
        sql.WHERE(String.format("`%s` = #{%s}", tableInfo.getKeyColumn(), tableInfo.getKeyProperty()));
        return getSql(sql);
    }

    public String deleteBatchIds(ProviderContext context, Collection<? extends Serializable> id) {
        TableInfo tableInfo = getTableInfo(getEntityClass(context));
        SQL sql = new SQL();
        sql.DELETE_FROM(tableInfo.getTableName());
        sql.WHERE(String.format("`%s` IN %s", tableInfo.getKeyColumn(), inExpression(tableInfo.getKeyProperty(), id.size())));
        return getSql(sql);
    }

    public String selectById(ProviderContext context) {
        TableInfo tableInfo = getTableInfo(getEntityClass(context));
        SQL sql = new SQL();
        sql.SELECT(tableInfo.getAllFieldString());
        sql.FROM(tableInfo.getTableName());
        sql.WHERE(String.format("`%s` = #{%s}", tableInfo.getKeyColumn(), tableInfo.getKeyProperty()));
        return sql.toString();
    }

    public String selectBatchIds(ProviderContext context, Collection<? extends Serializable> id) {
        SQL sql = new SQL();
        TableInfo tableInfo = getTableInfo(getEntityClass(context));
        sql.SELECT(tableInfo.getAllFieldString());
        sql.FROM(tableInfo.getTableName());
        sql.WHERE(String.format("`%s` IN %s", tableInfo.getKeyColumn(), inExpression(tableInfo.getKeyProperty(), id.size())));
        return getSql(sql);
    }

    public String updateById(BaseEntity baseEntity) {
        baseEntity.setGmtModified(LocalDateTime.now());

        TableInfo tableInfo = getTableInfo(baseEntity.getClass());
        SQL sql = new SQL();
        sql.UPDATE(tableInfo.getTableName());
        tableInfo.getFieldList().forEach(tableFieldInfo -> {
            if (StrUtil.equals(tableFieldInfo.getColumn(), tableInfo.getKeyColumn())) {
                return;
            }
            sql.SET(String.format("%s = #{%s}", tableFieldInfo.getColumn(), tableFieldInfo.getProperty()));
        });
        sql.WHERE(String.format("`%s` = #{%s}", tableInfo.getKeyColumn(), tableInfo.getKeyProperty()));
        return getSql(sql);
    }

    public String list(ProviderContext context) {
        SQL sql = new SQL();
        TableInfo tableInfo = getTableInfo(getEntityClass(context));
        sql.SELECT(tableInfo.getAllFieldString());
        sql.FROM(tableInfo.getTableName());
        sql.LIMIT(MAX_SIZE);
        return getSql(sql);
    }

    private String getSql(SQL sql) {
        String sqlStr = sql.toString();
        if (log.isDebugEnabled()) {
            log.debug("sql:[{}]", sqlStr);
        }
        return sqlStr;
    }

    private String inExpression(String property, int size) {
        MessageFormat messageFormat = new MessageFormat("#'{'" + property + "[{0}]}");
        StrBuilder sb = StrBuilder.create(" (");
        for (int i = 0; i < size; i++) {
            sb.append(messageFormat.format(new Object[]{i}));
            if (i != size - 1) {
                sb.append(", ");
            }
        }
        return sb.append(")").toString();
    }

    private Class<?> getEntityClass(ProviderContext context) {
        Class<?> mapperType = context.getMapperType();
        for (Type parent : mapperType.getGenericInterfaces()) {
            ResolvableType parentType = ResolvableType.forType(parent);
            if (parentType.getRawClass() == BaseMapper.class) {
                return parentType.getGeneric(0).getRawClass();
            }
        }
        return null;
    }

    private TableInfo getTableInfo(Class<?> clazz) {
        TableInfo tableInfo = TableInfoHelper.getTableInfo(clazz);
        if (Objects.isNull(tableInfo)) {
            tableInfo = TableInfoHelper.initTableInfo(clazz);
        }
        return tableInfo;
    }

}
```