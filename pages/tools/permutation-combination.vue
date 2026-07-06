<template>
  <div class="tool-page">
    <h2>🔢 排列组合计算器</h2>
    <p class="subtitle">计算排列 A(n,m)、组合 C(n,m)、可重复排列/组合，杨辉三角可视化</p>

    <!-- 模式切换 -->
    <div class="mode-tabs">
      <button
        v-for="mode in modes"
        :key="mode.key"
        :class="['tab-btn', { active: currentMode === mode.key }]"
        @click="currentMode = mode.key"
      >
        {{ mode.icon }} {{ mode.name }}
      </button>
    </div>

    <!-- 输入区域 -->
    <div class="input-section">
      <div class="input-grid">
        <div class="input-group">
          <label>{{ currentMode === 'pascal' ? '行数（0 ~ 20）' : 'n（总元素数）' }}</label>
          <div class="param-input">
            <input type="number" v-model.number="n" min="0" :max="currentMode === 'pascal' ? 20 : 1000" step="1" class="num-input" />
            <input type="range" v-model.number="n" min="0" :max="currentMode === 'pascal' ? 20 : 100" step="1" class="slider" />
          </div>
        </div>
        <div v-if="currentMode !== 'pascal'" class="input-group">
          <label>m（选取数）</label>
          <div class="param-input">
            <input type="number" v-model.number="m" min="0" :max="n" step="1" class="num-input" />
            <input type="range" v-model.number="m" min="0" :max="n" step="1" class="slider" />
          </div>
        </div>
      </div>
    </div>

    <!-- 杨辉三角 -->
    <div v-if="currentMode === 'pascal'" class="pascal-section">
      <h3>杨辉三角（帕斯卡三角）</h3>
      <canvas ref="pascalCanvas" class="pascal-canvas"></canvas>
      <div class="pascal-note">
        <p>💡 杨辉三角中第 <strong>k</strong> 行第 <strong>j</strong> 列的值 = C(k-1, j-1)</p>
        <p>每行数值之和 = 2^(行号-1)</p>
      </div>
    </div>

    <!-- 计算结果 -->
    <div v-if="currentMode !== 'pascal'" class="result-cards">
      <div v-for="r in results" :key="r.label" class="result-card">
        <div class="card-label">{{ r.label }}</div>
        <div class="card-value">{{ r.value }}</div>
        <div class="card-sub">{{ r.formula }}</div>
      </div>
    </div>

    <!-- 详细计算过程 -->
    <div v-if="currentMode !== 'pascal'" class="process-section">
      <h3>📝 计算过程</h3>
      <div class="process-block">
        <code v-for="(line, i) in processLines" :key="i">{{ line }}</code>
      </div>
    </div>

    <!-- 复制按钮 -->
    <div v-if="currentMode !== 'pascal'" class="action-buttons">
      <button class="copy-btn" @click="copyResults">{{ copyText }}</button>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '排列组合计算器 - 野火小站' })

const currentMode = ref('permutation')
const n = ref(10)
const m = ref(3)
const copyText = ref('📋 复制结果')
const pascalCanvas = ref(null)

const modes = [
  { key: 'permutation', name: '排列', icon: '🔄' },
  { key: 'combination', name: '组合', icon: '🎯' },
  { key: 'repeat_perm', name: '可重复排列', icon: '🔁' },
  { key: 'repeat_comb', name: '可重复组合', icon: '♻️' },
  { key: 'pascal', name: '杨辉三角', icon: '🔺' },
]

// 阶乘（BigInt 精确计算）
function factorial(num) {
  if (num < 0) return 0n
  if (num === 0 || num === 1) return 1n
  let result = 1n
  for (let i = 2n; i <= BigInt(num); i++) {
    result *= i
  }
  return result
}

// 排列 A(n, m) = n! / (n-m)!
function permutation(nVal, mVal) {
  if (mVal > nVal || mVal < 0) return 0n
  let result = 1n
  for (let i = BigInt(nVal); i > BigInt(nVal - mVal); i--) {
    result *= i
  }
  return result
}

// 组合 C(n, m) = n! / (m!(n-m)!)
function combination(nVal, mVal) {
  if (mVal > nVal || mVal < 0) return 0n
  // 利用对称性减少计算量
  mVal = Math.min(mVal, nVal - mVal)
  if (mVal === 0) return 1n
  let result = 1n
  for (let i = 0n; i < BigInt(mVal); i++) {
    result = result * (BigInt(nVal) - i) / (i + 1n)
  }
  return result
}

// 可重复排列 n^m
function repeatPermutation(nVal, mVal) {
  if (nVal < 0 || mVal < 0) return 0n
  let result = 1n
  for (let i = 0n; i < BigInt(mVal); i++) {
    result *= BigInt(nVal)
  }
  return result
}

// 可重复组合 C(n+m-1, m) = (n+m-1)! / (m!(n-1)!)
function repeatCombination(nVal, mVal) {
  return combination(nVal + mVal - 1, mVal)
}

// 格式化大数
function fmtBigInt(val) {
  const s = val.toString()
  if (s.length <= 15) {
    // 加千分位
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }
  // 超长数用科学计数法近似
  const len = s.length
  return s.slice(0, 1) + '.' + s.slice(1, 7) + ' × 10^' + (len - 1)
}

// 完整数值（用于复制）
function rawBigInt(val) {
  return val.toString()
}

// 计算结果
const results = computed(() => {
  const nv = Math.max(0, Math.floor(n.value))
  const mv = Math.max(0, Math.floor(m.value))
  const res = []

  if (currentMode.value === 'permutation') {
    const val = permutation(nv, mv)
    res.push({ label: `A(${nv}, ${mv})`, value: fmtBigInt(val), formula: 'n! / (n-m)!' })
    // 额外显示相同参数的组合值
    const cv = combination(nv, mv)
    res.push({ label: `C(${nv}, ${mv})`, value: fmtBigInt(cv), formula: 'n! / (m!(n-m)!)' })
    // 阶乘参考
    res.push({ label: `${nv}!`, value: fmtBigInt(factorial(nv)), formula: `${nv} 的阶乘` })
    res.push({ label: `${nv - mv}!`, value: fmtBigInt(factorial(Math.max(0, nv - mv))), formula: `(n-m) 的阶乘` })
  }

  if (currentMode.value === 'combination') {
    const val = combination(nv, mv)
    res.push({ label: `C(${nv}, ${mv})`, value: fmtBigInt(val), formula: 'n! / (m!(n-m)!)' })
    const pv = permutation(nv, mv)
    res.push({ label: `A(${nv}, ${mv})`, value: fmtBigInt(pv), formula: 'n! / (n-m)!' })
    res.push({ label: `C(${nv}, ${nv - mv})`, value: fmtBigInt(combination(nv, nv - mv)), formula: 'C(n,m) = C(n,n-m)' })
    // 累加和
    let sum = 0n
    for (let k = 0; k <= nv; k++) sum += combination(nv, k)
    res.push({ label: `ΣC(${nv}, k)`, value: fmtBigInt(sum), formula: 'k=0..n 的 C(n,k) 之和 = 2^n' })
  }

  if (currentMode.value === 'repeat_perm') {
    const val = repeatPermutation(nv, mv)
    res.push({ label: `n^m = ${nv}^${mv}`, value: fmtBigInt(val), formula: 'n^m（可重复排列）' })
    res.push({ label: `A(${nv}, ${mv})`, value: fmtBigInt(permutation(nv, mv)), formula: '不含重复的排列（对比）' })
  }

  if (currentMode.value === 'repeat_comb') {
    const val = repeatCombination(nv, mv)
    res.push({ label: `C(${nv}+${mv}-1, ${mv})`, value: fmtBigInt(val), formula: 'C(n+m-1, m) 可重复组合' })
    res.push({ label: `C(${nv}, ${mv})`, value: fmtBigInt(combination(nv, mv)), formula: '不含重复的组合（对比）' })
  }

  return res
})

// 计算过程
const processLines = computed(() => {
  const nv = Math.max(0, Math.floor(n.value))
  const mv = Math.max(0, Math.floor(m.value))
  const lines = []

  if (currentMode.value === 'permutation') {
    lines.push(`排列 A(${nv}, ${mv}) = ${nv}! / (${nv}-${mv})!`)
    // 展开分子分母
    const numerator = []
    for (let i = nv; i > nv - mv; i--) numerator.push(i)
    lines.push(`= ${numerator.join(' × ')}`)
    lines.push(`= ${rawBigInt(permutation(nv, mv))}`)
  }

  if (currentMode.value === 'combination') {
    const cmv = Math.min(mv, nv - mv)
    lines.push(`组合 C(${nv}, ${mv}) = ${nv}! / (${mv}! × ${nv - mv}!)`)
    const numerator = []
    for (let i = nv; i > nv - cmv; i--) numerator.push(i)
    const denominator = []
    for (let i = 1; i <= cmv; i++) denominator.push(i)
    lines.push(`= ${numerator.join(' × ')} / (${denominator.join(' × ')})`)
    lines.push(`= ${rawBigInt(combination(nv, mv))}`)
    if (mv !== cmv) {
      lines.push(`(利用对称性: C(${nv},${mv}) = C(${nv},${nv - mv}))`)
    }
  }

  if (currentMode.value === 'repeat_perm') {
    lines.push(`可重复排列 = ${nv}^${mv}`)
    lines.push(`= ` + Array(mv).fill(`${nv}`).join(' × '))
    lines.push(`= ${rawBigInt(repeatPermutation(nv, mv))}`)
  }

  if (currentMode.value === 'repeat_comb') {
    lines.push(`可重复组合 = C(${nv}+${mv}-1, ${mv}) = C(${nv + mv - 1}, ${mv})`)
    lines.push(`= ${rawBigInt(repeatCombination(nv, mv))}`)
  }

  return lines
})

// 杨辉三角 Canvas 绘制
function drawPascal() {
  const canvas = pascalCanvas.value
  if (!canvas || currentMode.value !== 'pascal') return

  const dpr = window.devicePixelRatio || 1
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  canvas.width = w * dpr
  canvas.height = h * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, w, h)

  const rows = Math.min(Math.max(0, Math.floor(n.value)), 20)
  if (rows === 0) return

  // 预计算所有值
  const triangle = []
  for (let i = 0; i < rows; i++) {
    const row = []
    for (let j = 0; j <= i; j++) {
      row.push(combination(i, j))
    }
    triangle.push(row)
  }

  // 计算单元格大小
  const maxCols = rows
  const cellW = Math.min(w / (maxCols + 2), 60)
  const cellH = Math.min((h - 20) / (rows + 1), 28)
  const fontSize = Math.min(cellH * 0.65, 14)

  ctx.font = `${fontSize}px system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (let i = 0; i < rows; i++) {
    const row = triangle[i]
    const rowWidth = row.length * cellW
    const startX = (w - rowWidth) / 2
    const y = 15 + i * cellH + cellH / 2

    for (let j = 0; j < row.length; j++) {
      const x = startX + j * cellW + cellW / 2
      const val = row[j]

      // 数值对应的颜色强度
      const maxVal = combination(i, Math.floor(i / 2))
      const intensity = Number(val) / Number(maxVal)

      // 绘制圆角矩形背景
      const bw = cellW - 4
      const bh = cellH - 4
      const bx = x - bw / 2
      const by = y - bh / 2

      const r = Math.round(34 + intensity * (239 - 34))
      const g = Math.round(197 - intensity * (197 - 68))
      const b = Math.round(94 - intensity * (94 - 68))

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.1 + intensity * 0.2})`
      ctx.beginPath()
      ctx.roundRect(bx, by, bw, bh, 4)
      ctx.fill()

      // 数值
      const valStr = Number(val) > 99999 ? Number(val).toExponential(1) : Number(val).toString()
      ctx.fillStyle = intensity > 0.5 ? '#dc2626' : '#2c3e50'
      ctx.font = `${fontSize}px system-ui, sans-serif`
      ctx.fillText(valStr, x, y)
    }
  }
}

// 复制结果
function copyResults() {
  const nv = Math.max(0, Math.floor(n.value))
  const mv = Math.max(0, Math.floor(m.value))
  let text = `排列组合计算结果\n`

  results.value.forEach(r => {
    text += `${r.label} = ${r.value}\n`
  })

  text += `\n计算过程:\n`
  processLines.value.forEach(l => {
    text += l + '\n'
  })

  navigator.clipboard.writeText(text)
  copyText.value = '✅ 已复制'
  setTimeout(() => { copyText.value = '📋 复制结果' }, 1500)
}

// 切换到杨辉三角时重新绘制
watch([currentMode, n], () => {
  nextTick(drawPascal)
})

onMounted(() => {
  drawPascal()
  window.addEventListener('resize', drawPascal)
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

h3 {
  font-size: 1.05rem;
  margin-bottom: 0.8rem;
  color: #333;
}

/* 模式切换 */
.mode-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.tab-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.tab-btn:hover {
  border-color: #22c55e;
  background: #f0fdf4;
}

.tab-btn.active {
  border-color: #22c55e;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  font-weight: 600;
}

/* 输入区域 */
.input-section {
  margin-bottom: 1.5rem;
}

.input-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.input-group label {
  display: block;
  font-weight: 600;
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 0.4rem;
}

.param-input {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.num-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  background: white;
}

.num-input:focus {
  outline: none;
  border-color: #22c55e;
}

.slider {
  width: 100%;
  accent-color: #22c55e;
  cursor: pointer;
}

/* 结果卡片 */
.result-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.result-card {
  background: white;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 1.2rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.card-label {
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 0.3rem;
}

.card-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: #2c3e50;
  word-break: break-all;
}

.card-sub {
  font-size: 0.75rem;
  color: #aaa;
  margin-top: 0.2rem;
  font-family: monospace;
}

/* 计算过程 */
.process-section {
  margin-bottom: 1.5rem;
}

.process-block {
  background: #1a1a2e;
  border-radius: 10px;
  padding: 1.2rem;
}

.process-block code {
  display: block;
  color: #a5d6a7;
  font-family: monospace;
  font-size: 0.9rem;
  line-height: 1.8;
}

/* 杨辉三角 */
.pascal-section {
  margin-bottom: 1.5rem;
}

.pascal-canvas {
  width: 100%;
  height: 500px;
  border-radius: 12px;
  background: #fafafa;
  border: 1px solid #eee;
}

.pascal-note {
  margin-top: 0.8rem;
  padding: 0.8rem 1rem;
  background: #f0fdf4;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #555;
}

.pascal-note p {
  margin-bottom: 0.3rem;
}

/* 操作按钮 */
.action-buttons {
  margin-bottom: 1.5rem;
}

.copy-btn {
  padding: 0.6rem 1.5rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: transform 0.2s;
}

.copy-btn:active {
  transform: scale(0.95);
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
    grid-template-columns: 1fr 1fr;
  }
  .mode-tabs {
    justify-content: center;
  }
}
</style>
