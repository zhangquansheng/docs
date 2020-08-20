# 以Dubbo暴露服务的方式使用Feign

-  像调用本地方法一样执行远程调用

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
