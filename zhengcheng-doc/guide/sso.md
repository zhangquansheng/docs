# Spring Security OAuth2

## 简介

基于SpringCloud做微服务架构分布式系统时，OAuth2.0作为认证的业内标准，Spring Security OAuth2也提供了全套的解决方案来支持在Spring Cloud/Spring Boot环境下使用OAuth2.0，提供了开箱即用的组件。

::: warning 注意
The Spring Security OAuth project is deprecated. The latest OAuth 2.0 support is provided by Spring Security. See the OAuth 2.0 Migration Guide for further details.

[官方文档](https://projects.spring.io/spring-security-oauth/docs/oauth2.html)
:::

## **安装**

在 Maven 工程中使用

```xml
    <!-- 授权服务中接口的实现依赖，详细请见AuthorizationServerConfig配置 -->
    <dependency>
        <groupId>org.springframework.security.oauth</groupId>
        <artifactId>spring-security-oauth2</artifactId>
    </dependency>
```

## 用户授权服务

- AuthorizationServerConfig  授权服务配置

```java
/**
 * AuthorizationServerConfig
 *
 * @author :    zqs
 * @date :    2019/1/16 21:46
 */
@Configuration
@EnableOAuth2Client
@EnableAuthorizationServer
public class AuthorizationServerConfig extends AuthorizationServerConfigurerAdapter {

    @Autowired
    AuthenticationManager authenticationManager;
    @Autowired
    private RedisConnectionFactory redisConnectionFactory;
    @Autowired
    private DataSource dataSource;
    @Autowired
    private WebResponseExceptionTranslator webResponseExceptionTranslator;
    @Autowired
    private UserDetailsService userDetailsService;

    @Bean
    RedisTokenStore redisTokenStore() {
        return new RedisTokenStore(redisConnectionFactory);
    }

    @Override
    public void configure(ClientDetailsServiceConfigurer clients) throws Exception {
        clients.withClientDetails(clientDetails());
    }

    @Bean
    public ClientDetailsService clientDetails() {
        return new JdbcClientDetailsService(dataSource);
    }

    @Bean
    public WebResponseExceptionTranslator webResponseExceptionTranslator() {
        return new DefaultWebResponseExceptionTranslator() {
            @Override
            public ResponseEntity translate(Exception e) throws Exception {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON_UTF8);
                return new ResponseEntity<>(
                        Result.create(HttpStatus.BAD_REQUEST.value(), e.getMessage()),
                        headers,
                        HttpStatus.BAD_REQUEST
                );
            }
        };
    }

    @Override
    public void configure(AuthorizationServerEndpointsConfigurer endpoints) {
        endpoints.tokenStore(redisTokenStore())
                .authenticationManager(authenticationManager)
                .allowedTokenEndpointRequestMethods(HttpMethod.GET, HttpMethod.POST)
                .exceptionTranslator(webResponseExceptionTranslator);
        // 使用refresh_token的话，需要额外配置userDetailsService
        endpoints.userDetailsService(userDetailsService);
    }

    @Override
    public void configure(AuthorizationServerSecurityConfigurer security) {
        //允许表单认证 (很重要，这里的配置，不然内置的接口401)
        security.tokenKeyAccess("permitAll()")
                .checkTokenAccess("isAuthenticated()")
                .allowFormAuthenticationForClients();
    }

}
```

- ResourceServerConfig  资源服务配置，授权服务也是一个资源服务

```java
/**
 * 资源服务配置
 *
 * @author :    quansheng.zhang
 * @date :    2019/9/24 14:12
 */
@Slf4j
@EnableGlobalMethodSecurity(prePostEnabled = true)
@EnableResourceServer
@Configuration
public class ResourceServerConfig extends ResourceServerConfigurerAdapter {

    @Value("${security.oauth2.resource-id}")
    private String resourceId;
    @Value("${env}")
    private String env;

    @Bean
    public AuthExceptionEntryPoint authExceptionEntryPoint() {
        return new AuthExceptionEntryPoint();
    }


    @Override
    public void configure(ResourceServerSecurityConfigurer resources) {
        resources.resourceId(resourceId)
                .stateless(true)
                .authenticationEntryPoint(authExceptionEntryPoint())
                .accessDeniedHandler(new CustomOauth2AccessDeniedHandler());
    }

    @Override
    public void configure(HttpSecurity http) throws Exception {
        http
                .csrf().disable()
                .exceptionHandling()
                .authenticationEntryPoint(authExceptionEntryPoint())
                .and()
                .httpBasic();
        if (Objects.equals(CommonConstants.EnvEnum.DEV.getValue(), env.toUpperCase())
                || Objects.equals(CommonConstants.EnvEnum.DEFAULT.getValue(), env.toUpperCase())) {
            log.info("**本地开发环境直接传入currentUserId表示当前当前登录用户ID**");
            http.authorizeRequests().antMatchers("/**")
                    .permitAll();
        } else {
            http.authorizeRequests().antMatchers("/green/**", "/wx/user/**", "/wx/portal/**", "/wx/media/",
                    "/oauth/**", "/clients/**", "/common/**",
                    "/favicon.ico", "/actuator/**", "/webjars/**",
                    "/resources/**", "/swagger-ui.html", "/swagger-resources/**", "/v2/api-docs").permitAll()
                    .anyRequest().authenticated();
        }
    }
}
```

- Security配置

```java
/**
 * SecurityConfig
 *
 * @author :    zqs
 * @date :    2019/1/16 22:23
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    @Autowired
    private UserDetailsService userDetailsService;
    @Autowired
    private OpenIdAuthenticationSecurityConfig openIdAuthenticationSecurityConfig;

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.authorizeRequests()
                .anyRequest().authenticated()
                .and().apply(openIdAuthenticationSecurityConfig)
                .and().csrf().disable();
    }

    @Override
    protected void configure(AuthenticationManagerBuilder authenticationManagerBuilder) throws Exception {
        authenticationManagerBuilder.userDetailsService(userDetailsService);
    }

    /**
     * password 方案三：支持多种编码，通过密码的前缀区分编码方式,推荐
     *
     * @return
     */
    @Bean
    PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    /**
     * 这一步的配置是必不可少的，否则SpringBoot会自动配置一个AuthenticationManager,覆盖掉内存中的用户
     *
     * @return
     * @throws Exception
     */
    @Bean
    @Override
    public AuthenticationManager authenticationManagerBean() throws Exception {
        AuthenticationManager manager = super.authenticationManagerBean();
        return manager;
    }

    @Override
    public void configure(WebSecurity web) throws Exception {
        //解决静态资源被拦截的问题
        web.ignoring().antMatchers("/resources/**");
    }

}
```

- 属性配置

```properties
security.oauth2.resource-id = zc-user
security.oauth2.resource.user-info-uri = http://127.0.0.1:8770/user
security.oauth2.resource.prefer-token-info = false
security.basic.enabled = false
```

## 用户端

### 授权登录，获取accessToken
```http request
http://127.0.0.1:8770/oauth/token?username=admin&password=admin&grant_type=password
```

- 登录成功
```json
{
	"code": 200,
	"data": {
		"accessToken": "1fe0557c-eadf-480f-8181-73bc52c1c9ba",
		"expiresIn": 3882,
		"expiration": 1569320348495,
		"refreshToken": "2c2160e9-21f4-47f3-8c93-5949a56dbfbf"
	},
	"message": "登录成功"
}
```

- 登录失败
```json
{
	"code": 400,
	"data": null,
	"message": "用户名不存在或者密码错误"
}
```

- token过期
```json
{
    "code": 401,
    "data": "Invalid access token: 4cb1ffab-5f4e-4b35-a059-28cd859ad4521",
    "message": "登录信息已过期"
}
```

### 获取当前用户信息
```http request
http://127.0.0.1:8770/currentUser?access_token=d1d88d80-329e-4db0-8133-00799ec883c7
```

```json
{
	"code": 200,
	"data": {
		"id": 1,
		"mobile": null,
		"nickname": null,
		"username": "admin"
	},
	"message": null
}
```