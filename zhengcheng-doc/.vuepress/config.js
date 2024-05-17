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
            content: '新征程架构,新征程,zhengcheng.plus'
        }]
    ],
    title: "新征程架构",
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
            {text: 'zhengcheng 开发指南', link: '/guide/'},
            {text: 'GitHub', link: 'https://github.com/zhangquansheng/zhengcheng-parent'},
        ],
        sidebar: [
            {
                title: 'zhengcheng 开发指南',
                collapsable: false,
                children: [
                    './guide/',
                    './guide/getting-started',
                    './guide/web-core',
                    './guide/mybatis-plus',
                    './guide/dynamic-datasource',
                    './guide/cache',
                    './guide/idempotent',
                    './guide/feign',
                    './guide/async',
                    './guide/mapstruct',
                    // './guide/apollo',
                    './guide/nacos',
                    './guide/socketio',
                    './guide/nacos-eureka',
                    './guide/log'
                ]
            }
        ]
    }
};


