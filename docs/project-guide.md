# 野火小站 - 项目归档

## 项目概述

- **仓库名**: Lvlin-Qiuyu/wildfire-station
- **描述**: 集成各类实用在线工具的站点
- **协议**: MIT
- **作者**: 绿林 (Lvlin-Qiuyu)
- **部署地址**: https://lvlin-qiuyu.github.io/wildfire-station/
- **部署方式**: GitHub Pages（GitHub Actions 自动部署）

## 技术栈

- **框架**: Nuxt 3（静态生成模式 `nuxt generate`）
- **包管理器**: pnpm 10.10.0（通过 corepack 管理）
- **Node 版本**: 22
- **构建路径**: `.output/public`
- **Base URL**: `/wildfire-station/`

## 项目结构

```
wildfire-station/
├── .github/workflows/deploy.yml   # GitHub Pages 自动部署
├── docs/                          # 项目文档
├── pages/
│   ├── index.vue                  # 首页（工具卡片导航）
│   └── tools/
│       ├── base64.vue             # Base64 编解码工具
│       ├── qrcode.vue             # 二维码生成、解码与Logo嵌入工具
│       ├── ip-lookup.vue          # IP信息查询工具
│       ├── text-diff.vue          # 文本比对工具
│       ├── bookmarks.vue          # 外部收藏页面
│       ├── radix.vue              # 进制转换器
│       ├── css-gradient.vue       # CSS 渐变生成器
│       └── cron.vue               # Cron 表达式可视化
├── layouts/
│   └── default.vue                # 默认布局
├── app.vue                        # 根组件
├── nuxt.config.ts                 # Nuxt 配置
├── package.json
└── pnpm-lock.yaml
```

## 已实现的工具

| 工具 | 路径 | 功能 |
|------|------|------|
| Base64 编解码 | `/tools/base64` | 实时编码/解码、模式切换、一键复制 |
| 二维码工具 | `/tools/qrcode` | 文本生成二维码（可下载）、上传图片解码、Logo嵌入 |
| 文本比对 | `/tools/text-diff` | 对比两段文本差异，类似代码 Diff 效果 |
| 外部收藏 | `/tools/bookmarks` | 好用的工具、资讯站点、Skill 等资源归档 |
| 进制转换器 | `/tools/radix` | 二/八/十/十六进制和 Base64 互转，自动识别前缀 |
| CSS 渐变生成器 | `/tools/css-gradient` | 线性/径向/锥形渐变，实时预览，一键复制代码 |
| Cron 表达式可视化 | `/tools/cron` | 解析表达式、人类可读描述、字段拆解、执行时间预览 |
| 屏幕尺寸对比 | `/tools/screen-size` | 多设备尺寸按真实比例 Canvas 绘制对比，英寸/厘米切换，预设常用设备 |
| 中文文本排版 | `/tools/text-formatter` | 一键修正全角标点、中英文间距、段首缩进，实时预览+复制 |
| 番茄钟计时器 | `/tools/pomodoro` | 专注/休息自动循环，圆形进度条，音效提醒，本地存储统计 |
| 音频剪辑 | `/tools/audio-trimmer` | 上传音频，Canvas 波形可视化，精确裁剪区间，导出 WAV/WebM |
| IP 信息查询 | `/tools/ip-lookup` | 输入IP或自动检测，查看归属地/ISP/时区/经纬度等信息 |

## GitHub Actions 部署

### Workflow 说明

文件: `.github/workflows/deploy.yml`

- **触发条件**: push 到 main 分支 / 手动触发
- **构建流程**: checkout → setup-node → corepack 安装 pnpm → setup-node（启用 pnpm 缓存）→ install → generate → upload artifact → deploy
- **权限**: contents:read, pages:write, id-token:write

### 注意事项

1. **pnpm 安装方式**: 必须先通过 corepack 安装 pnpm，再在 setup-node 中启用 pnpm cache（顺序不能反）
2. **`pnpm/action-setup@v4` 不可用**: 该 action 对 pnpm 10 支持有问题，改用 corepack 方案
3. **GitHub Pages 设置**: Settings → Pages → Source 必须选 "GitHub Actions"

## 开发与维护

### 本地开发

```bash
pnpm install
pnpm dev
```

### 本地构建预览

```bash
pnpm generate
```

### 添加新工具

1. 在 `pages/tools/` 下创建新 `.vue` 文件
2. 在 `pages/index.vue` 首页添加工具卡片
3. 本地测试通过后提交推送，Actions 自动部署

### 本地 Git 推送问题

当前服务器（腾讯云国内）无法直连 GitHub 443 端口，需要通过 GitHub API 推送文件：
- 使用 `PUT /repos/{owner}/{repo}/contents/{path}` API 创建/更新文件
- 需要先 `GET` 获取文件 SHA，再 `PUT` 更新
- Token 认证方式: `Authorization: token <GITHUB_TOKEN>`

### ⚠️ API 推送硬规则（2026-06-01 教训）

**推送文件前必须先拉取远程最新内容到本地！**

1. **本地不存在的文件，禁止直接推送** — 会用空内容覆盖远程文件（bookmarks.vue + text-diff.vue 事故）
2. **正确流程**：`GET` 远程文件内容 → 写入本地 → 修改 → `base64` 编码 → `PUT` 推送（带 SHA）
3. **批量推送前**，先拉取 `pages/` 和 `layouts/` 目录下所有文件到本地
4. **只推送本地实际修改过的文件**，不要盲目推送所有文件
5. **推送脚本必须包含校验**：
   ```bash
   # 禁止推送不存在的文件
   if [ ! -f "$file" ] || [ ! -s "$file" ]; then
     echo "SKIP: $file (not found or empty)"
     continue
   fi
   ```
6. **推送前先拉取远程完整目录同步到本地**，确保本地与远程一致
7. **改代码前先同步，推送只推明确改过的文件**

## 安全提醒

- ⚠️ GitHub Token 不要写入代码、commit message、文档中
- Token 存储在环境变量或安全的配置管理中
- `.gitignore` 已忽略 `.env` 文件
