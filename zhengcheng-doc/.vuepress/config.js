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
        logo: '/img/logo.png',
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
                    {text: '力扣（LeetCode）', link: 'https://leetcode-cn.com/'},
                    {text: 'Arthas（阿尔萨斯）', link: 'https://github.com/alibaba/arthas'},
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
            {text: 'Gitee', link: 'https://gitee.com/zhangquansheng/zhengcheng-parent'},
        ],
        sidebar: [
            {
                title: '开发指南',
                collapsable: true,
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
                    './guide/nacos',
                    './guide/socketio',
                    './guide/nacos-eureka',
                    './guide/log',
                    './guide/maven'
                ]
            },
            {
                title: 'Spring Cloud 大型线上商城项目实战',
                collapsable: true
            },
            {
                title: 'Java 基础',
                collapsable: true,
                children: [
                    './java/java8-new-features',
                    './java/generics',
                    './java/reference',
                    './java/abstract-interface'
                ]
            },
            {
                title: '并发编程',
                collapsable: true,
                children: [
                    // './concurrent/j.U.C',
                    // './concurrent/blocking-queue',
                    // './concurrent/count-down-latch',
                    './concurrent/volatile',
                    './concurrent/synchronized',
                    './concurrent/cas',
                    './concurrent/AQS',
                    './concurrent/thread-local',
                    './concurrent/thread-pool-executor',
                ]
            },
            {
                title: 'Spring',
                collapsable: true,
                children: [
                    './spring/',
                    './spring/dependency-injection',
                    './spring/beans',
                    './spring/circular-dependencies',
                    './spring/beans-annotation-config',
                    './spring/transaction-declarative',
                    './spring/aop',
                    './spring/validation'
                ]
            },
            {
                title: 'Spring Boot',
                collapsable: true,
                children: [
                    './spring-boot/',
                    './spring-boot/configuration-properties',
                    './spring-boot/redis-pubsub',
                    './spring-boot/spring-boot-starter',
                    './spring-boot/transaction-after',
                    './spring-boot/ContiPerf'
                ]
            },
            {
                title: 'Spring Cloud',
                collapsable: true,
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
                collapsable: true,
                children: [
                    './mysql/',
                    './mysql/Infrastructure',
                    './mysql/b-plus-index',
                    './mysql/ICP',
                    './mysql/locking',
                    './mysql/transaction',
                    './mysql/sql-standard',
                    './mysql/innodb_trx',
                    './mysql/datetime',
                    './mysql/update',
                    './mysql/delete',
                    './mysql/sql-execute',
                    './mysql/in',
                    './mysql/department-highest-salary',
                    './mysql/having'
                ]
            }, {
                title: 'Elasticsearch',
                collapsable: true,
                children: [
                    './es/',
                    './es/inverted-index',
                    './es/Query-DSL.md',
                    './es/tokenizer',
                    './es/aggregations',
                    './es/restHighLevelClient'
                ]
            }, {
                title: 'Redis',
                collapsable: true,
                children: [
                    './redis/',
                    './redis/data-types',
                    './redis/memory',
                    './redis/reactor',
                    './redis/three-problems-of-cache',
                    './redis/cache-database-double-write-consistency',
                    './redis/redisson',
                    './redis/big-key',
                    './redis/delay-queue',
                    './redis/J2Cache',
                ]
            }, {
                title: 'Kafka',
                collapsable: true,
                children: [
                    './kafka/',
                    './kafka/spring-kafka',
                    './kafka/multiple-kafka-config',
                    './kafka/message-sequencing'
                ]
            }, {
                title: 'RocketMQ',
                collapsable: true,
                children: [
                    './rocketmq/',
                    './rocketmq/consumer',
                    './rocketmq/message-idempotent',
                    './rocketmq/rocketmq-spring',
                    './rocketmq/rocketmq-spring-apache',
                    './rocketmq/transaction',
                    './rocketmq/delay'
                ]
            }, {
                title: 'ZooKeeper',
                collapsable: true,
                children: [
                    './zk/',
                    './zk/zab',
                    './zk/lock'
                ]
            }, {
                title: 'MyBatis',
                collapsable: true,
                children: [
                    './mybatis/',
                    './mybatis/cache',
                    './mybatis/mybatis-crud',
                    './mybatis/MyBatis-Plus'
                ]
            }, {
                title: 'Apache ShardingSphere',
                collapsable: true,
                children: [
                    './shardingsphere/',
                    './shardingsphere/concept',
                    './shardingsphere/getting-started'
                ]
            }, {
                title: '数据结构与算法',
                collapsable: true,
                children: [
                    './algorithms/',
                    './algorithms/binary-tree',
                    './algorithms/sort',
                    './algorithms/data-structure',
                    './algorithms/dynamic-programming',
                    './algorithms/lru'
                    // './algorithms/balanced-tree',
                    // './algorithms/sliding-window',
                ]
            }, {
                title: '面向对象设计模式',
                collapsable: true,
                children: [
                    './design-patterns/',
                    './design-patterns/factory',
                    './design-patterns/abstract-factory',
                    './design-patterns/builder',
                    './design-patterns/adapter',
                    './design-patterns/singleton',
                    './design-patterns/strategy',
                    './design-patterns/template',
                    './design-patterns/facade',
                    './design-patterns/flyweight',
                    './design-patterns/proxy',
                    './design-patterns/chain-of-responsibility',
                    './design-patterns/mediator',
                    './design-patterns/principle',
                    './design-patterns/ifelse-1',
                    './design-patterns/ifelse-2',
                    './design-patterns/dynamic-proxy'
                ]
            }, {
                title: '综合话题&源码分析',
                collapsable: true,
                children: [
                    './digging-deeper/Clean-Code',
                    './digging-deeper/naming',
                    './digging-deeper/plugin',
                    './digging-deeper/io',
                    './digging-deeper/oom',
                    './digging-deeper/copy-properties',
                    './digging-deeper/sign-auth',
                    './digging-deeper/mdc',
                    './digging-deeper/distributed-lock',
                    './digging-deeper/http-long-polling',
                    './digging-deeper/xxl-job',
                    './digging-deeper/xxl-rpc',
                    './digging-deeper/meituan-leaf',
                    './digging-deeper/HashMap',
                    './digging-deeper/ConcurrentHashMap',
                    './digging-deeper/cpu100',
                    './digging-deeper/bitmap',
                    './digging-deeper/multipart-upload',
                    './digging-deeper/arthas',
                    './digging-deeper/distributed-transaction',
                    './digging-deeper/system-architecture-diagram',
                    './digging-deeper/auto-cancel',
                ]
            }, {
                title: '微服务框架体系',
                collapsable: true,
                children: [
                    './Microservice-Architecture/',
                ]
            }, {
                title: '代码人生',
                collapsable: true,
                children: [
                    './career/',
                    './career/biz',
                    './career/book-list',
                ]
            }, {
                title: 'FAQ',
                collapsable: true,
                children: [
                    './faq/jackson-serializable',
                    './faq/hikaricp-connection-is-not-available',
                    './faq/hikaricp-config',
                ]
            }, {
                title: '更新日志',
                collapsable: true,
                children: [
                    './change-log/'
                ]
            }
        ]
    }
};


