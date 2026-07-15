import { ref, onMounted, onBeforeUnmount } from 'vue'

/**
 * 全局主题状态(亮/暗)
 * - 读取 <html class="dark"> 的实际状态
 * - 通过 MutationObserver 同步 VitePress 自身的切换(SSR 首屏也稳)
 * - 提供 toggle 方法,写入 localStorage,和 VitePress 官方 key 保持一致
 */
export function useTheme() {
  const isDark = ref(false)
  let observer: MutationObserver | null = null

  const syncFromDOM = () => {
    if (typeof document === 'undefined') return
    isDark.value = document.documentElement.classList.contains('dark')
  }

  const toggle = () => {
    if (typeof document === 'undefined') return
    const next = !document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', next)
    // VitePress 1.x 的 appearance key
    try {
      localStorage.setItem('vitepress-theme-appearance', next ? 'dark' : 'light')
    } catch {}
    isDark.value = next
  }

  onMounted(() => {
    syncFromDOM()
    observer = new MutationObserver(syncFromDOM)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return { isDark, toggle }
}
