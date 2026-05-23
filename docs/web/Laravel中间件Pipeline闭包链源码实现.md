---
title: Laravel 中间件 Pipeline 如何通过 array_reduce 构造洋葱式闭包链？
difficulty: L3
frequency: 高
tags: [Laravel, 中间件, Pipeline, 闭包, 设计模式]
needs_verification: false
created: 2026-05-23
---

# [L3] Laravel 中间件 Pipeline 如何通过 array_reduce 构造洋葱式闭包链？

#### 一句话结论

`Pipeline::then()` 对管道数组倒序后用 `array_reduce` 逐层包裹闭包，触发时由外向内执行，形成洋葱结构。

#### 体系讲解

**Pipeline 三要素**

| 要素 | 含义 | 示例 |
|---|---|---|
| `$passable` | 被传递的载体对象 | `Request` 实例 |
| `$pipes` | 中间件类名数组 | `[AuthMiddleware::class, LogMiddleware::class]` |
| `$destination` | 最终处理闭包 | 调用控制器的闭包 |

**`then()` 的构造机制**

`then()` 是整个 Pipeline 的核心，它并不立即执行任何中间件，而是把所有中间件"折叠"成一个嵌套闭包，再触发调用：

```php
// Illuminate\Pipeline\Pipeline::then()（简化）
public function then(Closure $destination): mixed
{
    $pipeline = array_reduce(
        array_reverse($this->pipes),   // 1. 倒序
        $this->carry(),                // 2. 包裹函数
        $this->prepareDestination($destination)  // 3. 初始值：最内层
    );

    return $pipeline($this->passable); // 4. 触发整条链
}
```

**为什么要先 `array_reverse`**

`array_reduce` 从左到右折叠，每次迭代将当前元素包裹在上次结果的"外层"。若不倒序，注册最早的中间件会被包到最内层，执行顺序与注册顺序相反。倒序后，第一个注册的中间件成为最外层，最先执行其 before 逻辑。

**`carry()` 的作用**

`carry()` 返回一个两参数闭包，充当 `array_reduce` 的 callable：

- 参数 `$stack`：当前已构建的内层闭包（初始值为 destination）
- 参数 `$pipe`：当前中间件类名
- 返回：新的闭包，该闭包调用时将中间件实例化，把 `$stack` 作为 `$next` 传入

```
array_reduce 折叠过程（注册顺序 M1 → M2，倒序后 M2 → M1）：

初始值：destination
第1次：carry(destination, M2) → closure_M2（$next = destination）
第2次：carry(closure_M2,   M1) → closure_M1（$next = closure_M2）

最终 pipeline = closure_M1
```

**执行时序（洋葱顺序）**

```
$pipeline($passable)
  └─ M1.before → $next($passable)
       └─ M2.before → $next($passable)
            └─ destination（控制器）
       └─ M2.after
  └─ M1.after
```

**中间件类名带参数的处理**

`carry()` 内部通过 `parsePipeString()` 解析 `"ClassName:param1,param2"` 格式，将参数追加到 `handle()` 调用中；若 `$pipe` 本身已是 Closure，则直接调用，不走实例化逻辑。

#### 考察意图

考察候选人对 PHP 高阶函数（`array_reduce`）、闭包捕获语义的理解，以及能否通过阅读框架源码解释"注册顺序"与"执行顺序"的关系——这两者的一致性完全依赖倒序这一实现细节，背不住结论，需要能推导出来。

#### 追问链

**Q1：carry() 中 `$stack` 是如何被捕获进内层闭包的？PHP 的值传递会不会导致问题？**

> `carry()` 返回的闭包通过 `use ($stack, $pipe)` 捕获变量。闭包捕获的是变量在捕获时刻的值（即当前 $stack 的引用/拷贝）。由于 $stack 本身是 Closure 对象，PHP 按引用语义传递对象，不会被后续迭代覆盖。每次 `array_reduce` 迭代生成新的闭包变量名 $stack，互相独立。

**Q2：如果某个中间件不调用 `$next`，会发生什么？**

> 闭包链在该中间件处断开：后续中间件和控制器均不执行，该中间件直接返回 Response。注意，已执行过 before 逻辑的外层中间件的 after 部分（`$next` 之后的代码）仍会执行，因为调用栈依然会正常返回。

**Q3：Laravel 的 `Pipeline` 与 PSR-15 中间件接口有什么区别？**

> PSR-15 定义了 `MiddlewareInterface::process(Request, Handler): Response` 的标准接口，`Handler` 替代 `$next` 闭包，接口更清晰但耦合更重。Laravel Pipeline 使用约定俗成的 `handle(Request, Closure $next)` 签名，更灵活，但不符合 PSR-15。Slim 等框架实现了 PSR-15；Laravel 保留了自己的风格。

#### 易错点

1. **误以为 `carry()` 立即执行中间件**：`carry()` 只构造嵌套闭包，不执行任何 `handle()`。所有中间件的实例化和执行都发生在最后 `$pipeline($passable)` 这一行触发之后。

2. **误解倒序时机**：倒序发生在 `array_reduce` 之前（构造阶段），不是在执行时倒序。调用 `send()->through()` 时 `$pipes` 顺序没有变化，只有 `then()` 内部才做倒序，初学者容易在 `through()` 阶段误以为需要手动倒序。

#### 代码示例

```php
<?php
// 简化版 Pipeline，演示 array_reduce 构造闭包链的核心机制

function carry(): Closure
{
    return static function (Closure $stack, string $pipeClass): Closure {
        return static function (string $passable) use ($stack, $pipeClass): string {
            // 实例化中间件，将内层闭包作为 $next 传入
            $pipe = new $pipeClass();
            return $pipe->handle($passable, $stack);
        };
    };
}

function runPipeline(string $passable, array $pipes, Closure $destination): string
{
    $pipeline = array_reduce(
        array_reverse($pipes),  // 倒序是关键
        carry(),
        $destination
    );

    return $pipeline($passable);
}

// --- 示例中间件 ---

class LogMiddleware
{
    public function handle(string $passable, Closure $next): string
    {
        echo "[LOG] before\n";
        $result = $next($passable);
        echo "[LOG] after\n";
        return $result;
    }
}

class AuthMiddleware
{
    public function handle(string $passable, Closure $next): string
    {
        echo "[AUTH] before\n";
        $result = $next($passable);
        echo "[AUTH] after\n";
        return $result;
    }
}

// 注册顺序：Log → Auth；执行顺序同样：Log.before → Auth.before → controller → Auth.after → Log.after
$response = runPipeline(
    passable: 'GET /users',
    pipes: [LogMiddleware::class, AuthMiddleware::class],
    destination: static fn(string $p): string => "[Controller] handled: {$p}\n"
);

echo $response;

/*
输出：
[LOG] before
[AUTH] before
[Controller] handled: GET /users
[AUTH] after
[LOG] after
*/
```
