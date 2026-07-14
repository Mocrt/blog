import { defaultTheme } from '@vuepress/theme-default'
import { viteBundler } from '@vuepress/bundler-vite'

export default {
  bundler: viteBundler(),
  lang: 'zh-CN',
  title: '微前端学习笔记',
  description: '一份系统的微前端学习文档,包括概念、方案对比与实战',

  // Vercel 部署到根域名(如 blog.example.com)保持 '/'
  // 如果部署到 GitHub Pages 的子路径,才需要改成 '/repo-name/'
  base: '/',

  head: [
    ['meta', { name: 'viewport', content: 'width=device-width,initial-scale=1' }],
  ],

  theme: defaultTheme({
    logo: null,
    repo: '',
    docsDir: 'docs',
    navbar: [
      { text: '首页', link: '/' },
      {
        text: '文章',
        children: [
          { text: '微前端入门与实战', link: '/posts/micro-frontend.html' },
        ],
      },
    ],
    sidebar: {
      '/posts/': [
        {
          text: '微前端专题',
          collapsible: false,
          children: [
            '/posts/micro-frontend.md',
          ],
        },
      ],
    },
    lastUpdated: true,
    lastUpdatedText: '上次更新',
    contributors: false,
  }),
}
