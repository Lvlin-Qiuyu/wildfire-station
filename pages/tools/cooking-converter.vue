<template>
  <div class="tool-page">
    <h2>🍰 烘焙烹饪用量换算器</h2>
    <p class="subtitle">杯/克/盎司/毫升/大匙/小匙互转，内置20+种食材密度，支持按人数缩放</p>

    <!-- 单位换算 -->
    <div class="converter-card">
      <h3>单位快速换算</h3>
      <div class="ingredient-row">
        <div class="input-group">
          <label>选择食材</label>
          <select v-model="selectedIngredient">
            <option v-for="ing in ingredients" :key="ing.id" :value="ing.id">{{ ing.name }}（{{ ing.density }} g/mL）</option>
          </select>
        </div>
      </div>

      <div class="input-group">
        <label>数值</label>
        <input type="number" v-model.number="inputValue" placeholder="输入数值" class="num-input" />
      </div>

      <div class="unit-row">
        <div class="unit-select">
          <label>源单位</label>
          <select v-model="fromUnit">
            <option v-for="u in allUnits" :key="u.value" :value="u.value">{{ u.label }} ({{ u.symbol }})</option>
          </select>
        </div>
        <button class="btn-swap" @click="swapUnits">⇄</button>
        <div class="unit-select">
          <label>目标单位</label>
          <select v-model="toUnit">
            <option v-for="u in allUnits" :key="u.value" :value="u.value">{{ u.label }} ({{ u.symbol }})</option>
          </select>
        </div>
      </div>

      <div class="result-area" v-if="inputValue">
        <div class="result-value">{{ formatResult(resultValue) }} {{ getUnitSymbol(toUnit) }}</div>
        <div class="result-formula">{{ formatNumber(inputValue) }} {{ getUnitSymbol(fromUnit) }} = {{ formatResult(resultValue) }} {{ getUnitSymbol(toUnit) }}</div>
        <button class="btn-copy" @click="copyText(`${formatResult(resultValue)} ${getUnitSymbol(toUnit)}`)">📋 复制结果</button>
      </div>
    </div>

    <!-- 配方缩放 -->
    <div class="converter-card">
      <h3>配方按人数缩放</h3>
      <div class="scale-row">
        <div class="input-group" style="flex:1;">
          <label>原配方的服务人数</label>
          <input type="number" v-model.number="originalServing" min="1" class="num-input" />
        </div>
        <div class="scale-arrow">→</div>
        <div class="input-group" style="flex:1;">
          <label>目标人数</label>
          <input type="number" v-model.number="targetServing" min="1" class="num-input" />
        </div>
      </div>
      <div class="scale-factor" v-if="originalServing && targetServing">
        缩放系数：<strong>{{ scaleFactor.toFixed(2) }}x</strong>
      </div>

      <div class="recipe-area">
        <div class="recipe-header">
          <label>配方列表（每行一条，格式：数量 单位 食材名）</label>
          <button class="btn-small" @click="loadSampleRecipe">加载示例</button>
        </div>
        <textarea v-model="recipeText" rows="6" placeholder="例如：&#10;200 g 面粉&#10;100 g 糖&#10;2 个 鸡蛋&#10;250 ml 牛奶" class="recipe-input"></textarea>
      </div>

      <div class="recipe-result" v-if="recipeText.trim()">
        <h4>缩放后配方</h4>
        <div class="recipe-list">
          <div v-for="(item, i) in scaledRecipe" :key="i" class="recipe-item">
            <span class="recipe-amount">{{ item.amount }}</span>
            <span class="recipe-unit">{{ item.unit }}</span>
            <span class="recipe-name">{{ item.name }}</span>
          </div>
        </div>
        <button class="btn-copy" @click="copyText(scaledRecipeText)">📋 复制配方</button>
      </div>
    </div>

    <!-- 食材密度参考表 -->
    <div class="converter-card">
      <h3>常见食材密度参考</h3>
      <div class="density-table">
        <div class="density-header">
          <span>食材</span><span>密度 (g/mL)</span><span>1杯≈克数</span>
        </div>
        <div v-for="ing in ingredients" :key="ing.id" class="density-row-item">
          <span>{{ ing.name }}</span>
          <span>{{ ing.density }}</span>
          <span>{{ (ing.density * 236.59).toFixed(0) }} g</span>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '烘焙烹饪用量换算器 - 野火小站' })

const inputValue = ref(1)
const fromUnit = ref('cup')
const toUnit = ref('g')
const selectedIngredient = ref('flour')

// ============ 食材密度数据 ============
const ingredients = [
  { id: 'flour', name: '中筋面粉', density: 0.53 },
  { id: 'cake_flour', name: '低筋面粉', density: 0.45 },
  { id: 'bread_flour', name: '高筋面粉', density: 0.58 },
  { id: 'sugar', name: '白砂糖', density: 0.85 },
  { id: 'brown_sugar', name: '红糖', density: 0.93 },
  { id: 'powdered_sugar', name: '糖粉', density: 0.56 },
  { id: 'butter', name: '黄油（融化）', density: 0.91 },
  { id: 'butter_firm', name: '黄油（冷藏）', density: 0.97 },
  { id: 'milk', name: '牛奶', density: 1.03 },
  { id: 'cream', name: '淡奶油', density: 1.01 },
  { id: 'water', name: '水', density: 1.00 },
  { id: 'honey', name: '蜂蜜', density: 1.42 },
  { id: 'cocoa', name: '可可粉', density: 0.52 },
  { id: 'cornstarch', name: '玉米淀粉', density: 0.56 },
  { id: 'baking_powder', name: '泡打粉', density: 0.90 },
  { id: 'baking_soda', name: '小苏打', density: 0.89 },
  { id: 'salt', name: '食盐', density: 1.22 },
  { id: 'rice', name: '大米（生）', density: 0.85 },
  { id: 'oats', name: '燕麦片', density: 0.41 },
  { id: 'almond_flour', name: '杏仁粉', density: 0.46 },
  { id: 'coconut_flour', name: '椰子粉', density: 0.56 },
  { id: 'oil', name: '植物油', density: 0.92 },
  { id: 'olive_oil', name: '橄榄油', density: 0.91 },
  { id: 'vanilla', name: '香草精', density: 0.88 },
  { id: 'yogurt', name: '酸奶', density: 1.04 },
  { id: 'egg', name: '鸡蛋（连壳）', density: 1.03 },
]

// ============ 烹饪单位定义 ============
const allUnits = [
  { value: 'cup', label: '杯', symbol: '杯', toMl: 236.59 },
  { value: 'ml', label: '毫升', symbol: 'mL', toMl: 1 },
  { value: 'l', label: '升', symbol: 'L', toMl: 1000 },
  { value: 'tbsp', label: '大匙（汤匙）', symbol: '大匙', toMl: 15 },
  { value: 'tsp', label: '小匙（茶匙）', symbol: '小匙', toMl: 5 },
  { value: 'fl_oz', label: '液盎司', symbol: 'fl oz', toMl: 29.57 },
  { value: 'g', label: '克', symbol: 'g', toMl: null },
  { value: 'kg', label: '千克', symbol: 'kg', toMl: null },
  { value: 'oz', label: '盎司（质量）', symbol: 'oz', toMl: null },
  { value: 'lb', label: '磅', symbol: 'lb', toMl: null },
]

// ============ 换算逻辑 ============
function getIngredient() {
  return ingredients.find(i => i.id === selectedIngredient.value)
}

function convertToGrams(val, unit) {
  const ing = getIngredient()
  const u = allUnits.find(u => u.value === unit)
  if (!u) return 0

  // 体积单位 → 毫升 → 克
  if (u.toMl !== null) {
    const ml = val * u.toMl
    return ml * ing.density
  }
  // 已经是质量单位
  if (unit === 'g') return val
  if (unit === 'kg') return val * 1000
  if (unit === 'oz') return val * 28.3495
  if (unit === 'lb') return val * 453.592
  return 0
}

function convertFromGrams(grams, unit) {
  const ing = getIngredient()
  const u = allUnits.find(u => u.value === unit)
  if (!u) return 0

  if (unit === 'g') return grams
  if (unit === 'kg') return grams / 1000
  if (unit === 'oz') return grams / 28.3495
  if (unit === 'lb') return grams / 453.592

  // 质量单位 → 毫升 → 目标体积单位
  if (u.toMl !== null) {
    const ml = grams / ing.density
    return ml / u.toMl
  }
  return 0
}

const resultValue = computed(() => {
  if (!inputValue.value) return 0
  const grams = convertToGrams(inputValue.value, fromUnit.value)
  return convertFromGrams(grams, toUnit.value)
})

function getUnitSymbol(val) {
  const u = allUnits.find(u => u.value === val)
  return u?.symbol || val
}

function formatNumber(n) {
  if (Number.isInteger(n)) return n.toLocaleString('zh-CN')
  return parseFloat(n.toPrecision(10)).toString()
}

function formatResult(n) {
  if (n === 0) return '0'
  const abs = Math.abs(n)
  if (abs >= 1e6) return n.toExponential(4)
  return parseFloat(n.toPrecision(6)).toLocaleString('zh-CN', { maximumFractionDigits: 4 })
}

function swapUnits() {
  const tmp = fromUnit.value
  fromUnit.value = toUnit.value
  toUnit.value = tmp
}

// ============ 配方缩放 ============
const originalServing = ref(4)
const targetServing = ref(8)
const recipeText = ref('')

const scaleFactor = computed(() => {
  if (!originalServing.value || !targetServing.value) return 1
  return targetServing.value / originalServing.value
})

function loadSampleRecipe() {
  recipeText.value = `200 g 中筋面粉\n150 g 白砂糖\n115 g 黄油（融化）\n2 个 鸡蛋\n250 ml 牛奶\n5 g 泡打粉\n3 g 小苏打\n5 ml 香草精`
}

const scaledRecipe = computed(() => {
  if (!recipeText.value.trim()) return []
  return recipeText.value.trim().split('\n').map(line => {
    const match = line.trim().match(/^([\d.]+)\s*(\S+)\s+(.+)$/)
    if (!match) return { amount: line, unit: '', name: line }
    const origAmount = parseFloat(match[1])
    const scaled = (origAmount * scaleFactor.value)
    const display = Number.isInteger(scaled) ? scaled : parseFloat(scaled.toFixed(2))
    return {
      amount: display,
      unit: match[2],
      name: match[3],
    }
  })
})

const scaledRecipeText = computed(() => {
  return scaledRecipe.value.map(item => {
    if (typeof item.amount === 'string') return item.amount
    return `${item.amount} ${item.unit} ${item.name}`
  }).join('\n')
})

// ============ 复制功能 ============
const copied = ref(false)

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch (e) {
    // fallback
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}
</script>

<style scoped>
.tool-page { padding-top: 0.5rem; }
h2 { font-size: 1.6rem; margin-bottom: 0.3rem; }
.subtitle { color: #888; font-size: 0.95rem; margin-bottom: 1.5rem; }

.converter-card {
  background: white; border-radius: 14px; padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06); margin-bottom: 1.5rem;
}
.converter-card h3 {
  font-size: 1.1rem; color: #333; margin-bottom: 1rem;
  padding-bottom: 0.5rem; border-bottom: 2px solid #f0fdf4;
}

.input-group { margin-bottom: 1.2rem; }
.input-group label { display: block; font-weight: 600; font-size: 0.9rem; margin-bottom: 0.4rem; color: #555; }

.num-input {
  width: 100%; padding: 0.8rem 1rem; border: 2px solid #e0e0e0; border-radius: 10px;
  font-size: 1.1rem; outline: none; transition: border-color 0.2s; box-sizing: border-box;
}
.num-input:focus { border-color: #22c55e; }

select {
  width: 100%; padding: 0.6rem 0.8rem; border: 2px solid #e0e0e0; border-radius: 8px;
  font-size: 0.9rem; outline: none; background: white; cursor: pointer;
}
select:focus { border-color: #22c55e; }

.unit-row {
  display: flex; align-items: flex-end; gap: 0.8rem; margin-bottom: 1.2rem;
}
.unit-select { flex: 1; }
.unit-select label { display: block; font-weight: 600; font-size: 0.85rem; margin-bottom: 0.4rem; color: #555; }

.btn-swap {
  width: 40px; height: 40px; border-radius: 50%; border: 2px solid #e0e0e0;
  background: white; cursor: pointer; font-size: 1.2rem; color: #22c55e;
  flex-shrink: 0; transition: all 0.2s;
}
.btn-swap:hover { border-color: #22c55e; background: #f0fdf4; transform: rotate(180deg); }

.result-area {
  background: linear-gradient(135deg, #f0fdf4, #ecfdf5); border-radius: 12px;
  padding: 1.5rem; text-align: center;
}
.result-value { font-size: 2.2rem; font-weight: 700; color: #22c55e; margin-bottom: 0.3rem; }
.result-formula { font-size: 0.85rem; color: #666; margin-bottom: 0.8rem; }

.btn-copy {
  display: inline-block; padding: 0.4rem 1rem; background: #22c55e; color: white;
  border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem;
  transition: all 0.2s;
}
.btn-copy:hover { background: #16a34a; }

.btn-small {
  padding: 0.3rem 0.8rem; background: #22c55e; color: white; border: none;
  border-radius: 6px; cursor: pointer; font-size: 0.8rem; transition: all 0.2s;
}
.btn-small:hover { background: #16a34a; }

/* 配方缩放 */
.scale-row {
  display: flex; align-items: flex-end; gap: 0.8rem; margin-bottom: 0.8rem;
}
.scale-arrow {
  font-size: 1.5rem; color: #22c55e; font-weight: 700;
  padding-bottom: 0.3rem;
}
.scale-factor {
  background: #f0fdf4; border-radius: 8px; padding: 0.5rem 1rem;
  font-size: 0.9rem; color: #555; margin-bottom: 1rem;
}

.recipe-area { margin-bottom: 1rem; }
.recipe-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 0.4rem;
}
.recipe-header label { font-weight: 600; font-size: 0.85rem; color: #555; }

.recipe-input {
  width: 100%; padding: 0.8rem; border: 2px solid #e0e0e0; border-radius: 10px;
  font-size: 0.9rem; font-family: inherit; resize: vertical; outline: none;
  box-sizing: border-box; line-height: 1.6;
}
.recipe-input:focus { border-color: #22c55e; }

.recipe-result { margin-top: 1rem; }
.recipe-result h4 { font-size: 0.95rem; color: #555; margin-bottom: 0.6rem; }

.recipe-list {
  background: #fafafa; border-radius: 10px; padding: 0.8rem;
  margin-bottom: 0.8rem;
}
.recipe-item {
  padding: 0.4rem 0; border-bottom: 1px solid #f0f0f0;
  display: flex; gap: 0.5rem; font-size: 0.9rem;
}
.recipe-item:last-child { border-bottom: none; }
.recipe-amount { font-weight: 700; color: #22c55e; min-width: 50px; }
.recipe-unit { color: #888; min-width: 40px; }
.recipe-name { color: #333; }

/* 密度参考表 */
.density-table {
  max-height: 400px; overflow-y: auto;
}
.density-header {
  display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem;
  padding: 0.5rem; background: #f0fdf4; border-radius: 8px;
  font-weight: 600; font-size: 0.85rem; color: #555;
  position: sticky; top: 0;
}
.density-row-item {
  display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem;
  padding: 0.5rem; border-bottom: 1px solid #f5f5f5; font-size: 0.85rem;
}
.density-row-item:nth-child(even) { background: #fafafa; }
.density-row-item:hover { background: #f0fdf4; }

.back-link { display: inline-block; margin-top: 2rem; color: #22c55e; font-weight: 600; }
.back-link:hover { text-decoration: underline; }

@media (max-width: 600px) {
  .unit-row { flex-direction: column; }
  .btn-swap { align-self: center; transform: rotate(90deg); }
  .btn-swap:hover { transform: rotate(270deg); }
  .result-value { font-size: 1.6rem; }
  .scale-row { flex-direction: column; }
  .scale-arrow { text-align: center; }
}
</style>
