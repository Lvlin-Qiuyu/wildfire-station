<template>
  <div class="tool-page">
    <h2>✂️ 图片圆角裁剪与形状蒙版工具</h2>
    <p class="subtitle">将图片裁剪为圆形、心形、星形等形状，支持透明背景导出PNG</p>

    <!-- 上传区域 -->
    <div class="upload-area" v-if="!imageSrc" @click="triggerUpload" @dragover.prevent @drop.prevent="handleDrop">
      <span class="upload-icon">📁</span>
      <p>点击或拖拽上传图片</p>
      <p class="upload-hint">支持 JPG / PNG / WebP</p>
      <input ref="fileInput" type="file" accept="image/*" @change="handleFile" class="hidden-input" />
    </div>

    <!-- 主操作区 -->
    <div v-if="imageSrc" class="workspace">
      <!-- 左侧：形状选择 + 参数 -->
      <div class="control-panel">
        <h3>选择形状</h3>
        <div class="shape-grid">
          <div v-for="shape in shapes" :key="shape.id"
            :class="['shape-option', { active: selectedShape === shape.id }]"
            @click="selectedShape = shape.id">
            <canvas :ref="el => setShapeThumbRef(el, shape.id)" width="60" height="60"></canvas>
            <span class="shape-name">{{ shape.name }}</span>
          </div>
        </div>

        <h3>参数调节</h3>
        <div class="params">
          <div class="param-group">
            <label>输出尺寸：<strong>{{ outputSize }}px</strong></label>
            <input type="range" v-model.number="outputSize" min="100" max="2000" step="50" class="slider" />
          </div>
          <div class="param-group">
            <label>边距留白：<strong>{{ margin }}px</strong></label>
            <input type="range" v-model.number="margin" min="0" max="50" step="5" class="slider" />
          </div>
          <div class="param-group">
            <label>旋转角度：<strong>{{ rotation }}°</strong></label>
            <input type="range" v-model.number="rotation" min="-180" max="180" step="5" class="slider" />
          </div>
          <div class="param-group">
            <label>背景色</label>
            <div class="bg-options">
              <button :class="{ active: bgMode === 'transparent' }" @click="bgMode = 'transparent'">透明</button>
              <button :class="{ active: bgMode === 'white' }" @click="bgMode = 'white'">白色</button>
              <button :class="{ active: bgMode === 'custom' }" @click="bgMode = 'custom'">
                <input type="color" v-model="bgColor" class="color-dot" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：预览 -->
      <div class="preview-panel">
        <h3>预览效果</h3>
        <div class="preview-wrapper">
          <canvas ref="previewCanvas"></canvas>
        </div>
        <div class="action-bar">
          <button class="btn btn-primary" @click="downloadImage">📥 下载PNG</button>
          <button class="btn btn-secondary" @click="copyToClipboard">📋 复制到剪贴板</button>
          <button class="btn btn-secondary" @click="resetAll">🔄 重新选择</button>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '图片圆角裁剪与形状蒙版工具 - 野火小站' })

const fileInput = ref(null)
const previewCanvas = ref(null)
const imageSrc = ref('')
const originalImage = ref(null)
const selectedShape = ref('circle')
const outputSize = ref(500)
const margin = ref(10)
const rotation = ref(0)
const bgMode = ref('transparent')
const bgColor = ref('#000000')
const shapeThumbRefs = {}

// 形状定义
const shapes = [
  { id: 'circle', name: '圆形' },
  { id: 'rounded', name: '圆角矩形' },
  { id: 'heart', name: '心形' },
  { id: 'star', name: '五角星' },
  { id: 'hexagon', name: '六边形' },
  { id: 'diamond', name: '菱形' },
  { id: 'triangle', name: '三角形' },
  { id: 'pentagon', name: '五边形' },
  { id: 'octagon', name: '八边形' },
  { id: 'cross', name: '十字形' },
  { id: 'egg', name: '椭圆形' },
  { id: 'arch', name: '拱门形' },
]

function setShapeThumbRef(el, id) {
  if (el) shapeThumbRefs[id] = el
}

// 绘制形状缩略图
function drawShapeThumbnails() {
  shapes.forEach(shape => {
    const canvas = shapeThumbRefs[shape.id]
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, 60, 60)
    drawShapePath(ctx, shape.id, 30, 30, 24)
    ctx.fillStyle = '#22c55e'
    ctx.fill()
    ctx.strokeStyle = '#16a34a'
    ctx.lineWidth = 1.5
    ctx.stroke()
  })
}

// 绘制形状路径
function drawShapePath(ctx, shapeId, cx, cy, r) {
  ctx.beginPath()
  switch (shapeId) {
    case 'circle':
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      break
    case 'rounded':
      roundRectPath(ctx, cx - r, cy - r, r * 2, r * 2, r * 0.25)
      break
    case 'heart':
      drawHeart(ctx, cx, cy, r)
      break
    case 'star':
      drawStar(ctx, cx, cy, r, r * 0.4, 5)
      break
    case 'hexagon':
      drawPolygon(ctx, cx, cy, r, 6, -Math.PI / 2)
      break
    case 'diamond':
      drawPolygon(ctx, cx, cy, r, 4, -Math.PI / 2)
      break
    case 'triangle':
      drawPolygon(ctx, cx, cy, r, 3, -Math.PI / 2)
      break
    case 'pentagon':
      drawPolygon(ctx, cx, cy, r, 5, -Math.PI / 2)
      break
    case 'octagon':
      drawPolygon(ctx, cx, cy, r, 8, -Math.PI / 8)
      break
    case 'cross':
      drawCross(ctx, cx, cy, r)
      break
    case 'egg':
      ctx.ellipse(cx, cy, r * 0.8, r, 0, 0, Math.PI * 2)
      break
    case 'arch':
      drawArch(ctx, cx, cy, r)
      break
  }
  ctx.closePath()
}

function roundRectPath(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2)
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
}

function drawHeart(ctx, cx, cy, r) {
  const d = r * 0.8
  ctx.moveTo(cx, cy + d * 0.8)
  ctx.bezierCurveTo(cx - d * 1.4, cy - d * 0.2, cx - d * 0.7, cy - d * 1.2, cx, cy - d * 0.6)
  ctx.bezierCurveTo(cx + d * 0.7, cy - d * 1.2, cx + d * 1.4, cy - d * 0.2, cx, cy + d * 0.8)
}

function drawStar(ctx, cx, cy, outerR, innerR, points) {
  const step = Math.PI / points
  ctx.moveTo(cx, cy - outerR)
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR
    const angle = -Math.PI / 2 + step * i
    ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle))
  }
}

function drawPolygon(ctx, cx, cy, r, sides, startAngle) {
  for (let i = 0; i < sides; i++) {
    const angle = startAngle + (Math.PI * 2 / sides) * i
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
}

function drawCross(ctx, cx, cy, r) {
  const w = r * 0.4
  ctx.moveTo(cx - w, cy - r)
  ctx.lineTo(cx + w, cy - r)
  ctx.lineTo(cx + w, cy - w)
  ctx.lineTo(cx + r, cy - w)
  ctx.lineTo(cx + r, cy + w)
  ctx.lineTo(cx + w, cy + w)
  ctx.lineTo(cx + w, cy + r)
  ctx.lineTo(cx - w, cy + r)
  ctx.lineTo(cx - w, cy + w)
  ctx.lineTo(cx - r, cy + w)
  ctx.lineTo(cx - r, cy - w)
  ctx.lineTo(cx - w, cy - w)
}

function drawArch(ctx, cx, cy, r) {
  ctx.moveTo(cx - r, cy + r)
  ctx.lineTo(cx - r, cy - r * 0.2)
  ctx.arc(cx, cy - r * 0.2, r, Math.PI, 0)
  ctx.lineTo(cx + r, cy + r)
}

function triggerUpload() { fileInput.value?.click() }

function handleFile(e) {
  const file = e.target.files?.[0]
  if (file) loadImage(file)
}

function handleDrop(e) {
  const file = e.dataTransfer?.files?.[0]
  if (file?.type.startsWith('image/')) loadImage(file)
}

function loadImage(file) {
  const reader = new FileReader()
  reader.onload = (e) => {
    imageSrc.value = e.target.result
    const img = new Image()
    img.onload = () => {
      originalImage.value = img
      nextTick(() => {
        drawShapeThumbnails()
        renderPreview()
      })
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

// 渲染预览
function renderPreview() {
  const canvas = previewCanvas.value
  const img = originalImage.value
  if (!canvas || !img) return

  const size = outputSize.value
  const mg = margin.value
  const rot = rotation.value * Math.PI / 180

  // 预览用较小尺寸
  const previewMax = 500
  const scale = Math.min(1, previewMax / size)
  const ps = Math.round(size * scale)

  const dpr = window.devicePixelRatio || 1
  canvas.width = ps * dpr
  canvas.height = ps * dpr
  canvas.style.width = ps + 'px'
  canvas.style.height = ps + 'px'

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  // 清除并绘制背景
  ctx.clearRect(0, 0, ps, ps)
  if (bgMode.value !== 'transparent') {
    ctx.fillStyle = bgMode.value === 'white' ? '#ffffff' : bgColor.value
    ctx.fillRect(0, 0, ps, ps)
  }

  // 旋转并裁剪
  ctx.save()
  ctx.translate(ps / 2, ps / 2)
  ctx.rotate(rot)
  ctx.translate(-ps / 2, -ps / 2)

  // 绘制蒙版
  drawShapePath(ctx, selectedShape.value, ps / 2, ps / 2, (ps - mg * scale * 2) / 2)
  ctx.clip()

  // 居中裁剪绘制图片
  const imgRatio = img.width / img.height
  const drawSize = ps * 1.1 // 略大于画布以覆盖旋转
  let dw, dh
  if (imgRatio > 1) {
    dh = drawSize
    dw = drawSize * imgRatio
  } else {
    dw = drawSize
    dh = drawSize / imgRatio
  }
  ctx.drawImage(img, (ps - dw) / 2, (ps - dh) / 2, dw, dh)
  ctx.restore()
}

// 下载
async function downloadImage() {
  const img = originalImage.value
  if (!img) return

  const size = outputSize.value
  const mg = margin.value
  const rot = rotation.value * Math.PI / 180

  const dlCanvas = document.createElement('canvas')
  dlCanvas.width = size
  dlCanvas.height = size

  const ctx = dlCanvas.getContext('2d')
  if (bgMode.value !== 'transparent') {
    ctx.fillStyle = bgMode.value === 'white' ? '#ffffff' : bgColor.value
    ctx.fillRect(0, 0, size, size)
  }

  ctx.save()
  ctx.translate(size / 2, size / 2)
  ctx.rotate(rot)
  ctx.translate(-size / 2, -size / 2)

  drawShapePath(ctx, selectedShape.value, size / 2, size / 2, (size - mg * 2) / 2)
  ctx.clip()

  const imgRatio = img.width / img.height
  const drawSize = size * 1.1
  let dw, dh
  if (imgRatio > 1) { dh = drawSize; dw = drawSize * imgRatio }
  else { dw = drawSize; dh = drawSize / imgRatio }
  ctx.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh)
  ctx.restore()

  const link = document.createElement('a')
  link.download = `masked-${selectedShape.value}-${Date.now()}.png`
  link.href = dlCanvas.toDataURL('image/png')
  link.click()
}

// 复制到剪贴板
async function copyToClipboard() {
  const img = originalImage.value
  if (!img) return

  const size = outputSize.value
  const mg = margin.value
  const rot = rotation.value * Math.PI / 180

  const tmpCanvas = document.createElement('canvas')
  tmpCanvas.width = size
  tmpCanvas.height = size

  const ctx = tmpCanvas.getContext('2d')
  ctx.save()
  ctx.translate(size / 2, size / 2)
  ctx.rotate(rot)
  ctx.translate(-size / 2, -size / 2)
  drawShapePath(ctx, selectedShape.value, size / 2, size / 2, (size - mg * 2) / 2)
  ctx.clip()

  const imgRatio = img.width / img.height
  const drawSize = size * 1.1
  let dw, dh
  if (imgRatio > 1) { dh = drawSize; dw = drawSize * imgRatio }
  else { dw = drawSize; dh = drawSize / imgRatio }
  ctx.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh)
  ctx.restore()

  try {
    const blob = await new Promise(resolve => tmpCanvas.toBlob(resolve, 'image/png'))
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
  } catch { /* 剪贴板API不可用 */ }
}

function resetAll() {
  imageSrc.value = ''
  originalImage.value = null
  selectedShape.value = 'circle'
  outputSize.value = 500
  margin.value = 10
  rotation.value = 0
}

watch([selectedShape, outputSize, margin, rotation, bgMode, bgColor], () => nextTick(renderPreview))
</script>

<style scoped>
.tool-page { padding-top: 0.5rem; }
h2 { font-size: 1.6rem; margin-bottom: 0.3rem; }
.subtitle { color: #888; font-size: 0.95rem; margin-bottom: 1.5rem; }

.upload-area {
  border: 2px dashed #ccc; border-radius: 16px; padding: 3rem 2rem;
  text-align: center; cursor: pointer; transition: all 0.2s; background: #fafafa;
}
.upload-area:hover { border-color: #22c55e; background: #f0fdf4; }
.upload-icon { font-size: 3rem; display: block; margin-bottom: 1rem; }
.upload-hint { color: #aaa; font-size: 0.85rem; margin-top: 0.5rem; }
.hidden-input { display: none; }

.workspace { display: grid; grid-template-columns: 280px 1fr; gap: 1.5rem; }
.control-panel, .preview-panel h3 { font-size: 1.05rem; margin-bottom: 0.8rem; color: #333; }
.control-panel { background: white; border-radius: 12px; padding: 1.2rem; border: 1px solid #eee; }

.shape-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.6rem; margin-bottom: 1.2rem;
}
.shape-option {
  text-align: center; cursor: pointer; padding: 0.4rem; border-radius: 8px; transition: all 0.2s;
}
.shape-option:hover { background: #f0fdf4; }
.shape-option.active { background: #dcfce7; outline: 2px solid #22c55e; }
.shape-option canvas { display: block; margin: 0 auto; }
.shape-name { font-size: 0.75rem; color: #666; display: block; margin-top: 0.2rem; }

.params { display: flex; flex-direction: column; gap: 0.8rem; }
.param-group { display: flex; flex-direction: column; gap: 0.3rem; }
.param-group label { font-weight: 600; font-size: 0.85rem; color: #555; }
.slider {
  -webkit-appearance: none; width: 100%; height: 6px;
  border-radius: 3px; background: #e9ecef; outline: none;
}
.slider::-webkit-slider-thumb {
  -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%;
  background: linear-gradient(135deg, #22c55e, #10b981); cursor: pointer;
}
.bg-options { display: flex; gap: 0.5rem; }
.bg-options button {
  padding: 0.35rem 0.7rem; border: 1px solid #ddd; border-radius: 6px;
  background: white; cursor: pointer; font-size: 0.8rem; transition: all 0.2s;
}
.bg-options button.active { border-color: #22c55e; background: #f0fdf4; }
.color-dot { width: 20px; height: 20px; border: none; cursor: pointer; padding: 0; }

.preview-panel { background: white; border-radius: 12px; padding: 1.2rem; border: 1px solid #eee; }
.preview-wrapper {
  background: repeating-conic-gradient(#e5e5e5 0% 25%, transparent 0% 50%);
  background-size: 16px 16px; border-radius: 10px; padding: 1.5rem;
  display: flex; justify-content: center; margin-bottom: 1rem;
}
.preview-wrapper canvas { display: block; max-width: 100%; }

.action-bar { display: flex; gap: 0.8rem; flex-wrap: wrap; }
.btn {
  padding: 0.6rem 1.2rem; border-radius: 8px; font-size: 0.9rem;
  cursor: pointer; border: none; font-weight: 600; transition: all 0.2s;
}
.btn-primary { background: linear-gradient(135deg, #22c55e, #10b981); color: white; }
.btn-primary:hover { opacity: 0.9; }
.btn-secondary { background: white; color: #666; border: 1px solid #ddd; }
.btn-secondary:hover { border-color: #22c55e; color: #22c55e; }

.back-link { display: inline-block; margin-top: 2rem; color: #22c55e; font-weight: 500; }
.back-link:hover { text-decoration: underline; }

@media (max-width: 768px) {
  .workspace { grid-template-columns: 1fr; }
  .shape-grid { grid-template-columns: repeat(6, 1fr); }
}
</style>
