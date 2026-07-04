<template>
  <div class="tool-page">
    <h2>📋 代码片段格式化与分享工具</h2>
    <p class="subtitle">粘贴代码自动语法高亮，生成带行号和主题色的精美代码卡片图片，支持下载分享</p>

    <!-- 代码输入 -->
    <div class="section">
      <div class="section-header">
        <label>代码输入</label>
        <div class="header-actions">
          <select v-model="language" class="select-lang">
            <option v-for="lang in languages" :key="lang" :value="lang">{{ lang }}</option>
          </select>
          <button class="btn-sm" @click="loadSample">加载示例</button>
          <button class="btn-sm" @click="clearCode">清空</button>
        </div>
      </div>
      <textarea
        v-model="code"
        class="code-input"
        placeholder="在此粘贴你的代码..."
        rows="10"
        spellcheck="false"
        @input="debouncedUpdate"
      ></textarea>
      <div class="code-info">
        <span>字符数：{{ code.length }}</span>
        <span>行数：{{ lineCount }}</span>
      </div>
    </div>

    <!-- 卡片设置 -->
    <div class="section">
      <label>卡片设置</label>
      <div class="settings-grid">
        <div class="setting-item">
          <span class="setting-label">主题</span>
          <div class="theme-buttons">
            <button
              v-for="t in themes"
              :key="t.name"
              class="btn-theme"
              :class="{ active: theme === t.name }"
              :style="{ background: t.bg }"
              @click="theme = t.name"
            >
              {{ t.name }}
            </button>
          </div>
        </div>
        <div class="setting-item">
          <span class="setting-label">显示行号</span>
          <label class="toggle-label">
            <input type="checkbox" v-model="showLineNumbers" />
            <span>{{ showLineNumbers ? '开' : '关' }}</span>
          </label>
        </div>
        <div class="setting-item">
          <span class="setting-label">圆角</span>
          <input v-model.number="borderRadius" type="range" min="0" max="20" class="slider" />
          <span class="slider-value">{{ borderRadius }}px</span>
        </div>
        <div class="setting-item">
          <span class="setting-label">内边距</span>
          <input v-model.number="padding" type="range" min="12" max="40" class="slider" />
          <span class="slider-value">{{ padding }}px</span>
        </div>
        <div class="setting-item">
          <span class="setting-label">标题栏</span>
          <input v-model="titleBar" type="text" placeholder="文件名，留空隐藏" class="input-title" />
        </div>
      </div>
    </div>

    <!-- 预览 -->
    <div v-if="code.trim()" class="section preview-section">
      <h3>👁️ 卡片预览</h3>
      <div class="preview-area" ref="previewWrapper">
        <canvas ref="previewCanvas"></canvas>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div v-if="code.trim()" class="action-bar">
      <button class="btn-copy" @click="downloadImage">📸 下载 PNG</button>
      <button class="btn-copy btn-copy2" @click="copyCode">📋 复制代码</button>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '代码卡片生成器 - 野火小站' })

const code = ref('')
const language = ref('javascript')
const theme = ref('One Dark')
const showLineNumbers = ref(true)
const borderRadius = ref(12)
const padding = ref(24)
const titleBar = ref('')

const previewCanvas = ref(null)
const previewWrapper = ref(null)

const languages = [
  'javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'go', 'rust',
  'html', 'css', 'json', 'xml', 'yaml', 'sql', 'bash', 'php', 'ruby',
  'swift', 'kotlin', 'dart', 'plaintext',
]

const themes = [
  { name: 'One Dark', bg: '#282c34', fg: '#abb2bf', keyword: '#c678dd', string: '#98c379', comment: '#5c6370', number: '#d19a66', function: '#61afef' },
  { name: 'Dracula', bg: '#282a36', fg: '#f8f8f2', keyword: '#ff79c6', string: '#f1fa8c', comment: '#6272a4', number: '#bd93f9', function: '#50fa7b' },
  { name: 'GitHub', bg: '#ffffff', fg: '#24292e', keyword: '#d73a49', string: '#032f62', comment: '#6a737d', number: '#005cc5', function: '#6f42c1' },
  { name: 'Monokai', bg: '#272822', fg: '#f8f8f2', keyword: '#f92672', string: '#e6db74', comment: '#75715e', number: '#ae81ff', function: '#a6e22e' },
  { name: 'Solarized', bg: '#002b36', fg: '#839496', keyword: '#859900', string: '#2aa198', comment: '#586e75', number: '#d33682', function: '#268bd2' },
  { name: 'Nord', bg: '#2e3440', fg: '#d8dee9', keyword: '#81a1c1', string: '#a3be8c', comment: '#616e88', number: '#b48ead', function: '#88c0d0' },
]

const currentTheme = computed(() => themes.find(t => t.name === theme.value) || themes[0])
const lineCount = computed(() => code.value ? code.value.split('\n').length : 0)

// 防抖更新
let debounceTimer = null
function debouncedUpdate() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => renderPreview(), 200)
}

// 加载示例
function loadSample() {
  language.value = 'javascript'
  code.value = `// 野火小站 - 代码卡片示例
function fibonacci(n) {
  if (n <= 1) return n;
  
  let prev = 0, curr = 1;
  for (let i = 2; i <= n; i++) {
    const next = prev + curr;
    prev = curr;
    curr = next;
  }
  
  return curr; // 返回第n个斐波那契数
}

// 测试
console.log(fibonacci(10)); // 55
console.log(fibonacci(20)); // 6765`
  nextTick(renderPreview)
}

function clearCode() {
  code.value = ''
}

// ========= 简易语法高亮 =========
const jsKeywords = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
  'do', 'switch', 'case', 'break', 'continue', 'new', 'this', 'class',
  'extends', 'import', 'export', 'from', 'default', 'async', 'await',
  'try', 'catch', 'finally', 'throw', 'typeof', 'instanceof', 'in', 'of',
  'true', 'false', 'null', 'undefined', 'void', 'delete', 'yield',
])

const pyKeywords = new Set([
  'def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while',
  'import', 'from', 'as', 'try', 'except', 'finally', 'with', 'lambda',
  'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'pass', 'raise', 'yield',
])

function highlightLine(line, lang) {
  // 先对整行做替换，输出 [{ text, color }]
  const tokens = []
  let remaining = line

  // 单行注释
  const commentMatch = remaining.match(/(\/\/.*$|#.*$)/)
  let commentPart = ''
  if (commentMatch) {
    remaining = remaining.substring(0, remaining.indexOf(commentMatch[1]))
    commentPart = commentMatch[1]
  }

  // 用正则逐段处理
  const regex = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+\.?\d*\b)|(\b\w+\b)/g
  let match
  let lastIndex = 0

  while ((match = regex.exec(remaining)) !== null) {
    // 匹配前的普通文本
    if (match.index > lastIndex) {
      tokens.push({ text: remaining.substring(lastIndex, match.index), color: null })
    }

    if (match[1]) {
      // 字符串
      tokens.push({ text: match[1], color: 'string' })
    } else if (match[2]) {
      // 数字
      tokens.push({ text: match[2], color: 'number' })
    } else if (match[3]) {
      // 标识符/关键字
      const kw = lang === 'python' ? pyKeywords : jsKeywords
      if (kw.has(match[3])) {
        tokens.push({ text: match[3], color: 'keyword' })
      } else if (remaining[match.index + match[0].length] === '(') {
        tokens.push({ text: match[3], color: 'function' })
      } else {
        tokens.push({ text: match[3], color: null })
      }
    }
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < remaining.length) {
    tokens.push({ text: remaining.substring(lastIndex), color: null })
  }

  if (commentPart) {
    tokens.push({ text: commentPart, color: 'comment' })
  }

  return tokens
}

// ========= Canvas 渲染 =========
function renderPreview() {
  const canvas = previewCanvas.value
  const wrapper = previewWrapper.value
  if (!canvas || !wrapper || !code.value.trim()) return

  const t = currentTheme.value
  const lines = code.value.split('\n')
  const fontSize = 14
  const lineHeight = fontSize * 1.6
  const charWidth = fontSize * 0.6
  const pad = padding.value
  const lineNumWidth = showLineNumbers.value ? (String(lines.length).length * charWidth + pad * 1.5) : 0
  const titleBarHeight = titleBar.value ? 36 : 0

  const dpr = window.devicePixelRatio || 1

  // 计算内容宽度
  let maxContentWidth = 0
  for (const line of lines) {
    maxContentWidth = Math.max(maxContentWidth, line.length * charWidth)
  }
  const canvasWidth = Math.min(pad * 2 + lineNumWidth + maxContentWidth + 20, wrapper.clientWidth - 40)
  const canvasHeight = pad + titleBarHeight + lines.length * lineHeight + pad

  canvas.width = canvasWidth * dpr
  canvas.height = canvasHeight * dpr
  canvas.style.width = canvasWidth + 'px'
  canvas.style.height = canvasHeight + 'px'

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  // 背景（带圆角）
  const r = borderRadius.value
  ctx.fillStyle = t.bg
  roundRect(ctx, 0, 0, canvasWidth, canvasHeight, r)
  ctx.fill()

  let yOffset = pad

  // 标题栏
  if (titleBar.value) {
    ctx.fillStyle = adjustAlpha(t.fg, 0.08)
    roundRectTop(ctx, 0, 0, canvasWidth, titleBarHeight, r)
    ctx.fill()

    // 三个圆点
    const dots = ['#ff5f56', '#ffbd2e', '#27ca41']
    dots.forEach((color, i) => {
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(pad + 6 + i * 18, titleBarHeight / 2, 6, 0, Math.PI * 2)
      ctx.fill()
    })

    // 标题文字
    ctx.fillStyle = adjustAlpha(t.fg, 0.5)
    ctx.font = `${fontSize * 0.85}px -apple-system, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(titleBar.value, canvasWidth / 2, titleBarHeight / 2 + fontSize * 0.3)

    yOffset = pad + titleBarHeight
  }

  // 代码行
  ctx.font = `${fontSize}px 'Courier New', monospace`

  for (let i = 0; i < lines.length; i++) {
    const y = yOffset + i * lineHeight

    // 行号
    if (showLineNumbers.value) {
      ctx.fillStyle = adjustAlpha(t.fg, 0.3)
      ctx.textAlign = 'right'
      ctx.fillText(String(i + 1), pad + lineNumWidth - pad * 0.8, y + fontSize)
    }

    // 高亮代码
    const tokens = highlightLine(lines[i], language.value)
    let x = pad + lineNumWidth
    ctx.textAlign = 'left'

    for (const token of tokens) {
      ctx.fillStyle = token.color ? t[token.color] : t.fg
      ctx.fillText(token.text, x, y + fontSize)
      x += token.text.length * charWidth
    }
  }
}

// Canvas 辅助：圆角矩形
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function roundRectTop(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h)
  ctx.lineTo(x, y + h)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

// 调整颜色透明度
function adjustAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// 下载图片
function downloadImage() {
  const canvas = previewCanvas.value
  if (!canvas) return
  const link = document.createElement('a')
  link.download = `code-card-${language.value}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

// 复制代码
function copyCode() {
  navigator.clipboard.writeText(code.value).then(() => alert('已复制代码到剪贴板'))
}

// 监听设置变化
watch([theme, showLineNumbers, borderRadius, padding, titleBar, language], () => {
  if (code.value.trim()) nextTick(renderPreview)
})

onMounted(() => {
  window.addEventListener('resize', () => { if (code.value.trim()) renderPreview() })
})
</script>

<style scoped>
.tool-page { padding-top: 0.5rem; }
h2 { font-size: 1.6rem; margin-bottom: 0.3rem; }
h3 { font-size: 1rem; color: #555; margin-bottom: 0.6rem; }
.subtitle { color: #888; font-size: 0.95rem; margin-bottom: 1.5rem; }

.section {
  background: white;
  border-radius: 12px;
  padding: 1.2rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border: 1px solid #eee;
}

.section label {
  display: block;
  font-weight: 600;
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 0.6rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.section-header label { margin-bottom: 0; }

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.select-lang {
  padding: 0.35rem 0.6rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.8rem;
  color: #555;
  background: #f8f9fa;
  outline: none;
}

.select-lang:focus { border-color: #22c55e; }

.btn-sm {
  padding: 0.3rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #f8f9fa;
  font-size: 0.8rem;
  color: #555;
  cursor: pointer;
}

.btn-sm:hover { background: #e8e9ea; }

.code-input {
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: 'Courier New', monospace;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  background: #1e1e2e;
  color: #cdd6f4;
  tab-size: 2;
}

.code-input:focus { border-color: #22c55e; }

.code-info {
  display: flex;
  gap: 1rem;
  margin-top: 0.4rem;
  font-size: 0.8rem;
  color: #aaa;
}

/* 设置区域 */
.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.setting-label {
  font-size: 0.85rem;
  color: #888;
  min-width: 60px;
}

.theme-buttons { display: flex; gap: 0.4rem; flex-wrap: wrap; }

.btn-theme {
  padding: 0.3rem 0.6rem;
  border: 2px solid transparent;
  border-radius: 6px;
  font-size: 0.75rem;
  color: white;
  cursor: pointer;
  opacity: 0.7;
  transition: all 0.2s;
}

.btn-theme.active { border-color: #22c55e; opacity: 1; }
.btn-theme:hover { opacity: 1; }

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  color: #555;
  cursor: pointer;
}

.toggle-label input { accent-color: #22c55e; }

.slider {
  flex: 1;
  max-width: 200px;
  accent-color: #22c55e;
}

.slider-value {
  font-size: 0.8rem;
  color: #888;
  font-family: monospace;
  min-width: 40px;
}

.input-title {
  flex: 1;
  max-width: 300px;
  padding: 0.4rem 0.6rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.85rem;
  outline: none;
}

.input-title:focus { border-color: #22c55e; }

/* 预览 */
.preview-section { padding: 1.2rem; }

.preview-area {
  background: #f0f0f0;
  border-radius: 8px;
  padding: 20px;
  overflow-x: auto;
  display: flex;
  justify-content: center;
}

.preview-area canvas {
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}

/* 操作按钮 */
.action-bar { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1.5rem; }

.btn-copy {
  padding: 0.6rem 1.5rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  font-weight: 600;
}

.btn-copy:hover { opacity: 0.85; }
.btn-copy2 { background: linear-gradient(135deg, #6366f1, #8b5cf6); }

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #22c55e;
  font-weight: 500;
}

.back-link:hover { text-decoration: underline; }

@media (max-width: 640px) {
  .header-actions { width: 100%; }
  .setting-item { flex-direction: column; align-items: flex-start; }
}
</style>
