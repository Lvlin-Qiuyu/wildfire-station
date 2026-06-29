<template>
  <div class="tool-page">
    <h2>📐 万能单位换算器</h2>
    <p class="subtitle">7大分类、100+单位，实时精确换算</p>

    <!-- 分类选择 -->
    <div class="category-tabs">
      <button v-for="cat in categories" :key="cat.id" :class="{ active: currentCategory === cat.id }"
        @click="switchCategory(cat.id)">{{ cat.icon }} {{ cat.name }}</button>
    </div>

    <!-- 换算区域 -->
    <div class="converter-card">
      <div class="input-group">
        <label>数值</label>
        <input type="number" v-model.number="inputValue" placeholder="输入数值" class="num-input" />
      </div>

      <div class="unit-row">
        <div class="unit-select">
          <label>源单位</label>
          <select v-model="fromUnit">
            <option v-for="u in currentUnits" :key="u.value" :value="u.value">{{ u.label }} ({{ u.symbol }})</option>
          </select>
        </div>
        <button class="btn-swap" @click="swapUnits">⇄</button>
        <div class="unit-select">
          <label>目标单位</label>
          <select v-model="toUnit">
            <option v-for="u in currentUnits" :key="u.value" :value="u.value">{{ u.label }} ({{ u.symbol }})</option>
          </select>
        </div>
      </div>

      <!-- 结果 -->
      <div class="result-area">
        <div class="result-value" :class="{ zero: !inputValue }">
          {{ inputValue ? formatResult(result) : '—' }}
        </div>
        <div class="result-formula" v-if="inputValue">
          {{ formatNumber(inputValue) }} {{ getUnitSymbol(fromUnit) }} = {{ formatResult(result) }} {{ getUnitSymbol(toUnit) }}
        </div>
      </div>

      <!-- 快捷参考 -->
      <div class="quick-ref" v-if="inputValue">
        <h4>其他常用换算</h4>
        <div class="ref-list">
          <div v-for="u in quickUnits" :key="u.value" class="ref-item" @click="toUnit = u.value">
            <span class="ref-target">{{ formatResult(convert(inputValue, fromUnit, u.value)) }}</span>
            <span class="ref-label">{{ u.label }} ({{ u.symbol }})</span>
          </div>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '万能单位换算器 - 野火小站' })

const inputValue = ref(1)
const fromUnit = ref('')
const toUnit = ref('')
const currentCategory = ref('length')

// ============ 单位数据定义 ============

const unitData = {
  length: {
    name: '长度', icon: '📏',
    units: [
      { value: 'mm', label: '毫米', symbol: 'mm', toBase: 0.001 },
      { value: 'cm', label: '厘米', symbol: 'cm', toBase: 0.01 },
      { value: 'dm', label: '分米', symbol: 'dm', toBase: 0.1 },
      { value: 'm', label: '米', symbol: 'm', toBase: 1 },
      { value: 'km', label: '千米', symbol: 'km', toBase: 1000 },
      { value: 'in', label: '英寸', symbol: 'in', toBase: 0.0254 },
      { value: 'ft', label: '英尺', symbol: 'ft', toBase: 0.3048 },
      { value: 'yd', label: '码', symbol: 'yd', toBase: 0.9144 },
      { value: 'mi', label: '英里', symbol: 'mi', toBase: 1609.344 },
      { value: 'nmi', label: '海里', symbol: 'nmi', toBase: 1852 },
      { value: 'li', label: '里', symbol: '里', toBase: 500 },
      { value: 'chi', label: '尺', symbol: '尺', toBase: 1/3 },
      { value: 'cun', label: '寸', symbol: '寸', toBase: 1/30 },
      { value: 'au', label: '天文单位', symbol: 'AU', toBase: 1.496e11 },
    ]
  },
  weight: {
    name: '重量', icon: '⚖️',
    units: [
      { value: 'mg', label: '毫克', symbol: 'mg', toBase: 0.001 },
      { value: 'g', label: '克', symbol: 'g', toBase: 1 },
      { value: 'kg', label: '千克', symbol: 'kg', toBase: 1000 },
      { value: 't', label: '吨', symbol: 't', toBase: 1e6 },
      { value: 'oz', label: '盎司', symbol: 'oz', toBase: 28.3495 },
      { value: 'lb', label: '磅', symbol: 'lb', toBase: 453.592 },
      { value: 'st', label: '英石', symbol: 'st', toBase: 6350.29 },
      { value: 'lt', label: '长吨', symbol: 'lt', toBase: 1.016e6 },
      { value: 'jin', label: '斤', symbol: '斤', toBase: 500 },
      { value: 'liang', label: '两', symbol: '两', toBase: 50 },
      { value: 'qian', label: '钱', symbol: '钱', toBase: 5 },
      { value: 'ct', label: '克拉', symbol: 'ct', toBase: 0.2 },
    ]
  },
  temperature: {
    name: '温度', icon: '🌡️', special: true,
    units: [
      { value: 'c', label: '摄氏度', symbol: '°C' },
      { value: 'f', label: '华氏度', symbol: '°F' },
      { value: 'k', label: '开尔文', symbol: 'K' },
      { value: 'ra', label: '兰氏度', symbol: '°Ra' },
      { value: 're', label: '列氏度', symbol: '°Re' },
      { value: 'ro', label: '罗氏度', symbol: '°Rø' },
    ]
  },
  area: {
    name: '面积', icon: '📐',
    units: [
      { value: 'mm2', label: '平方毫米', symbol: 'mm²', toBase: 1e-6 },
      { value: 'cm2', label: '平方厘米', symbol: 'cm²', toBase: 1e-4 },
      { value: 'm2', label: '平方米', symbol: 'm²', toBase: 1 },
      { value: 'km2', label: '平方千米', symbol: 'km²', toBase: 1e6 },
      { value: 'ha', label: '公顷', symbol: 'ha', toBase: 1e4 },
      { value: 'acre', label: '英亩', symbol: 'acre', toBase: 4046.86 },
      { value: 'mu', label: '亩', symbol: '亩', toBase: 666.667 },
      { value: 'ft2', label: '平方英尺', symbol: 'ft²', toBase: 0.0929 },
      { value: 'yd2', label: '平方码', symbol: 'yd²', toBase: 0.8361 },
      { value: 'in2', label: '平方英寸', symbol: 'in²', toBase: 6.4516e-4 },
      { value: 'mi2', label: '平方英里', symbol: 'mi²', toBase: 2.59e6 },
    ]
  },
  volume: {
    name: '体积', icon: '🧊',
    units: [
      { value: 'ml', label: '毫升', symbol: 'mL', toBase: 1e-6 },
      { value: 'cl', label: '厘升', symbol: 'cL', toBase: 1e-5 },
      { value: 'l', label: '升', symbol: 'L', toBase: 0.001 },
      { value: 'm3', label: '立方米', symbol: 'm³', toBase: 1 },
      { value: 'cm3', label: '立方厘米', symbol: 'cm³', toBase: 1e-6 },
      { value: 'gal_us', label: '美加仑', symbol: 'gal', toBase: 0.003785 },
      { value: 'gal_uk', label: '英加仑', symbol: 'gal(UK)', toBase: 0.004546 },
      { value: 'qt', label: '美夸脱', symbol: 'qt', toBase: 0.000946 },
      { value: 'pt', label: '美品脱', symbol: 'pt', toBase: 0.000473 },
      { value: 'cup', label: '杯', symbol: 'cup', toBase: 0.000237 },
      { value: 'fl_oz', label: '液盎司', symbol: 'fl oz', toBase: 2.9574e-5 },
      { value: 'tbsp', label: '汤匙', symbol: 'tbsp', toBase: 1.4787e-5 },
      { value: 'tsp', label: '茶匙', symbol: 'tsp', toBase: 4.929e-6 },
    ]
  },
  speed: {
    name: '速度', icon: '🏎️',
    units: [
      { value: 'ms', label: '米/秒', symbol: 'm/s', toBase: 1 },
      { value: 'kmh', label: '千米/时', symbol: 'km/h', toBase: 1/3.6 },
      { value: 'mph', label: '英里/时', symbol: 'mph', toBase: 0.44704 },
      { value: 'kn', label: '节', symbol: 'kn', toBase: 0.51444 },
      { value: 'mach', label: '马赫', symbol: 'Ma', toBase: 340.29 },
      { value: 'c', label: '光速', symbol: 'c', toBase: 299792458 },
      { value: 'fts', label: '英尺/秒', symbol: 'ft/s', toBase: 0.3048 },
      { value: 'cms', label: '厘米/秒', symbol: 'cm/s', toBase: 0.01 },
    ]
  },
  storage: {
    name: '数据存储', icon: '💾',
    units: [
      { value: 'bit', label: '比特', symbol: 'bit', toBase: 1 },
      { value: 'B', label: '字节', symbol: 'B', toBase: 8 },
      { value: 'KB', label: '千字节', symbol: 'KB', toBase: 8192 },
      { value: 'MB', label: '兆字节', symbol: 'MB', toBase: 8388608 },
      { value: 'GB', label: '吉字节', symbol: 'GB', toBase: 8589934592 },
      { value: 'TB', label: '太字节', symbol: 'TB', toBase: 8.796e12 },
      { value: 'PB', label: '拍字节', symbol: 'PB', toBase: 9.007e15 },
      { value: 'Kbit', label: '千比特', symbol: 'Kbit', toBase: 1024 },
      { value: 'Mbit', label: '兆比特', symbol: 'Mbit', toBase: 1048576 },
      { value: 'Gbit', label: '吉比特', symbol: 'Gbit', toBase: 1073741824 },
    ]
  },
}

const categories = computed(() => Object.entries(unitData).map(([id, v]) => ({ id, name: v.name, icon: v.icon })))
const currentUnits = computed(() => unitData[currentCategory.value]?.units || [])

// ============ 换算逻辑 ============

function convert(val, from, to) {
  if (!val && val !== 0) return 0
  const cat = unitData[currentCategory.value]

  // 温度特殊处理
  if (cat.special) return convertTemperature(val, from, to)

  const fromU = cat.units.find(u => u.value === from)
  const toU = cat.units.find(u => u.value === to)
  if (!fromU || !toU) return 0

  const baseVal = val * fromU.toBase
  return baseVal / toU.toBase
}

function convertTemperature(val, from, to) {
  // 先转到摄氏度
  let c
  if (from === 'c') c = val
  else if (from === 'f') c = (val - 32) * 5 / 9
  else if (from === 'k') c = val - 273.15
  else if (from === 'ra') c = (val - 491.67) * 5 / 9
  else if (from === 're') c = val * 5 / 4
  else if (from === 'ro') c = (val - 7.5) * 40 / 21

  // 从摄氏度转到目标
  if (to === 'c') return c
  if (to === 'f') return c * 9 / 5 + 32
  if (to === 'k') return c + 273.15
  if (to === 'ra') return (c + 273.15) * 9 / 5
  if (to === 're') return c * 4 / 5
  if (to === 'ro') return c * 21 / 40 + 7.5
  return c
}

const result = computed(() => convert(inputValue.value, fromUnit.value, toUnit.value))

const quickUnits = computed(() => {
  return currentUnits.value.filter(u => u.value !== fromUnit.value && u.value !== toUnit.value).slice(0, 6)
})

function getUnitSymbol(val) {
  const u = currentUnits.value.find(u => u.value === val)
  return u?.symbol || val
}

function formatNumber(n) {
  if (Number.isInteger(n) || Math.abs(n) >= 1000) return n.toLocaleString('zh-CN')
  return parseFloat(n.toPrecision(10)).toString()
}

function formatResult(n) {
  if (n === 0) return '0'
  const abs = Math.abs(n)
  if (abs >= 1e10 || (abs < 0.001 && abs > 0)) return n.toExponential(4)
  return parseFloat(n.toPrecision(8)).toLocaleString('zh-CN', { maximumFractionDigits: 8 })
}

function switchCategory(id) {
  currentCategory.value = id
  const units = unitData[id].units
  fromUnit.value = units[0].value
  toUnit.value = units[1]?.value || units[0].value
}

function swapUnits() {
  const tmp = fromUnit.value
  fromUnit.value = toUnit.value
  toUnit.value = tmp
}

// 初始化
switchCategory('length')
</script>

<style scoped>
.tool-page { padding-top: 0.5rem; }
h2 { font-size: 1.6rem; margin-bottom: 0.3rem; }
.subtitle { color: #888; font-size: 0.95rem; margin-bottom: 1.5rem; }

.category-tabs {
  display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.5rem;
}
.category-tabs button {
  padding: 0.5rem 1rem; border: 2px solid #e0e0e0; background: white;
  border-radius: 20px; cursor: pointer; font-size: 0.85rem; transition: all 0.2s;
}
.category-tabs button.active {
  border-color: #22c55e; background: #f0fdf4; color: #22c55e; font-weight: 600;
}

.converter-card {
  background: white; border-radius: 14px; padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

.input-group { margin-bottom: 1.2rem; }
.input-group label { display: block; font-weight: 600; font-size: 0.9rem; margin-bottom: 0.4rem; color: #555; }
.num-input {
  width: 100%; padding: 0.8rem 1rem; border: 2px solid #e0e0e0; border-radius: 10px;
  font-size: 1.3rem; outline: none; transition: border-color 0.2s;
}
.num-input:focus { border-color: #22c55e; }

.unit-row {
  display: flex; align-items: flex-end; gap: 0.8rem; margin-bottom: 1.2rem;
}
.unit-select { flex: 1; }
.unit-select label { display: block; font-weight: 600; font-size: 0.85rem; margin-bottom: 0.4rem; color: #555; }
.unit-select select {
  width: 100%; padding: 0.6rem 0.8rem; border: 2px solid #e0e0e0; border-radius: 8px;
  font-size: 0.9rem; outline: none; background: white; cursor: pointer;
}
.unit-select select:focus { border-color: #22c55e; }

.btn-swap {
  width: 40px; height: 40px; border-radius: 50%; border: 2px solid #e0e0e0;
  background: white; cursor: pointer; font-size: 1.2rem; color: #22c55e;
  flex-shrink: 0; transition: all 0.2s; margin-bottom: 1px;
}
.btn-swap:hover { border-color: #22c55e; background: #f0fdf4; transform: rotate(180deg); }

.result-area {
  background: linear-gradient(135deg, #f0fdf4, #ecfdf5); border-radius: 12px;
  padding: 1.5rem; text-align: center; margin-bottom: 1.2rem;
}
.result-value {
  font-size: 2.2rem; font-weight: 700; color: #22c55e; margin-bottom: 0.3rem;
  font-variant-numeric: tabular-nums; transition: all 0.3s;
}
.result-value.zero { color: #ccc; font-size: 1.5rem; }
.result-formula { font-size: 0.85rem; color: #666; }

.quick-ref { margin-top: 1rem; }
.quick-ref h4 { font-size: 0.9rem; color: #555; margin-bottom: 0.6rem; }
.ref-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.4rem; }
.ref-item {
  display: flex; justify-content: space-between; padding: 0.5rem 0.8rem;
  background: #fafafa; border-radius: 8px; cursor: pointer; transition: all 0.2s;
}
.ref-item:hover { background: #f0fdf4; }
.ref-target { font-weight: 600; color: #22c55e; font-size: 0.9rem; font-variant-numeric: tabular-nums; }
.ref-label { font-size: 0.8rem; color: #999; }

.back-link { display: inline-block; margin-top: 2rem; color: #22c55e; font-weight: 600; }
.back-link:hover { text-decoration: underline; }

@media (max-width: 600px) {
  .unit-row { flex-direction: column; }
  .btn-swap { align-self: center; transform: rotate(90deg); margin: 0; }
  .btn-swap:hover { transform: rotate(270deg); }
  .result-value { font-size: 1.8rem; }
}
</style>
