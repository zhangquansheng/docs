# 数据库 SQL 开发规范

## 避免数据类型的隐式转换

隐式转换会导致索引失效，如:
```sql
select name,phone from customer where id = '111';
```

## WHERE 从句中禁止对列进行函数转换和计算

对列进行函数转换或计算时会导致索引失效，如:
```sql
where date(create_time)='20190101'
```
推荐：
```sql
where create_time >= '20190101' and create_time < '20190102'
```

## 禁止使用 SELECT * 查询

原因：
- 消耗更多的 CPU 和 IO 以网络带宽资源
- 无法使用覆盖索引
- 可减少表结构变更带来的影响

