# 二叉树 

**先刷二叉树，先刷二叉树，先刷二叉树！**

## 概述

二叉树（`binary tree`）是指树中节点的度不大于`2`的有序树，它是一种最简单且最重要的树。二叉树的递归定义为：
**二叉树是一棵空树，或者是一棵由一个根节点和两棵互不相交的，分别称作根的左子树和右子树组成的非空树；左子树和右子树又同样都是二叉树。**

相关术语:
1. 结点：包含一个数据元素及若干指向子树分支的信息。
2. 结点的度：一个结点拥有子树的数目称为结点的度。
3. 叶子结点：也称为终端结点，没有子树的结点或者度为零的结点。
4. 分支结点：也称为非终端结点，度不为零的结点称为非终端结点。
5. 树的度：树中所有结点的度的最大值。
6. 结点的层次：从根结点开始，假设根结点为第1层，根结点的子节点为第2层，依此类推，如果某一个结点位于第L层，则其子节点位于第L+1层。
7. 树的深度：也称为树的高度，树中所有结点的层次最大值称为树的深度。
8. 有序树：如果树中各棵子树的次序是有先后次序，则称该树为有序树。
9. 无序树：如果树中各棵子树的次序没有先后次序，则称该树为无序树。
10. 森林：由m（m≥0）棵互不相交的树构成一片森林。如果把一棵非空的树的根结点删除，则该树就变成了一片森林，森林中的树由原来根结点的各棵子树构成。

## 特殊类型 :hammer:

1. **满二叉树**：如果一棵二叉树只有度为0的结点和度为2的结点，并且度为0的结点在同一层上，则这棵二叉树为满二叉树。
![binary-tree-1](/img/algorithms/binary-tree-1.webp)

2. **完全二叉树**：深度为k，有n个结点的二叉树当且仅当其每一个结点都与深度为k，有n个结点的满二叉树中编号从1到n的结点一一对应时，称为完全二叉树。
完全二叉树的特点是叶子结点只可能出现在层序最大的两层上，并且某个结点的左分支下子孙的最大层序与右分支下子孙的最大层序相等或大1。
![binary-tree-2](/img/algorithms/binary-tree-2.png)

## 二叉树性质 :hammer:

- **性质1**：二叉树的第i层上至多有2i-1（i≥1）个节点。
- **性质2**：深度为h的二叉树中至多含有2h-1个节点。
- **性质3**：若在任意一棵二叉树中，有n个叶子节点，有n2个度为2的节点，则必有n0=n2+1。
- **性质4**：具有n个节点的完全二叉树深为log2x+1（其中x表示不大于n的最大整数）。
- **性质5**：若对一棵有n个节点的完全二叉树进行顺序编号（1≤i≤n），那么，对于编号为i（i≥1）的节点：
    - 当i=1时，该节点为根，它无双亲节点。
    - 当i>1时，该节点的双亲节点的编号为i/2。
    - 若2i≤n，则有编号为2的左叶子，否则没有左叶子。
    - 若2+1≤n，则有编号为2i+1的右叶子，否则没有右叶子
    
## 二叉树遍历

二叉树的遍历是指从二叉树的根结点出发，按照某种次序依次访问二叉树中的所有结点，使得每个结点被访问一次，且仅被访问一次。

二叉树的访问次序可以分为四种：
- 前序遍历：先访问根结点，然后前序遍历左子树，在遍历右子树（ **根-> 左-> 右**）
- 中序遍历：中序遍历根结点的左子树，然后访问根结点，最后遍历右子树（**左-> 根-> 右**）
- 后序遍历：从左到右先叶子结点的方式遍历访问左右树，最后访问根结点（**左-> 右-> 根**）
- 层序遍历：从根结点从上往下逐层遍历，在同一层，按从左到右的顺序对结点逐个访问

### 深入理解前中后序

**算法的框架思维**中，二叉树遍历框架如下：
```java
void traverse(TreeNode root) {
    if (root == null) {
        return;
    }
    // 前序位置
    traverse(root.left);
    // 中序位置
    traverse(root.right);
    // 后序位置
}
``` 

### 两种解题思路

#### 遍历

- 前序遍历：
```java
class Solution {
    List<Integer> res = new LinkedList<>();
    public List<Integer> preorderTraversal(TreeNode root) {
        traverse(root);
        return res;
    }

    // 二叉树遍历函数
    void traverse(TreeNode root) {
        if (root == null) {
            return;
        }
        // 前序位置
        res.add(root.val);
        traverse(root.left);
        // 中序位置
        traverse(root.right);
        // 后序位置
    }
}
```
- 中序遍历：
```java
class Solution {
    List<Integer> res = new LinkedList<>();
    public List<Integer> preorderTraversal(TreeNode root) {
        traverse(root);
        return res;
    }

    // 二叉树遍历函数
    void traverse(TreeNode root) {
        if (root == null) {
            return;
        }
        // 前序位置
        traverse(root.left);
        // 中序位置
        res.add(root.val);
        traverse(root.right);
        // 后序位置
    }
}
```
- 后序遍历：
```java
class Solution {
    List<Integer> res = new LinkedList<>();
    public List<Integer> preorderTraversal(TreeNode root) {
        traverse(root);
        return res;
    }

    // 二叉树遍历函数
    void traverse(TreeNode root) {
        if (root == null) {
            return;
        }
        // 前序位置
        traverse(root.left);
        // 中序位置
        traverse(root.right);
        // 后序位置
        res.add(root.val);
    }
}
```

#### 分解问题

- 前序遍历：一棵二叉树的前序遍历分解成了根节点和左右子树的前序遍历结果
```java
// 定义：输入一棵二叉树的根节点，返回这棵树的前序遍历结果
List<Integer> preorderTraverse(TreeNode root) {
    List<Integer> res = new LinkedList<>();
    if (root == null) {
        return res;
    }
    // 前序遍历的结果，root.val 在第一个
    res.add(root.val);
    // 利用函数定义，后面接着左子树的前序遍历结果
    res.addAll(preorderTraverse(root.left));
    // 利用函数定义，最后接着右子树的前序遍历结果
    res.addAll(preorderTraverse(root.right));
}
```


## 线索二叉树 :hammer:

按照某种遍历方式对二叉树进行遍历，可以把二叉树中所有结点排列为一个线性序列。在该序列中，除第一个结点外，每个结点有且仅有一个直接前驱结点；除最后一个结点外，每个结点有且仅有一个直接后继结点。

但是，二叉树中每个结点在这个序列中的直接前驱结点和直接后继结点是什么，二叉树的存储结构中并没有反映出来，只能在对二叉树遍历的动态过程中得到这些信息。

为了保留结点在某种遍历序列中直接前驱和直接后继的位置信息，可以利用二叉树的二叉链表存储结构中的那些空指针域来指示。

**这些指向直接前驱结点和指向直接后继结点的指针被称为线索**（thread），加了线索的叉树称为线索二叉树。

## 拓展训练

- [合并二叉树](https://leetcode-cn.com/problems/merge-two-binary-trees/)

## 参考文档

- [手把手带你刷二叉树（纲领篇）](https://labuladong.gitee.io/algo/2/18/21/)