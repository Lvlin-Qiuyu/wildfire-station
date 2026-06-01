<template>
  <div class="tool-page">
    <h2>⏰ Cron 表达式可视化</h2>

    <div class="cron-input-row">
      <input
        v-model="cronInput"
        placeholder="输入 Cron 表达式，如 */5 * * * *"
        class="cron-input"
        @input="parseCron"
      />
    </div>

    <div class="presets">
      <button
        v-for="p in presets"
        :key="p.expr"
        class="preset-btn"
        @click="cronInput = p.expr; parseCron()"
      >{{ p.label }}</button>
    </div>

    <div v-if="error" class="error-msg">{{ error }}</div>

    <div v-if="parsed && !error" class="result-area">
      <div class="description-box">
        <h3>📖 人类可读描述</h3>
        <p class="description">{{ description }}</p>
      </div>

      <div class="fields-grid">
        <div v-for="f in fieldDetails" :key="f.name" class="field-card">
          <span class="field-name">{{ f.label }}</span>
          <span class="field-value">{{ f.value }}</span>
          <span class="field-desc">{{ f.desc }}</span>
        </div>
      </div>

      <div class="next-runs">
        <h3>🕐 接下来 5 次执行时间</h3>
        <div class="runs-list">
          <div v-for="(run, i) in nextRuns" :key="i" class="run-item">
            <span class="run-index">#{{ i + 1 }}</span>
            <code>{{ run }}</code>
          </div>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'Cron 表达式可视化 - 野火小站' })

const cronInput = ref('*/5 * * * *')
const error = ref('')
const parsed = ref(null)
const description = ref('')
const nextRuns = ref([])

const presets = [
  { label: '每分钟', expr: '* * * * *' },
  { label: '每5分钟', expr: '*/5 * * * *' },
  { label: '每小时', expr: '0 * * * *' },
  { label: '每天零点', expr: '0 0 * * *' },
  { label: '工作日9点', expr: '0 9 * * 1-5' },
  { label: '每月1号', expr: '0 0 1 * *' },
]

const fieldLabels = {
  minute: '分钟',
  hour: '小时',
  day: '日期',
  month: '月份',
  weekday: '星期',
}

const weekdays = ['日', '一', '二', '三', '四', '五', '六']
const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

const fieldDetails = computed(() => {
  if (!parsed.value) return []
  return ['minute', 'hour', 'day', 'month', 'weekday'].map(name => ({
    name,
    label: fieldLabels[name],
    value: parsed.value[name].raw,
    desc: describeField(name, parsed.value[name]),
  }))
})

function describeField(name, field) {
  if (field.type === 'any') return '每一个'
  if (field.type === 'step') {
    const base = name === 'weekday' ? weekdays[field.stepBase] : field.stepBase
    return `从 ${base} 开始，每隔 ${field.step} ${name === 'weekday' ? '天' : '单位'}`
  }
  if (field.type === 'range') {
    const from = name === 'weekday' ? weekdays[field.rangeStart] : field.rangeStart
    const to = name === 'weekday' ? weekdays[field.rangeEnd] : field.rangeEnd
    return `${from} 到 ${to}`
  }
  if (field.type === 'list') {
    return field.values.map(v => name === 'weekday' ? weekdays[v] : v).join('、')
  }
  return field.raw
}

function buildDescription() {
  if (!parsed.value || error.value) return

  const p = parsed.value
  const parts = []

  // Minute
  if (p.minute.type === 'any') parts.push('每分钟')
  else if (p.minute.type === 'step') parts.push(`每 ${p.minute.step} 分钟`)
  else parts.push(`第 ${describeField('minute', p.minute)} 分钟`)

  // Hour
  if (p.hour.type !== 'any' && p.hour.type !== 'step') {
    parts.push(describeField('hour', p.hour) + '点')
  } else if (p.hour.type === 'step') {
    parts.push(`每 ${p.hour.step} 小时`)
  }

  // Day
  if (p.day.type !== 'any' && p.day.type !== 'step') {
    parts.push(describeField('day', p.day) + '日')
  }

  // Month
  if (p.month.type !== 'any' && p.month.type !== 'step') {
    parts.push(describeField('month', p.month))
  }

  // Weekday
  if (p.weekday.type !== 'any') {
    parts.push('星期' + describeField('weekday', p.weekday))
  }

  description.value = parts.join('，')
}

function parseField(value, min, max, name) {
  if (value === '*') return { raw: '*', type: 'any' }

  // Step: */N or A/N
  const stepMatch = value.match(/^(\*|\d+|[\w-]+)\/(\d+)$/)
  if (stepMatch) {
    const base = stepMatch[1] === '*' ? min : parseInt(stepMatch[1])
    return {
      raw: value,
      type: 'step',
      stepBase: base,
      step: parseInt(stepMatch[2]),
    }
  }

  // Range: A-B
  const rangeMatch = value.match(/^(\d+)-(\d+)$/)
  if (rangeMatch) {
    return {
      raw: value,
      type: 'range',
      rangeStart: parseInt(rangeMatch[1]),
      rangeEnd: parseInt(rangeMatch[2]),
    }
  }

  // List: A,B,C or mixed A-B/C
  if (value.includes(',')) {
    const values = []
    for (const part of value.split(',')) {
      if (part.includes('-')) {
        const [a, b] = part.split('-').map(Number)
        for (let i = a; i <= b; i++) values.push(i)
      } else {
        values.push(parseInt(part))
      }
    }
    return { raw: value, type: 'list', values }
  }

  // Single value
  const num = parseInt(value)
  if (!isNaN(num) && num >= min && num <= max) {
    return { raw: value, type: 'single', values: [num] }
  }

  return null
}

function getNextRuns(p, count = 5) {
  const runs = []
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + 1, 0, 0)

  for (let i = 0; i < count * 10000 && runs.length < count; i++) {
    const d = new Date(start.getTime() + i * 60 * 1000)

    // Check month
    const month = d.getMonth() + 1
    if (!matchField(p.month, month)) continue

    // Check day
    const day = d.getDate()
    if (!matchField(p.day, day)) continue

    // Check weekday
    const weekday = d.getDay()
    if (!matchField(p.weekday, weekday)) continue

    // Check hour
    if (!matchField(p.hour, d.getHours())) continue

    // Check minute
    if (!matchField(p.minute, d.getMinutes())) continue

    runs.push(formatDate(d))
  }

  return runs
}

function matchField(field, value) {
  if (field.type === 'any') return true
  if (field.type === 'single') return field.values.includes(value)
  if (field.type === 'list') return field.values.includes(value)
  if (field.type === 'range') return value >= field.rangeStart && value <= field.rangeEnd
  if (field.type === 'step') {
    return (value - field.stepBase) % field.step === 0 && value >= field.stepBase
  }
  return true
}

function formatDate(d) {
  const pad = n => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function parseCron() {
  error.value = ''
  parsed.value = null
  nextRuns.value = []

  const input = cronInput.value.trim()
  if (!input) return

  const parts = input.split(/\s+/)
  if (parts.length !== 5) {
    error.value = 'Cron 表达式应为 5 个字段，用空格分隔（分 时 日 月 星期）'
    return
  }

  const fields = {
    minute: parseField(parts[0], 0, 59, 'minute'),
    hour: parseField(parts[1], 0, 23, 'hour'),
    day: parseField(parts[2], 1, 31, 'day'),
    month: parseField(parts[3], 1, 12, 'month'),
    weekday: parseField(parts[4], 0, 6, 'weekday'),
  }

  for (const [name, field] of Object.entries(fields)) {
    if (!field) {
      error.value = `"${parts[['minute', 'hour', 'day', 'month', 'weekday'].indexOf(name)]}" 不是有效的 ${fieldLabels[name]} 值`
      return
    }
  }

  parsed.value = fields
  buildDescription()

  try {
    nextRuns.value = getNextRuns(fields, 5)
  } catch (e) {
    // ignore calc errors
  }
}

// Init
parseCron()
</script>

<style scoped>
.tool-page {
  padding-top: 0.5rem;
}

h2 {
  font-size: 1.6rem;
  margin-bottom: 1.5rem;
}

.cron-input-row {
  margin-bottom: 1rem;
}

.cron-input {
  width: 100%;
  padding: 0.9rem 1rem;
  border: 2px solid #ddd;
  border-radius: 10px;
  font-size: 1.1rem;
  font-family: 'Courier New', monospace;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.cron-input:focus {
  outline: none;
  border-color: #10b981;
}

.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.preset-btn {
  padding: 0.4rem 0.9rem;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #555;
  transition: all 0.2s;
}

.preset-btn:hover {
  background: #fff3ed;
  border-color: #10b981;
  color: #22c55e;
}

.error-msg {
  background: #fee;
  color: #e74c3c;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.result-area {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.description-box {
  background: #fff9f5;
  border: 1px solid #ffe0cc;
  border-radius: 10px;
  padding: 1.2rem;
}

.description-box h3 {
  font-size: 1rem;
  margin-bottom: 0.5rem;
  color: #22c55e;
}

.description {
  font-size: 1.05rem;
  color: #2c3e50;
  line-height: 1.6;
}

.fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.8rem;
}

.field-card {
  background: white;
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 0.8rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.field-name {
  font-size: 0.8rem;
  color: #999;
  font-weight: 600;
  text-transform: uppercase;
}

.field-value {
  font-family: 'Courier New', monospace;
  font-size: 1.1rem;
  color: #2c3e50;
  font-weight: 600;
}

.field-desc {
  font-size: 0.85rem;
  color: #666;
}

.next-runs {
  background: white;
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 1.2rem;
}

.next-runs h3 {
  font-size: 1rem;
  margin-bottom: 0.8rem;
  color: #555;
}

.runs-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.run-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.5rem 0.8rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.run-index {
  font-size: 0.8rem;
  color: #22c55e;
  font-weight: 700;
  min-width: 24px;
}

.run-item code {
  font-family: 'Courier New', monospace;
  font-size: 0.95rem;
  color: #2c3e50;
}

.back-link {
  display: inline-block;
  margin-top: 2.5rem;
  color: #22c55e;
  font-weight: 500;
}

.back-link:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .fields-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
