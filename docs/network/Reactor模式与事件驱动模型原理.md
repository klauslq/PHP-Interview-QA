---
title: Reactor 模式是如何工作的？与多线程模型相比优势在哪？
difficulty: L3
frequency: 高
tags: [Reactor, 事件驱动, epoll, 事件循环, Swoole, Nginx, 多线程, 高并发]
needs_verification: true
created: 2026-05-13
---

# [L3] Reactor 模式是如何工作的？与多线程模型相比优势在哪？

#### 一句话结论

Reactor 用单线程事件循环 + epoll 驱动 N 个连接，以避免 Thread-per-connection 的线程切换与内存开销。

#### 体系讲解

**1. 传统多线程模型（Thread-per-connection）的瓶颈**

最直觉的并发方案：每来一个连接，创建（或分配）一个线程处理。

```
客户端 1 → 线程 1 → [等待数据库] → [等待网络] → [计算] → 响应
客户端 2 → 线程 2 → [等待数据库] → [等待网络] → [计算] → 响应
...
客户端 N → 线程 N → 90% 时间在等待 IO，线程挂起中
```

问题量化：
- **内存**：Linux 线程默认栈大小 8MB，1 万连接 = 约 80GB 内存
- **上下文切换**：线程切换需保存/恢复寄存器、重建 CPU 缓存，每次约 1–10μs（⚠️ 需查证：实际值因硬件与内核版本而异）；1 万活跃线程时切换开销可占据 CPU 的相当比例
- **OS 调度器压力**：大量线程处于睡眠/唤醒状态，调度队列持续抖动

**2. Reactor 模式的核心思想**

> 将"等待 IO 就绪"的阻塞从应用线程剥离出去，交给内核（epoll）统一管理；应用线程只处理已就绪的事件。

**三个核心角色**：

| 角色 | 职责 |
|---|---|
| **Event Demultiplexer（事件分离器）** | 封装 `epoll_wait`，阻塞等待事件，返回就绪事件集合 |
| **Event Handler（事件处理器）** | 每种事件类型对应一个处理函数（接受连接/读数据/写数据/关闭） |
| **Reactor（调度核心）** | 持有 Demultiplexer，驱动事件循环，将就绪事件分发给对应 Handler |

**事件循环主体**：

```
              ┌───────────────────────────────────────┐
              │            Reactor 事件循环            │
              │                                       │
  注册 fd ───▶│  epoll_ctl(ADD, fd)                   │
              │         │                             │
              │  epoll_wait() ◀───── 阻塞直到有事件    │
              │         │                             │
              │   就绪事件列表 [fd1:READ, fd3:WRITE]  │
              │         │                             │
              │  分发给 Handler：                     │
              │   fd1 → on_read(fd1)                  │
              │   fd3 → on_write(fd3)                 │
              │         │                             │
              │  处理完毕 → 回到 epoll_wait            │
              └───────────────────────────────────────┘
```

**3. 单 Reactor 单线程 vs 多 Reactor 多线程**

纯单线程 Reactor 在 CPU 密集型任务下会成为瓶颈，工程实践中衍生出多种变体：

```
单 Reactor 单线程（Redis）
────────────────────────────────────
  Main Thread: [epoll] → [Handler] → [Handler] → ...
  优点：无锁，极简；缺点：Handler 阻塞会影响全局

单 Reactor 多线程（ThreadPool Reactor）
────────────────────────────────────
  Main Thread: [epoll] → 分发事件
  Worker Thread Pool: [Handler] [Handler] [Handler]
  优点：计算密集型任务不阻塞事件循环
  缺点：主线程 accept + 分发仍是单点

多 Reactor 多线程（Nginx / Swoole Worker 模式）
────────────────────────────────────
  Main Reactor: accept 新连接，分发给 Sub Reactor
  Sub Reactor 1: [epoll] → [Handler] （一批连接）
  Sub Reactor 2: [epoll] → [Handler] （另一批连接）
  ...
  优点：accept 与 IO 处理均可横向扩展，无单点
```

**4. Reactor 在 PHP 生态中的体现**

| 框架 | Reactor 实现 | 特点 |
|---|---|---|
| **Swoole** | 多 Reactor 多线程（`reactor_num` 配置）+ 协程调度 | PHP 层写同步代码，底层 Reactor 驱动异步 IO |
| **ReactPHP** | 单 Reactor 单线程（`EventLoop`），基于 PHP 的 `ext-event` 或 `stream_select` | 纯 PHP 实现，无法利用多核，适合 IO 密集型低并发 |
| **PHP-FPM** | 无 Reactor，BIO + 多进程 | 每进程同步阻塞，并发上限 = 进程数 × 请求速度 |

**5. Thread-per-connection vs Reactor 量化对比**

| 场景 | Thread-per-connection | Reactor |
|---|---|---|
| 10K 长连接（90% 空闲） | ~80GB 线程栈内存，持续上下文切换 | 单进程 < 100MB，epoll 空闲连接零开销 |
| CPU 密集型任务（如图像处理） | 多线程可并行利用多核 | 单线程 Reactor 被阻塞；需配合线程池 |
| IO 密集型（数据库/缓存等待） | 线程大量睡眠，内存浪费 | Reactor 天然适合，几乎无等待开销 |
| 编程模型 | 同步直观，调试简单 | 事件驱动，回调/协程，学习曲线较高 |

#### 考察意图

考察候选人能否将 epoll 底层机制（就绪通知）与上层架构模式（Reactor）打通，并量化说明多线程模型的具体瓶颈（内存 / 上下文切换）。能否将这一模式与 PHP 生态（FPM vs Swoole）的选型决策关联，是考察是否真正理解技术选型依据的关键。

#### 追问链

1. **Reactor 模式能利用多核 CPU 吗？**  
   单线程 Reactor 无法利用多核（Redis 的解法是用多个独立 Redis 实例）；多 Reactor 多线程（Nginx Worker 模式，每个 Worker 一个 Reactor 绑定独立 CPU 核）可充分利用多核。Swoole 通过 `reactor_num` 控制 Sub Reactor 数量，`worker_num` 控制业务 Worker 数量，Reactor 负责 IO，Worker 负责业务逻辑，职责分离。

2. **协程与 Reactor 是什么关系？**  
   协程是 Reactor 在应用层的编程抽象。Reactor 的本质是事件驱动回调，回调嵌套导致逻辑割裂（"回调地狱"）；协程将事件驱动的异步逻辑包装成同步写法——协程遇到 IO 时将 fd 注册到 Reactor 后挂起（让出控制权），IO 就绪后由 Reactor 恢复协程，对业务代码透明。Swoole/Fiber 的本质都是在 Reactor 之上加了用户态调度器。

3. **Nginx 的"惊群问题"是什么，如何解决的？**  
   多个 Worker 同时 `epoll_wait` 监听同一监听 socket 时，一个新连接到达会唤醒所有 Worker，但只有一个能成功 `accept`，其余立即返回继续等待，造成无效唤醒（惊群）。解决方案：Nginx 通过进程锁（`accept_mutex`，nginx ≤1.9.0）或 Linux 4.5+ 的 `SO_REUSEPORT`（内核在多个 socket 间负载均衡，彻底消除惊群）解决。

4. **PHP-FPM 为什么不使用 Reactor 模式？**  
   PHP-FPM 的设计目标是复用传统同步 PHP 脚本，每个 Worker 进程生命周期对应一个请求，无需维护连接状态；Reactor 要求代码以非阻塞/事件回调形式组织，与 PHP 同步阻塞的扩展生态（PDO/mysqli 默认阻塞）不兼容。采用 Reactor 需要重写全部 IO 层，代价远高于多进程的线性扩容。

#### 易错点

1. **以为 Reactor = 单线程**：Reactor 是设计模式，描述"事件循环 + 分发"的结构，不限制线程数。多 Reactor 多线程是工业界主流实现（Nginx、Netty）；"单线程"是最简单的 Reactor 实例，不是 Reactor 的定义。

2. **以为事件驱动一定比多线程快**：事件驱动在 IO 密集型场景（大量等待、少量计算）下有明显优势；CPU 密集型场景（如加密、压缩）下，单线程 Reactor 会被计算任务阻塞，反而不如多线程并行计算。正确选型依赖负载特征分析，而非盲目追求"事件驱动"。

3. **混淆 Reactor 与 Proactor**：Reactor 收到"fd 就绪"通知后，应用仍需主动调用 `read()` 完成数据拷贝（同步）；Proactor 收到"数据已拷贝完成"通知，应用直接处理数据（异步，如 Windows IOCP / `io_uring`）。PHP 生态中 Swoole 基于 Reactor（epoll）而非 Proactor。

#### 代码示例

```php
// 用 ReactPHP 演示单 Reactor 事件循环结构（纯 PHP，底层基于 stream_select 或 ext-event）
// composer require react/event-loop react/socket

require 'vendor/autoload.php';

$loop = React\EventLoop\Loop::get();  // Reactor 核心：事件循环

$server = stream_socket_server('tcp://0.0.0.0:8080', $errno, $errstr);
stream_set_blocking($server, false);

// 注册 read 事件处理器（相当于 epoll_ctl + 注册 Handler）
$loop->addReadStream($server, function ($server) use ($loop) {
    $client = stream_socket_accept($server, timeout: 0);
    stream_set_blocking($client, false);

    // 为新连接注册独立的读事件
    $loop->addReadStream($client, function ($client) use ($loop) {
        $data = fread($client, 4096);
        if ($data === '' || $data === false) {
            $loop->removeReadStream($client);  // 注销事件
            fclose($client);
            return;
        }
        // 注册写事件，等缓冲区可写时再发送（非阻塞写）
        $response = "HTTP/1.1 200 OK\r\nContent-Length: 5\r\n\r\nHello";
        $loop->addWriteStream($client, function ($client) use ($loop, $response) {
            fwrite($client, $response);
            $loop->removeWriteStream($client);
            fclose($client);
        });
    });
});

echo "Reactor 事件循环启动，监听 :8080\n";
$loop->run();  // 进入事件循环：内部持续调用 epoll_wait/select，分发就绪事件
```
