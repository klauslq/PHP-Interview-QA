---
title: PHP 浮点数精度问题是什么？如何用 bcmath 解决？
difficulty: L1
frequency: 高
tags:
  - PHP
  - 浮点数
  - 精度
  - bcmath
  - 类型系统
needs_verification: false
created: 2026-05-07
---

# [L1] PHP 浮点数精度问题是什么？如何用 bcmath 解决？

#### 一句话结论

浮点数遵循 IEEE 754 二进制表示，无法精确存储大多数十进制小数，高精度计算须改用 bcmath 或 GMP。

#### 体系讲解

**原理：IEEE 754 与十进制的不兼容**

PHP 的 `float`（双精度 64 位）遵循 IEEE 754 标准，以二进制分数存储小数。而 `0.1` 在二进制中是无限循环小数（`0.0001100110011…`），存入 64 位时会截断，产生微小误差。两个带误差的数相加，误差叠加，最终结果与预期的十进制结果不完全相等。

```
0.1 + 0.2 = 0.30000000000000004  （实际内部值）
0.1 + 0.2 == 0.3  → false
```

**直接影响**

- 比较运算（`==`）对浮点数不可靠：`0.1 + 0.2 == 0.3` 为 `false`。
- 累计误差会随计算次数增大，金融场景下几分钱的误差可造成账目不平。
- `var_dump(0.1 + 0.2)` 的默认输出 `0.3` 是 PHP 自动四舍五入格式化的结果，会掩盖实际误差。

**精度边界常量**

| 常量 | 值（近似） | 含义 |
|---|---|---|
| `PHP_FLOAT_EPSILON` | `2.22e-16` | 最小可区分的浮点增量，可作比较容差 |
| `PHP_FLOAT_MAX` | `1.80e+308` | 最大正浮点数 |
| `PHP_INT_MAX` | `9.22e+18`（64 位） | 最大整数值，超出即自动转为 float 损失精度 |

**解决方案：bcmath**

`bcmath` 扩展以**字符串**形式存储任意精度十进制数，完全绕开 IEEE 754，精度由第三个参数 `$scale` 控制小数位数。

| 函数 | 作用 |
|---|---|
| `bcadd($a, $b, $scale)` | 加法 |
| `bcsub($a, $b, $scale)` | 减法 |
| `bcmul($a, $b, $scale)` | 乘法 |
| `bcdiv($a, $b, $scale)` | 除法 |
| `bccomp($a, $b, $scale)` | 比较（返回 -1/0/1） |

#### 考察意图

- 检验候选人是否理解浮点数精度问题的根本原因（IEEE 754），而非仅知道"PHP 浮点数不准确"
- 考察在金融/电商场景下是否具备使用 bcmath 的工程习惯
- 验证是否知道浮点比较的正确姿势（`PHP_FLOAT_EPSILON` 容差法或 `bccomp()`）

#### 追问链

1. 为什么 `var_dump(0.1 + 0.2)` 输出的是 `0.3` 而不是 `0.30000000000000004`？

   简答：PHP 默认用 14 位有效数字格式化浮点数（`serialize_precision = -1` 在内部保留完整精度，但 `echo/var_dump` 的显示精度受 `precision` ini 控制，默认 14 位，四舍五入后显示为 `0.3`）。可用 `number_format(0.1 + 0.2, 20)` 看到完整误差。

2. 如何正确比较两个浮点数是否相等？

   简答：用 `PHP_FLOAT_EPSILON` 容差：`abs($a - $b) < PHP_FLOAT_EPSILON`。或直接改用 bcmath：`bccomp((string)$a, (string)$b, 10) === 0`。

3. 整数运算也会有精度问题吗？

   简答：整数本身是精确的，但当整数超过 `PHP_INT_MAX`（64 位系统约 9.2 × 10¹⁸）时，PHP 会自动将其转为 `float`，此时产生精度损失。处理大整数（如雪花 ID、大金额分值）时，用字符串存储或 bcmath 的 `bcadd()` 进行整数运算。

4. `PHP_FLOAT_EPSILON` 的用法有什么局限性？

   简答：`PHP_FLOAT_EPSILON` 约为 2.22e-16，仅适用于量级在 1 附近的数。若比较的数量级较大（如 `1e10` 级别），相对误差更合适：`abs($a - $b) / max(abs($a), abs($b)) < 1e-9`。金融场景推荐始终使用 bcmath，不依赖 epsilon 比较。

#### 易错点

1. **被 `var_dump` 的显示结果误导**：`var_dump(0.1 + 0.2)` 输出 `float(0.3)` 让人以为结果精确，但实际内部值带有误差。只有 `printf("%.20f\n", 0.1 + 0.2)` 才能暴露真实值。不少候选人从未深究过这个"表面正常"的现象。

2. **用 `==` 直接比较浮点数**：在金额校验、价格计算等场景中直接写 `if ($total == 99.99)` 是高危操作。正确做法是 bcmath 整个计算链路，最后用 `bccomp()` 比较。

3. **混淆 bcmath 与四舍五入**：`bcadd('0.1', '0.2', 2)` 返回 `'0.30'`，这是因为 bcmath 截断到指定小数位，而非四舍五入（bcmath 默认截断）。需要四舍五入时应先多取几位精度再用 `round()` 或手动处理末位。

#### 代码示例

```php
<?php

// 问题演示
var_dump(0.1 + 0.2);           // float(0.3)  ← 显示被格式化了
var_dump(0.1 + 0.2 == 0.3);    // bool(false) ← 真实比较结果
printf("%.20f\n", 0.1 + 0.2);  // 0.30000000000000004441

// PHP_FLOAT_EPSILON 容差比较
function floatEquals(float $a, float $b): bool {
    return abs($a - $b) < PHP_FLOAT_EPSILON;
}
var_dump(floatEquals(0.1 + 0.2, 0.3)); // true

// bcmath 解决方案（金融场景推荐）
$price  = '19.99';
$qty    = '3';
$total  = bcmul($price, $qty, 2);  // '59.97'
$expect = '59.97';
var_dump(bccomp($total, $expect, 2) === 0); // true

// 大整数精度问题
$snowflake = PHP_INT_MAX + 1;          // 自动转 float，精度丢失
echo bcadd((string)PHP_INT_MAX, '1');  // 9223372036854775808 — 精确
```
