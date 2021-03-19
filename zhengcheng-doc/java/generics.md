# 泛型（参数化类型） 

`Java` 泛型（`generics`）是`JDK 5`中引入的一个新特性, 泛型提供了**编译时类型安全检测机制**，该机制允许程序员在编译时检测到非法的类型。

泛型的本质是**参数化类型**，也就是说所操作的数据类型被指定为一个参数。

**泛型使编译时可检测到更多错误，从而提高了代码的稳定性。**
- 第一是**泛化**。可以用`T`代表任意类型`Java`语言中引入泛型是一个较大的功能增强不仅语言、类型系统和编译器有了较大的变化，以支持泛型，而且类库也进行了大翻修，所以许多重要的类，比如集合框架，都已经成为泛型化的了，这带来了很多好处。
- 第二是**类型安全**。泛型的一个主要目标就是提高`Java`程序的类型安全，使用泛型可以使编译器知道变量的类型限制，进而可以在更高程度上验证类型假设。如果不用泛型，则必须使用强制类型转换，而强制类型转换不安全，在运行期可能发生`ClassCast Exception`异常，如果使用泛型，则会在编译期就能发现该错误。
- 第三是**消除强制类型转换**。泛型可以消除源代码中的许多强制类型转换，这样可以使代码更加可读，并减少出错的机会。
- 第四是**向后兼容**。支持泛型的`Java`编译器（例如`JDK1.5`中的`Javac`）可以用来编译经过泛型扩充的`Java`程序（`Generics Java`程序），但是现有的没有使用泛型扩充的`Java`程序仍然可以用这些编译器来编译。

## 类型参数命名约定

按照约定，类型参数名称是单个大写字母。这与您已经知道的变量命名约定形成鲜明对比 ，并且有充分的理由：没有该约定，将很难分辨类型变量与普通类或接口名称之间的区别。

最常用的类型参数名称为：
- E - Element (used extensively by the Java Collections Framework)
- K - Key
- N - Number
- T - Type
- V - Value
- S,U,V etc. - 2nd, 3rd, 4th types

## 泛型类

```java
public class Box {
    private Object object;

    public void set(Object object) { this.object = object; }
    public Object get() { return object; }
}
```

```java
/**
 * Generic version of the Box class.
 * @param <T> the type of the value being boxed
 */
public class Box<T> {
    // T stands for "Type"
    private T t;

    public void set(T t) { this.t = t; }
    public T get() { return t; }
}
```

## 泛型方法

`Util`类包含了一个`compare`的泛型方法用于比较`Pair`两个对象:
```java
public class Util {
    public static <K, V> boolean compare(Pair<K, V> p1, Pair<K, V> p2) {
        return p1.getKey().equals(p2.getKey()) &&
               p1.getValue().equals(p2.getValue());
    }
}

public class Pair<K, V> {

    private K key;
    private V value;

    public Pair(K key, V value) {
        this.key = key;
        this.value = value;
    }

    public void setKey(K key) { this.key = key; }
    public void setValue(V value) { this.value = value; }
    public K getKey()   { return key; }
    public V getValue() { return value; }
}
```

## 有界泛型

可以限制泛型的类型。

```java
public class Box<T extends Integer & Long & String> {

    private T t;          

    public void set(T t) {
        this.t = t;
    }

    public T get() {
        return t;
    }

    public <U extends Number> void inspect(U u){
        System.out.println("T: " + t.getClass().getName());
        System.out.println("U: " + u.getClass().getName());
    }

    public static void main(String[] args) {
        Box<Integer> integerBox = new Box<Integer>();
        integerBox.set(new Integer(10));
        integerBox.inspect("some text"); // error: this is still String!
    }
}
```

## 泛型类派生出的子类

注意： 给定两个具体类型`A`和`B`（例如`Number`和`Integer`），无论`A`和`B`是否相关，`MyClass <A>`与`MyClass <B>`没有关系。`MyClass <A>`和`MyClass <B>`的公共父对象是`Object`。
![泛型，继承和子类型](/img/java/generics-subtypeRelationship.gif)

```java
interface PayloadList<E,P> extends List<E> {
  void setPayload(int index, P val);
  ...
}
```

## 通配符（Wildcards）

问号(?)表示通配符，表示未知类型。

- 上限通配符
```java
// 传递进来的只能是Foo或Foo的子类
public static void process(List<? extends Foo> list) { /* ... */ }
```

- 无限通配符
```java
public static void printList(List<?> list) {
    for (Object elem: list)
        System.out.print(elem + " ");
    System.out.println();
}
```

- 设定通配符下限
```java
// 传递进来的只能是Integer或Integer的父类
public static void addNumbers(List<? super Integer> list) {
    for (int i = 1; i <= 10; i++) {
        list.add(i);
    }
}
```

### 通配符使用准则

- **`In变量`**： `In变量`将数据提供给代码。想象一个具有两个参数的`copy`方法：`copy（src，dest）`。该`src`参数提供将要复制的数据，所以它是`In变量`。
- **`Out变量`**： `Out变量`保存供其他地方使用的数据。在复制示例`copy（src，dest）`中，`dest`参数接受数据，因此它是`Out变量`。

通配符准则： 
- 使用`extends`关键字，使用上限通配符定义`In变量`。
- 使用`super`关键字使用下界通配符定义`Out变量`。
- 如果可以使用`Object`类中定义的方法访问`In变量`，请使用无界通配符。
- 如果代码需要同时使用`In变量`和`Out变量`来访问变量，则不要使用通配符。

## 类型擦除

泛型是**提供给`javac`编译器使用的**，它用于限定集合的输入类型，让编译器在源代码级别上，即挡住向集合中插入非法数据。
但编译器编译完带有泛形的`java`程序后，生成的`class`文件中将不再带有泛形信息，以此使程序运行效率不受到影响，这个过程称之为**擦除**。

例如：
```java
public class Node<T> {

    private T data;
    private Node<T> next;

    public Node(T data, Node<T> next) {
        this.data = data;
        this.next = next;
    }

    public T getData() { return data; }
    // ...
}
```
由于类型参数`T`是无界的，因此`Java`编译器将其替换为`Object`：
```java
public class Node {

    private Object data;
    private Node next;

    public Node(Object data, Node next) {
        this.data = data;
        this.next = next;
    }

    public Object getData() { return data; }
    // ...
}
```

---
**参考文档**

- [官方文档](https://docs.oracle.com/javase/tutorial/java/generics/index.html)