<template>
  <div class="tool-page">
    <h2>⏱️ 智能时间工具箱</h2>

    <div class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >{{ tab.icon }} {{ tab.label }}</button>
    </div>

    <!-- 时间差计算 -->
    <div v-if="activeTab === 'diff'" class="tab-content">
      <div class="datetime-row">
        <div class="field">
          <label>开始时间</label>
          <input type="datetime-local" v-model="diffStart" />
        </div>
        <div class="field">
          <label>结束时间</label>
          <input type="datetime-local" v-model="diffEnd" />
        </div>
      </div>
      <div v-if="diffResult" class="result-box">
        <h3>时间差</h3>
        <div class="diff-values">
          <div class="diff-item">
            <span class="diff-num">{{ diffResult.days }}</span>
            <span class="diff-label">天</span>
          </div>
          <div class="diff-item">
            <span class="diff-num">{{ diffResult.hours }}</span>
            <span class="diff-label">时</span>
          </div>
          <div class="diff-item">
            <span class="diff-num">{{ diffResult.minutes }}</span>
            <span class="diff-label">分</span>
          </div>
          <div class="diff-item">
            <span class="diff-num">{{ diffResult.seconds }}</span>
            <span class="diff-label">秒</span>
          </div>
        </div>
        <div class="diff-total">总计: <strong>{{ diffResult.totalSeconds.toLocaleString() }}</strong> 秒</div>
        <button class="btn-copy" @click="copyDiff">{{ copyText }}</button>
      </div>
    </div>

    <!-- 倒计时器 -->
    <div v-if="activeTab === 'countdown'" class="tab-content">
      <div class="field">
        <label>目标时间</label>
        <input type="datetime-local" v-model="countdownTarget" />
      </div>
      <button class="btn-start" @click="toggleCountdown">
        {{ countdownRunning ? '⏸ 暂停' : '▶ 开始倒计时' }}
      </button>
      <div v-if="countdownResult" class="result-box">
        <div class="diff-values">
          <div class="diff-item">
            <span class="diff-num">{{ countdownResult.days }}</span>
            <span class="diff-label">天</span>
          </div>
          <div class="diff-item">
            <span class="diff-num">{{ countdownResult.hours }}</span>
            <span class="diff-label">时</span>
          </div>
          <div class="diff-item">
            <span class="diff-num">{{ countdownResult.minutes }}</span>
            <span class="diff-label">分</span>
          </div>
          <div class="diff-item">
            <span class="diff-num">{{ countdownResult.seconds }}</span>
            <span class="diff-label">秒</span>
          </div>
        </div>
        <div v-if="countdownExpired" class="expired-msg">🎉 倒计时结束！</div>
      </div>
    </div>

    <!-- 时区转换 -->
    <div v-if="activeTab === 'timezone'" class="tab-content">
      <div class="field">
        <label>参考时间</label>
        <input type="datetime-local" v-model="tzTime" step="1" />
      </div>
      <div class="field">
        <label>搜索时区</label>
        <input v-model="tzSearch" placeholder="搜索城市或时区..." class="search-input" />
      </div>
      <div class="tz-grid">
        <div v-for="tz in filteredTimezones" :key="tz" class="tz-card" @click="selectTimezone(tz)">
          <span class="tz-name">{{ tz.replace(/_/g, ' ') }}</span>
          <span class="tz-time">{{ formatTzTime(tz) }}</span>
        </div>
      </div>
      <div v-if="selectedTz" class="selected-tz">
        <h3>已选时区</h3>
        <div class="tz-detail">
          <strong>{{ selectedTz.replace(/_/g, ' ') }}</strong>
          <span class="tz-time-lg">{{ formatTzTime(selectedTz) }}</span>
        </div>
        <button class="btn-copy" @click="copyTzTime">{{ copyText }}</button>
      </div>
    </div>

    <!-- 时间戳转换 -->
    <div v-if="activeTab === 'timestamp'" class="tab-content">
      <div class="panels">
        <div class="panel">
          <label>时间戳</label>
          <input
            v-model="tsInput"
            type="text"
            placeholder="输入秒或毫秒时间戳..."
            @input="tsFromTimestamp"
          />
          <div class="radio-row">
            <label><input type="radio" v-model="tsUnit" value="s" /> 秒</label>
            <label><input type="radio" v-model="tsUnit" value="ms" /> 毫秒</label>
          </div>
        </div>
        <div class="panel">
          <label>日期时间</label>
          <input
            v-model="tsDate"
            type="datetime-local"
            step="1"
            @input="tsFromDate"
          />
        </div>
      </div>
      <div v-if="tsResult" class="result-box">
        <div class="ts-detail">
          <div class="ts-row"><span>秒级时间戳:</span> <code @click="copyTs($event)">{{ tsResult.s }}</code></div>
          <div class="ts-row"><span>毫秒时间戳:</span> <code @click="copyTs($event)">{{ tsResult.ms }}</code></div>
          <div class="ts-row"><span>ISO 8601:</span> <code @click="copyTs($event)">{{ tsResult.iso }}</code></div>
          <div class="ts-row"><span>本地时间:</span> <code>{{ tsResult.local }}</code></div>
          <div class="ts-row"><span>UTC 时间:</span> <code>{{ tsResult.utc }}</code></div>
        </div>
      </div>
      <div class="current-ts">
        当前时间戳: <code>{{ currentTs }}</code>
        <button class="btn-copy-sm" @click="copyCurrentTs">复制</button>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '智能时间工具箱 - 野火小站' })

const tabs = [
  { key: 'diff', label: '时间差', icon: '📏' },
  { key: 'countdown', label: '倒计时', icon: '⏳' },
  { key: 'timezone', label: '时区转换', icon: '🌍' },
  { key: 'timestamp', label: '时间戳', icon: '🔢' },
]
const activeTab = ref('diff')
const copyText = ref('复制结果')

// Time Diff
const diffStart = ref('')
const diffEnd = ref('')

const diffResult = computed(() => {
  if (!diffStart.value || !diffEnd.value) return null
  const a = new Date(diffStart.value)
  const b = new Date(diffEnd.value)
  if (isNaN(a) || isNaN(b)) return null
  const totalSec = Math.abs(Math.floor((b - a) / 1000))
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  return { days, hours, minutes, seconds, totalSeconds: totalSec }
})

function copyDiff() {
  if (!diffResult.value) return
  const d = diffResult.value
  const text = `${d.days}天 ${d.hours}时 ${d.minutes}分 ${d.seconds}秒 (共${d.totalSeconds}秒)`
  navigator.clipboard.writeText(text).then(() => {
    copyText.value = '已复制 ✓'
    setTimeout(() => { copyText.value = '复制结果' }, 1500)
  })
}

// Countdown
const countdownTarget = ref('')
const countdownRunning = ref(false)
const countdownRemaining = ref(0)
const countdownExpired = ref(false)
let countdownTimer = null

const countdownResult = computed(() => {
  if (countdownRemaining.value <= 0 && countdownRunning.value) return null
  const total = countdownRemaining.value
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return { days, hours, minutes, seconds }
})

function toggleCountdown() {
  if (countdownRunning.value) {
    clearInterval(countdownTimer)
    countdownRunning.value = false
    return
  }
  if (!countdownTarget.value) return
  const target = new Date(countdownTarget.value).getTime()
  countdownExpired.value = false
  countdownRunning.value = true
  countdownTimer = setInterval(() => {
    const now = Date.now()
    const diff = Math.max(0, Math.floor((target - now) / 1000))
    countdownRemaining.value = diff
    if (diff <= 0) {
      clearInterval(countdownTimer)
      countdownRunning.value = false
      countdownExpired.value = true
    }
  }, 200)
}

// Timezone
const tzTime = ref('')
const tzSearch = ref('')
const selectedTz = ref('')

const majorTimezones = [
  'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Seoul', 'Asia/Singapore',
  'Asia/Kolkata', 'Asia/Dubai', 'Asia/Bangkok', 'Asia/Hong_Kong',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Sao_Paulo', 'Pacific/Auckland', 'Australia/Sydney', 'Pacific/Honolulu',
  'Africa/Cairo', 'Africa/Lagos', 'UTC',
]

const filteredTimezones = computed(() => {
  if (!tzSearch.value) return majorTimezones.slice(0, 12)
  return majorTimezones.filter(tz => tz.toLowerCase().includes(tzSearch.value.toLowerCase()))
})

function formatTzTime(tz) {
  const base = tzTime.value ? new Date(tzTime.value) : new Date()
  try {
    return base.toLocaleString('zh-CN', { timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch { return '不支持' }
}

function selectTimezone(tz) {
  selectedTz.value = tz
}

function copyTzTime() {
  if (!selectedTz.value) return
  const text = `${selectedTz.value}: ${formatTzTime(selectedTz.value)}`
  navigator.clipboard.writeText(text).then(() => {
    copyText.value = '已复制 ✓'
    setTimeout(() => { copyText.value = '复制结果' }, 1500)
  })
}

// Timestamp
const tsInput = ref('')
const tsUnit = ref('s')
const tsDate = ref('')
const tsResult = ref(null)

function parseTsResult(date) {
  const s = Math.floor(date.getTime() / 1000)
  const ms = date.getTime()
  return {
    s: s.toString(),
    ms: ms.toString(),
    iso: date.toISOString(),
    local: date.toLocaleString('zh-CN'),
    utc: date.toUTCString(),
  }
}

function tsFromTimestamp() {
  if (!tsInput.value) { tsResult.value = null; return }
  let ms = Number(tsInput.value)
  if (isNaN(ms)) { tsResult.value = null; return }
  if (tsUnit.value === 's') ms *= 1000
  tsResult.value = parseTsResult(new Date(ms))
}

function tsFromDate() {
  if (!tsDate.value) { tsResult.value = null; return }
  tsResult.value = parseTsResult(new Date(tsDate.value))
}

function copyTs(e) {
  navigator.clipboard.writeText(e.target.textContent)
}

const currentTs = ref('')
const tsInterval = setInterval(() => {
  currentTs.value = Math.floor(Date.now() / 1000).toString()
}, 1000)
onMounted(() => { currentTs.value = Math.floor(Date.now() / 1000).toString() })

function copyCurrentTs() {
  navigator.clipboard.writeText(currentTs.value)
}

onUnmounted(() => {
  clearInterval(tsInterval)
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<style scoped>
.tool-page {
  padding-top: 0.5rem;
}

h2 {
  font-size: 1.6rem;
  margin-bottom: 1.5rem;
}

h3 {
  font-size: 1.1rem;
  margin-bottom: 0.8rem;
  color: #333;
}

.tab-bar {
  display: flex;
  gap: 0;
  margin-bottom: 1.5rem;
  background: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
}

.tab-bar button {
  flex: 1;
  padding: 0.7rem 0.5rem;
  border: none;
  background: transparent;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}

.tab-bar button.active {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  font-weight: 600;
}

.tab-content {
  margin-bottom: 1rem;
}

.field {
  margin-bottom: 1rem;
}

.field label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.field input {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.field input:focus {
  border-color: #22c55e;
}

.datetime-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.result-box {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 1rem;
}

.diff-values {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.diff-item {
  text-align: center;
}

.diff-num {
  display: block;
  font-size: 2.2rem;
  font-weight: 700;
  color: #22c55e;
  line-height: 1;
}

.diff-label {
  font-size: 0.85rem;
  color: #888;
  margin-top: 0.3rem;
}

.diff-total {
  text-align: center;
  color: #666;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.panel {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 1rem;
}

.panel label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.panel input {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.panel input:focus {
  border-color: #22c55e;
}

.radio-row {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

.ts-detail {
  margin-bottom: 1rem;
}

.ts-row {
  display: flex;
  gap: 0.5rem;
  padding: 0.4rem 0;
  border-bottom: 1px solid #eee;
  font-size: 0.9rem;
}

.ts-row span {
  color: #666;
  white-space: nowrap;
}

.ts-row code {
  font-family: monospace;
  background: #e8f5e9;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.current-ts {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.95rem;
  color: #666;
}

.current-ts code {
  font-family: monospace;
  font-weight: 700;
  color: #22c55e;
  font-size: 1.1rem;
}

.btn-copy-sm {
  margin-left: 0.5rem;
  padding: 0.2rem 0.6rem;
  background: #22c55e;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.btn-start {
  padding: 0.7rem 2rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  transition: transform 0.2s;
}

.btn-start:active {
  transform: scale(0.95);
}

.search-input {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: #22c55e;
}

.tz-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.tz-card {
  background: #f0fdf4;
  border: 2px solid transparent;
  border-radius: 8px;
  padding: 0.7rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tz-card:hover {
  border-color: #22c55e;
  transform: translateY(-1px);
}

.tz-name {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
}

.tz-time {
  display: block;
  font-family: monospace;
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.2rem;
}

.selected-tz {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.2rem;
}

.tz-detail {
  text-align: center;
  margin-bottom: 1rem;
}

.tz-detail strong {
  display: block;
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.tz-time-lg {
  font-family: monospace;
  font-size: 1.8rem;
  font-weight: 700;
  color: #22c55e;
}

.expired-msg {
  text-align: center;
  font-size: 1.3rem;
  color: #22c55e;
  font-weight: 600;
  margin-top: 0.5rem;
}

.btn-copy {
  padding: 0.5rem 1.2rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: transform 0.2s;
}

.btn-copy:active {
  transform: scale(0.95);
}

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #22c55e;
  text-decoration: none;
  font-weight: 600;
}

.back-link:hover {
  text-decoration: underline;
}

@media (max-width: 600px) {
  .datetime-row,
  .panels {
    grid-template-columns: 1fr;
  }
  .tab-bar button {
    font-size: 0.75rem;
    padding: 0.6rem 0.3rem;
  }
  .tz-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
