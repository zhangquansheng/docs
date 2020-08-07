# 快速上手
::: warning 注意
请确保你的 JDK 版本 >= 1.8。
:::

::: tip 示例项目源码：
👉 [magic](https://gitee.com/zhangquansheng/magic)
:::

## 工程结构

> 参考阿里巴巴开发手册推荐应用分层

- common 公共的，例如配置，常量等
- controller 控制层：包括Web层，开发接口，终端显示层
    - command 数据查询对象，web接收终端请求。注意超过2个参数的查询封装，禁止使用Map类来传输。
    - facade 外观模式，通用处理层
        - internal 接口实现
            - assembler 传输对象组装器
            - dto（DataTransferObject） 数据传输对象，Service或Facade向外传输的对象。
- service 业务层：包括业务逻辑层，外部接口或者第三方平台
    - impl 接口实现
    - kafka 消费队列
- feign 外部接口或第三方平台
    - dto （DataTransferObject） 数据传输对象，Feign向外传输的对象。
    - fallback feign回退工厂
- domain 数据持久层：DAO层，数据源
    - entity DO 此对象与数据库表结构一一对应，通过DAO层向上传输数据源对象
    - enums 枚举
    - mapper (dao) mybatis-plus与数据库交互
    
## 代码生成

::: tip 撸码利器：
👉 [EasyCode](https://gitee.com/makejava/EasyCode): **代码神器，个人迄今为止最喜欢的插件，上手以后太爽啦。。。**
:::