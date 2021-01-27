# 教研-端上重点接口文档

[[toc]]

## 根据contentId和linkId列表批量查询

### 接口功能

> 根据contentId和linkId列表批量查询（目前仅支持单组查询）课程体系及其关联的课程课件

### 接口地址

> [https://brain-tr-office-fat-alhz.inzm.com/zmbiz-brain-record-b/courseCsware/batchQueryByContentIdAndLinkId](https://brain-tr-office-fat-alhz.inzm.com/zmbiz-brain-record-b/courseCsware/batchQueryByContentIdAndLinkId)

### 支持格式

> JSON

### HTTP请求方式

> POST  

### 请求参数
|参数|必选|类型|说明|
|---|---|---|---|
|contentId |true |int| 课程体系ID |
|linkId|true |int|环节ID|

### 返回字段
|返回字段|字段类型|说明|
|---|---|---|
|code|int|返回状态,0 成功|
|message|string|成功/失败提示|
|data|object|响应内容|

### 接口示例

> https://brain-tr-office-fat-alhz.inzm.com/zmbiz-brain-record-b/courseCsware/batchQueryByContentIdAndLinkId


以 `数学`->`小四`->`小四数学` ：1.4指数运算 下的课程课件为例：

#### 模块-课后游戏

``` javascript
{
    "contentIdAndLinkIds": [
        {
            "contentId": 90872,
            "linkId": 82,
            "game": {
                "id": "109",
                "userId": 1
            }
        }
    ]
}
```
`game`参数说明
|参数|必选|类型|说明|
|---|---|---|---|
|id |false |int| 指定课后游戏ID |
|userId|false |int|当前用户ID（客户端学生ID）|

返回参数中应当包含指定的课后游戏，例如这里的 `game` 、 `questions`，其中的取值逻辑如下：
-  如果选择了课后游戏模板，那么是在当前选择的课后游戏随机返回一个。
-  如果没有课后游戏模板，代表全部随机，那么是在当前的`editionId`下所有的课后游戏模板中随机返回一个。
-  如果传入了指定课后游戏模板ID(game.id)，那么在选择的课后游戏模板之内，返回这个课后游戏模板，如果课后游戏模板不存在，则不返回。
-  当前用户ID（客户端学生ID）(game.userId)，传入后，根据教研本地化配置，返回`useResourceLocal`字段。

``` javascript
{
    "code": 0,
    "message": "请求成功",
    "data": [
        {
            "id": 2102,
            "type": 0,
            "name": "1.4指数运算V7",
            "versionNum": 5,
            "subjectCode": "MATH",
            "subject": "数学",
            "gradeCode": "PRIMARY_SCHOOL_4",
            "grade": "小四",
            "editionId": 153,
            "courseSystemFirstId": 84159,
            "courseSystemSecondId": 84160,
            "courseSystemThirdId": 84161,
            "courseSystemFourthId": 92725,
            "linkId": 66,
            "updatedUserName": "测试123",
            "game": {
                "id": 109,
                "name": "游戏13",
                "pictureType": 0,
                "pictureUrl": "https://image.zmlearn.com/PUBLIC_UPLOAD/zm-tk/test-lesson-recommended-content/c0b5a053046713ceb4224cdc51b40f3f16ccbc4b5cb014896b93187570e5db9e.png",
                "url": "http://ai-game-test.zmaxis.com?type=game_one",
                "gameType": "game_one",
                "resourceLocalUrl": null,
                "gameLocalCommonZip": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/857f91a370d75907fe7e65d79abf40a1.zip"
            },
            "questions": [
                {
                    "questionId": 10040,
                    "name": "题目名称123",
                    "category": 1,
                    "content": "",
                    "contentType": 2,
                    "contentAudio": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/11803f7c6fcba9b59049add5ae0c40b7.mp3",
                    "difficulty": 5,
                    "correctRate": "100.00",
                    "doneNum": 0,
                    "questionOptions": [
                        {
                            "questionOptionId": 1486,
                            "pictureUrl": "https://image.zmlearn.com/PUBLIC_UPLOAD/zm-tk/test-lesson-recommended-content/cde6f1cb7e71f6074b58d2493e48998af3942fb2f81406284f99812bd41400e4.jpg",
                            "answer": false,
                            "audioUrl": ""
                        },
                        {
                            "questionOptionId": 1487,
                            "pictureUrl": "https://image.zmlearn.com/PUBLIC_UPLOAD/zm-tk/test-lesson-recommended-content/43afb716e2d483b8ededfd65167fdcf6fe05ff348df019f042ce751cd766d3e5.jpg",
                            "answer": true,
                            "audioUrl": ""
                        },
                        {
                            "questionOptionId": 1488,
                            "pictureUrl": "https://image.zmlearn.com/PUBLIC_UPLOAD/zm-tk/test-lesson-recommended-content/578cf099884d719c6beaa41a64fb11f20b0efde590b009e1bbd0ca4b91525e74.jpg",
                            "answer": false,
                            "audioUrl": ""
                        }
                    ],
                    "questionOptionAudios": [],
                    "commentVideoUrl": "",
                    "commentAudioUrl": "",
                    "playStudentRecording": false,
                    "optionPosition": 0
                },
                {
                    "questionId": 10039,
                    "name": "测试1234",
                    "category": 0,
                    "content": "https://image.zmlearn.com/PUBLIC_UPLOAD/zm-tk/test-lesson-recommended-content/12e36f36c6fdc815ed9b6f5efa3abd69180e63e33dac977dc39918f66e1a07a8.jpg",
                    "contentType": 1,
                    "contentAudio": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/11803f7c6fcba9b59049add5ae0c40b7.mp3",
                    "difficulty": 2,
                    "correctRate": "100.00",
                    "doneNum": 0,
                    "questionOptions": [
                        {
                            "questionOptionId": 1417,
                            "pictureUrl": "https://image.zmlearn.com/PUBLIC_UPLOAD/zm-tk/test-lesson-recommended-content/a3cfb78631102ee59e4acfc461370a09322dc0af63ae7393e5501d0e484da379.jpg",
                            "answer": false,
                            "audioUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/11803f7c6fcba9b59049add5ae0c40b7.mp3"
                        },
                        {
                            "questionOptionId": 1418,
                            "pictureUrl": "https://image.zmlearn.com/PUBLIC_UPLOAD/zm-tk/test-lesson-recommended-content/49ca61fd43c063064a88368969994809b45a0a45921c7fb239b40518e1e1f11d.jpg",
                            "answer": true,
                            "audioUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/11803f7c6fcba9b59049add5ae0c40b7.mp3"
                        },
                        {
                            "questionOptionId": 1419,
                            "pictureUrl": "https://image.zmlearn.com/PUBLIC_UPLOAD/zm-tk/test-lesson-recommended-content/554a2c5db36287ea68039ffc95f59f8fda06abc7a4cfbfc2959712826f6ff0a7.jpg",
                            "answer": false,
                            "audioUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/5705160ce3be709f77546b91c41a47b8.mp3"
                        }
                    ],
                    "questionOptionAudios": [],
                    "commentVideoUrl": "",
                    "commentAudioUrl": "",
                    "playStudentRecording": false,
                    "optionPosition": 0
                },
                {
                    "questionId": 10025,
                    "name": "测试题目123",
                    "category": 1,
                    "content": "https://image.zmlearn.com/PUBLIC_UPLOAD/zm-tk/test-lesson-recommended-content/7a576cafdf00176d49d0dc293f60b3724fbbcc063dbd23959ff0cf0bfc50a26f.jpg",
                    "contentType": 4,
                    "contentAudio": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/11803f7c6fcba9b59049add5ae0c40b7.mp3",
                    "difficulty": 3,
                    "correctRate": "100.00",
                    "doneNum": 0,
                    "questionOptions": [
                        {
                            "questionOptionId": 1337,
                            "pictureUrl": "https://image.zmlearn.com/PUBLIC_UPLOAD/zm-tk/test-lesson-recommended-content/59f3e3e048b366aa6a3ad5b50ee03ea1b0ac01ed24389b9287ecd63515117825.jpg",
                            "answer": true,
                            "audioUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/ceba9c2100ac53787cdd21b8c21f14ac.mp3"
                        },
                        {
                            "questionOptionId": 1338,
                            "pictureUrl": "https://image.zmlearn.com/PUBLIC_UPLOAD/zm-tk/test-lesson-recommended-content/9a48c0c7295bc0df6f7da62a2ed0196eb7e41bed12b8d0a5c85a8538a9c7551b.jpg",
                            "answer": true,
                            "audioUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/11803f7c6fcba9b59049add5ae0c40b7.mp3"
                        },
                        {
                            "questionOptionId": 1339,
                            "pictureUrl": "https://image.zmlearn.com/PUBLIC_UPLOAD/zm-tk/test-lesson-recommended-content/9e94dd47f784f519f0f578ba20c4b3a1cda8b20954c18383f451d2f6b35018c7.jpg",
                            "answer": false,
                            "audioUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/11803f7c6fcba9b59049add5ae0c40b7.mp3"
                        }
                    ],
                    "questionOptionAudios": [],
                    "commentVideoUrl": "",
                    "commentAudioUrl": "",
                    "playStudentRecording": false,
                    "optionPosition": 0
                },
                {
                    "questionId": 10024,
                    "name": "题目名称999",
                    "category": 0,
                    "content": "",
                    "contentType": 2,
                    "contentAudio": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/11803f7c6fcba9b59049add5ae0c40b7.mp3",
                    "difficulty": 3,
                    "correctRate": "100.00",
                    "doneNum": 0,
                    "questionOptions": [
                        {
                            "questionOptionId": 1313,
                            "pictureUrl": "https://image.zmlearn.com/PUBLIC_UPLOAD/zm-tk/test-lesson-recommended-content/be39b10437bf5f807160ead2888779ea792ef442ac410dc437c41aaf894be4b5.jpg",
                            "answer": true,
                            "audioUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/ceba9c2100ac53787cdd21b8c21f14ac.mp3"
                        },
                        {
                            "questionOptionId": 1314,
                            "pictureUrl": "https://image.zmlearn.com/PUBLIC_UPLOAD/zm-tk/test-lesson-recommended-content/c9eb03c8f55b407beb4e756ce22bf4f7ceddc94e5306958b4380d2a8012d2750.jpg",
                            "answer": false,
                            "audioUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/5705160ce3be709f77546b91c41a47b8.mp3"
                        },
                        {
                            "questionOptionId": 1315,
                            "pictureUrl": "https://image.zmlearn.com/PUBLIC_UPLOAD/zm-tk/test-lesson-recommended-content/b088866fdba066c86ad9b8f1dbda7855c5ca59fe640403a97bc0fe11a2490e92.jpg",
                            "answer": false,
                            "audioUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/11803f7c6fcba9b59049add5ae0c40b7.mp3"
                        }
                    ],
                    "questionOptionAudios": [],
                    "commentVideoUrl": "",
                    "commentAudioUrl": "",
                    "playStudentRecording": false,
                    "optionPosition": 0
                },
                {
                    "questionId": 10023,
                    "name": "题目管理22",
                    "category": 2,
                    "content": "https://image.zmlearn.com/PUBLIC_UPLOAD/zm-tk/test-lesson-recommended-content/7c0cd3d9c6e029c985c5fc01cee5a8b727b01b528a6f894bab0cdbb0a395cd7f.jpg",
                    "contentType": 4,
                    "contentAudio": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/11803f7c6fcba9b59049add5ae0c40b7.mp3",
                    "difficulty": 2,
                    "correctRate": "100.00",
                    "doneNum": 0,
                    "questionOptions": [],
                    "questionOptionAudios": [
                        {
                            "nlpConfigId": 14,
                            "content": "master",
                            "followTime": 60,
                            "identificationIndex": "2",
                            "languageMode": "0",
                            "textType": "0",
                            "textCode": "4",
                            "textTypeCode": "2004"
                        }
                    ],
                    "commentVideoUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/58110d86153d9218733cf681bd1e5c75.mp4",
                    "commentAudioUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/412404d51d7797da251e0728c13cf5f6.wav",
                    "playStudentRecording": true,
                    "optionPosition": 0
                }
            ],
            "showtime": null,
            "commentRule": null,
            "courseCswareInterestingDubbing": null,
            "courseCswareCommentAudio": null,
            "resourceLocalUrl": "https://zm-brain-tr-tool.zmtalent.com/fat/1_2102_168100f73d0242249f324e2d4de3dbb9.zip",
            "useResourceLocal": false
        }
    ],
    "requestId": "zmbiz-brain-record-b@12482-ac196e25-447707-45"
}
```

#### 模块-趣味配音

``` javascript
{
    "contentIdAndLinkIds": [
        {
            "contentId": 90872,
            "linkId": 82
        }
    ]
}
```

返回参数中应当包含指定的趣味配音，例如这里的 `courseCswareInterestingDubbing`
``` javascript
{
    "code": 0,
    "message": "请求成功",
    "data": [
        {
            "id": 2042,
            "type": 3,
            "name": "趣味配音示范",
            "versionNum": 18,
            "subjectCode": "MATH",
            "subject": "数学",
            "gradeCode": "PRIMARY_SCHOOL_4",
            "grade": "小四",
            "editionId": 153,
            "courseSystemFirstId": 84159,
            "courseSystemSecondId": 84160,
            "courseSystemThirdId": 84161,
            "courseSystemFourthId": 92725,
            "linkId": 82,
            "updatedUserName": "测试123",
            "game": null,
            "questions": null,
            "showtime": null,
            "commentRule": null,
            "courseCswareInterestingDubbing": {
                "name": "趣味配音示范",
                "demoVideo": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/09653c5e029c21fc87e8b8278afe699b.mp4",
                "bgAudio": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/ceba9c2100ac53787cdd21b8c21f14ac.mp3",
                "bgAudioFileName": "dub_audio.mp3",
                "videoRhythmNum": 7,
                "courseCswareInterestingDubbingVideoRhythms": [
                    {
                        "startTime": "00:01.488",
                        "startMillisecond": 1488,
                        "endTime": "00:04.780",
                        "endMillisecond": 4780,
                        "content": "测试1"
                    },
                    {
                        "startTime": "00:04.936",
                        "startMillisecond": 4936,
                        "endTime": "00:07.130",
                        "endMillisecond": 7130,
                        "content": "测试2"
                    },
                    {
                        "startTime": "00:07.757",
                        "startMillisecond": 7757,
                        "endTime": "00:09.481",
                        "endMillisecond": 9481,
                        "content": "测试3"
                    },
                    {
                        "startTime": "00:09.638",
                        "startMillisecond": 9638,
                        "endTime": "00:11.675",
                        "endMillisecond": 11675,
                        "content": "测试4"
                    },
                    {
                        "startTime": "00:14.026",
                        "startMillisecond": 14026,
                        "endTime": "00:18.806",
                        "endMillisecond": 18806,
                        "content": "测试5"
                    },
                    {
                        "startTime": "00:21.862",
                        "startMillisecond": 21862,
                        "endTime": "00:27.191",
                        "endMillisecond": 27191,
                        "content": "测试123"
                    },
                    {
                        "startTime": "00:30.090",
                        "startMillisecond": 30090,
                        "endTime": "00:37.848",
                        "endMillisecond": 37848,
                        "content": "sdffasfasdf"
                    }
                ]
            },
            "courseCswareCommentAudio": null,
            "resourceLocalUrl": "",
            "useResourceLocal": false
        }
    ],
    "requestId": "zmbiz-brain-record-b@12482-ac196e25-447707-55"
}
```

#### 模块-美术作品墙
``` javascript
{
    "contentIdAndLinkIds": [
        {
            "contentId": 92725,
            "linkId": 81
        }
    ]
}
``` 

返回参数中应当包含指定的美术作品墙，例如这里的 `courseCswareCommentAudio` 

``` javascript
{
    "code": 0,
    "message": "请求成功",
    "data": [
        {
            "id": 2018,
            "type": 4,
            "name": "美术作品1",
            "versionNum": 14,
            "subjectCode": "MATH",
            "subject": "数学",
            "gradeCode": "PRIMARY_SCHOOL_4",
            "grade": "小四",
            "editionId": 153,
            "courseSystemFirstId": 84159,
            "courseSystemSecondId": 84160,
            "courseSystemThirdId": 84161,
            "courseSystemFourthId": 92725,
            "linkId": 81,
            "updatedUserName": "测试123",
            "game": null,
            "questions": null,
            "showtime": null,
            "commentRule": null,
            "courseCswareInterestingDubbing": null,
            "courseCswareCommentAudio": {
                "name": "美术作品1",
                "tipsAudioUrl": "",
                "tipsAudioName": "",
                "audioCount": 8,
                "pictureUrls": [
                    {
                        "id": 952,
                        "contentId": 92725,
                        "pictureUrl": "http://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/76176279f05a4a126538f2543a997df0.png",
                        "courseCswareCommentAudioId": 481
                    },
                    {
                        "id": 953,
                        "contentId": 92725,
                        "pictureUrl": "http://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/fc6f7e930037d9d3b3c080420c42c71a.png",
                        "courseCswareCommentAudioId": 481
                    },
                    {
                        "id": 954,
                        "contentId": 92725,
                        "pictureUrl": "http://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/bb54874f1833e6cdee7741395ef95052.png",
                        "courseCswareCommentAudioId": 481
                    },
                    {
                        "id": 955,
                        "contentId": 92725,
                        "pictureUrl": "http://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/cd380d0d07aa1c59224b684ac9f147be.png",
                        "courseCswareCommentAudioId": 481
                    },
                    {
                        "id": 956,
                        "contentId": 92725,
                        "pictureUrl": "http://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/76176279f05a4a126538f2543a997df0.png",
                        "courseCswareCommentAudioId": 481
                    },
                    {
                        "id": 957,
                        "contentId": 92725,
                        "pictureUrl": "http://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/27e54b2f2783119eabe8009345c32fb1.jpg",
                        "courseCswareCommentAudioId": 481
                    }
                ],
                "courseCswareId": 2018,
                "commentAudios": [
                    {
                        "id": 1870,
                        "audioUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/80cc684e63171728e906c9c782f8e858.m4a",
                        "audioName": "L1-5精讲2-1.m4a",
                        "commentDimensionId": 99,
                        "commentDimensionName": null,
                        "contentId": 92725,
                        "audioDuration": "23",
                        "createdTime": "2021-01-27T15:07:04",
                        "updatedTime": "2021-01-27T15:07:04",
                        "updatedUser": 1326361145,
                        "updatedUserName": "测试123",
                        "courseCswareCommentAudioId": 481
                    },
                    {
                        "id": 1871,
                        "audioUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/11803f7c6fcba9b59049add5ae0c40b7.mp3",
                        "audioName": "08精讲1-3.mp3",
                        "commentDimensionId": 102,
                        "commentDimensionName": null,
                        "contentId": 92725,
                        "audioDuration": "51",
                        "createdTime": "2021-01-27T15:07:04",
                        "updatedTime": "2021-01-27T15:07:04",
                        "updatedUser": 1326361145,
                        "updatedUserName": "测试123",
                        "courseCswareCommentAudioId": 481
                    },
                    {
                        "id": 1873,
                        "audioUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/11803f7c6fcba9b59049add5ae0c40b7.mp3",
                        "audioName": "08精讲1-3.mp3",
                        "commentDimensionId": 100,
                        "commentDimensionName": "12211212",
                        "contentId": 92725,
                        "audioDuration": "51",
                        "createdTime": "2021-01-27T15:07:04",
                        "updatedTime": "2021-01-27T15:07:04",
                        "updatedUser": 1326361145,
                        "updatedUserName": "测试123",
                        "courseCswareCommentAudioId": 481
                    },
                    {
                        "id": 1877,
                        "audioUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/80cc684e63171728e906c9c782f8e858.m4a",
                        "audioName": "L1-5精讲2-1.m4a",
                        "commentDimensionId": 51,
                        "commentDimensionName": null,
                        "contentId": 92725,
                        "audioDuration": "23",
                        "createdTime": "2021-01-27T15:07:04",
                        "updatedTime": "2021-01-27T15:07:04",
                        "updatedUser": 1326361145,
                        "updatedUserName": "测试123",
                        "courseCswareCommentAudioId": 481
                    }
                ]
            },
            "resourceLocalUrl": "",
            "useResourceLocal": false
        }
    ],
    "requestId": "zmbiz-brain-record-b@12482-ac196e25-447707-62"
}
```

#### 模块-SHOWTIME

``` javascript
{
    "contentIdAndLinkIds": [
        {
            "contentId": 92725,
            "linkId": 53
        }
    ]
}
```

返回参数中应当包含指定的SHOWTIME，例如这里的 `showtime` ，其中的数据逻辑如下：
- `showtimeStickers` 表示腾讯云贴纸列表
- `aliShowtimeStickers` 表示阿里云贴纸列表
- `aliShowtimeSticker` 选择的阿里云贴纸， `showtimeSticker` 选择的腾讯云贴纸，（**为了兼容之前的，这两个只能存在一个**），
``` javascript
{
    "code": 0,
    "message": "请求成功",
    "data": [
        {
            "id": 2103,
            "type": 1,
            "name": "1.4指数运算V1",
            "versionNum": 0,
            "subjectCode": "MATH",
            "subject": "数学",
            "gradeCode": "PRIMARY_SCHOOL_4",
            "grade": "小四",
            "editionId": 153,
            "courseSystemFirstId": 84159,
            "courseSystemSecondId": 84160,
            "courseSystemThirdId": 84161,
            "courseSystemFourthId": 92725,
            "linkId": 53,
            "updatedUserName": "测试123",
            "game": null,
            "questions": null,
            "showtime": {
                "type": 0,
                "videoType": 0,
                "demoUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/0cf0ae88d8e396fb445d32b46a929144.mp4",
                "recordUrl": "",
                "showUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/11cc2fe83332458e4436c3fa09a5a9d1.mp4",
                "showtimeSticker": null,
                "aliShowtimeSticker": {
                    "id": 131,
                    "name": "白羊",
                    "imgUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/4c513316fdb54bed28839b88a28a89ef.png",
                    "iosResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/a3c7287cf834f3ff5407c044565d49dd.zip",
                    "androidResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/a3c7287cf834f3ff5407c044565d49dd.zip"
                },
                "showtimeStickers": [
                    {
                        "id": 116,
                        "name": "贴纸11",
                        "imgUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/21d92abdc30dda8f6ee922034d046c8f.png",
                        "iosResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/e9eae45ffc35a292b484cf8f51f8af8e.zip",
                        "androidResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/9d2335541d5c78adc108ba37692e0cd1.zip"
                    },
                    {
                        "id": 115,
                        "name": "贴纸10",
                        "imgUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/1c26034d6e9654f79191418b68c21b7e.png",
                        "iosResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/a9112116cdfe92f55e2b7f54ddd55140.zip",
                        "androidResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/1271f558d57829f10fc0a16f97248d0c.zip"
                    },
                    {
                        "id": 114,
                        "name": "贴纸9",
                        "imgUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/774a1326ba3c8a821d71b512dd098a30.png",
                        "iosResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/a9112116cdfe92f55e2b7f54ddd55140.zip",
                        "androidResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/1271f558d57829f10fc0a16f97248d0c.zip"
                    },
                    {
                        "id": 113,
                        "name": "贴纸8",
                        "imgUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/0a47604e95aa3d0f51f3a5e379c05e85.png",
                        "iosResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/46ad095a83050a8e40818859cf5cee05.zip",
                        "androidResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/7ff217538991c420c9bebdc812d89432.zip"
                    },
                    {
                        "id": 112,
                        "name": "贴纸7",
                        "imgUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/5a830f846cb93097cf0307fec7a70b03.png",
                        "iosResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/a9112116cdfe92f55e2b7f54ddd55140.zip",
                        "androidResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/1271f558d57829f10fc0a16f97248d0c.zip"
                    },
                    {
                        "id": 111,
                        "name": "贴纸6",
                        "imgUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/7b6c5f8cb84c9921080386043563b040.png",
                        "iosResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/46ad095a83050a8e40818859cf5cee05.zip",
                        "androidResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/7ff217538991c420c9bebdc812d89432.zip"
                    },
                    {
                        "id": 110,
                        "name": "贴纸5",
                        "imgUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/45c65965cb14219f769846b6699106b1.png",
                        "iosResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/a9112116cdfe92f55e2b7f54ddd55140.zip",
                        "androidResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/1271f558d57829f10fc0a16f97248d0c.zip"
                    },
                    {
                        "id": 109,
                        "name": "贴纸4",
                        "imgUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/8e63a1dce17a1072f6db86d9bfdf1587.png",
                        "iosResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/a9112116cdfe92f55e2b7f54ddd55140.zip",
                        "androidResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/1271f558d57829f10fc0a16f97248d0c.zip"
                    },
                    {
                        "id": 106,
                        "name": "贴纸名称2",
                        "imgUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/cf6c6e0c96d421f0a5e05b7084e727a3.png",
                        "iosResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/46ad095a83050a8e40818859cf5cee05.zip",
                        "androidResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/7ff217538991c420c9bebdc812d89432.zip"
                    },
                    {
                        "id": 105,
                        "name": "贴纸名称1",
                        "imgUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/3ec6efb3d246ad4ce0fd98e98df7b879.png",
                        "iosResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/46ad095a83050a8e40818859cf5cee05.zip",
                        "androidResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/7ff217538991c420c9bebdc812d89432.zip"
                    },
                    {
                        "id": 117,
                        "name": "贴纸13",
                        "imgUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/5a830f846cb93097cf0307fec7a70b03.png",
                        "iosResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/a9112116cdfe92f55e2b7f54ddd55140.zip",
                        "androidResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/1271f558d57829f10fc0a16f97248d0c.zip"
                    },
                    {
                        "id": 107,
                        "name": "贴纸名称3",
                        "imgUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/0298acea985501638278a747f1f99069.png",
                        "iosResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/c20dfcdd188a2168b79a0910a9529e48.zip",
                        "androidResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/b81dbc12e93b0113e4098c1527fd578e.zip"
                    },
                    {
                        "id": 108,
                        "name": "贴纸名称3",
                        "imgUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/0298acea985501638278a747f1f99069.png",
                        "iosResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/c20dfcdd188a2168b79a0910a9529e48.zip",
                        "androidResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/b81dbc12e93b0113e4098c1527fd578e.zip"
                    },
                    {
                        "id": 118,
                        "name": "贴纸10",
                        "imgUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/0a47604e95aa3d0f51f3a5e379c05e85.png",
                        "iosResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/46ad095a83050a8e40818859cf5cee05.zip",
                        "androidResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/7ff217538991c420c9bebdc812d89432.zip"
                    },
                    {
                        "id": 120,
                        "name": "贴纸8",
                        "imgUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/3ec6efb3d246ad4ce0fd98e98df7b879.png",
                        "iosResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/46ad095a83050a8e40818859cf5cee05.zip",
                        "androidResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/7ff217538991c420c9bebdc812d89432.zip"
                    },
                    {
                        "id": 119,
                        "name": "贴纸8",
                        "imgUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/7b6c5f8cb84c9921080386043563b040.png",
                        "iosResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/a9112116cdfe92f55e2b7f54ddd55140.zip",
                        "androidResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/1271f558d57829f10fc0a16f97248d0c.zip"
                    }
                ],
                "aliShowtimeStickers": [
                    {
                        "id": 131,
                        "name": "白羊",
                        "imgUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/4c513316fdb54bed28839b88a28a89ef.png",
                        "iosResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/a3c7287cf834f3ff5407c044565d49dd.zip",
                        "androidResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/a3c7287cf834f3ff5407c044565d49dd.zip"
                    },
                    {
                        "id": 132,
                        "name": "彩色胡子",
                        "imgUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/f0468e3725fbf03fa46ae5f3590d5262.png",
                        "iosResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/af507114e77b87d6663e3da1f8f7570a.zip",
                        "androidResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/af507114e77b87d6663e3da1f8f7570a.zip"
                    },
                    {
                        "id": 130,
                        "name": "贴纸141",
                        "imgUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/7b6c5f8cb84c9921080386043563b040.png",
                        "iosResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/54bf280e552969e9577fc1de73eab061.zip",
                        "androidResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/54bf280e552969e9577fc1de73eab061.zip"
                    },
                    {
                        "id": 121,
                        "name": "贴纸13",
                        "imgUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/45c65965cb14219f769846b6699106b1.png",
                        "iosResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/1271f558d57829f10fc0a16f97248d0c.zip",
                        "androidResourceUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/1271f558d57829f10fc0a16f97248d0c.zip"
                    },
                    {
                        "id": 122,
                        "name": "ali贴纸",
                        "imgUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/a8f2039bd75006ce1ca144294c1b9746.png",
                        "iosResourceUrl": "https://brain-tr-tool.oss-cn-hangzhou.aliyuncs.com/test/bixin-5871.zip",
                        "androidResourceUrl": "https://brain-tr-tool.oss-cn-hangzhou.aliyuncs.com/test/bixin-5871.zip"
                    },
                    {
                        "id": 127,
                        "name": "ali贴纸",
                        "imgUrl": "https://zm-airecorder.zmtalent.com/PUBLIC_UPLOAD/ai/record/AIResource/PicBook/21d92abdc30dda8f6ee922034d046c8f.png",
                        "iosResourceUrl": "https://brain-tr-tool.oss-cn-hangzhou.aliyuncs.com/test/cahan-5013.zip",
                        "androidResourceUrl": "https://brain-tr-tool.oss-cn-hangzhou.aliyuncs.com/test/cahan-5013.zip"
                    }
                ],
                "videoRhythms": [],
                "bgMusic": "",
                "bgMusicFileName": ""
            },
            "commentRule": null,
            "courseCswareInterestingDubbing": null,
            "courseCswareCommentAudio": null,
            "resourceLocalUrl": "",
            "useResourceLocal": false
        }
    ],
    "requestId": "zmbiz-brain-record-b@12482-ac196e25-447707-76"
}
```
