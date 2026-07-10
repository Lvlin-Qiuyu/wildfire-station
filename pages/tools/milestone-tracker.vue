<template>
  <div class="tool-page">
    <h2>🎂 纪念日与重要日期追踪器</h2>
    <p class="subtitle">记录重要日期，自动计算天数，进度环可视化，支持周期性纪念日</p>

    <!-- 添加新日期 -->
    <div class="add-section">
      <h3>添加纪念日</h3>
      <div class="add-form">
        <input type="text" v-model="newTitle" placeholder="纪念日名称（如：结婚纪念日）" class="text-input" />
        <input type="date" v-model="newDate" class="date-input" />
        <select v-model="newType" class="select-input">
          <option value="annual">每年重复</option>
          <option value="monthly">每月重复</option>
          <option value="once">仅一次</option>
        </select>
        <select v-model="newDirection" class="select-input">
          <option value="countdown">倒计时（未来）</option>
          <option value="elapsed">已过天数</option>
        </select>
        <button class="btn btn-primary" @click="addMilestone">➕ 添加</button>
      </div>
    </div>

    <!-- 统计概览 -->
    <div v-if="milestones.length" class="stats-bar">
      <div class="stat-item">
        <span class="stat-num">{{ milestones.length }}</span>
        <span class="stat-label">纪念日</span>
      </div>
      <div class="stat-item">
        <span class="stat-num">{{ upcomingCount }}</span>
        <span class="stat-label">近7天到期</span>
      </div>
    </div>

    <!-- 日期列表 -->
    <div class="milestone-list">
      <div v-for="(m, idx) in sortedMilestones" :key="m.id" class="milestone-card">
        <div class="milestone-left">
          <canvas :ref="el => setRingRef(el, m.id)" width="80" height="80"></canvas>
        </div>
        <div class="milestone-info">
          <div class="milestone-header">
            <span class="milestone-title">{{ m.title }}</span>
            <span class="milestone-badge" :class="m.type">{{ m.typeLabel }}</span>
            <button class="btn-del" @click="removeMilestone(idx)">🗑️</button>
          </div>
          <div class="milestone-date">
            📅 {{ formatDate(m.date) }}
            <span v-if="m.type !== 'once'"> · 每{{ m.type === 'annual' ? '年' : '月' }}重复</span>
          </div>
          <div class="milestone-count" :style="{ color: countColor(m) }">
            <template v-if="m.direction === 'countdown'">
              还有 <strong>{{ m.daysLeft }}</strong> 天
            </template>
            <template v-else>
              已过 <strong>{{ m.daysElapsed }}</strong> 天
            </template>
            <span v-if="m.nextCycle" class="cycle-info"> · 下一周期: {{ m.nextCycleLabel }}</span>
          </div>
        </div>
      </div>
      <div v-if="!milestones.length" class="empty-state">
        <span class="empty-icon">📋</span>
        <p>还没有纪念日，点击上方添加第一个吧</p>
      </div>
    </div>

    <!-- 数据管理 -->
    <div v-if="milestones.length" class="data-actions">
      <button class="btn btn-secondary" @click="exportData">📤 导出JSON</button>
      <button class="btn btn-secondary" @click="triggerImport">📥 导入JSON</button>
      <input ref="importInput" type="file" accept=".json" @change="importData" class="hidden-input" />
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '纪念日与重要日期追踪器 - 野火小站' })

const importInput = ref(null)
const newTitle = ref('')
const newDate = ref('')
const newType = ref('annual')
const newDirection = ref('countdown')
const ringRefs = {}
const milestones = ref([])
const timer = ref(null)

// 加载存储的数据
onMounted(() => {
  const saved = localStorage.getItem('wildfire-milestones')
  if (saved) {
    try { milestones.value = JSON.parse(saved) } catch { /* 忽略解析错误 */ }
  }
  // 每分钟刷新一次（跨天自动更新）
  timer.value = setInterval(updateAllMilestones, 60000)
  nextTick(updateAllMilestones)
})

onUnmounted(() => {
  if (timer.value) clearInterval(timer.value)
})

function setRingRef(el, id) {
  if (el) ringRefs[id] = el
}

function formatDate(d) {
  const date = new Date(d)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 计算每个纪念日的天数信息
function computeMilestone(m) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const origin = new Date(m.date)
  origin.setHours(0, 0, 0, 0)
  const diff = Math.floor((now - origin) / (1000 * 60 * 60 * 24))

  if (m.direction === 'elapsed') {
    m.daysElapsed = diff
    m.daysLeft = null
    m.progress = null
    m.nextCycle = null
    m.nextCycleLabel = null
    return
  }

  // 倒计时模式
  if (m.type === 'once') {
    m.daysLeft = diff < 0 ? -diff : '已到'
    m.daysElapsed = null
    m.progress = diff < 0 ? 0 : 100
    m.nextCycle = null
    m.nextCycleLabel = null
    return
  }

  // 周期性
  let nextDate, cycleLength, cycleLabel

  if (m.type === 'annual') {
    cycleLength = 365
    // 找下一个纪念日
    const thisYear = new Date(now.getFullYear(), origin.getMonth(), origin.getDate())
    if (thisYear < now) {
      nextDate = new Date(now.getFullYear() + 1, origin.getMonth(), origin.getDate())
    } else {
      nextDate = thisYear
    }
    const cyclesPassed = now.getFullYear() - origin.getFullYear()
    const yearDiff = Math.floor((now - new Date(now.getFullYear(), origin.getMonth(), origin.getDate())) / (1000 * 60 * 60 * 24))
    cycleLabel = `第${Math.max(1, cyclesPassed + 1)}周年`
    m.nextCycleLabel = cycleLabel
    m.daysElapsed = diff
  } else {
    // 每月
    cycleLength = 30
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), origin.getDate())
    if (thisMonth < now) {
      nextDate = new Date(now.getFullYear(), now.getMonth() + 1, origin.getDate())
    } else {
      nextDate = thisMonth
    }
    const monthsDiff = (now.getFullYear() - origin.getFullYear()) * 12 + now.getMonth() - origin.getMonth()
    cycleLabel = `第${Math.max(1, monthsDiff + 1)}个月`
    m.nextCycleLabel = cycleLabel
    m.daysElapsed = diff
  }

  m.daysLeft = Math.floor((nextDate - now) / (1000 * 60 * 60 * 24))
  m.nextCycle = nextDate.toISOString().split('T')[0]

  // 进度：上次纪念日到下个纪念日的进度
  const prevDate = new Date(nextDate)
  if (m.type === 'annual') {
    prevDate.setFullYear(prevDate.getFullYear() - 1)
  } else {
    prevDate.setMonth(prevDate.getMonth() - 1)
  }
  const totalSpan = nextDate - prevDate
  const elapsed = now - prevDate
  m.progress = Math.round((elapsed / totalSpan) * 100)
}

function updateAllMilestones() {
  milestones.value.forEach(m => {
    computeMilestone(m)
    drawRing(m)
  })
}

// 排序的纪念日列表
const sortedMilestones = computed(() => {
  return [...milestones.value].sort((a, b) => {
    // 倒计时的排前面，按天数少的排前面
    if (a.direction === 'countdown' && b.direction === 'countdown') {
      return (a.daysLeft || Infinity) - (b.daysLeft || Infinity)
    }
    if (a.direction === 'countdown') return -1
    if (b.direction === 'countdown') return 1
    return 0
  })
})

// 近7天到期的数量
const upcomingCount = computed(() => {
  return milestones.value.filter(m => m.direction === 'countdown' && m.daysLeft !== null && m.daysLeft <= 7 && m.daysLeft >= 0).length
})

function countColor(m) {
  if (m.direction === 'elapsed') return '#6b7280'
  if (m.daysLeft === '已到') return '#22c55e'
  if (m.daysLeft <= 3) return '#ef4444'
  if (m.daysLeft <= 7) return '#f59e0b'
  return '#22c55e'
}

// 绘制进度环
function drawRing(m) {
  const canvas = ringRefs[m.id]
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  canvas.width = 80 * dpr
  canvas.height = 80 * dpr
  canvas.style.width = '80px'
  canvas.style.height = '80px'
  ctx.scale(dpr, dpr)

  const cx = 40, cy = 40, r = 32, lw = 6

  // 背景环
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.strokeStyle = '#f0f0f0'
  ctx.lineWidth = lw
  ctx.stroke()

  // 进度环
  if (m.progress !== null && m.progress > 0) {
    const progress = Math.min(100, m.progress)
    const startAngle = -Math.PI / 2
    const endAngle = startAngle + (progress / 100) * Math.PI * 2

    ctx.beginPath()
    ctx.arc(cx, cy, r, startAngle, endAngle)
    ctx.strokeStyle = countColor(m)
    ctx.lineWidth = lw
    ctx.lineCap = 'round'
    ctx.stroke()
  }

  // 中心数字
  ctx.fillStyle = '#333'
  ctx.font = 'bold 16px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (m.direction === 'elapsed') {
    ctx.font = 'bold 12px system-ui, sans-serif'
    ctx.fillText('已过', cx, cy - 6)
    ctx.fillText(String(m.daysElapsed), cx, cy + 10)
  } else if (m.daysLeft === '已到') {
    ctx.fillText('🎉', cx, cy)
  } else {
    ctx.fillText(String(m.daysLeft ?? '?'), cx, cy)
    ctx.font = '10px system-ui, sans-serif'
    ctx.fillStyle = '#888'
    ctx.fillText('天', cx, cy + 16)
  }
}

// 添加纪念日
function addMilestone() {
  if (!newTitle.value.trim() || !newDate.value) return

  const m = {
    id: Date.now().toString(),
    title: newTitle.value.trim(),
    date: newDate.value,
    type: newType.value,
    typeLabel: newType.value === 'annual' ? '每年' : newType.value === 'monthly' ? '每月' : '仅一次',
    direction: newDirection.value,
    daysLeft: null,
    daysElapsed: null,
    progress: null,
    nextCycle: null,
    nextCycleLabel: null,
  }

  computeMilestone(m)
  milestones.value.push(m)
  saveMilestones()

  nextTick(() => drawRing(m))
  newTitle.value = ''
  newDate.value = ''
}

function removeMilestone(idx) {
  milestones.value.splice(idx, 1)
  saveMilestones()
}

function saveMilestones() {
  localStorage.setItem('wildfire-milestones', JSON.stringify(milestones.value))
}

// 导出
function exportData() {
  const data = JSON.stringify(milestones.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = `milestones-${new Date().toISOString().split('T')[0]}.json`
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
}

function triggerImport() { importInput.value?.click() }

function importData(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result)
      if (Array.isArray(data)) {
        milestones.value = data
        saveMilestones()
        nextTick(updateAllMilestones)
      }
    } catch { alert('JSON 格式错误') }
  }
  reader.readAsText(file)
}
</script>

<style scoped>
.tool-page { padding-top: 0.5rem; }
h2 { font-size: 1.6rem; margin-bottom: 0.3rem; }
.subtitle { color: #888; font-size: 0.95rem; margin-bottom: 1.5rem; }
h3 { font-size: 1.05rem; margin-bottom: 0.8rem; color: #333; }

/* 添加区域 */
.add-section {
  background: white; border-radius: 12px; padding: 1.5rem;
  border: 1px solid #eee; margin-bottom: 1.5rem;
}
.add-form {
  display: grid; grid-template-columns: 1fr auto auto auto auto; gap: 0.8rem; align-items: end;
}
.text-input, .date-input, .select-input {
  padding: 0.6rem 0.8rem; border: 2px solid #e0e0e0; border-radius: 8px;
  font-size: 0.9rem; outline: none; background: white; width: 100%;
}
.text-input:focus, .date-input:focus, .select-input:focus { border-color: #22c55e; }
.btn {
  padding: 0.6rem 1.2rem; border-radius: 8px; font-size: 0.9rem;
  cursor: pointer; border: none; font-weight: 600; transition: all 0.2s; white-space: nowrap;
}
.btn-primary { background: linear-gradient(135deg, #22c55e, #10b981); color: white; }
.btn-primary:hover { opacity: 0.9; }
.btn-secondary { background: white; color: #666; border: 1px solid #ddd; }
.btn-secondary:hover { border-color: #22c55e; color: #22c55e; }

/* 统计 */
.stats-bar {
  display: flex; gap: 1.5rem; margin-bottom: 1.5rem;
}
.stat-item { text-align: center; }
.stat-num { display: block; font-size: 1.8rem; font-weight: 700; color: #22c55e; }
.stat-label { font-size: 0.8rem; color: #888; }

/* 纪念日列表 */
.milestone-list { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
.milestone-card {
  background: white; border-radius: 12px; padding: 1.2rem;
  border: 1px solid #eee; display: flex; gap: 1.2rem; transition: all 0.2s;
}
.milestone-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
.milestone-left { flex-shrink: 0; }
.milestone-info { flex: 1; min-width: 0; }
.milestone-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem; }
.milestone-title { font-size: 1.05rem; font-weight: 600; color: #333; }
.milestone-badge {
  font-size: 0.7rem; padding: 0.15rem 0.5rem; border-radius: 10px; font-weight: 600;
}
.milestone-badge.annual { background: #dbeafe; color: #2563eb; }
.milestone-badge.monthly { background: #dcfce7; color: #16a34a; }
.milestone-badge.once { background: #f3f4f6; color: #6b7280; }
.btn-del {
  margin-left: auto; background: none; border: none; cursor: pointer;
  font-size: 1rem; padding: 0.2rem; opacity: 0.5; transition: opacity 0.2s;
}
.btn-del:hover { opacity: 1; }
.milestone-date { font-size: 0.85rem; color: #888; margin-bottom: 0.3rem; }
.milestone-count { font-size: 0.95rem; font-weight: 600; }
.cycle-info { font-weight: 400; color: #888; font-size: 0.8rem; }

.empty-state {
  text-align: center; padding: 3rem; color: #aaa; background: #fafafa; border-radius: 12px;
}
.empty-icon { font-size: 3rem; display: block; margin-bottom: 1rem; }

/* 数据管理 */
.data-actions { display: flex; gap: 0.8rem; margin-bottom: 2rem; flex-wrap: wrap; }
.hidden-input { display: none; }

.back-link { display: inline-block; margin-top: 2rem; color: #22c55e; font-weight: 500; }
.back-link:hover { text-decoration: underline; }

@media (max-width: 768px) {
  .add-form { grid-template-columns: 1fr 1fr; }
  .milestone-card { flex-direction: column; align-items: center; text-align: center; }
  .milestone-header { justify-content: center; }
}
@media (max-width: 480px) {
  .add-form { grid-template-columns: 1fr; }
}
</style>
