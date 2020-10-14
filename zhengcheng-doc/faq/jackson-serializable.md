# jackson json 在序列化时把第二个大写字母转成了小写，这是为什么呢？ 

直接看源码（规范输出）：
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
        // 在去除前缀`("get"/"is"/"set")`后，顺序遍历字符串，如果当前字母是小写，则把剩下的字符串拼接并返回，否则把转换后的小写字母拼接到字符串并继续遍历
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
