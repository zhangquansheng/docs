## 应用一：Spring 项目启动时，如何打印每个 Bean 加载时间

实现`BeanPostProcessor`接口，通过`Map`记录`postProcessBeforeInitialization`的加载时间，然后在`postProcessAfterInitialization`处理打印出`Bean`加载时间。
```java
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * LoggerBeanLoadCostPostProcessor
 *
 * @author quansheng1.zhang
 * @since 2020/12/26 17:22
 */
@Slf4j
@Component
public class LoggerBeanLoadCostPostProcessor implements BeanPostProcessor {

    private static Map<String, Long> cost = new HashMap<>(10000);

    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
        log.info("first load-spring-bean-cost-info, bean init beanName:{}, begin time : {}", beanName, System.currentTimeMillis());
        cost.put(beanName, System.currentTimeMillis());
        return bean;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (cost.get(beanName) == null) {
            log.warn("first load-spring-bean-cost-info, cost.get(beanName : {} ) is null", beanName);
        } else {
            log.info("first load-spring-bean-cost-info, bean after beanName:{}, beanType :{}  before: {}, cost : {}ms", beanName, bean.getClass().getName(), cost.get(beanName), (System.currentTimeMillis() - cost.get(beanName)));
        }
        return bean;
    }
}
```