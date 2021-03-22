# Ribbon :hammer:

`Ribbon`是`Netflix`发布的一个负载均衡器，有助于控制`HTTP`和`TCP`客户端行为。`Ribbon`**提供了客户端负载均衡的功能**，`Ribbon`利用从`Eureka`中读取到的服务信息，在调用服务节点提供的服务时，
就可以基于某种负载均衡算法，自动地帮助服务消费者去请求。另外`Feign`已经使用了`Ribbon`，因此，如果使用`@FeignClient`，则此部分也适用。

## 为服务消费者整合 Ribbon

- 为项目添加`Ribbon`依赖，`Ribbon`的依赖如下（`spring-cloud-starter-netflix-eureka-client`已经包含`spring-cloud-starter-netflix-ribbon`，因此无须再次引入）：
```xml
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-ribbon</artifactId>
    </dependency>
```

- 为 RestTemplate 添加 @LoadBalanced 注解。
```java
    //添加LoadBalanced注解来整合Ribbon使其具有负载均衡的能力
    @Bean
    @LoadBalanced
    public RestTemplate restTemplate(){
        return new RestTemplate();
    }
```

## 饥饿加载 (Caching of Ribbon Configuration)

`Spring Cloud` 会为每一个命名的`Ribbon`客户端维护一个子应用程序上下文，默认是`lazy load`。指定名称的`Ribbon`客户端第一次请求时，对应的上下文才会被加载，因此，**首次请求往往会比较慢**。 
从 `Spring Cloud Dalston ` 开始，我们可配置饥饿加载。例如：
```yaml
ribbon:
    eager-load:
        enabled: true
        clients: client1, client2, client3
```

这样，对于名为 client1、client2、client3 的`Ribbon`客户端，将在启动时就加载对应的子应用程序上下文，从而**提高首次请求的访问速度**。

## ServerList 的刷新机制

### PollingServerListUpdater 
```java
public class PollingServerListUpdater implements ServerListUpdater {

    // ......

    @Override
    public synchronized void start(final UpdateAction updateAction) {
        if (isActive.compareAndSet(false, true)) {
            final Runnable wrapperRunnable = new Runnable() {
                @Override
                public void run() {
                    if (!isActive.get()) {
                        if (scheduledFuture != null) {
                            scheduledFuture.cancel(true);
                        }
                        return;
                    }
                    try {
                        // 执行 ServerListUpdater.UpdateAction 接口的 doUpdate 方法，实际上执行 DynamicServerListLoadBalancer 内部的 updateListOfServers 方法
                        updateAction.doUpdate();
                        lastUpdated = System.currentTimeMillis();
                    } catch (Exception e) {
                        logger.warn("Failed one update cycle", e);
                    }
                }
            };
            
            // 基于 ScheduledFuture 实现定时任务, 创建并执行一个在给定初始延迟后首次启用的定期任务。
            scheduledFuture = getRefreshExecutor().scheduleWithFixedDelay(
                    wrapperRunnable,  // 要执行的任务
                    initialDelayMs,   // 首次执行的延迟时间 
                    refreshIntervalMs, // 任务间隔时间
                    TimeUnit.MILLISECONDS //  initialDelay 和 delay 参数的时间单位
            );
        } else {
            logger.info("Already active, no-op");
        }
    }
  
    // ......
}
```

### DynamicServerListLoadBalancer

```java
public class DynamicServerListLoadBalancer<T extends Server> extends BaseLoadBalancer {

    // ......

    protected final ServerListUpdater.UpdateAction updateAction = new ServerListUpdater.UpdateAction() {
        @Override
        public void doUpdate() {
            updateListOfServers();
        }
    };
    
    // ......

    @VisibleForTesting
    public void updateListOfServers() {
        List<T> servers = new ArrayList<T>();
        if (serverListImpl != null) {
            // 获取更新的服务器列表，通过实现 ServerList 接口实现的服务提供者，例如：Nacos Eureka 
            servers = serverListImpl.getUpdatedListOfServers();
            LOGGER.debug("List of Servers for {} obtained from Discovery client: {}",
                    getIdentifier(), servers);

            if (filter != null) {
                servers = filter.getFilteredListOfServers(servers);
                LOGGER.debug("Filtered List of Servers for {} obtained from Discovery client: {}",
                        getIdentifier(), servers);
            }
        }
        updateAllServerList(servers);
    }
    
    // ......

}
```

本文以`Nacos`为例。

### NacosServerList
```java
public class NacosServerList extends AbstractServerList<NacosServer> {
    
    // ......

	@Override
	public List<NacosServer> getUpdatedListOfServers() {
		return getServers();
	}

	private List<NacosServer> getServers() {
		try {
			String group = discoveryProperties.getGroup();
			List<Instance> instances = discoveryProperties.namingServiceInstance()
					.selectInstances(serviceId, group, true);
			return instancesToServerList(instances);
		}
		catch (Exception e) {
			throw new IllegalStateException(
					"Can not get service instances from nacos, serviceId=" + serviceId,
					e);
		}
	}

	private List<NacosServer> instancesToServerList(List<Instance> instances) {
		List<NacosServer> result = new ArrayList<>();
		if (CollectionUtils.isEmpty(instances)) {
			return result;
		}
		for (Instance instance : instances) {
			result.add(new NacosServer(instance));
		}

		return result;
	}
    
	// ......

}
```

获取的`result`如下：
![ribbon-nacos-result](/img/spring-cloud/ribbon-nacos-result.jpg)


---
**参考文档**

- [7. Client Side Load Balancer: Ribbon](https://docs.spring.io/spring-cloud-netflix/docs/2.2.5.RELEASE/reference/html/#spring-cloud-ribbon)