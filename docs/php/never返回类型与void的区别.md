---
title: PHP 的 never 返回类型表示什么？与 void 有何区别？
difficulty: L1
frequency: 中
tags:
  - PHP
  - PHP 8.1
  - 类型声明
  - never
  - void
  - 返回类型
needs_verification: false
created: 2026-05-11
---

# [L1] PHP 的 `never` 返回类型表示什么？与 `void` 有何区别？

#### 一句话结论

`never` 表示函数**永远不会正常返回**（必须 throw 或 exit）；`void` 表示函数**不返回值**（可以正常 return）。

#### 体系讲解

**核心语义对比**

| 特性 | `void` | `never` |
|------|--------|---------|
| 引入版本 | PHP 7.1 | PHP 8.1 |
| 能否执行 `return;` | ✅ 可以 | ❌ Fatal Error |
| 能否执行 `return $value` | ❌ 不能 | ❌ 不能 |
| 能否 `throw` 异常 | ✅ 可以 | ✅ 必须这样 |
| 能否调用 `exit()`/`die()` | ✅ 可以 | ✅ 必须这样 |
| 函数执行完毕后 | 正常返回调用方 | 永远不会到达下一行 |

**`void`：有返回，无值**

`void` 声明函数执行完后正常返回调用方，但不返回任何有意义的值。可以用 `return;` 提前退出：

```php
function logMessage(string $msg): void {
    if (empty($msg)) {
        return;         // ✅ 提前退出，合法
    }
    echo $msg . PHP_EOL;
    // 函数结束，正常返回调用方
}
```

**`never`：永不返回**

`never` 声明函数执行路径一定以抛出异常、调用 `exit()`/`die()` 或进入无限循环结束，**绝不会正常返回**到调用方。如果函数执行到末尾还没有 throw 或 exit，PHP 会抛出 Fatal Error：

```php
function abort(string $message): never {
    throw new RuntimeException($message);
    // throw 之后代码不可达，函数永不返回
}

function redirect(string $url): never {
    header("Location: $url");
    exit();
    // exit 之后进程终止，函数永不返回
}
```

**`never` 的类型论含义（了解即可）**

在类型论中，`never` 是**底类型（bottom type）**，是所有类型的子类型。这意味着：返回 `never` 的函数可以出现在任何需要返回值的位置，因为它压根不会返回——静态分析工具（如 PHPStan、Psalm）可以利用这一特性做更精确的代码流分析。

```php
function getUser(int $id): User {
    $user = findUser($id);
    if ($user === null) {
        abort("用户 {$id} 不存在");  // 返回 never，静态分析知道此后 $user 不为 null
    }
    return $user;  // 静态分析确认此处 $user 一定是 User
}
```

#### 考察意图

考察候选人对 PHP 8.1 类型系统扩展的了解，以及对「函数控制流」的精确理解。能区分「不返回值」与「永不返回」两种不同语义，并能举出 `never` 的实际应用场景（异常工厂、重定向助手）是加分项。

#### 追问链

1. **`never` 函数如果执行完毕没有 throw/exit，会发生什么？**  
   → PHP 8.1+ 会抛出 `Fatal Error`：`never-returning function must not implicitly return`。静态分析工具也会在代码分析阶段报错。

2. **`never` 类型在继承中有什么意义？子类可以重写 `never` 方法吗？**  
   → 子类可以将父类的 `never` 方法重写为更宽松的返回类型（因为 `never` 是所有类型的子类型，协变允许），但反向（把非 `never` 收窄为 `never`）在某些场景下需要谨慎，可能破坏调用方预期。

3. **静态分析工具如何利用 `never` 做代码流分析？**  
   → 工具（PHPStan/Psalm）看到调用 `never` 函数后的代码时，会将其标记为「不可达代码」（dead code），从而消除后续代码中的 null 检查冗余，提高类型推断精度。

4. **`never` 和无限循环有什么关系？**  
   → 如果一个函数内部是 `while(true) { ... }`（无法退出的无限循环），从控制流角度也符合 `never` 语义，但 PHP 运行时无法静态验证循环是否真的无限，因此此类函数声明 `never` 时需要开发者自行保证。

#### 易错点

1. **把 `void` 和 `never` 都理解为"没有返回值"**：`void` 是"返回但无值"，`never` 是"根本不返回"，两者控制流语义截然不同。
2. **在 `never` 函数里写 `return;`**：即使是空 `return` 也会触发 Fatal Error，因为它意味着函数正常返回了。
3. **以为 `never` 只能用于 throw**：`exit()`、`die()`、无限循环等都能满足 `never` 的语义，不限于抛出异常。

#### 代码示例

```php
<?php

// void：正常返回，但无返回值
function printDivider(int $width): void {
    echo str_repeat('-', $width) . PHP_EOL;
    // 正常执行完毕后返回调用方
}

// never：永不返回，必须 throw 或 exit
function throwNotFound(string $resource): never {
    throw new RuntimeException("资源不存在：{$resource}");
}

function forceRedirect(string $url): never {
    header("Location: {$url}");
    exit(0);
}

// never 在业务逻辑中的典型用法
function findOrFail(array $data, int $id): array {
    foreach ($data as $item) {
        if ($item['id'] === $id) {
            return $item;
        }
    }
    throwNotFound("item#{$id}");
    // 静态分析工具知道上面一定 throw，这里是不可达代码
}

// 对比：以下声明合法性
// function bad(): never { return; }  // ❌ Fatal Error
// function ok(): void  { return; }   // ✅ 合法
```
