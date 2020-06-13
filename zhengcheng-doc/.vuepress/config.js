module.exports = {
    port: "80",
    ga: "UA-85414008-1",
    base: "/",
    markdown: {
        externalLinks: {
            target: '_blank', rel: 'noopener noreferrer'
        }
    },
    title: "新征程",
    description: "简化开发 效率至上",
    lastUpdated: "上次更新",
    plugins: ['@vuepress/back-to-top', ['@vuepress/active-header-links', {
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
                    './guide/log',
                    './guide/zookeeper',
                    './guide/aliyun',
                    './guide/tencentcloud',
                    './guide/socketio',
                    './guide/sso'
                ]
            },
            {
                title: '综合话题',
                collapsable: false,
                children: [
                    './digging-deeper/plugin',
                    './digging-deeper/cat',
                    './digging-deeper/feign',
                    './digging-deeper/bigkey',
                    './digging-deeper/zk-lock',
                    './digging-deeper/sign-auth'
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


