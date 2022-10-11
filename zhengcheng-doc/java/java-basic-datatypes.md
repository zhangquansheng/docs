# Java 基本数据类型

Java提供了八种基本类型。六种数字类型（四个整数型，两个浮点型），一种字符类型，还有一种布尔型。

- 整数型: byte、short、int、long
- 浮点型：float、double
- 字符类型：char
- 布尔类型：boolean

这八种基本类型都有对应的包装类分别为：`Byte`、`Short`、`Integer`、`Long`、`Float`、`Double`、`Character`、`Boolean`

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

包装类型`Byte`,`Short`,`Integer`,`Long` 这`4`种包装类默认创建了数值 `[-128，127]` 的相应类型的缓存数据，
`Character` 创建了数值在 `[0,127]` 范围的缓存数据，`Boolean` 直接返回 `True` or `False`。

而两种浮点数类型的包装类 `Float`,`Double` 并没有实现缓存机制。

## 自动装箱与拆箱

- **装箱**：将基本类型用它们对应的引用类型包装起来；
- **拆箱**：将包装类型转换为基本数据类型；

例：
```java
Integer i = 10;  //装箱  等价于 Integer i = Integer.valueOf(10)
int n = i;       //拆箱  等价于 int n = i.intValue();
```

**装箱其实就是调用包装类的`valueOf()`方法，拆箱其实就是调用了`xxxValue()`方法。**

注意：如果频繁拆装箱的话，也会严重影响系统的性能。我们应该尽量避免不必要的拆装箱操作


## == 与 equals的区别

1. `==` 的作用是判断两个对象的地址是不是相等。即判断两个对象是不是同一个对象。(基本数据类型`==`比较的是值，引用数据类型`==`比较的是内存地址)
2. `equals()` 的作用也是判断两个对象是否相等。但它一般有两种使用情况
   - 类没有覆盖`equals()`方法，则通过`equals()`比较该类的两个对象时，等价于通过`==`比较这两个对象（属于`object`类，默认是判断内存地址是否相同）；
   - 类可以重写`equals()`方法，具体判断对象是否相等是根据程序而定的，如在`String`类中只是比较对象内容是否一致。

## 【易错点】 整型包装类对象之间值的比较

```java
/**
 * 1. i1,i2 都会发生装箱操作，实际上他们都等同于 Integer.valueOf(100)
 * 2. Integer 的缓存机制会把创建数值 [-128，127] 的相应类型的缓存数据
 * 3. 因为 100 在 [-128，127] 范围之类，获取到的对象是一样的，所以输出true 
 */
Integer i1 = 100;
Integer i2 = 100;
System.out.println(i1 == i2);// 输出 true


/**
 * 1. i3,i4 都会发生装箱操作，实际上他们都等同于 Integer.valueOf(100)
 * 2. Integer 的缓存机制会把创建数值 [-128，127] 的相应类型的缓存数据
 * 3. 因为 1000 不在 [-128，127] 范围之类，则实际上 i3 = new Integer(1000)、i4 = new Integer(1000)，创建了两个新的对象，对象的地址肯定不相同，所以输出false
 */     
Integer i3 = 1000;
Integer i4 = 1000;
System.out.println(i3 == i4);// 输出 false


/**
 * 1. i5 会发生装箱操作，实际上他们都等同于 Integer.valueOf(100)
 * 2. i6 会直接创建新的对象，对象的地址肯定不相同，所以输出false
 */
Integer i5 = 100;
Integer i6 = new Integer(100);
System.out.println(i5 == i6);  // 输出 false        


/**
 * 1. 两种浮点数类型的包装类 Float,Double 并没有实现缓存机制
 * 2. f1,f2,d1,d2 都发生了装箱操作，创建了新的对象，对象的地址肯定不相同，所以输出false
 */        
Float f1 = 33f;
Float f2 = 33f;
System.out.println(f1 == f2);// 输出 false
        
Double d1 = 1.2;
Double d2 = 1.2;
System.out.println(d1 == d2);// 输出 false
```

::: tip 阿里云JAVA开发手册 OOP 规约
7. 【强制】所有整型包装类对象之间值的比较，全部使用 equals 方法比较。
   说明：对于 Integer var = ? 在-128 至 127 之间的赋值，Integer 对象是在 IntegerCache.cache 产生，
   会复用已有对象，这个区间内的 Integer 值可以直接使用==进行判断，但是这个区间之外的所有数据，都
   会在堆上产生，并不会复用已有对象，这是一个大坑，推荐使用 equals 方法进行判断。
:::
