# 几种 copyProperties 工具类性能比较

::: warning 避免用 Apache BeanUtils 进行属性的 copy。
说明：Apache BeanUtils 性能较差，可以使用其他方案比如 `Spring BeanUtils`, `Cglib BeanCopier`，注意均是浅拷贝
:::

常用的工具：
- org.apache.commons.beanutils.BeanUtils.copyProperties
- org.apache.commons.beanutils.PropertyUtils.copyProperties
- org.springframework.beans.BeanUtils.copyProperties
- org.springframework.cglib.beans.BeanCopier.copy
- org.mapstruct

> 推荐使用`org.mapstruct`，性能最好。

## 性能检测

1. `org.apache.commons.beanutils.BeanUtils.copyProperties` 和 `org.apache.commons.beanutils.PropertyUtils.copyProperties` 有`descriptorsCache`，所以首次复制时间会长一点。
2. `org.apache.commons.beanutils.BeanUtils.copyProperties` 和 `org.apache.commons.beanutils.PropertyUtils.copyProperties` 复制的`Bean`结构越复杂，越能体现出性能的差别，越简单，耗时越少。
3. `org.mapstruct` 对复制的`bean`和是否首次无要求（本身它就是`JAVA`代码而已）。

测试代码如下：
```java
/**
 * CopyPropertiesServiceImpl
 *
 * @author quansheng1.zhang
 * @since 2021/3/10 19:58
 */
@Slf4j
@Service
public class CopyPropertiesServiceImpl implements ICopyPropertiesService {

    @Autowired
    private ZmXtcCourseLinkService zmXtcCourseLinkService;
    @Autowired
    private CourseLinkAssembler courseLinkAssembler;

    private void beanUtils(ZmXtcCourseLink source, ZmXtcCourseLinkVO target, int count) {
        TimeInterval timer = DateUtil.timer();
        for (int i = 0; i < count; i++) {
            org.springframework.beans.BeanUtils.copyProperties(source, target);
        }
        log.info("org.springframework.beans.BeanUtils.copyProperties 执行 {} 次，耗时： {}ms", count, timer.interval());
    }

    private void apacheBeanUtils(ZmXtcCourseLink source, ZmXtcCourseLinkVO target, int count) throws IllegalAccessException, InvocationTargetException {
        TimeInterval timer = DateUtil.timer();
        for (int i = 0; i < count; i++) {
            org.apache.commons.beanutils.BeanUtils.copyProperties(source, target);
        }
        log.info("org.apache.commons.beanutils.BeanUtils.copyProperties 执行 {} 次，耗时： {}ms", count, timer.interval());
    }

    private void propertyUtils(ZmXtcCourseLink source, ZmXtcCourseLinkVO target, int count) throws IllegalAccessException, NoSuchMethodException, InvocationTargetException {
        TimeInterval timer = DateUtil.timer();
        for (int i = 0; i < count; i++) {
            org.apache.commons.beanutils.PropertyUtils.copyProperties(source, target);
        }
        log.info("org.apache.commons.beanutils.PropertyUtils.copyProperties 执行 {} 次，耗时： {}ms", count, timer.interval());
    }

    private void mapstruct(ZmXtcCourseLink source, int count) {
        TimeInterval timer = DateUtil.timer();
        for (int i = 0; i < count; i++) {
            courseLinkAssembler.toVO(source);
        }
        log.info("mapstruct copyProperties 执行 {} 次，耗时： {}ms", count, timer.interval());
    }

    private void beanCopier(ZmXtcCourseLink source, ZmXtcCourseLinkVO target, int count) {
        BeanCopier copier = BeanCopier.create(ZmXtcCourseLink.class, ZmXtcCourseLinkVO.class, false);

        TimeInterval timer = DateUtil.timer();
        for (int i = 0; i < count; i++) {
            copier.copy(source, target, null);
        }
        log.info("org.springframework.cglib.beans.BeanCopier copyProperties 执行 {} 次，耗时： {}ms", count, timer.interval());
    }

    private void zmBeanUtils(ZmXtcCourseLink source, ZmXtcCourseLinkVO target, int count) throws InvocationTargetException, IllegalAccessException {
        TimeInterval timer = DateUtil.timer();
        for (int i = 0; i < count; i++) {
            BeanUtils.copyProperties(source, target);
        }
        log.info("com.zmlearn.framework.common.bean.BeanUtils copyProperties 执行 {} 次，耗时： {}ms", count, timer.interval());
    }

    @Override
    public void test(int count) {
        List<ZmXtcCourseLink> zmXtcCourseLinkList = zmXtcCourseLinkService.findCourseLinksByContentId(91148);
        if (CollectionUtils.isEmpty(zmXtcCourseLinkList)) {
            return;
        }

        ZmXtcCourseLink zmXtcCourseLink = zmXtcCourseLinkList.get(0);
        ZmXtcCourseLinkVO zmXtcCourseLinkVO = new ZmXtcCourseLinkVO();
        try {
            zmBeanUtils(zmXtcCourseLink, zmXtcCourseLinkVO, count);

            apacheBeanUtils(zmXtcCourseLink, zmXtcCourseLinkVO, count);

            propertyUtils(zmXtcCourseLink, zmXtcCourseLinkVO, count);

        } catch (Exception e) {
            log.error(e.getMessage(), e);
        }

        beanUtils(zmXtcCourseLink, zmXtcCourseLinkVO, count);

        beanCopier(zmXtcCourseLink, zmXtcCourseLinkVO, count);

        mapstruct(zmXtcCourseLink, count);
    }

}
```

`ZmXtcCourseLink`
```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ZmXtcCourseLink {

    @TableId(type = IdType.AUTO)
    private Integer id;

    private Integer contentId;

    private Integer linkId;

    private String subjectDictCode;

    private Integer sort;

    private Integer unlockCondition;

    private Boolean isTick;

    private Boolean deleted;

    private Integer createdUser;

    private Date createdTime;

    private Integer updatedUser;

    private Date updatedTime;

    private Boolean isCoreLink;

    /**
     * 发放能量果，0-未设置，1-发放，2-不发放 {@link com.zhangmen.course.c.domain.enums.GiveEnergyFruitEnum}
     */
    private Integer giveEnergyFruit;
}
```

`ZmXtcCourseLinkVO`(特别注意：此类中包含了`TeachLinkAnimationDTO`等其他的类，这是导致性能急剧下降的原因。)
```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ApiModel("课程环节信息")
public class ZmXtcCourseLinkVO {

    @ApiModelProperty("课程id")
    private Integer contentId;

    @ApiModelProperty("环节id")
    private Integer linkId;

    @ApiModelProperty("学科dictCode")
    private String subjectDictCode;

    @ApiModelProperty("排序")
    private Integer sort;

    @ApiModelProperty("解锁条件")
    private Integer unlockCondition;

    @ApiModelProperty("是否打勾")
    private Integer isTick;

    @ApiModelProperty("环节名称")
    private String subjectLinkName;

    @ApiModelProperty("模块ID")
    private Integer moduleId;

    @ApiModelProperty("模块名称")
    private String moduleName;

    @ApiModelProperty("报幕动画")
    private String paperAnimationUrl;

    @ApiModelProperty("点亮前端图标")
    private String brightFrontIconUrl;

    @ApiModelProperty("点亮文案颜色")
    private String brightCopyColor;

    @ApiModelProperty("点亮背景颜色")
    private String brightBackgroundColor;

    @ApiModelProperty("置灰前端图标")
    private String greyFrontIconUrl;

    @ApiModelProperty("置灰文案颜色")
    private String greyCopyColor;

    @ApiModelProperty("置灰背景颜色")
    private String greyBackgroundColor;

    @ApiModelProperty("核心环节")
    private Boolean isCoreLink;

    @ApiModelProperty("发放能量果：0-未知、1-发放、2-不发放")
    private Integer giveEnergyFruit;

    @ApiModelProperty("当前课程当前环节特殊配置id")
    private Integer linkPageConfigId;

    @ApiModelProperty("报幕视频动画ID")
    private Long announceVideoAnimationId;

    @ApiModelProperty("报幕视频动画")
    private TeachLinkAnimationDTO announceVideoAnimation;

    @ApiModelProperty("闭幕动画ID")
    private Long curtainCallAnimationId;

    @ApiModelProperty("闭幕动画")
    private TeachLinkAnimationDTO curtainCallAnimation;
}
```

工具\耗时 | 1000次 | 10000次 | 100000次 
---|---|---|---|---
org.apache.commons.beanutils.BeanUtils.copyProperties | 2498ms | 23447ms | -
org.apache.commons.beanutils.PropertyUtils.copyProperties | 2511ms | 22864ms | -
org.springframework.beans.BeanUtils.copyProperties | 7ms | 63ms | 850ms
org.springframework.cglib.beans.BeanCopier | 0ms | 0ms | 2ms
mapstruct copyProperties | 0ms | 0ms | 3ms

## org.apache.commons.beanutils.BeanUtils 源码分析


`org.apache.commons.beanutils.BeanUtilsBean.copyProperties`
```java
public void copyProperties(final Object dest, final Object orig)
        throws IllegalAccessException, InvocationTargetException {
    
        // ...

        // Copy the properties, converting as necessary
        if (orig instanceof DynaBean) {
             // ...
        } else if (orig instanceof Map) {
            // ...
        } else /* if (orig is a standard JavaBean) */ {
            for (PropertyDescriptor origDescriptor : origDescriptors) {
                 // ...
                copyProperty(dest, name, value);
            }
        }

    }
```

`copyProperty`
```java
/**
 * <p>Copy the specified property value to the specified destination bean,
 * performing any type conversion that is required.  If the specified
 * bean does not have a property of the specified name, or the property
 * is read only on the destination bean, return without
 * doing anything.  If you have custom destination property types, register
 * {@link Converter}s for them by calling the <code>register()</code>
 * method of {@link ConvertUtils}.</p>
 *
 * <p><strong>IMPLEMENTATION RESTRICTIONS</strong>:</p>
 * <ul>
 * <li>Does not support destination properties that are indexed,
 *     but only an indexed setter (as opposed to an array setter)
 *     is available.</li>
 * <li>Does not support destination properties that are mapped,
 *     but only a keyed setter (as opposed to a Map setter)
 *     is available.</li>
 * <li>The desired property type of a mapped setter cannot be
 *     determined (since Maps support any data type), so no conversion
 *     will be performed.</li>
 * </ul>
 *
 * @param bean Bean on which setting is to be performed
 * @param name Property name (can be nested/indexed/mapped/combo)
 * @param value Value to be set
 *
 * @throws IllegalAccessException if the caller does not have
 *  access to the property accessor method
 * @throws InvocationTargetException if the property accessor method
 *  throws an exception
 */
public void copyProperty(final Object bean, String name, Object value)
    throws IllegalAccessException, InvocationTargetException {

    // Trace logging (if enabled)
    if (log.isTraceEnabled()) {
        final StringBuilder sb = new StringBuilder("  copyProperty(");
        sb.append(bean);
        sb.append(", ");
        sb.append(name);
        sb.append(", ");
        if (value == null) {
            sb.append("<NULL>");
        } else if (value instanceof String) {
            sb.append((String) value);
        } else if (value instanceof String[]) {
            final String[] values = (String[]) value;
            sb.append('[');
            for (int i = 0; i < values.length; i++) {
                if (i > 0) {
                    sb.append(',');
                }
                sb.append(values[i]);
            }
            sb.append(']');
        } else {
            sb.append(value.toString());
        }
        sb.append(')');
        log.trace(sb.toString());
    }

    // Resolve any nested expression to get the actual target bean
    Object target = bean;
    final Resolver resolver = getPropertyUtils().getResolver();
    while (resolver.hasNested(name)) {
        try {
            target = getPropertyUtils().getProperty(target, resolver.next(name));
            name = resolver.remove(name);
        } catch (final NoSuchMethodException e) {
            return; // Skip this property setter
        }
    }
    if (log.isTraceEnabled()) {
        log.trace("    Target bean = " + target);
        log.trace("    Target name = " + name);
    }

    // Declare local variables we will require
    final String propName = resolver.getProperty(name); // Simple name of target property
    Class<?> type = null;                         // Java type of target property
    final int index  = resolver.getIndex(name);         // Indexed subscript value (if any)
    final String key = resolver.getKey(name);           // Mapped key value (if any)

    // Calculate the target property type
    if (target instanceof DynaBean) {
        final DynaClass dynaClass = ((DynaBean) target).getDynaClass();
        final DynaProperty dynaProperty = dynaClass.getDynaProperty(propName);
        if (dynaProperty == null) {
            return; // Skip this property setter
        }
        type = dynaPropertyType(dynaProperty, value);
    } else {
        PropertyDescriptor descriptor = null;
        try {
            descriptor =
                getPropertyUtils().getPropertyDescriptor(target, name);
            if (descriptor == null) {
                return; // Skip this property setter
            }
        } catch (final NoSuchMethodException e) {
            return; // Skip this property setter
        }
        type = descriptor.getPropertyType();
        if (type == null) {
            // Most likely an indexed setter on a POJB only
            if (log.isTraceEnabled()) {
                log.trace("    target type for property '" +
                          propName + "' is null, so skipping ths setter");
            }
            return;
        }
    }
    if (log.isTraceEnabled()) {
        log.trace("    target propName=" + propName + ", type=" +
                  type + ", index=" + index + ", key=" + key);
    }

    // Convert the specified value to the required type and store it
    if (index >= 0) {                    // Destination must be indexed
        value = convertForCopy(value, type.getComponentType());
        try {
            getPropertyUtils().setIndexedProperty(target, propName,
                                             index, value);
        } catch (final NoSuchMethodException e) {
            throw new InvocationTargetException
                (e, "Cannot set " + propName);
        }
    } else if (key != null) {            // Destination must be mapped
        // Maps do not know what the preferred data type is,
        // so perform no conversions at all
        // FIXME - should we create or support a TypedMap?
        try {
            getPropertyUtils().setMappedProperty(target, propName,
                                            key, value);
        } catch (final NoSuchMethodException e) {
            throw new InvocationTargetException
                (e, "Cannot set " + propName);
        }
    } else {                             // Destination must be simple
        value = convertForCopy(value, type);
        try {
            getPropertyUtils().setSimpleProperty(target, propName, value);
        } catch (final NoSuchMethodException e) {
            throw new InvocationTargetException
                (e, "Cannot set " + propName);
        }
    }

}
```


利用`Arthas` 基本`trace`命令
```shell script
trace org.apache.commons.beanutils.BeanUtilsBean copyProperty -v -n 5 --skipJDKMethod false '1==1'
```
代码运行时，打印如下：
![arthas](/img/digging-deeper/arthas-trace-copyProperty.png)


可以看到，`org.apache.commons.beanutils.BeanUtilsBean copyProperty`方法中，有**日志，转换，解析**等功能，导致此方法性能比较差，
而且`org.apache.commons.beanutils.BeanUtils.copyProperties`的总耗时等于属性数量x一个属性的耗时（`org.apache.commons.beanutils.BeanUtilsBean copyProperty`方法），时间复杂度是**O(n)**。