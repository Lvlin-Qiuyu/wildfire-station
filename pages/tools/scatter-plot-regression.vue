<template>
  <div class="tool-page">
    <h2>📈 散点图与回归分析工具</h2>
    <p class="subtitle">输入 X/Y 两组数据，绘制散点图，自动拟合线性回归、多项式回归、指数回归，显示方程和 R² 值</p>

    <!-- 数据输入 -->
    <div class="section">
      <div class="section-header">
        <label>数据输入</label>
        <div class="btn-group">
          <button class="btn-sm" @click="loadSample">加载示例</button>
          <button class="btn-sm" @click="clearData">清空</button>
        </div>
      </div>
      <p class="hint">每行一个数据点，X 和 Y 用逗号分隔。例如：1, 2.3</p>
      <div class="input-grid">
        <div class="input-col">
          <span class="input-label">X 数据（逗号或换行分隔）</span>
          <textarea v-model="rawX" class="data-input" placeholder="1, 2, 3, 4, 5..." rows="5" @input="parseData"></textarea>
        </div>
        <div class="input-col">
          <span class="input-label">Y 数据（逗号或换行分隔）</span>
          <textarea v-model="rawY" class="data-input" placeholder="2.1, 4.0, 5.8, 8.1, 9.9..." rows="5" @input="parseData"></textarea>
        </div>
      </div>
      <div class="data-info">
        <span>有效数据点：<strong>{{ points.length }}</strong></span>
      </div>
    </div>

    <!-- 回归类型选择 -->
    <div v-if="points.length >= 2" class="section">
      <label>回归类型</label>
      <div class="type-buttons">
        <button
          v-for="t in regressionTypes"
          :key="t.key"
          class="btn-type"
          :class="{ active: selectedType === t.key }"
          @click="selectedType = t.key"
        >
          {{ t.name }}
        </button>
      </div>
      <!-- 多项式阶数 -->
      <div v-if="selectedType === 'polynomial'" class="param-row">
        <span>阶数：</span>
        <div class="param-btns">
          <button v-for="d in [2, 3, 4, 5]" :key="d" class="btn-param" :class="{ active: polyDegree === d }" @click="polyDegree = d">
            {{ d }}
          </button>
        </div>
      </div>
    </div>

    <!-- 散点图 -->
    <div v-if="points.length >= 2" class="chart-section">
      <h3>📊 散点图与回归线</h3>
      <div class="canvas-wrapper" ref="scatterWrapper">
        <canvas ref="scatterCanvas"></canvas>
      </div>
    </div>

    <!-- 回归结果 -->
    <div v-if="result" class="section result-section">
      <h3>📐 回归结果</h3>
      <div class="result-grid">
        <div class="result-card main">
          <div class="result-label">回归方程</div>
          <div class="result-value">{{ result.equation }}</div>
        </div>
        <div class="result-card">
          <div class="result-label">R² 决定系数</div>
          <div class="result-value" :class="r2Class">{{ result.r2 }}</div>
        </div>
        <div class="result-card">
          <div class="result-label">数据点数</div>
          <div class="result-value">{{ points.length }}</div>
        </div>
        <div v-if="result.rmse !== undefined" class="result-card">
          <div class="result-label">RMSE 均方根误差</div>
          <div class="result-value">{{ result.rmse }}</div>
        </div>
      </div>
    </div>

    <!-- 预测 -->
    <div v-if="result" class="section predict-section">
      <h3>🔮 预测</h3>
      <div class="predict-row">
        <input v-model.number="predictX" type="number" placeholder="输入 X 值" class="input-num" />
        <span class="predict-arrow">→</span>
        <span class="predict-result">ŷ = {{ predictY }}</span>
      </div>
    </div>

    <!-- 数据表格 -->
    <div v-if="points.length > 0" class="section">
      <h3>📋 数据表</h3>
      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>X</th>
              <th>Y</th>
              <th v-if="result">预测 ŷ</th>
              <th v-if="result">残差</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p, i) in points" :key="i">
              <td>{{ i + 1 }}</td>
              <td>{{ p.x }}</td>
              <td>{{ p.y }}</td>
              <td v-if="result">{{ fmt(predict(p.x)) }}</td>
              <td v-if="result" :class="{ 'residual-high': Math.abs(p.y - predict(p.x)) > 2 * result.rmseVal }">
                {{ fmt(p.y - predict(p.x)) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 复制按钮 -->
    <div v-if="result" class="action-bar">
      <button class="btn-copy" @click="copyResult">📋 复制回归结果</button>
      <button class="btn-copy btn-json" @click="downloadImage">📸 下载图表</button>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '散点图与回归分析 - 野火小站' })

const rawX = ref('')
const rawY = ref('')
const points = ref([])
const selectedType = ref('linear')
const polyDegree = ref(2)
const predictX = ref(null)

const scatterCanvas = ref(null)
const scatterWrapper = ref(null)

const regressionTypes = [
  { key: 'linear', name: '📈 线性回归' },
  { key: 'polynomial', name: '📊 多项式回归' },
  { key: 'exponential', name: '📉 指数回归' },
  { key: 'logarithmic', name: '📐 对数回归' },
  { key: 'power', name: '⚡ 幂函数回归' },
]

// 解析数据
function parseData() {
  const parseNums = (s) =>
    s.trim().split(/[\n,;]+/).map(v => parseFloat(v.trim())).filter(v => !isNaN(v))
  const xs = parseNums(rawX.value)
  const ys = parseNums(rawY.value)
  const len = Math.min(xs.length, ys.length)
  points.value = Array.from({ length: len }, (_, i) => ({ x: xs[i], y: ys[i] }))
  nextTick(() => { if (points.value.length >= 2) drawScatter() })
}

function loadSample() {
  const xs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  const ys = [2.1, 4.0, 5.8, 7.9, 10.1, 11.8, 14.2, 15.9, 18.1, 20.3, 21.8, 24.1]
  rawX.value = xs.join(', ')
  rawY.value = ys.join(', ')
  parseData()
}

function clearData() {
  rawX.value = ''
  rawY.value = ''
  points.value = []
}

const fmt = (v, d = 4) => {
  if (v === null || v === undefined || isNaN(v)) return '-'
  return Number.isInteger(v) ? String(v) : v.toFixed(d).replace(/\.?0+$/, '')
}

// ========= 回归计算 =========

// 线性回归
function linearRegression(pts) {
  const n = pts.length
  let sx = 0, sy = 0, sxy = 0, sx2 = 0
  for (const p of pts) { sx += p.x; sy += p.y; sxy += p.x * p.y; sx2 += p.x * p.x }
  const denom = n * sx2 - sx * sx
  if (Math.abs(denom) < 1e-10) return null
  const a = (n * sxy - sx * sy) / denom
  const b = (sy - a * sx) / n
  const fn = (x) => a * x + b
  return { fn, equation: `y = ${fmt(a)}x + ${fmt(b)}` }
}

// 多项式回归（最小二乘法 + 高斯消元）
function polynomialRegression(pts, degree) {
  const n = pts.length
  const size = degree + 1
  // 构建正规方程矩阵 (X^T X)a = X^T y
  const matrix = Array.from({ length: size }, () => Array(size + 1).fill(0))
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      let sum = 0
      for (const p of pts) sum += Math.pow(p.x, i + j)
      matrix[i][j] = sum
    }
    let sum = 0
    for (const p of pts) sum += p.y * Math.pow(p.x, i)
    matrix[i][size] = sum
  }

  // 高斯消元
  for (let i = 0; i < size; i++) {
    let maxRow = i
    for (let k = i + 1; k < size; k++) {
      if (Math.abs(matrix[k][i]) > Math.abs(matrix[maxRow][i])) maxRow = k
    }
    [matrix[i], matrix[maxRow]] = [matrix[maxRow], matrix[i]]
    if (Math.abs(matrix[i][i]) < 1e-10) return null
    for (let k = i + 1; k < size; k++) {
      const factor = matrix[k][i] / matrix[i][i]
      for (let j = i; j <= size; j++) matrix[k][j] -= factor * matrix[i][j]
    }
  }

  const coeffs = Array(size).fill(0)
  for (let i = size - 1; i >= 0; i--) {
    coeffs[i] = matrix[i][size]
    for (let j = i + 1; j < size; j++) coeffs[i] -= matrix[i][j] * coeffs[j]
    coeffs[i] /= matrix[i][i]
  }

  const fn = (x) => coeffs.reduce((s, c, i) => s + c * Math.pow(x, i), 0)
  const parts = coeffs.map((c, i) => {
    if (i === 0) return fmt(c)
    if (i === 1) return `${fmt(c)}x`
    return `${fmt(c)}x^${i}`
  }).reverse()
  const equation = `y = ${parts.join(' + ').replace(/\+ -/g, '- ')}`
  return { fn, equation }
}

// 指数回归: y = a * e^(bx)
function exponentialRegression(pts) {
  const valid = pts.filter(p => p.y > 0)
  if (valid.length < 2) return null
  const logPts = valid.map(p => ({ x: p.x, y: Math.log(p.y) }))
  const lin = linearRegression(logPts)
  if (!lin) return null
  const b = lin.a
  const a = Math.exp(lin.b)
  const fn = (x) => a * Math.exp(b * x)
  const equation = `y = ${fmt(a)} · e^(${fmt(b)}x)`
  return { fn, equation }
}

// 对数回归: y = a + b * ln(x)
function logarithmicRegression(pts) {
  const valid = pts.filter(p => p.x > 0)
  if (valid.length < 2) return null
  const logPts = valid.map(p => ({ x: Math.log(p.x), y: p.y }))
  const lin = linearRegression(logPts)
  if (!lin) return null
  const a = lin.b
  const b = lin.a
  const fn = (x) => a + b * Math.log(Math.max(x, 1e-10))
  const equation = `y = ${fmt(a)} + ${fmt(b)} · ln(x)`
  return { fn, equation }
}

// 幂函数回归: y = a * x^b
function powerRegression(pts) {
  const valid = pts.filter(p => p.x > 0 && p.y > 0)
  if (valid.length < 2) return null
  const logPts = valid.map(p => ({ x: Math.log(p.x), y: Math.log(p.y) }))
  const lin = linearRegression(logPts)
  if (!lin) return null
  const b = lin.a
  const a = Math.exp(lin.b)
  const fn = (x) => a * Math.pow(Math.max(x, 1e-10), b)
  const equation = `y = ${fmt(a)} · x^${fmt(b)}`
  return { fn, equation }
}

// 计算 R²
function calcR2(pts, fn) {
  const mean = pts.reduce((s, p) => s + p.y, 0) / pts.length
  let ssRes = 0, ssTot = 0
  for (const p of pts) {
    ssRes += (p.y - fn(p.x)) ** 2
    ssTot += (p.y - mean) ** 2
  }
  return ssTot === 0 ? 1 : 1 - ssRes / ssTot
}

// 计算 RMSE
function calcRMSE(pts, fn) {
  const n = pts.length
  return Math.sqrt(pts.reduce((s, p) => s + (p.y - fn(p.x)) ** 2, 0) / n)
}

// 回归结果
const result = computed(() => {
  if (points.value.length < 2) return null
  let reg
  switch (selectedType.value) {
    case 'linear': reg = linearRegression(points.value); break
    case 'polynomial': reg = polynomialRegression(points.value, polyDegree.value); break
    case 'exponential': reg = exponentialRegression(points.value); break
    case 'logarithmic': reg = logarithmicRegression(points.value); break
    case 'power': reg = powerRegression(points.value); break
  }
  if (!reg) return null
  const r2 = calcR2(points.value, reg.fn)
  const rmse = calcRMSE(points.value, reg.fn)
  return { ...reg, r2: fmt(r2), r2Val: r2, rmse: fmt(rmse), rmseVal: rmse }
})

// 预测函数
function predict(x) {
  if (!result.value || x == null || isNaN(x)) return null
  return result.value.fn(x)
}

const predictY = computed(() => {
  if (!result.value || predictX.value == null) return '输入 X 值'
  return fmt(predict(predictX.value))
})

const r2Class = computed(() => {
  if (!result.value) return ''
  const v = result.value.r2Val
  if (v >= 0.95) return 'r2-excellent'
  if (v >= 0.8) return 'r2-good'
  if (v >= 0.6) return 'r2-fair'
  return 'r2-poor'
})

// ========= 散点图绘制 =========
function drawScatter() {
  const canvas = scatterCanvas.value
  const wrapper = scatterWrapper.value
  if (!canvas || !wrapper) return

  const dpr = window.devicePixelRatio || 1
  const width = wrapper.clientWidth - 40
  const height = 400
  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = width + 'px'
  canvas.style.height = height + 'px'
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, width, height)

  const pts = points.value
  const xs = pts.map(p => p.x)
  const ys = pts.map(p => p.y)
  let xMin = Math.min(...xs), xMax = Math.max(...xs)
  let yMin = Math.min(...ys), yMax = Math.max(...ys)

  // 如果有回归线，扩展范围以包含预测曲线
  if (result.value) {
    const xPad = (xMax - xMin) * 0.1 || 1
    const extMin = xMin - xPad
    const extMax = xMax + xPad
    for (let i = 0; i <= 100; i++) {
      const x = extMin + (extMax - extMin) * i / 100
      const y = result.value.fn(x)
      if (isFinite(y)) {
        yMin = Math.min(yMin, y)
        yMax = Math.max(yMax, y)
      }
    }
    xMin = extMin
    xMax = extMax
  }

  const xRange = xMax - xMin || 1
  const yRange = yMax - yMin || 1
  const pad = { top: 20, right: 30, bottom: 40, left: 55 }
  const chartW = width - pad.left - pad.right
  const chartH = height - pad.top - pad.bottom

  const toSX = (x) => pad.left + ((x - xMin) / xRange) * chartW
  const toSY = (y) => pad.top + chartH - ((y - yMin) / yRange) * chartH

  // 背景
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, width, height)

  // 网格
  ctx.strokeStyle = '#f0f0f0'
  ctx.lineWidth = 1
  for (let i = 0; i <= 5; i++) {
    const y = pad.top + (chartH / 5) * i
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(width - pad.right, y); ctx.stroke()
  }
  for (let i = 0; i <= 5; i++) {
    const x = pad.left + (chartW / 5) * i
    ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + chartH); ctx.stroke()
  }

  // 坐标轴标签
  ctx.fillStyle = '#888'
  ctx.font = '10px -apple-system, sans-serif'
  ctx.textAlign = 'center'
  for (let i = 0; i <= 5; i++) {
    const x = pad.left + (chartW / 5) * i
    const val = xMin + (xRange / 5) * i
    ctx.fillText(fmt(val, 2), x, height - pad.bottom + 18)
  }
  ctx.textAlign = 'right'
  for (let i = 0; i <= 5; i++) {
    const y = pad.top + (chartH / 5) * i
    const val = yMax - (yRange / 5) * i
    ctx.fillText(fmt(val, 2), pad.left - 8, y + 4)
  }

  // 回归曲线
  if (result.value) {
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 2.5
    ctx.setLineDash([])
    ctx.beginPath()
    let started = false
    for (let i = 0; i <= 200; i++) {
      const x = xMin + (xRange * i) / 200
      const y = result.value.fn(x)
      if (!isFinite(y)) { started = false; continue }
      const sx = toSX(x)
      const sy = toSY(y)
      if (!started) { ctx.moveTo(sx, sy); started = true } else ctx.lineTo(sx, sy)
    }
    ctx.stroke()
  }

  // 数据点
  for (const p of pts) {
    const sx = toSX(p.x)
    const sy = toSY(p.y)
    ctx.fillStyle = '#22c55e'
    ctx.beginPath()
    ctx.arc(sx, sy, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#16a34a'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }

  // 图例
  if (result.value) {
    ctx.fillStyle = '#fff'
    ctx.fillRect(width - pad.right - 160, pad.top + 5, 155, 45)
    ctx.strokeStyle = '#eee'
    ctx.strokeRect(width - pad.right - 160, pad.top + 5, 155, 45)

    // 数据点图例
    ctx.fillStyle = '#22c55e'
    ctx.beginPath()
    ctx.arc(width - pad.right - 145, pad.top + 20, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#555'
    ctx.font = '11px -apple-system, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('数据点', width - pad.right - 135, pad.top + 24)

    // 回归线图例
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(width - pad.right - 155, pad.top + 38)
    ctx.lineTo(width - pad.right - 135, pad.top + 38)
    ctx.stroke()
    ctx.fillStyle = '#555'
    ctx.fillText('回归线', width - pad.right - 135, pad.top + 42)
  }
}

// 复制结果
function copyResult() {
  if (!result.value) return
  const text = [
    `回归类型: ${regressionTypes.find(t => t.key === selectedType.value)?.name}`,
    `回归方程: ${result.value.equation}`,
    `R² = ${result.value.r2}`,
    `RMSE = ${result.value.rmse}`,
    `数据点数: ${points.value.length}`,
  ].join('\n')
  navigator.clipboard.writeText(text).then(() => alert('已复制回归结果'))
}

// 下载图表
function downloadImage() {
  const canvas = scatterCanvas.value
  if (!canvas) return
  const link = document.createElement('a')
  link.download = 'scatter-regression.png'
  link.href = canvas.toDataURL()
  link.click()
}

// 响应式重绘
onMounted(() => {
  window.addEventListener('resize', () => { if (points.value.length >= 2) drawScatter() })
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
  margin-bottom: 0.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.section-header label {
  margin-bottom: 0;
}

.hint {
  font-size: 0.8rem;
  color: #aaa;
  margin-bottom: 0.8rem;
}

.btn-group { display: flex; gap: 0.5rem; }

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

.input-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
}

.input-label {
  font-size: 0.8rem;
  color: #888;
  margin-bottom: 0.3rem;
  display: block;
}

.data-input {
  width: 100%;
  padding: 0.7rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: 'Courier New', monospace;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
}

.data-input:focus { border-color: #22c55e; }

.data-info {
  font-size: 0.85rem;
  color: #888;
  margin-top: 0.5rem;
}

.data-info strong { color: #22c55e; }

/* 回归类型按钮 */
.type-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.8rem;
}

.btn-type {
  padding: 0.5rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: #f8f9fa;
  font-size: 0.85rem;
  color: #555;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-type:hover { border-color: #22c55e; color: #22c55e; }
.btn-type.active { background: #f0fdf4; border-color: #22c55e; color: #16a34a; font-weight: 600; }

.param-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.9rem;
  color: #666;
}

.param-btns { display: flex; gap: 0.4rem; }

.btn-param {
  width: 32px; height: 32px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #f8f9fa;
  font-size: 0.85rem;
  color: #555;
  cursor: pointer;
}

.btn-param.active { background: #22c55e; color: white; border-color: #22c55e; }

/* 图表 */
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

/* 结果 */
.result-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 0.8rem;
}

.result-card {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 1rem;
  text-align: center;
}

.result-card.main {
  grid-row: span 2;
  background: #f0fdf4;
}

.result-label { font-size: 0.8rem; color: #888; margin-bottom: 0.3rem; }

.result-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #2c3e50;
  font-family: 'Courier New', monospace;
}

.result-value.r2-excellent { color: #16a34a; }
.result-value.r2-good { color: #22c55e; }
.result-value.r2-fair { color: #f59e0b; }
.result-value.r2-poor { color: #ef4444; }

/* 预测 */
.predict-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.input-num {
  width: 150px;
  padding: 0.6rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
}

.input-num:focus { border-color: #22c55e; }

.predict-arrow { font-size: 1.2rem; color: #888; }

.predict-result {
  font-size: 1.3rem;
  font-weight: 700;
  color: #22c55e;
  font-family: 'Courier New', monospace;
}

/* 数据表 */
.table-scroll { overflow-x: auto; }

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.data-table th {
  background: #f8f9fa;
  padding: 0.5rem;
  font-weight: 600;
  color: #555;
  border-bottom: 2px solid #eee;
}

.data-table td {
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid #f5f5f5;
  text-align: right;
  font-family: 'Courier New', monospace;
}

.residual-high { color: #ef4444; font-weight: 600; }

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
.btn-json { background: linear-gradient(135deg, #6366f1, #8b5cf6); }

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #22c55e;
  font-weight: 500;
}

.back-link:hover { text-decoration: underline; }

@media (max-width: 768px) {
  .input-grid { grid-template-columns: 1fr; }
  .result-grid { grid-template-columns: 1fr; }
  .result-card.main { grid-row: auto; }
}
</style>
