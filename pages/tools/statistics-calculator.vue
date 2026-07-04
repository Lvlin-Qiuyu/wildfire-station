<template>
  <div class="tool-page">
    <h2>📊 在线描述性统计计算器</h2>
    <p class="subtitle">输入一组数据，自动计算均值、中位数、众数、标准差、方差、极差、四分位数、偏度、峰度，绘制频率分布直方图和箱线图</p>

    <!-- 数据输入 -->
    <div class="section">
      <label>数据输入</label>
      <p class="hint">输入数字，用逗号、空格或换行分隔，也支持直接粘贴 CSV 列</p>
      <textarea
        v-model="rawInput"
        class="data-input"
        placeholder="例如：23, 45, 67, 12, 89, 34, 56, 78, 23, 45, 90, 12"
        rows="4"
        @input="parseData"
      ></textarea>
      <div class="input-actions">
        <span class="data-count">已识别 <strong>{{ data.length }}</strong> 个数据点</span>
        <div class="btn-group">
          <button class="btn-sm" @click="loadSample">加载示例</button>
          <button class="btn-sm btn-danger" @click="clearData">清空</button>
        </div>
      </div>
    </div>

    <!-- 统计结果 -->
    <div v-if="data.length > 0" class="stats-grid">
      <div class="stat-card" v-for="s in statsCards" :key="s.label">
        <div class="stat-label">{{ s.icon }} {{ s.label }}</div>
        <div class="stat-value">{{ s.value }}</div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div v-if="data.length >= 2" class="charts-area">
      <div class="chart-section">
        <h3>📈 频率分布直方图</h3>
        <div class="canvas-wrapper" ref="histogramWrapper">
          <canvas ref="histogramCanvas"></canvas>
        </div>
      </div>
      <div class="chart-section">
        <h3>📦 箱线图</h3>
        <div class="canvas-wrapper boxplot-wrapper" ref="boxplotWrapper">
          <canvas ref="boxplotCanvas"></canvas>
        </div>
      </div>
    </div>

    <!-- 详细数据表 -->
    <div v-if="data.length > 0" class="section detail-section">
      <h3>📋 详细统计信息</h3>
      <table class="detail-table">
        <tbody>
          <tr v-for="item in detailRows" :key="item.label">
            <td class="td-label">{{ item.label }}</td>
            <td>{{ item.value }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 复制按钮 -->
    <div v-if="data.length > 0" class="action-bar">
      <button class="btn-copy" @click="copyResults">📋 复制统计结果</button>
      <button class="btn-copy btn-json" @click="copyJson">📄 复制 JSON</button>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '描述性统计计算器 - 野火小站' })

// 输入与数据
const rawInput = ref('')
const data = ref([])

// Canvas 引用
const histogramCanvas = ref(null)
const histogramWrapper = ref(null)
const boxplotCanvas = ref(null)
const boxplotWrapper = ref(null)

// 解析输入数据
function parseData() {
  const text = rawInput.value.trim()
  if (!text) {
    data.value = []
    return
  }
  // 支持逗号、空格、换行、制表符、分号分隔
  const nums = text
    .replace(/\n/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/;/g, ' ')
    .split(/[\s,]+/)
    .map(s => parseFloat(s.trim()))
    .filter(n => !isNaN(n))
  data.value = nums
  nextTick(() => {
    if (data.value.length >= 2) {
      drawHistogram()
      drawBoxplot()
    }
  })
}

// 加载示例数据
function loadSample() {
  const sample = [23, 45, 67, 12, 89, 34, 56, 78, 23, 45, 90, 12, 55, 61, 38, 72, 29, 84, 47, 33, 58, 91, 16, 63, 41]
  rawInput.value = sample.join(', ')
  parseData()
}

// 清空数据
function clearData() {
  rawInput.value = ''
  data.value = []
}

// ========= 统计计算 =========

const sorted = computed(() => [...data.value].sort((a, b) => a - b))
const n = computed(() => data.value.length)

// 均值
const mean = computed(() => {
  if (n.value === 0) return 0
  return data.value.reduce((s, v) => s + v, 0) / n.value
})

// 中位数
const median = computed(() => {
  if (n.value === 0) return 0
  const s = sorted.value
  const mid = Math.floor(n.value / 2)
  return n.value % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
})

// 众数
const mode = computed(() => {
  if (n.value === 0) return []
  const freq = {}
  let maxFreq = 0
  for (const v of data.value) {
    freq[v] = (freq[v] || 0) + 1
    if (freq[v] > maxFreq) maxFreq = freq[v]
  }
  if (maxFreq === 1) return [] // 无众数
  return Object.keys(freq).filter(k => freq[k] === maxFreq).map(Number)
})

// 样本方差（n-1）
const variance = computed(() => {
  if (n.value < 2) return 0
  const m = mean.value
  return data.value.reduce((s, v) => s + (v - m) ** 2, 0) / (n.value - 1)
})

// 总体方差（n）
const populationVariance = computed(() => {
  if (n.value === 0) return 0
  const m = mean.value
  return data.value.reduce((s, v) => s + (v - m) ** 2, 0) / n.value
})

// 标准差（样本）
const stdDev = computed(() => Math.sqrt(variance.value))

// 总体标准差
const popStdDev = computed(() => Math.sqrt(populationVariance.value))

// 极差
const range = computed(() => {
  if (n.value === 0) return 0
  const s = sorted.value
  return s[s.length - 1] - s[0]
})

// 四分位数
function percentile(sorted, p) {
  const idx = p * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (idx - lo) * (sorted[hi] - sorted[lo])
}

const q1 = computed(() => percentile(sorted.value, 0.25))
const q3 = computed(() => percentile(sorted.value, 0.75))
const iqr = computed(() => q3.value - q1.value)

// 偏度
const skewness = computed(() => {
  if (n.value < 3) return 0
  const m = mean.value
  const sd = stdDev.value
  if (sd === 0) return 0
  const sum = data.value.reduce((s, v) => s + ((v - m) / sd) ** 3, 0)
  return (n.value / ((n.value - 1) * (n.value - 2))) * sum
})

// 峰度（超额峰度）
const kurtosis = computed(() => {
  if (n.value < 4) return 0
  const m = mean.value
  const sd = stdDev.value
  if (sd === 0) return 0
  const sum = data.value.reduce((s, v) => s + ((v - m) / sd) ** 4, 0)
  const k = ((n.value * (n.value + 1)) / ((n.value - 1) * (n.value - 2) * (n.value - 3))) * sum
  const correction = (3 * (n.value - 1) ** 2) / ((n.value - 2) * (n.value - 3))
  return k - correction
})

// 求和
const sum = computed(() => data.value.reduce((s, v) => s + v, 0))

// 几何平均
const geometricMean = computed(() => {
  if (n.value === 0) return 0
  if (data.value.some(v => v <= 0)) return NaN
  return Math.exp(data.value.reduce((s, v) => s + Math.log(v), 0) / n.value)
})

// 格式化数字
const fmt = (v, digits = 4) => {
  if (v === null || v === undefined || isNaN(v)) return '无'
  if (Number.isInteger(v)) return v.toLocaleString()
  return v.toFixed(digits).replace(/\.?0+$/, '')
}

// 统计卡片
const statsCards = computed(() => [
  { icon: 'μ', label: '均值', value: fmt(mean.value) },
  { icon: 'M', label: '中位数', value: fmt(median.value) },
  { icon: 'σ', label: '标准差', value: fmt(stdDev.value) },
  { icon: 'σ²', label: '方差', value: fmt(variance.value) },
  { icon: 'R', label: '极差', value: fmt(range.value) },
  { icon: 'Q', label: '四分位距', value: fmt(iqr.value) },
  { icon: '∥', label: '偏度', value: fmt(skewness.value) },
  { icon: '∧', label: '峰度', value: fmt(kurtosis.value) },
])

// 详细数据行
const detailRows = computed(() => [
  { label: '样本数', value: n.value },
  { label: '求和', value: fmt(sum.value) },
  { label: '均值', value: fmt(mean.value) },
  { label: '中位数', value: fmt(median.value) },
  { label: '众数', value: mode.value.length ? mode.value.map(v => fmt(v, 2)).join(', ') : '无（所有值频率相同）' },
  { label: '样本标准差 (s)', value: fmt(stdDev.value) },
  { label: '总体标准差 (σ)', value: fmt(popStdDev.value) },
  { label: '样本方差 (s²)', value: fmt(variance.value) },
  { label: '总体方差 (σ²)', value: fmt(populationVariance.value) },
  { label: '极差', value: fmt(range.value) },
  { label: '最小值', value: fmt(sorted.value[0] || 0) },
  { label: '最大值', value: fmt(sorted.value[sorted.value.length - 1] || 0) },
  { label: 'Q1（25%分位）', value: fmt(q1.value) },
  { label: 'Q2（50%分位/中位数）', value: fmt(median.value) },
  { label: 'Q3（75%分位）', value: fmt(q3.value) },
  { label: '四分位距 (IQR)', value: fmt(iqr.value) },
  { label: '偏度', value: fmt(skewness.value) },
  { label: '峰度（超额）', value: fmt(kurtosis.value) },
  { label: '几何平均', value: fmt(geometricMean.value) },
  { label: '1.5×IQR 下界', value: fmt(q1.value - 1.5 * iqr.value) },
  { label: '1.5×IQR 上界', value: fmt(q3.value + 1.5 * iqr.value) },
])

// ========= 直方图绘制 =========
function drawHistogram() {
  const canvas = histogramCanvas.value
  const wrapper = histogramWrapper.value
  if (!canvas || !wrapper) return

  const dpr = window.devicePixelRatio || 1
  const width = wrapper.clientWidth - 40
  const height = 300
  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = width + 'px'
  canvas.style.height = height + 'px'
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, width, height)

  const s = sorted.value
  const min = s[0]
  const max = s[s.length - 1]
  if (min === max) return

  // Sturges 公式确定分箱数
  const binCount = Math.max(5, Math.ceil(1 + 3.322 * Math.log10(n.value)))
  const binWidth = (max - min) / binCount

  // 统计各箱频数
  const bins = Array(binCount).fill(0)
  for (const v of data.value) {
    let idx = Math.floor((v - min) / binWidth)
    if (idx >= binCount) idx = binCount - 1
    bins[idx]++
  }
  const maxFreq = Math.max(...bins, 1)

  // 绘制参数
  const padding = { top: 20, right: 20, bottom: 40, left: 50 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom
  const barW = chartW / binCount

  // 背景
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, width, height)

  // 网格线
  ctx.strokeStyle = '#f0f0f0'
  ctx.lineWidth = 1
  for (let i = 0; i <= 5; i++) {
    const y = padding.top + (chartH / 5) * i
    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(width - padding.right, y)
    ctx.stroke()
  }

  // 绘制柱状图
  for (let i = 0; i < binCount; i++) {
    const barH = (bins[i] / maxFreq) * chartH
    const x = padding.left + i * barW
    const y = padding.top + chartH - barH

    const gradient = ctx.createLinearGradient(x, y, x, y + barH)
    gradient.addColorStop(0, '#22c55e')
    gradient.addColorStop(1, '#10b981')
    ctx.fillStyle = gradient

    ctx.beginPath()
    ctx.roundRect(x + 2, y, barW - 4, barH, [3, 3, 0, 0])
    ctx.fill()

    // 频数标签
    if (bins[i] > 0) {
      ctx.fillStyle = '#333'
      ctx.font = '11px -apple-system, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(bins[i], x + barW / 2, y - 5)
    }

    // X轴标签
    ctx.fillStyle = '#888'
    ctx.font = '10px -apple-system, sans-serif'
    ctx.textAlign = 'center'
    const label = (min + i * binWidth).toFixed(1)
    ctx.fillText(label, x + barW / 2, height - padding.bottom + 15)
  }

  // 最后一个标签
  ctx.fillStyle = '#888'
  ctx.font = '10px -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(max.toFixed(1), width - padding.right, height - padding.bottom + 15)

  // Y轴标签
  ctx.fillStyle = '#888'
  ctx.font = '11px -apple-system, sans-serif'
  ctx.textAlign = 'right'
  for (let i = 0; i <= 5; i++) {
    const y = padding.top + (chartH / 5) * i
    const val = Math.round(maxFreq * (1 - i / 5))
    ctx.fillText(val, padding.left - 8, y + 4)
  }
}

// ========= 箱线图绘制 =========
function drawBoxplot() {
  const canvas = boxplotCanvas.value
  const wrapper = boxplotWrapper.value
  if (!canvas || !wrapper) return

  const dpr = window.devicePixelRatio || 1
  const width = wrapper.clientWidth - 40
  const height = 200
  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = width + 'px'
  canvas.style.height = height + 'px'
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, width, height)

  const s = sorted.value
  const min = s[0]
  const max = s[s.length - 1]
  const range = max - min
  if (range === 0) return

  const padding = { top: 30, right: 40, bottom: 30, left: 40 }
  const chartW = width - padding.left - padding.right
  const centerY = height / 2
  const boxH = 60

  // 数据值到X坐标映射
  const toX = (v) => padding.left + ((v - min) / range) * chartW

  // 须的范围（1.5×IQR）
  const lowerFence = q1.value - 1.5 * iqr.value
  const upperFence = q3.value + 1.5 * iqr.value
  const whiskerLow = s.find(v => v >= lowerFence) || min
  const whiskerHigh = [...s].reverse().find(v => v <= upperFence) || max

  // 异常值
  const outliers = data.value.filter(v => v < lowerFence || v > upperFence)

  // 背景
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, width, height)

  // 须线
  ctx.strokeStyle = '#666'
  ctx.lineWidth = 1.5
  ctx.setLineDash([4, 3])

  // 下须
  ctx.beginPath()
  ctx.moveTo(toX(whiskerLow), centerY)
  ctx.lineTo(toX(q1.value), centerY)
  ctx.stroke()

  // 上须
  ctx.beginPath()
  ctx.moveTo(toX(q3.value), centerY)
  ctx.lineTo(toX(whiskerHigh), centerY)
  ctx.stroke()
  ctx.setLineDash([])

  // 须端
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(toX(whiskerLow), centerY - boxH * 0.3)
  ctx.lineTo(toX(whiskerLow), centerY + boxH * 0.3)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(toX(whiskerHigh), centerY - boxH * 0.3)
  ctx.lineTo(toX(whiskerHigh), centerY + boxH * 0.3)
  ctx.stroke()

  // 箱体
  const boxX = toX(q1.value)
  const boxW = toX(q3.value) - boxX
  const boxY = centerY - boxH / 2

  const boxGradient = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxH)
  boxGradient.addColorStop(0, 'rgba(34, 197, 94, 0.3)')
  boxGradient.addColorStop(1, 'rgba(16, 185, 129, 0.3)')
  ctx.fillStyle = boxGradient
  ctx.fillRect(boxX, boxY, boxW, boxH)
  ctx.strokeStyle = '#22c55e'
  ctx.lineWidth = 2
  ctx.strokeRect(boxX, boxY, boxW, boxH)

  // 中位数线
  ctx.strokeStyle = '#ef4444'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(toX(median.value), boxY)
  ctx.lineTo(toX(median.value), boxY + boxH)
  ctx.stroke()

  // 均值菱形
  const mx = toX(mean.value)
  ctx.fillStyle = '#f59e0b'
  ctx.beginPath()
  ctx.moveTo(mx, centerY - 10)
  ctx.lineTo(mx + 7, centerY)
  ctx.lineTo(mx, centerY + 10)
  ctx.lineTo(mx - 7, centerY)
  ctx.closePath()
  ctx.fill()

  // 异常值
  ctx.fillStyle = '#ef4444'
  for (const o of outliers) {
    ctx.beginPath()
    ctx.arc(toX(o), centerY, 4, 0, Math.PI * 2)
    ctx.fill()
  }

  // 标签
  ctx.font = '11px -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#333'

  const labels = [
    { val: whiskerLow, text: `下须 ${fmt(whiskerLow, 2)}` },
    { val: q1.value, text: `Q1 ${fmt(q1.value, 2)}` },
    { val: median.value, text: `中位 ${fmt(median.value, 2)}` },
    { val: q3.value, text: `Q3 ${fmt(q3.value, 2)}` },
    { val: whiskerHigh, text: `上须 ${fmt(whiskerHigh, 2)}` },
  ]
  for (const l of labels) {
    const x = toX(l.val)
    ctx.fillText(l.text, x, boxY - 8)
  }
}

// 复制统计结果
function copyResults() {
  const rows = detailRows.value.map(r => `${r.label}: ${r.value}`).join('\n')
  navigator.clipboard.writeText(rows).then(() => alert('已复制统计结果'))
}

// 复制 JSON
function copyJson() {
  const obj = {}
  for (const r of detailRows.value) {
    obj[r.label] = r.value
  }
  navigator.clipboard.writeText(JSON.stringify(obj, null, 2)).then(() => alert('已复制 JSON'))
}

// 响应式重绘
onMounted(() => {
  window.addEventListener('resize', () => {
    if (data.value.length >= 2) {
      drawHistogram()
      drawBoxplot()
    }
  })
})
</script>

<style scoped>
.tool-page {
  padding-top: 0.5rem;
}

h2 { font-size: 1.6rem; margin-bottom: 0.3rem; }
h3 { font-size: 1rem; color: #555; margin-bottom: 0.6rem; }

.subtitle {
  color: #888;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
}

.section {
  background: white;
  border-radius: 12px;
  padding: 1.2rem;
  margin-bottom: 1.2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border: 1px solid #eee;
}

.section label {
  display: block;
  font-weight: 600;
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 0.3rem;
}

.hint {
  font-size: 0.8rem;
  color: #aaa;
  margin-bottom: 0.5rem;
}

.data-input {
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: 'Courier New', monospace;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.data-input:focus {
  border-color: #22c55e;
}

.input-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.5rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.data-count {
  font-size: 0.85rem;
  color: #888;
}

.data-count strong {
  color: #22c55e;
}

.btn-group {
  display: flex;
  gap: 0.5rem;
}

.btn-sm {
  padding: 0.3rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #f8f9fa;
  font-size: 0.8rem;
  color: #555;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-sm:hover {
  background: #e8e9ea;
}

.btn-danger {
  border-color: #fca5a5;
  color: #dc2626;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.8rem;
  margin-bottom: 1.2rem;
}

.stat-card {
  background: white;
  border-radius: 10px;
  padding: 1rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  border: 1px solid #eee;
}

.stat-label {
  font-size: 0.8rem;
  color: #888;
  margin-bottom: 0.3rem;
}

.stat-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: #2c3e50;
  font-family: 'Courier New', monospace;
}

/* 图表区域 */
.charts-area {
  margin-bottom: 1.2rem;
}

.chart-section {
  background: white;
  border-radius: 12px;
  padding: 1.2rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border: 1px solid #eee;
}

.canvas-wrapper {
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #eee;
  padding: 20px;
  overflow: hidden;
}

.boxplot-wrapper {
  padding: 20px;
}

/* 详细数据表 */
.detail-section {
  margin-bottom: 1rem;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
}

.detail-table td {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  border-bottom: 1px solid #f5f5f5;
}

.td-label {
  color: #888;
  font-weight: 500;
  width: 200px;
  background: #fafafa;
}

/* 操作按钮 */
.action-bar {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

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

.btn-copy:hover {
  opacity: 0.85;
}

.btn-json {
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

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .td-label {
    width: 140px;
  }
}
</style>
