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
                    './mysql/sql-execute',
                    './mysql/index-invalid',
                    './mysql/department-highest-salary',
                    './mysql/having',
                    './mysql/MySQL-8',
                    './mysql/limit_order_by'
                ]
            }, {
                title: 'MyBatis',
                collapsable: false,
                children: [
                    './mybatis/',
                    './mybatis/cache',
                    './mybatis/mybatis-crud',
                    './mybatis/MyBatis-Plus',
                    './mybatis/DataPermissionHandler',
                ]
            }, {
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
            }, {
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
                    './spring-cloud/Hystrix',
                    './spring-cloud/gw'
                ]
            }, {
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
            }, {
                title: 'Kafka',
                collapsable: false,
                children: [
                    './kafka/',
                    './kafka/spring-kafka',
                    './kafka/multiple-kafka-config',
                    './kafka/message-sequencing',
                    './kafka/spring-kafka-retry'
                ]
            },{
                title: 'ZooKeeper',
                collapsable: false,
                children: [
                    './zk/',
                    './zk/zab',
                    './zk/watcher',
                    './zk/lock'
                ]
            }, {
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
            },
            {
                title: '分布式',
                collapsable: false,
                children: [
                    './distributed/'
                ]
            },
            {
                title: '开发工具',
                collapsable: false,
                children: [
                    './maven/'
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


