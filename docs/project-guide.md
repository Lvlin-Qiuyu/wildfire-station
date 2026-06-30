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
│       ├── unicode-lookup.vue     # Unicode字符查询工具
│       ├── text-analyzer.vue      # 自然语言处理器
│       ├── image-converter.vue    # 图片格式转换器
│       ├── url-encoder.vue        # URL 编解码工具
│       ├── md-table.vue           # Markdown 表格生成器
│       ├── regex-tester.vue       # 正则表达式可视化测试器
│       ├── json-diff.vue          # JSON 对比工具
│       └── css-easing.vue         # CSS 缓动曲线生成器
│       ├── watermark.vue          # 图片水印工具
│       ├── json-schema.vue        # JSON Schema 生成器
│       ├── svg-icons.vue          # SVG 图标生成器
│       ├── css-text-gradient.vue   # CSS 渐变文字动画
│       ├── css-shadow-border-generator.vue  # CSS 阴影边框生成器
│       ├── regex-visualizer.vue    # 正则表达式可视化调试器
│       ├── ieee754.vue             # IEEE 754 浮点数转换器
│       ├── health-check.vue       # 网站健康检查器
│       ├── social-copywriter.vue   # 社交文案助手
│       ├── generator-suite.vue    # 多功能生成器套件
│       ├── color-palette.vue      # 智能色彩搭配
│       ├── time-toolkit.vue       # 智能时间工具箱
│       ├── jwt-debugger.vue       # JWT 调试工具
│       ├── encoding-converter.vue  # 万能编码转换器
│       ├── image-compressor.vue    # 图片压缩
│       ├── json-formatter.vue     # JSON 格式化校验
│       ├── markdown-preview.vue   # Markdown 实时预览
│       ├── novel-typesetter.vue   # 小说排版助手
│       ├── excel-visualizer.vue   # Excel 数据可视化
│       ├── bmi-calculator.vue     # BMI 与健康指标计算器
│       ├── paper-size.vue         # 纸张尺寸对比工具
│       ├── hash-calculator.vue    # 哈希计算器
│       ├── wcag-contrast.vue     # WCAG 对比度检查器
│       ├── image-color-extractor.vue  # 图片取色与主色提取器
│       ├── jsonpath-tester.vue    # JSONPath 查询测试器
│       ├── bill-splitter.vue      # 智能账单分摊助手
│       ├── audio-info-analyzer.vue  # 多格式音频文件信息分析器
│       ├── size-comparator.vue      # 生活物品尺寸对比器
│       ├── multi-platform-size-adaptor.vue  # 多平台素材尺寸快速适配器
    ├── data-format-converter.vue        # 数据格式互转器
    ├── sql-formatter.vue                # SQL 格式化与美化工具
    ├── json-to-typescript.vue           # JSON/YAML转TypeScript类型生成器
    └── http-status-codes.vue            # HTTP 状态码速查手册
    ├── color-blindness-simulator.vue    # 色盲模拟与无障碍检测器
    ├── classic-cipher.vue               # 经典密码编解码器
    ├── lorem-generator.vue              # Lorem Ipsum 智能文本生成器
    ├── fake-data-generator.vue          # 随机数据表格生成器
    ├── image-stitcher.vue               # 图片拼接工具
    ├── unit-converter.vue               # 万能单位换算器
    ├── spaced-repetition.vue            # 间隔重复复习计划器
    ├── utf8-byte-viewer.vue              # UTF-8 字节序列可视化查看器
    ├── world-clock.vue                   # 世界时钟与时区对比器
    ├── flexbox-generator.vue            # CSS Flexbox 可视化生成器
    ├── matrix-calculator.vue             # 矩阵计算器
    ├── text-dedup-sorter.vue             # 文本去重与排序工具
    └── password-strength-checker.vue      # 密码强度检测器
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
| CSS 阴影边框生成器 | `/tools/css-shadow-border-generator` | 阴影XY/模糊/扩展/颜色/透明度、边框样式/宽度/颜色、圆角、背景色、6种预设、实时预览、一键复制CSS |
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
| BMI 与健康指标计算器 | `/tools/bmi-calculator` | 身高/体重/年龄/性别输入，BMI值+分类、理想体重范围、BMR基础代谢率（Mifflin-St Jeor公式）、5档TDEE每日热量，Canvas仪表盘可视化，滑块交互 |
| 纸张尺寸对比工具 | `/tools/paper-size` | ISO 216标准A/B/C系列（A0-A10/B0-B10/C0-C10），Canvas按真实比例绘制对比、缩放查看、可调DPI像素尺寸、mm/inch切换、完整参考表 |
| 哈希计算器 | `/tools/hash-calculator` | 支持MD5（纯JS实现）/SHA-1/SHA-256/SHA-512（Web Crypto API），文本模式实时计算、文件模式拖拽上传，算法全选/反选，一键复制 |
| WCAG 对比度检查器 | `/tools/wcag-contrast` | 前景/背景色选择器（color picker + HEX输入），W3C相对亮度算法实时计算对比度比值，WCAG 2.1 AA/AAA四级合规性检查（正常文本/大文本），实际颜色文本预览，一键交换前景/背景色 |
| 图片取色与主色提取器 | `/tools/image-color-extractor` | 拖拽/点击上传图片，Canvas像素读取+中位切割量化算法自动提取6个主色调生成调色板，点击图片任意位置取色显示HEX/RGB/HSL，图片尺寸/文件大小信息，调色板一键复制 |
| JSONPath 查询测试器 | `/tools/jsonpath-tester` | JSON数据输入区+JSONPath表达式输入，jsonpath-plus CDN库实时查询，结果语法高亮（字符串/数字/布尔值着色），可折叠语法参考面板，5个预设示例（书店/用户/嵌套/递归/切片），JSON格式化按钮 |
| Unicode字符查询工具 | `/tools/unicode-lookup` | 字符/代码点输入，查询Unicode信息、UTF-16/UTF-8编码、字符名称、类别、双向属性，支持快速搜索和相似字符推荐 |
| 自然语言处理器 | `/tools/text-analyzer` | 文本分析工具：词频统计、关键词提取、情感分析、可读性评分、文档类型检测、中英文分词、详细统计（字符/词数/句子/段落数） |
| 智能账单分摊助手 | `/tools/bill-splitter` | 动态人员管理+多项目账单+勾选消费人员自动均摊+小费按消费占比分配+预设小费比例+分摊汇总+明细折叠表格+复制结果文本发群聊+一键重置 |
| 多格式音频信息分析器 | `/tools/audio-info-analyzer` | 上传15+种格式音频，Web Audio API解码获取比特率/时长/声道/采样率/格式详情，频谱柱状图+波形预览Canvas可视化，音质评估，完整参数表+复制纯文本/JSON |
| 生活物品尺寸对比器 | `/tools/size-comparator` | 6大分类预设物品（手机/电脑/电视/纸张/家具/显示器），自定义尺寸输入，Canvas按真实比例绘制对比+比例尺，自动分析面积排名/对角线范围/宽高比/容纳关系 |
| 多平台素材尺寸快速适配器 | `/tools/multi-platform-size-adaptor` | 上传图片一键生成21种主流社交平台适配尺寸（微信/微博/抖音/小红书/B站/X/Instagram/Facebook/LinkedIn/YouTube），三种适配模式（裁剪填充/完整显示/拉伸），Canvas裁剪+缩放算法纯前端实现，批量下载+复制到剪贴板 |
| 数据格式互转器 | `/tools/data-format-converter` | CSV/JSON/YAML/XML/Markdown表格互相转换，粘贴即转，支持文件拖拽上传和下载，双栏布局，自动格式识别 |
| SQL 格式化与美化工具 | `/tools/sql-formatter` | 粘贴SQL自动格式化，关键字语法高亮，方言选择（MySQL/PostgreSQL/SQLite），缩进风格（2空格/4空格/Tab）、关键字大小写，一键复制 |
| JSON/YAML转TypeScript类型生成器 | `/tools/json-to-typescript` | 粘贴JSON或YAML自动生成TypeScript interface/type定义，递归遍历生成嵌套类型，数组→T[]、null→可选字段，根类型命名可配置 |
| HTTP 状态码速查手册 | `/tools/http-status-codes` | 可视化展示60+个HTTP状态码（1xx-5xx），卡片布局，搜索过滤、分类切换，点击查看详细说明/常见场景/使用建议 |
| 色盲模拟与无障碍检测器 | `/tools/color-blindness-simulator` | 基于Viénot算法模拟8种色盲类型（红色盲/绿色盲/蓝色盲/红色弱/绿色弱/蓝色弱/全色盲/三色觉正常），图片上传Canvas像素级变换，HEX颜色输入，WCAG AA/AAA对比度检测，批量颜色可辨识度检测 |
| 经典密码编解码器 | `/tools/classic-cipher` | 凯撒密码（可调偏移量+暴力破解）/摩尔斯电码（国际标准码表+自定义分隔符）/维吉尼亚密码（密钥加密）/栅栏密码（可调栏数）/ROT13，Tab切换，加密解密双向 |
| Lorem Ipsum 智能文本生成器 | `/tools/lorem-generator` | 英文Lorem Ipsum标准词库+中文随机段落，段落数/句子数/词数范围可调，可选Lorem开头，纯文本和HTML格式复制，预览模式 |
| 随机数据表格生成器 | `/tools/fake-data-generator` | 11种字段类型（中文姓名/手机号/邮箱/地址/公司名/日期/金额/IP地址/URL/身份证号/职业），自定义字段增删，1-100行数据生成，表格展示，导出CSV和JSON |
| 图片拼接工具 | `/tools/image-stitcher` | 拖拽上传多图、4种布局（纵向/横向/2列/3列）、间距/圆角/背景色/质量可调、拖拽排序图片顺序、实时Canvas预览、一键导出PNG/JPG |
| 万能单位换算器 | `/tools/unit-converter` | 7大分类（长度/重量/温度/面积/体积/速度/数据存储）100+单位、实时精确换算、快捷参考列表、温度特殊公式处理、中文显示+英文符号 |
| 间隔重复复习计划器 | `/tools/spaced-repetition` | 3种间隔算法（艾宾浩斯/SuperMemo 2/Cepeda优化）、Canvas遗忘曲线图+复习节点标记、多科目管理、localStorage存储、今日待复习提醒 |
| UTF-8 字节序列可视化查看器 | `/tools/utf8-byte-viewer` | 粘贴任意文本逐字符展示Unicode码点/十进制/UTF-8十六进制字节序列/UTF-16编码/HTML实体，详细表格+紧凑视图切换，统计字符数/字节数，一键复制单行或全部JSON |
| 世界时钟与时区对比器 | `/tools/world-clock` | 30+主要城市按洲分组，可添加/删除最多8个城市，每秒更新时间+日期+时差，24小时时间轴可视化，工作时间9-18点重叠区域高亮，最佳会议时间推荐，Intl.DateTimeFormat API |
| CSS Flexbox 可视化生成器 | `/tools/flexbox-generator` | Flex容器属性调节面板（direction/justify/align-items/wrap/content/gap），子项属性调节（grow/shrink/basis/order），8种预设布局模板（导航栏/侧边栏/卡片网格/居中/等分/底部固定/Holy Grail/输入按钮），2-8个子项可调，一键复制CSS和HTML |
| 矩阵计算器 | `/tools/matrix-calculator` | 2×2/3×3/4×4维度切换，双矩阵表格输入（Tab键切换单元格），加法/减法/乘法/行列式（Laplace展开）/转置/逆矩阵（高斯-约旦消元法），行列式大字号展示，奇异矩阵提示，一键复制结果 |
| 文本去重与排序 | `/tools/text-dedup-sorter` | 左右双栏实时处理，去重/过滤空行/去首尾空格/忽略大小写开关，升序/降序/随机打乱排序，统计面板（原始行数/处理后行数/删除行数/重复行数），一键复制结果 |
| 密码强度检测器 | `/tools/password-strength-checker` | 密码显示/隐藏，5级强度条渐变色可视化，评分详情（长度/大小写/数字/特殊字符/连续字符/重复字符/常见弱密码top50），暴力破解时间估算（GPU集群100亿次/秒），改进建议列表，纯JS实现 |

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
