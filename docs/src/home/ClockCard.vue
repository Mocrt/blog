<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

// ============ 时钟数据 ============
const now = ref(new Date())
let timer = 0

const pad = (n: number) => String(n).padStart(2, '0')

const hh = computed(() => pad(now.value.getHours()))
const mm = computed(() => pad(now.value.getMinutes()))
const ss = computed(() => pad(now.value.getSeconds()))

const sysId = computed(() => {
  const d = now.value
  return `S-${pad(d.getHours())}${pad(d.getMinutes())}-${pad(d.getSeconds())}`
})

// 秒/分/时环形进度(0~1)
const secProgress = computed(
  () => (now.value.getSeconds() * 1000 + now.value.getMilliseconds()) / 60000,
)
const minProgress = computed(
  () => (now.value.getMinutes() * 60 + now.value.getSeconds()) / 3600,
)
const hourProgress = computed(
  () =>
    (now.value.getHours() * 3600 +
      now.value.getMinutes() * 60 +
      now.value.getSeconds()) /
    86400,
)

const R1 = 140
const R2 = 118
const R3 = 96
const C1 = 2 * Math.PI * R1
const C2 = 2 * Math.PI * R2
const C3 = 2 * Math.PI * R3
const secDash = computed(() => `${C1 * secProgress.value} ${C1}`)
const minDash = computed(() => `${C2 * minProgress.value} ${C2}`)
const hourDash = computed(() => `${C3 * hourProgress.value} ${C3}`)

const ticks = Array.from({ length: 60 }, (_, i) => i)

// ============ 3D tilt(改回传统 ref) ============
const cardRef = ref<HTMLElement | null>(null)

function onMove(e: MouseEvent) {
  const el = cardRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const dx = (e.clientX - cx) / (rect.width / 2)
  const dy = (e.clientY - cy) / (rect.height / 2)
  el.style.setProperty('--rx', `${(-dy * 6).toFixed(2)}deg`)
  el.style.setProperty('--ry', `${(dx * 6).toFixed(2)}deg`)
  const px = ((e.clientX - rect.left) / rect.width) * 100
  const py = ((e.clientY - rect.top) / rect.height) * 100
  el.style.setProperty('--px', `${px}%`)
  el.style.setProperty('--py', `${py}%`)
}

function onLeave() {
  const el = cardRef.value
  if (!el) return
  el.style.setProperty('--rx', '0deg')
  el.style.setProperty('--ry', '0deg')
}

onMounted(() => {
  // 200ms 一跳,环形进度顺滑,秒数字每秒变一次
  timer = window.setInterval(() => {
    now.value = new Date()
  }, 200)
})

onBeforeUnmount(() => {
  clearInterval(timer)
})
</script>

<template>
  <div class="hud-wrap">
    <div ref="cardRef" class="hud" @mousemove="onMove" @mouseleave="onLeave">
      <!-- 四角括号 -->
      <span class="corner tl" />
      <span class="corner tr" />
      <span class="corner bl" />
      <span class="corner br" />

      <!-- 顶栏 -->
      <div class="head">
        <span class="sys">◈ SYS.CLOCK / {{ sysId }}</span>
        <span class="status">
          <span class="blip" />
          LIVE
        </span>
      </div>

      <!-- 中央表盘 -->
      <div class="dial">
        <svg viewBox="0 0 320 320" class="rings">
          <defs>
            <linearGradient id="gSec" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#67e8f9" />
              <stop offset="50%" stop-color="#60a5fa" />
              <stop offset="100%" stop-color="#a78bfa" />
            </linearGradient>
            <linearGradient id="gMin" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#a78bfa" />
              <stop offset="100%" stop-color="#f472b6" />
            </linearGradient>
            <linearGradient id="gHour" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stop-color="#60a5fa" />
              <stop offset="100%" stop-color="#67e8f9" />
            </linearGradient>
            <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <!-- 三层底圈 -->
          <circle cx="160" cy="160" :r="R1" fill="none" stroke="rgba(148,163,184,0.12)" stroke-width="1" />
          <circle cx="160" cy="160" :r="R2" fill="none" stroke="rgba(148,163,184,0.09)" stroke-width="1" stroke-dasharray="2 4" />
          <circle cx="160" cy="160" :r="R3" fill="none" stroke="rgba(148,163,184,0.09)" stroke-width="1" />

          <!-- 60 刻度 -->
          <g class="ticks">
            <line
              v-for="i in ticks"
              :key="i"
              x1="160"
              :y1="20"
              x2="160"
              :y2="i % 5 === 0 ? 30 : 25"
              :stroke="i % 15 === 0 ? '#67e8f9' : 'rgba(148,163,184,0.35)'"
              :stroke-width="i % 5 === 0 ? 1.2 : 0.6"
              :transform="`rotate(${i * 6} 160 160)`"
            />
          </g>

          <!-- 三层进度环 -->
          <circle cx="160" cy="160" :r="R1" fill="none" stroke="url(#gSec)" stroke-width="2"
                  :stroke-dasharray="secDash" stroke-linecap="round" transform="rotate(-90 160 160)"
                  filter="url(#softGlow)" />
          <circle cx="160" cy="160" :r="R2" fill="none" stroke="url(#gMin)" stroke-width="1.5"
                  :stroke-dasharray="minDash" stroke-linecap="round" transform="rotate(-90 160 160)"
                  opacity="0.85" />
          <circle cx="160" cy="160" :r="R3" fill="none" stroke="url(#gHour)" stroke-width="1.2"
                  :stroke-dasharray="hourDash" stroke-linecap="round" transform="rotate(-90 160 160)"
                  opacity="0.7" />

          <!-- 秒针端点 -->
          <g :transform="`rotate(${secProgress * 360} 160 160)`">
            <circle cx="160" :cy="160 - R1" r="4" fill="#67e8f9" filter="url(#softGlow)" />
          </g>

          <!-- 十字准心 -->
          <g class="crosshair" stroke="rgba(103,232,249,0.4)" stroke-width="0.6" fill="none">
            <line x1="160" y1="152" x2="160" y2="168" />
            <line x1="152" y1="160" x2="168" y2="160" />
            <circle cx="160" cy="160" r="3" stroke="rgba(103,232,249,0.6)" />
          </g>

          <!-- 雷达 -->
          <g class="radar">
            <line x1="160" y1="160" x2="160" :y2="160 - R1 - 4"
                  stroke="url(#gSec)" stroke-width="1" opacity="0.35" />
          </g>
        </svg>

        <!-- 数字读数(纯文本 · Orbitron 字体) -->
        <div class="readout">
          <div class="hm">
            <span class="d">{{ hh }}</span>
            <span class="colon">:</span>
            <span class="d">{{ mm }}</span>
          </div>
          <div class="sub">
            <span class="sep">::</span>
            <span class="ss">{{ ss }}</span>
          </div>
        </div>
      </div>

      <!-- 装饰层 -->
      <div class="grid" />
      <div class="scanline" />
      <div class="shine" />
      <div class="noise" />
    </div>
  </div>
</template>

<style scoped>
.hud-wrap {
  perspective: 1400px;
  display: flex;
  justify-content: center;
}

/* ========== 卡片 ========== */
.hud {
  --rx: 0deg;
  --ry: 0deg;
  --px: 50%;
  --py: 50%;
  --neon: #67e8f9;
  --neon2: #a78bfa;
  --neon3: #f472b6;

  position: relative;
  width: 340px;
  height: 340px;
  border-radius: 14px;
  padding: 1.15rem 1.25rem;
  color: rgba(226, 232, 240, 0.9);
  transform-style: preserve-3d;
  transform: rotateX(var(--rx)) rotateY(var(--ry));
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  overflow: hidden;

  background:
    radial-gradient(ellipse at 30% 20%, rgba(96, 165, 250, 0.22), transparent 55%),
    radial-gradient(ellipse at 80% 90%, rgba(167, 139, 250, 0.22), transparent 55%),
    linear-gradient(155deg, #1a2340 0%, #1e2748 55%, #201b3d 100%);

  border: 1px solid rgba(103, 232, 249, 0.22);
  box-shadow:
    0 0 0 1px rgba(103, 232, 249, 0.08) inset,
    0 0 40px -8px rgba(103, 232, 249, 0.3) inset,
    0 30px 80px -20px rgba(0, 0, 0, 0.5),
    0 0 60px -20px rgba(103, 232, 249, 0.4);
}

@media (max-width: 860px) {
  .hud {
    width: 280px;
    height: 280px;
    padding: 0.9rem 1rem;
  }
}

:global(html:not(.dark)) .hud {
  color: rgba(226, 232, 240, 0.92);
  background:
    radial-gradient(ellipse at 30% 20%, rgba(59, 130, 246, 0.28), transparent 55%),
    radial-gradient(ellipse at 80% 90%, rgba(139, 92, 246, 0.28), transparent 55%),
    linear-gradient(155deg, #24304f 0%, #26315a 55%, #2a2249 100%);
  border-color: rgba(103, 232, 249, 0.32);
}

/* ========== 四角括号 ========== */
.corner {
  position: absolute;
  width: 16px;
  height: 16px;
  border: 1.5px solid var(--neon);
  z-index: 3;
  pointer-events: none;
  filter: drop-shadow(0 0 4px rgba(103, 232, 249, 0.5));
}
.corner.tl { top: 8px; left: 8px; border-right: none; border-bottom: none; }
.corner.tr { top: 8px; right: 8px; border-left: none; border-bottom: none; }
.corner.bl { bottom: 8px; left: 8px; border-right: none; border-top: none; }
.corner.br { bottom: 8px; right: 8px; border-left: none; border-top: none; }

/* ========== 顶栏 ========== */
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'Share Tech Mono', 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  color: rgba(148, 163, 184, 0.75);
  position: relative;
  z-index: 3;
}

.sys {
  color: var(--neon);
  opacity: 0.9;
  text-shadow: 0 0 6px rgba(103, 232, 249, 0.4);
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #4ade80;
  letter-spacing: 0.22em;
  text-shadow: 0 0 6px rgba(74, 222, 128, 0.5);
}

.blip {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 8px #4ade80;
  animation: blip 1.4s ease-in-out infinite;
}

@keyframes blip {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(0.75); }
}

/* ========== 表盘 ========== */
.dial {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  margin-top: 0.35rem;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.rings {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.radar {
  transform-origin: 160px 160px;
  animation: radar 6s linear infinite;
}

@keyframes radar {
  to { transform: rotate(360deg); }
}

.crosshair {
  opacity: 0.7;
  animation: crosshairPulse 3s ease-in-out infinite;
}

@keyframes crosshairPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* ========== 数字读数(Orbitron 字体) ========== */
.readout {
  position: relative;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.hm {
  display: flex;
  align-items: baseline;
  gap: 0.05em;
  color: #f0f9ff;
  text-shadow:
    0 0 10px rgba(103, 232, 249, 0.6),
    0 0 26px rgba(96, 165, 250, 0.35),
    0 0 50px rgba(167, 139, 250, 0.2);
}

.hm .d {
  font-family: 'Orbitron', 'JetBrains Mono', ui-monospace, monospace;
  font-weight: 600;
  font-size: 3rem;
  letter-spacing: 0.02em;
  line-height: 1;
}

.hm .colon {
  font-family: 'Orbitron', ui-monospace, monospace;
  color: var(--neon);
  opacity: 0.9;
  animation: colonBlink 1.2s steps(2) infinite;
  padding: 0 0.02em;
  font-weight: 400;
  font-size: 3rem;
  line-height: 1;
  transform: translateY(-4px);
}

@media (max-width: 860px) {
  .hm .d,
  .hm .colon { font-size: 2.35rem; }
}

@keyframes colonBlink {
  50% { opacity: 0.2; }
}

.sub {
  margin-top: 0.75rem;
  display: inline-flex;
  align-items: baseline;
  gap: 0.35em;
  font-family: 'Share Tech Mono', 'JetBrains Mono', ui-monospace, monospace;
  letter-spacing: 0.15em;
}

.sub .sep {
  color: var(--neon);
  opacity: 0.55;
  font-size: 0.85rem;
}

.sub .ss {
  color: var(--neon);
  opacity: 0.9;
  font-size: 1.1rem;
  text-shadow: 0 0 8px rgba(103, 232, 249, 0.5);
}

/* ========== 装饰层 ========== */
.grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(103, 232, 249, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(103, 232, 249, 0.06) 1px, transparent 1px);
  background-size: 24px 24px;
  mask-image: radial-gradient(ellipse at center, black 40%, transparent 75%);
  pointer-events: none;
  z-index: 1;
  opacity: 0.35;
}

.scanline {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    transparent 0%,
    transparent 48%,
    rgba(103, 232, 249, 0.1) 50%,
    transparent 52%,
    transparent 100%
  );
  animation: scan 4s linear infinite;
  pointer-events: none;
  z-index: 2;
  mix-blend-mode: screen;
}

@keyframes scan {
  0%   { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}

.shine {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    500px circle at var(--px) var(--py),
    rgba(103, 232, 249, 0.14),
    transparent 40%
  );
  pointer-events: none;
  z-index: 2;
  transition: background 0.2s;
}

.noise {
  position: absolute;
  inset: 0;
  opacity: 0.04;
  pointer-events: none;
  z-index: 2;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}
</style>
