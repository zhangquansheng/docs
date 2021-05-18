# DSL(Domain Specified Language)领域专用语言

`_`代表使用`ES`的`API`，例如`_mapping` 、`_search`

## mapping

[Mapping 官方文档](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html?baymax=rec&rogue=pop-1&elektra=docs)

## 全文检索

## 精准检索

### term 词语

::: tip match_phrase 和 term 的区别？
    短语、精准检索
:::

::: tip term 和 keyword 的区别？
keyword 256 截断
:::

## filter

filter 不计算相关度评分， query 按照评分排序，filter 还有缓存， 所以基本上 filter 性能高

## bool 每个版本的语义是不一样的

filter should minimun_should_match 的结合使用