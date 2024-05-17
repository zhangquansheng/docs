module.exports = {
    port: "80",
    ga: "UA-85414008-1",
    markdown: {
        lineNumbers: true,
        externalLinks: {
            target: '_blank', rel: 'noopener noreferrer'
        }
    },
    head: [
        ['meta', {
            name: 'keywords',
            content: '新征程软件技术平台,新征程,zhengcheng.plus'
        }]
    ],
    title: "新征程软件技术平台",
    description: "简化开发 效率至上",
    lastUpdated: "上次更新",
    plugins: [
        '@vuepress/back-to-top',
        ['@vuepress/last-updated', {
            transformer: (timestamp, lang) => {
                // 不要忘了安装 moment (npm install moment)
                const moment = require('moment')
                moment.locale(lang)
                return moment(timestamp).fromNow()
            }
        }],
        ['@vuepress/active-header-links', {
            sidebarLinkSelector: '.sidebar-link',
            headerAnchorSelector: '.header-anchor'
        }]
    ],
    themeConfig: {
        activeHeaderLinks: false,
        logo: '/img/logo.png',
        nav: [
            {text: '首页', link: '/'},
            {
                text: 'JAVA',
                items: [
                    {
                        text: '基础',
                        link: '/java/HashMap'
                    }, {
                        text: 'JVM',
                        link: '/jvm/'
                    }, {
                        text: '并发',
                        link: '/concurrent/synchronized'
                    },
                ]
            }, {
                text: '计算机基础',
                items: [
                    {
                        text: '数据结构与算法',
                        link: '/algorithms/'
                    },
                ]
            }, {
                text: '数据库',
                items: [
                    {
                        text: 'MySQL',
                        link: '/mysql/'
                    }, {
                        text: 'Redis',
                        link: '/redis/'
                    }, {
                        text: 'Elasticsearch',
                        link: '/es/'
                    },
                ]
            }, {
                text: '常用框架',
                items: [
                    {
                        text: 'Spring',
                        link: '/spring/'
                    }, {
                        text: 'SpringBoot',
                        link: '/spring-boot/'
                    }, {
                        text: 'SpringCloud',
                        link: '/spring-cloud/feign/'
                    }, {
                        text: 'MyBatis',
                        link: '/mybatis/'
                    }, {
                        text: 'Apache ShardingSphere',
                        link: '/shardingsphere/'
                    },
                ]
            }, {
                text: '系统设计',
                items: [
                    {
                        text: '设计模式',
                        link: '/design-patterns/'
                    },
                    {
                        text: '秒杀系统',
                        link: '/system-design/seckill/'
                    },
                    {
                        text: '源码分析',
                        link: '/source-code-hunter/http-long-polling/'
                    },
                ]
            }, {
                text: '中间件',
                items: [
                    {
                        text: 'Kafka',
                        link: '/kafka/'
                    },
                    {
                        text: 'ZooKeeper',
                        link: '/zk/'
                    },
                    {
                        text: 'RocketMQ',
                        link: '/rocketmq/'
                    },
                ]
            },
            {text: 'zhengcheng 开发指南', link: '/guide/'},
            {text: '更新日志', link: '/change-log/'},
            {text: 'GitHub', link: 'https://github.com/zhangquansheng/zhengcheng-parent'},
        ],
        sidebar: [

        ]
    }
};


