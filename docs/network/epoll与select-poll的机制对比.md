---
title: epoll 为什么比 select/poll 性能好？IO 多路复用机制对比
difficulty: L3
frequency: 高
tags: [IO多路复用, epoll, select, poll, 事件驱动, 高并发, Linux内核]
needs_verification: true
created: 2026-05-13
---

# [L3] epoll 为什么比 select/poll 性能好？IO 多路复用机制对比

#### 一句话结论

select/poll 每次调用需 O(n) 遍历全部 fd；epoll 内核维护就绪列表，仅返回活跃 fd，O(1) 获取事件。

#### 体系讲解

**1. 三者的演进脉络**

```
select（1983, BSD）→ poll（1986, STREAMS）→ epoll（2002, Linux 2.5.44）
```

每一次演进都针对前一代的具体缺陷，理解演进逻辑是理解差异的最快路径。

**2. select 的设计与缺陷**

```c
// select 系统调用签名
int select(int nfds, fd_set *readfds, fd_set *writefds,
           fd_set *exceptfds, struct timeval *timeout);
```

| 问题 | 根源 |
|---|---|
| **fd 上限 1024** | `fd_set` 是定长位图，大小由编译期常量 `FD_SETSIZE`（通常 1024）决定 |
| **O(n) 返回后需全量扫描** | 内核仅设置就绪位，调用方必须遍历整个 `fd_set` 找出哪些就绪 |
| **每次调用都要从用户态拷贝** | `fd_set` 在用户空间维护，每次 `select()` 都需将其拷贝到内核，返回后内核修改副本再拷贝回来 |

**3. poll 的改进与残留缺陷**

```c
struct pollfd {
    int   fd;        // 要监听的 fd
    short events;    // 关注的事件（POLLIN/POLLOUT/POLLERR）
    short revents;   // 内核回填的就绪事件
};
int poll(struct pollfd *fds, nfds_t nfds, int timeout);
```

- ✅ **解除 fd 数量限制**：`pollfd` 是动态数组，不依赖位图，fd 数量仅受系统 `ulimit` 限制
- ❌ **仍需 O(n) 全量扫描**：内核回填 `revents` 后，调用方仍须遍历全部 `pollfd` 项找就绪的
- ❌ **仍有全量拷贝开销**：每次 `poll()` 仍需将整个 `pollfd` 数组在用户态与内核态之间来回拷贝

**4. epoll 的核心机制**

epoll 将"注册 fd"与"等待事件"分离为两个独立操作，彻底消除了全量拷贝与 O(n) 扫描。

```c
// 三个核心系统调用
int epoll_create1(int flags);                         // 在内核创建 epoll 实例
int epoll_ctl(int epfd, int op, int fd, ...);         // 增/删/改监听的 fd
int epoll_wait(int epfd, epoll_event *events,
               int maxevents, int timeout);           // 只阻塞，返回就绪的 fd 列表
```

> ⚠️ 需查证：epoll 的内核数据结构（红黑树 + 就绪链表）为广泛引用的实现描述，来源于 Linux 内核源码 `fs/eventpoll.c`，不同内核版本的具体实现可能有所调整。

内核内部维护两个关键结构（⚠️ 需查证）：

```
epoll 实例
├── 红黑树（rbr）：存储所有通过 epoll_ctl 注册的 fd 及其关注事件
│   └── 查找/插入/删除均为 O(log n)
└── 就绪链表（rdllist）：内核通过事件回调将就绪的 fd 挂入此链表
    └── epoll_wait 只需从此链表取，不扫描全量 fd
```

```
时序：
  epoll_ctl(ADD, fd)
       │
       ▼
  内核红黑树 ← 注册 fd，挂载事件回调
       │
  网卡数据到达 → 触发中断 → 回调把 fd 加入就绪链表
       │
  epoll_wait() ← 只从就绪链表取结果，O(1)
       │
       ▼
  返回 k 个就绪 fd（k << n）
```

**5. 三者核心差异对比**

| 维度 | select | poll | epoll |
|---|---|---|---|
| **fd 上限** | 1024（FD_SETSIZE） | 无硬限（受 ulimit） | 无硬限（受 ulimit） |
| **数据结构** | 位图（用户空间） | 数组（用户空间） | 红黑树 + 就绪链表（内核空间） |
| **fd 注册方式** | 每次调用重传全量 | 每次调用重传全量 | `epoll_ctl` 一次注册，持久有效 |
| **内核-用户拷贝** | 每次调用：O(n) | 每次调用：O(n) | 仅返回就绪 fd，O(k)，k = 就绪数 |
| **返回后扫描复杂度** | O(n) 全量遍历 | O(n) 全量遍历 | O(1)，直接取就绪列表 |
| **适合场景** | 少量连接（< 100）| 中等连接，跨平台兼容 | 海量长连接（万级以上） |
| **可移植性** | POSIX 标准，跨平台 | POSIX 标准，跨平台 | Linux 专有 |

**6. 为什么大量连接下 epoll 的优势才明显？**

- 连接数少（如 10 个）时，select/poll 的 O(n) 扫描代价可忽略，差异不大
- 连接数达到万级，且多数连接同时处于空闲状态时（如长连接推送），epoll 只处理少量活跃 fd，而 select/poll 每次调用都要遍历全部 fd — 差距在此场景呈数量级放大

#### 考察意图

考察候选人对 Linux IO 多路复用的演进脉络和底层实现机制的理解深度：能否说清 epoll 改进的是"哪个具体的操作"（注册与等待分离、就绪链表替代全量扫描），而非只背诵"epoll 更快"结论。

#### 追问链

1. **select 的 1024 限制如何绕过？代价是什么？**  
   修改 `FD_SETSIZE` 并重新编译内核或应用（需确保内存对齐）可提高上限，但每次调用的拷贝与扫描开销仍随 fd 数线性增长，治标不治本；生产中应直接改用 epoll。

2. **epoll 在连接数少但活跃度高的场景下有什么劣势？**  
   epoll 的 `epoll_ctl` 注册/删除有系统调用开销；短连接场景（如 HTTP/1.0，连接生命周期极短）中，频繁调用 `epoll_ctl` 的累积开销可能超过 poll 的全量扫描代价。因此 Web 压测工具等短连接密集场景有时仍用 poll。

3. **epoll 为什么不能跨平台（如 macOS 上无法用）？**  
   epoll 是 Linux 内核专有 API（2.5.44 引入）；macOS/BSD 系统提供功能类似的 `kqueue`，Windows 提供 IOCP（完成端口）。跨平台库（libuv、libevent）通过条件编译在不同 OS 上选择对应实现，对上层屏蔽差异。

4. **Nginx 和 Swoole 是如何利用 epoll 的？**  
   Nginx：Master-Worker 多进程，每个 Worker 内含一个事件循环，调用 `epoll_wait` 驱动请求处理，accept 通过 `SO_REUSEPORT` 或互斥锁分配给 Worker，避免惊群。Swoole：协程调度器底层即 epoll 事件循环，协程遇到 IO 挂起时，调度器切换到其他协程，IO 就绪后恢复，对业务代码透明。

#### 易错点

1. **以为 poll 解决了 epoll 的全部问题**：poll 只解除了 fd 上限，O(n) 全量扫描和每次调用的全量拷贝开销依然存在；epoll 的核心改进是"注册持久化 + 就绪链表"，两者性质不同。

2. **以为"fd 多就该用 epoll"**：epoll 的优势在于**活跃连接占比低**（大量空闲长连接）；如果所有 fd 几乎同时活跃（如文件批量读取），epoll 的 `epoll_ctl` 注册开销反而比 poll 高，差距并不明显。

3. **混淆 epoll 实例的作用域**：`epoll_create` 返回的 epfd 是文件描述符，可在进程间通过 `fork` 继承共享，但多个进程同时 `epoll_wait` 同一 epfd 会引发竞争（惊群问题）；正确做法是每个 Worker 维护独立的 epoll 实例。

#### 代码示例

本题核心是系统调用级机制，PHP 层无法直接调用 `epoll_ctl`/`epoll_wait`。以下用 PHP 的 `stream_select`（底层封装 select/poll/epoll，视平台而定）展示多路复用在 PHP 中的应用形态：

```php
// 用 stream_select 同时监听多个非阻塞 socket（底层由 libc 选择最优实现）
$server = stream_socket_server('tcp://0.0.0.0:8080', $errno, $errstr);
stream_set_blocking($server, false);

$clients = [];

while (true) {
    // 将 server socket 与所有客户端 socket 合并为监听集合
    $read = array_merge([$server], $clients);
    $write = $except = null;

    // stream_select 在 Linux 上底层调用 select()（PHP 未封装 epoll 直接调用）
    $ready = stream_select($read, $write, $except, seconds: 5);
    if ($ready === false) break;

    foreach ($read as $fd) {
        if ($fd === $server) {
            // 新连接到达
            $client = stream_socket_accept($server, timeout: 0);
            stream_set_blocking($client, false);
            $clients[(int)$client] = $client;
        } else {
            // 已有连接有数据可读
            $data = fread($fd, 4096);
            if ($data === '' || $data === false) {
                fclose($fd);
                unset($clients[(int)$fd]);
            } else {
                fwrite($fd, "Echo: {$data}");
            }
        }
    }
}
```

> 如需真正利用 epoll 的 O(1) 优势，应使用 Swoole（`Swoole\Event::add`）或 ReactPHP，它们在 Linux 上直接调用 epoll 系列 API。
