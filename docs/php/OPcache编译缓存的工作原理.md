---
title: OPcache 编译缓存的工作原理是什么？
difficulty: L3
frequency: 高
tags:
  - PHP
  - OPcache
  - 编译缓存
  - 性能优化
  - PHP-FPM
needs_verification: true
created: 2026-05-08
---

# [L3] OPcache 编译缓存的工作原理是什么？

#### 一句话结论

OPcache 将首次编译产生的 Opcodes 存入共享内存，后续请求跳过编译直接执行缓存。

#### 体系讲解

**原理：PHP 的编译流程**

PHP 在执行每个脚本前须经历完整编译链路：

```mermaid
flowchart LR
    A[".php 源码"] --> B["词法分析\nTokenization"]
    B --> C["Token 流"]
    C --> D["语法分析\nParsing"]
    D --> E["AST\n抽象语法树"]
    E --> F["编译\nCompilation"]
    F --> G["Opcodes\n操作码序列"]
    G --> H["Zend VM\n执行"]

    style G fill:#f9f,stroke:#333
    style H fill:#bbf,stroke:#333
```

编译是纯 CPU 密集型操作。对于不会变化的文件（生产环境的框架代码、业务代码），每次请求都重新编译是完全没有意义的浪费。

**OPcache 的介入点**

OPcache 在「生成 Opcodes」后、「Zend VM 执行前」拦截，将 Opcodes 序列化存入**共享内存（shared memory）**。后续请求到达时，OPcache 先检查共享内存中是否有有效缓存：

- **命中**：直接从共享内存取出 Opcodes，交由 Zend VM 执行，完全跳过编译链路
- **未命中**：重新编译，写入共享内存

**共享内存架构与 PHP-FPM 的关系**

PHP-FPM 运行时存在一个 master 进程和多个 worker 进程。OPcache 将共享内存映射到所有 worker 进程的地址空间中，使得：

- 同一份 Opcodes 只编译一次（通常由第一个处理该文件的 worker 完成）
- 其余所有 worker **共享读取**同一块物理内存，不需要各自维护副本
- 在内存层面，100 个 worker 的 OPcache 内存消耗与 1 个 worker 相近

> ⚠️ 需查证：以上共享内存模型的描述基于 PHP 官方文档 [opcache.memory_consumption](https://www.php.net/manual/en/opcache.configuration.php) 及 OPcache 扩展的公开行为，不涉及内部数据结构细节。

**缓存失效机制：开发 vs 生产的核心差异**

`validate_timestamps`（来源：[php.net/manual/en/opcache.configuration.php](https://www.php.net/manual/en/opcache.configuration.php)）控制 OPcache 是否主动检查文件变更：

| 配置 | 行为 | 适用场景 |
|---|---|---|
| `validate_timestamps=1`（默认开启）+ `revalidate_freq=2` | 每 2 秒检查一次文件 mtime；有变化则重新编译 | **开发环境**：代码频繁变更，需要及时生效 |
| `validate_timestamps=0` | 完全不检查文件变更，缓存永久有效直到手动清除 | **生产环境**：代码通过部署脚本更新，部署时调用 `opcache_reset()` 或重启 FPM |

**PHP 7.4+ Preload 机制**

`opcache.preload` 允许在 FPM master 进程启动时（请求进入前）预先将指定脚本加载到共享内存，使这些文件的 Opcodes 在第一个请求到达之前就已就绪。

```ini
opcache.preload=/var/www/html/preload.php
opcache.preload_user=www-data
```

Preload 的效果：框架核心类（如 Laravel 的 Container、Router 等）被永久驻留内存，不受 `validate_timestamps` 影响，也不会因 `opcache_reset()` 而失效，需重启 FPM 才能更新。

**Interned Strings（字符串驻留）**

OPcache 还负责管理 interned strings：PHP 运行时大量重复出现的字符串常量（函数名、类名、字符串字面量等）在共享内存中只存储一份，所有 worker 共享指向同一地址，减少重复分配。

> ⚠️ 需查证：interned strings 的概念来源于 [opcache.interned_strings_buffer](https://www.php.net/manual/en/opcache.configuration.php#ini.opcache.interned-strings-buffer) 配置的官方文档说明，内部实现细节不在本题范围内。

#### 考察意图

- 考察候选人是否理解 PHP 完整编译流程，而非仅知道「OPcache 能提速」
- 验证是否理解共享内存模型与 PHP-FPM 多进程的关系
- 考察生产环境与开发环境的缓存策略差异，以及部署时的失效操作

#### 追问链

1. 生产环境部署新代码后，OPcache 缓存如何清除？

   简答：有三种方式。① 重启 PHP-FPM（最彻底，但会中断正在处理的请求）；② 调用 `opcache_reset()`（通过一个 Web 请求执行，清除所有缓存）；③ 调用 `opcache_invalidate($file, true)`（只清除指定文件的缓存，精细化控制）。CI/CD 流程中常见做法是部署完成后发一个 HTTP 请求触发 `opcache_reset()`，或使用 PHP-FPM 的 graceful reload（`USR2` 信号）。

2. 为什么生产环境推荐将 `validate_timestamps` 设为 `0`？有什么风险？

   简答：`validate_timestamps=0` 避免每次请求检查 mtime，消除文件系统 I/O 开销，OPcache 命中率接近 100%。风险在于：部署新代码后如果忘记清除 OPcache，线上仍会执行旧代码。因此必须在部署流程中明确包含缓存清除步骤。

3. Preload 与普通 OPcache 缓存有什么本质区别？

   简答：普通 OPcache 缓存由「第一次被请求执行的 worker」触发编译并写入，有冷启动问题（重启 FPM 后首批请求需要重新编译）。Preload 在 FPM master 启动时执行，不需要等待请求触发，且 preload 的内容不会因 `opcache_reset()` 失效（只能重启 FPM 清除）。代价是 preload 文件列表是静态的，框架升级时需要修改 preload 脚本。

4. `opcache_get_status()` 能观察到哪些关键信息？

   简答：返回数组包含：`opcache_enabled`（是否启用）、`memory_usage`（已用/空闲/浪费内存，浪费比例过高意味着需要 `opcache_reset()`）、`opcache_statistics`（命中次数、未命中次数、命中率、缓存的脚本数量）。生产环境应定期监控命中率，通常健康值 > 99%。

#### 易错点

1. **以为重启 Nginx 能清除 OPcache**：OPcache 是 PHP-FPM 的扩展，存储在 FPM 进程的共享内存中。重启 Nginx 只影响反向代理层，PHP-FPM 进程和其共享内存不受影响。清除 OPcache 必须针对 PHP-FPM（重启或调用 `opcache_reset()`）。

2. **误以为 `validate_timestamps=1` 是每次请求都重新编译**：`validate_timestamps=1` 配合 `revalidate_freq=N` 时，只在上次验证超过 N 秒后才检查文件 mtime，并非每次请求都检查。设为 `revalidate_freq=0` 才是每次请求都验证（完全不缓存效果，通常不建议）。

3. **忽略 `opcache.memory_consumption` 与 `opcache.interned_strings_buffer` 的关系**：interned strings 的内存从 `memory_consumption` 总量中划拨，而非独立分配。若两者设置不合理（如 `memory_consumption=64M` 但 `interned_strings_buffer=32M`），留给 Opcodes 缓存的内存只剩 32 MB，大型框架可能因内存不足而频繁驱逐缓存（来源：[php.net 官方文档用户评注](https://www.php.net/manual/en/opcache.configuration.php)）。

#### 代码示例

```php
<?php
// 查看 OPcache 运行状态（生产环境监控）
$status = opcache_get_status(include_scripts: false);

echo "命中率: " . round(
    $status['opcache_statistics']['hits']
    / ($status['opcache_statistics']['hits'] + $status['opcache_statistics']['misses'])
    * 100, 2
) . "%\n";

echo "缓存脚本数: " . $status['opcache_statistics']['num_cached_scripts'] . "\n";
echo "内存使用: " . round($status['memory_usage']['used_memory'] / 1024 / 1024, 1) . " MB\n";
echo "内存浪费: " . round($status['memory_usage']['wasted_memory'] / 1024 / 1024, 1) . " MB\n";

// 部署脚本：精细化失效单个文件（避免全量 reset 影响正在服务的请求）
opcache_invalidate('/var/www/html/src/Service/UserService.php', force: true);

// 全量清除（重新部署后）
opcache_reset();
```

```ini
; php.ini — 生产环境推荐配置（来源：php.net/manual/en/opcache.configuration.php）
opcache.enable=1
opcache.memory_consumption=256
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=20000
opcache.validate_timestamps=0      ; 生产关闭自动验证，部署时手动清除
opcache.save_comments=1            ; 保留注释（Doctrine/PHPUnit 等框架依赖注解）
opcache.preload=/var/www/html/preload.php  ; PHP 7.4+
opcache.preload_user=www-data
```
