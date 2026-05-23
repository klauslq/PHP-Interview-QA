---
title: X-Forwarded-For 与 REMOTE_ADDR 有什么区别？如何在代理场景下获取真实客户端 IP？
difficulty: L1
frequency: 高
tags:
  - PHP
  - HTTP
  - X-Forwarded-For
  - REMOTE_ADDR
  - 代理
  - 真实IP
  - 安全
needs_verification: false
created: 2026-05-23
---

# [L1] `X-Forwarded-For` 与 `REMOTE_ADDR` 有什么区别？如何在代理场景下获取真实客户端 IP？

#### 一句话结论

`REMOTE_ADDR` 是当前 TCP 连接的对端 IP（可能是代理），`X-Forwarded-For` 是代理链追加的原始客户端 IP 头，获取真实 IP 时必须校验代理可信度，防止伪造注入。

#### 体系讲解

**`REMOTE_ADDR`**

`REMOTE_ADDR` 是操作系统 TCP 层记录的直接连接方 IP，由服务器内核填充，**客户端无法伪造**。其局限性在于：当请求经过负载均衡器、CDN 或反向代理时，PHP 看到的 `REMOTE_ADDR` 是代理的 IP，而非真实用户 IP。

**`X-Forwarded-For`**

`X-Forwarded-For`（简称 XFF）是一个非标准但广泛使用的 HTTP 请求头，格式为：

```
X-Forwarded-For: <client>, <proxy1>, <proxy2>
```

每经过一层代理，该代理将上一跳 IP 追加到列表末尾。理论上第一个 IP 是原始客户端 IP。

**代理场景下的 IP 传递流程**

```
真实用户(1.2.3.4) → Nginx 代理(10.0.0.1) → PHP-FPM
                       ↓ 追加头部
X-Forwarded-For: 1.2.3.4
REMOTE_ADDR: 10.0.0.1（PHP 看到的直接来源）
```

**安全风险：XFF 可被伪造**

由于 `X-Forwarded-For` 是普通 HTTP 请求头，恶意客户端可以在请求中预先设置该头：

```
# 攻击者构造请求
X-Forwarded-For: 127.0.0.1
```

若服务端盲目取第一个 XFF 值，攻击者即可伪造为任意 IP（如绕过 IP 白名单）。

**正确的获取策略：从可信代理链末端取值**

只信任已知可信的代理 IP，从 XFF 列表**右侧**往左，跳过所有可信代理 IP 后，第一个非可信 IP 才是真实客户端 IP：

```
X-Forwarded-For: 1.2.3.4, 10.0.0.2, 10.0.0.1
可信代理: [10.0.0.1, 10.0.0.2]
→ 从右往左：10.0.0.1（可信）→ 10.0.0.2（可信）→ 1.2.3.4（非可信）= 真实 IP
```

**`X-Real-IP`**

部分 Nginx 配置使用 `X-Real-IP` 头直接传递客户端 IP（`$remote_addr`），仅含单个 IP，无需解析列表，但同样需要确保该头只由可信代理设置（通过 Nginx 配置覆盖而非透传客户端值）。

#### 考察意图

- 考察候选人对 HTTP 代理链中 IP 传递机制的理解
- 验证是否了解 `X-Forwarded-For` 可被伪造的安全隐患
- 检验是否能设计出安全的真实 IP 获取逻辑（基于可信代理白名单）

#### 追问链

1. 如果只有一层 Nginx 反向代理，能直接用 `$_SERVER['HTTP_X_FORWARDED_FOR']` 的第一个值吗？

   简答：**不安全**。即使只有一层代理，攻击者也可以在请求中预设 `X-Forwarded-For: 伪造IP`，Nginx 默认会追加而非覆盖，导致第一个值为攻击者控制的伪造 IP。安全做法是在 Nginx 配置中用 `proxy_set_header X-Forwarded-For $remote_addr` 覆盖（而非 `$proxy_add_x_forwarded_for` 追加），或使用 `X-Real-IP` 由 Nginx 统一设置。

2. 用 IP 做限流或封禁时，应该用哪个 IP？

   简答：应使用经过可信代理校验后的"真实客户端 IP"。若直接用 `REMOTE_ADDR` 会将整个代理服务器封锁（影响所有用户）；若直接用未校验的 XFF 第一个值，攻击者可通过伪造 IP 规避封禁。必须结合可信代理白名单取得可靠 IP 后再做决策。

3. CDN 场景下如何获取真实 IP？

   简答：CDN 通常提供专有头部（如 Cloudflare 的 `CF-Connecting-IP`、AWS CloudFront 的 `CloudFront-Viewer-Address`），这些头由 CDN 服务器强制覆盖，比 XFF 更可靠。使用时需确认请求确实来自 CDN（通过 `REMOTE_ADDR` 校验是否为 CDN 的 IP 段），防止攻击者绕过 CDN 直接访问源站并伪造该头。

#### 易错点

1. **直接取 `$_SERVER['HTTP_X_FORWARDED_FOR']` 的第一个值**：XFF 是客户端可控的请求头，第一个值极易被伪造。必须结合可信代理 IP 列表，从右往左遍历后才能得到可靠的客户端 IP。

2. **将 `REMOTE_ADDR` 用于单层代理后的真实 IP**：经过反向代理后 `REMOTE_ADDR` 是代理 IP，用它做用户级别的 IP 限制会导致所有用户被视为同一 IP。需要同时维护可信代理 IP 列表。

3. **忘记处理 XFF 中的多个 IP（逗号分隔）**：`$_SERVER['HTTP_X_FORWARDED_FOR']` 可能包含 `1.2.3.4, 10.0.0.1` 这样的字符串，直接当 IP 使用会导致校验失败。必须先 `explode(',', ...)` 并 `trim` 每个元素后再处理。

#### 代码示例

```php
<?php
/**
 * 从可信代理链中获取真实客户端 IP。
 *
 * @param array $trustedProxies 可信代理 IP 列表（CIDR 或精确 IP）
 */
function getClientIp(array $trustedProxies = []): string
{
    $remoteAddr = $_SERVER['REMOTE_ADDR'] ?? '';

    // 无可信代理配置，直接返回直连 IP
    if (empty($trustedProxies)) {
        return $remoteAddr;
    }

    // 当前直连不是可信代理，直接返回
    if (!in_array($remoteAddr, $trustedProxies, true)) {
        return $remoteAddr;
    }

    // 解析 XFF，从右往左找到第一个非可信代理 IP
    $xff = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
    if ($xff === '') {
        return $remoteAddr;
    }

    $ips = array_reverse(array_map('trim', explode(',', $xff)));
    foreach ($ips as $ip) {
        if (filter_var($ip, FILTER_VALIDATE_IP) && !in_array($ip, $trustedProxies, true)) {
            return $ip;
        }
    }

    return $remoteAddr;
}

// 使用示例：已知 Nginx 代理 IP 为 10.0.0.1
$clientIp = getClientIp(['10.0.0.1']);
echo $clientIp; // 真实客户端 IP
```
