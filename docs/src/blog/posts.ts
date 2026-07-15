/**
 * 博客文章数据
 * 首页最新文章 + 博客列表页共用这份数据
 * 新增文章:在数组头部追加(按日期倒序)
 */
export interface Post {
  title: string
  desc: string
  link: string
  date: string
  tag: string
  readTime?: string   // 可选:预计阅读时长
}

export const posts: Post[] = [
  {
    title: '从一个医疗问诊 Agent 的诞生,看懂 LangChain、LangGraph 与 LangSmith',
    desc: 'LangChain、LangGraph 和 LangSmith 正在重塑 AI Agent 的开发范式。本文通过医疗分诊 Agent 的实战案例,带你解析这套技术栈如何应对真实业务场景。',
    link: '/blog/medical-agent',
    date: '2026-07-15',
    tag: 'AI Agent',
    readTime: '34 min',
  },
  {
    title: 'LangGraph 学习笔记',
    desc: '从概念到实战,系统梳理 LangGraph 的一份学习笔记,包含 State、Node、Edge、Checkpointer 等核心概念以及完整实战示例。',
    link: '/blog/langgraph-notes',
    date: '2026-07-14',
    tag: 'AI Agent',
    readTime: '25 min',
  },
  {
    title: '微前端入门与实战',
    desc: '从背景、核心概念、主流方案到工程实践,系统梳理微前端的一份学习笔记。',
    link: '/blog/micro-frontend',
    date: '2026-07-10',
    tag: '前端架构',
    readTime: '15 min',
  },
]

/**
 * 收集所有出现过的 tag(用于导航栏/侧边栏动态生成)
 */
export function collectTags(list: Post[] = posts): string[] {
  const set = new Set<string>()
  list.forEach(p => set.add(p.tag))
  return [...set]
}

/**
 * 按 tag 分组
 */
export function groupByTag(list: Post[]) {
  const map = new Map<string, Post[]>()
  for (const p of list) {
    const arr = map.get(p.tag) ?? []
    arr.push(p)
    map.set(p.tag, arr)
  }
  return map
}

/**
 * 按年份分组
 */
export function groupByYear(list: Post[]) {
  const map = new Map<string, Post[]>()
  for (const p of list) {
    const y = p.date.slice(0, 4)
    const arr = map.get(y) ?? []
    arr.push(p)
    map.set(y, arr)
  }
  // 年份倒序
  return new Map([...map.entries()].sort((a, b) => b[0].localeCompare(a[0])))
}
