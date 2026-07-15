<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { posts, groupByYear } from '@/blog/posts'

// 顶部搜索 + 按 tag 过滤
const keyword = ref('')
const activeTag = ref<string>('全部')

const allTags = computed(() => {
  const set = new Set<string>()
  posts.forEach(p => set.add(p.tag))
  return ['全部', ...set]
})

// 支持从 URL 读取 ?tag=xxx 作为初始过滤
onMounted(() => {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  const t = url.searchParams.get('tag')
  if (t && allTags.value.includes(t)) {
    activeTag.value = t
  }
})

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return posts.filter(p => {
    const matchTag = activeTag.value === '全部' || p.tag === activeTag.value
    const matchKw = !kw
      || p.title.toLowerCase().includes(kw)
      || p.desc.toLowerCase().includes(kw)
      || p.tag.toLowerCase().includes(kw)
    return matchTag && matchKw
  })
})

const grouped = computed(() => groupByYear(filtered.value))
</script>

<template>
  <div class="blog">
    <!-- 页头 -->
    <header class="blog-head">
      <p class="eyebrow">
        <span class="mono">// 全部文章</span>
      </p>
      <h1 class="title">
        <span class="hl">Blog</span>
        <span class="count">{{ posts.length }} 篇</span>
      </h1>
      <p class="subtitle">思考、方案、踩坑与复盘。</p>
    </header>

    <!-- 筛选栏 -->
    <div class="toolbar">
      <div class="search">
        <span class="search-icon">⌕</span>
        <input
          v-model="keyword"
          type="text"
          placeholder="搜索标题、简介或标签..."
        >
      </div>
      <div class="tags">
        <button
          v-for="t in allTags"
          :key="t"
          class="tag-btn"
          :class="{ active: activeTag === t }"
          @click="activeTag = t"
        >
          {{ t }}
        </button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="filtered.length === 0" class="empty">
      <p>没有匹配的文章</p>
      <span class="hint">试试换个关键词?</span>
    </div>

    <!-- 按年份分组的列表 -->
    <div v-else class="years">
      <section
        v-for="[year, list] in grouped"
        :key="year"
        class="year-group"
      >
        <div class="year-label">
          <span class="year-num">{{ year }}</span>
          <span class="year-line" />
          <span class="year-count">{{ list.length }}</span>
        </div>

        <ul class="list">
          <li v-for="p in list" :key="p.link" class="item">
            <a :href="p.link" class="item-link">
              <span class="item-date">{{ p.date.slice(5) }}</span>
              <span class="item-body">
                <span class="item-title">{{ p.title }}</span>
                <span class="item-desc">{{ p.desc }}</span>
                <span class="item-meta">
                  <span class="chip">{{ p.tag }}</span>
                  <span v-if="p.readTime" class="read">· {{ p.readTime }}</span>
                </span>
              </span>
              <span class="item-arrow">→</span>
            </a>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
.blog {
  max-width: 820px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 5rem;
}

/* ===== Head ===== */
.blog-head {
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.eyebrow {
  margin: 0 0 0.5rem;
  color: var(--vp-c-text-3);
  font-size: 0.85rem;
}

.mono {
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
}

.title {
  margin: 0 0 0.5rem;
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.1;
  display: inline-flex;
  align-items: baseline;
  gap: 0.75rem;
}

.title .hl {
  background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.title .count {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--vp-c-text-3);
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}

.subtitle {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 1rem;
}

/* ===== Toolbar ===== */
.toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2.5rem;
  flex-wrap: wrap;
}

.search {
  flex: 1 1 240px;
  min-width: 200px;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--vp-c-text-3);
  font-size: 1rem;
}

.search input {
  width: 100%;
  padding: 0.55rem 0.85rem 0.55rem 2.2rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
  color: var(--vp-c-text-1);
  font-size: 0.9rem;
  outline: none;
  transition: all 0.2s;
}

.search input::placeholder {
  color: var(--vp-c-text-3);
}

.search input:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.15);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.tag-btn {
  padding: 0.4rem 0.85rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-btn:hover {
  border-color: #60a5fa;
  color: #60a5fa;
}

.tag-btn.active {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 2px 12px rgba(59, 130, 246, 0.35);
}

/* ===== Year Groups ===== */
.year-group {
  margin-bottom: 3rem;
}

.year-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.year-num {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  letter-spacing: 0.02em;
}

.year-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, var(--vp-c-divider), transparent);
}

.year-count {
  font-size: 0.75rem;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  color: var(--vp-c-text-3);
  padding: 0.15rem 0.55rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
}

/* ===== List ===== */
.list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.item + .item {
  border-top: 1px dashed var(--vp-c-divider);
}

.item-link {
  display: grid;
  grid-template-columns: 64px 1fr auto;
  gap: 1.25rem;
  align-items: start;
  padding: 1.25rem 0.5rem;
  color: inherit;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s;
}

.item-link:hover {
  background: var(--vp-c-brand-soft);
  padding-left: 1rem;
}

.item-date {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.85rem;
  color: var(--vp-c-text-3);
  padding-top: 0.15rem;
}

.item-body {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.item-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  transition: color 0.2s;
}

.item-link:hover .item-title {
  color: #60a5fa;
}

.item-desc {
  font-size: 0.88rem;
  color: var(--vp-c-text-2);
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.78rem;
  color: var(--vp-c-text-3);
  margin-top: 0.15rem;
}

.chip {
  color: #60a5fa;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.75rem;
}

.item-arrow {
  color: var(--vp-c-text-3);
  font-size: 1.1rem;
  transition: transform 0.2s, color 0.2s;
  padding-top: 0.15rem;
}

.item-link:hover .item-arrow {
  color: #60a5fa;
  transform: translateX(4px);
}

/* ===== Empty ===== */
.empty {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--vp-c-text-2);
}

.empty p {
  font-size: 1.1rem;
  font-weight: 500;
  margin: 0 0 0.5rem;
}

.empty .hint {
  font-size: 0.9rem;
  color: var(--vp-c-text-3);
}

/* 移动端 */
@media (max-width: 640px) {
  .item-link {
    grid-template-columns: 52px 1fr;
  }
  .item-arrow { display: none; }
}
</style>
