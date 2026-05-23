---
title: header() 函数的作用是什么？为什么调用前不能有任何输出？
difficulty: L1
frequency: 高
tags:
  - PHP
  - HTTP
  - header
  - headers already sent
  - 输出缓冲
needs_verification: false
created: 2026-05-23
---

# [L1] `header()` 函数的作用是什么？为什么调用前不能有任何输出？

#### 一句话结论

`header()` 用于发送 HTTP 响应头，必须在任何输出（含空白字符）之前调用，否则触发 `headers already sent` 错误。

#### 体系讲解

**HTTP 响应结构**

HTTP 协议规定响应由两部分组成：头部（Headers）和正文（Body），且头部必须先于正文发送。一旦正文开始传输，头部就已经固化，无法再修改或追加。

**PHP 的输出触发时机**

PHP 将 `echo`、`print`、`?>...<?php` 之间的 HTML、`var_dump` 等所有直接输出都视为正文。一旦产生正文字节，PHP 就会自动将已缓冲的响应头一起发送出去。此后再调用 `header()` 时，PHP 发现头部已发送，便会抛出警告：

```
Warning: Cannot modify header information - headers already sent by (output started at ...)
```

**`header()` 的常见用途**

| 用途 | 示例 |
|---|---|
| 重定向 | `header('Location: /login.php', true, 302)` |
| 设置 Content-Type | `header('Content-Type: application/json; charset=utf-8')` |
| 控制缓存 | `header('Cache-Control: no-store')` |
| 触发文件下载 | `header('Content-Disposition: attachment; filename="file.csv"')` |
| 设置状态码 | `header('HTTP/1.1 404 Not Found')` 或 `http_response_code(404)` |

**`header()` 的第二、三参数**

- 第二参数 `$replace`（默认 `true`）：是否替换同名头部；设为 `false` 可发送多个同名头（如多个 `Set-Cookie`）。
- 第三参数 `$response_code`：同时设置响应状态码，常与 `Location` 配合使用。

**重定向后必须 `exit`**

调用 `header('Location: ...')` 仅发送重定向头，不会中止 PHP 脚本执行。若不跟 `exit`/`die`，后续代码仍会运行，既浪费资源，也可能导致逻辑漏洞（如权限绕过）。

#### 考察意图

- 考察候选人是否理解 HTTP 头部与正文的发送顺序
- 验证是否能定位和解决 `headers already sent` 的根因（包括 BOM、空行等隐性输出）
- 检验重定向写法是否规范（`header` + `exit` 配对）

#### 追问链

1. 哪些"不可见"输出也会触发 `headers already sent`？

   简答：UTF-8 BOM（文件开头的 `\xEF\xBB\xBF`）、PHP 标签前的空行或空格、`include`/`require` 的文件中存在闭合标签 `?>` 后的换行，都会产生输出。解决方式包括：保存文件为无 BOM 的 UTF-8、省略 PHP 纯代码文件末尾的 `?>`。

2. `header('Location: /page.php')` 之后不写 `exit`，会有什么风险？

   简答：PHP 脚本会继续执行。若后续有数据库操作、权限判断或敏感数据输出，这些逻辑都会运行完毕再结束，可能导致权限绕过或不必要的资源消耗。规范做法是紧接 `exit` 或 `die`。

3. 如何在框架中统一管理响应头，而不是散落在各处直接调用 `header()`？

   简答：将响应封装成 Response 对象（如 Symfony/Laravel 的 `Response`），头部以数组形式收集，在框架生命周期的统一发送点（`$response->send()`）批量输出。这样既避免提前触发输出，也便于测试和中间件拦截。

#### 易错点

1. **忽略 BOM 导致的隐性输出**：Windows 编辑器保存的 PHP 文件可能包含 UTF-8 BOM，这 3 个字节会作为正文输出，导致所有后续的 `header()` 调用失败。解决方案是配置编辑器保存为"无 BOM 的 UTF-8"。

2. **重定向后缺少 `exit`**：`header('Location: ...')` 不会自动停止脚本，遗漏 `exit` 会继续执行后续代码，在权限检查场景下可能造成安全漏洞。

3. **在 `include` 的文件末尾保留 `?>`**：PHP 纯代码文件（无 HTML 混排）应省略末尾的 `?>`，因为闭合标签后的换行符会被视为输出，进而触发 `headers already sent`。

#### 代码示例

```php
<?php
// ✅ 正确：header() 在任何输出之前调用
header('Content-Type: application/json; charset=utf-8');
http_response_code(200);
echo json_encode(['status' => 'ok']);
exit;

// ✅ 正确重定向写法
function redirect(string $url, int $code = 302): never
{
    header('Location: ' . $url, true, $code);
    exit;
}

// ❌ 错误示例 1：header() 在 echo 之后
// echo "Hello";
// header('Location: /other.php'); // Warning: headers already sent

// ❌ 错误示例 2：重定向后缺少 exit
// header('Location: /login.php');
// // 后续代码仍然执行，可能泄露数据或绕过权限
// fetchSensitiveData();
```
