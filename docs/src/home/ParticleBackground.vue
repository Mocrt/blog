<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useTheme } from '@/shared/useTheme'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const { isDark } = useTheme()

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

let particles: Particle[] = []
let animationId = 0
const mouse = { x: -9999, y: -9999, active: false }

// 粒子参数
const CONFIG = {
  count: 90,
  maxDistance: 140,
  mouseDistance: 180,
  mouseForce: 0.6,
  speed: 0.35,
}

// 主题相关的颜色 —— 暗色偏青蓝、亮色偏紫蓝
const THEME_COLORS = {
  dark: { particle: '80, 200, 255', line: '100, 180, 255' },
  light: { particle: '99, 102, 241', line: '99, 102, 241' },
}
const colors = ref(THEME_COLORS.dark)

function initParticles(width: number, height: number) {
  particles = []
  for (let i = 0; i < CONFIG.count; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * CONFIG.speed,
      vy: (Math.random() - 0.5) * CONFIG.speed,
      radius: Math.random() * 1.6 + 0.6,
    })
  }
}

function draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.clearRect(0, 0, width, height)
  const c = colors.value

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i]

    if (mouse.active) {
      const dx = mouse.x - p.x
      const dy = mouse.y - p.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < CONFIG.mouseDistance) {
        const force = (1 - dist / CONFIG.mouseDistance) * CONFIG.mouseForce
        p.vx += (dx / dist) * force * 0.02
        p.vy += (dy / dist) * force * 0.02
      }
    }

    p.x += p.vx
    p.y += p.vy
    p.vx *= 0.99
    p.vy *= 0.99

    if (p.x < 0 || p.x > width) p.vx *= -1
    if (p.y < 0 || p.y > height) p.vy *= -1
    p.x = Math.max(0, Math.min(width, p.x))
    p.y = Math.max(0, Math.min(height, p.y))

    ctx.beginPath()
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${c.particle}, 0.85)`
    ctx.fill()

    for (let j = i + 1; j < particles.length; j++) {
      const q = particles[j]
      const dx = q.x - p.x
      const dy = q.y - p.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < CONFIG.maxDistance) {
        const opacity = (1 - dist / CONFIG.maxDistance) * 0.25
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(q.x, q.y)
        ctx.strokeStyle = `rgba(${c.line}, ${opacity})`
        ctx.lineWidth = 0.6
        ctx.stroke()
      }
    }

    if (mouse.active) {
      const dx = mouse.x - p.x
      const dy = mouse.y - p.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < CONFIG.mouseDistance) {
        const opacity = (1 - dist / CONFIG.mouseDistance) * 0.6
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(mouse.x, mouse.y)
        ctx.strokeStyle = `rgba(${c.line}, ${opacity})`
        ctx.lineWidth = 0.8
        ctx.stroke()
      }
    }
  }
}

function resize(canvas: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio || 1
  const width = canvas.offsetWidth
  const height = canvas.offsetHeight
  canvas.width = width * dpr
  canvas.height = height * dpr
  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)
  initParticles(width, height)
}

function onMouseMove(e: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  mouse.x = e.clientX - rect.left
  mouse.y = e.clientY - rect.top
  mouse.active = true
}

function onMouseLeave() {
  mouse.active = false
  mouse.x = -9999
  mouse.y = -9999
}

// 主题变化时切换配色
watch(isDark, (v) => {
  colors.value = v ? THEME_COLORS.dark : THEME_COLORS.light
}, { immediate: true })

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')!

  resize(canvas)

  const loop = () => {
    draw(ctx, canvas.offsetWidth, canvas.offsetHeight)
    animationId = requestAnimationFrame(loop)
  }
  loop()

  window.addEventListener('resize', () => resize(canvas))
  window.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseleave', onMouseLeave)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseleave', onMouseLeave)
})
</script>

<template>
  <canvas ref="canvasRef" class="particle-bg" />
</template>

<style scoped>
.particle-bg {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 0;
}
</style>
