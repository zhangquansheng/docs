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
    head: [
        ['meta', {
            name: 'keywords',
            content: '新征程框架,新征程,zhengcheng.plus'
        }],
        ['meta', {
            name: 'baidu-site-verification',
            content: '5oKnqi1avz'
        }],
        ['script', {}, `
            var _hmt = _hmt || [];
            (function() {
              var hm = document.createElement("script");
              hm.src = "https://hm.baidu.com/hm.js?3ea82649baaaaf57c9ad42bcf4e2385a";
              var s = document.getElementsByTagName("script")[0]; 
              s.parentNode.insertBefore(hm, s);
            })();
        `]
    ],
    title: "新征程框架",
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
            {
                text: '好站',
                items: [
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
                    {text: 'ShardingSphere', link: 'https://shardingsphere.apache.org/document/current/cn/overview/'},
                    {text: 'MVN REPOSITORY', link: 'https://mvnrepository.com/'},
                    {text: 'Algorithms', link: 'https://www.cs.usfca.edu/~galles/visualization/Algorithms.html'},
                    {text: 'Hutool', link: 'https://www.hutool.cn/'},
                    {text: '力扣（LeetCode）', link: 'https://leetcode-cn.com/'}
                ]
            },
            {text: '更新日志', link: '/change-log/'},
            {text: 'GitHub', link: 'https://github.com/zhangquansheng/zhengcheng-parent'},
            {text: 'Gitee', link: 'https://gitee.com/zhangquansheng/zhengcheng-parent'},
        ],
        sidebar: [
            {
                title: '开发指南',
                collapsable: false,
                children: [
                    './guide/',
                    './guide/getting-started',
                    './guide/web-core',
                    './guide/mybatis-plus',
                    './guide/dynamic-datasource',
                    './guide/cache',
                    './guide/feign',
                    './guide/async',
                    './guide/mapstruct',
                    './guide/apollo',
                    './guide/socketio',
                    './guide/nacos-eureka',
                    './guide/log',
                    './guide/java8-new-features'
                ]
            },
            {
                title: 'Spring',
                collapsable: false,
                children: [
                    './spring/',
                    './spring/dependency-injection',
                    './spring/beans',
                    './spring/circular-dependencies',
                    './spring/beans-autowired-annotation',
                    './spring/beans-resource-annotation',
                    './spring/beans-value-annotations',
                    './spring/aop',
                    './spring/transaction-declarative'
                ]
            },
            {
                title: 'Spring Boot',
                collapsable: false,
                children: [
                    './spring-boot/',
                    './spring-boot/configuration-properties',
                    './spring-boot/redis-pubsub',
                    './spring-boot/spring-boot-starter'
                ]
            },
            {
                title: 'Spring Cloud',
                collapsable: false,
                children: [
                    './spring-cloud/feign',
                    './spring-cloud/feign-dubbo',
                    './spring-cloud/ribbon',
                    './spring-cloud/refresh-scope',
                    './spring-cloud/apollo-zuul'
                ]
            },
            {
                title: 'MySQL',
                collapsable: false,
                children: [
                    './mysql/',
                    './mysql/b-plus-index',
                    './mysql/locking',
                    './mysql/transaction',
                    './mysql/sql-standard',
                    './mysql/innodb_trx'
                ]
            },
            {
                title: 'Redis',
                collapsable: false,
                children: [
                    './redis/',
                    './redis/data-types',
                    './redis/reactor',
                    './redis/big-key',
                    './redis/three-problems-of-cache',
                    './redis/cache-database-double-write-consistency'
                ]
            },
            {
                title: 'Kafka',
                collapsable: false,
                children: [
                    './kafka/',
                    './kafka/spring-kafka',
                    './kafka/multiple-kafka-config',
                    './kafka/message-sequencing'
                ]
            },
            {
                title: 'RocketMQ',
                collapsable: false,
                children: [
                    './rocketmq/',
                    './rocketmq/consumer',
                    './rocketmq/message-idempotent'
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
                title: '并发编程',
                collapsable: false,
                children: [
                    './concurrent/j.U.C',
                    './concurrent/blocking-queue',
                    './concurrent/count-down-latch',
                    './concurrent/synchronized'
                    //         './concurrent/volatile',
                    //         './concurrent/cas',
                    //         './concurrent/thread-local'
                ]
            },
            {
                title: 'Netty',
                collapsable: false,
                children: [
                    './netty/'
                ]
            },
            {
                title: 'Apache ShardingSphere',
                collapsable: false,
                children: [
                    './shardingsphere/',
                    './shardingsphere/getting-started'
                    // './shardingsphere/concept'
                ]
            },
            {
                title: '数据结构与算法',
                collapsable: false,
                children: [
                    './algorithms/'
                    // './algorithms/sort',
                    // './algorithms/binary-tree',
                    // './algorithms/balanced-tree',
                    // './algorithms/sliding-window',
                    // './algorithms/dynamic-programming'
                ]
            },
            {
                title: '综合话题',
                collapsable: false,
                children: [
                    './digging-deeper/plugin',
                    './digging-deeper/oom',
                    './digging-deeper/proxy',
                    './digging-deeper/sign-auth',
                    './digging-deeper/mdc',
                    './digging-deeper/distributed-lock',
                    './digging-deeper/mybatis-crud',
                    './digging-deeper/ifelse-1',
                    './digging-deeper/ifelse-2',
                    './digging-deeper/http-long-polling',
                    './digging-deeper/meituan-leaf'
                    // './digging-deeper/interview'
                ]
            },
            {
                title: 'FAQ',
                collapsable: false,
                children: [
                    './faq/jackson-serializable',
                    './faq/hikaricp-connection-is-not-available',
                    './faq/hikaricp-config',
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


