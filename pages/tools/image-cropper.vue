<template>
  <div class="tool-page">
    <h2>📐 图片裁剪工具</h2>
    <p class="subtitle">上传图片后自由拖拽裁剪区域，支持预设比例，实时预览裁剪效果并导出</p>

    <!-- 上传区域 -->
    <div class="upload-area"
      :class="{ dragging: isDragging }"
      @click="triggerUpload"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="handleDrop"
      v-if="!originalImage"
    >
      <input ref="fileInput" type="file" accept="image/*" @change="handleFile" style="display:none" />
      <div class="upload-hint">
        <span class="upload-icon">📁</span>
        <p>点击或拖拽上传图片</p>
        <span class="upload-formats">支持 JPG / PNG / WebP / GIF</span>
      </div>
    </div>

    <div v-if="originalImage" class="workspace">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="ratio-group">
          <label>裁剪比例：</label>
          <button
            v-for="r in ratioOptions"
            :key="r.value"
            :class="['ratio-btn', { active: activeRatio === r.value }]"
            @click="setRatio(r.value)"
          >{{ r.label }}</button>
        </div>
        <div class="toolbar-actions">
          <button class="btn-secondary" @click="resetCrop">重置</button>
          <button class="btn-secondary" @click="clearImage">换一张</button>
        </div>
      </div>

      <!-- 裁剪画布 -->
      <div class="crop-container" ref="cropContainerRef">
        <canvas
          ref="cropCanvas"
          @mousedown="onMouseDown"
          @mousemove="onMouseMove"
          @mouseup="onMouseUp"
          @mouseleave="onMouseUp"
          @touchstart.prevent="onTouchStart"
          @touchmove.prevent="onTouchMove"
          @touchend.prevent="onMouseUp"
        />
      </div>

      <!-- 裁剪信息 -->
      <div class="crop-info">
        <span>裁剪尺寸：{{ cropW }} × {{ cropH }} px</span>
        <span>原图尺寸：{{ imgWidth }} × {{ imgHeight }} px</span>
      </div>

      <!-- 预览 -->
      <div class="preview-section">
        <h3>裁剪预览</h3>
        <div class="preview-box">
          <canvas ref="previewCanvas" v-show="hasCrop" />
          <div v-if="!hasCrop" class="preview-empty">拖拽画布创建裁剪区域</div>
        </div>
      </div>

      <!-- 导出 -->
      <div class="export-section" v-if="hasCrop">
        <div class="export-row">
          <label>输出格式：</label>
          <div class="format-btns">
            <button v-for="f in formats" :key="f" :class="{ active: exportFormat === f }" @click="exportFormat = f">{{ f }}</button>
          </div>
        </div>
        <div class="export-row">
          <label>质量：</label>
          <input type="range" v-model.number="exportQuality" min="10" max="100" />
          <span class="quality-val">{{ exportQuality }}%</span>
        </div>
        <button class="btn-download" @click="downloadCrop">📥 下载裁剪图片</button>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '图片裁剪工具 - 野火小站' })

const fileInput = ref(null)
const isDragging = ref(false)
const originalImage = ref(null) // HTMLImageElement
const imgWidth = ref(0)
const imgHeight = ref(0)

// Canvas 引用
const cropCanvas = ref(null)
const cropContainerRef = ref(null)
const previewCanvas = ref(null)

// 画布尺寸（显示尺寸，根据容器自适应）
const canvasW = ref(0)
const canvasH = ref(0)
// 图像在画布中的偏移和缩放
const drawX = ref(0)
const drawY = ref(0)
const drawScale = ref(1)

// 裁剪框坐标（画布坐标系）
const crop = reactive({ x: 0, y: 0, w: 0, h: 0 })
const hasCrop = ref(false)

// 拖拽状态
const dragging = ref(false)
const dragType = ref('') // 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e' | 'create'
const dragStart = reactive({ x: 0, y: 0 })
const cropStart = reactive({ x: 0, y: 0, w: 0, h: 0 })

// 比例选项
const ratioOptions = [
  { label: '自由', value: 0 },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:2', value: 3 / 2 },
  { label: '16:9', value: 16 / 9 },
  { label: '2:3', value: 2 / 3 },
  { label: '9:16', value: 9 / 16 },
]
const activeRatio = ref(0)

// 导出设置
const exportFormat = ref('PNG')
const exportQuality = ref(92)
const formats = ['PNG', 'JPG', 'WebP']

// 裁剪框在原图坐标系中的尺寸
const cropW = computed(() => Math.round(crop.w / drawScale.value))
const cropH = computed(() => Math.round(crop.h / drawScale.value))

// 上传相关
function triggerUpload() {
  fileInput.value.click()
}

function handleFile(e) {
  const file = e.target.files[0]
  if (file) loadImage(file)
}

function handleDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) loadImage(file)
}

function loadImage(file) {
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      originalImage.value = img
      imgWidth.value = img.naturalWidth
      imgHeight.value = img.naturalHeight
      hasCrop.value = false
      // 等DOM更新后初始化画布
      nextTick(() => initCanvas())
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

function clearImage() {
  originalImage.value = null
  hasCrop.value = false
}

// 初始化画布尺寸
function initCanvas() {
  if (!cropCanvas.value || !cropContainerRef.value || !originalImage.value) return

  const container = cropContainerRef.value
  const maxW = container.clientWidth
  const maxH = Math.min(window.innerHeight * 0.6, 500)

  const img = originalImage.value
  const imgRatio = img.naturalWidth / img.naturalHeight
  const containerRatio = maxW / maxH

  if (imgRatio > containerRatio) {
    canvasW.value = maxW
    canvasH.value = Math.round(maxW / imgRatio)
  } else {
    canvasH.value = maxH
    canvasW.value = Math.round(maxH * imgRatio)
  }

  drawScale.value = canvasW.value / img.naturalWidth
  drawX.value = 0
  drawY.value = 0

  draw()
}

// 绘制画布
function draw() {
  const canvas = cropCanvas.value
  if (!canvas || !originalImage.value) return

  canvas.width = canvasW.value
  canvas.height = canvasH.value
  const ctx = canvas.getContext('2d')

  // 绘制图片
  ctx.drawImage(originalImage.value, drawX.value, drawY.value, canvasW.value, canvasH.value)

  // 绘制裁剪遮罩
  if (hasCrop.value && crop.w > 0 && crop.h > 0) {
    // 暗色遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    // 上
    ctx.fillRect(0, 0, canvasW.value, crop.y)
    // 下
    ctx.fillRect(0, crop.y + crop.h, canvasW.value, canvasH.value - crop.y - crop.h)
    // 左
    ctx.fillRect(0, crop.y, crop.x, crop.h)
    // 右
    ctx.fillRect(crop.x + crop.w, crop.y, canvasW.value - crop.x - crop.w, crop.h)

    // 裁剪框边框
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.strokeRect(crop.x, crop.y, crop.w, crop.h)

    // 三等分线
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 1
    for (let i = 1; i <= 2; i++) {
      // 水平线
      const hy = crop.y + (crop.h / 3) * i
      ctx.beginPath()
      ctx.moveTo(crop.x, hy)
      ctx.lineTo(crop.x + crop.w, hy)
      ctx.stroke()
      // 垂直线
      const vx = crop.x + (crop.w / 3) * i
      ctx.beginPath()
      ctx.moveTo(vx, crop.y)
      ctx.lineTo(vx, crop.y + crop.h)
      ctx.stroke()
    }

    // 四角手柄
    const handleSize = 10
    ctx.fillStyle = '#22c55e'
    const corners = [
      [crop.x, crop.y],
      [crop.x + crop.w, crop.y],
      [crop.x, crop.y + crop.h],
      [crop.x + crop.w, crop.y + crop.h],
    ]
    corners.forEach(([cx, cy]) => {
      ctx.fillRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize)
    })

    // 边中点手柄
    const edgeSize = 8
    const edges = [
      [crop.x + crop.w / 2, crop.y], // 上
      [crop.x + crop.w / 2, crop.y + crop.h], // 下
      [crop.x, crop.y + crop.h / 2], // 左
      [crop.x + crop.w, crop.y + crop.h / 2], // 右
    ]
    edges.forEach(([cx, cy]) => {
      ctx.fillRect(cx - edgeSize / 2, cy - edgeSize / 2, edgeSize, edgeSize)
    })

    // 更新预览
    updatePreview()
  }
}

// 更新预览
function updatePreview() {
  const pCanvas = previewCanvas.value
  if (!pCanvas || !originalImage.value || !hasCrop.value) return

  const pw = 200
  const ratio = crop.w / crop.h
  const ph = Math.round(pw / ratio)

  pCanvas.width = pw
  pCanvas.height = ph
  const ctx = pCanvas.getContext('2d')

  // 从原图裁剪
  const sx = (crop.x - drawX.value) / drawScale.value
  const sy = (crop.y - drawY.value) / drawScale.value
  const sw = crop.w / drawScale.value
  const sh = crop.h / drawScale.value

  ctx.drawImage(originalImage.value, sx, sy, sw, sh, 0, 0, pw, ph)
}

// 获取画布坐标
function getCanvasPos(e) {
  const canvas = cropCanvas.value
  const rect = canvas.getBoundingClientRect()
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const clientY = e.touches ? e.touches[0].clientY : e.clientY
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  }
}

// 判断点击位置类型
function hitTest(x, y) {
  if (!hasCrop.value) return 'create'

  const { x: cx, y: cy, w: cw, h: ch } = crop
  const threshold = 12

  // 四角
  if (Math.abs(x - cx) < threshold && Math.abs(y - cy) < threshold) return 'nw'
  if (Math.abs(x - (cx + cw)) < threshold && Math.abs(y - cy) < threshold) return 'ne'
  if (Math.abs(x - cx) < threshold && Math.abs(y - (cy + ch)) < threshold) return 'sw'
  if (Math.abs(x - (cx + cw)) < threshold && Math.abs(y - (cy + ch)) < threshold) return 'se'

  // 边中点
  if (Math.abs(y - cy) < threshold && x > cx && x < cx + cw) return 'n'
  if (Math.abs(y - (cy + ch)) < threshold && x > cx && x < cx + cw) return 's'
  if (Math.abs(x - cx) < threshold && y > cy && y < cy + ch) return 'w'
  if (Math.abs(x - (cx + cw)) < threshold && y > cy && y < cy + ch) return 'e'

  // 内部移动
  if (x > cx && x < cx + cw && y > cy && y < cy + ch) return 'move'

  // 外部创建新裁剪框
  return 'create'
}

// 鼠标/触摸事件
function onMouseDown(e) {
  const pos = getCanvasPos(e)
  startDrag(pos, hitTest(pos.x, pos.y))
}

function onTouchStart(e) {
  if (e.touches.length === 1) {
    const pos = getCanvasPos(e)
    startDrag(pos, hitTest(pos.x, pos.y))
  }
}

function onMouseMove(e) {
  const pos = getCanvasPos(e)
  if (dragging.value) {
    moveDrag(pos)
  } else {
    // 更新光标
    const type = hitTest(pos.x, pos.y)
    const cursorMap = {
      nw: 'nw-resize', ne: 'ne-resize', sw: 'sw-resize', se: 'se-resize',
      n: 'n-resize', s: 's-resize', w: 'w-resize', e: 'e-resize',
      move: 'move', create: 'crosshair',
    }
    cropCanvas.value.style.cursor = cursorMap[type] || 'crosshair'
  }
}

function onTouchMove(e) {
  if (e.touches.length === 1 && dragging.value) {
    const pos = getCanvasPos(e)
    moveDrag(pos)
  }
}

function onMouseUp() {
  dragging.value = false
}

// 拖拽逻辑
function startDrag(pos, type) {
  dragging.value = true
  dragType.value = type

  if (type === 'create') {
    // 创建新裁剪框
    crop.x = pos.x
    crop.y = pos.y
    crop.w = 0
    crop.h = 0
    dragStart.x = pos.x
    dragStart.y = pos.y
    hasCrop.value = true
  } else {
    dragStart.x = pos.x
    dragStart.y = pos.y
    cropStart.x = crop.x
    cropStart.y = crop.y
    cropStart.w = crop.w
    cropStart.h = crop.h
  }
}

function moveDrag(pos) {
  const dx = pos.x - dragStart.x
  const dy = pos.y - dragStart.y

  if (dragType.value === 'create') {
    // 创建裁剪框
    let x = Math.min(dragStart.x, pos.x)
    let y = Math.min(dragStart.y, pos.y)
    let w = Math.abs(pos.x - dragStart.x)
    let h = Math.abs(pos.y - dragStart.y)

    // 限制在画布内
    x = Math.max(0, x)
    y = Math.max(0, y)
    w = Math.min(canvasW.value - x, w)
    h = Math.min(canvasH.value - y, h)

    // 按比例约束
    if (activeRatio.value > 0) {
      if (w / h > activeRatio.value) {
        w = h * activeRatio.value
      } else {
        h = w / activeRatio.value
      }
    }

    crop.x = x
    crop.y = y
    crop.w = w
    crop.h = h
  } else if (dragType.value === 'move') {
    let nx = cropStart.x + dx
    let ny = cropStart.y + dy
    // 限制在画布内
    nx = Math.max(0, Math.min(canvasW.value - crop.w, nx))
    ny = Math.max(0, Math.min(canvasH.value - crop.h, ny))
    crop.x = nx
    crop.y = ny
  } else {
    // 调整大小
    resizeCrop(dragType.value, dx, dy)
  }

  draw()
}

function resizeCrop(type, dx, dy) {
  let { x, y, w, h } = cropStart
  const minSize = 20

  // 根据拖拽类型调整
  if (type.includes('w')) {
    const newX = Math.max(0, x + dx)
    const newW = w - (newX - x)
    if (newW >= minSize) { x = newX; w = newW }
  }
  if (type.includes('e')) {
    const newW = Math.min(canvasW.value - x, w + dx)
    if (newW >= minSize) w = newW
  }
  if (type.includes('n')) {
    const newY = Math.max(0, y + dy)
    const newH = h - (newY - y)
    if (newH >= minSize) { y = newY; h = newH }
  }
  if (type.includes('s')) {
    const newH = Math.min(canvasH.value - y, h + dy)
    if (newH >= minSize) h = newH
  }

  // 按比例约束
  if (activeRatio.value > 0) {
    const isCorner = type.length === 2
    if (isCorner || type === 'e' || type === 's') {
      // 以宽度为基准调整高度
      h = w / activeRatio.value
      // 限制边界
      if (y + h > canvasH.value) {
        h = canvasH.value - y
        w = h * activeRatio.value
      }
    } else {
      // 以高度为基准调整宽度
      w = h * activeRatio.value
      if (x + w > canvasW.value) {
        w = canvasW.value - x
        h = w / activeRatio.value
      }
    }
  }

  crop.x = x
  crop.y = y
  crop.w = w
  crop.h = h
}

// 设置比例
function setRatio(ratio) {
  activeRatio.value = ratio
  if (hasCrop.value && ratio > 0) {
    // 调整现有裁剪框到新比例
    const cx = crop.x + crop.w / 2
    const cy = crop.y + crop.h / 2
    let w = crop.w
    let h = crop.h

    if (w / h > ratio) {
      w = h * ratio
    } else {
      h = w / ratio
    }

    crop.x = cx - w / 2
    crop.y = cy - h / 2
    crop.w = w
    crop.h = h
    draw()
  }
}

// 重置裁剪框
function resetCrop() {
  hasCrop.value = false
  activeRatio.value = 0
  draw()
}

// 导出下载
function downloadCrop() {
  if (!originalImage.value || !hasCrop.value) return

  const canvas = document.createElement('canvas')
  const sx = (crop.x - drawX.value) / drawScale.value
  const sy = (crop.y - drawY.value) / drawScale.value
  const sw = crop.w / drawScale.value
  const sh = crop.h / drawScale.value

  canvas.width = Math.round(sw)
  canvas.height = Math.round(sh)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(originalImage.value, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)

  const mimeMap = { PNG: 'image/png', JPG: 'image/jpeg', WebP: 'image/webp' }
  const extMap = { PNG: 'png', JPG: 'jpg', WebP: 'webp' }
  const mime = mimeMap[exportFormat.value] || 'image/png'
  const ext = extMap[exportFormat.value] || 'png'
  const q = exportFormat.value === 'PNG' ? undefined : exportQuality.value / 100

  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cropped.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }, mime, q)
}

// 窗口大小变化时重新初始化
function onResize() {
  if (originalImage.value) {
    nextTick(() => initCanvas())
  }
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
  max-width: 900px;
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

/* 上传区域 */
.upload-area {
  border: 2px dashed #ccc;
  border-radius: 14px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 1.5rem;
}

.upload-area:hover,
.upload-area.dragging {
  border-color: #22c55e;
  background: #f0fdf4;
}

.upload-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 0.5rem;
}

.upload-hint p {
  margin: 0.3rem 0;
  color: #555;
  font-size: 1rem;
}

.upload-formats {
  font-size: 0.8rem;
  color: #999;
}

/* 工具栏 */
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 10px;
  padding: 0.8rem 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 1rem;
  gap: 0.5rem;
}

.ratio-group {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-wrap: wrap;
}

.ratio-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #555;
  margin-right: 0.3rem;
}

.ratio-btn {
  padding: 0.3rem 0.6rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.15s;
}

.ratio-btn:hover {
  border-color: #22c55e;
}

.ratio-btn.active {
  background: #22c55e;
  color: #fff;
  border-color: #22c55e;
}

.toolbar-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-secondary {
  padding: 0.35rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 0.82rem;
  transition: all 0.2s;
}

.btn-secondary:hover {
  border-color: #22c55e;
  color: #22c55e;
}

/* 裁剪画布 */
.crop-container {
  background: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.8rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.crop-container canvas {
  display: block;
  cursor: crosshair;
  touch-action: none;
}

/* 裁剪信息 */
.crop-info {
  display: flex;
  justify-content: center;
  gap: 2rem;
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 1.2rem;
}

/* 预览区域 */
.preview-section {
  background: #fff;
  border-radius: 10px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 1.2rem;
}

.preview-section h3 {
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 0.8rem;
}

.preview-box {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
}

.preview-box canvas {
  max-width: 200px;
  max-height: 200px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
}

.preview-empty {
  color: #aaa;
  font-size: 0.9rem;
}

/* 导出区域 */
.export-section {
  background: #fff;
  border-radius: 10px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 1rem;
}

.export-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.8rem;
}

.export-row label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #555;
  white-space: nowrap;
}

.format-btns {
  display: flex;
  gap: 0.4rem;
}

.format-btns button {
  padding: 0.3rem 0.8rem;
  border: 1px solid #e0e0e0;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.82rem;
  transition: all 0.2s;
}

.format-btns button.active {
  border-color: #22c55e;
  background: #f0fdf4;
  color: #22c55e;
  font-weight: 600;
}

.export-row input[type="range"] {
  flex: 1;
  max-width: 200px;
  accent-color: #22c55e;
}

.quality-val {
  font-size: 0.82rem;
  color: #16a34a;
  font-weight: 600;
  font-family: monospace;
}

.btn-download {
  display: block;
  width: 100%;
  padding: 0.7rem 2rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: transform 0.2s;
}

.btn-download:active {
  transform: scale(0.98);
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

@media (max-width: 600px) {
  .toolbar {
    flex-direction: column;
    align-items: flex-start;
  }
  .crop-info {
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
  }
}
</style>
