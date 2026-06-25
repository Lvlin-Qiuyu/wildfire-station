<template>
  <div class="tool-page">
    <h2>⚖️ BMI 与健康指标计算器</h2>
    <p class="subtitle">输入身高体重，计算 BMI、基础代谢率和每日所需热量</p>

    <!-- 输入区域 -->
    <div class="input-grid">
      <div class="input-group">
        <label>身高：<strong>{{ height }} cm</strong></label>
        <input type="range" v-model.number="height" min="100" max="250" step="1" class="slider" />
        <div class="range-labels">
          <span>100</span><span>250</span>
        </div>
      </div>
      <div class="input-group">
        <label>体重：<strong>{{ weight }} kg</strong></label>
        <input type="range" v-model.number="weight" min="20" max="200" step="0.5" class="slider" />
        <div class="range-labels">
          <span>20</span><span>200</span>
        </div>
      </div>
      <div class="input-group">
        <label>年龄</label>
        <input type="number" v-model.number="age" min="1" max="120" class="num-input" />
      </div>
      <div class="input-group">
        <label>性别</label>
        <div class="gender-toggle">
          <button :class="{ active: gender === 'male' }" @click="gender = 'male'">👨 男</button>
          <button :class="{ active: gender === 'female' }" @click="gender = 'female'">👩 女</button>
        </div>
      </div>
    </div>

    <!-- BMI 仪表盘 -->
    <div class="dashboard-section">
      <div class="gauge-wrapper">
        <canvas ref="gaugeCanvas" width="400" height="240"></canvas>
      </div>
      <div class="bmi-value" :style="{ color: bmiColor }">
        {{ bmiValue }}
      </div>
      <div class="bmi-category" :style="{ color: bmiColor }">
        {{ bmiCategory }}
      </div>
    </div>

    <!-- 结果卡片 -->
    <div class="result-cards">
      <div class="result-card">
        <div class="card-label">BMI 值</div>
        <div class="card-value" :style="{ color: bmiColor }">{{ bmiValue }}</div>
        <div class="card-sub">{{ bmiCategory }}</div>
      </div>
      <div class="result-card">
        <div class="card-label">理想体重范围</div>
        <div class="card-value">{{ idealWeightRange }}</div>
        <div class="card-sub">BMI 18.5 ~ 24.9</div>
      </div>
      <div class="result-card">
        <div class="card-label">基础代谢率 (BMR)</div>
        <div class="card-value">{{ bmrValue }}</div>
        <div class="card-sub">Mifflin-St Jeor 公式</div>
      </div>
      <div class="result-card">
        <div class="card-label">每日所需热量</div>
        <div class="card-value">{{ tdeeValue }}</div>
        <div class="card-sub">中等运动量估算</div>
      </div>
    </div>

    <!-- 每日热量细分 -->
    <div class="tdee-breakdown">
      <h3>每日热量需求（按运动量）</h3>
      <div class="breakdown-grid">
        <div v-for="item in tdeeBreakdown" :key="item.label" class="breakdown-item">
          <span class="breakdown-label">{{ item.label }}</span>
          <span class="breakdown-val">{{ item.value }}</span>
          <span class="breakdown-unit">kcal</span>
        </div>
      </div>
    </div>

    <!-- 健康建议 -->
    <div class="advice-section" :style="{ borderLeftColor: bmiColor }">
      <h3>💡 健康建议</h3>
      <p v-for="(tip, i) in healthTips" :key="i">{{ tip }}</p>
    </div>

    <!-- 公式说明 -->
    <div class="formula-section">
      <h3>📐 计算公式</h3>
      <div class="formula-block">
        <code>BMI = 体重(kg) / 身高(m)²</code><br />
        <code>男性 BMR = 10 × 体重 + 6.25 × 身高 - 5 × 年龄 + 5</code><br />
        <code>女性 BMR = 10 × 体重 + 6.25 × 身高 - 5 × 年龄 - 161</code>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'BMI与健康指标计算器 - 野火小站' })

const height = ref(170)
const weight = ref(65)
const age = ref(25)
const gender = ref('male')
const gaugeCanvas = ref(null)

// BMI 计算
const bmiValue = computed(() => {
  const h = height.value / 100
  const val = weight.value / (h * h)
  return val.toFixed(1)
})

// BMI 分类
const bmiCategory = computed(() => {
  const v = parseFloat(bmiValue.value)
  if (v < 18.5) return '偏瘦'
  if (v < 24) return '正常'
  if (v < 28) return '偏胖'
  return '肥胖'
})

// BMI 对应颜色
const bmiColor = computed(() => {
  const v = parseFloat(bmiValue.value)
  if (v < 18.5) return '#3498db'
  if (v < 24) return '#22c55e'
  if (v < 28) return '#f39c12'
  return '#e74c3c'
})

// 理想体重范围
const idealWeightRange = computed(() => {
  const h = height.value / 100
  const low = (18.5 * h * h).toFixed(1)
  const high = (24.9 * h * h).toFixed(1)
  return `${low} - ${high} kg`
})

// BMR 计算（Mifflin-St Jeor 公式）
const bmrValue = computed(() => {
  const h = height.value
  const w = weight.value
  const a = age.value
  if (gender.value === 'male') {
    return (10 * w + 6.25 * h - 5 * a + 5).toFixed(0)
  }
  return (10 * w + 6.25 * h - 5 * a - 161).toFixed(0)
})

// TDEE（每日总能量消耗，中等运动量系数 1.55）
const tdeeValue = computed(() => {
  return (parseFloat(bmrValue.value) * 1.55).toFixed(0)
})

// 不同运动量的 TDEE
const tdeeBreakdown = computed(() => {
  const bmr = parseFloat(bmrValue.value)
  return [
    { label: '久坐不动', value: (bmr * 1.2).toFixed(0) },
    { label: '轻度运动', value: (bmr * 1.375).toFixed(0) },
    { label: '中度运动', value: (bmr * 1.55).toFixed(0) },
    { label: '高强度运动', value: (bmr * 1.725).toFixed(0) },
    { label: '专业运动员', value: (bmr * 1.9).toFixed(0) },
  ]
})

// 健康建议
const healthTips = computed(() => {
  const v = parseFloat(bmiValue.value)
  if (v < 18.5) {
    return [
      '你的 BMI 偏低，建议适当增加营养摄入。',
      '多食用高蛋白食物（鸡蛋、牛奶、鱼肉、豆类），帮助增加体重。',
      '配合适量力量训练，有助于增加肌肉量。',
      '建议定期体检，排除甲状腺功能亢进等疾病。',
    ]
  }
  if (v < 24) {
    return [
      '你的 BMI 在正常范围内，继续保持健康的生活方式！',
      '建议每周进行 150 分钟以上中等强度有氧运动。',
      '保持均衡饮食，注意蔬果摄入和充足睡眠。',
      '定期监测体重变化，预防肥胖趋势。',
    ]
  }
  if (v < 28) {
    return [
      '你的 BMI 偏高，建议适当控制饮食并增加运动。',
      '减少高油、高糖、高热量食物的摄入。',
      '每天保持 30 分钟以上有氧运动（快走、跑步、游泳等）。',
      '逐步减重，建议每周减少 0.5~1 kg 为宜，避免极端节食。',
    ]
  }
  return [
    '你的 BMI 较高，建议尽快咨询医生或营养师制定健康计划。',
    '严格控制饮食热量，减少精制碳水和高脂肪食物。',
    '从低强度运动开始（散步、游泳），循序渐进增加运动量。',
    '关注血压、血糖、血脂等指标，预防慢性疾病。',
  ]
})

// 绘制 BMI 仪表盘
function drawGauge() {
  const canvas = gaugeCanvas.value
  if (!canvas) return

  const dpr = window.devicePixelRatio || 1
  const w = 400
  const h = 240
  canvas.width = w * dpr
  canvas.height = h * dpr
  canvas.style.width = w + 'px'
  canvas.style.height = h + 'px'

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, w, h)

  const cx = w / 2
  const cy = h - 30
  const outerR = 170
  const innerR = 130
  const startAngle = Math.PI
  const endAngle = 2 * Math.PI

  // BMI 分区
  const zones = [
    { from: 0, to: 18.5, color: '#3498db', label: '偏瘦' },
    { from: 18.5, to: 24, color: '#22c55e', label: '正常' },
    { from: 24, to: 28, color: '#f39c12', label: '偏胖' },
    { from: 28, to: 45, color: '#e74c3c', label: '肥胖' },
  ]

  // 绘制彩色弧
  zones.forEach(zone => {
    const sA = startAngle + (zone.from / 45) * Math.PI
    const eA = startAngle + (Math.min(zone.to, 45) / 45) * Math.PI
    ctx.beginPath()
    ctx.arc(cx, cy, outerR, sA, eA)
    ctx.arc(cx, cy, innerR, eA, sA, true)
    ctx.closePath()
    ctx.fillStyle = zone.color + '30'
    ctx.fill()

    // 分区标签
    const midA = (sA + eA) / 2
    const labelR = (outerR + innerR) / 2
    const lx = cx + labelR * Math.cos(midA)
    const ly = cy + labelR * Math.sin(midA)
    ctx.fillStyle = zone.color
    ctx.font = 'bold 12px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(zone.label, lx, ly)
  })

  // 指针
  const bmi = parseFloat(bmiValue.value)
  const clampedBmi = Math.max(10, Math.min(45, bmi))
  const needleAngle = startAngle + (clampedBmi / 45) * Math.PI
  const needleLen = outerR - 10

  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx + needleLen * Math.cos(needleAngle), cy + needleLen * Math.sin(needleAngle))
  ctx.strokeStyle = bmiColor.value
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.stroke()

  // 中心圆
  ctx.beginPath()
  ctx.arc(cx, cy, 8, 0, Math.PI * 2)
  ctx.fillStyle = bmiColor.value
  ctx.fill()

  // 刻度标签
  const ticks = [10, 15, 18.5, 24, 28, 35, 45]
  ticks.forEach(t => {
    const a = startAngle + (t / 45) * Math.PI
    const tx = cx + (outerR + 18) * Math.cos(a)
    const ty = cy + (outerR + 18) * Math.sin(a)
    ctx.fillStyle = '#888'
    ctx.font = '11px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(t.toString(), tx, ty)

    // 小刻度线
    const t1x = cx + outerR * Math.cos(a)
    const t1y = cy + outerR * Math.sin(a)
    const t2x = cx + (outerR + 5) * Math.cos(a)
    const t2y = cy + (outerR + 5) * Math.sin(a)
    ctx.beginPath()
    ctx.moveTo(t1x, t1y)
    ctx.lineTo(t2x, t2y)
    ctx.strokeStyle = '#ccc'
    ctx.lineWidth = 1
    ctx.stroke()
  })
}

// 监听数据变化，重新绘制仪表盘
watch([height, weight, gender, age], () => {
  nextTick(drawGauge)
})

onMounted(() => {
  drawGauge()
})
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

/* 输入区域 */
.input-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.2rem;
  margin-bottom: 2rem;
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
  transition: background 0.2s;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, #22c55e, #10b981);
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(34, 197, 94, 0.4);
  transition: transform 0.15s;
}

.slider::-webkit-slider-thumb:active {
  transform: scale(1.15);
}

.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #aaa;
}

.num-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  background: white;
  width: 100%;
  max-width: 120px;
}

.num-input:focus {
  outline: none;
  border-color: #10b981;
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
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  font-size: 0.95rem;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.gender-toggle button.active {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  font-weight: 600;
}

/* 仪表盘区域 */
.dashboard-section {
  text-align: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #fafafa;
  border-radius: 12px;
  border: 1px solid #eee;
}

.gauge-wrapper {
  display: flex;
  justify-content: center;
}

.bmi-value {
  font-size: 2.5rem;
  font-weight: 800;
  margin-top: -0.5rem;
}

.bmi-category {
  font-size: 1.1rem;
  font-weight: 600;
  margin-top: 0.2rem;
}

/* 结果卡片 */
.result-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.result-card {
  background: white;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 1.2rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.card-label {
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 0.3rem;
}

.card-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
}

.card-sub {
  font-size: 0.75rem;
  color: #aaa;
  margin-top: 0.2rem;
}

/* 热量细分 */
.tdee-breakdown {
  margin-bottom: 2rem;
}

.tdee-breakdown h3 {
  font-size: 1.05rem;
  margin-bottom: 0.8rem;
  color: #333;
}

.breakdown-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.6rem;
}

.breakdown-item {
  background: white;
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 0.8rem 0.5rem;
  text-align: center;
}

.breakdown-label {
  display: block;
  font-size: 0.75rem;
  color: #888;
  margin-bottom: 0.3rem;
}

.breakdown-val {
  display: block;
  font-size: 1.2rem;
  font-weight: 700;
  color: #2c3e50;
}

.breakdown-unit {
  font-size: 0.7rem;
  color: #aaa;
}

/* 健康建议 */
.advice-section {
  background: #f8fff8;
  border-left: 4px solid #22c55e;
  border-radius: 0 12px 12px 0;
  padding: 1.2rem 1.5rem;
  margin-bottom: 2rem;
}

.advice-section h3 {
  font-size: 1.05rem;
  margin-bottom: 0.8rem;
  color: #333;
}

.advice-section p {
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

/* 公式说明 */
.formula-section {
  margin-bottom: 2rem;
}

.formula-section h3 {
  font-size: 1.05rem;
  margin-bottom: 0.8rem;
  color: #333;
}

.formula-block {
  background: #1a1a2e;
  border-radius: 10px;
  padding: 1.2rem;
}

.formula-block code {
  display: block;
  color: #a5d6a7;
  font-family: monospace;
  font-size: 0.9rem;
  line-height: 1.8;
}

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #22c55e;
  font-weight: 500;
}

.back-link:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .input-grid {
    grid-template-columns: 1fr;
  }
  .result-cards {
    grid-template-columns: 1fr;
  }
  .breakdown-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .gauge-wrapper canvas {
    width: 320px !important;
    height: 200px !important;
  }
}
</style>
