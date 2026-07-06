<template>
  <div class="tool-page">
    <h2>📐 几何计算器</h2>
    <p class="subtitle">计算常见几何图形的面积、周长、体积、表面积，支持 Canvas 可视化预览</p>

    <!-- 图形选择 -->
    <div class="shape-selector">
      <button
        v-for="s in shapes"
        :key="s.key"
        :class="['shape-btn', { active: currentShape === s.key }]"
        @click="selectShape(s.key)"
      >
        {{ s.icon }} {{ s.name }}
      </button>
    </div>

    <!-- 输入区域 -->
    <div class="input-grid">
      <div v-for="p in currentParams" :key="p.key" class="input-group">
        <label>{{ p.label }}</label>
        <div class="param-input">
          <input
            type="number"
            v-model.number="params[p.key]"
            min="0"
            step="any"
            class="num-input"
            placeholder="0"
          />
          <span class="unit">{{ p.unit }}</span>
        </div>
      </div>
    </div>

    <!-- 图形预览 -->
    <div class="preview-section">
      <canvas ref="previewCanvas" class="preview-canvas"></canvas>
    </div>

    <!-- 计算结果 -->
    <div class="result-cards">
      <div v-for="r in currentResults" :key="r.label" class="result-card">
        <div class="card-label">{{ r.label }}</div>
        <div class="card-value">{{ r.value }}</div>
        <div class="card-sub">{{ r.formula }}</div>
      </div>
    </div>

    <!-- 公式说明 -->
    <div class="formula-section">
      <h3>📝 计算公式</h3>
      <div class="formula-block">
        <code v-for="(f, i) in currentFormulas" :key="i">{{ f }}</code>
      </div>
    </div>

    <!-- 复制按钮 -->
    <div class="action-buttons">
      <button class="copy-btn" @click="copyResults">{{ copyText }}</button>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '几何计算器 - 野火小站' })

const currentShape = ref('circle')
const params = reactive({})
const copyText = ref('📋 复制结果')
const previewCanvas = ref(null)

// 图形定义
const shapes = [
  { key: 'circle', name: '圆形', icon: '⭕' },
  { key: 'rectangle', name: '矩形', icon: '▬' },
  { key: 'triangle', name: '三角形', icon: '△' },
  { key: 'sphere', name: '球体', icon: '🔵' },
  { key: 'cylinder', name: '圆柱', icon: '🥫' },
  { key: 'cone', name: '圆锥', icon: '🔺' },
]

// 各图形参数定义
const shapeParams = {
  circle: [
    { key: 'radius', label: '半径', unit: 'cm' },
  ],
  rectangle: [
    { key: 'width', label: '宽度', unit: 'cm' },
    { key: 'height', label: '高度', unit: 'cm' },
  ],
  triangle: [
    { key: 'base', label: '底边', unit: 'cm' },
    { key: 'triHeight', label: '高', unit: 'cm' },
    { key: 'sideA', label: '边 a', unit: 'cm' },
    { key: 'sideB', label: '边 b', unit: 'cm' },
  ],
  sphere: [
    { key: 'radius', label: '半径', unit: 'cm' },
  ],
  cylinder: [
    { key: 'radius', label: '底面半径', unit: 'cm' },
    { key: 'cylHeight', label: '高度', unit: 'cm' },
  ],
  cone: [
    { key: 'radius', label: '底面半径', unit: 'cm' },
    { key: 'coneHeight', label: '高度', unit: 'cm' },
  ],
}

// 当前图形的参数列表
const currentParams = computed(() => shapeParams[currentShape.value] || [])

// 选择图形时初始化参数
function selectShape(key) {
  currentShape.value = key
  // 重置参数
  Object.keys(params).forEach(k => delete params[k])
  shapeParams[key].forEach(p => {
    params[p.key] = 0
  })
}

// 初始化默认参数
selectShape('circle')

// 格式化数字
function fmt(v) {
  if (v === undefined || v === null || isNaN(v)) return '—'
  if (Number.isInteger(v)) return v.toLocaleString()
  return v.toFixed(4).replace(/\.?0+$/, '')
}

// 计算结果
const currentResults = computed(() => {
  const s = currentShape.value
  const results = []

  if (s === 'circle') {
    const r = params.radius || 0
    results.push({ label: '面积', value: fmt(Math.PI * r * r) + ' cm²', formula: 'S = πr²' })
    results.push({ label: '周长', value: fmt(2 * Math.PI * r) + ' cm', formula: 'C = 2πr' })
    results.push({ label: '直径', value: fmt(2 * r) + ' cm', formula: 'd = 2r' })
  }

  if (s === 'rectangle') {
    const w = params.width || 0
    const h = params.height || 0
    results.push({ label: '面积', value: fmt(w * h) + ' cm²', formula: 'S = w × h' })
    results.push({ label: '周长', value: fmt(2 * (w + h)) + ' cm', formula: 'P = 2(w + h)' })
    results.push({ label: '对角线', value: fmt(Math.sqrt(w * w + h * h)) + ' cm', formula: 'd = √(w² + h²)' })
  }

  if (s === 'triangle') {
    const b = params.base || 0
    const h = params.triHeight || 0
    const a = params.sideA || 0
    const b2 = params.sideB || 0
    results.push({ label: '面积', value: fmt(0.5 * b * h) + ' cm²', formula: 'S = ½ × 底 × 高' })
    if (b > 0 && a > 0 && b2 > 0) {
      const perimeter = b + a + b2
      results.push({ label: '周长', value: fmt(perimeter) + ' cm', formula: 'P = a + b + c' })
      // 海伦公式验证
      const sp = perimeter / 2
      const heronArea = Math.sqrt(sp * (sp - b) * (sp - a) * (sp - b2))
      results.push({ label: '海伦公式面积', value: fmt(heronArea) + ' cm²', formula: 'S = √[s(s-a)(s-b)(s-c)]' })
    }
  }

  if (s === 'sphere') {
    const r = params.radius || 0
    results.push({ label: '体积', value: fmt((4 / 3) * Math.PI * r * r * r) + ' cm³', formula: 'V = ⁴⁄₃πr³' })
    results.push({ label: '表面积', value: fmt(4 * Math.PI * r * r) + ' cm²', formula: 'S = 4πr²' })
    results.push({ label: '直径', value: fmt(2 * r) + ' cm', formula: 'd = 2r' })
  }

  if (s === 'cylinder') {
    const r = params.radius || 0
    const h = params.cylHeight || 0
    results.push({ label: '体积', value: fmt(Math.PI * r * r * h) + ' cm³', formula: 'V = πr²h' })
    results.push({ label: '侧面积', value: fmt(2 * Math.PI * r * h) + ' cm²', formula: 'S_侧 = 2πrh' })
    results.push({ label: '表面积', value: fmt(2 * Math.PI * r * (r + h)) + ' cm²', formula: 'S = 2πr(r + h)' })
  }

  if (s === 'cone') {
    const r = params.radius || 0
    const h = params.coneHeight || 0
    const l = Math.sqrt(r * r + h * h) // 母线
    results.push({ label: '体积', value: fmt((1 / 3) * Math.PI * r * r * h) + ' cm³', formula: 'V = ⅓πr²h' })
    results.push({ label: '侧面积', value: fmt(Math.PI * r * l) + ' cm²', formula: 'S_侧 = πrl' })
    results.push({ label: '表面积', value: fmt(Math.PI * r * (r + l)) + ' cm²', formula: 'S = πr(r + l)' })
    results.push({ label: '母线长', value: fmt(l) + ' cm', formula: 'l = √(r² + h²)' })
  }

  return results
})

// 公式说明
const currentFormulas = computed(() => {
  const s = currentShape.value
  const map = {
    circle: ['面积: S = π × r²', '周长: C = 2 × π × r'],
    rectangle: ['面积: S = 宽 × 高', '周长: P = 2 × (宽 + 高)', '对角线: d = √(宽² + 高²)'],
    triangle: ['面积: S = ½ × 底 × 高', '周长: P = a + b + c', '海伦公式: S = √[s(s-a)(s-b)(s-c)], s=P/2'],
    sphere: ['体积: V = ⁴⁄₃ × π × r³', '表面积: S = 4 × π × r²'],
    cylinder: ['体积: V = π × r² × h', '侧面积: S_侧 = 2 × π × r × h', '表面积: S = 2 × π × r × (r + h)'],
    cone: ['体积: V = ⅓ × π × r² × h', '侧面积: S_侧 = π × r × l（l为母线）', '母线: l = √(r² + h²)'],
  }
  return map[s] || []
})

// Canvas 绘制图形预览
function drawPreview() {
  const canvas = previewCanvas.value
  if (!canvas) return

  const dpr = window.devicePixelRatio || 1
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  canvas.width = w * dpr
  canvas.height = h * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, w, h)

  const cx = w / 2
  const cy = h / 2
  const maxR = Math.min(w, h) * 0.35

  ctx.fillStyle = '#22c55e'
  ctx.strokeStyle = '#10b981'
  ctx.lineWidth = 2.5
  ctx.font = '13px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#555'

  const s = currentShape.value

  if (s === 'circle') {
    const r = Math.max(1, (params.radius || 5))
    const scale = maxR / Math.max(r, 0.01)
    const dr = Math.min(r * scale, maxR)
    // 填充
    ctx.beginPath()
    ctx.arc(cx, cy, dr, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(34, 197, 94, 0.15)'
    ctx.fill()
    ctx.strokeStyle = '#22c55e'
    ctx.stroke()
    // 半径线
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + dr, cy)
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = '#ef4444'
    ctx.stroke()
    ctx.setLineDash([])
    // 标注
    ctx.fillStyle = '#ef4444'
    ctx.fillText(`r = ${r}`, cx + dr / 2, cy - 10)
  }

  if (s === 'rectangle') {
    const rw = Math.max(1, params.width || 5)
    const rh = Math.max(1, params.height || 3)
    const scale = maxR / Math.max(rw, rh, 0.01)
    const dw = Math.min(rw * scale, maxR)
    const dh = Math.min(rh * scale, maxR)
    ctx.fillStyle = 'rgba(34, 197, 94, 0.15)'
    ctx.fillRect(cx - dw / 2, cy - dh / 2, dw, dh)
    ctx.strokeStyle = '#22c55e'
    ctx.strokeRect(cx - dw / 2, cy - dh / 2, dw, dh)
    ctx.fillStyle = '#ef4444'
    ctx.fillText(`w = ${rw}`, cx, cy + dh / 2 + 20)
    ctx.fillText(`h = ${rh}`, cx + dw / 2 + 35, cy)
  }

  if (s === 'triangle') {
    const base = Math.max(1, params.base || 5)
    const triH = Math.max(1, params.triHeight || 4)
    const scale = maxR / Math.max(base, triH, 0.01)
    const db = Math.min(base * scale, maxR)
    const dth = Math.min(triH * scale, maxR)
    ctx.beginPath()
    ctx.moveTo(cx, cy - dth / 2)
    ctx.lineTo(cx - db / 2, cy + dth / 2)
    ctx.lineTo(cx + db / 2, cy + dth / 2)
    ctx.closePath()
    ctx.fillStyle = 'rgba(34, 197, 94, 0.15)'
    ctx.fill()
    ctx.strokeStyle = '#22c55e'
    ctx.stroke()
    // 高虚线
    ctx.beginPath()
    ctx.moveTo(cx, cy - dth / 2)
    ctx.lineTo(cx, cy + dth / 2)
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = '#ef4444'
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#ef4444'
    ctx.fillText(`h = ${triH}`, cx + 20, cy)
    ctx.fillText(`base = ${base}`, cx, cy + dth / 2 + 20)
  }

  if (s === 'sphere') {
    const r = Math.max(1, params.radius || 5)
    const dr = Math.min(r * 0.5, maxR)
    // 球体椭圆+渐变
    const grad = ctx.createRadialGradient(cx - dr * 0.3, cy - dr * 0.3, dr * 0.1, cx, cy, dr)
    grad.addColorStop(0, 'rgba(34, 197, 94, 0.4)')
    grad.addColorStop(1, 'rgba(16, 185, 129, 0.08)')
    ctx.beginPath()
    ctx.arc(cx, cy, dr, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()
    ctx.strokeStyle = '#22c55e'
    ctx.stroke()
    // 赤道虚线
    ctx.beginPath()
    ctx.ellipse(cx, cy, dr, dr * 0.3, 0, 0, Math.PI * 2)
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)'
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#ef4444'
    ctx.fillText(`r = ${r}`, cx, cy - dr - 10)
  }

  if (s === 'cylinder') {
    const r = Math.max(1, params.radius || 3)
    const ch = Math.max(1, params.cylHeight || 5)
    const scale = maxR / Math.max(r, ch * 0.5, 0.01)
    const dr = Math.min(r * scale, maxR * 0.5)
    const dch = Math.min(ch * scale, maxR)
    // 侧面
    ctx.beginPath()
    ctx.moveTo(cx - dr, cy - dch / 2)
    ctx.lineTo(cx - dr, cy + dch / 2)
    ctx.ellipse(cx, cy + dch / 2, dr, dr * 0.3, 0, Math.PI, 0, true)
    ctx.lineTo(cx + dr, cy - dch / 2)
    ctx.ellipse(cx, cy - dch / 2, dr, dr * 0.3, 0, 0, Math.PI, true)
    ctx.closePath()
    ctx.fillStyle = 'rgba(34, 197, 94, 0.15)'
    ctx.fill()
    ctx.strokeStyle = '#22c55e'
    ctx.stroke()
    // 顶面椭圆
    ctx.beginPath()
    ctx.ellipse(cx, cy - dch / 2, dr, dr * 0.3, 0, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(34, 197, 94, 0.08)'
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#ef4444'
    ctx.fillText(`r = ${r}`, cx + dr + 35, cy - dch / 4)
    ctx.fillText(`h = ${ch}`, cx + dr + 35, cy + dch / 4)
  }

  if (s === 'cone') {
    const r = Math.max(1, params.radius || 3)
    const ch = Math.max(1, params.coneHeight || 5)
    const scale = maxR / Math.max(r, ch * 0.5, 0.01)
    const dr = Math.min(r * scale, maxR * 0.5)
    const dch = Math.min(ch * scale, maxR)
    // 侧面三角形+底面椭圆
    ctx.beginPath()
    ctx.moveTo(cx, cy - dch / 2)
    ctx.lineTo(cx - dr, cy + dch / 2)
    ctx.ellipse(cx, cy + dch / 2, dr, dr * 0.3, 0, Math.PI, 0, true)
    ctx.closePath()
    ctx.fillStyle = 'rgba(34, 197, 94, 0.15)'
    ctx.fill()
    ctx.strokeStyle = '#22c55e'
    ctx.stroke()
    // 底面椭圆
    ctx.beginPath()
    ctx.ellipse(cx, cy + dch / 2, dr, dr * 0.3, 0, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(34, 197, 94, 0.08)'
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#ef4444'
    ctx.fillText(`r = ${r}`, cx + dr + 35, cy + dch / 4)
    ctx.fillText(`h = ${ch}`, cx + dr + 35, cy - dch / 4)
  }
}

// 复制结果
function copyResults() {
  const s = currentShape.value
  let text = `几何计算器 - ${s} 计算结果\n`
  currentResults.value.forEach(r => {
    text += `${r.label}: ${r.value}\n`
  })
  currentFormulas.value.forEach(f => {
    text += f + '\n'
  })
  navigator.clipboard.writeText(text)
  copyText.value = '✅ 已复制'
  setTimeout(() => { copyText.value = '📋 复制结果' }, 1500)
}

// 监听参数和图形变化
watch([currentShape, () => ({ ...params })], () => {
  nextTick(drawPreview)
}, { deep: true })

onMounted(() => {
  drawPreview()
  window.addEventListener('resize', drawPreview)
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

/* 图形选择按钮 */
.shape-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.shape-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.shape-btn:hover {
  border-color: #22c55e;
  background: #f0fdf4;
}

.shape-btn.active {
  border-color: #22c55e;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  font-weight: 600;
}

/* 输入区域 */
.input-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
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
  align-items: center;
  gap: 0.5rem;
}

.num-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  background: white;
  min-width: 0;
}

.num-input:focus {
  outline: none;
  border-color: #22c55e;
}

.unit {
  color: #888;
  font-size: 0.85rem;
  white-space: nowrap;
}

/* 图形预览 */
.preview-section {
  margin-bottom: 1.5rem;
}

.preview-canvas {
  width: 100%;
  height: 200px;
  border-radius: 12px;
  background: #fafafa;
  border: 1px solid #eee;
}

/* 结果卡片 */
.result-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
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
  font-size: 1.3rem;
  font-weight: 700;
  color: #2c3e50;
}

.card-sub {
  font-size: 0.75rem;
  color: #aaa;
  margin-top: 0.2rem;
  font-family: monospace;
}

/* 公式说明 */
.formula-section {
  margin-bottom: 1.5rem;
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

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 1rem;
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
    grid-template-columns: 1fr 1fr;
  }
  .result-cards {
    grid-template-columns: 1fr 1fr;
  }
  .shape-selector {
    justify-content: center;
  }
}
</style>
