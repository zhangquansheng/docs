# 几种 copyProperties 工具类性能比较

::: warning 避免用 Apache BeanUtils 进行属性的 copy。
说明：Apache BeanUtils 性能较差，可以使用其他方案比如 `Spring BeanUtils`, `Cglib BeanCopier`，注意均是浅拷贝
:::

常用的工具：
- org.apache.commons.beanutils.BeanUtils.copyProperties
- org.apache.commons.beanutils.PropertyUtils.copyProperties
- org.springframework.beans.BeanUtils.copyProperties
- org.springframework.cglib.beans.BeanCopier.copy
- org.mapstruct

> 推荐使用`org.mapstruct`，性能最好。

## 性能检测

`apache maven`
```xml
<dependency>
      <groupId>commons-beanutils</groupId>
      <artifactId>commons-beanutils</artifactId>
      <version>1.9.4</version>
</dependency>
```