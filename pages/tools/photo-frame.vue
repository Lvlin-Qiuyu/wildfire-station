<template>
  <div class="tool-page">
    <h2>🖼️ 图片画框与相框效果生成器</h2>
    <p class="subtitle">为图片添加精美画框/相框效果，支持多种风格，一键导出带框图片</p>

    <!-- 上传区域 -->
    <div class="upload-area" v-if="!imageSrc" @click="triggerUpload" @dragover.prevent @drop.prevent="handleDrop">
      <span class="upload-icon">📁</span>
      <p>点击或拖拽上传图片</p>
      <p class="upload-hint">支持 JPG / PNG / WebP</p>
      <input ref="fileInput" type="file" accept="image/*" @change="handleFile" class="hidden-input" />
    </div>

    <!-- 画框风格选择 -->
    <div v-if="imageSrc" class="frame-section">
      <h3>选择画框风格</h3>
      <div class="frame-grid">
        <div v-for="frame in frameStyles" :key="frame.id"
          :class="['frame-option', { active: selectedFrame === frame.id }]"
          @click="selectedFrame = frame.id">
          <div class="frame-preview" :style="{ background: frame.previewBg, border: frame.previewBorder }">
            <span class="frame-emoji">{{ frame.icon }}</span>
          </div>
          <span class="frame-name">{{ frame.name }}</span>
        </div>
      </div>
    </div>

    <!-- 参数调节 -->
    <div v-if="imageSrc" class="params-section">
      <h3>参数调节</h3>
      <div class="params-grid">
        <div class="param-group">
          <label>边框宽度：<strong>{{ borderWidth }}px</strong></label>
          <input type="range" v-model.number="borderWidth" min="10" max="200" step="5" class="slider" />
        </div>
        <div class="param-group">
          <label>圆角半径：<strong>{{ borderRadius }}px</strong></label>
          <input type="range" v-model.number="borderRadius" min="0" max="100" step="5" class="slider" />
        </div>
        <div class="param-group">
          <label>内边距：<strong>{{ padding }}px</strong></label>
          <input type="range" v-model.number="padding" min="0" max="60" step="5" class="slider" />
        </div>
        <div class="param-group">
          <label>旋转角度：<strong>{{ rotation }}°</strong></label>
          <input type="range" v-model.number="rotation" min="-45" max="45" step="1" class="slider" />
        </div>
        <div class="param-group">
          <label>自定义颜色</label>
          <input type="color" v-model="customColor" class="color-input" />
        </div>
      </div>
    </div>

    <!-- 预览区域 -->
    <div v-if="imageSrc" class="preview-section">
      <h3>预览效果</h3>
      <div class="preview-wrapper">
        <canvas ref="previewCanvas"></canvas>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div v-if="imageSrc" class="action-bar">
      <button class="btn btn-primary" @click="downloadImage">📥 下载图片</button>
      <button class="btn btn-secondary" @click="resetAll">🔄 重新选择</button>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '图片画框与相框效果生成器 - 野火小站' })

const fileInput = ref(null)
const previewCanvas = ref(null)
const imageSrc = ref('')
const originalImage = ref(null)
const selectedFrame = ref('simple-white')
const borderWidth = ref(40)
const borderRadius = ref(0)
const padding = ref(10)
const rotation = ref(0)
const customColor = ref('#ffffff')

// 画框风格定义
const frameStyles = [
  { id: 'simple-white', name: '简约白框', icon: '⬜', color: '#ffffff', shadow: true, previewBg: '#fff', previewBorder: '2px solid #ddd' },
  { id: 'simple-black', name: '极简黑框', icon: '⬛', color: '#1a1a1a', shadow: false, previewBg: '#1a1a1a', previewBorder: '2px solid #333' },
  { id: 'wood', name: '复古木质', icon: '🪵', color: '#8B6914', shadow: true, previewBg: '#8B6914', previewBorder: 'none' },
  { id: 'gold', name: '金色浮雕', icon: '✨', color: '#D4AF37', shadow: true, previewBg: '#D4AF37', previewBorder: 'none' },
  { id: 'polaroid', name: '拍立得', icon: '📸', color: '#f5f5f0', shadow: true, previewBg: '#f5f5f0', previewBorder: 'none' },
  { id: 'shadow', name: '悬浮阴影', icon: '🌫️', color: '#ffffff', shadow: true, previewBg: '#fff', previewBorder: '2px dashed #ccc' },
  { id: 'rounded', name: '圆角卡片', icon: '🃏', color: '#ffffff', shadow: true, previewBg: '#fff', previewBorder: '2px solid #ddd', forceRadius: 24 },
  { id: 'film', name: '胶片边框', icon: '🎞️', color: '#2a2a2a', shadow: false, previewBg: '#2a2a2a', previewBorder: 'none' },
  { id: 'neon', name: '霓虹发光', icon: '💜', color: '#0a0a1a', shadow: true, previewBg: '#0a0a1a', previewBorder: 'none', glow: '#a855f7' },
  { id: 'tape', name: '纸胶带', icon: '📝', color: '#f5f0e8', shadow: false, previewBg: '#f5f0e8', previewBorder: 'none' },
  { id: 'vintage', name: '怀旧相框', icon: '🏛️', color: '#d4c5a9', shadow: true, previewBg: '#d4c5a9', previewBorder: 'none' },
  { id: 'custom', name: '自定义', icon: '🎨', color: '', shadow: true, previewBg: '#ccc', previewBorder: 'none' },
]

function triggerUpload() {
  fileInput.value?.click()
}

function handleFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  loadImage(file)
}

function handleDrop(e) {
  const file = e.dataTransfer?.files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  loadImage(file)
}

function loadImage(file) {
  const reader = new FileReader()
  reader.onload = (e) => {
    imageSrc.value = e.target.result
    const img = new Image()
    img.onload = () => {
      originalImage.value = img
      nextTick(renderFrame)
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

// 绘制画框效果
function renderFrame() {
  const canvas = previewCanvas.value
  const img = originalImage.value
  if (!canvas || !img) return

  const frame = frameStyles.find(f => f.id === selectedFrame.value)
  const bw = borderWidth.value
  const pd = padding.value
  const rad = frame?.forceRadius || borderRadius.value
  const rot = rotation.value * Math.PI / 180
  const bgColor = frame?.id === 'custom' ? customColor.value : (frame?.color || '#ffffff')

  // 特殊处理拍立得：底部边框更宽
  const topBottom = selectedFrame.value === 'polaroid' ? { top: bw, bottom: bw * 2.5, left: bw, right: bw } : { top: bw, bottom: bw, left: bw, right: bw }

  // 计算画布尺寸
  const imgW = img.width
  const imgH = img.height
  const totalW = topBottom.left + pd + imgW + pd + topBottom.right
  const totalH = topBottom.top + pd + imgH + pd + topBottom.bottom

  // 限制最大尺寸以保证性能
  const maxSize = 1200
  const scale = Math.min(1, maxSize / Math.max(totalW, totalH))
  const cw = Math.round(totalW * scale)
  const ch = Math.round(totalH * scale)

  const dpr = window.devicePixelRatio || 1
  canvas.width = cw * dpr
  canvas.height = ch * dpr
  canvas.style.width = cw + 'px'
  canvas.style.height = ch + 'px'

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  // 居中旋转
  ctx.save()
  ctx.translate(cw / 2, ch / 2)
  ctx.rotate(rot)
  ctx.translate(-cw / 2, -ch / 2)

  const sW = topBottom.left * scale
  const sB = topBottom.bottom * scale
  const sL = topBottom.left * scale
  const sR = topBottom.right * scale
  const sPd = pd * scale
  const sRad = rad * scale

  // 绘制阴影（阴影模式或普通阴影）
  if (frame?.shadow && selectedFrame.value !== 'neon') {
    ctx.shadowColor = 'rgba(0,0,0,0.25)'
    ctx.shadowBlur = 20 * scale
    ctx.shadowOffsetX = 4 * scale
    ctx.shadowOffsetY = 6 * scale
  }

  // 圆角矩形路径
  function roundRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.arcTo(x + w, y, x + w, y + r, r)
    ctx.lineTo(x + w, y + h - r)
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
    ctx.lineTo(x + r, y + h)
    ctx.arcTo(x, y + h, x, y + h - r, r)
    ctx.lineTo(x, y + r)
    ctx.arcTo(x, y, x + r, y, r)
    ctx.closePath()
  }

  // 绘制背景（画框底色）
  roundRect(0, 0, cw, ch, sRad)
  ctx.fillStyle = bgColor
  ctx.fill()
  ctx.shadowColor = 'transparent'

  // 木质纹理效果
  if (selectedFrame.value === 'wood') {
    drawWoodTexture(ctx, cw, ch, sRad, sL, sW, sR, sB)
  }

  // 金色浮雕效果
  if (selectedFrame.value === 'gold') {
    drawGoldEmboss(ctx, cw, ch, sRad)
  }

  // 胶片边框效果
  if (selectedFrame.value === 'film') {
    drawFilmBorder(ctx, cw, ch, scale, sL, sR, sW, sB)
  }

  // 霓虹发光效果
  if (selectedFrame.value === 'neon') {
    ctx.shadowColor = frame.glow
    ctx.shadowBlur = 30 * scale
    ctx.strokeStyle = frame.glow
    ctx.lineWidth = 3 * scale
    roundRect(0, 0, cw, ch, sRad)
    ctx.stroke()
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
  }

  // 纸胶带效果
  if (selectedFrame.value === 'tape') {
    drawTape(ctx, cw, sW, scale)
  }

  // 裁剪内部圆角并绘制图片
  ctx.save()
  roundRect(sL, sW, cw - sL - sR, ch - sW - sB, Math.max(0, sRad - 6 * scale))
  ctx.clip()
  ctx.drawImage(img, sL + sPd, sW + sPd, (cw - sL - sR - sPd * 2), (ch - sW - sB - sPd * 2))
  ctx.restore()

  // 怀旧相框内装饰线
  if (selectedFrame.value === 'vintage') {
    ctx.strokeStyle = '#b8a88a'
    ctx.lineWidth = 2 * scale
    roundRect(sL + 8 * scale, sW + 8 * scale, cw - sL - sR - 16 * scale, ch - sW - sB - 16 * scale, Math.max(0, sRad - 10 * scale))
    ctx.stroke()
    roundRect(sL + 14 * scale, sW + 14 * scale, cw - sL - sR - 28 * scale, ch - sW - sB - 28 * scale, Math.max(0, sRad - 16 * scale))
    ctx.stroke()
  }

  ctx.restore()
}

// 木质纹理
function drawWoodTexture(ctx, w, h, rad, l, t, r, b) {
  ctx.save()
  roundRect(0, 0, w, h, rad)
  ctx.clip()
  // 竖条纹模拟木纹
  ctx.globalAlpha = 0.15
  for (let x = 0; x < w; x += 4) {
    const offset = Math.sin(x * 0.05) * 10
    ctx.fillStyle = x % 8 === 0 ? '#6B4E0A' : '#A07830'
    ctx.fillRect(x, 0, 3 + offset, h)
  }
  ctx.globalAlpha = 1
  ctx.restore()
}

// 金色浮雕
function drawGoldEmboss(ctx, w, h, rad) {
  ctx.save()
  roundRect(0, 0, w, h, rad)
  ctx.clip()
  // 内凹渐变
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, 'rgba(255,255,255,0.3)')
  grad.addColorStop(0.1, 'rgba(0,0,0,0)')
  grad.addColorStop(0.9, 'rgba(0,0,0,0)')
  grad.addColorStop(1, 'rgba(0,0,0,0.3)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
  const grad2 = ctx.createLinearGradient(0, 0, w, 0)
  grad2.addColorStop(0, 'rgba(255,255,255,0.2)')
  grad2.addColorStop(0.1, 'rgba(0,0,0,0)')
  grad2.addColorStop(0.9, 'rgba(0,0,0,0)')
  grad2.addColorStop(1, 'rgba(0,0,0,0.2)')
  ctx.fillStyle = grad2
  ctx.fillRect(0, 0, w, h)
  ctx.restore()
}

// 胶片边框（齿孔）
function drawFilmBorder(ctx, w, h, scale, l, r, top, bottom) {
  ctx.fillStyle = '#1a1a1a'
  const holeSize = 16 * scale
  const gap = 24 * scale
  // 上下齿孔
  for (let x = l * 0.3; x < w - r * 0.3; x += gap) {
    // 上排
    roundRect(x - holeSize / 2, top * 0.3, holeSize, holeSize * 0.7, 3 * scale)
    ctx.fill()
    // 下排
    roundRect(x - holeSize / 2, h - bottom * 0.3 - holeSize * 0.7, holeSize, holeSize * 0.7, 3 * scale)
    ctx.fill()
  }
  // 齿孔高亮
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  for (let x = l * 0.3; x < w - r * 0.3; x += gap) {
    roundRect(x - holeSize / 2 + 1, top * 0.3 + 1, holeSize - 2, holeSize * 0.7 - 2, 3 * scale)
    ctx.fill()
    roundRect(x - holeSize / 2 + 1, h - bottom * 0.3 - holeSize * 0.7 + 1, holeSize - 2, holeSize * 0.7 - 2, 3 * scale)
    ctx.fill()
  }
}

// 纸胶带
function drawTape(ctx, w, top, scale) {
  const tapeW = 100 * scale
  const tapeH = 28 * scale
  // 左上角胶带
  ctx.save()
  ctx.translate(20 * scale, top + 10 * scale)
  ctx.rotate(-0.2)
  ctx.fillStyle = 'rgba(255, 220, 150, 0.7)'
  ctx.fillRect(-tapeW / 2, -tapeH / 2, tapeW, tapeH)
  ctx.restore()
  // 右上角胶带
  ctx.save()
  ctx.translate(w - 20 * scale, top + 10 * scale)
  ctx.rotate(0.15)
  ctx.fillStyle = 'rgba(200, 230, 255, 0.7)'
  ctx.fillRect(-tapeW / 2, -tapeH / 2, tapeW, tapeH)
  ctx.restore()
}

// 下载带框图片
function downloadImage() {
  const canvas = previewCanvas.value
  if (!canvas) return

  // 重新以原始分辨率绘制用于下载
  const img = originalImage.value
  const frame = frameStyles.find(f => f.id === selectedFrame.value)
  const bw = borderWidth.value
  const pd = padding.value
  const rad = frame?.forceRadius || borderRadius.value
  const bgColor = frame?.id === 'custom' ? customColor.value : (frame?.color || '#ffffff')
  const topBottom = selectedFrame.value === 'polaroid'
    ? { top: bw, bottom: bw * 2.5, left: bw, right: bw }
    : { top: bw, bottom: bw, left: bw, right: bw }

  const dlCanvas = document.createElement('canvas')
  const totalW = topBottom.left + pd + img.width + pd + topBottom.right
  const totalH = topBottom.top + pd + img.height + pd + topBottom.bottom
  dlCanvas.width = totalW
  dlCanvas.height = totalH

  const ctx = dlCanvas.getContext('2d')
  const rot = rotation.value * Math.PI / 180
  ctx.save()
  ctx.translate(totalW / 2, totalH / 2)
  ctx.rotate(rot)
  ctx.translate(-totalW / 2, -totalH / 2)

  function roundRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.arcTo(x + w, y, x + w, y + r, r)
    ctx.lineTo(x + w, y + h - r)
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
    ctx.lineTo(x + r, y + h)
    ctx.arcTo(x, y + h, x, y + h - r, r)
    ctx.lineTo(x, y + r)
    ctx.arcTo(x, y, x + r, y, r)
    ctx.closePath()
  }

  roundRect(0, 0, totalW, totalH, rad)
  ctx.fillStyle = bgColor
  ctx.fill()

  roundRect(topBottom.left, topBottom.top, totalW - topBottom.left - topBottom.right, totalH - topBottom.top - topBottom.bottom, Math.max(0, rad - 6))
  ctx.clip()
  ctx.drawImage(img, topBottom.left + pd, topBottom.top + pd, totalW - topBottom.left - topBottom.right - pd * 2, totalH - topBottom.top - topBottom.bottom - pd * 2)
  ctx.restore()

  const link = document.createElement('a')
  link.download = `framed-image-${Date.now()}.png`
  link.href = dlCanvas.toDataURL('image/png')
  link.click()
}

function resetAll() {
  imageSrc.value = ''
  originalImage.value = null
  selectedFrame.value = 'simple-white'
  borderWidth.value = 40
  borderRadius.value = 0
  padding.value = 10
  rotation.value = 0
}

// 监听参数变化重绘
watch([selectedFrame, borderWidth, borderRadius, padding, rotation, customColor], () => {
  nextTick(renderFrame)
})
</script>

<style scoped>
.tool-page { padding-top: 0.5rem; }
h2 { font-size: 1.6rem; margin-bottom: 0.3rem; }
.subtitle { color: #888; font-size: 0.95rem; margin-bottom: 1.5rem; }

/* 上传区域 */
.upload-area {
  border: 2px dashed #ccc;
  border-radius: 16px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;
}
.upload-area:hover { border-color: #22c55e; background: #f0fdf4; }
.upload-icon { font-size: 3rem; display: block; margin-bottom: 1rem; }
.upload-hint { color: #aaa; font-size: 0.85rem; margin-top: 0.5rem; }
.hidden-input { display: none; }

/* 画框风格选择 */
.frame-section { margin-bottom: 1.5rem; }
.frame-section h3, .params-section h3, .preview-section h3 {
  font-size: 1.05rem; margin-bottom: 0.8rem; color: #333;
}
.frame-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.8rem;
}
.frame-option {
  text-align: center; cursor: pointer; transition: all 0.2s;
  padding: 0.6rem; border-radius: 10px;
}
.frame-option:hover { background: #f0fdf4; }
.frame-option.active { background: #dcfce7; outline: 2px solid #22c55e; }
.frame-preview {
  width: 64px; height: 64px; margin: 0 auto 0.4rem;
  border-radius: 8px; display: flex; align-items: center; justify-content: center;
}
.frame-emoji { font-size: 1.8rem; }
.frame-name { font-size: 0.8rem; color: #666; }

/* 参数调节 */
.params-section { margin-bottom: 1.5rem; }
.params-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;
}
.param-group { display: flex; flex-direction: column; gap: 0.3rem; }
.param-group label { font-weight: 600; font-size: 0.9rem; color: #555; }
.slider {
  -webkit-appearance: none; width: 100%; height: 6px;
  border-radius: 3px; background: #e9ecef; outline: none;
}
.slider::-webkit-slider-thumb {
  -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%;
  background: linear-gradient(135deg, #22c55e, #10b981); cursor: pointer;
}
.color-input { width: 60px; height: 36px; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; }

/* 预览 */
.preview-section { margin-bottom: 1.5rem; }
.preview-wrapper {
  background: #f5f5f5; border-radius: 12px; padding: 2rem;
  display: flex; justify-content: center; overflow: hidden;
  background-image: repeating-conic-gradient(#e5e5e5 0% 25%, transparent 0% 50%);
  background-size: 20px 20px;
}
.preview-wrapper canvas { max-width: 100%; height: auto; display: block; }

/* 操作按钮 */
.action-bar { display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
.btn {
  padding: 0.7rem 1.5rem; border-radius: 10px; font-size: 0.95rem;
  cursor: pointer; border: none; transition: all 0.2s; font-weight: 600;
}
.btn-primary { background: linear-gradient(135deg, #22c55e, #10b981); color: white; }
.btn-primary:hover { opacity: 0.9; }
.btn-secondary { background: white; color: #666; border: 1px solid #ddd; }
.btn-secondary:hover { border-color: #22c55e; color: #22c55e; }

.back-link { display: inline-block; margin-top: 2rem; color: #22c55e; font-weight: 500; }
.back-link:hover { text-decoration: underline; }

@media (max-width: 640px) {
  .params-grid { grid-template-columns: 1fr; }
  .frame-grid { grid-template-columns: repeat(4, 1fr); }
}
</style>
