# 代码整洁之道

## 第一章 整洁代码

### 什么是整洁代码

> 整洁的代码应可由作者之外的开发者阅读和增补。它应当有单元测试和验收测试。它使用有意义的命名。它只提供一种而非多种做一件事的途径。它只有尽量少的依赖关系，而且要明确地定义和提供清晰、尽量少的 API。代码应通过其字面表达含义，因为不同的语言导致并非所有必需信息均可通过代码自身清晰表达。

简单代码规则，依其重要顺序：

- 能通过所有测试；
- **没有重复代码**；
- 体现系统中的全部设计理念；
- 包括尽量少的实体，比如类、方法、函数等。

## 第三章 函数

### 封装多个参数

1. 如果方法参数将超过`3`个，建议放在类中包装起来，否则再增加参数时，由于语义的强耦合会导致调用方语法错误。在后台管理中的分页查询接口，常常会有很多查询参数，而且有可能增加，封装起来是最好的。

### 抽离 try/catch

1. `Try/catch` 代码块丑陋不堪。它们搞乱了代码结构，把错误处理与正常流程混为一谈。最好把`try`和`catch`代码块的主体部分抽离出来，另外形成函数。

## 第四章 注释

> “别给糟糕的代码加注释——重新写吧。”——Brian W. Kernighan 与 P. J.

### 注释掉的代码

1. 直接把代码注释掉是讨厌的做法。别这么干！
2. 其他人不敢删除注释掉的代码。他们会想，代码依然放在那儿，一定有其原因，而且这段代码很重要，不能删除。注释掉的代码堆积在一起，就像破酒瓶底的渣滓一般。
3. `Git`可以为我们记住不要的代码。我们无需再用注释来标记，删掉即可。

## 第七章 错误处理

### 使用异常而非返回码

1. 遇到错误时，最好抛出一个异常。调用代码很整洁，其逻辑不会被错误处理搞乱

### 别返回 NULL 值

1. 我认为，要讨论错误处理，就一定要提及那些容易引发错误的做法。第一项就是返回 null 值。我不想去计算曾经见过多少几乎每行代码都在检查 null 值的应用程序。
2. 这种代码看似不坏，其实糟透了！返回 null 值，基本上是在给自己增加工作量，也是在给调用者添乱。只要有一处没检查 null 值，应用程序就会失控。
3. 如果你打算在方法中返回 null 值，不如抛出异常，或是返回特例对象。如果你在调用某个第三方 API 中可能返回 null 值的方法，可以考虑用新方法打包这个方法，在新方法中抛出异常或返回特例对象。

### 别传递 NULL 值

1. 在方法中返回 null 值是糟糕的做法，但将 null 值传递给其他方法就更糟糕了。除非 API 要求你向它传递 null 值，否则就要尽可能避免传递 null 值。
2. 在大多数编程语言中，没有良好的方法能对付由调用者意外传入的 null 值。事已如此，恰当的做法就是禁止传入 null 值。这样，你在编码的时候，就会时时记住参数列表中的 null 值意味着出问题了，从而大量避免这种无心之失。

## Java 代码精简之道

### 2.利用注解

- 2.1.利用 Lombok 注解
> Lombok 提供了一组有用的注解，可以用来消除Java类中的大量样板代码。
- 2.3.利用 @NonNull 注解
> Spring 的 @NonNull 注解，用于标注参数或返回值非空，适用于项目内部团队协作。只要实现方和调用方遵循规范，可以避免不必要的空值判断，“因为信任，所以简单”。

### 4.利用自身方法

- 4.3.利用 Map 的 computeIfAbsent 方法
> 利用 Map 的 computeIfAbsent 方法，可以保证获取到的对象非空，从而避免了不必要的空判断和重新设置值。
>
> 普通：
```java
Map<Long, List<UserDO>> roleUserMap = new HashMap<>();
for (UserDO userDO : userDOList) {
    Long roleId = userDO.getRoleId();
    List<UserDO> userList = roleUserMap.get(roleId);
    if (Objects.isNull(userList)) {
        userList = new ArrayList<>();
        roleUserMap.put(roleId, userList);
    }
    userList.add(userDO);
}
```
> 精简：
```java
Map<Long, List<UserDO>> roleUserMap = new HashMap<>();
for (UserDO userDO : userDOList) {
    roleUserMap.computeIfAbsent(userDO.getRoleId(), key -> new ArrayList<>())
        .add(userDO);
}
```

### 10.利用设计模式

- 10.1.模板方法模式
> 模板方法模式（Template Method Pattern）定义一个固定的算法框架，而将算法的一些步骤放到子类中实现，使得子类可以在不改变算法框架的情况下重定义该算法的某些步骤。
```java
@Repository
public class UserValue {
    /** 值操作 */
    @Resource(name = "stringRedisTemplate")
    private ValueOperations<String, String> valueOperations;
    /** 值模式 */
    private static final String KEY_FORMAT = "Value:User:%s";

    /** 设置值 */
    public void set(Long id, UserDO value) {
        String key = String.format(KEY_FORMAT, id);
        valueOperations.set(key, JSON.toJSONString(value));
    }

    /** 获取值 */
    public UserDO get(Long id) {
        String key = String.format(KEY_FORMAT, id);
        String value = valueOperations.get(key);
        return JSON.parseObject(value, UserDO.class);
    }

    ...
}

@Repository
public class RoleValue {
    /** 值操作 */
    @Resource(name = "stringRedisTemplate")
    private ValueOperations<String, String> valueOperations;
    /** 值模式 */
    private static final String KEY_FORMAT = "Value:Role:%s";

    /** 设置值 */
    public void set(Long id, RoleDO value) {
        String key = String.format(KEY_FORMAT, id);
        valueOperations.set(key, JSON.toJSONString(value));
    }

    /** 获取值 */
    public RoleDO get(Long id) {
        String key = String.format(KEY_FORMAT, id);
        String value = valueOperations.get(key);
        return JSON.parseObject(value, RoleDO.class);
    }

    ...
}
```
> 精简：
```java

public abstract class AbstractDynamicValue<I, V> {
    /** 值操作 */
    @Resource(name = "stringRedisTemplate")
    private ValueOperations<String, String> valueOperations;

    /** 设置值 */
    public void set(I id, V value) {
        valueOperations.set(getKey(id), JSON.toJSONString(value));
    }

    /** 获取值 */
    public V get(I id) {
        return JSON.parseObject(valueOperations.get(getKey(id)), getValueClass());
    }

    ...

    /** 获取主键 */
    protected abstract String getKey(I id);

    /** 获取值类 */
    protected abstract Class<V> getValueClass();
}

@Repository
public class UserValue extends AbstractValue<Long, UserDO> {
    /** 获取主键 */
    @Override
    protected String getKey(Long id) {
        return String.format("Value:User:%s", id);
    }

    /** 获取值类 */
    @Override
    protected Class<UserDO> getValueClass() {
        return UserDO.class;
    }
}

@Repository
public class RoleValue extends AbstractValue<Long, RoleDO> {
    /** 获取主键 */
    @Override
    protected String getKey(Long id) {
        return String.format("Value:Role:%s", id);
    }

    /** 获取值类 */
    @Override
    protected Class<RoleDO> getValueClass() {
        return RoleDO.class;
    }
}
```

- 10.2.建造者模式
> 建造者模式（Builder Pattern）将一个复杂对象的构造与它的表示分离，使同样的构建过程可以创建不同的表示，这样的设计模式被称为建造者模式。
```java
public interface DataHandler<T> {
    /** 解析数据 */
public T parseData(Record record);

    /** 存储数据 */
public boolean storeData(List<T> dataList);
}

public <T> long executeFetch(String tableName, int batchSize, DataHandler<T> dataHandler) throws Exception {
    // 构建下载会话
    DownloadSession session = buildSession(tableName);

    // 获取数据数量
    long recordCount = session.getRecordCount();
    if (recordCount == 0) {
        return 0;
    }

    // 进行数据读取
    long fetchCount = 0L;
    try (RecordReader reader = session.openRecordReader(0L, recordCount, true)) {
        // 依次读取数据
        Record record;
        List<T> dataList = new ArrayList<>(batchSize);
        while ((record = reader.read()) != null) {
            // 解析添加数据
            T data = dataHandler.parseData(record);
            if (Objects.nonNull(data)) {
                dataList.add(data);
            }

            // 批量存储数据
            if (dataList.size() == batchSize) {
                boolean isContinue = dataHandler.storeData(dataList);
                fetchCount += batchSize;
                dataList.clear();
                if (!isContinue) {
                    break;
                }
            }
        }

        // 存储剩余数据
        if (CollectionUtils.isNotEmpty(dataList)) {
            dataHandler.storeData(dataList);
            fetchCount += dataList.size();
            dataList.clear();
        }
    }

    // 返回获取数量
    return fetchCount;
}

 // 使用案例
long fetchCount = odpsService.executeFetch("user", 5000, new DataHandler() {
    /** 解析数据 */
    @Override
public T parseData(Record record) {
        UserDO user = new UserDO();
        user.setId(record.getBigint("id"));
        user.setName(record.getString("name"));
        return user;
    }

    /** 存储数据 */
    @Override
public boolean storeData(List<T> dataList) {
        userDAO.batchInsert(dataList);
        return true;
    }
});
```
> 精简：
```java

public <T> long executeFetch(String tableName, int batchSize, Function<Record, T> dataParser, Function<List<T>, Boolean> dataStorage) throws Exception {
    // 构建下载会话
    DownloadSession session = buildSession(tableName);

    // 获取数据数量
    long recordCount = session.getRecordCount();
    if (recordCount == 0) {
        return 0;
    }

    // 进行数据读取
    long fetchCount = 0L;
    try (RecordReader reader = session.openRecordReader(0L, recordCount, true)) {
        // 依次读取数据
        Record record;
        List<T> dataList = new ArrayList<>(batchSize);
        while ((record = reader.read()) != null) {
            // 解析添加数据
            T data = dataParser.apply(record);
            if (Objects.nonNull(data)) {
                dataList.add(data);
            }

            // 批量存储数据
            if (dataList.size() == batchSize) {
                Boolean isContinue = dataStorage.apply(dataList);
                fetchCount += batchSize;
                dataList.clear();
                if (!Boolean.TRUE.equals(isContinue)) {
                    break;
                }
            }
        }

        // 存储剩余数据
        if (CollectionUtils.isNotEmpty(dataList)) {
            dataStorage.apply(dataList);
            fetchCount += dataList.size();
            dataList.clear();
        }
    }

    // 返回获取数量
    return fetchCount;
}

 // 使用案例
long fetchCount = odpsService.executeFetch("user", 5000, record -> {
        UserDO user = new UserDO();
        user.setId(record.getBigint("id"));
        user.setName(record.getString("name"));
        return user;
    }, dataList -> {
        userDAO.batchInsert(dataList);
        return true;
    });
```

> 普通的建造者模式，实现时需要定义 DataHandler 接口，调用时需要实现 DataHandler 匿名内部类，代码较多较繁琐。而精简后的建造者模式，充分利用了函数式编程，实现时无需定义接口，直接使用 Function 接口；调用时无需实现匿名内部类，直接采用 lambda 表达式，代码较少较简洁。

- 10.3.代理模式
> Spring 中最重要的代理模式就是 AOP (Aspect-Oriented Programming，面向切面的编程)，是使用 JDK 动态代理和 CGLIB 动态代理技术来实现的。

```java
@Slf4j
@RestController
@RequestMapping("/user")
public class UserController {
    /** 用户服务 */
    @Autowired
    private UserService userService;

    /** 查询用户 */
    @PostMapping("/queryUser")
    public Result<?> queryUser(@RequestBody @Valid UserQueryVO query) {
        try {
            PageDataVO<UserVO> pageData = userService.queryUser(query);
            return Result.success(pageData);
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return Result.failure(e.getMessage());
        }
    }
    ...
}
```

> 精简1：
```java

@RestController
@RequestMapping("/user")
public class UserController {
    /** 用户服务 */
    @Autowired
    private UserService userService;

    /** 查询用户 */
    @PostMapping("/queryUser")
    public Result<PageDataVO<UserVO>> queryUser(@RequestBody @Valid UserQueryVO query) {
        PageDataVO<UserVO> pageData = userService.queryUser(query);
        return Result.success(pageData);
    }
    ...
}

@Slf4j
@ControllerAdvice
public class GlobalControllerAdvice {
    /** 处理异常 */
    @ResponseBody
    @ExceptionHandler(Exception.class)
    public Result<Void> handleException(Exception e) {
        log.error(e.getMessage(), e);
        return Result.failure(e.getMessage());
    }
}
```
> 精简2，基于 AOP 的异常处理：
```java
// UserController代码同"精简1"

@Slf4j
@Aspect
public class WebExceptionAspect {
    /** 点切面 */
    @Pointcut("@annotation(org.springframework.web.bind.annotation.RequestMapping)")
    private void webPointcut() {}

    /** 处理异常 */
    @AfterThrowing(pointcut = "webPointcut()", throwing = "e")
    public void handleException(Exception e) {
        Result<Void> result = Result.failure(e.getMessage());
        writeContent(JSON.toJSONString(result));
    }
    ...
}
```



## 参考文档

- [Java 代码精简之道](https://mp.weixin.qq.com/s/A1Z8YZyqQsFqK1TA1dTl2Q)


