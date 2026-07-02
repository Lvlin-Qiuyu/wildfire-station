<template>
  <div class="tool-page">
    <h2>📊 百分比全能计算器</h2>
    <p class="tool-desc">多种百分比计算模式，输入即出结果，公式一目了然</p>

    <!-- 模式1: X是Y的百分之几 -->
    <div class="calc-card">
      <h3>1️⃣ X 是 Y 的百分之几？</h3>
      <div class="calc-row">
        <input v-model.number="m1.x" type="number" placeholder="X" class="input-num" />
        <span class="calc-label">是</span>
        <input v-model.number="m1.y" type="number" placeholder="Y" class="input-num" />
        <span class="calc-label">的</span>
        <span class="result-tag">{{ m1Result }}</span>
      </div>
      <div class="formula">公式：<code>{{ m1.x ?? 0 }} ÷ {{ m1.y ?? 0 }} × 100% = {{ m1Result }}</code></div>
    </div>

    <!-- 模式2: X的百分之N是多少 -->
    <div class="calc-card">
      <h3>2️⃣ X 的百分之 N 是多少？</h3>
      <div class="calc-row">
        <input v-model.number="m2.x" type="number" placeholder="X" class="input-num" />
        <span class="calc-label">的百分之</span>
        <input v-model.number="m2.n" type="number" placeholder="N" class="input-num" />
        <span class="calc-label">=</span>
        <span class="result-tag">{{ m2Result }}</span>
      </div>
      <div class="formula">公式：<code>{{ m2.x ?? 0 }} × {{ m2.n ?? 0 }}% = {{ m2Result }}</code></div>
    </div>

    <!-- 模式3: 百分比增减 -->
    <div class="calc-card">
      <h3>3️⃣ 百分比增减</h3>
      <div class="calc-row">
        <input v-model.number="m3.x" type="number" placeholder="原值" class="input-num" />
        <span class="calc-label">增加 / 减少</span>
        <input v-model.number="m3.n" type="number" placeholder="N" class="input-num" />
        <span class="calc-label">%</span>
      </div>
      <div class="dual-result">
        <div class="result-item increase">
          <span class="result-label">增加后</span>
          <span class="result-value">{{ m3Increase }}</span>
        </div>
        <div class="result-item decrease">
          <span class="result-label">减少后</span>
          <span class="result-value">{{ m3Decrease }}</span>
        </div>
      </div>
      <div class="formula">公式：<code>{{ m3.x ?? 0 }} × (1 ± {{ m3.n ?? 0 }}%)</code></div>
    </div>

    <!-- 模式4: 含税/不含税互算 -->
    <div class="calc-card">
      <h3>4️⃣ 含税/不含税价格互算</h3>
      <div class="calc-row">
        <input v-model.number="m4.price" type="number" placeholder="金额" class="input-num" />
        <span class="calc-label">税率</span>
        <input v-model.number="m4.tax" type="number" placeholder="13" class="input-num" />
        <span class="calc-label">%</span>
      </div>
      <div class="dual-result">
        <div class="result-item">
          <span class="result-label">不含税 → 含税</span>
          <span class="result-value">{{ m4ToTaxed }}</span>
          <button class="btn-copy-sm" @click="copy(m4ToTaxed)">复制</button>
        </div>
        <div class="result-item">
          <span class="result-label">含税 → 不含税</span>
          <span class="result-value">{{ m4ToUntaxed }}</span>
          <button class="btn-copy-sm" @click="copy(m4ToUntaxed)">复制</button>
        </div>
      </div>
      <div class="formula">
        <div>含税 = 不含税 × (1 + 税率%)</div>
        <div>不含税 = 含税 ÷ (1 + 税率%)</div>
        <div v-if="m4.price && m4.tax">税额：<code>{{ m4TaxAmount }}</code></div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '百分比全能计算器 - 野火小站' })

const fmt = (v) => {
  if (v === null || v === undefined || isNaN(v)) return '-'
  return Number.isInteger(v) ? v.toLocaleString() : v.toFixed(4).replace(/\.?0+$/, '')
}

const pctFmt = (v) => {
  if (v === null || v === undefined || isNaN(v)) return '-'
  return v.toFixed(2) + '%'
}

// 模式1: X是Y的百分之几
const m1 = reactive({ x: null, y: null })
const m1Result = computed(() => {
  if (m1.x == null || m1.y == null || m1.y === 0) return '-'
  return pctFmt((m1.x / m1.y) * 100)
})

// 模式2: X的百分之N是多少
const m2 = reactive({ x: null, n: null })
const m2Result = computed(() => {
  if (m2.x == null || m2.n == null) return '-'
  return fmt(m2.x * (m2.n / 100))
})

// 模式3: 百分比增减
const m3 = reactive({ x: null, n: null })
const m3Increase = computed(() => {
  if (m3.x == null || m3.n == null) return '-'
  return fmt(m3.x * (1 + m3.n / 100))
})
const m3Decrease = computed(() => {
  if (m3.x == null || m3.n == null) return '-'
  return fmt(m3.x * (1 - m3.n / 100))
})

// 模式4: 含税/不含税互算
const m4 = reactive({ price: null, tax: 13 })
const m4ToTaxed = computed(() => {
  if (m4.price == null || !m4.tax) return '-'
  return fmt(m4.price * (1 + m4.tax / 100))
})
const m4ToUntaxed = computed(() => {
  if (m4.price == null || !m4.tax) return '-'
  return fmt(m4.price / (1 + m4.tax / 100))
})
const m4TaxAmount = computed(() => {
  if (m4.price == null || !m4.tax) return '-'
  const untaxed = m4.price / (1 + m4.tax / 100)
  return fmt(m4.price - untaxed)
})

const copyMsg = ref('')
function copy(text) {
  navigator.clipboard.writeText(text).then(() => {
    copyMsg.value = '已复制'
    setTimeout(() => { copyMsg.value = '' }, 1500)
  })
}
</script>

<style scoped>
.tool-page {
  padding-top: 0.5rem;
}

h2 {
  font-size: 1.6rem;
  margin-bottom: 0.5rem;
}

h3 {
  font-size: 1.05rem;
  margin-bottom: 1rem;
  color: #333;
}

.tool-desc {
  color: #666;
  margin-bottom: 1.5rem;
}

.calc-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border: 1px solid #eee;
}

.calc-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-bottom: 0.8rem;
}

.input-num {
  width: 120px;
  padding: 0.6rem 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.input-num:focus {
  border-color: #22c55e;
}

.calc-label {
  color: #666;
  font-size: 0.95rem;
  white-space: nowrap;
}

.result-tag {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1rem;
  white-space: nowrap;
}

.dual-result {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
  margin-bottom: 0.8rem;
}

.result-item {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 1rem;
  text-align: center;
  position: relative;
}

.result-item.increase {
  background: #f0fdf4;
}

.result-item.decrease {
  background: #fef2f2;
}

.result-label {
  display: block;
  font-size: 0.8rem;
  color: #888;
  margin-bottom: 0.3rem;
}

.result-value {
  display: block;
  font-size: 1.4rem;
  font-weight: 700;
  color: #22c55e;
}

.result-item.decrease .result-value {
  color: #ef4444;
}

.btn-copy-sm {
  margin-top: 0.5rem;
  padding: 0.25rem 0.8rem;
  background: #22c55e;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.formula {
  font-size: 0.85rem;
  color: #888;
  line-height: 1.8;
}

.formula code {
  background: #f0fdf4;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  color: #16a34a;
  font-family: monospace;
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
  .calc-row {
    flex-direction: column;
    align-items: stretch;
  }
  .input-num {
    width: 100%;
  }
  .dual-result {
    grid-template-columns: 1fr;
  }
}
</style>
