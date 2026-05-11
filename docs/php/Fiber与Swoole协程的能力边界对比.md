---
title: Fiber 与 Swoole 协程的能力边界对比
difficulty: L3
frequency: 中
tags: [Fiber, Swoole, 协程, 异步 I/O, 并发模型, PHP 8.1]
needs_verification: true
created: 2026-05-11
---

# [L3] Fiber 与 Swoole 协程的能力边界对比

#### 一句话结论

PHP Fiber 是语言级协程原语，不干预 I/O 调用，需配合事件循环才能实现非阻塞；Swoole 协程通过 C 扩展级 Hook 将阻塞 I/O 替换为非阻塞实现，可透明化改造同步代码。

#### 体系讲解

**PHP Fiber：语言原语，只管"切换"**

Fiber（PHP 8.1+）是纯语言级的协程切换原语。它提供的能力只有一件事：**暂停当前执行单元，将控制权交给调用方**。

Fiber 本身**不了解、也不干预**任何 I/O 操作。在 Fiber 内部调用 `file_get_contents()`、`PDO::query()`、`sleep()` 等原生函数，这些调用依然是同步阻塞的——阻塞整个操作系统线程，不会触发任何协程调度。

**Fiber + 事件循环：手动协作**

要让 Fiber 实现非阻塞 I/O，需要：

1. 一个事件循环（如 [Revolt](https://revolt.run/) / [ReactPHP](https://reactphp.org/) / AMPHP v3），负责监听文件描述符就绪事件
2. 使用事件循环提供的**异步 I/O 原语**（而非 PHP 原生阻塞函数）发起 I/O
3. 在等待 I/O 时调用 `Fiber::suspend()`，将控制权交回事件循环；I/O 就绪后，事件循环调用 `$fiber->resume()` 恢复执行

```mermaid
sequenceDiagram
    participant Loop as 事件循环（Revolt）
    participant F1 as Fiber A（HTTP 请求）
    participant F2 as Fiber B（DB 查询）
    participant OS as 操作系统 I/O

    Loop->>F1: fiber->start()
    F1->>OS: 发起非阻塞 socket 连接
    F1->>Loop: Fiber::suspend()（等待连接就绪）
    Loop->>F2: fiber->start()
    F2->>OS: 发起非阻塞 DB 查询
    F2->>Loop: Fiber::suspend()（等待结果）
    OS-->>Loop: socket 就绪
    Loop->>F1: fiber->resume()
    F1->>Loop: 任务完成
    OS-->>Loop: DB 结果就绪
    Loop->>F2: fiber->resume()
```

这意味着：**代码中所有 I/O 操作都必须换用事件循环提供的异步版本**，无法透明使用 PHP 原生 I/O 函数。

**Swoole 协程：运行时 Hook，透明非阻塞**

Swoole 是一个 PHP C 扩展，其协程机制分两层：

1. **协程调度器**：内置的事件循环 + 有栈协程调度（与 Fiber 概念相同，但 Swoole 独立实现）
2. **I/O Hook 机制**：`Swoole\Runtime::enableCoroutine()` 在运行时替换一批 PHP 内置函数的底层实现

> ⚠️ 需查证：Swoole Hook 支持的函数列表随版本变化，以 [Swoole 官方文档 Runtime Hook](https://wiki.swoole.com/#/runtime) 为准。

开启 Hook 后，以下调用在 Swoole 协程环境中**自动变为非阻塞**：

- 网络：`stream_socket_*`、`curl_*`（部分）、PDO/MySQLi 查询
- 文件：`file_get_contents`（部分场景）
- 时间：`sleep()`、`usleep()`

当被 Hook 的函数等待 I/O 时，Swoole 调度器自动挂起当前协程，切换到其他可运行的协程，I/O 就绪后自动恢复——**调用方代码无需任何改动**。

**能力边界对比**

| 维度 | PHP Fiber + 事件循环 | Swoole 协程 |
|------|-------------------|------------|
| 协程切换原语 | 语言内置，PHP 8.1+ | C 扩展实现，不依赖 Fiber |
| I/O 非阻塞化方式 | 手动换用异步 I/O 库 | `enableCoroutine()` 透明 Hook |
| 原生 PHP I/O 可用性 | ❌ 原生函数仍阻塞 | ✅ 被 Hook 后透明非阻塞 |
| 代码改造成本 | 较高（需替换 I/O 调用） | 较低（存量代码可能直接受益） |
| 运行环境要求 | 纯 PHP 8.1+，无额外扩展 | 需安装 Swoole 扩展 |
| 生态兼容性 | 与 Laravel/Symfony 原生兼容 | 需注意框架/扩展对常驻内存的适配 |
| 协程间通信 | 通过事件循环 + Channel 库 | `Swoole\Coroutine\Channel` 内置 |
| 典型使用场景 | Revolt/AMPHP v3/ReactPHP 生态 | Hyperf、Swoole HTTP Server |

**结论：选型边界**

- **PHP Fiber + Revolt/AMPHP**：适合无法引入 C 扩展的场景（共享主机、容器镜像约束），或需要与 Composer 生态深度集成（amphp/http-client、amphp/mysql 等）。代价是只能使用支持异步的 I/O 库。
- **Swoole 协程**：适合追求"最小代码改造量"的高并发服务，或已有大量同步代码需要渐进式异步化。代价是引入 C 扩展依赖，生命周期管理需额外适配。

#### 考察意图

- 验证候选人是否理解"协程切换原语"与"非阻塞 I/O 能力"是两件独立的事
- 考察候选人能否准确解释 Swoole Hook 机制的原理，而非简单说"Swoole 自带协程"
- 检验候选人在实际架构选型时，是否能基于改造成本、生态兼容等维度做出有依据的判断

#### 追问链

1. **在 Fiber 中直接调用 `sleep(3)` 会发生什么？**

   简答：`sleep(3)` 会阻塞整个操作系统线程 3 秒，不会触发任何协程调度。事件循环在这 3 秒内完全停止运行，其他等待中的 Fiber 无法得到执行。正确做法是使用事件循环提供的异步 delay（如 Revolt 的 `EventLoop::delay(3.0, fn() => ...)`）。

2. **Swoole `enableCoroutine()` 的 Hook 是如何在底层实现的？**

   简答：⚠️ 需查证（具体实现以 Swoole 源码为准）。Swoole 通过 PHP 的 `zend_function` 替换机制，在运行时将目标函数的实现指针替换为 Swoole 自己的非阻塞版本。当被 Hook 的函数遇到 I/O 等待时，Swoole 向调度器注册一个 epoll 事件，挂起当前协程并切换到下一个可运行协程，I/O 就绪后恢复。

3. **Revolt 事件循环如何驱动 Fiber 调度？**

   简答：Revolt 是基于 Fiber 构建的事件循环库（PHP 8.1+）。每个 Revolt 的"协程"实际上是一个 Fiber 实例。事件循环通过 `epoll/libuv` 监听 I/O 就绪事件；当某个 Fiber 等待 I/O 时调用 `Fiber::suspend()` 交出控制权；事件循环在收到 I/O 就绪通知后调用对应 Fiber 的 `resume()` 恢复执行。整个流程形成一个协作式调度循环。

4. **可以在 Swoole 协程环境中使用 PHP Fiber 吗？**

   简答：⚠️ 需查证（兼容性以 Swoole 具体版本为准）。Swoole 有自己的协程调度器，与 PHP Fiber 是两套独立的栈切换机制。在同一运行时混用可能导致调度冲突。建议以实际测试为准，不推荐在 Swoole 协程上下文中手动创建原生 Fiber。

#### 易错点

1. **认为"用了 Fiber 就能做非阻塞 I/O"**：Fiber 本身只是协程切换原语，不 Hook 任何系统调用。Fiber 中调用 `PDO::query()` 依然同步阻塞整个线程。非阻塞 I/O 能力来自事件循环 + 异步 I/O 库，Fiber 只是让协程切换更方便。

2. **认为 Swoole 协程和 PHP Fiber 是同一机制的两种实现**：PHP Fiber 是语言内置的有栈协程原语（PHP 8.1+）；Swoole 协程是 C 扩展独立实现的协程调度器，诞生时间早于 Fiber，两者底层机制不同，不能直接互换。Swoole 5.x 开始引入对 Fiber 的兼容支持，但使用场景仍有差异。

3. **混淆"协作式调度"与"非阻塞 I/O"**：协作式调度是调度策略（协程主动让出控制权）；非阻塞 I/O 是操作系统 I/O 模型（不等待 I/O 完成即返回）。两者解决不同层面的问题，需要配合使用才能实现真正的高并发异步。单独使用 Fiber 做协作式调度，但 I/O 仍是阻塞的，并发效果有限。

#### 代码示例

```php
<?php

// ——— 方案 A：PHP Fiber + Revolt 事件循环（需 revolt/event-loop 包）———
// 使用 \Revolt\EventLoop::delay() 替换阻塞 sleep()，Fiber 真正让出线程

use Revolt\EventLoop;

EventLoop::queue(function (): void {
    $fiber = new Fiber(function (): void {
        echo "[Fiber A] start\n";
        // 正确：使用事件循环的 delay，不阻塞线程
        $suspension = EventLoop::getSuspension();
        EventLoop::delay(1.0, fn() => $suspension->resume());
        $suspension->suspend();
        echo "[Fiber A] resumed after 1s\n";
    });
    $fiber->start();
});

EventLoop::queue(function (): void {
    echo "[Main queue] running concurrently with Fiber A\n";
});

EventLoop::run();

// ——— 方案 B：Swoole 协程（需 Swoole 扩展，enableCoroutine 自动 Hook sleep）———

// Swoole\Runtime::enableCoroutine(); // 开启 Hook：sleep/PDO/curl 等自动非阻塞

Swoole\Coroutine\run(function (): void {
    go(function (): void {
        echo "[Co A] start\n";
        sleep(1); // 被 Hook：自动非阻塞，不阻塞线程，协程 A 挂起
        echo "[Co A] resumed after 1s\n";
    });

    go(function (): void {
        // 在协程 A 等待 1s 期间，协程 B 可以运行
        echo "[Co B] running while Co A sleeps\n";
    });
});
```
