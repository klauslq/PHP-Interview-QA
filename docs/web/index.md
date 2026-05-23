# Web 篇

## L1 初级

| 频率 | 题目 |
|:---:|---|
| 高 | [$_SERVER 超全局变量中有哪些常用字段？分别有什么用途？]($_SERVER超全局变量常用字段与用途.md) |
| 高 | [HTTP 301、302、307 重定向状态码有什么语义差异？如何选择？](HTTP301与302与307重定向的语义差异与选择.md) |
| 高 | [HTTP 常见状态码含义与 301 和 302 的区别](HTTP状态码含义与301和302的区别.md) |
| 高 | [PHP 主流框架对比与选型概览](PHP主流框架对比与选型概览.md) |
| 高 | [X-Forwarded-For 与 REMOTE_ADDR 有什么区别？如何在代理场景下获取真实客户端 IP？](X-Forwarded-For与REMOTE_ADDR的区别与代理IP获取.md) |
| 高 | [header() 函数的作用是什么？为什么调用前不能有任何输出？](header函数的作用与发送时机.md) |
| 中 | [ob_start() 如何解决 headers already sent 问题？输出缓冲机制是怎样工作的？](ob_start输出缓冲与header发送时机.md) |

## L2 中级

| 频率 | 题目 |
|:---:|---|
| 高 | [PHP 框架中间件机制与洋葱模型](PHP框架中间件机制与洋葱模型.md) |
| 高 | [PHP 框架请求生命周期各阶段职责与执行顺序是怎样的？](PHP框架请求生命周期与各阶段职责.md) |
| 高 | [PHP 框架路由是如何注册、匹配请求并提取 URI 参数的？](PHP框架路由注册匹配与参数提取机制.md) |
| 高 | [服务容器 bind、singleton、instance、make 各自的使用场景与区别是什么？](服务容器bind与singleton与instance的用法与选型.md) |

## L3 高级

| 频率 | 题目 |
|:---:|---|
| 高 | [Laravel 中间件 Pipeline 如何通过 array_reduce 构造洋葱式闭包链？](Laravel中间件Pipeline闭包链源码实现.md) |
| 高 | [Laravel 服务容器（IoC）的实现原理](Laravel服务容器IoC实现原理.md) |
| 高 | [ORM 链式查询如何逐步拼装 SQL？Active Record 与 Data Mapper 有何本质区别？Eager Loading 如何消除 N+1？](ORM链式查询构建与EagerLoading原理.md) |
| 高 | [框架事件系统如何注册监听器、分发事件？同步事件与队列事件的内部路径有何差异？](框架事件系统注册分发与队列事件实现原理.md) |
| 高 | [路由匹配如何通过前缀树结构与正则预编译实现高性能查找？](路由前缀树与正则预编译及路由缓存原理.md) |
