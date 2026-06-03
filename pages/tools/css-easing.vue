<template>
  <div class="tool-page">
    <h2>🎨 CSS 缓动曲线生成器</h2>

    <div class="main-layout">
      <!-- 左侧：曲线 + 预览 -->
      <div class="left-col">
        <!-- Canvas 曲线 -->
        <div class="canvas-wrap">
          <canvas
            ref="canvasRef"
            width="360"
            height="300"
            @mousedown="onCanvasDown"
            @mousemove="onCanvasMove"
            @mouseup="onCanvasUp"
            @mouseleave="onCanvasUp"
            @touchstart.prevent="onTouchStart"
            @touchmove.prevent="onTouchMove"
            @touchend="onCanvasUp"
          ></canvas>
        </div>

        <!-- 值显示 + 复制 -->
        <div class="value-row">
          <code class="cb-value">cubic-bezier({{ x1.toFixed(3) }}, {{ y1.toFixed(3) }}, {{ x2.toFixed(3) }}, {{ y2.toFixed(3) }})</code>
          <button class="btn-copy" @click="copyCSS">{{ copyText }}</button>
        </div>

        <!-- 动画预览 -->
        <div class="preview-section">
          <label>动画预览</label>
          <div class="preview-bar">
            <div
              ref="previewBallRef"
              class="preview-ball"
              :style="{ animationTimingFunction: bezierCSS }"
            ></div>
          </div>
          <button class="btn-play" @click="playAnimation">▶ 播放</button>
        </div>
      </div>

      <!-- 右侧：预设 -->
      <div class="right-col">
        <label>预设曲线</label>
        <div class="preset-list">
          <button
            v-for="p in presets"
            :key="p.name"
            :class="['preset-btn', { active: isPresetActive(p) }]"
            @click="applyPreset(p)"
          >
            <span class="preset-name">{{ p.name }}</span>
            <span class="preset-val">({{ p.x1.toFixed(2) }},{{ p.y1.toFixed(2) }},{{ p.x2.toFixed(2) }},{{ p.y2.toFixed(2) }})</span>
          </button>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'CSS 缓动曲线生成器 - 野火小站' })

const canvasRef = ref(null)
const previewBallRef = ref(null)

const x1 = ref(0.25)
const y1 = ref(0.1)
const x2 = ref(0.25)
const y2 = ref(0.1)

const copyText = ref('复制 CSS')
const dragging = ref(null) // 'p1' | 'p2' | null

const presets = [
  { name: 'linear', x1: 0, y1: 0, x2: 1, y2: 1 },
  { name: 'ease', x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 },
  { name: 'ease-in', x1: 0.42, y1: 0, x2: 1, y2: 1 },
  { name: 'ease-out', x1: 0, y1: 0, x2: 0.58, y2: 1 },
  { name: 'ease-in-out', x1: 0.42, y1: 0, x2: 0.58, y2: 1 },
  { name: 'easeInSine', x1: 0.47, y1: 0, x2: 0.745, y2: 0.715 },
  { name: 'easeOutSine', x1: 0.39, y1: 0.575, x2: 0.565, y2: 1 },
  { name: 'easeInQuad', x1: 0.55, y1: 0.085, x2: 0.68, y2: 0.53 },
  { name: 'easeOutQuad', x1: 0.25, y1: 0.46, x2: 0.45, y2: 0.94 },
  { name: 'easeInCubic', x1: 0.55, y1: 0.055, x2: 0.675, y2: 0.19 },
  { name: 'easeOutCubic', x1: 0.215, y1: 0.61, x2: 0.355, y2: 1 },
  { name: 'easeInBack', x1: 0.6, y1: -0.28, x2: 0.735, y2: 0.045 },
  { name: 'easeOutBack', x1: 0.175, y1: 0.885, x2: 0.32, y2: 1.275 },
  { name: 'easeInOutBack', x1: 0.68, y1: -0.55, x2: 0.265, y2: 1.55 },
]

const bezierCSS = computed(() =>
  `cubic-bezier(${x1.value.toFixed(3)}, ${y1.value.toFixed(3)}, ${x2.value.toFixed(3)}, ${y2.value.toFixed(3)})`
)

function isPresetActive(p) {
  return Math.abs(p.x1 - x1.value) < 0.005 &&
    Math.abs(p.y1 - y1.value) < 0.005 &&
    Math.abs(p.x2 - x2.value) < 0.005 &&
    Math.abs(p.y2 - y2.value) < 0.005
}

function applyPreset(p) {
  x1.value = p.x1
  y1.value = p.y1
  x2.value = p.x2
  y2.value = p.y2
  drawCurve()
}

// Canvas 绘制参数
const PAD = 40
const W = 360
const H = 300
const plotW = W - PAD * 2
const plotH = H - PAD * 2

function toCanvasX(v) { return PAD + v * plotW }
function toCanvasY(v) { return PAD + (1 - v) * plotH }
function fromCanvasX(cx) { return Math.max(0, Math.min(1, (cx - PAD) / plotW)) }
function fromCanvasY(cy) { return Math.max(0, Math.min(1, 1 - (cy - PAD) / plotH)) }

function drawCurve() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, W, H)

  // 背景
  ctx.fillStyle = '#fafafa'
  ctx.fillRect(0, 0, W, H)

  // 网格
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  for (let i = 0; i <= 4; i++) {
    const px = toCanvasX(i / 4)
    const py = toCanvasY(i / 4)
    ctx.beginPath()
    ctx.moveTo(px, toCanvasY(0))
    ctx.lineTo(px, toCanvasY(1))
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(toCanvasX(0), py)
    ctx.lineTo(toCanvasX(1), py)
    ctx.stroke()
  }

  // 对角参考线（linear）
  ctx.strokeStyle = '#d1d5db'
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(toCanvasX(0), toCanvasY(0))
  ctx.lineTo(toCanvasX(1), toCanvasY(1))
  ctx.stroke()
  ctx.setLineDash([])

  // 贝塞尔曲线
  ctx.strokeStyle = '#22c55e'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(toCanvasX(0), toCanvasY(0))
  ctx.bezierCurveTo(
    toCanvasX(x1.value), toCanvasY(y1.value),
    toCanvasX(x2.value), toCanvasY(y2.value),
    toCanvasX(1), toCanvasY(1)
  )
  ctx.stroke()

  // 控制点线
  ctx.strokeStyle = '#9ca3af'
  ctx.lineWidth = 1
  ctx.setLineDash([3, 3])
  ctx.beginPath()
  ctx.moveTo(toCanvasX(0), toCanvasY(0))
  ctx.lineTo(toCanvasX(x1.value), toCanvasY(y1.value))
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(toCanvasX(1), toCanvasY(1))
  ctx.lineTo(toCanvasX(x2.value), toCanvasY(y2.value))
  ctx.stroke()
  ctx.setLineDash([])

  // 控制点
  drawPoint(ctx, x1.value, y1.value, '#3b82f6', 'P1')
  drawPoint(ctx, x2.value, y2.value, '#f97316', 'P2')

  // 端点
  ctx.fillStyle = '#6b7280'
  ctx.beginPath()
  ctx.arc(toCanvasX(0), toCanvasY(0), 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(toCanvasX(1), toCanvasY(1), 4, 0, Math.PI * 2)
  ctx.fill()

  // 标签
  ctx.fillStyle = '#9ca3af'
  ctx.font = '11px sans-serif'
  ctx.fillText('时间 →', W / 2 - 20, H - 8)
  ctx.save()
  ctx.translate(12, H / 2 + 20)
  ctx.rotate(-Math.PI / 2)
  ctx.fillText('进度 →', 0, 0)
  ctx.restore()
}

function drawPoint(ctx, x, y, color, label) {
  const cx = toCanvasX(x)
  const cy = toCanvasY(y)
  // 外圈
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(cx, cy, 8, 0, Math.PI * 2)
  ctx.fill()
  // 内圈
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(cx, cy, 4, 0, Math.PI * 2)
  ctx.fill()
  // 标签
  ctx.fillStyle = color
  ctx.font = 'bold 11px sans-serif'
  ctx.fillText(label, cx + 12, cy - 8)
  ctx.font = '10px sans-serif'
  ctx.fillText(`(${x.toFixed(2)}, ${y.toFixed(2)})`, cx + 12, cy + 4)
}

function getCanvasPos(e) {
  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  const scaleX = W / rect.width
  const scaleY = H / rect.height
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  }
}

function hitTest(cx, cy, px, py) {
  const dx = toCanvasX(px) - cx
  const dy = toCanvasY(py) - cy
  return Math.sqrt(dx * dx + dy * dy) < 20
}

function onCanvasDown(e) {
  const pos = getCanvasPos(e)
  if (hitTest(pos.x, pos.y, x2.value, y2.value)) {
    dragging.value = 'p2'
  } else if (hitTest(pos.x, pos.y, x1.value, y1.value)) {
    dragging.value = 'p1'
  }
}

function onCanvasMove(e) {
  if (!dragging.value) return
  const pos = getCanvasPos(e)
  if (dragging.value === 'p1') {
    x1.value = fromCanvasX(pos.x)
    y1.value = fromCanvasY(pos.y)
  } else {
    x2.value = fromCanvasX(pos.x)
    y2.value = fromCanvasY(pos.y)
  }
  drawCurve()
}

function onCanvasUp() {
  dragging.value = null
}

function onTouchStart(e) {
  if (e.touches.length !== 1) return
  const touch = e.touches[0]
  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  const scaleX = W / rect.width
  const scaleY = H / rect.height
  const cx = (touch.clientX - rect.left) * scaleX
  const cy = (touch.clientY - rect.top) * scaleY
  if (hitTest(cx, cy, x2.value, y2.value)) {
    dragging.value = 'p2'
  } else if (hitTest(cx, cy, x1.value, y1.value)) {
    dragging.value = 'p1'
  }
}

function onTouchMove(e) {
  if (!dragging.value || e.touches.length !== 1) return
  const touch = e.touches[0]
  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  const scaleX = W / rect.width
  const scaleY = H / rect.height
  const cx = (touch.clientX - rect.left) * scaleX
  const cy = (touch.clientY - rect.top) * scaleY
  if (dragging.value === 'p1') {
    x1.value = fromCanvasX(cx)
    y1.value = fromCanvasY(cy)
  } else {
    x2.value = fromCanvasX(cx)
    y2.value = fromCanvasY(cy)
  }
  drawCurve()
}

function playAnimation() {
  const ball = previewBallRef.value
  if (!ball) return
  ball.style.animation = 'none'
  ball.offsetHeight // reflow
  ball.style.animation = `moveBall 1.5s ${bezierCSS.value} forwards`
}

function copyCSS() {
  const css = `transition-timing-function: ${bezierCSS.value};`
  navigator.clipboard.writeText(css).then(() => {
    copyText.value = '已复制 ✓'
    setTimeout(() => { copyText.value = '复制 CSS' }, 1500)
  })
}

onMounted(() => drawCurve())
watch([x1, y1, x2, y2], () => drawCurve())
</script>

<style scoped>
.tool-page {
  padding-top: 0.5rem;
}
h2 {
  font-size: 1.6rem;
  margin-bottom: 1.2rem;
}
.main-layout {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}
.left-col {
  flex: 1;
  min-width: 0;
}
.right-col {
  width: 220px;
  flex-shrink: 0;
}
.right-col label {
  font-weight: 600;
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 0.6rem;
  display: block;
}
.canvas-wrap {
  border: 1px solid #ddd;
  border-radius: 10px;
  overflow: hidden;
  background: #fafafa;
  margin-bottom: 1rem;
}
.canvas-wrap canvas {
  display: block;
  width: 100%;
  height: auto;
  cursor: grab;
}
.canvas-wrap canvas:active {
  cursor: grabbing;
}
.value-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1.2rem;
}
.cb-value {
  font-size: 1rem;
  color: #333;
  background: #f3f4f6;
  padding: 0.5rem 0.8rem;
  border-radius: 6px;
  flex: 1;
  word-break: break-all;
}
.btn-copy {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  white-space: nowrap;
  transition: opacity 0.2s;
  flex-shrink: 0;
}
.btn-copy:hover {
  opacity: 0.85;
}
.preview-section label {
  display: block;
  font-weight: 600;
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 0.4rem;
}
.preview-bar {
  height: 32px;
  background: #f3f4f6;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  margin-bottom: 0.6rem;
}
.preview-ball {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #22c55e, #10b981);
  border-radius: 6px;
  position: absolute;
  left: 0;
  top: 0;
}
.btn-play {
  padding: 0.45rem 1.2rem;
  border: 1px solid #22c55e;
  background: transparent;
  color: #22c55e;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.btn-play:hover {
  background: #22c55e;
  color: #fff;
}
.preset-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 520px;
  overflow-y: auto;
}
.preset-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0.5rem 0.7rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}
.preset-btn:hover {
  border-color: #22c55e;
}
.preset-btn.active {
  border-color: #22c55e;
  background: #f0fdf4;
}
.preset-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
}
.preset-val {
  font-size: 0.75rem;
  color: #999;
  font-family: 'Courier New', monospace;
}
.back-link {
  display: inline-block;
  margin-top: 2.5rem;
  color: #22c55e;
  font-weight: 500;
}
.back-link:hover {
  text-decoration: underline;
}
@keyframes moveBall {
  from { transform: translateX(0); }
  to { transform: translateX(calc(100% - 32px)); }
}
@media (max-width: 640px) {
  .main-layout {
    flex-direction: column;
  }
  .right-col {
    width: 100%;
  }
  .preset-list {
    flex-direction: row;
    flex-wrap: wrap;
    max-height: none;
  }
  .preset-btn {
    flex: 1;
    min-width: 120px;
  }
}
</style>
