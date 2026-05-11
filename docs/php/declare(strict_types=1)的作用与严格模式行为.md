---
title: declare(strict_types=1) 的作用是什么？严格模式与强制模式有何区别？
difficulty: L1
frequency: 高
tags:
  - PHP
  - 类型声明
  - strict_types
  - 严格模式
  - TypeError
needs_verification: false
created: 2026-05-11
---

# [L1] `declare(strict_types=1)` 的作用是什么？严格模式与强制模式有何区别？

#### 一句话结论

`declare(strict_types=1)` 让当前文件的函数调用强制匹配类型，传错类型直接抛 `TypeError`，而非隐式强转。

#### 体系讲解

**两种模式的本质区别**

PHP 的类型声明有两种执行模式：

| 特性 | 强制模式（默认） | 严格模式（strict_types=1） |
|------|----------------|--------------------------|
| 传参行为 | 允许隐式类型强转（`"3"` → `3`） | 类型不匹配直接抛 `TypeError` |
| 激活方式 | 默认，无需任何声明 | 文件第一行加 `declare(strict_types=1)` |
| 作用范围 | — | 只影响**当前文件**发出的调用 |

**严格模式只管调用方，不管定义方**

`strict_types` 是**文件级**的独立开关，约束的是"从当前文件发出的函数调用"，与被调函数定义在哪个文件无关：

```php
// b.php（定义方，未声明严格模式）
function add(int $a, int $b): int {
    return $a + $b;
}
```

```php
// a.php（调用方）
declare(strict_types=1);
require 'b.php';

add("3", "4");  // ❌ TypeError：调用方开了严格模式，"3" 不能强转为 int
```

若 `a.php` 去掉 `declare(strict_types=1)`，`add("3", "4")` 会被强转为 `add(3, 4)` 正常运行。

**int → float 的扩展豁免**

严格模式下有一条特殊规则：`int` 传给 `float` 参数仍然合法（类型扩展，不是强转），不会抛 `TypeError`：

```php
declare(strict_types=1);

function scale(float $n): float { return $n * 1.5; }

scale(4);     // ✅ int 4 扩展为 float 4.0，合法
scale("4");   // ❌ TypeError：string 不享有豁免
```

**必须放在文件第一行**

`declare(strict_types=1)` 必须是文件内第一条可执行语句（`<?php` 标签之后，任何函数/类/代码之前），否则触发 Fatal Error：

```
Fatal error: strict_types declaration must be the very first statement in the script
```

注释和 BOM 可以在它之前，其他代码不行。

#### 考察意图

考察候选人对 PHP 类型系统演进的理解，以及对「文件级作用范围」这一非直觉设计的掌握。能说清「作用在调用方而非定义方」是加分项，能举出 `int → float` 豁免规则是高分项。

#### 追问链

1. **为什么 `strict_types` 是文件级的，而不是全局的？**  
   → 设计意图是让每个文件自主决定是否启用严格模式，避免引入第三方库时改变其行为。若为全局开关，在严格模式下引入未经类型整理的旧代码库会大规模崩溃。

2. **没有类型声明的参数，在严格模式下受影响吗？**  
   → 不受影响。`strict_types` 只对有类型声明的参数生效，未声明类型的参数仍然接受任意类型。

3. **严格模式下，`int` 传给 `float` 参数会抛 `TypeError` 吗？**  
   → 不会。PHP 有「类型扩展规则」：`int` → `float` 是合法的自动扩展，即使在严格模式下也允许；反向 `float` → `int` 则不行。

4. **如果一个项目里有些文件开了严格模式、有些没开，会产生什么问题？**  
   → 同一个函数被不同文件调用时，行为可能不一致：严格模式文件调用时类型不匹配会抛异常，非严格模式文件调用时则会静默强转。这是混用模式最常见的隐患，建议在项目级别统一约定。

#### 易错点

1. **误以为 `strict_types` 是全局开关**：实际上是文件级的，每个文件独立决策，互不干扰。
2. **混淆"作用在调用方"与"作用在定义方"**：函数定义文件无论是否有 `strict_types`，约束行为取决于**调用方**文件的设置。
3. **以为严格模式下 `int → float` 会报错**：`int` 传给 `float` 参数是唯一的类型扩展豁免，新手容易对这个例外感到意外。

#### 代码示例

```php
<?php
declare(strict_types=1);

// 基础类型声明演示
function formatAge(int $age): string {
    return "年龄：{$age}";
}

echo formatAge(25);       // ✅ 输出：年龄：25
// echo formatAge("25"); // ❌ TypeError：string 传给 int

// int → float 豁免
function area(float $radius): float {
    return M_PI * $radius ** 2;
}

echo area(5);    // ✅ int 5 自动扩展为 float 5.0，输出 78.539...
// echo area("5"); // ❌ TypeError

// 返回值类型同样受严格模式约束
function getCount(): int {
    return 42;      // ✅
    // return "42"; // ❌ TypeError（严格模式下返回值也检查）
}
```
