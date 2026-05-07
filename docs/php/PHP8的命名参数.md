---
title: PHP 8.0 的命名参数（Named Arguments）是什么？有哪些使用场景？
difficulty: L1
frequency: 中
tags:
  - PHP
  - PHP 8.0
  - 命名参数
  - 函数
  - 语法
needs_verification: false
created: 2026-05-07
---

# [L1] PHP 8.0 的命名参数（Named Arguments）是什么？有哪些使用场景？

#### 一句话结论

命名参数允许按参数名而非位置传参，可跳过可选参数并提升多参数函数调用的可读性。

#### 体系讲解

**基本语法**

```php
functionName(paramName: value);
```

参数名对应函数签名中的形参名（不含 `$`），顺序可以与声明顺序不同。

**核心用途**

**1. 跳过可选参数**

内置函数往往有多个可选参数，使用位置参数时若只需指定第 3 个，必须把前两个也写出来。命名参数可直接跳过：

```php
// 旧写法：必须写出不需要的中间参数
array_slice($arr, 0, null, true);

// 命名参数：直接指定需要的参数
array_slice($arr, offset: 0, preserve_keys: true);
```

**2. 提升可读性**

对于含多个 `bool` 参数的函数，命名参数让调用意图一目了然：

```php
// 不清楚两个 true 分别是什么
htmlspecialchars($str, ENT_QUOTES, 'UTF-8', false);

// 语义清晰
htmlspecialchars($str, encoding: 'UTF-8', double_encode: false);
```

**3. 与展开运算符结合**

命名参数可以与 `...` 展开运算符混用，展开数组时会按键名匹配参数名：

```php
$params = ['offset' => 2, 'length' => 5];
$result = array_slice($arr, ...$params);
```

**限制**

- 不能重复传同一个参数（位置 + 命名各传一次会报错）。
- 命名参数名与函数形参名绑定，如果库升级重命名了参数，调用方需同步修改。
- 不能用于可变参数（`...$args`）。

#### 考察意图

- 检验候选人是否掌握 PHP 8.0 常用语法改进
- 考察能否说出命名参数的实际价值（跳过可选参数、可读性），而非仅描述语法形式
- 验证是否了解其局限性（参数名耦合、不可重复传参）

#### 追问链

1. 命名参数和位置参数可以混用吗？有什么限制？

   简答：可以混用，但**位置参数必须在命名参数之前**。`foo(1, name: 'bar')` 合法；`foo(name: 'bar', 1)` 非法（命名参数后不能再跟位置参数，会报解析错误）。

2. 如果第三方库升级时把参数名 `$length` 改为 `$size`，使用命名参数的调用方会怎样？

   简答：会抛出 `TypeError: foo(): Unknown named parameter $length`。这是命名参数的主要副作用——调用方与库的参数名产生耦合。因此命名参数更适合调用自己维护的代码，对第三方库需谨慎使用（除非库保证参数名稳定）。

3. 命名参数能用于构造函数吗？和 Constructor Promotion 如何配合？

   简答：可以。PHP 8.0 的 Constructor Promotion（`public function __construct(public string $name)`）定义的属性名同时也是参数名，可直接用命名参数调用：`new User(name: 'Alice', age: 30)`。这让对象实例化更语义化，尤其是参数多时可读性显著提升。

4. 命名参数对 `array_map`、`array_filter` 等回调类函数有什么限制？

   简答：回调函数内部的参数名与 `array_map` 的签名无关，命名参数只能用于直接函数调用。对 `array_map(callback: $fn, array: $arr)` 这种内置函数可以用命名参数指定 `array_map` 自身的参数，但不影响回调 `$fn` 的调用方式。

#### 易错点

1. **位置参数与命名参数的顺序**：命名参数之后不能再出现位置参数，否则解析错误。`foo(a: 1, 2)` 非法。常见错误是在修改调用代码时，把最后一个参数改成命名参数，但又在其后加了新的位置参数。

2. **参数名耦合导致升级问题**：对公开发布的库来说，参数重命名是 breaking change（PHP 8.0 开始）。这是命名参数引入的新型兼容性问题。面试时候选人常忽略这一副作用，只看到便利性。

3. **以为命名参数可以替代默认值**：命名参数"跳过"的是有默认值的可选参数，不是"不传"该参数。若函数要求某参数必传（无默认值），命名参数也无法跳过它，否则报 `Missing argument` 错误。

#### 代码示例

```php
<?php

// 1. 跳过可选参数
$arr = [1, 2, 3, 4, 5];
print_r(array_slice($arr, offset: 1, preserve_keys: true));
// [1 => 2, 2 => 3, 3 => 4, 4 => 5]

// 2. 混用：位置参数必须在命名参数前
function createUser(string $name, int $age = 0, string $role = 'user'): string {
    return "{$name}({$age},{$role})";
}
echo createUser('Alice', role: 'admin'); // Alice(0,admin) — 跳过 $age
echo createUser('Bob',   age: 25);       // Bob(25,user)

// 3. 展开运算符按键名匹配参数名
$params = ['length' => 3, 'offset' => 1];
print_r(array_slice($arr, ...$params)); // [2, 3, 4]

// 4. Constructor Promotion + 命名参数
class Product {
    public function __construct(
        public string $name, public float $price, public int $stock = 0
    ) {}
}
$p = new Product(name: 'PHP 手册', price: 99.9);
echo $p->name; // PHP 手册
```
