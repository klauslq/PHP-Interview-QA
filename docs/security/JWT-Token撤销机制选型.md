---
title: JWT Token 撤销机制选型
difficulty: L3
frequency: 高
tags: [安全, JWT, Token撤销, 黑名单, 刷新令牌, Redis, 无状态, PHP]
needs_verification: false
created: 2026-05-23
---

# [L3] JWT Token 撤销机制选型

#### 一句话结论

> JWT 无状态设计使服务端无法主动撤销 Token；三种主流方案（黑名单、短 TTL+刷新令牌、版本号）各以不同程度引入状态换取撤销能力。

---

#### 体系讲解

**1. 问题根源：无状态的代价**

JWT 的核心设计优势是**无状态**——服务端无需查询存储即可验证 Token，只需校验签名和过期时间。但这意味着：

- 服务端没有"已签发 Token 列表"
- 一旦 Token 被签发，在 `exp` 到期前服务端无法主动使其失效
- 用户改密码、注销、账号被封禁后，已有 Token 仍在有效期内可继续使用

本质矛盾：**真正的无状态 = 不可撤销**。所有撤销方案都必须引入某种形式的状态。

---

**2. 方案一：黑名单（Blocklist）**

将已吊销的 Token 的 `jti`（JWT ID）存入 Redis，每次验证时查询。

```
签发 Token 时：payload 中加入唯一 jti（UUID）
撤销 Token 时：SETEX jti <剩余TTL秒> "revoked"
验证 Token 时：先验签 → 再 GET jti → 若存在则拒绝
```

```
时序图：
Client          API Server          Redis
  │                 │                  │
  │──请求+Token────▶│                  │
  │                 │──EXISTS jti─────▶│
  │                 │◀──0（未撤销）────│
  │                 │ 验签通过，处理请求│
  │◀────200─────────│                  │
  
  [用户注销后]
  │──注销请求──────▶│                  │
  │                 │──SETEX jti TTL──▶│
  │                 │ 后续同 Token 请求 │
  │                 │──EXISTS jti─────▶│
  │                 │◀──1（已撤销）────│
  │◀────401─────────│                  │
```

**代价分析：**
- 每次请求多一次 Redis 查询，增加约 1-3ms 网络延迟（本地 Redis）
- Redis 成为单点，需主从或集群保障高可用；Redis 宕机时需决策：fail-open（允许所有请求）还是 fail-closed（拒绝所有请求）
- 黑名单条目随 Token 到期自动清理（SETEX TTL = Token 剩余有效期），存储占用可控
- 本质上让 JWT 退化为有状态 Session，丧失了无状态的核心优势

---

**3. 方案二：短 TTL + 刷新令牌（Refresh Token 轮转）**

Access Token 生命周期极短（5-15 分钟），长期有效的 Refresh Token 存储在服务端（数据库或 Redis），撤销时只需删除 Refresh Token 记录。

```
Token 对体系：
┌──────────────────────────────────────────────────┐
│ Access Token（JWT，无状态，TTL=15min）             │
│ → 用于 API 鉴权，服务端不查 DB，完全无状态         │
└──────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────┐
│ Refresh Token（不透明字符串，TTL=30天，存 DB）     │
│ → 用于换取新 Access Token，服务端必须查 DB         │
└──────────────────────────────────────────────────┘

撤销流程（如用户改密码）：
  → DELETE FROM refresh_tokens WHERE user_id = ?
  → 现有 Access Token 最多还能用 15 分钟（可接受窗口）
  → 用户无法再换取新的 Access Token，下次刷新必须重新登录
```

**Refresh Token 轮转（Rotation）**：每次使用 Refresh Token 换取新 Access Token 时，旧 Refresh Token 作废，颁发新的。若检测到同一 Refresh Token 被使用两次（可能是被盗），立即吊销整个 Token 家族。

**代价分析：**
- Access Token 撤销有最大 TTL 的延迟窗口（15 分钟内仍有效）
- Refresh Token 查询只在刷新时发生（频率远低于每次 API 请求），DB 压力可接受
- 实现复杂度最高：需处理 Token 家族追踪、并发刷新竞争（多设备同时刷新）、Refresh Token 安全存储

---

**4. 方案三：用户级版本号（Token Version）**

在用户表加 `token_version` 字段，签发 Token 时将当前版本号写入 payload（`ver` claim）。验证 Token 时从 DB 查询用户的当前版本号，比对一致性。

```sql
-- 用户表
ALTER TABLE users ADD COLUMN token_version INT NOT NULL DEFAULT 1;

-- 撤销该用户所有 Token（如改密码）
UPDATE users SET token_version = token_version + 1 WHERE id = ?;

-- 验证时（伪代码）
$user = DB::find($payload->sub);
if ($payload->ver !== $user->token_version) {
    throw new TokenRevokedException();
}
```

**代价分析：**
- 每次请求必须查 DB（除非引入缓存层），失去无状态优势
- 撤销粒度是"该用户的全部 Token"，无法单独吊销某一个设备的 Token
- 实现简单，不依赖 Redis，适合小规模系统
- 可配合 Redis 缓存 `user_id → token_version` 降低 DB 压力，缓存失效策略需谨慎

---

**5. 三方案权衡矩阵**

| 维度 | 黑名单 | 短 TTL + 刷新令牌 | 版本号 |
|---|---|---|---|
| 撤销即时性 | ✅ 即时 | ⚠️ 最大 TTL 延迟 | ✅ 即时（下次请求） |
| 每次请求查存储 | Redis（高频） | 无（低频刷新时查） | DB/Redis（高频） |
| 撤销粒度 | 单个 Token | Refresh Token 家族 | 用户全部 Token |
| 无状态保留程度 | 低（引入 Redis） | 中（Access Token 段内无状态） | 低（引入 DB 查询） |
| 实现复杂度 | 中 | 高 | 低 |
| 单点风险 | Redis 故障影响全局 | DB/Redis 故障影响刷新 | DB 故障影响全局 |
| 适用场景 | 需即时撤销的中型系统 | 高安全要求的生产系统 | 小规模/初期系统 |

---

#### 考察意图

考察候选人是否理解 JWT 无状态的本质约束，能否从"撤销必然引入状态"这一基本判断出发，对三种方案的权衡（延迟、存储依赖、实现复杂度、撤销粒度）做出量化分析，而非背诵方案名称。

---

#### 追问链

1. **Refresh Token 轮转中，两台设备同时刷新会发生什么？如何处理？**  
   并发刷新时，两个请求携带同一个 Refresh Token，第一个请求成功后旧 Token 作废，第二个请求到达时旧 Token 已被标记为已使用，服务端会判断为"重放攻击"并吊销整个 Token 家族，导致两台设备都需重新登录。解决方案：① 引入短暂的刷新锁（Redis SETNX），同一 Refresh Token 在 5 秒内只处理第一个请求；② 将"已使用但未超时"的 Refresh Token 宽限一个请求（乐观并发），代价是放宽了重放检测窗口。

2. **黑名单方案中 Redis 宕机时应该 fail-open 还是 fail-closed？**  
   取决于业务安全级别。金融/账号安全场景应 fail-closed（Redis 不可用则拒绝所有需撤销验证的请求），牺牲可用性换取安全性；内容/社区类产品可 fail-open（降级为纯签名验证），已注销用户的 Token 临时有效，换取可用性。通常的工程实践：将 Redis 连接失败和"jti 不存在"分开处理，连接失败时走降级策略，jti 存在时无论 Redis 是否可用都拒绝。

3. **版本号方案能否在不增加每次请求 DB 查询的前提下使用？**  
   可以配合 Redis 缓存 `token_version`，`key = user:{id}:token_ver`，撤销时同步更新 Redis；缓存 TTL 设置为 Access Token TTL（如 15 分钟），撤销后最多 TTL 内缓存可能不一致（类似短 TTL 方案的延迟窗口）。若要求即时性则需在撤销时主动删除 Redis key（Cache-Aside 写时删除），下次请求 miss 后从 DB 补充。这实际上是黑名单和版本号的混合模式。

4. **JWT 撤销与 OAuth 2.0 的 Token Revocation（RFC 7009）是什么关系？**  
   RFC 7009 定义了 Authorization Server 提供的标准化撤销端点（`POST /revoke`），接受 access_token 或 refresh_token。它定义的是**接口协议**，不规定服务端内部如何实现撤销（可以是黑名单、版本号或删除 Refresh Token 记录）。对于 resource server（资源服务器，即 API），RFC 7009 建议通过 Token Introspection（RFC 7662）查询 AS 来验证 Token 当前是否有效，本质上是将撤销状态集中在 AS，资源服务器不自行维护。

---

#### 易错点

1. **误认为缩短 TTL 等价于可撤销**：短 TTL 缩短了"窗口期"，但在这个窗口内 Token 仍不可撤销。用户账号被盗后，攻击者在剩余 TTL 内仍可操作。短 TTL 是降低风险暴露时间的手段，不是真正意义上的撤销机制。撤销必须结合 Refresh Token 吊销，才能在 Access Token 到期后切断续期路径。

2. **黑名单 jti 未设置过期时间**：将 jti 加入黑名单时，若使用 `SET` 而非 `SETEX`（或未设 `EX`），黑名单条目永不过期，随时间积累会占满 Redis 内存。正确做法是 `SETEX jti <Token剩余有效秒数> "1"`，Token 到期后黑名单条目自动清除。

3. **版本号方案误用为跨设备独立撤销**：版本号递增会使该用户**所有设备**的所有 Token 同时失效，无法单独注销某一台设备。若需要"注销指定设备"，需为每个 Token 或设备分配独立的 jti，退化为黑名单方案，或引入设备级 Refresh Token 表（每台设备一条记录）。

---

#### 代码示例

```php
<?php
// 方案二：短 TTL Access Token + Refresh Token 轮转的核心逻辑（PHP 8.0+）

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

final class TokenService
{
    private const ACCESS_TTL  = 900;    // 15 分钟
    private const REFRESH_TTL = 2592000; // 30 天

    public function __construct(
        private readonly string $jwtSecret,
        private readonly \PDO   $db,
    ) {}

    public function issueTokenPair(int $userId): array
    {
        $accessToken  = $this->createAccessToken($userId);
        $refreshToken = $this->createRefreshToken($userId);
        return compact('accessToken', 'refreshToken');
    }

    public function rotate(string $oldRefreshToken): array
    {
        $record = $this->findRefreshToken($oldRefreshToken);

        if ($record === null || $record['used_at'] !== null) {
            // 已使用的 Refresh Token 再次出现 → 疑似重放，吊销整个用户的所有令牌
            if ($record !== null) {
                $this->revokeAllForUser($record['user_id']);
            }
            throw new \RuntimeException('Refresh token reuse detected');
        }

        // 标记旧 Token 已使用，颁发新令牌对
        $this->markRefreshTokenUsed($record['id']);
        return $this->issueTokenPair($record['user_id']);
    }

    public function revokeAllForUser(int $userId): void
    {
        $this->db->prepare('DELETE FROM refresh_tokens WHERE user_id = ?')
                 ->execute([$userId]);
    }

    private function createAccessToken(int $userId): string
    {
        return JWT::encode([
            'sub' => $userId,
            'iat' => time(),
            'exp' => time() + self::ACCESS_TTL,
            'jti' => bin2hex(random_bytes(16)),
        ], $this->jwtSecret, 'HS256');
    }

    private function createRefreshToken(int $userId): string
    {
        $token = bin2hex(random_bytes(32));
        $this->db->prepare(
            'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
        )->execute([$userId, hash('sha256', $token), time() + self::REFRESH_TTL]);
        return $token;
    }

    private function findRefreshToken(string $token): ?array { /* 查询逻辑 */ return null; }
    private function markRefreshTokenUsed(int $id): void     { /* 标记逻辑 */ }
}
```
