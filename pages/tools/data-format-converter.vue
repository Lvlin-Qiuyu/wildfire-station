<template>
  <div class="tool-page">
    <h2>🔄 数据格式互转器</h2>
    <p class="subtitle">CSV / JSON / YAML / XML / Markdown 表格互相转换，粘贴即转</p>

    <!-- 格式选择 -->
    <div class="format-bar">
      <div class="format-group">
        <label>输入格式</label>
        <select v-model="inputFormat" class="format-select">
          <option value="csv">CSV</option>
          <option value="json">JSON</option>
          <option value="yaml">YAML</option>
          <option value="xml">XML</option>
          <option value="md">Markdown 表格</option>
          <option value="auto">自动识别</option>
        </select>
      </div>
      <div class="swap-icon" title="交换输入输出">⇄</div>
      <div class="format-group">
        <label>输出格式</label>
        <select v-model="outputFormat" class="format-select">
          <option value="csv">CSV</option>
          <option value="json">JSON</option>
          <option value="yaml">YAML</option>
          <option value="xml">XML</option>
          <option value="md">Markdown 表格</option>
        </select>
      </div>
    </div>

    <!-- 双栏编辑器 -->
    <div class="editor-area">
      <div class="panel">
        <div class="panel-header">
          <label>输入</label>
          <span class="btn-clear" @click="inputText = ''; outputText = ''; errorMsg = ''">清空</span>
        </div>
        <div
          class="drop-zone"
          :class="{ 'drag-over': isDragOver }"
          @dragover.prevent="isDragOver = true"
          @dragleave.prevent="isDragOver = false"
          @drop.prevent="handleFileDrop"
        >
          <textarea
            v-model="inputText"
            placeholder="粘贴数据，或拖拽文件到此处..."
            rows="14"
            spellcheck="false"
            @input="convert"
          ></textarea>
        </div>
        <div class="file-upload-row">
          <button class="btn-upload" @click="fileInputRef?.click()">📁 上传文件</button>
          <input type="file" ref="fileInputRef" accept=".csv,.json,.yaml,.yml,.xml,.md,.txt" class="hidden" @change="handleFileSelect" />
          <span v-if="fileName" class="file-name">📄 {{ fileName }}</span>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <label>输出</label>
          <div class="output-actions">
            <span v-if="outputText" class="btn-copy" @click="copyOutput">{{ copyLabel }}</span>
            <span v-if="outputText" class="btn-download" @click="downloadOutput">⬇ 下载</span>
          </div>
        </div>
        <textarea
          :value="outputText"
          readonly
          rows="14"
          class="output-area"
          placeholder="转换结果将显示在这里..."
        ></textarea>
        <div v-if="errorMsg" class="error-msg">⚠️ {{ errorMsg }}</div>
      </div>
    </div>

    <div class="notice">
      <p>💡 所有转换在浏览器本地完成，数据不会上传到任何服务器。YAML 解析使用 js-yaml 库。</p>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({
  title: '数据格式互转器 - 野火小站',
  script: [{ src: 'https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js', defer: true }],
})

const inputText = ref('')
const inputFormat = ref('auto')
const outputFormat = ref('json')
const outputText = ref('')
const errorMsg = ref('')
const isDragOver = ref(false)
const fileInputRef = ref(null)
const fileName = ref('')
const copyLabel = ref('复制')

// ==================== 文件处理 ====================
function readFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.readAsText(file)
  })
}

async function handleFileDrop(e) {
  isDragOver.value = false
  const file = e.dataTransfer.files[0]
  if (file) await loadFile(file)
}

async function handleFileSelect(e) {
  const file = e.target.files[0]
  if (file) await loadFile(file)
}

async function loadFile(file) {
  fileName.value = file.name
  // 根据扩展名自动选择输入格式
  const ext = file.name.split('.').pop().toLowerCase()
  const formatMap = { csv: 'csv', json: 'json', yaml: 'yaml', yml: 'yaml', xml: 'xml', md: 'md', markdown: 'md', txt: 'auto' }
  if (formatMap[ext] && inputFormat.value === 'auto') {
    inputFormat.value = formatMap[ext]
  }
  inputText.value = await readFile(file)
  convert()
}

function downloadOutput() {
  const extMap = { csv: 'csv', json: 'json', yaml: 'yaml', xml: 'xml', md: 'md' }
  const ext = extMap[outputFormat.value] || 'txt'
  const blob = new Blob([outputText.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `converted.${ext}`
  a.click()
  URL.revokeObjectURL(url)
}

function copyOutput() {
  navigator.clipboard.writeText(outputText.value).then(() => {
    copyLabel.value = '已复制 ✓'
    setTimeout(() => { copyLabel.value = '复制' }, 1500)
  })
}

// ==================== 格式识别 ====================
function detectFormat(text) {
  const trimmed = text.trim()
  if (!trimmed) return 'csv'
  // JSON
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try { JSON.parse(trimmed); return 'json' } catch {}
  }
  // XML
  if (trimmed.startsWith('<') && trimmed.endsWith('>') && /<\w+/.test(trimmed)) return 'xml'
  // Markdown 表格
  if (trimmed.includes('|') && /^\|.*\|/.test(trimmed.split('\n')[0])) return 'md'
  // YAML（以- 开头或 key: value 模式）
  if (/^[\w-]+(\s*:\s*|\s*:\n)/m.test(trimmed) || /^-\s+/m.test(trimmed)) return 'yaml'
  // 默认 CSV
  return 'csv'
}

// ==================== 统一中间格式：对象数组 ====================
// 先把任意格式转为统一的二维数组（表头+行数据），再转为目标格式

function parseToTable(text, fmt) {
  const trimmed = text.trim()
  if (fmt === 'auto') fmt = detectFormat(trimmed)

  if (fmt === 'json') return parseJson(trimmed)
  if (fmt === 'csv') return parseCsv(trimmed)
  if (fmt === 'yaml') return parseYaml(trimmed)
  if (fmt === 'xml') return parseXml(trimmed)
  if (fmt === 'md') return parseMd(trimmed)
  return null
}

// JSON → 表
function parseJson(text) {
  const data = JSON.parse(text)
  const arr = Array.isArray(data) ? data : [data]
  if (arr.length === 0) return null
  const keys = Object.keys(arr[0])
  return { headers: keys, rows: arr.map(item => keys.map(k => item[k] ?? '')) }
}

// CSV → 表（支持引号）
function parseCsv(text) {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length === 0) return null
  const parseRow = (line) => {
    const result = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') { current += '"'; i++ }
        else if (ch === '"') { inQuotes = false }
        else current += ch
      } else {
        if (ch === '"') inQuotes = true
        else if (ch === ',') { result.push(current.trim()); current = '' }
        else current += ch
      }
    }
    result.push(current.trim())
    return result
  }
  const headers = parseRow(lines[0])
  const rows = lines.slice(1).map(parseRow)
  return { headers, rows }
}

// YAML → 表（使用全局 window.jsyaml，CDN加载）
function parseYaml(text) {
  if (typeof window !== 'undefined' && window.jsyaml) {
    const data = window.jsyaml.load(text)
    if (data && typeof data === 'object') {
      const arr = Array.isArray(data) ? data : [data]
      if (arr.length === 0) return null
      const keys = Object.keys(arr[0])
      return { headers: keys, rows: arr.map(item => keys.map(k => item[k] ?? '')) }
    }
  }
  throw new Error('YAML 解析失败，请确认 js-yaml 库已加载')
}

// XML → 表
function parseXml(text) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'text/xml')
  const errorNode = doc.querySelector('parsererror')
  if (errorNode) throw new Error('XML 解析失败：' + errorNode.textContent.slice(0, 80))

  const rows = Array.from(doc.documentElement.children).map(el => {
    return Array.from(el.children).map(child => child.textContent)
  })
  if (rows.length === 0) throw new Error('XML 中未找到行数据')

  // 从第一行提取列名
  const headers = rows[0].length > 0
    ? Array.from(doc.documentElement.children[0].children).map(c => c.tagName)
    : ['value']
  return { headers, rows }
}

// Markdown 表格 → 表
function parseMd(text) {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) throw new Error('Markdown 表格至少需要表头和分隔行')
  const headers = lines[0].split('|').map(s => s.trim()).filter(Boolean)
  // 跳过分隔行（第二行：|---|---|）
  const rows = lines.slice(2).map(line =>
    line.split('|').map(s => s.trim()).filter(Boolean)
  )
  return { headers, rows }
}

// ==================== 表 → 目标格式 ====================
function tableToFormat(table, fmt) {
  if (!table) return ''
  const { headers, rows } = table

  if (fmt === 'json') {
    const arr = rows.map(row => {
      const obj = {}
      headers.forEach((h, i) => { obj[h] = row[i] ?? '' })
      return obj
    })
    return JSON.stringify(arr, null, 2)
  }

  if (fmt === 'csv') {
    const escape = (v) => {
      const s = String(v)
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
    }
    const lines = [headers.map(escape).join(',')]
    rows.forEach(row => { lines.push(row.map(escape).join(',')) })
    return lines.join('\n')
  }

  if (fmt === 'yaml') {
    const arr = rows.map(row => {
      const obj = {}
      headers.forEach((h, i) => {
        const v = row[i]
        obj[h] = (typeof v === 'string' && (v === '' || isNaN(v))) ? v : (isNaN(Number(v)) ? v : Number(v))
      })
      return obj
    })
    if (typeof window !== 'undefined' && window.jsyaml) {
      return window.jsyaml.dump(arr, { indent: 2, lineWidth: -1, quotingType: '"' })
    }
    return JSON.stringify(arr, null, 2) // 回退
  }

  if (fmt === 'xml') {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<data>\n'
    rows.forEach(row => {
      xml += '  <row>\n'
      headers.forEach((h, i) => {
        const tag = h.replace(/[^a-zA-Z0-9_\u4e00-\u9fff]/g, '_') || 'col' + i
        const val = String(row[i] ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        xml += `    <${tag}>${val}</${tag}>\n`
      })
      xml += '  </row>\n'
    })
    xml += '</data>'
    return xml
  }

  if (fmt === 'md') {
    // 计算每列最大宽度
    const allRows = [headers, ...rows]
    const widths = headers.map((_, ci) =>
      Math.max(...allRows.map(r => String(r[ci] ?? '').length))
    )
    const pad = (s, w) => String(s).padEnd(w)
    const sep = widths.map(w => '-'.repeat(w + 2)).join('|')
    let md = '| ' + headers.map((h, i) => pad(h, widths[i])).join(' | ') + ' |\n'
    md += '|' + sep + '|\n'
    rows.forEach(row => {
      md += '| ' + row.map((v, i) => pad(v ?? '', widths[i])).join(' | ') + ' |\n'
    })
    return md
  }

  return ''
}

// ==================== 主转换逻辑 ====================
function convert() {
  errorMsg.value = ''
  outputText.value = ''

  if (!inputText.value.trim()) return

  try {
    const fmt = inputFormat.value === 'auto' ? detectFormat(inputText.value) : inputFormat.value
    const table = parseToTable(inputText.value, fmt)
    outputText.value = tableToFormat(table, outputFormat.value)
  } catch (e) {
    errorMsg.value = e.message || '转换失败，请检查输入数据格式'
  }
}

// ==================== 监听格式切换 ====================
watch([inputFormat, outputFormat], convert)
</script>

<style scoped>
.tool-page {
  padding-top: 0.5rem;
}
h2 {
  font-size: 1.6rem;
  margin-bottom: 0.3rem;
}
.subtitle {
  color: #888;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
}

/* 格式选择栏 */
.format-bar {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 1.2rem;
  flex-wrap: wrap;
}
.format-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.format-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #555;
}
.format-select {
  padding: 0.5rem 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
}
.format-select:focus {
  outline: none;
  border-color: #10b981;
}
.swap-icon {
  font-size: 1.4rem;
  color: #10b981;
  padding-bottom: 0.3rem;
}

/* 编辑区 */
.editor-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}
.panel {
  display: flex;
  flex-direction: column;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
}
.panel-header label {
  font-weight: 600;
  font-size: 0.95rem;
}
.btn-clear {
  font-size: 0.82rem;
  color: #888;
  cursor: pointer;
}
.btn-clear:hover {
  color: #e74c3c;
}
.output-actions {
  display: flex;
  gap: 0.5rem;
}

.drop-zone {
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
  transition: border-color 0.2s;
}
.drop-zone.drag-over {
  border-color: #22c55e;
}

textarea {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 10px;
  font-family: 'Courier New', monospace;
  font-size: 0.88rem;
  resize: vertical;
  background: white;
  line-height: 1.5;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
textarea:focus {
  outline: none;
}
.output-area {
  background: #f9f9f9;
  color: #333;
}

.error-msg {
  background: #fef2f2;
  color: #dc2626;
  padding: 0.6rem 0.8rem;
  border-radius: 6px;
  margin-top: 0.5rem;
  font-size: 0.85rem;
}

.file-upload-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-top: 0.5rem;
}
.btn-upload {
  padding: 0.35rem 0.8rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-upload:hover {
  border-color: #10b981;
  color: #22c55e;
}
.file-name {
  font-size: 0.82rem;
  color: #888;
}
.hidden {
  display: none;
}

.btn-copy, .btn-download {
  padding: 0.3rem 0.7rem;
  border-radius: 6px;
  font-size: 0.82rem;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn-copy {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
}
.btn-download {
  background: #e9ecef;
  color: #555;
}
.btn-copy:hover, .btn-download:hover {
  opacity: 0.85;
}

.notice {
  background: #f8fff8;
  border-radius: 10px;
  padding: 1rem 1.2rem;
  margin-bottom: 1.5rem;
}
.notice p {
  font-size: 0.85rem;
  color: #666;
}

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #22c55e;
  font-weight: 500;
}
.back-link:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .editor-area {
    grid-template-columns: 1fr;
  }
}
</style>
