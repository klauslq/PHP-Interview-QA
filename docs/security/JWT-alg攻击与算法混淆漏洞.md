---
title: JWT alg:none 与算法混淆攻击
difficulty: L3
frequency: 高
tags: [安全, JWT, alg:none, 算法混淆, RS256, HS256, 签名伪造, PHP]
needs_verification: false
created: 2026-05-23
---

# [L3] JWT alg:none 与算法混淆攻击

#### 一句话结论

> 信任 Header 中的 `alg` 字段是根本缺陷：alg:none 绕过签名，RS256→HS256 混淆将公钥当密钥，均可伪造任意 Token。

---

#### 体系讲解

**1. JWT 结构与签名流程**

JWT 由三段 Base64Url 编码组成：`Header.Payload.Signature`。

```
Header  : {"alg":"RS256","typ":"JWT"}
Payload : {"sub":"user1","role":"admin","exp":9999999999}
Signature: RSA_SHA256(base64url(Header) + "." + base64url(Payload), privateKey)
```

验证时，服务端应使用**自己持有的密钥**和**预期算法**重新计算签名并与 Token 中的签名比对。漏洞的根源在于：部分实现会从 Header 中读取 `alg` 字段来决定使用哪种算法，而不是在代码中硬编码。

---

**2. alg:none 攻击**

JWT 规范（RFC 7519）定义了 `"alg":"none"` 表示"不签名"，合法用于不需要完整性保护的场景（如已有 TLS 保护的内部通信）。

攻击流程：

```
sequenceDiagram
    participant A as 攻击者
    participant S as 服务端
    A->>A: 获得合法 JWT（任意用户）
    A->>A: 篡改 Header → {"alg":"none"}
    A->>A: 篡改 Payload → {"role":"admin"}
    A->>A: 去掉签名部分，构造 Header.Payload.（末尾留空）
    A->>S: 发送伪造 Token
    S->>S: 读取 alg="none"，跳过签名验证 ← 漏洞触发
    S->>A: 认证通过，权限提升
```

受影响的库版本特征：将 `"none"` 视为合法算法且不拒绝，`jwt_decode($token, null)` 或不校验算法白名单时均可触发。

---

**3. RS256→HS256 算法混淆攻击**

RS256 使用**非对称密钥对**：服务端用私钥签名，用公钥验证。公钥通常通过 JWKS 端点（`/.well-known/jwks.json`）或文档公开。

攻击的关键误用：若服务端代码根据 Header 中的 `alg` 动态选择算法：

```php
// ❌ 不安全：信任 Header 中的 alg
$alg = $header->alg;                    // 攻击者将此改为 "HS256"
$key = ($alg === 'RS256') ? $publicKey : $secretKey;  // HS256 分支取 $secretKey
verify($token, $key, $alg);
```

攻击者执行：
1. 获取服务端的 RSA **公钥**（公开可见）
2. 将 Header 改为 `{"alg":"HS256"}`
3. 用 RSA **公钥字符串**作为 HMAC-SHA256 的 `secret` 重新签名
4. 若服务端代码在 HS256 分支使用公钥字符串作为 HMAC 密钥验证 → 签名验证通过

```
时序：
攻击者          服务端（存在漏洞）
  │                    │
  │──篡改 alg=HS256──▶│
  │──用公钥作HMAC key─▶│ 读取 alg=HS256
  │  签名新 Token      │ 使用公钥字符串验证 HMAC
  │                    │ ✓ 验证通过（公钥公开，攻击者知道）
```

---

**4. HS256 密钥泄露**

即使不混淆算法，若使用 HS256 且密钥强度不足或发生泄露：

- **弱密钥**（如 `"secret"`, `"123456"`）可被离线字典暴力破解（攻击者仅需 Token 本身，无需接触服务器）
- **源码泄露**（GitHub 提交密钥、`.env` 文件外泄）导致攻击者可任意伪造 Token
- HS256 密钥兼具"签发"和"验证"两种能力，泄露后无法在不轮换密钥的情况下撤销已有 Token 的信任

---

**5. 防御要点**

| 防御措施 | 说明 |
|---|---|
| **服务端硬编码期望算法** | 不从 Token Header 读取 `alg`，直接在代码中指定 `['RS256']` 白名单 |
| **拒绝 `alg:none`** | 配置库明确排除 `none`，或白名单中不包含 `none` |
| **使用成熟库的正确 API** | `firebase/php-jwt` 的 `decode()` 第三参数必须传算法数组 |
| **HS256 密钥长度** | 至少 256 bit（32 字节）高熵随机值；避免使用 PEM 格式公钥作为 HS 密钥 |
| **RS256 优先** | 生产环境优先使用 RS256/ES256，私钥不出签发服务，泄露面更小 |

---

#### 考察意图

考察候选人是否理解 JWT 签名机制的底层原理，能否从"为什么信任 Header 的 alg 是危险的"这一根本缺陷出发，分析两类攻击的不同成因（alg:none 是规范滥用，算法混淆是实现缺陷），并给出针对性防御而非笼统的"用 HTTPS"。

---

#### 追问链

1. **firebase/php-jwt 是如何防止 alg:none 和算法混淆的？**  
   `JWT::decode($token, new Key($key, 'RS256'))` 在解码前先从传入的 Key 对象中读取算法，而非从 Token Header 中读取；同时内部维护算法白名单，`none` 不在列表中，传入空算法数组会抛出 `\InvalidArgumentException`。关键在于：调用方**必须**主动传入期望的算法，不传则报错，从 API 设计上杜绝了信任 Header 的可能。

2. **RS256 公钥通过 JWKS 端点暴露是否增加了被攻击的风险？**  
   暴露公钥本身不增加风险——公钥公开是 RSA 的设计前提，风险来自服务端错误地将公钥用作 HS256 验证密钥。只要服务端始终用 RS256 + 硬编码算法验证，攻击者拿到公钥也无法伪造签名（没有私钥）。JWKS 暴露的实际风险是密钥轮换后旧公钥仍可被发现，需要设置合理的 `Cache-Control`。

3. **如何检测系统中是否存在 alg 信任漏洞？**  
   黑盒层面：将合法 Token 的 Header 改为 `{"alg":"none"}` 并去掉签名，若服务端仍返回 200 则存在漏洞；将 Header 改为 `{"alg":"HS256"}` 并用公钥签名，若返回 200 则存在混淆漏洞。代码审计层面：搜索 `$_header->alg`、`$decoded[0]->alg` 等从 Token 中提取算法的写法，检查是否存在基于 alg 值的条件分支。

4. **ES256（ECDSA）是否也存在类似的混淆漏洞？**  
   理论上存在同类混淆路径（ES256→HS256），原理与 RS256 相同，防御方法一致：硬编码算法白名单。此外，ECDSA 历史上存在 Sony PS3 事件中的随机数复用漏洞（`k` 值重复导致私钥泄露），但这属于实现层面的密码学错误，与算法混淆攻击是不同缺陷。

---

#### 易错点

1. **误以为"只要用了 JWT 库就安全"**：问题不在于用没用库，而在于是否正确传入了算法参数。`firebase/php-jwt` 早期版本（< 5.0）的 `decode()` 接受字符串或数组，传 `null` 或不传第三参数时会信任 Header，这是文档未强调导致的高频误用。

2. **RS256 公钥和 HS256 密钥混淆存储**：有些实现将公钥字符串（PEM 格式）存入密钥配置项，同时支持 HS256，运行时若按算法名取错了密钥槽，就复现了混淆漏洞。密钥存储应按算法类型严格隔离。

3. **alg:none 攻击中忘记末尾的点**：构造无签名 Token 时格式为 `Header.Payload.`（末尾有点，签名部分为空字符串），而非 `Header.Payload`（两段）。部分解析器对格式校验宽松，两种格式均可通过；但若写 PoC 时漏掉末尾点，可能误判为库已修复。

---

#### 代码示例

```php
<?php
// 需要: composer require firebase/php-jwt
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// ✅ 安全写法：硬编码算法，不信任 Header 中的 alg
function verifyTokenSafe(string $token, string $rsaPublicKey): object
{
    // 第二参数 Key 对象绑定了密钥与算法，decode() 内部不读取 Header.alg
    return JWT::decode($token, new Key($rsaPublicKey, 'RS256'));
}

// ❌ 不安全写法（模拟受攻击代码，仅用于理解漏洞，禁止用于生产）
function verifyTokenUnsafe(string $token, string $rsaPublicKey): object
{
    [$headerB64] = explode('.', $token);
    $header = json_decode(base64_decode(strtr($headerB64, '-_', '+/')));

    // 根据 Header 中的 alg 决定验证算法 ← 漏洞所在
    $alg = $header->alg ?? 'RS256';
    if ($alg === 'none') {
        // alg:none 攻击：直接跳过签名验证
        [, $payloadB64] = explode('.', $token);
        return json_decode(base64_decode(strtr($payloadB64, '-_', '+/')));
    }
    // HS256 分支若传入公钥字符串，则算法混淆攻击成功
    return JWT::decode($token, new Key($rsaPublicKey, $alg));
}
```
