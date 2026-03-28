# 泰坦能量官网

一个部署在 Vercel 的静态品牌站点，使用原生 `HTML + CSS + JavaScript` 构建。

## 直接进入网页

如果你是从 GitHub 仓库页进入，这里就可以直接打开站点：

- [生产环境](https://titan-energy-site.vercel.app)
- [GitHub Pages](https://xxwl12122.github.io/titan-energy-site/)
- [GitHub 仓库](https://github.com/xxwl12122/titan-energy-site)

## 部署说明

- `Vercel` 作为主生产环境
- `GitHub Pages` 作为 GitHub 侧直接访问入口

推送到 `main` 后：

- Vercel 会继续走现有生产部署
- GitHub Pages 会通过 Actions 自动同步静态页面

## 目录结构

```text
.
├─ index.html
├─ assets
│  ├─ scripts
│  │  └─ main.js
│  └─ styles
│     └─ main.css
├─ vercel.json
├─ .vercelignore
└─ README.md
```

## 核心文件

- `index.html`: 页面结构与内容入口
- `assets/styles/main.css`: 全站样式、动画和响应式规则
- `assets/scripts/main.js`: 搜索、导航、主题切换、滚动和首屏交互
- `vercel.json`: Vercel 部署配置

## 本地预览

直接用浏览器打开 `index.html` 即可，或使用任意静态文件服务。

## 手动部署

项目已链接到 Vercel，可直接执行：

```bash
vercel --prod
```
