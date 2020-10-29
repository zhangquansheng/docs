# netty-socketio

基于[socket.io](https://github.com/socketio/socket.io)，使用[netty-socketio](https://github.com/mrniko/netty-socketio)

## 安装

在`Maven`工程中使用
```xml
    <dependencies>
        <dependency>
            <groupId>com.corundumstudio.socketio</groupId>
            <artifactId>netty-socketio</artifactId>
        </dependency>
        <dependency>
            <groupId>org.redisson</groupId>
            <artifactId>redisson</artifactId>
        </dependency>
    </dependencies>
```

## 代码配置

- NettySocketProperties
````java
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.cloud.context.config.annotation.RefreshScope;

/**
 * NettySocketProperties
 *
 * @author :    quansheng.zhang
 * @date :    2019/8/13 0:17
 */
@Data
@RefreshScope
@ConfigurationProperties(prefix = "rt-server")
public class NettySocketProperties {
    /**
     * 跨域设置，null表示不允许，*表示允许所有，建议不允许
     */
    private String origin;
    private String host = "localhost";
    private Integer port = 9092;
    private Integer pingInterval = 300000;
    private Integer upgradeTimeout = 25000;
    private Integer pingTimeout = 60000;
    private String token;
    private boolean randomSession = true;
    private RedissonProperties redisson;
}
````

- RedissonProperties
```java
import lombok.Data;

/**
 * RedissonProperties
 *
 * @author :    zhangquansheng
 * @date :    2019/12/27 16:04
 */
@Data
public class RedissonProperties {
    private boolean enable;
    private String host;
    private String port;
    private String password;
}
```

- SocketIOServer 启动
```java
import com.corundumstudio.socketio.SocketIOServer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;

import javax.annotation.PreDestroy;

/**
 * SocketIOServer 启动
 *
 * @author :    quansheng.zhang
 * @date :    2019/12/19 14:21
 */
@Slf4j
public class SocketIOServerCommandLineRunner implements CommandLineRunner {

    private final SocketIOServer server;

    @Autowired
    public SocketIOServerCommandLineRunner(SocketIOServer server) {
        this.server = server;
    }

    @Override
    public void run(String... args) throws Exception {
        log.info("SocketIO server starting");
        server.start();
    }

    @PreDestroy
    public void stop() {
        log.info("SocketIO server stopping");
        server.stop();
    }
}
```

- NettySocket自动配置
```java
import com.corundumstudio.socketio.AuthorizationListener;
import com.corundumstudio.socketio.HandshakeData;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.SpringAnnotationScanner;
import com.corundumstudio.socketio.store.RedissonStoreFactory;
import com.zhengcheng.core.socketio.properties.NettySocketProperties;
import com.zhengcheng.core.socketio.runner.SocketIOServerCommandLineRunner;
import org.redisson.Redisson;
import org.redisson.api.RedissonClient;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

/**
 * NettySocket自动配置
 *
 * @author :    quansheng.zhang
 * @date :    2019/12/18 21:31
 */
@Configuration
@Import({SocketIOServerCommandLineRunner.class})
@EnableConfigurationProperties({NettySocketProperties.class})
public class NettySocketAutoConfiguration {

    /**
     * token参数
     */
    public static final String URL_PARAM_TOKEN = "token";

    @Bean
    public SocketIOServer socketIOServer(NettySocketProperties nettySocketProperties) {
        com.corundumstudio.socketio.Configuration config = new com.corundumstudio.socketio.Configuration();
        config.setOrigin(nettySocketProperties.getOrigin());
        config.setHostname(nettySocketProperties.getHost());
        config.setPort(nettySocketProperties.getPort());
        if (nettySocketProperties.getRedisson().isEnable()) {
            org.redisson.config.Config redissonConfig = new org.redisson.config.Config();
            // 去官网看集群版 https://github.com/redisson/redisson#quick-start
            String address = "redis://".concat(nettySocketProperties.getRedisson().getHost()).concat(":").concat(nettySocketProperties.getRedisson().getPort());
            redissonConfig.useSingleServer().setPassword(nettySocketProperties.getRedisson().getPassword()).setAddress(address);
            RedissonClient redisson = Redisson.create(redissonConfig);
            RedissonStoreFactory redisStoreFactory = new RedissonStoreFactory(redisson);
            config.setStoreFactory(redisStoreFactory);
        }
        config.setRandomSession(nettySocketProperties.isRandomSession());
        config.setPingInterval(nettySocketProperties.getPingInterval());
        config.setUpgradeTimeout(nettySocketProperties.getUpgradeTimeout());
        config.setPingTimeout(nettySocketProperties.getPingTimeout());
        config.setAuthorizationListener(new AuthorizationListener() {
            @Override
            public boolean isAuthorized(HandshakeData data) {
                String token = data.getSingleUrlParam(URL_PARAM_TOKEN);
                if (nettySocketProperties.getToken().equals(token)) {
                    return true;
                }
                return false;
            }
        });
        return new SocketIOServer(config);
    }

    /**
     * 用于扫描netty-socketio的注解，比如 @OnConnect、@OnEvent
     */
    @Bean
    public SpringAnnotationScanner springAnnotationScanner(SocketIOServer socketServer) {
        return new SpringAnnotationScanner(socketServer);
    }

}
```

## 属性配置

```properties
rt-server.host=localhost
rt-server.port=9092
rt-server.ping-interval=300000
rt-server.upgrade-timeout=25000
rt-server.ping-timeout=60000
rt-server.token=123456
rt-server.redisson.enable=true 
rt-server.redisson.host=127.0.0.1
rt-server.redisson.port=6379
rt-server.redisson.password=123456
```

