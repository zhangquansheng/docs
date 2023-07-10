# Java 8 函数式编程

`Java 8`引入了函数式编程的特性，这为开发者提供了一种更简洁、可读性更高的编码方式。函数式编程是一种编程范式，

它将计算过程看作是函数的应用。在函数式编程中，函数是一等公民，**可以作为参数传递、返回值使用，并且可以将函数本身赋给变量。** 函数式编程强调的是函数的纯粹性，避免了副作用和可变状态的使用。

## Lambda表达式

Lambda表达式是Java 8中引入的一个重要特性，它允许开发者以更简洁的语法来写匿名函数。Lambda表达式由参数列表、箭头符号和函数体组成，参数列表定义了函数的参数，箭头符号表示函数体的开始，函数体包含了具体的计算逻辑。

示例：
```java
Function<Integer, Integer> square = (x) -> x * x;
```
上述示例中，创建了一个Lambda表达式，将输入参数乘以自身并返回。

Lambda表达式是Java里面的函数式编程。

## 函数式接口

函数式接口是Java 8中用于函数式编程的接口。**函数式接口只定义了一个抽象方法**，可以包含默认方法和静态方法。Java提供了一些预定义的函数式接口，例如Predicate、Function、Consumer等。

示例：
```java
Predicate<Integer> isEven = x -> x % 2 == 0;
```
上述示例中，Predicate是一个函数式接口，用于定义一个断言条件。我们使用Lambda表达式创建了一个Predicate对象，判断一个整数是否为偶数。

### JAVA7 

```java
public class LambdaTest {

    public static void main(String[] args) {
        Say test1 = new Say() {
            @Override
            public void saySomething(String something) {
                System.out.println(something);
            }
        };
        test2.saySomething("hello");
}

interface Say {

    void saySomething(String something);

}
```

### 通过 JAVA8 的函数式编程改写以上的代码

```java
public class LambdaTest {

    public static void main(String[] args) {
        Say test2 = System.out::println;
        test2.saySomthing("hello");
    }

}

interface Say {
    
    void saySomething(String something);
    
}
```

通过以上两段代码的对比，函数式编程更简洁。

## @FunctionalInterface

在Java 8中，可以使用`@FunctionalInterface`注解显式**声明一个接口为函数式接口**，以确保其设计符合函数式编程的要求。

示例：
```java
@FunctionalInterface
public interface MyFunctionalInterface {
void doSomething();
}
```

上述示例中，`MyFunctionalInterface`是一个函数式接口，它定义了一个无参数、无返回值的抽象方法doSomething()。


函数式接口，有如下特点：
- ​有且只有一个抽象方法
- 可以有多个静态方法
- 可以有多个`default方法`(默认方法)
- 可以有多个Object的public的抽象方法

Java 8提供了一些常见的函数式接口，这些接口位于`java.util.function`包下，包括`Function`、`Consumer`、`Predicate`等。这些接口可用于各种函数式编程场景

## 实战

事务提交以后，执行指定的代码

### JAVA7 示例
```java
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                public void afterCommit() {
                    // 提交事物后要执行的代码
                }
            });
        } else {
            // 提交事物后要执行的代码
        }
```

### JAVA8 示例

- 定义函数式接口
```java
/**
 * 一个函数接口代表一个一个函数，用于包装一个函数为对象
 * 在JDK8之前，Java的函数并不能作为参数传递，也不能作为返回值存在，此接口用于将一个函数包装成为一个对象，从而传递对象
 *
 * @author quansheng1.zhang
 * @since 2023/7/8 20:32
 */
@FunctionalInterface
public interface VoidTransactionFunc extends Serializable {
    /**
     * 执行函数
     */
    void execute();

    default void executeAfterCommit() {
        //判断是否在事务当中,如果在事务中则,则在事务提交以后调用，否则直接调用
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            //如果在事务中，则在事务结束后调用
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    execute();
                }
            });
        } else {
            execute();
        }
    }
}
```

- 定义工具类
```java
/**
 * Transaction 工具类
 *
 * @author quansheng1.zhang
 * @since 2023/7/8 10:48
 */
@SuppressWarnings("ALL")
public class TransactionUtil {

    private TransactionUtil() {
    }

    /**
     * 事务提交以后调用 expression
     *
     * @param expression 运行时传入的参数类型
     * @return {@link VoidTransactionFunc}
     */
    public static void executeAfterCommit(VoidTransactionFunc expression) {
        if (expression != null) {
            expression.executeAfterCommit();
        }
    }

}
```

- 改写`JAVA7`的写法(编码更简洁、可读性更高)
```java
 TransactionUtil.executeAfterCommit(() ->{
     // 提交事物后要执行的代码
 });
```
