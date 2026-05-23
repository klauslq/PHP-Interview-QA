---
title: $_SERVER 超全局变量中有哪些常用字段？分别有什么用途？
difficulty: L1
frequency: 高
tags:
  - PHP
  - HTTP
  - $_SERVER
  - 超全局变量
  - REQUEST_METHOD
  - HTTP_HOST
  - REMOTE_ADDR
needs_verification: false
created: 2026-05-23
---

# [L1] `$_SERVER` 超全局变量中有哪些常用字段？分别有什么用途？

#### 一句话结论

`$_SERVER` 包含服务器与请求环境信息，常用字段涵盖请求方法、主机名、客户端 IP、URI、脚本路径等，是 PHP 获取 HTTP 请求上下文的主要入口。

#### 体系讲解

`$_SERVER` 由 Web 服务器（如 Nginx/Apache）在处理请求时填充，PHP 以超全局变量形式提供访问。以下为高频使用字段：

**请求基本信息**

| 字段 | 说明 | 典型值 |
|---|---|---|
| `REQUEST_METHOD` | HTTP 请求方法 | `GET`、`POST`、`PUT`、`DELETE` |
| `REQUEST_URI` | 请求的完整 URI（含查询字符串） | `/api/users?page=2` |
| `QUERY_STRING` | 查询字符串部分 | `page=2` |
| `HTTP_HOST` | 请求的 Host 头（含端口，若非默认） | `example.com:8080` |
| `SERVER_NAME` | 服务器配置的主机名 | `example.com` |
| `HTTPS` | 是否为 HTTPS 连接 | `on`（HTTPS）或未设置 |
| `SERVER_PORT` | 服务器监听端口 | `80`、`443` |

**客户端信息**

| 字段 | 说明 | 注意事项 |
|---|---|---|
| `REMOTE_ADDR` | TCP 连接的直接来源 IP | 经过代理时为代理 IP，非真实客户端 IP |
| `HTTP_USER_AGENT` | 客户端 User-Agent | 可被伪造，不可用于安全决策 |
| `HTTP_REFERER` | 来源页面 URL | 可被伪造，且拼写历史上就是错误的（Referrer） |

**脚本与文件路径**

| 字段 | 说明 |
|---|---|
| `SCRIPT_FILENAME` | 当前执行脚本的绝对磁盘路径 |
| `SCRIPT_NAME` | 当前脚本相对于 Web 根目录的路径 |
| `DOCUMENT_ROOT` | Web 根目录绝对路径 |
| `PHP_SELF` | 当前脚本路径（含 `PATH_INFO`），**有 XSS 风险** |

**`HTTP_HOST` vs `SERVER_NAME`**

- `HTTP_HOST` 来自请求头，反映客户端请求的主机名，更贴近真实请求，但可被伪造。
- `SERVER_NAME` 来自服务器配置，是服务器的预期主机名，在反向代理场景下可能与请求不符。
- 生成绝对 URL 时，推荐使用 `HTTP_HOST`，但应做白名单校验防止 Host 注入攻击。

#### 考察意图

- 考察候选人对 HTTP 请求上下文的认知广度
- 验证是否清楚 `REMOTE_ADDR` 在代理场景下的局限性（与 `X-Forwarded-For` 配合使用）
- 检验是否了解 `PHP_SELF` 等字段的安全风险

#### 追问链

1. `REQUEST_METHOD` 的值是否可信？可以直接用于路由判断吗？

   简答：`REQUEST_METHOD` 由服务器从 HTTP 请求行解析，在正常 Web 环境下可信，可用于路由判断。但需注意 HTML 表单只支持 GET/POST；部分框架通过隐藏字段 `_method` 模拟 PUT/DELETE，需在框架层统一处理。

2. 如何判断当前请求是否为 HTTPS？

   简答：检查 `$_SERVER['HTTPS'] === 'on'` 或 `$_SERVER['SERVER_PORT'] == 443`。在 Nginx 反向代理场景下，HTTPS 在代理层终止，PHP 收到的是 HTTP 请求，此时应检查 `$_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https'`，但需要确保该头只能由可信代理设置。

3. `PHP_SELF` 为什么有 XSS 风险？如何安全使用？

   简答：`PHP_SELF` 包含原始请求路径，若路径中包含用户输入（如 `/index.php/<script>alert(1)</script>`），直接输出到 HTML 则造成 XSS。安全做法是始终通过 `htmlspecialchars($_SERVER['PHP_SELF'])` 进行转义后再输出。

#### 易错点

1. **将 `REMOTE_ADDR` 当作真实客户端 IP**：当请求经过负载均衡器或反向代理时，`REMOTE_ADDR` 是代理服务器的 IP，而非真实用户 IP。需要配合 `HTTP_X_FORWARDED_FOR` 或 `HTTP_X_REAL_IP` 获取原始 IP（并验证代理可信度）。

2. **直接输出 `PHP_SELF` 到 HTML**：`$_SERVER['PHP_SELF']` 包含未经处理的路径，若直接嵌入 `<form action="<?php echo $_SERVER['PHP_SELF']; ?>">` 中会引发 XSS 漏洞，必须用 `htmlspecialchars()` 转义。

3. **混淆 `HTTP_HOST` 与 `SERVER_NAME`**：在虚拟主机或反向代理环境下两者可能不同。拼接 URL 时优先用 `HTTP_HOST`（反映实际请求），但需做白名单校验；内部配置判断时用 `SERVER_NAME` 更稳定。

#### 代码示例

```php
<?php
// 获取请求方法
$method = $_SERVER['REQUEST_METHOD']; // 'GET' | 'POST' | ...

// 判断是否为 HTTPS（含反向代理场景）
function isHttps(): bool
{
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        return true;
    }
    if (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https') {
        return true;
    }
    return ($_SERVER['SERVER_PORT'] ?? 80) == 443;
}

// 安全输出 PHP_SELF
$action = htmlspecialchars($_SERVER['PHP_SELF'], ENT_QUOTES, 'UTF-8');
// <form action="<?= $action ?>">

// 构建当前请求的完整 URL（需做 Host 白名单校验）
$allowedHosts = ['example.com', 'www.example.com'];
$host = $_SERVER['HTTP_HOST'] ?? '';
if (!in_array($host, $allowedHosts, true)) {
    http_response_code(400);
    exit('Invalid Host');
}
$scheme = isHttps() ? 'https' : 'http';
$url = $scheme . '://' . $host . $_SERVER['REQUEST_URI'];
```
