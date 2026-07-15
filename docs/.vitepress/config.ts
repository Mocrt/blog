import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitepress';
import { collectTags, posts } from '../src/blog/posts';

// 由 posts.ts 自动生成"标签"下拉
const tagItems = collectTags(posts).map((t) => ({
	text: t,
	link: `/blog/?tag=${encodeURIComponent(t)}`,
}));

export default defineConfig({
	lang: 'zh-CN',
	title: 'Lium',
	description: '记录一些思考、方案与踩坑。',

	// 部署到根域名(自定义域名)保持 '/'
	// 部署到 COS 子路径才改成 '/子路径/'
	base: '/',

	// 关闭死链检查,避免个别失效链接把构建搞挂
	ignoreDeadLinks: true,

	// 用带 .html 后缀的 URL,COS + CDN 部署最省心
	cleanUrls: false,

	lastUpdated: true,

	head: [
		['meta', { name: 'viewport', content: 'width=device-width,initial-scale=1' }],
		// Orbitron:sci-fi HUD 字体,用在时钟数字上
		['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
		['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
		[
			'link',
			{
				rel: 'stylesheet',
				href: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&family=Share+Tech+Mono&display=swap',
			},
		],
	],

	themeConfig: {
		logo: null,
		nav: [
			{ text: '首页', link: '/' },
			{ text: '博客', link: '/blog/' },
			// "标签"和列表页共享同一份 posts 的 tag 字段 —— 专题即标签
			{ text: '标签', items: tagItems },
		],
		// 侧边栏也按标签分组,和顶栏保持一致
		sidebar: {
			'/blog/': [
				{
					text: '全部文章',
					items: [{ text: '文章列表', link: '/blog/' }],
				},
				...[...new Map(posts.map((p) => [p.tag, p.tag])).keys()].map((tag) => ({
					text: tag,
					collapsed: false,
					items: posts.filter((p) => p.tag === tag).map((p) => ({ text: p.title, link: p.link })),
				})),
			],
		},
		outline: { level: [2, 3], label: '本页目录' },
		docFooter: { prev: '上一篇', next: '下一篇' },
		lastUpdatedText: '上次更新',
		darkModeSwitchLabel: '主题',
		returnToTopLabel: '返回顶部',
		sidebarMenuLabel: '菜单',
		socialLinks: [],
		footer: {
			message: 'Released under the MIT License.',
			copyright: 'Copyright © 2026',
		},
	},

	// 让业务代码里可以用 `@/xxx` 引用 docs/src 下的模块,避免 ../../src/xxx 这种深层相对路径
	vite: {
		resolve: {
			alias: {
				'@': fileURLToPath(new URL('../src', import.meta.url)),
			},
		},
	},
});
