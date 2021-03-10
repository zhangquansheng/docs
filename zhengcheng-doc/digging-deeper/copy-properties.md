# 几种 copyProperties 工具类性能比较

::: warning 避免用 Apache BeanUtils 进行属性的 copy。
说明：Apache BeanUtils 性能较差，可以使用其他方案比如 `Spring BeanUtils`, `Cglib BeanCopier`，注意均是浅拷贝
:::