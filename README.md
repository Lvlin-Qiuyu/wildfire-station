# 野火小站

> 星星之火，可以燎原。

一个纯前端在线工具箱，全部功能在浏览器本地运行，数据不上传。

## 技术栈

- Nuxt 3（SSG 静态生成）+ Vue 3 + TypeScript
- 无 UI 框架，手写 CSS 变量主题
- 部署：GitHub Pages + GitHub Actions

## 目录结构

```
├── assets/css/main.css      # 全局样式变量与基础样式
├── layouts/default.vue      # 全站布局：左上 logo+站名，右上菜单
├── pages/
│   ├── index.vue            # 工具页（默认首页）：工具箱格子 + 分类筛选
│   ├── blog.vue             # 博客页（当前为测试数据）
│   ├── contact.vue          # 联系我（当前为测试数据）
│   └── tools/quote-card.vue # 语录卡片工具
├── data/tools.ts            # 工具清单（名称/分类/描述/是否上线）
├── lib/quote-card.ts        # Canvas 绘制语录卡片核心逻辑
└── public/                  # 静态资源（logo.png / favicon.svg）
```

## 开发

```bash
pnpm install
pnpm dev          # http://localhost:3000/wildfire-station/
pnpm generate     # 产物在 .output/public
```

## 添加新工具

1. 在 `pages/tools/` 新建 `xxx.vue`
2. 在 `data/tools.ts` 里把对应条目的 `to` 指到 `/tools/xxx`，并去掉 `coming: true`
3. 在 `pages/index.vue` 无需改动（自动从 `data/tools.ts` 渲染）

## Logo

把 logo 图片放到 `public/logo.png` 即会自动生效（圆形框内完整展示，不裁剪）；没有时会显示「野」字占位。

## 部署

推送到 `main` 分支，GitHub Actions 自动构建并发布到 GitHub Pages。
线上地址：https://lvlin-qiuyu.github.io/wildfire-station/
