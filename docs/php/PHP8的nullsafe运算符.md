---
title: PHP 8.0 的 nullsafe 运算符（?->）是什么？与 ?? 有何区别？
difficulty: L1
frequency: 高
tags:
  - PHP
  - PHP 8.0
  - nullsafe
  - null处理
  - 运算符
needs_verification: false
created: 2026-05-07
---

# [L1] PHP 8.0 的 nullsafe 运算符（`?->`）是什么？与 `??` 有何区别？

#### 一句话结论

`?->` 在链式调用中遇到 `null` 时短路返回 `null`，`??` 在值为 `null` 或不存在时提供默认值，两者解决不同问题。

#### 体系讲解

**`?->` 的语义：链式短路**

在方法/属性链式调用中，任意一环返回 `null`，后续的所有调用都被跳过，整个链式表达式直接返回 `null`，不会抛出 `Call to a member function on null`。

```
$city = $user?->getAddress()?->getCity();
```

等价于：

```php
if ($user !== null) {
    $addr = $user->getAddress();
    if ($addr !== null) {
        $city = $addr->getCity();
    } else {
        $city = null;
    }
} else {
    $city = null;
}
```

**`??`（null 合并运算符）的语义：默认值**

`$a ?? $b` 等价于 `isset($a) ? $a : $b`：当 `$a` 不存在或为 `null` 时，返回 `$b`。它是提供回退值的简写，不是短路运算符。

**两者的职责对比**

| 特性 | `?->` | `??` |
|---|---|---|
| 作用 | 链式调用短路，避免空指针异常 | 为 null/不存在的值提供默认值 |
| 返回什么 | `null`（链中断）或链末端结果 | 左侧值 或 右侧默认值 |
| 作用对象 | 对象方法/属性调用 | 任意表达式（变量/数组键/方法调用） |
| PHP 版本 | 8.0+ | 7.0+ |

**组合使用**

两者常常一起出现：`?->` 负责安全导航，`??` 负责提供最终默认值：

```php
$city = $user?->getAddress()?->getCity() ?? '未知城市';
```

**`?->` 的限制**

- 只能用于**读取**（方法调用、属性读取），不能用于写入：`$user?->name = 'foo'` 是非法的。
- 不能用于静态调用（`?::` 不存在）。
- 若 `?->` 链的中间结果为 `null`，整个表达式为 `null`，不会抛出 `Error`——这也意味着 `null` 会静默传播，需要确保业务逻辑能容忍 `null` 结果。

#### 考察意图

- 检验候选人是否理解 PHP 8.0 的 null 安全导航语义
- 考察是否能清晰区分 `?->` 与 `??` 的不同使用场景
- 验证是否了解 `?->` 的写入限制，避免在实际代码中误用

#### 追问链

1. `$user?->getName()` 当 `$user` 为 `null` 时返回什么？会报错吗？

   简答：返回 `null`，不报错。`?->` 的短路机制在检测到 `null` 时立即返回 `null` 并跳过后续调用。

2. `$result = $user?->getOrders()?->first()?->getTotal() ?? 0.0` 这行代码做了什么？

   简答：链式安全导航：若 `$user`、`getOrders()` 返回值或 `first()` 返回值中任意一个为 `null`，整条链路短路返回 `null`。最后的 `?? 0.0` 将 `null` 替换为 `0.0`，保证不会将 `null` 传给后续逻辑。

3. `?->` 能用于静态方法调用吗？如 `$obj?::staticMethod()`？

   简答：不能。PHP 没有 `?::` 运算符。静态方法通过类名调用，不涉及对象是否为 null 的问题。若需要对对象做条件性静态调用，只能显式用 `if ($obj !== null) ClassName::staticMethod()`。

4. 在 PHP 8.0 之前如何实现同样的效果？

   简答：需要手动多层 `if` 嵌套，或使用辅助函数/链式方法封装。常见写法是 `$user && $user->getAddress() ? $user->getAddress()->getCity() : null`，但会重复调用。PHP 8.0 的 `?->` 消除了这一模式，且每个方法只调用一次。

#### 易错点

1. **用 `?->` 进行属性写入**：`$user?->name = 'foo'` 在 PHP 中是语法错误。`?->` 仅支持读取操作（方法调用和属性读取），不支持赋值。写入时仍需显式判空 `if ($user !== null) $user->name = 'foo'`。

2. **忽略 `null` 静默传播**：`?->` 返回 `null` 是无声的，若后续代码期望非 null 值（如将结果传给类型声明为 `string` 的参数），会触发 `TypeError`。使用 `?->` 时应配合 `??` 提供默认值，或在后续使用前做 null 检查。

3. **将 `?->` 与 `??` 混淆为同一功能**：`$user?->getCity()` 不提供默认值，返回的是 `null` 或真实结果。`$val ?? 'default'` 不做链式导航，只是给 null 提供回退。两者解决不同问题，混用会导致逻辑错误。

#### 代码示例

```php
<?php

class Address { public function __construct(public string $city) {} }
class User {
    public function __construct(public string $name, public ?Address $addr = null) {}
    public function getAddress(): ?Address { return $this->addr; }
}

$u1 = new User('张三', new Address('北京'));
$u2 = new User('李四');   // addr = null
$u3 = null;

echo $u1->getAddress()?->city;   // 北京
echo $u2->getAddress()?->city;   // （null，无输出）
echo $u3?->getAddress()?->city;  // （null，无输出）

// 配合 ?? 提供默认值
$city = $u3?->getAddress()?->city ?? '未知城市';
echo $city; // 未知城市

// ?? 单独：key 存在但为 null
$timeout = ['val' => null]['val'] ?? 30; // 30
$retry   = ['val' => null]['miss'] ?? 3; // 3

// ❌ 非法：?-> 不能用于写入
// $u3?->name = 'foo'; // Parse error
```
