# B树

## B-树

[动态演示](https://www.cs.usfca.edu/~galles/visualization/BTree.html)

B树（或B-树、B_树），它是一种**平衡的多叉树**。



## B+树

[动态演示](https://www.cs.usfca.edu/~galles/visualization/BPlusTree.html)

B+树是B树的一种变形形式，**B+树上的叶子结点存储关键字以及相应记录的地址**，叶子结点以上各层作为索引（此索引非`MySQL`索引）使用。

一棵m阶的B+树定义如下:
1. 每个结点至多有m个子女；
2. 除根结点外，每个结点至少有[m/2]个子女，根结点至少有两个子女；
3. 有k个子女的结点必有k个关键字。

B+树的查找与B树不同，当索引部分某个结点的关键字与所查的关键字相等时，并不停止查找，应继续沿着这个关键字左边的指针向下，一直查到该关键字所在的叶子结点为止。