<template>
  <div class="home">
    <section class="hero">
      <h1>🔥 野火小站</h1>
      <p>简洁实用的在线工具集合</p>
    </section>

    <section class="tools-grid">
      <NuxtLink
        v-for="tool in tools"
        :key="tool.path"
        :to="tool.path"
        class="tool-card"
      >
        <span class="tool-icon">{{ tool.icon }}</span>
        <h3 class="tool-name">{{ tool.name }}</h3>
        <p class="tool-desc">{{ tool.desc }}</p>
      </NuxtLink>
    </section>
  </div>
</template>

<script setup>
useHead({ title: '野火小站 - 在线工具箱' })

const tools = [
  {
    icon: '🔐',
    name: 'AES-256加密解密',
    desc: '使用AES-256算法保护隐私数据，支持文本和文件加密',
    path: '/tools/aes256-text-encryptor',
  },
  {
    icon: '🎓',
    name: '智能学习追踪器',
    desc: '番茄钟+间隔重复+记忆曲线的AI辅助学习工具',
    path: '/tools/smart-learning-tracker',
  },
  {
    icon: '🧮',
    name: '生活计算器套件',
    desc: '房贷BMI个税汇率换算一站式解决方案',
    path: '/tools/life-calculator-suite',
  },
  {
    icon: '🔤',
    name: 'Base64 编解码',
    desc: '文本与 Base64 互相转换，支持实时编解码',
    path: '/tools/base64',
  },
  {
    icon: '📱',
    name: '二维码工具',
    desc: '生成二维码图片，上传图片解码识别内容',
    path: '/tools/qrcode',
  },
  {
    icon: '📋',
    name: '文本比对',
    desc: '对比两段文本差异，类似代码 Diff 效果',
    path: '/tools/text-diff',
  },
  {
    icon: '🔢',
    name: '进制转换器',
    desc: '支持二/八/十/十六进制和 Base64 互转，自动识别前缀',
    path: '/tools/radix',
  },
  {
    icon: '🎨',
    name: 'CSS 渐变生成器',
    desc: '可视化创建线性/径向/锥形渐变，实时预览，一键复制代码',
    path: '/tools/css-gradient',
  },
  {
    icon: '⏰',
    name: 'Cron 表达式可视化',
    desc: '解析 Cron 表达式，人类可读描述，预览接下来执行时间',
    path: '/tools/cron',
  },
  {
    icon: '🔗',
    name: '外部收藏',
    desc: '好用的工具、资讯站点、Skill 等资源归档',
    path: '/tools/bookmarks',
  },
  {
    icon: '📏',
    name: '屏幕尺寸对比',
    desc: '输入多个设备尺寸，按真实比例绘制对比图，一目了然',
    path: '/tools/screen-size',
  },
  {
    icon: '📖',
    name: '中文文本排版',
    desc: '一键修正标点、中英文间距、段首缩进，让排版整齐美观',
    path: '/tools/text-formatter',
  },
  {
    icon: '🎓',
    name: '番茄钟计时器',
    desc: '25分钟专注 + 5分钟休息，圆形进度条，本地存储记录',
    path: '/tools/pomodoro',
  },
  {
    icon: '🎵',
    name: '音频剪辑',
    desc: '上传音频，可视化波形，精确裁剪区间并导出 WAV/WebM',
    path: '/tools/audio-trimmer',
  },
  {
    icon: '🌐',
    name: 'IP 信息查询',
    desc: '输入IP或自动检测，查看归属地/ISP/时区等详细信息',
    path: '/tools/ip-lookup',
  },
  {
    icon: '📊',
    name: '图表生成器',
    desc: '粘贴数据，一键生成柱状图/折线图/饼图，支持导出PNG',
    path: '/tools/chart-generator',
  },
  {
    icon: '🎓',
    name: '抽认卡学习器',
    desc: '创建卡片+间隔重复算法，高效记忆和复习',
    path: '/tools/flashcard',
  },
  {
    icon: '🔍',
    name: '正则表达式测试器',
    desc: '实时匹配高亮+常用模板+匹配分组信息，JS正则可视化',
    path: '/tools/regex-tester',
  },
  {
    icon: '📋',
    name: 'JSON 对比',
    desc: '双面板结构化Diff+类型高亮+路径导航+忽略数组顺序',
    path: '/tools/json-diff',
  },
  {
    icon: '〰️',
    name: 'CSS 缓动曲线',
    desc: '拖拽控制点+预设曲线库+动画预览球，一键复制 cubic-bezier',
    path: '/tools/css-easing',
  },
  {
    icon: '🖼️',
    name: '图片格式转换',
    desc: 'PNG/JPG/WebP互转，批量处理，质量可调，对比预览',
    path: '/tools/image-converter',
  },
  {
    icon: '🔗',
    name: 'URL 编解码',
    desc: '实时编解码+完整/安全模式+常用场景模板，一键复制',
    path: '/tools/url-encoder',
  },
  {
    icon: '📊',
    name: 'Markdown 表格',
    desc: '可视化网格编辑器+实时MD预览+对齐设置+一键复制',
    path: '/tools/md-table',
  },
  {
    icon: '💧',
    name: '图片水印',
    desc: '拖拽上传，文字水印/平铺模式，透明度/角度/位置可调，导出PNG/JPG',
    path: '/tools/watermark',
  },
  {
    icon: '📐',
    name: 'JSON Schema 生成',
    desc: '粘贴JSON自动推断Draft-07 Schema，递归类型分析，一键复制',
    path: '/tools/json-schema',
  },
  {
    icon: '✏️',
    name: 'SVG 图标生成器',
    desc: '32个预设图标，颜色/大小/描边可调，实时预览+复制SVG代码',
    path: '/tools/svg-icons',
  },
  {
    icon: '🌈',
    name: 'CSS 渐变文字动画',
    desc: '多色渐变+流动/闪烁/脉冲动画，实时预览，一键复制CSS代码',
    path: '/tools/css-text-gradient',
  },
  {
    icon: '🔬',
    name: '正则可视化调试',
    desc: '结构分块着色+匹配高亮+捕获组，比普通测试器更直观',
    path: '/tools/regex-visualizer',
  },
  {
    icon: '🔢',
    name: 'IEEE 754 转换器',
    desc: '浮点数↔32/64位IEEE 754，色块显示符号/指数/尾数',
    path: '/tools/ieee754',
  },
  {
    icon: '🏥',
    name: '网站健康检查',
    desc: '检测HTTP状态码/响应时间/Content-Type，一目了然',
    path: '/tools/health-check',
  },
  {
    icon: '📝',
    name: '社交文案助手',
    desc: '字数统计+Emoji分析+Hashtag建议+多平台字数限制检查',
    path: '/tools/social-copywriter',
  },
  {
    icon: '🎰',
    name: '多功能生成器',
    desc: '密码生成/UUID生成/中文假文，支持批量，一键复制',
    path: '/tools/generator-suite',
  },
  {
    icon: '🎨',
    name: '智能色彩搭配',
    desc: '输入主色自动生成互补/类比/三色/分裂互补配色方案',
    path: '/tools/color-palette',
  },
  {
    icon: '⏱️',
    name: '智能时间工具箱',
    desc: '时间差/倒计时/时区转换/时间戳转换，四大功能合一',
    path: '/tools/time-toolkit',
  },
  {
    icon: '🔐',
    name: 'JWT 调试工具',
    desc: '可视化Header/Payload/Signature三段结构，自动解码校验过期',
    path: '/tools/jwt-debugger',
  },
  {
    icon: '🔄',
    name: '万能编码转换',
    desc: 'Hex/Octal/Binary/Unicode/HTML实体/URL/Base64等10种编码互转',
    path: '/tools/encoding-converter',
  },
  {
    icon: '✂️',
    name: '图片裁剪工具',
    desc: '上传图片自由拖拽裁剪区域，支持预设比例，实时预览并导出裁剪结果',
    path: '/tools/image-cropper',
  },
  {
    icon: '📦',
    name: '图片压缩',
    desc: '拖拽上传，质量可调，前后对比，显示压缩率和文件大小变化',
    path: '/tools/image-compressor',
  },
  {
    icon: '📋',
    name: 'JSON 格式化校验',
    desc: '自动格式化+语法高亮+错误定位+树形折叠+压缩单行',
    path: '/tools/json-formatter',
  },
  {
    icon: '📖',
    name: 'Markdown 实时预览',
    desc: '左栏输入右栏渲染，支持标题/代码/表格/列表等常见语法',
    path: '/tools/markdown-preview',
  },
  {
    icon: '📕',
    name: '小说排版助手',
    desc: '智能分段+标点修正+繁简转换+段落缩进，专为中文小说优化',
    path: '/tools/novel-typesetter',
  },
  {
    icon: '📈',
    name: 'Excel 数据可视化',
    desc: '上传CSV/Excel，自动识别数据，一键生成柱状图/折线图/饼图',
    path: '/tools/excel-visualizer',
  },
  {
    icon: '⚖️',
    name: 'BMI 与健康指标计算器',
    desc: '身高体重计算 BMI、基础代谢率、每日所需热量，彩色仪表盘可视化',
    path: '/tools/bmi-calculator',
  },
  {
    icon: '📄',
    name: '纸张尺寸对比工具',
    desc: 'ISO 216 标准 A/B/C 系列，按真实比例 Canvas 对比，可调 DPI 像素尺寸',
    path: '/tools/paper-size',
  },
  {
    icon: '🔐',
    name: '哈希计算器',
    desc: '支持 MD5/SHA-1/SHA-256/SHA-512，文本实时计算，文件拖拽上传',
    path: '/tools/hash-calculator',
  },
  {
    icon: '⚖️',
    name: 'WCAG 对比度检查器',
    desc: '输入前景/背景色，实时计算对比度比值，检查 WCAG 2.1 AA/AAA 合规性',
    path: '/tools/wcag-contrast',
  },
  {
    icon: '🎨',
    name: '图片取色与主色提取',
    desc: '上传图片自动提取主色调生成调色板，点击任意位置取色（HEX/RGB/HSL）',
    path: '/tools/image-color-extractor',
  },
  {
    icon: '🧮',
    name: 'JSONPath 查询测试器',
    desc: '输入JSON数据和JSONPath表达式，实时匹配高亮结果，支持语法参考和预设示例',
    path: '/tools/jsonpath-tester',
  },
  {
    icon: '🔤',
    name: 'Unicode字符查询工具',
    desc: '查询字符的Unicode信息、编码、类别等详细信息，支持字符和代码点输入',
    path: '/tools/unicode-lookup',
  },
  {
    icon: '📝',
    name: '自然语言处理器',
    desc: '文本分析工具：词频统计、关键词提取、情感分析、可读性评分',
    path: '/tools/text-analyzer',
  },
  {
    icon: '🧾',
    name: '智能账单分摊助手',
    desc: '聚餐后实时计算每个人应付金额，支持多项目分账、小费比例调整、自动汇总',
    path: '/tools/bill-splitter',
  },
  {
    icon: '🔲',
    name: 'CSS 阴影边框生成器',
    desc: '调节阴影/边框/圆角参数，实时预览，多种预设，一键复制CSS代码',
    path: '/tools/css-shadow-border-generator',
  },
  {
    icon: '🎵',
    name: '音频信息分析器',
    desc: '上传音频文件，显示比特率、时长、声道、编码格式等详细信息，频谱与波形可视化',
    path: '/tools/audio-info-analyzer',
  },
  {
    icon: '📏',
    name: '生活物品尺寸对比器',
    desc: '手机/电脑/电视/纸张/家具等物品的可视化尺寸对比，自动分析比例关系和容纳建议',
    path: '/tools/size-comparator',
  },
  {
    icon: '📱',
    name: '多平台素材尺寸适配器',
    desc: '上传一张图，一键生成微信/抖音/小红书/X/Instagram等主流平台适配尺寸，批量下载',
    path: '/tools/multi-platform-size-adaptor',
  },
  {
    icon: '🔄',
    name: '数据格式互转器',
    desc: 'CSV/JSON/YAML/XML/Markdown表格互相转换，粘贴即转，支持文件拖拽上传和下载',
    path: '/tools/data-format-converter',
  },
  {
    icon: '🎨',
    name: 'SQL 格式化与美化',
    desc: '粘贴SQL自动格式化，关键字高亮，支持MySQL/PostgreSQL/SQLite方言，一键复制',
    path: '/tools/sql-formatter',
  },
  {
    icon: '🔷',
    name: 'JSON/YAML转TypeScript',
    desc: '粘贴JSON或YAML自动生成TypeScript interface/type定义，递归处理嵌套类型',
    path: '/tools/json-to-typescript',
  },
  {
    icon: '🌐',
    name: 'HTTP 状态码速查',
    desc: '可视化展示60+个HTTP状态码，按类别分组，搜索过滤，点击查看详细说明',
    path: '/tools/http-status-codes',
  },
  {
    icon: '👁️',
    name: '色盲模拟与无障碍检测器',
    desc: '模拟8种色盲视觉效果，Canvas像素级变换，WCAG AA/AAA对比度检测',
    path: '/tools/color-blindness-simulator',
  },
  {
    icon: '🔐',
    name: '经典密码编解码器',
    desc: '凯撒/摩尔斯/维吉尼亚/栅栏/ROT13五种经典算法，加密解密双向转换',
    path: '/tools/classic-cipher',
  },
  {
    icon: '📝',
    name: 'Lorem Ipsum 生成器',
    desc: '英文Lorem词库+中文随机段落，参数可调，一键复制纯文本和HTML',
    path: '/tools/lorem-generator',
  },
  {
    icon: '📊',
    name: '随机数据表格生成器',
    desc: '生成姓名/手机/邮箱/地址等模拟数据，表格展示，支持导出CSV和JSON',
    path: '/tools/fake-data-generator',
  },
  {
    icon: '🖼️',
    name: '图片拼接工具',
    desc: '多图拼接、拖拽排序、四种布局模式，参数可调，一键导出PNG/JPG',
    path: '/tools/image-stitcher',
  },
  {
    icon: '📐',
    name: '万能单位换算器',
    desc: '7大分类100+单位，长度/重量/温度/面积/体积/速度/数据存储实时换算',
    path: '/tools/unit-converter',
  },
  {
    icon: '🧠',
    name: '间隔重复复习计划器',
    desc: '艾宾浩斯/SuperMemo/Cepeda三种算法，遗忘曲线可视化，多科目管理',
    path: '/tools/spaced-repetition',
  },
  {
    icon: '📦',
    name: 'UTF-8 字节序列可视化查看器',
    desc: '逐字符展示 Unicode 码点、UTF-8 字节序列、UTF-16 编码、HTML 实体，支持详细表格和紧凑视图',
    path: '/tools/utf8-byte-viewer',
  },
  {
    icon: '🌍',
    name: '世界时钟与时区对比器',
    desc: '30+主要城市，实时时钟+24小时时间轴+工作时间重叠区域标注，跨时区会议助手',
    path: '/tools/world-clock',
  },
  {
    icon: '🧩',
    name: 'CSS Grid 可视化生成器',
    desc: '可视化创建 CSS Grid 布局，支持区域划分，6种预设模板，一键复制CSS和HTML',
    path: '/tools/css-grid-generator',
  },
  {
    icon: '🧩',
    name: 'CSS Flexbox 可视化生成器',
    desc: '交互式调节 Flex 属性，实时预览布局效果，8种预设模板，一键复制CSS和HTML',
    path: '/tools/flexbox-generator',
  },
  {
    icon: '🔢',
    name: '数学表达式计算器',
    desc: '支持科学计算函数(sin/cos/ln/log)、常量(π/e/φ)、括号嵌套、历史记录',
    path: '/tools/math-calculator',
  },
  {
    icon: '🔢',
    name: '矩阵计算器',
    desc: '矩阵加减乘、行列式、转置、逆矩阵运算，支持 2×2/3×3/4×4 维度切换',
    path: '/tools/matrix-calculator',
  },
  {
    icon: '📝',
    name: '文本去重与排序',
    desc: '多行文本一键去重、过滤空行、排序（升序/降序/随机打乱），实时统计',
    path: '/tools/text-dedup-sorter',
  },
  {
    icon: '🔒',
    name: '密码强度检测器',
    desc: '分析密码安全性：连续/重复字符检测、弱密码库比对、暴力破解时间估算',
    path: '/tools/password-strength-checker',
  },
  {
    icon: '🔍',
    name: 'UA 解析器',
    desc: '解析 User-Agent 字符串，识别浏览器/操作系统/设备类型/渲染引擎，支持常见UA模板一键填入',
    path: '/tools/ua-parser',
  },
  {
    icon: '⭕',
    name: 'SVG 环形图生成器',
    desc: '单环进度条/多环饼图/仪表盘三种模式，颜色/宽度/动画可调，实时SVG预览，一键复制代码',
    path: '/tools/svg-ring-chart',
  },
  {
    icon: '🏷️',
    name: 'Meta 标签生成器',
    desc: '生成 SEO + Open Graph + Twitter Card 标签，实时预览微信/Facebook/Twitter/Discord 分享效果',
    path: '/tools/meta-tag-generator',
  },
  {
    icon: '🎰',
    name: '随机抽签分组器',
    desc: '输入名单，随机抽签/公平分组/加权随机，转盘动画展示结果',
    path: '/tools/random-picker',
  },
  {
    icon: '📸',
    name: '图片 EXIF 元数据查看器',
    desc: '拖拽上传图片，纯前端解析 EXIF 数据，查看相机型号、拍摄参数、GPS 坐标等',
    path: '/tools/exif-viewer',
  },
  {
    icon: '🔤',
    name: 'ASCII 文字艺术生成器',
    desc: '输入文字选择字体风格，生成 ASCII 字符画，6种字体、5种字符集，一键复制下载',
    path: '/tools/ascii-art-generator',
  },
  {
    icon: '☁️',
    name: '词云生成器',
    desc: '输入文本自动统计词频，螺旋线布局生成词云，5种配色方案，支持导出PNG',
    path: '/tools/word-cloud',
  },
  {
    icon: '💍',
    name: '戒指尺寸对照器',
    desc: '中国/美国/英国/日本/欧盟戒圈码互转，纸条测量+内径测量两种方法，可视化对比',
    path: '/tools/ring-size',
  },
]
</script>

<style scoped>
.home {
  padding-top: 1rem;
}

.hero {
  text-align: center;
  margin-bottom: 3rem;
}

.hero h1 {
  font-size: 2.2rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero p {
  color: #666;
  font-size: 1.1rem;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.tool-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  border: 1px solid transparent;
}

.tool-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  border-color: #10b981;
}

.tool-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 1rem;
}

.tool-name {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.tool-desc {
  color: #888;
  font-size: 0.95rem;
  line-height: 1.5;
}

@media (max-width: 640px) {
  .hero h1 {
    font-size: 1.8rem;
  }
  .tools-grid {
    grid-template-columns: 1fr;
  }
}
</style>
