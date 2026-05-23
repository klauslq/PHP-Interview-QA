---
title: sed 流编辑器常用操作——行定址、s 替换、与 awk 的职责分工
difficulty: L1
frequency: 中
tags: [Linux, sed, awk, 文本处理]
needs_verification: false
created: 2026-05-23
---

# [L1] sed 流编辑器常用操作——行定址、s 替换、与 awk 的职责分工

#### 一句话结论

sed 按行流式编辑文本，s 替换是核心命令，复杂结构化提取才换 awk。

#### 体系讲解

**工作模型**

sed 逐行读取输入，每行依次经过所有命令后输出；默认不修改原文件，加 `-i` 才原地修改（macOS 需 `-i ''`）。

**行定址**

| 定址形式 | 含义 |
|---|---|
| `5` | 第 5 行 |
| `2,8` | 第 2 到第 8 行 |
| `$` | 最后一行 |
| `/pattern/` | 匹配正则的行 |
| `2,/end/` | 从第 2 行到第一个匹配 /end/ 的行 |
| `0,/pattern/` | 从文件头到第一次匹配（GNU sed） |

**s 替换命令**

```
s/regexp/replacement/flags
```

常用 flag：

| flag | 含义 |
|---|---|
| `g` | 替换行内所有匹配 |
| `I` / `i` | 大小写不敏感（GNU sed） |
| `p` | 打印替换后的行（配合 `-n` 只输出命中行） |
| `2` | 仅替换第 2 个匹配 |

**常用操作速查**

```bash
# 删除空行
sed '/^$/d' file.txt

# 在第 3 行后插入一行
sed '3a\新内容' file.txt

# 原地替换（Linux）
sed -i 's/foo/bar/g' config.php

# 只打印包含 error 的行（类 grep）
sed -n '/error/p' app.log
```

**与 awk 的职责分工**

| 工具 | 擅长场景 |
|---|---|
| `sed` | 流式替换、删除、插入，单列或全行变换，行选择 |
| `awk` | 多字段拆分、条件计算、聚合统计、格式化输出 |

经验原则：**单次行级变换用 sed，需要字段/列计算用 awk**。

#### 考察意图

考察候选人日常运维能力：上线后快速修改配置文件、批量处理日志，以及能否区分 sed/awk 的使用边界，避免用错工具。

#### 追问链

1. **`sed -i` 在 macOS 和 Linux 上有什么差异？**
   macOS 的 `sed` 是 BSD 版本，`-i` 必须带备份后缀参数，即使不备份也要写空字符串：`sed -i '' 's/foo/bar/g' file`；Linux（GNU sed）可以直接 `sed -i 's/foo/bar/g' file`。

2. **如何用 sed 删除文件的第 1 行（常见 CSV 去表头场景）？**
   `sed -i '1d' data.csv`；若不想修改原文件：`sed '1d' data.csv > data_no_header.csv`。

3. **sed 可以处理多行模式（如跨行替换）吗？**
   可以，但较复杂：用 `N` 命令将下一行追加到模式空间，再做替换；更复杂的跨行场景通常改用 `perl -0777 -pe 's/pattern/replacement/gs'`。

4. **什么情况下应该放弃 sed 改用 awk 或 perl？**
   需要按字段（列）计算、条件判断、累加求和、关联数组等结构化操作时换 awk；需要正则回溯、复杂捕获组或多行处理时换 perl。

#### 易错点

- **忘记 `-i` 备份原文件**：直接 `sed -i` 修改配置后无法回滚；生产环境应先 `cp` 备份或用版本控制，再执行原地替换。
- **分隔符与内容冲突**：替换含 `/` 的路径时，`s/\/etc\/php/\/usr\/php/g` 反斜杠泛滥，可换分隔符：`s|/etc/php|/usr/php|g`。
- **`g` flag 位置**：`s/foo/bar/gi` 中 `g` 和 `i` 顺序在 GNU sed 中不严格，但在 BSD sed 中 `i`（大小写不敏感）不受支持，应改用 `I`；跨平台脚本需注意。

#### 代码示例

```bash
# 批量替换 PHP 配置文件中的数据库 host
sed -i 's/DB_HOST=localhost/DB_HOST=10.0.0.1/g' .env

# 删除注释行（# 开头）和空行
sed -e '/^#/d' -e '/^$/d' php.ini

# 提取 nginx access.log 中的 HTTP 状态码列（awk 更合适）
awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -rn

# 在所有 <?php 文件首行后插入声明
sed -i '1a\// Auto-generated. Do not edit.' index.php
```
