---
title: PHP 类型强转有哪些方式？各种类型互转的规则是什么？
difficulty: L1
frequency: 中
tags:
  - PHP
  - 类型系统
  - 类型转换
  - 弱类型
needs_verification: false
created: 2026-05-07
---

# [L1] PHP 类型强转有哪些方式？各种类型互转的规则是什么？

#### 一句话结论

PHP 提供 cast 语法 `(type)`、`settype()` 和转换函数三种方式，转换规则以"当前值的内容"为依据，非空非零均转为 `true`。

#### 体系讲解

**三种强转方式**

| 方式 | 示例 | 特点 |
|---|---|---|
| Cast 语法 | `(int)$var` | 创建新值，原变量不变 |
| `settype()` | `settype($var, 'int')` | 原地修改变量类型 |
| 类型专属函数 | `intval()` / `strval()` / `floatval()` / `boolval()` | 允许指定进制（`intval($var, 16)`） |

**核心转换规则**

**→ int/float**

| 原始值 | 转换结果 |
|---|---|
| `true` | `1` |
| `false` / `null` | `0` |
| `"42abc"` | `42`（取前导数字部分） |
| `"abc"` | `0`（无前导数字） |
| `[]`（空数组） | `0` |
| `[1,2]`（非空数组） | `1` |

**→ bool**

转为 `false` 的值（完整清单）：`0`、`0.0`、`""`、`"0"`、`[]`、`null`。其余**一律**为 `true`（包括 `-1`、`"false"` 字符串、非空数组）。

**→ string**

| 原始值 | 转换结果 |
|---|---|
| `true` | `"1"` |
| `false` | `""`（空字符串，不是 `"false"`） |
| `null` | `""`（空字符串） |
| `42` | `"42"` |
| 数组 | `"Array"`（触发 notice，无法序列化） |
| 对象 | 需实现 `__toString()`，否则报 `TypeError` |

**→ array**

标量值转数组时，结果为只含该值的索引数组 `[0 => $val]`。`null` 转为空数组 `[]`。

**强转 vs 松散比较（`==`）的关系**

`==` 内部正是依据上述规则做隐式强转再比较，理解强转规则即理解了 `==` 的行为根源。

#### 考察意图

- 检验候选人是否系统掌握 PHP 类型转换的边界情况
- 考察对 `false → ""` 而非 `"false"` 等反直觉转换的认知
- 验证是否了解三种强转方式的适用场景（特别是 `intval()` 的进制参数）

#### 追问链

1. `(bool)"false"` 的结果是什么？

   简答：`true`。`"false"` 是非空、非 `"0"` 字符串，转 bool 为 `true`。只有空字符串 `""` 和字符串 `"0"` 转为 `false`，字符串内容是 `"false"` 并不影响结果。

2. `(int)"42abc"` 和 `(int)"abc42"` 分别是什么？

   简答：`42` 和 `0`。PHP 从字符串左侧开始解析，提取前导的连续数字部分；`"42abc"` 前导是 `42`，`"abc42"` 无前导数字故为 `0`。

3. `(string)false` 和 `(string)null` 分别输出什么？这在实际中有什么陷阱？

   简答：两者都是空字符串 `""`。陷阱在于：将 `false` 写入日志或数据库时，字段存的是空字符串而非 `"false"`，日后读取无法区分"存的是 false"还是"存的是空字符串"。序列化布尔值时应使用 `json_encode()` 或 `var_export()` 保留类型信息。

4. `settype()` 和 cast 语法有什么实际使用场景的差异？

   简答：cast 语法（`(int)$x`）产生新值，原变量不变，适合临时转换（如函数参数）；`settype()` 原地修改，适合批量转换数组元素或需要永久改变变量类型的场景。大多数现代代码优先使用 cast，因为它更显式、不产生副作用。

#### 易错点

1. **误认为 `(string)false === "false"`**：`(string)false` 是空字符串 `""`，而不是字符串 `"false"`。类似地，`(string)true === "1"` 而非 `"true"`。这是最常见的强转误区，容易导致日志/API 响应中布尔值信息丢失。

2. **`(bool)[]` 与 `(bool)[0]` 的混淆**：空数组 `[]` 转 bool 为 `false`；非空数组（哪怕只含 `false` 或 `0`）转 bool 为 `true`。`(bool)[0]` → `true`，`(bool)[false]` → `true`，这与"数组内容是否为假值"无关。

3. **用 `intval()` 时忽略进制参数**：`intval('0x1A')` 默认十进制返回 `0`（因为 `"0x1A"` 无前导十进制数字），需写 `intval('0x1A', 16)` 才得到 `26`。处理十六进制颜色值、权限码等时容易踩坑。

#### 代码示例

```php
<?php

// → bool：只有这 6 种值为 false，其余全为 true
var_dump((bool)"");        // false
var_dump((bool)"0");       // false
var_dump((bool)"false");   // true ← 反直觉！
var_dump((bool)[]);        // false
var_dump((bool)[0]);       // true ← 数组非空即 true

// → string：true→"1"，false/null→""（非 "false"/"null"）
var_dump((string)true);    // "1"
var_dump((string)false);   // ""  ← 不是 "false"！

// → int：取前导数字
var_dump((int)"42abc");    // 42
var_dump((int)"abc42");    // 0

// intval 进制参数
var_dump(intval('1A', 16)); // 26
var_dump(intval('010', 8)); // 8
var_dump(intval('010'));    // 10（默认十进制）

// settype 原地修改（vs cast 产生新值）
$val = "99";
settype($val, 'integer');
var_dump($val); // int(99)
```
