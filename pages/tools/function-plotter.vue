<template>
  <div class="tool-page">
    <h2>📈 函数图像绘制器</h2>
    <p class="subtitle">输入数学表达式，Canvas 实时绘制函数曲线，支持多函数叠加、缩放平移</p>

    <div class="plotter-layout">
      <!-- 左侧控制面板 -->
      <div class="controls-panel">
        <!-- 函数列表 -->
        <div class="section">
          <div class="section-header">
            <label>函数列表</label>
            <button class="btn-add" @click="addFunction">+ 添加</button>
          </div>
          <div class="func-list">
            <div v-for="(fn, index) in functions" :key="index" class="func-item">
              <div class="func-input-row">
                <span class="color-dot" :style="{ background: fn.color }" @click="cycleColor(index)"></span>
                <span class="func-label">f<sub>{{ index + 1 }}</sub>(x) =</span>
                <input
                  v-model="fn.expr"
                  class="func-input"
                  :placeholder="'例如 ' + placeholders[index % placeholders.length]"
                  spellcheck="false"
                  @keydown.enter="draw"
                />
                <button v-if="functions.length > 1" class="btn-remove" @click="removeFunction(index)">✕</button>
              </div>
              <!-- 导数切换 -->
              <div class="func-options">
                <label class="toggle-label">
                  <input type="checkbox" v-model="fn.showDerivative" />
                  <span>显示导数</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <button class="btn-primary" @click="draw">绘制</button>
          <button class="btn-secondary" @click="resetView">重置视图</button>
          <button class="btn-secondary" @click="toggleGrid">网格: {{ showGrid ? '开' : '关' }}</button>
        </div>

        <!-- 坐标范围 -->
        <div class="section">
          <label>坐标范围</label>
          <div class="range-grid">
            <div class="range-item">
              <span>X 最小</span>
              <input type="number" v-model.number="viewRange.xMin" step="0.5" @change="draw" />
            </div>
            <div class="range-item">
              <span>X 最大</span>
              <input type="number" v-model.number="viewRange.xMax" step="0.5" @change="draw" />
            </div>
            <div class="range-item">
              <span>Y 最小</span>
              <input type="number" v-model.number="viewRange.yMin" step="0.5" @change="draw" />
            </div>
            <div class="range-item">
              <span>Y 最大</span>
              <input type="number" v-model.number="viewRange.yMax" step="0.5" @change="draw" />
            </div>
          </div>
        </div>

        <!-- 鼠标坐标 -->
        <div class="mouse-info">
          <span>鼠标坐标：</span>
          <span class="coord">{{ mouseCoord.x.toFixed(3) }}, {{ mouseCoord.y.toFixed(3) }}</span>
        </div>
      </div>

      <!-- 右侧画布 -->
      <div class="canvas-wrapper" ref="canvasWrapper">
        <canvas
          ref="plotCanvas"
          @mousedown="onMouseDown"
          @mousemove="onMouseMove"
          @mouseup="onMouseUp"
          @mouseleave="onMouseLeave"
          @wheel.prevent="onWheel"
          @touchstart.prevent="onTouchStart"
          @touchmove.prevent="onTouchMove"
          @touchend.prevent="onTouchEnd"
        />
      </div>
    </div>

    <!-- 表达式参考 -->
    <div class="reference">
      <h3>表达式参考</h3>
      <div class="ref-grid">
        <div class="ref-item" v-for="ref in references" :key="ref.title">
          <span class="ref-title">{{ ref.title }}</span>
          <span class="ref-example">{{ ref.example }}</span>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({
  title: '函数图像绘制器 - 野火小站',
  script: [
    { src: 'https://cdn.jsdelivr.net/npm/mathjs@13/lib/browser/math.min.js', defer: true }
  ]
})

// 画布引用
const plotCanvas = ref(null)
const canvasWrapper = ref(null)

// 预设颜色
const colors = [
  '#ef4444', '#22c55e', '#3b82f6', '#f59e0b',
  '#a855f7', '#ec4899', '#06b6d4', '#f97316'
]

// 占位符提示
const placeholders = [
  'sin(x)', 'x^2 + 2*x - 1', 'cos(x)*exp(-x/5)',
  'tan(x)', 'log(x)', 'sqrt(x)', 'abs(x)'
]

// 函数列表
const functions = reactive([
  { expr: 'sin(x)', color: colors[0], showDerivative: false },
  { expr: 'cos(x)', color: colors[1], showDerivative: false }
])

// 坐标范围
const viewRange = reactive({
  xMin: -10,
  xMax: 10,
  yMin: -5,
  yMax: 5
})

// 显示选项
const showGrid = ref(true)

// 鼠标状态
const mouseCoord = reactive({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = reactive({ x: 0, y: 0 })
const dragRangeStart = reactive({ xMin: 0, xMax: 0, yMin: 0, yMax: 0 })

// 触摸状态
const lastTouchDist = ref(0)
const lastTouchCenter = reactive({ x: 0, y: 0 })

// 参考文档
const references = [
  { title: '基本运算', example: 'x^2, x^3, 1/x, sqrt(x)' },
  { title: '三角函数', example: 'sin(x), cos(x), tan(x)' },
  { title: '指数对数', example: 'exp(x), log(x), log2(x), log10(x)' },
  { title: '绝对值', example: 'abs(x), sign(x)' },
  { title: '取整', example: 'ceil(x), floor(x), round(x)' },
  { title: '组合示例', example: 'sin(x)*exp(-x/5)' },
  { title: '常量', example: 'pi, e' },
  { title: '运算符', example: '+, -, *, /, ^（幂）' },
]

// 添加函数
function addFunction() {
  if (functions.length >= 8) return
  const colorIdx = functions.length % colors.length
  functions.push({
    expr: '',
    color: colors[colorIdx],
    showDerivative: false
  })
}

// 删除函数
function removeFunction(index) {
  functions.splice(index, 1)
  draw()
}

// 切换颜色
function cycleColor(index) {
  const currentIdx = colors.indexOf(functions[index].color)
  functions[index].color = colors[(currentIdx + 1) % colors.length]
  draw()
}

// 切换网格
function toggleGrid() {
  showGrid.value = !showGrid.value
  draw()
}

// 重置视图
function resetView() {
  viewRange.xMin = -10
  viewRange.xMax = 10
  viewRange.yMin = -5
  viewRange.yMax = 5
  draw()
}

// 安全求值函数表达式
function createEvalFunction(expr) {
  if (!expr.trim()) return null
  let s = expr.trim()
  // 替换常见写法
  s = s.replace(/\^/g, '**')

  try {
    // 使用 math.js 的 compile 来安全编译表达式
    const compiled = math.compile(s)
    // 返回求值函数，x 为自变量
    return (x) => {
      try {
        const result = compiled.evaluate({ x, pi: Math.PI, e: Math.E })
        if (typeof result === 'number' && isFinite(result)) return result
        if (result && typeof result.re === 'number') {
          // 复数结果取实部
          const re = result.re
          if (isFinite(re)) return re
        }
        return NaN
      } catch {
        return NaN
      }
    }
  } catch {
    return null
  }
}

// 数值求导（中心差分）
function numericalDerivative(fn, x, h = 0.0001) {
  const y1 = fn(x - h)
  const y2 = fn(x + h)
  if (isNaN(y1) || isNaN(y2)) return NaN
  return (y2 - y1) / (2 * h)
}

// 绘制所有内容
function draw() {
  const canvas = plotCanvas.value
  if (!canvas) return
  const wrapper = canvasWrapper.value
  if (!wrapper) return

  // 设置画布尺寸（高DPI支持）
  const dpr = window.devicePixelRatio || 1
  const rect = wrapper.getBoundingClientRect()
  const width = rect.width
  const height = Math.max(400, Math.min(600, window.innerHeight - 200))
  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = width + 'px'
  canvas.style.height = height + 'px'

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, width, height)

  // 背景
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  // 坐标转换
  const xRange = viewRange.xMax - viewRange.xMin
  const yRange = viewRange.yMax - viewRange.yMin

  function toScreenX(x) {
    return ((x - viewRange.xMin) / xRange) * width
  }
  function toScreenY(y) {
    return height - ((y - viewRange.yMin) / yRange) * height
  }
  function toMathX(sx) {
    return viewRange.xMin + (sx / width) * xRange
  }
  function toMathY(sy) {
    return viewRange.yMax - (sy / height) * yRange
  }

  // 计算合适的网格步长
  function niceStep(range) {
    const rough = range / 10
    const pow = Math.pow(10, Math.floor(Math.log10(rough)))
    const norm = rough / pow
    let step
    if (norm < 1.5) step = 1
    else if (norm < 3) step = 2
    else if (norm < 7) step = 5
    else step = 10
    return step * pow
  }

  const stepX = niceStep(xRange)
  const stepY = niceStep(yRange)

  // 绘制网格
  if (showGrid.value) {
    ctx.strokeStyle = '#f0f0f0'
    ctx.lineWidth = 1

    // 竖线
    let xStart = Math.ceil(viewRange.xMin / stepX) * stepX
    for (let x = xStart; x <= viewRange.xMax; x += stepX) {
      const sx = toScreenX(x)
      ctx.beginPath()
      ctx.moveTo(sx, 0)
      ctx.lineTo(sx, height)
      ctx.stroke()
    }

    // 横线
    let yStart = Math.ceil(viewRange.yMin / stepY) * stepY
    for (let y = yStart; y <= viewRange.yMax; y += stepY) {
      const sy = toScreenY(y)
      ctx.beginPath()
      ctx.moveTo(0, sy)
      ctx.lineTo(width, sy)
      ctx.stroke()
    }
  }

  // 绘制坐标轴
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 1.5

  // X 轴
  if (viewRange.yMin <= 0 && viewRange.yMax >= 0) {
    const axisY = toScreenY(0)
    ctx.beginPath()
    ctx.moveTo(0, axisY)
    ctx.lineTo(width, axisY)
    ctx.stroke()
  }

  // Y 轴
  if (viewRange.xMin <= 0 && viewRange.xMax >= 0) {
    const axisX = toScreenX(0)
    ctx.beginPath()
    ctx.moveTo(axisX, 0)
    ctx.lineTo(axisX, height)
    ctx.stroke()
  }

  // 坐标刻度标签
  ctx.fillStyle = '#666'
  ctx.font = '11px -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  // X轴刻度
  let labelY = toScreenY(0)
  if (labelY < 15) labelY = 15
  if (labelY > height - 5) labelY = height - 18

  xStart = Math.ceil(viewRange.xMin / stepX) * stepX
  for (let x = xStart; x <= viewRange.xMax; x += stepX) {
    if (Math.abs(x) < stepX * 0.01) continue // 跳过原点
    const sx = toScreenX(x)
    const label = Number.isInteger(x) ? String(x) : x.toFixed(2).replace(/\.?0+$/, '')
    ctx.fillText(label, sx, labelY + 2)
  }

  // Y轴刻度
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  let labelX = toScreenX(0)
  if (labelX < 30) labelX = 35
  if (labelX > width - 5) labelX = width - 10

  yStart = Math.ceil(viewRange.yMin / stepY) * stepY
  for (let y = yStart; y <= viewRange.yMax; y += stepY) {
    if (Math.abs(y) < stepY * 0.01) continue
    const sy = toScreenY(y)
    const label = Number.isInteger(y) ? String(y) : y.toFixed(2).replace(/\.?0+$/, '')
    ctx.fillText(label, labelX - 5, sy)
  }

  // 绘制函数曲线
  const pixels = Math.max(width, 1000) // 采样点数
  for (let fi = 0; fi < functions.length; fi++) {
    const fn = functions[fi]
    if (!fn.expr.trim()) continue

    const evalFn = createEvalFunction(fn.expr)
    if (!evalFn) continue

    // 绘制主函数
    drawCurve(ctx, evalFn, fn.color, pixels, width, height, toScreenX, toMathX, 2.5, false)

    // 绘制导数
    if (fn.showDerivative) {
      const derivFn = (x) => numericalDerivative(evalFn, x)
      drawCurve(ctx, derivFn, fn.color, pixels, width, height, toScreenX, toMathX, 1.5, true)
    }
  }

  // 存储转换函数供鼠标事件使用
  canvas._toMathX = toMathX
  canvas._toMathY = toMathY
}

// 绘制单条曲线
function drawCurve(ctx, evalFn, color, pixels, width, height, toScreenX, toMathX, lineWidth, dashed) {
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  if (dashed) ctx.setLineDash([6, 4])
  else ctx.setLineDash([])

  ctx.beginPath()
  let drawing = false
  let prevY = NaN

  for (let i = 0; i <= pixels; i++) {
    const sx = (i / pixels) * width
    const mx = toMathX(sx)
    const my = evalFn(mx)

    if (isNaN(my) || !isFinite(my)) {
      drawing = false
      prevY = NaN
      continue
    }

    // 检测不连续点（跳跃大于视图高度的50%）
    if (!isNaN(prevY) && Math.abs(my - prevY) > (viewRange.yMax - viewRange.yMin) * 0.5) {
      drawing = false
    }

    const sy = height - ((my - viewRange.yMin) / (viewRange.yMax - viewRange.yMin)) * height

    if (!drawing) {
      ctx.moveTo(sx, sy)
      drawing = true
    } else {
      ctx.lineTo(sx, sy)
    }
    prevY = my
  }
  ctx.stroke()
  ctx.setLineDash([])
}

// 鼠标事件 - 平移
function onMouseDown(e) {
  isDragging.value = true
  dragStart.x = e.clientX
  dragStart.y = e.clientY
  dragRangeStart.xMin = viewRange.xMin
  dragRangeStart.xMax = viewRange.xMax
  dragRangeStart.yMin = viewRange.yMin
  dragRangeStart.yMax = viewRange.yMax
  plotCanvas.value.style.cursor = 'grabbing'
}

function onMouseMove(e) {
  const canvas = plotCanvas.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const sx = e.clientX - rect.left
  const sy = e.clientY - rect.top

  if (canvas._toMathX) {
    mouseCoord.x = canvas._toMathX(sx)
    mouseCoord.y = canvas._toMathY(sy)
  }

  if (isDragging.value) {
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y
    const xRange = dragRangeStart.xMax - dragRangeStart.xMin
    const yRange = dragRangeStart.yMax - dragRangeStart.yMin
    const dxMath = -(dx / rect.width) * xRange
    const dyMath = (dy / rect.height) * yRange

    viewRange.xMin = dragRangeStart.xMin + dxMath
    viewRange.xMax = dragRangeStart.xMax + dxMath
    viewRange.yMin = dragRangeStart.yMin + dyMath
    viewRange.yMax = dragRangeStart.yMax + dyMath

    draw()
  }
}

function onMouseUp() {
  isDragging.value = false
  plotCanvas.value.style.cursor = 'crosshair'
}

function onMouseLeave() {
  isDragging.value = false
  if (plotCanvas.value) plotCanvas.value.style.cursor = 'crosshair'
}

// 鼠标滚轮 - 缩放
function onWheel(e) {
  const canvas = plotCanvas.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const sx = e.clientX - rect.left
  const sy = e.clientY - rect.top

  if (canvas._toMathX) {
    const mx = canvas._toMathX(sx)
    const my = canvas._toMathY(sy)

    const factor = e.deltaY > 0 ? 1.15 : 0.87

    viewRange.xMin = mx + (viewRange.xMin - mx) * factor
    viewRange.xMax = mx + (viewRange.xMax - mx) * factor
    viewRange.yMin = my + (viewRange.yMin - my) * factor
    viewRange.yMax = my + (viewRange.yMax - my) * factor

    draw()
  }
}

// 触摸事件 - 移动端支持
function onTouchStart(e) {
  if (e.touches.length === 1) {
    isDragging.value = true
    dragStart.x = e.touches[0].clientX
    dragStart.y = e.touches[0].clientY
    dragRangeStart.xMin = viewRange.xMin
    dragRangeStart.xMax = viewRange.xMax
    dragRangeStart.yMin = viewRange.yMin
    dragRangeStart.yMax = viewRange.yMax
  } else if (e.touches.length === 2) {
    isDragging.value = false
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    lastTouchDist.value = Math.sqrt(dx * dx + dy * dy)
    lastTouchCenter.x = (e.touches[0].clientX + e.touches[1].clientX) / 2
    lastTouchCenter.y = (e.touches[0].clientY + e.touches[1].clientY) / 2
  }
}

function onTouchMove(e) {
  if (e.touches.length === 1 && isDragging.value) {
    const dx = e.touches[0].clientX - dragStart.x
    const dy = e.touches[0].clientY - dragStart.y
    const canvas = plotCanvas.value
    const rect = canvas.getBoundingClientRect()
    const xRange = dragRangeStart.xMax - dragRangeStart.xMin
    const yRange = dragRangeStart.yMax - dragRangeStart.yMin
    const dxMath = -(dx / rect.width) * xRange
    const dyMath = (dy / rect.height) * yRange

    viewRange.xMin = dragRangeStart.xMin + dxMath
    viewRange.xMax = dragRangeStart.xMax + dxMath
    viewRange.yMin = dragRangeStart.yMin + dyMath
    viewRange.yMax = dragRangeStart.yMax + dyMath

    draw()
  } else if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (lastTouchDist.value > 0) {
      const canvas = plotCanvas.value
      const rect = canvas.getBoundingClientRect()
      const cx = lastTouchCenter.x - rect.left
      const cy = lastTouchCenter.y - rect.top

      if (canvas._toMathX) {
        const mx = canvas._toMathX(cx)
        const my = canvas._toMathY(cy)
        const factor = lastTouchDist.value / dist

        viewRange.xMin = mx + (viewRange.xMin - mx) * factor
        viewRange.xMax = mx + (viewRange.xMax - mx) * factor
        viewRange.yMin = my + (viewRange.yMin - my) * factor
        viewRange.yMax = my + (viewRange.yMax - my) * factor

        draw()
      }
    }
    lastTouchDist.value = dist
  }
}

function onTouchEnd(e) {
  if (e.touches.length < 2) {
    lastTouchDist.value = 0
  }
  if (e.touches.length === 0) {
    isDragging.value = false
  }
}

// 窗口大小变化时重绘
function onResize() {
  draw()
}

onMounted(() => {
  window.addEventListener('resize', onResize)
  // 等待 mathjs 加载完成后绘制
  const checkAndDraw = () => {
    if (typeof math !== 'undefined') {
      draw()
    } else {
      setTimeout(checkAndDraw, 100)
    }
  }
  checkAndDraw()
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.tool-page {
  max-width: 1100px;
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

.plotter-layout {
  display: flex;
  gap: 1.2rem;
  margin-bottom: 1.5rem;
}

/* 控制面板 */
.controls-panel {
  flex: 0 0 320px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section {
  background: #fff;
  border-radius: 10px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.6rem;
}

.section-header label,
.section label {
  display: block;
  font-weight: 600;
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 0.4rem;
}

.btn-add {
  padding: 0.25rem 0.6rem;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  color: #555;
  transition: all 0.2s;
}

.btn-add:hover {
  background: #e0e0e0;
}

/* 函数列表 */
.func-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.func-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 0.6rem;
}

.func-input-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.color-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid rgba(0,0,0,0.1);
  transition: transform 0.15s;
  flex-shrink: 0;
}

.color-dot:hover {
  transform: scale(1.2);
}

.func-label {
  font-size: 0.85rem;
  color: #555;
  font-weight: 600;
  white-space: nowrap;
}

.func-input {
  flex: 1;
  min-width: 0;
  padding: 0.35rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.85rem;
  font-family: 'Courier New', monospace;
  background: #fff;
  transition: border-color 0.2s;
}

.func-input:focus {
  outline: none;
  border-color: #22c55e;
}

.btn-remove {
  width: 24px;
  height: 24px;
  border: none;
  background: #fee;
  color: #e74c3c;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.btn-remove:hover {
  background: #fdd;
}

.func-options {
  margin-top: 0.3rem;
  padding-left: 1.6rem;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  color: #888;
  cursor: pointer;
}

.toggle-label input[type="checkbox"] {
  accent-color: #22c55e;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-primary {
  flex: 1;
  padding: 0.6rem 1rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: opacity 0.2s;
}

.btn-primary:hover {
  opacity: 0.85;
}

.btn-secondary {
  flex: 1;
  padding: 0.6rem 0.8rem;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #555;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

/* 坐标范围 */
.range-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem;
}

.range-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  color: #888;
}

.range-item span {
  white-space: nowrap;
  min-width: 40px;
}

.range-item input {
  width: 70px;
  padding: 0.3rem 0.4rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 0.8rem;
  font-family: 'Courier New', monospace;
  text-align: center;
}

.range-item input:focus {
  outline: none;
  border-color: #22c55e;
}

/* 鼠标坐标 */
.mouse-info {
  font-size: 0.8rem;
  color: #888;
  padding: 0 0.3rem;
}

.coord {
  font-family: 'Courier New', monospace;
  color: #22c55e;
  font-weight: 600;
}

/* 画布 */
.canvas-wrapper {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  overflow: hidden;
  min-height: 400px;
}

.canvas-wrapper canvas {
  display: block;
  cursor: crosshair;
}

/* 表达式参考 */
.reference {
  background: #fff;
  border-radius: 10px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 1rem;
}

.reference h3 {
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 0.6rem;
}

.ref-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.5rem;
}

.ref-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0.6rem;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 0.8rem;
}

.ref-title {
  color: #555;
  font-weight: 600;
}

.ref-example {
  color: #999;
  font-family: 'Courier New', monospace;
  font-size: 0.72rem;
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

@media (max-width: 768px) {
  .plotter-layout {
    flex-direction: column;
  }

  .controls-panel {
    flex: none;
    width: 100%;
  }

  .canvas-wrapper {
    min-height: 300px;
  }
}
</style>
