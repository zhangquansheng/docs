# MyBatis-Plus 结合 Spring Boot 基于 DataPermissionInterceptor 实现数据权限

## 一、场景介绍

在开发过程中很多时候我们需要根据某些条件去做数据权限，比如：A部门只能看见自己的数据等， 此时如果每次都去自己写SQL进行校验就会显得代码非常臃肿，
在 MyBatis-Plus 中可以基于 `DataPermissionInterceptor` 结合**自定义的数据权限注解**实现数据权限的过滤。

## 二、实现思路

MyBatis-Plus 提供了一个 `DataPermissionHandler`接口用于做数据权限控制，其核心调用逻辑位于`DataPermissionInterceptor`中，实际上就是在执行SQL之前将动态条件拼接上去。

## 三、实现步骤

1. 自定义注解
```java
/**
 * DataPermission
 *
 * @author quansheng1.zhang
 * @since 2023/1/19 13:37
 */
@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface DataPermission {

    /**
     * 权限字段的别名
     */
    String value();

    /**
     * 类型
     */
    DataPermissionTypeEnum type() default DataPermissionTypeEnum.ALL;

}
```

2. 定义数据权限类型枚举
```java
/**
 * DataPermissionTypeEnum
 *
 * @author quansheng1.zhang
 * @since 2023/1/19 15:18
 */
@Getter
public enum DataPermissionTypeEnum {

    ALL("1", "拥有所有数据权限"),

    DEPT("3", "拥有部门权限");

//    DEPT_CHILDREN("4", "拥有部门权限及子权限")

    DataPermissionTypeEnum(String category, String descp) {
        this.category = category;
        this.descp = descp;
    }

    /**
     * 类型
     */
    private final String category;
    /**
     * 子类型
     */
    private final String descp;
}
```

3. 实现`DataPermissionHandler`接口
```java
/**
 * MyDataPermissionHandler
 *
 * @author quansheng1.zhang
 * @since 2023/1/19 10:12
 */
@Slf4j
public class MyDataPermissionHandler implements DataPermissionHandler {

    @Override
    public Expression getSqlSegment(Expression where, String mappedStatementId) {
        try {
            Class<?> clazz = Class.forName(mappedStatementId.substring(0, mappedStatementId.lastIndexOf(".")));
            String methodName = mappedStatementId.substring(mappedStatementId.lastIndexOf(".") + 1);
            Method[] methods = clazz.getDeclaredMethods();
            for (Method method : methods) {
                DataPermission dataPermission = method.getAnnotation(DataPermission.class);
                // 可以自定义处理数据权限上下文，然后获取相关的参数
                SessionUserInfo userInfo = SessionContext.getUserInfo();
                if (ObjectUtils.isNotEmpty(dataPermission)
                        && (method.getName().equals(methodName))
                        && !dataPermission.type().equals(DataPermissionTypeEnum.ALL)
                        && ObjectUtils.isNotEmpty(userInfo)) {
                    Map<String, Object> conditions = new ConcurrentHashMap<>(16);
                    if (DataPermissionTypeEnum.DEPT.equals(dataPermission.type())) {
                        // 取当前用户所在部门的ID
                        conditions.put(dataPermission.value(), userInfo.getDeptId());
                    }
                    return dataScopeFilter(where, conditions);
                }
            }
        } catch (Exception e) {
            log.error("MyDataPermissionHandler.getSqlSegment mappedStatementId = {} Exception", mappedStatementId, e);
        }
        return where;
    }


    public static Expression dataScopeFilter(Expression where, Map<String, Object> conditions) {
        //定义条件
        AtomicReference<Expression> whereAtomic = new AtomicReference<>(where);
        //循环构造条件
        conditions.forEach((key, value) -> {
            //判断value的类型（集合特殊处理）
            if (value instanceof Collection) {
                Collection<?> collection = (Collection<?>) value;
                InExpression expression = new InExpression();
                expression.setLeftExpression(new Column(key));
                //获取条件
                ItemsList itemsList = new ExpressionList(collection.stream().map(String::valueOf).map(StringValue::new).collect(Collectors.toList()));
                expression.setRightItemsList(itemsList);
                //拼接条件
                whereAtomic.set(new AndExpression(whereAtomic.get(), expression));
            } else {
                whereAtomic.set(new AndExpression(whereAtomic.get(), new EqualsTo(new Column(key), new StringValue(String.valueOf(value)))));
            }
        });

        return whereAtomic.get();
    }
}
```

4. 将实现的拦截器注入到`MybatisPlusInterceptor`中
```java
    MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();

    // 数据权限插件
    DataPermissionInterceptor dataPermissionInterceptor = new DataPermissionInterceptor(new MyDataPermissionHandler());
    interceptor.addInnerInterceptor(dataPermissionInterceptor);
```
