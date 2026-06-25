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
