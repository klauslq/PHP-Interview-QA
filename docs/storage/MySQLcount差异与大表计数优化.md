---
title: MySQL count() 的差异与大表计数优化
difficulty: L3
frequency: 高
tags: [MySQL, InnoDB, count, 查询优化, 性能]
needs_verification: false
created: 2026-05-23
---

# [L3] MySQL count() 的差异与大表计数优化

#### 一句话结论

`count(*)` 统计总行数性能最优；大表计数应用汇总表或外部计数器替代全扫描。

#### 体系讲解

**count(\*)、count(1)、count(列) 的差异**

| 写法 | 含义 | NULL 处理 | 性能 |
|---|---|---|---|
| `count(*)` | 统计总行数（含 NULL） | 不过滤 | 最优（InnoDB 有特殊优化） |
| `count(1)` | 统计总行数（含 NULL） | 不过滤 | 与 `count(*)` 相同 |
| `count(col)` | 统计该列非 NULL 的行数 | 过滤 NULL | 需判断每行是否为 NULL，稍慢 |
| `count(distinct col)` | 统计去重后的非 NULL 值数量 | 过滤 NULL | 最慢，需维护去重集合 |

**`count(*)` 为什么比 `count(主键)` 快？**

MySQL 优化器对 `count(*)` 做了专项优化：在 InnoDB 中，`count(*)` 会自动选择最小的非主键索引（二级索引的叶节点更小，扫描 IO 更少）。而 `count(主键)` 语义上指定了主键列，优化器有时不会主动切换到更小的二级索引。

**InnoDB 为什么没有缓存行数？**

InnoDB 支持 MVCC，不同事务的快照版本不同，同一时刻无法维护一个全局准确的行数。每次 `count(*)` 都需要全索引扫描。（MyISAM 因不支持事务，可直接返回元数据中的行数，O(1) 复杂度。）

**大表 count 的优化路径**

**① 走最小覆盖索引（InnoDB 自动选择，但可手动指定）**

```sql
-- InnoDB 自动选择最小二级索引；数据量大时仍需全扫描
SELECT count(*) FROM orders;

-- 若 InnoDB 未选最优索引，可 HINT 指定（MySQL 8.0 Optimizer Hints）
SELECT /*+ INDEX(orders idx_status) */ count(*) FROM orders WHERE status = 1;
```

**② 近似估算（允许误差时）**

```sql
-- information_schema 行数统计（定期采样，存在 10%~40% 误差）
SELECT TABLE_ROWS FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'app' AND TABLE_NAME = 'orders';

-- EXPLAIN 的 rows 字段（估算值，仅供参考）
EXPLAIN SELECT count(*) FROM orders;
```

**③ 汇总表（计数器表）**

维护一张专用计数表，INSERT/DELETE 触发时同步更新计数，将 `O(n)` 扫描变为 `O(1)` 查询。需防计数与数据不一致（通常在事务内一起更新）。

**④ Redis 计数器**

高频读写场景下，在 Redis 中用 `INCR` / `DECR` 维护计数，定期与数据库对账校正。吞吐量高，但需要容忍极短暂的不一致。

**⑤ 分页场景的 count 优化**

```sql
-- 反模式：每次翻页都执行全表 count
SELECT count(*) FROM articles WHERE category_id = 5;

-- 优化：仅在第一页执行 count 并缓存，翻页复用缓存值
-- 或：使用延迟关联让 count 只走索引
SELECT count(*) FROM (
    SELECT 1 FROM articles WHERE category_id = 5
) t;
```

#### 考察意图

考察候选人对 InnoDB MVCC 与行数缓存缺失的原理理解，以及在不同业务场景（精确/近似/高频）下选择合适计数方案的能力。是性能优化方向的高频考点。

#### 追问链

**Q1：为什么 InnoDB 不能像 MyISAM 那样 O(1) 返回行数？**

> MVCC 机制下，不同事务的快照隔离级别不同，同一张表对不同事务呈现的"可见行数"可能不同，因此 InnoDB 无法维护一个全局唯一的准确行数缓存，必须通过扫描索引来计算当前事务可见的行数。

**Q2：`count(*)` 和 `count(1)` 到底有没有性能差异？**

> 在现代 MySQL（5.7+）中没有可测量的差异。MySQL 优化器将两者等价处理，都会走最小二级索引扫描。历史上有过"count(1) 更快"的说法，是基于旧版本优化器行为的误传，现已不成立。推荐统一用 `count(*)`，语义最清晰。

**Q3：汇总表方案如何保证计数与数据的一致性？**

> 将数据 INSERT/DELETE 和计数表 UPDATE 放在同一个数据库事务中执行，利用 InnoDB 的原子事务保证两者同时成功或同时回滚。若使用异步队列更新计数，则只能保证最终一致，需要定期对账脚本校正偏差。

**Q4：`SELECT count(*) WHERE` 带条件时，如何确认是否走了索引？**

> 用 `EXPLAIN` 查看 `type` 字段：
> - `type = index`：全索引扫描（遍历整棵 B+ 树叶节点），仍是 O(n)，但 IO 量少于全表扫描
> - `type = range`：索引范围扫描，按条件缩小扫描范围
> - `type = ALL`：全表扫描，性能最差
> 目标是让 `count` 查询走 `index` 或 `range`。

#### 易错点

1. **用 `count(主键)` 替代 `count(*)`，认为主键最快**：主键是聚簇索引，叶节点包含完整行数据，体积远大于二级索引。`count(*)` 优化器会自动选择最小的二级索引，`count(主键)` 可能反而更慢。

2. **在高并发列表页每次都执行精确 count**：电商/社区场景的列表总页数通常允许近似，使用 `information_schema.TABLES` 缓存估算值，配合 TTL 刷新，可将 O(n) 扫描替换为 O(1) 查表。

3. **汇总表与数据更新分离为两次请求（非事务）**：若 INSERT 成功后 Redis INCR 失败，计数永久偏差。计数器更新必须与数据变更在同一事务中，或使用可靠的 Outbox 模式异步同步。

#### 代码示例

```php
<?php
// 方案对比：全表 count vs 汇总表 O(1) 计数

// ❌ 大表场景下的反模式：每次请求都全扫描
function getOrderCountSlow(PDO $pdo, int $userId): int
{
    $stmt = $pdo->prepare("SELECT count(*) FROM orders WHERE user_id = ?");
    $stmt->execute([$userId]);
    return (int)$stmt->fetchColumn();
}

// ✅ 汇总表方案：写入时同步维护计数
function createOrder(PDO $pdo, int $userId, array $data): void
{
    $pdo->beginTransaction();
    try {
        $pdo->prepare("INSERT INTO orders (user_id, ...) VALUES (?, ...)")
            ->execute([$userId, ...]);

        // 同一事务内更新计数，保证一致性
        $pdo->prepare(
            "INSERT INTO user_order_counts (user_id, cnt) VALUES (?, 1)
             ON DUPLICATE KEY UPDATE cnt = cnt + 1"
        )->execute([$userId]);

        $pdo->commit();
    } catch (\Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

// O(1) 读取计数
function getOrderCountFast(PDO $pdo, int $userId): int
{
    $stmt = $pdo->prepare("SELECT cnt FROM user_order_counts WHERE user_id = ?");
    $stmt->execute([$userId]);
    return (int)($stmt->fetchColumn() ?: 0);
}
```
