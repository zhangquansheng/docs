# 以Dubbo暴露服务的方式使用Feign（Feign 继承）

在使用Feign在日常的工作中，有以下几个问题：
- 不能像使用`dubbo-api`那样直接调用接口，而是需要`customer`编写各种的`FeignClient`去对接；
- `provider`也无法确定哪些接口被`customer`调用，在修改接口时无法做出准确的评估；
- 如果`provider`的一个接口被多个`customer`使用，那么我们需要写多次的`FeignClient`，不仅不能够复用代码，且非常浪费时间；


**那么`provider`在提供接口的同时，也提供一个类似于`dubbo-api`的`jar` 给`customer`**。


## 服务端

在 module `magic-api` 项目中定义一个FeignClient：（DictItemFeignClient.java）
```java
@FeignClient(name = DictItemFeignClient.NAME, url = "${servers.domain.magic}", fallbackFactory = DictItemFeignClientFallbackFactory.class)
public interface DictItemFeignClient {

    String NAME = "magic";

    /**
     * 通过主键查询单条数据
     *
     * @param id ID
     * @return 数据字典
     */
    @GetMapping("/dict/item/{id}")
    Result<DictItemDTO> findById(@PathVariable("id") Long id);
}
```

在 module `magic-provider` 项目中接口的实现类：（DictItemController.java）
```java
@RestController
@RequestMapping("/dict/item")
public class DictItemController implements DictItemFeignClient {

    @Autowired
    private DictItemFacade dictItemFacade;

    @ApiOperation("通过主键查询单条数据")
    @GetMapping("/{id}")
    @Override
    public Result<DictItemDTO> findById(@PathVariable("id") Long id) {
        return Result.successData(dictItemFacade.findById(id));
    }

}
```

## 客户端

客户端调用代码:
```java
    @Autowired
    private DictItemFeignClient dictItemFeignClient;

    dictItemFeignClient.findById(id)
```

---
**参考文档**

- [Feign Inheritance Support](https://docs.spring.io/spring-cloud-openfeign/docs/2.2.4.RELEASE/reference/html/#spring-cloud-feign-inheritance)
- [Gitee Samples](https://gitee.com/zhangquansheng/magic/tree/feign/)

虽然`spring-cloud-openfeign`官方文档中有以下的提示
::: tip  提示

It is generally not advisable to share an interface between a server and a client. It introduces tight coupling, and also actually doesn’t work with Spring MVC in its current form (method parameter mapping is not inherited).

通常不建议在服务器和客户端之间共享接口。它引入了紧密耦合，并且实际上也不能以当前形式与Spring MVC一起使用（方法参数映射不被继承）。
:::

**但是能复用代码，简化开发 提高效率。**

