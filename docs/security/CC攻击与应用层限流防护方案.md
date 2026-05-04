---
title: CC 攻击与应用层限流防护方案
difficulty: L2
frequency: 高
tags: [安全, CC攻击, Rate Limiting, Redis, WAF, PHP]
needs_verification: false
created: 2026-05-04
---

# [L2] CC 攻击与应用层限流防护方案

#### 一句话结论

> CC 攻击用海量合法请求打垮应用层，防御核心是滑动窗口 Rate Limiting + IP 封禁 + WAF 纵深组合。

---

#### 体系讲解

**1. CC 攻击 vs DDoS 攻击**

| 维度 | DDoS（网络层） | CC（应用层） |
|---|---|---|
| 攻击目标 | 带宽 / 网络协议栈 | HTTP 接口（DB 查询、业务逻辑） |
| 流量特征 | 数据包畸形、端口扫描 | 正常 HTTP GET/POST |
| 防御层 | 运营商黑洞路由、流量清洗 | 应用层限流、WAF、CDN |
| 典型工具 | LOIC / SYN Flood | HTTP Flood / Slowloris |

CC（Challenge Collapsar）专门模拟正常用户行为请求高消耗接口（搜索、登录、验证码），传统防火墙无法识别。

**2. Rate Limiting 三种算法对比**

| 算法 | 原理 | 优势 | 缺点 |
|---|---|---|---|
| **固定窗口** | 每分钟计数，到时重置 | 实现最简单 | 窗口边界突刺（可瞬间承受 2×QPS） |
| **滑动窗口** | 维护过去 N 秒的请求时间戳队列 | 无突刺，限流精准 | 内存占用较高 |
| **令牌桶** | 固定速率填充令牌，超限拒绝 | 允许短时突发，平滑流量 | 参数调优略复杂 |

**生产推荐**：高精度场景用滑动窗口（Redis Sorted Set 实现），允许突发场景用令牌桶。

**3. 滑动窗口 Redis 实现思路**

利用 Redis Sorted Set：以请求时间戳为 score，每次请求时：
1. 删除窗口外的过期记录（`ZREMRANGEBYSCORE`）
2. 统计当前窗口内请求数（`ZCARD`）
3. 未超限则添加当前请求（`ZADD`），超限则拒绝
4. 整个操作用 Lua 脚本保证原子性

**4. 纵深防御层次**

```
请求流量
  ↓  CDN / 运营商清洗（流量层）
  ↓  Nginx limit_req（连接层限流）
  ↓  WAF 规则匹配（行为识别）
  ↓  应用层 Rate Limiting（业务限流）
  ↓  IP 封禁 / 验证码（惩罚机制）
  ↓  业务逻辑
```

---

#### 考察意图

考察候选人是否能区分网络层 DDoS 与应用层 CC 的本质差异，以及是否理解 Rate Limiting 算法选型背后的权衡——固定窗口的边界突刺问题是高频追问点；是否能用 Redis 实现生产可用的限流，体现工程实践深度。

---

#### 追问链

1. **固定窗口限流的「边界突刺」问题是什么？如何用滑动窗口解决？**  
   假设限制每分钟 100 次：攻击者可在 00:59 发送 100 次、01:00 再发 100 次，2 秒内共 200 次请求均合法。滑动窗口用「当前时间 - 60s」为起点的动态区间，每次请求只统计真实 60s 内的请求数，彻底消除突刺。

2. **Lua 脚本在 Rate Limiting 中解决了什么问题？**  
   滑动窗口需要「删除过期 → 统计 → 写入」三步操作，如果拆成三条独立 Redis 命令，并发场景下会出现 TOCTOU（检查-使用时差）竞态，导致限流计数不准。Lua 脚本在 Redis 单线程内原子执行，保证计数一致性。

3. **IP 封禁策略有什么局限性？如何应对 IP 轮换的僵尸网络？**  
   单纯封禁 IP 对使用大量代理/肉鸡的僵尸网络效果有限。应对策略：①行为特征限流（User-Agent、Cookie、行为模式）；②对高风险操作加验证码/滑块；③基于账号/设备指纹而非 IP 的限流维度；④接入专业 CC 防护服务（如 Cloudflare、阿里云 WAF）。

---

#### 易错点

1. **只封禁 IP，不做应用层限流**：IP 封禁是事后惩罚手段，封禁生效前攻击已经打到应用层。应在 IP 封禁之前先通过 Rate Limiting 快速拒绝超限请求，减少数据库/业务逻辑的实际压力。

2. **限流粒度太粗（只限全局 QPS）**：全局限流保护不了热点接口（如登录、短信验证码），应按「接口 + IP」或「接口 + 用户 ID」双维度限流，避免热点接口被单独打穿。

3. **忘记设置 Redis Key 过期时间**：滑动窗口 Sorted Set 如果不设置兜底 TTL，无活跃请求后 Key 会永久占用内存。应在写入时同步调用 `EXPIRE` 设置略大于窗口时长的 TTL 兜底。

---

#### 代码示例

```php
/**
 * 滑动窗口限流（Redis Sorted Set + Lua 原子脚本）
 * @param Redis  $redis
 * @param string $key       限流维度标识，如 "rate:login:{ip}"
 * @param int    $limit     窗口内最大请求数
 * @param int    $windowSec 窗口时长（秒）
 */
function isRateLimited(Redis $redis, string $key, int $limit, int $windowSec): bool
{
    $now = (int) (microtime(true) * 1000); // 毫秒时间戳
    $windowStart = $now - $windowSec * 1000;

    $lua = <<<LUA
local key   = KEYS[1]
local now   = tonumber(ARGV[1])
local start = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local ttl   = tonumber(ARGV[4])
redis.call('ZREMRANGEBYSCORE', key, '-inf', start)
local count = redis.call('ZCARD', key)
if count < limit then
    redis.call('ZADD', key, now, now)
    redis.call('EXPIRE', key, ttl)
    return 0
end
return 1
LUA;

    return (bool) $redis->eval($lua, [$key, $now, $windowStart, $limit, $windowSec + 1], 1);
}

// 调用示例：登录接口每 IP 每 60 秒限 10 次
$ip  = $_SERVER['REMOTE_ADDR'];
$key = "rate:login:{$ip}";
if (isRateLimited($redis, $key, 10, 60)) {
    http_response_code(429);
    exit(json_encode(['error' => 'Too Many Requests']));
}
```
