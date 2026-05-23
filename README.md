# PHP 面试问答

[![Stars](https://img.shields.io/badge/Stars-2955-yellow?logo=github)](https://github.com/colinlet/PHP-Interview-QA/stargazers)
[![Forks](https://img.shields.io/badge/Forks-562-blue?logo=github)](https://github.com/colinlet/PHP-Interview-QA/forks)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Questions](https://img.shields.io/badge/题目数-95-orange.svg)](#题目索引)
[![在线阅读](https://img.shields.io/badge/在线阅读-GitHub%20Pages-0969da?logo=github)](https://colinlet.github.io/PHP-Interview-QA/)
[![Last Updated](https://img.shields.io/badge/最后更新-2026--05--23-green.svg)](#)

> PHP 很没前途，请把工作留给我，谢谢！

系统性整理 PHP 技术面试高频问题，覆盖 PHP 语言、数据结构与算法、计算机网络、设计模式、存储与中间件、架构与分布式、操作系统与服务器、安全、Web、番外等方向。每道题包含一句话结论、体系讲解、追问链、易错点与可运行代码示例。

📖 在线阅读：**[colinlet.github.io/PHP-Interview-QA](https://colinlet.github.io/PHP-Interview-QA/)**

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

| 标签 | 全称 | 定位 | 适合谁 |
|:---:|:---:|---|---|
| **L1** | Level 1 | 能正确使用，知道"是什么" | 初级工程师（0-1 年） |
| **L2** | Level 2 | 能合理选择，知道"怎么用好" | 中级工程师（1-3 年） |
| **L3** | Level 3 | 能解释原理，知道"为什么这样" | 高级工程师（3-5 年） |
| **L4** | Level 4 | 能设计方案，源码级理解 | 资深工程师（5-10 年） |
| **L5** | Level 5 | 能权衡取舍，系统级决策 | 架构师（10 年+） |

每道题还标注了**考察频率**（高 / 中 / 低），方便按紧迫度筛选复习重点。

---

## 主题导航

| 主题 | 目录 | 进度 |
|---|---|---|
| PHP 语言篇 | [`docs/php/`](docs/php/) | 🟡 进行中 |
| 数据结构与算法篇 | [`docs/algorithm/`](docs/algorithm/) | 🟡 进行中 |
| 计算机网络篇 | [`docs/network/`](docs/network/) | 🟡 进行中 |
| 设计模式篇 | [`docs/design-pattern/`](docs/design-pattern/) | 🟡 进行中 |
| 存储与中间件篇 | [`docs/storage/`](docs/storage/) | 🟡 进行中 |
| 架构与分布式篇 | [`docs/architecture/`](docs/architecture/) | 🟡 进行中 |
| 操作系统与服务器篇 | [`docs/server/`](docs/server/) | 🟡 进行中 |
| Web 篇 | [`docs/web/`](docs/web/) | 🟡 进行中 |
| 安全篇 | [`docs/security/`](docs/security/) | 🟡 进行中 |
| 番外篇 | [`docs/misc/`](docs/misc/) | 🟡 进行中 |

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
| L3 | 中 | [WeakReference 与 WeakMap 如何避免引用计数陷阱？](docs/php/WeakReference与WeakMap避免引用计数陷阱.md) |
| L1 | 高 | [PHP 浮点数精度问题是什么？如何用 bcmath 解决？](docs/php/PHP浮点数精度问题与bcmath解决方案.md) |
| L1 | 高 | [PHP 8.0 的 match 表达式与 switch 有什么区别？](docs/php/PHP8的match表达式与switch的区别.md) |
| L1 | 高 | [PHP 8.0 的 nullsafe 运算符（?->）是什么？与 ?? 有何区别？](docs/php/PHP8的nullsafe运算符.md) |
| L1 | 中 | [PHP 类型强转有哪些方式？各种类型互转的规则是什么？](docs/php/PHP类型强转规则与类型转换函数.md) |
| L1 | 中 | [PHP 8.0 的命名参数（Named Arguments）是什么？有哪些使用场景？](docs/php/PHP8的命名参数.md) |
| L3 | 高 | [OPcache 编译缓存的工作原理是什么？](docs/php/OPcache编译缓存的工作原理.md) |
| L3 | 中 | [PHP JIT 是什么？Tracing 与 Function 两种模式有何区别？](docs/php/PHP_JIT的工作模式与适用场景.md) |
| L3 | 中 | [PHP JIT 是什么？Tracing 与 Function 两种模式有何区别？](docs/php/PHP_JIT的工作模式与适用场景.md) |
| L1 | 高 | [declare(strict_types=1) 的作用是什么？严格模式与强制模式有何区别？](docs/php/declare(strict_types=1)的作用与严格模式行为.md) |
| L1 | 中 | [PHP 的 never 返回类型表示什么？与 void 有何区别？](docs/php/never返回类型与void的区别.md) |
| L1 | 中 | [PHP 的 union types（PHP 8.0）与交集类型（PHP 8.1）有何区别？各自有哪些使用约束？](docs/php/union_types与交集类型的区别与约束.md) |
| L3 | 中 | [PHP 请求生命周期的四个阶段](docs/php/PHP请求生命周期的四个阶段.md) |
| L3 | 中 | [Fiber 与 Generator 有栈协程与无栈协程的本质区别](docs/php/Fiber与Generator有栈协程与无栈协程的本质区别.md) |
| L3 | 中 | [Fiber 与 Swoole 协程的能力边界对比](docs/php/Fiber与Swoole协程的能力边界对比.md) |

> 更多题目持续产出中，按批次滚动更新。

---

### 数据结构与算法篇

| 难度 | 频率 | 题目 |
|:---:|:---:|---|
| L1 | 高 | [算法复杂度分析与 Big-O 表示法](docs/algorithm/算法复杂度分析与Big-O表示法.md) |
| L1 | 高 | [常见数据结构基础操作的时间复杂度是多少？](docs/algorithm/常见数据结构基础操作时间复杂度速查.md) |
| L1 | 高 | [双指针的两种形式：对撞指针与快慢指针](docs/algorithm/双指针的两种形式：对撞指针与快慢指针.md) |
| L1 | 高 | [原地移除数组中的指定元素（快慢指针）](docs/algorithm/原地移除数组中的指定元素（快慢指针）.md) |
| L1 | 高 | [固定大小滑动窗口求子数组最大和](docs/algorithm/固定大小滑动窗口求子数组最大和.md) |
| L1 | 中 | [双指针判断回文字符串](docs/algorithm/双指针判断回文字符串.md) |
| L2 | 高 | [链表翻转与 Floyd 环检测](docs/algorithm/链表翻转与Floyd环检测.md) |
| L3 | 中 | [二分查找的统一模板：搜索边界与答案二分](docs/algorithm/二分查找的统一模板与搜索边界.md) |
| L2 | 高 | [如何合并两条有序链表？](docs/algorithm/合并两条有序链表.md) |
| L2 | 高 | [如何用一次遍历删除链表倒数第 N 个节点？](docs/algorithm/删除链表倒数第N个节点.md) |
| L2 | 高 | [递归三要素是什么？如何分析递归的时间复杂度？](docs/algorithm/递归三要素与分治复杂度分析.md) |
| L2 | 高 | [快速排序与归并排序的原理、稳定性和复杂度如何比较？](docs/algorithm/快速排序与归并排序原理对比.md) |
| L2 | 高 | [哈希冲突的解决策略有哪些？如何用哈希表实现 LRU 缓存？](docs/algorithm/哈希冲突解决策略与LRU实现原理.md) |
| L3 | 高 | [0/1 背包的状态转移方程如何建立？滚动数组如何优化空间？](docs/algorithm/01背包的状态转移方程如何建立与空间如何优化.md) |
| L3 | 高 | [如何用动态规划求最长公共子序列并还原具体路径？](docs/algorithm/最长公共子序列的动态规划解法与路径还原.md) |
| L3 | 中 | [最长递增子序列（LIS）的 O(n²) 与 O(n log n) 算法有何区别？](docs/algorithm/最长递增子序列的两种算法及复杂度对比.md) |
| L3 | 中 | [记忆化搜索（自顶向下）与自底向上 DP 在实现和性能上有何区别？](docs/algorithm/记忆化搜索与自底向上DP的实现与性能对比.md) |

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
| L1 | 高 | [HTTP 缓存机制：强缓存与协商缓存的区别](docs/network/HTTP缓存机制强缓存与协商缓存的区别.md) |
| L1 | 高 | [HTTP 的无状态特性与会话保持方案](docs/network/HTTP无状态特性与会话保持方案.md) |
| L2 | 中 | [TCP 粘包的成因与应用层拆包方案](docs/network/TCP粘包的成因与应用层拆包方案.md) |
| L2 | 中 | [DNS 解析流程与 CDN 接入原理](docs/network/DNS解析流程与CDN接入原理.md) |
| L2 | 高 | [IO 模型：同步/异步与阻塞/非阻塞的区别](docs/network/IO模型同步异步与阻塞非阻塞的区别.md) |
| L2 | 高 | [PHP 网络并发与连接复用策略](docs/network/PHP网络并发与连接复用策略.md) |
| L3 | 高 | [epoll 为什么比 select/poll 性能好？IO 多路复用机制对比](docs/network/epoll与select-poll的机制对比.md) |
| L3 | 高 | [epoll 的水平触发（LT）与边缘触发（ET）有什么区别？](docs/network/epoll的LT与ET触发模式.md) |
| L3 | 高 | [Reactor 模式是如何工作的？与多线程模型相比优势在哪？](docs/network/Reactor模式与事件驱动模型原理.md) |

---

### 设计模式篇

| 难度 | 频率 | 题目 |
|:---:|:---:|---|
| L1 | 高 | [设计模式的三大分类与意图](docs/design-pattern/设计模式的三大分类与意图.md) |
| L2 | 高 | [工厂方法与抽象工厂的区别及选型](docs/design-pattern/工厂方法与抽象工厂的区别及选型.md) |
| L3 | 中 | [里氏替换原则的行为契约与继承陷阱](docs/design-pattern/里氏替换原则的行为契约与继承陷阱.md) |
| L1 | 高 | [Laravel 框架特性与 GoF 设计模式的对应关系](docs/design-pattern/Laravel框架特性与GoF设计模式的对应关系.md) |
| L1 | 高 | [Laravel Facade 命名陷阱——它是"静态代理"还是"门面模式"？](docs/design-pattern/Laravel-Facade命名陷阱——静态代理还是门面模式.md) |
| L2 | 高 | [PHP 单例模式为什么不需要处理线程安全？](docs/design-pattern/PHP单例模式为什么不需要处理线程安全.md) |
| L2 | 中 | [建造者模式如何解决复杂对象的构造问题？](docs/design-pattern/建造者模式如何解决复杂对象的构造问题.md) |
| L2 | 中 | [PHP clone 与原型模式：浅拷贝与深拷贝的实现差异](docs/design-pattern/PHP-clone与原型模式：浅拷贝与深拷贝的实现差异.md) |
| L3 | 高 | [OCP的设计哲学：隔离变化点而非冻结代码](docs/design-pattern/OCP的设计哲学：隔离变化点而非冻结代码.md) |
| L3 | 高 | [抽象类与接口的设计意图差异：PHP中的选型原则](docs/design-pattern/抽象类与接口的设计意图差异：PHP中的选型原则.md) |
| L3 | 高 | [SRP的变化理由原则：如何量化职责边界](docs/design-pattern/SRP的变化理由原则：如何量化职责边界.md) |

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

感谢所有为本项目提交过 PR / commit 的同学（头像由 GitHub 统计生成，点击可查看完整列表）：

<a href="https://github.com/colinlet/PHP-Interview-QA/graphs/contributors">
<img src="https://contrib.rocks/image?repo=colinlet/PHP-Interview-QA" alt="PHP-Interview-QA contributors" />
</a>

### 欢迎提 Issue 或 PR，贡献方式包括：

- 🐛 **勘误**：发现事实性错误、过时内容或失效链接
- 💡 **新题建议**：提议新的面试题目
- 🔬 **查证补充**：为标注「需查证」的内容提供权威来源
- 📊 **难度争议**：认为某题难度标注不准确
- 📈 **频率争议**：认为某题考察频率标注不准确

详细流程请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

## License

本项目基于 [Apache License 2.0](LICENSE) 开源。
