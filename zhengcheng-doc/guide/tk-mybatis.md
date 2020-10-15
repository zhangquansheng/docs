# tk.mybatis 通用组件

::: tip 特别提示
基于[tk.mybatis](https://github.com/abel533/MyBatis-Spring-Boot)，数据库基于Mysql5.6以上
:::

## 安装

在 Maven 工程中使用

```xml
  <dependency>
        <groupId>com.zhengcheng</groupId>
        <artifactId>zc-tk-mybatis-spring-boot-starter</artifactId>
  </dependency>
```

自动配置如下（**注意mapper路径**）：
```java
package com.zhengcheng.tk.mybatis;

import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import tk.mybatis.spring.annotation.MapperScan;

/**
 * tk.mybatis 配置
 *
 * @author :    quansheng.zhang
 * @date :    2020/10/15 17:31
 */
@EnableTransactionManagement
@MapperScan(basePackages = "com.zhengcheng.**.mapper*")
@Configuration
public class TkMybatisAutoConfiguration {

}
```

## 属性设置

```properties
#mybatis
mybatis.type-aliases-package=tk.mybatis.springboot.model
mybatis.mapper-locations=classpath:mapper/*.xml

#mapper
#mappers 多个接口时逗号隔开
mapper.mappers=tk.mybatis.springboot.util.MyMapper
mapper.not-empty=false
mapper.identity=MYSQL

#pagehelper
pagehelper.helperDialect=mysql
pagehelper.reasonable=true
pagehelper.supportMethodsArguments=true
pagehelper.params=count=countSql
```