<template>
  <div class="tool-page">
    <h2>📋 多文件文本批量对比器</h2>
    <p class="subtitle">支持 3 个以上文本并行对比，高亮各版本独有行、公共行、差异行，一键定位改动位置</p>

    <!-- 文本输入区域 -->
    <div class="diff-layout">
      <div class="input-panel">
        <div class="panel-header">
          <label>文本版本</label>
          <div class="panel-actions">
            <button class="btn-sm" @click="addVersion">+ 添加</button>
            <button class="btn-sm" @click="clearAll">清空</button>
          </div>
        </div>
        <div class="version-list">
          <div v-for="(ver, index) in versions" :key="ver.id" class="version-item">
            <div class="version-header">
              <input
                v-model="ver.name"
                class="version-name"
                :placeholder="'版本 ' + (index + 1)"
                spellcheck="false"
              />
              <span class="version-lines">{{ ver.text.split('\n').length }} 行</span>
              <button v-if="versions.length > 2" class="btn-remove" @click="removeVersion(index)">✕</button>
            </div>
            <textarea
              v-model="ver.text"
              class="version-textarea"
              placeholder="在此粘贴文本内容..."
              spellcheck="false"
              @input="onInputChange"
            ></textarea>
          </div>
        </div>
        <button class="btn-primary" @click="compare">开始对比</button>
      </div>

      <!-- 对比结果 -->
      <div class="result-panel">
        <div v-if="!result" class="empty-tip">
          <span class="tip-icon">🔍</span>
          <p>添加至少 2 个版本的文本，点击「开始对比」查看差异</p>
        </div>

        <div v-if="result" class="result-content">
          <!-- 统计信息 -->
          <div class="stats-bar">
            <div class="stat-item">
              <span class="stat-label">总行数</span>
              <span class="stat-value">{{ result.totalLines }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">公共行</span>
              <span class="stat-value common">{{ result.commonLines }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">差异行</span>
              <span class="stat-value diff">{{ result.diffLines }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">唯一行</span>
              <span class="stat-value unique">{{ result.uniqueLines }}</span>
            </div>
          </div>

          <!-- 图例 -->
          <div class="legend">
            <span class="legend-item"><span class="legend-dot common-dot"></span>公共行</span>
            <span class="legend-item"><span class="legend-dot diff-dot"></span>差异行</span>
            <span class="legend-item"><span class="legend-dot unique-dot"></span>仅此版本</span>
            <span class="legend-item"><span class="legend-dot empty-dot"></span>仅其他版本</span>
          </div>

          <!-- 列头 -->
          <div class="diff-table-header">
            <div class="col-line-num">#</div>
            <div
              v-for="ver in result.versions"
              :key="ver.id"
              class="col-version"
              :style="{ '--accent': getColor(index) }"
            >
              {{ ver.name }}
            </div>
          </div>

          <!-- 对比视图 -->
          <div class="diff-table" ref="diffTable">
            <div v-for="(row, ri) in result.rows" :key="ri" class="diff-row" :class="row.type">
              <div class="col-line-num">{{ ri + 1 }}</div>
              <div
                v-for="(cell, ci) in row.cells"
                :key="ci"
                class="diff-cell"
                :class="cell.state"
              >
                <span v-if="cell.state === 'present'" class="cell-text">{{ cell.text }}</span>
                <span v-else-if="cell.state === 'unique'" class="cell-text highlight-unique">{{ cell.text }}</span>
                <span v-else-if="cell.state === 'diff'" class="cell-text highlight-diff">{{ cell.text }}</span>
                <span v-else class="cell-text placeholder">—</span>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="action-bar">
            <button class="btn-copy" @click="copyResult">📋 复制结果</button>
            <button class="btn-copy btn-secondary" @click="copyHtml">📄 复制 HTML</button>
          </div>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '多文件文本批量对比器 - 野火小站' })

const diffTable = ref(null)

// 预设颜色
const versionColors = ['#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899', '#ef4444', '#06b6d4', '#f97316']

function getColor(index) {
  return versionColors[index % versionColors.length]
}

let nextId = 3

// 文本版本列表
const versions = reactive([
  { id: 1, name: '版本 A', text: '' },
  { id: 2, name: '版本 B', text: '' },
])

const result = ref(null)

// 添加版本
function addVersion() {
  if (versions.length >= 8) return
  versions.push({ id: nextId++, name: '版本 ' + String.fromCharCode(65 + versions.length), text: '' })
}

// 删除版本
function removeVersion(index) {
  versions.splice(index, 1)
  result.value = null
}

// 清空所有
function clearAll() {
  versions.forEach(v => v.text = '')
  result.value = null
}

// 输入变化防抖
let debounceTimer = null
function onInputChange() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    // 自动对比（如果有至少2个非空版本）
    const nonEmpty = versions.filter(v => v.text.trim())
    if (nonEmpty.length >= 2) compare()
  }, 500)
}

// 基于最长公共子序列(LCS)的多文本差异比较
function compare() {
  const nonEmpty = versions.filter(v => v.text.trim())
  if (nonEmpty.length < 2) return

  // 将每个版本文本按行分割
  const lineArrays = nonEmpty.map(v => v.text.split('\n'))

  // 收集所有唯一行
  const allLines = new Set()
  lineArrays.forEach(lines => lines.forEach(l => allLines.add(l)))

  // 构建公共序列：在所有版本中都出现的行（保持第一个版本的顺序）
  const firstLines = lineArrays[0]
  const commonSeq = firstLines.filter(line => {
    return lineArrays.every(arr => arr.includes(line))
  })

  // 为每个版本构建差异行
  const verResults = lineArrays.map(lines => {
    const unique = lines.filter(l => !commonSeq.includes(l))
    const common = lines.filter(l => commonSeq.includes(l))
    return { unique, common }
  })

  // 构建差异视图
  // 策略：逐行遍历，对齐公共行，标记差异
  const rows = buildDiffRows(lineArrays, commonSeq, nonEmpty)

  // 统计
  let totalLines = rows.length
  let commonLines = 0
  let diffLines = 0
  let uniqueLines = 0

  rows.forEach(row => {
    const states = row.cells.map(c => c.state)
    const allPresent = states.every(s => s === 'present')
    const allSame = allPresent && new Set(row.cells.map(c => c.text)).size <= 1

    if (allSame) commonLines++
    else if (states.some(s => s === 'unique')) uniqueLines++
    else diffLines++
  })

  result.value = {
    totalLines,
    commonLines,
    diffLines,
    uniqueLines,
    versions: nonEmpty.map(v => ({ id: v.id, name: v.name })),
    rows
  }
}

// 构建差异行
function buildDiffRows(lineArrays, commonSeq, verMeta) {
  const rows = []

  // 对每个版本，将行分为：公共行（按公共序列顺序）和独有行
  const verCommonMaps = lineArrays.map(lines => {
    // 为每个版本提取公共行的出现位置
    const positions = []
    lines.forEach((line, idx) => {
      if (commonSeq.includes(line)) {
        positions.push({ line, idx })
      }
    })
    return positions
  })

  // 以公共序列为骨架，在每个公共行之间插入各版本的独有行
  for (let i = 0; i <= commonSeq.length; i++) {
    const currentCommon = i < commonSeq.length ? commonSeq[i] : null
    const prevCommon = i > 0 ? commonSeq[i - 1] : null

    // 收集各版本在 prevCommon 和 currentCommon 之间的独有行
    const betweenLines = lineArrays.map((lines, vi) => {
      const startIdx = prevCommon ? lines.indexOf(prevCommon) : -1
      const endIdx = currentCommon ? lines.indexOf(currentCommon) : lines.length

      let slice
      if (startIdx === -1 && endIdx === lines.length) {
        // 在开头之前
        slice = currentCommon ? lines.slice(0, endIdx) : []
      } else if (startIdx === -1) {
        slice = []
      } else {
        slice = lines.slice(startIdx + 1, endIdx === -1 ? lines.length : endIdx)
      }

      // 过滤掉公共行
      return slice.filter(l => !commonSeq.includes(l))
    })

    // 找出最大的独有行组数
    const maxLen = Math.max(...betweenLines.map(l => l.length))

    for (let j = 0; j < maxLen; j++) {
      const cells = lineArrays.map((_, vi) => {
        const text = j < betweenLines[vi].length ? betweenLines[vi][j] : null
        return {
          text,
          state: text !== null ? 'unique' : 'empty'
        }
      })
      rows.push({ type: 'unique', cells })
    }

    // 添加当前公共行
    if (currentCommon) {
      const allSame = lineArrays.every(lines => lines.includes(currentCommon))
      const cells = lineArrays.map(() => ({
        text: currentCommon,
        state: 'present'
      }))
      rows.push({ type: 'common', cells })
    }
  }

  // 二次标记差异行：相同文本但不同出现位置
  rows.forEach(row => {
    if (row.type === 'common') {
      // 检查相邻差异行是否有相同的文本（说明是修改而非新增）
      return
    }
  })

  return rows
}

// 复制纯文本结果
function copyResult() {
  if (!result.value) return
  let text = '=== 多文本对比结果 ===\n\n'
  result.value.rows.forEach((row, i) => {
    const states = row.cells.map(c => c.state)
    const allSame = states.every(s => s === 'present') && new Set(row.cells.map(c => c.text)).size <= 1
    const prefix = allSame ? '  ' : states.some(s => s === 'unique') ? '+ ' : '~ '
    const contents = row.cells.map(c => c.text || '—').join(' | ')
    text += `${String(i + 1).padStart(3)} ${prefix}${contents}\n`
  })

  navigator.clipboard.writeText(text).then(() => alert('已复制到剪贴板'))
}

// 复制 HTML
function copyHtml() {
  if (!result.value) return
  const versionNames = result.value.versions.map(v => v.name)
  let html = '<table border="1" cellpadding="4" cellspacing="0">\n<thead><tr><th>#</th>'
  versionNames.forEach(n => html += `<th>${n}</th>`)
  html += '</tr></thead>\n<tbody>\n'

  result.value.rows.forEach((row, i) => {
    const states = row.cells.map(c => c.state)
    const allSame = states.every(s => s === 'present') && new Set(row.cells.map(c => c.text)).size <= 1
    const bg = allSame ? '#f0fdf4' : states.some(s => s === 'unique') ? '#fef9c3' : '#fef2f2'
    html += `<tr style="background:${bg}"><td>${i + 1}</td>`
    row.cells.forEach(c => {
      const txt = c.text || '—'
      html += `<td>${txt.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`
    })
    html += '</tr>\n'
  })

  html += '</tbody></table>'
  navigator.clipboard.writeText(html).then(() => alert('已复制 HTML 到剪贴板'))
}

// 初始化
onMounted(() => {
  // 窗口调整不需要特殊处理
})
</script>

<style scoped>
.tool-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

h2 {
  font-size: 1.6rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #666;
  margin-bottom: 1.5rem;
}

/* 布局 */
.diff-layout {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

/* 输入面板 */
.input-panel {
  flex: 0 0 380px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-header label {
  font-weight: 600;
  font-size: 0.95rem;
  color: #555;
}

.panel-actions {
  display: flex;
  gap: 0.4rem;
}

.btn-sm {
  padding: 0.3rem 0.7rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 0.8rem;
  color: #555;
  transition: all 0.2s;
}

.btn-sm:hover {
  border-color: #22c55e;
  color: #22c55e;
}

.version-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  max-height: 65vh;
  overflow-y: auto;
  padding-right: 4px;
}

.version-item {
  background: #fff;
  border-radius: 10px;
  padding: 0.8rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.version-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
}

.version-name {
  flex: 1;
  padding: 0.25rem 0.5rem;
  border: 1px solid #eee;
  border-radius: 5px;
  font-size: 0.85rem;
  font-weight: 600;
  background: #f8f9fa;
  color: #555;
}

.version-name:focus {
  outline: none;
  border-color: #22c55e;
}

.version-lines {
  font-size: 0.75rem;
  color: #aaa;
}

.btn-remove {
  width: 22px;
  height: 22px;
  border: none;
  background: #fee;
  color: #e74c3c;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
}

.btn-remove:hover {
  background: #fdd;
}

.version-textarea {
  width: 100%;
  height: 120px;
  padding: 0.6rem;
  border: 1px solid #eee;
  border-radius: 6px;
  font-size: 0.85rem;
  font-family: 'Courier New', monospace;
  resize: vertical;
  line-height: 1.4;
  box-sizing: border-box;
}

.version-textarea:focus {
  outline: none;
  border-color: #22c55e;
}

.btn-primary {
  padding: 0.7rem 1.5rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: opacity 0.2s;
}

.btn-primary:hover {
  opacity: 0.85;
}

/* 结果面板 */
.result-panel {
  flex: 1;
  min-width: 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  padding: 1.2rem;
}

.empty-tip {
  text-align: center;
  padding: 3rem 2rem;
  color: #bbb;
}

.tip-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.5rem;
}

/* 统计栏 */
.stats-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.stat-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 80px;
}

.stat-label {
  font-size: 0.75rem;
  color: #888;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: #2c3e50;
}

.stat-value.common { color: #22c55e; }
.stat-value.diff { color: #f59e0b; }
.stat-value.unique { color: #a855f7; }

/* 图例 */
.legend {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.8rem;
  color: #888;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.common-dot { background: #dcfce7; }
.diff-dot { background: #fef2f2; }
.unique-dot { background: #fef9c3; }
.empty-dot { background: #f3f4f6; }

/* 对比表格 */
.diff-table-header {
  display: flex;
  border-bottom: 2px solid #eee;
  padding: 0.5rem 0;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 1;
}

.col-line-num {
  flex: 0 0 40px;
  text-align: center;
  font-size: 0.8rem;
  color: #aaa;
  font-weight: 600;
}

.col-version {
  flex: 1;
  text-align: left;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--accent, #22c55e);
  padding-left: 0.5rem;
}

.diff-table {
  max-height: 55vh;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 0.82rem;
  line-height: 1.5;
}

.diff-row {
  display: flex;
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.15s;
}

.diff-row:hover {
  background: #fafafa !important;
}

.diff-row.common {
  background: #f0fdf4;
}

.diff-row.unique {
  background: #fefce8;
}

.col-line-num {
  flex: 0 0 40px;
  text-align: center;
  font-size: 0.75rem;
  color: #ccc;
  padding: 0.15rem 0;
}

.diff-cell {
  flex: 1;
  padding: 0.15rem 0.5rem;
  min-width: 0;
  white-space: pre;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell-text {
  word-break: break-all;
}

.diff-cell.empty {
  color: #ddd;
}

.diff-cell.empty .placeholder {
  color: #e5e7eb;
}

.diff-cell.unique .cell-text {
  background: #fef08a;
  border-radius: 2px;
  padding: 0 2px;
}

.diff-cell.diff .cell-text {
  background: #fecaca;
  border-radius: 2px;
  padding: 0 2px;
}

/* 操作按钮 */
.action-bar {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.btn-copy {
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  font-weight: 600;
}

.btn-copy:hover {
  opacity: 0.85;
}

.btn-copy.btn-secondary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
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

@media (max-width: 768px) {
  .diff-layout {
    flex-direction: column;
  }
  .input-panel {
    flex: none;
    width: 100%;
  }
  .version-list {
    max-height: 40vh;
  }
  .stats-bar {
    flex-wrap: wrap;
  }
}
</style>
