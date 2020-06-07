module.exports = {
    port: "3000",
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
    themeConfig: {
        activeHeaderLinks: false,
        nav: [
            {text: '首页', link: '/'},
            {text: '指南', link: '/guide/'},
            {text: 'gitee', link: 'https://gitee.com/zhangquansheng/zhengcheng-parent'},
        ],
        sidebar: [
            {
                title: '开发指南',
                collapsable: true,
                children: ['./guide/','./guide/quick-start']
            }
        ]
    }
};


