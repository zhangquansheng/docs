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
                text: '好站',
                items: [
                    {
                        text: '凤凰架构',
                        link: 'https://icyfenix.cn/'
                    },
                    {
                        text: 'Spring Framework Documentation',
                        link: 'https://docs.spring.io/spring-framework/docs/current/reference/html/index.html'
                    },
                    {
                        text: 'Spring Boot 2.1.18.RELEASE',
                        link: 'https://docs.spring.io/spring-boot/docs/2.1.18.RELEASE/reference/html/'
                    },
                    {
                        text: 'Spring Cloud Greenwich.SR5',
                        link: 'https://cloud.spring.io/spring-cloud-static/Greenwich.SR5/single/spring-cloud.html'
                    },
                    {text: 'MyBatis-Plus', link: 'http://mybatis.plus/'},
                    {
                        text: 'ShardingSphere',
                        link: 'https://shardingsphere.apache.org/document/current/cn/overview/'
                    },
                    {text: 'MVN REPOSITORY', link: 'https://mvnrepository.com/'},
                    {
                        text: 'Algorithms',
                        link: 'https://www.cs.usfca.edu/~galles/visualization/Algorithms.html'
                    },
                    {text: 'Hutool', link: 'https://www.hutool.cn/'},
                    {text: '力扣（LeetCode）', link: 'https://leetcode.cn/'},
                    {text: 'Arthas（阿尔萨斯）', link: 'https://github.com/alibaba/arthas'},
                    {text: 'ProcessOn', link: 'https://www.processon.com/'},
                    {
                        text: 'P3C',
                        link: 'https://github.com/alibaba/p3c'
                    },
                    {
                        text: 'stack overflow',
                        link: 'https://stackoverflow.com/'
                    },
                    {
                        text: 'redisson-spring-boot-starter',
                        link: 'https://github.com/redisson/redisson/tree/master/redisson-spring-boot-starter'
                    },
                ]
            },
            {text: '更新日志', link: '/change-log/'},
            {text: 'GitHub', link: 'https://github.com/zhangquansheng/zhengcheng-parent'},
        ],
        sidebar: [
            {
                title: '更新日志',
                collapsable: false,
                children: [
                    './change-log/'
                ]
            }
        ]
    }
};


