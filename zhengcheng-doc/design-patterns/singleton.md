# 单例模式

单例模式（`Singleton Pattern`）是属于**创建型模式**。

它的主要意图是保证一个类仅有一个实例，并提供一个访问它的全局访问点。关键代码是构造函数是私有的。

## 实现

> 单元素枚举类型是实现单实例的最佳方式
```java
public enum EnumIvoryTower {
  INSTANCE
}
```

然后使用：
```java
var enumIvoryTower1 = EnumIvoryTower.INSTANCE;
var enumIvoryTower2 = EnumIvoryTower.INSTANCE;
assertEquals(enumIvoryTower1, enumIvoryTower2); // true
```

--- 
参考文档
- [单例模式|菜鸟教程](https://www.runoob.com/design-pattern/singleton-pattern.html)