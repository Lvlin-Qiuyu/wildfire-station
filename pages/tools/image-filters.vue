<template>
  <div class="tool-page">
    <h2>🎨 图片滤镜与调色工具</h2>
    <p class="subtitle">上传图片后应用多种滤镜（灰度、怀旧、反色、模糊、锐化），手动调节亮度/对比度/饱和度/色温，实时预览并导出</p>

    <!-- 上传区域 -->
    <div class="upload-area" v-if="!imageSrc" @click="triggerUpload" @dragover.prevent @drop.prevent="handleDrop">
      <input ref="fileInput" type="file" accept="image/*" hidden @change="handleFileChange" />
      <div class="upload-content">
        <span class="upload-icon">🖼️</span>
        <p>点击或拖拽图片到这里</p>
        <p class="upload-hint">支持 JPG、PNG、WebP、BMP 等常见格式</p>
      </div>
    </div>

    <!-- 编辑区域 -->
    <div v-if="imageSrc" class="editor-layout">
      <!-- 左侧预览 -->
      <div class="preview-panel">
        <div class="preview-header">
          <span class="file-info" v-if="fileName">📁 {{ fileName }}（{{ formatSize(fileSize) }}）</span>
          <button class="btn-sm" @click="resetAll">重新上传</button>
        </div>
        <div class="preview-container" ref="previewContainer">
          <canvas ref="previewCanvas" class="preview-canvas"></canvas>
        </div>
        <div class="preview-actions">
          <button class="btn-download" @click="exportImage('png')">📥 导出 PNG</button>
          <button class="btn-download btn-jpg" @click="exportImage('jpeg')">📥 导出 JPG</button>
        </div>
      </div>

      <!-- 右侧控制面板 -->
      <div class="controls-panel">
        <!-- 预设滤镜 -->
        <div class="section">
          <div class="section-title">🎭 预设滤镜</div>
          <div class="filter-presets">
            <button
              v-for="preset in presets"
              :key="preset.name"
              class="preset-btn"
              :class="{ active: activePreset === preset.name }"
              @click="applyPreset(preset)"
            >
              <span class="preset-icon">{{ preset.icon }}</span>
              <span class="preset-name">{{ preset.name }}</span>
            </button>
          </div>
        </div>

        <!-- 手动调节 -->
        <div class="section">
          <div class="section-title">🎛️ 手动调节</div>

          <div class="slider-group" v-for="slider in sliders" :key="slider.key">
            <div class="slider-header">
              <span class="slider-label">{{ slider.label }}</span>
              <span class="slider-value">{{ slider.value }}{{ slider.unit }}</span>
            </div>
            <input
              type="range"
              :min="slider.min"
              :max="slider.max"
              :step="slider.step"
              v-model.number="slider.value"
              class="slider-input"
              @input="onSliderChange"
            />
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <button class="btn-reset" @click="resetFilters">重置滤镜</button>
          <button class="btn-compare" @click="toggleCompare">{{ isComparing ? '🔒 关闭对比' : '🔍 对比原图' }}</button>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '图片滤镜与调色工具 - 野火小站' })

const fileInput = ref(null)
const previewContainer = ref(null)
const previewCanvas = ref(null)

// 图片数据
const imageSrc = ref(null)
const fileName = ref('')
const fileSize = ref(0)
const originalImageData = ref(null)
const isComparing = ref(false)
const activePreset = ref('原图')
let originalImage = null

// 滑块参数
const sliders = reactive([
  { key: 'brightness', label: '亮度', value: 0, min: -100, max: 100, step: 1, unit: '' },
  { key: 'contrast', label: '对比度', value: 0, min: -100, max: 100, step: 1, unit: '' },
  { key: 'saturation', label: '饱和度', value: 0, min: -100, max: 100, step: 1, unit: '' },
  { key: 'temperature', label: '色温', value: 0, min: -100, max: 100, step: 1, unit: '' },
  { key: 'blur', label: '模糊', value: 0, min: 0, max: 20, step: 1, unit: 'px' },
  { key: 'sharpness', label: '锐化', value: 0, min: 0, max: 100, step: 1, unit: '' },
])

// 预设滤镜
const presets = [
  { name: '原图', icon: '🎨', brightness: 0, contrast: 0, saturation: 0, temperature: 0, blur: 0, sharpness: 0 },
  { name: '灰度', icon: '⬛', brightness: 0, contrast: 10, saturation: -100, temperature: 0, blur: 0, sharpness: 0 },
  { name: '怀旧', icon: '📜', brightness: 10, contrast: 15, saturation: -60, temperature: 30, blur: 0, sharpness: 0 },
  { name: '反色', icon: '🔄', brightness: 0, contrast: 0, saturation: 0, temperature: 0, blur: 0, sharpness: 0, invert: true },
  { name: '暖色', icon: '☀️', brightness: 5, contrast: 5, saturation: 20, temperature: 50, blur: 0, sharpness: 0 },
  { name: '冷色', icon: '❄️', brightness: 5, contrast: 5, saturation: 20, temperature: -50, blur: 0, sharpness: 0 },
  { name: '高对比', icon: '⚡', brightness: 0, contrast: 60, saturation: 20, temperature: 0, blur: 0, sharpness: 30 },
  { name: '柔焦', icon: '💫', brightness: 10, contrast: -10, saturation: -10, temperature: 10, blur: 3, sharpness: 0 },
  { name: '戏剧', icon: '🎭', brightness: -10, contrast: 40, saturation: 30, temperature: -10, blur: 0, sharpness: 50 },
  { name: '褪色', icon: '📷', brightness: 10, contrast: -20, saturation: -50, temperature: 10, blur: 0, sharpness: 0 },
]

// 触发上传
function triggerUpload() {
  fileInput.value?.click()
}

// 处理文件选择
function handleFileChange(e) {
  const file = e.target.files?.[0]
  if (file) loadImage(file)
}

// 处理拖拽
function handleDrop(e) {
  const file = e.dataTransfer.files?.[0]
  if (file && file.type.startsWith('image/')) loadImage(file)
}

// 加载图片
function loadImage(file) {
  fileName.value = file.name
  fileSize.value = file.size

  const reader = new FileReader()
  reader.onload = (e) => {
    imageSrc.value = e.target.result
    const img = new Image()
    img.onload = () => {
      originalImage = img
      resetFilters()
      nextTick(() => drawPreview())
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

// 重置滤镜参数
function resetFilters() {
  sliders[0].value = 0 // brightness
  sliders[1].value = 0 // contrast
  sliders[2].value = 0 // saturation
  sliders[3].value = 0 // temperature
  sliders[4].value = 0 // blur
  sliders[5].value = 0 // sharpness
  activePreset.value = '原图'
  isComparing.value = false
}

// 应用预设
function applyPreset(preset) {
  activePreset.value = preset.name

  if (preset.invert) {
    // 反色特殊处理
    sliders.forEach(s => s.value = 0)
    sliders[1].value = -100 // 用特殊对比度值标记反色
    // 直接标记
    drawPreview()
    return
  }

  sliders[0].value = preset.brightness
  sliders[1].value = preset.contrast
  sliders[2].value = preset.saturation
  sliders[3].value = preset.temperature
  sliders[4].value = preset.blur
  sliders[5].value = preset.sharpness
}

// 滑块变化时重新绘制
let renderTimer = null
function onSliderChange() {
  activePreset.value = '自定义'
  clearTimeout(renderTimer)
  renderTimer = setTimeout(() => drawPreview(), 30)
}

// 绘制预览
function drawPreview() {
  const canvas = previewCanvas.value
  if (!canvas || !originalImage) return

  const container = previewContainer.value
  const maxW = container.clientWidth - 20
  const maxH = 500

  // 计算缩放后的尺寸
  let w = originalImage.width
  let h = originalImage.height
  const scale = Math.min(maxW / w, maxH / h, 1)
  w = Math.floor(w * scale)
  h = Math.floor(h * scale)

  canvas.width = w
  canvas.height = h

  const ctx = canvas.getContext('2d')

  // 先绘制原图到临时 canvas
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = w
  tempCanvas.height = h
  const tempCtx = tempCanvas.getContext('2d')
  tempCtx.drawImage(originalImage, 0, 0, w, h)

  // 获取像素数据
  let imageData = tempCtx.getImageData(0, 0, w, h)

  // 应用像素级操作
  const brightness = sliders[0].value / 100
  const contrast = sliders[1].value
  const saturation = sliders[2].value / 100
  const temperature = sliders[3].value / 100
  const invert = activePreset.value === '反色'

  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]

    // 反色
    if (invert) {
      r = 255 - r
      g = 255 - g
      b = 255 - b
    }

    // 亮度
    if (brightness !== 0) {
      const adj = brightness * 255
      r += adj
      g += adj
      b += adj
    }

    // 对比度
    if (contrast !== 0) {
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
      r = factor * (r - 128) + 128
      g = factor * (g - 128) + 128
      b = factor * (b - 128) + 128
    }

    // 饱和度
    if (saturation !== 0) {
      const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b
      r = gray + (r - gray) * (1 + saturation)
      g = gray + (g - gray) * (1 + saturation)
      b = gray + (b - gray) * (1 + saturation)
    }

    // 色温
    if (temperature !== 0) {
      r += temperature * 30
      b -= temperature * 30
    }

    data[i] = Math.max(0, Math.min(255, r))
    data[i + 1] = Math.max(0, Math.min(255, g))
    data[i + 2] = Math.max(0, Math.min(255, b))
  }

  // 应用模糊
  const blur = sliders[4].value
  if (blur > 0) {
    ctx.putImageData(imageData, 0, 0)
    ctx.filter = `blur(${blur}px)`
    ctx.drawImage(canvas, 0, 0)
    ctx.filter = 'none'
    imageData = ctx.getImageData(0, 0, w, h)
  }

  // 应用锐化
  const sharpness = sliders[5].value
  if (sharpness > 0) {
    imageData = applySharpen(imageData, sharpness / 100)
  }

  // 绘制最终结果
  ctx.putImageData(imageData, 0, 0)

  // 保存原始像素数据用于导出
  originalImageData.value = imageData
}

// 锐化卷积核
function applySharpen(imageData, amount) {
  const w = imageData.width
  const h = imageData.height
  const src = new Uint8ClampedArray(imageData.data)
  const dst = imageData.data

  // 锐化核：中心权值越大越锐利
  const a = amount * 2
  const kernel = [
    0, -a, 0,
    -a, 1 + 4 * a, -a,
    0, -a, 0
  ]

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * w + (x + kx)) * 4 + c
            sum += src[idx] * kernel[(ky + 1) * 3 + (kx + 1)]
          }
        }
        dst[(y * w + x) * 4 + c] = Math.max(0, Math.min(255, sum))
      }
    }
  }

  return imageData
}

// 对比原图
function toggleCompare() {
  isComparing.value = !isComparing.value
  if (isComparing.value) {
    // 显示原图
    const canvas = previewCanvas.value
    if (!canvas || !originalImage) return
    const ctx = canvas.getContext('2d')
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height)
  } else {
    drawPreview()
  }
}

// 导出图片
function exportImage(format) {
  const canvas = previewCanvas.value
  if (!canvas || !originalImage) return

  // 用原始尺寸重新渲染
  const exportCanvas = document.createElement('canvas')
  const w = originalImage.width
  const h = originalImage.height
  exportCanvas.width = w
  exportCanvas.height = h
  const ctx = exportCanvas.getContext('2d')

  // 绘制原图
  ctx.drawImage(originalImage, 0, 0, w, h)
  let imageData = ctx.getImageData(0, 0, w, h)

  // 应用同样的滤镜效果
  const brightness = sliders[0].value / 100
  const contrast = sliders[1].value
  const saturation = sliders[2].value / 100
  const temperature = sliders[3].value / 100
  const invert = activePreset.value === '反色'
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]

    if (invert) { r = 255 - r; g = 255 - g; b = 255 - b }
    if (brightness !== 0) { const adj = brightness * 255; r += adj; g += adj; b += adj }
    if (contrast !== 0) {
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
      r = factor * (r - 128) + 128; g = factor * (g - 128) + 128; b = factor * (b - 128) + 128
    }
    if (saturation !== 0) {
      const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b
      r = gray + (r - gray) * (1 + saturation); g = gray + (g - gray) * (1 + saturation); b = gray + (b - gray) * (1 + saturation)
    }
    if (temperature !== 0) { r += temperature * 30; b -= temperature * 30 }

    data[i] = Math.max(0, Math.min(255, r))
    data[i + 1] = Math.max(0, Math.min(255, g))
    data[i + 2] = Math.max(0, Math.min(255, b))
  }

  const blur = sliders[4].value
  if (blur > 0) {
    ctx.putImageData(imageData, 0, 0)
    ctx.filter = `blur(${blur}px)`
    ctx.drawImage(exportCanvas, 0, 0)
    ctx.filter = 'none'
    imageData = ctx.getImageData(0, 0, w, h)
  }

  const sharpness = sliders[5].value
  if (sharpness > 0) {
    imageData = applySharpen(imageData, sharpness / 100)
  }

  ctx.putImageData(imageData, 0, 0)

  // 下载
  const ext = format === 'jpeg' ? 'jpg' : 'png'
  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png'
  const quality = format === 'jpeg' ? 0.92 : undefined
  const link = document.createElement('a')
  link.download = `filtered_${Date.now()}.${ext}`
  link.href = exportCanvas.toDataURL(mime, quality)
  link.click()
}

// 格式化文件大小
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

// 重置全部
function resetAll() {
  imageSrc.value = null
  originalImage = null
  originalImageData.value = null
  fileName.value = ''
  fileSize.value = 0
  resetFilters()
}

// 窗口调整
function onResize() {
  if (imageSrc.value && originalImage) drawPreview()
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

/* 上传区域 */
.upload-area {
  border: 2px dashed #c8e6c9;
  border-radius: 16px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  background: #f1f8f1;
  transition: all 0.2s;
  margin-bottom: 1.5rem;
}

.upload-area:hover {
  border-color: #22c55e;
  background: #e8f5e9;
}

.upload-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.5rem;
}

.upload-area p {
  color: #555;
  margin-bottom: 0.3rem;
}

.upload-hint {
  color: #aaa !important;
  font-size: 0.85rem;
}

/* 编辑器布局 */
.editor-layout {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

/* 预览面板 */
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

.file-info {
  font-size: 0.85rem;
  color: #888;
}

.btn-sm {
  padding: 0.3rem 0.7rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 0.8rem;
  color: #555;
}

.btn-sm:hover {
  border-color: #22c55e;
  color: #22c55e;
}

.preview-container {
  background: #f5f5f5;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  margin-bottom: 0.8rem;
}

.preview-canvas {
  display: block;
  max-width: 100%;
  border-radius: 4px;
}

.preview-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.btn-download {
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
}

.btn-download:hover {
  opacity: 0.85;
}

.btn-download.btn-jpg {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
}

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

/* 预设滤镜 */
.filter-presets {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.4rem;
}

.preset-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.5rem 0.6rem;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 0.8rem;
  color: #555;
  transition: all 0.15s;
}

.preset-btn:hover {
  border-color: #22c55e;
  background: #f0fdf4;
}

.preset-btn.active {
  border-color: #22c55e;
  background: #dcfce7;
  color: #16a34a;
  font-weight: 600;
}

.preset-icon {
  font-size: 1rem;
}

.preset-name {
  font-size: 0.8rem;
}

/* 滑块 */
.slider-group {
  margin-bottom: 0.8rem;
}

.slider-group:last-child {
  margin-bottom: 0;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.3rem;
}

.slider-label {
  font-size: 0.8rem;
  color: #666;
}

.slider-value {
  font-size: 0.8rem;
  font-family: 'Courier New', monospace;
  color: #22c55e;
  font-weight: 600;
}

.slider-input {
  width: 100%;
  height: 6px;
  accent-color: #22c55e;
  cursor: pointer;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 0.5rem;
}

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

.btn-reset:hover {
  border-color: #ef4444;
  color: #ef4444;
}

.btn-compare {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 0.85rem;
  color: #555;
}

.btn-compare:hover {
  border-color: #3b82f6;
  color: #3b82f6;
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
  .editor-layout {
    flex-direction: column;
  }
  .controls-panel {
    flex: none;
    width: 100%;
  }
  .filter-presets {
    grid-template-columns: repeat(5, 1fr);
  }
}
</style>
