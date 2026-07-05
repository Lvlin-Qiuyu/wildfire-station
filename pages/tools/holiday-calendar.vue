<template>
  <div class="tool-page">
    <h2>📅 中国节假日日历</h2>
    <p class="subtitle">2025-2027年法定节假日、调休安排，一键查看全年安排</p>

    <!-- 年份切换 -->
    <div class="year-nav">
      <button @click="changeYear(-1)">◀</button>
      <span class="year-label">{{ currentYear }}年</span>
      <button @click="changeYear(1)">▶</button>
    </div>

    <!-- 月份导航 -->
    <div class="month-nav">
      <button @click="changeMonth(-1)">◀ 上月</button>
      <span class="month-label">{{ currentYear }}年{{ currentMonth + 1 }}月</span>
      <button @click="changeMonth(1)">下月 ▶</button>
    </div>

    <!-- 图例 -->
    <div class="legend">
      <span class="legend-item"><span class="dot dot-holiday"></span>假期</span>
      <span class="legend-item"><span class="dot dot-work"></span>补班</span>
      <span class="legend-item"><span class="dot dot-adjust"></span>调休(前后)</span>
    </div>

    <!-- 月历 -->
    <div class="calendar-grid">
      <div v-for="d in weekDays" :key="d" class="weekday-header">{{ d }}</div>
      <div
        v-for="(cell, idx) in calendarCells"
        :key="idx"
        class="calendar-cell"
        :class="{
          'other-month': !cell.currentMonth,
          'today': cell.isToday,
          'is-holiday': cell.type === 'holiday',
          'is-work': cell.type === 'work',
          'is-adjust': cell.type === 'adjust',
          'selected': selectedDate === cell.dateStr,
        }"
        @click="cell.currentMonth && selectDate(cell)"
      >
        <span class="cell-day">{{ cell.day }}</span>
        <span v-if="cell.label" class="cell-label">{{ cell.label }}</span>
      </div>
    </div>

    <!-- 选中日期详情 -->
    <div v-if="selectedInfo" class="detail-box">
      <h3>{{ selectedInfo.dateStr }}</h3>
      <div class="detail-content">
        <div class="detail-row" v-if="selectedInfo.type">
          <span class="detail-key">类型：</span>
          <span class="detail-val" :class="'tag-' + selectedInfo.type">{{ selectedInfo.typeLabel }}</span>
        </div>
        <div v-if="selectedInfo.detail" class="detail-row">
          <span class="detail-key">说明：</span>
          <span class="detail-val">{{ selectedInfo.detail }}</span>
        </div>
        <div v-if="selectedInfo.group" class="detail-row">
          <span class="detail-key">所属假期：</span>
          <span class="detail-val">{{ selectedInfo.group }}</span>
        </div>
        <div v-if="selectedInfo.groupDays" class="detail-row">
          <span class="detail-key">假期天数：</span>
          <span class="detail-val">放 {{ selectedInfo.groupDays.holiday }} 天，调休补班 {{ selectedInfo.groupDays.work }} 天</span>
        </div>
      </div>
    </div>

    <!-- 汇总统计 -->
    <div class="summary-box">
      <h3>📊 {{ currentYear }}年假期汇总</h3>
      <div class="summary-grid">
        <div class="summary-card">
          <span class="summary-num">{{ yearStats.totalHoliday }}</span>
          <span class="summary-label">法定假期（天）</span>
        </div>
        <div class="summary-card">
          <span class="summary-num">{{ yearStats.totalWork }}</span>
          <span class="summary-label">调休补班（天）</span>
        </div>
        <div class="summary-card">
          <span class="summary-num">{{ yearStats.totalNet }}</span>
          <span class="summary-label">净放假（天）</span>
        </div>
        <div class="summary-card">
          <span class="summary-num">{{ yearStats.totalWeekend }}</span>
          <span class="summary-label">全年周末（天）</span>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '中国节假日日历 - 野火小站' })

const weekDays = ['一', '二', '三', '四', '五', '六', '日']

// 当前日期状态
const now = new Date()
const currentYear = ref(now.getFullYear())
const currentMonth = ref(now.getMonth())
const selectedDate = ref(null)

// ==================== 节假日数据 ====================
// type: holiday=放假, work=补班, adjust=调休涉及的周末(周末变工作日的双休)
// holidays数据结构：日期字符串 -> { type, label, detail, group }

function pad(n) { return String(n).padStart(2, '0') }

function buildHolidayData(year) {
  const data = {}

  // ---- 2025 ----
  if (year === 2025) {
    // 元旦：1.1放假，无调休
    data['2025-01-01'] = { type: 'holiday', label: '元旦', detail: '放假1天', group: '元旦' }

    // 春节：1.28-2.4放假(8天)，1.26(周日)、2.8(周六)补班
    ;['2025-01-28','2025-01-29','2025-01-30','2025-01-31','2025-02-01','2025-02-02','2025-02-03','2025-02-04'].forEach(d => {
      data[d] = { type: 'holiday', label: '春节', detail: '放假8天', group: '春节' }
    })
    data['2025-01-26'] = { type: 'work', label: '补班', detail: '春节调休补班', group: '春节' }
    data['2025-02-08'] = { type: 'work', label: '补班', detail: '春节调休补班', group: '春节' }

    // 清明节：4.4-4.6放假(3天)，无调休
    ;['2025-04-04','2025-04-05','2025-04-06'].forEach(d => {
      data[d] = { type: 'holiday', label: '清明', detail: '放假3天', group: '清明节' }
    })

    // 劳动节：5.1-5.5放假(5天)，4.27(周日)补班
    ;['2025-05-01','2025-05-02','2025-05-03','2025-05-04','2025-05-05'].forEach(d => {
      data[d] = { type: 'holiday', label: '劳动节', detail: '放假5天', group: '劳动节' }
    })
    data['2025-04-27'] = { type: 'work', label: '补班', detail: '劳动节调休补班', group: '劳动节' }

    // 端午节：5.31-6.2放假(3天)，无调休
    ;['2025-05-31','2025-06-01','2025-06-02'].forEach(d => {
      data[d] = { type: 'holiday', label: '端午', detail: '放假3天', group: '端午节' }
    })

    // 中秋节 + 国庆节：10.1-10.8放假(8天)，9.28(周日)、10.11(周六)补班
    ;['2025-10-01','2025-10-02','2025-10-03','2025-10-04','2025-10-05','2025-10-06','2025-10-07','2025-10-08'].forEach(d => {
      data[d] = { type: 'holiday', label: d <= '2025-10-03' ? '国庆中秋' : '国庆', detail: '放假8天（中秋+国庆）', group: '中秋国庆节' }
    })
    data['2025-09-28'] = { type: 'work', label: '补班', detail: '国庆调休补班', group: '中秋国庆节' }
    data['2025-10-11'] = { type: 'work', label: '补班', detail: '国庆调休补班', group: '中秋国庆节' }
  }

  // ---- 2026 ----
  if (year === 2026) {
    // 元旦：1.1-1.3放假(3天)，1.4(周日)补班（预估）
    ;['2026-01-01','2026-01-02','2026-01-03'].forEach(d => {
      data[d] = { type: 'holiday', label: '元旦', detail: '放假3天', group: '元旦' }
    })

    // 春节：2.17-2.23放假(7天，含周六日)，2.14(周六)、2.15(周日)补班（预估）
    ;['2026-02-17','2026-02-18','2026-02-19','2026-02-20','2026-02-21','2026-02-22','2026-02-23'].forEach(d => {
      data[d] = { type: 'holiday', label: '春节', detail: '放假7天', group: '春节' }
    })
    data['2026-02-14'] = { type: 'work', label: '补班', detail: '春节调休补班', group: '春节' }
    data['2026-02-15'] = { type: 'work', label: '补班', detail: '春节调休补班', group: '春节' }

    // 清明节：4.4-4.6放假(3天)（预估）
    ;['2026-04-04','2026-04-05','2026-04-06'].forEach(d => {
      data[d] = { type: 'holiday', label: '清明', detail: '放假3天', group: '清明节' }
    })

    // 劳动节：5.1-5.5放假(5天)，4.26(周日)补班（预估）
    ;['2026-05-01','2026-05-02','2026-05-03','2026-05-04','2026-05-05'].forEach(d => {
      data[d] = { type: 'holiday', label: '劳动节', detail: '放假5天', group: '劳动节' }
    })
    data['2026-04-26'] = { type: 'work', label: '补班', detail: '劳动节调休补班', group: '劳动节' }

    // 端午节：6.19-6.21放假(3天)（预估）
    ;['2026-06-19','2026-06-20','2026-06-21'].forEach(d => {
      data[d] = { type: 'holiday', label: '端午', detail: '放假3天', group: '端午节' }
    })

    // 中秋节 + 国庆节：10.1-10.8放假(8天)，9.27(周日)、10.10(周六)补班（预估）
    ;['2026-10-01','2026-10-02','2026-10-03','2026-10-04','2026-10-05','2026-10-06','2026-10-07','2026-10-08'].forEach(d => {
      data[d] = { type: 'holiday', label: d <= '2026-10-04' ? '中秋国庆' : '国庆', detail: '放假8天（中秋+国庆）', group: '中秋国庆节' }
    })
    data['2026-09-27'] = { type: 'work', label: '补班', detail: '国庆调休补班', group: '中秋国庆节' }
    data['2026-10-10'] = { type: 'work', label: '补班', detail: '国庆调休补班', group: '中秋国庆节' }
  }

  // ---- 2027 ----
  if (year === 2027) {
    // 元旦：1.1-1.3放假(3天)（预估）
    ;['2027-01-01','2027-01-02','2027-01-03'].forEach(d => {
      data[d] = { type: 'holiday', label: '元旦', detail: '放假3天', group: '元旦' }
    })

    // 春节：2.6-2.12放假(7天)，1.31(周日)、2.13(周六)补班（预估）
    ;['2027-02-06','2027-02-07','2027-02-08','2027-02-09','2027-02-10','2027-02-11','2027-02-12'].forEach(d => {
      data[d] = { type: 'holiday', label: '春节', detail: '放假7天', group: '春节' }
    })
    data['2027-01-31'] = { type: 'work', label: '补班', detail: '春节调休补班', group: '春节' }
    data['2027-02-13'] = { type: 'work', label: '补班', detail: '春节调休补班', group: '春节' }

    // 清明节：4.3-4.5放假(3天)（预估）
    ;['2027-04-03','2027-04-04','2027-04-05'].forEach(d => {
      data[d] = { type: 'holiday', label: '清明', detail: '放假3天', group: '清明节' }
    })

    // 劳动节：5.1-5.5放假(5天)，4.25(周日)补班（预估）
    ;['2027-05-01','2027-05-02','2027-05-03','2027-05-04','2027-05-05'].forEach(d => {
      data[d] = { type: 'holiday', label: '劳动节', detail: '放假5天', group: '劳动节' }
    })
    data['2027-04-25'] = { type: 'work', label: '补班', detail: '劳动节调休补班', group: '劳动节' }

    // 端午节：6.9-6.11放假(3天)（预估）
    ;['2027-06-09','2027-06-10','2027-06-11'].forEach(d => {
      data[d] = { type: 'holiday', label: '端午', detail: '放假3天', group: '端午节' }
    })

    // 中秋节 + 国庆节：10.1-10.8放假(8天)，9.26(周日)、10.9(周六)补班（预估）
    ;['2027-10-01','2027-10-02','2027-10-03','2027-10-04','2027-10-05','2027-10-06','2027-10-07','2027-10-08'].forEach(d => {
      data[d] = { type: 'holiday', label: d <= '2027-10-03' ? '中秋国庆' : '国庆', detail: '放假8天（中秋+国庆）', group: '中秋国庆节' }
    })
    data['2027-09-26'] = { type: 'work', label: '补班', detail: '国庆调休补班', group: '中秋国庆节' }
    data['2027-10-09'] = { type: 'work', label: '补班', detail: '国庆调休补班', group: '中秋国庆节' }
  }

  return data
}

// ==================== 日历生成 ====================
const holidayData = computed(() => buildHolidayData(currentYear.value))

const calendarCells = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  // 该月第一天是周几（周一=0）
  const firstDay = new Date(year, month, 1)
  let startWeekday = firstDay.getDay() - 1
  if (startWeekday < 0) startWeekday = 6
  // 该月天数
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // 上月天数
  const prevMonthDays = new Date(year, month, 0).getDate()

  const cells = []

  // 上月补齐
  for (let i = startWeekday - 1; i >= 0; i--) {
    const d = prevMonthDays - i
    const m = month - 1
    const y = m < 0 ? year - 1 : year
    const actualM = m < 0 ? 11 : m
    const dateStr = `${y}-${pad(actualM + 1)}-${pad(d)}`
    const info = holidayData.value[dateStr]
    const dayOfWeek = new Date(y, actualM, d).getDay()
    cells.push({
      day: d, currentMonth: false, dateStr,
      type: info ? info.type : null,
      label: info ? info.label : (dayOfWeek === 0 || dayOfWeek === 6 ? '休' : ''),
      isToday: false,
      info,
    })
  }

  // 本月
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`
    const info = holidayData.value[dateStr]
    const dayOfWeek = new Date(year, month, d).getDay()
    const today = new Date()
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d
    cells.push({
      day: d, currentMonth: true, dateStr,
      type: info ? info.type : null,
      label: info ? info.label : (dayOfWeek === 0 || dayOfWeek === 6 ? '休' : ''),
      isToday,
      info,
    })
  }

  // 下月补齐到42格
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    const m = month + 1
    const y = m > 11 ? year + 1 : year
    const actualM = m > 11 ? 0 : m
    const dateStr = `${y}-${pad(actualM + 1)}-${pad(d)}`
    const info = holidayData.value[dateStr]
    const dayOfWeek = new Date(y, actualM, d).getDay()
    cells.push({
      day: d, currentMonth: false, dateStr,
      type: info ? info.type : null,
      label: info ? info.label : (dayOfWeek === 0 || dayOfWeek === 6 ? '休' : ''),
      isToday: false,
      info,
    })
  }

  return cells
})

// ==================== 选中日期信息 ====================
const selectedInfo = computed(() => {
  if (!selectedDate.value) return null
  const info = holidayData.value[selectedDate.value]
  if (!info) {
    const d = new Date(selectedDate.value)
    const dayOfWeek = d.getDay()
    return {
      dateStr: selectedDate.value,
      type: null,
      typeLabel: dayOfWeek === 0 || dayOfWeek === 6 ? '周末' : '工作日',
      detail: dayOfWeek === 0 || dayOfWeek === 6 ? '正常休息日' : '正常工作日',
      group: null,
      groupDays: null,
    }
  }
  // 查找该组的假期天数和补班天数
  const group = info.group
  const allDates = Object.entries(holidayData.value).filter(([, v]) => v.group === group)
  const holidayCount = allDates.filter(([, v]) => v.type === 'holiday').length
  const workCount = allDates.filter(([, v]) => v.type === 'work').length

  return {
    dateStr: selectedDate.value,
    type: info.type,
    typeLabel: info.type === 'holiday' ? '🟢 法定假期' : '🔴 调休补班',
    detail: info.detail,
    group,
    groupDays: { holiday: holidayCount, work: workCount },
  }
})

function selectDate(cell) {
  selectedDate.value = cell.dateStr
}

// ==================== 年月导航 ====================
function changeYear(delta) {
  const newY = currentYear.value + delta
  if (newY >= 2025 && newY <= 2027) {
    currentYear.value = newY
    selectedDate.value = null
  }
}

function changeMonth(delta) {
  let m = currentMonth.value + delta
  let y = currentYear.value
  if (m < 0) { m = 11; y-- }
  if (m > 11) { m = 0; y++ }
  if (y >= 2025 && y <= 2027) {
    currentYear.value = y
    currentMonth.value = m
    selectedDate.value = null
  }
}

// ==================== 汇总统计 ====================
const yearStats = computed(() => {
  const data = holidayData.value
  const entries = Object.entries(data)
  const totalHoliday = entries.filter(([, v]) => v.type === 'holiday').length
  const totalWork = entries.filter(([, v]) => v.type === 'work').length

  // 计算全年周末天数
  let totalWeekend = 0
  for (let m = 0; m < 12; m++) {
    const daysInMonth = new Date(currentYear.value, m + 1, 0).getDate()
    for (let d = 1; d <= daysInMonth; d++) {
      const day = new Date(currentYear.value, m, d).getDay()
      if (day === 0 || day === 6) totalWeekend++
    }
  }

  return {
    totalHoliday,
    totalWork,
    totalNet: totalHoliday - totalWork,
    totalWeekend,
  }
})
</script>

<style scoped>
.tool-page { padding-top: 0.5rem; }
h2 { font-size: 1.6rem; margin-bottom: 0.3rem; }
.subtitle { color: #888; font-size: 0.95rem; margin-bottom: 1.5rem; }
h3 { font-size: 1.1rem; margin-bottom: 0.8rem; color: #333; }

.year-nav {
  display: flex; align-items: center; justify-content: center; gap: 1.5rem;
  margin-bottom: 1rem;
}
.year-nav button {
  width: 40px; height: 40px; border: 2px solid #e0e0e0; border-radius: 8px;
  background: white; font-size: 1rem; cursor: pointer; transition: all 0.2s;
}
.year-nav button:hover { border-color: #22c55e; color: #22c55e; }
.year-label { font-size: 1.4rem; font-weight: 700; color: #333; }

.month-nav {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 1rem; padding: 0.6rem 1rem;
  background: #f8f9fa; border-radius: 10px;
}
.month-nav button {
  padding: 0.4rem 0.8rem; border: none; border-radius: 6px;
  background: white; font-size: 0.9rem; cursor: pointer; transition: all 0.2s;
  color: #555;
}
.month-nav button:hover { background: #22c55e; color: white; }
.month-label { font-weight: 600; font-size: 1rem; }

.legend {
  display: flex; gap: 1.2rem; justify-content: center; margin-bottom: 1rem;
}
.legend-item {
  display: flex; align-items: center; gap: 0.3rem; font-size: 0.85rem; color: #666;
}
.dot {
  display: inline-block; width: 12px; height: 12px; border-radius: 50%;
}
.dot-holiday { background: #22c55e; }
.dot-work { background: #ef4444; }
.dot-adjust { background: #f59e0b; }

.calendar-grid {
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;
  background: #e0e0e0; border-radius: 10px; overflow: hidden; margin-bottom: 1.5rem;
}
.weekday-header {
  background: #f1f5f9; text-align: center; padding: 0.6rem 0;
  font-size: 0.85rem; font-weight: 600; color: #555;
}
.calendar-cell {
  background: white; text-align: center; padding: 0.6rem 0.2rem;
  min-height: 56px; display: flex; flex-direction: column; align-items: center;
  justify-content: center; cursor: pointer; transition: all 0.15s;
}
.calendar-cell:hover { background: #f0fdf4; }
.calendar-cell.other-month { background: #fafafa; opacity: 0.4; }
.calendar-cell.other-month:hover { opacity: 0.6; }
.cell-day { font-size: 1rem; font-weight: 600; line-height: 1.2; }
.cell-label { font-size: 0.65rem; color: #888; margin-top: 1px; }
.calendar-cell.is-holiday { background: #f0fdf4; }
.calendar-cell.is-holiday .cell-day { color: #16a34a; }
.calendar-cell.is-holiday .cell-label { color: #16a34a; font-weight: 600; }
.calendar-cell.is-work { background: #fef2f2; }
.calendar-cell.is-work .cell-day { color: #dc2626; }
.calendar-cell.is-work .cell-label { color: #dc2626; font-weight: 600; }
.calendar-cell.today { border: 2px solid #22c55e; }
.calendar-cell.selected { box-shadow: inset 0 0 0 2px #3b82f6; }

.detail-box {
  background: #f8f9fa; border-radius: 12px; padding: 1.2rem; margin-bottom: 1.5rem;
}
.detail-content { margin-top: 0.5rem; }
.detail-row {
  display: flex; gap: 0.5rem; padding: 0.4rem 0; border-bottom: 1px solid #eee;
  font-size: 0.9rem;
}
.detail-key { color: #666; white-space: nowrap; font-weight: 600; }
.detail-val { color: #333; }
.tag-holiday { color: #16a34a; font-weight: 600; }
.tag-work { color: #dc2626; font-weight: 600; }

.summary-box {
  background: #f8f9fa; border-radius: 12px; padding: 1.2rem; margin-bottom: 1.5rem;
}
.summary-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.8rem; margin-top: 0.8rem;
}
.summary-card {
  text-align: center; background: white; border-radius: 10px; padding: 1rem;
}
.summary-num {
  display: block; font-size: 1.8rem; font-weight: 700;
  color: #22c55e; line-height: 1.2;
}
.summary-label {
  font-size: 0.75rem; color: #888; margin-top: 0.2rem;
}

.back-link {
  display: inline-block; margin-top: 2rem; color: #22c55e;
  text-decoration: none; font-weight: 600;
}
.back-link:hover { text-decoration: underline; }

@media (max-width: 600px) {
  .calendar-cell { min-height: 44px; padding: 0.4rem 0.1rem; }
  .cell-day { font-size: 0.85rem; }
  .cell-label { font-size: 0.55rem; }
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
