# mybatis-plus 通用组件

::: tip 特别提示
基于[MybatisPlus](https://mp.baomidou.com/)，数据库基于Mysql5.6以上
:::

## 安装

在 Maven 工程中使用

```xml
  <dependency>
        <groupId>com.zhengcheng</groupId>
        <artifactId>zc-mybatis-plus-spring-boot-starter</artifactId>
  </dependency>
```

## 配置

属性配置
```properties
mybatis-plus.mapper-locations = classpath*:**/*Mapper.xml
mybatis-plus.type-aliases-package = com.zhengcheng.user.entity
mybatis-plus.configuration.map-underscore-to-camel-case = true
mybatis-plus.type-enums-package = com.zhengcheng.user.enums
```

> 更多设置请参考[MybatisPlus官方文档](https://mp.baomidou.com/)

要求`Mapper`接口的包路径满足以下条件（**否则不能自动扫描到Mapper**）：
```java
@MapperScan(basePackages = "com.zhengcheng.**.mapper*")
```

## 核心功能

按照阿里巴巴`JAVA`开发手册、规定，每张数据库表都有以下的公共字段：
```sql
CREATE TABLE `t_base` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  `update_time` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` tinyint unsigned NOT NULL COMMENT '是否删除',
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4  ROW_FORMAT=REDUNDANT COMMENT='公共字段模板表';
```

当你在项目中的`entity`继承`BaseEntity`后，就自动拥有了公共字段，不需要你在添加、更新时维护，代码示例如下:

- 表对应的实体
```java
import com.baomidou.mybatisplus.annotation.TableName;
import com.zhengcheng.mybatis.plus.model.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

/**
 * 数据字典表(DictItem)实体类
 *
 * @author quansheng1.zhang
 * @since 2020-10-29 20:15:38
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Accessors(chain = true)
@TableName("t_dict_item")
public class DictItem extends BaseEntity<DictItem> {
    private static final long serialVersionUID = 836566997638888136L;
    /**
     * 类型
     */
    private String type;
    /**
     * 字典编码
     */
    private String code;
    /**
     * 字典名称
     */
    private String name;

}
```

- 添加记录
```java
    @Autowired
    private IDictItemService dictItemService;

    DictItem dictItem = this.toEntity(dictItemCommand);
    dictItemService.save(dictItem);


    private DictItem toEntity(DictItemCommand dictItemCommand) {
        DictItem dictItem = new DictItem();
        dictItem.setType(dictItemCommand.getType());
        dictItem.setCode(dictItemCommand.getCode());
        dictItem.setName(dictItemCommand.getName());

        return dictItem;
    }
```

- 解决了繁琐的配置，让`mybatis`优雅的使用枚举属性！对应代码如下：
```java
/**
 * 登录结果
 *
 * @author : quansheng.zhang
 * @date : 2019/10/29 11:02
 */
@Getter
public enum LoginResultEnum {

    SUCCESS(0, "成功"),

    FAILURE(1, "失败");

    @EnumValue
    private final int    value;

    private final String desc;

    LoginResultEnum(final int value, final String desc) {
        this.value = value;
        this.desc = desc;
    }

    /**
     * 根据value获取类型
     *
     * @param value
     *            值
     * @return 枚举
     */
    public static LoginResultEnum getByValue(Integer value) {
        for (LoginResultEnum loginResultEnum : LoginResultEnum.values()) {
            if (value.equals(loginResultEnum.getValue())) {
                return loginResultEnum;
            }
        }
        return LoginResultEnum.SUCCESS;
    }
}
```
> 更多请参考[MybatisPlus 通用枚举](https://baomidou.com/guide/enum.html)

## mybatis-plus-sample-wrapper

```java
@RunWith(SpringRunner.class)
@SpringBootTest
public class WrapperTest {

    @Resource
    private UserMapper userMapper;
    @Resource
    private RoleMapper roleMapper;

    @Test
    public void tests() {
        System.out.println("----- 普通查询 ------");
        List<User> plainUsers = userMapper.selectList(new QueryWrapper<User>().eq("role_id", 2L));
        List<User> lambdaUsers = userMapper.selectList(new QueryWrapper<User>().lambda().eq(User::getRoleId, 2L));
        Assert.assertEquals(plainUsers.size(), lambdaUsers.size());
        print(plainUsers);

        System.out.println("----- 带子查询(sql注入) ------");
        List<User> plainUsers2 = userMapper.selectList(new QueryWrapper<User>()
                .inSql("role_id", "select id from role where id = 2"));
        List<User> lambdaUsers2 = userMapper.selectList(new QueryWrapper<User>().lambda()
                .inSql(User::getRoleId, "select id from role where id = 2"));
        Assert.assertEquals(plainUsers2.size(), lambdaUsers2.size());
        print(plainUsers2);

        System.out.println("----- 带嵌套查询 ------");
        List<User> plainUsers3 = userMapper.selectList(new QueryWrapper<User>()
                .nested(i -> i.eq("role_id", 2L).or().eq("role_id", 3L))
                .and(i -> i.ge("age", 20)));
        List<User> lambdaUsers3 = userMapper.selectList(new QueryWrapper<User>().lambda()
                .nested(i -> i.eq(User::getRoleId, 2L).or().eq(User::getRoleId, 3L))
                .and(i -> i.ge(User::getAge, 20)));
        Assert.assertEquals(plainUsers3.size(), lambdaUsers3.size());
        print(plainUsers3);

        System.out.println("----- 自定义(sql注入) ------");
        List<User> plainUsers4 = userMapper.selectList(new QueryWrapper<User>()
                .apply("role_id = 2"));
        print(plainUsers4);

        UpdateWrapper<User> uw = new UpdateWrapper<>();
        uw.set("email", null);
        uw.eq("id", 4);
        userMapper.update(new User(), uw);
        User u4 = userMapper.selectById(4);
        Assert.assertNull(u4.getEmail());


    }

    @Test
    public void lambdaQueryWrapper() {
        System.out.println("----- 普通查询 ------");
        List<User> plainUsers = userMapper.selectList(new LambdaQueryWrapper<User>().eq(User::getRoleId, 2L));
        List<User> lambdaUsers = userMapper.selectList(new QueryWrapper<User>().lambda().eq(User::getRoleId, 2L));
        Assert.assertEquals(plainUsers.size(), lambdaUsers.size());
        print(plainUsers);

        System.out.println("----- 带子查询(sql注入) ------");
        List<User> plainUsers2 = userMapper.selectList(new LambdaQueryWrapper<User>()
                .inSql(User::getRoleId, "select id from role where id = 2"));
        List<User> lambdaUsers2 = userMapper.selectList(new QueryWrapper<User>().lambda()
                .inSql(User::getRoleId, "select id from role where id = 2"));
        Assert.assertEquals(plainUsers2.size(), lambdaUsers2.size());
        print(plainUsers2);

        System.out.println("----- 带嵌套查询 ------");
        List<User> plainUsers3 = userMapper.selectList(new LambdaQueryWrapper<User>()
                .nested(i -> i.eq(User::getRoleId, 2L).or().eq(User::getRoleId, 3L))
                .and(i -> i.ge(User::getAge, 20)));
        List<User> lambdaUsers3 = userMapper.selectList(new QueryWrapper<User>().lambda()
                .nested(i -> i.eq(User::getRoleId, 2L).or().eq(User::getRoleId, 3L))
                .and(i -> i.ge(User::getAge, 20)));
        Assert.assertEquals(plainUsers3.size(), lambdaUsers3.size());
        print(plainUsers3);

        System.out.println("----- 自定义(sql注入) ------");
        List<User> plainUsers4 = userMapper.selectList(new QueryWrapper<User>()
                .apply("role_id = 2"));
        print(plainUsers4);

        UpdateWrapper<User> uw = new UpdateWrapper<>();
        uw.set("email", null);
        uw.eq("id", 4);
        userMapper.update(new User(), uw);
        User u4 = userMapper.selectById(4);
        Assert.assertNull(u4.getEmail());
    }

    private <T> void print(List<T> list) {
        if (!CollectionUtils.isEmpty(list)) {
            list.forEach(System.out::println);
        }
    }

    /**
     * SELECT id,name,age,email,role_id FROM user
     * WHERE ( 1 = 1 ) AND ( ( name = ? AND age = ? ) OR ( name = ? AND age = ? ) )
     */
    @Test
    public void testSql() {
        QueryWrapper<User> w = new QueryWrapper<>();
        w.and(i -> i.eq("1", 1))
                .nested(i ->
                        i.and(j -> j.eq("name", "a").eq("age", 2))
                                .or(j -> j.eq("name", "b").eq("age", 2)));
        userMapper.selectList(w);
    }
}
```

## mybatis-plus-sample-pagination

```java
@Slf4j
@SpringBootTest
public class PaginationTest {

    @Resource
    private UserMapper mapper;

    @Test
    public void lambdaPagination() {
        Page<User> page = new Page<>(1, 3);
        Page<User> result = mapper.selectPage(page, Wrappers.<User>lambdaQuery().ge(User::getAge, 1).orderByAsc(User::getAge));
        assertThat(result.getTotal()).isGreaterThan(3);
        assertThat(result.getRecords().size()).isEqualTo(3);
    }

    @Test
    public void tests1() {
        log.error("----------------------------------baseMapper 自带分页-------------------------------------------------------");
        Page<User> page = new Page<>(1, 5);
        page.addOrder(OrderItem.asc("age"));
        Page<User> userIPage = mapper.selectPage(page, Wrappers.<User>lambdaQuery().eq(User::getAge, 20).like(User::getName, "Jack"));
        assertThat(page).isSameAs(userIPage);
        log.error("总条数 -------------> {}", userIPage.getTotal());
        log.error("当前页数 -------------> {}", userIPage.getCurrent());
        log.error("当前每页显示数 -------------> {}", userIPage.getSize());
        List<User> records = userIPage.getRecords();
        assertThat(records).isNotEmpty();

        log.error("----------------------------------json 正反序列化-------------------------------------------------------");
        String json = JSON.toJSONString(page);
        log.info("json ----------> {}", json);
        Page<User> page1 = JSON.parseObject(json, new TypeReference<Page<User>>() {
        });
        List<User> records1 = page1.getRecords();
        assertThat(records1).isNotEmpty();
        assertThat(records1.get(0).getClass()).isEqualTo(User.class);

        log.error("----------------------------------自定义 XML 分页-------------------------------------------------------");
        MyPage<User> myPage = new MyPage<User>(1, 5).setSelectInt(20).setSelectStr("Jack");
        ParamSome paramSome = new ParamSome(20, "Jack");
        MyPage<User> userMyPage = mapper.mySelectPage(myPage, paramSome);
        assertThat(myPage).isSameAs(userMyPage);
        log.error("总条数 -------------> {}", userMyPage.getTotal());
        log.error("当前页数 -------------> {}", userMyPage.getCurrent());
        log.error("当前每页显示数 -------------> {}", userMyPage.getSize());
    }

    @Test
    public void tests2() {
        /* 下面的 left join 不会对 count 进行优化,因为 where 条件里有 join 的表的条件 */
        MyPage<UserChildren> myPage = new MyPage<>(1, 5);
        myPage.setSelectInt(18).setSelectStr("Jack");
        MyPage<UserChildren> userChildrenMyPage = mapper.userChildrenPage(myPage);
        List<UserChildren> records = userChildrenMyPage.getRecords();
        records.forEach(System.out::println);

        /* 下面的 left join 会对 count 进行优化,因为 where 条件里没有 join 的表的条件 */
        myPage = new MyPage<UserChildren>(1, 5).setSelectInt(18);
        userChildrenMyPage = mapper.userChildrenPage(myPage);
        records = userChildrenMyPage.getRecords();
        records.forEach(System.out::println);
    }

    private <T> void print(List<T> list) {
        if (!CollectionUtils.isEmpty(list)) {
            list.forEach(System.out::println);
        }
    }


    @Test
    public void testMyPageMap() {
        MyPage<User> myPage = new MyPage<User>(1, 5).setSelectInt(20).setSelectStr("Jack");
        mapper.mySelectPageMap(myPage, Maps.newHashMap("name", "%a"));
        myPage.getRecords().forEach(System.out::println);
    }

    @Test
    public void testMap() {
        mapper.mySelectMap(Maps.newHashMap("name", "%a")).forEach(System.out::println);
    }

    @Test
    public void myPage() {
        MyPage<User> page = new MyPage<>(1, 5);
        page.setName("a");
        mapper.myPageSelect(page).forEach(System.out::println);
    }

    @Test
    public void iPageTest() {
        IPage<User> page = new Page<User>(1, 5) {
            private String name = "%";

            public String getName() {
                return name;
            }

            public void setName(String name) {
                this.name = name;
            }
        };

        List<User> list = mapper.iPageSelect(page);
        System.out.println("list.size=" + list.size());
        System.out.println("page.total=" + page.getTotal());
    }

    @Test
    public void rowBoundsTest() {
        RowBounds rowBounds = new RowBounds(0, 5);
        List<User> list = mapper.rowBoundList(rowBounds, Maps.newHashMap("name", "%"));
        System.out.println("list.size=" + list.size());
    }

    @Test
    public void selectAndGroupBy() {
        LambdaQueryWrapper<User> lq = new LambdaQueryWrapper<>();
        lq.select(User::getAge).groupBy(User::getAge);
        for (User user : mapper.selectList(lq)) {
            System.out.println(user.getAge());
        }
    }

    @Autowired
    IUserService userService;

    @Test
    public void lambdaPageTest() {
        LambdaQueryChainWrapper<User> wrapper2 = userService.lambdaQuery();
        wrapper2.like(User::getName, "a");
        userService.page(new Page<>(1, 10), wrapper2.getWrapper()).getRecords().forEach(System.out::print);
    }

    @Test
    public void test() {
        userService.lambdaQuery().like(User::getName, "a").list().forEach(System.out::println);

        Page page = userService.lambdaQuery().like(User::getName, "a").page(new Page<>(1, 10));
        page.getRecords().forEach(System.out::println);
    }
}
```

