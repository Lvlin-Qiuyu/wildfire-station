<template>
  <div class="tool-page">
    <h2>💤 睡眠周期计算器</h2>
    <p class="subtitle">基于90分钟睡眠周期，计算最佳入睡和起床时间，帮助你自然醒来</p>

    <!-- 模式切换 -->
    <div class="mode-tabs">
      <button :class="['mode-tab', { active: calcMode === 'forward' }]" @click="calcMode = 'forward'">
        🛏️ 正向计算
      </button>
      <button :class="['mode-tab', { active: calcMode === 'reverse' }]" @click="calcMode = 'reverse'">
        ⏰ 反向计算
      </button>
    </div>

    <!-- 正向计算：输入入睡时间 → 推荐起床时间 -->
    <div v-if="calcMode === 'forward'" class="panel-section">
      <div class="input-group">
        <label>入睡时间</label>
        <div class="time-input-row">
          <input
            type="time"
            v-model="sleepTime"
            class="time-input"
          />
          <button class="btn-now" @click="setNow">当前时间</button>
        </div>
      </div>

      <div v-if="sleepTime && forwardResults.length" class="results">
        <h3>推荐起床时间（加15分钟入睡缓冲）</h3>
        <div class="result-cards">
          <div
            v-for="(r, i) in forwardResults"
            :key="i"
            class="sleep-card"
            :class="getQualityClass(r.quality)"
          >
            <div class="card-cycles">
              <span class="cycle-badge">{{ r.cycles }} 个周期</span>
              <span class="hours-badge">{{ r.totalHours }}h</span>
            </div>
            <div class="card-time">{{ r.wakeTime }}</div>
            <div class="card-quality">
              <span class="quality-icon">{{ r.quality === 'best' ? '🌟' : r.quality === 'good' ? '✅' : '⭐' }}</span>
              {{ qualityLabels[r.quality] }}
            </div>
            <div class="card-actions">
              <button class="btn-sm" @click="setAlarm(r)">🔔 设闹钟</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 反向计算：输入起床时间 → 推荐入睡时间 -->
    <div v-if="calcMode === 'reverse'" class="panel-section">
      <div class="input-group">
        <label>目标起床时间</label>
        <div class="time-input-row">
          <input
            type="time"
            v-model="wakeTarget"
            class="time-input"
          />
          <button class="btn-now" @click="setWakeTargetNow">当前时间</button>
        </div>
      </div>

      <div v-if="wakeTarget && reverseResults.length" class="results">
        <h3>推荐入睡时间（提前15分钟上床准备）</h3>
        <div class="result-cards">
          <div
            v-for="(r, i) in reverseResults"
            :key="i"
            class="sleep-card"
            :class="getQualityClass(r.quality)"
          >
            <div class="card-cycles">
              <span class="cycle-badge">{{ r.cycles }} 个周期</span>
              <span class="hours-badge">{{ r.totalHours }}h</span>
            </div>
            <div class="card-time">{{ r.sleepTime }}</div>
            <div class="card-quality">
              <span class="quality-icon">{{ r.quality === 'best' ? '🌟' : r.quality === 'good' ? '✅' : '⭐' }}</span>
              {{ qualityLabels[r.quality] }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Canvas 可视化 -->
    <div v-if="forwardResults.length || reverseResults.length" class="canvas-section">
      <h3>📊 睡眠周期时间轴</h3>
      <canvas ref="timelineCanvas" class="timeline-canvas"></canvas>
      <div class="canvas-legend">
        <span class="legend-item">
          <span class="legend-dot" style="background: #22c55e;"></span> 睡眠（浅睡）
        </span>
        <span class="legend-item">
          <span class="legend-dot" style="background: #10b981;"></span> 睡眠（深睡）
        </span>
        <span class="legend-item">
          <span class="legend-dot" style="background: #fbbf24;"></span> 快速眼动期（REM）
        </span>
        <span class="legend-item">
          <span class="legend-dot" style="background: #ef4444;"></span> 入睡缓冲
        </span>
      </div>
    </div>

    <!-- 闹钟通知状态 -->
    <div v-if="alarmInfo" class="alarm-card">
      <div class="alarm-info">
        <span class="alarm-icon">🔔</span>
        <div>
          <strong>闹钟已设置</strong>
          <p>{{ alarmInfo.time }} — {{ alarmInfo.message }}</p>
        </div>
      </div>
      <button class="btn-sm btn-cancel" @click="cancelAlarm">取消闹钟</button>
    </div>

    <!-- 说明 -->
    <div class="info-card">
      <h3>ℹ️ 关于睡眠周期</h3>
      <ul class="info-list">
        <li>每个睡眠周期约 <strong>90 分钟</strong>，包含浅睡、深睡和 REM 阶段</li>
        <li>在周期结束时醒来感觉最清醒，中途醒来会感到昏沉</li>
        <li><strong>5个周期（7.5小时）</strong>是大多数成年人的最佳推荐</li>
        <li>建议提前 <strong>15分钟</strong>上床，作为入睡缓冲时间</li>
        <li>🌟 最佳 = 5-6个周期 | ✅ 推荐 = 4个周期 | ⭐ 可接受 = 3个周期</li>
      </ul>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '睡眠周期计算器 - 野火小站' })

const calcMode = ref('forward')
const sleepTime = ref('')
const wakeTarget = ref('')
const alarmInfo = ref(null)
const timelineCanvas = ref(null)

const CYCLE_MINUTES = 90 // 每个睡眠周期90分钟
const FALL_ASLEEP_BUFFER = 15 // 入睡缓冲15分钟
const qualityLabels = {
  best: '最佳推荐',
  good: '推荐',
  ok: '可接受',
}

// 设置当前时间（正向：整点到下一刻）
function setNow() {
  const now = new Date()
  const rounded = new Date(now.getTime())
  rounded.setSeconds(0, 0)
  sleepTime.value = `${String(rounded.getHours()).padStart(2, '0')}:${String(rounded.getMinutes()).padStart(2, '0')}`
}

function setWakeTargetNow() {
  const now = new Date()
  now.setSeconds(0, 0)
  wakeTarget.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

// 解析时间字符串为分钟数（0-1440）
function parseTimeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

// 分钟数转时间字符串
function minutesToTimeStr(mins) {
  const normalized = ((mins % 1440) + 1440) % 1440
  const h = Math.floor(normalized / 60)
  const m = normalized % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// 质量等级
function getQuality(cycles) {
  if (cycles >= 5 && cycles <= 6) return 'best'
  if (cycles === 4) return 'good'
  return 'ok'
}

function getQualityClass(quality) {
  return `quality-${quality}`
}

// ==================== 正向计算 ====================

const forwardResults = computed(() => {
  if (!sleepTime.value) return []
  const sleepMins = parseTimeToMinutes(sleepTime.value)
  const results = []

  for (let cycles = 3; cycles <= 6; cycles++) {
    const sleepDuration = cycles * CYCLE_MINUTES + FALL_ASLEEP_BUFFER
    const wakeMins = sleepMins + sleepDuration
    results.push({
      cycles,
      totalHours: (cycles * CYCLE_MINUTES / 60).toFixed(1),
      wakeTime: minutesToTimeStr(wakeMins),
      sleepMins: sleepMins,
      wakeMins: ((wakeMins % 1440) + 1440) % 1440,
      sleepDuration,
      quality: getQuality(cycles),
    })
  }

  return results
})

// ==================== 反向计算 ====================

const reverseResults = computed(() => {
  if (!wakeTarget.value) return []
  const targetMins = parseTimeToMinutes(wakeTarget.value)
  const results = []

  for (let cycles = 6; cycles >= 3; cycles--) {
    const sleepDuration = cycles * CYCLE_MINUTES
    const sleepMins = targetMins - sleepDuration
    const bedTimeMins = sleepMins - FALL_ASLEEP_BUFFER
    results.push({
      cycles,
      totalHours: (cycles * CYCLE_MINUTES / 60).toFixed(1),
      sleepTime: minutesToTimeStr(bedTimeMins),
      sleepMins: ((sleepMins % 1440) + 1440) % 1440,
      bedTimeMins: ((bedTimeMins % 1440) + 1440) % 1440,
      sleepDuration,
      quality: getQuality(cycles),
    })
  }

  return results
})

// ==================== Canvas 可视化 ====================

watch([forwardResults, reverseResults, calcMode], () => {
  nextTick(() => drawTimeline())
})

function drawTimeline() {
  const canvas = timelineCanvas.value
  if (!canvas) return

  const results = calcMode.value === 'forward' ? forwardResults.value : reverseResults.value
  if (!results.length) return

  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  const width = rect.width
  const height = rect.height

  ctx.clearRect(0, 0, width, height)

  // 绘制参数
  const padding = { top: 30, bottom: 40, left: 20, right: 20 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const rowCount = results.length
  const rowHeight = chartHeight / rowCount
  const gap = 6

  // 计算时间范围（跨午夜处理）
  let startMins, endMins
  if (calcMode.value === 'forward') {
    startMins = parseTimeToMinutes(sleepTime.value)
    const lastResult = results[results.length - 1]
    endMins = startMins + lastResult.sleepDuration + 30
  } else {
    const firstResult = results[results.length - 1] // cycles最多的
    startMins = firstResult.bedTimeMins
    endMins = parseTimeToMinutes(wakeTarget.value) + 30
  }

  const totalDuration = endMins - startMins
  const hourStep = 60 // 每60分钟一个刻度

  // 绘制时间轴背景
  for (let row = 0; row < rowCount; row++) {
    const r = results[row]
    const y = padding.top + row * rowHeight + gap / 2
    const h = rowHeight - gap

    // 背景条
    ctx.fillStyle = '#f8f9fa'
    ctx.beginPath()
    ctx.roundRect(padding.left, y, chartWidth, h, 6)
    ctx.fill()

    // 入睡缓冲（红色）
    const bufferWidth = (FALL_ASLEEP_BUFFER / totalDuration) * chartWidth
    ctx.fillStyle = '#fca5a5'
    ctx.fillRect(padding.left, y, bufferWidth, h)

    // 睡眠周期
    const sleepStart = calcMode.value === 'forward'
      ? FALL_ASLEEP_BUFFER
      : r.sleepDuration > 0 ? 0 : 0
    const sleepTotal = r.cycles * CYCLE_MINUTES
    const sleepStartOffset = FALL_ASLEEP_BUFFER
    const sleepWidthPx = (sleepTotal / totalDuration) * chartWidth

    let x = padding.left + sleepStartOffset
    const phaseColors = ['#22c55e', '#10b981', '#fbbf24'] // 浅睡、深睡、REM

    for (let cycle = 0; cycle < r.cycles; cycle++) {
      const cycleWidth = (CYCLE_MINUTES / totalDuration) * chartWidth
      // 每个周期分3段：浅睡(40%) -> 深睡(40%) -> REM(20%)
      const segments = [
        { ratio: 0.4, color: phaseColors[0] },
        { ratio: 0.4, color: phaseColors[1] },
        { ratio: 0.2, color: phaseColors[2] },
      ]
      let segX = x
      for (const seg of segments) {
        const segW = cycleWidth * seg.ratio
        ctx.fillStyle = seg.color
        ctx.fillRect(segX, y, segW, h)
        segX += segW
      }
      x += cycleWidth
    }

    // 周期标签
    const labelX = padding.left + 4
    const labelY = y + h / 2 + 4
    ctx.fillStyle = qualityLabels[r.quality] ? '#333' : '#666'
    ctx.font = 'bold 11px -apple-system, sans-serif'
    ctx.fillText(`${r.cycles}周期 (${r.totalHours}h)`, labelX, labelY)

    // 起床/入睡时间标签
    if (calcMode.value === 'forward') {
      const endX = padding.left + sleepStartOffset + sleepWidthPx
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 11px -apple-system, sans-serif'
      ctx.fillText(r.wakeTime, endX + 4, labelY)
    } else {
      const startX = padding.left + sleepStartOffset
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 11px -apple-system, sans-serif'
      ctx.fillText(r.sleepTime, startX + 4, labelY)
    }
  }

  // 时间刻度
  ctx.fillStyle = '#999'
  ctx.font = '10px -apple-system, sans-serif'
  ctx.textAlign = 'center'
  for (let mins = startMins; mins <= endMins; mins += hourStep) {
    const x = padding.left + ((mins - startMins) / totalDuration) * chartWidth
    const label = minutesToTimeStr(mins)
    ctx.fillText(label, x, height - padding.bottom + 16)

    // 竖线
    ctx.strokeStyle = '#eee'
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.moveTo(x, padding.top)
    ctx.lineTo(x, height - padding.bottom)
    ctx.stroke()
  }
}

// ==================== 闹钟功能 ====================

function setAlarm(result) {
  if (!('Notification' in window)) {
    alert('您的浏览器不支持通知功能')
    return
  }

  Notification.requestPermission().then(permission => {
    if (permission !== 'granted') {
      alert('通知权限被拒绝，请在浏览器设置中允许通知')
      return
    }

    const targetTime = calcMode.value === 'forward' ? result.wakeTime : result.sleepTime
    const now = new Date()
    const [h, m] = targetTime.split(':').map(Number)
    const target = new Date()
    target.setHours(h, m, 0, 0)

    // 如果目标时间已过，设为明天
    if (target <= now) {
      target.setDate(target.getDate() + 1)
    }

    const diffMs = target - now
    const diffMins = Math.round(diffMs / 60000)

    const message = calcMode.value === 'forward'
      ? `${result.cycles}个睡眠周期，${result.totalHours}小时，该起床了！`
      : `最佳入睡时间到了！${result.cycles}个周期，${result.totalHours}小时睡眠`

    alarmInfo.value = {
      time: targetTime,
      message,
      targetMs: target.getTime(),
    }

    setTimeout(() => {
      new Notification('💤 睡眠提醒', {
        body: message,
        icon: '🔔',
      })
      // 播放提示音
      playAlarmSound()
      alarmInfo.value = null
    }, diffMs)
  })
}

function cancelAlarm() {
  alarmInfo.value = null
}

function playAlarmSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const notes = [523.25, 659.25, 783.99, 1046.50]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.3)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.3 + 0.8)
      osc.start(ctx.currentTime + i * 0.3)
      osc.stop(ctx.currentTime + i * 0.3 + 0.8)
    })
  } catch {}
}

// 初始化 Canvas 大小
onMounted(() => {
  // 响应窗口大小变化
  window.addEventListener('resize', () => drawTimeline())
  nextTick(() => drawTimeline())
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

/* 模式标签 */
.mode-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.mode-tab {
  flex: 1;
  padding: 0.6rem 1rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  color: #666;
  text-align: center;
}

.mode-tab:hover {
  border-color: #10b981;
  color: #10b981;
}

.mode-tab.active {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border-color: #22c55e;
}

/* 输入区域 */
.panel-section {
  margin-bottom: 1.5rem;
}

.input-group {
  margin-bottom: 1rem;
}

.input-group label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 600;
  font-size: 0.9rem;
  color: #555;
}

.time-input-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.time-input {
  padding: 0.6rem 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1.2rem;
  outline: none;
  color: #333;
  background: white;
  transition: border-color 0.2s;
}

.time-input:focus {
  border-color: #22c55e;
}

.btn-now {
  padding: 0.5rem 1rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
  color: #166534;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-now:hover {
  background: #dcfce7;
}

/* 结果展示 */
.results {
  margin-bottom: 1.5rem;
}

.results h3 {
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 0.8rem;
}

.result-cards {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.sleep-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.2rem;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  background: white;
  transition: all 0.2s;
}

.sleep-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.sleep-card.quality-best {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.sleep-card.quality-good {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.sleep-card.quality-ok {
  border-color: #fde68a;
  background: #fffbeb;
}

.card-cycles {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 70px;
}

.cycle-badge {
  font-size: 0.82rem;
  font-weight: 600;
  color: #555;
}

.hours-badge {
  font-size: 0.75rem;
  color: #999;
}

.card-time {
  font-size: 1.8rem;
  font-weight: 700;
  color: #2c3e50;
  font-variant-numeric: tabular-nums;
  min-width: 100px;
  text-align: center;
}

.card-quality {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  color: #666;
  flex: 1;
}

.quality-icon {
  font-size: 1.1rem;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

/* Canvas 时间轴 */
.canvas-section {
  margin-bottom: 1.5rem;
}

.canvas-section h3 {
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 0.8rem;
}

.timeline-canvas {
  width: 100%;
  height: 220px;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
  background: white;
}

.canvas-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-top: 0.5rem;
  font-size: 0.78rem;
  color: #888;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  display: inline-block;
}

/* 闹钟卡片 */
.alarm-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.2rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.alarm-info {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.alarm-icon {
  font-size: 1.5rem;
}

.alarm-info strong {
  font-size: 0.95rem;
  color: #1e40af;
}

.alarm-info p {
  font-size: 0.82rem;
  color: #3b82f6;
  margin-top: 0.15rem;
}

.btn-cancel {
  padding: 0.4rem 1rem;
  border: 1px solid #fca5a5;
  border-radius: 8px;
  background: white;
  color: #dc2626;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #fef2f2;
}

/* 说明卡片 */
.info-card {
  background: #fafafa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
}

.info-card h3 {
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 0.6rem;
}

.info-list {
  list-style: none;
  padding: 0;
}

.info-list li {
  font-size: 0.85rem;
  color: #666;
  line-height: 1.8;
  padding-left: 1rem;
  position: relative;
}

.info-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #22c55e;
  font-weight: bold;
}

/* 按钮 */
.btn-sm {
  padding: 0.3rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 0.8rem;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.btn-sm:hover {
  border-color: #10b981;
  color: #22c55e;
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
  .sleep-card {
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.8rem;
  }
  .card-time {
    font-size: 1.4rem;
    min-width: 80px;
  }
  .card-quality {
    width: 100%;
  }
  .timeline-canvas {
    height: 200px;
  }
  .alarm-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
