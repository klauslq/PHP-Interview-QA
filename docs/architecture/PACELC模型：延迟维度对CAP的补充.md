---
title: PACELC模型：延迟维度对CAP的补充
difficulty: L2
frequency: 中
tags: [PACELC, CAP, 延迟, 一致性, 分布式系统, 选型]
needs_verification: false
created: 2026-05-23
---

# [L2] PACELC模型：延迟维度对CAP的补充

#### 一句话结论

PACELC 在 CAP 基础上补充"正常运行时延迟 vs 一致性"的权衡，使选型更完整。

---

#### 体系讲解

**1. CAP 的盲区**

CAP 只描述**网络分区（Partition）发生时**的极端场景，但分布式系统大多数时间运行在正常状态。即使没有分区，**强一致性依然有代价**：

- 写操作需等待多数副本确认，**增加延迟**
- 同步复制使写 P99 受最慢副本影响

CAP 对此完全没有描述。

**2. PACELC 模型（Daniel Abadi，2012）**

```
If Partition:  A（可用性） vs C（一致性）      ← 与 CAP 相同
Else：         L（延迟）   vs C（一致性）      ← CAP 缺失的维度
```

完整读法：**PA/EL、PA/EC、PC/EL、PC/EC**

| 系统 | 分区时 | 正常时 | 分类 |
|---|---|---|---|
| DynamoDB（默认） | 保 A | 保低延迟 | PA/EL |
| Cassandra（ONE 级别） | 保 A | 保低延迟 | PA/EL |
| Cassandra（QUORUM 级别） | 保 A | 保一致性 | PA/EC |
| ZooKeeper | 保 C | 保一致性 | PC/EC |
| MySQL 主从（异步复制） | 保 A | 保低延迟 | PA/EL |
| MySQL 同步复制（MGR 全同步） | 保 C | 保一致性 | PC/EC |

**3. Else（正常运行）时的 L vs C 权衡**

| 选择 | 实现方式 | 代价 |
|---|---|---|
| 保低延迟（EL） | 写主库即返回，异步同步副本 | 主库宕机时可能丢最近写入 |
| 保一致性（EC） | 写操作等待 Quorum 确认再返回 | 写 P99 受网络 RTT × 副本数影响 |

Cassandra 通过 `ConsistencyLevel` 参数让业务自行选择：

```
ONE   → 写入 1 副本即返回（EL，低延迟）
QUORUM → 写入多数派副本后返回（EC，强一致）
ALL   → 写入所有副本后返回（EC 最强，延迟最高）
```

**4. PACELC 的选型意义**

CAP 分类相同的系统，PACELC 可以区分：

- Cassandra 和 DynamoDB 同为 PA，但 Cassandra 可调为 PA/EC（强一致），DynamoDB 在正常时默认 EL
- MySQL 主从（PA/EL）与 MySQL MGR 全同步（PC/EC）CAP 不同，PACELC 更精确描述正常运行时的延迟成本

**5. 实践选型参考**

```
对延迟极度敏感（游戏排行榜/实时推荐）→ PA/EL（Cassandra ONE / Redis）
需要正常运行时强一致（账务/配置）    → PC/EC（ZooKeeper / MySQL 同步）
分区时可降级、正常时要强一致         → PA/EC（Cassandra QUORUM）
```

---

#### 考察意图

考察候选人是否了解 CAP 的局限性，能否说明 PACELC 补充的"正常状态下延迟 vs 一致性"维度；以及能否结合 Cassandra ConsistencyLevel 等实际配置理解 E（Else）部分的工程映射。

---

#### 追问链

1. **Cassandra 的 QUORUM 写是如何保证一致性的？**
   > 写操作发送到所有副本节点，等待 `⌊N/2⌋ + 1` 个节点返回 ACK 后才向客户端确认成功；读操作同样读取多数派并取最新版本（时间戳最大）。读写均为 QUORUM 时，`读QUORUM + 写QUORUM > N`，保证至少有 1 个节点同时参与读写，读到的必然是最新值。

2. **PACELC 中的 L（延迟）具体指哪种延迟？**
   > 主要指**写操作的确认延迟**：同步等待副本 ACK 的网络往返时间（RTT）。EL 策略（异步复制）写入 1 个节点后即返回，延迟最低；EC 策略（Quorum 同步）需等待多个跨机房节点，P99 可能达到数十毫秒差异。读延迟通常通过本地副本缓解，影响较小。

3. **CAP 和 PACELC 在实际系统选型中应如何配合使用？**
   > CAP 用于**初步筛选**：需要强一致协调（分布式锁/Leader 选举）→ CP；需要高可用服务发现/缓存 → AP。PACELC 用于**精确调参**：AP 系统内部，正常运行时是否可以接受额外延迟换取更强一致（如 Cassandra QUORUM）。两者结合才能覆盖分区场景与正常场景的全部权衡。

---

#### 易错点

1. **认为 PACELC 取代了 CAP**：PACELC 是对 CAP 的**扩展补充**，而非替代。CAP 的 P/A/C 三角在分区场景下依然成立，PACELC 只是在此之上增加了正常运行时的 L/C 维度。

2. **将 PACELC 的 E（Else）理解为"分区结束后"**：E 指"没有分区发生的正常状态"，不是分区结束后的恢复阶段；正常运行时的 L vs C 权衡与分区场景无关，是持续存在的选型问题。

3. **认为 PA/EL 系统不能做到强一致**：PA/EL 是默认行为描述。Cassandra 在 PA 分类下，通过提升 ConsistencyLevel 可以在正常运行时切换到 EC（强一致），系统的分类会随配置变化，不是固定属性。

---

#### 代码示例

本题为纯理论模型，代码示例以 Cassandra ConsistencyLevel 配置伪代码说明 EL/EC 切换：

```php
// 模拟 Cassandra 写入的 EL vs EC 一致性级别切换
class CassandraWriter
{
    public function writeWithEL(string $key, string $value): void
    {
        // ConsistencyLevel::ONE → 写入 1 个副本即返回（低延迟，PA/EL）
        $this->execute(
            "INSERT INTO kv (key, value) VALUES (?, ?)",
            [$key, $value],
            consistencyLevel: 'ONE'
        );
    }

    public function writeWithEC(string $key, string $value): void
    {
        // ConsistencyLevel::QUORUM → 等待多数派确认（一致性强，PA/EC）
        // 若 3 副本跨 2 机房，QUORUM 写需等待 2 个 ACK，延迟增加约 10-30ms
        $this->execute(
            "INSERT INTO kv (key, value) VALUES (?, ?)",
            [$key, $value],
            consistencyLevel: 'QUORUM'
        );
    }

    private function execute(string $cql, array $params, string $consistencyLevel): void
    {
        // 实际使用 datastax/php-driver 或 HTTP API
        echo "执行 [{$consistencyLevel}] {$cql} - 参数: " . implode(', ', $params) . PHP_EOL;
    }
}
```
