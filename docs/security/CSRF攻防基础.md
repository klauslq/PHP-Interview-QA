---
title: CSRF 攻防基础
difficulty: L1
frequency: 高
tags: [安全, CSRF, Token, SameSite, HTTP, PHP]
needs_verification: false
created: 2026-05-23
---

# [L1] CSRF 攻防基础

#### 一句话结论

> CSRF 利用浏览器自动携带 Cookie 的特性伪造请求；Token 验证与 SameSite Cookie 是主流防御手段。

---

#### 体系讲解

**1. 攻击原理**

跨站请求伪造（Cross-Site Request Forgery）：攻击者诱导已登录用户的浏览器向目标站点发送非预期请求。浏览器访问目标站点时**自动携带该站 Cookie**（含 Session），服务端无法区分请求是否来自用户本人的真实操作。

典型攻击载体：

```html
<!-- 恶意页面 B 中嵌入，用户访问 B 时自动触发 -->
<img src="https://bank.com/transfer?to=attacker&amount=1000">
<form method="POST" action="https://bank.com/transfer" id="f">
  <input name="to" value="attacker"><input name="amount" value="1000">
</form>
<script>document.getElementById('f').submit();</script>
```

**2. 防御机制对照**

| 防御手段 | 原理 | 局限性 |
|---|---|---|
| **同步器 Token（CSRF Token）** | 服务端生成随机 Token 写入表单/请求头，提交时验证一致性 | Token 泄露则失效；需服务端存储或签名 |
| **SameSite Cookie** | 浏览器限制第三方上下文携带 Cookie | Lax 下顶层 GET 导航仍携带 Cookie |
| **Referer 校验** | 验证请求来源 URL 是否属于本站 | Referer 可被剥离（HTTPS→HTTP）或被隐私工具屏蔽 |

**3. SameSite 三个值行为差异**

| 值 | 跨站 POST | 跨站顶层 GET 导航（`<a>`/`<img>`） | 跨站 AJAX / iframe |
|---|---|---|---|
| **Strict** | ❌ 不携带 | ❌ 不携带 | ❌ 不携带 |
| **Lax**（Chrome 默认） | ❌ 不携带 | ✅ 携带 | ❌ 不携带 |
| **None** | ✅ 携带 | ✅ 携带 | ✅ 携带（必须同时设置 `Secure`） |

**4. 为什么 GET 请求不应修改状态**

HTTP 规范要求 GET 是**幂等且无副作用**的。若 GET 修改状态：

- SameSite=Lax 下，`<a>` 跳转、`<img>` 加载等顶层导航仍会携带 Cookie，攻击者可通过链接触发 CSRF
- 浏览器预加载、搜索引擎爬虫、代理缓存也可能意外触发状态变更
- 日志、监控系统重放请求时产生副作用

**5. PHP 中的 CSRF Token 实践**

1. **生成**：`bin2hex(random_bytes(32))` 生成 64 位十六进制 Token，存入 `$_SESSION`
2. **下发**：将 Token 嵌入隐藏表单字段或自定义请求头（`X-CSRF-Token`）
3. **校验**：使用 `hash_equals()` 做恒定时间比较，防止时序攻击

---

#### 考察意图

考察候选人是否理解 CSRF 的本质（非 XSS，依赖 Cookie 自动携带而非 JS 注入），能否区分 Token 验证、SameSite、Referer 三种防御手段的原理与局限，以及是否了解 GET 请求幂等性的工程意义。

---

#### 追问链

1. **SameSite=Lax 是否足以防止 CSRF？**  
   不完全够。Lax 允许顶层导航的 GET 请求携带 Cookie，若接口用 GET 修改状态（如 `/logout?confirm=1`），仍有 CSRF 风险。需配合"GET 不修改状态"原则；对高风险操作应额外叠加 CSRF Token 验证。

2. **为什么用 `hash_equals()` 而不是 `===` 比较 Token？**  
   `===` 在字符串首个不同字符处即短路返回，执行时间随字符串差异位置变化，攻击者可通过时序差异（Timing Attack）逐字节猜测 Token。`hash_equals()` 保证无论字符串在哪里不同都执行恒定时间，消除旁路信息泄露。

3. **Referer 校验为什么不推荐单独使用？**  
   ① HTTPS 页面跳转到 HTTP 时，浏览器默认按 `Referrer-Policy: no-referrer-when-downgrade` 剥离 Referer；② 用户浏览器或隐私插件可能全局禁用 Referer；③ 部分场景（如书签、直接输入 URL）本身就没有 Referer。若服务端将"Referer 缺失"视为合法，则攻击者只需让请求不带 Referer 即可绕过。

---

#### 易错点

1. **误以为 SameSite=Lax 能完全防 CSRF**：Lax 仍允许顶层 GET 导航携带 Cookie，若有 GET 接口执行状态变更（注销、删除等），依然存在风险。

2. **Token 比较使用 `==` 或 `===`**：应使用 `hash_equals()` 避免时序攻击；即使 Token 是高熵随机值，时序攻击在理论和实践中均已被证实可行。

3. **SameSite=None 忘记设置 Secure**：Chrome 80+ 要求 `SameSite=None` 必须同时附带 `Secure` 属性，否则该 Cookie 被浏览器忽略，导致第三方嵌入（OAuth 回调、支付跨域等）场景失效。

---

#### 代码示例

```php
<?php
session_start();
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32)); // 初始化高熵 Token
}

// 恒定时间比较，防时序攻击（不可用 === 替代）
function verifyCsrfToken(string $submitted): bool
{
    $stored = $_SESSION['csrf_token'] ?? '';
    return $stored !== '' && hash_equals($stored, $submitted);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST'
    && !verifyCsrfToken($_POST['csrf_token'] ?? '')) {
    http_response_code(403); exit('CSRF token mismatch');
}
```
