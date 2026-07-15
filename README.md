# Micro Frontend Blog

一个基于 VitePress 1.x 搭建的微前端学习博客。

## 快速开始

```bash
# 安装依赖
npm install

# 本地开发(默认 http://localhost:5173)
npm run docs:dev

# 构建静态站点(产物在 docs/.vitepress/dist)
npm run docs:build

# 本地预览构建产物
npm run docs:preview
```

## 目录结构

```
.
├── docs/
│   ├── .vitepress/
│   │   ├── config.ts              # 站点配置(导航、侧边栏、主题)
│   │   ├── theme/
│   │   │   └── index.ts           # VitePress 硬约定入口(分派到 home/ blog/)
│   │   ├── home/                  # 首页布局与组件
│   │   │   ├── HomeLayout.vue     # 首页顶层布局
│   │   │   ├── ClockCard.vue      # 科幻 HUD 时钟
│   │   │   └── ParticleBackground.vue  # 粒子背景
│   │   ├── blog/                  # 博客列表相关
│   │   │   ├── BlogList.vue       # 列表页组件(搜索/过滤/分组)
│   │   │   └── posts.ts           # 文章数据源(新增文章改这里)
│   │   ├── shared/                # 跨页面共享
│   │   │   └── useTheme.ts        # 亮/暗主题切换 hook
│   │   └── styles/
│   │       └── main.css           # 全局样式
│   ├── blog/                      # 博客文章 markdown
│   │   ├── index.md               # 列表页(挂载 <BlogList />)
│   │   ├── micro-frontend.md
│   │   ├── langgraph-notes.md
│   │   └── medical-agent.md
│   ├── index.md                   # 首页(仅 frontmatter,内容由 HomeLayout 渲染)
│   └── 404.md                     # 通用 404 页
├── .github/workflows/
│   └── deploy-vitepress.yml       # GitHub Actions:自动部署到腾讯云 COS + CDN
├── package.json
└── README.md
```

## 新增文章

只需要修改一个文件 [docs/.vitepress/blog/posts.ts](docs/.vitepress/blog/posts.ts),
在数组头部追加一条:

```ts
{
  title: '文章标题',
  desc:  '一句摘要',
  link:  '/blog/your-slug',   // 对应 docs/blog/your-slug.md
  date:  '2026-08-01',
  tag:   'AI Agent',           // 用已有 tag 会自动归到同一分类
  readTime: '10 min',
}
```

然后在 [docs/blog/](docs/blog/) 下创建对应的 `.md` 文件。导航栏、侧边栏、
首页、列表页会全部自动更新。

## 部署

推送到 `main` 分支自动触发 GitHub Actions:

1. 构建 VitePress
2. 通过 coscli 同步到腾讯云 COS
3. 刷新 CDN 缓存

需在仓库 Secrets 中配置:
`TENCENT_SECRET_ID` / `TENCENT_SECRET_KEY` / `COS_BUCKET` / `COS_REGION` / `CDN_DOMAIN`
