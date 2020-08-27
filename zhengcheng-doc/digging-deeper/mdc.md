# 使用MDC进行请求链路日志打印

## 背景

MDC（Mapped Diagnostic Context，映射调试上下文）是 log4j 和 logback 提供的一种方便在多线程条件下记录日志的功能。

在项目中，我们会使用拦截器，aop或者过滤器来进行请求信息的提取并打印日志，这个时候我们会把日志记录到mdc中，并加入traceId来进行分布式链路的追踪。


## 路径拦截器 

> `TraceIdInterceptor` 在 `zhengcheng` 框架中已经提供，并且默认已经配置拦截所有路径

```java
// TraceIdInterceptor.java

/**
 * 路径拦截器
 *
 * @author :    zhangquansheng
 * @date :    2020/3/24 13:55
 */
@Slf4j
@Component
public class TraceIdInterceptor implements HandlerInterceptor {

    public final static String TRACE_ID = "X-ZC-TRACE-ID";

    @Value("${spring.application.name}")
    private String name;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object o) throws Exception {
        if (HttpMethod.OPTIONS.toString().equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String xForwardedForHeader = request.getHeader("X-Forwarded-For");
        String remoteIp = request.getRemoteAddr();
        String traceId = request.getHeader(TraceIdInterceptor.TRACE_ID);
        if (StrUtil.isBlankOrUndefined(traceId)) {
            traceId = IdUtil.fastSimpleUUID();
            request.setAttribute(TraceIdInterceptor.TRACE_ID, traceId);
        }
        MDC.put(TRACE_ID, traceId);
        log.info("applicationName:[{}],clientIp:[{}], X-Forwarded-For:[{}]", name, remoteIp, xForwardedForHeader);
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object o, Exception e) throws Exception {
        MDC.clear();
    }

}
```
::: tip 特别说明：
1. 首先在head中获取 `X-ZC-TRACE-ID`,如果有则作为本次请求的traceId，否则新建一个UUID
3. `OPTIONS` 跨域的第一次请求不记录日志（没有必要的日志）
::: 

在WebMvcConfigurer实现中增加拦截的路径
```java
// WebMvcConfig.java

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(traceIdInterceptor).addPathPatterns("/**");
    }
```

## Feign 调用第三方的日志打印

因为`zhengcheng` 推荐并默认Feign是开启了熔断的,所以需要以下配置才能打印出日志

```java
// MdcHystrixConcurrencyStrategy.java
/**
 * Hystrix线程池隔离支持日志链路跟踪
 *
 * @author stone
 */
public class MdcHystrixConcurrencyStrategy extends HystrixConcurrencyStrategy {

    @Override
    public <T> Callable<T> wrapCallable(Callable<T> callable) {
        return new MdcAwareCallable(callable, MDC.getCopyOfContextMap());
    }

    private class MdcAwareCallable<T> implements Callable<T> {

        private final Callable<T> delegate;

        private final Map<String, String> contextMap;

        public MdcAwareCallable(Callable<T> callable, Map<String, String> contextMap) {
            this.delegate = callable;
            this.contextMap = contextMap != null ? contextMap : new HashMap<>();
        }

        @Override
        public T call() throws Exception {
            try {
                MDC.setContextMap(contextMap);
                return delegate.call();
            } finally {
                MDC.clear();
            }
        }
    }
}
```


```java
// FeignOkHttpConfig.java

/**
 * FeignOkHttpConfig
 *
 * @author :    quansheng.zhang
 * @date :    2019/6/29 16:07
 */
@Slf4j
@Configuration
@ConditionalOnClass({Feign.class})
@AutoConfigureBefore(FeignAutoConfiguration.class)
public class FeignOkHttpConfig implements RequestInterceptor {

    @Value("${feign.okhttp3.connect-timeout.milliseconds}")
    private Long connectTimeout;
    @Value("${feign.okhttp3.read-timeout.milliseconds}")
    private Long readTimeout;
    @Value("${feign.okhttp3.write-timeout.milliseconds}")
    private Long writeTimeout;

    @Bean
    public okhttp3.OkHttpClient okHttpClient() {
        return new okhttp3.OkHttpClient.Builder()
                .connectTimeout(connectTimeout, TimeUnit.MILLISECONDS)
                .readTimeout(readTimeout, TimeUnit.MILLISECONDS)
                .writeTimeout(writeTimeout, TimeUnit.MILLISECONDS)
                .connectionPool(new okhttp3.ConnectionPool())
                .build();
    }

    /**
     * Feign 日志级别
     */
    @Bean
    Logger.Level feignLoggerLevel() {
        return Logger.Level.FULL;
    }

    @Bean
    FeignLoggerFactory infoFeignLoggerFactory() {
        return new InfoFeignLoggerFactory();
    }

    public FeignOkHttpConfig() {
        try {
            HystrixConcurrencyStrategy mdcTarget = new MdcHystrixConcurrencyStrategy();
            HystrixConcurrencyStrategy strategy = HystrixPlugins.getInstance().getConcurrencyStrategy();
            if (strategy instanceof MdcHystrixConcurrencyStrategy) {
                return;
            }
            HystrixCommandExecutionHook commandExecutionHook = HystrixPlugins
                    .getInstance().getCommandExecutionHook();
            HystrixEventNotifier eventNotifier = HystrixPlugins.getInstance()
                    .getEventNotifier();
            HystrixMetricsPublisher metricsPublisher = HystrixPlugins.getInstance()
                    .getMetricsPublisher();
            HystrixPropertiesStrategy propertiesStrategy = HystrixPlugins.getInstance()
                    .getPropertiesStrategy();

            HystrixPlugins.reset();
            HystrixPlugins.getInstance().registerConcurrencyStrategy(mdcTarget);
            HystrixPlugins.getInstance()
                    .registerCommandExecutionHook(commandExecutionHook);
            HystrixPlugins.getInstance().registerEventNotifier(eventNotifier);
            HystrixPlugins.getInstance().registerMetricsPublisher(metricsPublisher);
            HystrixPlugins.getInstance().registerPropertiesStrategy(propertiesStrategy);
        } catch (Exception e) {
            log.error("Failed to register Hystrix Concurrency Strategy", e);
        }
    }

    @Override
    public void apply(RequestTemplate template) {
        String traceId = MDC.get(TraceIdInterceptor.TRACE_ID);
        if (!StrUtil.isEmptyOrUndefined(traceId)) {
            template.header(TraceIdInterceptor.TRACE_ID, traceId);
        }
    }
}

```

由于feign打印日志是DEBUG级别，需要我们改造成INFO级别，代码如下：

```java
// InfoFeignLogger.java

/**
 * Feign INFO 日志
 *
 * @author :    zhangquansheng
 * @date :    2020/4/28 14:04
 */
public class InfoFeignLogger extends feign.Logger {

    // 建议使用slf4j这样项目在更换日志框架也不用修改源代码了，扩展性更强
    private final org.slf4j.Logger logger;

    public InfoFeignLogger(org.slf4j.Logger logger) {
        this.logger = logger;
    }

    @Override
    protected void log(String configKey, String format, Object... args) {
        if (logger.isInfoEnabled()) {
            logger.info(String.format(methodTag(configKey) + format, args));
        }
    }
}
```

```java
// InfoFeignLoggerFactory.java

/**
 * Feign INFO 日志工厂
 *
 * @author :    zhangquansheng
 * @date :    2020/4/28 14:03
 */
public class InfoFeignLoggerFactory implements FeignLoggerFactory {
    @Override
    public Logger create(Class<?> type) {
        return new InfoFeignLogger(LoggerFactory.getLogger(type));
    }
}
```


## 异步线程池打印日志

```java
// MdcTaskDecorator.java
/**
 * 解决异步执行时MDC内容延续的问题
 *
 * @author stone
 */
@SuppressWarnings("NullableProblems")
public class MdcTaskDecorator implements TaskDecorator {

    @Override
    public Runnable decorate(Runnable runnable) {
        return new MdcContinueRunnableDecorator(runnable);
    }

    /**
     * 执行线程装饰器
     */
    protected static class MdcContinueRunnableDecorator implements Runnable {

        private final Runnable delegate;
        final Map<String, String> logContextMap;

        MdcContinueRunnableDecorator(Runnable runnable) {
            this.delegate = runnable;
            this.logContextMap = MDC.getCopyOfContextMap();
        }

        @Override
        public void run() {
            MDC.setContextMap(this.logContextMap);
            this.delegate.run();
            MDC.clear();
        }
    }
}
```


```java
// ExecutorMdcBuilder.java

/**
 * {@link ThreadPoolTaskExecutor} MDC内容延续 线程池建造者
 *
 * @author :    zhangquansheng
 * @date :    2020/3/18 13:44
 */
@Data
public class ExecutorMdcBuilder implements Builder<ThreadPoolTaskExecutor> {

    /**
     * 核心线程数：线程池创建时候初始化的线程数
     */
    private int corePoolSize = 10;
    /**
     * 最大线程数：线程池最大的线程数，只有在缓冲队列满了之后才会申请超过核心线程数的线程
     */
    private int maxPoolSize = 20;
    /**
     * 缓冲队列：用来缓冲执行任务的队列
     */
    private int queueCapacity = 100;
    /**
     * 允许线程的空闲时间(秒)：当超过了核心线程出之外的线程在空闲时间到达之后会被销毁
     */
    private int keepAliveSeconds = 300;
    /**
     * 设置线程池中任务的等待时间，如果超过这个时候还没有销毁就强制销毁，以确保应用最后能够被关闭，而不是阻塞住
     */
    private int awaitTerminationSeconds = 10;
    /**
     * 线程池名的前缀：设置好了之后可以方便我们定位处理任务所在的线程池
     */
    private String threadNamePrefix = "task-executor";


    /**
     * 创建ExecutorBuilder，开始构建
     *
     * @return {@link ExecutorMdcBuilder}
     */
    public static ExecutorMdcBuilder create() {
        return new ExecutorMdcBuilder();
    }

    /**
     * 构建ThreadPoolExecutor
     *
     * @param builder {@link ExecutorBuilder}
     * @return {@link ThreadPoolExecutor}
     */
    private static ThreadPoolTaskExecutor build(ExecutorMdcBuilder builder) {
        ThreadPoolTaskExecutor executor = new VisibleThreadPoolTaskExecutor();
        executor.setCorePoolSize(builder.corePoolSize);
        executor.setMaxPoolSize(builder.maxPoolSize);
        executor.setQueueCapacity(builder.queueCapacity);
        executor.setKeepAliveSeconds(builder.keepAliveSeconds);
        executor.setAwaitTerminationSeconds(builder.awaitTerminationSeconds);
        executor.setThreadNamePrefix(builder.threadNamePrefix);
        executor.setTaskDecorator(new MdcTaskDecorator());
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        //执行初始化
        executor.initialize();
        return executor;
    }

    @Override
    public ThreadPoolTaskExecutor build() {
        return build(this);
    }
}
```

配置异步线程池：

```java
// ExecutorConfig.java

@Configuration
@EnableAsync
public class ExecutorConfig {

    @Bean
    @ConfigurationProperties(prefix = "executor.default.threadpool")
    public Executor taskExecutor() {
        return ExecutorMdcBuilder.create().build();
    }

    @Bean("kafkaTaskExecutor")
    @ConfigurationProperties(prefix = "executor.kafka.threadpool")
    public Executor kafkaTaskExecutor() {
        return ExecutorMdcBuilder.create().build();
    }

}
```