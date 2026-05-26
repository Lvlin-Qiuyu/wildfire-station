# 🔥 野火小站

一个集成各类实用在线工具的站点，简洁、开源、免费。

**在线访问**: [wildfire-station](https://lvlin-qiuyu.github.io/wildfire-station/)

## 🛠 已有工具

| 工具 | 说明 |
|------|------|
| [Base64 编解码](https://lvlin-qiuyu.github.io/wildfire-station/tools/base64) | 实时 Base64 编码与解码，支持一键复制 |
| [二维码工具](https://lvlin-qiuyu.github.io/wildfire-station/tools/qrcode) | 文本生成二维码（可下载）、上传图片解码 |

## 📦 技术栈

- [Nuxt 3](https://nuxt.com/) — Vue 全栈框架，静态生成模式
- [pnpm](https://pnpm.io/) — 包管理器
- [GitHub Pages](https://pages.github.com/) — 部署托管
- [GitHub Actions](https://github.com/features/actions) — 自动化构建部署

## 🚀 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建静态站点
pnpm generate
```

## 📁 项目结构

```
wildfire-station/
├── pages/
│   ├── index.vue              # 首页（工具卡片导航）
│   └── tools/
│       ├── base64.vue         # Base64 编解码
│       └── qrcode.vue         # 二维码工具
├── layouts/
│   └── default.vue            # 默认布局
├── docs/
│   └── project-guide.md       # 项目归档文档
├── .github/workflows/
│   └── deploy.yml             # GitHub Pages 自动部署
└── nuxt.config.ts
```

## 📝 添加新工具

1. 在 `pages/tools/` 下新建 `.vue` 文件
2. 在 `pages/index.vue` 中添加对应工具卡片
3. 提交到 `main` 分支，GitHub Actions 自动部署

## 📄 License

[MIT](LICENSE)
