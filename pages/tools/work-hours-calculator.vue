<template>
  <div class="tool-page">
    <h2>⏰ 工时与加班计算器</h2>
    <p class="subtitle">输入上下班时间和午休时长，自动计算日/周/月工时和加班时长</p>

    <!-- 设置区域 -->
    <div class="settings-section">
      <h3>⚙️ 工作设置</h3>
      <div class="settings-grid">
        <div class="input-group">
          <label>标准日工时（小时）</label>
          <input type="number" v-model.number="standardHours" min="0" max="24" step="0.5" class="num-input" />
        </div>
        <div class="input-group">
          <label>加班费率（倍）</label>
          <input type="number" v-model.number="overtimeRate" min="1" max="5" step="0.5" class="num-input" />
        </div>
        <div class="input-group">
          <label>预估时薪（元/小时）</label>
          <input type="number" v-model.number="hourlyWage" min="0" step="10" class="num-input" />
        </div>
        <div class="input-group">
          <label>统计周期</label>
          <div class="period-toggle">
            <button :class="{ active: period === 'day' }" @click="period = 'day'">日</button>
            <button :class="{ active: period === 'week' }" @click="period = 'week'">周</button>
            <button :class="{ active: period === 'month' }" @click="period = 'month'">月</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 日工时记录 -->
    <div class="records-section">
      <div class="records-header">
        <h3>📝 工时记录</h3>
        <button class="add-day-btn" @click="addDay" v-if="period !== 'day'">+ 添加一天</button>
      </div>

      <div class="day-records">
        <div v-for="(day, index) in days" :key="index" class="day-card">
          <div class="day-header">
            <span class="day-label">
              <template v-if="period === 'week'">{{ weekDays[index] || `第${index + 1}天` }}</template>
              <template v-else>第 {{ index + 1 }} 天</template>
            </span>
            <button v-if="period !== 'day' && days.length > 1" @click="removeDay(index)" class="remove-btn">×</button>
          </div>
          <div class="day-inputs">
            <div class="time-input">
              <label>上班</label>
              <input type="time" v-model="day.startTime" class="time-field" />
            </div>
            <div class="time-input">
              <label>下班</label>
              <input type="time" v-model="day.endTime" class="time-field" />
            </div>
            <div class="time-input small">
              <label>午休(h)</label>
              <input type="number" v-model.number="day.lunchBreak" min="0" max="4" step="0.25" class="num-input-sm" />
            </div>
            <div class="day-summary">
              <span class="work-time" :class="{ overtime: day.overtime > 0 }">{{ day.workHours }}h</span>
              <span v-if="day.overtime > 0" class="overtime-tag">+{{ day.overtime }}h</span>
              <span v-else-if="day.workHours < standardHours" class="undertime-tag">-{{ (standardHours - day.workHours).toFixed(2) }}h</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 统计汇总 -->
    <div class="summary-section">
      <h3>📊 统计汇总</h3>
      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-label">总工时</div>
          <div class="card-value">{{ totalWorkHours }}h</div>
          <div class="card-sub">{{ totalWorkMinutes }}分钟</div>
        </div>
        <div class="summary-card">
          <div class="card-label">标准工时</div>
          <div class="card-value">{{ totalStandardHours }}h</div>
          <div class="card-sub">按 {{ standardHours }}h/天</div>
        </div>
        <div class="summary-card" :class="{ positive: totalOvertime > 0, negative: totalOvertime < 0 }">
          <div class="card-label">{{ totalOvertime >= 0 ? '总加班' : '工时不足' }}</div>
          <div class="card-value">{{ totalOvertime >= 0 ? '+' : '' }}{{ totalOvertime }}h</div>
          <div class="card-sub">{{ totalOvertimeMinutes }}分钟</div>
        </div>
        <div class="summary-card" v-if="hourlyWage > 0">
          <div class="card-label">预估加班费</div>
          <div class="card-value highlight">¥{{ estimatedPay }}</div>
          <div class="card-sub">{{ overtimeRate }}倍时薪</div>
        </div>
      </div>
    </div>

    <!-- 工时可视化 -->
    <div class="chart-section">
      <h3>📈 工时可视化</h3>
      <canvas ref="chartCanvas" class="chart-canvas"></canvas>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button class="reset-btn" @click="resetAll">🔄 重置</button>
      <button class="copy-btn" @click="copyResults">{{ copyText }}</button>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '工时与加班计算器 - 野火小站' })

const standardHours = ref(8)
const overtimeRate = ref(1.5)
const hourlyWage = ref(0)
const period = ref('week')
const copyText = ref('📋 复制结果')
const chartCanvas = ref(null)

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

// 默认一天的数据
function createDay(startTime = '09:00', endTime = '18:00') {
  return { startTime, endTime, lunchBreak: 1 }
}

// 天数列表
const days = ref([
  createDay(), createDay(), createDay(), createDay(), createDay(),
])

// 切换周期时调整天数
watch(period, (val) => {
  if (val === 'day') {
    days.value = [createDay()]
  } else if (val === 'week') {
    days.value = Array(7).fill(null).map((_, i) => {
      if (i < days.value.length) return days.value[i]
      if (i < 5) return createDay()
      return createDay('', '') // 周末默认不上班
    })
  } else {
    // 月：保持现有
    if (days.value.length < 1) days.value = [createDay()]
  }
})

function addDay() {
  if (days.value.length >= 31) return
  days.value.push(createDay())
}

function removeDay(index) {
  days.value.splice(index, 1)
}

function resetAll() {
  standardHours.value = 8
  overtimeRate.value = 1.5
  hourlyWage.value = 0
  period.value = 'week'
  days.value = Array(5).fill(null).map(() => createDay())
}

// 计算工时
function calcWorkHours(day) {
  if (!day.startTime || !day.endTime) return 0
  const [sh, sm] = day.startTime.split(':').map(Number)
  const [eh, em] = day.endTime.split(':').map(Number)
  let total = (eh * 60 + em) - (sh * 60 + sm)
  // 减去午休
  total -= (day.lunchBreak || 0) * 60
  return Math.max(0, total / 60)
}

// 计算每天的工时和加班
const computedDays = computed(() => {
  return days.value.map(day => {
    const workHours = calcWorkHours(day)
    const overtime = Math.max(0, workHours - standardHours.value)
    return { ...day, workHours: workHours.toFixed(2), overtime: overtime.toFixed(2) }
  })
})

// 总工时
const totalWorkHours = computed(() => {
  const sum = computedDays.value.reduce((s, d) => s + parseFloat(d.workHours), 0)
  return sum.toFixed(1)
})

const totalWorkMinutes = computed(() => {
  return Math.round(parseFloat(totalWorkHours.value) * 60)
})

// 总标准工时
const totalStandardHours = computed(() => {
  return (days.value.length * standardHours.value).toFixed(1)
})

// 总加班
const totalOvertime = computed(() => {
  return (parseFloat(totalWorkHours.value) - days.value.length * standardHours.value).toFixed(1)
})

const totalOvertimeMinutes = computed(() => {
  return Math.round(Math.abs(parseFloat(totalOvertime.value)) * 60)
})

// 预估加班费
const estimatedPay = computed(() => {
  if (hourlyWage.value <= 0) return '—'
  const overtimeH = Math.max(0, parseFloat(totalOvertime.value))
  return (overtimeH * hourlyWage.value * overtimeRate.value).toFixed(0)
})

// Canvas 绘制柱状图
function drawChart() {
  const canvas = chartCanvas.value
  if (!canvas) return

  const dpr = window.devicePixelRatio || 1
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  canvas.width = w * dpr
  canvas.height = h * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, w, h)

  const cDays = computedDays.value
  if (cDays.length === 0) return

  const padding = { top: 20, right: 20, bottom: 40, left: 50 }
  const chartW = w - padding.left - padding.right
  const chartH = h - padding.top - padding.bottom

  // 找最大值
  const maxVal = Math.max(standardHours.value, ...cDays.map(d => parseFloat(d.workHours)), 1)
  const yMax = Math.ceil(maxVal / 2) * 2 // 取偶数上限

  const barWidth = Math.min(chartW / cDays.length * 0.5, 40)
  const gap = (chartW - barWidth * cDays.length) / (cDays.length + 1)

  // Y轴刻度
  ctx.strokeStyle = '#e0e0e0'
  ctx.lineWidth = 0.5
  ctx.fillStyle = '#888'
  ctx.font = '11px system-ui, sans-serif'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'

  const ySteps = 4
  for (let i = 0; i <= ySteps; i++) {
    const val = (yMax / ySteps) * i
    const y = padding.top + chartH - (val / yMax) * chartH
    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(w - padding.right, y)
    ctx.stroke()
    ctx.fillText(val.toFixed(0) + 'h', padding.left - 8, y)
  }

  // 标准工时线
  const stdY = padding.top + chartH - (standardHours.value / yMax) * chartH
  ctx.beginPath()
  ctx.setLineDash([6, 4])
  ctx.strokeStyle = '#ef4444'
  ctx.lineWidth = 1.5
  ctx.moveTo(padding.left, stdY)
  ctx.lineTo(w - padding.right, stdY)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = '#ef4444'
  ctx.textAlign = 'left'
  ctx.fillText('标准 ' + standardHours.value + 'h', w - padding.right + 2, stdY)

  // 柱状图
  cDays.forEach((day, i) => {
    const workH = parseFloat(day.workHours)
    const barH = Math.max(0, (workH / yMax) * chartH)
    const x = padding.left + gap + i * (barWidth + gap)
    const y = padding.top + chartH - barH

    // 柱子颜色
    const overtime = workH > standardHours.value
    const gradient = ctx.createLinearGradient(x, y, x, y + barH)
    if (overtime) {
      gradient.addColorStop(0, '#ef4444')
      gradient.addColorStop(1, '#f87171')
    } else {
      gradient.addColorStop(0, '#22c55e')
      gradient.addColorStop(1, '#4ade80')
    }

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.roundRect(x, y, barWidth, barH, [4, 4, 0, 0])
    ctx.fill()

    // 数值标注
    if (workH > 0) {
      ctx.fillStyle = '#555'
      ctx.font = 'bold 11px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(workH.toFixed(1) + 'h', x + barWidth / 2, y - 6)
    }

    // X轴标签
    ctx.fillStyle = '#888'
    ctx.font = '11px system-ui, sans-serif'
    ctx.textAlign = 'center'
    const label = period.value === 'week' ? (weekDays[i] || '') : `第${i + 1}天`
    ctx.fillText(label, x + barWidth / 2, h - padding.bottom + 20)
  })
}

// 复制结果
function copyResults() {
  const cDays = computedDays.value
  let text = `工时统计报告\n`
  text += `标准日工时: ${standardHours.value}小时\n`
  text += `${'─'.repeat(30)}\n`

  cDays.forEach((day, i) => {
    const label = period.value === 'week' ? (weekDays[i] || `第${i+1}天`) : `第${i+1}天`
    const ot = parseFloat(day.overtime) > 0 ? ` (+${day.overtime}h加班)` : ''
    text += `${label}: ${day.startTime || '--'}~${day.endTime || '--'} | ${day.workHours}h${ot}\n`
  })

  text += `${'─'.repeat(30)}\n`
  text += `总工时: ${totalWorkHours.value}小时 (${totalWorkMinutes.value}分钟)\n`
  text += `标准工时: ${totalStandardHours.value}小时\n`
  text += `加班/不足: ${totalOvertime.value}小时\n`

  if (hourlyWage.value > 0 && parseFloat(totalOvertime.value) > 0) {
    text += `预估加班费: ¥${estimatedPay.value} (${overtimeRate.value}倍)\n`
  }

  navigator.clipboard.writeText(text)
  copyText.value = '✅ 已复制'
  setTimeout(() => { copyText.value = '📋 复制结果' }, 1500)
}

// 监听数据变化重绘
watch([computedDays, standardHours, period], () => {
  nextTick(drawChart)
}, { deep: true })

onMounted(() => {
  drawChart()
  window.addEventListener('resize', drawChart)
})
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

h3 {
  font-size: 1.05rem;
  margin-bottom: 0.8rem;
  color: #333;
}

/* 设置区域 */
.settings-section {
  margin-bottom: 1.5rem;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.input-group label {
  display: block;
  font-weight: 600;
  font-size: 0.85rem;
  color: #555;
  margin-bottom: 0.3rem;
}

.num-input, .num-input-sm {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  background: white;
  width: 100%;
  box-sizing: border-box;
}

.num-input:focus, .num-input-sm:focus {
  outline: none;
  border-color: #22c55e;
}

.num-input-sm {
  width: 70px;
  text-align: center;
  font-size: 0.85rem;
}

.period-toggle {
  display: flex;
  gap: 0;
  background: #e9ecef;
  border-radius: 8px;
  overflow: hidden;
}

.period-toggle button {
  flex: 1;
  padding: 0.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.period-toggle button.active {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  font-weight: 600;
}

/* 工时记录 */
.records-section {
  margin-bottom: 1.5rem;
}

.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.records-header h3 {
  margin-bottom: 0;
}

.add-day-btn {
  padding: 0.4rem 0.8rem;
  background: #22c55e;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
}

.add-day-btn:hover {
  background: #16a34a;
}

.day-records {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.day-card {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 0.8rem 1rem;
  border: 1px solid #eee;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.day-label {
  font-weight: 600;
  font-size: 0.9rem;
  color: #555;
}

.remove-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: #fee2e2;
  color: #ef4444;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background: #fca5a5;
}

.day-inputs {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.time-input {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.time-input label {
  font-size: 0.75rem;
  color: #888;
}

.time-field {
  padding: 0.35rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
}

.time-field:focus {
  outline: none;
  border-color: #22c55e;
}

.day-summary {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.work-time {
  font-weight: 700;
  font-size: 1.1rem;
  color: #22c55e;
}

.work-time.overtime {
  color: #ef4444;
}

.overtime-tag {
  background: #fee2e2;
  color: #ef4444;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
}

.undertime-tag {
  background: #e0e7ff;
  color: #4338ca;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
}

/* 汇总统计 */
.summary-section {
  margin-bottom: 1.5rem;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.8rem;
}

.summary-card {
  background: white;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.summary-card.positive {
  border-color: #fca5a5;
  background: #fff5f5;
}

.summary-card.negative {
  border-color: #a5b4fc;
  background: #eef2ff;
}

.card-label {
  font-size: 0.8rem;
  color: #888;
  margin-bottom: 0.3rem;
}

.card-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: #2c3e50;
}

.card-value.highlight {
  color: #ef4444;
}

.card-sub {
  font-size: 0.7rem;
  color: #aaa;
  margin-top: 0.2rem;
}

/* 图表 */
.chart-section {
  margin-bottom: 1.5rem;
}

.chart-canvas {
  width: 100%;
  height: 250px;
  border-radius: 12px;
  background: #fafafa;
  border: 1px solid #eee;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.reset-btn {
  padding: 0.6rem 1.5rem;
  background: white;
  color: #555;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: #f3f4f6;
}

.copy-btn {
  padding: 0.6rem 1.5rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: transform 0.2s;
}

.copy-btn:active {
  transform: scale(0.95);
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
  .settings-grid {
    grid-template-columns: 1fr 1fr;
  }
  .day-inputs {
    flex-direction: column;
    align-items: stretch;
  }
  .day-summary {
    margin-left: 0;
    justify-content: center;
  }
  .summary-cards {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
