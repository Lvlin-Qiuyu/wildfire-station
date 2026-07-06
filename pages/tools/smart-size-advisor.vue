<template>
  <div class="tool-page">
    <h2>📏 国际服装尺码智能对照器</h2>
    <p class="subtitle">输入身高体重，智能推荐各国标准尺码，支持衣裤鞋袜多品类对照</p>

    <!-- 基础信息输入 -->
    <div class="input-grid">
      <div class="input-group">
        <label>身高：<strong>{{ height }} cm</strong></label>
        <input type="range" v-model.number="height" min="140" max="210" step="1" class="slider" />
        <div class="range-labels">
          <span>140</span><span>210</span>
        </div>
      </div>
      <div class="input-group">
        <label>体重：<strong>{{ weight }} kg</strong></label>
        <input type="range" v-model.number="weight" min="35" max="150" step="0.5" class="slider" />
        <div class="range-labels">
          <span>35</span><span>150</span>
        </div>
      </div>
      <div class="input-group">
        <label>性别</label>
        <div class="gender-toggle">
          <button :class="{ active: gender === 'male' }" @click="gender = 'male'">👨 男</button>
          <button :class="{ active: gender === 'female' }" @click="gender = 'female'">👩 女</button>
          <button :class="{ active: gender === 'child' }" @click="gender = 'child'">🧒 儿童</button>
        </div>
      </div>
      <div class="input-group">
        <label>年龄段（儿童适用）</label>
        <select v-model="ageRange" class="select-input">
          <option v-for="item in ageRanges" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </div>
    </div>

    <!-- 品类切换 -->
    <div class="tabs">
      <button
        v-for="tab in categoryTabs"
        :key="tab.id"
        :class="['tab-btn', { active: activeCategory === tab.id }]"
        @click="activeCategory = tab.id"
      >
        {{ tab.icon }} {{ tab.label }}
      </button>
    </div>

    <!-- 尺码推荐结果 -->
    <div class="result-section">
      <div class="result-header">
        <span>{{ categoryTabs.find(t => t.id === activeCategory)?.icon }} 推荐尺码</span>
        <button class="btn-copy" @click="copyResult">📋 复制结果</button>
      </div>

      <!-- BMI 体型指标 -->
      <div class="body-info">
        <div class="body-stat">
          <span class="stat-label">BMI</span>
          <span class="stat-value" :style="{ color: bmiColor }">{{ bmiValue }}</span>
          <span class="stat-tag" :style="{ background: bmiColor + '20', color: bmiColor }">{{ bodyType }}</span>
        </div>
        <div class="body-stat">
          <span class="stat-label">胸围估算</span>
          <span class="stat-value">{{ chestEstimate }} cm</span>
        </div>
        <div class="body-stat">
          <span class="stat-label">腰围估算</span>
          <span class="stat-value">{{ waistEstimate }} cm</span>
        </div>
      </div>

      <!-- 各国尺码对照表 -->
      <div class="size-table-wrap">
        <table class="size-table">
          <thead>
            <tr>
              <th v-for="col in tableColumns" :key="col">{{ col }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, idx) in sizeRows"
              :key="idx"
              :class="{ recommended: isRecommended(row) }"
            >
              <td v-for="(col, ci) in tableColumns" :key="ci">
                <span v-if="isRecommended(row) && ci === 0" class="recommend-badge">推荐</span>
                {{ row[col] }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 可视化身材对照 -->
      <div class="body-visual">
        <h3>📏 身材参考</h3>
        <div class="visual-row">
          <div class="visual-item">
            <div class="visual-bar-wrap">
              <div class="visual-bar" :style="{ height: heightPercent + '%' }"></div>
            </div>
            <div class="visual-label">{{ height }}cm</div>
          </div>
          <div class="visual-info">
            <div class="info-item">
              <span class="info-label">胸围</span>
              <span class="info-value">{{ chestEstimate }}cm</span>
            </div>
            <div class="info-item">
              <span class="info-label">腰围</span>
              <span class="info-value">{{ waistEstimate }}cm</span>
            </div>
            <div class="info-item">
              <span class="info-label">臀围</span>
              <span class="info-value">{{ hipEstimate }}cm</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 温馨提示 -->
      <div class="tips-section" v-if="tips.length > 0">
        <h3>💡 购买建议</h3>
        <p v-for="(tip, i) in tips" :key="i">{{ tip }}</p>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '国际服装尺码智能对照器 - 野火小站' })

// ===== 输入数据 =====
const height = ref(170)
const weight = ref(65)
const gender = ref('male')
const ageRange = ref('7-8')
const activeCategory = ref('tops')

// ===== 品类选项 =====
const categoryTabs = [
  { id: 'tops', icon: '👕', label: '上衣' },
  { id: 'bottoms', icon: '👖', label: '裤子' },
  { id: 'shoes', icon: '👟', label: '鞋子' },
  { id: 'socks', icon: '🧦', label: '袜子' },
]

// ===== 儿童年龄段 =====
const ageRanges = [
  { value: '3-4', label: '3-4岁 (100-110cm)' },
  { value: '5-6', label: '5-6岁 (110-122cm)' },
  { value: '7-8', label: '7-8岁 (122-134cm)' },
  { value: '9-10', label: '9-10岁 (134-146cm)' },
  { value: '11-12', label: '11-12岁 (146-158cm)' },
  { value: '13-14', label: '13-14岁 (158-170cm)' },
]

// ===== BMI 与体型计算 =====
const bmiValue = computed(() => {
  const h = height.value / 100
  return (weight.value / (h * h)).toFixed(1)
})

const bodyType = computed(() => {
  const v = parseFloat(bmiValue.value)
  if (v < 18.5) return '偏瘦'
  if (v < 24) return '标准'
  if (v < 28) return '偏胖'
  return '肥胖'
})

const bmiColor = computed(() => {
  const v = parseFloat(bmiValue.value)
  if (v < 18.5) return '#3498db'
  if (v < 24) return '#22c55e'
  if (v < 28) return '#f59e0b'
  return '#ef4444'
})

// ===== 三围估算算法 =====
const chestEstimate = computed(() => {
  if (gender.value === 'female') return Math.round(55 + (height.value - 150) * 0.6 + (weight.value - 50) * 0.25)
  return Math.round(70 + (height.value - 150) * 0.7 + (weight.value - 55) * 0.3)
})

const waistEstimate = computed(() => {
  if (gender.value === 'female') return Math.round(55 + (weight.value - 50) * 0.5)
  return Math.round(65 + (weight.value - 55) * 0.6)
})

const hipEstimate = computed(() => {
  if (gender.value === 'female') return Math.round(chestEstimate.value + 4 + (weight.value - 50) * 0.3)
  return Math.round(chestEstimate.value + 2 + (weight.value - 55) * 0.15)
})

// ===== 身高百分比（可视化） =====
const heightPercent = computed(() => {
  return ((height.value - 140) / (210 - 140)) * 100
})

// ===== 尺码映射表 =====
const tableColumns = computed(() => {
  if (activeCategory.value === 'shoes') {
    return ['标准', '中国(欧码)', '美国(男)', '美国(女)', '英国', '日本', '脚长(cm)']
  }
  if (activeCategory.value === 'socks') {
    return ['标准', '中国码', '欧码', '脚长范围(cm)', '适合年龄']
  }
  if (activeCategory.value === 'bottoms') {
    return ['标准', '中国', '美国', '欧盟', '英国', '腰围(cm)', '臀围(cm)']
  }
  return ['标准', '中国', '美国(S)', '欧盟', '英国', '胸围(cm)', '肩宽(cm)']
})

// 根据品类和性别返回尺码对照数据
const sizeRows = computed(() => {
  if (gender.value === 'child') return getChildSizes()
  if (gender.value === 'female') return getFemaleSizes()
  return getMaleSizes()
})

// ===== 男装尺码数据 =====
function getMaleSizes() {
  if (activeCategory.value === 'tops') {
    return [
      { 标准: 'XS', 中国: '44', '美国(S)': 'XS', 欧盟: '44', 英国: '34', '胸围(cm)': '86-90', '肩宽(cm)': '42' },
      { 标准: 'S', 中国: '46', '美国(S)': 'S', 欧盟: '46', 英国: '36', '胸围(cm)': '90-94', '肩宽(cm)': '43.5' },
      { 标准: 'M', 中国: '48', '美国(S)': 'M', 欧盟: '48', 英国: '38', '胸围(cm):': '94-98', '肩宽(cm)': '45' },
      { 标准: 'L', 中国: '50', '美国(S)': 'L', 欧盟: '50', 英国: '40', '胸围(cm)': '98-102', '肩宽(cm)': '46.5' },
      { 标准: 'XL', 中国: '52', '美国(S)': 'XL', 欧盟: '52', 英国: '42', '胸围(cm)': '102-106', '肩宽(cm)': '48' },
      { 标准: 'XXL', 中国: '54', '美国(S)': 'XXL', 欧盟: '54', 英国: '44', '胸围(cm)': '106-110', '肩宽(cm)': '49.5' },
      { 标准: '3XL', 中国: '56', '美国(S)': '3XL', 欧盟: '56', 英国: '46', '胸围(cm)': '110-114', '肩宽(cm)': '51' },
      { 标准: '4XL', 中国: '58', '美国(S)': '4XL', 欧盟: '58', 英国: '48', '胸围(cm)': '114-118', '肩宽(cm)': '52.5' },
    ].map(r => ({ ...r, '胸围(cm)': r['胸围(cm):'] || r['胸围(cm)'] }))
  }
  if (activeCategory.value === 'bottoms') {
    return [
      { 标准: '26', 中国: '26', 美国: '26', 欧盟: '42', 英国: '34', '腰围(cm)': '64-67', '臀围(cm)': '84-87' },
      { 标准: '27', 中国: '27', 美国: '27', 欧盟: '44', 英国: '36', '腰围(cm)': '67-70', '臀围(cm)': '87-90' },
      { 标准: '28', 中国: '28', 美国: '28', 欧盟: '44-46', 英国: '38', '腰围(cm)': '70-73', '臀围(cm)': '90-93' },
      { 标准: '29', 中国: '29', 美国: '29', 欧盟: '46', 英国: '38', '腰围(cm)': '73-76', '臀围(cm)': '93-96' },
      { 标准: '30', 中国: '30', 美国: '30', 欧盟: '48', 英国: '40', '腰围(cm)': '76-79', '臀围(cm)': '96-99' },
      { 标准: '31', 中国: '31', 美国: '31', 欧盟: '48-50', 英国: '40', '腰围(cm)': '79-82', '臀围(cm)': '99-102' },
      { 标准: '32', 中国: '32', 美国: '32', 欧盟: '50', 英国: '42', '腰围(cm)': '82-85', '臀围(cm)': '102-105' },
      { 标准: '33', 中国: '33', 美国: '33', 欧盟: '52', 英国: '44', '腰围(cm)': '85-89', '臀围(cm)': '105-108' },
      { 标准: '34', 中国: '34', 美国: '34', 欧盟: '54', 英国: '44', '腰围(cm)': '89-93', '臀围(cm)': '108-112' },
      { 标准: '36', 中国: '36', 美国: '36', 欧盟: '56', 英国: '46', '腰围(cm)': '93-97', '臀围(cm)': '112-116' },
    ]
  }
  if (activeCategory.value === 'shoes') {
    return [
      { 标准: '38', '中国(欧码)': '38', '美国(男)': '6', '美国(女)': '7.5', 英国: '5.5', 日本: '24', '脚长(cm)': '24' },
      { 标准: '39', '中国(欧码)': '39', '美国(男)': '7', '美国(女)': '8.5', 英国: '6.5', 日本: '24.5', '脚长(cm)': '24.5' },
      { 标准: '40', '中国(欧码)': '40', '美国(男)': '7.5', '美国(女)': '9', 英国: '7', 日本: '25.5', '脚长(cm)': '25' },
      { 标准: '41', '中国(欧码)': '41', '美国(男)': '8', '美国(女)': '9.5', 英国: '7.5', 日本: '26', '脚长(cm)': '25.5' },
      { 标准: '42', '中国(欧码)': '42', '美国(男)': '9', '美国(女)': '10.5', 英国: '8.5', 日本: '26.5', '脚长(cm)': '26' },
      { 标准: '43', '中国(欧码)': '43', '美国(男)': '9.5', '美国(女)': '11', 英国: '9', 日本: '27', '脚长(cm)': '26.5' },
      { 标准: '44', '中国(欧码)': '44', '美国(男)': '10', '美国(女)': '11.5', 英国: '9.5', 日本: '27.5', '脚长(cm)': '27' },
      { 标准: '45', '中国(欧码)': '45', '美国(男)': '11', '美国(女)': '12', 英国: '10.5', 日本: '28', '脚长(cm)': '27.5' },
      { 标准: '46', '中国(欧码)': '46', '美国(男)': '12', '美国(女)': '13', 英国: '11.5', 日本: '29', '脚长(cm)': '28.5' },
    ]
  }
  // 袜子
  return [
    { 标准: 'S', 中国码: '22-24', 欧码: '35-38', '脚长范围(cm)': '22-24', '适合年龄': '儿童' },
    { 标准: 'M', 中国码: '24-26', 欧码: '38-41', '脚长范围(cm)': '24-26', '适合年龄': '少年/女款' },
    { 标准: 'L', 中国码: '26-28', 欧码: '41-44', '脚长范围(cm)': '26-28', '适合年龄': '男款/大脚' },
    { 标准: 'XL', 中国码: '28-30', 欧码: '44-47', '脚长范围(cm)': '28-30', '适合年龄': '加大码' },
  ]
}

// ===== 女装尺码数据 =====
function getFemaleSizes() {
  if (activeCategory.value === 'tops') {
    return [
      { 标准: 'XS', 中国: '44', '美国(S)': 'XS', 欧盟: '32', 英国: '6', '胸围(cm)': '76-80', '肩宽(cm)': '36' },
      { 标准: 'S', 中国: '46', '美国(S)': 'S', 欧盟: '34', 英国: '8', '胸围(cm)': '80-84', '肩宽(cm)': '37.5' },
      { 标准: 'M', 中国: '48', '美国(S)': 'M', 欧盟: '36-38', 英国: '10', '胸围(cm)': '84-88', '肩宽(cm)': '39' },
      { 标准: 'L', 中国: '50', '美国(S)': 'L', 欧盟: '40', 英国: '12', '胸围(cm)': '88-92', '肩宽(cm)': '40.5' },
      { 标准: 'XL', 中国: '52', '美国(S)': 'XL', 欧盟: '42', 英国: '14', '胸围(cm)': '92-96', '肩宽(cm)': '42' },
      { 标准: 'XXL', 中国: '54', '美国(S)': 'XXL', 欧盟: '44', 英国: '16', '胸围(cm)': '96-100', '肩宽(cm)': '43.5' },
      { 标准: '3XL', 中国: '56', '美国(S)': '3XL', 欧盟: '46', 英国: '18', '胸围(cm)': '100-104', '肩宽(cm)': '45' },
    ]
  }
  if (activeCategory.value === 'bottoms') {
    return [
      { 标准: '24', 中国: '24', 美国: '0', 欧盟: '32', 英国: '4', '腰围(cm)': '60-63', '臀围(cm)': '84-87' },
      { 标准: '25', 中国: '25', 美国: '2', 欧盟: '34', 英国: '6', '腰围(cm)': '63-66', '臀围(cm)': '87-90' },
      { 标准: '26', 中国: '26', 美国: '4', 欧盟: '36', 英国: '8', '腰围(cm)': '66-69', '臀围(cm)': '90-93' },
      { 标准: '27', 中国: '27', 美国: '6', 欧盟: '38', 英国: '10', '腰围(cm)': '69-72', '臀围(cm)': '93-96' },
      { 标准: '28', 中国: '28', 美国: '8', 欧盟: '40', 英国: '12', '腰围(cm)': '72-76', '臀围(cm)': '96-100' },
      { 标准: '29', 中国: '29', 美国: '10', 欧盟: '42', 英国: '14', '腰围(cm)': '76-80', '臀围(cm)': '100-104' },
      { 标准: '30', 中国: '30', 美国: '12', 欧盟: '44', 英国: '16', '腰围(cm)': '80-85', '臀围(cm)': '104-108' },
    ]
  }
  if (activeCategory.value === 'shoes') {
    return [
      { 标准: '35', '中国(欧码)': '35', '美国(男)': '3.5', '美国(女)': '5', 英国: '2.5', 日本: '22', '脚长(cm)': '22.5' },
      { 标准: '36', '中国(欧码)': '36', '美国(男)': '4', '美国(女)': '6', 英国: '3.5', 日本: '23', '脚长(cm)': '23' },
      { 标准: '37', '中国(欧码)': '37', '美国(男)': '5', '美国(女)': '7', 英国: '4.5', 日本: '23.5', '脚长(cm)': '23.5' },
      { 标准: '38', '中国(欧码)': '38', '美国(男)': '5.5', '美国(女)': '7.5', 英国: '5', 日本: '24', '脚长(cm)': '24' },
      { 标准: '39', '中国(欧码)': '39', '美国(男)': '6.5', '美国(女)': '8.5', 英国: '6', 日本: '24.5', '脚长(cm)': '24.5' },
      { 标准: '40', '中国(欧码)': '40', '美国(男)': '7', '美国(女)': '9', 英国: '6.5', 日本: '25', '脚长(cm)': '25' },
    ]
  }
  // 袜子
  return [
    { 标准: 'S', 中国码: '22-23', 欧码: '35-37', '脚长范围(cm)': '22-23', '适合年龄': '小脚' },
    { 标准: 'M', 中国码: '23-24', 欧码: '37-39', '脚长范围(cm)': '23-24', '适合年龄': '常规' },
    { 标准: 'L', 中国码: '24-26', 欧码: '39-41', '脚长范围(cm)': '24-26', '适合年龄': '常规/偏大' },
    { 标准: 'XL', 中国码: '26-28', 欧码: '41-44', '脚长范围(cm)': '26-28', '适合年龄': '大脚' },
  ]
}

// ===== 儿童尺码数据 =====
function getChildSizes() {
  if (activeCategory.value === 'tops') {
    return [
      { 标准: '100', 中国: '100', '美国(S)': '2T', 欧盟: '92', 英国: '2', '胸围(cm)': '52-54', '肩宽(cm)': '26' },
      { 标准: '110', 中国: '110', '美国(S)': '3T', 欧盟: '98', 英国: '3', '胸围(cm)': '54-56', '肩宽(cm)': '28' },
      { 标准: '120', 中国: '120', '美国(S)': '4T', 欧盟: '104', 英国: '4', '胸围(cm)': '56-60', '肩宽(cm)': '30' },
      { 标准: '130', 中国: '130', '美国(S)': '5', 欧盟: '110', 英国: '5', '胸围(cm)': '60-64', '肩宽(cm)': '32' },
      { 标准: '140', 中国: '140', '美国(S)': '6', 欧盟: '116', 英国: '6', '胸围(cm)': '64-68', '肩宽(cm)': '34' },
      { 标准: '150', 中国: '150', '美国(S)': '7', 欧盟: '122', 英国: '7', '胸围(cm)': '68-72', '肩宽(cm)': '36' },
      { 标准: '160', 中国: '160', '美国(S)': '8', 欧盟: '128', 英国: '8', '胸围(cm)': '72-76', '肩宽(cm)': '38' },
    ]
  }
  if (activeCategory.value === 'bottoms') {
    return [
      { 标准: '100', 中国: '100', 美国: '2T', 欧盟: '92', 英国: '2', '腰围(cm)': '48-50', '臀围(cm)': '52-54' },
      { 标准: '110', 中国: '110', 美国: '3T', 欧盟: '98', 英国: '3', '腰围(cm)': '50-52', '臀围(cm)': '54-56' },
      { 标准: '120', 中国: '120', 美国: '4T', 欧盟: '104', 英国: '4', '腰围(cm)': '52-55', '臀围(cm)': '58-62' },
      { 标准: '130', 中国: '130', 美国: '5', 欧盟: '110', 英国: '5', '腰围(cm)': '55-58', '臀围(cm)': '62-66' },
      { 标准: '140', 中国: '140', 美国: '6', 欧盟: '116', 英国: '6', '腰围(cm)': '58-61', '臀围(cm)': '66-70' },
      { 标准: '150', 中国: '150', 美国: '7', 欧盟: '122', 英国: '7', '腰围(cm)': '61-64', '臀围(cm)': '70-74' },
    ]
  }
  if (activeCategory.value === 'shoes') {
    return [
      { 标准: '26', '中国(欧码)': '26', '美国(男)': '9', '美国(女)': '9', 英国: '8.5', 日本: '16', '脚长(cm)': '16' },
      { 标准: '28', '中国(欧码)': '28', '美国(男)': '10', '美国(女)': '10', 英国: '9.5', 日本: '17', '脚长(cm)': '17' },
      { 标准: '30', '中国(欧码)': '30', '美国(男)': '11.5', '美国(女)': '11.5', 英国: '11', 日本: '18', '脚长(cm)': '18' },
      { 标准: '32', '中国(欧码)': '32', '美国(男)': '1', '美国(女)': '1', 英国: '13', 日本: '19.5', '脚长(cm)': '19.5' },
      { 标准: '34', '中国(欧码)': '34', '美国(男)': '2', '美国(女)': '2', 英国: '1', 日本: '21', '脚长(cm)': '21' },
      { 标准: '35', '中国(欧码)': '35', '美国(男)': '3', '美国(女)': '4', 英国: '2', 日本: '22', '脚长(cm)': '22' },
      { 标准: '36', '中国(欧码)': '36', '美国(男)': '4', '美国(女)': '5', 英国: '3', 日本: '23', '脚长(cm)': '23' },
    ]
  }
  // 袜子
  return [
    { 标准: 'S', 中国码: '14-16', 欧码: '14-16', '脚长范围(cm)': '14-16', '适合年龄': '1-3岁' },
    { 标准: 'M', 中国码: '16-19', 欧码: '16-19', '脚长范围(cm)': '16-19', '适合年龄': '3-6岁' },
    { 标准: 'L', 中国码: '19-22', 欧码: '19-22', '脚长范围(cm)': '19-22', '适合年龄': '6-10岁' },
    { 标准: 'XL', 中国码: '22-25', 欧码: '22-25', '脚长范围(cm)': '22-25', '适合年龄': '10-14岁' },
  ]
}

// ===== 推荐逻辑 =====
function isRecommended(row) {
  const chest = chestEstimate.value
  const waist = waistEstimate.value
  const h = height.value

  if (gender.value === 'child') {
    // 儿童按身高匹配
    const sizeNum = parseInt(row['标准'])
    if (!isNaN(sizeNum)) {
      return Math.abs(sizeNum - h) <= 5
    }
    return false
  }

  if (activeCategory.value === 'tops') {
    // 按胸围匹配
    const range = (row['胸围(cm)'] || '').split('-')
    if (range.length === 2) {
      const low = parseInt(range[0])
      const high = parseInt(range[1])
      return chest >= low && chest <= high + 2
    }
    return false
  }

  if (activeCategory.value === 'bottoms') {
    // 按腰围匹配
    const range = (row['腰围(cm)'] || '').split('-')
    if (range.length === 2) {
      const low = parseInt(range[0])
      const high = parseInt(range[1])
      return waist >= low && waist <= high + 2
    }
    return false
  }

  if (activeCategory.value === 'shoes') {
    // 鞋码需要额外输入，按身高粗略估算
    const footLength = gender.value === 'female'
      ? h * 0.15 + 1
      : h * 0.15 + 2
    const rowLength = parseFloat(row['脚长(cm)'])
    if (!isNaN(rowLength)) {
      return Math.abs(rowLength - footLength) <= 0.5
    }
    return false
  }

  // 袜子
  const footLength = gender.value === 'female' ? h * 0.15 + 1 : h * 0.15 + 2
  const range = (row['脚长范围(cm)'] || '').split('-')
  if (range.length === 2) {
    const low = parseFloat(range[0])
    const high = parseFloat(range[1])
    return footLength >= low && footLength <= high
  }
  return false
}

// ===== 购买建议 =====
const tips = computed(() => {
  const list = []
  if (gender.value === 'male' || gender.value === 'female') {
    list.push('不同品牌尺码标准存在差异，建议优先参考品牌官方尺码表。')
  }
  if (gender.value === 'child') {
    list.push('儿童生长较快，建议选择略大一号的尺码以延长穿着周期。')
  }
  if (activeCategory.value === 'bottoms') {
    list.push('裤子建议关注腰围和裤长，不同版型（修身/直筒/宽松）对尺码影响较大。')
  }
  if (activeCategory.value === 'shoes') {
    list.push('鞋子尺码仅根据身高粗略估算，建议实际测量脚长后对照选择。')
    list.push('运动鞋建议选大半码，正装鞋建议选标准码。')
  }
  if (parseFloat(bmiValue.value) > 28) {
    list.push('BMI偏高建议选择宽松版型或大一号尺码，穿着更舒适。')
  }
  list.push('国际网购时注意区分亚洲码和欧美码的差异，本文仅供参考。')
  return list
})

// ===== 复制结果 =====
function copyResult() {
  const cat = categoryTabs.find(t => t.id === activeCategory.value)?.label || ''
  const recommended = sizeRows.value.filter(isRecommended)
  const lines = [`【${cat}尺码推荐 - ${gender.value === 'male' ? '男' : gender.value === 'female' ? '女' : '儿童'}】`]
  lines.push(`身高: ${height.value}cm  体重: ${weight.value}kg  BMI: ${bmiValue.value}`)

  if (recommended.length > 0) {
    recommended.forEach(row => {
      const cols = tableColumns.value
      const line = cols.map(c => `${c}:${row[c]}`).join('  ')
      lines.push(line)
    })
  } else {
    lines.push('未找到精确匹配，请参考对照表选择最接近的尺码')
  }

  navigator.clipboard.writeText(lines.join('\n'))
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
  margin-bottom: 0.3rem;
}

.subtitle {
  color: #888;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
}

/* 输入区域 */
.input-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.2rem;
  margin-bottom: 1.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.input-group label {
  font-weight: 600;
  font-size: 0.95rem;
  color: #555;
}

.slider {
  -webkit-appearance: none;
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: #e9ecef;
  outline: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, #22c55e, #10b981);
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(34, 197, 94, 0.4);
}

.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #aaa;
}

.gender-toggle {
  display: flex;
  gap: 0;
  background: #e9ecef;
  border-radius: 8px;
  overflow: hidden;
}

.gender-toggle button {
  flex: 1;
  padding: 0.5rem 0.8rem;
  border: none;
  background: transparent;
  font-size: 0.9rem;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.gender-toggle button.active {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  font-weight: 600;
}

.select-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
}

.select-input:focus {
  outline: none;
  border-color: #10b981;
}

/* 品类切换 */
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

/* 结果区域 */
.result-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  margin-bottom: 1.5rem;
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

/* 体型指标 */
.body-info {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #fafafa;
  border-bottom: 1px solid #eee;
  flex-wrap: wrap;
}

.body-stat {
  flex: 1;
  min-width: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #999;
  text-transform: uppercase;
}

.stat-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: #2c3e50;
}

.stat-tag {
  padding: 0.15rem 0.6rem;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* 尺码对照表 */
.size-table-wrap {
  overflow-x: auto;
}

.size-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.size-table th,
.size-table td {
  padding: 0.6rem 0.8rem;
  border: 1px solid #eee;
  text-align: center;
}

.size-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #555;
  position: sticky;
  top: 0;
}

.size-table tr.recommended {
  background: #f0fdf4;
  border-left: 3px solid #22c55e;
}

.size-table tr.recommended td:first-child {
  color: #22c55e;
  font-weight: 700;
}

.recommend-badge {
  display: inline-block;
  padding: 0.1rem 0.4rem;
  background: #22c55e;
  color: white;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  margin-right: 0.3rem;
}

/* 身材可视化 */
.body-visual {
  padding: 1.2rem;
  border-top: 1px solid #eee;
}

.body-visual h3 {
  font-size: 1rem;
  color: #333;
  margin-bottom: 1rem;
}

.visual-row {
  display: flex;
  align-items: flex-end;
  gap: 2rem;
}

.visual-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}

.visual-bar-wrap {
  width: 40px;
  height: 150px;
  background: #f0f0f0;
  border-radius: 8px;
  position: relative;
  display: flex;
  align-items: flex-end;
}

.visual-bar {
  width: 100%;
  background: linear-gradient(to top, #22c55e, #10b981);
  border-radius: 8px 8px 0 0;
  transition: height 0.3s ease;
}

.visual-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
}

.visual-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-label {
  font-size: 0.85rem;
  color: #888;
  min-width: 40px;
}

.info-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: #2c3e50;
}

/* 购买建议 */
.tips-section {
  padding: 1.2rem;
  border-top: 1px solid #eee;
}

.tips-section h3 {
  font-size: 1rem;
  color: #333;
  margin-bottom: 0.8rem;
}

.tips-section p {
  font-size: 0.85rem;
  color: #666;
  line-height: 1.6;
  margin-bottom: 0.4rem;
}

.back-link {
  display: inline-block;
  margin-top: 1.5rem;
  color: #22c55e;
  font-weight: 500;
}

.back-link:hover { text-decoration: underline; }

@media (max-width: 640px) {
  .input-grid {
    grid-template-columns: 1fr;
  }
  .body-info {
    flex-direction: column;
    align-items: stretch;
  }
  .body-stat {
    flex-direction: row;
    justify-content: space-between;
  }
  .visual-row {
    flex-direction: column;
    align-items: center;
  }
}
</style>
