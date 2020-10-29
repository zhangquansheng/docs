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




