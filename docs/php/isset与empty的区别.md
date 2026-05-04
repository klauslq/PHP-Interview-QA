---
title: isset() 与 empty() 有什么区别
difficulty: L1
frequency: 高
tags:
  - PHP
  - 类型系统
  - 变量检测
  - 语言结构
needs_verification: false
created: 2026-04-29
---

# [L1] `isset()` 与 `empty()` 有什么区别

#### 一句话结论

`isset()` 检测变量是否存在且不为 `null`；`empty()` 检测变量是否为"空值"。

#### 体系讲解

**原理：两者的判断逻辑**

`isset()` 和 `empty()` 都是语言结构（language construct），不是函数，因此可以接受未定义的变量而不会触发 `E_NOTICE`/`E_WARNING`。

- **`isset($var)`**：当 `$var` 已声明且值不为 `null` 时返回 `true`，其余一律返回 `false`。
- **`empty($var)`**：当 `$var` 未声明或值为"空值"时返回 `true`。

两者的关系可以简化为：`empty($var)` 等价于 `!isset($var) || $var == false`（松散比较为 `false` 的值都算"空"）。

**机制：`empty()` 判定为 `true` 的完整清单**

以下值被 `empty()` 视为"空"：

| 值 | `isset()` | `empty()` |
|---|:---:|:---:|
| 未声明的变量 | `false` | `true` |
| `null` | `false` | `true` |
| `false` | `true` | `true` |
| `0`（整数零） | `true` | `true` |
| `0.0`（浮点零） | `true` | `true` |
| `""`（空字符串） | `true` | `true` |
| `"0"`（字符串零） | `true` | `true` |
| `[]`（空数组） | `true` | `true` |
| 其他值（如 `1`、`"abc"`、非空数组） | `true` | `false` |

**结论：对开发的直接影响**

- 检测用户输入是否传递了某个参数：用 `isset()`（只关心"有没有"）。
- 检测某个值是否"有意义"：用 `empty()`（关心"有没有内容"）。
- `"0"` 是最常见的陷阱——它是一个有意义的值，但 `empty("0")` 为 `true`。处理表单输入、数据库字段时务必警惕。

#### 考察意图

- 验证候选人是否掌握 PHP 中判空的精确语义，而非凭直觉使用
- 考察对 `"0"` 这一经典陷阱的认知——大量线上 bug 由此产生
- 判断候选人能否根据场景选择正确的检测方式

#### 追问链

1. `empty("0")` 返回什么？这在实际业务中可能导致什么问题？

   简答：返回 `true`。如果用 `empty()` 校验表单必填项，用户输入 `"0"` 会被误判为"未填写"。例如数量字段填 0、状态码为 "0" 的场景都会被错误拦截。

2. `isset()` 和 `array_key_exists()` 有什么区别？

   简答：`isset($arr['key'])` 在 key 存在但值为 `null` 时返回 `false`；`array_key_exists('key', $arr)` 只要 key 存在就返回 `true`，不关心值。需要区分"key 不存在"和"key 存在但值为 null"时必须用 `array_key_exists()`。

3. 为什么 `isset()` 和 `empty()` 可以接受未定义变量而不报错？

   简答：因为它们是语言结构（language construct），而不是普通函数。编译器对它们做了特殊处理，不会对传入的变量做常规的"是否已定义"检查。普通函数如 `is_null($undefined)` 会触发 `E_WARNING`。

4. PHP 8.0 引入的 null safe operator `?->` 和 null coalescing `??` 各在什么场景下使用？

   简答：`??` 用于提供默认值（`$val = $arr['key'] ?? 'default'`，等价于 `isset($arr['key']) ? $arr['key'] : 'default'`）。`?->` 用于对象链式调用中短路 null（`$user?->getAddress()?->getCity()`，任一环节为 null 则整体返回 null）。

#### 易错点

1. **用 `empty()` 校验必填项导致 `"0"` 被误拒**：这是最高频的线上 bug。表单中用户填了 `"0"`（如楼层号、数量），`empty("0")` 返回 `true`，导致必填校验不通过。正确做法是用 `$val !== '' && $val !== null` 或根据业务显式判断。

2. **对 `null` 的 `isset()` 返回 `false` 感到意外**：`$a = null; isset($a)` 返回 `false`。候选人常认为"变量已声明就该返回 true"，但 `isset()` 的语义是"已设置且非 null"。需要判断变量是否声明过（不论值），应使用 `array_key_exists()` 或在对象上用 `property_exists()`。

3. **混淆 `empty()` 与 `is_null()`**：`is_null()` 只有值严格为 `null` 时才返回 `true`，而 `empty()` 对 `0`、`""`、`false` 等都返回 `true`。两者适用场景完全不同。

#### 代码示例

```php
<?php

// isset() vs empty() 对比
$a = 0;
$b = null;
$c = "";
$d = "0";

echo "值\t\tisset\tempty\n";
echo "0\t\t" . var_export(isset($a), true) . "\t" . var_export(empty($a), true) . "\n";
echo "null\t\t" . var_export(isset($b), true) . "\t" . var_export(empty($b), true) . "\n";
echo "''\t\t" . var_export(isset($c), true) . "\t" . var_export(empty($c), true) . "\n";
echo "'0'\t\t" . var_export(isset($d), true) . "\t" . var_export(empty($d), true) . "\n";
echo "未声明\t\t" . var_export(isset($e), true) . "\t" . var_export(empty($e), true) . "\n";

// 输出:
// 值        isset   empty
// 0         true    true
// null      false   true
// ''        true    true
// '0'       true    true
// 未声明     false   true

// 实际场景：表单必填校验的正确与错误写法
$input = "0"; // 用户填写的数量

// ❌ 错误：empty("0") 为 true，误拒合法输入
if (empty($input)) {
    echo "错误：数量不能为空\n";
}

// ✅ 正确：显式判断
if (!isset($input) || $input === '') {
    echo "数量不能为空\n";
} else {
    echo "数量合法: {$input}\n"; // 输出: 数量合法: 0
}

// ?? (null coalescing) 简化 isset 三元
$config = ['debug' => null];
$debug = $config['debug'] ?? false;    // false（key 存在但值为 null，?? 视同不存在）
$verbose = $config['verbose'] ?? false; // false（key 不存在）
```
