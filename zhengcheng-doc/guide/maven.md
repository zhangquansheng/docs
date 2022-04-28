# Maven 

- [Maven 官方文档](https://maven.apache.org/guides/getting-started/index.html)
- [liaoxuefeng Maven基础](https://www.liaoxuefeng.com/wiki/1252599548343744/1255945359327200)

## SNAPSHOT

- 具有后缀：`-SNAPSHOT`。
- `SNAPSHOT`版本代表不稳定、尚处于开发中的版本。
- 在发布过程中， `xy-SNAPSHOT`的一个版本更改为`xy`。发布过程还将开发版本增加到`x.(y+1)-SNAPSHOT`。例如，版本`1.0-SNAPSHOT`发布为`1.0`版本，新的开发版本为`1.1-SNAPSHOT`版本。
- 不用`Release`版本，在所有地方都用`SNAPSHOT`版本行不行？
    - 不行。正式环境中不得使用`snapshot`版本的库。 比如说，今天你依赖某个`snapshot`版本的第三方库成功构建了自己的应用， 
      明天再构建时可能就会失败，因为今晚第三方可能已经更新了它的`snapshot`库。
      你再次构建时，`Maven`会去远程`repository`下载`snapshot`的最新版本，你构建时用的库就是新的`jar`文件了，这时正确性就很难保证了。