<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import ParticleBackground from '@/home/ParticleBackground.vue'
import ClockCard from '@/home/ClockCard.vue'
import { useTheme } from '@/shared/useTheme'
import { posts as allPosts } from '@/blog/posts'

// ============ 个人信息 ============
const profile = {
	name: 'Lium',
	title: 'Frontend Engineer',
	// 打字机会轮播的短句
	typewriter: [
		'构建、拆解、再重建',
		'Building on the Web',
		'让复杂的事变简单',
		'Coffee → Code → Ship',
	],
	intro: '专注 Web 前端与工程化,喜欢把复杂的问题拆到最小可控。这里记录一些思考、方案与踩坑。',
	skills: [
		'Vue 3',
		'TypeScript',
		'Vite',
		'Node.js',
		'微前端',
		'架构设计',
		'AI Agent',
	],
	socials: [
		{ name: 'GitHub', link: 'https://github.com', icon: '⌘' },
		{ name: 'Email', link: 'mailto:hi@example.com', icon: '✉' },
		{ name: '博客', link: '/blog/', icon: '✎' },
	],
}

// 首页只展示最新 3 篇
const posts = computed(() => allPosts.slice(0, 3))
const year = computed(() => 2026)

// ============ 首页浏览器 title ============
onMounted(() => {
	// 覆盖 VitePress 自动生成的默认 title
	document.title = `${profile.name} · 个人主页`
})

// ============ 主题切换 ============
const { isDark, toggle: toggleTheme } = useTheme()

// ============ 打字机效果 ============
const typed = ref('')
const typing = ref(true)
let typeTimer = 0
let phraseIndex = 0
let charIndex = 0

function typeLoop() {
	const phrases = profile.typewriter
	const cur = phrases[phraseIndex]

	if (typing.value) {
		// 打字
		charIndex++
		typed.value = cur.slice(0, charIndex)
		if (charIndex >= cur.length) {
			typing.value = false
			typeTimer = window.setTimeout(typeLoop, 1500) // 完成后停留
			return
		}
		typeTimer = window.setTimeout(typeLoop, 80)
	} else {
		// 删除
		charIndex--
		typed.value = cur.slice(0, charIndex)
		if (charIndex <= 0) {
			typing.value = true
			phraseIndex = (phraseIndex + 1) % phrases.length
			typeTimer = window.setTimeout(typeLoop, 400)
			return
		}
		typeTimer = window.setTimeout(typeLoop, 40)
	}
}

// ============ 3D tilt 头像 —— 已替换为 ClockCard 组件,逻辑内聚在组件内 ============

onMounted(() => {
	typeLoop()
})

onBeforeUnmount(() => {
	clearTimeout(typeTimer)
})
</script>

<template>
	<ParticleBackground />

	<!-- 首页独立的主题切换按钮(悬浮右上) -->
	<button class="theme-toggle" :title="isDark ? '切换到亮色' : '切换到暗色'" @click="toggleTheme">
		<span class="theme-icon">{{ isDark ? '☀' : '☾' }}</span>
	</button>

	<div class="home">
		<!-- Hero -->
		<section class="hero">
			<div class="hero-grid">
				<!-- 左侧文本 -->
				<div class="hero-inner">
					<p class="badge">
						<span class="dot" />
						<span>{{ profile.title }}</span>
					</p>

					<h1 class="name">
						<span class="prefix">$ hi, I'm</span>
						<span class="hl">{{ profile.name }}</span>
					</h1>

					<p class="subtitle">
						<span class="typed">{{ typed }}</span>
						<span class="cursor" />
					</p>

					<p class="intro">{{ profile.intro }}</p>

					<div class="actions">
						<a class="btn primary" href="/blog/">
							阅读博客
							<span class="arrow">→</span>
						</a>
						<a class="btn" href="https://github.com" target="_blank" rel="noreferrer">
							GitHub
						</a>
					</div>

					<div class="skills">
						<span v-for="s in profile.skills" :key="s" class="chip">{{ s }}</span>
					</div>
				</div>

				<!-- 右侧实时时钟 -->
				<ClockCard />
			</div>

			<div class="scroll-hint">
				<span>SCROLL</span>
				<span class="line" />
			</div>
		</section>

		<!-- Latest Posts -->
		<section class="section">
			<div class="section-head">
				<h2>
					<span class="idx">01</span>
					最新文章
				</h2>
				<a href="/blog/" class="more">全部 →</a>
			</div>

			<div class="posts">
				<a v-for="p in posts" :key="p.link" class="card" :href="p.link">
					<div class="card-meta">
						<span class="tag">{{ p.tag }}</span>
						<span class="date">{{ p.date }}</span>
					</div>
					<h3 class="card-title">{{ p.title }}</h3>
					<p class="card-desc">{{ p.desc }}</p>
					<span class="card-cta">阅读全文 →</span>
				</a>
			</div>
		</section>

		<!-- Contact -->
		<section class="section">
			<div class="section-head">
				<h2>
					<span class="idx">02</span>
					联系我
				</h2>
			</div>

			<div class="socials">
				<a v-for="s in profile.socials" :key="s.name" :href="s.link" class="social" :title="s.name" target="_blank" rel="noreferrer">
					<span class="icon">{{ s.icon }}</span>
					<span class="name">{{ s.name }}</span>
				</a>
			</div>
		</section>

		<footer class="footer">
			<span>© {{ year }} {{ profile.name }}</span>
			<span class="dot-sep">·</span>
			<span>Built with VitePress</span>
		</footer>
	</div>
</template>

<style scoped>
.home {
	position: relative;
	z-index: 1;
	max-width: 1100px;
	margin: 0 auto;
	padding: 0 1.5rem;
	color: var(--vp-c-text-1);
}

/* ===== 悬浮主题切换按钮 ===== */
.theme-toggle {
	position: fixed;
	top: 5.5rem;
	right: 1.5rem;
	z-index: 20;
	width: 42px;
	height: 42px;
	border-radius: 50%;
	border: 1px solid var(--vp-c-divider);
	background: rgba(255, 255, 255, 0.04);
	backdrop-filter: blur(10px);
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--vp-c-text-1);
	transition: all 0.3s;
}

.theme-toggle:hover {
	border-color: #60a5fa;
	color: #60a5fa;
	transform: rotate(20deg) scale(1.05);
	box-shadow: 0 0 20px rgba(96, 165, 250, 0.4);
}

.theme-icon {
	font-size: 1.15rem;
	line-height: 1;
}

/* ===== Hero ===== */
.hero {
	min-height: calc(100vh - var(--vp-nav-height));
	display: flex;
	flex-direction: column;
	justify-content: center;
	position: relative;
}

.hero-grid {
	display: grid;
	grid-template-columns: 1fr auto;
	gap: 4rem;
	align-items: center;
}

@media (max-width: 860px) {
	.hero-grid {
		grid-template-columns: 1fr;
		gap: 2.5rem;
	}
}

.hero-inner {
	max-width: 640px;
}

.badge {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.35rem 0.85rem;
	border: 1px solid var(--vp-c-divider);
	border-radius: 999px;
	font-size: 0.8rem;
	color: var(--vp-c-text-2);
	background: rgba(255, 255, 255, 0.02);
	backdrop-filter: blur(6px);
	margin-bottom: 1.5rem;
}

.dot {
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: #4ade80;
	box-shadow: 0 0 8px #4ade80;
	animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
	0%,
	100% {
		opacity: 1;
	}
	50% {
		opacity: 0.4;
	}
}

.name {
	font-size: clamp(2.5rem, 2.5vw, 2.5rem);
	font-weight: 800;
	line-height: 1.1;
	letter-spacing: -0.03em;
	margin: 0 0 1rem;
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	gap: 0.6rem;
}

.prefix {
	font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
	font-size: 0.4em;
	font-weight: 500;
	color: var(--vp-c-text-3);
}

.hl {
	background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%);
	-webkit-background-clip: text;
	background-clip: text;
	color: transparent;
}

.subtitle {
	font-size: clamp(1.15rem, 2.2vw, 1.5rem);
	font-weight: 500;
	color: var(--vp-c-text-1);
	margin: 0 0 1.25rem;
	min-height: 1.8em; /* 打字时避免高度抖动 */
	display: flex;
	align-items: center;
}

.typed {
	background: linear-gradient(90deg, var(--vp-c-text-1), var(--vp-c-brand-1));
	-webkit-background-clip: text;
	background-clip: text;
	color: transparent;
}

.cursor {
	display: inline-block;
	width: 3px;
	height: 1.1em;
	margin-left: 4px;
	background: #60a5fa;
	box-shadow: 0 0 12px #60a5fa;
	animation: blink 1s steps(2) infinite;
	transform: translateY(2px);
}

@keyframes blink {
	50% {
		opacity: 0;
	}
}

.intro {
	font-size: 1.05rem;
	line-height: 1.75;
	color: var(--vp-c-text-2);
	max-width: 34rem;
	margin: 0 0 2rem;
}

.actions {
	display: flex;
	gap: 0.75rem;
	flex-wrap: wrap;
	margin-bottom: 3rem;
}

.btn {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	border: 1px solid var(--vp-c-divider);
	border-radius: 8px;
	font-size: 0.95rem;
	font-weight: 500;
	color: var(--vp-c-text-1);
	background: rgba(255, 255, 255, 0.02);
	backdrop-filter: blur(6px);
	text-decoration: none;
	transition: all 0.25s;
}

.btn:hover {
	border-color: #60a5fa;
	color: #60a5fa;
	transform: translateY(-2px);
}

.btn.primary {
	background: linear-gradient(135deg, #3b82f6, #8b5cf6);
	border-color: transparent;
	color: #fff;
	box-shadow: 0 4px 20px rgba(59, 130, 246, 0.35);
}

.btn.primary:hover {
	color: #fff;
	box-shadow: 0 8px 30px rgba(59, 130, 246, 0.5);
}

.btn .arrow {
	transition: transform 0.25s;
}
.btn:hover .arrow {
	transform: translateX(4px);
}

.skills {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}

.chip {
	padding: 0.3rem 0.75rem;
	font-size: 0.8rem;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	color: var(--vp-c-text-2);
	border: 1px solid var(--vp-c-divider);
	border-radius: 6px;
	background: rgba(255, 255, 255, 0.02);
	transition: all 0.2s;
}
.chip:hover {
	border-color: #60a5fa;
	color: #60a5fa;
	transform: translateY(-2px);
}

/* ===== 3D Tilt 头像 ===== */
.avatar-wrap {
	perspective: 1000px;
	display: flex;
	justify-content: center;
}

.avatar {
	--rx: 0deg;
	--ry: 0deg;
	--px: 50%;
	--py: 50%;
	position: relative;
	width: 260px;
	height: 260px;
	transform-style: preserve-3d;
	transform: rotateX(var(--rx)) rotateY(var(--ry));
	transition: transform 0.15s ease-out;
}

@media (max-width: 860px) {
	.avatar {
		width: 200px;
		height: 200px;
	}
}

.avatar-inner {
	position: relative;
	width: 100%;
	height: 100%;
	border-radius: 24px;
	overflow: hidden;
	background: linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);
	box-shadow: 0 20px 60px rgba(59, 130, 246, 0.35),
		inset 0 1px 0 rgba(255, 255, 255, 0.2);
	transform: translateZ(30px);
	display: flex;
	align-items: center;
	justify-content: center;
}

.avatar-inner img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.avatar-initial {
	font-size: 6rem;
	font-weight: 800;
	color: #fff;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

/* 光斑跟随鼠标 */
.avatar-shine {
	position: absolute;
	inset: 0;
	background: radial-gradient(
		circle at var(--px) var(--py),
		rgba(255, 255, 255, 0.35),
		transparent 40%
	);
	pointer-events: none;
	transition: opacity 0.25s;
}

/* 外圈光环 */
.avatar-ring {
	position: absolute;
	inset: -14px;
	border-radius: 30px;
	border: 1px solid rgba(96, 165, 250, 0.25);
	transform: translateZ(15px);
	pointer-events: none;
}

.avatar-ring::before {
	content: '';
	position: absolute;
	inset: -10px;
	border-radius: 34px;
	border: 1px dashed rgba(167, 139, 250, 0.2);
	animation: rotate 20s linear infinite;
}

@keyframes rotate {
	to {
		transform: rotate(360deg);
	}
}

/* 底部辉光 */
.avatar-glow {
	position: absolute;
	inset: 20px;
	border-radius: 24px;
	background: radial-gradient(
		circle,
		rgba(139, 92, 246, 0.4),
		transparent 70%
	);
	filter: blur(30px);
	z-index: -1;
	transform: translateZ(-10px);
	animation: glow 4s ease-in-out infinite;
}

@keyframes glow {
	0%,
	100% {
		opacity: 0.6;
		transform: translateZ(-10px) scale(1);
	}
	50% {
		opacity: 1;
		transform: translateZ(-10px) scale(1.1);
	}
}

.scroll-hint {
	position: absolute;
	bottom: 2rem;
	left: 50%;
	transform: translateX(-50%);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.7rem;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	letter-spacing: 0.2em;
	color: var(--vp-c-text-3);
}

.scroll-hint .line {
	width: 1px;
	height: 32px;
	background: linear-gradient(to bottom, var(--vp-c-text-3), transparent);
	animation: scrollLine 2s ease-in-out infinite;
}

@keyframes scrollLine {
	0% {
		transform: scaleY(0.3);
		transform-origin: top;
	}
	50% {
		transform: scaleY(1);
		transform-origin: top;
	}
	51% {
		transform: scaleY(1);
		transform-origin: bottom;
	}
	100% {
		transform: scaleY(0.3);
		transform-origin: bottom;
	}
}

/* ===== Section ===== */
.section {
	padding: 6rem 0 2rem;
}

.section-head {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	margin-bottom: 2rem;
	padding-bottom: 1rem;
	border-bottom: 1px solid var(--vp-c-divider);
}

.section-head h2 {
	display: flex;
	align-items: baseline;
	gap: 0.75rem;
	font-size: 1.5rem;
	font-weight: 700;
	margin: 0;
}

.idx {
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 0.85rem;
	font-weight: 500;
	color: #60a5fa;
}

.more {
	font-size: 0.9rem;
	color: var(--vp-c-text-2);
	text-decoration: none;
	transition: color 0.2s;
}
.more:hover {
	color: #60a5fa;
}

/* ===== Posts ===== */
.posts {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
	gap: 1.25rem;
}

.card {
	display: block;
	padding: 1.5rem;
	border: 1px solid var(--vp-c-divider);
	border-radius: 12px;
	background: rgba(255, 255, 255, 0.02);
	backdrop-filter: blur(6px);
	text-decoration: none;
	color: inherit;
	transition: all 0.25s;
	position: relative;
	overflow: hidden;
}

.card::before {
	content: '';
	position: absolute;
	inset: 0;
	background: linear-gradient(
		135deg,
		rgba(96, 165, 250, 0.08),
		transparent 60%
	);
	opacity: 0;
	transition: opacity 0.25s;
}

.card:hover {
	border-color: #60a5fa;
	transform: translateY(-4px);
	box-shadow: 0 12px 40px rgba(96, 165, 250, 0.15);
}
.card:hover::before {
	opacity: 1;
}
.card > * {
	position: relative;
}

.card-meta {
	display: flex;
	gap: 0.75rem;
	font-size: 0.8rem;
	color: var(--vp-c-text-3);
	margin-bottom: 0.75rem;
}

.tag {
	color: #60a5fa;
	font-weight: 500;
}

.card-title {
	font-size: 1.15rem;
	font-weight: 600;
	margin: 0 0 0.5rem;
	color: var(--vp-c-text-1);
}

.card-desc {
	font-size: 0.9rem;
	line-height: 1.6;
	color: var(--vp-c-text-2);
	margin: 0 0 1rem;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.card-cta {
	font-size: 0.85rem;
	color: #60a5fa;
	font-weight: 500;
}

/* ===== Socials(紧凑上下布局) ===== */
.socials {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}

.social {
	display: inline-flex;
	align-items: center;
	gap: 0.45rem;
	padding: 0.5rem 0.9rem;
	border: 1px solid var(--vp-c-divider);
	border-radius: 8px;
	background: rgba(255, 255, 255, 0.02);
	color: var(--vp-c-text-2);
	font-size: 0.82rem;
	text-decoration: none;
	transition: all 0.2s;
}

.social:hover {
	border-color: #60a5fa;
	color: #60a5fa;
	background: var(--vp-c-brand-soft);
	transform: translateY(-1px);
}

.social .icon {
	font-size: 0.95rem;
	line-height: 1;
}

.social .name {
	font-weight: 500;
}

/* ===== Footer ===== */
.footer {
	padding: 4rem 0 3rem;
	text-align: center;
	font-size: 0.85rem;
	color: var(--vp-c-text-3);
}

.dot-sep {
	margin: 0 0.5rem;
}

/* 亮色主题下的毛玻璃调整 */
:global(html:not(.dark)) .btn,
:global(html:not(.dark)) .chip,
:global(html:not(.dark)) .badge,
:global(html:not(.dark)) .card,
:global(html:not(.dark)) .social,
:global(html:not(.dark)) .theme-toggle {
	background: rgba(255, 255, 255, 0.7);
}
</style>
