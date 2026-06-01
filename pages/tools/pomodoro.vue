<template>
  <div class="tool-page">
    <h2>🎓 番茄钟计时器</h2>
    <p class="subtitle">25分钟专注 + 5分钟休息，科学节奏提高效率</p>

    <div class="timer-main">
      <!-- Timer Display -->
      <div class="timer-ring">
        <svg viewBox="0 0 200 200" class="timer-svg">
          <!-- Background circle -->
          <circle cx="100" cy="100" r="88" fill="none" stroke="#f0f0f0" stroke-width="8" />
          <!-- Progress circle -->
          <circle
            cx="100" cy="100" r="88"
            fill="none"
            :stroke="isBreak ? '#2ecc71' : '#ff6b35'"
            stroke-width="8"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
            transform="rotate(-90 100 100)"
            class="progress-circle"
          />
        </svg>
        <div class="timer-display">
          <div class="time-text">{{ displayTime }}</div>
          <div class="mode-text">{{ modeLabel }}</div>
        </div>
      </div>

      <!-- Controls -->
      <div class="controls">
        <button v-if="!running" class="btn-start" @click="startTimer">
          {{ timeLeft === totalSeconds ? '开始' : '继续' }}
        </button>
        <button v-else class="btn-pause" @click="pauseTimer">暂停</button>
        <button v-if="running || timeLeft !== totalSeconds" class="btn-reset" @click="resetTimer">重置</button>
      </div>

      <!-- Mode selector -->
      <div class="mode-tabs">
        <button :class="{ active: !isBreak }" @click="switchMode(false)">
          🍅 专注 ({{ workMinutes }}分钟)
        </button>
        <button :class="{ active: isBreak }" @click="switchMode(true)">
          ☕ 休息 ({{ breakMinutes }}分钟)
        </button>
      </div>

      <!-- Duration settings -->
      <div class="settings" v-if="!running && timeLeft === totalSeconds">
        <div class="setting-row">
          <label>专注时长</label>
          <div class="stepper">
            <button @click="workMinutes = Math.max(1, workMinutes - 5)">−</button>
            <span>{{ workMinutes }} 分钟</span>
            <button @click="workMinutes = Math.min(90, workMinutes + 5)">+</button>
          </div>
        </div>
        <div class="setting-row">
          <label>休息时长</label>
          <div class="stepper">
            <button @click="breakMinutes = Math.max(1, breakMinutes - 1)">−</button>
            <span>{{ breakMinutes }} 分钟</span>
            <button @click="breakMinutes = Math.min(30, breakMinutes + 1)">+</button>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-area">
        <div class="stat-card">
          <div class="stat-value">{{ todayPomodoros }}</div>
          <div class="stat-label">今日番茄</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ todayMinutes }}</div>
          <div class="stat-label">专注分钟</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ streak }}</div>
          <div class="stat-label">连续完成</div>
        </div>
      </div>
    </div>

    <!-- History -->
    <div class="history" v-if="history.length > 0">
      <h3>今日记录</h3>
      <div class="history-list">
        <div v-for="(h, i) in [...history].reverse()" :key="i" class="history-item">
          <span class="history-time">{{ h.time }}</span>
          <span class="history-icon">{{ h.isBreak ? '☕' : '🍅' }}</span>
          <span class="history-label">{{ h.isBreak ? '休息' : '专注' }} {{ h.minutes }} 分钟</span>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '番茄钟 - 野火小站' })

const workMinutes = ref(25)
const breakMinutes = ref(5)
const isBreak = ref(false)
const running = ref(false)
const timeLeft = ref(25 * 60)

const todayPomodoros = ref(0)
const todayMinutes = ref(0)
const streak = ref(0)
const history = ref([])

const totalSeconds = computed(() => (isBreak.value ? breakMinutes.value : workMinutes.value) * 60)
const circumference = 2 * Math.PI * 88 // ~553
const dashOffset = computed(() => {
  const progress = timeLeft.value / totalSeconds.value
  return circumference * progress
})

const displayTime = computed(() => {
  const m = Math.floor(timeLeft.value / 60)
  const s = timeLeft.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const modeLabel = computed(() => {
  if (running.value) return isBreak.value ? '休息中...' : '专注中...'
  if (timeLeft.value === totalSeconds.value) return isBreak.value ? '准备休息' : '准备专注'
  return '已暂停'
})

let interval = null

// Load today stats from localStorage
function loadStats() {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const data = JSON.parse(localStorage.getItem('pomodoro_' + today) || '{}')
    todayPomodoros.value = data.pomodoros || 0
    todayMinutes.value = data.minutes || 0
    streak.value = data.streak || 0
    history.value = data.history || []
  } catch {}
}

function saveStats() {
  try {
    const today = new Date().toISOString().slice(0, 10)
    localStorage.setItem('pomodoro_' + today, JSON.stringify({
      pomodoros: todayPomodoros.value,
      minutes: todayMinutes.value,
      streak: streak.value,
      history: history.value,
    }))
  } catch {}
}

function startTimer() {
  running.value = true
  interval = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      clearInterval(interval)
      interval = null
      running.value = false
      playSound()
      onComplete()
    }
  }, 1000)
}

function pauseTimer() {
  running.value = false
  if (interval) {
    clearInterval(interval)
    interval = null
  }
}

function resetTimer() {
  pauseTimer()
  timeLeft.value = totalSeconds.value
}

function switchMode(breakMode) {
  if (running.value) return
  isBreak.value = breakMode
  timeLeft.value = totalSeconds.value
}

function onComplete() {
  const mins = isBreak.value ? breakMinutes.value : workMinutes.value
  const now = new Date()
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  if (!isBreak.value) {
    todayPomodoros.value++
    todayMinutes.value += mins
    streak.value++
  } else {
    streak.value = 0
  }

  history.value.push({
    time: timeStr,
    isBreak: isBreak.value,
    minutes: mins,
  })

  saveStats()

  // Auto switch mode
  timeLeft.value = 0
  setTimeout(() => {
    isBreak.value = !isBreak.value
    timeLeft.value = totalSeconds.value
  }, 2000)
}

function playSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    // Play a pleasant ding
    const notes = [523.25, 659.25, 783.99] // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.2)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.5)
      osc.start(ctx.currentTime + i * 0.2)
      osc.stop(ctx.currentTime + i * 0.2 + 0.5)
    })
  } catch {}
}

onMounted(() => {
  loadStats()
})

// Auto-save periodically
watch([todayPomodoros, todayMinutes, streak, history], saveStats, { deep: true })
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

.timer-main {
  text-align: center;
}

.timer-ring {
  position: relative;
  width: 240px;
  height: 240px;
  margin: 0 auto 1.5rem;
}

.timer-svg {
  width: 100%;
  height: 100%;
}

.progress-circle {
  transition: stroke-dashoffset 0.5s ease;
}

.timer-display {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.time-text {
  font-size: 2.8rem;
  font-weight: 700;
  color: #2c3e50;
  font-variant-numeric: tabular-nums;
  letter-spacing: 2px;
}

.mode-text {
  font-size: 0.85rem;
  color: #aaa;
  margin-top: 4px;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.btn-start, .btn-pause, .btn-reset {
  padding: 0.6rem 2rem;
  border-radius: 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-start {
  background: linear-gradient(135deg, #ff6b35, #ff8c42);
  color: white;
}

.btn-start:hover {
  opacity: 0.85;
}

.btn-pause {
  background: #f39c12;
  color: white;
}

.btn-pause:hover {
  opacity: 0.85;
}

.btn-reset {
  background: white;
  color: #888;
  border: 1px solid #e0e0e0;
}

.btn-reset:hover {
  border-color: #e74c3c;
  color: #e74c3c;
}

.mode-tabs {
  display: flex;
  justify-content: center;
  gap: 0;
  background: #f0f0f0;
  border-radius: 24px;
  overflow: hidden;
  max-width: 400px;
  margin: 0 auto 1.5rem;
  padding: 3px;
}

.mode-tabs button {
  flex: 1;
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  border-radius: 21px;
  font-size: 0.85rem;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.mode-tabs button.active {
  background: white;
  color: #333;
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

.settings {
  max-width: 360px;
  margin: 0 auto 2rem;
  background: #fafafa;
  border-radius: 12px;
  padding: 1rem;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0;
}

.setting-row label {
  font-size: 0.9rem;
  color: #555;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stepper button {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid #ddd;
  background: white;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
}

.stepper button:hover {
  border-color: #ff8c42;
  color: #ff6b35;
}

.stepper span {
  font-size: 0.9rem;
  min-width: 60px;
  text-align: center;
}

.stats-area {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  text-align: center;
  background: white;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  min-width: 90px;
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 700;
  color: #ff6b35;
}

.stat-label {
  font-size: 0.8rem;
  color: #aaa;
  margin-top: 0.2rem;
}

.history {
  max-width: 400px;
  margin: 0 auto 1.5rem;
}

.history h3 {
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 0.75rem;
  text-align: center;
}

.history-list {
  max-height: 200px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0;
  font-size: 0.85rem;
  color: #666;
  border-bottom: 1px solid #f5f5f5;
}

.history-time {
  color: #aaa;
  font-variant-numeric: tabular-nums;
}

.history-icon {
  font-size: 1rem;
}

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #ff6b35;
  font-weight: 500;
}

.back-link:hover {
  text-decoration: underline;
}
</style>
