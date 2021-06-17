# RestHighLevelClient

> - 目前`spring-data-elasticsearch`底层采用`es`官方`TransportClient`，而`es`官方计划放弃`TransportClient`，工具以`es`官方推荐的`RestHighLevelClient`进行封装
> - 类似于`Mybatis-Plus`一样，能够极大简化`java client API`，并不断更新，让`es`更高级的功能更轻松的使用
> - 基于`elasticsearch6.4.3`版本进行开发