# 泰坦能量官网

一个部署在 Vercel 的静态品牌站点，使用原生 `HTML + CSS + JavaScript` 构建。

## 线上地址

- [生产环境](https://titan-energy-site.vercel.app)

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

## 部署

项目已链接到 Vercel，可直接执行：

```bash
vercel --prod
```
