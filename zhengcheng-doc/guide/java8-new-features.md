---
sidebarDepth: 3
---

# Java 8 新特性

## Java 8 Stream

`Java 8 API`添加了一个新的抽象称为流`Stream`，可以让你以一种声明的方式处理数据。
`Stream`使用一种类似用`SQL`语句从数据库查询数据的直观方式来提供一种对`Java`集合运算和表达的高阶抽象。
`Stream API`**可以极大提高`Java`程序员的生产力，让程序员写出高效率、干净、简洁的代码。**
这种风格将要处理的元素集合看作一种流， 流在管道中传输， 并且可以在管道的节点上进行处理， 比如**筛选**， **排序**，**聚合**等。
元素流在管道中经过中间操作（`intermediate operation`）的处理，最后由最终操作(`terminal operation`)得到前面处理的结果。

```text
+--------------------+       +------+   +------+   +---+   +-------+
| stream of elements +-----> |filter+-> |sorted+-> |map+-> |collect|
+--------------------+       +------+   +------+   +---+   +-------+
```

以上的流程转换为`Java`代码为：
```java
List<Integer> transactionsIds = 
widgets.stream()
             .filter(b -> b.getColor() == RED)
             .sorted((x,y) -> x.getWeight() - y.getWeight())
             .mapToInt(Widget::getWeight)
             .sum();
```

### 什么是 Stream？

`Stream`（流）是一个来自数据源的元素队列并支持聚合操作
- **元素队列**: 是特定类型的对象形成一个队列。 Java中的Stream并不会存储元素，而是按需计算。
- **数据源**: 流的来源。 可以是集合，数组，I/O channel， 产生器generator 等。
- **聚合操作**: 类似SQL语句一样的操作， 比如filter, map, reduce, find, match, sorted等。

和以前的`Collection`操作不同， `Stream`操作还有两个基础的特征：
- **Pipelining**: 中间操作都会返回流对象本身。 这样多个操作可以串联成一个管道， 如同流式风格（fluent style）。 这样做可以对操作进行优化， 比如延迟执行(laziness)和短路( short-circuiting)。
- **内部迭代**： 以前对集合遍历都是通过Iterator或者For-Each的方式, 显式的在集合外部进行迭代， 这叫做外部迭代。 Stream提供了内部迭代的方式， 通过访问者模式(Visitor)实现。

### 生成流

在 Java 8 中, 集合接口有两个方法来生成流：
- stream() − 为集合创建串行流。
- parallelStream() − 为集合创建并行流。

```java
List<String> strings = Arrays.asList("abc", "", "bc", "efg", "abcd","", "jkl");
List<String> filtered = strings.stream().filter(string -> !string.isEmpty()).collect(Collectors.toList());
```

### forEach

`Stream` 提供了新的方法`forEach`来迭代流中的每个数据。以下代码片段使用 `forEach` 输出了10个随机数：
```java
Random random = new Random();
random.ints().limit(10).forEach(System.out::println);
```

### map

`map` 方法用于映射每个元素到对应的结果，以下代码片段使用`map`输出了元素对应的平方数：
```java
List<Integer> numbers = Arrays.asList(3, 2, 2, 3, 7, 3, 5);
// 获取对应的平方数
List<Integer> squaresList = numbers.stream().map( i -> i*i).distinct().collect(Collectors.toList());
```

### distinct

`distinct`方法用于返回由该流的不同元素组成的流。`distinct`使用`hashCode`和`equals`方法来获取不同的元素。
因此，我们的类必须实现`hashCode`和`equals`方法。如果`distinct`正在处理**有序流**，那么对于重复元素，将**保留以遭遇顺序首先出现的元素**，并且以这种方式选择不同元素是**稳定的**。
以下代码片段使用`distinct`方法去重字符串并拼接：
```java
List<String> strings = Arrays.asList("AA", "BB", "CC", "BB", "CC", "AA", "AA");
String output = strings.stream().distinct().collect(Collectors.joining(","));
```

### filter

`filter`方法用于通过设置的条件过滤出元素。以下代码片段使用`filter`方法过滤出空字符串：
```java
List<String>strings = Arrays.asList("abc", "", "bc", "efg", "abcd","", "jkl");
// 获取空字符串的数量
long count = strings.stream().filter(string -> string.isEmpty()).count();
```

### limit

`limit`方法用于获取指定数量的流。以下代码片段使用`limit`方法打印出`10`条数据：
```java
Random random = new Random();
random.ints().limit(10).forEach(System.out::println);
```

### sorted

`sorted`方法用于对流进行排序。以下代码片段使用`sorted`方法对输出的`10`个随机数进行排序：
```java
Random random = new Random();
random.ints().limit(10).sorted().forEach(System.out::println);
```

### 并行（parallel）程序

`parallelStream`是流并行处理程序的代替方法。以下实例我们使用`parallelStream`来输出空字符串的数量：
```java
List<String> strings = Arrays.asList("abc", "", "bc", "efg", "abcd","", "jkl");
// 获取空字符串的数量
long count = strings.parallelStream().filter(string -> string.isEmpty()).count();
```
我们可以很容易的在顺序运行和并行直接切换。

### Collectors

`Collectors`类实现了很多归约操作，例如将流转换成集合和聚合元素。`Collectors`可用于返回列表或字符串：
```java
List<String>strings = Arrays.asList("abc", "", "bc", "efg", "abcd","", "jkl");
List<String> filtered = strings.stream().filter(string -> !string.isEmpty()).collect(Collectors.toList());
 
System.out.println("筛选列表: " + filtered);
String mergedString = strings.stream().filter(string -> !string.isEmpty()).collect(Collectors.joining(", "));
System.out.println("合并字符串: " + mergedString);
```

### 统计

另外，一些产生统计结果的收集器也非常有用。它们主要用于int、double、long等基本类型上，它们可以用来产生类似如下的统计结果。
```java
List<Integer> numbers = Arrays.asList(3, 2, 2, 3, 7, 3, 5);
 
IntSummaryStatistics stats = numbers.stream().mapToInt((x) -> x).summaryStatistics();
 
System.out.println("列表中最大的数 : " + stats.getMax());
System.out.println("列表中最小的数 : " + stats.getMin());
System.out.println("所有数之和 : " + stats.getSum());
System.out.println("平均数 : " + stats.getAverage());
```

### Stream 完整实例

```java
      List<String> strings = Arrays.asList("abc", "", "bc", "efg", "abcd","", "jkl");

      count = strings.stream().filter(string->string.isEmpty()).count();
      System.out.println("空字符串数量为: " + count);
        
      count = strings.stream().filter(string -> string.length() == 3).count();
      System.out.println("字符串长度为 3 的数量为: " + count);
        
      filtered = strings.stream().filter(string ->!string.isEmpty()).collect(Collectors.toList());
      System.out.println("筛选后的列表: " + filtered);
        
      mergedString = strings.stream().filter(string ->!string.isEmpty()).collect(Collectors.joining(", "));
      System.out.println("合并字符串: " + mergedString);
        
      squaresList = numbers.stream().map( i ->i*i).distinct().collect(Collectors.toList());
      System.out.println("Squares List: " + squaresList);
      System.out.println("列表: " +integers);
        
      IntSummaryStatistics stats = integers.stream().mapToInt((x) ->x).summaryStatistics();
        
      System.out.println("列表中最大的数 : " + stats.getMax());
      System.out.println("列表中最小的数 : " + stats.getMin());
      System.out.println("所有数之和 : " + stats.getSum());
      System.out.println("平均数 : " + stats.getAverage());
      System.out.println("随机数: ");
        
      random.ints().limit(10).sorted().forEach(System.out::println);
        
      // 并行处理
      count = strings.parallelStream().filter(string -> string.isEmpty()).count();
      System.out.println("空字符串的数量为: " + count);
```

### 去重 、 List转map

- Person.java
```java
public class Person {

    private Integer id;
    private String name;
    private String sex;
}
```

- 根据 name 去重
```java
List<Person> unique = persons.stream().collect(
            Collectors.collectingAndThen(
                    Collectors.toCollection(() -> new TreeSet<>(Comparator.comparing(Person::getName))), ArrayList::new)
);
```

- 根据 name 、sex 两个属性去重
```java
List<Person> unique = persons.stream().collect(
           Collectors. collectingAndThen(
                    Collectors.toCollection(() -> new TreeSet<>(Comparator.comparing(o -> o.getName() + "-" + o.getSex()))), ArrayList::new)
);
```

- List 转 Map
```java
/**
 * List -> Map
 * 需要注意的是：
 * toMap 如果集合对象有重复的key，会报错 Duplicate key ....
 * 
 * person1,person2 的id都为1，可以用 (k1,k2)->k1 来设置，如果有重复的key,则保留key1,舍弃key2
 */
Map<Integer, Person> appleMap = appleList.stream().collect(Collectors.toMap(Person::getId, a -> a,(k1,k2)->k1));
```

---

**参考文档**
- [Java 8 Stream](https://www.runoob.com/java/java8-streams.html)
- [Java8通过Stream流实现List转map 、分组、过滤等操作](https://www.yuque.com/fcant/java/yyg1si)
