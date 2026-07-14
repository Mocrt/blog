# Micro Frontend Blog

一个基于 VuePress 2 搭建的微前端学习博客。

## 快速开始

```bash
# 安装依赖(推荐 pnpm)
pnpm install
# 或
npm install

# 本地开发
npm run docs:dev

# 构建静态站点
npm run docs:build
```

启动后访问:<http://localhost:8080>

## 目录结构

```
.
├── docs/
│   ├── .vuepress/
│   │   └── config.js         # VuePress 站点配置
│   ├── posts/
│   │   └── micro-frontend.md # 微前端学习文档
│   └── README.md             # 站点首页
├── package.json
└── README.md
```
