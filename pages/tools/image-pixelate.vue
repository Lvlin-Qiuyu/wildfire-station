<template>
  <div class="tool-page">
    <h2>🧱 图片马赛克/像素化工具</h2>
    <p class="subtitle">上传图片，调节像素化程度生成马赛克效果，支持区域马赛克（涂抹遮挡），导出 PNG</p>

    <!-- 上传区域 -->
    <div class="upload-area" v-if="!imageSrc" @click="triggerUpload" @dragover.prevent @drop.prevent="handleDrop">
      <input ref="fileInput" type="file" accept="image/*" hidden @change="handleFileChange" />
      <div class="upload-content">
        <span class="upload-icon">🧱</span>
        <p>点击或拖拽图片到这里</p>
        <p class="upload-hint">支持 JPG、PNG、WebP 等常见图片格式</p>
      </div>
    </div>

    <!-- 编辑区域 -->
    <div v-if="imageSrc" class="editor-layout">
      <!-- 预览面板 -->
      <div class="preview-panel">
        <div class="preview-header">
          <span class="file-info" v-if="fileName">📁 {{ fileName }}（{{ formatSize(fileSize) }}）</span>
          <button class="btn-sm" @click="resetAll">重新上传</button>
        </div>
        <div class="preview-container" ref="previewContainer">
          <canvas
            ref="mainCanvas"
            class="main-canvas"
            :class="{ 'mode-brush': activeTool === 'brush' }"
            @mousedown="onCanvasMouseDown"
            @mousemove="onCanvasMouseMove"
            @mouseup="onCanvasMouseUp"
            @mouseleave="onCanvasMouseUp"
            @touchstart.prevent="onCanvasTouchStart"
            @touchmove.prevent="onCanvasTouchMove"
            @touchend.prevent="onCanvasMouseUp"
          />
        </div>
        <div class="export-bar">
          <button class="btn-export" @click="exportImage('png')">📥 导出 PNG</button>
          <button class="btn-export btn-jpg" @click="exportImage('jpeg')">📥 导出 JPG</button>
        </div>
      </div>

      <!-- 控制面板 -->
      <div class="controls-panel">
        <!-- 模式切换 -->
        <div class="section">
          <div class="section-title">🔧 工具模式</div>
          <div class="mode-buttons">
            <button
              class="mode-btn"
              :class="{ active: activeTool === 'global' }"
              @click="activeTool = 'global'"
            >
              🌐 全局马赛克
            </button>
            <button
              class="mode-btn"
              :class="{ active: activeTool === 'brush' }"
              @click="activeTool = 'brush'"
            >
              🖌️ 区域涂抹
            </button>
          </div>
        </div>

        <!-- 全局像素化参数 -->
        <div v-if="activeTool === 'global'" class="section">
          <div class="section-title">⚙️ 像素化参数</div>

          <div class="slider-group">
            <div class="slider-header">
              <span class="slider-label">马赛克块大小</span>
              <span class="slider-value">{{ blockSize }}px</span>
            </div>
            <input type="range" v-model.number="blockSize" min="1" max="50" step="1" class="slider-input" @input="applyGlobalPixelate" />
          </div>

          <div class="slider-group">
            <div class="slider-header">
              <span class="slider-label">像素形状</span>
            </div>
            <div class="shape-buttons">
              <button v-for="shape in shapes" :key="shape.value" class="shape-btn" :class="{ active: pixelShape === shape.value }" @click="pixelShape = shape.value; applyGlobalPixelate()">
                {{ shape.icon }} {{ shape.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- 区域涂抹参数 -->
        <div v-if="activeTool === 'brush'" class="section">
          <div class="section-title">🖌️ 涂抹参数</div>

          <div class="slider-group">
            <div class="slider-header">
              <span class="slider-label">笔刷大小</span>
              <span class="slider-value">{{ brushSize }}px</span>
            </div>
            <input type="range" v-model.number="brushSize" min="10" max="100" step="5" class="slider-input" />
          </div>

          <div class="slider-group">
            <div class="slider-header">
              <span class="slider-label">马赛克粒度</span>
              <span class="slider-value">{{ brushBlock }}px</span>
            </div>
            <input type="range" v-model.number="brushBlock" min="2" max="30" step="1" class="slider-input" />
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="section">
          <div class="action-buttons">
            <button class="btn-reset" @click="resetEffect">撤销效果</button>
          </div>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '图片马赛克/像素化工具 - 野火小站' })

const fileInput = ref(null)
const previewContainer = ref(null)
const mainCanvas = ref(null)

const imageSrc = ref(null)
const fileName = ref('')
const fileSize = ref(0)
const activeTool = ref('global')
const blockSize = ref(10)
const pixelShape = ref('square')
const brushSize = ref(30)
const brushBlock = ref(8)

let originalImage = null
let cleanImageData = null // 未像素化的原始数据
let canvasScale = 1 // 预览缩放比例
let isDrawing = false

const shapes = [
  { value: 'square', label: '方块', icon: '⬛' },
  { value: 'circle', label: '圆形', icon: '⚫' },
  { value: 'diamond', label: '菱形', icon: '🔷' },
]

function triggerUpload() {
  fileInput.value?.click()
}

function handleFileChange(e) {
  const file = e.target.files?.[0]
  if (file) loadImage(file)
}

function handleDrop(e) {
  const file = e.dataTransfer.files?.[0]
  if (file && file.type.startsWith('image/')) loadImage(file)
}

function loadImage(file) {
  fileName.value = file.name
  fileSize.value = file.size

  const reader = new FileReader()
  reader.onload = (e) => {
    imageSrc.value = e.target.result
    const img = new Image()
    img.onload = () => {
      originalImage = img
      resetEffect()
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

// 绘制预览（原图）
function drawOriginal() {
  const canvas = mainCanvas.value
  if (!canvas || !originalImage) return

  const container = previewContainer.value
  const maxW = container.clientWidth - 20
  const maxH = 500

  let w = originalImage.width
  let h = originalImage.height
  canvasScale = Math.min(maxW / w, maxH / h, 1)
  w = Math.floor(w * canvasScale)
  h = Math.floor(h * canvasScale)

  canvas.width = w
  canvas.height = h

  const ctx = canvas.getContext('2d')
  ctx.drawImage(originalImage, 0, 0, w, h)
  cleanImageData = ctx.getImageData(0, 0, w, h)
}

// 全局像素化
function applyGlobalPixelate() {
  const canvas = mainCanvas.value
  if (!canvas || !cleanImageData) return

  // 先恢复原图
  const ctx = canvas.getContext('2d')
  ctx.putImageData(cleanImageData, 0, 0)

  const w = canvas.width
  const h = canvas.height
  const data = ctx.getImageData(0, 0, w, h)
  const pixels = data.data
  const block = Math.max(1, Math.round(blockSize.value))

  if (block <= 1) {
    ctx.putImageData(data, 0, 0)
    return
  }

  // 像素化：取每个块的平均颜色填充
  for (let y = 0; y < h; y += block) {
    for (let x = 0; x < w; x += block) {
      let r = 0, g = 0, b = 0, count = 0
      const bw = Math.min(block, w - x)
      const bh = Math.min(block, h - y)

      // 采样块内所有像素取平均色
      for (let dy = 0; dy < bh; dy++) {
        for (let dx = 0; dx < bw; dx++) {
          const idx = ((y + dy) * w + (x + dx)) * 4
          r += pixels[idx]
          g += pixels[idx + 1]
          b += pixels[idx + 2]
          count++
        }
      }

      r = Math.round(r / count)
      g = Math.round(g / count)
      b = Math.round(b / count)

      // 填充块
      for (let dy = 0; dy < bh; dy++) {
        for (let dx = 0; dx < bw; dx++) {
          const idx = ((y + dy) * w + (x + dx)) * 4
          pixels[idx] = r
          pixels[idx + 1] = g
          pixels[idx + 2] = b
        }
      }
    }
  }

  ctx.putImageData(data, 0, 0)
}

// 区域涂抹马赛克
function pixelateArea(cx, cy) {
  const canvas = mainCanvas.value
  if (!canvas || !cleanImageData) return

  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height

  // 获取笔刷范围内的坐标
  const radius = brushSize.value
  const block = Math.max(2, brushBlock.value)

  const x1 = Math.max(0, Math.floor((cx - radius) / block) * block)
  const y1 = Math.max(0, Math.floor((cy - radius) / block) * block)
  const x2 = Math.min(w, Math.ceil((cx + radius) / block) * block)
  const y2 = Math.min(h, Math.ceil((cy + radius) / block) * block)

  // 从当前 canvas 获取数据
  const imageData = ctx.getImageData(0, 0, w, h)
  const pixels = imageData.data

  for (let by = y1; by < y2; by += block) {
    for (let bx = x1; bx < x2; bx += block) {
      // 检查块中心是否在笔刷范围内
      const blockCx = bx + block / 2
      const blockCy = by + block / 2
      const dist = Math.sqrt((blockCx - cx) ** 2 + (blockCy - cy) ** 2)
      if (dist > radius) continue

      let r = 0, g = 0, b = 0, count = 0
      const bw = Math.min(block, w - bx)
      const bh = Math.min(block, h - by)

      for (let dy = 0; dy < bh; dy++) {
        for (let dx = 0; dx < bw; dx++) {
          const idx = ((by + dy) * w + (bx + dx)) * 4
          r += pixels[idx]
          g += pixels[idx + 1]
          b += pixels[idx + 2]
          count++
        }
      }

      r = Math.round(r / count)
      g = Math.round(g / count)
      b = Math.round(b / count)

      // 填充马赛克块
      ctx.fillStyle = `rgb(${r},${g},${b})`
      ctx.fillRect(bx, by, bw, bh)
    }
  }
}

// 鼠标事件
function getCanvasPos(e) {
  const canvas = mainCanvas.value
  const rect = canvas.getBoundingClientRect()
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
}

function onCanvasMouseDown(e) {
  if (activeTool.value !== 'brush') return
  isDrawing = true
  const pos = getCanvasPos(e)
  pixelateArea(pos.x, pos.y)
}

function onCanvasMouseMove(e) {
  if (!isDrawing || activeTool.value !== 'brush') return
  const pos = getCanvasPos(e)
  pixelateArea(pos.x, pos.y)
}

function onCanvasMouseUp() {
  isDrawing = false
}

// 触摸事件
function onCanvasTouchStart(e) {
  if (activeTool.value !== 'brush') return
  isDrawing = true
  const touch = e.touches[0]
  const pos = getCanvasPos(touch)
  pixelateArea(pos.x, pos.y)
}

function onCanvasTouchMove(e) {
  if (!isDrawing || activeTool.value !== 'brush') return
  const touch = e.touches[0]
  const pos = getCanvasPos(touch)
  pixelateArea(pos.x, pos.y)
}

// 撤销效果
function resetEffect() {
  nextTick(() => {
    drawOriginal()
    if (activeTool.value === 'global' && blockSize.value > 1) {
      applyGlobalPixelate()
    }
  })
}

// 导出图片
function exportImage(format) {
  const canvas = mainCanvas.value
  if (!canvas || !originalImage) return

  // 用原始尺寸重新渲染
  const exportCanvas = document.createElement('canvas')
  const w = originalImage.width
  const h = originalImage.height
  exportCanvas.width = w
  exportCanvas.height = h

  const ctx = exportCanvas.getContext('2d')

  // 如果是全局模式，在原始尺寸上像素化
  if (activeTool.value === 'global') {
    ctx.drawImage(originalImage, 0, 0)
    const block = Math.max(1, blockSize.value)
    if (block > 1) {
      const data = ctx.getImageData(0, 0, w, h)
      const pixels = data.data
      for (let y = 0; y < h; y += block) {
        for (let x = 0; x < w; x += block) {
          let r = 0, g = 0, b = 0, count = 0
          const bw = Math.min(block, w - x)
          const bh = Math.min(block, h - y)
          for (let dy = 0; dy < bh; dy++) {
            for (let dx = 0; dx < bw; dx++) {
              const idx = ((y + dy) * w + (x + dx)) * 4
              r += pixels[idx]; g += pixels[idx + 1]; b += pixels[idx + 2]; count++
            }
          }
          r = Math.round(r / count); g = Math.round(g / count); b = Math.round(b / count)
          for (let dy = 0; dy < bh; dy++) {
            for (let dx = 0; dx < bw; dx++) {
              const idx = ((y + dy) * w + (x + dx)) * 4
              pixels[idx] = r; pixels[idx + 1] = g; pixels[idx + 2] = b
            }
          }
        }
      }
      ctx.putImageData(data, 0, 0)
    }
  } else {
    // 区域涂抹模式：缩放预览canvas到原始尺寸
    ctx.drawImage(canvas, 0, 0, w, h)
  }

  const ext = format === 'jpeg' ? 'jpg' : 'png'
  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png'
  const quality = format === 'jpeg' ? 0.92 : undefined
  const link = document.createElement('a')
  link.download = `pixelated_${Date.now()}.${ext}`
  link.href = exportCanvas.toDataURL(mime, quality)
  link.click()
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function resetAll() {
  imageSrc.value = null
  originalImage = null
  cleanImageData = null
  fileName.value = ''
  fileSize.value = 0
  blockSize.value = 10
  activeTool.value = 'global'
}

function onResize() {
  if (imageSrc.value && originalImage) resetEffect()
}

onMounted(() => {
  window.addEventListener('resize', onResize)
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

/* 上传 */
.upload-area {
  border: 2px dashed #c8e6c9;
  border-radius: 16px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  background: #f1f8f1;
  transition: all 0.2s;
}

.upload-area:hover {
  border-color: #22c55e;
  background: #e8f5e9;
}

.upload-icon { font-size: 3rem; display: block; margin-bottom: 0.5rem; }
.upload-area p { color: #555; margin-bottom: 0.3rem; }
.upload-hint { color: #aaa !important; font-size: 0.85rem; }

/* 布局 */
.editor-layout {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.preview-panel {
  flex: 1;
  min-width: 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  padding: 1rem;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.8rem;
}

.file-info { font-size: 0.85rem; color: #888; }

.btn-sm {
  padding: 0.3rem 0.7rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 0.8rem;
  color: #555;
}

.btn-sm:hover { border-color: #22c55e; color: #22c55e; }

.preview-container {
  background: #f5f5f5;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  margin-bottom: 0.8rem;
}

.main-canvas {
  display: block;
  max-width: 100%;
  border-radius: 4px;
}

.main-canvas.mode-brush {
  cursor: crosshair;
}

.export-bar {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.btn-export {
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
}

.btn-export:hover { opacity: 0.85; }
.btn-export.btn-jpg { background: linear-gradient(135deg, #6366f1, #8b5cf6); }

/* 控制面板 */
.controls-panel {
  flex: 0 0 300px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section {
  background: #fff;
  border-radius: 10px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.section-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #555;
  margin-bottom: 0.8rem;
}

/* 模式按钮 */
.mode-buttons {
  display: flex;
  gap: 0.5rem;
}

.mode-btn {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 0.8rem;
  color: #555;
  transition: all 0.15s;
}

.mode-btn:hover { border-color: #22c55e; }
.mode-btn.active { border-color: #22c55e; background: #dcfce7; color: #16a34a; font-weight: 600; }

/* 滑块 */
.slider-group { margin-bottom: 0.8rem; }
.slider-group:last-child { margin-bottom: 0; }

.slider-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.3rem;
}

.slider-label { font-size: 0.8rem; color: #666; }
.slider-value { font-size: 0.8rem; font-family: 'Courier New', monospace; color: #22c55e; font-weight: 600; }

.slider-input {
  width: 100%;
  height: 6px;
  accent-color: #22c55e;
  cursor: pointer;
}

/* 形状按钮 */
.shape-buttons {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.shape-btn {
  padding: 0.35rem 0.6rem;
  border: 1px solid #eee;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 0.78rem;
  color: #555;
}

.shape-btn:hover { border-color: #22c55e; }
.shape-btn.active { border-color: #22c55e; background: #dcfce7; color: #16a34a; font-weight: 600; }

/* 操作按钮 */
.action-buttons { display: flex; gap: 0.5rem; }

.btn-reset {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 0.85rem;
  color: #555;
}

.btn-reset:hover { border-color: #ef4444; color: #ef4444; }

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #22c55e;
  font-weight: 500;
}

.back-link:hover { text-decoration: underline; }

@media (max-width: 768px) {
  .editor-layout { flex-direction: column; }
  .controls-panel { flex: none; width: 100%; }
}
</style>
