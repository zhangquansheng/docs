# MySQL 表死锁解决方案

1. 查询`information_schema.innodb_trx`
```sql
select * from information_schema.innodb_trx;
```

2. 然后执行`kill` `trx_mysql_thread_id`
```sql
kill 线程ID
```
