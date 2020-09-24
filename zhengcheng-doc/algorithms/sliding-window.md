# 滑动窗口

## 无重复字符的最长子串

给定一个字符串，请你找出其中不含有重复字符的**最长子串**的长度。

这道题主要用到思路是：**滑动窗口**

时间复杂度：O(n)

```java
public Result<Integer> lengthOfLongestSubstring(@RequestParam String s) {
        // 哈希集合，记录每个字符是否出现过
        Set<Character> occ = new HashSet<>();
        int n = s.length();
        // 右指针，初始值为 -1，相当于我们在字符串的左边界的左侧，还没有开始移动
        int rk = 0, ans = 0;
        for (int i = 0; i < n; i++) {
            if (i != 0) {
                // 左指针向右移动一格，移除一个字符
                occ.remove(s.charAt(i - 1));
            }
            while (rk < n && !occ.contains(s.charAt(rk))) {
                occ.add(s.charAt(rk));
                rk++;
            }
            ans = Math.max(ans, occ.size());
        }
        return Result.successData(ans);
    }
```

参考[leetcode](https://leetcode-cn.com/problems/longest-substring-without-repeating-characters/solution/wu-zhong-fu-zi-fu-de-zui-chang-zi-chuan-by-leetc-2/)
