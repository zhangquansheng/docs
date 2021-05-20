# Aggregations

[Aggregations](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations.html#search-aggregations)

```curl
GET /my-index-000001/_search
{
  "aggs": {
    "my-agg-name": {
      "terms": {
        "field": "my-field"
      }
    }
  }
}
```

## 分桶聚合

## 指标聚合

## 管道聚合

