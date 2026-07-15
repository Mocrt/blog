import { h } from 'vue'
import type { Theme } from 'vitepress'
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import HomeLayout from '@/home/HomeLayout.vue'
import BlogList from '@/blog/BlogList.vue'
import '@/styles/main.css'

// 顶层 Layout:frontmatter.layout === 'home' 时用炫酷首页,否则走默认布局
const Layout = () => {
  const { frontmatter } = useData()
  if (frontmatter.value.layout === 'home') {
    return h(HomeLayout)
  }
  return h(DefaultTheme.Layout)
}

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    // 全局注册,markdown 里可以直接 <BlogList />
    app.component('BlogList', BlogList)
  },
} satisfies Theme
