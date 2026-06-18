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
│       ├── cron.vue               # Cron 表达式可视化
│       ├── screen-size.vue        # 屏幕尺寸对比
│       ├── text-formatter.vue     # 中文文本排版
│       ├── pomodoro.vue           # 番茄钟计时器
│       ├── audio-trimmer.vue      # 音频剪辑
│       ├── ip-lookup.vue          # IP 信息查询
│       ├── chart-generator.vue    # 在线图表生成器
│       ├── flashcard.vue          # 抽认卡学习器
       ├── image-converter.vue    # 图片格式转换器
       ├── url-encoder.vue        # URL 编解码工具
       ├── md-table.vue           # Markdown 表格生成器
       ├── regex-tester.vue       # 正则表达式可视化测试器
       ├── json-diff.vue          # JSON 对比工具
       └── css-easing.vue         # CSS 缓动曲线生成器
       ├── watermark.vue          # 图片水印工具
       ├── json-schema.vue        # JSON Schema 生成器
       ├── svg-icons.vue          # SVG 图标生成器
       ├── css-text-gradient.vue   # CSS 渐变文字动画
       ├── regex-visualizer.vue    # 正则表达式可视化调试器
       ├── ieee754.vue             # IEEE 754 浮点数转换器
       ├── health-check.vue       # 网站健康检查器
       ├── social-copywriter.vue   # 社交文案助手
       └── generator-suite.vue    # 多功能生成器套件
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
| 图表生成器 | `/tools/chart-generator` | 支持柱状图/折线图/饼图/环形图，CSV数据输入，5种配色方案，实时预览，导出PNG |
| 抽认卡学习器 | `/tools/flashcard` | 多卡组管理，卡片翻转动画，Leitner间隔重复算法，localStorage存储，导入/导出JSON |
| 图片格式转换 | `/tools/image-converter` | 拖拽上传、批量处理、PNG/JPG/WebP互转、质量调节、背景色填充、前后对比预览 |
| URL 编解码 | `/tools/url-encoder` | 实时编码/解码、完整/安全编码模式、常用场景模板、一键复制 |
| Markdown 表格生成器 | `/tools/md-table` | 可视化表格编辑、行列增删、列对齐设置、实时预览、渲染效果预览、预设模板 |
| 正则表达式测试器 | `/tools/regex-tester` | 常用模板、修饰符切换、实时高亮匹配、分组信息、错误提示 |
| JSON 对比工具 | `/tools/json-diff` | 双面板输入、自动格式化、类型高亮、结构化diff路径、数组顺序忽略、统计信息 |
| CSS 缓动曲线生成器 | `/tools/css-easing` | 贝塞尔曲线可视化、拖拽控制点、14种预设、动画预览、一键复制CSS |
| 图片水印工具 | `/tools/watermark` | 拖拽/点击上传、文字水印（内容/大小/颜色/透明度/角度/9宫格位置）、平铺模式、导出PNG/JPG |
| JSON Schema 生成器 | `/tools/json-schema` | 粘贴JSON自动推断类型生成Draft-07 Schema、递归分析、格式化输出、一键复制 |
| SVG 图标生成器 | `/tools/svg-icons` | 30+预设图标、可调颜色/大小/描边宽度/填充、实时预览、SVG代码输出、一键复制 |
| CSS 渐变文字动画 | `/tools/css-text-gradient` | 输入文字、多色渐变、流动/闪烁/脉冲动画、方向速度可调、实时预览、一键复制CSS |
| 正则表达式可视化调试器 | `/tools/regex-visualizer` | 正则结构分块着色解析（分组/量词/字符类/锚点/转义）、匹配高亮、捕获组显示 |
| IEEE 754 浮点数转换器 | `/tools/ieee754` | 输入浮点数显示32/64位表示、色块显示符号/指数/尾数、数值分解、支持二进制位串反向输入 |
| 网站健康检查器 | `/tools/health-check` | 输入URL检测HTTP状态码/响应时间/Content-Type、CORS限制提示、卡片式结果展示 |
| 社交文案助手 | `/tools/social-copywriter` | 实时字数/词数/Emoji统计、Emoji分析、关键词Hashtag建议、微博/微信/Twitter/X等平台限制检查 |
| 多功能生成器套件 | `/tools/generator-suite` | Tab切换：密码生成器（可配置字符集/批量）、UUID v4生成器（批量）、中文假文生成（可选字数） |
| 智能色彩搭配 | `/tools/color-palette` | 输入主色自动生成互补色/类比色/三色/分裂互补配色，色块预览+hex值，一键复制CSS变量代码，HSL算法 |
| 智能时间工具箱 | `/tools/time-toolkit` | Tab切换：时间差计算、倒计时器、时区转换、时间戳转换，实时更新 |
| JWT 调试工具 | `/tools/jwt-debugger` | 粘贴JWT自动分割三段，Header/Payload base64解码JSON格式化+语法高亮，过期时间检查 |
| 万能编码转换器 | `/tools/encoding-converter` | 输入文本实时显示Hex/Octal/Binary/Unicode/HTML实体/CSS转义/URL/Base64/UTF-8/Punycode |
| 纯前端图片压缩 | `/tools/image-compressor` | 拖拽上传、质量滑块、格式选择JPG/PNG/WebP、压缩前后对比预览+文件大小+压缩率、Canvas API实现 |
| JSON 格式化与校验 | `/tools/json-formatter` | 自动格式化+语法高亮、错误位置标记、缩进选择、树形折叠展示、压缩单行 |
| Markdown 实时预览 | `/tools/markdown-preview` | 左栏输入右栏实时渲染，自实现解析器（标题/加粗/斜体/代码块/列表/链接/表格等），代码高亮 |
| 中文小说排版助手 | `/tools/novel-typesetter` | 智能分段、中英文标点修正、繁简转换、首行缩进，可调每行字数/段落间距/字体大小 |
| Excel 数据可视化 | `/tools/excel-visualizer` | CSV/Excel文件拖拽上传，自动识别列类型，柱状图/折线图/饼图Canvas绘制，鼠标悬停数据，导出PNG |

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
