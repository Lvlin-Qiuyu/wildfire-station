# 野火小站 · 项目指南（V2）

> 重写于 2026-10-29。V1 版本（150+ 工具）完整备份在 `../../backup/wildfire-station-v1-20261029/`

## 概览

| 项 | 值 |
|---|---|
| 仓库 | `Lvlin-Qiuyu/wildfire-station` |
| 线上 | https://lvlin-qiuyu.github.io/wildfire-station/ |
| 技术栈 | Nuxt 3 (SSG) + Vue 3 + TS，pnpm 10 |
| 部署 | 推 main → GitHub Actions → GitHub Pages |
| baseURL | `/wildfire-station/` |

## 设计语言

- 深色暖调：背景 `#12100e`，面板 `#211d19`，主色（火光橙）`#ff6a2b`
- 全局变量集中在 `assets/css/main.css`
- 字体：正文系统黑体，卡片文案用宋体（`Songti SC / Noto Serif CJK SC`）

## 信息架构

- **左上**：logo（`public/logo.png`，圆形头像框 + `object-fit: contain` 完整展示原图，缺失时降级为「野」字块）+ 站名「野火小站」
- **右上**：工具 / 博客 / 联系我
- **默认页**：工具页（`/`）
- 移动端：右上汉堡菜单

## 页面

| 路径 | 文件 | 状态 |
|---|---|---|
| `/` | `pages/index.vue` | 工具箱格子 + 分类筛选 |
| `/blog` | `pages/blog.vue` | 测试数据 |
| `/contact` | `pages/contact.vue` | 测试数据 |
| `/tools/quote-card` | `pages/tools/quote-card.vue` | 已实现 |

## 工具清单维护

`data/tools.ts` 是唯一数据源：
- `to` 有值 → 可点击进入
- `coming: true` → 显示「规划中」并弹出 toast
- `hot: true` → 显示 NEW 徽标
- 分类见 `categories` 数组（内容创作/文本处理/图片处理/开发者/计算转换/学习效率）

## 语录卡片工具（核心）

**能力**：读数 + 作者 + 来源 → 生成 1242px 宽的小红书摘抄图，可下载 PNG / 复制到剪贴板。

**实现方式**：Canvas 2D 全本地绘制（`lib/quote-card.ts`），不依赖任何后端或截图库。

关键点：
1. **高清导出**：`canvas.width = width * dpr`（dpr 上限 2），再 `setTransform(dpr,0,0,dpr,0,0)`，CSS 宽度 100%，两者分离避免模糊。
2. **断行**：中文逐字断，英文按词（token 正则）断，支持手动换行。
3. **垂直排版**：测量内容高度后在画布内居中；`auto` 比例下最小 3:4。
4. **字体**：首次绘制后等 `document.fonts.ready` 再重绘一次，避免宋体回退闪烁。
5. **主题**：6 套（素纸/牛皮/深夜/樱粉/苔绿/海蓝），定义在 `themes`，含纸面/边框两种版式。

**待优化**：移动端 Safari 剪贴板 `ClipboardItem` 支持差，已降级提示用户下载。

## 常用命令

```bash
pnpm dev       # 本地开发
pnpm generate  # 静态构建 → .output/public
```

## 注意

- 服务器无法直连 GitHub 443，推送走 Contents API 或本地 `git push` 需确认网络
- `node compile cache` 目录已被 gitignore
