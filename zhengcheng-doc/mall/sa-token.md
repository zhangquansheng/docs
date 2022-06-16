# 整合 Sa-Token

> Sa-Token 是一个轻量级 Java 权限认证框架，主要解决：登录认证、权限认证、单点登录、OAuth2.0、分布式Session会话、微服务网关鉴权 等一系列权限相关问题。
[在线文档：http://sa-token.dev33.cn/](http://sa-token.dev33.cn/)

## 添加依赖
在`pom.xml`中添加依赖：
```xml
     <!-- Sa-Token 权限认证, 在线文档：http://sa-token.dev33.cn/ -->
    <dependency>
        <groupId>cn.dev33</groupId>
        <artifactId>sa-token-spring-boot-starter</artifactId>
    </dependency>
    <!-- Sa-Token整合redis (使用jackson序列化方式) -->
    <dependency>
        <groupId>cn.dev33</groupId>
        <artifactId>sa-token-dao-redis-jackson</artifactId>
    </dependency>
```

## 设置配置文件
你可以**零配置启动项目**，但同时你也可以在`application.yml`中增加如下配置，定制性使用框架：
```yaml
# Sa-Token配置
sa-token: 
    # token名称 (同时也是cookie名称)
    token-name: satoken
    # token有效期，单位s 默认30天, -1代表永不过期 
    timeout: 2592000
    # token临时有效期 (指定时间内无操作就视为token过期) 单位: 秒
    activity-timeout: -1
    # 是否允许同一账号并发登录 (为true时允许一起登录, 为false时新登录挤掉旧登录) 
    is-concurrent: true
    # 在多人登录同一账号时，是否共用一个token (为true时所有登录共用一个token, 为false时每次登录新建一个token) 
    is-share: false
    # token风格
    token-style: uuid
    # 是否输出操作日志 
    is-log: false
```

## 常用API

```java
StpUtil.login(10001);    // 标记当前会话登录的账号id
StpUtil.getLoginId();    // 获取当前会话登录的账号id
StpUtil.isLogin();    // 获取当前会话是否已经登录, 返回true或false
StpUtil.logout();    // 当前会话注销登录
StpUtil.kickout(10001);    // 将账号为10001的会话踢下线
StpUtil.hasRole("super-admin");    // 查询当前账号是否含有指定角色标识, 返回true或false
StpUtil.hasPermission("user:add");    // 查询当前账号是否含有指定权限, 返回true或false
StpUtil.getSession();    // 获取当前账号id的Session
StpUtil.getSessionByLoginId(10001);    // 获取账号id为10001的Session
StpUtil.getTokenValueByLoginId(10001);    // 获取账号id为10001的token令牌值
StpUtil.login(10001, "PC");    // 指定设备类型登录，常用于“同端互斥登录”
StpUtil.kickout(10001, "PC");    // 指定账号指定设备类型踢下线 (不同端不受影响)
StpUtil.openSafe(120);    // 在当前会话开启二级认证，有效期为120秒 
StpUtil.checkSafe();    // 校验当前会话是否处于二级认证有效期内，校验失败会抛出异常 
StpUtil.switchTo(10044);    // 将当前会话身份临时切换为其它账号 
```

