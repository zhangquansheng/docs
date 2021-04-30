# 模板模式

在模板模式（`Template Pattern`）中，一个抽象类公开定义了执行它的方法的方式/模板。
它的子类可以按需要重写方法实现，但调用将以抽象类中定义的方式进行。这种类型的设计模式属于**行为型模式**。

它的主要意图是定义一个操作中的**算法的骨架**，而将一些步骤延迟到子类中。模板方法使得子类可以不改变一个算法的结构即可重定义该算法的某些特定步骤。

注意事项：为防止恶意操作，一般**模板方法**都加上`final`关键词。

--- 
参考文档
- [模板模式|菜鸟教程](https://www.runoob.com/design-pattern/template-pattern.html)