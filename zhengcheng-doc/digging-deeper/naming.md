---
sidebarDepth: 3
---

# Java 命名规范参考

## 为什么需要重视命名？

**好的命名即是注释，别人一看到你的命名就知道你的变量、方法或者类是做什么的！ 好的命名对于其他人（包括你自己）理解你的代码有着很大的帮助！**

《Clean Code》这本书明确指出：

好的代码本身就是注释，我们要尽量规范和美化自己的代码来减少不必要的注释。
若编程语言足够有表达力，就不需要注释，尽量通过代码来阐述。

举个例子：去掉下面复杂的注释，只需要创建一个与注释所言同一事物的函数即可

```java
 // check to see if the employee is eligible for full benefits
 if ((employee.flags & HOURLY_FLAG) && (employee.age > 65))
```
应替换为
```java
 if (employee.isEligibleForFullBenefits())
```

## 常见的命名法

1. 大驼峰命名法（`UpperCamelCase`）: 类名需要使用大驼峰命名法
2. 小驼峰命名法（`lowerCamelCase`）: 方法名、参数名、成员变量、局部变量需要使用小驼峰命名法
3. 蛇形命名法（`snake_case`）: 测试方法名、常量、枚举名称需要使用蛇形命名法
4. 串式命名法（`kebab-case`）: 建议项目文件夹名称使用串式命名法

类型 |	约束 |	例 
---|---|---
项目名 |	串式命名法（`kebab-case`）：全部小写，多个单词用中划线分隔‘-’ |	spring-cloud
包名 |	全部小写 |	com.alibaba.fastjson
类名 |	大驼峰命名法（`UpperCamelCase`）：单词首字母大写 |	Feature, ParserConfig,DefaultFieldDeserializer
变量名 |	小驼峰命名法（`lowerCamelCase`）：首字母小写，多个单词组成时，除首个单词，其他单词首字母都要大写 |	password, userName
常量名 |	全部大写，多个单词，用'_'分隔 |	CACHE_EXPIRED_TIME
方法 |	小驼峰命名法（`lowerCamelCase`） |	read(), readObject(), getById()


## 类命名

类名使用**大驼峰命名**形式，类命通常时名词或名词短语，接口名除了用名词和名词短语以外，还可以使用形容词或形容词短语，如 `Cloneable`，`Callable` 等，
表示实现该接口的类有某种功能或能力。对于测试类则以它要测试的类开头，以`Test`结尾，如`HashMapTest`。

属性 |	约束 |	例
---|---|---
抽象类 |	Abstract 或者 Base 开头 |	BaseUserService
枚举类 |	Enum 作为后缀 |	GenderEnum
工具类 |	Utils 作为后缀 |	StringUtils
异常类 |	Exception 结尾 |	RuntimeException
接口实现 |	I+ 接口名 |	IUserService :x: 《Clean Code》这本书明确指出： I 是废话。
接口实现类 |	接口名+ Impl |	UserServiceImpl
领域模型相关 |	/DO/DTO/VO/DAO |	正例：UserDTO 反例： UserDto
设计模式相关类 |	Builder，Factory 等 |	当使用到设计模式时，需要使用对应的设计模式作为后缀，如 ThreadFactory
处理特定功能的 |	Handler，Predicate, Validator |	表示处理器，校验器，断言，这些类工厂还有配套的方法名如 handle，predicate，validate
测试类 |	Test 结尾	| UserServiceTest，表示用来测试 UserService 类的
MVC 分层 |	Controller，Service，ServiceImpl，DAO 后缀 |	UserManageController，UserManageDAO

## 方法命名

方法命名采用**小驼峰**的形式，首字小写，往后的每个单词首字母都要大写。和类名不同的是，方法命名一般为动词或动词短语，与参数或参数名共同组成动宾短语，即动词 + 名词。
一个好的函数名一般能通过名字直接获知该函数实现什么样的功能。

### 1. 返回真伪值的方法

> 注：Prefix-前缀，Suffix-后缀，Alone-单独使用

位置 |	单词 |	意义 |	例
--- | ---- |  --- | ---
Prefix | 	is |	对象是否符合期待的状态 |	isValid
Prefix |	can |	对象能否执行所期待的动作 | 	canRemove
Prefix |	should |	调用方执行某个命令或方法是好还是不好,应不应该，或者说推荐还是不推荐 |	shouldMigrate
Prefix |	has |	对象是否持有所期待的数据和属性 |	hasObservers
Prefix |	needs |	调用方是否需要执行某个命令或方法 |	needsMigrate

### 2. 用来检查的方法

单词 |	意义 |	例
--- | ---- |  ----
ensure |	检查是否为期待的状态，不是则抛出异常或返回 error code |	ensureCapacity
validate |	检查是否为正确的状态，不是则抛出异常或返回 error code |	validateInputs

### 3. 按需求才执行的方法

位置 |	单词 |	意义 |	例
--- | ---- |  --- | ---
Suffix |	IfNeeded |	需要的时候执行，不需要的时候什么都不做 |	drawIfNeeded
Prefix |	might  |	需要的时候执行，不需要的时候什么都不做 |	mightCreate
Prefix |	try |	尝试执行，失败时抛出异常或是返回 error code |	tryCreate
Suffix |	OrDefault |	尝试执行，失败时返回默认值 |	getOrDefault
Suffix |	OrElse |	尝试执行、失败时返回实际参数中指定的值 |	getOrElse
Prefix |	force |	强制尝试执行。error 抛出异常或是返回值 |	forceCreate, forceStop

### 4. 异步相关方法

位置 | 	单词 |	意义 |	例
--- | ---- |  --- | ---
Prefix |	blocking |	线程阻塞方法 |	blockingGetUser
Suffix |	InBackground |	执行在后台的线程 |	doInBackground
Suffix |	Async |	异步方法 |	sendAsync
Suffix |	Sync |	对应已有异步方法的同步方法 |	sendSync
Prefix or Alone |	schedule |	Job 和 Task 放入队列	| schedule, scheduleJob
Prefix or Alone |	post |	放入 |	postJob
Prefix or Alone |	execute |	执行异步方法（注：我一般拿这个做同步方法名） |	execute, executeTask
Prefix or Alone |	start |	开始 |	start, startJob
Prefix or Alone |	cancel |	取消异步方法 |	cancel, cancelJob
Prefix or Alone |	stop |	停止	| stop, stopJob

### 5. 回调方法

位置 | 	单词 |	意义 |	例
--- | ---- |  --- | ---
Prefix |	on |	事件发生时执行 |	onCompleted
Prefix |	before |	事件发生前执行 |	beforeUpdate
Prefix |	pre |	事件发生前执行 |	preUpdate
Prefix |	will |	事件发生前执行 |	willUpdate
Prefix |	after |	事件发生后执行 |	afterUpdate
Prefix |	post |	事件发生后执行 |	postUpdate
Prefix |	did |	事件发生后执行 |	didUpdate
Prefix |	should |	确认事件是否可以发生时执行 |	shouldUpdate

### 6. 与集合操作相关的方法

单词 |	意义 |	例
--- | ---- |  ----
contains |	是否持有与指定对象相同的对象 |	contains
add |	添加 |	addJob
append |	添加 |	appendJob
insert |	插入到下标 n |	insertJob
put	 | 添加与 key 对应的元素 |	putJob
remove |	移除元素 |	removeJob
enqueue	| 添加到队列的最末位 |	enqueueJob
dequeue |	从队列中头部取出并移除 |	dequeueJob
push	| 添加到栈头 |	pushJob
pop	| 从栈头取出并移除 |	popJob
peek |	从栈头取出但不移除 |	peekJob
find |	寻找符合条件的某物 |	findById

### 7. 与数据相关的方法 :100:

单词 |	意义 |	例
--- | ---- |  ----
create |	新创建 |	createAccount
new	 | 新创建 |	newAccount
from |	从既有的某物新建，或是从其他的数据新建	| fromConfig
to |	转换 |	toString
update |	更新既有某物 |	updateAccount
load |	读取 |	loadAccount
fetch |	远程读取 |	fetchAccount
delete |	删除 |	deleteAccount
remove |	删除 |	removeAccount
save |	保存 |	saveAccount
store |	保存 |	storeAccount
commit |	保存 |	commitChange
apply |	保存或应用 |	applyChange
clear |	清除数据或是恢复到初始状态 |	clearAll
reset |	清除数据或是恢复到初始状态 |	resetAll

### 8. 成对出现的动词

单词 |	意义
--- | ---
get 获取 |	set 设置
add 增加 | 	remove 删除
create 创建 |	destory 移除
start 启动 |	stop 停止
open 打开 |	close 关闭
read 读取 |	write 写入
load 载入 |	save 保存
create 创建 |	destroy 销毁
begin 开始 |	end 结束
backup 备份 |	restore 恢复
import 导入 |	export 导出
split 分割 |	merge 合并
inject 注入 |	extract 提取
attach 附着 |	detach 脱离
bind 绑定 |	separate 分离
view 查看 |	browse 浏览
edit 编辑 |	modify 修改
select 选取 |	mark 标记
copy 复制 |	paste 粘贴
undo 撤销 |	redo 重做
insert 插入 |	delete 移除
add 加入 | append 添加
clean 清理 |	clear 清除
index 索引 |	sort 排序
find 查找 |	search 搜索
increase 增加 |	decrease 减少
play 播放 |	pause 暂停
launch 启动 |	run 运行
compile 编译 |	execute 执行
debug 调试 |	trace 跟踪
observe 观察 |	listen 监听
build 构建 |	publish 发布
input 输入 |	output 输出
encode 编码 |	decode 解码
encrypt 加密 |	decrypt 解密
compress 压缩 |	decompress 解压缩
pack 打包 |	unpack 解包
parse 解析 |	emit 生成
connect 连接 |	disconnect 断开
send 发送 |	receive 接收
download 下载 |	upload 上传
refresh 刷新 |	synchronize 同步
update 更新 |	revert 复原
lock 锁定 |	unlock 解锁
check out 签出 |	check in 签入
submit 提交 |	commit 交付
push 推 |	pull 拉
expand 展开 |	collapse 折叠
begin 起始 |	end 结束
start 开始 |	finish 完成
enter 进入 |	exit 退出
abort 放弃 |	quit 离开
obsolete 废弃 |	depreciate 废旧
collect 收集 |	aggregate 聚集


## 总结通用命名规则

1. 尽量不要使用拼音；杜绝拼音和英文混用。对于一些通用的表示或者难以用英文描述的可以采用拼音，一旦采用拼音就坚决不能和英文混用。正例：`BeiJing`， `HangZhou` 反例：`validateCanShu`
2. 命名过程中尽量不要出现特殊的字符，常量除外。
3. 尽量不要和 `jdk` 或者框架中已存在的类重名，也不能使用 `java` 中的关键字命名。
4. 妙用介词，如 `for`(可以用同音的`4`代替), `to`(可用同音的`2`代替), `from`, `with`，`of` 等。如类名采用 `User4RedisDO`，方法名 `getUserInfoFromRedis`，`convertJson2Map` 等。

---

**参考文档**
- [Google Java 代码指南](https://google.github.io/styleguide/javaguide.htm)
- 《Clean Code》
- 《阿里巴巴 Java 开发手册》