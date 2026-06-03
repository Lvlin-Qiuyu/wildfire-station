<template>
  <div class="tool-page">
    <h2>📝 Markdown 表格生成器</h2>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <button class="btn-tool" @click="addRow">+ 添加行</button>
        <button class="btn-tool" @click="addCol">+ 添加列</button>
      </div>
      <div class="toolbar-right">
        <button class="btn-tool btn-copy" @click="copyMarkdown" :disabled="!markdown">
          {{ copyText }}
        </button>
      </div>
    </div>

    <!-- 预设模板 -->
    <div class="presets">
      <span class="presets-label">预设模板：</span>
      <button v-for="p in presets" :key="p.label" class="btn-preset" @click="loadPreset(p)">
        {{ p.label }}
      </button>
    </div>

    <!-- 编辑区域 -->
    <div class="editor-area">
      <!-- 可视化表格编辑器 -->
      <div class="table-editor">
        <div class="table-header-row">
          <div class="th-corner"></div>
          <div v-for="(_, ci) in columns" :key="'th-' + ci" class="th-cell">
            <select v-model="aligns[ci]" class="align-select">
              <option value="left">左对齐</option>
              <option value="center">居中</option>
              <option value="right">右对齐</option>
            </select>
            <button class="btn-del-col" @click="removeCol(ci)" title="删除此列">×</button>
          </div>
        </div>
        <div v-for="(row, ri) in data" :key="'row-' + ri" class="table-row">
          <div class="row-actions">
            <span class="row-num">{{ ri + 1 }}</span>
            <button class="btn-del-row" @click="removeRow(ri)" title="删除此行">×</button>
          </div>
          <input
            v-for="(_, ci) in columns"
            :key="'cell-' + ri + '-' + ci"
            type="text"
            class="cell-input"
            :value="getCell(ri, ci)"
            @input="setCell(ri, ci, $event.target.value)"
            placeholder="..."
          />
        </div>
      </div>

      <!-- Markdown 预览 -->
      <div class="preview-panel">
        <div class="preview-label">Markdown 预览</div>
        <pre class="preview-code">{{ markdown }}</pre>
      </div>
    </div>

    <!-- 渲染效果预览 -->
    <div v-if="markdown" class="render-preview">
      <div class="preview-label">渲染效果</div>
      <div class="rendered-table" v-html="renderedHtml"></div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'Markdown 表格生成器 - 野火小站' })

const copyText = ref('📋 复制 Markdown')

// 表格数据：二维数组 data[row][col]
const cols = ref(3)
const rows = ref(3)
const data = ref([])
const aligns = ref([])

const columns = computed(() => Array.from({ length: cols.value }, (_, i) => i))

function getCell(ri, ci) {
  return (data.value[ri] && data.value[ri][ci]) || ''
}

function setCell(ri, ci, value) {
  if (!data.value[ri]) data.value[ri] = []
  data.value[ri][ci] = value
}

function addRow() {
  rows.value++
  data.value.push([])
}

function addCol() {
  cols.value++
  aligns.value.push('left')
}

function removeRow(ri) {
  if (rows.value <= 1) return
  rows.value--
  data.value.splice(ri, 1)
}

function removeCol(ci) {
  if (cols.value <= 1) return
  cols.value--
  aligns.value.splice(ci, 1)
  data.value.forEach(row => {
    row.splice(ci, 1)
  })
}

const alignChar = (a) => a === 'center' ? ':---:' : a === 'right' ? '---:' : '---'

const markdown = computed(() => {
  if (!data.value.length || cols.value === 0) return ''
  const lines = []
  // Header row
  const header = Array.from({ length: cols.value }, (_, ci) => getCell(0, ci) || '标题')
  lines.push('| ' + header.join(' | ') + ' |')
  // Separator
  const sep = Array.from({ length: cols.value }, (_, ci) => alignChar(aligns.value[ci] || 'left'))
  lines.push('| ' + sep.join(' | ') + ' |')
  // Data rows
  for (let ri = 1; ri < rows.value; ri++) {
    const cells = Array.from({ length: cols.value }, (_, ci) => getCell(ri, ci) || '')
    lines.push('| ' + cells.join(' | ') + ' |')
  }
  return lines.join('\n')
})

const renderedHtml = computed(() => {
  if (!markdown.value) return ''
  // 简单渲染 Markdown 表格为 HTML
  const lines = markdown.value.trim().split('\n')
  if (lines.length < 2) return ''
  const headers = lines[0].split('|').filter(c => c.trim()).map(c => c.trim())
  const alignArr = lines[1].split('|').filter(c => c.trim()).map(c => {
    c = c.trim()
    if (c.startsWith(':') && c.endsWith(':')) return 'center'
    if (c.endsWith(':')) return 'right'
    return 'left'
  })

  let html = '<table>'
  html += '<thead><tr>'
  headers.forEach((h, i) => {
    html += `<th style="text-align:${alignArr[i] || 'left'}">${escapeHtml(h)}</th>`
  })
  html += '</tr></thead><tbody>'
  for (let li = 2; li < lines.length; li++) {
    const cells = lines[li].split('|').filter(c => c.trim()).map(c => c.trim())
    html += '<tr>'
    cells.forEach((c, i) => {
      html += `<td style="text-align:${alignArr[i] || 'left'}">${escapeHtml(c)}</td>`
    })
    html += '</tr>'
  }
  html += '</tbody></table>'
  return html
})

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function copyMarkdown() {
  navigator.clipboard.writeText(markdown.value).then(() => {
    copyText.value = '已复制 ✓'
    setTimeout(() => { copyText.value = '📋 复制 Markdown' }, 1500)
  })
}

const presets = [
  {
    label: '2列表格',
    cols: 2,
    rows: 3,
    data: [['名称', '说明'], ['项目 A', '描述内容'], ['项目 B', '描述内容']],
    aligns: ['left', 'left']
  },
  {
    label: '3列表格',
    cols: 3,
    rows: 4,
    data: [['功能', '状态', '优先级'], ['登录模块', '完成', '高'], ['注册模块', '进行中', '中'], ['支付模块', '待开始', '高']],
    aligns: ['left', 'center', 'center']
  },
  {
    label: '对比表格',
    cols: 3,
    rows: 4,
    data: [['特性', '方案 A', '方案 B'], ['性能', '⭐⭐⭐⭐', '⭐⭐⭐'], ['价格', '免费', '¥99/月'], ['支持', '社区', '官方']],
    aligns: ['left', 'center', 'center']
  },
  {
    label: '4列表格',
    cols: 4,
    rows: 3,
    data: ['#', '姓名', '年龄', '城市'], ['1', '张三', '28', '北京'], ['2', '李四', '32', '上海']],
    aligns: ['center', 'left', 'center', 'left']
  }
]

function loadPreset(p) {
  cols.value = p.cols
  rows.value = p.rows
  data.value = p.data.map(row => [...row])
  aligns.value = [...p.aligns]
}

// 初始化默认表格
loadPreset(presets[0])
</script>

<style scoped>
.tool-page {
  padding-top: 0.5rem;
}

h2 {
  font-size: 1.6rem;
  margin-bottom: 1.5rem;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 0.5rem;
}

.btn-tool {
  padding: 0.45rem 0.9rem;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.88rem;
  transition: all 0.2s;
  color: #555;
}

.btn-tool:hover {
  border-color: #10b981;
  color: #10b981;
}

.btn-tool:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-copy {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
}

.btn-copy:hover {
  opacity: 0.85;
}

.presets {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.2rem;
  flex-wrap: wrap;
}

.presets-label {
  font-size: 0.88rem;
  color: #777;
}

.btn-preset {
  padding: 0.3rem 0.7rem;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.82rem;
  transition: all 0.2s;
  color: #666;
}

.btn-preset:hover {
  border-color: #10b981;
  background: #f0fdf4;
  color: #10b981;
}

.editor-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.2rem;
  margin-bottom: 1.5rem;
}

.table-editor {
  overflow-x: auto;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 0.8rem;
}

.table-header-row {
  display: flex;
  gap: 0;
  margin-bottom: 0;
}

.th-corner {
  width: 52px;
  min-width: 52px;
  flex-shrink: 0;
}

.th-cell {
  flex: 1;
  min-width: 80px;
  display: flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.3rem;
  background: #f0fdf4;
  border: 1px solid #d1fae5;
  border-bottom: 2px solid #10b981;
}

.align-select {
  flex: 1;
  padding: 0.25rem;
  border: none;
  background: transparent;
  font-size: 0.8rem;
  cursor: pointer;
  color: #555;
  outline: none;
}

.btn-del-col {
  width: 22px;
  height: 22px;
  border: none;
  background: #fecaca;
  color: #ef4444;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  line-height: 1;
  flex-shrink: 0;
  transition: opacity 0.2s;
}

.btn-del-col:hover {
  opacity: 0.7;
}

.table-row {
  display: flex;
  gap: 0;
  border-bottom: 1px solid #f0f0f0;
}

.row-actions {
  width: 52px;
  min-width: 52px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0 0.3rem;
  background: #f9fafb;
  border-right: 1px solid #eee;
}

.row-num {
  font-size: 0.72rem;
  color: #bbb;
  min-width: 16px;
}

.btn-del-row {
  width: 20px;
  height: 20px;
  border: none;
  background: #fee2e2;
  color: #ef4444;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.78rem;
  line-height: 1;
  transition: opacity 0.2s;
}

.btn-del-row:hover {
  opacity: 0.7;
}

.cell-input {
  flex: 1;
  min-width: 80px;
  padding: 0.5rem 0.6rem;
  border: 1px solid transparent;
  border-left: 1px solid #f0f0f0;
  font-size: 0.9rem;
  outline: none;
  transition: background 0.15s;
}

.cell-input:focus {
  background: #f0fdf4;
  border-color: #10b981;
}

.cell-input::placeholder {
  color: #ddd;
}

.preview-panel {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.preview-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #888;
  margin-bottom: 0.5rem;
}

.preview-code {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  color: #333;
  background: #f9fafb;
  padding: 0.8rem;
  border-radius: 6px;
  flex: 1;
  overflow: auto;
}

.render-preview {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 1rem;
}

.render-preview .preview-label {
  margin-bottom: 0.6rem;
}

.rendered-table {
  overflow-x: auto;
}

.rendered-table :deep(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.rendered-table :deep(th),
.rendered-table :deep(td) {
  padding: 0.55rem 0.8rem;
  border: 1px solid #e5e7eb;
}

.rendered-table :deep(th) {
  background: #f0fdf4;
  font-weight: 600;
  color: #333;
}

.rendered-table :deep(td) {
  color: #555;
}

.rendered-table :deep(tr:hover td) {
  background: #f9fafb;
}

.back-link {
  display: inline-block;
  margin-top: 2.5rem;
  color: #22c55e;
  font-weight: 500;
}

.back-link:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .editor-area {
    grid-template-columns: 1fr;
  }
}
</style>
