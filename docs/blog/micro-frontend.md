---
title: 微前端入门与实战
description: 从背景、核心概念、主流方案到工程实践,系统梳理微前端的一份学习笔记。
outline: [2, 3]
---

# 微前端入门与实战

> 微前端不是银弹。它解决的是**组织问题**先于**技术问题**——当一个前端应用大到单个团队维护不过来,再谈拆分才有意义。

## 一、为什么需要微前端

在小团队 / 小项目里,SPA + 组件化就足够了。微前端真正开始变得有价值的场景通常是:

1. **巨石前端**:一个仓库上百万行,构建 15 分钟起步,任何小改动都可能引发全局回归。
2. **多团队并行**:业务线 A、B、C 分属不同团队,却要共同拼装同一个后台/门户。
3. **技术栈异构**:老系统是 Vue 2,新业务要用 React 18,不希望强行统一。
4. **独立发布节奏**:某个子应用希望每天发版,而主应用一个月才上线一次。

一句话总结:**微前端的目标是让「拆分」和「独立部署」成为可能,而不是让页面变得更快。**

## 二、核心概念

### 2.1 微前端 vs SPA vs iframe

| 维度         | SPA 组件化 | iframe 嵌入 | 微前端 |
| ------------ | ---------- | ----------- | ------ |
| 独立部署     | ❌         | ✅          | ✅     |
| 技术栈自由   | ❌         | ✅          | ✅     |
| 通信便利     | ✅         | ❌ 受限     | ✅     |
| 用户体验一致 | ✅         | ❌ 割裂     | ✅     |
| 实现复杂度   | 低         | 极低        | 中~高  |

### 2.2 主应用与子应用

- **主应用(Container / Shell)**:负责路由分发、全局布局、登录鉴权、下发全局配置。
- **子应用(Micro App)**:独立开发、独立构建、独立部署,通过约定接入主应用。

### 2.3 三个关键问题

任何一个微前端方案都必须回答:

1. **加载**:子应用的 HTML/JS/CSS 从哪里来、什么时候加载?
2. **隔离**:JS 全局变量、CSS 样式、事件监听如何避免互相污染?
3. **通信**:主子应用之间、子应用之间如何传递数据?

## 三、主流方案对比

### 3.1 iframe

最古老也最稳的方案。天然的 JS/CSS 隔离,浏览器级别的沙箱。

**缺点**:

- URL、History 无法共享,前进后退体验割裂。
- 弹窗、下拉菜单会被限制在 iframe 内部,无法覆盖到主应用。
- 每次进入都是一次完整页面加载,性能差。
- 主子通信只能靠 `postMessage`。

适合 **对隔离要求极高、体验要求不高** 的场景,比如接入第三方系统。

### 3.2 qiankun(基于 single-spa)

阿里开源,国内使用最广泛的方案。核心思路:

- 主应用维护一个路由表,匹配到某个前缀时加载对应子应用的 HTML entry。
- 通过劫持 `window` 与样式作用域,实现 JS 沙箱与 CSS 隔离。
- 提供 `props` 机制做主子通信。

**优点**:上手快、生态成熟、文档完善。
**缺点**:沙箱在 Vite / 严格模式下有兼容性坑;子应用需要暴露 `bootstrap/mount/unmount` 生命周期。

### 3.3 Module Federation(Webpack 5 / Rspack / Vite 插件)

Webpack 5 提出的原生能力,让一个应用可以在运行时消费另一个应用暴露的模块。

- 没有「HTML entry」的概念,共享的是**模块**。
- 依赖可以真正共享(`shared`),避免重复打包 React / Vue。
- 天然适合「组件级微前端」而非「页面级微前端」。

**优点**:方案原生、构建友好、共享依赖优雅。
**缺点**:没有内置沙箱,需要自己解决样式隔离和全局污染;版本对齐是运维痛点。

### 3.4 Web Components

用浏览器原生的 Custom Elements + Shadow DOM 做子应用容器。

**优点**:原生标准、天然样式隔离。
**缺点**:JS 隔离仍需自己做;老浏览器兼容性有限;和框架的融合(尤其是 React)不总是丝滑。

### 3.5 选型建议

| 场景                                            | 推荐方案                        |
| ----------------------------------------------- | ------------------------------- |
| 大型后台门户,多团队多技术栈,页面粒度拆分       | qiankun                          |
| 需要跨应用共享组件、共用依赖                    | Module Federation                |
| 只想嵌入一个孤立的老系统                        | iframe                           |
| 组件级复用、SDK 分发                            | Web Components / Module Federation |

## 四、qiankun 最小实战

以下用最小代码展示主应用如何注册两个子应用。

### 4.1 主应用

```js
// main-app/src/main.js
import { registerMicroApps, start } from 'qiankun'

registerMicroApps([
  {
    name: 'vue-sub',
    entry: '//localhost:7101',
    container: '#subapp-viewport',
    activeRule: '/vue',
  },
  {
    name: 'react-sub',
    entry: '//localhost:7102',
    container: '#subapp-viewport',
    activeRule: '/react',
  },
])

start({ prefetch: 'all' })
```

### 4.2 子应用(以 Vue 3 为例)

```js
// vue-sub/src/main.js
import { createApp } from 'vue'
import App from './App.vue'

let app = null

function render(props = {}) {
  const { container } = props
  app = createApp(App)
  app.mount(container ? container.querySelector('#app') : '#app')
}

// 独立运行时
if (!window.__POWERED_BY_QIANKUN__) {
  render()
}

// 生命周期
export async function bootstrap() {}
export async function mount(props) { render(props) }
export async function unmount() { app?.unmount(); app = null }
```

### 4.3 主子通信

```js
// 主应用
import { initGlobalState } from 'qiankun'

const actions = initGlobalState({ user: null })

actions.onGlobalStateChange((state, prev) => {
  console.log('[main] state changed:', state, prev)
})

actions.setGlobalState({ user: { id: 1, name: 'Ada' } })
```

```js
// 子应用 mount 时拿到 props
export async function mount(props) {
  props.onGlobalStateChange((state) => {
    console.log('[sub] got:', state)
  })
  props.setGlobalState({ from: 'sub' })
  render(props)
}
```

## 五、Module Federation 最小实战

### 5.1 生产者(暴露模块)

```js
// remote/webpack.config.js
const { ModuleFederationPlugin } = require('webpack').container

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'remote',
      filename: 'remoteEntry.js',
      exposes: {
        './Button': './src/Button.jsx',
      },
      shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
    }),
  ],
}
```

### 5.2 消费者(远程加载)

```js
// host/webpack.config.js
new ModuleFederationPlugin({
  name: 'host',
  remotes: {
    remote: 'remote@http://localhost:3001/remoteEntry.js',
  },
  shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
})
```

```jsx
// host/src/App.jsx
import React, { Suspense } from 'react'
const RemoteButton = React.lazy(() => import('remote/Button'))

export default function App() {
  return (
    <Suspense fallback={<span>loading...</span>}>
      <RemoteButton />
    </Suspense>
  )
}
```

## 六、工程化与踩坑

### 6.1 样式隔离

- qiankun 的 `experimentalStyleIsolation: true` 会给子应用样式加前缀,基本可用但会牺牲一点性能。
- **不要在子应用里写全局样式**(`html`、`body`、`*`),它们仍会污染主应用。
- 推荐 CSS Modules / Scoped CSS / Shadow DOM。

### 6.2 JS 沙箱

- qiankun 的 `sandbox: { strictStyleIsolation: true, experimentalStyleIsolation: true }` 二选一。
- **Vite 子应用** 需要额外插件(如 `vite-plugin-qiankun`),因为 qiankun 默认基于 Webpack 打包产物设计。
- 子应用**避免**使用 `window.xxx = ...` 挂载全局变量。

### 6.3 路由

- 主子应用共用 `history` 时,子应用的 `base` 必须与 `activeRule` 对齐。
- 子应用**默认不要**用 `hash` 模式,否则和主应用刷新语义冲突。

### 6.4 部署

- 主应用与子应用**必须走同域或正确配置 CORS**,否则 entry 加载失败。
- 子应用的 `publicPath` 需要设置为绝对路径(`//your-cdn/subapp/`),否则子资源 404。
- 建议每个子应用有独立的 CI/CD,主应用只负责部署壳子。

### 6.5 什么时候**不要**用微前端

- 团队只有一两个人。
- 项目只有几十个页面。
- 只是想「按需加载」——那是路由懒加载 + code splitting 的事,不是微前端。

## 七、参考资料

- [Micro Frontends by Martin Fowler](https://martinfowler.com/articles/micro-frontends.html)
- [single-spa 官方文档](https://single-spa.js.org/)
- [qiankun 官方文档](https://qiankun.umijs.org/zh)
- [Webpack Module Federation](https://webpack.js.org/concepts/module-federation/)
- [micro-app(京东开源)](https://micro-zoe.github.io/micro-app/)
- [wujie(腾讯开源,基于 Web Components + iframe)](https://wujie-micro.github.io/doc/)

---

**小结**:先问「我要解决什么问题」,再选方案。方案越花哨,坑通常也越深。微前端能带来的最大红利不是技术上的优雅,而是**让多个团队可以独立地把事做完**。
