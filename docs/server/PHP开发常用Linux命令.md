---
title: PHP 开发常用 Linux 命令：文件查找、进程与网络诊断
difficulty: L1
frequency: 高
tags: [Linux, 运维, grep, ps, netstat, find, 进程]
needs_verification: false
created: 2026-05-04
---

# [L1] PHP 开发常用 Linux 命令：文件查找、进程与网络诊断

#### 一句话结论

PHP 日常运维围绕三类命令：文件/日志查找、进程状态查看、网络端口诊断。

#### 体系讲解

**一、文件与日志查找**

| 命令 | 常用场景 | 示例 |
|---|---|---|
| `grep` | 在文件或输出中搜索文本 | `grep -rn "Fatal" /var/log/php/` |
| `grep -v` | 排除匹配行（反向过滤） | `grep -v "DEBUG" app.log` |
| `find` | 按名称/时间/大小查找文件 | `find /var/log -name "*.log" -mtime -1` |
| `tail -f` | 实时跟踪日志输出 | `tail -f /var/log/nginx/error.log` |
| `awk` | 按列提取/统计日志字段 | `awk '{print $1}' access.log \| sort \| uniq -c` |

**数据流重定向速查**

| 符号 | 含义 |
|---|---|
| `>` | 标准输出重定向（覆盖） |
| `>>` | 标准输出重定向（追加） |
| `2>` | 标准错误重定向 |
| `2>&1` | 将错误流合并到标准输出 |
| `\|` | 管道：将前一命令的输出传给下一命令 |

**二、进程管理**

| 命令 | 用途 | 常用参数 |
|---|---|---|
| `ps aux` | 查看所有进程快照 | `USER PID %CPU %MEM` 列含义最常被追问 |
| `top` / `htop` | 实时进程监控 | `P` 按 CPU 排序，`M` 按内存排序 |
| `kill -9 PID` | 强制终止进程 | `-9` 发送 SIGKILL，不可被忽略 |
| `kill -15 PID` | 优雅终止（默认） | `-15` 发送 SIGTERM，进程可捕获并清理 |
| `pgrep php-fpm` | 按名称查进程 PID | 等价于 `ps aux \| grep php-fpm \| grep -v grep` |

**三、网络诊断**

| 命令 | 用途 | 典型场景 |
|---|---|---|
| `netstat -tlnp` | 查看监听端口及占用进程 | 确认 Nginx/PHP-FPM 是否正常监听 |
| `ss -tlnp` | 同上，更现代（替代 netstat） | 推荐在新系统使用 |
| `curl -I URL` | 查看 HTTP 响应头 | 验证接口是否通、状态码、重定向 |
| `curl -v URL` | 详细请求/响应过程 | 调试 HTTPS 握手、Header 传递 |
| `lsof -i :9000` | 查看占用端口的进程 | PHP-FPM 默认监听 9000 |

#### 考察意图

考查候选人的服务器基本操作能力；PHP 开发者虽非运维，但日常排查部署问题、查日志、查端口必须熟练；
区分"只会写代码"和"能独立上服务器定位问题"的候选人。

#### 追问链

1. **如何快速找到 PHP 错误日志里最近 5 分钟内出现的 `Fatal error`？**  
   简答：`find /var/log -name "*.log" -mmin -5 -exec grep -l "Fatal error" {} \;` 先找最近修改的日志，再过滤关键词；或直接 `tail -f /var/log/php/error.log | grep "Fatal"`。

2. **`kill -9` 和 `kill -15` 有什么区别？PHP-FPM 重启应该用哪个？**  
   简答：`-15`（SIGTERM）是优雅停止，PHP-FPM 会等待当前请求处理完再退出；`-9`（SIGKILL）强制杀死，可能导致正在处理的请求中断。PHP-FPM 重启应用 `systemctl reload php-fpm` 或 `kill -USR2 <master-pid>`（触发优雅重载）。

3. **`ps aux | grep php-fpm | grep -v grep` 中 `grep -v grep` 的作用是什么？**  
   简答：`grep php-fpm` 本身也会出现在进程列表中（因为 grep 命令包含 "php-fpm" 字符串），`-v grep` 过滤掉 grep 自身进程，避免误计数。

4. **Linux 目录结构中，PHP 相关的配置/日志通常在哪里？**  
   简答：`/etc/php/`（配置文件）、`/var/log/php/` 或 `/var/log/nginx/`（日志）、`/var/run/php/`（PID/Socket 文件）、`/usr/lib/php/`（扩展库）——具体路径因发行版（Ubuntu/CentOS）和安装方式而异。

#### 易错点

1. **`grep` 递归时忘加 `-r`**：`grep "keyword" /var/log/` 只搜索目录本身（报错），必须用 `grep -r "keyword" /var/log/` 才能递归搜索子目录。
2. **`netstat` 在新系统中不可用**：Ubuntu 20.04+ 默认不安装 `net-tools`（含 netstat），应改用 `ss -tlnp`；面试提到 netstat 时可顺带说明这个迁移背景。
3. **`2>&1` 的顺序陷阱**：`cmd > file 2>&1` 正确（先重定向 stdout 到 file，再将 stderr 指向 stdout）；`cmd 2>&1 > file` 错误（stderr 仍输出到终端，stdout 才写入 file）。

#### 代码示例

```bash
# 实时监控 PHP 错误日志（过滤 DEBUG 级别）
tail -f /var/log/php/error.log | grep -v "DEBUG"

# 找出过去 10 分钟内修改过的 PHP 文件
find /var/www -name "*.php" -mmin -10

# 统计 Nginx access.log 中各 HTTP 状态码出现次数
awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -rn

# 查看 PHP-FPM 是否在监听 9000 端口，以及由哪个进程占用
ss -tlnp | grep 9000

# 优雅重载 PHP-FPM（不中断正在处理的请求）
kill -USR2 $(cat /var/run/php/php8.1-fpm.pid)
```
