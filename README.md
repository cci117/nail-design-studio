# 美甲设计工作台 · Nail Design Studio

V0.1 是一个手机优先的 Next.js PWA 基础架构，为美甲灵感、收藏素材、实际素材、作品和设计方案的后续管理功能做准备。

## 当前范围

- 纯黑极简 App Shell，支持手机和桌面浏览器
- 全部基础路由和空状态
- Supabase Email + Password 登录架构
- PostgreSQL migration、RLS 和私有 Storage bucket policy
- Repository contracts 与 Dexie/IndexedDB 边界
- online/offline 状态检测
- PWA manifest 和不缓存认证/私人 HTML 的 Service Worker App Shell

V0.1 不包含图片上传、AI、联网图片搜索、私人资料完整离线读取或同步冲突处理。

## 本地运行

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。Supabase 未配置时，基础 UI 仍可正常运行，登录功能保持禁用。

## Supabase 配置

1. 复制 `.env.example` 为 `.env.local`。
2. 填入 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`。
3. 在 Supabase SQL Editor 执行 `supabase/migrations/0001_initial_schema.sql`。
4. 启用 Email + Password，配置 Site URL 和 `/auth/confirm` 回调。

不需要也不应将 service-role key 写入浏览器环境变量。

## 质量检查

```bash
npm run lint
npm run typecheck
npm run build
```

## PWA 与离线范围

Service Worker 只在 production 模式注册。使用 `npm run build` 和 `npm start` 验证。当前只缓存离线页、图标和 Next.js 静态资源；不缓存 Supabase Auth API、登录页、带 `Set-Cookie` 的响应或私人 SSR HTML。

## 局域网手机测试

```bash
npm run dev -- --hostname 0.0.0.0
```

使用 `ipconfig` 查看电脑局域网 IPv4，手机连接同一 Wi-Fi 后访问 `http://电脑IPv4:3000`。Windows 防火墙可能需要允许 Node.js 的私有网络访问。PWA 安装在非 localhost 场景通常需要 HTTPS。

## 项目结构

- `src/app` — App Router 页面、manifest 和认证回调
- `src/components` — App Shell、导航、反馈与登录组件
- `src/lib/supabase` — Browser/Server client 和 session proxy
- `src/data` — Repository contracts、IndexedDB 和同步类型边界
- `supabase/migrations` — schema、RLS 与 Storage policy
- `public/sw.js` — 保守的离线 App Shell 策略
