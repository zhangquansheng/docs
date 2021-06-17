# RestHighLevelClient

> - 目前`spring-data-elasticsearch`底层采用`es`官方`TransportClient`，而`es`官方计划放弃`TransportClient`，工具以`es`官方推荐的`RestHighLevelClient`进行封装
> - 类似于`Mybatis-Plus`一样，能够极大简化`java client API`，并不断更新，让`es`更高级的功能更轻松的使用
> - 基于`elasticsearch6.4.3`版本进行开发

## ElasticsearchConfiguration
```java
package com.zhengcheng.magic.data.elasticsearch;

import org.apache.http.HttpHost;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestClientBuilder;
import org.elasticsearch.client.RestHighLevelClient;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Scope;
import org.springframework.util.StringUtils;

import com.zhengcheng.magic.data.elasticsearch.properties.ElasticsearchProperties;

import lombok.extern.slf4j.Slf4j;

/**
 * 自动配置注入 restHighLevelClient
 *
 * @author quansheng1.zhang
 * @since 2021/6/16 19:33
 */
@Slf4j
@EnableConfigurationProperties({ElasticsearchProperties.class})
@Configuration
public class ElasticsearchConfiguration {

    /**
     * https://www.elastic.co/guide/en/elasticsearch/client/java-rest/6.4/java-rest-high-getting-started-initialization.html
     *
     * @return RestHighLevelClient
     */
    @ConditionalOnMissingBean(RestHighLevelClient.class)
    @Bean(destroyMethod = "close")
    @Scope("singleton")
    public RestHighLevelClient restHighLevelClient(ElasticsearchProperties elasticsearchProperties) {
        String host = elasticsearchProperties.getHost();
        String username = elasticsearchProperties.getUsername();
        String password = elasticsearchProperties.getPassword();
        Integer maxConnectTotal = elasticsearchProperties.getMaxConnectTotal();
        Integer maxConnectPerRoute = elasticsearchProperties.getMaxConnectPerRoute();
        Integer connectionRequestTimeoutMillis = elasticsearchProperties.getConnectionRequestTimeoutMillis();
        Integer socketTimeoutMillis = elasticsearchProperties.getSocketTimeoutMillis();
        Integer connectTimeoutMillis = elasticsearchProperties.getConnectTimeoutMillis();
        if (StringUtils.isEmpty(host)) {
            host = "127.0.0.1:9200";
        }
        String[] hosts = host.split(",");
        HttpHost[] httpHosts = new HttpHost[hosts.length];
        for (int i = 0; i < httpHosts.length; i++) {
            String h = hosts[i];
            httpHosts[i] = new HttpHost(h.split(":")[0], Integer.parseInt(h.split(":")[1]), "http");
        }

        RestClientBuilder builder = RestClient.builder(httpHosts);
        builder.setRequestConfigCallback(requestConfigBuilder -> {
            requestConfigBuilder.setConnectTimeout(connectTimeoutMillis);
            requestConfigBuilder.setSocketTimeout(socketTimeoutMillis);
            requestConfigBuilder.setConnectionRequestTimeout(connectionRequestTimeoutMillis);
            return requestConfigBuilder;
        });

        if (!StringUtils.isEmpty(username)) {
            final CredentialsProvider credentialsProvider = new BasicCredentialsProvider();
            credentialsProvider.setCredentials(AuthScope.ANY, new UsernamePasswordCredentials(username, password)); // es账号密码（默认用户名为elastic）

            builder.setHttpClientConfigCallback(httpClientBuilder -> {
                httpClientBuilder.disableAuthCaching();
                httpClientBuilder.setMaxConnTotal(maxConnectTotal);
                httpClientBuilder.setMaxConnPerRoute(maxConnectPerRoute);
                httpClientBuilder.setDefaultCredentialsProvider(credentialsProvider);
                return httpClientBuilder;
            });
        } else {
            builder.setHttpClientConfigCallback(httpClientBuilder -> {
                httpClientBuilder.disableAuthCaching();
                httpClientBuilder.setMaxConnTotal(maxConnectTotal);
                httpClientBuilder.setMaxConnPerRoute(maxConnectPerRoute);
                return httpClientBuilder;
            });
        }

        return new RestHighLevelClient(builder);
    }
}
```

## annotation
```java
package com.zhengcheng.magic.data.elasticsearch.annotations;

import java.lang.annotation.*;

/**
 * Document
 *
 * @author quansheng1.zhang
 * @since 2021/6/16 10:54
 */
@Inherited
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE})
public @interface Document {

    /**
     * 索引名称，必须配置
     */
    String indexName();

    /**
     * 索引类型
     */
    String indexType() default "_doc";

    boolean useServerConfiguration() default false;

    /**
     * 主分片数量
     */
    int shards() default 5;

    /**
     * 备份分片数量
     */
    int replicas() default 1;

    String refreshInterval() default "1s";

    String indexStoreType() default "fs";

    boolean createIndex() default true;
}
```

```java
package com.zhengcheng.magic.data.elasticsearch.annotations;

import java.lang.annotation.*;

import org.springframework.context.annotation.Import;

import com.zhengcheng.magic.data.elasticsearch.ElasticsearchConfiguration;
import com.zhengcheng.magic.data.elasticsearch.registrar.DocumentScannerRegistrar;

/**
 * Use this annotation to register EnableElasticsearchPlus property sources when using Java Config.
 *
 * @author quansheng1.zhang
 * @since 2021/6/16 19:21
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@Import({ElasticsearchConfiguration.class, DocumentScannerRegistrar.class})
public @interface EnableElasticsearchPlus {

    /**
     * Alias for the {@link #basePackages()} attribute. Allows for more concise annotation declarations e.g.:
     * {@code @EnableElasticsearchPlus("org.my.pkg")} instead of
     * {@code @EnableElasticsearchPlus(basePackages = "org.my.pkg"})}.
     *
     * @return base package names
     */
    String[] value() default {};

    /**
     * Base packages to scan for EnableElasticsearchPlus interfaces. Note that only interfaces with at least one method
     * will be registered; concrete classes will be ignored.
     *
     * @return base package names for scanning mapper interface
     */
    String[] basePackages() default {};
}
```

```java
package com.zhengcheng.magic.data.elasticsearch.annotations;

import java.lang.annotation.*;

/**
 * 对应索引结构mapping的注解，在es entity field上添加
 *
 * @author quansheng1.zhang
 * @since 2021/6/16 10:50
 */
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.FIELD})
@Documented
public @interface Field {

    FieldType type() default FieldType.Auto;

}
```

```java
package com.zhengcheng.magic.data.elasticsearch.annotations;

/**
 * FieldType
 *
 * @author quansheng1.zhang
 * @since 2021/6/16 10:51
 */
public enum FieldType {
    Text, Integer, Long, Date, Float, Double, Boolean, Object, Auto, Nested, Ip, Attachment, Keyword
}
```

```java
package com.zhengcheng.magic.data.elasticsearch.annotations;

import java.lang.annotation.*;

/**
 * Document 主键标识
 *
 * @author : quansheng.zhang
 * @date : 2020/3/27 22:21
 */
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface Id {

}
```

## metadata

```java
package com.zhengcheng.magic.data.elasticsearch.metadata;

import java.time.LocalDateTime;
import java.util.Date;

import com.zhengcheng.magic.data.elasticsearch.annotations.Field;
import com.zhengcheng.magic.data.elasticsearch.annotations.FieldType;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.ToString;

/**
 * DocumentFieldInfo
 *
 * @author quansheng1.zhang
 * @since 2021/6/16 11:02
 */
@Getter
@ToString
@EqualsAndHashCode
public class DocumentFieldInfo {
    /**
     * 属性名
     */
    private final String property;
    /**
     * 属性类型
     */
    private final Class<?> propertyType;
    /**
     * 属性是否是 CharSequence 类型
     */
    private final boolean isCharSequence;
    /**
     * 字段数据类型
     */
    private final FieldType fieldType;

    public DocumentFieldInfo(java.lang.reflect.Field field, Field documentField) {
        field.setAccessible(true);
        this.property = field.getName();
        this.propertyType = field.getType();
        this.isCharSequence = this.isCharSequence(this.propertyType);
        this.fieldType = documentField.type();
    }

    public DocumentFieldInfo(java.lang.reflect.Field field) {
        field.setAccessible(true);
        this.property = field.getName();
        this.propertyType = field.getType();
        this.isCharSequence = this.isCharSequence(this.propertyType);
        this.fieldType = FieldType.Auto;
    }

    /**
     * 是否为CharSequence类型
     *
     * @param clazz
     *            class
     * @return true 为是 CharSequence 类型
     */
    private boolean isCharSequence(Class<?> clazz) {
        return clazz != null && CharSequence.class.isAssignableFrom(clazz);
    }

    /**
     * 获取ES字段的类型值
     * 
     * @return 类型值
     */
    public String getTypeValue() {
        if (fieldType.equals(FieldType.Auto)) {
            if (propertyType.equals(Integer.class) || propertyType.equals(Long.class)) {
                return "long";
            } else if (propertyType.equals(Date.class) || propertyType.equals(LocalDateTime.class)) {
                return "date";
            }
            return "text";
        }
        return fieldType.name().toLowerCase();
    }
}
```

```java
package com.zhengcheng.magic.data.elasticsearch.metadata;

import java.util.List;

import cn.hutool.core.util.ReflectUtil;
import lombok.AccessLevel;
import lombok.Data;
import lombok.Setter;
import lombok.experimental.Accessors;

/**
 * 文档反射信息
 *
 * @author quansheng1.zhang
 * @since 2021/6/16 10:59
 */
@Data
@Setter(AccessLevel.PACKAGE)
@Accessors(chain = true)
public class DocumentInfo {
    /**
     * 实体类型
     */
    private Class<?> entityType;
    /**
     * 文档索引名称
     */
    private String indexName;
    /**
     * 索引类型
     */
    private String indexType;
    /**
     * 主分片数量
     */
    private Integer indexNumberOfShards;
    /**
     * 备份分片数量
     */
    private Integer indexNumberOfReplicas;

    /**
     * 文档 主键ID 属性名
     */
    private String keyProperty;
    /**
     * 文档主键ID 属性类型
     */
    private Class<?> keyType;
    /**
     * 文档字段信息列表
     */
    private List<DocumentFieldInfo> fieldList;

    public DocumentInfo(Class<?> entityType) {
        this.entityType = entityType;
    }

    void setFieldList(List<DocumentFieldInfo> fieldList) {
        this.fieldList = fieldList;
    }

    /**
     * 获取索引的值
     * 
     * @param obj
     *            Object
     * @return 索引的值
     */
    public String getIndexValue(Object obj) {
        return String.valueOf(ReflectUtil.getFieldValue(obj, keyProperty));
    }
}
```

```java
package com.zhengcheng.magic.data.elasticsearch.metadata;

import java.lang.reflect.Field;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.util.ClassUtils;

import com.zhengcheng.magic.data.elasticsearch.annotations.Document;
import com.zhengcheng.magic.data.elasticsearch.annotations.Id;

import cn.hutool.core.util.ReflectUtil;
import cn.hutool.core.util.StrUtil;
import lombok.extern.slf4j.Slf4j;

/**
 * 文档反射信息辅助类
 *
 * @author quansheng1.zhang
 * @since 2021/6/16 11:08
 */
@Slf4j
public class DocumentInfoHelper {

    /**
     * 储存反射类文档信息
     */
    private static final Map<Class<?>, DocumentInfo> DOCUMENT_INFO_CACHE = new ConcurrentHashMap<>();

    /**
     * 默认序列化版本uid
     */
    private static final String SERIAL_VERSION_UID = "serialVersionUID";

    /**
     * <p>
     * 获取实体映射文档信息
     * </p>
     *
     * @param clazz
     *            反射实体类
     * @return 数据库文档反射信息
     */
    public static DocumentInfo getDocumentInfo(Class<?> clazz) {
        if (clazz == null || clazz == String.class) {
            return null;
        }

        DocumentInfo documentInfo = DOCUMENT_INFO_CACHE.get(ClassUtils.getUserClass(clazz));
        if (null != documentInfo) {
            return documentInfo;
        }
        // 尝试获取父类缓存
        Class<?> currentClass = clazz;
        while (null == documentInfo && Object.class != currentClass) {
            currentClass = currentClass.getSuperclass();
            documentInfo = DOCUMENT_INFO_CACHE.get(ClassUtils.getUserClass(currentClass));
        }
        if (documentInfo != null) {
            DOCUMENT_INFO_CACHE.put(ClassUtils.getUserClass(clazz), documentInfo);
        }
        return documentInfo;
    }

    /**
     * <p>
     * 实体类反射获取文档信息【初始化】
     * </p>
     *
     * @param clazz
     *            反射实体类
     * @return 数据库文档反射信息
     */
    public synchronized static DocumentInfo initDocumentInfo(Class<?> clazz) {
        DocumentInfo documentInfo = DOCUMENT_INFO_CACHE.get(clazz);
        if (documentInfo != null) {
            return documentInfo;
        }

        /* 没有获取到缓存信息,则初始化 */
        documentInfo = new DocumentInfo(clazz);

        /* 初始化文档索引相关 */
        initDocumentIndex(clazz, documentInfo);

        /* 初始化字段相关 */
        initTableFields(clazz, documentInfo);

        /* 放入缓存 */
        DOCUMENT_INFO_CACHE.put(clazz, documentInfo);

        return documentInfo;
    }

    /**
     * <p>
     * 初始化 文档数据库类型,文档索引名
     * </p>
     *
     * @param clazz
     *            实体类
     * @param documentInfo
     *            数据库文档反射信息
     */
    private static void initDocumentIndex(Class<?> clazz, DocumentInfo documentInfo) {
        Document document = clazz.getAnnotation(Document.class);
        if (document != null) {
            documentInfo.setIndexName(document.indexName());
            documentInfo.setIndexType(document.indexType());
            documentInfo.setIndexNumberOfShards(document.shards());
            documentInfo.setIndexNumberOfReplicas(document.replicas());
        }
    }

    /**
     * <p>
     * 初始化 文档主键,文档字段
     * </p>
     *
     * @param clazz
     *            实体类
     * @param documentInfo
     *            数据库文档反射信息
     */
    public static void initTableFields(Class<?> clazz, DocumentInfo documentInfo) {
        Field[] list = ReflectUtil.getFields(clazz);
        // 是否存在 @Id 注解
        boolean existId = isExistId(Arrays.asList(list));
        if (!existId) {
            log.warn("请使用 @Id 标记 id 主键");
            throw new RuntimeException();
        }

        List<DocumentFieldInfo> fieldList = new ArrayList<>();
        for (Field field : list) {
            if (StrUtil.equalsIgnoreCase(SERIAL_VERSION_UID, field.getName())) {
                continue;
            }
            /* 文档 ID 初始化 */
            Id id = field.getAnnotation(Id.class);
            if (id != null) {
                initIndexIdWithoutAnnotation(documentInfo, field, clazz.getName());
                continue;
            }

            /* 有 @Field 注解的字段初始化 */
            if (initDocumentFieldWithAnnotation(fieldList, field)) {
                continue;
            }

            /* 无 @Field 注解的字段初始化 */
            fieldList.add(new DocumentFieldInfo(field));
        }

        /* 字段列文档,不可变集合 */
        documentInfo.setFieldList(Collections.unmodifiableList(fieldList));
    }

    /**
     * <p>
     * 文档主键属性初始化
     * </p>
     *
     * @param documentInfo
     *            文档信息
     * @param field
     *            字段
     * @param className
     *            类名称
     */
    private static void initIndexIdWithoutAnnotation(DocumentInfo documentInfo, Field field, String className) {
        if (StrUtil.isNotEmpty(documentInfo.getKeyProperty())) {
            log.error("@Id can't more than one in Class: {}.", className);
            throw new RuntimeException();
        }
        if (!String.class.equals(field.getType())) {
            log.error("@Id only String type is supported in Class: {}.", className);
            throw new RuntimeException();
        }

        final String property = field.getName();
        documentInfo.setKeyProperty(property).setKeyType(field.getType());
    }

    /**
     * <p>
     * 字段属性初始化
     * </p>
     *
     * @param fieldList
     *            字段列文档
     * @return true 继续下一个属性判断，返回 continue;
     */
    private static boolean initDocumentFieldWithAnnotation(List<DocumentFieldInfo> fieldList, Field field) {
        /* 获取注解属性，自定义字段 */
        com.zhengcheng.magic.data.elasticsearch.annotations.Field documentField =
            field.getAnnotation(com.zhengcheng.magic.data.elasticsearch.annotations.Field.class);
        if (Objects.isNull(documentField)) {
            return false;
        }

        fieldList.add(new DocumentFieldInfo(field, documentField));
        return true;
    }

    /**
     * <p>
     * 判断主键注解是否存在
     * </p>
     *
     * @param list
     *            字段列文档
     * @return true 为存在 @Id 注解;
     */
    public static boolean isExistId(List<Field> list) {
        return list.stream().anyMatch(field -> field.isAnnotationPresent(Id.class));
    }
}
```

## properties

```java
package com.zhengcheng.magic.data.elasticsearch.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.cloud.context.config.annotation.RefreshScope;

import lombok.Data;

/**
 * ElasticsearchProperties
 *
 * @author quansheng1.zhang
 * @since 2021/6/16 19:33
 */
@Data
@RefreshScope
@ConfigurationProperties(prefix = "elasticsearch")
public class ElasticsearchProperties {

    private String host = "127.0.0.1:9200";
    private String username;
    private String password;
    /**
     * 连接池里的最大连接数
     */
    private Integer maxConnectTotal = 30;

    /**
     * 某一个/每服务每次能并行接收的请求数量
     */
    private Integer maxConnectPerRoute = 10;

    /**
     * http clilent中从connetcion pool中获得一个connection的超时时间
     */
    private Integer connectionRequestTimeoutMillis = 2000;

    /**
     * 响应超时时间，超过此时间不再读取响应
     */
    private Integer socketTimeoutMillis = 30000;

    /**
     * 链接建立的超时时间
     */
    private Integer connectTimeoutMillis = 2000;

}
```

## registrar

```java
package com.zhengcheng.magic.data.elasticsearch.registrar;

import java.lang.annotation.Annotation;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.BeanClassLoaderAware;
import org.springframework.beans.factory.annotation.AnnotatedBeanDefinition;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.beans.factory.support.BeanDefinitionRegistry;
import org.springframework.context.EnvironmentAware;
import org.springframework.context.ResourceLoaderAware;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.context.annotation.ImportBeanDefinitionRegistrar;
import org.springframework.core.annotation.AnnotationAttributes;
import org.springframework.core.env.Environment;
import org.springframework.core.io.ResourceLoader;
import org.springframework.core.type.AnnotationMetadata;
import org.springframework.core.type.filter.AnnotationTypeFilter;
import org.springframework.util.ClassUtils;
import org.springframework.util.StringUtils;

import com.zhengcheng.magic.data.elasticsearch.annotations.Document;
import com.zhengcheng.magic.data.elasticsearch.annotations.EnableElasticsearchPlus;
import com.zhengcheng.magic.data.elasticsearch.metadata.DocumentInfo;
import com.zhengcheng.magic.data.elasticsearch.metadata.DocumentInfoHelper;

import cn.hutool.core.util.StrUtil;
import lombok.extern.slf4j.Slf4j;

/**
 * 自定义注解 @Document 扫描注册器
 *
 * @author : quansheng.zhang
 * @date : 2020/3/29 20:07
 */
@Slf4j
public class DocumentScannerRegistrar
    implements ImportBeanDefinitionRegistrar, ResourceLoaderAware, BeanClassLoaderAware, EnvironmentAware {

    private ResourceLoader resourceLoader;

    private ClassLoader classLoader;

    private Environment environment;

    public DocumentScannerRegistrar() {}

    @Override
    public void setResourceLoader(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    @Override
    public void setBeanClassLoader(ClassLoader classLoader) {
        this.classLoader = classLoader;
    }

    @Override
    public void setEnvironment(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry) {
        // 参考 org.mybatis.spring.annotation.MapperScannerRegistrar
        AnnotationAttributes annoAttrs = AnnotationAttributes
            .fromMap(importingClassMetadata.getAnnotationAttributes(EnableElasticsearchPlus.class.getName()));
        if (annoAttrs != null) {
            List<String> basePackages = new ArrayList<>();
            basePackages.addAll(Arrays.stream(annoAttrs.getStringArray("value")).filter(StringUtils::hasText)
                .collect(Collectors.toList()));

            basePackages.addAll(Arrays.stream(annoAttrs.getStringArray("basePackages")).filter(StringUtils::hasText)
                .collect(Collectors.toList()));

            if (basePackages.isEmpty()) {
                basePackages.add(getDefaultBasePackage(importingClassMetadata));
            }

            ClassPathScanningCandidateComponentProvider scanner = getScanner();
            scanner.setResourceLoader(this.resourceLoader);
            scanner.addIncludeFilter(new AnnotationTypeFilter(Document.class));

            basePackages.forEach(basePackage -> registerDocumentInfo(scanner, basePackage));
        }
    }

    private void registerDocumentInfo(ClassPathScanningCandidateComponentProvider scanner, String basePackage) {
        Set<BeanDefinition> candidateComponents = scanner.findCandidateComponents(basePackage);
        for (BeanDefinition candidateComponent : candidateComponents) {
            if (candidateComponent instanceof AnnotatedBeanDefinition) {
                AnnotatedBeanDefinition beanDefinition = (AnnotatedBeanDefinition)candidateComponent;
                AnnotationMetadata annotationMetadata = beanDefinition.getMetadata();
                String className = annotationMetadata.getClassName();
                try {
                    Class<?> beanClazz = Class.forName(className);
                    if (!beanClazz.isAnnotationPresent(Document.class)) {
                        throw new RuntimeException(StrUtil.format("{} @Document is required!", className));
                    }
                    DocumentInfo documentInfo = DocumentInfoHelper.initDocumentInfo(beanClazz);
                    log.info("Document IndexName: [{}] , IndexType: [{}].", documentInfo.getIndexName(),
                        documentInfo.getIndexType());
                } catch (ClassNotFoundException e) {
                    log.error("Could not register target class: {}", annotationMetadata.getClassName(), e);
                }
            }
        }
    }

    private static String getDefaultBasePackage(AnnotationMetadata importingClassMetadata) {
        return ClassUtils.getPackageName(importingClassMetadata.getClassName());
    }

    protected ClassPathScanningCandidateComponentProvider getScanner() {
        return new ClassPathScanningCandidateComponentProvider(false, this.environment) {
            @Override
            protected boolean isCandidateComponent(AnnotatedBeanDefinition beanDefinition) {
                if (beanDefinition.getMetadata().isIndependent()) {
                    if (beanDefinition.getMetadata().isInterface()
                        && beanDefinition.getMetadata().getInterfaceNames().length == 1
                        && Annotation.class.getName().equals(beanDefinition.getMetadata().getInterfaceNames()[0])) {
                        try {
                            Class<?> target = ClassUtils.forName(beanDefinition.getMetadata().getClassName(),
                                DocumentScannerRegistrar.this.classLoader);
                            return !target.isAnnotation();
                        } catch (Exception ex) {
                            log.error("Could not load target class: {}", beanDefinition.getMetadata().getClassName(),
                                ex);
                        }
                    }
                    return true;
                }
                return false;
            }
        };
    }
}
```

## repository

```java
package com.zhengcheng.magic.data.elasticsearch.repository;

import java.io.IOException;

/**
 * Indices APIs
 *
 * @author quansheng1.zhang
 * @since 2021/6/16 20:31
 */
public interface ElasticsearchIndex<T> {
    /**
     * 创建索引
     * 
     * @param clazz
     *            目标类
     * @throws IOException
     *             异常
     */
    void createIndex(Class<T> clazz) throws IOException;

    /**
     * 删除索引
     * 
     * @param clazz
     *            目标类
     * @throws IOException
     *             异常
     */
    void delete(Class<T> clazz) throws IOException;

    /**
     * Indices Exists API
     * 
     * @param clazz
     *            目标类
     * @return 是否存在
     * @throws IOException
     *             异常
     */
    boolean exists(Class<T> clazz) throws IOException;
}
```

```java
package com.zhengcheng.magic.data.elasticsearch.repository.impl;

import java.io.IOException;

import org.elasticsearch.action.admin.indices.create.CreateIndexRequest;
import org.elasticsearch.action.admin.indices.create.CreateIndexResponse;
import org.elasticsearch.action.admin.indices.delete.DeleteIndexRequest;
import org.elasticsearch.action.admin.indices.delete.DeleteIndexResponse;
import org.elasticsearch.action.admin.indices.get.GetIndexRequest;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.common.settings.Settings;
import org.elasticsearch.common.xcontent.XContentBuilder;
import org.elasticsearch.common.xcontent.XContentFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Repository;

import com.zhengcheng.magic.data.elasticsearch.metadata.DocumentFieldInfo;
import com.zhengcheng.magic.data.elasticsearch.metadata.DocumentInfo;
import com.zhengcheng.magic.data.elasticsearch.metadata.DocumentInfoHelper;
import com.zhengcheng.magic.data.elasticsearch.repository.ElasticsearchIndex;

import cn.hutool.core.util.StrUtil;
import lombok.extern.slf4j.Slf4j;

/**
 * Indices APIs
 *
 * @author quansheng1.zhang
 * @since 2021/6/16 20:32
 */
@Slf4j
@ConditionalOnBean(RestHighLevelClient.class)
@Repository
public class ElasticsearchIndexImpl<T> implements ElasticsearchIndex<T> {

    @Autowired
    private RestHighLevelClient client;

    @Override
    public void createIndex(Class<T> clazz) throws IOException {
        DocumentInfo documentInfo = DocumentInfoHelper.getDocumentInfo(clazz);

        // https://www.elastic.co/guide/en/elasticsearch/client/java-rest/6.4/java-rest-high-create-index.html
        CreateIndexRequest request = new CreateIndexRequest(documentInfo.getIndexName());
        request.settings(Settings.builder().put("index.number_of_shards", documentInfo.getIndexNumberOfShards())
            .put("index.number_of_replicas", documentInfo.getIndexNumberOfReplicas()));
        XContentBuilder builder = XContentFactory.jsonBuilder();
        builder.startObject();
        {
            builder.startObject(documentInfo.getIndexType());
            {
                builder.startObject("properties");
                {
                    for (DocumentFieldInfo documentFieldInfo : documentInfo.getFieldList()) {
                        builder.startObject(documentFieldInfo.getProperty());
                        {
                            String typeValue = documentFieldInfo.getTypeValue();
                            builder.field("type", typeValue);

                            // text处理
                            if ("text".equals(typeValue)) {
                                builder.startObject("fields");
                                {
                                    builder.startObject("keyword");
                                    {
                                        builder.field("type", "keyword");
                                        builder.field("ignore_above", 256);
                                    }
                                    builder.endObject();
                                }
                                builder.endObject();
                            } else if ("date".equals(typeValue)) {
                                // https://www.elastic.co/guide/en/elasticsearch/reference/current/date.html
                                builder.field("format", "yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis");
                            }
                        }
                        builder.endObject();
                    }
                }
                builder.endObject();
            }
            builder.endObject();
        }
        builder.endObject();
        request.mapping(documentInfo.getIndexType(), builder);
        CreateIndexResponse createIndexResponse = client.indices().create(request, RequestOptions.DEFAULT);
        // 指示是否所有节点都已确认请求
        boolean acknowledged = createIndexResponse.isAcknowledged();
        log.info(StrUtil.format("创建索引[{}]结果：[{}]", documentInfo.getIndexName(), acknowledged));
    }

    @Override
    public void delete(Class<T> clazz) throws IOException {
        DocumentInfo documentInfo = DocumentInfoHelper.getDocumentInfo(clazz);
        DeleteIndexRequest request = new DeleteIndexRequest(documentInfo.getIndexName());
        DeleteIndexResponse deleteIndexResponse = client.indices().delete(request, RequestOptions.DEFAULT);
        boolean acknowledged = deleteIndexResponse.isAcknowledged();
        log.info(StrUtil.format("删除索引[{}]结果：[{}]", documentInfo.getIndexName(), acknowledged));
    }

    @Override
    public boolean exists(Class<T> clazz) throws IOException {
        DocumentInfo documentInfo = DocumentInfoHelper.getDocumentInfo(clazz);
        GetIndexRequest request = new GetIndexRequest();
        request.indices(documentInfo.getIndexName());
        return client.indices().exists(request, RequestOptions.DEFAULT);
    }

}
```

```java
package com.zhengcheng.magic.data.elasticsearch.repository;

import java.io.IOException;
import java.util.List;

import org.elasticsearch.search.builder.SearchSourceBuilder;

import com.zhangmen.brain.solar.common.web.PageCommand;
import com.zhangmen.brain.solar.common.web.PageInfo;

/**
 * Search APIs
 *
 * @author quansheng1.zhang
 * @since 2021/6/17 10:03
 */
public interface ElasticsearchTemplate<T> {

    PageInfo<T> page(SearchSourceBuilder sourceBuilder, PageCommand pageCommand, Class<T> clazz) throws IOException;

    PageInfo<T> page(PageCommand pageCommand, Class<T> clazz) throws IOException;

    List<T> list(Class<T> clazz) throws IOException;

    List<T> list(SearchSourceBuilder sourceBuilder, Class<T> clazz) throws IOException;

    void save(T t) throws IOException;

    void batchSave(List<T> list) throws IOException;

    void delete(T t) throws IOException;

    void deleteById(String id, Class<T> clazz) throws IOException;

    T getById(String id, Class<T> clazz) throws IOException;

    boolean existsById(String id, Class<T> clazz) throws IOException;
}
```

```java
package com.zhengcheng.magic.data.elasticsearch.repository.impl;

import java.io.IOException;
import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import org.elasticsearch.action.bulk.BulkRequest;
import org.elasticsearch.action.bulk.BulkResponse;
import org.elasticsearch.action.delete.DeleteRequest;
import org.elasticsearch.action.delete.DeleteResponse;
import org.elasticsearch.action.get.GetRequest;
import org.elasticsearch.action.get.GetResponse;
import org.elasticsearch.action.index.IndexRequest;
import org.elasticsearch.action.index.IndexResponse;
import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.common.xcontent.XContentBuilder;
import org.elasticsearch.common.xcontent.XContentFactory;
import org.elasticsearch.search.SearchHit;
import org.elasticsearch.search.SearchHits;
import org.elasticsearch.search.builder.SearchSourceBuilder;
import org.elasticsearch.search.fetch.subphase.FetchSourceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zhangmen.brain.solar.common.web.PageCommand;
import com.zhangmen.brain.solar.common.web.PageInfo;
import com.zhengcheng.magic.data.elasticsearch.metadata.DocumentFieldInfo;
import com.zhengcheng.magic.data.elasticsearch.metadata.DocumentInfo;
import com.zhengcheng.magic.data.elasticsearch.metadata.DocumentInfoHelper;
import com.zhengcheng.magic.data.elasticsearch.repository.ElasticsearchTemplate;

import cn.hutool.core.date.LocalDateTimeUtil;
import cn.hutool.core.util.ReflectUtil;
import cn.hutool.core.util.StrUtil;
import lombok.extern.slf4j.Slf4j;

/**
 * ElasticsearchTemplateImpl
 *
 * @author quansheng1.zhang
 * @since 2021/6/17 10:16
 */
@Slf4j
@ConditionalOnBean({RestHighLevelClient.class})
@Repository
public class ElasticsearchTemplateImpl<T> implements ElasticsearchTemplate<T> {

    @Autowired
    private RestHighLevelClient client;
    @Autowired
    private ObjectMapper mapper;

    @Override
    public PageInfo<T> page(SearchSourceBuilder sourceBuilder, PageCommand pageCommand, Class<T> clazz)
        throws IOException {
        // 禁止深度分页
        int maxResultWindow = 10000;
        if (pageCommand.getPageSize() * pageCommand.getPageNum() > maxResultWindow) {
            // 优化解决办法：限制操作行为，禁止跳跃翻页查询，这时可以使用scroll进行滚动查询。
            throw new RuntimeException("防止耗尽ES内存资源，产生OOM，禁止深度分页。");
        }

        if (Objects.isNull(sourceBuilder)) {
            sourceBuilder = new SearchSourceBuilder();
        }
        sourceBuilder.from((pageCommand.getPageNum() - 1) * pageCommand.getPageSize());
        sourceBuilder.size(pageCommand.getPageSize());

        DocumentInfo documentInfo = DocumentInfoHelper.getDocumentInfo(clazz);
        SearchResponse searchResponse = search(documentInfo, sourceBuilder);

        PageInfo<T> pageInfo = PageInfo.empty(pageCommand);
        pageInfo.setTotal(searchResponseToTotalHits(searchResponse));
        pageInfo.setList(searchResponseToList(clazz, documentInfo, searchResponse));
        return pageInfo;
    }

    @Override
    public PageInfo<T> page(PageCommand pageCommand, Class<T> clazz) throws IOException {
        return page(null, pageCommand, clazz);
    }

    @Override
    public List<T> list(Class<T> clazz) throws IOException {
        return list(null, clazz);
    }

    @Override
    public List<T> list(SearchSourceBuilder sourceBuilder, Class<T> clazz) throws IOException {
        DocumentInfo documentInfo = DocumentInfoHelper.getDocumentInfo(clazz);
        SearchResponse searchResponse = search(documentInfo, sourceBuilder);
        return searchResponseToList(clazz, documentInfo, searchResponse);
    }

    @Override
    public void save(T t) throws IOException {
        IndexResponse indexResponse = client.index(getIndexRequest(t), RequestOptions.DEFAULT);
        log.info(StrUtil.format("变更文档记录结果：[{}]", indexResponse.getResult().toString()));
    }

    @Override
    public void batchSave(List<T> list) throws IOException {
        BulkRequest request = new BulkRequest();
        for (T t : list) {
            request.add(getIndexRequest(t));
        }
        BulkResponse bulkResponse = client.bulk(request, RequestOptions.DEFAULT);
        if (bulkResponse.hasFailures()) {
            log.error("ElasticsearchTemplate.batchSave one or more operation has failed");
        }
    }

    @Override
    public void delete(T t) throws IOException {
        DocumentInfo documentInfo = DocumentInfoHelper.getDocumentInfo(t.getClass());

        DeleteRequest request =
            new DeleteRequest(documentInfo.getIndexName(), documentInfo.getIndexType(), documentInfo.getIndexValue(t));
        DeleteResponse deleteResponse = client.delete(request, RequestOptions.DEFAULT);
        log.info(StrUtil.format("删除文档记录结果：[{}]", deleteResponse.getResult().toString()));
    }

    @Override
    public void deleteById(String id, Class<T> clazz) throws IOException {
        DocumentInfo documentInfo = DocumentInfoHelper.getDocumentInfo(clazz);

        DeleteRequest request = new DeleteRequest(documentInfo.getIndexName(), documentInfo.getIndexType(), id);
        DeleteResponse deleteResponse = client.delete(request, RequestOptions.DEFAULT);
        log.info(StrUtil.format("删除文档记录结果：[{}]", deleteResponse.getResult().toString()));
    }

    @Override
    public T getById(String id, Class<T> clazz) throws IOException {
        DocumentInfo documentInfo = DocumentInfoHelper.getDocumentInfo(clazz);
        GetRequest getRequest = new GetRequest(documentInfo.getIndexName(), documentInfo.getIndexType(), id);
        GetResponse getResponse = client.get(getRequest, RequestOptions.DEFAULT);
        T t = string2Obj(getResponse.getSourceAsString(), clazz);
        setId(clazz, t, getResponse.getId(), documentInfo.getKeyProperty());
        return t;
    }

    @Override
    public boolean existsById(String id, Class<T> clazz) throws IOException {
        DocumentInfo documentInfo = DocumentInfoHelper.getDocumentInfo(clazz);
        GetRequest getRequest = new GetRequest(documentInfo.getIndexName(), documentInfo.getIndexType(), id);
        getRequest.fetchSourceContext(new FetchSourceContext(false));
        getRequest.storedFields("_none_");
        return client.exists(getRequest, RequestOptions.DEFAULT);
    }

    private SearchResponse search(DocumentInfo documentInfo, SearchSourceBuilder sourceBuilder) throws IOException {
        SearchRequest searchRequest = new SearchRequest(documentInfo.getIndexName());
        searchRequest.types(documentInfo.getIndexType());

        if (Objects.nonNull(sourceBuilder)) {
            searchRequest.source(sourceBuilder);
        }
        if (log.isDebugEnabled()) {
            log.debug("\n" + mapper.writerWithDefaultPrettyPrinter()
                .writeValueAsString(mapper.readValue(sourceBuilder.toString(), Object.class)));
        }
        return client.search(searchRequest, RequestOptions.DEFAULT);
    }

    private long searchResponseToTotalHits(SearchResponse searchResponse) {
        SearchHits hits = searchResponse.getHits();
        return hits.getTotalHits();
    }

    private List<T> searchResponseToList(Class<T> clazz, DocumentInfo documentInfo, SearchResponse searchResponse)
        throws IOException {
        List<T> tList = new ArrayList<>();
        for (SearchHit hit : searchResponse.getHits()) {
            T t = string2Obj(hit.getSourceAsString(), clazz);
            setId(clazz, t, hit.getId(), documentInfo.getKeyProperty());
            tList.add(t);
        }
        return tList;
    }

    private IndexRequest getIndexRequest(T t) throws IOException {
        DocumentInfo documentInfo = DocumentInfoHelper.getDocumentInfo(t.getClass());

        XContentBuilder builder = XContentFactory.jsonBuilder();
        builder.startObject();
        {
            for (DocumentFieldInfo documentFieldInfo : documentInfo.getFieldList()) {
                if (LocalDateTime.class.equals(documentFieldInfo.getPropertyType())) {
                    LocalDateTime localDateTime =
                        (LocalDateTime)ReflectUtil.getFieldValue(t, documentFieldInfo.getProperty());
                    builder.field(documentFieldInfo.getProperty(), LocalDateTimeUtil.formatNormal(localDateTime));
                } else {
                    builder.field(documentFieldInfo.getProperty(),
                        ReflectUtil.getFieldValue(t, documentFieldInfo.getProperty()));
                }
            }
        }
        builder.endObject();
        return new IndexRequest(documentInfo.getIndexName(), documentInfo.getIndexType(), documentInfo.getIndexValue(t))
            .source(builder);
    }

    @SuppressWarnings("TypeParameterHidesVisibleType")
    private <T> T string2Obj(String str, Class<T> clazz) throws JsonProcessingException {
        if (StringUtils.isEmpty(str) || clazz == null) {
            return null;
        }

        return clazz.equals(String.class) ? (T)str : mapper.readValue(str, clazz);
    }

    /**
     * 将 _id 字段的值 设置到 t 的 @Id 注解的属性上
     */
    private void setId(Class<T> clazz, T t, Object _id, String keyProperty) {
        try {
            Field field = clazz.getDeclaredField(keyProperty);
            field.setAccessible(true);
            if (field.get(t) == null) {
                field.set(t, _id);
            }
        } catch (Exception e) {
            log.error("setId error!", e);
        }
    }

}
```