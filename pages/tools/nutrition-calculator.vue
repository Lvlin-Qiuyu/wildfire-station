<template>
  <div class="tool-page">
    <h2>🍎 每日营养摄入参考计算器</h2>
    <p class="subtitle">输入身高体重年龄性别，计算每日推荐热量(TDEE)，按三大营养素推荐比例，可视化展示</p>

    <!-- 输入区域 -->
    <div class="input-section">
      <div class="input-grid">
        <div class="input-group">
          <label>身高：<strong>{{ height }} cm</strong></label>
          <input type="range" v-model.number="height" min="100" max="250" step="1" class="slider" />
        </div>
        <div class="input-group">
          <label>体重：<strong>{{ weight }} kg</strong></label>
          <input type="range" v-model.number="weight" min="20" max="200" step="0.5" class="slider" />
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

      <div class="activity-section">
        <label>活动强度</label>
        <div class="activity-grid">
          <div v-for="act in activities" :key="act.id"
            :class="['activity-card', { active: activity === act.id }]"
            @click="activity = act.id">
            <span class="act-icon">{{ act.icon }}</span>
            <span class="act-name">{{ act.name }}</span>
            <span class="act-factor">×{{ act.factor }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 结果卡片 -->
    <div class="results-section">
      <h3>计算结果</h3>
      <div class="result-cards">
        <div class="result-card primary">
          <div class="card-label">BMR（基础代谢率）</div>
          <div class="card-value">{{ bmrValue }} kcal</div>
          <div class="card-sub">Mifflin-St Jeor公式</div>
        </div>
        <div class="result-card highlight">
          <div class="card-label">TDEE（每日总消耗）</div>
          <div class="card-value">{{ tdeeValue }} kcal</div>
          <div class="card-sub">包含活动消耗</div>
        </div>
        <div class="result-card">
          <div class="card-label">BMI</div>
          <div class="card-value" :style="{ color: bmiColor }">{{ bmiValue }}</div>
          <div class="card-sub" :style="{ color: bmiColor }">{{ bmiCategory }}</div>
        </div>
      </div>

      <!-- 营养素分配饼图 -->
      <div class="nutrition-chart">
        <div class="chart-left">
          <canvas ref="pieCanvas" width="200" height="200"></canvas>
          <div class="chart-center">
            <span class="center-label">每日</span>
            <span class="center-value">{{ tdeeValue }}</span>
            <span class="center-unit">kcal</span>
          </div>
        </div>
        <div class="chart-right">
          <h4>三大营养素分配</h4>
          <div v-for="nut in nutritionData" :key="nut.id" class="nutrition-item">
            <div class="nutrition-header">
              <span class="nutrition-name" :style="{ color: nut.color }">{{ nut.name }}</span>
              <span class="nutrition-pct">{{ nut.pct }}%</span>
            </div>
            <div class="nutrition-bar">
              <div class="nutrition-fill" :style="{ width: nut.pct + '%', background: nut.color }"></div>
            </div>
            <div class="nutrition-details">
              <span>{{ nut.calories }} kcal</span>
              <span>· {{ nut.grams }} g</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 每餐分配建议 -->
    <div class="meal-section">
      <h3>每餐热量分配建议</h3>
      <div class="meal-grid">
        <div v-for="meal in meals" :key="meal.id" class="meal-card">
          <div class="meal-icon">{{ meal.icon }}</div>
          <div class="meal-name">{{ meal.name }}</div>
          <div class="meal-calories">{{ Math.round(tdeeValue * meal.pct / 100) }} kcal</div>
          <div class="meal-pct">{{ meal.pct }}%</div>
        </div>
      </div>
    </div>

    <!-- 健康建议 -->
    <div class="advice-section">
      <h3>💡 健康建议</h3>
      <p v-for="(tip, i) in healthTips" :key="i">{{ tip }}</p>
    </div>

    <!-- 公式说明 -->
    <div class="formula-section">
      <h3>📐 计算公式</h3>
      <div class="formula-block">
        <code>BMR（男）= 10 × 体重 + 6.25 × 身高 - 5 × 年龄 + 5</code><br />
        <code>BMR（女）= 10 × 体重 + 6.25 × 身高 - 5 × 年龄 - 161</code><br />
        <code>TDEE = BMR × 活动系数</code>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '每日营养摄入参考计算器 - 野火小站' })

const pieCanvas = ref(null)
const height = ref(170)
const weight = ref(65)
const age = ref(25)
const gender = ref('male')
const activity = ref('moderate')

// 活动强度定义
const activities = [
  { id: 'sedentary', name: '久坐不动', icon: '🪑', factor: 1.2 },
  { id: 'light', name: '轻度运动', icon: '🚶', factor: 1.375 },
  { id: 'moderate', name: '中度运动', icon: '🏃', factor: 1.55 },
  { id: 'active', name: '高强度运动', icon: '🏋️', factor: 1.725 },
  { id: 'very-active', name: '专业运动员', icon: '🏆', factor: 1.9 },
]

// 每餐分配
const meals = [
  { id: 'breakfast', name: '早餐', icon: '🍳', pct: 25 },
  { id: 'lunch', name: '午餐', icon: '🍱', pct: 40 },
  { id: 'dinner', name: '晚餐', icon: '🍲', pct: 30 },
  { id: 'snack', name: '加餐', icon: '🍎', pct: 5 },
]

// 计算BMR（Mifflin-St Jeor公式）
const bmrValue = computed(() => {
  const h = height.value
  const w = weight.value
  const a = age.value
  if (gender.value === 'male') {
    return (10 * w + 6.25 * h - 5 * a + 5).toFixed(0)
  }
  return (10 * w + 6.25 * h - 5 * a - 161).toFixed(0)
})

// 获取活动系数
const activityFactor = computed(() => {
  return activities.find(a => a.id === activity.value)?.factor || 1.55
})

// TDEE
const tdeeValue = computed(() => {
  return (parseFloat(bmrValue.value) * activityFactor.value).toFixed(0)
})

// BMI
const bmiValue = computed(() => {
  const h = height.value / 100
  return (weight.value / (h * h)).toFixed(1)
})

const bmiCategory = computed(() => {
  const v = parseFloat(bmiValue.value)
  if (v < 18.5) return '偏瘦'
  if (v < 24) return '正常'
  if (v < 28) return '偏胖'
  return '肥胖'
})

const bmiColor = computed(() => {
  const v = parseFloat(bmiValue.value)
  if (v < 18.5) return '#3b82f6'
  if (v < 24) return '#22c55e'
  if (v < 28) return '#f59e0b'
  return '#ef4444'
})

// 三大营养素分配（碳水50%，蛋白质30%，脂肪20%）
const nutritionData = computed(() => {
  const tdee = parseFloat(tdeeValue.value)
  return [
    {
      id: 'carbs',
      name: '碳水化合物',
      color: '#3b82f6',
      pct: 50,
      calories: Math.round(tdee * 0.5),
      grams: Math.round(tdee * 0.5 / 4), // 4 kcal/g
    },
    {
      id: 'protein',
      name: '蛋白质',
      color: '#22c55e',
      pct: 30,
      calories: Math.round(tdee * 0.3),
      grams: Math.round(tdee * 0.3 / 4), // 4 kcal/g
    },
    {
      id: 'fat',
      name: '脂肪',
      color: '#f59e0b',
      pct: 20,
      calories: Math.round(tdee * 0.2),
      grams: Math.round(tdee * 0.2 / 9), // 9 kcal/g
    },
  ]
})

// 健康建议
const healthTips = computed(() => {
  const tips = [
    `保持均衡饮食，每日摄入约 ${tdeeValue.value} 千卡热量。`,
    `碳水化合物推荐每日约 ${nutritionData.value[0].grams} 克，选择全谷物和复合碳水。`,
    `蛋白质推荐每日约 ${nutritionData.value[1].grams} 克，有助于维持肌肉量和饱腹感。`,
    `脂肪推荐每日约 ${nutritionData.value[2].grams} 克，优先选择健康脂肪（如坚果、橄榄油、鱼类）。`,
  ]
  if (parseFloat(bmiValue.value) < 18.5) {
    tips.push('你的BMI偏轻，建议适当增加营养摄入，结合力量训练增加肌肉量。')
  } else if (parseFloat(bmiValue.value) > 24) {
    tips.push('你的BMI偏高，建议控制总热量摄入，增加蔬菜和蛋白质比例。')
  }
  return tips
})

// 绘制饼图
function drawPieChart() {
  const canvas = pieCanvas.value
  if (!canvas) return

  const dpr = window.devicePixelRatio || 1
  canvas.width = 200 * dpr
  canvas.height = 200 * dpr
  canvas.style.width = '200px'
  canvas.style.height = '200px'

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, 200, 200)

  const cx = 100, cy = 100, r = 80
  const data = nutritionData.value
  let startAngle = -Math.PI / 2

  data.forEach(nut => {
    const sliceAngle = (nut.pct / 100) * Math.PI * 2
    const endAngle = startAngle + sliceAngle

    // 扇形
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r, startAngle, endAngle)
    ctx.closePath()
    ctx.fillStyle = nut.color
    ctx.fill()

    startAngle = endAngle
  })

  // 中心圆（环形图效果）
  ctx.beginPath()
  ctx.arc(cx, cy, 55, 0, Math.PI * 2)
  ctx.fillStyle = 'white'
  ctx.fill()
}

// 监听数据变化
watch([height, weight, age, gender, activity], () => {
  nextTick(drawPieChart)
})

onMounted(() => {
  drawPieChart()
})
</script>

<style scoped>
.tool-page { padding-top: 0.5rem; }
h2 { font-size: 1.6rem; margin-bottom: 0.3rem; }
.subtitle { color: #888; font-size: 0.95rem; margin-bottom: 1.5rem; }
h3 { font-size: 1.05rem; margin-bottom: 0.8rem; color: #333; }

/* 输入区域 */
.input-section { background: white; border-radius: 12px; padding: 1.5rem; border: 1px solid #eee; margin-bottom: 1.5rem; }
.input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2rem; margin-bottom: 1.5rem; }
.input-group { display: flex; flex-direction: column; gap: 0.4rem; }
.input-group label { font-weight: 600; font-size: 0.95rem; color: #555; }
.slider {
  -webkit-appearance: none; width: 100%; height: 8px; border-radius: 4px;
  background: #e9ecef; outline: none;
}
.slider::-webkit-slider-thumb {
  -webkit-appearance: none; width: 22px; height: 22px; border-radius: 50%;
  background: linear-gradient(135deg, #22c55e, #10b981); cursor: pointer;
}
.num-input {
  padding: 0.5rem 0.75rem; border: 1px solid #ddd; border-radius: 8px;
  font-size: 0.95rem; background: white; width: 100%;
}
.num-input:focus { outline: none; border-color: #10b981; }
.gender-toggle {
  display: flex; gap: 0; background: #e9ecef; border-radius: 8px; overflow: hidden;
}
.gender-toggle button {
  flex: 1; padding: 0.5rem 1rem; border: none; background: transparent;
  font-size: 0.95rem; cursor: pointer; color: #666; transition: all 0.2s;
}
.gender-toggle button.active { background: linear-gradient(135deg, #22c55e, #10b981); color: white; font-weight: 600; }

/* 活动强度 */
.activity-section label { display: block; font-weight: 600; font-size: 0.9rem; margin-bottom: 0.6rem; color: #555; }
.activity-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.6rem; }
.activity-card {
  text-align: center; padding: 0.8rem 0.5rem; border: 2px solid #e0e0e0;
  border-radius: 10px; cursor: pointer; transition: all 0.2s; background: white;
}
.activity-card:hover { border-color: #22c55e; background: #f0fdf4; }
.activity-card.active { border-color: #22c55e; background: #dcfce7; }
.act-icon { font-size: 1.5rem; display: block; margin-bottom: 0.3rem; }
.act-name { font-size: 0.8rem; color: #555; display: block; margin-bottom: 0.2rem; }
.act-factor { font-size: 0.75rem; color: #888; }

/* 结果卡片 */
.results-section { margin-bottom: 1.5rem; }
.result-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
.result-card {
  background: white; border: 1px solid #eee; border-radius: 12px;
  padding: 1.2rem; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.result-card.primary { border-color: #3b82f6; background: linear-gradient(135deg, #eff6ff, #f0f9ff); }
.result-card.highlight { border-color: #22c55e; background: linear-gradient(135deg, #f0fdf4, #ecfdf5); }
.card-label { font-size: 0.85rem; color: #888; margin-bottom: 0.3rem; }
.card-value { font-size: 1.5rem; font-weight: 700; color: #2c3e50; }
.card-sub { font-size: 0.75rem; color: #aaa; margin-top: 0.2rem; }

/* 营养图表 */
.nutrition-chart {
  background: white; border-radius: 12px; padding: 1.5rem;
  border: 1px solid #eee; display: flex; gap: 2rem; align-items: center;
}
.chart-left { position: relative; flex-shrink: 0; }
.chart-center {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  text-align: center;
}
.center-label { display: block; font-size: 0.7rem; color: #888; }
.center-value { display: block; font-size: 1.3rem; font-weight: 700; color: #333; }
.center-unit { font-size: 0.7rem; color: #888; }
.chart-right { flex: 1; }
.chart-right h4 { font-size: 0.95rem; margin-bottom: 1rem; color: #333; }
.nutrition-item { margin-bottom: 1rem; }
.nutrition-header { display: flex; justify-content: space-between; margin-bottom: 0.3rem; }
.nutrition-name { font-weight: 600; font-size: 0.9rem; }
.nutrition-pct { font-weight: 700; font-size: 0.9rem; }
.nutrition-bar { height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; margin-bottom: 0.3rem; }
.nutrition-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
.nutrition-details { font-size: 0.8rem; color: #666; }

/* 每餐分配 */
.meal-section { margin-bottom: 1.5rem; }
.meal-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.8rem; }
.meal-card {
  background: white; border: 1px solid #eee; border-radius: 10px;
  padding: 1rem; text-align: center; transition: all 0.2s;
}
.meal-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.meal-icon { font-size: 1.8rem; display: block; margin-bottom: 0.4rem; }
.meal-name { font-size: 0.85rem; color: #555; margin-bottom: 0.3rem; }
.meal-calories { font-size: 1.1rem; font-weight: 700; color: #22c55e; }
.meal-pct { font-size: 0.75rem; color: #888; }

/* 建议和公式 */
.advice-section {
  background: #f8fff8; border-left: 4px solid #22c55e; border-radius: 0 12px 12px 0;
  padding: 1.2rem 1.5rem; margin-bottom: 1.5rem;
}
.advice-section p { font-size: 0.9rem; color: #555; margin-bottom: 0.4rem; line-height: 1.6; }
.formula-section { margin-bottom: 2rem; }
.formula-block {
  background: #1a1a2e; border-radius: 10px; padding: 1.2rem;
}
.formula-block code {
  display: block; color: #a5d6a7; font-family: monospace;
  font-size: 0.9rem; line-height: 1.8;
}

.back-link { display: inline-block; margin-top: 2rem; color: #22c55e; font-weight: 500; }
.back-link:hover { text-decoration: underline; }

@media (max-width: 768px) {
  .input-grid { grid-template-columns: 1fr; }
  .activity-grid { grid-template-columns: repeat(3, 1fr); }
  .result-cards { grid-template-columns: 1fr; }
  .nutrition-chart { flex-direction: column; }
  .meal-grid { grid-template-columns: 1fr 1fr; }
}
</style>