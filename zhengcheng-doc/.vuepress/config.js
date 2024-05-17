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
            {text: 'Awesome', link: '/awesome/'},
            {text: 'zhengcheng 开发指南', link: '/guide/'},
            {text: 'GitHub', link: 'https://github.com/zhangquansheng/zhengcheng-parent'},
        ],
        sidebar: [
            {
                title: 'JAVA',
                collapsable: true,
                children: [
                    {
                        title: 'JAVA 基础',
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
                        title: 'JAVA 虚拟机底层原理',
                        collapsable: false,
                        children: [
                            './jvm/',
                            './jvm/gc',
                            './jvm/cms',
                            './jvm/g1'
                        ]
                    },
                    {
                        title: '并发编程',
                        collapsable: false,
                        children: [
                            './concurrent/volatile',
                            './concurrent/synchronized',
                            './concurrent/cas',
                            './concurrent/AQS',
                            './concurrent/thread-local',
                            './concurrent/thread-pool-executor',
                            './concurrent/Future',
                            './concurrent/CompletableFuture'
                        ]
                    },
                    {
                        title: '面向对象设计模式',
                        collapsable: false,
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
                    }
                ]
            },
            {
                title: '计算机基础',
                collapsable: true,
                children: [
                    {
                        title: '数据结构与算法',
                        collapsable: false,
                        children: [
                            './algorithms/',
                            './algorithms/algorithms-think',
                            './algorithms/binary-tree',
                            './algorithms/sort',
                            './algorithms/data-structure',
                            './algorithms/dynamic-programming',
                            './algorithms/lru'
                            // './algorithms/balanced-tree',
                            // './algorithms/sliding-window',
                        ]
                    }
                ]
            },
            {
                title: '数据库',
                collapsable: true,
                children: [
                    {
                        title: 'MySQL',
                        collapsable: false,
                        children: [
                            './mysql/',
                            './mysql/Infrastructure',
                            './mysql/b-plus-index',
                            './mysql/ICP',
                            './mysql/locking',
                            './mysql/transaction',
                            './mysql/sql-standard',
                            './mysql/database-design-paradigm',
                            './mysql/innodb_trx',
                            './mysql/datetime',
                            './mysql/update',
                            './mysql/delete',
                            './mysql/count',
                            './mysql/join',
                            './mysql/sql-execute',
                            './mysql/index-invalid',
                            './mysql/department-highest-salary',
                            './mysql/having',
                            './mysql/MySQL-8',
                            './mysql/limit_order_by',
                        ]
                    },
                    {
                        title: 'Redis',
                        collapsable: false,
                        children: [
                            './redis/',
                            './redis/data-types',
                            './redis/memory',
                            './redis/reactor',
                            './redis/three-problems-of-cache',
                            './redis/cache-database-double-write-consistency',
                            // './redis/redisson',
                            './redis/redisson-lock',
                            './redis/big-key',
                            './redis/bitmap',
                            './redis/delay-queue',
                            './redis/pub-sub',
                            './redis/J2Cache',
                        ]
                    },
                    {
                        title: 'Elasticsearch',
                        collapsable: false,
                        children: [
                            './es/',
                            './es/inverted-index',
                            './es/Query-DSL.md',
                            './es/tokenizer',
                            './es/aggregations',
                            './es/restHighLevelClient'
                        ]
                    }
                ]
            }, {
                title: '常用开发框架',
                collapsable: true,
                children: [
                    {
                        title: 'Spring',
                        collapsable: false,
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
                        collapsable: false,
                        children: [
                            './spring-boot/',
                            './spring-boot/configuration',
                            './spring-boot/configuration-properties',
                            './spring-boot/redis-pubsub',
                            './spring-boot/spring-boot-starter',
                            './spring-boot/transaction-after',
                            './spring-boot/ContiPerf'
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
                            './spring-cloud/apollo-zuul',
                            './spring-cloud/Hystrix'
                        ]
                    },
                    {
                        title: 'MyBatis',
                        collapsable: false,
                        children: [
                            './mybatis/',
                            './mybatis/cache',
                            './mybatis/mybatis-crud',
                            './mybatis/MyBatis-Plus',
                            './mybatis/DataPermissionHandler',
                        ]
                    },
                    {
                        title: 'Apache ShardingSphere',
                        collapsable: false,
                        children: [
                            './shardingsphere/',
                            './shardingsphere/concept',
                            './shardingsphere/getting-started',
                        ]
                    }
                ]
            }, {
                title: '微服务架构',
                collapsable: true,
                children: [
                    {
                        title: 'Kafka',
                        collapsable: false,
                        children: [
                            './kafka/',
                            './kafka/spring-kafka',
                            './kafka/multiple-kafka-config',
                            './kafka/message-sequencing',
                            './kafka/spring-kafka-retry'
                        ]
                    },
                    {
                        title: 'ZooKeeper',
                        collapsable: false,
                        children: [
                            './zk/',
                            './zk/zab',
                            './zk/watcher',
                            './zk/lock'
                        ]
                    },
                    {
                        title: 'RocketMQ',
                        collapsable: false,
                        children: [
                            './rocketmq/',
                            './rocketmq/message-queue.md',
                            './rocketmq/consumer',
                            './rocketmq/message-idempotent',
                            './rocketmq/rocketmq-spring',
                            './rocketmq/rocketmq-spring-apache',
                            './rocketmq/transaction',
                            './rocketmq/delay'
                        ]
                    }
                ]
            },
            {
                title: '分布式',
                collapsable: true
            }, {
                title: '技术方法论',
                collapsable: true
            },
            {
                title: 'zhengcheng 开发指南',
                collapsable: true,
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


