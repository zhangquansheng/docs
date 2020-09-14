# jackson json序列化 首字母大写 第二个字母需小写

jackson在序列化时把第二个大写字母n转成了小写，这是为什么呢？ 直接看源码（规范输出）：

```java
// com.fasterxml.jackson.databind.util.BeanUtil
    /**
     * Method called to figure out name of the property, given 
     * corresponding suggested name based on a method or field name.
     *
     * @param basename Name of accessor/mutator method, not including prefix
     *  ("get"/"is"/"set")
     */
    protected static String legacyManglePropertyName(final String basename, final int offset)
    {
        final int end = basename.length();
        if (end == offset) { // empty name, nope
            return null;
        }
        // next check: is the first character upper case? If not, return as is
        char c = basename.charAt(offset);
        char d = Character.toLowerCase(c);
        
        if (c == d) {
            return basename.substring(offset);
        }
        // otherwise, lower case initial chars. Common case first, just one char
        StringBuilder sb = new StringBuilder(end - offset);
        sb.append(d);
        int i = offset+1;
        for (; i < end; ++i) {
            c = basename.charAt(i);
            d = Character.toLowerCase(c);
            if (c == d) {
                sb.append(basename, i, end);
                break;
            }
            sb.append(d);
        }
        return sb.toString();
    }
```

主要逻辑在for循环中，去除set后，第一个字母小写，

第二字母小写后，与第二个字母比较，如果都是小写，则直接接上，返回，

如果第二字母大写，就如我们的这种情况，就以小写的情况，接上，再去找下一个字母，**直到找到小写字母为止**。

意思就是为了满足驼峰命名规则，要规范输出。