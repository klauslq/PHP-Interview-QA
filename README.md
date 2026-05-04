# PHP 面试问答

[![GitHub Repo stars](https://img.shields.io/github/stars/colinlet/PHP-Interview-QA)](https://github.com/colinlet/PHP-Interview-QA/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/colinlet/PHP-Interview-QA)](https://github.com/colinlet/PHP-Interview-QA/forks)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Last Updated](https://img.shields.io/badge/最后更新-2026--05--02-green.svg)](#)

> PHP 很没前途，请把工作留给我，谢谢！

系统性整理 PHP 技术面试高频问题，覆盖 PHP 语言、数据结构与算法、计算机网络、设计模式、存储与中间件、架构与分布式、操作系统与服务器、安全、Web、番外等方向。每道题包含一句话结论、体系讲解、追问链、易错点与可运行代码示例。

---

## 求职行动链

![求职行动链](./docs/assets/求职行动链.jpg)

**求职行动链**：投递 → 笔试 → 技术初面 → 技术终面 → 交叉面 → 综合面 → 谈薪/接受Offer

| 行动环节 | 求职者可以主动作为 |
|------|-------------------|
| **1. 投递简历 / 内推** | 针对目标公司技术栈定制简历，量化成果；通过人脉或社区激活内推，获取真实反馈；前置调研公司产品与技术挑战，在简历中埋下匹配点。 |
| **2. 笔试 / 在线测试** | 靶向刷题：PHP 常见坑、数组函数、魔术方法、命名空间烂熟于心，辅以基本算法与数据结构；模拟限时编码环境，养成一次写对、注重边界条件的习惯；遇到模糊需求主动在平台提问澄清，展现严谨。 |
| **3. 技术初面** | 将八股文讲成理解，用实际场景解释 Redis 数据结构等知识点；准备 1 分钟埋钩子的自我介绍，引导面试官追问你最熟悉的项目；遇到不会的题不沉默，说出思考路径与排查方向。 |
| **4. 技术终面** | 用 STAR 法则深挖每个核心项目，突出个人决策与分析；主动要求画架构图，练习短链、秒杀、IM 消息推送等系统设计题，计算流量与存储；介绍技术选型时埋下对比方案，促成高质量追问。 |
| **5. 交叉面** | 展现可迁移能力，举例说明代码规范落地、跨团队协作的真实经验；准备有深度的问题反向调研对方（如“当前最大技术债是什么？”）；用“我们”传递协作感，描述冲突时强调如何达成共识。 |
| **6. 综合面（HR/业务）** | 设计连贯的职业故事线，正面解释离职原因，具体说明来这里的动机；提前准备价值观问题（缺点、失败案例等）并附带改进动作；询问团队结构、培养机制，展现长期主义。 |
| **7. 谈薪 / 接受 Offer** | 面试中后期明确薪资期望，终面后主动提供流水等材料加速审批；以年度总包（现金+股票+奖金+公积金等）为基础做横向比较；书面确认试用期、转正标准、期权行权条件等关键细节，保护自身权益。 |

> 完整多方视角（HR / 面试官 / 业务方协作链路）见 [面试全景图](./docs/面试全景图.md)。

## 难度图例

| 标签 | 定位 | 适合谁 |
|:---:|---|---|
| **L1** | 能正确使用，知道"是什么" | 初级工程师（0-1 年） |
| **L2** | 能合理选择，知道"怎么用好" | 中级工程师（1-3 年） |
| **L3** | 能解释原理，知道"为什么这样" | 高级工程师（3-5 年） |
| **L4** | 能设计方案，源码级理解 | 资深工程师（5-10 年） |
| **L5** | 能权衡取舍，系统级决策 | 架构师（10 年+） |

每道题还标注了**考察频率**（高 / 中 / 低），方便按紧迫度筛选复习重点。

---

## 主题导航

| 主题 | 目录 | 进度 |
|---|---|---|
| PHP 语言篇 | [`docs/php/`](docs/php/) | 🟡 进行中 |
| 存储与中间件篇 | [`docs/storage/`](docs/storage/) | ⏳ 待启动 |
| Web 篇 | [`docs/web/`](docs/web/) | ⏳ 待启动 |
| 计算机网络篇 | [`docs/network/`](docs/network/) | ⏳ 待启动 |
| 安全篇 | [`docs/security/`](docs/security/) | ⏳ 待启动 |
| 设计模式篇 | [`docs/design-pattern/`](docs/design-pattern/) | ⏳ 待启动 |
| 数据结构与算法篇 | [`docs/algorithm/`](docs/algorithm/) | ⏳ 待启动 |
| 操作系统与服务器篇 | [`docs/server/`](docs/server/) | ⏳ 待启动 |
| 架构与分布式篇 | [`docs/architecture/`](docs/architecture/) | ⏳ 待启动 |
| 番外篇 | [`docs/misc/`](docs/misc/) | ⏳ 待启动 |

---

## 题目索引

### PHP 语言篇

| 难度 | 频率 | 题目 |
|:---:|:---:|---|
| L1 | 高 | [PHP 中 == 和 === 的区别是什么](docs/php/PHP中==和===的区别是什么.md) |
| L1 | 高 | [isset() 与 empty() 有什么区别](docs/php/isset与empty的区别.md) |
| L1 | 高 | [PHP 索引数组与关联数组的区别及常见操作](docs/php/PHP数组的索引数组与关联数组.md) |
| L1 | 高 | [PHP 中引用传递与值传递的区别](docs/php/PHP中引用传递与值传递的区别.md) |
| L1 | 中 | [PHP 单引号与双引号字符串的区别](docs/php/PHP单引号与双引号字符串的区别.md) |
| L1 | 中 | [PHP 动态语言特性与静态语言的区别](docs/php/PHP动态语言特性与静态语言的区别.md) |
| L2 | 高 | [抽象类与接口的区别及使用场景](docs/php/抽象类与接口的区别及使用场景.md) |
| L2 | 高 | [PHP 中 Trait 的作用与冲突解决机制](docs/php/Trait的作用与冲突解决机制.md) |
| L2 | 中 | [Late Static Binding 是什么及 static:: 与 self:: 的区别](docs/php/LateStaticBinding与self和static的区别.md) |
| L2 | 高 | [Composer 自动加载机制与 PSR-4 规范](docs/php/Composer自动加载机制与PSR-4规范.md) |
| L2 | 高 | [PHP 中 Error 与 Exception 的区别及异常处理最佳实践](docs/php/Error与Exception的区别及异常处理最佳实践.md) |
| L2 | 中 | [PHP 多范式编程与场景选型](docs/php/PHP多范式编程与场景选型.md) |
| L2 | 高 | [什么是依赖注入？它解决了什么问题？](docs/php/依赖注入与控制反转.md) |
| L2 | 高 | [SOLID 设计原则是什么？各原则的核心意图是什么？](docs/php/SOLID设计原则.md) |
| L2 | 高 | [PHP 魔术方法是什么？__get/__set/__call 各适用于哪些场景？](docs/php/魔术方法与属性方法重载.md) |
| L2 | 高 | [PHP 命名空间的解析规则与别名机制](docs/php/PHP命名空间的解析规则与别名机制.md) |
| L3 | 高 | [PHP 的垃圾回收机制是如何工作的](docs/php/PHP垃圾回收机制.md) |
| L3 | 中 | [PHP zval 内部结构是什么？写时复制（COW）机制如何工作？](docs/php/zval内部结构与写时复制机制.md) |

---

### 数据结构与算法篇

| 难度 | 频率 | 题目 |
|:---:|:---:|---|
| L1 | 高 | [算法复杂度分析与 Big-O 表示法](docs/algorithm/算法复杂度分析与Big-O表示法.md) |
| L2 | 高 | [链表翻转与 Floyd 环检测](docs/algorithm/链表翻转与Floyd环检测.md) |
| L3 | 中 | [二分查找的统一模板：搜索边界与答案二分](docs/algorithm/二分查找的统一模板与搜索边界.md) |

---

### 操作系统与服务器篇

| 难度 | 频率 | 题目 |
|:---:|:---:|---|
| L1 | 高 | [PHP 开发常用 Linux 命令：文件查找、进程与网络诊断](docs/server/PHP开发常用Linux命令.md) |
| L2 | 高 | [PHP-FPM 进程模型与 FastCGI 协议](docs/server/PHP-FPM进程模型与FastCGI协议.md) |
| L4 | 中 | [Swoole 协程与 PHP-FPM 的选型决策](docs/server/Swoole协程与PHP-FPM的选型决策.md) |

---

### 架构与分布式篇

| 难度 | 频率 | 题目 |
|:---:|:---:|---|
| L5 | 中 | [短链系统设计：唯一短码生成方案的架构权衡](docs/architecture/短链系统设计：唯一短码生成方案的架构权衡.md) |
| L4 | 中 | [单体拆分微服务后的分布式事务选型](docs/architecture/单体拆分微服务后的分布式事务选型.md) |

---

### 计算机网络篇

| 难度 | 频率 | 题目 |
|:---:|:---:|---|
| L1 | 高 | [GET 和 POST 请求的区别](docs/network/GET和POST请求的区别.md) |
| L2 | 高 | [HTTPS 的 TLS 握手流程与加密分工](docs/network/HTTPS的TLS握手流程与加密分工.md) |
| L3 | 高 | [HTTP/2 与 HTTP/3 的核心改进与底层原理](docs/network/HTTP2与HTTP3核心改进与底层原理.md) |

---

### 设计模式篇

| 难度 | 频率 | 题目 |
|:---:|:---:|---|
| L1 | 高 | [设计模式的三大分类与意图](docs/design-pattern/设计模式的三大分类与意图.md) |
| L2 | 高 | [工厂方法与抽象工厂的区别及选型](docs/design-pattern/工厂方法与抽象工厂的区别及选型.md) |
| L3 | 中 | [里氏替换原则的行为契约与继承陷阱](docs/design-pattern/里氏替换原则的行为契约与继承陷阱.md) |

---

### 存储与中间件篇

| 难度 | 频率 | 题目 |
|:---:|:---:|---|
| L1 | 高 | [MySQL 中各种 JOIN 的区别是什么？](docs/storage/MySQL各种JOIN的区别.md) |
| L1 | 高 | [什么是数据库三范式？各范式分别解决了什么问题？](docs/storage/数据库三范式与反范式设计.md) |
| L1 | 高 | [Redis 有哪五种基本数据类型？各自适用什么场景？](docs/storage/Redis五种数据类型与适用场景.md) |
| L2 | 高 | [MySQL 索引为什么用 B+ 树？聚簇索引与非聚簇索引有什么区别？](docs/storage/MySQL索引为什么用B+树与聚簇索引.md) |
| L2 | 高 | [什么是覆盖索引？联合索引的最左前缀原则是什么？](docs/storage/覆盖索引与最左前缀原则.md) |
| L2 | 高 | [MySQL 四种事务隔离级别与并发问题](docs/storage/MySQL四种事务隔离级别与并发问题.md) |
| L2 | 高 | [缓存穿透、缓存击穿与缓存雪崩的区别及防护方案](docs/storage/缓存穿透击穿雪崩的区别及防护方案.md) |
| L3 | 高 | [ORDER BY 的执行原理与性能优化](docs/storage/ORDERBY执行原理与filesort优化.md) |
| L3 | 高 | [MySQL 一条查询语句的完整执行流程](docs/storage/MySQL查询语句完整执行流程.md) |

---

### Web 篇

| 难度 | 频率 | 题目 |
|:---:|:---:|---|
| L1 | 高 | [HTTP 常见状态码含义与 301 和 302 的区别](docs/web/HTTP状态码含义与301和302的区别.md) |
| L1 | 高 | [PHP 主流框架对比与选型概览](docs/web/PHP主流框架对比与选型概览.md) |
| L2 | 高 | [PHP 框架中间件机制与洋葱模型](docs/web/PHP框架中间件机制与洋葱模型.md) |
| L3 | 高 | [Laravel 服务容器（IoC）的实现原理](docs/web/Laravel服务容器IoC实现原理.md) |

---

### 安全篇

| 难度 | 频率 | 题目 |
|:---:|:---:|---|
| L1 | 高 | [XSS 攻击类型与防御方案](docs/security/XSS攻击类型与防御方案.md) |
| L2 | 高 | [CC 攻击与应用层限流防护方案](docs/security/CC攻击与应用层限流防护方案.md) |
| L3 | 高 | [PHP 文件上传安全与输入过滤实践](docs/security/PHP文件上传安全与输入过滤实践.md) |

---

### 番外篇

| 难度 | 频率 | 题目 |
|:---:|:---:|---|
| L2 | 中 | [生产环境如何排查 Bug，以及如何在本地复现并调试](docs/misc/生产环境排查Bug与本地调试工作流.md) |
| L3 | 低 | [AI 时代的 PHP 开发者：从工具选择到学习方法论](docs/misc/AI时代的PHP开发者——从工具选择到学习方法论.md) |

### 历史待归档

- [【试读】AI 时代的 PHP 开发者](./docs/php/ai时代的php开发者.md)
- [【试读】编程语言基础](./docs/php/编程语言简介.md)
- 【试读】PHP 与编程范式
- [【试读】当下最流行的 PHP 本地环境搭建方式](./docs/php/当下最流行的PHP本地环境搭建方式.md)
- 【试读】代码风格指南
- 【试读】代码注释
- [【试读】将变量打印出来，你知道哪些方式](./docs/php/将变量打印出来你知道哪些方式.md)
- 【试读】使用 xdebug 调试你的代码
- 【试读】基础知识
- [【试读】单引号和双引号的区别](./docs/php/单引号和双引号的区别.md)
- [【试读】isset 和 empty 的区别之如何判空](./docs/php/isset和empty的区别之如何判空.md)
- 【试读】面向对象编程
- 【试读】PHP 与函数式编程
- 【试读】PHP 与元编程
- 【试读】命名空间
- 【试读】PHP 标准库（SPL）
- 【试读】日期和时间
- 【试读】请使用 UTF-8 编码
- 【试读】本地化与国际化
- 【试读】2025 年有哪些流行的框架
- 【试读】如何进行依赖管理
- 【试读】依赖注入
- 【试读】错误与异常
- [【试读】composer 包升级](./docs/php/composer包升级.md)
- 【试读】MySQL 扩展
- 【试读】PDO 扩展
- 【试读】单元测试
- 【试读】Postman
- [【试读】static、self、$this 的区别](./docs/php/static-self-this的区别.md)
- [【试读】include、require、include_once、require_once 的区别](./docs/php/include-require-include_once-require_once的区别.md)
- [【试读】数组处理函数](./docs/php/常见数组函数.md)
- [【试读】Cookie 和 Session](./docs/php/Cookie和Session.md)
- [【试读】预定义变量](./docs/php/预定义变量.md)
- [【试读】传值和传引用的区别](./docs/php/传值和传引用的区别.md)
- [【试读】构造函数和析构函数](./docs/php/构造函数和析构函数.md)
- [【试读】魔术方法](./docs/php/魔术方法.md)
- [【试读】public、protected、private、final 区别](./docs/php/public-protected-private-final区别.md)
- [【试读】客户端/服务端 IP 获取，了解代理透传 实际IP 的概念](./docs/php/客户端服务端IP获取.md)
- [【试读】类的静态调用和实例化调用](./docs/php/类的静态调用和实例化调用.md)
- [【试读】接口类和抽象类的区别](./docs/php/接口类和抽象类的区别.md)
- [【试读】PHP 不实例化调用方法](./docs/php/PHP不实例化调用方法.md)
- [【试读】php.ini 配置选项](./docs/php/php.ini配置选项.md)
- [【试读】php-fpm.conf 配置](./docs/php/php-fpm.conf配置.md)
- [【试读】502、504 错误产生原因及解决方式](./docs/php/502-504错误产生原因及解决方式.md)
- [【试读】如何返回一个301重定向](./docs/php/如何返回一个301重定向.md)
- [【试读】PHP 与 MySQL 连接方式](./docs/php/PHP与MySQL连接方式.md)
- [【试读】MySQL、MySQLi、PDO 区别](./docs/php/MySQL-MySQLi-PDO区别.md)
- [【试读】MySQL 连接池](./docs/php/MySQL连接池.md)
- [【试读】代码执行过程](./docs/php/代码执行过程.md)
- [【试读】base64 编码原理](./docs/php/base64编码原理.md)
- [【试读】ip2long 实现](./docs/php/ip2long实现.md)
- [【试读】MVC 的理解](./docs/php/MVC的理解.md)
- [【试读】主流 PHP 框架特点](./docs/php/主流PHP框架特点.md)
- [【试读】对象关系映射/ORM](./docs/php/对象关系映射ORM.md)
- [【试读】串行、并行、并发的区别](./docs/php/串行-并行-并发的区别.md)
- [【试读】同步与异步的理解](./docs/php/同步与异步的理解.md)
- [【试读】阻塞与非阻塞的理解](./docs/php/阻塞与非阻塞的理解.md)
- [【试读】同步阻塞与非同步阻塞的理解](./docs/php/同步阻塞与非同步阻塞的理解.md)
- [【试读】一条echo输出语句是如何执行的](./docs/php/一条echo输出语句是如何执行的.md)
- [【试读】FastCGI Process Manager](./docs/php/FastCGI-Process-Manager.md)
- [【试读】php支持哪些注释风格](./docs/php/php支持哪些注释风格.md)
  
### 数据结构与算法篇

- [概述](./docs/02.数据结构与算法.md#1-概述)
- [实现基础](./docs/02.数据结构与算法.md#2-实现基础)
- [线性结构](./docs/02.数据结构与算法.md#3-线性结构)
- [树](./docs/02.数据结构与算法.md#4-树)
- [散列查找](./docs/02.数据结构与算法.md#5-散列查找)
- [图](./docs/02.数据结构与算法.md#6-图)
- [排序](./docs/02.数据结构与算法.md#7-排序)
- [补充](./docs/02.数据结构与算法.md#8-补充)
- [经典算法题](./docs/02.数据结构与算法.md#9-经典算法题)

### 计算机网络篇

- [计算机网络体系结构](./docs/01.网络.md#1-计算机网络体系结构)
- [UDP 的主要特点](./docs/01.网络.md#2-udp-的主要特点)
- [TCP 的主要特点](./docs/01.网络.md#3-tcp-的主要特点)
- [简述三报文握手建立 TCP 连接](./docs/01.网络.md#4-简述三报文握手建立-tcp-连接)
- [建立 TCP 连接为什么最后还要发送确认](./docs/01.网络.md#5-建立-tcp-连接为什么最后还要发送确认)
- [简述 TCP 连接的释放](./docs/01.网络.md#6-简述-tcp-连接的释放)
- [TIME-WAIT 是什么，为什么必须等待 2MLS](./docs/01.网络.md#7-time-wait-是什么为什么必须等待-2mls)
- [TCP 粘包问题](./docs/01.网络.md#8-tcp-粘包问题)
- [UDP、TCP 区别，适用场景](./docs/01.网络.md#9-udptcp-区别适用场景)
- [建立 socket 需要哪些步骤](./docs/01.网络.md#10-建立-socket-需要哪些步骤)
- [DNS 主要作用是什么](./docs/01.网络.md#11-dns-主要作用是什么)
- [HTTP 报文组成](./docs/01.网络.md#12-http-报文组成)
- [HTTP 状态码](./docs/01.网络.md#13-http-状态码)
- [常见的 HTTP 方法](./docs/01.网络.md#14-常见的-http-方法)
- [GET 与 POST 请求方式区别](./docs/01.网络.md#15-get-与-post-请求方式区别)
- [HTTP 优缺点](./docs/01.网络.md#16-http-优缺点)
- [HTTPS 通信原理](./docs/01.网络.md#17-https-通信原理)
- [HTTP 2.0](./docs/01.网络.md#18-http-20)
- [WebSocket](./docs/01.网络.md#19-websocket)
- [IPv6 与 IPv4 有什么变化](./docs/01.网络.md#20-ipv6-与-ipv4-有什么变化)
- [什么是心跳机制](./docs/01.网络.md#21-什么是心跳机制)
- [什么是长连接](./docs/01.网络.md#22-什么是长连接)

### 设计模式篇

- 【试读】如何解决复杂问题
- [什么是设计模式](./docs/09.设计模式/QA.md#什么是设计模式)
- [如何理解框架](./docs/09.设计模式/QA.md#如何理解框架)
- [主要设计模式](./docs/09.设计模式/QA.md#主要设计模式)
- [怎样选择设计模式](./docs/09.设计模式/QA.md#怎样选择设计模式)
- [单例模式](./docs/09.设计模式/QA.md#单例模式)
- [抽象工厂模式](./docs/09.设计模式/QA.md#抽象工厂模式)
- [工厂方法模式](./docs/09.设计模式/QA.md#工厂方法模式)
- [适配器模式](./docs/09.设计模式/QA.md#适配器模式)
- [观察者模式](./docs/09.设计模式/QA.md#观察者模式)
- [策略模式](./docs/09.设计模式/QA.md#策略模式)
- [OOP 思想](./docs/09.设计模式/QA.md#oop-思想)
- [抽象类和接口](./docs/09.设计模式/QA.md#抽象类和接口)
- [控制反转](./docs/09.设计模式/QA.md#控制反转)
- [依赖注入](./docs/09.设计模式/QA.md#依赖注入)

### 存储与中间件篇

- [体系结构](./docs/05.MySQL/QA.md#体系结构)
- [基础操作](./docs/05.MySQL/QA.md#基础操作)
- [数据库设计范式](./docs/05.MySQL/QA.md#数据库设计范式)
- [数据库设计原则](./docs/05.MySQL/QA.md#数据库设计原则)
- [CHAR 和 VARCHAR 数据类型区别](./docs/05.MySQL/QA.md#char-和-varchar-数据类型区别)
- [LEFT JOIN 、RIGHT JOIN、INNER JOIN](./docs/05.MySQL/QA.md#left-join-right-joininner-join)
- [UNION、UNION ALL](./docs/05.MySQL/QA.md#unionunion-all)
- [常用 MySQL 函数](./docs/05.MySQL/QA.md#常用-mysql-函数)
- [锁](./docs/05.MySQL/QA.md#锁)
- [事务](./docs/05.MySQL/QA.md#事务)
- [常见存储引擎](./docs/05.MySQL/QA.md#常见存储引擎)
- [常见索引](./docs/05.MySQL/QA.md#常见索引)
- [聚族索引与非聚族索引的区别](./docs/05.MySQL/QA.md#聚族索引与非聚族索引的区别)
- [BTree 与 BTree-/BTree+ 索引原理](./docs/05.MySQL/QA.md#btree-与-btree-btree-索引原理)
- [分表数量级](./docs/05.MySQL/QA.md#分表数量级)
- [EXPLAIN 输出格式](./docs/05.MySQL/QA.md#explain-输出格式)
- my.cnf 配置
- 慢查询
- [一条SQL查询语句是如何执行的](./docs/存储/一条SQL查询语句是如何执行的.md)
- [一条SQL更新语句是如何执行的](./docs/存储/一条SQL更新语句是如何执行的.md)
- [事务隔离：为什么你改了我还看不见？](./docs/存储/事务隔离-为什么你改了我还看不见.md)
- [深入浅出索引（上）](./docs/存储/深入浅出索引-上.md)
- [深入浅出索引（下）](./docs/存储/深入浅出索引-下.md)
- [全局锁和表锁：给表加个字段怎么有这么多阻碍](./docs/存储/全局锁和表锁-给表加个字段怎么有这么多阻碍.md)
- [行锁功过：怎么减少行锁对性能的影响](./docs/存储/行锁功过-怎么减少行锁对性能的影响.md)
- [事务到底是隔离的还是不隔离的](./docs/存储/事务到底是隔离的还是不隔离的.md)
- [普通索引和唯一索引，应该怎么选择](./docs/存储/普通索引和唯一索引，应该怎么选择.md)
- [MySQL为什么有时候会选错索引](./docs/存储/MySQL为什么有时候会选错索引.md)
- [怎么给字符串字段加索引](./docs/存储/怎么给字符串字段加索引.md)
- [为什么我的MySQL会抖一下](./docs/存储/为什么我的MySQL会抖一下.md)
- [为什么表数据删掉一半，表文件大小不变](./docs/存储/为什么表数据删掉一半，表文件大小不变.md)
- [count()这么慢，我该怎么办](./docs/存储/count()这么慢，我该怎么办.md)
- [order by是怎么工作的](./docs/存储/order-by是怎么工作的.md)
- [如何正确地显示随机消息](./docs/存储/如何正确地显示随机消息.md)
- [为什么这些SQL语句逻辑相同，性能却差异巨大](./docs/存储/为什么这些SQL语句逻辑相同，性能却差异巨大.md)
- [为什么我只查一行的语句，也执行这么慢](./docs/存储/为什么我只查一行的语句，也执行这么慢.md)
- [幻读是什么，幻读有什么问题](./docs/存储/幻读是什么，幻读有什么问题.md)
- [为什么我只改一行的语句，锁这么多](./docs/存储/为什么我只改一行的语句，锁这么多.md)
- [MySQL有哪些饮鸩止渴提高性能的方法](./docs/存储/MySQL有哪些饮鸩止渴提高性能的方法.md)
- [MySQL是怎么保证数据不丢的](./docs/存储/MySQL是怎么保证数据不丢的.md)
- [MySQL是怎么保证主备一致的](./docs/存储/MySQL是怎么保证主备一致的.md)
- [MySQL是怎么保证高可用的](./docs/存储/MySQL是怎么保证高可用的.md)
- [备库为什么会延迟好几个小时](./docs/存储/备库为什么会延迟好几个小时.md)
- [主库出问题了，从库怎么办](./docs/存储/主库出问题了，从库怎么办.md)
- [读写分离有哪些坑](./docs/存储/读写分离有哪些坑.md)
- [如何判断一个数据库是不是出问题了](./docs/存储/如何判断一个数据库是不是出问题了.md)
- [Redis 介绍](./docs/06.Redis/QA.md#redis-介绍)
- [Redis 特点](./docs/06.Redis/QA.md#redis-特点)
- [Redis 支持哪些数据结构](./docs/06.Redis/QA.md#redis-支持哪些数据结构)
- [Redis 与 Memcache 区别](./docs/06.Redis/QA.md#redis-与-memcache-区别)
- [发布订阅](./docs/06.Redis/QA.md#发布订阅)
- [持久化策略](./docs/06.Redis/QA.md#持久化策略)
- [Redis 事务](./docs/06.Redis/QA.md#redis-事务)
- [如何实现分布式锁](./docs/06.Redis/QA.md#如何实现分布式锁)
- [Redis 过期策略及内存淘汰机制](./docs/06.Redis/QA.md#redis-过期策略及内存淘汰机制)
- [为什么 Redis 是单线程的](./docs/06.Redis/QA.md#为什么-redis-是单线程的)
- [如何利用 CPU 多核心](./docs/06.Redis/QA.md#如何利用-cpu-多核心)
- [集合命令的实现方法](./docs/06.Redis/QA.md#集合命令的实现方法)
- [有序集合命令的实现方法](./docs/06.Redis/QA.md#有序集合命令的实现方法)
- redis.conf 配置
- 慢查询

### 架构与分布式篇

- [OAuth 2.0](./docs/10.架构/QA.md#oauth-20)
- [单点登录](./docs/10.架构/QA.md#单点登录)
- [REST](./docs/10.架构/QA.md#rest)
- [API 版本兼容](./docs/10.架构/QA.md#api-版本兼容)
- [JWT](./docs/10.架构/QA.md#jwt)
- [画出 PHP 业务架构图](./docs/10.架构/QA.md#画出-php-业务架构图)
- [LVS](./docs/10.架构/QA.md#lvs)
- [Ngnix](./docs/10.架构/QA.md#ngnix)
- 服务化
- 微服务
- 服务注册发现
- [数据库读写分离](./docs/10.架构/QA.md#数据库读写分离)
- [数据库拆分](./docs/10.架构/QA.md#数据库拆分)
- [分布式事务](./docs/10.架构/QA.md#分布式事务)
- ID 生成器
- [一致性哈希](./docs/10.架构/QA.md#一致性哈希)
- [Redis 集群](./docs/10.架构/QA.md#redis-集群)
- 消息队列
- 穿透、雪崩
- 限流(木桶、令牌桶)
- 服务降级
- 语言对比

-【试读】领域驱动设计（DDD）

### 操作系统与服务器篇

- [Linux 目录结构](./docs/07.Linux/QA.md#linux-目录结构)
- [Linux 基础](./docs/07.Linux/QA.md#linux-基础)
- [命令与文件查找](./docs/07.Linux/QA.md#命令与文件查找)
- [数据流重定向](./docs/07.Linux/QA.md#数据流重定向)
- [sed](./docs/07.Linux/QA.md#sed)
- [awk](./docs/07.Linux/QA.md#awk)
- [计划任务](./docs/07.Linux/QA.md#计划任务)
- [Vim](./docs/07.Linux/QA.md#vim)
- [负载查看](./docs/07.Linux/QA.md#负载查看)
- Linux 内存管理
- [进程、线程、协程区别](./docs/07.Linux/QA.md#进程线程协程区别)
- 进程间通信与信号机制

### 安全篇

- 【试读】密码学简介
- 【试读】加密与编码
- [跨站脚本攻击(XSS)](./docs/08.安全/QA.md#跨站脚本攻击xss)
- [跨站点请求伪造(CSRF)](./docs/08.安全/QA.md#跨站点请求伪造csrf)
- [SQL 注入](./docs/08.安全/QA.md#sql-注入)
- [应用层拒绝服务攻击](./docs/08.安全/QA.md#应用层拒绝服务攻击)
- [PHP 安全](./docs/08.安全/QA.md#php-安全)
- [伪随机数和真随机数](./docs/08.安全/QA.md#伪随机数和真随机数)

### Web篇

- [SEO 有哪些需要注意的](./docs/04.Web/QA.md#seo-有哪些需要注意的)
- [img 标签的 title 和 alt 有什么区别](./docs/04.Web/QA.md#img-标签的-title-和-alt-有什么区别)
- [CSS 选择器的分类](./docs/04.Web/QA.md#css-选择器的分类)
- [CSS sprite 是什么，有什么优缺点](./docs/04.Web/QA.md#css-sprite-是什么有什么优缺点)
- [display: none 与 visibility: hidden 的区别](./docs/04.Web/QA.md#display-none-与-visibility-hidden-的区别)
- [display: block 和 display: inline 的区别](./docs/04.Web/QA.md#display-block-和-display-inline-的区别)
- [CSS 文件、style 标签、行内 style 属性优先级](./docs/04.Web/QA.md#css-文件style-标签行内-style-属性优先级)
- [link 与 @import 的区别](./docs/04.Web/QA.md#link-与-import-的区别)
- [盒子模型](./docs/04.Web/QA.md#盒子模型)
- [容器包含若干浮动元素时如何清理(包含)浮动](./docs/04.Web/QA.md#容器包含若干浮动元素时如何清理包含浮动)
- [如何水平居中一个元素](./docs/04.Web/QA.md#如何水平居中一个元素)
- [如何竖直居中一个元素](./docs/04.Web/QA.md#如何竖直居中一个元素)
- [flex 与 CSS 盒子模型有什么区别](./docs/04.Web/QA.md#flex-与-css-盒子模型有什么区别)
- [Position 属性](./docs/04.Web/QA.md#position-属性)
- [PNG,GIF,JPG 的区别及如何选](./docs/04.Web/QA.md#pnggifjpg-的区别及如何选)
- [为什么把 JavaScript 文件放在 Html 底部](./docs/04.Web/QA.md#为什么把-javascript-文件放在-html-底部)
- [JavaScript 数据类型](./docs/04.Web/QA.md#javascript-数据类型)
- [JavaScript 操作 DOM 的方法有哪些](./docs/04.Web/QA.md#javascript-操作-dom-的方法有哪些)
- [JavaScript 字符串方法有哪些](./docs/04.Web/QA.md#javascript-字符串方法有哪些)
- [JavaScript 字符串截取方法有哪些？有什么区别](./docs/04.Web/QA.md#javascript-字符串截取方法有哪些有什么区别)
- [setTimeout 和 setInterval 的区别](./docs/04.Web/QA.md#settimeout-和-setinterval-的区别)
- [使用 new 操作符实例化一个对象的具体步骤](./docs/04.Web/QA.md#使用-new-操作符实例化一个对象的具体步骤)
- [如何实现 ajax 请求](./docs/04.Web/QA.md#如何实现-ajax-请求)
- [同源策略是什么](./docs/04.Web/QA.md#同源策略是什么)
- [如何解决跨域问题](./docs/04.Web/QA.md#如何解决跨域问题)
- [引起内存泄漏的操作有哪些](./docs/04.Web/QA.md#引起内存泄漏的操作有哪些)
- [闭包理解及应用](./docs/04.Web/QA.md#闭包理解及应用)
- [对 JavaScript 原型的理解](./docs/04.Web/QA.md#对-javascript-原型的理解)
- [对 JavaScript 模块化的理解](./docs/04.Web/QA.md#对-javascript-模块化的理解)
- [如何判断网页中图片加载成功或者失败](./docs/04.Web/QA.md#如何判断网页中图片加载成功或者失败)
- [如何实现懒加载](./docs/04.Web/QA.md#如何实现懒加载)
- [JSONP 原理](./docs/04.Web/QA.md#jsonp-原理)
- [Cookie 读写](./docs/04.Web/QA.md#cookie-读写)
- 从浏览器地址栏输入 URL 到显示页面的步骤
- [Vue.js 双向绑定原理](./docs/04.Web/QA.md#vuejs-双向绑定原理)
- 如何进行网站性能优化
- [渐进增强](./docs/04.Web/QA.md#渐进增强)

### 番外篇

- [【试读】你的编码热情是如何消退的？](./docs/番外/你的编码热情是如何消退的.md)
- [技术岗面试潜规则](./docs/面试/技术岗面试潜规则.md)
- [设计一份吸引面试官的简历](./docs/面试/设计一份吸引面试官的简历.md)
- [读懂岗位精准投递](./docs/面试/读懂岗位精准投递.md)
- [做好充分的准备去面试](./docs/面试/做好充分的准备去面试.md)
- [把握面试时的关键点](./docs/面试/把握面试时的关键点.md)
- [捕捉面试官微表情，做出应对策略](./docs/面试/捕捉面试官微表情，做出应对策略.md)
- [巧妙推销自己的3个技巧](./docs/面试/巧妙推销自己的3个技巧.md)
- [判断公司背景，做出合理选择](./docs/面试/判断公司背景，做出合理选择.md)
- [了解行业薪资，清晰找准定位](./docs/面试/了解行业薪资，清晰找准定位.md)
- [目标明确，阐明沟通](./docs/面试/目标明确，阐明沟通.md)
- [工作交接流程福利衔接](./docs/面试/工作交接流程福利衔接.md)
- [如何让工作年限变成优势](./docs/面试/如何让工作年限变成优势.md)

> 更多题目持续产出中，按批次滚动更新。

---

## 学习路径

本仓库题目按需自取，以下是几种常见使用方式：

- **突击准备**：按「考察频率 = 高」筛选，优先看 L1-L2 题目
- **体系进阶**：按主题顺序从 L1 读到 L3，建立完整知识链路
- **查漏补缺**：直接翻「追问链」和「易错点」，快速发现认知盲区
- **模拟面试**：遮住答案只看标题，尝试自行组织回答后对照

---

## 单题结构说明

每道题遵循统一模板，包含 6 个区块：

```
┌─────────────────────────────────┐
│  一句话结论（≤30 字核心答案）      │
├─────────────────────────────────┤
│  体系讲解（原理 → 机制 → 结论）   │
│  └── 含 Mermaid 流程图           │
├─────────────────────────────────┤
│  考察意图                        │
├─────────────────────────────────┤
│  追问链（3-5 个递进问题 + 简答）   │
├─────────────────────────────────┤
│  易错点（2-3 个高频误区）          │
├─────────────────────────────────┤
│  代码示例（PHP 8.0+ 可运行）      │
└─────────────────────────────────┘
```

---

## 参与贡献

欢迎提 Issue 或 PR：

- 🐛 **勘误**：发现事实性错误或过时内容
- 💡 **新题建议**：提议新的面试题目
- 🔬 **查证补充**：为标注"需查证"的内容提供权威来源

详细贡献指南将在后续版本发布。

---

## License

本项目基于 [Apache License 2.0](LICENSE) 开源。
