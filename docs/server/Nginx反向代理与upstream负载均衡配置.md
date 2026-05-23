---
title: Nginx 反向代理与 upstream 负载均衡配置
difficulty: L2
frequency: 高
tags: [Nginx, 反向代理, upstream, 负载均衡, proxy_pass]
needs_verification: false
created: 2026-05-23
---

# [L2] Nginx 反向代理与 upstream 负载均衡配置

#### 一句话结论

`proxy_pass` 转发至 `upstream` 后端池，调度算法依会话特性与后端差异选型。

#### 体系讲解

**反向代理模型**

Nginx 作为反向代理时，客户端只与 Nginx 建立连接，后端服务器对客户端不可见。`proxy_pass` 指定转发目标，若目标写成 `upstream` 块名称则进入负载均衡逻辑。

```
Client → Nginx (proxy_pass) → upstream pool → Backend 1/2/3
```

**upstream 块基础结构**

```nginx
upstream php_backend {
    server 10.0.0.1:9000 weight=3;
    server 10.0.0.2:9000 weight=1;
    server 10.0.0.3:9000 backup;   # 主节点全部不可用时启用
}
```

**三种调度算法选型**

| 算法 | 指令 | 核心机制 | 适用场景 |
|------|------|---------|---------|
| 轮询（Round Robin） | 默认，无需声明 | 按 weight 顺序分发 | 后端性能均等、无状态应用 |
| IP Hash | `ip_hash;` | 对客户端 IP 取哈希，固定后端 | 有会话亲和需求（如 PHP Session 不共享） |
| 最少连接 | `least_conn;` | 选当前活跃连接数最少的节点 | 后端处理时间差异大（如慢查询混入） |

**选型决策要点**

- **无状态应用**（Session 存 Redis）→ 首选 `least_conn`，可充分利用快速节点
- **有状态但无法改造**（Session 存本地文件）→ 用 `ip_hash`，牺牲均匀性换会话一致
- **容器化同规格部署** → 默认轮询即可，权重全设为 1

**健康检查与参数**

```nginx
upstream php_backend {
    least_conn;
    server 10.0.0.1:9000 max_fails=3 fail_timeout=30s;
    server 10.0.0.2:9000 max_fails=3 fail_timeout=30s;
    keepalive 32;   # 与后端保持长连接复用
}
```

- `max_fails`：在 `fail_timeout` 窗口内失败次数上限，超出则临时摘除节点
- `keepalive`：维持到后端的连接池大小（需配合 `proxy_http_version 1.1` 使用）

**proxy_pass 路径处理陷阱**

```nginx
# 写法 A：不带尾斜杠 — URI 原样传递
location /api/ {
    proxy_pass http://php_backend;
}
# 请求 /api/user → 后端收到 /api/user

# 写法 B：带尾斜杠 — 去掉 location 前缀
location /api/ {
    proxy_pass http://php_backend/;
}
# 请求 /api/user → 后端收到 /user
```

#### 考察意图

考查候选人对 Nginx 反向代理核心配置的掌握程度，以及能否根据业务场景（是否有状态、后端性能是否均等）做出合理的负载均衡算法选型，而非机械背诵。

#### 追问链

1. **`ip_hash` 在后端扩缩容时有什么问题？如何缓解？**
   扩缩容会导致哈希取模结果变化，已建立的会话映射被打散。缓解：① 扩容时用 `down` 标记旧节点而非直接删除，让流量逐渐迁移；② 根本解法是将 Session 迁移到 Redis 等共享存储，从而不依赖 `ip_hash`。

2. **`keepalive 32` 中的数字 32 代表什么？设置过大有什么副作用？**
   代表每个 worker 进程保持的空闲长连接数上限。设置过大会占用后端连接池资源；若后端 PHP-FPM 的 `pm.max_children` 为 50，而 Nginx 有 4 个 worker 各开 32 长连接，可能耗尽后端连接。应结合后端最大连接数计算：`keepalive ≤ pm.max_children / worker_processes`。

3. **如何验证负载均衡是否按预期工作？**
   ① 在后端服务输出 `$_SERVER['SERVER_ADDR']`，观察请求分布；② 查看 `nginx -s reload` 后的 access.log 中 `upstream_addr` 字段；③ 使用 `ngx_http_stub_status_module` 监控当前活跃连接。

4. **`proxy_pass` 转发时如何传递真实客户端 IP？**
   默认后端只能看到 Nginx 的 IP。需加：
   ```nginx
   proxy_set_header X-Real-IP $remote_addr;
   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   ```
   PHP 端用 `$_SERVER['HTTP_X_REAL_IP']` 读取。

#### 易错点

1. **`proxy_pass` 尾斜杠行为**：有无尾斜杠对 URI 传递规则完全不同（见上文写法 A/B），混淆会导致后端路由 404，是最常见的配置错误。

2. **`ip_hash` 与 CDN/代理叠加失效**：若客户端经过 CDN 或企业代理，Nginx 看到的 `$remote_addr` 是 CDN 出口 IP，导致大量请求哈希到同一后端，变成事实上的单点。应改用 `$http_x_forwarded_for` 提取真实 IP（需自行实现或使用三方模块）。

3. **忘记 `proxy_http_version 1.1`**：`keepalive` 仅在 HTTP/1.1 下生效，若未声明版本，长连接不会被复用，`keepalive` 指令形同虚设。

#### 代码示例

```nginx
# /etc/nginx/conf.d/php-app.conf

upstream php_backend {
    least_conn;                                    # 最少连接调度
    server 10.0.0.1:9000 max_fails=3 fail_timeout=30s;
    server 10.0.0.2:9000 max_fails=3 fail_timeout=30s;
    server 10.0.0.3:9000 backup;                  # 热备节点
    keepalive 16;                                  # 每 worker 保持 16 个空闲长连接
}

server {
    listen 80;
    server_name app.example.com;

    location / {
        proxy_pass         http://php_backend;
        proxy_http_version 1.1;                    # 启用长连接
        proxy_set_header   Connection "";           # 清除逐跳头以支持 keepalive
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_connect_timeout 5s;
        proxy_read_timeout    60s;
    }
}
```
