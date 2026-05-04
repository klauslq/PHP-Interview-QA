---
title: PHP 文件上传安全与输入过滤实践
difficulty: L3
frequency: 高
tags: [安全, 文件上传, filter_var, strip_tags, PHP, 路径穿越]
needs_verification: false
created: 2026-05-04
---

# [L3] PHP 文件上传安全与输入过滤实践

#### 一句话结论

> 文件上传须同时校验魔术字节、扩展名白名单、随机化存储路径并禁止上传目录执行脚本。

---

#### 体系讲解

**1. 文件上传的四层攻击面**

| 攻击方式 | 原理 | 危害 |
|---|---|---|
| **MIME 类型伪造** | 修改请求头 `Content-Type: image/jpeg` 上传 PHP 文件 | 绕过服务端 MIME 检测 |
| **扩展名绕过** | 上传 `shell.php.jpg`、`shell.phtml`、`shell.php5` 等变体 | 绕过简单后缀黑名单 |
| **路径穿越** | 文件名包含 `../../etc/passwd`，写入非预期目录 | 覆盖敏感文件 |
| **二次渲染绕过** | 将恶意代码嵌入图片 EXIF/像素数据，绕过图片重绘 | 高级 WebShell 植入 |

**2. 三种类型检测的可信度对比**

| 检测方式 | PHP 函数 | 可被伪造？ | 可信度 |
|---|---|:---:|:---:|
| HTTP `Content-Type` | `$_FILES['file']['type']` | ✅ 可伪造 | ❌ 不可信 |
| 文件扩展名 | `pathinfo($name, PATHINFO_EXTENSION)` | ✅ 可绕过 | ⚠️ 辅助 |
| **魔术字节（文件头）** | `finfo_file()` | 较难伪造 | ✅ 可信 |

魔术字节（Magic Bytes）是文件真实格式的二进制标识，如 JPEG 文件起始字节为 `FF D8 FF`，PNG 为 `89 50 4E 47`，PHP 文件无法伪造合法图片文件头。

**3. 安全上传的五道防线**

```
① 魔术字节校验（finfo_file）      —— 验证文件真实类型
② 扩展名白名单（非黑名单）         —— 只允许 jpg/png/gif/webp
③ 文件名随机化（uuid/hash）        —— 防路径穿越 + 枚举
④ 存储目录隔离（webroot 外）       —— 上传目录不对外暴露
⑤ Nginx 禁止脚本执行              —— 即使绕过也无法运行
```

**4. `filter_var` 与 `strip_tags` 的定位**

| 函数 | 适用场景 | 局限 |
|---|---|---|
| `filter_var($v, FILTER_VALIDATE_EMAIL)` | 格式校验（email/URL/IP/int） | 只验证格式，不验证业务合法性 |
| `filter_var($v, FILTER_SANITIZE_*)` | 清理特殊字符 | PHP 8.1 起部分 `SANITIZE` 常量已废弃，优先用 `htmlspecialchars` |
| `strip_tags($v)` | 剥除 HTML/PHP 标签 | 允许部分标签时仍有 XSS 风险（如 `<img onerror=...>`），富文本应用 HTML Purifier |

---

#### 考察意图

考察候选人是否理解文件上传漏洞的多层攻击面，以及「防御纵深」思维——单一检测（只看 MIME 或只看扩展名）必然被绕过，需要多道防线叠加；同时考察对 PHP 安全函数（`finfo_file`、`filter_var`、`strip_tags`）的实际使用边界的掌握，而非停留在函数签名层面。

---

#### 追问链

1. **为什么 `$_FILES['file']['type']` 完全不可信？应该用什么替代？**  
   `$_FILES['file']['type']` 的值由 HTTP 请求头 `Content-Type` 决定，客户端可以任意伪造（如将 PHP 文件标记为 `image/jpeg`）。服务端应使用 `finfo_file($finfo, $tmpPath)` 读取文件实际二进制头来判断 MIME 类型，或配合 `getimagesize()` 验证图片有效性（非图片文件会返回 false）。

2. **「扩展名黑名单」为什么不如「白名单」安全？举例说明绕过方式。**  
   黑名单需要穷举所有危险扩展名，极易遗漏：PHP 可执行扩展除 `.php` 外还有 `.php3`、`.php4`、`.php5`、`.phtml`、`.phar`；Windows 环境下还有大小写变体和 `::$DATA` NTFS 流绕过。白名单只允许业务需要的格式（如 `['jpg','png','gif','webp']`），所有非白名单扩展名一律拒绝，不存在遗漏问题。

3. **上传目录设置在 webroot 外部有什么作用？仅此是否足够？**  
   将上传目录设在 `webroot`（如 `/var/www/html`）之外，使文件无法通过 HTTP 直接访问，需通过 PHP 代理脚本读取并输出，从根本上阻断了直接 URL 访问 WebShell 的路径。但仅靠目录隔离不够——还需：①Nginx/Apache 对上传目录配置禁止执行权限；②PHP 代理脚本在输出前二次校验文件类型；③限制 `open_basedir` 防止路径穿越读取系统文件。

---

#### 易错点

1. **用黑名单过滤扩展名**：忘记 `.phtml`、`.phar`、`.php5` 等变体，导致绕过。应始终用白名单，只允许业务必需的文件类型。

2. **保留原始文件名**：直接用 `$_FILES['file']['name']` 作为存储文件名，攻击者可构造 `../../config.php` 实施路径穿越，或上传同名文件覆盖已有资源。应生成 `uniqid() . bin2hex(random_bytes(8))` 的随机文件名，只保留白名单扩展名。

3. **`strip_tags` 用于富文本防 XSS**：`strip_tags('<img src=x onerror=alert(1)>', '<img>')` 保留了 `img` 标签，`onerror` 事件处理器仍可触发 XSS。富文本场景必须用 HTML Purifier 等专业库做白名单属性过滤，而非 `strip_tags`。

---

#### 代码示例

```php
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_EXT  = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const UPLOAD_DIR   = '/var/uploads/'; // webroot 外部，不可直接访问

function secureUpload(array $file): string
{
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new RuntimeException('上传失败，错误码：' . $file['error']);
    }

    // ① 魔术字节校验（不信任 Content-Type）
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime  = $finfo->file($file['tmp_name']);
    if (!in_array($mime, ALLOWED_MIME, true)) {
        throw new RuntimeException('不允许的文件类型');
    }

    // ② 扩展名白名单（取真实扩展名，强制小写）
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, ALLOWED_EXT, true)) {
        throw new RuntimeException('不允许的文件扩展名');
    }

    // ③ 随机化文件名，防路径穿越与枚举
    $newName = bin2hex(random_bytes(16)) . '.' . $ext;
    $dest    = UPLOAD_DIR . $newName;

    // ④ 使用 move_uploaded_file 确保文件来源合法（非伪造上传）
    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        throw new RuntimeException('文件保存失败');
    }

    return $newName;
}

// 调用
try {
    $filename = secureUpload($_FILES['avatar']);
} catch (RuntimeException $e) {
    http_response_code(400);
    exit(json_encode(['error' => $e->getMessage()]));
}
```
