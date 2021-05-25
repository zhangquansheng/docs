# Facade （门面模式）

它的主要意图是为子系统中的一组接口提供统一的接口。**`Facade`定义了一个更高级别的接口**，该接口使子系统更易于使用。

维基百科说：`Facade`是为大型代码（例如类库）提供简化接口的对象。

## 实现

首先有一个基类`DwarvenMineWorker`：
```java
public abstract class DwarvenMineWorker {

  private static final Logger LOGGER = LoggerFactory.getLogger(DwarvenMineWorker.class);

  public void goToSleep() {
    LOGGER.info("{} goes to sleep.", name());
  }

  public void wakeUp() {
    LOGGER.info("{} wakes up.", name());
  }

  public void goHome() {
    LOGGER.info("{} goes home.", name());
  }

  public void goToMine() {
    LOGGER.info("{} goes to the mine.", name());
  }

  private void action(Action action) {
    switch (action) {
      case GO_TO_SLEEP:
        goToSleep();
        break;
      case WAKE_UP:
        wakeUp();
        break;
      case GO_HOME:
        goHome();
        break;
      case GO_TO_MINE:
        goToMine();
        break;
      case WORK:
        work();
        break;
      default:
        LOGGER.info("Undefined action");
        break;
    }
  }

  public void action(Action... actions) {
    Arrays.stream(actions).forEach(this::action);
  }

  public abstract void work();

  public abstract String name();

  enum Action {
    GO_TO_SLEEP, WAKE_UP, GO_HOME, GO_TO_MINE, WORK
  }
}
```

然后我们有具体的矮人类`DwarvenTunnelDigger`，`DwarvenGoldDigger`以及 `DwarvenCartOperator`：
```java
public class DwarvenTunnelDigger extends DwarvenMineWorker {

  private static final Logger LOGGER = LoggerFactory.getLogger(DwarvenTunnelDigger.class);

  @Override
  public void work() {
    LOGGER.info("{} creates another promising tunnel.", name());
  }

  @Override
  public String name() {
    return "Dwarven tunnel digger";
  }
}

public class DwarvenGoldDigger extends DwarvenMineWorker {

  private static final Logger LOGGER = LoggerFactory.getLogger(DwarvenGoldDigger.class);

  @Override
  public void work() {
    LOGGER.info("{} digs for gold.", name());
  }

  @Override
  public String name() {
    return "Dwarf gold digger";
  }
}

public class DwarvenCartOperator extends DwarvenMineWorker {

  private static final Logger LOGGER = LoggerFactory.getLogger(DwarvenCartOperator.class);

  @Override
  public void work() {
    LOGGER.info("{} moves gold chunks out of the mine.", name());
  }

  @Override
  public String name() {
    return "Dwarf cart operator";
  }
}
```

为了操作所有这些金矿工人，我们有`DwarvenGoldmineFacade`：
```java
public class DwarvenGoldmineFacade {

  private final List<DwarvenMineWorker> workers;

  public DwarvenGoldmineFacade() {
      workers = List.of(
            new DwarvenGoldDigger(),
            new DwarvenCartOperator(),
            new DwarvenTunnelDigger());
  }

  public void startNewDay() {
    makeActions(workers, DwarvenMineWorker.Action.WAKE_UP, DwarvenMineWorker.Action.GO_TO_MINE);
  }

  public void digOutGold() {
    makeActions(workers, DwarvenMineWorker.Action.WORK);
  }

  public void endDay() {
    makeActions(workers, DwarvenMineWorker.Action.GO_HOME, DwarvenMineWorker.Action.GO_TO_SLEEP);
  }

  private static void makeActions(Collection<DwarvenMineWorker> workers,
      DwarvenMineWorker.Action... actions) {
    workers.forEach(worker -> worker.action(actions));
  }
}
```

使用：
```java
var facade = new DwarvenGoldmineFacade();
facade.startNewDay();
facade.digOutGold();
facade.endDay();
```




## 适用性

在以下情况下使用外观模式
- 您想为复杂的子系统提供一个简单的接口。随着子系统的发展，它们通常会变得更加复杂。当应用大多数模式时，它们会导致更多和更少的类。
这使得子系统更加可重用并且更易于自定义，但是对于不需要自定义子系统的客户端来说，也变得更加难以使用。
外观可以提供子系统的简单默认视图，足以满足大多数客户端的需求。只有需要更多自定义的客户才需要超越外观。
- 客户端与抽象的实现类之间存在许多依赖关系。引入立面以使子系统与客户端和其他子系统分离，从而提高子系统的独立性和可移植性。
- 您想对子系统进行分层。使用外观来定义每个子系统级别的入口点。如果子系统是依赖的，则可以通过使子系统仅通过其外观相互通信来简化它们之间的依赖关系。

