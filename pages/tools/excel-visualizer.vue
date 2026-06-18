<template>
  <div class="tool-page">
    <h2>📊 Excel 数据可视化</h2>

    <div class="upload-area"
      :class="{ dragging: isDragging }"
      @click="triggerUpload"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <input ref="fileInput" type="file" accept=".csv,.xlsx,.xls" @change="handleFile" style="display:none" />
      <div class="upload-hint">
        <span class="upload-icon">📁</span>
        <p>点击或拖拽上传 CSV / Excel 文件</p>
        <span class="upload-formats">支持 .csv .xlsx .xls</span>
      </div>
    </div>

    <div v-if="loading" class="loading-msg">⏳ 加载中...</div>

    <div v-if="columns.length" class="workspace">
      <!-- 列配置 -->
      <div class="config-section">
        <div class="config-row">
          <div class="config-item">
            <label>X 轴列</label>
            <select v-model="xCol">
              <option value="">自动</option>
              <option v-for="c in columns" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="config-item">
            <label>Y 轴列</label>
            <select v-model="yCol">
              <option value="">自动</option>
              <option v-for="c in numericCols" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="config-item">
            <label>图表类型</label>
            <div class="chart-type-btns">
              <button v-for="t in chartTypes" :key="t" :class="{ active: chartType === t }" @click="chartType = t">{{ chartIcons[t] }} {{ t }}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 数据表格 -->
      <div class="table-section">
        <div class="section-header">
          <h3>数据预览 ({{ rows.length }} 行)</h3>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th v-for="c in columns" :key="c">{{ c }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in rows.slice(0, 50)" :key="i">
                <td v-for="c in columns" :key="c">{{ row[c] ?? '' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 图表 -->
      <div class="chart-section">
        <div class="section-header">
          <h3>图表</h3>
          <button class="btn-export" @click="exportPng">📥 导出 PNG</button>
        </div>
        <div class="chart-container">
          <canvas ref="chartCanvas" @mousemove="onChartHover" @mouseleave="hoverData = null"></canvas>
          <div v-if="hoverData" class="tooltip" :style="tooltipStyle">
            <strong>{{ hoverData.label }}</strong>: {{ hoverData.value }}
          </div>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'Excel 数据可视化 - 野火小站' })

const fileInput = ref(null)
const isDragging = ref(false)
const loading = ref(false)
const columns = ref([])
const rows = ref([])
const xCol = ref('')
const yCol = ref('')
const chartType = ref('柱状图')
const chartCanvas = ref(null)
const hoverData = ref(null)
const tooltipStyle = ref({})

const chartTypes = ['柱状图', '折线图', '饼图']
const chartIcons = { '柱状图': '📊', '折线图': '📈', '饼图': '🥧' }

const numericCols = computed(() =>
  columns.value.filter(c => rows.value.some(r => !isNaN(parseFloat(r[c])) && r[c] !== ''))
)

const chartData = computed(() => {
  if (!rows.value.length) return { labels: [], values: [] }

  let x = xCol.value || columns.value[0]
  let y = yCol.value || numericCols.value[0] || columns.value[1] || columns.value[0]

  if (!y) y = x
  if (!x) return { labels: [], values: [] }

  const labels = rows.value.map(r => String(r[x] ?? ''))
  const values = rows.value.map(r => parseFloat(r[y]) || 0)

  // Limit to 30 items for readability
  const limit = Math.min(labels.length, 30)
  return { labels: labels.slice(0, limit), values: values.slice(0, limit), xLabel: x, yLabel: y }
})

function triggerUpload() {
  fileInput.value.click()
}

function handleFile(e) {
  const file = e.target.files[0]
  if (file) processFile(file)
}

function handleDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer.files[0]
  if (file) processFile(file)
}

async function processFile(file) {
  loading.value = true
  columns.value = []
  rows.value = []

  const name = file.name.toLowerCase()

  if (name.endsWith('.csv')) {
    parseCsv(file)
  } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    await parseExcel(file)
  }

  loading.value = false
}

function parseCsv(file) {
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target.result
    const lines = text.split('\n').filter(l => l.trim())

    // Detect delimiter
    const firstLine = lines[0]
    const commaCount = (firstLine.match(/,/g) || []).length
    const tabCount = (firstLine.match(/\t/g) || []).length
    const semicolonCount = (firstLine.match(/;/g) || []).length
    let delimiter = ','
    if (tabCount > commaCount && tabCount > semicolonCount) delimiter = '\t'
    else if (semicolonCount > commaCount) delimiter = ';'

    const header = lines[0].split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''))
    const data = []

    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''))
      if (vals.length === header.length) {
        const row = {}
        header.forEach((h, j) => { row[h] = vals[j] })
        data.push(row)
      }
    }

    columns.value = header
    rows.value = data
  }
  reader.readAsText(file)
}

async function parseExcel(file) {
  // Load SheetJS CDN if not loaded
  if (!window.XLSX) {
    await new Promise((resolve, reject) => {
      if (window.XLSX) { resolve(); return }
      const script = document.createElement('script')
      script.src = 'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js'
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const workbook = window.XLSX.read(e.target.result, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const json = window.XLSX.utils.sheet_to_json(sheet, { defval: '' })
      if (json.length) {
        columns.value = Object.keys(json[0])
        rows.value = json
      }
    } catch (err) {
      console.error('Excel parse error:', err)
    }
  }
  reader.readAsArrayBuffer(file)
}

// Draw chart
watch([chartData, chartType, chartCanvas], drawChart, { deep: true })
onMounted(() => { nextTick(() => drawChart()) })

function drawChart() {
  const canvas = chartCanvas.value
  if (!canvas) return

  const { labels, values, xLabel, yLabel } = chartData.value
  if (!labels.length) return

  const dpr = window.devicePixelRatio || 1
  const displayW = canvas.parentElement.clientWidth || 700
  const displayH = 400

  canvas.style.width = displayW + 'px'
  canvas.style.height = displayH + 'px'
  canvas.width = displayW * dpr
  canvas.height = displayH * dpr

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, displayW, displayH)

  if (chartType.value === '饼图') {
    drawPieChart(ctx, labels, values, displayW, displayH)
  } else {
    drawBarLineChart(ctx, labels, values, displayW, displayH, chartType.value, xLabel, yLabel)
  }
}

const barRects = ref([])

function drawBarLineChart(ctx, labels, values, w, h, type, xLabel, yLabel) {
  const padding = { top: 30, right: 30, bottom: 60, left: 60 }
  const chartW = w - padding.left - padding.right
  const chartH = h - padding.top - padding.bottom

  const maxVal = Math.max(...values, 1)
  const minVal = type === '折线图' ? Math.min(...values, 0) : 0
  const range = maxVal - minVal || 1

  // Grid
  ctx.strokeStyle = '#e9ecef'
  ctx.lineWidth = 1
  ctx.font = '11px sans-serif'
  ctx.fillStyle = '#888'
  ctx.textAlign = 'right'

  const gridLines = 5
  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + (chartH / gridLines) * i
    const val = maxVal - (range / gridLines) * i
    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(w - padding.right, y)
    ctx.stroke()
    ctx.fillText(val.toFixed(val > 1000 ? 0 : 1), padding.left - 8, y + 4)
  }

  // Axes labels
  ctx.fillStyle = '#666'
  ctx.font = 'bold 12px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(yLabel || '数值', padding.left - 8, padding.top - 12)

  // Data
  const colors = ['#22c55e', '#10b981', '#059669', '#047857', '#34d399', '#6ee7b7', '#a7f3d0']
  const rects = []
  const barW = Math.max(4, (chartW / labels.length) * 0.6)
  const gap = chartW / labels.length

  if (type === '柱状图') {
    values.forEach((val, i) => {
      const x = padding.left + gap * i + (gap - barW) / 2
      const barH = (val / range) * chartH
      const y = padding.top + chartH - barH

      const gradient = ctx.createLinearGradient(x, y, x, y + barH)
      gradient.addColorStop(0, colors[i % colors.length])
      gradient.addColorStop(1, colors[(i + 1) % colors.length])

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.roundRect(x, y, barW, barH, [3, 3, 0, 0])
      ctx.fill()

      rects.push({ x, y, w: barW, h: barH, label: labels[i], value: val })
    })
  } else {
    // Line chart
    ctx.strokeStyle = '#22c55e'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    values.forEach((val, i) => {
      const x = padding.left + gap * i + gap / 2
      const y = padding.top + chartH - ((val - minVal) / range) * chartH
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // Area fill
    ctx.fillStyle = 'rgba(34, 197, 94, 0.1)'
    ctx.beginPath()
    values.forEach((val, i) => {
      const x = padding.left + gap * i + gap / 2
      const y = padding.top + chartH - ((val - minVal) / range) * chartH
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.lineTo(padding.left + gap * (values.length - 1) + gap / 2, padding.top + chartH)
    ctx.lineTo(padding.left + gap / 2, padding.top + chartH)
    ctx.closePath()
    ctx.fill()

    // Points
    values.forEach((val, i) => {
      const x = padding.left + gap * i + gap / 2
      const y = padding.top + chartH - ((val - minVal) / range) * chartH
      ctx.fillStyle = '#22c55e'
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'white'
      ctx.beginPath()
      ctx.arc(x, y, 2, 0, Math.PI * 2)
      ctx.fill()

      rects.push({ x: x - 15, y: y - 15, w: 30, h: 30, label: labels[i], value: val })
    })
  }

  barRects.value = rects

  // X labels
  ctx.fillStyle = '#666'
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'center'
  const maxLabels = Math.floor(chartW / 50)
  const step = Math.max(1, Math.ceil(labels.length / maxLabels))
  labels.forEach((label, i) => {
    if (i % step === 0 || i === labels.length - 1) {
      const x = padding.left + gap * i + gap / 2
      const displayLabel = label.length > 8 ? label.slice(0, 7) + '…' : label
      ctx.fillText(displayLabel, x, h - padding.bottom + 20)

      if (type === '柱状图' || labels.length <= maxLabels) {
        ctx.save()
        ctx.translate(x, h - padding.bottom + 35)
        ctx.rotate(-Math.PI / 6)
        ctx.fillText(displayLabel, 0, 0)
        ctx.restore()
      }
    }
  })
}

function drawPieChart(ctx, labels, values, w, h) {
  const cx = w / 2
  const cy = h / 2 - 10
  const radius = Math.min(w, h) / 2 - 40

  const total = values.reduce((a, b) => a + b, 0) || 1
  const colors = ['#22c55e', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316']

  let startAngle = -Math.PI / 2
  const rects = []

  values.forEach((val, i) => {
    const sliceAngle = (val / total) * Math.PI * 2
    const endAngle = startAngle + sliceAngle

    ctx.fillStyle = colors[i % colors.length]
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, radius, startAngle, endAngle)
    ctx.closePath()
    ctx.fill()

    // White border between slices
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2
    ctx.stroke()

    // Label
    if (sliceAngle > 0.15) {
      const midAngle = startAngle + sliceAngle / 2
      const labelR = radius * 0.7
      const lx = cx + Math.cos(midAngle) * labelR
      const ly = cy + Math.sin(midAngle) * labelR
      const pct = ((val / total) * 100).toFixed(1)

      ctx.fillStyle = 'white'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(pct + '%', lx, ly)
    }

    // Store for hover
    rects.push({
      label: labels[i],
      value: val,
      pct: ((val / total) * 100).toFixed(1) + '%',
      cx, cy, radius,
      startAngle, endAngle
    })

    startAngle = endAngle
  })

  barRects.value = rects
}

function onChartHover(e) {
  const canvas = chartCanvas.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top

  let found = null

  if (chartType.value === '饼图') {
    for (const item of barRects.value) {
      const dx = mx - item.cx
      const dy = my - item.cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist <= item.radius) {
        let angle = Math.atan2(dy, dx)
        if (angle < -Math.PI / 2) angle += Math.PI * 2
        if (angle >= item.startAngle && angle <= item.endAngle) {
          found = { label: item.label, value: item.pct }
          break
        }
      }
    }
  } else {
    for (const item of barRects.value) {
      if (mx >= item.x && mx <= item.x + item.w && my >= item.y && my <= item.y + item.h) {
        found = { label: item.label, value: item.value }
        break
      }
    }
  }

  hoverData.value = found
  if (found) {
    tooltipStyle.value = {
      left: (mx + 12) + 'px',
      top: (my - 10) + 'px',
    }
  }
}

function exportPng() {
  const canvas = chartCanvas.value
  if (!canvas) return
  const link = document.createElement('a')
  link.download = 'chart.png'
  link.href = canvas.toDataURL('image/png')
  link.click()
}
</script>

<style scoped>
.tool-page {
  padding-top: 0.5rem;
}

h2 {
  font-size: 1.6rem;
  margin-bottom: 1.5rem;
}

h3 {
  font-size: 1rem;
  margin-bottom: 0;
  color: #555;
}

.upload-area {
  border: 2px dashed #ccc;
  border-radius: 14px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 1.5rem;
}

.upload-area:hover,
.upload-area.dragging {
  border-color: #22c55e;
  background: #f0fdf4;
}

.upload-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 0.5rem;
}

.upload-hint p {
  margin: 0.3rem 0;
  color: #555;
  font-size: 1rem;
}

.upload-formats {
  font-size: 0.8rem;
  color: #999;
}

.loading-msg {
  text-align: center;
  color: #22c55e;
  font-size: 1.1rem;
  padding: 1rem;
}

.workspace {
  margin-top: 0.5rem;
}

.config-section {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.config-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: flex-end;
}

.config-item {
  flex: 1;
  min-width: 120px;
}

.config-item label {
  display: block;
  margin-bottom: 0.3rem;
  font-weight: 600;
  font-size: 0.85rem;
}

.config-item select {
  width: 100%;
  padding: 0.5rem 0.7rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  background: white;
  box-sizing: border-box;
}

.config-item select:focus {
  border-color: #22c55e;
}

.chart-type-btns {
  display: flex;
  gap: 0.4rem;
}

.chart-type-btns button {
  padding: 0.4rem 0.7rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.chart-type-btns button.active {
  border-color: #22c55e;
  background: #f0fdf4;
  color: #22c55e;
  font-weight: 600;
}

.table-section,
.chart-section {
  margin-bottom: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.btn-export {
  padding: 0.4rem 0.8rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: transform 0.2s;
}

.btn-export:active {
  transform: scale(0.95);
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 10px;
  border: 1px solid #e9ecef;
  max-height: 300px;
  overflow-y: auto;
}

.table-wrapper table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.table-wrapper th {
  background: #f0fdf4;
  padding: 0.5rem 0.7rem;
  text-align: left;
  font-weight: 600;
  position: sticky;
  top: 0;
  border-bottom: 2px solid #22c55e;
}

.table-wrapper td {
  padding: 0.4rem 0.7rem;
  border-bottom: 1px solid #f0f0f0;
}

.table-wrapper tr:hover td {
  background: #f8fdf8;
}

.chart-container {
  position: relative;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  overflow: hidden;
  background: white;
}

.chart-container canvas {
  display: block;
  cursor: crosshair;
}

.tooltip {
  position: absolute;
  background: rgba(0,0,0,0.85);
  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.85rem;
  pointer-events: none;
  z-index: 10;
  white-space: nowrap;
}

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #22c55e;
  text-decoration: none;
  font-weight: 600;
}

.back-link:hover {
  text-decoration: underline;
}

@media (max-width: 600px) {
  .config-row {
    flex-direction: column;
  }
  .chart-type-btns {
    flex-wrap: wrap;
  }
}
</style>
