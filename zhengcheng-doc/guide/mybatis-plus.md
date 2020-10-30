# mybatis-plus 通用组件

::: tip 特别提示
基于[MybatisPlus](https://mp.baomidou.com/)，数据库基于Mysql5.6以上
:::

## 安装

在 Maven 工程中使用

```xml
  <dependency>
        <groupId>com.zhengcheng</groupId>
        <artifactId>zc-mybatis-plus-spring-boot-starter</artifactId>
  </dependency>
```

## 属性设置

```properties
mybatis-plus.mapper-locations = classpath*:**/*Mapper.xml
mybatis-plus.type-aliases-package = com.zhengcheng.user.entity
mybatis-plus.configuration.map-underscore-to-camel-case = true
mybatis-plus.type-enums-package = com.zhengcheng.user.enums
```

> 更多设置请参考[MybatisPlus官方文档](https://mp.baomidou.com/)


## 核心功能

`zhengcheng` 按照阿里巴巴[JAVA 开发手册](https://gitee.com/zhangquansheng/zhengcheng-parent/blob/master/doc/Java-huashanxinban.pdf)规定，每张数据库表都有以下的公共字段：
```sql
CREATE TABLE `t_base` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  `update_time` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` tinyint unsigned NOT NULL COMMENT '是否删除',
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4  ROW_FORMAT=REDUNDANT COMMENT='公共字段模板表';
```

当你在项目中的`entity`继承`BaseEntity`后，就自动拥有了公共字段，不需要你在添加、更新时维护，代码示例如下:

- 表对应的实体
```java
import com.baomidou.mybatisplus.annotation.TableName;
import com.zhengcheng.mybatis.plus.model.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

/**
 * 数据字典表(DictItem)实体类
 *
 * @author quansheng1.zhang
 * @since 2020-10-29 20:15:38
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Accessors(chain = true)
@TableName("t_dict_item")
public class DictItem extends BaseEntity<DictItem> {
    private static final long serialVersionUID = 836566997638888136L;
    /**
     * 类型
     */
    private String type;
    /**
     * 字典编码
     */
    private String code;
    /**
     * 字典名称
     */
    private String name;

}
```

- 添加记录
```java
    @Autowired
    private IDictItemService dictItemService;

    DictItem dictItem = this.toEntity(dictItemCommand);
    dictItemService.save(dictItem);


    private DictItem toEntity(DictItemCommand dictItemCommand) {
        DictItem dictItem = new DictItem();
        dictItem.setType(dictItemCommand.getType());
        dictItem.setCode(dictItemCommand.getCode());
        dictItem.setName(dictItemCommand.getName());

        return dictItem;
    }
```

- 解决了繁琐的配置，让`mybatis`优雅的使用枚举属性！对应代码如下：
```java
public enum AgeEnum implements IEnum<Integer> {
    ONE(1, "一岁"),
    TWO(2, "二岁"),
    THREE(3, "三岁");
    
    private int value;
    private String desc;
    
    @Override
    public Integer getValue() {
        return this.value;
    }
}
```
> 更多请参考[MybatisPlus 通用枚举](https://baomidou.com/guide/enum.html)


