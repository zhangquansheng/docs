# Java命名规范参考

## 为什么需要重视命名？

**好的命名即是注释，别人一看到你的命名就知道你的变量、方法或者类是做什么的！ 好的命名对于其他人（包括你自己）理解你的代码有着很大的帮助！**

《Clean Code》这本书明确指出：

好的代码本身就是注释，我们要尽量规范和美化自己的代码来减少不必要的注释。
若编程语言足够有表达力，就不需要注释，尽量通过代码来阐述。

举个例子：去掉下面复杂的注释，只需要创建一个与注释所言同一事物的函数即可

```java
 // check to see if the employee is eligible for full benefits
 if ((employee.flags & HOURLY_FLAG) && (employee.age > 65))
```
应替换为
```java
 if (employee.isEligibleForFullBenefits())
```

## 常见的命名法

1. 大驼峰命名法（`UpperCamelCase`）: 类名需要使用大驼峰命名法
2. 小驼峰命名法（`lowerCamelCase`）: 方法名、参数名、成员变量、局部变量需要使用小驼峰命名法
3. 蛇形命名法（`snake_case`）: 测试方法名、常量、枚举名称需要使用蛇形命名法
4. 串式命名法（`kebab-case`）: 建议项目文件夹名称使用串式命名法

类型 |	约束 |	例 
---|---|---
项目名 |	串式命名法（`kebab-case`）：全部小写，多个单词用中划线分隔‘-’ |	spring-cloud
包名 |	全部小写 |	com.alibaba.fastjson
类名 |	大驼峰命名法（`UpperCamelCase`）：单词首字母大写 |	Feature, ParserConfig,DefaultFieldDeserializer
变量名 |	小驼峰命名法（`lowerCamelCase`）：首字母小写，多个单词组成时，除首个单词，其他单词首字母都要大写 |	password, userName
常量名 |	全部大写，多个单词，用'_'分隔 |	CACHE_EXPIRED_TIME
方法 |	小驼峰命名法（`lowerCamelCase`） |	read(), readObject(), getById()

---

**参考文档**
- [Google Java 代码指南](https://google.github.io/styleguide/javaguide.htm)
- 《Clean Code》
- 《阿里巴巴 Java 开发手册》