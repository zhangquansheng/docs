# Spring Boot 集成 MapStruct

## MapStruct

`MapStruct` 是一个代码生成器，它基于约定优先于配置的方法，极大地简化了`javabean`类型之间映射的实现。
多层应用程序通常需要在不同的对象模型（例如实体和`DTO`）之间进行映射，编写这样的映射代码是一项乏味且容易出错的任务，`MapStruct`旨在通过尽可能自动化来简化这项工作。

与其他映射框架相比，`MapStruct`在编译时生成bean映射，且生成的映射代码**使用纯方法调用，因此速度快、类型安全且易于理解，所以确保了高性能，允许快速开发人员反馈和彻底的错误检查。（`BeanUtils`的`copyProperties`的方法利用了反射，有性能损耗）**

---

**参考文档**
- [https://mapstruct.org/](https://mapstruct.org/)