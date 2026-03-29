# 泰坦供能

<p align="center">
  工业级供能方案展示站点，使用原生 <code>HTML + CSS + JavaScript</code> 构建。
</p>

<p align="center">
  面向工业自动化、医疗检测、物联网终端与户外设备场景，强调更稳的能源底座、更清晰的项目推进节奏和更完整的案例表达。
</p>

<p align="center">
  <a href="https://titan-energy-site.vercel.app">生产环境</a>
  ·
  <a href="https://xxwl12122.github.io/titan-energy-site/">GitHub Pages</a>
  ·
  <a href="https://github.com/xxwl12122/titan-energy-site">GitHub 仓库</a>
</p>

<p align="center">
  <img src="assets/images/share-cover.png" alt="泰坦供能项目预览图" width="100%">
</p>

## 项目概览

这个仓库承载的是一个偏品牌展示型的工业站点，而不是传统后台项目。重点不在复杂框架，而在静态页面下把视觉统一、信息节奏、交互反馈和部署链路都收得足够完整。

| 维度 | 内容 |
| --- | --- |
| 品牌定位 | 泰坦供能 / TITAN POWER SYSTEMS |
| 页面目标 | 用更高完成度的单页站点承接产品、参数、技术、案例与表单沟通 |
| 核心风格 | 工业级深色基底、橙蓝对比、高密度信息卡片与分段叙事 |
| 技术方式 | 原生 HTML、CSS、JavaScript，无构建步骤 |
| 部署方式 | Vercel 生产环境 + GitHub Pages 镜像访问 |

## 体验亮点

| 模块 | 说明 |
| --- | --- |
| 首屏表达 | 视频主视觉、指标卡片、行动按钮和品牌语义同时落位 |
| 信息结构 | 产品矩阵、参数概览、技术模块、应用场景、交付流程、案例拆解、联系表单一体化串联 |
| 交互细节 | 站内搜索、滚动导航、暗亮主题、自定义下拉、数字动画、项目摘要预览 |
| 节奏设计 | 中后段通过统一的 Project Flow 阶段条把流程、结果、拆解、沟通收成同一条叙事链 |
| 移动适配 | 窄屏下保留核心信息密度，并重排阶段导航和联系入口 |

## 在线访问

| 入口 | 地址 | 用途 |
| --- | --- | --- |
| Production | [titan-energy-site.vercel.app](https://titan-energy-site.vercel.app) | 主生产站点 |
| GitHub Pages | [xxwl12122.github.io/titan-energy-site](https://xxwl12122.github.io/titan-energy-site/) | 仓库侧镜像访问 |
| Repository | [github.com/xxwl12122/titan-energy-site](https://github.com/xxwl12122/titan-energy-site) | 源码与版本记录 |

## 技术结构

| 文件 | 作用 |
| --- | --- |
| `index.html` | 页面内容结构、SEO 元信息、各模块主文案 |
| `assets/styles/main.css` | 全站视觉系统、响应式规则、动画与状态样式 |
| `assets/scripts/main.js` | 搜索、导航状态、主题切换、表单交互、摘要生成 |
| `assets/images/*` | 场景图、产品图、分享图、品牌相关素材 |
| `404.html` | 独立 404 页面 |
| `vercel.json` | Vercel 部署配置 |
| `.github/workflows/deploy-pages.yml` | GitHub Pages 自动部署工作流 |

<details>
<summary><strong>目录速览</strong></summary>

```text
.
├─ index.html
├─ 404.html
├─ robots.txt
├─ sitemap.xml
├─ vercel.json
├─ assets
│  ├─ images
│  ├─ scripts
│  │  └─ main.js
│  └─ styles
│     └─ main.css
└─ .github
   └─ workflows
      └─ deploy-pages.yml
```

</details>

## 本地预览

这个项目没有构建依赖，直接静态打开即可；如果想更接近真实访问方式，建议跑一个本地静态服务。

```bash
python -m http.server 4173
```

然后访问 [http://127.0.0.1:4173](http://127.0.0.1:4173)。

## 部署流程

### Vercel

项目已经绑定 Vercel，推送到 `main` 后会自动同步，也可以手动执行：

```bash
vercel --prod
```

### GitHub Pages

仓库内置了 Pages 工作流，推送到 `main` 后会自动：

1. 检出仓库
2. 组装静态产物目录
3. 上传 Pages Artifact
4. 发布到 GitHub Pages

## 适合继续优化的方向

- 为 README 增加更多模块截图，分别展示首页、案例区和表单区
- 补一份更明确的品牌规范说明，例如字体、色板、按钮系统和卡片语言
- 增加 Lighthouse、SEO 或部署状态说明，让仓库首页的信息更完整

