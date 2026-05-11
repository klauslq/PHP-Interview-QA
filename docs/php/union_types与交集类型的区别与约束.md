---
title: PHP 的 union types（PHP 8.0）与交集类型（PHP 8.1）有何区别？各自有哪些使用约束？
difficulty: L1
frequency: 中
tags:
  - PHP
  - PHP 8.0
  - PHP 8.1
  - PHP 8.2
  - 类型声明
  - union types
  - 交集类型
  - DNF类型
needs_verification: false
created: 2026-05-11
---

# [L1] PHP 的 union types（PHP 8.0）与交集类型（PHP 8.1）有何区别？各自有哪些使用约束？

#### 一句话结论

union types 用 `|` 表示"满足其中之一"，交集类型用 `&` 表示"必须同时满足所有"，两者约束范围和允许的类型集合也不同。

#### 体系讲解

**核心语义对比**

| 特性 | union types（`\|`） | 交集类型（`&`） |
|------|-------------------|--------------|
| 引入版本 | PHP 8.0 | PHP 8.1 |
| 语义 | 满足其中**任意一个**类型 | **同时满足所有**类型 |
| 允许标量类型 | ✅（`int\|string`） | ❌ 只允许类/接口 |
| 允许 `null` | ✅（`int\|null` 等价 `?int`） | ❌ 不允许 |
| 允许 `false`/`true` | ✅ | ❌ |
| 典型场景 | 参数可接受多种基础类型 | 要求参数同时实现多个接口 |

**union types：至少满足一种**

```php
// 参数可以是 int 或 string
function processId(int|string $id): void {
    echo gettype($id) . ': ' . $id;
}

processId(42);      // ✅ int
processId("uuid-abc"); // ✅ string
```

PHP 8.0 的 union types 还支持几个特殊联合成员：
- `false`：单独的 false 值类型（`int|false` 常见于旧 API 的返回值兼容）
- `null`：`int|null` 与 `?int` 完全等价
- `true`（PHP 8.2）

**交集类型：必须全部满足**

交集类型要求传入的对象**同时实现**所有指定的接口或继承指定的类：

```php
interface Measurable {
    public function count(): int;
}

interface Printable {
    public function render(): string;
}

// 参数必须同时实现 Measurable 和 Printable
function process(Measurable&Printable $collection): void {
    echo "数量: " . $collection->count();
    echo "内容: " . $collection->render();
}
```

**交集类型的重要约束**

1. **只允许类名和接口名**，不能包含标量（`int&string` ❌）、`null`（`Foo&null` ❌）、`array`、`callable` 等。
2. **不能与 union 直接混用**（如 `Foo&Bar|null` ❌），这是 PHP 8.2 DNF 类型解决的问题。
3. **每个类型必须不同**，重复类型（`Foo&Foo` ❌）是语法错误。

**PHP 8.2 DNF 类型：两者的合体**

DNF（Disjunctive Normal Form，析取范式）类型允许将交集类型放入 union 中，交集部分必须用括号包裹：

```php
// (Measurable&Printable)|null
// 要么是同时实现两个接口的对象，要么是 null
function handle((Measurable&Printable)|null $input): void {
    if ($input === null) return;
    echo $input->count();
}
```

**版本演进一览**

```
PHP 7.1  → nullable（?Type）
PHP 8.0  → union types（int|string|null）
PHP 8.1  → 交集类型（Foo&Bar）
PHP 8.2  → DNF 类型（(Foo&Bar)|null）
```

#### 考察意图

考察候选人对 PHP 8.x 类型系统演进的跟进情况，以及对两种组合类型「语义差异」和「使用约束」的掌握。能说清交集类型只允许类/接口、不允许标量是核心考点；能提到 DNF 类型和版本时间线是加分项。

#### 追问链

1. **`int|string` 和 `string|int` 有区别吗？顺序影响类型检查吗？**  
   → 运行时没有区别，PHP 不依赖 union 中类型的顺序做转换。但 `false|int` 中 `false` 必须是完整的 `false` 值（不是 falsy），顺序不影响语义。

2. **交集类型为什么不允许 `null`？`(Foo&Bar)|null` 怎么写？**  
   → PHP 8.1 的交集类型设计上不允许 `null`，因为 null 不是对象，不能"实现接口"。要表达"可空的交集类型"，需要升级到 PHP 8.2 使用 DNF 类型：`(Foo&Bar)|null`。

3. **`int|float` 和 `float` 有什么实际区别？什么时候用前者？**  
   → 在严格模式下，`float` 参数接受 `int`（扩展豁免），所以 `int|float` 与 `float` 的实际行为几乎相同。`int|float` 语义更明确，适合作为文档信号，但通常直接用 `float` 即可。

4. **`callable` 可以放进 union types 吗？放进交集类型呢？**  
   → `callable` 可以放进 union（`callable|null`），但不能放进交集类型（交集只允许类/接口名）。

#### 易错点

1. **把交集类型用于标量**：`int&string` 会触发语法错误，交集类型只允许具名类和接口，不能用于基础类型。
2. **在 PHP 8.1 直接写 `Foo&Bar|null`**：这个语法在 PHP 8.2 之前不合法，PHP 8.1 不支持混合 `&` 和 `|`，需要升级到 8.2 并加括号 `(Foo&Bar)|null`。
3. **以为 `?Type` 和 `Type|null` 行为有差异**：两者完全等价，只是写法不同，`?int` 就是 `int|null` 的语法糖。

#### 代码示例

```php
<?php

// === union types（PHP 8.0） ===
function formatValue(int|float|string $value): string {
    return (string) $value;
}

echo formatValue(42);       // ✅ int
echo formatValue(3.14);     // ✅ float
echo formatValue("hello");  // ✅ string

// 含 null 的 union（等价于 ?string）
function greet(string|null $name): string {
    return "Hello, " . ($name ?? "Guest");
}

// === 交集类型（PHP 8.1） ===
interface Loggable {
    public function toLog(): string;
}

interface Exportable {
    public function export(): string;
}

class Event implements Loggable, Exportable {
    public function toLog(): string    { return "event:log"; }
    public function export(): string   { return "event:export"; }
}

function record(Loggable&Exportable $item): void {
    echo $item->toLog() . ' / ' . $item->export();
}

record(new Event());  // ✅ Event 同时实现了两个接口

// === DNF 类型（PHP 8.2） ===
function handle((Loggable&Exportable)|null $item): void {
    if ($item !== null) {
        echo $item->toLog();
    }
}
```
