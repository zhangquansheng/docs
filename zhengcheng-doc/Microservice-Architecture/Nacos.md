# Nacos 服务注册原理

## 注册中心

注册中心一般具有以下几个功能：

- 1、服务地址的管理
- 2、服务注册
- 3、服务动态感知

## DNS 协议 

> 域名系统（Domain Name System，缩写：DNS）

## Nacos 架构

![Nacos](/img/nacos/nacos.jpeg)

## Nacos中 AP 和 CP 模式如何切换

URL指令：$NACOS_SERVER:8848/nacos/v1/ns/operator/switches?entry=serverMode&value=CP
- a、这个不能随便切，建议保持默认的AP即可
- b、集群环境下所有的服务都要切换
- c、可以使用postman模拟，必须使用put请求。用get和post均无效


## 参考文档

- [NACOS](https://nacos.io/zh-cn/)
- [Spring Cloud Alibaba——Nacos服务注册原理](http://events.jianshu.io/p/17afb82408f1)