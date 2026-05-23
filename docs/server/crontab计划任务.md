---
title: crontab 计划任务——表达式语法、环境变量陷阱、日志与调试
difficulty: L1
frequency: 高
tags: [Linux, crontab, 计划任务, 运维]
needs_verification: false
created: 2026-05-23
---

# [L1] crontab 计划任务——表达式语法、环境变量陷阱、日志与调试

#### 一句话结论

crontab 五字段定时执行命令，注意 PATH 缺失和输出重定向，用邮件或日志文件调试。

#### 体系讲解

**表达式语法**

```
分 时 日 月 周  命令
*  *  *  *  *  command
```

| 字段 | 取值范围 | 特殊字符 |
|---|---|---|
| 分钟 | 0–59 | `*` `,` `-` `/` |
| 小时 | 0–23 | 同上 |
| 日 | 1–31 | 同上 |
| 月 | 1–12 | 同上 |
| 周 | 0–7（0 和 7 均为周日） | 同上 |

常用示例：

| 表达式 | 含义 |
|---|---|
| `*/5 * * * *` | 每 5 分钟 |
| `0 2 * * *` | 每天 02:00 |
| `0 8 * * 1` | 每周一 08:00 |
| `0 0 1 * *` | 每月 1 日 00:00 |
| `0 */6 * * *` | 每 6 小时整点 |

**环境变量陷阱**

cron 的执行环境极其精简，`PATH` 仅为 `/usr/bin:/bin`，不含 `/usr/local/bin`（PHP、Composer 常装在此处）。常见后果：

- `php` 命令找不到 → 用绝对路径 `/usr/bin/php` 或 `/usr/local/bin/php`
- `composer`、`artisan` 命令失败
- 不读取 `~/.bashrc` / `~/.profile`，需在 crontab 顶部显式声明：

```
SHELL=/bin/bash
PATH=/usr/local/bin:/usr/bin:/bin
MAILTO=""
```

**日志与调试**

```bash
# 将 stdout + stderr 写入日志文件
*/5 * * * * /usr/bin/php /var/www/artisan schedule:run >> /var/log/cron-artisan.log 2>&1

# 不想收邮件：丢弃所有输出
*/5 * * * * /script.sh > /dev/null 2>&1

# 查看系统 cron 执行记录（Ubuntu/Debian）
grep CRON /var/log/syslog | tail -20

# 查看系统 cron 执行记录（CentOS/RHEL）
grep CRON /var/log/cron | tail -20
```

#### 考察意图

考察候选人能否独立配置 PHP 定时任务（如 Laravel Schedule），以及遇到"手动跑正常、cron 跑失败"时的排查思路。

#### 追问链

1. **为什么同一条命令在终端执行正常，cron 却报错"command not found"？**
   cron 的 `PATH` 比 shell 登录环境少很多目录，终端依赖 `~/.bashrc` 展开的路径在 cron 中不存在；解决方案是在 crontab 顶部设置 `PATH`，或在命令中使用绝对路径。

2. **如何确认 cron 任务是否被触发？**
   查看 `/var/log/syslog`（Debian 系）或 `/var/log/cron`（RHEL 系）中的 CRON 条目；若任务输出重定向到日志文件，检查日志时间戳；也可用 `systemctl status cron` / `crond` 确认进程在运行。

3. **`> /dev/null 2>&1` 和 `&> /dev/null` 有什么区别？**
   两者效果相同，均丢弃 stdout 和 stderr；`&>` 是 bash 4+ 的简写，POSIX sh 不支持，crontab 默认 `/bin/sh` 时需要用 `> /dev/null 2>&1` 以保证兼容性。

4. **cron 任务重叠执行（上一次还没跑完，下一次又触发）怎么防止？**
   使用 `flock` 文件锁：`* * * * * flock -n /tmp/job.lock /usr/bin/php /var/www/artisan schedule:run`；或在脚本内部检查 PID 文件。

#### 易错点

- **命令中的 `%` 需要转义**：crontab 中 `%` 是换行符特殊字符，用于传递多行标准输入；命令中含 `%` 的字符串（如 `date +%Y-%m-%d`）必须写成 `date +\%Y-\%m-\%d`，否则被截断。
- **日和周字段同时指定时是"或"关系**：`0 8 1 * 1` 表示"每月 1 日 OR 每周一 08:00"，而非"每月第一个周一"；如需后者，需在脚本内判断。
- **时区依赖系统时区**：cron 使用系统时区（`/etc/timezone`），Docker 容器默认 UTC；部署时未对齐时区会导致任务在错误时刻触发。

#### 代码示例

```bash
# 编辑当前用户的 crontab
crontab -e

# crontab 文件示例（顶部声明环境变量）
SHELL=/bin/bash
PATH=/usr/local/bin:/usr/bin:/bin
MAILTO=""

# 每天 03:00 执行 PHP 脚本并记录日志
0 3 * * * /usr/bin/php /var/www/html/artisan queue:restart >> /var/log/queue-restart.log 2>&1

# 每 5 分钟执行，使用 flock 防重叠
*/5 * * * * flock -n /tmp/schedule.lock /usr/bin/php /var/www/html/artisan schedule:run

# 列出当前用户所有 cron 任务
crontab -l
```
