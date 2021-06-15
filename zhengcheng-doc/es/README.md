# 概述

`PB级海量数据` `准实时（near real-time）查询` `秒级`

[搜索引擎实时排名](https://db-engines.com/en/ranking/search+engine)

## 环境准备

`elasticsearch 6.4.3` 版本

- `JDK 1.8 or later`
- `spring-boot-starter-data-elasticsearch` `2.1.18.RELEASE`
- `elasticsearch-6.4.3` 
- `kibana-6.4.3`

## 核心概览

什么是搜索引擎？

- 全文搜索引擎: 自然语言处理（NLP）、爬虫、网页处理、大数据处理，如谷歌、百度等等。

- 垂直搜索引擎：有明确搜索目的的搜索行为，如各大电商网站、OA、站内搜索、视频网站等。

### 准实时（near real-time）查询

`Elasticsearch` 被称为准实时搜索，原因是对 `Elasticsearch` 的写入操作成功后，写入的数据需要**1秒钟**后才能被搜索到，因此 `Elasticsearch` 搜索是准实时或者又称为近实时（`near real time`）。

`Elasticsearch` 底层使用的 `Lucene`，而 `Lucene` 的写入是实时的。但 `Lucene` 的实时写入意味着每一次写入请求都直接将数据写入硬盘，因此频繁的`I/O`操作会导致很大的性能问题。

## Elasticsearch 客户端TransportClient vs RestClient

Elasticsearch(ES)有两种连接方式：TransportClient、RestClient。TransportClient通过TCP方式访问ES(只支持java),RestClient方式通过http API 访问ES(没有语言限制)。

Elasticsearch计划在Elasticsearch 7.0中弃用TransportClient，在8.0中完全删除它。故在实际使用过程中**建议您使用Java高级`REST client`**。不管是transport client还是rest client都是线程安全的，都应该使用单例。

- TransportClient:
      TransportClient 是ElasticSearch（java）客户端封装对象，使用transport远程连接到Elasticsearch集群，默认用的TCP端口是9300，该transport node并不会加入集群，而是简单的向ElasticSearch集群上的节点发送请求。
- **Rest Client（推荐）**:
    - Java Low Level REST Client：elasticsearch client 低级别客户端。它允许通过http请求与`Elasticsearch`集群进行通信。API本身不负责数据的编码解码，由用户去编码解码。它与所有的ElasticSearch版本兼容。
    - Java High Level REST Client：Elasticsearch client官方高级客户端。基于低级客户端，它定义的API,已经对请求与响应数据包进行编码解码。

## 参考文档

- [Support Matrix](https://www.elastic.co/cn/support/matrix)
- [官方文档](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [官方中文教程](https://www.elastic.co/guide/cn/elasticsearch/guide/current/index.html)
- [Elastic Past Releases](https://www.elastic.co/cn/downloads/past-releases)
- [Github spring-data-elasticsearch wiki](https://github.com/spring-projects/spring-data-elasticsearch/wiki)
- [Spring Data Elasticsearch - Reference Documentation](https://docs.spring.io/spring-data/elasticsearch/docs/current/reference/html)
- [Spring Data Elasticsearch](https://github.com/spring-projects/spring-data-elasticsearch)