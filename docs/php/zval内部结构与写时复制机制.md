---
title: PHP zval 内部结构是什么？写时复制（COW）机制如何工作？
difficulty: L3
frequency: 中
tags: [PHP, 内存管理, zval, COW, Zend Engine]
needs_verification: false
created: 2026-05-04
---

# [L3] PHP zval 内部结构是什么？写时复制（COW）机制如何工作？

#### 一句话结论

PHP 7 将 refcount 从 zval 移至值类型头部，简单类型按值直接存储，复合类型通过引用计数实现写时复制（COW）。

#### 体系讲解

**原理：PHP 7 重构了 zval**

> 以下 zval 结构描述来源于
> [PHP Internals Book — Basic zval structure](https://www.phpinternalsbook.com/php7/zvals/basic_structure.html)

PHP 5 中，每个变量的 zval 在堆上单独分配，自带 `refcount` 和 `is_ref` 字段；变量赋值时 refcount+1，开销不低。PHP 7 对此做了彻底重构：

```c
struct _zval_struct {
    zend_value value;     /* 实际值 — 见下表 */
    uint32_t   type_info; /* 类型 + 标志位（IS_LONG / IS_STRING / IS_ARRAY…） */
};
```

`zend_value` 是一个 union，不同分支存不同类型：

| 值类型       | zend_value 字段           | 是否有 refcount |
|:------------|:--------------------------|:--------------:|
| null / bool  | 编码在 type_info 中        | 无             |
| int          | value.lval                | 无             |
| float        | value.dval                | 无             |
| string       | value.str → zend_string*  | 有（GC header）|
| array        | value.arr → zend_array*   | 有（GC header）|
| object       | value.obj → zend_object*  | 有（GC header）|

**关键变化**：refcount 不再放在 zval 里，而是放在复合类型各自的 `zend_refcounted` GC 头部。`int / float / bool / null` 永远按值拷贝，不参与引用计数，也不触发 GC。

**机制：COW 的工作流程**

```mermaid
sequenceDiagram
    participant A as $a (zval)
    participant B as $b (zval)
    participant Arr as zend_array (refcount=1)

    Note over A,Arr: 初始：$a = [1, 2, 3]
    A->>Arr: value.arr 指向

    Note over A,B,Arr: $b = $a — 仅复制 zval（16 B）
    B->>Arr: value.arr 同样指向（refcount → 2）

    Note over B,Arr: $b[] = 4 — 触发写操作
    B-->>Arr: 检测 refcount > 1，Separate：深拷贝 zend_array
    Note over A,B: 各自 refcount=1，互不影响
```

步骤总结：

1. `$b = $a`：仅复制 zval（16 字节），底层 zend_array 的 refcount + 1
2. `$b[] = 4`：写前检查 refcount，若 > 1 则先 Separate（深拷贝），再写副本
3. $a 不受任何影响

**PHP 引用（&）与 COW 的本质区别**

| 特性       | COW 共享                      | PHP 引用（&）                                      |
|:----------|:------------------------------|:--------------------------------------------------|
| 触发方式   | 普通赋值 `$b = $a`             | `$b = &$a`                                        |
| 内部结构   | 两个 zval 指向同一底层值        | 两个 zval 指向同一 `zend_reference`（包裹一个 zval）|
| 修改时     | Separate，各自独立              | 修改立即反映到所有引用方                            |
| GC 压力   | 低（refcount 简单）             | 略高（zend_reference 额外分配）                    |

一旦变量通过 `&` 创建引用，它退出 COW 快速路径。

**结论：对开发的直接影响**

- **函数传参**：传数组不修改则不复制，COW 天然保证高效；不必为"避免复制"而滥用引用传参
- **foreach 纯读遍历**：`foreach ($arr as $v)` 不修改数组，不触发 Separate，零额外开销
- **interned strings**：PHP 7.4+ 字面量字符串的 refcount 设为 IS_STR_INTERNED，赋值时直接复用指针，不增减 refcount，开销极低

#### 考察意图

- 验证候选人是否理解 PHP 7 对 zval 的架构重构：**去掉 per-zval refcount** 是核心
- 考察对 COW 机制的准确认知，而非把"变量赋值"误以为立即复制
- 区分 PHP 引用（&）与 COW 共享的本质差异——这是实际开发中常见的误区

#### 追问链

1. PHP 5 和 PHP 7 的 zval 有什么本质区别？

   简答：PHP 5 中每个变量的 zval 单独堆分配，内嵌 refcount/is_ref，赋值即增加引用计数；PHP 7 中 zval 不再单独堆分配（栈或嵌入上层结构），refcount 移入复合类型的 GC 头部，int/float/bool/null 不参与引用计数，赋值直接按值复制，内存更紧凑，CPU cache 命中率更高。

2. 以下代码 `$b[] = 9999` 会触发 COW 吗？

   ```php
   $a = range(1, 1000);
   $b = $a;
   $b[] = 9999;
   ```

   简答：会。`$b = $a` 后两者共享同一 zend_array（refcount = 2），执行 `$b[] = 9999` 时检测到 refcount > 1，触发 Separate，完整复制数组后在副本上追加元素。$a 不受影响。

3. 对大数组传引用（&）并不总是更快，为什么？

   简答：不加引用时，COW 保证只要不修改就不复制，传参本身只传 zval（16 字节）。加 & 后需要创建 zend_reference 包装（一次额外堆分配），且引用变量退出 COW 路径，后续写操作不再走 Separate 而是直接写穿，可能引发非预期的副作用。只有在函数内部确实需要写回调用方变量时才应使用引用传参。

4. `foreach ($arr as &$v)` 遍历后不 `unset($v)` 会发生什么？

   简答：foreach 结束后 $v 仍指向 $arr 最后一个元素。若后续代码意外向 $v 赋值，会悄悄修改数组末尾元素。规范做法：foreach 引用遍历结束后，紧接着写 `unset($v)` 断开引用。

5. 对于 zend_string，PHP 还有哪些额外内存优化？

   简答：PHP 7.4+ 中，字面量字符串（interned strings）的 refcount 被设为 IS_STR_INTERNED 特殊标志，赋值时直接复用指针，完全不增减 refcount，开销极低；相同字面量在整个请求生命周期内只存储一份。可变字符串（运行时拼接生成）才走普通 COW 路径。

#### 易错点

1. **误以为 `$b = $a` 会立即复制数组**：实际上仅复制 zval（16 字节），底层 zend_array refcount+1，只有写操作时才真正 Separate。这是 PHP 内存效率的重要保障，混淆此点会导致不必要的引用传参"优化"。

2. **混淆 PHP 引用（&）与 COW 共享**：COW 是引擎自动优化，对代码不可见；PHP 引用是语言特性，会创建 zend_reference 包装，两者机制完全不同。错误认为"引用就是 COW"是常见面试陷阱。

3. **认为引用传参必然更快**：对于只读使用的大数组，不加 & 时 COW 保证不复制；加 & 后引入 zend_reference 额外开销，且语义变成"可写回调用方"，在只读场景下既无收益又引入风险。

#### 代码示例

```php
<?php

// 场景 1：COW 延迟复制
$a = range(1, 5);
$b = $a;       // 仅复制 zval，底层数组共享（refcount = 2）

$b[] = 99;     // 触发 Separate，$b 获得独立副本

var_dump($a);  // array(5) { [0]=>1 [1]=>2 [2]=>3 [3]=>4 [4]=>5 }
var_dump($b);  // array(6) { ... [5]=>99 }

echo "---\n";

// 场景 2：引用赋值 — 修改会反映到 $a
$c = [1, 2, 3];
$d = &$c;  // 创建 zend_reference 包装
$d[] = 99;

var_dump($c);  // array(4) { ... [3]=>99 } — $c 同步修改

echo "---\n";

// 场景 3：foreach 引用遍历的悬空引用陷阱
$arr = [1, 2, 3];
foreach ($arr as &$v) {
    $v *= 2;
}
unset($v); // 必须 unset，否则 $v 仍指向 $arr[2]

var_dump($arr); // array(3) { [0]=>2 [1]=>4 [2]=>6 }
```
