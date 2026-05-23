---
title: SQL 注入防御基础
difficulty: L1
frequency: 高
tags: [安全, SQL注入, PDO, ORM, 预处理, 参数绑定]
needs_verification: false
created: 2026-05-23
---

# [L1] SQL 注入防御基础

#### 一句话结论

> 使用 PDO 预处理将 SQL 结构与数据在协议层分离，是防御 SQL 注入的根本手段；ORM 的 `whereRaw`/`orderByRaw` 等原始方法不受此保护。

---

#### 体系讲解

**1. 攻击向量**

SQL 注入的根本原因是将用户输入直接拼接进 SQL 字符串，数据被数据库引擎当作 SQL 语法解析。典型示例：

```php
// ❌ 直接拼接：输入 1 OR 1=1 可绕过认证
$sql = "SELECT * FROM users WHERE id = " . $_GET['id'];
```

**2. 防御机制对照**

| 防御手段 | 原理 | 局限 |
|---|---|---|
| **PDO 预处理（首选）** | `prepare()` 先编译 SQL 模板，`execute()` 传入的参数在协议层作为纯数据，不被重新解析为 SQL | 需正确使用占位符，不可在占位符外拼接 |
| **字符串转义**（`addslashes` 等） | 对特殊字符加反斜杠转义 | 依赖字符集配置，GBK 等多字节编码可绕过；手动操作易遗漏 |
| **输入白名单校验** | 限制输入为合法字符集（如纯数字 ID） | 只适用于结构固定、可枚举的字段；不可替代预处理 |

**3. PDO 预处理原理**

`prepare()` 将含占位符（`?` 或 `:name`）的 SQL 模板发送给数据库编译，之后 `execute()` 传入的参数**仅作为字面量值**，即使参数内含 `'; DROP TABLE users--` 也只会被当作普通字符串处理，不会改变 SQL 结构。

**4. ORM 防注入失效场景**

Laravel Eloquent 等主流 ORM 默认走预处理，但以下"原始方法"**不做自动参数化**，直接传入用户输入等同于裸拼接：

| 危险方法 | 风险说明 |
|---|---|
| `whereRaw('age > ' . $input)` | 原始 SQL 片段直接拼接，无任何过滤 |
| `orderByRaw($_GET['sort'])` | 排序字段由用户控制，`ORDER BY` 子句无法参数化 |
| `DB::statement($sql)` | 完整语句直接执行，绕过所有 ORM 保护 |

正确做法：通过第二参数传入绑定值，如 `whereRaw('age > ?', [$input])`。

**5. 二阶注入（Second-order Injection）**

数据入库时已转义或做过过滤，但从数据库读取后未再次处理便直接拼入 SQL，注入在"第二次使用"时触发。典型场景：用户名含 `admin'--`，注册时安全入库，但修改密码功能从库读出用户名后拼入 `UPDATE` 语句，触发注入。**防御要点：无论数据来源，所有 SQL 拼接处一律使用预处理。**

**6. 最小权限原则**

数据库账号仅授予业务所需最低权限（只读业务禁止 `DELETE`/`DROP`），即使注入成功也能限制破坏范围，是纵深防御的最后一道屏障。

---

#### 考察意图

验证候选人是否理解 SQL 注入的本质（数据与结构未分离），能否区分预处理与字符串转义在机制层面的差异，以及是否了解 ORM"安全幻觉"的典型失效场景和二阶注入的触发条件。

---

#### 追问链

1. **`bindParam` 和 `bindValue` 有什么区别？循环中哪个更安全？**  
   `bindParam` 绑定变量**引用**，`execute()` 执行时才读值；`bindValue` 绑定变量**当前值**，调用后立即复制。循环中若用 `bindParam`，所有迭代共享同一引用，最终所有行绑定最后一次循环的值；应优先使用 `bindValue` 或直接传数组给 `execute()`。

2. **为什么字符串转义（`addslashes`、`mysql_real_escape_string`）不可靠？**  
   转义依赖连接字符集的正确配置；在 GBK 等宽字节编码中，攻击者可通过构造半个宽字节"吞掉"转义符，使后续单引号逃逸。此外手动操作在代码量增大后极易遗漏，而预处理在数据库协议层保证参数不被重解析，不依赖字符集。

3. **`orderByRaw` 传入用户输入为何无法用参数绑定解决？**  
   SQL 参数绑定只作用于**值（Value）**，而 `ORDER BY` 后面跟的是**列名或表达式**，不是值。数据库不允许将列名作为参数绑定传入。正确做法是对允许排序的列名做**白名单校验**，再安全地插入 SQL：`$allowed = ['name', 'created_at']; if (in_array($col, $allowed)) orderByRaw($col);`。

---

#### 易错点

1. **误以为使用 ORM 就自动安全**：`whereRaw`、`orderByRaw`、`DB::statement` 等"逃生通道"方法不做参数化，传入用户输入等同于裸拼接；ORM 只保护其封装的标准查询构建方法。

2. **忽视二阶注入**：认为数据已入库就是"安全的"，忽略后续读取后再拼接 SQL 的风险；防御要点是所有 SQL 拼接处一律预处理，而非只在入口处防御。

3. **列名/表名无法参数化**：`ORDER BY`、`GROUP BY`、表名不接受参数绑定，误用占位符会导致查询失败或静默失效；此类动态场景必须用白名单校验后安全插入。

---

#### 代码示例

```php
<?php
$pdo = new PDO('mysql:host=localhost;dbname=app;charset=utf8mb4', $user, $pass);

// ✅ 命名占位符：参数在协议层以纯数据传入，不被解析为 SQL
$stmt = $pdo->prepare('SELECT * FROM users WHERE email = :email AND status = :status');
$stmt->bindValue(':email', $_POST['email'], PDO::PARAM_STR);
$stmt->bindValue(':status', 1, PDO::PARAM_INT);
$stmt->execute();

// ✅ 位置占位符简写（数组直接传给 execute）
$stmt2 = $pdo->prepare('SELECT * FROM orders WHERE user_id = ? AND paid = ?');
$stmt2->execute([$userId, 1]);
// ✅ 列名无法参数化：必须白名单校验后再插入 SQL
$allowed = ['name', 'created_at', 'score'];
$col = in_array($_GET['sort'] ?? '', $allowed) ? $_GET['sort'] : 'created_at';
```
