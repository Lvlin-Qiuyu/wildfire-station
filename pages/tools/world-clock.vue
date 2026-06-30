<template>
  <div class="tool-page">
    <h2>🌍 世界时钟与时区对比器</h2>
    <p class="subtitle">选择多个城市，同时查看各地时间，24小时时间轴可视化，自动标注工作时间重叠区域</p>

    <!-- 城市选择区域 -->
    <div class="city-section">
      <h3>已选城市 ({{ selectedCities.length }}/8)</h3>
      <div class="selected-cities">
        <div
          v-for="city in selectedCities"
          :key="city.tz"
          class="city-tag selected"
        >
          <span class="city-dot" :style="{ background: city.color }"></span>
          {{ city.name }}
          <button class="btn-remove" @click="removeCity(city)">✕</button>
        </div>
        <button v-if="selectedCities.length < 8" class="btn-add" @click="showPicker = true">+ 添加城市</button>
      </div>

      <!-- 城市选择弹窗 -->
      <div v-if="showPicker" class="picker-overlay" @click.self="showPicker = false">
        <div class="picker-panel">
          <h3>选择城市</h3>
          <input
            v-model="searchQuery"
            placeholder="搜索城市名..."
            class="picker-search"
          />
          <div class="picker-list">
            <div
              v-for="continent in filteredContinents"
              :key="continent.name"
              class="continent-group"
            >
              <div class="continent-name">{{ continent.name }}</div>
              <button
                v-for="city in continent.cities"
                :key="city.tz"
                :class="['picker-city', { disabled: isCitySelected(city.tz) }]"
                :disabled="isCitySelected(city.tz)"
                @click="addCity(city)"
              >
                {{ city.name }}
                <span class="picker-tz">{{ city.tzLabel }}</span>
                <span v-if="isCitySelected(city.tz)" class="picker-added">已添加</span>
              </button>
            </div>
          </div>
          <button class="picker-close" @click="showPicker = false">关闭</button>
        </div>
      </div>
    </div>

    <!-- 时间卡片区域 -->
    <div v-if="selectedCities.length" class="clocks-grid">
      <div
        v-for="city in selectedCities"
        :key="city.tz"
        class="clock-card"
      >
        <div class="clock-header">
          <span class="clock-dot" :style="{ background: city.color }"></span>
          <span class="clock-city">{{ city.name }}</span>
        </div>
        <div class="clock-time">{{ getCityTime(city.tz) }}</div>
        <div class="clock-date">{{ getCityDate(city.tz) }}</div>
        <div class="clock-offset">{{ getCityOffset(city.tz) }}</div>
      </div>
    </div>

    <!-- 24小时时间轴 -->
    <div v-if="selectedCities.length" class="timeline-section">
      <h3>24 小时时间轴</h3>
      <div class="timeline-container">
        <!-- 工作时间背景高亮 -->
        <div class="timeline-row bg-row">
          <div class="timeline-label">工作时间</div>
          <div class="timeline-bar">
            <div
              v-for="city in selectedCities"
              :key="'bg-' + city.tz"
              class="timeline-work-highlight"
              :style="{
                left: getWorkStart(city.tz) + '%',
                width: (getWorkEnd(city.tz) - getWorkStart(city.tz)) + '%',
                background: city.color + '30'
              }"
            ></div>
            <!-- 工作时间重叠区域 -->
            <div
              v-if="overlapRange"
              class="timeline-overlap"
              :style="{
                left: overlapRange.start + '%',
                width: (overlapRange.end - overlapRange.start) + '%'
              }"
              :title="'所有城市工作时间重叠: ' + overlapRange.label"
            >
              <span class="overlap-label" v-if="overlapRange.end - overlapRange.start > 3">
                🟢 共同工作时间
              </span>
            </div>
          </div>
        </div>

        <!-- 每个城市的时间指示线 -->
        <div v-for="city in selectedCities" :key="'tl-' + city.tz" class="timeline-row">
          <div class="timeline-label">
            <span class="tl-dot" :style="{ background: city.color }"></span>
            <span class="tl-name">{{ city.shortName }}</span>
          </div>
          <div class="timeline-bar">
            <!-- 当前时间指示器 -->
            <div
              class="timeline-marker"
              :style="{ left: getTimelinePosition(city.tz) + '%' }"
            >
              <div class="marker-line" :style="{ background: city.color }"></div>
              <div class="marker-dot" :style="{ background: city.color }"></div>
              <div class="marker-time" :style="{ color: city.color }">
                {{ getCityTimeShort(city.tz) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 时间刻度 -->
        <div class="timeline-row ticks-row">
          <div class="timeline-label"></div>
          <div class="timeline-bar">
            <span
              v-for="h in 24"
              :key="'tick-' + h"
              class="timeline-tick"
              :style="{ left: ((h - 1) / 24 * 100) + '%' }"
            >{{ String(h - 1).padStart(2, '0') }}</span>
          </div>
        </div>
      </div>

      <!-- 最佳会议时间提示 -->
      <div v-if="overlapRange" class="meeting-hint">
        🟢 <strong>最佳会议时间：</strong>当北京时间为 <strong>{{ overlapRange.beijingTime }}</strong> 时，所有已选城市都在工作时间内（9:00-18:00）
      </div>
      <div v-else-if="selectedCities.length >= 2" class="meeting-hint no-overlap">
        🔴 <strong>无共同工作时间：</strong>已选城市的工作时间（9:00-18:00）没有重叠，建议使用弹性时间安排会议
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '世界时钟与时区对比器 - 野火小站' })

// 每秒更新
const now = ref(new Date())
let timer = null
onMounted(() => {
  timer = setInterval(() => { now.value = new Date() }, 1000)
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
})

// 城市选择器状态
const showPicker = ref(false)
const searchQuery = ref('')

// 城市颜色池
const colorPool = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']

// 按洲分组的预设城市
const continentGroups = [
  {
    name: '🌏 亚洲',
    cities: [
      { name: '北京', shortName: '北京', tz: 'Asia/Shanghai', tzLabel: 'UTC+8' },
      { name: '上海', shortName: '上海', tz: 'Asia/Shanghai', tzLabel: 'UTC+8' },
      { name: '香港', shortName: '香港', tz: 'Asia/Hong_Kong', tzLabel: 'UTC+8' },
      { name: '台北', shortName: '台北', tz: 'Asia/Taipei', tzLabel: 'UTC+8' },
      { name: '东京', shortName: '东京', tz: 'Asia/Tokyo', tzLabel: 'UTC+9' },
      { name: '首尔', shortName: '首尔', tz: 'Asia/Seoul', tzLabel: 'UTC+9' },
      { name: '新加坡', shortName: '新加坡', tz: 'Asia/Singapore', tzLabel: 'UTC+8' },
      { name: '曼谷', shortName: '曼谷', tz: 'Asia/Bangkok', tzLabel: 'UTC+7' },
      { name: '迪拜', shortName: '迪拜', tz: 'Asia/Dubai', tzLabel: 'UTC+4' },
      { name: '孟买', shortName: '孟买', tz: 'Asia/Kolkata', tzLabel: 'UTC+5:30' },
      { name: '雅加达', shortName: '雅加达', tz: 'Asia/Jakarta', tzLabel: 'UTC+7' },
    ]
  },
  {
    name: '🌍 欧洲',
    cities: [
      { name: '伦敦', shortName: '伦敦', tz: 'Europe/London', tzLabel: 'UTC+0' },
      { name: '巴黎', shortName: '巴黎', tz: 'Europe/Paris', tzLabel: 'UTC+1' },
      { name: '柏林', shortName: '柏林', tz: 'Europe/Berlin', tzLabel: 'UTC+1' },
      { name: '罗马', shortName: '罗马', tz: 'Europe/Rome', tzLabel: 'UTC+1' },
      { name: '马德里', shortName: '马德里', tz: 'Europe/Madrid', tzLabel: 'UTC+1' },
      { name: '阿姆斯特丹', shortName: '阿姆斯特丹', tz: 'Europe/Amsterdam', tzLabel: 'UTC+1' },
      { name: '莫斯科', shortName: '莫斯科', tz: 'Europe/Moscow', tzLabel: 'UTC+3' },
      { name: '伊斯坦布尔', shortName: '伊斯坦布尔', tz: 'Europe/Istanbul', tzLabel: 'UTC+3' },
    ]
  },
  {
    name: '🌎 美洲',
    cities: [
      { name: '纽约', shortName: '纽约', tz: 'America/New_York', tzLabel: 'UTC-5' },
      { name: '华盛顿', shortName: '华盛顿', tz: 'America/New_York', tzLabel: 'UTC-5' },
      { name: '芝加哥', shortName: '芝加哥', tz: 'America/Chicago', tzLabel: 'UTC-6' },
      { name: '丹佛', shortName: '丹佛', tz: 'America/Denver', tzLabel: 'UTC-7' },
      { name: '洛杉矶', shortName: '洛杉矶', tz: 'America/Los_Angeles', tzLabel: 'UTC-8' },
      { name: '旧金山', shortName: '旧金山', tz: 'America/Los_Angeles', tzLabel: 'UTC-8' },
      { name: '多伦多', shortName: '多伦多', tz: 'America/Toronto', tzLabel: 'UTC-5' },
      { name: '温哥华', shortName: '温哥华', tz: 'America/Vancouver', tzLabel: 'UTC-8' },
      { name: '圣保罗', shortName: '圣保罗', tz: 'America/Sao_Paulo', tzLabel: 'UTC-3' },
    ]
  },
  {
    name: '🌏 大洋洲',
    cities: [
      { name: '悉尼', shortName: '悉尼', tz: 'Australia/Sydney', tzLabel: 'UTC+10' },
      { name: '墨尔本', shortName: '墨尔本', tz: 'Australia/Melbourne', tzLabel: 'UTC+10' },
      { name: '奥克兰', shortName: '奥克兰', tz: 'Pacific/Auckland', tzLabel: 'UTC+12' },
    ]
  },
  {
    name: '🌍 非洲',
    cities: [
      { name: '开罗', shortName: '开罗', tz: 'Africa/Cairo', tzLabel: 'UTC+2' },
      { name: '约翰内斯堡', shortName: '约翰内斯堡', tz: 'Africa/Johannesburg', tzLabel: 'UTC+2' },
      { name: '拉各斯', shortName: '拉各斯', tz: 'Africa/Lagos', tzLabel: 'UTC+1' },
    ]
  }
]

// 已选城市（带颜色）
const selectedCities = ref([])

// 默认添加几个城市
onMounted(() => {
  addCityByName('北京')
  addCityByName('东京')
  addCityByName('伦敦')
  addCityByName('纽约')
})

// 根据城市名添加
function addCityByName(name) {
  for (const group of continentGroups) {
    const city = group.cities.find(c => c.name === name)
    if (city && selectedCities.value.length < 8 && !isCitySelected(city.tz)) {
      selectedCities.value.push({
        ...city,
        color: colorPool[selectedCities.value.length % colorPool.length]
      })
      return
    }
  }
}

// 判断城市是否已添加
function isCitySelected(tz) {
  return selectedCities.value.some(c => c.tz === tz)
}

// 添加城市
function addCity(city) {
  if (selectedCities.value.length >= 8 || isCitySelected(city.tz)) return
  selectedCities.value.push({
    ...city,
    color: colorPool[selectedCities.value.length % colorPool.length]
  })
}

// 删除城市
function removeCity(city) {
  selectedCities.value = selectedCities.value.filter(c => c.tz !== city.tz)
  // 重新分配颜色
  selectedCities.value.forEach((c, i) => {
    c.color = colorPool[i % colorPool.length]
  })
}

// 搜索过滤
const filteredContinents = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return continentGroups
  return continentGroups.map(group => ({
    ...group,
    cities: group.cities.filter(c =>
      c.name.toLowerCase().includes(q) || c.tzLabel.toLowerCase().includes(q)
    )
  })).filter(group => group.cities.length > 0)
})

// 获取城市当前时间
function getCityTime(tz) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(now.value)
}

// 获取城市当前时间（短格式）
function getCityTimeShort(tz) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(now.value)
}

// 获取城市当前日期
function getCityDate(tz) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short'
  }).format(now.value)
}

// 获取城市与本地时差
function getCityOffset(tz) {
  const localOffset = -now.value.getTimezoneOffset()
  const cityFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    timeZoneName: 'shortOffset'
  })
  const parts = cityFormatter.formatToParts(now.value)
  const tzPart = parts.find(p => p.type === 'timeZoneName')
  return tzPart ? tzPart.value : ''
}

// 获取城市当前小时（0-24小数）
function getCityHourDecimal(tz) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  })
  const parts = formatter.formatToParts(now.value)
  const h = parseInt(parts.find(p => p.type === 'hour').value)
  const m = parseInt(parts.find(p => p.type === 'minute').value)
  const s = parseInt(parts.find(p => p.type === 'second').value)
  return h + m / 60 + s / 3600
}

// 时间轴位置（百分比）
function getTimelinePosition(tz) {
  return (getCityHourDecimal(tz) / 24) * 100
}

// 工作时间 9:00-18:00 在该时区的时间轴位置
// 以北京时间为基准的时间轴
function getWorkStart(tz) {
  // 获取该时区9:00对应的UTC时间，再换算到北京时间的小数
  const utcHour = getUtcHourForLocal(tz, 9)
  // 转换为北京时间 (UTC+8)
  const bjHour = (utcHour + 8) % 24
  return (bjHour / 24) * 100
}

function getWorkEnd(tz) {
  const utcHour = getUtcHourForLocal(tz, 18)
  const bjHour = (utcHour + 8) % 24
  return (bjHour / 24) * 100
}

// 获取时区某个本地时间对应的 UTC 小时数
function getUtcHourForLocal(tz, localHour) {
  // 获取该时区某天某时的 UTC 偏移
  const date = new Date(now.value.getFullYear(), now.value.getMonth(), now.value.getDate(), 0, 0, 0)
  const utcStr = date.toLocaleString('en-US', { timeZone: 'UTC' })
  const tzStr = date.toLocaleString('en-US', { timeZone: tz })
  const utcDate = new Date(utcStr)
  const tzDate = new Date(tzStr)
  const offset = (tzDate - utcDate) / (1000 * 60 * 60) // 小时
  return localHour - offset
}

// 计算所有城市工作时间重叠区域
const overlapRange = computed(() => {
  if (selectedCities.value.length < 2) return null

  // 获取每个城市工作时间（9:00-18:00）对应的北京时间的起止
  const ranges = selectedCities.value.map(city => {
    // 获取该城市9:00和18:00的UTC时间
    const workStartUTC = getUtcHourForLocal(city.tz, 9)
    const workEndUTC = getUtcHourForLocal(city.tz, 18)

    // 换算成24小时制的统一基准（以分钟为单位，避免跨天问题）
    const start = ((workStartUTC + 8) % 24) * 60
    const end = ((workEndUTC + 8) % 24) * 60

    return { start, end, name: city.name }
  })

  // 将时间轴分为两段处理（避免跨越午夜的问题）
  // 简化处理：检查每分钟的交集
  const overlapStart = Math.max(...ranges.map(r => r.start))
  const overlapEnd = Math.min(...ranges.map(r => r.end))

  if (overlapStart >= overlapEnd) {
    // 尝试检测跨天重叠
    // 某些城市的工作时间可能横跨午夜（如UTC+12的悉尼9:00 = 北京1:00）
    // 处理跨天：将所有范围转换为0-1440分钟，允许end < start
    return null
  }

  const startHour = Math.floor(overlapStart / 60)
  const startMin = overlapStart % 60
  const endHour = Math.floor(overlapEnd / 60)
  const endMin = overlapEnd % 60

  return {
    start: (overlapStart / 1440) * 100,
    end: (overlapEnd / 1440) * 100,
    label: `${String(startHour).padStart(2,'0')}:${String(Math.floor(startMin)).padStart(2,'0')} - ${String(endHour).padStart(2,'0')}:${String(Math.floor(endMin)).padStart(2,'0')}`,
    beijingTime: `${String(startHour).padStart(2,'0')}:${String(Math.round(startMin / 15) * 15).padStart(2,'0')} ~ ${String(endHour).padStart(2,'0')}:${String(Math.round(endMin / 15) * 15).padStart(2,'0')}`
  }
})
</script>

<style scoped>
.tool-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1rem;
}
h2 {
  font-size: 1.6rem;
  margin-bottom: 0.5rem;
}
.subtitle {
  color: #666;
  margin-bottom: 1.5rem;
}

/* 城市选择区域 */
.city-section {
  background: #fff;
  border-radius: 10px;
  padding: 1.2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 1.2rem;
}
.city-section h3 {
  font-size: 1rem;
  margin-bottom: 0.8rem;
  color: #555;
}
.selected-cities {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}
.city-tag {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.88rem;
  font-weight: 500;
}
.city-tag.selected {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}
.city-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
.btn-remove {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0 0.2rem;
  transition: color 0.2s;
}
.btn-remove:hover { color: #ef4444; }
.btn-add {
  padding: 0.4rem 0.9rem;
  background: #fff;
  border: 1px dashed #22c55e;
  border-radius: 20px;
  color: #22c55e;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}
.btn-add:hover {
  background: #f0fdf4;
}

/* 城市选择弹窗 */
.picker-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.picker-panel {
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}
.picker-panel h3 {
  padding: 1rem 1rem 0;
  font-size: 1.1rem;
}
.picker-search {
  margin: 0.8rem 1rem;
  padding: 0.6rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
}
.picker-search:focus {
  border-color: #22c55e;
}
.picker-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 1rem 1rem;
}
.continent-group {
  margin-bottom: 0.8rem;
}
.continent-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #888;
  margin-bottom: 0.3rem;
}
.picker-city {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.6rem;
  border: 1px solid transparent;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 0.88rem;
  text-align: left;
  transition: all 0.15s;
}
.picker-city:hover {
  background: #f0fdf4;
  border-color: #22c55e;
}
.picker-city.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #f9fafb;
}
.picker-city.disabled:hover {
  border-color: transparent;
  background: #f9fafb;
}
.picker-tz {
  font-size: 0.75rem;
  color: #999;
  margin-left: auto;
}
.picker-added {
  font-size: 0.75rem;
  color: #22c55e;
  font-weight: 500;
}
.picker-close {
  padding: 0.7rem;
  border: none;
  border-top: 1px solid #eee;
  background: #f9fafb;
  cursor: pointer;
  font-size: 0.9rem;
  border-radius: 0 0 12px 12px;
  transition: background 0.2s;
}
.picker-close:hover { background: #f3f4f6; }

/* 时间卡片 */
.clocks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.clock-card {
  background: #fff;
  border-radius: 10px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  text-align: center;
  border-top: 3px solid transparent;
}
.clock-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}
.clock-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.clock-city {
  font-weight: 600;
  font-size: 0.95rem;
  color: #333;
}
.clock-time {
  font-size: 2rem;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  letter-spacing: 2px;
  color: #1a1a1a;
  margin-bottom: 0.2rem;
}
.clock-date {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.2rem;
}
.clock-offset {
  font-size: 0.78rem;
  color: #999;
}

/* 时间轴 */
.timeline-section {
  background: #fff;
  border-radius: 10px;
  padding: 1.2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 1rem;
}
.timeline-section h3 {
  font-size: 1rem;
  margin-bottom: 1rem;
  color: #555;
}
.timeline-container {
  position: relative;
}
.timeline-row {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  min-height: 32px;
}
.timeline-label {
  width: 90px;
  flex-shrink: 0;
  font-size: 0.8rem;
  color: #666;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding-right: 0.5rem;
}
.timeline-bar {
  flex: 1;
  height: 32px;
  position: relative;
  background: #f9fafb;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

/* 工作时间高亮 */
.bg-row {
  margin-bottom: 0.3rem;
}
.bg-row .timeline-bar {
  height: 28px;
}
.timeline-work-highlight {
  position: absolute;
  top: 0;
  height: 100%;
  border-radius: 4px;
}
.timeline-overlap {
  position: absolute;
  top: 0;
  height: 100%;
  background: rgba(34, 197, 94, 0.25);
  border: 2px solid #22c55e;
  border-radius: 4px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}
.overlap-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #16a34a;
  white-space: nowrap;
}

/* 时间指示器 */
.timeline-marker {
  position: absolute;
  top: 0;
  height: 100%;
  display: flex;
  align-items: center;
  transform: translateX(-50%);
  z-index: 3;
}
.marker-line {
  width: 2px;
  height: 100%;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0.6;
}
.marker-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  position: absolute;
  left: 50%;
  top: 2px;
  transform: translateX(-50%);
  z-index: 4;
}
.marker-time {
  position: absolute;
  bottom: -18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.72rem;
  font-weight: 600;
  font-family: 'Courier New', monospace;
  white-space: nowrap;
}

/* 时间刻度 */
.ticks-row {
  margin-top: 0.8rem;
}
.ticks-row .timeline-label {
  /* 空 */
}
.ticks-row .timeline-bar {
  height: 20px;
  border: none;
  background: transparent;
}
.timeline-tick {
  position: absolute;
  transform: translateX(-50%);
  font-size: 0.68rem;
  color: #999;
  top: 0;
}

/* 最佳会议时间提示 */
.meeting-hint {
  margin-top: 1rem;
  padding: 0.8rem 1rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  font-size: 0.88rem;
  color: #16a34a;
}
.meeting-hint.no-overlap {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #22c55e;
  font-weight: 500;
}
.back-link:hover { text-decoration: underline; }

@media (max-width: 640px) {
  .clocks-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .timeline-label {
    width: 60px;
    font-size: 0.72rem;
  }
  .picker-panel {
    max-height: 90vh;
  }
}
</style>
