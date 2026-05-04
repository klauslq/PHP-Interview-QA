---
title: PHP 主流框架对比与选型概览
difficulty: L1
frequency: 高
tags: [PHP, 框架, Laravel, Symfony, Hyperf, ThinkPHP]
needs_verification: false
created: 2026-05-04
---

# [L1] PHP 主流框架对比与选型概览

#### 一句话结论

Laravel 以开发体验见长，Symfony 以组件化稳健著称，ThinkPHP 在国内中小项目普及，Hyperf 面向高并发协程场景。

#### 体系讲解

**1. 四大主流框架横向对比** ⚠️ 需查证

| 框架 | 定位 | 核心特点 | 适用场景 |
|---|---|---|---|
| **Laravel** | 全栈 / 全功能 | 优雅语法、Eloquent ORM、Artisan CLI、生态完整（Horizon/Sanctum/Cashier） | 中大型 Web 应用、API 后端、快速原型 |
| **Symfony** | 企业级组件库 + 框架 | 组件化（可单独使用）、DI 容器成熟、严格规范、Laravel/Drupal 等均依赖其组件 | 大型企业系统、长期维护项目 |
| **ThinkPHP** | 国产轻量级全栈 | 中文文档友好、学习曲线低、国内社区活跃 | 国内中小项目、政企定制开发 |
| **Hyperf** | 协程 / 微服务 | 基于 Swoole/Swow，常驻内存，高并发低延迟，支持微服务（gRPC/JsonRPC） | 高并发 API、微服务架构 |
| **Slim / Lumen** | 微框架 | 极轻量，路由 + 中间件，无 ORM 等重组件 | 简单 API、微服务单服务 |

**2. 选型维度速查**

| 维度 | 推荐框架 |
|---|---|
| 开发效率优先 | Laravel |
| 组件灵活复用 | Symfony |
| 国内中小项目 / 快速交付 | ThinkPHP |
| 高并发 / 协程 / 微服务 | Hyperf |
| 极简 API 服务 | Slim |

**3. 传统 PHP-FPM 框架 vs 常驻内存框架**

传统框架（Laravel/Symfony/ThinkPHP）每次请求重新初始化框架，随 PHP-FPM 进程模型工作，内存隔离好、部署简单；Hyperf 等常驻内存框架启动一次后复用对象，请求延迟更低，但需要注意**全局状态污染**和**内存泄漏**问题。

#### 考察意图

考察候选人对 PHP 框架生态的基本认知——能否说出主流框架的定位差异和适用场景，以及是否了解传统 CGI 模式与常驻内存模式的本质区别。

#### 追问链

1. **Laravel 和 Symfony 的关系是什么？**  
   Laravel 大量使用 Symfony 的组件（如 HttpFoundation、Console、Routing），但提供了更高层的封装和更友好的 API。Symfony 组件化程度更高，可独立引入任何单个组件；Laravel 则以「全家桶」体验为核心设计目标。

2. **为什么说 Hyperf 适合高并发场景？传统框架不行吗？**  
   Hyperf 基于 Swoole 协程，进程常驻内存，避免每次请求重复 Bootstrap（框架初始化）开销，I/O 等待期可调度其他协程，吞吐量更高。传统框架配合 PHP-FPM 也能满足多数中小项目需求；高并发下传统模式的瓶颈在于进程数限制和每次请求的初始化开销。

3. **中小公司应该选 Laravel 还是 ThinkPHP？**  
   团队有 Laravel 经验或需要接轨国际开源生态，选 Laravel；团队以国内开发者为主、项目周期短、文档语言偏好中文，选 ThinkPHP。两者功能覆盖相近，核心差异在于生态广度（Laravel 更丰富）和中文友好度（ThinkPHP 更高）。

#### 易错点

1. **认为 Symfony 只是完整框架**：Symfony 既是框架也是组件库，Laravel、Drupal、API Platform 都依赖 Symfony 组件，混淆两种用法会误判技术栈的实际依赖关系。

2. **忽略常驻内存框架的全局状态风险**：Hyperf/Swoole 下，若将含请求数据的对象存入全局变量或单例，会在并发请求间互相污染，这是从 PHP-FPM 迁移时最常见的坑。

3. **把框架流行度等同于技术优劣**：ThinkPHP 在国内使用广泛不代表技术落后，选型应以**团队现有技能 + 项目规模 + 长期维护成本**为准，而非单纯参考 GitHub Star 数量。

#### 代码示例

```php
// Laravel：路由 + 闭包（体现语法简洁性）
Route::get('/users/{id}', function (int $id) {
    return User::findOrFail($id);
});

// Hyperf：注解路由（体现协程框架风格）
#[GetMapping(path: '/users/{id}')]
public function show(int $id): array
{
    return $this->userService->find($id);
}

// Slim：极简路由（体现微框架轻量）
$app->get('/users/{id}', function (Request $req, Response $res, array $args): Response {
    $res->getBody()->write(json_encode(['id' => $args['id']]));
    return $res->withHeader('Content-Type', 'application/json');
});
```
