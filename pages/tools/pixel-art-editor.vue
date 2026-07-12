<template>
  <div class="tool-page">
    <h2>🎨 像素画编辑器</h2>
    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>

    <p class="subtitle">在网格画布上绘制像素画，支持画笔、橡皮、油漆桶填充，可导出 PNG。</p>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="tool-group">
        <button v-for="t in tools" :key="t.id" :class="['tool-btn', { active: currentTool === t.id }]"
          @click="currentTool = t.id" :title="t.label">
          {{ t.icon }}
        </button>
      </div>
      <div class="tool-group">
        <label>画布</label>
        <select v-model.number="canvasSize" @change="resetCanvas">
          <option v-for="s in [8,16,24,32,48,64]" :key="s" :value="s">{{ s }}×{{ s }}</option>
        </select>
      </div>
      <div class="tool-group">
        <label>网格</label>
        <button :class="['toggle-btn', { active: showGrid }]" @click="showGrid = !showGrid">📐</button>
      </div>
      <div class="tool-group">
        <button class="btn-action" @click="undo" :disabled="!history.length">↩ 撤销</button>
        <button class="btn-action" @click="redo" :disabled="!redoStack.length">↪ 重做</button>
        <button class="btn-action" @click="resetCanvas">🗑 清空</button>
      </div>
    </div>

    <!-- 颜色选择 -->
    <div class="color-section">
      <div class="palette">
        <div v-for="(c, i) in palette" :key="i"
          :class="['palette-color', { active: currentColor === c }]"
          :style="{ background: c }"
          @click="currentColor = c">
        </div>
        <input type="color" v-model="customColor" class="color-picker"
          @input="currentColor = customColor" title="自定义颜色" />
      </div>
    </div>

    <!-- 画布 -->
    <div class="canvas-wrap">
      <canvas ref="mainCanvas"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseUp"
        @touchstart.prevent="onTouchStart"
        @touchmove.prevent="onTouchMove"
        @touchend.prevent="onMouseUp"
        class="pixel-canvas"></canvas>
    </div>

    <!-- 导出 -->
    <div class="export-bar">
      <button class="btn-export" @click="exportPNG">📥 导出 PNG</button>
      <button class="btn-export" @click="exportScaledPNG">📥 导出放大 PNG (×{{ exportScale }})</button>
      <select v-model.number="exportScale" class="scale-select">
        <option :value="4">4×</option>
        <option :value="8">8×</option>
        <option :value="16">16×</option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'

useHead({ title: '像素画编辑器 - 野火小站' })

const canvasSize = ref(16)
const currentTool = ref('pen')
const currentColor = ref('#000000')
const customColor = ref('#22c55e')
const showGrid = ref(true)
const mainCanvas = ref(null)
const isDrawing = ref(false)

const tools = [
  { id: 'pen', icon: '✏️', label: '画笔' },
  { id: 'eraser', icon: '🧹', label: '橡皮' },
  { id: 'fill', icon: '🪣', label: '填充' },
  { id: 'picker', icon: '💉', label: '取色' },
]

const palette = [
  '#000000','#ffffff','#ff0000','#00aa00','#0000ff','#ffff00',
  '#ff8800','#8800ff','#00cccc','#ff00aa','#888888','#444444',
  '#884400','#008844','#444488','#aa8866','#ffcc00','#66ff66',
  '#6666ff','#ff66cc','#cc6600','#006644','#336688','#ffaaaa',
]

// 像素数据：二维数组存储颜色值
const pixels = ref([])
const history = ref([])
const redoStack = ref([])
const exportScale = ref(8)

let ctx = null

const initPixels = () => {
  const size = canvasSize.value
  pixels.value = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null)
  )
  history.value = []
  redoStack.value = []
}

const resetCanvas = () => {
  initPixels()
  nextTick(render)
}

const saveState = () => {
  history.value.push(pixels.value.map(row => [...row]))
  if (history.value.length > 50) history.value.shift()
  redoStack.value = []
}

const undo = () => {
  if (!history.value.length) return
  redoStack.value.push(pixels.value.map(row => [...row]))
  pixels.value = history.value.pop()
  render()
}

const redo = () => {
  if (!redoStack.value.length) return
  history.value.push(pixels.value.map(row => [...row]))
  pixels.value = redoStack.value.pop()
  render()
}

const getCellFromEvent = (e) => {
  const canvas = mainCanvas.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  const cellW = rect.width / canvasSize.value
  const cellH = rect.height / canvasSize.value
  const x = Math.floor((e.clientX - rect.left) / cellW)
  const y = Math.floor((e.clientY - rect.top) / cellH)
  if (x < 0 || x >= canvasSize.value || y < 0 || y >= canvasSize.value) return null
  return { x, y }
}

const getCellFromTouch = (e) => {
  const touch = e.touches[0]
  if (!touch) return null
  return getCellFromEvent({ clientX: touch.clientX, clientY: touch.clientY })
}

const applyTool = (cell) => {
  if (!cell) return
  const { x, y } = cell
  if (currentTool.value === 'pen') {
    pixels.value[y][x] = currentColor.value
  } else if (currentTool.value === 'eraser') {
    pixels.value[y][x] = null
  } else if (currentTool.value === 'fill') {
    floodFill(x, y, pixels.value[y][x], currentColor.value)
  } else if (currentTool.value === 'picker') {
    if (pixels.value[y][x]) currentColor.value = pixels.value[y][x]
  }
  render()
}

const floodFill = (x, y, target, fill) => {
  if (target === fill) return
  const size = canvasSize.value
  const queue = [{ x, y }]
  const visited = new Set()
  while (queue.length) {
    const { x: cx, y: cy } = queue.shift()
    const key = `${cx},${cy}`
    if (visited.has(key)) continue
    if (cx < 0 || cx >= size || cy < 0 || cy >= size) continue
    if (pixels.value[cy][cx] !== target) continue
    visited.add(key)
    pixels.value[cy][cx] = fill
    queue.push({ x: cx-1, y: cy }, { x: cx+1, y: cy }, { x: cx, y: cy-1 }, { x: cx, y: cy+1 })
  }
}

const onMouseDown = (e) => {
  isDrawing.value = true
  saveState()
  applyTool(getCellFromEvent(e))
}

const onMouseMove = (e) => {
  if (!isDrawing.value) return
  if (currentTool.value === 'pen' || currentTool.value === 'eraser') {
    applyTool(getCellFromEvent(e))
  }
}

const onMouseUp = () => {
  isDrawing.value = false
}

const onTouchStart = (e) => {
  isDrawing.value = true
  saveState()
  applyTool(getCellFromTouch(e))
}

const onTouchMove = (e) => {
  if (!isDrawing.value) return
  if (currentTool.value === 'pen' || currentTool.value === 'eraser') {
    applyTool(getCellFromTouch(e))
  }
}

const render = () => {
  const canvas = mainCanvas.value
  if (!canvas) return
  ctx = canvas.getContext('2d')
  const size = canvasSize.value
  const dpr = window.devicePixelRatio || 1
  const displaySize = Math.min(600, window.innerWidth - 60)
  canvas.style.width = displaySize + 'px'
  canvas.style.height = displaySize + 'px'
  canvas.width = displaySize * dpr
  canvas.height = displaySize * dpr
  ctx.scale(dpr, dpr)
  const cellSize = displaySize / size

  // 背景（棋盘格）
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#f3f4f6' : '#e5e7eb'
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)

      // 像素颜色
      if (pixels.value[y]?.[x]) {
        ctx.fillStyle = pixels.value[y][x]
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
      }
    }
  }

  // 网格线
  if (showGrid.value && cellSize > 4) {
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= size; i++) {
      ctx.beginPath()
      ctx.moveTo(i * cellSize, 0)
      ctx.lineTo(i * cellSize, displaySize)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * cellSize)
      ctx.lineTo(displaySize, i * cellSize)
      ctx.stroke()
    }
  }
}

const exportPNG = () => {
  const size = canvasSize.value
  const scale = 1
  const offscreen = document.createElement('canvas')
  offscreen.width = size * scale
  offscreen.height = size * scale
  const offCtx = offscreen.getContext('2d')
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (pixels.value[y]?.[x]) {
        offCtx.fillStyle = pixels.value[y][x]
        offCtx.fillRect(x * scale, y * scale, scale, scale)
      }
    }
  }
  downloadCanvas(offscreen, 'pixel-art.png')
}

const exportScaledPNG = () => {
  const size = canvasSize.value
  const scale = exportScale.value
  const offscreen = document.createElement('canvas')
  offscreen.width = size * scale
  offscreen.height = size * scale
  const offCtx = offscreen.getContext('2d')
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (pixels.value[y]?.[x]) {
        offCtx.fillStyle = pixels.value[y][x]
        offCtx.fillRect(x * scale, y * scale, scale, scale)
      }
    }
  }
  downloadCanvas(offscreen, `pixel-art-${scale}x.png`)
}

const downloadCanvas = (canvas, filename) => {
  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}

onMounted(() => {
  initPixels()
  nextTick(render)
})
</script>

<style scoped>
.tool-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem;
}
.tool-page h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}
.back-link {
  display: inline-block;
  margin-bottom: 1rem;
  color: #6b7280;
  text-decoration: none;
  font-size: 0.875rem;
}
.subtitle {
  color: #6b7280;
  margin-bottom: 1.25rem;
  font-size: 0.9rem;
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  margin-bottom: 1rem;
}
.tool-group {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.tool-group label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}
.tool-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  cursor: pointer;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tool-btn.active {
  border-color: #22c55e;
  background: #f0fdf4;
}
.tool-btn:hover { background: #f3f4f6; }
.tool-group select {
  padding: 0.25rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.8rem;
  background: white;
}
.toggle-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  cursor: pointer;
  font-size: 1rem;
}
.toggle-btn.active {
  border-color: #22c55e;
  background: #f0fdf4;
}
.btn-action {
  padding: 0.3rem 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
}
.btn-action:hover { background: #f3f4f6; }
.btn-action:disabled { opacity: 0.4; cursor: not-allowed; }

.color-section {
  margin-bottom: 1rem;
}
.palette {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  align-items: center;
}
.palette-color {
  width: 28px;
  height: 28px;
  border-radius: 0.25rem;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.1s;
}
.palette-color:hover { transform: scale(1.15); }
.palette-color.active {
  border-color: #22c55e;
  box-shadow: 0 0 0 2px rgba(34,197,94,0.3);
}
.color-picker {
  width: 28px;
  height: 28px;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  padding: 1px;
  cursor: pointer;
}

.canvas-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}
.pixel-canvas {
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  cursor: crosshair;
  image-rendering: pixelated;
  touch-action: none;
}

.export-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0.75rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 0.75rem;
}
.btn-export {
  padding: 0.45rem 1rem;
  background: #22c55e;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
}
.btn-export:hover { background: #16a34a; }
.scale-select {
  padding: 0.3rem 0.5rem;
  border: 1px solid #bbf7d0;
  border-radius: 0.375rem;
  font-size: 0.8rem;
  background: white;
}

@media (max-width: 640px) {
  .tool-page { padding: 1rem; }
  .toolbar { gap: 0.5rem; padding: 0.5rem; }
  .tool-btn, .toggle-btn { width: 32px; height: 32px; font-size: 0.95rem; }
  .palette-color { width: 24px; height: 24px; }
}
</style>
