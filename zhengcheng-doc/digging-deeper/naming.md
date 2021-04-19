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

## 命名规则

### 驼峰命名法（CamelCase）

---

**参考文档**
- [Google Java 代码指南](https://google.github.io/styleguide/javaguide.htm)
- 《Clean Code》
- 《阿里巴巴 Java 开发手册》