# Java 基本数据类型


## 包装类型的缓存源码

- Integer 缓存源码 

```java
public static Integer valueOf(int i) {
    if (i >= IntegerCache.low && i <= IntegerCache.high)
        return IntegerCache.cache[i + (-IntegerCache.low)];
    return new Integer(i);
}

private static class IntegerCache {
    static final int low = -128;
    static final int high;
    static final Integer cache[];

    static {
        // high value may be configured by property
        int h = 127;
        
        // ...
    }

    private IntegerCache() {}
}
```

- Boolean 缓存源码
```java
 public static Boolean valueOf(boolean b) {
        return (b ? TRUE : FALSE);
    }
```

- Character 缓存源码
```java
public static Character valueOf(char c) {
    if (c <= 127) { // must cache
        return CharacterCache.cache[(int)c];
    }
    return new Character(c);
}

private static class CharacterCache {
    private CharacterCache(){}

    static final Character cache[] = new Character[127 + 1];

    static {
        for (int i = 0; i < cache.length; i++)
            cache[i] = new Character((char)i);
    }
}    
```

包装类型`Byte`,`Short`,`Integer`,`Long` 这`4`种包装类默认创建了数值 [-128，127] 的相应类型的缓存数据，
`Character` 创建了数值在 [0,127] 范围的缓存数据，`Boolean` 直接返回 `True` or `False`。

而两种浮点数类型的包装类 `Float`,`Double` 并没有实现缓存机制


::: tip 阿里云JAVA开发手册 OOP 规约
7. 【强制】所有整型包装类对象之间值的比较，全部使用 equals 方法比较。
   说明：对于 Integer var = ? 在-128 至 127 之间的赋值，Integer 对象是在 IntegerCache.cache 产生，
   会复用已有对象，这个区间内的 Integer 值可以直接使用==进行判断，但是这个区间之外的所有数据，都
   会在堆上产生，并不会复用已有对象，这是一个大坑，推荐使用 equals 方法进行判断。
:::

## == 与 equals的区别

1. `==` 的作用是判断两个对象的地址是不是相等。即判断两个对象是不是同一个对象。(基本数据类型==比较的是值，引用数据类型==比较的是内存地址)
2. `equals()` 的作用也是判断两个对象是否相等。但它一般有两种使用情况
   - 类没有覆盖`equals()`方法，则通过`equals()`比较该类的两个对象时，等价于通过`==`比较这两个对象（属于`object`类，默认是判断内存地址是否相同）；
   - 类可以重写`equals()`方法，具体判断对象是否相等是根据程序而定的，如在`String`类中只是比较对象内容是否一致。
