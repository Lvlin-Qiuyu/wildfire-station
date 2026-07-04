<template>
  <div class="tool-page">
    <h2>🔢 复数运算计算器</h2>
    <p class="subtitle">支持复数加减乘除、共轭、模/幅角计算，直角坐标与极坐标互转，复平面可视化</p>

    <!-- 输入区 -->
    <div class="calc-layout">
      <div class="input-panel">
        <!-- 复数 A 输入 -->
        <div class="complex-input">
          <label>复数 A</label>
          <div class="input-row">
            <div class="coord-group">
              <label class="coord-label">实部 (a)</label>
              <input v-model.number="a_real" type="number" step="any" class="num-input" placeholder="0" />
            </div>
            <div class="coord-group">
              <label class="coord-label">虚部 (b)</label>
              <input v-model.number="a_imag" type="number" step="any" class="num-input" placeholder="0" />
            </div>
          </div>
          <div class="display-text">A = {{ formatComplex(a_real, a_imag) }}</div>
        </div>

        <!-- 复数 B 输入 -->
        <div class="complex-input">
          <label>复数 B</label>
          <div class="input-row">
            <div class="coord-group">
              <label class="coord-label">实部 (c)</label>
              <input v-model.number="b_real" type="number" step="any" class="num-input" placeholder="0" />
            </div>
            <div class="coord-group">
              <label class="coord-label">虚部 (d)</label>
              <input v-model.number="b_imag" type="number" step="any" class="num-input" placeholder="0" />
            </div>
          </div>
          <div class="display-text">B = {{ formatComplex(b_real, b_imag) }}</div>
        </div>

        <!-- 运算按钮 -->
        <div class="op-buttons">
          <button class="btn-op" @click="calculate('add')">A + B</button>
          <button class="btn-op" @click="calculate('sub')">A − B</button>
          <button class="btn-op" @click="calculate('mul')">A × B</button>
          <button class="btn-op" @click="calculate('div')">A ÷ B</button>
        </div>

        <!-- 单操作按钮 -->
        <div class="op-buttons">
          <button class="btn-op btn-secondary" @click="calculate('conjA')">A 的共轭</button>
          <button class="btn-op btn-secondary" @click="calculate('conjB')">B 的共轭</button>
        </div>

        <!-- 结果区 -->
        <div v-if="result" class="result-box">
          <div class="result-header">计算结果</div>
          <div class="result-value">{{ result }}</div>
          <div v-if="resultPolar" class="result-polar">极坐标: {{ resultPolar }}</div>
          <div v-if="resultMod" class="result-mod">模: |z| = {{ resultMod }} · 幅角: θ = {{ resultArg }}°</div>
        </div>

        <!-- 快捷输入 -->
        <div class="quick-section">
          <label>快捷输入</label>
          <div class="quick-buttons">
            <button class="btn-quick" @click="setA(1, 0)">A = 1</button>
            <button class="btn-quick" @click="setA(0, 1)">A = i</button>
            <button class="btn-quick" @click="setA(-1, 0)">A = -1</button>
            <button class="btn-quick" @click="setA(0, -1)">A = -i</button>
            <button class="btn-quick" @click="setA(1, 1)">A = 1+i</button>
            <button class="btn-quick" @click="setA(3, 4)">A = 3+4i</button>
            <button class="btn-quick" @click="setB(1, 0)">B = 1</button>
            <button class="btn-quick" @click="setB(0, 1)">B = i</button>
            <button class="btn-quick" @click="setB(1, 1)">B = 1+i</button>
          </div>
        </div>
      </div>

      <!-- 复平面可视化 -->
      <div class="canvas-panel">
        <div class="canvas-section">
          <label>📐 复平面</label>
          <div class="canvas-container" ref="planeContainer">
            <canvas ref="planeCanvas" class="vis-canvas" @mousemove="onPlaneHover" @mouseleave="hoverInfo = ''" />
          </div>
          <div v-if="hoverInfo" class="hover-tip">{{ hoverInfo }}</div>
        </div>

        <!-- 历史记录 -->
        <div class="history-section">
          <div class="history-header">
            <label>📝 计算历史</label>
            <button class="btn-clear" @click="history = []">清空</button>
          </div>
          <div v-if="history.length === 0" class="empty-history">暂无记录</div>
          <div v-else class="history-list">
            <div v-for="(item, i) in history" :key="i" class="history-item">
              <span class="history-expr">{{ item.expr }}</span>
              <span class="history-result">= {{ item.result }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '复数运算计算器 - 野火小站' })

const planeContainer = ref(null)
const planeCanvas = ref(null)

const a_real = ref(0)
const a_imag = ref(0)
const b_real = ref(0)
const b_imag = ref(0)

const result = ref('')
const resultPolar = ref('')
const resultMod = ref('')
const resultArg = ref('')
const hoverInfo = ref('')

let resultReal = 0
let resultImag = 0

const history = reactive([])

// 格式化复数
function formatComplex(re, im) {
  re = parseFloat(re) || 0
  im = parseFloat(im) || 0

  if (re === 0 && im === 0) return '0'
  if (im === 0) return String(re)
  if (re === 0) return im === 1 ? 'i' : im === -1 ? '-i' : `${im}i`

  const imStr = im === 1 ? 'i' : im === -1 ? '-i' : `${Math.abs(im)}i`
  return `${re}${im > 0 ? '+' : ''}${imStr}`
}

// 快捷设置
function setA(re, im) { a_real.value = re; a_imag.value = im; drawPlane() }
function setB(re, im) { b_real.value = re; b_imag.value = im; drawPlane() }

// 复数运算
function calculate(op) {
  const ar = parseFloat(a_real.value) || 0
  const ai = parseFloat(a_imag.value) || 0
  const br = parseFloat(b_real.value) || 0
  const bi = parseFloat(b_imag.value) || 0

  let re = 0, im = 0, expr = ''

  switch (op) {
    case 'add':
      re = ar + br; im = ai + bi
      expr = `${formatComplex(ar, ai)} + ${formatComplex(br, bi)}`
      break
    case 'sub':
      re = ar - br; im = ai - bi
      expr = `${formatComplex(ar, ai)} − ${formatComplex(br, bi)}`
      break
    case 'mul':
      re = ar * br - ai * bi; im = ar * bi + ai * br
      expr = `${formatComplex(ar, ai)} × ${formatComplex(br, bi)}`
      break
    case 'div':
      const denom = br * br + bi * bi
      if (denom === 0) {
        result.value = '错误：除数不能为 0'
        resultPolar.value = ''; resultMod.value = ''; resultArg.value = ''
        return
      }
      re = (ar * br + ai * bi) / denom
      im = (ai * br - ar * bi) / denom
      expr = `${formatComplex(ar, ai)} ÷ ${formatComplex(br, bi)}`
      break
    case 'conjA':
      re = ar; im = -ai
      expr = `conj(${formatComplex(ar, ai)})`
      break
    case 'conjB':
      re = br; im = -bi
      expr = `conj(${formatComplex(br, bi)})`
      break
  }

  resultReal = re
  resultImag = im
  result.value = formatComplex(re, im)

  // 极坐标
  const mod = Math.sqrt(re * re + im * im)
  const arg = Math.atan2(im, re) * (180 / Math.PI)
  resultPolar.value = `${mod.toFixed(4)} · e^(i·${arg.toFixed(2)}°)`
  resultMod.value = mod.toFixed(6)
  resultArg.value = arg.toFixed(2)

  // 记录历史
  history.unshift({ expr, result: result.value })
  if (history.length > 20) history.pop()

  drawPlane()
}

// 绘制复平面
function drawPlane() {
  const canvas = planeCanvas.value
  const container = planeContainer.value
  if (!canvas || !container) return

  const dpr = window.devicePixelRatio || 1
  const size = Math.min(container.clientWidth - 20, 400)

  canvas.width = size * dpr
  canvas.height = size * dpr
  canvas.style.width = size + 'px'
  canvas.style.height = size + 'px'

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  const cx = size / 2
  const cy = size / 2
  const scale = size / 10 // -5 到 5

  // 背景
  ctx.fillStyle = '#fafbfc'
  ctx.fillRect(0, 0, size, size)

  // 网格
  ctx.strokeStyle = '#eef0f2'
  ctx.lineWidth = 1
  for (let i = -5; i <= 5; i++) {
    const pos = cx + i * scale
    ctx.beginPath(); ctx.moveTo(pos, 0); ctx.lineTo(pos, size); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, cy - i * scale); ctx.lineTo(size, cy - i * scale); ctx.stroke()
  }

  // 坐标轴
  ctx.strokeStyle = '#ccc'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(size, cy); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, size); ctx.stroke()

  // 轴标签
  ctx.fillStyle = '#888'
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'center'
  for (let i = -4; i <= 4; i++) {
    if (i === 0) continue
    ctx.fillText(String(i), cx + i * scale, cy + 16)
    ctx.fillText(String(i), cx - 14, cy - i * scale + 4)
  }
  ctx.fillText('Re', size - 12, cy + 16)
  ctx.fillText('Im', cx + 14, 12)

  // 复数 A
  drawVector(ctx, cx, cy, scale, a_real.value, a_imag.value, '#22c55e', 'A')

  // 复数 B
  drawVector(ctx, cx, cy, scale, b_real.value, b_imag.value, '#3b82f6', 'B')

  // 结果
  if (result.value) {
    drawVector(ctx, cx, cy, scale, resultReal, resultImag, '#ef4444', '结果')
  }
}

// 绘制向量
function drawVector(ctx, cx, cy, scale, re, im, color, label) {
  re = parseFloat(re) || 0
  im = parseFloat(im) || 0
  if (re === 0 && im === 0) return

  const x = cx + re * scale
  const y = cy - im * scale

  // 向量线
  ctx.strokeStyle = color
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(x, y)
  ctx.stroke()

  // 箭头
  const angle = Math.atan2(cy - y, x - cx)
  const headLen = 10
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x - headLen * Math.cos(angle - 0.4), y + headLen * Math.sin(angle - 0.4))
  ctx.lineTo(x - headLen * Math.cos(angle + 0.4), y + headLen * Math.sin(angle + 0.4))
  ctx.closePath()
  ctx.fill()

  // 点
  ctx.beginPath()
  ctx.arc(x, y, 5, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // 标签
  ctx.fillStyle = color
  ctx.font = 'bold 13px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(`${label}(${formatComplex(re, im)})`, x + 8, y - 8)
}

// 鼠标悬浮
function onPlaneHover(e) {
  const canvas = planeCanvas.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const size = canvas.clientWidth
  const cx = size / 2
  const cy = size / 2
  const scale = size / 10

  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  const re = ((x - cx) / scale).toFixed(2)
  const im = (-(y - cy) / scale).toFixed(2)
  hoverInfo.value = `Re: ${re}, Im: ${im}`
}

// 监听输入变化重绘
watch([a_real, a_imag, b_real, b_imag], () => drawPlane())

onMounted(() => {
  drawPlane()
  window.addEventListener('resize', drawPlane)
})

onUnmounted(() => {
  window.removeEventListener('resize', drawPlane)
})
</script>

<style scoped>
.tool-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 1rem;
}

h2 { font-size: 1.6rem; margin-bottom: 0.5rem; }
.subtitle { color: #666; margin-bottom: 1.5rem; }

.calc-layout {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

/* 输入面板 */
.input-panel {
  flex: 0 0 360px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.complex-input {
  background: #fff;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border: 1px solid #eee;
}

.complex-input > label {
  font-weight: 600;
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 0.5rem;
  display: block;
}

.input-row {
  display: flex;
  gap: 0.8rem;
}

.coord-group {
  flex: 1;
}

.coord-label {
  font-size: 0.8rem;
  color: #888;
  margin-bottom: 0.2rem;
  display: block;
}

.num-input {
  width: 100%;
  padding: 0.5rem 0.6rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  box-sizing: border-box;
  text-align: center;
}

.num-input:focus { border-color: #22c55e; }

.display-text {
  margin-top: 0.5rem;
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  color: #22c55e;
  font-weight: 600;
}

/* 运算按钮 */
.op-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-op {
  flex: 1;
  min-width: 80px;
  padding: 0.6rem 0.5rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  font-weight: 600;
  transition: opacity 0.2s;
}

.btn-op:hover { opacity: 0.85; }
.btn-op.btn-secondary { background: linear-gradient(135deg, #6366f1, #8b5cf6); }

/* 结果 */
.result-box {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  padding: 1rem;
}

.result-header {
  font-size: 0.85rem;
  color: #16a34a;
  font-weight: 600;
  margin-bottom: 0.3rem;
}

.result-value {
  font-family: 'Courier New', monospace;
  font-size: 1.3rem;
  font-weight: 700;
  color: #2c3e50;
}

.result-polar, .result-mod {
  font-size: 0.85rem;
  color: #666;
  margin-top: 0.3rem;
  font-family: 'Courier New', monospace;
}

/* 快捷按钮 */
.quick-section label {
  font-weight: 600;
  font-size: 0.9rem;
  color: #555;
  display: block;
  margin-bottom: 0.4rem;
}

.quick-buttons {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.btn-quick {
  padding: 0.3rem 0.6rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #f8f9fa;
  font-size: 0.8rem;
  color: #555;
  cursor: pointer;
}

.btn-quick:hover { border-color: #22c55e; color: #22c55e; }

/* 画布面板 */
.canvas-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.canvas-section {
  background: #fff;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border: 1px solid #eee;
}

.canvas-section > label {
  font-weight: 600;
  font-size: 0.95rem;
  color: #555;
  display: block;
  margin-bottom: 0.5rem;
}

.canvas-container {
  background: #fafbfc;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  justify-content: center;
}

.vis-canvas { border-radius: 4px; }

.hover-tip {
  text-align: center;
  font-size: 0.8rem;
  color: #22c55e;
  font-family: monospace;
  margin-top: 0.3rem;
}

/* 历史 */
.history-section {
  background: #fff;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border: 1px solid #eee;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.history-header label {
  font-weight: 600;
  font-size: 0.9rem;
  color: #555;
}

.btn-clear {
  padding: 0.2rem 0.6rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #f8f9fa;
  font-size: 0.75rem;
  cursor: pointer;
  color: #888;
}

.btn-clear:hover { border-color: #ef4444; color: #ef4444; }

.empty-history {
  color: #ccc;
  font-size: 0.85rem;
  text-align: center;
  padding: 1rem;
}

.history-list {
  max-height: 200px;
  overflow-y: auto;
}

.history-item {
  padding: 0.4rem 0;
  border-bottom: 1px solid #f5f5f5;
  font-size: 0.82rem;
  font-family: 'Courier New', monospace;
}

.history-expr { color: #666; }
.history-result { color: #22c55e; font-weight: 600; }

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #22c55e;
  font-weight: 500;
}

.back-link:hover { text-decoration: underline; }

@media (max-width: 768px) {
  .calc-layout { flex-direction: column; }
  .input-panel { flex: none; width: 100%; }
}
</style>
