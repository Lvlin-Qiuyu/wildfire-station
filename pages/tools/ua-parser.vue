<template>
  <div class="tool-page">
    <h2>🔍 UA 解析器</h2>
    <p class="subtitle">解析 User-Agent 字符串，识别浏览器、操作系统、设备类型和渲染引擎</p>

    <!-- 常见UA模板 -->
    <div class="section">
      <div class="section-title">📌 快速填入常见 UA</div>
      <div class="ua-templates">
        <button
          v-for="tpl in uaTemplates"
          :key="tpl.label"
          class="tpl-btn"
          @click="fillTemplate(tpl.ua)"
        >{{ tpl.icon }} {{ tpl.label }}</button>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="section">
      <div class="section-title">✏️ 输入 UA 字符串</div>
      <div class="input-area">
        <textarea
          v-model="uaInput"
          placeholder="粘贴或输入 User-Agent 字符串，或点击上方按钮快速填入…"
          rows="4"
          class="ua-textarea"
        ></textarea>
        <div class="btn-row">
          <button class="btn-primary" @click="parseUA">🔍 解析</button>
          <button class="btn-secondary" @click="detectCurrent">📱 检测当前浏览器</button>
        </div>
      </div>
    </div>

    <!-- 解析结果 -->
    <div v-if="parsed" class="section">
      <div class="section-header">
        <div class="section-title">📋 解析结果</div>
        <button class="btn-copy" @click="copyJson">📋 复制 JSON</button>
      </div>

      <div class="result-cards">
        <div class="result-card">
          <div class="card-icon">{{ browserIcon }}</div>
          <div class="card-label">浏览器</div>
          <div class="card-value">{{ parsed.browser || '未知' }}</div>
          <div class="card-sub" v-if="parsed.browserVersion">版本 {{ parsed.browserVersion }}</div>
        </div>

        <div class="result-card">
          <div class="card-icon">💻</div>
          <div class="card-label">操作系统</div>
          <div class="card-value">{{ parsed.os || '未知' }}</div>
          <div class="card-sub" v-if="parsed.osVersion">版本 {{ parsed.osVersion }}</div>
        </div>

        <div class="result-card">
          <div class="card-icon">{{ deviceIcon }}</div>
          <div class="card-label">设备类型</div>
          <div class="card-value">{{ parsed.device || '未知' }}</div>
        </div>

        <div class="result-card">
          <div class="card-icon">⚙️</div>
          <div class="card-label">渲染引擎</div>
          <div class="card-value">{{ parsed.engine || '未知' }}</div>
        </div>

        <div class="result-card">
          <div class="card-icon">📱</div>
          <div class="card-label">平台信息</div>
          <div class="card-value">{{ parsed.platform || '未知' }}</div>
        </div>
      </div>
    </div>

    <!-- UA 高亮展示 -->
    <div v-if="highlightedParts.length" class="section">
      <div class="section-title">🎨 UA 字符串结构着色</div>
      <div class="ua-highlight-box">
        <span v-for="(part, i) in highlightedParts" :key="i" class="hl-part" :style="{ color: part.color }">
          {{ part.text }}
        </span>
      </div>
      <div class="legend">
        <span v-for="item in legendItems" :key="item.label" class="legend-item">
          <span class="legend-dot" :style="{ background: item.color }"></span>
          {{ item.label }}
        </span>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'UA 解析器 - 野火小站' })

const uaInput = ref('')
const parsed = ref(null)
const highlightedParts = ref([])

// 常见UA模板
const uaTemplates = [
  { label: 'Chrome (Win)', icon: '🌐', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36' },
  { label: 'Firefox (Mac)', icon: '🦊', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:126.0) Gecko/20100101 Firefox/126.0' },
  { label: 'Safari (Mac)', icon: '🧭', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15' },
  { label: 'Edge (Win)', icon: '🔵', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0' },
  { label: 'iPhone Safari', icon: '📱', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' },
  { label: 'Android Chrome', icon: '🤖', ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36' },
  { label: 'iPad Safari', icon: '📋', ua: 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' },
  { label: 'Googlebot', icon: '🤖', ua: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
]

// 浏览器图标
const browserIcon = computed(() => {
  if (!parsed.value) return '🌐'
  const b = parsed.value.browser.toLowerCase()
  if (b.includes('chrome') || b.includes('chromium')) return '🌐'
  if (b.includes('firefox')) return '🦊'
  if (b.includes('safari')) return '🧭'
  if (b.includes('edge')) return '🔵'
  if (b.includes('opera') || b.includes('opr')) return '🔴'
  if (b.includes('ie') || b.includes('msie')) return '🔵'
  return '🌐'
})

// 设备图标
const deviceIcon = computed(() => {
  if (!parsed.value) return '🖥️'
  const d = parsed.value.device
  if (d.includes('手机')) return '📱'
  if (d.includes('平板')) return '📋'
  if (d.includes('爬虫')) return '🤖'
  return '🖥️'
})

// 高亮着色部分颜色
const partColors = {
  browser: '#3b82f6',
  os: '#10b981',
  engine: '#f59e0b',
  device: '#8b5cf6',
  platform: '#ec4899',
  bot: '#ef4444',
  misc: '#94a3b8',
}

// 图例项
const legendItems = computed(() => {
  const set = new Set(highlightedParts.value.map(p => p.type))
  const items = []
  const map = { browser: '浏览器', os: '操作系统', engine: '渲染引擎', device: '设备', platform: '平台', bot: '爬虫', misc: '其他' }
  for (const t of set) {
    if (map[t]) items.push({ label: map[t], color: partColors[t] })
  }
  return items
})

function fillTemplate(ua) {
  uaInput.value = ua
  parseUA()
}

function detectCurrent() {
  if (import.meta.client) {
    uaInput.value = navigator.userAgent
    parseUA()
  }
}

function parseUA() {
  const ua = uaInput.value.trim()
  if (!ua) return
  parsed.value = doParse(ua)
  highlightedParts.value = doHighlight(ua, parsed.value)
}

function doParse(ua) {
  const result = { browser: '', browserVersion: '', os: '', osVersion: '', device: '', engine: '', platform: '' }

  // 设备类型判断
  if (/Mobile|Android.*Mobile|iPhone|iPod|Windows Phone/i.test(ua)) {
    result.device = '手机'
  } else if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) {
    result.device = '平板'
  } else if (/bot|crawl|spider|slurp|scrapy|mediapartners/i.test(ua)) {
    result.device = '爬虫'
  } else {
    result.device = '桌面'
  }

  // 操作系统
  const osPatterns = [
    { re: /Windows NT (\d+[\.\d]*)/, name: 'Windows', versionMap: { '10.0': '10/11', '6.3': '8.1', '6.2': '8', '6.1': '7', '6.0': 'Vista', '5.1': 'XP', '5.0': '2000' } },
    { re: /Mac OS X (\d+[._]\d+[._]?\d*)/, name: 'macOS' },
    { re: /iPhone OS (\d+[._]\d+[._]?\d*)/, name: 'iOS' },
    { re: /iPad.*OS (\d+[._]\d+[._]?\d*)/, name: 'iPadOS' },
    { re: /Android (\d+[\.\d]*)/, name: 'Android' },
    { re: /CrOS/, name: 'Chrome OS', version: '' },
    { re: /Linux/, name: 'Linux' },
    { re: /Ubuntu/, name: 'Ubuntu' },
  ]
  for (const p of osPatterns) {
    const m = ua.match(p.re)
    if (m) {
      result.os = p.name
      if (p.versionMap && m[1]) {
        result.osVersion = p.versionMap[m[1]] || m[1]
      } else if (m[1]) {
        result.osVersion = m[1].replace(/_/g, '.')
      }
      break
    }
  }

  // 平台
  if (/Win32|Win64|Windows/i.test(ua)) result.platform = 'Windows'
  else if (/Macintosh/i.test(ua)) result.platform = 'macOS'
  else if (/iPhone/i.test(ua)) result.platform = 'iPhone'
  else if (/iPad/i.test(ua)) result.platform = 'iPad'
  else if (/Android/i.test(ua)) result.platform = 'Android'
  else if (/Linux/i.test(ua)) result.platform = 'Linux'
  else result.platform = '未知'

  // 渲染引擎
  if (/AppleWebKit\/(\S+)/i.test(ua)) {
    const awVer = ua.match(/AppleWebKit\/(\S+)/i)[1]
    // 区分 Blink vs WebKit
    if (/Chrome\//i.test(ua) && !/Edge?\//i.test(ua) || /Edg\//i.test(ua) || /OPR\//i.test(ua)) {
      result.engine = 'Blink'
    } else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) {
      result.engine = 'WebKit'
    } else {
      result.engine = 'Blink'
    }
  } else if (/Gecko\//i.test(ua)) {
    if (/Firefox\//i.test(ua)) {
      result.engine = 'Gecko'
    } else {
      result.engine = 'Gecko'
    }
  } else if (/Trident\//i.test(ua)) {
    result.engine = 'Trident'
  }

  // 浏览器（按优先级从高到低）
  const browserPatterns = [
    { re: /OPR\/(\d+[\.\d]*)/, name: 'Opera' },
    { re: /Edg\/(\d+[\.\d]*)/, name: 'Edge' },
    { re: /Vivaldi\/(\d+[\.\d]*)/, name: 'Vivaldi' },
    { re: /YaBrowser\/(\d+[\.\d]*)/, name: 'Yandex Browser' },
    { re: /SamsungBrowser\/(\d+[\.\d]*)/, name: 'Samsung Browser' },
    { re: /UCBrowser\/(\d+[\.\d]*)/, name: 'UC Browser' },
    { re: /QQBrowser\/(\d+[\.\d]*)/, name: 'QQ浏览器' },
    { re: /MicroMessenger\/(\d+[\.\d]*)/, name: '微信浏览器' },
    { re: /Firefox\/(\d+[\.\d]*)/, name: 'Firefox' },
    { re: /Chrome\/(\d+[\.\d]*)/, name: 'Chrome' },
    { re: /Version\/(\d+[\.\d]*).*Safari/, name: 'Safari' },
    { re: /MSIE (\d+)/, name: 'Internet Explorer' },
    { re: /Trident.*rv:(\d+)/, name: 'Internet Explorer' },
    { re: /Googlebot\/(\d+[\.\d]*)/, name: 'Googlebot' },
    { re: /bingbot\/(\d+[\.\d]*)/, name: 'Bingbot' },
    { re: /Baiduspider/, name: 'Baiduspider' },
  ]
  for (const p of browserPatterns) {
    const m = ua.match(p.re)
    if (m) {
      result.browser = p.name
      if (m[1]) result.browserVersion = m[1]
      break
    }
  }

  return result
}

// UA 高亮着色
function doHighlight(ua, parsed) {
  if (!parsed) return []
  const parts = []
  let remaining = ua
  let offset = 0

  // 按片段匹配并标记
  const segments = []

  // 平台片段
  const platPatterns = [
    { re: /\([^)]+\)/, type: 'platform' },
  ]

  // 引擎片段
  const engPatterns = [
    { re: /AppleWebKit\/\S+/, type: 'engine' },
    { re: /Gecko\/\S+/, type: 'engine' },
    { re: /Trident\/\S+/, type: 'engine' },
  ]

  // 浏览器片段
  const brPatterns = [
    { re: /OPR\/\S+/, type: 'browser' },
    { re: /Edg\/\S+/, type: 'browser' },
    { re: /Chrome\/\S+/, type: 'browser' },
    { re: /Firefox\/\S+/, type: 'browser' },
    { re: /Safari\/\S+/, type: 'browser' },
    { re: /Version\/\S+/, type: 'browser' },
    { re: /MSIE\s+\S+/, type: 'browser' },
    { re: /Googlebot\/\S+/, type: 'bot' },
    { re: /bingbot\/\S+/, type: 'bot' },
  ]

  // 收集所有匹配
  function findMatches(patterns, str, o) {
    for (const p of patterns) {
      const m = str.match(p.re)
      if (m) {
        const idx = str.indexOf(m[0])
        if (idx >= 0) {
          segments.push({ start: o + idx, end: o + idx + m[0].length, text: m[0], type: p.type })
        }
      }
    }
  }

  findMatches(brPatterns, ua, 0)
  findMatches(engPatterns, ua, 0)
  findMatches(platPatterns, ua, 0)

  // 按位置排序，去重叠
  segments.sort((a, b) => a.start - b.start)

  // 构建高亮序列
  let cursor = 0
  for (const seg of segments) {
    if (seg.start < cursor) continue
    if (seg.start > cursor) {
      parts.push({ text: ua.slice(cursor, seg.start), type: 'misc' })
    }
    parts.push({ text: seg.text, type: seg.type })
    cursor = seg.end
  }
  if (cursor < ua.length) {
    parts.push({ text: ua.slice(cursor), type: 'misc' })
  }

  return parts
}

async function copyJson() {
  if (!parsed.value) return
  const json = JSON.stringify(parsed.value, null, 2)
  try {
    await navigator.clipboard.writeText(json)
  } catch {
    // Fallback
    const ta = document.createElement('textarea')
    ta.value = json
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
}
</script>

<style scoped>
.tool-page {
  padding-top: 0.5rem;
}

h2 {
  font-size: 1.6rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #666;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

.section {
  margin-bottom: 1.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.section-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
}

/* UA 模板按钮 */
.ua-templates {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tpl-btn {
  padding: 0.4rem 0.85rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
  white-space: nowrap;
}

.tpl-btn:hover {
  border-color: #10b981;
  background: #ecfdf5;
}

/* 输入区域 */
.ua-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  background: white;
  resize: vertical;
  line-height: 1.5;
}

.ua-textarea:focus {
  outline: none;
  border-color: #10b981;
}

.btn-row {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
}

.btn-primary {
  padding: 0.6rem 1.5rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: opacity 0.2s;
}

.btn-primary:hover { opacity: 0.85; }

.btn-secondary {
  padding: 0.6rem 1.5rem;
  background: white;
  color: #10b981;
  border: 2px solid #10b981;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-secondary:hover { background: #ecfdf5; }

.btn-copy {
  padding: 0.4rem 0.85rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.btn-copy:hover {
  border-color: #10b981;
  background: #ecfdf5;
}

/* 结果卡片 */
.result-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.result-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.card-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.card-label {
  font-size: 0.8rem;
  color: #888;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a1a1a;
}

.card-sub {
  font-size: 0.85rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

/* UA 高亮展示 */
.ua-highlight-box {
  background: #1e293b;
  border-radius: 10px;
  padding: 1.25rem;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 0.88rem;
  line-height: 1.8;
  word-break: break-all;
  overflow-x: auto;
}

.hl-part {
  transition: background 0.2s;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.75rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.82rem;
  color: #666;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.back-link {
  display: inline-block;
  margin-top: 2.5rem;
  color: #22c55e;
  font-weight: 500;
}

.back-link:hover { text-decoration: underline; }

@media (max-width: 640px) {
  .result-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  .btn-row {
    flex-direction: column;
  }
  .btn-primary, .btn-secondary {
    width: 100%;
    text-align: center;
  }
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
