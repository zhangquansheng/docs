# 动态规划（DP）

关键词: `状态转移方程` `最优子结构` `边界`

下面是「动态规划』问题的思考路径:

![「动态规划」问题思考方向](/img/algorithms/dynamic-programming.png)

::: tip 提示
右键「在新便签页打开图片」可查看大图。
:::

## 最长回文子串

给定一个字符串`s`，找到`s`中最长的回文子串。你可以假设 s 的最大长度为`1000`。

## 爬楼梯

假设你正在爬楼梯。需要 `n` 阶你才能到达楼顶。

每次你可以爬`1`或 `2`个台阶。你有多少种不同的方法可以爬到楼顶呢？

动态规划的思路和算法：

用 `f(n)` 表示爬到第`n`级台阶的方案数，考虑最后一步可能跨了一级台阶，也可能跨了两级台阶，所以我们可以列出如下式子：
```text
F(n) = F(n - 1) + F(n - 2)，其中 n > 1
```
可知本题是斐波那契数列。

## 斐波那契数列

斐波那契数，通常用`F(n)`表示，形成的序列称为 斐波那契数列（`Fibonacci sequence`）。该数列由`0`和`1`开始，后面的每一项数字都是前面两项数字的和。也就是：
```text
F(0) = 0，F(1) = 1
F(n) = F(n - 1) + F(n - 2)，其中 n > 1
```
给你 `n` ，请计算 `F(n)` 。

动态规划解法如下：
```java
class Solution {
    public int fib(int n) {
        if (n < 2) {
            return n;
        }
        int p = 0, q = 0, r = 1;
        for (int i = 2; i <= n; ++i) {
            p = q; 
            q = r; 
            r = p + q;
        }
        return r;
    }
}
```

复杂度分析
- 时间复杂度：`O(n)`。
- 空间复杂度：`O(1)`。

## 凑零钱问题

- 凑零钱一：给定不同面额的硬币和一个总金额。计算可以凑成总金额的硬币组合数。
- 凑零钱二：给定不同面额的硬币`coins`和一个总金额`amount`。计算可以凑成总金额所需的最少的硬币个数。

## 背包问题



---

**参考文档**
- [漫画：什么是动态规划？](https://juejin.im/post/6844903520039075847)
- [leetcode](https://leetcode-cn.com/problems/longest-palindromic-substring/solution/zhong-xin-kuo-san-dong-tai-gui-hua-by-liweiwei1419/)