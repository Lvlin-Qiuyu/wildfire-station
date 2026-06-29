<template>
  <div class="tool-page">
    <h2>🧠 间隔重复复习计划器</h2>
    <p class="subtitle">科学安排复习节奏，让记忆更持久</p>

    <!-- 算法选择 -->
    <div class="algo-tabs">
      <button v-for="a in algorithms" :key="a.id" :class="{ active: algorithm === a.id }"
        @click="algorithm = a.id">{{ a.icon }} {{ a.name }}</button>
    </div>

    <!-- 添加科目 -->
    <div class="add-section">
      <h3>📚 添加学习计划</h3>
      <div class="form-row">
        <input type="text" v-model="subjectName" placeholder="科目名称" class="input-subject" />
        <input type="date" v-model="learnDate" class="input-date" />
        <select v-model.number="rounds" class="input-rounds">
          <option v-for="n in 6" :key="n" :value="n">{{ n }}轮复习</option>
        </select>
        <button class="btn-add" @click="addSubject" :disabled="!subjectName">+ 添加</button>
      </div>
    </div>

    <!-- 今日待复习 -->
    <div class="today-section" v-if="todayReviews.length > 0">
      <h3>📌 今日待复习 ({{ todayReviews.length }})</h3>
      <div class="review-list">
        <div v-for="item in todayReviews" :key="item.id" class="review-item">
          <span class="review-subject">{{ item.name }}</span>
          <span class="review-round">第{{ item.round }}轮</span>
          <button class="btn-done" @click="markDone(item)">✓ 完成</button>
        </div>
      </div>
    </div>

    <!-- 遗忘曲线图 -->
    <div class="chart-section" v-if="subjects.length > 0">
      <h3>📈 遗忘曲线</h3>
      <div class="chart-box">
        <canvas ref="chartCanvas" width="800" height="360" />
      </div>
    </div>

    <!-- 科目列表 -->
    <div class="subjects-section" v-if="subjects.length > 0">
      <h3>📋 科目列表</h3>
      <div class="subject-list">
        <div v-for="sub in subjects" :key="sub.id" class="subject-card">
          <div class="subject-header">
            <span class="subject-name">{{ sub.name }}</span>
            <span class="subject-date">学习日: {{ sub.learnDate }}</span>
            <button class="btn-remove" @click="removeSubject(sub.id)">✕</button>
          </div>
          <div class="review-dots">
            <div v-for="(date, i) in sub.schedule" :key="i" class="dot"
              :class="{
                done: sub.completed >= i + 1,
                today: isToday(date),
                future: date > todayStr
              }" :title="date">
              <span class="dot-num">{{ i + 1 }}</span>
              <span class="dot-date">{{ formatDateShort(date) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '间隔重复复习计划器 - 野火小站' })

const chartCanvas = ref(null)
const algorithm = ref('ebbinghaus')
const subjectName = ref('')
const learnDate = ref(new Date().toISOString().slice(0, 10))
const rounds = ref(4)
const subjects = ref([])

const todayStr = computed(() => new Date().toISOString().slice(0, 10))

// ============ 算法定义 ============
const algorithms = [
  { id: 'ebbinghaus', icon: '📉', name: '艾宾浩斯' },
  { id: 'supermemo', icon: '🔄', name: 'SuperMemo 2' },
  { id: 'cepeda', icon: '🧪', name: 'Cepeda优化' },
]

// 生成复习间隔（天数）
function getIntervals(algo, maxRounds) {
  if (algo === 'ebbinghaus') {
    // 经典艾宾浩斯遗忘曲线：1,2,4,7,15,30
    return [1, 2, 4, 7, 15, 30].slice(0, maxRounds)
  }
  if (algo === 'supermemo') {
    // SuperMemo 2 简化版：递增间隔
    const base = [1, 3, 7, 14, 28, 56]
    return base.slice(0, maxRounds)
  }
  if (algo === 'cepeda') {
    // Cepeda 2008 优化间隔
    const base = [1, 3, 6, 13, 28, 60]
    return base.slice(0, maxRounds)
  }
  return [1, 2, 4, 7, 15, 30].slice(0, maxRounds)
}

// 根据算法生成复习日期
function generateSchedule(algo, dateStr, maxRounds) {
  const intervals = getIntervals(algo, maxRounds)
  const base = new Date(dateStr)
  return intervals.map(d => {
    const dt = new Date(base)
    dt.setDate(dt.getDate() + d)
    return dt.toISOString().slice(0, 10)
  })
}

// ============ 遗忘曲线公式 ============
function memoryRetention(days, algo) {
  if (algo === 'ebbinghaus') return Math.exp(-days / 5)
  if (algo === 'supermemo') return Math.exp(-days / 7)
  if (algo === 'cepeda') return Math.exp(-days / 6)
  return Math.exp(-days / 5)
}

// ============ 本地存储 ============
function loadSubjects() {
  try {
    const data = JSON.parse(localStorage.getItem('spaced_repetition') || '[]')
    subjects.value = data
  } catch {}
}

function saveSubjects() {
  try {
    localStorage.setItem('spaced_repetition', JSON.stringify(subjects.value))
  } catch {}
}

// ============ 操作 ============
function addSubject() {
  if (!subjectName.value.trim()) return
  const sub = {
    id: Date.now(),
    name: subjectName.value.trim(),
    learnDate: learnDate.value,
    algorithm: algorithm.value,
    rounds: rounds.value,
    completed: 0,
    schedule: generateSchedule(algorithm.value, learnDate.value, rounds.value),
  }
  subjects.value.unshift(sub)
  subjectName.value = ''
  saveSubjects()
  nextTick(() => drawChart())
}

function removeSubject(id) {
  subjects.value = subjects.value.filter(s => s.id !== id)
  saveSubjects()
  nextTick(() => drawChart())
}

function markDone(item) {
  const sub = subjects.value.find(s => s.id === item.subId)
  if (sub) {
    sub.completed = Math.max(sub.completed, item.round)
    saveSubjects()
  }
}

const todayReviews = computed(() => {
  const today = todayStr.value
  const result = []
  subjects.value.forEach(sub => {
    sub.schedule.forEach((date, i) => {
      if (date === today && sub.completed < i + 1) {
        result.push({ id: `${sub.id}-${i}`, subId: sub.id, name: sub.name, round: i + 1 })
      }
    })
  })
  return result
})

function isToday(date) { return date === todayStr.value }

function formatDateShort(date) {
  const d = new Date(date)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

// ============ Canvas 绘制遗忘曲线 ============
function drawChart() {
  const canvas = chartCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = canvas.width, H = canvas.height
  const pad = { top: 40, right: 30, bottom: 50, left: 60 }
  const gW = W - pad.left - pad.right
  const gH = H - pad.top - pad.bottom

  ctx.clearRect(0, 0, W, H)

  // 坐标轴
  ctx.strokeStyle = '#e0e0e0'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(pad.left, pad.top)
  ctx.lineTo(pad.left, H - pad.bottom)
  ctx.lineTo(W - pad.right, H - pad.bottom)
  ctx.stroke()

  // Y轴标签
  ctx.fillStyle = '#999'
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'right'
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (gH / 4) * i
    const val = 100 - i * 25
    ctx.fillText(val + '%', pad.left - 10, y + 4)
    ctx.strokeStyle = '#f0f0f0'
    ctx.beginPath()
    ctx.moveTo(pad.left, y)
    ctx.lineTo(W - pad.right, y)
    ctx.stroke()
  }

  // X轴标签
  ctx.textAlign = 'center'
  const maxDays = 35
  for (let d = 0; d <= maxDays; d += 5) {
    const x = pad.left + (d / maxDays) * gW
    ctx.fillText(d + '天', x, H - pad.bottom + 20)
  }

  // 绘制遗忘曲线
  const algoInfo = {
    ebbinghaus: { color: '#22c55e', label: '艾宾浩斯' },
    supermemo: { color: '#3b82f6', label: 'SuperMemo' },
    cepeda: { color: '#f59e0b', label: 'Cepeda' },
  }

  // 绘制所有三条曲线（半透明）
  Object.entries(algoInfo).forEach(([key, info]) => {
    ctx.beginPath()
    ctx.strokeStyle = key === algorithm.value ? info.color : info.color + '40'
    ctx.lineWidth = key === algorithm.value ? 2.5 : 1.5
    if (key !== algorithm.value) ctx.setLineDash([5, 5])
    else ctx.setLineDash([])

    for (let d = 0; d <= maxDays; d++) {
      const r = memoryRetention(d, key)
      const x = pad.left + (d / maxDays) * gW
      const y = pad.top + (1 - r) * gH
      d === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.setLineDash([])
  })

  // 标记复习节点（当前选中科目）
  const currentSub = subjects.value[0]
  if (currentSub) {
    const intervals = getIntervals(algorithm.value, currentSub.rounds)
    intervals.forEach((d, i) => {
      const x = pad.left + (d / maxDays) * gW
      const r = memoryRetention(d, algorithm.value)
      const y = pad.top + (1 - r) * gH
      const done = currentSub.completed >= i + 1

      ctx.beginPath()
      ctx.arc(x, y, 6, 0, Math.PI * 2)
      ctx.fillStyle = done ? '#22c55e' : '#ef4444'
      ctx.fill()
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = '#333'
      ctx.font = 'bold 11px sans-serif'
      ctx.fillText(`R${i + 1}`, x, y - 12)
    })
  }

  // 图例
  let legendX = pad.left + 10
  Object.entries(algoInfo).forEach(([key, info]) => {
    const isActive = key === algorithm.value
    ctx.fillStyle = info.color
    ctx.font = isActive ? 'bold 12px sans-serif' : '12px sans-serif'
    ctx.fillText(`— ${info.label}`, legendX, 20)
    legendX += ctx.measureText(`— ${info.label}`).width + 20
  })
}

// ============ 生命周期 ============
onMounted(() => {
  loadSubjects()
  if (subjects.value.length > 0) nextTick(() => drawChart())
})

watch(algorithm, () => {
  if (subjects.value.length > 0) drawChart()
})
</script>

<style scoped>
.tool-page { padding-top: 0.5rem; }
h2 { font-size: 1.6rem; margin-bottom: 0.3rem; }
h3 { font-size: 1rem; margin-bottom: 0.6rem; color: #555; }
.subtitle { color: #888; font-size: 0.95rem; margin-bottom: 1.5rem; }

.algo-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.algo-tabs button {
  padding: 0.5rem 1rem; border: 2px solid #e0e0e0; background: white;
  border-radius: 20px; cursor: pointer; font-size: 0.85rem; transition: all 0.2s;
}
.algo-tabs button.active { border-color: #22c55e; background: #f0fdf4; color: #22c55e; font-weight: 600; }

.add-section { background: #f8f9fa; border-radius: 12px; padding: 1.2rem; margin-bottom: 1.5rem; }
.form-row { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
.input-subject { flex: 1; min-width: 120px; padding: 0.6rem 0.8rem; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.9rem; outline: none; }
.input-subject:focus { border-color: #22c55e; }
.input-date { padding: 0.6rem 0.8rem; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.9rem; outline: none; }
.input-rounds { padding: 0.6rem 0.8rem; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.9rem; outline: none; background: white; }
.btn-add {
  padding: 0.6rem 1.2rem; background: linear-gradient(135deg, #22c55e, #10b981); color: white;
  border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem; white-space: nowrap;
}
.btn-add:disabled { opacity: 0.5; cursor: not-allowed; }

.today-section {
  background: linear-gradient(135deg, #fef3c7, #fff7ed); border-radius: 12px;
  padding: 1.2rem; margin-bottom: 1.5rem; border: 2px solid #fbbf24;
}
.today-section h3 { color: #92400e; margin-bottom: 0.5rem; }
.review-list { display: flex; flex-direction: column; gap: 0.4rem; }
.review-item {
  display: flex; align-items: center; gap: 0.8rem; padding: 0.6rem 0.8rem;
  background: rgba(255,255,255,0.7); border-radius: 8px;
}
.review-subject { flex: 1; font-weight: 600; color: #333; }
.review-round { font-size: 0.85rem; color: #666; background: #fef3c7; padding: 0.2rem 0.6rem; border-radius: 10px; }
.btn-done {
  padding: 0.3rem 0.8rem; background: #22c55e; color: white; border: none;
  border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600;
}
.btn-done:hover { background: #16a34a; }

.chart-section { margin-bottom: 1.5rem; }
.chart-box {
  background: white; border-radius: 12px; padding: 1rem; overflow-x: auto;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.chart-box canvas { width: 100%; height: auto; max-width: 800px; }

.subjects-section { margin-bottom: 1.5rem; }
.subject-list { display: flex; flex-direction: column; gap: 0.8rem; }
.subject-card {
  background: white; border-radius: 12px; padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.subject-header { display: flex; align-items: center; gap: 0.8rem; margin-bottom: 0.6rem; }
.subject-name { font-weight: 700; font-size: 1rem; color: #333; flex: 1; }
.subject-date { font-size: 0.8rem; color: #999; }
.btn-remove { background: none; border: none; cursor: pointer; color: #ccc; font-size: 1rem; }
.btn-remove:hover { color: #ef4444; }

.review-dots { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.dot {
  display: flex; flex-direction: column; align-items: center; padding: 0.5rem 0.7rem;
  border-radius: 8px; min-width: 56px; transition: all 0.2s;
  border: 2px solid #eee;
}
.dot.done { border-color: #22c55e; background: #f0fdf4; }
.dot.today { border-color: #f59e0b; background: #fffbeb; }
.dot.future { border-color: #e0e0e0; }
.dot-num { font-weight: 700; font-size: 0.9rem; color: #555; }
.dot.done .dot-num { color: #22c55e; }
.dot.today .dot-num { color: #f59e0b; }
.dot-date { font-size: 0.7rem; color: #999; margin-top: 0.2rem; }

.back-link { display: inline-block; margin-top: 2rem; color: #22c55e; font-weight: 600; }
.back-link:hover { text-decoration: underline; }

@media (max-width: 600px) {
  .form-row { flex-direction: column; }
  .form-row input, .form-row select { width: 100%; }
  .chart-box { padding: 0.5rem; }
}
</style>
