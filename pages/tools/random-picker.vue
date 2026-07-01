<template>
  <div class="tool-page">
    <h2>🎰 随机抽签分组器</h2>
    <p class="subtitle">输入名单，支持随机抽签、公平分组、加权随机，可视化转盘动画展示结果</p>

    <!-- 模式切换 -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.icon }} {{ tab.label }}
      </button>
    </div>

    <!-- 通用输入区域 -->
    <div class="input-section">
      <div class="input-header">
        <label>名单输入</label>
        <div class="input-actions">
          <button class="btn-sm" @click="loadExample">加载示例</button>
          <button class="btn-sm" @click="clearInput">清空</button>
        </div>
      </div>
      <textarea
        v-model="inputText"
        class="input-area"
        placeholder="每行一个名字，例如：&#10;张三&#10;李四&#10;王五&#10;赵六"
        rows="6"
      ></textarea>
      <div class="input-stats">
        共 <b>{{ nameList.length }}</b> 人
      </div>
    </div>

    <!-- ===== 模式一：随机抽签 ===== -->
    <div v-if="activeTab === 'draw'" class="mode-content">
      <div class="controls">
        <div class="control-row">
          <div class="control-group">
            <label>抽取人数 <b>{{ drawCount }}</b></label>
            <input type="range" v-model.number="drawCount" min="1" :max="Math.max(1, nameList.length)" />
          </div>
        </div>
        <div class="check-row">
          <label class="toggle-label">
            <input type="checkbox" v-model="drawNoRepeat" />
            不放回（已抽出的不再参与）
          </label>
        </div>
        <button class="btn-primary" @click="startDraw" :disabled="nameList.length === 0">
          🎯 开始抽签
        </button>
      </div>

      <!-- 转盘动画区域 -->
      <div v-if="isSpinning" class="wheel-container">
        <div class="wheel">
          <div
            class="wheel-inner"
            :style="{ transform: `rotate(${wheelRotation}deg)` }"
          >
            <div
              v-for="(name, idx) in shuffledList"
              :key="idx"
              class="wheel-item"
              :style="wheelItemStyle(idx)"
            >
              <span class="wheel-name">{{ name }}</span>
            </div>
          </div>
          <div class="wheel-pointer">▼</div>
        </div>
        <div class="wheel-status">抽签中...</div>
      </div>

      <!-- 抽签结果 -->
      <div v-if="drawResult.length > 0 && !isSpinning" class="result-section">
        <div class="result-header">
          <span>🎯 抽签结果</span>
          <button class="btn-copy" @click="copyResult(drawResult.join('、'))">
            📋 复制结果
          </button>
        </div>
        <div class="result-tags">
          <span v-for="(name, idx) in drawResult" :key="idx" class="result-tag">
            {{ name }}
          </span>
        </div>
      </div>
    </div>

    <!-- ===== 模式二：公平分组 ===== -->
    <div v-if="activeTab === 'group'" class="mode-content">
      <div class="controls">
        <div class="control-row">
          <div class="control-group">
            <label>分组数量 <b>{{ groupCount }}</b></label>
            <input type="range" v-model.number="groupCount" min="2" :max="Math.max(2, nameList.length)" />
          </div>
        </div>
        <div class="check-row">
          <label class="toggle-label">
            <input type="checkbox" v-model="groupNamesEnabled" />
            自定义组名
          </label>
        </div>
        <div v-if="groupNamesEnabled" class="control-row">
          <div class="control-group full">
            <label>组名（逗号分隔）</label>
            <input
              type="text"
              v-model="groupNamesText"
              class="text-input"
              placeholder="A组, B组, C组"
            />
          </div>
        </div>
        <button class="btn-primary" @click="startGroup" :disabled="nameList.length < 2">
          📊 开始分组
        </button>
      </div>

      <!-- 分组结果 -->
      <div v-if="groupResult.length > 0" class="result-section">
        <div class="result-header">
          <span>📊 分组结果</span>
          <button class="btn-copy" @click="copyGroupResult">
            📋 复制结果
          </button>
        </div>
        <div class="group-cards">
          <div v-for="(group, idx) in groupResult" :key="idx" class="group-card">
            <div class="group-title" :style="{ background: groupColors[idx % groupColors.length] }">
              {{ group.name }}
              <span class="group-count">{{ group.members.length }}人</span>
            </div>
            <div class="group-members">
              <span v-for="(m, mi) in group.members" :key="mi" class="member-tag">
                {{ m }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 模式三：加权随机 ===== -->
    <div v-if="activeTab === 'weighted'" class="mode-content">
      <div class="controls">
        <div class="check-row">
          <label class="toggle-label">
            <input type="checkbox" v-model="weightedAdvanced" />
            自定义权重
          </label>
        </div>
        <button class="btn-primary" @click="startWeighted" :disabled="nameList.length < 2">
            ⚖️ 加权抽取
          </button>
      </div>

      <!-- 权重编辑表格 -->
      <div v-if="weightedAdvanced && nameList.length > 0" class="weight-table-wrap">
        <table class="weight-table">
          <thead>
            <tr>
              <th>名字</th>
              <th>权重</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(name, idx) in nameList" :key="idx">
              <td>{{ name }}</td>
              <td>
                <input
                  type="number"
                  v-model.number="weights[idx]"
                  min="0"
                  class="weight-input"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 权重可视化条 -->
      <div v-if="nameList.length > 0" class="weight-visual">
        <div class="weight-label">权重分布</div>
        <div class="weight-bar-container">
          <div
            v-for="(name, idx) in nameList"
            :key="idx"
            class="weight-segment"
            :style="weightSegmentStyle(idx)"
            :title="`${name}: ${weights[idx]} (${weightPercent(idx)}%)`"
          >
            <span class="weight-segment-label" v-if="weightPercent(idx) > 8">{{ name }}</span>
          </div>
        </div>
      </div>

      <!-- 加权结果 -->
      <div v-if="weightedResult && !isSpinning" class="result-section">
        <div class="result-header">
          <span>⚖️ 加权抽取结果</span>
          <button class="btn-copy" @click="copyResult(weightedResult)">
            📋 复制结果
          </button>
        </div>
        <div class="weighted-result-display">
          <div class="weighted-result-name">{{ weightedResult }}</div>
          <div class="weighted-result-info">
            权重 {{ getWeight(weightedResult) }}，概率 {{ weightPercent(getWeightIndex(weightedResult)) }}%
          </div>
        </div>
      </div>

      <!-- 加权转盘 -->
      <div v-if="isSpinning" class="wheel-container">
        <div class="wheel">
          <div
            class="wheel-inner"
            :style="{ transform: `rotate(${wheelRotation}deg)` }"
          >
            <div
              v-for="(name, idx) in nameList"
              :key="idx"
              class="wheel-item"
              :style="weightedWheelItemStyle(idx)"
            >
              <span class="wheel-name">{{ name }}</span>
            </div>
          </div>
          <div class="wheel-pointer">▼</div>
        </div>
        <div class="wheel-status">抽取中...</div>
      </div>
    </div>

    <!-- 历史记录 -->
    <div v-if="history.length > 0" class="history-section">
      <div class="history-header">
        <span>📝 操作历史</span>
        <button class="btn-sm" @click="clearHistory">清空</button>
      </div>
      <div class="history-list">
        <div v-for="(item, idx) in history" :key="idx" class="history-item">
          <span class="history-time">{{ item.time }}</span>
          <span class="history-type">{{ item.type }}</span>
          <span class="history-result">{{ item.result }}</span>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

useHead({ title: '随机抽签分组器 - 野火小站' })

// ===== 模式定义 =====
const tabs = [
  { id: 'draw', icon: '🎯', label: '随机抽签' },
  { id: 'group', icon: '📊', label: '公平分组' },
  { id: 'weighted', icon: '⚖️', label: '加权随机' },
]
const activeTab = ref('draw')

// ===== 输入数据 =====
const inputText = ref('')
const nameList = computed(() =>
  inputText.value.split('\n').map(s => s.trim()).filter(s => s.length > 0)
)

// ===== 抽签模式 =====
const drawCount = ref(1)
const drawNoRepeat = ref(true)
const drawResult = ref([])
const isSpinning = ref(false)
const wheelRotation = ref(0)
const shuffledList = ref([])

// ===== 分组模式 =====
const groupCount = ref(2)
const groupNamesEnabled = ref(false)
const groupNamesText = ref('')
const groupResult = ref([])
const groupColors = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
  '#14b8a6', '#6366f1', '#84cc16', '#e11d48',
]

// ===== 加权模式 =====
const weightedAdvanced = ref(false)
const weightedResult = ref(null)
const weights = ref([])

// 监听名单变化自动初始化权重
watch(nameList, (list) => {
  while (weights.value.length < list.length) weights.value.push(1)
  weights.value = weights.value.slice(0, list.length)
}, { immediate: true })

// ===== 历史记录 =====
const history = ref([])

// ===== 工具方法 =====

// Fisher-Yates 洗牌算法
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 加权随机选择
function weightedRandom() {
  const list = nameList.value
  const w = weights.value
  const total = w.reduce((s, v) => s + v, 0)
  let r = Math.random() * total
  for (let i = 0; i < list.length; i++) {
    r -= w[i]
    if (r <= 0) return i
  }
  return list.length - 1
}

// 权重百分比
function weightPercent(idx) {
  const total = weights.value.reduce((s, v) => s + v, 0)
  if (total === 0) return 0
  return ((weights.value[idx] / total) * 100).toFixed(1)
}

function getWeight(name) {
  const idx = nameList.value.indexOf(name)
  return idx >= 0 ? weights.value[idx] : 0
}

function getWeightIndex(name) {
  return nameList.value.indexOf(name)
}

// 添加历史记录
function addHistory(type, result) {
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
  history.value.unshift({ time, type, result })
  // 最多保留20条
  if (history.value.length > 20) history.value = history.value.slice(0, 20)
}

// ===== 转盘动画 =====

// 计算转盘各项角度样式
function wheelItemStyle(idx) {
  const total = shuffledList.value.length
  if (total === 0) return {}
  const angle = 360 / total
  return {
    transform: `rotate(${idx * angle}deg)`,
    clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.sin((idx + 1) * angle * Math.PI / 180)}% ${50 - 50 * Math.cos((idx + 1) * angle * Math.PI / 180)}%)`,
    background: groupColors[idx % groupColors.length],
  }
}

function weightedWheelItemStyle(idx) {
  const list = nameList.value
  const total = weights.value.reduce((s, v) => s + v, 0)
  if (total === 0 || list.length === 0) return {}
  const angle = (weights.value[idx] / total) * 360
  // 计算累计偏移角度
  let offset = 0
  for (let i = 0; i < idx; i++) {
    offset += (weights.value[i] / total) * 360
  }
  const endAngle = offset + angle
  const r = 45 // 半径百分比
  return {
    transform: `rotate(${offset}deg)`,
    clipPath: `polygon(50% 50%, 50% ${50 - r}%, ${50 + r * Math.sin(endAngle * Math.PI / 180)}% ${50 - r * Math.cos(endAngle * Math.PI / 180)}%)`,
    background: groupColors[idx % groupColors.length],
  }
}

function weightSegmentStyle(idx) {
  const total = weights.value.reduce((s, v) => s + v, 0)
  if (total === 0) return {}
  return {
    width: `${(weights.value[idx] / total) * 100}%`,
    background: groupColors[idx % groupColors.length],
  }
}

// 执行转盘动画
function animateWheel(callback) {
  isSpinning.value = true
  const totalRotation = 1800 + Math.random() * 1080 // 5-8圈
  const duration = 3500
  const startTime = Date.now()
  const startRotation = wheelRotation.value

  function animate() {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    // 缓出曲线
    const ease = 1 - Math.pow(1 - progress, 3)
    wheelRotation.value = startRotation + totalRotation * ease

    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      isSpinning.value = false
      callback()
    }
  }
  requestAnimationFrame(animate)
}

// ===== 核心操作 =====

// 随机抽签
function startDraw() {
  const list = nameList.value
  if (list.length === 0) return

  shuffledList.value = shuffle(list)

  animateWheel(() => {
    const shuffled = shuffle(list)
    const count = Math.min(drawCount.value, list.length)
    if (drawNoRepeat.value) {
      drawResult.value = shuffled.slice(0, count)
    } else {
      drawResult.value = Array.from({ length: count }, () => list[Math.floor(Math.random() * list.length)])
    }
    addHistory('抽签', drawResult.value.join('、'))
  })
}

// 公平分组
function startGroup() {
  const list = nameList.value
  if (list.length < 2) return

  const shuffled = shuffle(list)
  const groups = Array.from({ length: groupCount.value }, () => [])
  shuffled.forEach((name, idx) => {
    groups[idx % groupCount.value].push(name)
  })

  // 获取自定义组名
  let names = []
  if (groupNamesEnabled.value && groupNamesText.value.trim()) {
    names = groupNamesText.value.split(/[,，]/).map(s => s.trim()).filter(s => s)
  }

  groupResult.value = groups.map((members, idx) => ({
    name: names[idx] || `${idx + 1}组`,
    members,
  }))

  addHistory('分组', groups.map((g, i) => `${names[i] || (i + 1) + '组'}[${g.length}人]`).join(' | '))
}

// 加权抽取
function startWeighted() {
  if (nameList.value.length < 2) return

  const winnerIdx = weightedRandom()

  // 加权转盘动画
  const list = nameList.value
  const w = weights.value
  const total = w.reduce((s, v) => s + v, 0)
  // 计算目标角度（使指针指向被选中项的中心）
  let offset = 0
  for (let i = 0; i < winnerIdx; i++) {
    offset += (w[i] / total) * 360
  }
  const targetAngle = offset + (w[winnerIdx] / total) * 180

  isSpinning.value = true
  const totalRotation = 1800 + Math.random() * 1080
  // 最终角度需要让指针对准目标
  const finalRotation = totalRotation - targetAngle
  const duration = 3500
  const startTime = Date.now()
  const startRotation = wheelRotation.value

  function animate() {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    const ease = 1 - Math.pow(1 - progress, 3)
    wheelRotation.value = startRotation + finalRotation * ease

    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      isSpinning.value = false
      weightedResult.value = list[winnerIdx]
      addHistory('加权抽取', list[winnerIdx])
    }
  }
  requestAnimationFrame(animate)
}

// ===== 辅助操作 =====

function loadExample() {
  inputText.value = '张三\n李四\n王五\n赵六\n钱七\n孙八\n周九\n吴十\n郑十一\n冯十二'
  drawCount.value = 3
  groupCount.value = 3
}

function clearInput() {
  inputText.value = ''
  drawResult.value = []
  groupResult.value = []
  weightedResult.value = null
}

function clearHistory() {
  history.value = []
}

function copyResult(text) {
  navigator.clipboard.writeText(text).then(() => {
    // 浏览器自动反馈
  })
}

function copyGroupResult() {
  const text = groupResult.value.map(g =>
    `${g.name}：${g.members.join('、')}`
  ).join('\n')
  copyResult(text)
}
</script>

<style scoped>
.tool-page {
  max-width: 800px;
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

/* 模式标签 */
.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.2rem;
  flex-wrap: wrap;
}
.tab-btn {
  padding: 0.5rem 1.2rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.tab-btn:hover {
  border-color: #22c55e;
}
.tab-btn.active {
  border-color: #22c55e;
  background: #f0fdf4;
  color: #22a34a;
  font-weight: 600;
}

/* 输入区域 */
.input-section {
  background: #fff;
  border-radius: 10px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 1.2rem;
}
.input-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.input-header label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
}
.input-actions {
  display: flex;
  gap: 0.5rem;
}
.input-area {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.8rem;
  font-size: 0.9rem;
  resize: vertical;
  font-family: inherit;
  line-height: 1.6;
  transition: border-color 0.2s;
}
.input-area:focus {
  outline: none;
  border-color: #22c55e;
}
.input-stats {
  margin-top: 0.4rem;
  font-size: 0.82rem;
  color: #888;
}

/* 控制区 */
.mode-content {
  animation: fadeIn 0.3s;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.controls {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-bottom: 1.2rem;
}
.control-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
.control-group {
  flex: 1;
  min-width: 150px;
}
.control-group.full {
  flex-basis: 100%;
}
.control-group label {
  display: block;
  font-size: 0.85rem;
  color: #555;
  margin-bottom: 0.3rem;
}
.control-group input[type="range"] {
  width: 100%;
  accent-color: #22c55e;
}
.text-input {
  width: 100%;
  padding: 0.5rem 0.8rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.85rem;
  font-family: inherit;
}
.text-input:focus {
  outline: none;
  border-color: #22c55e;
}
.check-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
}
.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  font-size: 0.85rem;
  color: #555;
}
.toggle-label input {
  accent-color: #22c55e;
}
.btn-sm {
  padding: 0.3rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}
.btn-sm:hover {
  border-color: #22c55e;
  color: #22c55e;
}
.btn-primary {
  padding: 0.7rem 1.5rem;
  background: #22c55e;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  align-self: flex-start;
  transition: background 0.2s;
}
.btn-primary:hover {
  background: #16a34a;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 转盘 */
.wheel-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.2rem;
}
.wheel {
  position: relative;
  width: 260px;
  height: 260px;
}
.wheel-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  position: relative;
  transition: none;
}
.wheel-item {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.wheel-name {
  font-size: 0.7rem;
  color: #fff;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}
.wheel-pointer {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.5rem;
  color: #ef4444;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
  z-index: 10;
}
.wheel-status {
  margin-top: 0.8rem;
  font-size: 1rem;
  color: #555;
  font-weight: 600;
  animation: pulse 1s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 结果区 */
.result-section {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  overflow: hidden;
  margin-bottom: 1.2rem;
}
.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 1rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
}
.btn-copy {
  padding: 0.3rem 0.8rem;
  background: #22c55e;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: opacity 0.2s;
}
.btn-copy:hover { opacity: 0.85; }
.result-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 1rem;
}
.result-tag {
  padding: 0.5rem 1.2rem;
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
  border-radius: 20px;
  font-size: 0.95rem;
  font-weight: 600;
}

/* 分组卡片 */
.group-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.8rem;
  padding: 1rem;
}
.group-card {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
}
.group-title {
  padding: 0.6rem 0.8rem;
  color: #fff;
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.group-count {
  font-size: 0.75rem;
  opacity: 0.85;
  background: rgba(255,255,255,0.2);
  padding: 0.1rem 0.5rem;
  border-radius: 10px;
}
.group-members {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding: 0.8rem;
}
.member-tag {
  padding: 0.3rem 0.7rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #555;
}

/* 加权模式 */
.weight-table-wrap {
  margin-bottom: 1rem;
  overflow-x: auto;
}
.weight-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.weight-table th,
.weight-table td {
  padding: 0.5rem 0.8rem;
  border: 1px solid #e5e7eb;
  text-align: left;
}
.weight-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #555;
}
.weight-input {
  width: 80px;
  padding: 0.3rem 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 0.85rem;
  text-align: center;
}
.weight-input:focus {
  outline: none;
  border-color: #22c55e;
}

.weight-visual {
  background: #fff;
  border-radius: 10px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 1rem;
}
.weight-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #555;
  margin-bottom: 0.5rem;
}
.weight-bar-container {
  display: flex;
  height: 32px;
  border-radius: 8px;
  overflow: hidden;
}
.weight-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.3s;
  min-width: 2px;
}
.weight-segment-label {
  color: #fff;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  padding: 0 0.3rem;
}

.weighted-result-display {
  padding: 1.5rem;
  text-align: center;
}
.weighted-result-name {
  font-size: 2rem;
  font-weight: 700;
  color: #16a34a;
  margin-bottom: 0.3rem;
}
.weighted-result-info {
  font-size: 0.85rem;
  color: #888;
}

/* 历史记录 */
.history-section {
  margin-bottom: 1.5rem;
}
.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #555;
}
.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.history-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.8rem;
  background: #fff;
  border-radius: 8px;
  font-size: 0.82rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.history-time {
  color: #999;
  font-family: 'Courier New', monospace;
  white-space: nowrap;
}
.history-type {
  color: #22c55e;
  font-weight: 600;
  white-space: nowrap;
  background: #f0fdf4;
  padding: 0.1rem 0.5rem;
  border-radius: 4px;
}
.history-result {
  color: #555;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.back-link {
  display: inline-block;
  margin-top: 1.5rem;
  color: #22c55e;
  font-weight: 500;
}
.back-link:hover { text-decoration: underline; }

/* 响应式 */
@media (max-width: 640px) {
  .tool-page { padding: 0.5rem; }
  .tabs { gap: 0.3rem; }
  .tab-btn { padding: 0.4rem 0.8rem; font-size: 0.82rem; }
  .control-row { flex-direction: column; }
  .wheel { width: 220px; height: 220px; }
  .group-cards { grid-template-columns: 1fr; }
}
</style>
