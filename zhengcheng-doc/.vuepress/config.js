module.exports = {
    port: "80",
    ga: "UA-85414008-1",
    base: "/",
    dest: 'zhengcheng-doc/.vuepress/docs',
    markdown: {
        externalLinks: {
            target: '_blank', rel: 'noopener noreferrer'
        }
    },
    title: "新征程",
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
        nav: [
            {text: '首页', link: '/'},
            {text: '指南', link: '/guide/'},
            {text: '变更日志', link: '/change-log/'},
            {text: 'gitee', link: 'https://gitee.com/zhangquansheng/zhengcheng-parent'},
        ],
        sidebar: [
            {
                title: '开发指南',
                collapsable: false,
                children: [
                    './guide/',
                    './guide/getting-started',
                    './guide/web-core',
                    './guide/cache',
                    './guide/db',
                    './guide/feign',
                    './guide/async',
                    './guide/apollo',
                    './guide/log',
                    './guide/zc-zk',
                    './guide/aliyun',
                    './guide/tencentcloud',
                    './guide/socketio',
                    './guide/sso'
                ]
            },
            {
                title: 'Spring Cloud',
                collapsable: false,
                children: [
                    './spring-cloud/feign'
                ]
            },
            {
                title: 'Kafka',
                collapsable: false,
                children: [
                    './kafka/kafka',
                    './kafka/spring-kafka',
                ]
            },
            {
                title: 'ZooKeeper',
                collapsable: false,
                children: [
                    './zk/',
                    './zk/zab',
                    './zk/lock'
                ]
            },
            {
                title: '综合话题',
                collapsable: false,
                children: [
                    './digging-deeper/plugin',
                    './digging-deeper/oom',
                    './digging-deeper/cat',
                    './digging-deeper/bigkey',
                    './digging-deeper/sign-auth',
                    './digging-deeper/mdc',
                    './digging-deeper/cache2',
                    './digging-deeper/distributed-lock',
                    './digging-deeper/aliyun-db'
                ]
            },
            {
                title: '架构设计',
                collapsable: false,
                children: [
                    './arch-design/mybatis-crud',
                    './arch-design/ifelse-1',
                    './arch-design/ifelse-2',
                ]
            },
            {
                title: 'FAQ',
                collapsable: false,
                children: [
                    './faq/',
                ]
            },
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


