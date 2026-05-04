---
title: MySQL 中各种 JOIN 的区别是什么？
difficulty: L1
frequency: 高
tags: [MySQL, JOIN, SQL, 存储与中间件]
needs_verification: false
created: 2026-05-04
---

# [L1] MySQL 中各种 JOIN 的区别是什么？

#### 一句话结论

JOIN 类型决定结果集的行范围：INNER 取交集，LEFT/RIGHT 保留主表全部行，CROSS 产生笛卡尔积。

#### 体系讲解

MySQL 支持以下五种 JOIN，核心差异在于**结果集保留哪些行**：

| JOIN 类型 | 结果集范围 | NULL 填充方 | 典型场景 |
|:---------|:----------|:----------:|:-------|
| INNER JOIN | 仅保留两表均有匹配的行 | 无 | 查询"有订单的用户" |
| LEFT JOIN | 左表全部行 + 右表匹配行 | 右表 | 查询"所有用户及其订单（含无订单用户）" |
| RIGHT JOIN | 右表全部行 + 左表匹配行 | 左表 | 与 LEFT JOIN 互换表顺序等价，实际较少用 |
| FULL OUTER JOIN | 两表全部行（⚠️ MySQL 不支持，需 UNION 模拟） | 两侧均可 | 查询"两表中所有数据，不论是否匹配" |
| CROSS JOIN | 两表行的笛卡尔积（m × n 行） | 无 | 生成测试数据、日期维度扩展等 |

**LEFT JOIN 过滤陷阱**

LEFT JOIN 后若在 WHERE 子句对右表字段加非 NULL 条件，会将 LEFT JOIN 隐式退化为 INNER JOIN：

```sql
-- ❌ 写法：退化为 INNER JOIN（过滤掉了右表为 NULL 的行）
SELECT u.id, o.id
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE o.status = 1;

-- ✅ 写法：过滤条件放在 ON 子句，保留左表全部行
SELECT u.id, o.id
FROM users u
LEFT JOIN orders o ON u.id = o.user_id AND o.status = 1;
```

**FULL OUTER JOIN 的 MySQL 模拟写法**

```sql
SELECT * FROM a LEFT JOIN b ON a.id = b.id
UNION
SELECT * FROM a RIGHT JOIN b ON a.id = b.id;
```

#### 考察意图

- 确认候选人能区分 INNER / LEFT / RIGHT 的结果集差异，而非只会写 JOIN
- 考察是否知道 WHERE 子句会导致 LEFT JOIN 退化的常见陷阱
- 了解候选人是否清楚 MySQL 不支持原生 FULL OUTER JOIN

#### 追问链

1. LEFT JOIN 和 RIGHT JOIN 有什么本质区别？能互相替代吗？

   简答：本质相同，只是主表（保留全行的表）不同。`A LEFT JOIN B` 等价于 `B RIGHT JOIN A`。实践中统一使用 LEFT JOIN 更易读，RIGHT JOIN 几乎不单独使用。

2. LEFT JOIN 查询无订单用户时，为什么加了 `WHERE o.id IS NOT NULL` 之后结果变成了 INNER JOIN？

   简答：LEFT JOIN 对无匹配的右表行填 NULL；`WHERE o.id IS NOT NULL` 过滤掉了这些 NULL 行，只保留了两表均有匹配的行，效果等同于 INNER JOIN。反过来，`WHERE o.id IS NULL` 可精确筛出"左表有、右表无"的行。

3. CROSS JOIN 会产生多少行？什么场景下会用到它？

   简答：结果行数 = 左表行数 × 右表行数（笛卡尔积）。实际场景：用日期表 CROSS JOIN 商品表批量生成"每天每商品"的初始统计骨架，或在测试数据生成时批量组合枚举值。

4. MySQL 为什么不支持 FULL OUTER JOIN？如何模拟？

   简答：MySQL 历史上未实现该语法（PostgreSQL/SQL Server 支持）。模拟方法：`LEFT JOIN UNION RIGHT JOIN`，UNION 自动去重，恰好对应 FULL OUTER JOIN 语义——两表匹配行只出现一次，单边行各自保留。标准模拟场景用 UNION 即可。

#### 易错点

1. **LEFT JOIN + WHERE 右表字段退化为 INNER JOIN**：WHERE 子句在 JOIN 之后过滤，对右表 NULL 行施加任何非 NULL 条件都会将 LEFT JOIN 退化。正确做法是把过滤条件写进 ON 子句。

2. **误以为 MySQL 支持 FULL OUTER JOIN**：MySQL 不支持此语法，直接写会报语法错误。需用 LEFT JOIN UNION RIGHT JOIN 模拟。

3. **混淆 ON 与 WHERE 的作用时机**：ON 在生成中间结果集时过滤（不影响 LEFT JOIN 保留左表行），WHERE 在中间结果集生成后过滤（会剔除 NULL 行）。两者位置不同，结果可能截然不同。

#### 代码示例

```sql
-- 示例表：users(id, name) / orders(id, user_id, amount)

-- INNER JOIN：只返回有订单的用户
SELECT u.name, o.amount
FROM users u
INNER JOIN orders o ON u.id = o.user_id;

-- LEFT JOIN：返回所有用户，无订单则 amount 为 NULL
SELECT u.name, o.amount
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;

-- 筛选"从未下单的用户"
SELECT u.name
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE o.id IS NULL;
```
