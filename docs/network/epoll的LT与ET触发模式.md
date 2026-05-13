---
title: epoll 的水平触发（LT）与边缘触发（ET）有什么区别？
difficulty: L3
frequency: 高
tags: [epoll, LT, ET, 水平触发, 边缘触发, 非阻塞IO, 事件驱动, EAGAIN]
needs_verification: false
created: 2026-05-13
---

# [L3] epoll 的水平触发（LT）与边缘触发（ET）有什么区别？

#### 一句话结论

LT 只要缓冲区有数据就持续通知；ET 只在状态变化时通知一次，必须配合非阻塞 IO 循环读尽。

#### 体系讲解

**1. 两种触发模式的语义**

| 模式 | 触发时机 | 未读完的后果 | 默认行为 |
|---|---|---|---|
| **LT（Level-Triggered，水平触发）** | 只要内核缓冲区**仍有数据**，每次 `epoll_wait` 都会返回该 fd | 下次调用仍能收到通知，数据不丢失 | epoll 默认模式 |
| **ET（Edge-Triggered，边缘触发）** | 仅在缓冲区状态**从无数据变为有数据**时通知一次 | 若本次未读尽，不再通知，数据滞留在缓冲区直到下次写入触发新边缘 | 需显式设置 `EPOLLET` 标志 |

类比：
- **LT** ≈ 电灯的亮灭状态：灯亮着（缓冲区有数据），每次看都能看到
- **ET** ≈ 门铃：只在有人按（状态变化）时响一次，按完不再提醒

**2. ET 模式的正确使用方式**

由于 ET 只通知一次，必须在收到事件后**一次性读尽缓冲区所有数据**，否则残留数据无法触发下次通知。

```
ET 收到 EPOLLIN 后正确处理流程：

  将 fd 设为非阻塞（O_NONBLOCK）← 前置必要条件
         │
         ▼
  循环调用 read()
         │
    ┌────┴────┐
    │ 有数据  │  → 追加到 buf，继续循环
    └────┬────┘
         │
    read() 返回 -1 且 errno == EAGAIN
         │
         ▼
  缓冲区已读尽，退出循环，等待下次 EPOLLIN
```

**为什么必须非阻塞？**  
如果 fd 是阻塞模式，最后一次 `read()` 在缓冲区为空时会永久挂起（等待新数据），导致事件循环卡死。`O_NONBLOCK` 使 `read()` 在无数据时立即返回 `-1/EAGAIN`，是 ET 模式的硬性前提。

**3. 状态机对比**

```
场景：客户端发送 2KB 数据，服务端缓冲区一次只读 1KB

              ┌─ LT 模式 ─────────────────────────────┐
              │ 第1次 epoll_wait → 返回，read 1KB     │
              │ 第2次 epoll_wait → 仍返回，read 1KB   │  ← 缓冲区仍非空，持续通知
              └───────────────────────────────────────┘

              ┌─ ET 模式 ─────────────────────────────┐
              │ 第1次 epoll_wait → 返回，read 1KB     │
              │ 第2次 epoll_wait → 不返回！1KB 滞留   │  ← 只通知一次，未读尽则丢失通知
              │                                       │
              │ 正确做法：循环 read 直到 EAGAIN        │
              │  → 两次 read 共取 2KB，缓冲区清空      │
              └───────────────────────────────────────┘
```

**4. 两种模式的工程权衡**

| 维度 | LT | ET |
|---|---|---|
| **编程复杂度** | 低：任意时机读都能拿到数据 | 高：必须循环读到 EAGAIN，处理逻辑更复杂 |
| **通知次数** | 多（有数据时每轮都通知） | 少（仅在变化时通知一次） |
| **epoll_wait 调用开销** | 略高（活跃 fd 被反复加入就绪列表） | 略低（就绪列表更短） |
| **漏数据风险** | 低 | 高（未循环读尽会漏） |
| **典型使用者** | Redis（默认 LT，简单可靠） | Nginx（ET，减少通知次数，提升高并发吞吐） |

**5. Nginx 使用 ET 的原因**

Nginx 在 epoll 模式下使用 ET，配合严格的非阻塞循环读，以减少 `epoll_wait` 返回次数，降低事件循环的调度开销。其核心处理函数在收到读事件后会持续调用 `recv` 直至 `EAGAIN`，只有在读尽或缓冲区填满时才退出，这一设计使 Nginx 在海量连接下仍能保持极低的 CPU 占用。

#### 考察意图

考察候选人对 epoll 事件通知语义的理解深度，重点看能否说清：①ET 为何必须配合非阻塞 IO；②ET 漏通知的陷阱；③LT/ET 选型的工程权衡依据。这道题是区分"能背定义"与"真正理解机制"的典型分水岭。

#### 追问链

1. **ET 模式下，如果 fd 是阻塞的会发生什么？**  
   最后一次 `read()` 遇到空缓冲区时会永久阻塞，事件循环的其他 fd 得不到处理，整个服务卡死。这是 ET 必须非阻塞的根本原因——非阻塞保证 `read()` 在无数据时立即返回 EAGAIN 而非挂起。

2. **LT 下对同一个 fd 频繁读写是否有性能问题？**  
   LT 下未读完的 fd 会在每次 `epoll_wait` 中被加入就绪列表，若应用层处理速度跟不上，该 fd 会不断占用就绪槽位，影响其他 fd 的响应延迟。高吞吐场景下需控制每次读取量或引入 per-fd 读取限额（如 Nginx 的 `ngx_recv_chain`）。

3. **EPOLLONESHOT 标志与 ET 有什么关系？**  
   `EPOLLONESHOT` 使 fd 在触发一次事件后自动从 epoll 监听中移除，需手动 `epoll_ctl(MOD)` 重新激活。它解决的是多线程场景下同一 fd 被多个线程并发处理的竞态：触发后只有一个线程能收到事件，处理完毕再重新启用。与 ET 的区别在于：ET 限制通知频率（仅边缘），EPOLLONESHOT 限制通知次数（仅一次）。

4. **Redis 为什么选择 LT 而非 ET？**  
   Redis 是单线程事件循环，不存在多线程竞态；LT 编程模型更简单，不需要循环读到 EAGAIN，降低了出错概率。Redis 的事件处理速度极快（内存操作），LT 的额外通知开销在此场景下可忽略不计，简单可靠优先。

#### 易错点

1. **以为 ET 比 LT 快一倍**：ET 减少的是 `epoll_wait` 的返回次数，但每次返回后需要循环读尽，总的 `read()` 系统调用次数并不减少。ET 的真正收益是减少 `epoll_wait` 调用和就绪列表遍历开销，在极高并发下有意义，低并发场景下几乎感受不到差异。

2. **ET 下只 read 一次就返回**：这是最常见的实现错误。ET 通知的语义是"状态从无变有"，若一次 `read` 未取尽，剩余数据不会再触发通知，业务逻辑会挂起等待永远不来的事件。必须循环直到 `EAGAIN`。

3. **忘记 accept 也需要循环**：ET 模式下监听 socket 的 `EPOLLIN` 也遵循 ET 语义：一次通知可能对应多个待 accept 的连接（高并发时多个 SYN 同时到达）。若只调用一次 `accept`，剩余连接直到下次新连接到达才会被通知，造成连接延迟建立。

#### 代码示例

```php
// 本题核心是 C 系统调用级机制，以下用伪代码展示 ET 模式正确的循环读取逻辑
// 实际 PHP 实现需通过 Swoole 扩展的底层封装

// Swoole 中 ET 模式的 PHP 等效逻辑（Swoole 内部已封装正确的 ET 循环）
use Swoole\Coroutine\Socket;

Swoole\Coroutine\run(function () {
    $server = new Socket(AF_INET, SOCK_STREAM, 0);
    $server->bind('0.0.0.0', 8080);
    $server->listen(128);

    while (true) {
        $client = $server->accept();  // Swoole 协程在此挂起，底层 epoll ET 等待就绪

        Swoole\Coroutine::create(function () use ($client) {
            $buf = '';
            while (true) {
                // Swoole 底层：非阻塞循环读到 EAGAIN，对 PHP 层透明
                $data = $client->recv(4096, timeout: 1.0);
                if ($data === '' || $data === false) break;  // 连接关闭或超时
                $buf .= $data;
                if (str_contains($buf, "\r\n\r\n")) break;  // 读到完整请求头
            }
            $client->send("HTTP/1.1 200 OK\r\nContent-Length: 5\r\n\r\nHello");
            $client->close();
        });
    }
});
```

> 底层 C 伪代码（说明 ET 循环读取）：
> ```c
> // 设置非阻塞
> fcntl(fd, F_SETFL, O_NONBLOCK);
>
> // ET 事件处理
> while (true) {
>     ssize_t n = read(fd, buf, sizeof(buf));
>     if (n > 0) { process(buf, n); continue; }
>     if (n == -1 && errno == EAGAIN) break;  // 读尽，正常退出
>     if (n == 0 || (n == -1 && errno != EINTR)) { close(fd); break; }
> }
> ```
