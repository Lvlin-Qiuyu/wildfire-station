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
│       ├── chinese-text-beautifier.vue  # 中文文本美化器
│       ├── css-style-generator.vue      # CSS样式生成器
│       ├── lightweight-text-converter.vue # 轻量级文本格式转换器
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
    ├── smart-size-advisor.vue           # 国际服装尺码智能对照器
    ├── spaced-repetition.vue            # 间隔重复复习计划器
    ├── utf8-byte-viewer.vue              # UTF-8 字节序列可视化查看器
    ├── world-clock.vue                   # 世界时钟与时区对比器
    ├── flexbox-generator.vue            # CSS Flexbox 可视化生成器
    ├── image-cropper.vue                 # 图片裁剪工具
    ├── css-grid-generator.vue            # CSS Grid 可视化生成器
    ├── matrix-calculator.vue             # 矩阵计算器
    ├── text-dedup-sorter.vue             # 文本去重与排序工具
    ├── math-calculator.vue               # 数学表达式计算器
    ├── password-strength-checker.vue      # 密码强度检测器
    ├── ua-parser.vue                      # UA 解析器
    ├── svg-ring-chart.vue                 # SVG 环形图生成器
    ├── meta-tag-generator.vue             # Meta 标签生成器
    ├── random-picker.vue                 # 随机抽签分组器
    ├── random-probability-simulator.vue  # 随机数与概率模拟器
    ├── exif-viewer.vue                    # 图片 EXIF 元数据查看器
    ├── ascii-art-generator.vue            # ASCII 文字艺术生成器
    ├── word-cloud.vue                     # 词云生成器
    ├── ring-size.vue                      # 戒指尺寸对照器
    ├── quiz-maker.vue                     # 在线测验生成器
    ├── totp-generator.vue                 # TOTP 验证码生成器
    ├── emoji-copywriter.vue               # Emoji 文案增强器
    ├── text-replacer.vue                  # 多规则文本批量替换器
    ├── markdown-toc.vue                   # Markdown 大纲目录生成器
    ├── base58-encoder.vue                 # Base58/Base62 编解码器
    ├── color-blender.vue                  # 颜色混合与插值器
    ├── percentage-calculator.vue          # 百分比全能计算器
    ├── url-parser.vue                     # URL 解析与构建器
    ├── function-plotter.vue              # 函数图像绘制器
    ├── cidr-calculator.vue               # CIDR 子网计算器
    ├── multi-text-diff.vue              # 多文件文本批量对比器
    ├── image-filters.vue                # 图片滤镜与调色工具
    ├── image-pixelate.vue               # 图片马赛克/像素化工具
    ├── audio-visualizer.vue            # 音频波形可视化工具
    ├── audio-bpm-detector.vue          # 音频BPM检测器
    ├── statistics-calculator.vue       # 在线描述性统计计算器
    ├── scatter-plot-regression.vue     # 散点图与回归分析工具
    ├── loan-amortization.vue           # 还款计划表生成器
    ├── code-card-generator.vue         # 代码片段格式化与分享工具
    ├── html-playground.vue             # HTML实时预览沙盒
    ├── complex-calculator.vue           # 复数运算计算器
    ├── css-animation-generator.vue      # CSS关键帧动画生成器
    ├── responsive-preview.vue          # 响应式断点测试器
    ├── text-template.vue               # 文本变量替换与模板生成器
    ├── typing-test.vue                 # 打字速度测试器
    ├── hmac-generator.vue             # HMAC签名生成器
    ├── header-builder.vue              # HTTP请求头构造器
    └── zh-en-text-fixer.vue            # 中英文混排优化器
    ├── color-harmony-analyzer.vue      # 色彩和谐度分析器
    ├── feynman-notes.vue               # 费曼学习法笔记
    ├── knowledge-graph.vue             # 知识图谱绘制器
    └── banned-word-checker.vue         # 违禁词检测器
    ├── holiday-calendar.vue            # 节假日日历查看器
    ├── age-calculator.vue              # 年龄精确计算器
    └── toml-converter.vue              # TOML/INI配置转换器
    ├── geometry-calculator.vue         # 几何计算器
    ├── permutation-combination.vue     # 排列组合计算器
    ├── css-theme-generator.vue         # CSS变量主题生成器
    └── work-hours-calculator.vue       # 工时与加班计算器
    ├── timeline-generator.vue          # 时间线可视化生成器
    ├── text-art-styles.vue            # 文字艺术/特殊文字生成器
    └── xiaohongshu-editor.vue          # 小红书笔记排版助手
    ├── metronome.vue                    # 在线节拍训练器
    └── encrypted-link.vue               # 加密文本分享链接生成器
    ├── text-noise-cleaner.vue           # 文本噪声清理器
    ├── mind-map-generator.vue           # 思维导图文本生成器
    └── wechat-formatter.vue             # 公众号文章排版器
    ├── pivot-table.vue                   # 数据透视表生成器
    ├── base-x-encoder.vue               # Base32/Base85/Base91 编解码器
    └── sleep-cycle-calculator.vue        # 睡眠周期计算器
    ├── compound-interest-calculator.vue   # 复利计算器与投资回报分析器
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
| 国际服装尺码智能对照器 | `/tools/smart-size-advisor` | 输入身高体重智能推荐各国标准尺码（中国/美国/欧盟/英国/日本），支持上衣/裤子/鞋子/袜子多品类，男女童全覆盖，BMI体型指标+三围估算，对照表高亮推荐行，一键复制结果 |
| 间隔重复复习计划器 | `/tools/spaced-repetition` | 3种间隔算法（艾宾浩斯/SuperMemo 2/Cepeda优化）、Canvas遗忘曲线图+复习节点标记、多科目管理、localStorage存储、今日待复习提醒 |
| UTF-8 字节序列可视化查看器 | `/tools/utf8-byte-viewer` | 粘贴任意文本逐字符展示Unicode码点/十进制/UTF-8十六进制字节序列/UTF-16编码/HTML实体，详细表格+紧凑视图切换，统计字符数/字节数，一键复制单行或全部JSON |
| 世界时钟与时区对比器 | `/tools/world-clock` | 30+主要城市按洲分组，可添加/删除最多8个城市，每秒更新时间+日期+时差，24小时时间轴可视化，工作时间9-18点重叠区域高亮，最佳会议时间推荐，Intl.DateTimeFormat API |
| CSS Flexbox 可视化生成器 | `/tools/flexbox-generator` | Flex容器属性调节面板（direction/justify/align-items/wrap/content/gap），子项属性调节（grow/shrink/basis/order），8种预设布局模板（导航栏/侧边栏/卡片网格/居中/等分/底部固定/Holy Grail/输入按钮），2-8个子项可调，一键复制CSS和HTML |
| 图片裁剪工具 | `/tools/image-cropper` | 上传图片Canvas绘制，拖拽裁剪框+8方向手柄，7种预设比例（自由/1:1/4:3/3:2/16:9/2:3/9:16），三等分参考线，实时预览，PNG/JPG/WebP导出，质量可调，移动端触摸支持 |
| CSS Grid 可视化生成器 | `/tools/css-grid-generator` | 行列数1-6可调，gap/justify-items/align-items，子项grid-column/grid-row跨度调节，grid-area命名+自动生成template-areas，6种预设（三栏/圣杯/仪表盘/相册/卡片/杂志），一键复制CSS和HTML |
| 矩阵计算器 | `/tools/matrix-calculator` | 2×2/3×3/4×4维度切换，双矩阵表格输入（Tab键切换单元格），加法/减法/乘法/行列式（Laplace展开）/转置/逆矩阵（高斯-约旦消元法），行列式大字号展示，奇异矩阵提示，一键复制结果 |
| 文本去重与排序 | `/tools/text-dedup-sorter` | 左右双栏实时处理，去重/过滤空行/去首尾空格/忽略大小写开关，升序/降序/随机打乱排序，统计面板（原始行数/处理后行数/删除行数/重复行数），一键复制结果 |
| 数学表达式计算器 | `/tools/math-calculator` | 基础/科学双模式，12种科学函数（sin/cos/tan/ln/log/√/abs/!/exp/asin/acos/atan），常量（π/e/φ），角度写法（90°），隐式乘法，阶乘，键盘快捷键，历史记录localStorage持久化，表达式参考文档 |
| 密码强度检测器 | `/tools/password-strength-checker` | 密码显示/隐藏，5级强度条渐变色可视化，评分详情（长度/大小写/数字/特殊字符/连续字符/重复字符/常见弱密码top50），暴力破解时间估算（GPU集群100亿次/秒），改进建议列表，纯JS实现 |
| UA 解析器 | `/tools/ua-parser` | 自动检测当前浏览器UA或手动输入，纯JS正则解析浏览器/操作系统/设备类型/渲染引擎/平台信息，8种常见UA模板一键填入，UA字符串结构着色标注，复制解析结果JSON |
| SVG 环形图生成器 | `/tools/svg-ring-chart` | 三种模式（单环进度条/多环饼图/仪表盘），颜色/渐变/环宽度/大小/动画时长/起始角度可调，多段数据增删改，实时SVG预览，SVG代码输出一键复制，纯JS计算零依赖 |
| Meta 标签生成器 | `/tools/meta-tag-generator` | 表单输入标题/描述/关键词/URL/图片等，实时预览微信/Facebook/Twitter/X/Discord 分享卡片样式，字符计数+最佳长度提示，生成完整Meta+OG+Twitter Card代码一键复制 |
| 随机抽签分组器 | `/tools/random-picker` | Fisher-Yates洗牌+分组算法，三种模式（随机抽签/公平分组/加权随机），CSS转盘动画，自定义权重与组名，操作历史记录，纯前端无依赖 |
| 随机数与概率模拟器 | `/tools/random-probability-simulator` | 四大模式（随机数生成/概率分布模拟/掷骰子/轮盘赌），Box-Muller正态分布+泊松分布+指数分布算法，Canvas直方图可视化，骰子动画+轮盘旋转动画，统计信息，一键复制/下载 |
| 图片 EXIF 元数据查看器 | `/tools/exif-viewer` | 拖拽/点击上传图片，纯前端 ArrayBuffer 解析 JPEG EXIF APP1 段，IFD 标签提取（相机/镜头/光圈/快门/ISO/GPS），Canvas 缩略图预览，GPS 坐标 Google Maps 链接，复制 JSON/纯文本，原始字节十六进制/文本预览 |
| ASCII 文字艺术生成器 | `/tools/ascii-art-generator` | 6 种 ASCII 字体模板（Banner/Shadow/Mini/Block/Slant/Big），5 种字符集（标准/方块/点阵/简洁/星号），自定义输出宽度，支持 A-Z 和 0-9，实时预览，一键复制/下载 TXT |
| 词云生成器 | `/tools/word-cloud` | 输入文本中英文自动分词统计词频（中文单字/双字/三字组合+英文空格分词），螺旋线放置算法Canvas绘制，5种配色方案/4种背景色/最大词数可调，词频柱状图，导出PNG |
| 戒指尺寸对照器 | `/tools/ring-size` | 中国5-28码完整对照表（对应美国/英国/日本/欧盟），纸条量周长法和现有戒指量内径法两种指引，实时联动转换结果卡片，SVG戒圈可视化对比（前后相邻尺寸虚线参考），可搜索过滤对照表 |
| 在线测验生成器 | `/tools/quiz-maker` | 粘贴JSON格式题目生成交互式测验，支持单选/多选/判断题3种题型，点击选项答题，提交即时批改（✅❌标记每题），正确率环形图+进度条+逐题详情，localStorage存储进度，内置示例数据 |
| TOTP 验证码生成器 | `/tools/totp-generator` | 纯JS实现RFC 6238（Web Crypto HMAC），输入Base32密钥实时生成6/8位一次性验证码，SVG圆环30秒倒计时动画自动刷新，支持SHA-1/256/512算法，一键复制 |
| Emoji 文案增强器 | `/tools/emoji-copywriter` | 输入中文文案自动在关键词位置插入匹配Emoji，500+中文关键词→Emoji映射表，3种风格（自然30%/活泼60%/简约20%插入概率），6种场景模板，防抖实时增强，一键复制结果 |
| 多规则文本批量替换器 | `/tools/text-replacer` | 添加多条查找替换规则（普通文本+正则表达式），支持大小写敏感/全词匹配，一键全部应用，逐字符差异高亮对比显示，复制结果 |
| Markdown 大纲目录生成器 | `/tools/markdown-toc` | 粘贴Markdown文档自动解析 #~###### 各级标题，生成嵌套目录TOC，4种格式（GitHub锚点/Notion/Hexo/纯文本），4种缩进方式，最大层级控制，复制+下载 |
| Base58/Base62 编解码器 | `/tools/base58-encoder` | 纯JS BigInt实现Base58/Base58Check/Base62编解码，纯JS SHA-256用于校验和，比特币P2PKH/P2SH地址验证，三种模式切换 |
| 颜色混合与插值器 | `/tools/color-blender` | RGB/HSL/HSV三种色彩空间线性插值，2-20步可调，Canvas色板预览，点击复制HEX，一键复制CSS渐变代码 |
| 百分比全能计算器 | `/tools/percentage-calculator` | 4种模式：X是Y的百分之几、X的百分之N是多少、百分比增减、含税/不含税互算，实时计算+公式展示 |
| URL 解析与构建器 | `/tools/url-parser` | 自动拆解URL结构（协议/域名/端口/路径/参数/锚点），各部分可编辑重建，查询参数增删改，JSON导出 |
| 函数图像绘制器 | `/tools/function-plotter` | 输入数学表达式Canvas实时绘制函数曲线，支持多函数叠加、缩放平移、导数可视化、坐标网格、鼠标拖拽 |
| CIDR 子网计算器 | `/tools/cidr-calculator` | 输入IP地址和CIDR前缀，计算网络/广播/掩码/通配符/可用主机数，Canvas可视化地址空间，子网拆分，常用前缀参考表 |
| 多文件文本批量对比器 | `/tools/multi-text-diff` | 支持3+版本文本并行对比，高亮各版本独有行/公共行/差异行，统计信息面板，一键复制结果/HTML，自动防抖对比 |
| 图片滤镜与调色工具 | `/tools/image-filters` | 10种预设滤镜（原图/灰度/怀旧/反色/暖色/冷色/高对比/柔焦/戏剧/褪色），6参数手动调节（亮度/对比度/饱和度/色温/模糊/锐化），像素级操作+卷积核锐化，原图对比，导出PNG/JPG |
| 图片马赛克/像素化工具 | `/tools/image-pixelate` | 全局马赛克（块大小1-50px可调）+区域涂抹模式（笔刷大小/粒度可调），Canvas像素采样取平均色填充，鼠标/触摸涂抹，导出PNG/JPG |
| 音频波形可视化工具 | `/tools/audio-visualizer` | Web Audio API离线解码，Canvas波形图（时域）+频谱图（频域），播放/暂停/停止/进度跳转，音量控制，0.5x-2x倍速，鼠标悬浮显示时间+振幅 |
| 音频BPM检测器 | `/tools/audio-bpm-detector` | Web Audio API离线解码+能量包络自相关算法，60-200 BPM范围检测，置信度评估，波形图节拍标注，节奏分类标签，手动TAP敲击校准（空格键），复制结果 |
| 描述性统计计算器 | `/tools/statistics-calculator` | 输入数据自动计算均值/中位数/众数/标准差/方差/极差/四分位数/偏度/峰度/几何平均，Canvas频率分布直方图+箱线图可视化，支持CSV粘贴，复制纯文本/JSON |
| 散点图与回归分析工具 | `/tools/scatter-plot-regression` | X/Y两组数据输入绘制散点图Canvas，5种回归拟合（线性/多项式/指数/对数/幂函数），最小二乘法+高斯消元法，R²/RMSE统计，预测功能，数据表含残差分析，下载图表 |
| 还款计划表生成器 | `/tools/loan-amortization` | 等额本息/等额本金双模式，提前还款节点插入后重算剩余计划，月度明细表（期数/月供/本金/利息/剩余本金），Canvas堆叠面积图本金利息占比，导出CSV，复制汇总 |
| 代码片段格式化与分享工具 | `/tools/code-card-generator` | 粘贴代码自动语法高亮（关键字/字符串/注释/数字/函数），6种主题配色（One Dark/Dracula/GitHub/Monokai/Solarized/Nord），Canvas生成带行号和macOS风格标题栏的代码卡片图片，圆角/内边距可调，下载PNG |
| HTML 实时预览沙盒 | `/tools/html-playground` | HTML/CSS/JS三分栏编辑器+iframe srcdoc实时预览，5种预设模板（空白/卡片/表格/动画/表单），全屏预览，URL hash编码分享代码，下载完整HTML文件 |
| 复数运算计算器 | `/tools/complex-calculator` | 复数加减乘除/共轭运算，极坐标表示（模/幅角），Canvas复平面可视化向量绘制，快捷输入预设值，计算历史记录 |
| CSS关键帧动画生成器 | `/tools/css-animation-generator` | 可视化关键帧编辑（位移/缩放/旋转/透明度/圆角/背景色），7种属性调节，7种预设模板（弹跳/淡入/脉冲/旋转/抖动/滑入/变形），实时预览+暂停/重播，一键复制@keyframes CSS |
| 响应式断点测试器 | `/tools/responsive-preview` | iframe嵌套加载URL或HTML代码，6种预设设备断点（iPhone/iPad/笔记本/桌面），滑块+拖拽手柄调整宽度320-1920px，Bootstrap媒体查询断点状态实时显示 |
| 文本变量替换与模板生成器 | `/tools/text-template` | Mustache风格{{变量}}模板解析，多变量多值定义，笛卡尔积批量生成，内置变量（序号/日期），一键复制全部/单条，自定义文本支持 |
| 打字速度测试器 | `/tools/typing-test` | 中英文文本库切换，30/60/120秒时长选择，实时WPM和准确率统计，逐字符正确/错误高亮，localStorage历史最佳记录，自定义文本支持 |
| HMAC 签名生成器 | `/tools/hmac-generator` | Web Crypto API 生成 HMAC-SHA256/SHA1/SHA512 签名，Hex/Base64 双格式输出，一键复制，密钥和消息本地处理 |
| HTTP 请求头构造器 | `/tools/header-builder` | 8种预设请求头模板（CORS/Authorization/Cache等），自定义 Header 键值对，一键生成 curl/Fetch/Axios 代码片段 |
| 中英文混排优化器 | `/tools/zh-en-text-fixer` | 自动中英文间插入空格，中文标点转全角/英文标点转半角，括号配对修正，自定义替换规则，实时预览+一键复制 |
| 色彩和谐度分析器 | `/tools/color-harmony-analyzer` | 输入多颜色分析色彩和谐度，Canvas色轮可视化，匹配互补/类比/三色/分裂互补/四色/单色系模式，综合评分+搭配预览 |
| 费曼学习法笔记 | `/tools/feynman-notes` | 四步引导式笔记（概念解释→简化→类比→知识缺口），步骤进度条，localStorage草稿保存，Markdown预览+导出 |
| 知识图谱绘制器 | `/tools/knowledge-graph` | Canvas节点拖拽+带箭头连线，添加/连线/移动/删除四种模式，8种节点颜色，自动圆形布局，导出JSON和PNG |
| 违禁词检测器 | `/tools/banned-word-checker` | 内置50+违禁词词条（极限词/价格违规/虚假宣传/引流违规等），红黄蓝三色高亮，四平台规则，一键替换，安全评分 |
| 节假日日历查看器 | `/tools/holiday-calendar` | 2025-2027年中国法定节假日和调休数据，月历三色标记（🟢假期🔴补班🟡调休），全年汇总统计 |
| 年龄精确计算器 | `/tools/age-calculator` | 精确到秒实时跳动计时，趣味统计（已活天数/心跳/呼吸），生日倒计时+人生进度条（假设80岁） |
| TOML/INI配置转换器 | `/tools/toml-converter` | 自研轻量TOML/INI解析器，TOML↔JSON、INI↔JSON四种转换，预设示例模板，错误提示+一键复制 |
| 几何计算器 | `/tools/geometry-calculator` | 6种图形（圆形/矩形/三角形/球体/圆柱/圆锥），面积/周长/体积/表面积计算，Canvas可视化预览 |
| 排列组合计算器 | `/tools/permutation-combination` | 排列A(n,m)/组合C(n,m)/可重复排列组合，BigInt精确计算大数，杨辉三角Canvas可视化 |
| CSS变量主题生成器 | `/tools/css-theme-generator` | 13+预设颜色变量，自定义扩展，明暗双主题切换，组件实时预览（按钮/卡片/表单/Alert），一键生成CSS代码下载 |
| 工时与加班计算器 | `/tools/work-hours-calculator` | 上下班时间+午休，日/周/月统计，标准工时对比，加班费估算，Canvas柱状图可视化 |
| 时间线可视化生成器 | `/tools/timeline-generator` | 输入事件列表（日期+标题+描述）自动生成垂直/水平时间线图，3种节点风格，6种主题色，快速模板，Canvas绘制，导出PNG/SVG |
| 文字艺术生成器 | `/tools/text-art-styles` | 12种Unicode特殊文字样式（倒置/镜像/全角/小型大写/上下标/花体/双线体/删除线/下划线/上划线等）+8种装饰边框，一键复制 |
| 小红书笔记排版助手 | `/tools/xiaohongshu-editor` | 左栏编辑右栏模拟手机端小红书卡片预览，标题+正文+话题标签，5类Emoji快捷插入，分隔线/高亮/列表格式工具，字数统计，一键复制全文 |
| 在线节拍训练器 | `/tools/metronome` | Web Audio API OscillatorNode精确节拍声，BPM调节30-300，4种拍号（2/4/3/4/4/4/6/8），4种音色（木鱼/电子/高音/牛铃），重拍强调音，节拍圆点可视化闪烁，TAP敲击校准BPM，键盘快捷键（Space/T/方向键） |
| 加密文本分享链接生成器 | `/tools/encrypted-link` | Web Crypto API AES-256-GCM加密文本，PBKDF2密钥派生（100000次迭代），salt+IV+ciphertext编码为URL hash fragment生成分享链接，接收方打开链接输入密码自动解密，URL安全Base64编解码，纯前端零后端 |
| 文本噪声清理器 | `/tools/text-noise-cleaner` | 检测零宽字符（U+200B/200C/200D/FEFF等）、BOM头、不可见控制字符、方向控制字符、同形异义字符、多余空白（连续空格/tab/空行），分类列表+勾选清除+位置详情+Unicode码点显示+差异对比+一键复制/下载 |
| 思维导图文本生成器 | `/tools/mind-map-generator` | 输入Tab/空格缩进大纲文本，自动解析层级生成树状思维导图，Canvas渲染节点+贝塞尔连线，Reingold-Tilford简化版自上而下布局，节点展开/折叠，鼠标拖拽平移+滚轮缩放+触摸双指缩放，层级自动配色，一键导出PNG |
| 公众号文章排版器 | `/tools/wechat-formatter` | 轻量Markdown解析器（标题/加粗/斜体/引用/列表/代码块/行内代码/链接/水平线），全部内联CSS样式生成微信兼容HTML，4种主题配色（简约/商务/清新/暖色），手机屏幕模拟预览，复制HTML代码/富文本/下载HTML文件 |
| 数据透视表生成器 | `/tools/pivot-table` | 粘贴CSV数据自动检测分隔符（逗号/Tab），列名自动识别，行/列分组字段和值字段下拉选择，5种聚合方式（求和/计数/平均值/最大/最小），HTML透视表渲染带行列合计，导出CSV，内置示例数据 |
| Base32/Base85/Base91 编解码器 | `/tools/base-x-encoder` | 纯JS实现Base32(RFC4648)/Base32hex/Base85(Ascii85)/Z85(ZeroMQ)/Base91(basE91)五种编码，编码/解码双模式，粘贴编码自动检测格式，编码效率对比（压缩率）可视化柱状图，字符集信息参考表 |
| 睡眠周期计算器 | `/tools/sleep-cycle-calculator` | 正向（入睡→起床）反向（起床→入睡）双模式，90分钟周期+15分钟入睡缓冲，3-6个周期推荐并标注睡眠质量，当前时间快选按钮，Canvas睡眠周期时间轴可视化，Notification API闹钟提醒+提示音 |
| 复利计算器与投资回报分析器 | `/tools/compound-interest-calculator` | 一次性投入/定期定投/复利vs单利对比三种模式，复利频次可选（年/季度/月/日），5种快捷场景，Canvas投资增长曲线、复利单利对比图、本金收益构成环形图，年度明细表，导出CSV，复制汇总 |

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
