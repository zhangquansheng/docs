# 建造者模式

建造者模式（Builder Pattern）使用多个简单的对象一步一步构建成一个复杂的对象。这种类型的设计模式属于创建型模式。

它的主要意图是将一个复杂的构建与其表示相分离，使得同样的构建过程可以创建不同的表示。

我们经常会见到如下的构造函数：
```java
public Hero(Profession profession, String name, HairType hairType, HairColor hairColor, Armor armor, Weapon weapon) {
}
```
如您所见，构造函数参数的数量很快就会失控，并且可能难以理解参数的排列。此外，如果想在未来添加更多的选项，此参数列表需要继续增长。

选择使用`Builder`模式，程序示例如下：
```java
public final class Hero {
  private final Profession profession;
  private final String name;
  private final HairType hairType;
  private final HairColor hairColor;
  private final Armor armor;
  private final Weapon weapon;

  private Hero(Builder builder) {
    this.profession = builder.profession;
    this.name = builder.name;
    this.hairColor = builder.hairColor;
    this.hairType = builder.hairType;
    this.weapon = builder.weapon;
    this.armor = builder.armor;
  }
 

  public static class Builder {
    private final Profession profession;
    private final String name;
    private HairType hairType;
    private HairColor hairColor;
    private Armor armor;
    private Weapon weapon;

    public Builder(Profession profession, String name) {
      if (profession == null || name == null) {
        throw new IllegalArgumentException("profession and name can not be null");
      }
      this.profession = profession;
      this.name = name;
    }

    public Builder hairType(HairType hairType) {
      this.hairType = hairType;
      return this;
    }

    public Builder hairColor(HairColor hairColor) {
      this.hairColor = hairColor;
      return this;
    }

    public Builder armor(Armor armor) {
      this.armor = armor;
      return this;
    }

    public Builder weapon(Weapon weapon) {
      this.weapon = weapon;
      return this;
    }

    public Hero build() {
      return new Hero(this);
    }
  }
}
```

创建一个对象可以写成
```java
var mage = new Hero.Builder(Profession.MAGE, "Riobard").hairColor(HairColor.BLACK).weapon(Weapon.DAGGER).build();
```

## 应用

使用`Builder`模式时
- **创建复杂对象的算法应该独立于构成对象的部分及其组装方式**
- 构造过程必须允许构造的对象有不同的表示

--- 
**参考文档**
- [builder](https://github.com/iluwatar/java-design-patterns/tree/master/builder)
- [建造者模式|菜鸟教程](https://www.runoob.com/design-pattern/builder-pattern.html)