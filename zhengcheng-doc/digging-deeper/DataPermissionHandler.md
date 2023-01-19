# MyBatis-Plus 结合 Spring Boot 基于 DataPermissionInterceptor 实现数据权限

## 一、场景介绍

在开发过程中很多时候我们需要根据某些条件去做数据权限，比如：A部门只能看见自己的数据等， 此时如果每次都去自己写SQL进行校验就会显得代码非常臃肿，
在 MyBatis-Plus 中可以基于 DataPermissionInterceptor 结合自定义的数据权限注解实现数据权限的过滤。

## 二、实现步骤
