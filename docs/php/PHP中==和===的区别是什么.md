---
title: PHP 中 == 和 === 的区别是什么
difficulty: L1
frequency: 高
tags:
  - PHP
  - 类型系统
  - 比较运算符
  - 弱类型
needs_verification: false
created: 2026-04-29
---

# [L1] PHP 中 `==` 和 `===` 的区别是什么

#### 一句话结论

`==` 比较值（会类型转换），`===` 同时比较值和类型（不转换）。

#### 体系讲解

**原理：PHP 的弱类型比较规则**

PHP 是弱类型语言，变量不绑定固定类型。`==`（松散比较）在比较前会按照一套内部规则对操作数做类型转换（type juggling），再比较转换后的值；`===`（严格比较）要求类型和值同时相等，不做任何隐式转换。

**机制：松散比较的转换规则**

当 `==` 两侧类型不同时，PHP 按以下优先级转换：

1. **null / bool 优先**：任一侧为 `null` 或 `bool`，另一侧转为 `bool` 比较。`null` 转为 `false`，非空字符串转为 `true`。
2. **数字型字符串**：两侧为数字或数字型字符串时，转为 `int` 或 `float` 比较。
3. **对象 vs 基本类型**：对象与基本类型比较时，对象先被转换为对应基本类型。

> **PHP 8.0 重大变更**：`0 == "foo"` 在 PHP 7 中为 `true`（字符串转为 0），PHP 8.0 起改为 `false`（当字符串非数字型时，数字转为字符串再比较）。这是松散比较最著名的行为变更。

**结论：对开发的直接影响**

- 条件判断、`in_array()`、`array_search()` 等函数默认使用松散比较，极易产生意外匹配。
- 实际项目中应将 `===` 作为默认选择，只在明确需要类型转换时才用 `==`。
- `in_array()` 和 `array_search()` 的第三个参数 `$strict` 设为 `true` 可启用严格模式。

#### 考察意图

- 验证候选人是否理解 PHP 弱类型的核心特征，而非仅停留在"一个等号是赋值"
- 检验对松散比较常见陷阱的认知，这是日常开发中最高频的 bug 来源之一
- 判断候选人是否有"默认严格比较"的编码习惯

#### 追问链

1. `0 == "foo"` 在 PHP 7 和 PHP 8 中结果分别是什么？为什么不同？

   简答：PHP 7 为 `true`（`"foo"` 转为 `int` 得 `0`，`0 == 0`）；PHP 8 为 `false`（非数字型字符串不再转为 `0`，而是将数字转为字符串比较 `"0" == "foo"`）。

2. `in_array("0", ["foo", "bar"])` 在 PHP 7 中返回什么？怎样避免？

   简答：PHP 7 返回 `true`，因为 `"0" == "foo"` 松散比较会将两者都转为数字。使用 `in_array("0", ["foo", "bar"], true)` 启用严格模式即可避免。

3. `null == false` 和 `null === false` 分别返回什么？

   简答：`null == false` 为 `true`（`null` 转为 `false`，`false == false`）；`null === false` 为 `false`（类型不同，`null` 与 `bool`）。

4. `switch` 语句用的是松散比较还是严格比较？PHP 8 有什么替代方案？

   简答：`switch` 用松散比较，可能产生意外匹配。PHP 8.0 引入的 `match` 表达式使用严格比较（`===`），且不会 fall-through，是更安全的替代。

#### 易错点

1. **忽视 PHP 版本差异**：`0 == ""` 在 PHP 7 为 `true`，PHP 8 为 `false`。如果代码在版本升级后行为变化，多半是松散比较所致。候选人常以"PHP 就是这样"一笔带过，未意识到 8.0 的 breaking change。

2. **以为 `in_array` 默认是严格比较**：`in_array()` 默认松散比较，在权限校验等安全场景下如果忘记传第三个参数 `true`，可能导致越权。正确姿势是始终传入 `strict: true`。

3. **混淆 `==` 和 `=`**：在 `if` 条件中误写 `if ($a = 1)` 变成赋值。虽然属于初级错误，但面试中偶尔被追问。可通过把常量放左侧 `if (1 === $a)` 或依赖 IDE 检查来预防。

#### 代码示例

```php
<?php

// 松散比较的经典陷阱
var_dump(0 == "php");     // PHP 7: true | PHP 8: false
var_dump("" == null);     // PHP 7: true | PHP 8: true
var_dump("0" == false);   // true（两个版本一致，"0" 转 bool 为 false）
var_dump("0" === false);  // false（类型不同）

// in_array 的松散比较陷阱
$whitelist = ["admin", "editor"];
var_dump(in_array(0, $whitelist));              // true — 危险！
var_dump(in_array(0, $whitelist, strict: true)); // false — 安全

// match（PHP 8.0+）使用严格比较
$status = 0;
$label = match ($status) {
    0     => '待处理',
    '0'   => '字符串零',  // 不会匹配 int 0
    default => '未知',
};
echo $label; // 输出: 待处理
```
