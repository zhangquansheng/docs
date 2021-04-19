---
sidebarDepth: 3
---

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


## 类命名

类名使用大驼峰命名形式，类命通常时名词或名词短语，接口名除了用名词和名词短语以外，还可以使用形容词或形容词短语，如 `Cloneable`，`Callable` 等，
表示实现该接口的类有某种功能或能力。对于测试类则以它要测试的类开头，以`Test`结尾，如`HashMapTest`。

属性 |	约束 |	例
---|---|---
抽象类 |	Abstract 或者 Base 开头 |	BaseUserService
枚举类 |	Enum 作为后缀 |	GenderEnum
工具类 |	Utils 作为后缀 |	StringUtils
异常类 |	Exception 结尾 |	RuntimeException
接口实现 |	I+ 接口名 |	IUserService
接口实现类 |	接口名+ Impl |	UserServiceImpl
领域模型相关 |	/DO/DTO/VO/DAO |	正例：UserDTO 反例： UserDto
设计模式相关类 |	Builder，Factory 等 |	当使用到设计模式时，需要使用对应的设计模式作为后缀，如 ThreadFactory
处理特定功能的 |	Handler，Predicate, Validator |	表示处理器，校验器，断言，这些类工厂还有配套的方法名如 handle，predicate，validate
测试类 |	Test 结尾	| UserServiceTest，表示用来测试 UserService 类的
MVC 分层 |	Controller，Service，ServiceImpl，DAO 后缀 |	UserManageController，UserManageDAO

---

**参考文档**
- [Google Java 代码指南](https://google.github.io/styleguide/javaguide.htm)
- 《Clean Code》
- 《阿里巴巴 Java 开发手册》