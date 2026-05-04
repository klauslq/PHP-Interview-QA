---
title: Redis 有哪五种基本数据类型？各自适用什么场景？
difficulty: L1
frequency: 高
tags: [Redis, 数据类型, 缓存, 存储与中间件]
needs_verification: false
created: 2026-05-04
---

# [L1] Redis 有哪五种基本数据类型？各自适用什么场景？

#### 一句话结论

String / Hash / List / Set / ZSet 五种类型，各自对应不同的数据结构，按场景选型是 Redis 使用的核心能力。

#### 体系讲解

**五种类型速查**

| 类型 | 核心特征 | 典型命令 | 适用场景 |
|:----|:--------|:--------|:-------|
| String | 最基础的 KV，可存字符串/整数/二进制 | `SET` `GET` `INCR` `EXPIRE` | 缓存对象、计数器、分布式限流、Session |
| Hash | 字段-值映射，类似关联数组 | `HSET` `HGET` `HMGET` `HDEL` | 用户信息、配置项（按字段读写） |
| List | 有序、可重复、双端队列 | `LPUSH` `RPOP` `LRANGE` `BRPOP` | 消息队列（简单）、最新动态列表 |
| Set | 无序、不重复集合，支持集合运算 | `SADD` `SMEMBERS` `SINTER` `SUNION` | 去重、共同好友、标签系统 |
| ZSet | 有序、不重复，每成员带 score 浮点数 | `ZADD` `ZRANGE` `ZRANK` `ZRANGEBYSCORE` | 排行榜、延迟队列（score 存时间戳）|

**选型核心原则**

- 只需 KV 整存整取 → **String**
- 需要按字段更新对象部分属性 → **Hash**
- 需要顺序、队列语义（FIFO/LIFO）→ **List**
- 需要去重或集合运算（交/并/差）→ **Set**
- 需要按分数排序或范围查询 → **ZSet**

#### 考察意图

- 确认候选人能准确说出五种类型的名称及各自语义，而非只会用 String
- 考察是否具备基本的类型选型能力——给场景能选出合适类型
- 区分"知道 Redis"和"会用 Redis"：能否举出实际项目中用过哪种类型以及原因

#### 追问链

1. String 类型可以存整数并做自增，这是如何实现的？为什么是原子的？

   简答：Redis String 内部对纯整数值使用 INT 编码直接存储，`INCR` 命令在该整数上直接加一。Redis 单线程处理命令，不存在并发竞争，因此 `INCR` 天然原子，常用于计数器和限流（如每秒请求数）。

2. 用户信息该存 String（序列化 JSON）还是 Hash？怎么选？

   简答：整体读写用 String（一次网络往返，简单）；需要频繁更新单字段（如仅修改头像 URL）用 Hash（`HSET user:1 avatar xxx`，避免全量读写，节省带宽）。字段数很少（≤3）且总是整体操作时，String 更简洁；字段多、更新频繁时优先 Hash。

3. List 可以用来做消息队列吗？有什么局限？

   简答：`LPUSH` + `BRPOP` 可实现简单 FIFO 队列，`BRPOP` 支持阻塞等待。局限：消费后消息即删除，无法重复消费；无消息确认机制（消费者崩溃后消息丢失）；不支持多消费者组。需要可靠消息队列时应使用 Redis Stream（5.0+）或专业 MQ（RabbitMQ/Kafka）。

4. Set 和 ZSet 的核心区别是什么？什么场景只能用 ZSet？

   简答：Set 是无序不重复集合，ZSet 在此基础上为每个成员绑定一个 `score` 浮点数，按 score 自动排序。需要排序或范围查询时只能用 ZSet，典型场景：实时排行榜（score 存分数）、延迟队列（score 存执行时间戳，定时用 `ZRANGEBYSCORE` 轮询到期任务）。

5. Redis 对过期键有哪两种删除策略？各自的触发时机是什么？

   简答：**惰性删除**：键被访问时才检查是否过期，若已过期则删除并返回空——节省 CPU，但过期键可能长期占用内存。**定期删除**：Redis 后台定时随机抽取一批带过期时间的键，删除其中已过期的——主动回收内存，但无法保证及时清理所有过期键。两者互补，极端内存压力下还会由内存淘汰策略（`maxmemory-policy`）兜底。

#### 易错点

1. **以为 String 只能存字符串**：Redis String 是二进制安全的字节序列，可以存 JSON、图片二进制、整数；整数值还支持 `INCR`/`DECR` 原子操作，是使用最广泛的类型。

2. **用 List 做队列时忽略消息丢失风险**：`BRPOP` 取出消息后即从队列删除，若消费者处理中崩溃，消息无法重试。生产环境需要可靠消费时，应改用 Redis Stream 或专业 MQ。

3. **生产环境使用 `KEYS *` 扫描键**：`KEYS` 是 O(n) 全库扫描，Redis 单线程执行期间会阻塞所有其他命令，数百万键时可导致服务卡顿秒级。应改用 `SCAN` 命令游标分批迭代，不会长时间阻塞。

#### 代码示例

```bash
# String：计数器
SET page:views 0
INCR page:views          # 原子自增，返回 1

# Hash：用户信息按字段更新
HSET user:1 name "Alice" age 28 avatar "a.jpg"
HGET user:1 name         # 只读单字段
HSET user:1 avatar "b.jpg"  # 只更新头像，其余字段不变

# ZSet：排行榜
ZADD leaderboard 1500 "alice" 2300 "bob" 980 "carol"
ZRANGE leaderboard 0 2 WITHSCORES REV  # 取前3名（降序），Redis 6.2+
ZREVRANGE leaderboard 0 2 WITHSCORES   # 兼容 Redis 6.2 以下
```
