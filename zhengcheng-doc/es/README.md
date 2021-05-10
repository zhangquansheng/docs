# 概述

`PB级海量数据` `准实时（near real-time）查询` `秒级`

[搜索引擎实时排名](https://db-engines.com/en/ranking/search+engine)

## 环境准备

- `JDK 1.8 or later`
- `spring-boot-starter-data-elasticsearch` `2.1.17.RELEASE`
- `elasticsearch-6.4.3` 
- `kibana-6.4.3`

## 核心概览

什么是搜索引擎？

- 全文搜索引擎: 自然语言处理（NLP）、爬虫、网页处理、大数据处理，如谷歌、百度等等。

- 垂直搜索引擎：有明确搜索目的的搜索行为，如各大电商网站、OA、站内搜索、视频网站等。

### 准实时（near real-time）查询

`Elasticsearch` 被称为准实时搜索，原因是对 `Elasticsearch` 的写入操作成功后，写入的数据需要1秒钟后才能被搜索到，因此 `Elasticsearch` 搜索是准实时或者又称为近实时（`near real time`）。

`Elasticsearch` 底层使用的 `Lucene`，而 `Lucene` 的写入是实时的。但 `Lucene` 的实时写入意味着每一次写入请求都直接将数据写入硬盘，因此频繁的`I/O`操作会导致很大的性能问题。

### 倒排索引

### Lucene 

### 全文检索

## 参考文档

- [Support Matrix](https://www.elastic.co/cn/support/matrix)
- [官方中文教程](https://www.elastic.co/guide/cn/elasticsearch/guide/current/index.html)
- [Elastic Past Releases](https://www.elastic.co/cn/downloads/past-releases)
- [Github spring-data-elasticsearch wiki](https://github.com/spring-projects/spring-data-elasticsearch/wiki)
- [Spring Data Elasticsearch - Reference Documentation](https://docs.spring.io/spring-data/elasticsearch/docs/current/reference/html)