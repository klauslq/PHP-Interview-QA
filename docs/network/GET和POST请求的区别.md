---
title: GET 和 POST 请求的区别
difficulty: L1
frequency: 高
tags: [HTTP, GET, POST, 幂等性, 报文结构]
needs_verification: false
created: 2026-05-04
---

# [L1] GET 和 POST 请求的区别

#### 一句话结论

GET 用于获取资源、参数在 URL 中、幂等且可缓存；POST 用于提交数据、参数在请求体中、非幂等不可缓存。

#### 体系讲解

**1. 核心差异对照表**

| 维度 | GET | POST |
|---|---|---|
| 语义 | 获取资源（只读） | 提交/修改数据（写操作） |
| 参数位置 | URL Query String（`?key=value`） | 请求体（Body） |
| 数据长度 | 受 URL 长度限制（浏览器/服务器实现差异，一般 2–8 KB） | 无理论限制（受服务器配置约束） |
| 幂等性 | ✅ 幂等（多次请求结果相同） | ❌ 非幂等（每次可能产生副作用） |
| 安全性（RFC 语义） | ✅ 安全（不修改服务器状态） | ❌ 不安全（会修改服务器状态） |
| 浏览器缓存 | ✅ 可被缓存 | ❌ 默认不缓存 |
| 历史记录/书签 | ✅ 可保存 | ❌ 不可保存（体数据丢失） |
| 请求体 | 无（RFC 不禁止，但无实际意义） | 有 |

**2. 报文结构对比**

```
# GET 请求
GET /search?q=php&page=1 HTTP/1.1
Host: example.com
Accept: text/html

# POST 请求
POST /login HTTP/1.1
Host: example.com
Content-Type: application/x-www-form-urlencoded
Content-Length: 27

username=admin&password=123
```

**3. 幂等性与安全性（RFC 7231 语义）**

- **安全（Safe）**：方法不修改服务器状态。GET/HEAD/OPTIONS 是安全方法
- **幂等（Idempotent）**：多次相同请求的效果与一次相同。GET/PUT/DELETE 幂等，POST 不幂等
- 两者都是**语义约定**，服务端代码违反约定（如 GET 请求触发删除操作）不会报错，但破坏 HTTP 规范，导致缓存污染、爬虫误操作等问题

**4. 常见误解澄清**

- GET 参数在 URL 中是**规范约定**，而非绝对限制——GET 请求体在技术上合法，但不被推荐
- POST 并不比 GET「更安全」——参数在请求体中，但明文传输时同样可被抓包；真正的安全依赖 HTTPS 加密

#### 考察意图

考察候选人对 HTTP 方法语义的理解——能否区分「参数传递方式」「幂等性」「缓存行为」三个维度，以及是否了解 RFC 规范中「安全」与「幂等」的准确含义，而非停留在「GET 放 URL、POST 放 Body」的表面认知。

#### 追问链

1. **PUT 和 POST 有什么区别？**  
   PUT 是幂等的：`PUT /users/1` 多次执行，第一次创建/替换，后续结果不变；POST 非幂等：`POST /users` 每次都可能创建新资源。RESTful API 设计中，创建新资源用 POST，全量更新已知资源用 PUT，部分更新用 PATCH。

2. **为什么 GET 请求可以被缓存而 POST 不行？**  
   HTTP 规范规定，安全且幂等的方法（如 GET）的响应可以由代理/浏览器缓存；POST 可能改变服务器状态，缓存不安全。GET 的缓存 key 是完整 URL（含查询参数），相同 URL 返回相同结果是前提。

3. **POST 请求的 Content-Type 有哪些常见类型？各适用什么场景？**  
   - `application/x-www-form-urlencoded`：传统表单提交，键值对 URL 编码
   - `multipart/form-data`：文件上传，支持二进制数据
   - `application/json`：API 接口，传递结构化 JSON 数据
   - `text/plain`：纯文本，少用

#### 易错点

1. **认为 POST 比 GET 更安全**：POST 参数在请求体而非 URL 中，仅避免了参数出现在浏览器地址栏/日志中；但在 HTTP 明文传输下，Body 同样可被中间人截获。安全性取决于是否使用 HTTPS，而非请求方法。

2. **混淆「幂等」与「安全」**：DELETE 是幂等的（多次删除同一资源，结果相同——资源已不存在），但不是「安全的」（它修改了服务器状态）。两个概念独立，不可画等号。

3. **用 GET 请求做写操作**：某些简单项目用 `GET /deleteUser?id=1` 删除数据，违反幂等约定——爬虫、预加载、缓存可能意外触发该请求，造成数据丢失。写操作必须用 POST/PUT/DELETE。

#### 代码示例

```php
// PHP 接收 GET 和 POST 参数
$keyword  = filter_input(INPUT_GET,  'q',        FILTER_SANITIZE_SPECIAL_CHARS);
$username = filter_input(INPUT_POST, 'username', FILTER_SANITIZE_SPECIAL_CHARS);

// PHP 用 cURL 发送 POST 请求（JSON Body）
$ch = curl_init('https://api.example.com/login');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS     => json_encode(['username' => 'admin', 'password' => '123']),
]);
$response = curl_exec($ch);
curl_close($ch);
```
