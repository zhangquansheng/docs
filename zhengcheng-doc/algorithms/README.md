---
sidebarDepth: 3
---

# 概览

推荐阅读：[ labuladong 的算法小抄](https://github.com/lyh200/fucking-algorithm)

## 核心概念

### Big-O 时间复杂度和空间复杂度

`大O`复杂度 图表说明：

![大O复杂度](/img/algorithms/big-o-complexity-chart.png) 

`大O`记法 | 术语
---|---
O(1) | 常数介
O(logn) | 对数介
O(n) | 线性介
O(nlogn) | nlogn介
O(n^2) | 平方介
O(n^3) | 立方介
O(2^n) | 指数介
O(n!) | 阶乘介


### 等差数列求和公式

![等差数列求和公式](/img/algorithms/arithmetic_sequence.jpg) 

### 二分法查找（binarySearch）

二分法查找，也称为**折半法**，是一种在有序数组中查找特定元素的搜索算法。

二分法查找的思路如下：
- （1）首先，从数组的中间元素开始搜索，如果该元素正好是目标元素，则搜索过程结束，否则执行下一步。
- （2）如果目标元素大于/小于中间元素，则在数组大于/小于中间元素的那一半区域查找，然后重复`步骤（1）`的操作。
- （3）如果某一步数组为空，则表示找不到目标元素。

二分法查找的时间复杂度`O(logn)`。
