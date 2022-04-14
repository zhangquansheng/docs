# Spring Boot - 性能测试 ContiPerf

## ContiPerf 介绍

`ContiPerf` 是一个轻量级的测试工具，基于 `JUnit 4` 开发，可用于效率测试等。

## Maven 依赖

```java
<dependency>
    <groupId>org.databene</groupId>
    <artifactId>contiperf</artifactId>
    <version>2.3.4</version>
    <scope>test</scope>
</dependency>
```

## ContiPerf 使用
可以指定在线程数量和执行次数，通过限制最大时间和平均执行时间来进行效率测试
```java
public class ContiPerfTest {
@Rule
public ContiPerfRule i = new ContiPerfRule();

    @Test
    @PerfTest(invocations = 1000, threads = 40)
    @Required(max = 1200, average = 250, totalTime = 60000)
    public void test1() throws Exception {
        Thread.sleep(200);
    }
}
```

使用@Rule注释激活ContiPerf，通过@Test指定测试方法，@PerfTest指定调用次数和线程数量，@Required指定性能要求（每次执行的最长时间，平均时间，总时间等）。
也可以通过对类指定@PerfTest和@Required，表示类中方法的默认设置。
```java
@PerfTest(invocations = 1000, threads = 40)
@Required(max = 1200, average = 250, totalTime = 60000)
public class ContiPerfTest {
@Rule
public ContiPerfRule i = new ContiPerfRule();

    @Test
    public void test1() throws Exception {
        Thread.sleep(200);
    }
}
```

## 主要参数介绍

1. PerfTest参数
    - @PerfTest(invocations = 300)：执行300次，和线程数量无关，默认值为1，表示执行1次；
    - @PerfTest(threads=30)：并发执行30个线程，默认值为1个线程；
    - @PerfTest(duration = 20000)：重复地执行测试至少执行20s。
2. Required参数
    - @Required(throughput = 20)：要求每秒至少执行20个测试；
    - @Required(average = 50)：要求平均执行时间不超过50ms； 
    - @Required(median = 45)：要求所有执行的50%不超过45ms； 
    - @Required(max = 2000)：要求没有测试超过2s； 
    - @Required(totalTime = 5000)：要求总的执行时间不超过5s； 
    - @Required(percentile90 = 3000)：要求90%的测试不超过3s； 
    - @Required(percentile95 = 5000)：要求95%的测试不超过5s； 
    - @Required(percentile99 = 10000)：要求99%的测试不超过10s; 
    - @Required(percentiles = "66:200,96:500")：要求66%的测试不超过200ms，96%的测试不超过500ms。




