# Spring Boot 集成 MapStruct

## MapStruct

`MapStruct` 是一个代码生成器，它基于约定优先于配置的方法，极大地简化了`javabean`类型之间映射的实现。
多层应用程序通常需要在不同的对象模型（例如实体和`DTO`）之间进行映射，编写这样的映射代码是一项乏味且容易出错的任务，`MapStruct`旨在通过尽可能自动化来简化这项工作。

与其他映射框架相比，`MapStruct`在编译时生成bean映射，且生成的映射代码**使用纯方法调用，因此速度快、类型安全且易于理解，所以确保了高性能，允许快速开发人员反馈和彻底的错误检查。（`BeanUtils`的`copyProperties`的方法利用了反射，有性能损耗）**

## mapstruct-lombok

`mapstruct`结合`lombok`使用需要在`plugin maven-compiler-plugin`下增加配置来解决`mapstruct`和`lombok`插件的冲突。
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!--
 Copyright MapStruct Authors.
 Licensed under the Apache License version 2.0, available at http://www.apache.org/licenses/LICENSE-2.0
-->
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>org.mapstruct.examples.lombok</groupId>
    <artifactId>mapstruct-examples-lombok</artifactId>
    <version>1.0-SNAPSHOT</version>

    <packaging>jar</packaging>
    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <maven.compiler.source>1.8</maven.compiler.source>
        <maven.compiler.target>1.8</maven.compiler.target>
        <org.mapstruct.version>1.4.1.Final</org.mapstruct.version>
        <org.projectlombok.version>1.18.12</org.projectlombok.version>
    </properties>

    <dependencies>

        <dependency>
            <groupId>org.mapstruct</groupId>
            <artifactId>mapstruct</artifactId>
            <version>${org.mapstruct.version}</version>
        </dependency>

        <!-- lombok dependencies should not end up on classpath -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <version>${org.projectlombok.version}</version>
            <scope>provided</scope>
        </dependency>

        <!-- IntelliJ pre 2018.1.1 requires the mapstruct processor to be present as provided dependency -->
<!--        <dependency>
            <groupId>org.mapstruct</groupId>
            <artifactId>mapstruct-processor</artifactId>
            <version>${org.mapstruct.version}</version>
            <scope>provided</scope>
        </dependency>-->
    </dependencies>

    <build>
        <pluginManagement>
            <plugins>
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-compiler-plugin</artifactId>
                    <version>3.8.1</version>
                    <configuration>
                        <source>1.8</source>
                        <target>1.8</target>
                        <!-- See https://maven.apache.org/plugins/maven-compiler-plugin/compile-mojo.html -->
                        <!-- Classpath elements to supply as annotation processor path. If specified, the compiler   -->
                        <!-- will detect annotation processors only in those classpath elements. If omitted, the     -->
                        <!-- default classpath is used to detect annotation processors. The detection itself depends -->
                        <!-- on the configuration of annotationProcessors.                                           -->
                        <!--                                                                                         -->
                        <!-- According to this documentation, the provided dependency processor is not considered!   -->
                        <annotationProcessorPaths>
                            <path>
                                <groupId>org.mapstruct</groupId>
                                <artifactId>mapstruct-processor</artifactId>
                                <version>${org.mapstruct.version}</version>
                            </path>
                            <path>
                                <groupId>org.projectlombok</groupId>
                                <artifactId>lombok</artifactId>
                                <version>${org.projectlombok.version}</version>
                            </path>
                        </annotationProcessorPaths>
                    </configuration>
                </plugin>
            </plugins>
        </pluginManagement>
    </build>
</project>
```

::: warning 特别注意
`mapstruct`的版本为`1.4.1.Final`，`lombok`的版本`1.18.12`，版本不对应会导致编译失败。
:::

## mapstruct-field-mapping

- Customer.java
```java
public class Customer {

    private Long id;
    private String name;
    private Collection<OrderItem> orderItems;
}
```

- CustomerDto.java
```java
public class CustomerDto {

    public Long id;
    public String customerName;
    public List<OrderItemDto> orders;
}
```

- OrderItem.java
```java
public class OrderItem {

    private String name;
    private Long quantity;
}
```

- OrderItemDto.java
```java
public class OrderItemDto {

    public String name;
    public Long quantity;
}
```

- OrderItemMapper.java
```java
@Mapper
public interface OrderItemMapper {

    OrderItemMapper MAPPER = Mappers.getMapper(OrderItemMapper.class);

    OrderItem toOrder(OrderItemDto orderItemDto);

    @InheritInverseConfiguration
    OrderItemDto fromOrder(OrderItem orderItem);
}
```

- CustomerMapper.java
```java
@Mapper(uses = { OrderItemMapper.class })
public interface CustomerMapper {

    CustomerMapper MAPPER = Mappers.getMapper( CustomerMapper.class );

    @Mapping(source = "orders", target = "orderItems")
    @Mapping(source = "customerName", target = "name")
    Customer toCustomer(CustomerDto customerDto);

    @InheritInverseConfiguration
    CustomerDto fromCustomer(Customer customer);
}
```

## Mapstruct 中使用 lombok @Builder 丢失父类属性问题

(推荐)项目中使用`MybatisPlus`的情况下，所有的`Entity`的父类代码如下（其中`Model`是一个开源的`MybatisPlus`,数据库Entity需要继承该`Model`才可以使用基础的`CRUD`）：
```java
/**
 * The class Base entity.
 *
 * @author :    quansheng.zhang
 * @date :    2019/2/28 21:00
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class BaseEntity<T extends Model<?>> extends Model<T> {
    private static final long serialVersionUID = -2237290464565384433L;
    /**
     * 主键ID
     */
    @TableId(type = IdType.AUTO)
    private Integer id;
    /**
     * 创建人
     */
    @TableField(fill = FieldFill.INSERT)
    private Integer createdUser;
    /**
     * 记录创建时间，默认当前时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdTime;
    /**
     * 更新人
     */
    @TableField(fill = FieldFill.INSERT)
    private Integer updatedUser;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedTime;
    /**
     * 是否删除
     */
    @TableField(value = "deleted", fill = FieldFill.INSERT)
    private boolean deleted;

    @Override
    protected Serializable pkVal() {
        return this.id;
    }
}
```
我们知道，lombok 的 `@Builder`注解无法对父类属性进行赋值（@SuperBuilder还是实验阶段），所以`Mapstruct`无法对`Entity`父类的属性赋值。

**可以使用`builder = @Builder(disableBuilder = true)`来关闭`mapstruct`使用`builder`解决此问题**。
```java
@Mapper(componentModel = "spring", builder = @Builder(disableBuilder = true))
public interface EntityAssembler {

}
```

## Mapstruct 中使用 MybatisPlus 通用枚举赋值

枚举属性，实现 IEnum 接口如下：
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

`enum` 转换成 `int`
```java
@Mappings({
        @Mapping(target = "age", source = "age.value")
})
```


---

**参考文档**

- [官方文档](https://mapstruct.org/documentation/stable/reference/html/)
- [mapstruct-lombok](https://github.com/mapstruct/mapstruct-examples/tree/master/mapstruct-lombok)
- [https://mapstruct.org/](https://mapstruct.org/)