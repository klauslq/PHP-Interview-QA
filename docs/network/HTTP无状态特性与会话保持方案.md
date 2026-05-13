---
title: HTTP 的无状态特性与会话保持方案
difficulty: L1
frequency: 高
tags: [HTTP, 无状态, Cookie, Session, Token, JWT, 会话管理]
needs_verification: false
created: 2026-05-13
---

# [L1] HTTP 的无状态特性与会话保持方案

#### 一句话结论

HTTP 不保存请求间状态；Cookie+Session、Token 是补偿无状态的三类主流会话方案。

#### 体系讲解

**1. 无状态（Stateless）的含义**

HTTP 协议设计上每条请求/响应都是独立的：服务器不会记住"这个请求和上一个请求来自同一个用户"。这是 HTTP 可无限水平扩展的基础，但也导致登录态、购物车等场景需要额外机制维护上下文。

**2. 三种会话保持方案对比**

| 维度 | Cookie + Session | Cookie（仅 Cookie） | Token（JWT） |
|---|---|---|---|
| 状态存储位置 | 服务端（Session 存储）| 客户端（Cookie 中） | 客户端（Cookie 或 Header）|
| 服务端是否有状态 | ✅ 有状态 | ❌ 无状态 | ❌ 无状态 |
| 扩展性（多节点） | 需共享 Session 存储（Redis） | 天然支持 | 天然支持 |
| 安全可控性 | ✅ 服务端可主动踢用户 | ❌ 无法主动失效 | ⚠️ 需额外黑名单机制才能主动失效 |
| 适用场景 | 传统 Web 应用、单体服务 | 简单偏好存储（非敏感） | API 服务、移动端、跨域场景 |

**3. Cookie + Session 工作流程**

```mermaid
sequenceDiagram
    participant C as 浏览器
    participant S as 服务器
    participant R as Session 存储(Redis)

    C->>S: POST /login (用户名+密码)
    S->>R: 创建 Session，存储用户信息
    R-->>S: session_id = "abc123"
    S-->>C: Set-Cookie: PHPSESSID=abc123; HttpOnly; Secure
    
    C->>S: GET /profile (Cookie: PHPSESSID=abc123)
    S->>R: 查询 session_id=abc123
    R-->>S: {user_id: 1, name: "Alice"}
    S-->>C: 返回用户数据
```

**4. Token（JWT）工作流程**

JWT 由三部分组成：`Header.Payload.Signature`，服务端用密钥签名，无需查库即可验证合法性。

```
eyJhbGciOiJIUzI1NiJ9   ← Header（算法）
.eyJ1c2VyX2lkIjoxfQ   ← Payload（用户数据，Base64 非加密）
.SflKxwRJSMeKKF2QT4f  ← Signature（HMAC 签名，防篡改）
```

**5. 明文缺陷**

HTTP 传输的 Cookie/Token 均为明文，可被中间人截获。会话保持方案必须配合 HTTPS 使用；Cookie 应设置 `Secure`（仅 HTTPS 发送）和 `HttpOnly`（禁止 JS 读取，防 XSS 窃取）属性。

#### 考察意图

考察候选人对 HTTP 无状态本质的理解，以及三种会话方案在「状态存储位置」「服务端有无状态」「水平扩展能力」「主动失效能力」四个维度上的权衡，而非单纯背出 Cookie 和 Session 的定义。

#### 追问链

1. **Cookie + Session 在分布式多节点环境下有什么问题？如何解决？**  
   多台服务器各自维护内存 Session，同一用户的请求若打到不同节点会找不到 Session。解决方案：① Session 粘滞（Sticky Session，Nginx ip_hash）但破坏负载均衡；② 集中式 Session 存储（Redis）共享，所有节点读写同一 Session，是主流方案。

2. **JWT 如何实现登出（主动使 Token 失效）？**  
   JWT 本身无法主动失效（有效期内签名始终合法）。常见方案：① Token 黑名单（Redis 存储已登出 token 的 jti，每次验证查询）；② 短有效期 + 刷新 Token 机制（access token 5–15 分钟，refresh token 长效）；③ 版本号（用户表存 token_version，JWT Payload 携带版本号，服务端比较）。

3. **Cookie 的 SameSite 属性是什么？与 CSRF 防御有什么关系？**  
   `SameSite` 控制跨站请求是否携带 Cookie：`Strict` 完全禁止跨站携带；`Lax`（现代浏览器默认值）允许顶级导航（GET 跳转）携带但禁止跨站 AJAX；`None` 允许跨站携带（必须同时设置 `Secure`）。设置 `Lax` 或 `Strict` 可有效防御 CSRF 攻击。

#### 易错点

1. **认为 Cookie 就是 Session**：Cookie 是传输机制（浏览器存储并自动携带的键值对），Session 是服务端存储的状态数据；Cookie 通常只存储 Session ID，真正的用户数据在服务端。两者是不同层面的概念。

2. **认为 JWT Payload 是加密的**：JWT 的 Header 和 Payload 只是 Base64 编码，**并非加密**，任何人都可以解码读取内容。Signature 只保证数据未被篡改。不应在 JWT Payload 中存放密码、身份证等敏感数据。

3. **只设置了 Token 过期时间却没有刷新机制**：过期时间过短用户体验差，过长则安全风险高。生产环境应结合短期 access token + 长期 refresh token 的双 Token 机制，在安全性与体验之间取得平衡。

#### 代码示例

```php
// PHP Session 基础用法
session_start();

// 登录时写入 Session
$_SESSION['user_id'] = 1;
$_SESSION['name']    = 'Alice';

// 后续请求验证
if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    exit('Unauthorized');
}

// 安全 Cookie 属性设置（PHP 8.0+）
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'secure'   => true,      // 仅 HTTPS
    'httponly' => true,      // 禁止 JS 读取
    'samesite' => 'Lax',     // 防 CSRF
]);
```
