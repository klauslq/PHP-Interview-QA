---
title: "Late Static Binding 是什么及 static:: 与 self:: 的区别"
difficulty: L2
frequency: 中
tags:
  - PHP
  - OOP
  - 继承
  - Late Static Binding
needs_verification: false
created: 2026-04-29
---

# [L2] Late Static Binding 是什么及 `static::` 与 `self::` 的区别

#### 一句话结论

`self::` 绑定定义时所在的类，`static::` 绑定运行时实际调用的类。

#### 体系讲解

**原理：为什么需要 Late Static Binding**

在继承体系中，父类方法里用 `self::` 引用的始终是**父类自身**，即使子类覆盖了对应的常量、静态属性或静态方法，`self::` 也不会指向子类。这在某些场景下不符合预期——比如父类定义了工厂方法 `self::create()`，子类调用时期望得到子类实例，但 `self::` 总是创建父类实例。

PHP 5.3 引入了 Late Static Binding（后期静态绑定），通过 `static::` 关键字在运行时解析为**实际调用的类**，而非定义方法的类。

**机制：三个关键字的绑定规则**

| 关键字 | 解析时机 | 指向 |
|---|---|---|
| `self::` | 编译期 | 方法被**定义**时所在的类 |
| `static::` | 运行时 | 方法被**调用**时的类（沿继承链向下） |
| `parent::` | 编译期 | 当前类的父类 |

```mermaid
flowchart LR
    A["class Parent<br/>self::create()"] -->|self 永远指向| A
    B["class Child extends Parent"] -->|Child::create() 内部<br/>self:: 仍指向 Parent| A
    B -->|static:: 指向| B
```

**`new self()` vs `new static()` vs `new parent()`**

- `new self()`：始终创建定义该方法的类的实例。
- `new static()`：创建运行时实际调用类的实例（子类调用则创建子类实例）。
- `new parent()`：创建当前类的父类实例。

**结论：对开发的直接影响**

- 在抽象父类中编写工厂方法时，应使用 `static::` / `new static()` 而非 `self::`，确保子类继承后能正确创建子类实例。
- Laravel 的 Eloquent Model 大量依赖 LSB：`Model::find()` 能返回正确的子类实例，正是因为内部使用了 `new static()`。
- 如果明确不希望子类改变行为（"密封"语义），则刻意使用 `self::`。

#### 考察意图

- 验证候选人是否理解 PHP 继承中静态方法的绑定机制
- 考察对 `self` 和 `static` 差异的精确理解——这是框架源码阅读的前置知识
- 判断候选人能否在实际场景（如工厂方法、单例模式）中正确选用

#### 追问链

1. 在工厂方法模式中，为什么必须用 `new static()` 而不是 `new self()`？

   简答：如果父类的工厂方法用 `new self()`，子类调用该方法时仍然创建父类实例，违背多态原则。用 `new static()` 则在运行时解析为实际调用类，子类调用会正确创建子类实例。

2. `static::` 对常量和静态属性也生效吗？

   简答：是的。`static::CONSTANT` 和 `static::$property` 都会在运行时解析为实际调用类的常量/属性。如果子类覆盖了该常量或静态属性，`static::` 会取子类的值，而 `self::` 取父类的值。

3. `static` 关键字除了 Late Static Binding 还有哪些用途？

   简答：三种用途：（1）声明静态方法和属性（`static function`、`static $var`）；（2）Late Static Binding（`static::method()`）；（3）函数内的静态变量（`static $count = 0;`），值在多次调用间持久化。三者含义不同，需根据上下文区分。

4. PHP 8.0 引入的 `static` 返回类型是什么意思？

   简答：方法返回类型声明为 `: static` 表示返回调用时的类实例（遵循 LSB），支持链式调用。例如父类方法返回 `: static`，子类调用后类型检查能识别返回的是子类而非父类。这在流式接口（fluent interface）中非常有用。

#### 易错点

1. **混淆 `self` 和 `static` 的解析时机**：`self` 在编译期绑定，写在哪个类里就指向哪个类，与调用者无关。`static` 在运行时绑定，指向实际发起调用的类。面试中常给出继承链代码要求判断输出，只要抓住这一核心区别即可。

2. **以为 `self::` 在非静态方法中也能用**：`self::` 确实可以在非静态方法中使用（如 `self::SOME_CONST`），它解析的仍然是定义时的类。但候选人容易将 `self::` 和 `$this` 混为一谈——`$this` 是实例层面的，始终指向当前对象。

3. **在单例模式中用 `new self()` 导致子类无法继承单例**：如果单例基类的 `getInstance()` 用 `new self()`，所有子类共享的都是基类实例。改用 `new static()` 后，每个子类才能拥有各自独立的单例实例。

#### 代码示例

```php
<?php

class Model
{
    protected static string $table = 'models';

    // 工厂方法：对比 self vs static
    public static function createWithSelf(): static
    {
        echo '表名: ' . self::$table . PHP_EOL;   // 永远是 'models'
        return new self();                          // 永远是 Model 实例
    }

    public static function createWithStatic(): static
    {
        echo '表名: ' . static::$table . PHP_EOL;  // 运行时解析
        return new static();                        // 运行时解析
    }

    public function getClass(): string
    {
        return static::class; // 返回实际类名
    }
}

class User extends Model
{
    protected static string $table = 'users';
}

// self:: — 始终绑定 Model
$a = User::createWithSelf();
// 输出: 表名: models
var_dump($a instanceof User);  // false — 创建的是 Model 实例

// static:: — 运行时绑定 User
$b = User::createWithStatic();
// 输出: 表名: users
var_dump($b instanceof User);  // true — 创建的是 User 实例

// 实际应用：可继承的单例
class Singleton
{
    private static array $instances = [];

    public static function getInstance(): static
    {
        $class = static::class; // LSB：获取实际调用类名
        if (!isset(self::$instances[$class])) {
            self::$instances[$class] = new static();
        }
        return self::$instances[$class];
    }

    private function __construct() {}
}

class CacheManager extends Singleton {}
class LogManager extends Singleton {}

$cache = CacheManager::getInstance();
$log = LogManager::getInstance();
var_dump($cache instanceof CacheManager); // true
var_dump($log instanceof LogManager);     // true
var_dump($cache === $log);                // false — 各自独立
```
