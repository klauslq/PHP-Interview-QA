---
title: PHP 8.0 的 match 表达式与 switch 有什么区别？
difficulty: L1
frequency: 高
tags:
  - PHP
  - PHP 8.0
  - match
  - switch
  - 类型系统
  - 控制结构
needs_verification: false
created: 2026-05-07
---

# [L1] PHP 8.0 的 `match` 表达式与 `switch` 有什么区别？

#### 一句话结论

`match` 使用严格比较（`===`）、无 fall-through、是表达式可直接赋值，且必须穷举所有情况。

#### 体系讲解

**核心差异对比**

| 维度 | `switch` | `match`（PHP 8.0+） |
|---|---|---|
| 比较方式 | 松散比较（`==`） | 严格比较（`===`） |
| Fall-through | 存在（需手动 `break`） | 不存在 |
| 返回值 | 语句，无返回值 | **表达式**，可赋值/传参 |
| 穷举性 | 非必须 | 必须（漏掉分支抛 `UnhandledMatchError`） |
| 多条件合并 | 堆叠 `case` | 逗号分隔同一行 |

**严格比较的实际影响**

`switch` 使用 `==`，会触发类型转换：`switch (0)` 会匹配 `case "foo"` (PHP 7) 或不匹配（PHP 8 的 `==` 行为变更后仍建议用 match）。`match` 始终用 `===`，类型不同绝不匹配，消除了一类隐蔽 bug。

**表达式语义**

`match` 是表达式，整体求值后产生一个结果，因此可以：
- 直接赋值给变量
- 作为函数参数传递
- 嵌入字符串插值（`"{$var}"`）

**穷举性要求（UnhandledMatchError）**

如果 `match` 的 subject 与所有 arm 都不匹配，且没有 `default` 分支，PHP 抛出 `UnhandledMatchError`。这是一个 `Error`（不是 `Exception`），用于在运行时发现遗漏的分支，比 `switch` 悄悄跳过更安全。

#### 考察意图

- 检验候选人是否掌握 PHP 8.0 的核心新语法
- 考察对严格比较 vs 松散比较实际影响的认知（与 `==` vs `===` 知识点衔接）
- 验证是否理解「表达式 vs 语句」的语义差异

#### 追问链

1. `match` 的严格比较在哪个场景下最容易体现价值？

   简答：HTTP 状态码处理是典型场景。`switch ($statusCode)` 中 `$statusCode` 若意外为字符串 `"200"`，可能匹配 `case 200`（PHP 7 松散比较），产生错误分支。`match` 的 `===` 保证只有严格一致才匹配，类型不符直接走 `default` 或抛错。

2. 如何用 `match` 合并多个相同结果的条件？

   简答：在同一个 arm 中用逗号分隔多个条件：`match ($code) { 400, 422 => '参数错误', 500, 503 => '服务器错误', default => '未知' }`。`switch` 需要堆叠多个无 `break` 的 `case`，更易出错。

3. `UnhandledMatchError` 属于 `Error` 还是 `Exception`，应该如何处理？

   简答：属于 `Error`（`\UnhandledMatchError extends \Error`，无中间类）。通常不应捕获它——它代表代码逻辑漏洞，应在开发阶段通过加 `default` 分支或穷举枚举来消除，而不是在生产中 `catch` 掩盖。

4. `match` 能否替代所有 `switch`？有哪些场景仍适合 `switch`？

   简答：`match` 无法完全替代 `switch`。`switch` 的 fall-through 有时有意为之（如多个条件共享部分逻辑时），`switch` 也允许在 `case` 块内执行任意语句（`match` arm 只能是表达式）。但对于"映射值→结果"的场景，`match` 更简洁安全。

#### 易错点

1. **忘记 `match` 必须穷举**：从 `switch` 迁移时，习惯性地省略 `default`，在新增业务状态时触发 `UnhandledMatchError`。正确习惯：配合 PHP 8.1 枚举（Backed Enum）使用 `match` 时，若已穷举枚举所有值可省略 `default`；其他场景建议始终保留 `default`。

2. **以为 match 可以有多行语句**：`match` arm 的右侧只能是**一个表达式**，不能是语句块 `{}`。需要执行多行逻辑时，可以封装成函数调用，或回退到 `switch`/`if-else`。

3. **混淆无 fall-through 与 `break` 的关系**：`match` 根本没有 fall-through 机制，不需要也不允许写 `break`。写了 `break` 会导致解析错误（`break` 在表达式上下文中非法）。

#### 代码示例

```php
<?php

// 严格比较：string "200" 不匹配 int 200
$code = "200";
$label = match ($code) {
    200     => 'OK',           // int 200，不匹配
    404     => 'Not Found',
    default => '未知状态码',   // 命中这里
};
echo $label; // 未知状态码

// 表达式赋值 + 多值合并（逗号分隔）
$status = 1;
echo match ($status) {
    0       => '禁用',
    1, 2    => '正常',  // 1 和 2 都返回"正常"
    default => '未知',
}; // 正常

// UnhandledMatchError：无 default 且无匹配时抛出
try {
    match (99) { 1 => 'one', 2 => 'two' };
} catch (\UnhandledMatchError $e) {
    echo $e->getMessage(); // Unhandled match case
}
```
