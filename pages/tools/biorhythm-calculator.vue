<template>
  <div class="tool-page">
    <h2>🌊 人体精力节律计算器</h2>
    <p class="subtitle">基于生物节律理论，输入生日查看体力、情绪、智力三周期状态</p>

    <!-- 输入区域 -->
    <div class="input-card">
      <div class="input-row">
        <div class="input-group">
          <label>出生日期</label>
          <input type="date" v-model="birthday" class="date-input" />
        </div>
        <div class="input-group">
          <label>查询日期（默认今天）</label>
          <input type="date" v-model="targetDate" class="date-input" />
        </div>
      </div>
      <button class="btn btn-primary" @click="calculate">🔄 计算节律</button>
    </div>

    <!-- 今日概况 -->
    <div v-if="calculated" class="today-section">
      <h3>📊 今日节律概况</h3>
      <div class="today-grid">
        <div v-for="item in todaySummary" :key="item.name" class="today-card" :style="{ borderColor: item.color }">
          <div class="today-icon">{{ item.icon }}</div>
          <div class="today-name">{{ item.name }}</div>
          <div class="today-value" :style="{ color: item.color }">{{ item.value }}%</div>
          <div class="today-status" :style="{ color: item.color }">{{ item.status }}</div>
          <div class="today-bar">
            <div class="today-bar-fill" :style="{ width: item.value + '%', background: item.color }"></div>
          </div>
          <div class="today-day">第 {{ item.day }} 天 / 共 {{ item.period }} 天</div>
        </div>
      </div>
    </div>

    <!-- 30天曲线图 -->
    <div v-if="calculated" class="chart-section">
      <h3>📈 未来30天节律曲线</h3>
      <div class="chart-wrapper">
        <canvas ref="chartCanvas"></canvas>
      </div>
      <div class="chart-legend">
        <span class="legend-item" style="color: #ef4444">● 体力（23天）</span>
        <span class="legend-item" style="color: #3b82f6">● 情绪（28天）</span>
        <span class="legend-item" style="color: #22c55e">● 智力（33天）</span>
      </div>
    </div>

    <!-- 最佳/最差日期 -->
    <div v-if="calculated" class="tips-section">
      <h3>💡 未来30天分析</h3>
      <div class="tips-grid">
        <div class="tip-card good">
          <h4>🌟 最佳状态日</h4>
          <p v-for="(d, i) in bestDays" :key="i">{{ d.date }} — {{ d.desc }}</p>
        </div>
        <div class="tip-card warn">
          <h4>⚠️ 需注意日</h4>
          <p v-for="(d, i) in worstDays" :key="i">{{ d.date }} — {{ d.desc }}</p>
        </div>
      </div>
    </div>

    <!-- 算法说明 -->
    <div class="formula-section">
      <h3>📐 计算原理</h3>
      <div class="formula-block">
        <p>生物节律（Biorhythm）理论认为，人体从出生起存在三个固定周期的正弦波循环：</p>
        <code>体力周期 = 23天</code>
        <code>情绪周期 = 28天</code>
        <code>智力周期 = 33天</code>
        <p>节律值 = sin(2π × 经历天数 / 周期长度) × 100，范围 -100% ~ +100%</p>
        <p>正值 = 高峰期（状态好），负值 = 低谷期（状态差），0 附近 = 临界日</p>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '人体精力节律计算器 - 野火小站' })

const chartCanvas = ref(null)
const birthday = ref('')
const targetDate = ref('')
const calculated = ref(false)
const todaySummary = ref([])
const bestDays = ref([])
const worstDays = ref([])

// 初始化日期
onMounted(() => {
  const today = new Date()
  targetDate.value = formatDate(today)
  // 默认设置为28年前
  const defaultBirth = new Date(today.getFullYear() - 28, today.getMonth(), today.getDate())
  birthday.value = formatDate(defaultBirth)
})

function formatDate(d) {
  return d.toISOString().split('T')[0]
}

function daysBetween(d1, d2) {
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24))
}

function biorhythmValue(daysSinceBirth, period) {
  return Math.sin((2 * Math.PI * daysSinceBirth) / period)
}

// 计算节律
function calculate() {
  if (!birthday.value) return
  const birth = new Date(birthday.value)
  const target = new Date(targetDate.value || new Date())
  const days = daysBetween(birth, target)

  if (days < 0) { alert('查询日期不能早于出生日期'); return }

  const cycles = [
    { name: '体力', icon: '💪', period: 23, color: '#ef4444' },
    { name: '情绪', icon: '❤️', period: 28, color: '#3b82f6' },
    { name: '智力', icon: '🧠', period: 33, color: '#22c55e' },
  ]

  // 今日概况
  todaySummary.value = cycles.map(c => {
    const dayInCycle = ((days % c.period) + c.period) % c.period
    const val = biorhythmValue(days, c.period)
    const pct = Math.round(val * 100)
    let status
    if (pct >= 80) status = '巅峰期'
    else if (pct >= 30) status = '上升期'
    else if (pct >= -30) status = '平稳期'
    else if (pct >= -80) status = '下降期'
    else status = '低谷期'

    return { ...c, value: Math.abs(pct), pct, status, day: Math.floor(dayInCycle) + 1 }
  })

  // 未来30天分析
  const future = []
  for (let i = 0; i <= 30; i++) {
    const d = new Date(target)
    d.setDate(d.getDate() + i)
    const dd = days + i
    const scores = cycles.map(c => ({
      ...c,
      value: biorhythmValue(dd, c.period),
    }))
    const total = scores.reduce((s, x) => s + x.value, 0) / 3
    future.push({
      date: formatDate(d),
      scores,
      total,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
    })
  }

  // 最佳日（综合值最高）
  bestDays.value = future
    .filter(d => d.total > 0.5)
    .sort((a, b) => b.total - a.total)
    .slice(0, 3)
    .map(d => ({
      date: d.label,
      desc: `综合值 ${Math.round(d.total * 100)}% · 体力${Math.round(d.scores[0].value * 100)}% 情绪${Math.round(d.scores[1].value * 100)}% 智力${Math.round(d.scores[2].value * 100)}%`,
    }))

  // 最差日（综合值最低）
  worstDays.value = future
    .filter(d => d.total < -0.5)
    .sort((a, b) => a.total - b.total)
    .slice(0, 3)
    .map(d => ({
      date: d.label,
      desc: `综合值 ${Math.round(d.total * 100)}% · 体力${Math.round(d.scores[0].value * 100)}% 情绪${Math.round(d.scores[1].value * 100)}% 智力${Math.round(d.scores[2].value * 100)}%`,
    }))

  calculated.value = true
  nextTick(drawChart)
}

// 绘制30天曲线
function drawChart() {
  const canvas = chartCanvas.value
  if (!canvas || !birthday.value) return

  const birth = new Date(birthday.value)
  const target = new Date(targetDate.value || new Date())
  const startDays = daysBetween(birth, target)
  const days = 30

  const w = 700
  const h = 300
  const dpr = window.devicePixelRatio || 1
  canvas.width = w * dpr
  canvas.height = h * dpr
  canvas.style.width = '100%'
  canvas.style.maxWidth = w + 'px'
  canvas.height = h * dpr

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  const pad = { top: 20, right: 20, bottom: 40, left: 40 }
  const cw = w - pad.left - pad.right
  const ch = h - pad.top - pad.bottom

  // 背景
  ctx.fillStyle = '#fafafa'
  ctx.fillRect(0, 0, w, h)

  // 网格
  ctx.strokeStyle = '#eee'
  ctx.lineWidth = 1
  // 零线
  const zeroY = pad.top + ch / 2
  ctx.beginPath()
  ctx.moveTo(pad.left, zeroY)
  ctx.lineTo(pad.left + cw, zeroY)
  ctx.strokeStyle = '#ccc'
  ctx.setLineDash([4, 4])
  ctx.stroke()
  ctx.setLineDash([])

  // 日期标签
  ctx.fillStyle = '#888'
  ctx.font = '11px system-ui, sans-serif'
  ctx.textAlign = 'center'
  for (let i = 0; i <= days; i += 5) {
    const x = pad.left + (i / days) * cw
    const d = new Date(target)
    d.setDate(d.getDate() + i)
    ctx.fillText(`${d.getMonth() + 1}/${d.getDate()}`, x, h - pad.bottom + 20)
  }

  // Y轴标签
  ctx.textAlign = 'right'
  ctx.fillText('100%', pad.left - 5, pad.top + 5)
  ctx.fillText('0%', pad.left - 5, zeroY + 4)
  ctx.fillText('-100%', pad.left - 5, pad.top + ch + 5)

  // 绘制三条曲线
  const cycles = [
    { period: 23, color: '#ef4444', alpha: '40' },
    { period: 28, color: '#3b82f6', alpha: '40' },
    { period: 33, color: '#22c55e', alpha: '40' },
  ]

  cycles.forEach(cycle => {
    ctx.beginPath()
    ctx.strokeStyle = cycle.color
    ctx.lineWidth = 2.5

    for (let i = 0; i <= days; i++) {
      const dd = startDays + i
      const val = biorhythmValue(dd, cycle.period)
      const x = pad.left + (i / days) * cw
      const y = zeroY - val * (ch / 2)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    // 填充区域
    ctx.lineTo(pad.left + cw, zeroY)
    ctx.lineTo(pad.left, zeroY)
    ctx.closePath()
    ctx.fillStyle = cycle.color + '15'
    ctx.fill()
  })
}
</script>

<style scoped>
.tool-page { padding-top: 0.5rem; }
h2 { font-size: 1.6rem; margin-bottom: 0.3rem; }
.subtitle { color: #888; font-size: 0.95rem; margin-bottom: 1.5rem; }

h3 { font-size: 1.05rem; margin-bottom: 0.8rem; color: #333; }

.input-card {
  background: white; border-radius: 12px; padding: 1.5rem;
  border: 1px solid #eee; margin-bottom: 1.5rem;
}
.input-row { display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
.input-group { display: flex; flex-direction: column; gap: 0.3rem; }
.input-group label { font-weight: 600; font-size: 0.9rem; color: #555; }
.date-input {
  padding: 0.6rem 0.8rem; border: 2px solid #e0e0e0; border-radius: 8px;
  font-size: 0.95rem; outline: none; background: white;
}
.date-input:focus { border-color: #22c55e; }

.btn {
  padding: 0.7rem 1.5rem; border-radius: 10px; font-size: 0.95rem;
  cursor: pointer; border: none; font-weight: 600; transition: all 0.2s;
}
.btn-primary { background: linear-gradient(135deg, #22c55e, #10b981); color: white; }
.btn-primary:hover { opacity: 0.9; }

/* 今日概况 */
.today-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem;
}
.today-card {
  background: white; border: 2px solid #eee; border-radius: 12px;
  padding: 1.2rem; text-align: center; transition: all 0.3s;
}
.today-icon { font-size: 2rem; margin-bottom: 0.5rem; }
.today-name { font-size: 0.9rem; color: #666; margin-bottom: 0.3rem; }
.today-value { font-size: 1.8rem; font-weight: 700; }
.today-status { font-size: 0.85rem; font-weight: 600; margin: 0.3rem 0; }
.today-bar { height: 6px; background: #f0f0f0; border-radius: 3px; overflow: hidden; margin: 0.5rem 0; }
.today-bar-fill { height: 100%; border-radius: 3px; transition: width 0.5s; }
.today-day { font-size: 0.75rem; color: #aaa; }

/* 曲线图 */
.chart-section { margin-bottom: 1.5rem; }
.chart-wrapper { background: white; border: 1px solid #eee; border-radius: 12px; padding: 1rem; overflow-x: auto; }
.chart-legend { display: flex; gap: 1.5rem; margin-top: 0.8rem; justify-content: center; }
.legend-item { font-size: 0.85rem; font-weight: 600; }

/* 提示 */
.tips-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
.tip-card {
  border-radius: 12px; padding: 1.2rem;
}
.tip-card.good { background: #f0fdf4; border-left: 4px solid #22c55e; }
.tip-card.warn { background: #fef3c7; border-left: 4px solid #f59e0b; }
.tip-card h4 { font-size: 0.95rem; margin-bottom: 0.5rem; }
.tip-card p { font-size: 0.85rem; color: #555; margin-bottom: 0.3rem; }

/* 公式说明 */
.formula-section { margin-bottom: 2rem; }
.formula-block {
  background: #1a1a2e; border-radius: 10px; padding: 1.2rem;
}
.formula-block code {
  display: block; color: #a5d6a7; font-family: monospace;
  font-size: 0.9rem; line-height: 1.8; margin-top: 0.5rem;
}
.formula-block p { color: #ccc; font-size: 0.85rem; line-height: 1.6; margin-bottom: 0.5rem; }

.back-link { display: inline-block; margin-top: 2rem; color: #22c55e; font-weight: 500; }
.back-link:hover { text-decoration: underline; }

@media (max-width: 640px) {
  .today-grid { grid-template-columns: 1fr; }
  .tips-grid { grid-template-columns: 1fr; }
  .input-row { flex-direction: column; }
}
</style>
