<template>
  <div class="tool-page">
    <h2>🧹 文本噪声清理器</h2>
    <p class="subtitle">检测并清除文本中的零宽字符、不可见控制字符、多余空白等隐藏噪声</p>

    <div class="editor-area">
      <!-- 左栏：输入 -->
      <div class="panel input-panel">
        <div class="panel-header">
          <span class="panel-title">粘贴文本</span>
          <button class="btn-sm" @click="pasteText">粘贴</button>
          <button class="btn-sm" @click="rawText = ''; scanResult = null">清空</button>
        </div>
        <textarea
          v-model="rawText"
          placeholder="粘贴需要检测的文本到这里..."
          class="editor"
          @input="debounceScan"
          @paste="onPaste"
        ></textarea>
        <div v-if="rawText" class="char-info">
          <span>字符数：{{ rawText.length }}</span>
          <span>字节数：{{ byteLength }}</span>
        </div>
      </div>

      <!-- 右栏：扫描结果 -->
      <div class="panel output-panel">
        <div class="panel-header">
          <span class="panel-title">扫描结果</span>
          <div v-if="scanResult" class="header-actions">
            <span class="noise-count" :class="{ 'has-noise': scanResult.totalFound > 0 }">
              发现 {{ scanResult.totalFound }} 处噪声
            </span>
            <button class="btn-sm btn-primary" @click="cleanSelected" :disabled="scanResult.totalFound === 0">
              清除选中类型
            </button>
            <button class="btn-sm" @click="selectAllTypes" v-if="!allTypesSelected">全选</button>
            <button class="btn-sm" @click="deselectAllTypes" v-else>取消全选</button>
          </div>
        </div>
        <div v-if="!rawText" class="preview placeholder">
          粘贴文本后自动扫描，发现噪声会分类列出
        </div>
        <div v-else-if="scanResult && scanResult.totalFound === 0" class="preview clean-result">
          ✅ 未发现噪声，文本干净
        </div>
        <div v-else-if="scanResult" class="result-area">
          <!-- 噪声分类复选框 -->
          <div class="noise-categories">
            <label
              v-for="cat in noiseCategories"
              :key="cat.key"
              :class="['category-check', { 'no-items': !cat.count }]"
            >
              <input
                type="checkbox"
                v-model="selectedTypes"
                :value="cat.key"
                :disabled="cat.count === 0"
              />
              <span class="cat-icon">{{ cat.icon }}</span>
              <span class="cat-name">{{ cat.name }}</span>
              <span class="cat-count" v-if="cat.count > 0">{{ cat.count }}</span>
            </label>
          </div>

          <!-- 噪声详情列表 -->
          <div class="noise-details">
            <h4>噪声位置详情</h4>
            <div class="noise-list">
              <div
                v-for="item in visibleNoiseItems"
                :key="item.index"
                class="noise-item"
              >
                <span class="noise-pos">位置 {{ item.index }}</span>
                <span class="noise-char" :title="'U+' + item.charCode.toString(16).toUpperCase().padStart(4, '0')">
                  {{ item.display }}
                </span>
                <span class="noise-type">{{ item.categoryName }}</span>
                <span class="noise-unicode">
                  U+{{ item.charCode.toString(16).toUpperCase().padStart(4, '0') }}
                </span>
                <span class="noise-context" :title="item.context">"...{{ item.context }}..."</span>
              </div>
            </div>
          </div>

          <!-- 清理后预览 -->
          <div class="clean-preview" v-if="cleanedText !== rawText">
            <h4>清理后预览</h4>
            <div class="diff-view">
              <div class="diff-line removed" v-for="(line, i) in diffRemovedLines" :key="'r' + i">
                <span class="diff-marker">-</span>
                <span>{{ line }}</span>
              </div>
              <div class="diff-line added" v-for="(line, i) in diffAddedLines" :key="'a' + i">
                <span class="diff-marker">+</span>
                <span>{{ line }}</span>
              </div>
            </div>
            <div class="clean-actions">
              <button class="btn-sm btn-primary" @click="copyCleaned">复制清理后文本</button>
              <button class="btn-sm" @click="downloadCleaned">下载</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 示例文本 -->
    <div class="examples">
      <h4>📝 测试用示例（点击插入包含噪声的文本）</h4>
      <div class="example-buttons">
        <button class="btn-sm" @click="insertExample('zerowidth')">零宽字符示例</button>
        <button class="btn-sm" @click="insertExample('bom')">BOM头示例</button>
        <button class="btn-sm" @click="insertExample('control')">控制字符示例</button>
        <button class="btn-sm" @click="insertExample('spaces')">多余空白示例</button>
        <button class="btn-sm" @click="insertExample('mixed')">混合噪声示例</button>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '文本噪声清理器 - 野火小站' })

const rawText = ref('')
const scanResult = ref(null)
const selectedTypes = ref([])
let scanTimer = null

// 噪声分类定义
const noiseCategoryDefs = [
  { key: 'zerowidth', name: '零宽字符', icon: '🔍' },
  { key: 'bom', name: 'BOM头', icon: '📄' },
  { key: 'control', name: '控制字符', icon: '⌨️' },
  { key: 'direction', name: '方向控制字符', icon: '↔️' },
  { key: 'extraspace', name: '多余空白', icon: '📐' },
  { key: 'homoglyph', name: '同形异义字符', icon: '👁️' },
]

// 噪声分类统计
const noiseCategories = computed(() => {
  if (!scanResult.value) return noiseCategoryDefs.map(d => ({ ...d, count: 0 }))
  return noiseCategoryDefs.map(d => ({
    ...d,
    count: (scanResult.value.items || []).filter(i => i.category === d.key).length,
  }))
})

// 是否全部选中
const allTypesSelected = computed(() => {
  const activeKeys = noiseCategories.value.filter(c => c.count > 0).map(c => c.key)
  return activeKeys.length > 0 && activeKeys.every(k => selectedTypes.value.includes(k))
})

// 当前选中类型的噪声项
const visibleNoiseItems = computed(() => {
  if (!scanResult.value) return []
  return scanResult.value.items.filter(i => selectedTypes.value.includes(i.category))
})

// 字节数
const byteLength = computed(() => {
  return new Blob([rawText.value]).size
})

// 清理后的文本
const cleanedText = computed(() => {
  if (!rawText.value || !scanResult.value) return rawText.value
  const text = rawText.value
  const removeCodes = new Set()

  // 收集选中类型要删除的字符编码
  for (const item of scanResult.value.items) {
    if (selectedTypes.value.includes(item.category)) {
      removeCodes.add(item.charCode)
    }
  }

  // 额外空白处理：多个连续空格/tab变单个，连续空行变单个
  let result = ''
  const cleanExtraspace = selectedTypes.value.includes('extraspace')
  const lines = text.split('\n')
  for (let li = 0; li < lines.length; li++) {
    let line = ''
    for (let ci = 0; ci < lines[li].length; ci++) {
      const code = lines[li].charCodeAt(ci)
      if (code === 0x09 || code === 0x20) {
        // tab或空格：如果选了extraspace，连续多个变单个
        if (cleanExtraspace) {
          const prev = line.length > 0 ? line.charCodeAt(line.length - 1) : -1
          if (prev === 0x20 || prev === 0x09) continue
        }
        if (removeCodes.has(code)) continue
      }
      if (removeCodes.has(code)) continue
      line += lines[li][ci]
    }
    result += line
    if (li < lines.length - 1) {
      if (cleanExtraspace) {
        // 连续空行变单个
        const prevEndsEmpty = line.trim() === ''
        const nextStartsEmpty = (li + 1 < lines.length) ? lines[li + 1].trim() === '' : true
        // 在 result 末尾检查
        const prevLines = result.split('\n')
        const lastLine = prevLines[prevLines.length - 1] || ''
        if (lastLine.trim() === '' && nextStartsEmpty) continue
      }
      result += '\n'
    }
  }
  return result
})

// 差异行（简化版）
const diffRemovedLines = computed(() => {
  return getDiffLines(rawText.value, 'removed')
})

const diffAddedLines = computed(() => {
  return getDiffLines(cleanedText.value, 'added')
})

function getDiffLines(text, type) {
  if (!text) return []
  // 只显示前后5行差异附近的上下文
  const lines = text.split('\n')
  const maxShow = 8
  if (lines.length <= maxShow) return lines.slice(0, maxShow)
  return lines.slice(0, maxShow - 1).concat(['... (共 ' + lines.length + ' 行)'])
}

// 扫描文本中的噪声
function scanText(text) {
  if (!text) {
    scanResult.value = { items: [], totalFound: 0 }
    return
  }

  const items = []

  // 零宽字符范围
  const zeroWidthCodes = new Set([
    0x200B, // 零宽空格
    0x200C, // 零宽非连接符
    0x200D, // 零宽连接符
    0xFEFF, // BOM / 零宽不换行空格
    0x2060, // 单词连接符
    0x180E, // 蒙古元音分隔符
  ])

  // BOM头
  const bomCodes = new Set([0xFEFF])

  // 不可见控制字符（排除换行、回车、制表符）
  const controlCodes = new Set()
  for (let i = 0; i <= 0x1F; i++) {
    if (i !== 0x09 && i !== 0x0A && i !== 0x0D) {
      controlCodes.add(i)
    }
  }
  // DEL
  controlCodes.add(0x7F)
  // C1控制字符（排除常用格式字符）
  for (let i = 0x80; i <= 0x9F; i++) {
    controlCodes.add(i)
  }

  // 方向控制字符
  const directionCodes = new Set([
    0x200E, // LTR标记
    0x200F, // RTL标记
    0x202A, // LTR嵌入
    0x202B, // RTL嵌入
    0x202C, // 弹出方向格式
    0x202D, // LTR覆盖
    0x202E, // RTL覆盖
    0x2066, // LTR隔离
    0x2067, // RTL隔离
    0x2068, // 首字符隔离
    0x2069, // 弹出隔离
  ])

  // 同形异义字符（常见混淆）
  const homoglyphMap = {
    '\u0430': 'a', '\u0435': 'e', '\u043E': 'o', '\u0440': 'p',
    '\u0441': 'c', '\u0445': 'x', '\u0443': 'y', '\u0455': 's',
    '\u00AD': '-', '\u0438': 'u',
  }
  const homoglyphCodes = new Set(Object.keys(homoglyphMap).map(k => k.charCodeAt(0)))

  // 额外空白检测：连续3+个空格/tab，连续3+个空行
  let prevWasSpaceRun = false
  let spaceRunStart = -1
  let consecutiveEmptyLines = 0
  let prevLineEmpty = false

  const lines = text.split('\n')

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li]

    // 检查空行
    if (line.trim() === '') {
      consecutiveEmptyLines++
      if (consecutiveEmptyLines >= 3 && li > 0) {
        // 标记为多余空白（第3行起）
        const startIdx = lineIndexToGlobalIndex(lines, li, 0)
        items.push({
          index: startIdx,
          charCode: 0x0A,
          char: '\n',
          category: 'extraspace',
          categoryName: '多余空白',
          display: '空行',
          context: getContext(text, startIdx),
        })
      }
      prevLineEmpty = true
      continue
    } else {
      consecutiveEmptyLines = 0
      prevLineEmpty = false
    }

    // 检查行内字符
    let runLen = 0
    let runStart = -1
    for (let ci = 0; ci < line.length; ci++) {
      const char = line[ci]
      const code = line.charCodeAt(ci)
      const globalIdx = lineIndexToGlobalIndex(lines, li, ci)

      // 连续空格/tab检测
      if (code === 0x20 || code === 0x09) {
        runLen++
        if (runLen === 1) runStart = globalIdx
      } else {
        if (runLen >= 3) {
          items.push({
            index: runStart,
            charCode: code === 0x20 ? 0x20 : 0x09,
            char: code === 0x20 ? ' ' : '\t',
            category: 'extraspace',
            categoryName: '多余空白',
            display: `${runLen}个${code === 0x09 ? 'Tab' : '空格'}`,
            context: getContext(text, runStart),
          })
        }
        runLen = 0
      }

      // 零宽字符
      if (zeroWidthCodes.has(code) && !bomCodes.has(code) || (code === 0xFEFF && globalIdx > 0)) {
        items.push({
          index: globalIdx,
          charCode: code,
          char: char,
          category: 'zerowidth',
          categoryName: '零宽字符',
          display: getCharName(code),
          context: getContext(text, globalIdx),
        })
      }

      // BOM（仅文件开头）
      if (bomCodes.has(code) && globalIdx === 0) {
        items.push({
          index: globalIdx,
          charCode: code,
          char: char,
          category: 'bom',
          categoryName: 'BOM头',
          display: 'U+FEFF',
          context: getContext(text, globalIdx),
        })
      }

      // 控制字符
      if (controlCodes.has(code) && !zeroWidthCodes.has(code) && !bomCodes.has(code)) {
        items.push({
          index: globalIdx,
          charCode: code,
          char: char,
          category: 'control',
          categoryName: '控制字符',
          display: getCharName(code),
          context: getContext(text, globalIdx),
        })
      }

      // 方向控制字符
      if (directionCodes.has(code)) {
        items.push({
          index: globalIdx,
          charCode: code,
          char: char,
          category: 'direction',
          categoryName: '方向控制字符',
          display: getCharName(code),
          context: getContext(text, globalIdx),
        })
      }

      // 同形异义字符
      if (homoglyphCodes.has(code)) {
        items.push({
          index: globalIdx,
          charCode: code,
          char: char,
          category: 'homoglyph',
          categoryName: '同形异义字符',
          display: `${char} → ${homoglyphMap[char]}`,
          context: getContext(text, globalIdx),
        })
      }
    }

    // 行末连续空格/tab
    if (runLen >= 3) {
      const startIdx = lineIndexToGlobalIndex(lines, li, line.length - runLen)
      items.push({
        index: startIdx,
        charCode: 0x20,
        char: ' ',
        category: 'extraspace',
        categoryName: '多余空白',
        display: `${runLen}个尾部空格`,
        context: getContext(text, startIdx),
      })
    }
  }

  scanResult.value = { items, totalFound: items.length }

  // 默认选中所有有噪声的类型
  const typesWithItems = [...new Set(items.map(i => i.category))]
  selectedTypes.value = typesWithItems
}

function lineIndexToGlobalIndex(lines, lineIdx, colIdx) {
  let idx = 0
  for (let i = 0; i < lineIdx; i++) {
    idx += lines[i].length + 1 // +1 for \n
  }
  return idx + colIdx
}

function getContext(text, pos) {
  const start = Math.max(0, pos - 8)
  const end = Math.min(text.length, pos + 8)
  let ctx = ''
  for (let i = start; i < end; i++) {
    const code = text.charCodeAt(i)
    if (code === 0x0A) ctx += '↵'
    else if (code === 0x09) ctx += '→'
    else if (code < 0x20 || code === 0x7F) ctx += `\\x${code.toString(16).padStart(2, '0')}`
    else if (code >= 0x80 && code <= 0x9F) ctx += `\\x${code.toString(16).padStart(2, '0')}`
    else if (code >= 0x200B && code <= 0x2069) ctx += `[${code.toString(16).toUpperCase()}]`
    else ctx += text[i]
  }
  return ctx
}

function getCharName(code) {
  const names = {
    0x200B: '零宽空格', 0x200C: '零宽非连接符', 0x200D: '零宽连接符',
    0xFEFF: 'BOM/ZWNBS', 0x2060: '单词连接符', 0x180E: '蒙古元音分隔符',
    0x200E: 'LTR标记', 0x200F: 'RTL标记', 0x202A: 'LTR嵌入',
    0x202B: 'RTL嵌入', 0x202C: '弹出方向', 0x202D: 'LTR覆盖',
    0x202E: 'RTL覆盖', 0x2066: 'LTR隔离', 0x2067: 'RTL隔离',
    0x2068: '首字符隔离', 0x2069: '弹出隔离', 0x00AD: '软连字符',
    0x00: 'NUL', 0x01: 'SOH', 0x02: 'STX', 0x03: 'ETX',
    0x04: 'EOT', 0x05: 'ENQ', 0x06: 'ACK', 0x07: 'BEL',
    0x08: 'BS', 0x0B: 'VT', 0x0C: 'FF', 0x0E: 'SO',
    0x0F: 'SI', 0x10: 'DLE', 0x11: 'DC1', 0x12: 'DC2',
    0x13: 'DC3', 0x14: 'DC4', 0x15: 'NAK', 0x16: 'SYN',
    0x17: 'ETB', 0x18: 'CAN', 0x19: 'EM', 0x1A: 'SUB',
    0x1B: 'ESC', 0x1C: 'FS', 0x1D: 'GS', 0x1E: 'RS',
    0x1F: 'US', 0x7F: 'DEL',
  }
  return names[code] || `U+${code.toString(16).toUpperCase().padStart(4, '0')}`
}

// 防抖扫描
function debounceScan() {
  clearTimeout(scanTimer)
  scanTimer = setTimeout(() => scanText(rawText.value), 300)
}

function onPaste() {
  nextTick(() => scanText(rawText.value))
}

// 清除选中类型
function cleanSelected() {
  rawText.value = cleanedText.value
  scanText(rawText.value)
}

// 全选/取消全选
function selectAllTypes() {
  selectedTypes.value = noiseCategories.value.filter(c => c.count > 0).map(c => c.key)
}

function deselectAllTypes() {
  selectedTypes.value = []
}

// 复制清理后文本
function copyCleaned() {
  navigator.clipboard.writeText(cleanedText.value).catch(() => {
    fallbackCopy(cleanedText.value)
  })
}

function downloadCleaned() {
  const blob = new Blob([cleanedText.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'cleaned-text.txt'
  a.click()
  URL.revokeObjectURL(url)
}

// 粘贴
async function pasteText() {
  try {
    const text = await navigator.clipboard.readText()
    rawText.value = text
    scanText(text)
  } catch {
    // 浏览器不支持
  }
}

// 降级复制
function fallbackCopy(text) {
  const ta = document.createElement('textarea')
  ta.value = text
  document.body.appendChild(ta)
  ta.select()
  document.execCommand('copy')
  document.body.removeChild(ta)
}

// 示例文本
function insertExample(type) {
  const examples = {
    zerowidth: 'Hello\u200BWorld\u200C\u200D!\uFEFF你好世界',
    bom: '\uFEFF这是带BOM头的文本，可能导致编码问题。',
    control: '这段文本\u0001包含\u0003一些\u0007不可见\u001B控制\u007F字符。',
    direction: '这是一个包含\u200E方向\u200F控制\u202A字符\u202C的文本。',
    spaces: '这段文本    有很多    多余的空格\t\t\t和Tab。\n\n\n\n\n连续空行。\n\n\n更多空行。',
    mixed: '\uFEFFHello\u200B \u200CWorld\u200D!\n\n\n这段文本\u0001有\u0003很多\u200E问题\u202C    \t\t\t多余空格。',
  }
  rawText.value = examples[type] || ''
  scanText(rawText.value)
}
</script>

<style scoped>
.tool-page { padding-top: 0.5rem; }
h2 { font-size: 1.6rem; margin-bottom: 0.3rem; }
.subtitle { color: #888; font-size: 0.95rem; margin-bottom: 1.5rem; }

.editor-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.panel {
  background: white;
  border: 1px solid #eee;
  border-radius: 12px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 1rem;
  background: #fafafa;
  border-bottom: 1px solid #eee;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.panel-title { font-weight: 600; font-size: 0.9rem; color: #555; }

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.noise-count {
  font-size: 0.8rem;
  color: #22c55e;
  margin-right: 0.3rem;
}
.noise-count.has-noise {
  color: #ef4444;
}

.btn-sm {
  padding: 0.25rem 0.7rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 0.8rem;
  cursor: pointer;
  color: #666;
}
.btn-sm:hover { border-color: #10b981; color: #22c55e; }
.btn-sm:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-sm.btn-primary {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
}
.btn-sm.btn-primary:hover { opacity: 0.85; }

.editor {
  width: 100%;
  min-height: 280px;
  padding: 1rem;
  border: none;
  font-size: 0.95rem;
  line-height: 1.6;
  resize: vertical;
  font-family: inherit;
  background: white;
  box-sizing: border-box;
}
.editor:focus { outline: none; }

.char-info {
  padding: 0.5rem 1rem;
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: #aaa;
  border-top: 1px solid #f0f0f0;
}

.preview {
  padding: 1rem;
  min-height: 280px;
  line-height: 1.6;
  font-size: 0.95rem;
  color: #333;
  white-space: pre-wrap;
  word-break: break-all;
}
.preview.placeholder {
  color: #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
}
.clean-result {
  color: #22c55e;
  font-size: 1.1rem;
  font-weight: 600;
}

.result-area {
  padding: 1rem;
  max-height: 500px;
  overflow-y: auto;
}

.noise-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.category-check {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.6rem;
  background: #f9fafb;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.82rem;
  transition: all 0.2s;
}
.category-check:hover { background: #f0fdf4; }
.category-check.no-items { opacity: 0.4; }
.category-check input { accent-color: #22c55e; }
.cat-icon { font-size: 0.9rem; }
.cat-name { color: #555; }
.cat-count {
  background: #fee2e2;
  color: #ef4444;
  padding: 0 6px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
}

.noise-details h4 {
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 0.5rem;
}

.noise-list {
  margin-bottom: 1rem;
}

.noise-item {
  display: grid;
  grid-template-columns: auto auto auto auto 1fr;
  gap: 0.5rem;
  align-items: center;
  padding: 0.4rem 0.6rem;
  border-bottom: 1px solid #f0f0f0;
  font-size: 0.82rem;
}

.noise-pos { color: #888; }
.noise-char {
  background: #fef2f2;
  color: #ef4444;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.78rem;
}
.noise-type {
  color: #f59e0b;
  background: #fffbeb;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.78rem;
}
.noise-unicode {
  color: #888;
  font-family: monospace;
  font-size: 0.78rem;
}
.noise-context {
  color: #aaa;
  font-family: monospace;
  font-size: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.clean-preview h4 {
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 0.5rem;
}

.diff-view {
  background: #fafafa;
  border-radius: 8px;
  padding: 0.8rem;
  font-family: monospace;
  font-size: 0.82rem;
  margin-bottom: 0.8rem;
  max-height: 200px;
  overflow-y: auto;
}

.diff-line {
  padding: 0.15rem 0;
  display: flex;
  gap: 0.5rem;
}
.diff-marker {
  font-weight: 700;
  flex-shrink: 0;
}
.diff-line.removed .diff-marker { color: #ef4444; }
.diff-line.added .diff-marker { color: #22c55e; }

.clean-actions {
  display: flex;
  gap: 0.5rem;
}

.examples {
  background: #fafafa;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
}

.examples h4 {
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 0.6rem;
}

.example-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #22c55e;
  font-weight: 500;
}
.back-link:hover { text-decoration: underline; }

@media (max-width: 640px) {
  .editor-area { grid-template-columns: 1fr; }
  .noise-item {
    grid-template-columns: auto 1fr;
    gap: 0.3rem;
  }
  .noise-unicode, .noise-context { display: none; }
}
</style>
