---
title: Nginx proxy_cache 缓存配置与失效策略
difficulty: L2
frequency: 中
tags: [Nginx, proxy_cache, 缓存, Cache-Control, 缓存失效]
needs_verification: false
created: 2026-05-23
---

# [L2] Nginx proxy_cache 缓存配置与失效策略

#### 一句话结论

`proxy_cache` 将后端响应缓存到磁盘，依据 `Cache-Control`/`Expires` 决定 TTL，通过 `proxy_cache_bypass` 和 `proxy_no_cache` 条件精确控制缓存绕过。

#### 体系讲解

**缓存区定义（`proxy_cache_path`）**

必须在 `http` 块声明，指定磁盘路径、目录层级、共享内存区和容量上限：

```nginx
proxy_cache_path /var/cache/nginx
    levels=1:2              # 二级目录结构（避免单目录文件过多）
    keys_zone=my_cache:10m  # 共享内存：存放 key → 元数据映射
    max_size=2g             # 磁盘容量上限，超出 LRU 淘汰
    inactive=60m            # 60 分钟内未被访问则淘汰
    use_temp_path=off;      # 直接写入目标目录，避免跨分区拷贝
```

- `keys_zone` 的内存用于存储缓存键和过期时间，10m ≈ 80,000 个 key
- `levels=1:2` 会创建如 `/var/cache/nginx/a/bc/md5hash` 的目录树

**应用缓存（location 块）**

```nginx
location /api/ {
    proxy_cache        my_cache;
    proxy_cache_key    "$scheme$request_method$host$request_uri";
    proxy_cache_valid  200 302  10m;   # 2xx/302 响应缓存 10 分钟
    proxy_cache_valid  404      1m;    # 404 缓存 1 分钟（防缓存穿透）
    proxy_cache_valid  any      5m;    # 其他状态码缓存 5 分钟
    add_header X-Cache-Status $upstream_cache_status;  # 暴露缓存命中状态
}
```

**与 `Cache-Control` 的联动**

| 后端响应头 | Nginx 行为 |
|-----------|-----------|
| `Cache-Control: no-store` | 不缓存（优先于 `proxy_cache_valid`） |
| `Cache-Control: no-cache` | 缓存但每次需 revalidate |
| `Cache-Control: max-age=300` | 以 300 秒为 TTL（覆盖 `proxy_cache_valid`） |
| `Cache-Control: private` | 不缓存（认为是用户个人数据） |
| 无 Cache-Control | 使用 `proxy_cache_valid` 的配置值 |

**缓存绕过条件**

两个指令控制何时不读缓存（bypass）和何时不写缓存（no_cache）：

```nginx
# 有 Cookie 中的 session 字段，或请求中带 no_cache 参数，则绕过缓存
proxy_cache_bypass  $cookie_session $arg_no_cache;
# 同样条件下，响应也不写入缓存
proxy_no_cache      $cookie_session $arg_no_cache;
```

变量值非空且非 `0` 时生效。常见场景：

- 已登录用户（携带 Cookie）跳过缓存，拿到个性化数据
- 后台管理员传 `?no_cache=1` 强制刷新

**`$upstream_cache_status` 取值**

| 值 | 含义 |
|----|------|
| `HIT` | 命中缓存 |
| `MISS` | 未命中，已回源 |
| `EXPIRED` | 缓存过期，已回源刷新 |
| `BYPASS` | 触发 bypass 条件，跳过缓存 |
| `STALE` | 后端出错，返回过期缓存（需配置 `proxy_cache_use_stale`） |
| `UPDATING` | 正在刷新缓存（并发更新保护） |

**缓存预热与主动清除**

Nginx 开源版不内置主动清除，常用方案：

1. `proxy_cache_purge` 模块（需编译）
2. 在后端通过 Nginx API（商业版）推送失效
3. 简化做法：给 cache key 加版本号（如 `$arg_v`），发布时更新参数

#### 考察意图

考查候选人是否理解 Nginx 缓存配置的核心参数含义，以及如何结合 `Cache-Control` 语义和业务场景（登录态、动静分离）设计精准的缓存绕过策略。

#### 追问链

1. **`proxy_cache_valid any 5m` 会不会把 500 错误也缓存？如何避免？**
   会。`any` 匹配所有状态码，包括 5xx。应明确列出需要缓存的状态码，避免使用 `any`；或配合 `proxy_cache_use_stale error timeout` 在后端出错时复用旧缓存，而非缓存错误响应本身。

2. **如何实现"缓存 stale，后台刷新"（stale-while-revalidate）效果？**
   配置 `proxy_cache_use_stale updating` + `proxy_cache_background_update on`：第一个请求触发回源刷新，同时返回旧缓存给用户，避免回源期间的延迟尖刺。

3. **POST 请求默认被缓存吗？如何让 POST 也走缓存？**
   默认不缓存（仅缓存 GET/HEAD）。若需缓存 POST（如搜索接口），需要：
   ① 在 `proxy_cache_key` 中加入 `$request_body`
   ② 显式配置 `proxy_cache_methods POST`
   但需注意 POST 通常含副作用，缓存语义不安全，需谨慎评估。

4. **多个 Nginx worker 同时回源（Cache Stampede）如何防护？**
   使用 `proxy_cache_lock on`：同 key 只允许一个 worker 回源，其余 worker 等待缓存写入完成后直接读缓存。配合 `proxy_cache_lock_timeout` 设置等待超时时间。

#### 易错点

1. **`keys_zone` 内存与磁盘容量混淆**：`keys_zone=my_cache:10m` 的 10m 是共享内存（存元数据），`max_size=2g` 才是磁盘容量。常见错误是把内存设得很大却忘记设 `max_size`，导致磁盘被无限写满。

2. **`proxy_cache_bypass` 与 `proxy_no_cache` 的区别被忽略**：`bypass` 控制读，`no_cache` 控制写，两者独立生效。只设 `bypass` 不设 `no_cache`，会导致绕过请求的响应覆盖写入缓存，污染其他用户的缓存。通常两者应同时设置相同条件。

3. **动态页面缓存时 Cookie/Auth Header 未纳入 key**：默认 `proxy_cache_key` 不含 Cookie，若接口返回因用户不同而不同，必须把用户标识加入 key（或直接设置 `proxy_no_cache $http_cookie`），否则 A 用户的数据会被 B 用户拿到。

#### 代码示例

```nginx
# /etc/nginx/conf.d/cache.conf

http {
    proxy_cache_path /var/cache/nginx/api
        levels=1:2
        keys_zone=api_cache:20m
        max_size=1g
        inactive=30m
        use_temp_path=off;

    server {
        listen 80;
        server_name app.example.com;

        # 静态 API：积极缓存
        location /api/public/ {
            proxy_cache        api_cache;
            proxy_cache_key    "$request_method$host$uri$is_args$args";
            proxy_cache_valid  200  5m;
            proxy_cache_valid  404  30s;
            proxy_cache_use_stale  error timeout updating;
            proxy_cache_lock       on;              # 防 Stampede
            proxy_cache_background_update on;
            add_header X-Cache-Status $upstream_cache_status;
            proxy_pass http://php_backend;
        }

        # 私有 API：登录用户绕过缓存
        location /api/user/ {
            proxy_cache        api_cache;
            proxy_cache_key    "$request_method$host$uri$is_args$args";
            proxy_cache_valid  200  1m;
            # 携带 session cookie 或 Authorization 头时绕过
            proxy_cache_bypass  $cookie_session $http_authorization;
            proxy_no_cache      $cookie_session $http_authorization;
            add_header X-Cache-Status $upstream_cache_status;
            proxy_pass http://php_backend;
        }
    }
}
```
