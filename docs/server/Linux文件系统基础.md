---
title: Linux 文件系统基础——inode、硬链接与软链接、权限位
difficulty: L1
frequency: 高
tags: [Linux, 文件系统, inode, 权限]
needs_verification: false
created: 2026-05-23
---

# [L1] Linux 文件系统基础——inode、硬链接与软链接、权限位

#### 一句话结论

inode 存储文件元数据，硬链接共享 inode，软链接是独立的路径指针，权限位以三组八进制表示。

#### 体系讲解

**inode 结构**

每个文件在磁盘上对应一个 inode，记录文件的元数据（不含文件名）：

| 字段 | 说明 |
|---|---|
| inode 编号 | 文件系统内唯一标识 |
| 权限位 | rwx × owner/group/other |
| 链接数 | 指向该 inode 的目录项数量 |
| uid / gid | 所属用户和组 |
| 文件大小 | 字节数 |
| 时间戳 | atime / mtime / ctime |
| 数据块指针 | 指向实际内容所在磁盘块 |

> 文件名保存在目录文件中，目录项 = 文件名 → inode 编号的映射。

**硬链接 vs 软链接**

| 对比项 | 硬链接 | 软链接（符号链接） |
|---|---|---|
| 创建命令 | `ln src dst` | `ln -s src dst` |
| inode | 与源文件相同 | 独立 inode |
| 跨文件系统 | 不支持 | 支持 |
| 目标删除后 | 文件内容仍可访问 | 链接失效（悬空链接） |
| 指向目录 | 不允许（特殊情况除外） | 允许 |
| `ls -l` 标识 | `-`（普通文件） | `l`（lrwxrwxrwx） |

**chmod / chown 权限位**

权限分三组：owner（u）、group（g）、other（o），每组 r=4、w=2、x=1。

```bash
chmod 755 file.php   # rwxr-xr-x：owner 全权，group/other 只读执行
chmod u+x script.sh  # 符号模式：给 owner 添加执行权限
chown www:www /var/www/html -R  # 递归修改属主和属组
```

#### 考察意图

验证候选人对 Linux 文件系统核心概念的掌握，以及在部署 PHP 项目时正确设置权限、诊断软链接失效等实际运维能力。

#### 追问链

1. **`stat` 命令能看到什么，和 `ls -l` 有什么区别？**
   `stat` 直接显示 inode 编号、三种时间戳（atime/mtime/ctime）及块大小，`ls -l` 只显示 mtime 和人类可读格式；需要调查 inode 时用 `stat`。

2. **删除一个文件时，硬链接数归零发生了什么？**
   inode 引用计数降为 0，操作系统将数据块标记为可复用，但数据并未立刻清零；若进程仍持有文件描述符，内容还可访问，直到 fd 关闭。

3. **`/var/www/html` 建议设置什么权限，为什么不能设 777？**
   建议 `755`（目录）+ `644`（文件），Web 进程（www-data）属于 group 即可读取；777 让 other 拥有写权限，上传漏洞可直接写入恶意文件。

4. **PHP-FPM worker 进程读取上传目录时出现 Permission denied，如何快速排查？**
   用 `stat` 查看目录 uid/gid，`id www-data` 查看 FPM 进程用户，`namei -l /path` 逐层显示权限链，找出第一个拒绝节点。

#### 易错点

- **误以为文件名存在 inode 中**：文件名存在父目录的目录项里，inode 不含文件名，因此重命名（`mv`）不修改 inode。
- **软链接相对路径陷阱**：`ln -s ../conf/php.ini /etc/php.ini` 中相对路径相对的是链接文件所在目录，而非当前工作目录，移动链接文件后常导致失效。
- **chmod 八进制漏写前导零**：`chmod 644` 是十进制，与 `chmod 0644` 等价，但在脚本中用 `printf "%o"` 打印权限时会看到四位八进制（含 setuid/setgid/sticky bit），混淆三位与四位表示。

#### 代码示例

```bash
# 查看 inode 编号
ls -i file.php

# 创建硬链接并确认 inode 一致
ln file.php file_hard.php
stat file.php file_hard.php | grep Inode

# 创建软链接并演示失效
ln -s /tmp/target.php /var/www/html/link.php
rm /tmp/target.php
ls -l /var/www/html/link.php   # 显示红色（悬空链接）

# 批量修复 PHP 项目权限
find /var/www/html -type d -exec chmod 755 {} \;
find /var/www/html -type f -exec chmod 644 {} \;
```
