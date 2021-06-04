# 适配器模式

适配器模式（Adapter Pattern）是作为**两个不兼容的接口之间的桥梁**。这种类型的设计模式属于结构型模式，它结合了两个独立接口的功能。

它的主要意图是将一个类的接口转换成客户希望的另外一个接口。适配器模式使得原本由于接口不兼容而不能一起工作的那些类可以一起工作。

举个真实的例子，**读卡器**是作为内存卡和笔记本之间的适配器。您将内存卡插入读卡器，再将读卡器插入笔记本，这样就可以通过笔记本来读取内存卡。

## Real world examples

[java.util.Arrays#asList()](https://docs.oracle.com/javase/8/docs/api/java/util/Arrays.html#asList%28T...%29)
[java.util.Collections#list()](https://docs.oracle.com/javase/8/docs/api/java/util/Collections.html#list-java.util.Enumeration-)

--- 
**参考文档**
[适配器模式|菜鸟教程](https://www.runoob.com/design-pattern/adapter-pattern.html)