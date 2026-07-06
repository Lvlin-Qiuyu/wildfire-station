<template>
  <div class="tool-page">
    <h2>🎲 随机数与概率模拟器</h2>
    <p class="subtitle">自定义范围随机数生成、概率分布模拟、掷骰子/抽签/轮盘赌可视化</p>

    <!-- 模式切换 -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.icon }} {{ tab.label }}
      </button>
    </div>

    <!-- ===== 模式一：随机数生成器 ===== -->
    <div v-if="activeTab === 'random'" class="mode-content">
      <div class="controls-card">
        <div class="control-row">
          <div class="control-group">
            <label>最小值</label>
            <input type="number" v-model.number="randMin" class="num-input" />
          </div>
          <div class="control-group">
            <label>最大值</label>
            <input type="number" v-model.number="randMax" class="num-input" />
          </div>
          <div class="control-group">
            <label>生成数量</label>
            <input type="number" v-model.number="randCount" min="1" max="10000" class="num-input" />
          </div>
        </div>
        <div class="check-row">
          <label class="toggle-label">
            <input type="checkbox" v-model="randUnique" />
            不重复（范围内不重复随机数）
          </label>
          <label class="toggle-label">
            <input type="checkbox" v-model="randSort" />
            结果排序
          </label>
        </div>
        <button class="btn-primary" @click="generateRandom">🎯 生成随机数</button>
      </div>

      <!-- 结果展示 -->
      <div v-if="randomResults.length > 0" class="result-section">
        <div class="result-header">
          <span>📊 生成结果（共 {{ randomResults.length }} 个）</span>
          <div class="result-actions">
            <button class="btn-sm" @click="copyText(randomResults.join(', '))">📋 复制</button>
            <button class="btn-sm" @click="downloadText(randomResults.join('\n'), 'random-numbers.txt')">⬇️ 下载</button>
          </div>
        </div>
        <div class="results-grid">
          <span
            v-for="(num, idx) in randomResults"
            :key="idx"
            class="result-chip"
            :style="{ background: chipColor(idx) }"
          >{{ num }}</span>
        </div>
        <!-- 统计信息 -->
        <div class="stats-bar">
          <div class="stat-item">
            <span class="stat-label">最小值</span>
            <span class="stat-value">{{ stats.min }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">最大值</span>
            <span class="stat-value">{{ stats.max }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">平均值</span>
            <span class="stat-value">{{ stats.avg }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">中位数</span>
            <span class="stat-value">{{ stats.median }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 模式二：概率分布模拟 ===== -->
    <div v-if="activeTab === 'distribution'" class="mode-content">
      <div class="controls-card">
        <div class="control-row">
          <div class="control-group">
            <label>分布类型</label>
            <select v-model="distType" class="select-input">
              <option value="uniform">均匀分布</option>
              <option value="normal">正态分布（高斯）</option>
              <option value="poisson">泊松分布</option>
              <option value="exponential">指数分布</option>
            </select>
          </div>
          <div class="control-group" v-if="distType === 'normal'">
            <label>均值 (μ)</label>
            <input type="number" v-model.number="normalMean" class="num-input" />
          </div>
          <div class="control-group" v-if="distType === 'normal'">
            <label>标准差 (σ)</label>
            <input type="number" v-model.number="normalStd" min="0.1" step="0.1" class="num-input" />
          </div>
          <div class="control-group" v-if="distType === 'poisson'">
            <label>λ (期望值)</label>
            <input type="number" v-model.number="poissonLambda" min="0.1" step="0.1" class="num-input" />
          </div>
          <div class="control-group" v-if="distType === 'exponential'">
            <label>λ (速率)</label>
            <input type="number" v-model.number="expLambda" min="0.1" step="0.1" class="num-input" />
          </div>
        </div>
        <div class="control-row">
          <div class="control-group">
            <label>样本数量</label>
            <input type="number" v-model.number="distSamples" min="10" max="100000" class="num-input" />
          </div>
          <div class="control-group">
            <label>柱数</label>
            <input type="number" v-model.number="distBins" min="5" max="100" class="num-input" />
          </div>
        </div>
        <button class="btn-primary" @click="simulateDistribution">📈 模拟分布</button>
      </div>

      <!-- 分布直方图 -->
      <div v-if="histogramData.length > 0" class="result-section">
        <div class="result-header">
          <span>📊 {{ distTypeLabel }}分布直方图</span>
          <div class="result-actions">
            <button class="btn-sm" @click="downloadChart">⬇️ 下载图片</button>
          </div>
        </div>
        <div class="chart-container">
          <canvas ref="histCanvas" width="700" height="350"></canvas>
        </div>
        <div class="stats-bar">
          <div class="stat-item">
            <span class="stat-label">样本均值</span>
            <span class="stat-value">{{ distStats.mean }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">样本标准差</span>
            <span class="stat-value">{{ distStats.std }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">最小值</span>
            <span class="stat-value">{{ distStats.min }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">最大值</span>
            <span class="stat-value">{{ distStats.max }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 模式三：掷骰子 ===== -->
    <div v-if="activeTab === 'dice'" class="mode-content">
      <div class="controls-card">
        <div class="control-row">
          <div class="control-group">
            <label>骰子数量</label>
            <input type="number" v-model.number="diceCount" min="1" max="10" class="num-input" />
          </div>
          <div class="control-group">
            <label>面数</label>
            <select v-model="diceSides" class="select-input">
              <option :value="6">6面 (D6)</option>
              <option :value="4">4面 (D4)</option>
              <option :value="8">8面 (D8)</option>
              <option :value="10">10面 (D10)</option>
              <option :value="12">12面 (D12)</option>
              <option :value="20">20面 (D20)</option>
              <option :value="100">100面 (D100)</option>
            </select>
          </div>
          <div class="control-group">
            <label>投掷次数</label>
            <input type="number" v-model.number="diceRolls" min="1" max="1000" class="num-input" />
          </div>
        </div>
        <button class="btn-primary" @click="rollDice">🎲 掷骰子</button>
      </div>

      <!-- 骰子结果 -->
      <div v-if="diceResults.length > 0" class="result-section">
        <div class="result-header">
          <span>🎲 掷骰子结果</span>
          <div class="result-actions">
            <button class="btn-sm" @click="copyText(diceResults.map(r => r.values.join('+') + '=' + r.total).join(', '))">📋 复制</button>
          </div>
        </div>

        <!-- 最近一次骰子可视化 -->
        <div class="dice-visual">
          <div class="dice-row">
            <div v-for="(val, idx) in diceResults[diceResults.length - 1].values" :key="idx" class="die" :class="{ rolling: isRolling }">
              {{ val }}
            </div>
          </div>
          <div class="dice-total">
            总点数：<strong>{{ diceResults[diceResults.length - 1].total }}</strong>
          </div>
        </div>

        <!-- 历史记录 -->
        <div v-if="diceResults.length > 1" class="dice-history">
          <div class="history-title">历史记录（最近 {{ diceHistoryLimit }} 次）</div>
          <div class="history-list">
            <div v-for="(r, idx) in recentDiceResults" :key="idx" class="history-item">
              <span class="history-idx">#{{ diceResults.length - idx }}</span>
              <span class="history-dice">{{ r.values.join(' + ') }}</span>
              <span class="history-total">= {{ r.total }}</span>
            </div>
          </div>
        </div>

        <!-- 骰子分布 -->
        <div v-if="diceHistorySum.length > 1" class="chart-container">
          <canvas ref="diceCanvas" width="700" height="250"></canvas>
        </div>
      </div>
    </div>

    <!-- ===== 模式四：轮盘赌 ===== -->
    <div v-if="activeTab === 'roulette'" class="mode-content">
      <div class="controls-card">
        <div class="input-header">
          <label>轮盘选项（每行一个）</label>
          <div class="input-actions">
            <button class="btn-sm" @click="loadRouletteExample">示例</button>
            <button class="btn-sm" @click="rouletteInput = ''">清空</button>
          </div>
        </div>
        <textarea
          v-model="rouletteInput"
          class="textarea-input"
          placeholder="每行一个选项，例如：&#10;火锅&#10;烧烤&#10;日料&#10;西餐&#10;麻辣烫"
          rows="5"
        ></textarea>
        <button class="btn-primary" @click="spinRoulette" :disabled="rouletteItems.length < 2" style="margin-top:0.8rem">
          🎡 开始旋转
        </button>
      </div>

      <!-- 轮盘可视化 -->
      <div v-if="rouletteItems.length >= 2" class="roulette-section">
        <div class="roulette-wheel-wrap">
          <div class="roulette-pointer">▼</div>
          <div class="roulette-wheel" :style="{ transform: `rotate(${rouletteAngle}deg)` }">
            <div
              v-for="(item, idx) in rouletteItems"
              :key="idx"
              class="roulette-segment"
              :style="rouletteSegmentStyle(idx)"
            >
              <span class="segment-text">{{ item }}</span>
            </div>
          </div>
        </div>
        <div v-if="isRouletteSpinning" class="spin-status">旋转中...</div>
      </div>

      <!-- 轮盘结果 -->
      <div v-if="rouletteWinner && !isRouletteSpinning" class="result-section">
        <div class="result-header">
          <span>🎰 抽中结果</span>
          <button class="btn-sm" @click="copyText(rouletteWinner)">📋 复制</button>
        </div>
        <div class="winner-display">
          <div class="winner-name">{{ rouletteWinner }}</div>
          <div class="winner-info">共 {{ rouletteItems.length }} 个选项中随机选中</div>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'

useHead({ title: '随机数与概率模拟器 - 野火小站' })

// ===== 模式定义 =====
const tabs = [
  { id: 'random', icon: '🔢', label: '随机数' },
  { id: 'distribution', icon: '📈', label: '概率分布' },
  { id: 'dice', icon: '🎲', label: '掷骰子' },
  { id: 'roulette', icon: '🎡', label: '轮盘赌' },
]
const activeTab = ref('random')

// ===== 颜色常量 =====
const segmentColors = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
  '#14b8a6', '#6366f1', '#84cc16', '#e11d48',
]

function chipColor(idx) {
  return segmentColors[idx % segmentColors.length] + '20'
}

// ===== 模式一：随机数 =====
const randMin = ref(1)
const randMax = ref(100)
const randCount = ref(10)
const randUnique = ref(false)
const randSort = ref(false)
const randomResults = ref([])

const stats = computed(() => {
  if (randomResults.value.length === 0) return { min: '-', max: '-', avg: '-', median: '-' }
  const sorted = [...randomResults.value].sort((a, b) => a - b)
  const len = sorted.length
  const sum = sorted.reduce((s, v) => s + v, 0)
  return {
    min: sorted[0],
    max: sorted[len - 1],
    avg: (sum / len).toFixed(2),
    median: len % 2 === 0 ? ((sorted[len / 2 - 1] + sorted[len / 2]) / 2).toFixed(1) : sorted[Math.floor(len / 2)],
  }
})

function generateRandom() {
  const min = randMin.value
  const max = randMax.value
  const count = Math.min(randCount.value, 10000)

  if (randUnique.value) {
    const range = max - min + 1
    if (range < count) return
    const set = new Set()
    while (set.size < count) {
      set.add(Math.floor(Math.random() * range) + min)
    }
    const arr = [...set]
    randomResults.value = randSort.value ? arr.sort((a, b) => a - b) : arr
  } else {
    const arr = Array.from({ length: count }, () => Math.floor(Math.random() * (max - min + 1)) + min)
    randomResults.value = randSort.value ? arr.sort((a, b) => a - b) : arr
  }
}

// ===== 模式二：概率分布 =====
const distType = ref('normal')
const normalMean = ref(0)
const normalStd = ref(1)
const poissonLambda = ref(5)
const expLambda = ref(1)
const distSamples = ref(1000)
const distBins = ref(30)
const histCanvas = ref(null)
const histogramData = ref([])

const distTypeLabel = computed(() => {
  const map = { uniform: '均匀', normal: '正态', poisson: '泊松', exponential: '指数' }
  return map[distType.value] || ''
})

const distStats = computed(() => {
  if (histogramData.value.length === 0) return { mean: '-', std: '-', min: '-', max: '-' }
  const values = histogramData.value.flatMap(d => Array(d.count).fill(d.value))
  if (values.length === 0) return { mean: '-', std: '-', min: '-', max: '-' }
  const sum = values.reduce((s, v) => s + v, 0)
  const mean = sum / values.length
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
  return {
    mean: mean.toFixed(4),
    std: Math.sqrt(variance).toFixed(4),
    min: Math.min(...values).toFixed(4),
    max: Math.max(...values).toFixed(4),
  }
})

// Box-Muller 正态分布
function boxMuller() {
  let u1 = Math.random()
  let u2 = Math.random()
  // 避免 log(0)
  while (u1 === 0) u1 = Math.random()
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return z * normalStd.value + normalMean.value
}

// 泊松分布（Knuth 算法）
function poissonRandom(lambda) {
  const L = Math.exp(-lambda)
  let k = 0
  let p = 1
  do {
    k++
    p *= Math.random()
  } while (p > L)
  return k - 1
}

// 指数分布
function expRandom(lambda) {
  let u = Math.random()
  while (u === 0) u = Math.random()
  return -Math.log(u) / lambda
}

function simulateDistribution() {
  const n = Math.min(distSamples.value, 100000)
  const values = []

  for (let i = 0; i < n; i++) {
    if (distType.value === 'normal') values.push(boxMuller())
    else if (distType.value === 'poisson') values.push(poissonRandom(poissonLambda.value))
    else if (distType.value === 'exponential') values.push(expRandom(expLambda.value))
    else values.push(Math.random()) // 均匀分布 [0, 1)
  }

  // 构建直方图
  const min = Math.min(...values)
  const max = Math.max(...values)
  const binWidth = (max - min) / distBins.value
  const bins = Array.from({ length: distBins.value }, (_, i) => ({
    value: min + (i + 0.5) * binWidth,
    min: min + i * binWidth,
    max: min + (i + 1) * binWidth,
    count: 0,
  }))

  values.forEach(v => {
    let idx = Math.floor((v - min) / binWidth)
    if (idx >= distBins.value) idx = distBins.value - 1
    if (idx < 0) idx = 0
    bins[idx].count++
  })

  histogramData.value = bins
  nextTick(drawHistogram)
}

function drawHistogram() {
  const canvas = histCanvas.value
  if (!canvas) return
  const dpr = window.devicePixelRatio || 1
  const w = 700
  const h = 350
  canvas.width = w * dpr
  canvas.height = h * dpr
  canvas.style.width = '100%'
  canvas.style.maxWidth = w + 'px'
  canvas.style.height = 'auto'

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, w, h)

  const data = histogramData.value
  if (data.length === 0) return

  const padding = { top: 20, right: 20, bottom: 40, left: 50 }
  const chartW = w - padding.left - padding.right
  const chartH = h - padding.top - padding.bottom

  const maxCount = Math.max(...data.map(d => d.count))
  const barWidth = chartW / data.length

  // 绘制柱子
  data.forEach((d, i) => {
    const barH = (d.count / maxCount) * chartH
    const x = padding.left + i * barWidth
    const y = padding.top + chartH - barH

    // 渐变色
    const grad = ctx.createLinearGradient(x, y, x, padding.top + chartH)
    grad.addColorStop(0, '#22c55e')
    grad.addColorStop(1, '#10b981')
    ctx.fillStyle = grad
    ctx.fillRect(x + 1, y, barWidth - 2, barH)
  })

  // 坐标轴
  ctx.strokeStyle = '#ddd'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(padding.left, padding.top)
  ctx.lineTo(padding.left, padding.top + chartH)
  ctx.lineTo(w - padding.right, padding.top + chartH)
  ctx.stroke()

  // X 轴标签
  ctx.fillStyle = '#888'
  ctx.font = '10px system-ui, sans-serif'
  ctx.textAlign = 'center'
  const labelStep = Math.max(1, Math.floor(data.length / 8))
  data.forEach((d, i) => {
    if (i % labelStep === 0 || i === data.length - 1) {
      const x = padding.left + (i + 0.5) * barWidth
      ctx.fillText(d.value.toFixed(1), x, h - padding.bottom + 16)
    }
  })

  // Y 轴标签
  ctx.textAlign = 'right'
  const ySteps = 5
  for (let i = 0; i <= ySteps; i++) {
    const val = Math.round((maxCount / ySteps) * i)
    const y = padding.top + chartH - (i / ySteps) * chartH
    ctx.fillText(val.toString(), padding.left - 6, y + 3)

    // 网格线
    ctx.beginPath()
    ctx.strokeStyle = '#f0f0f0'
    ctx.moveTo(padding.left, y)
    ctx.lineTo(w - padding.right, y)
    ctx.stroke()
  }
}

function downloadChart() {
  const canvas = histCanvas.value
  if (!canvas) return
  const link = document.createElement('a')
  link.download = 'distribution-chart.png'
  link.href = canvas.toDataURL('image/png')
  link.click()
}

// ===== 模式三：掷骰子 =====
const diceCount = ref(2)
const diceSides = ref(6)
const diceRolls = ref(1)
const diceResults = ref([])
const isRolling = ref(false)
const diceCanvas = ref(null)
const diceHistoryLimit = 10

const recentDiceResults = computed(() => {
  return diceResults.value.slice(-diceHistoryLimit).reverse()
})

const diceHistorySum = computed(() => {
  return diceResults.value.map(r => r.total)
})

function rollDice() {
  isRolling.value = true

  // 动画效果
  setTimeout(() => {
    const results = []
    for (let r = 0; r < diceRolls.value; r++) {
      const values = Array.from({ length: diceCount.value }, () => Math.floor(Math.random() * diceSides.value) + 1)
      results.push({
        values,
        total: values.reduce((s, v) => s + v, 0),
      })
    }
    diceResults.value = [...diceResults.value, ...results].slice(-100) // 最多保留100条
    isRolling.value = false
    nextTick(drawDiceChart)
  }, 500)
}

function drawDiceChart() {
  const canvas = diceCanvas.value
  if (!canvas) return

  const totals = diceHistorySum.value
  if (totals.length < 2) return

  const dpr = window.devicePixelRatio || 1
  const w = 700
  const h = 250
  canvas.width = w * dpr
  canvas.height = h * dpr
  canvas.style.width = '100%'
  canvas.style.maxWidth = w + 'px'
  canvas.style.height = 'auto'

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, w, h)

  // 频率统计
  const min = Math.min(...totals)
  const max = Math.max(...totals)
  const range = max - min + 1
  const freq = Array.from({ length: range }, (_, i) => ({
    value: min + i,
    count: 0,
  }))
  totals.forEach(v => {
    const idx = v - min
    if (idx >= 0 && idx < range) freq[idx].count++
  })

  const padding = { top: 20, right: 20, bottom: 40, left: 50 }
  const chartW = w - padding.left - padding.right
  const chartH = h - padding.top - padding.bottom
  const maxCount = Math.max(...freq.map(f => f.count))
  const barWidth = chartW / freq.length

  freq.forEach((f, i) => {
    const barH = maxCount > 0 ? (f.count / maxCount) * chartH : 0
    const x = padding.left + i * barWidth
    const y = padding.top + chartH - barH
    ctx.fillStyle = '#3b82f6'
    ctx.fillRect(x + 1, y, barWidth - 2, barH)

    // 数值标签
    ctx.fillStyle = '#333'
    ctx.font = 'bold 11px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(f.count.toString(), x + barWidth / 2, y - 4)
  })

  // X 轴
  ctx.strokeStyle = '#ddd'
  ctx.beginPath()
  ctx.moveTo(padding.left, padding.top + chartH)
  ctx.lineTo(w - padding.right, padding.top + chartH)
  ctx.stroke()

  // X 轴标签
  ctx.fillStyle = '#888'
  ctx.font = '10px system-ui, sans-serif'
  freq.forEach((f, i) => {
    const x = padding.left + (i + 0.5) * barWidth
    ctx.fillText(f.value.toString(), x, h - padding.bottom + 16)
  })
}

// ===== 模式四：轮盘赌 =====
const rouletteInput = ref('')
const rouletteAngle = ref(0)
const isRouletteSpinning = ref(false)
const rouletteWinner = ref(null)

const rouletteItems = computed(() =>
  rouletteInput.value.split('\n').map(s => s.trim()).filter(s => s.length > 0)
)

function rouletteSegmentStyle(idx) {
  const total = rouletteItems.value.length
  const angle = 360 / total
  const offset = idx * angle
  return {
    transform: `rotate(${offset}deg)`,
    background: segmentColors[idx % segmentColors.length],
    clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.sin(angle * Math.PI / 180)}% ${50 - 50 * Math.cos(angle * Math.PI / 180)}%)`,
  }
}

function spinRoulette() {
  if (rouletteItems.value.length < 2) return

  isRouletteSpinning.value = true
  rouletteWinner.value = null

  const total = rouletteItems.value.length
  const anglePerItem = 360 / total

  // 随机选中一个
  const winnerIdx = Math.floor(Math.random() * total)
  // 计算目标角度（指针在顶部，即12点位置，需旋转使得选中项对齐顶部）
  const targetOffset = winnerIdx * anglePerItem + anglePerItem / 2
  const totalRotation = 360 * (8 + Math.floor(Math.random() * 5)) + (360 - targetOffset)

  const duration = 4000
  const startTime = Date.now()
  const startAngle = rouletteAngle.value

  function animate() {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    // 缓出曲线
    const ease = 1 - Math.pow(1 - progress, 4)
    rouletteAngle.value = startAngle + totalRotation * ease

    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      isRouletteSpinning.value = false
      rouletteWinner.value = rouletteItems.value[winnerIdx]
    }
  }
  requestAnimationFrame(animate)
}

function loadRouletteExample() {
  rouletteInput.value = '火锅\n烧烤\n日料\n西餐\n麻辣烫\n饺子\n汉堡\n沙拉'
}

// ===== 通用工具 =====
function copyText(text) {
  navigator.clipboard.writeText(text)
}

function downloadText(content, filename) {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.tool-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
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

/* 模式标签 */
.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.2rem;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 0.5rem 1.2rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.tab-btn:hover {
  border-color: #22c55e;
}

.tab-btn.active {
  border-color: #22c55e;
  background: #f0fdf4;
  color: #22a34a;
  font-weight: 600;
}

/* 模式内容 */
.mode-content {
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 控制卡片 */
.controls-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 1.2rem;
}

.control-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.8rem;
}

.control-group {
  flex: 1;
  min-width: 120px;
}

.control-group label {
  display: block;
  font-size: 0.85rem;
  color: #555;
  margin-bottom: 0.3rem;
  font-weight: 600;
}

.num-input,
.select-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  background: white;
}

.num-input:focus,
.select-input:focus {
  outline: none;
  border-color: #10b981;
}

.check-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.8rem;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  font-size: 0.85rem;
  color: #555;
}

.toggle-label input {
  accent-color: #22c55e;
}

.btn-primary {
  padding: 0.7rem 1.5rem;
  background: #22c55e;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #16a34a;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-sm {
  padding: 0.3rem 0.8rem;
  background: #22c55e;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: opacity 0.2s;
}

.btn-sm:hover { opacity: 0.85; }

/* 结果区域 */
.result-section {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  margin-bottom: 1.2rem;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 1rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
}

.result-actions {
  display: flex;
  gap: 0.5rem;
}

/* 随机数结果网格 */
.results-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding: 1rem;
}

.result-chip {
  padding: 0.3rem 0.7rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
}

/* 统计栏 */
.stats-bar {
  display: flex;
  gap: 0;
  border-top: 1px solid #eee;
  background: #fafafa;
}

.stat-item {
  flex: 1;
  padding: 0.6rem;
  text-align: center;
  border-right: 1px solid #eee;
}

.stat-item:last-child {
  border-right: none;
}

.stat-label {
  display: block;
  font-size: 0.7rem;
  color: #999;
  margin-bottom: 0.15rem;
}

.stat-value {
  font-size: 0.95rem;
  font-weight: 700;
  color: #2c3e50;
}

/* 图表容器 */
.chart-container {
  padding: 1rem;
  overflow-x: auto;
}

.chart-container canvas {
  display: block;
}

/* 骰子 */
.dice-visual {
  padding: 1.5rem;
  text-align: center;
}

.dice-row {
  display: flex;
  justify-content: center;
  gap: 0.8rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.die {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #f9fafb, #e5e7eb);
  border: 2px solid #ddd;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.die.rolling {
  animation: diceRoll 0.1s ease-in-out 4;
}

@keyframes diceRoll {
  0% { transform: rotate(0deg) scale(1); }
  25% { transform: rotate(90deg) scale(0.9); }
  50% { transform: rotate(180deg) scale(1.1); }
  75% { transform: rotate(270deg) scale(0.95); }
  100% { transform: rotate(360deg) scale(1); }
}

.dice-total {
  font-size: 1.1rem;
  color: #555;
}

.dice-total strong {
  color: #22c55e;
  font-size: 1.5rem;
}

/* 骰子历史 */
.dice-history {
  padding: 0.8rem 1rem;
  border-top: 1px solid #eee;
}

.history-title {
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.3rem 0.6rem;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 0.82rem;
}

.history-idx {
  color: #999;
  font-weight: 600;
  min-width: 30px;
}

.history-dice {
  color: #555;
}

.history-total {
  font-weight: 700;
  color: #22c55e;
}

/* 轮盘赌 */
.input-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.input-header label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
}

.input-actions {
  display: flex;
  gap: 0.5rem;
}

.textarea-input {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.8rem;
  font-size: 0.9rem;
  resize: vertical;
  font-family: inherit;
  line-height: 1.6;
}

.textarea-input:focus {
  outline: none;
  border-color: #22c55e;
}

.roulette-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 0;
  margin-bottom: 1rem;
}

.roulette-wheel-wrap {
  position: relative;
  width: 280px;
  height: 280px;
}

.roulette-pointer {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.5rem;
  color: #ef4444;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  z-index: 10;
}

.roulette-wheel {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  position: relative;
  border: 3px solid #333;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.roulette-segment {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: 50% 50%;
}

.segment-text {
  font-size: 0.75rem;
  color: white;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
  position: absolute;
  top: 25%;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
}

.spin-status {
  margin-top: 1rem;
  font-size: 1rem;
  color: #555;
  font-weight: 600;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.winner-display {
  padding: 2rem;
  text-align: center;
}

.winner-name {
  font-size: 2.5rem;
  font-weight: 800;
  color: #22c55e;
  margin-bottom: 0.5rem;
}

.winner-info {
  font-size: 0.9rem;
  color: #888;
}

.back-link {
  display: inline-block;
  margin-top: 1.5rem;
  color: #22c55e;
  font-weight: 500;
}

.back-link:hover { text-decoration: underline; }

@media (max-width: 640px) {
  .control-row {
    flex-direction: column;
  }
  .stats-bar {
    flex-wrap: wrap;
  }
  .stat-item {
    min-width: 50%;
    border-bottom: 1px solid #eee;
  }
  .roulette-wheel-wrap {
    width: 240px;
    height: 240px;
  }
}
</style>
