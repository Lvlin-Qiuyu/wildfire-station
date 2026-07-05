<template>
  <div class="tool-page">
    <h2>🎂 年龄精确计算器</h2>
    <p class="subtitle">输入出生日期，精确到秒的实时年龄计算，附带趣味统计</p>

    <!-- 输入区 -->
    <div class="input-area">
      <div class="field">
        <label>出生日期</label>
        <div class="input-row">
          <input type="date" v-model="birthDate" :max="todayStr" />
          <div class="field">
            <input type="time" v-model="birthTime" step="1" />
          </div>
        </div>
      </div>
    </div>

    <!-- 精确年龄 -->
    <div v-if="isClient && age" class="age-display">
      <h3>📍 你的精确年龄</h3>
      <div class="age-values">
        <div class="age-block">
          <span class="age-num">{{ age.years }}</span>
          <span class="age-label">年</span>
        </div>
        <div class="age-sep">年</div>
        <div class="age-block">
          <span class="age-num">{{ age.months }}</span>
          <span class="age-label">月</span>
        </div>
        <div class="age-sep">月</div>
        <div class="age-block">
          <span class="age-num">{{ age.days }}</span>
          <span class="age-label">天</span>
        </div>
        <div class="age-sep">天</div>
        <div class="age-block highlight">
          <span class="age-num">{{ age.hours }}</span>
          <span class="age-label">时</span>
        </div>
        <div class="age-sep">时</div>
        <div class="age-block highlight">
          <span class="age-num">{{ age.minutes }}</span>
          <span class="age-label">分</span>
        </div>
        <div class="age-sep">分</div>
        <div class="age-block highlight pulse">
          <span class="age-num">{{ age.seconds }}</span>
          <span class="age-label">秒</span>
        </div>
      </div>
      <div class="age-note">已精确存活 {{ totalSeconds.toLocaleString() }} 秒</div>
    </div>

    <!-- 下一个生日倒计时 -->
    <div v-if="isClient && age && nextBirthday" class="next-birthday">
      <span>🎂 距离下一个生日还有 <strong>{{ nextBirthday.days }}</strong> 天 <strong>{{ nextBirthday.hours }}</strong> 时 <strong>{{ nextBirthday.minutes }}</strong> 分</span>
    </div>

    <!-- 趣味统计 -->
    <div v-if="isClient && age" class="fun-stats">
      <h3>🎮 趣味统计</h3>
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-icon">📅</span>
          <span class="stat-val">{{ totalDays.toLocaleString() }}</span>
          <span class="stat-label">已活天数</span>
        </div>
        <div class="stat-card">
          <span class="stat-icon">📆</span>
          <span class="stat-val">{{ Math.floor(totalDays / 7).toLocaleString() }}</span>
          <span class="stat-label">已活周数</span>
        </div>
        <div class="stat-card">
          <span class="stat-icon">🕐</span>
          <span class="stat-val">{{ (totalDays * 24).toLocaleString() }}</span>
          <span class="stat-label">已活小时</span>
        </div>
        <div class="stat-card">
          <span class="stat-icon">⏱️</span>
          <span class="stat-val">{{ (totalDays * 24 * 60).toLocaleString() }}</span>
          <span class="stat-label">已活分钟</span>
        </div>
        <div class="stat-card">
          <span class="stat-icon">💓</span>
          <span class="stat-val">{{ heartbeatEst.toLocaleString() }}</span>
          <span class="stat-label">估计心跳次数</span>
        </div>
        <div class="stat-card">
          <span class="stat-icon">🫁</span>
          <span class="stat-val">{{ breathEst.toLocaleString() }}</span>
          <span class="stat-label">估计呼吸次数</span>
        </div>
        <div class="stat-card">
          <span class="stat-icon">🌙</span>
          <span class="stat-val">{{ Math.floor(totalDays / 365.25 * 365.25).toLocaleString() }}</span>
          <span class="stat-label">已过月亮盈亏</span>
        </div>
        <div class="stat-card">
          <span class="stat-icon">🌍</span>
          <span class="stat-val">{{ (totalDays * 24 * 3600 * 460).toLocaleString() }}</span>
          <span class="stat-label">绕太阳公转(米)</span>
        </div>
      </div>
    </div>

    <!-- 人生进度条 -->
    <div v-if="isClient && age" class="life-progress">
      <h3>🎯 人生进度条（假设80岁）</h3>
      <div class="progress-bar-container">
        <div class="progress-bar" :style="{ width: lifePercent + '%' }"></div>
      </div>
      <div class="progress-text">{{ lifePercent.toFixed(4) }}%</div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '年龄精确计算器 - 野火小站' })

const isClient = ref(false)
const birthDate = ref('')
const birthTime = ref('00:00:00')
const age = ref(null)
const totalSeconds = ref(0)
const totalDays = ref(0)
const heartbeatEst = ref(0)
const breathEst = ref(0)
const nextBirthday = ref(null)
const lifePercent = ref(0)

// 今天日期字符串
const todayDate = new Date()
const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`

// 默认填充示例日期
onMounted(() => {
  isClient.value = true
  // 不自动填充，让用户输入
})

// 计算精确年龄
function calcAge() {
  if (!birthDate.value) {
    age.value = null
    return
  }

  const birth = new Date(`${birthDate.value}T${birthTime.value || '00:00:00'}`)
  const now = new Date()

  if (isNaN(birth.getTime()) || birth > now) {
    age.value = null
    return
  }

  // 精确年月日时分秒
  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()
  let days = now.getDate() - birth.getDate()
  let hours = now.getHours() - birth.getHours()
  let minutes = now.getMinutes() - birth.getMinutes()
  let seconds = now.getSeconds() - birth.getSeconds()

  if (seconds < 0) { seconds += 60; minutes-- }
  if (minutes < 0) { minutes += 60; hours-- }
  if (hours < 0) { hours += 24; days-- }
  if (days < 0) {
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    days += prevMonth.getDate()
    months--
  }
  if (months < 0) { months += 12; years-- }

  age.value = { years, months, days, hours, minutes, seconds }

  // 总秒数
  const diffMs = now.getTime() - birth.getTime()
  totalSeconds.value = Math.floor(diffMs / 1000)
  totalDays.value = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  // 趣味统计：平均心率72次/分钟，呼吸16次/分钟
  const totalMinutes = totalDays.value * 24 * 60
  heartbeatEst.value = Math.floor(totalMinutes * 72)
  breathEst.value = Math.floor(totalMinutes * 16)

  // 下一个生日
  const nextBirth = new Date(now.getFullYear(), birth.getMonth(), birth.getDate(), birth.getHours(), birth.getMinutes())
  if (nextBirth <= now) {
    nextBirth.setFullYear(now.getFullYear() + 1)
  }
  const remainMs = nextBirth.getTime() - now.getTime()
  nextBirthday.value = {
    days: Math.floor(remainMs / (1000 * 60 * 60 * 24)),
    hours: Math.floor((remainMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((remainMs % (1000 * 60 * 60)) / (1000 * 60)),
  }

  // 人生进度条
  const totalLifeDays = 80 * 365.25
  lifePercent.value = Math.min(100, (totalDays.value / totalLifeDays) * 100)
}

// requestAnimationFrame 实时更新
let rafId = null
function tick() {
  if (birthDate.value) calcAge()
  rafId = requestAnimationFrame(tick)
}

onMounted(() => {
  rafId = requestAnimationFrame(tick)
})
onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
})

// 监听输入变化立即生效
watch([birthDate, birthTime], calcAge)
</script>

<style scoped>
.tool-page { padding-top: 0.5rem; }
h2 { font-size: 1.6rem; margin-bottom: 0.3rem; }
.subtitle { color: #888; font-size: 0.95rem; margin-bottom: 1.5rem; }
h3 { font-size: 1.1rem; margin-bottom: 0.8rem; color: #333; }

.field { margin-bottom: 1rem; }
.field label { display: block; margin-bottom: 0.4rem; font-weight: 600; font-size: 0.9rem; }
.input-row { display: flex; gap: 1rem; }
.input-row input {
  width: 100%; padding: 0.6rem 0.8rem; border: 2px solid #e0e0e0; border-radius: 8px;
  font-size: 1rem; outline: none; transition: border-color 0.2s; box-sizing: border-box;
}
.input-row input:focus { border-color: #22c55e; }

.input-area {
  background: #f8f9fa; border-radius: 12px; padding: 1.2rem; margin-bottom: 1.5rem;
}

.age-display {
  background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
  border-radius: 16px; padding: 2rem 1.5rem; margin-bottom: 1.5rem; text-align: center;
}

.age-values {
  display: flex; align-items: center; justify-content: center; gap: 0.3rem;
  flex-wrap: wrap; margin-bottom: 1rem;
}
.age-block { text-align: center; margin: 0 0.2rem; }
.age-num {
  display: block; font-size: 2rem; font-weight: 700; color: #22c55e; line-height: 1.2;
  font-variant-numeric: tabular-nums;
}
.age-label { font-size: 0.8rem; color: #888; }
.age-sep { font-size: 0.85rem; color: #aaa; margin: 0 0.15rem; }
.age-block.highlight .age-num { color: #10b981; font-size: 1.8rem; }
.age-block.pulse .age-num { color: #059669; animation: pulse 1s infinite; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.age-note { color: #666; font-size: 0.95rem; }

.next-birthday {
  background: #fffbeb; border-radius: 10px; padding: 1rem; text-align: center;
  margin-bottom: 1.5rem; font-size: 1rem; color: #92400e;
}
.next-birthday strong { color: #f59e0b; }

.fun-stats {
  background: #f8f9fa; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;
}
.stats-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.8rem; margin-top: 0.5rem;
}
.stat-card {
  text-align: center; background: white; border-radius: 10px; padding: 1rem 0.5rem;
  transition: transform 0.2s;
}
.stat-card:hover { transform: translateY(-2px); }
.stat-icon { display: block; font-size: 1.5rem; margin-bottom: 0.3rem; }
.stat-val {
  display: block; font-size: 1.2rem; font-weight: 700; color: #22c55e;
  font-variant-numeric: tabular-nums;
}
.stat-label { font-size: 0.7rem; color: #888; margin-top: 0.2rem; }

.life-progress {
  background: #f8f9fa; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;
}
.progress-bar-container {
  width: 100%; height: 24px; background: #e5e7eb; border-radius: 12px;
  overflow: hidden; margin-bottom: 0.5rem;
}
.progress-bar {
  height: 100%; background: linear-gradient(90deg, #22c55e, #10b981);
  border-radius: 12px; transition: width 0.5s ease;
}
.progress-text { text-align: center; font-size: 1.2rem; font-weight: 700; color: #22c55e; }

.back-link {
  display: inline-block; margin-top: 2rem; color: #22c55e;
  text-decoration: none; font-weight: 600;
}
.back-link:hover { text-decoration: underline; }

@media (max-width: 600px) {
  .age-num { font-size: 1.5rem; }
  .age-block.highlight .age-num { font-size: 1.3rem; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .age-values { gap: 0.15rem; }
}
</style>
