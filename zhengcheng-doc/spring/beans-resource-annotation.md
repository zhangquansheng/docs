# @Resource

如何正确使用，请参考[官方文档](https://docs.spring.io/spring-framework/docs/current/spring-framework-reference/core.html#beans-resource-annotation), 本篇主要讲它的实现原理。

`Spring`不但支持自己定义的`@Autowired`注解，还支持几个由`JSR-250`规范定义的注解，它们分别是`@Resource` `@PostConstruct` `@PreDestroy`。
　　
`@Resource`的作用相当于`@Autowired`，只不过`@Autowired`按**类型**自动注入，而`@Resource`默认按`byName`自动注入。

`@Resource`有两个属性是比较重要的，分是`name`和`type`，`Spring`将`@Resource`注解的`name`属性解析为`bean`的名字，而`type`属性则解析为`bean`的类型。
所以如果使用`name`属性，则使用`byName`的自动注入策略，而使用`type`属性时则使用`byType`自动注入策略。如果既不指定`name`也不指定`type`属性，这时将通过反射机制使用`byName`自动注入策略。

`@Resource`装配顺序:
1. 如果同时指定了`name`和`type`，则从`Spring`上下文中找到唯一匹配的`bean`进行装配，找不到则抛出异常；
2. 如果指定了`name`，则从上下文中查找名称（id）匹配的`bean`进行装配，找不到则抛出异常；
3. 如果指定了`type`，则从上下文中找到类型匹配的唯一`bean`进行装配，找不到或者找到多个，都会抛出异常；
4. 如果既没有指定`name`，又没有指定`type`，则自动按照`byName`方式进行装配；如果没有匹配，则回退为一个原始类型进行匹配，如果匹配则自动装配；

`@Resource`的源码如下：
```java
// javax.annotation.Resource.java

@Target({TYPE, FIELD, METHOD})
@Retention(RUNTIME)
public @interface Resource {
    /**
     * The JNDI name of the resource.  For field annotations,
     * the default is the field name.  For method annotations,
     * the default is the JavaBeans property name corresponding
     * to the method.  For class annotations, there is no default
     * and this must be specified.
     */
    String name() default "";

    /**
     * The name of the resource that the reference points to. It can
     * link to any compatible resource using the global JNDI names.
     *
     * @since Common Annotations 1.1
     */

    String lookup() default "";

    /**
     * The Java type of the resource.  For field annotations,
     * the default is the type of the field.  For method annotations,
     * the default is the type of the JavaBeans property.
     * For class annotations, there is no default and this must be
     * specified.
     */
    Class<?> type() default java.lang.Object.class;

    /**
     * The two possible authentication types for a resource.
     */
    enum AuthenticationType {
            CONTAINER,
            APPLICATION
    }

    /**
     * The authentication type to use for this resource.
     * This may be specified for resources representing a
     * connection factory of any supported type, and must
     * not be specified for resources of other types.
     */
    AuthenticationType authenticationType() default AuthenticationType.CONTAINER;

    /**
     * Indicates whether this resource can be shared between
     * this component and other components.
     * This may be specified for resources representing a
     * connection factory of any supported type, and must
     * not be specified for resources of other types.
     */
    boolean shareable() default true;

    /**
     * A product specific name that this resource should be mapped to.
     * The name of this resource, as defined by the <code>name</code>
     * element or defaulted, is a name that is local to the application
     * component using the resource.  (It's a name in the JNDI
     * <code>java:comp/env</code> namespace.)  Many application servers
     * provide a way to map these local names to names of resources
     * known to the application server.  This mapped name is often a
     * <i>global</i> JNDI name, but may be a name of any form. <p>
     *
     * Application servers are not required to support any particular
     * form or type of mapped name, nor the ability to use mapped names.
     * The mapped name is product-dependent and often installation-dependent.
     * No use of a mapped name is portable.
     */
    String mappedName() default "";

    /**
     * Description of this resource.  The description is expected
     * to be in the default language of the system on which the
     * application is deployed.  The description can be presented
     * to the Deployer to help in choosing the correct resource.
     */
    String description() default "";
}
```

## CommonAnnotationBeanPostProcessor 源码解析