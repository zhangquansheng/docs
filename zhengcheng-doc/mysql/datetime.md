# MySQL 自动将 23:59:59.999 保存成 00:00:00 的问题记录

> 版本5.7

- 问题: 执行以下更新`SQL`，会在数据库中显示为`2023-03-30 00:00:00`
```sql
UPDATE table_name 
SET 
effective_end_time = '2023-03-29 23:59:59.999'
WHERE
	is_deleted = 'N' and id = 1;
```
- 原因：`MySQL`数据库对于毫秒大于`500`的数据进行进位
- 解决办法: 
```java
 /**
     *解决 mysql自动将23:59:59.999保存成00:00:00的问题记录
     * 原因：MySQL数据库对于毫秒大于500的数据进行进位
     * @param date 日期
     * @return DateTime
     */
private DateTime endOfDay(Date date) {
    // 减去毫秒999
    return DateUtil.endOfDay(date).offset(DateField.MILLISECOND, -999);
}
```
执行`SQL`
```sql
UPDATE table_name 
SET 
effective_end_time = '2023-03-29 23:59:59.0'
WHERE
	is_deleted = 'N' and id = 1;
```
或者
```sql
UPDATE table_name 
SET 
effective_end_time = '2023-03-29 23:59:59'
WHERE
	is_deleted = 'N' and id = 1;
```