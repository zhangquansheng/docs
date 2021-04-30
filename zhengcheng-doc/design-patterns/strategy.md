# 策略模式

在策略模式（`Strategy Pattern`）中，一个类的行为或其算法可以在运行时更改。这种类型的设计模式属于**行为型模式**。

它的主要意图是定义一系列的算法, 把它们一个个封装起来, 并且使它们可相互替换。关键代码是实现同一个接口。

策略模式能体现出`JAVA`特性中的**多态**和设计原则中的**开闭原则**

## 实现

1. 创建策略接口
```java
public interface OperationStrategy {
   public int doOperation(int num1, int num2);
}
```

2. 实现策略接口

`OperationAdd.java`
```java
public class OperationAdd implements OperationStrategy{
   @Override
   public int doOperation(int num1, int num2) {
      return num1 + num2;
   }
}
```

`OperationSubtract.java`
```java
public class OperationSubtract implements OperationStrategy{
   @Override
   public int doOperation(int num1, int num2) {
      return num1 - num2;
   }
}
```

`Context` 是一个根据`Strategy`进行计算的类
```java
public class Context {
   private OperationStrategy operationStrategy;
 
   public Context(OperationStrategy operationStrategy){
      this.operationStrategy = operationStrategy;
   }
 
   public int executeStrategy(int num1, int num2){
      return operationStrategy.doOperation(num1, num2);
   }
}
```

`StrategyPatternDemo.java`
```java
public class StrategyPatternDemo {
   public static void main(String[] args) {
      Context context = new Context(new OperationAdd());    
      System.out.println("10 + 5 = " + context.executeStrategy(10, 5));
 
      context = new Context(new OperationSubtract());      
      System.out.println("10 - 5 = " + context.executeStrategy(10, 5));
 
      context = new Context(new OperationMultiply());    
      System.out.println("10 * 5 = " + context.executeStrategy(10, 5));
   }
}
```

`Java 8`中的新特性`Lambda Expressions`提供了另一种实现方法：
```java
public class LambdaStrategy {

  public enum Strategy implements OperationStrategy {
    AddStrategy((num1,num2) -> num1 + num2 ),
    SubtractStrategy((num1,num2) -> num1 - num2);

    private final OperationStrategy operationStrategy;

    Strategy(OperationStrategy operationStrategy) {
      this.operationStrategy = operationStrategy;
    }

    @Override
    public void execute() {
      operationStrategy.execute();
    }
  }
}
```



--- 

参考文档
- [策略模式|菜鸟教程](https://www.runoob.com/design-pattern/strategy-pattern.html)