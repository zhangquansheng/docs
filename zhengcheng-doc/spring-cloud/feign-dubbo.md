# 以Dubbo暴露服务的方式使用Feign

[Gitee Samples](https://gitee.com/zhangquansheng/magic/tree/feign/)

我们在Spring Cloud中使用Feign, 可以做到使用HTTP请求远程服务时能与调用本地方法一样的编码体验，开发者完全感知不到这是远程方法，更感知不到这是个HTTP请求。

但是在日常的工作中，我们发现有以下几个问题：
- 不能像使用`dubbo-api`那样直接调用接口，而是需要使用者编写各种的`FeignClient`去对接不同的接口；
- `provider`无法确定哪些接口被`customer`，无法在做修改接口时做出准确的评估；

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
