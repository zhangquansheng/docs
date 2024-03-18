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
            {text: '更新日志', link: '/change-log/'},
            {text: 'GitHub', link: 'https://github.com/zhangquansheng/zhengcheng-parent'},
        ],
        sidebar: [
            {
                title: '好站',
                collapsable: false,
                children: [
                    './awesome/'
                ]
            },
            {
                title: 'Java',
                collapsable: false,
                children: [
                    './java/java8-func',
                    './java/java8-stream',
                    './java/java-basic-datatypes',
                    './java/generics',
                    './java/reference',
                    './java/abstract-interface',
                    './java/HashMap',
                    './java/ConcurrentHashMap'
                ]
            },
            {
                title: 'Java 虚拟机底层原理',
                collapsable: false,
                children: [
                    './jvm/',
                    './jvm/gc',
                    './jvm/cms',
                    './jvm/g1'
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


