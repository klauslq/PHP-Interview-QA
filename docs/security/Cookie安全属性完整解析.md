---
title: Cookie 安全属性完整解析
difficulty: L2
frequency: 高
tags: [安全, Cookie, HttpOnly, Secure, SameSite, PHP, 会话安全]
needs_verification: false
created: 2026-05-23
---

# [L2] Cookie 安全属性完整解析

#### 一句话结论

> HttpOnly 防 XSS 窃取、Secure 防明文传输、SameSite 限跨站携带；Domain/Path 精确控制作用域以最小化攻击面。

---

#### 体系讲解

**1. 五大安全属性速览**

| 属性 | 防御目标 | 缺失时的风险 |
|---|---|---|
| **HttpOnly** | 阻止 JS 读取 Cookie（`document.cookie`） | XSS 攻击可直接窃取 Session Cookie |
| **Secure** | Cookie 仅通过 HTTPS 传输 | HTTP 明文传输时遭中间人嗅探 |
| **SameSite** | 限制跨站请求携带 Cookie | CSRF 攻击可利用自动携带的 Cookie |
| **Domain** | 指定哪些域名可接收 Cookie | 设置过宽导致子域可读取父域 Cookie |
| **Path** | 限制 Cookie 发送的 URL 路径范围 | 同域不同路径的页面可获取不该获取的 Cookie |

**2. HttpOnly——阻断 XSS 到 Session 的最后一跳**

`HttpOnly` 标记后，浏览器拒绝 JS 通过 `document.cookie` 读取该 Cookie，XSS 脚本即使注入成功也无法提取 Session ID。

注意 HttpOnly **不能防止**：
- CSRF（Cookie 在 HTTP 请求中仍自动携带）
- 网络层嗅探（需配合 `Secure`）

**3. Secure——保护传输通道**

Cookie 只在 `https://` 连接中发送，防止明文 HTTP 下遭网络嗅探。

典型风险场景：同一站点同时提供 HTTP 和 HTTPS，若未设 `Secure`，用户访问 `http://` 页面时浏览器会将 Cookie 随请求发出，攻击者在同一网络下即可捕获。

> 设置 `SameSite=None` **必须**同时设置 `Secure`，否则 Chrome 80+ 会拒绝该 Cookie。

**4. SameSite——跨站 Cookie 携带控制**

| 值 | 跨站 POST | 跨站顶层 GET 导航 | 跨站 AJAX / iframe | 适用场景 |
|---|---|---|---|---|
| **Strict** | ❌ | ❌ | ❌ | 高安全性，但跳转回本站时 Cookie 不携带，影响体验 |
| **Lax**（浏览器默认） | ❌ | ✅ | ❌ | 平衡安全与体验，防大多数 CSRF |
| **None** | ✅ | ✅ | ✅ | 第三方嵌入（OAuth 回调、跨域支付）场景，必须同时设 Secure |

> SameSite 行为差异与 CSRF 防御详见《CSRF 攻防基础》，本题聚焦属性联合使用的安全矩阵。

**5. Domain 与 Path——最小作用域原则**

**Domain**：
- 不设时，Cookie 仅发送给**精确设置它的域**（最安全）
- 设置为 `.example.com`（含前导点）时，`sub.example.com`、`api.example.com` 等所有子域均可收到该 Cookie
- 攻击面：若攻击者控制某个子域（如通过 DNS 劫持或子域接管），可利用宽 Domain 读取父域 Cookie

**Path**：
- 默认 `/`，所有路径均发送
- 设置为 `/api/` 时，Cookie 只在访问 `/api/` 前缀路径时发送
- 注意：Path 不能替代安全控制，同域下 JS 仍可通过 iframe 或 `document.cookie` 读取其他 Path 的 Cookie（除非设 HttpOnly）

**6. 联合防御矩阵**

Session Cookie 推荐配置：

```
Set-Cookie: session_id=xxx;
  HttpOnly;
  Secure;
  SameSite=Lax;
  Path=/;
  Domain=example.com
```

| 攻击类型 | 主要防御属性 |
|---|---|
| XSS 窃取 Session | HttpOnly |
| 网络嗅探 | Secure |
| CSRF | SameSite |
| 子域 Cookie 污染 | 精确 Domain + `__Host-` 前缀 |

**7. Cookie 前缀强化（`__Host-` / `__Secure-`）**

| 前缀 | 浏览器强制要求 | 效果 |
|---|---|---|
| `__Secure-` | 必须有 `Secure` 属性 | 防止 HTTP 页面覆盖 Cookie |
| `__Host-` | 必须有 `Secure`、无 `Domain`、`Path=/` | 完全锁定到当前主机，防子域污染 |

---

#### 考察意图

考察候选人是否理解各 Cookie 属性的防御层次（传输层、脚本层、跨站携带层、作用域层），以及能否在不同攻击场景下选择正确的属性组合，而非孤立记忆单个属性。

---

#### 追问链

1. **HttpOnly Cookie 是否完全防止了 XSS 的危害？**  
   不能。XSS 代码虽无法读取 HttpOnly Cookie，但可以：直接以受害者身份发起请求（不需要 Cookie 值本身）、篡改页面内容（钓鱼/挂马）、读取非 HttpOnly 的其他 Cookie 或 localStorage。HttpOnly 只是将 XSS 的危害从"直接窃取 Session"升级为"需在线操作"，不能替代 XSS 本身的修复。

2. **为什么 `SameSite=None` 必须同时设置 `Secure`？**  
   Chrome 80+ 将 `SameSite=None; 无Secure` 的 Cookie 视为无效并丢弃。原因是 None 允许第三方完整携带 Cookie，若通过 HTTP 明文传输，等同于完全暴露会话凭证；强制捆绑 Secure 是浏览器的最低安全底线。

3. **`__Host-` 前缀能防御什么额外的攻击面？**  
   浏览器强制：① 无 Domain 属性（Cookie 严格归属当前精确主机名）；② `Path=/`（无法缩小 Path 欺骗）；③ 必须 Secure。这组约束阻止了子域覆盖攻击——即攻击者控制 `evil.example.com` 后无法向 `example.com` 写入同名 Cookie 来覆盖合法 Cookie，因为带 `__Host-` 前缀的 Cookie 强制要求无 Domain。

---

#### 易错点

1. **认为 Path 是安全边界**：同域的 JS 脚本可以通过创建 iframe（指向其他路径页面）或直接操作 `document.cookie` 绕过 Path 限制。Path 只控制 Cookie 随 HTTP 请求发送的范围，不能阻止 JS 读取。

2. **Domain 设置为带前导点的父域（`.example.com`）**：默认不设 Domain 时 Cookie 仅归属精确域名，手动设置成 `.example.com` 反而**扩大了**作用域，所有子域均可收到该 Cookie，引入不必要的攻击面。

3. **认为 HttpOnly + Secure 就足够了，忽略 SameSite**：缺少 SameSite 时，即使 Session Cookie 无法被 JS 读取，跨站表单提交仍会自动携带它，CSRF 攻击依然可行。

---

#### 代码示例

```php
<?php
// PHP 中通过 session_set_cookie_params() 统一配置 Session Cookie 安全属性
session_set_cookie_params([
    'lifetime' => 0,           // 浏览器关闭时过期（不持久化）
    'path'     => '/',
    'domain'   => 'example.com',  // 精确域名，不加前导点
    'secure'   => true,        // 仅 HTTPS
    'httponly' => true,        // 禁止 JS 读取
    'samesite' => 'Lax',       // 防 CSRF，兼顾体验
]);
session_start();

// 手动写入业务 Cookie 时同样需要设置安全属性
setcookie('pref', 'dark', [
    'expires'  => time() + 86400 * 30,
    'path'     => '/',
    'secure'   => true,
    'httponly' => false,   // 前端需要读取偏好设置，可不设 HttpOnly
    'samesite' => 'Lax',
]);
```
