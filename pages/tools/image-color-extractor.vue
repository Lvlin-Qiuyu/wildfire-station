<template>
  <div class="tool-page">
    <h2>🎨 图片取色与主色提取器</h2>
    <p class="tool-desc">上传图片自动提取主色调生成调色板，点击图片任意位置取色</p>

    <!-- 上传区 -->
    <div
      class="upload-area"
      :class="{ dragging: isDragging }"
      @click="triggerUpload"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <input ref="fileInput" type="file" accept="image/*" @change="handleFile" style="display:none" />
      <div class="upload-hint">
        <span class="upload-icon">📁</span>
        <p>点击或拖拽上传图片</p>
        <span class="upload-formats">支持 JPG / PNG / WebP / GIF</span>
      </div>
    </div>

    <div v-if="imageUrl" class="workspace">
      <!-- 图片信息 -->
      <div class="image-info">
        <span>📐 {{ imgWidth }} × {{ imgHeight }} px</span>
        <span>💾 {{ fileSizeFormatted }}</span>
        <span>📄 {{ fileName }}</span>
      </div>

      <!-- 图片预览 + 点击取色 -->
      <div class="preview-area">
        <label>点击图片任意位置取色</label>
        <div class="img-container" ref="imgContainer">
          <img
            :src="imageUrl"
            ref="previewImg"
            alt="预览图片"
            class="preview-image"
            @click="pickColor"
          />
          <!-- 取色放大镜 -->
          <div
            v-if="pickedColor"
            class="picked-indicator"
            :style="{ left: pickerPos.x + 'px', top: pickerPos.y + 'px' }"
          >
            <div class="magnifier" :style="{ backgroundColor: pickedColor.hex }"></div>
          </div>
        </div>
        <!-- 取色结果 -->
        <div v-if="pickedColor" class="picked-result">
          <div class="picked-swatch" :style="{ backgroundColor: pickedColor.hex }"></div>
          <div class="picked-values">
            <div class="picked-row" @click="copyText(pickedColor.hex)">
              <span class="label">HEX</span>
              <code>{{ pickedColor.hex }}</code>
              <span class="copy-hint">复制</span>
            </div>
            <div class="picked-row" @click="copyText(pickedColor.rgb)">
              <span class="label">RGB</span>
              <code>{{ pickedColor.rgb }}</code>
              <span class="copy-hint">复制</span>
            </div>
            <div class="picked-row" @click="copyText(pickedColor.hsl)">
              <span class="label">HSL</span>
              <code>{{ pickedColor.hsl }}</code>
              <span class="copy-hint">复制</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 主色调调色板 -->
      <div v-if="dominantColors.length" class="palette-section">
        <label>主色调提取</label>
        <div class="palette-colors">
          <div
            v-for="(color, i) in dominantColors"
            :key="i"
            class="palette-item"
            @click="copyText(color.hex)"
          >
            <div class="palette-swatch" :style="{ backgroundColor: color.hex }">
              <span class="palette-text" :style="{ color: textColorForBg(color.hex) }">{{ color.hex }}</span>
            </div>
            <span class="palette-percent">{{ color.percent }}%</span>
          </div>
        </div>
        <button class="btn-copy" @click="copyPalette">{{ copyPaletteText }}</button>
      </div>

      <!-- 隐藏 canvas -->
      <canvas ref="hiddenCanvas" style="display:none"></canvas>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '图片取色与主色提取器 - 野火小站' })

const fileInput = ref(null)
const isDragging = ref(false)
const imageUrl = ref('')
const fileName = ref('')
const fileSize = ref(0)
const imgWidth = ref(0)
const imgHeight = ref(0)
const hiddenCanvas = ref(null)
const previewImg = ref(null)
const imgContainer = ref(null)

const pickedColor = ref(null)
const pickerPos = ref({ x: 0, y: 0 })
const dominantColors = ref([])
const copyPaletteText = ref('复制调色板')

// 格式化文件大小
const fileSizeFormatted = computed(() => {
  const b = fileSize.value
  if (b < 1024) return b + ' B'
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB'
  return (b / 1024 / 1024).toFixed(2) + ' MB'
})

// 文本颜色判断（用于深浅色背景上的文字）
function textColorForBg(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#1a1a2e' : '#ffffff'
}

// 复制文本
function copyText(text) {
  navigator.clipboard.writeText(text)
}

// 触发上传
function triggerUpload() {
  fileInput.value.click()
}

// 处理文件选择
function handleFile(e) {
  const file = e.target.files[0]
  if (file) loadImage(file)
}

// 处理拖拽
function handleDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) loadImage(file)
}

// 加载图片
function loadImage(file) {
  fileName.value = file.name
  fileSize.value = file.size
  pickedColor.value = null
  dominantColors.value = []

  const reader = new FileReader()
  reader.onload = (e) => {
    imageUrl.value = e.target.result
    const img = new Image()
    img.onload = () => {
      imgWidth.value = img.naturalWidth
      imgHeight.value = img.naturalHeight
      extractColors(img)
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

// 从图片中提取颜色
function extractColors(img) {
  const canvas = hiddenCanvas.value
  // 缩放采样以提高性能
  const maxSampleSize = 128
  let w = img.naturalWidth
  let h = img.naturalHeight
  if (w > maxSampleSize || h > maxSampleSize) {
    const scale = maxSampleSize / Math.max(w, h)
    w = Math.round(w * scale)
    h = Math.round(h * scale)
  }
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, w, h)
  const imageData = ctx.getImageData(0, 0, w, h)
  const pixels = imageData.data

  // 收集所有像素
  const allPixels = []
  for (let i = 0; i < pixels.length; i += 4) {
    allPixels.push([pixels[i], pixels[i + 1], pixels[i + 2]])
  }

  // 中位切割量化算法
  dominantColors.value = medianCut(allPixels, 6)
}

// 中位切割法
function medianCut(pixels, depth) {
  if (pixels.length === 0) return []

  let buckets = [pixels]

  for (let i = 0; i < depth; i++) {
    const newBuckets = []
    for (const bucket of buckets) {
      if (bucket.length <= 1) {
        newBuckets.push(bucket)
        continue
      }
      // 找到 RGB 范围最大的通道
      const ranges = [0, 1, 2].map(ch => {
        const values = bucket.map(p => p[ch])
        return Math.max(...values) - Math.min(...values)
      })
      const maxCh = ranges.indexOf(Math.max(...ranges))

      // 按该通道排序并在中位数处切割
      bucket.sort((a, b) => a[maxCh] - b[maxCh])
      const mid = Math.floor(bucket.length / 2)
      newBuckets.push(bucket.slice(0, mid))
      newBuckets.push(bucket.slice(mid))
    }
    buckets = newBuckets
  }

  // 计算每个桶的平均颜色
  const totalPixels = pixels.length
  return buckets
    .filter(b => b.length > 0)
    .map(bucket => {
      const sum = [0, 0, 0]
      for (const p of bucket) {
        sum[0] += p[0]
        sum[1] += p[1]
        sum[2] += p[2]
      }
      const len = bucket.length
      const r = Math.round(sum[0] / len)
      const g = Math.round(sum[1] / len)
      const b = Math.round(sum[2] / len)
      const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
      return {
        hex,
        rgb: `rgb(${r}, ${g}, ${b})`,
        percent: ((len / totalPixels) * 100).toFixed(1),
      }
    })
    .sort((a, b) => parseFloat(b.percent) - parseFloat(a.percent))
}

// 点击图片取色
function pickColor(e) {
  const canvas = hiddenCanvas.value
  const ctx = canvas.getContext('2d')
  const img = previewImg.value

  // 计算点击位置相对于图片的坐标
  const rect = img.getBoundingClientRect()
  const x = Math.round((e.clientX - rect.left) / rect.width * img.naturalWidth)
  const y = Math.round((e.clientY - rect.top) / rect.height * img.naturalHeight)

  // 重绘 canvas 为原始尺寸
  const tmpCanvas = document.createElement('canvas')
  tmpCanvas.width = img.naturalWidth
  tmpCanvas.height = img.naturalHeight
  const tmpCtx = tmpCanvas.getContext('2d')
  tmpCtx.drawImage(img, 0, 0)

  const pixel = tmpCtx.getImageData(x, y, 1, 1).data
  const r = pixel[0], g = pixel[1], b = pixel[2]

  // 计算显示位置
  pickerPos.value = {
    x: e.clientX - rect.left - 8,
    y: e.clientY - rect.top - 8,
  }

  // HEX
  const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')

  // HSL
  const hslArr = rgbToHsl(r, g, b)
  const hsl = `hsl(${hslArr[0]}, ${hslArr[1]}%, ${hslArr[2]}%)`

  pickedColor.value = {
    hex,
    rgb: `rgb(${r}, ${g}, ${b})`,
    hsl,
  }
}

// RGB 转 HSL
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2
  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

// 复制调色板
function copyPalette() {
  const text = dominantColors.value.map((c, i) => `${i + 1}. ${c.hex} (${c.percent}%)`).join('\n')
  navigator.clipboard.writeText(text).then(() => {
    copyPaletteText.value = '已复制 ✓'
    setTimeout(() => { copyPaletteText.value = '复制调色板' }, 1500)
  })
}
</script>

<style scoped>
.tool-page {
  padding-top: 0.5rem;
}

h2 {
  font-size: 1.6rem;
  margin-bottom: 0.5rem;
}

.tool-desc {
  color: #666;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

/* 上传区 */
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

/* 图片信息 */
.image-info {
  display: flex;
  gap: 1.5rem;
  padding: 0.8rem 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  color: #555;
  flex-wrap: wrap;
}

/* 图片预览 */
.preview-area {
  margin-bottom: 1.5rem;
}

.preview-area label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.img-container {
  position: relative;
  display: inline-block;
  background: #f0f0f0;
  border-radius: 12px;
  overflow: hidden;
  cursor: crosshair;
}

.preview-image {
  max-width: 100%;
  max-height: 400px;
  display: block;
  object-fit: contain;
}

/* 取色指示器 */
.picked-indicator {
  position: absolute;
  width: 16px;
  height: 16px;
  pointer-events: none;
  transform: translate(-50%, -50%);
  z-index: 10;
}

.magnifier {
  width: 16px;
  height: 16px;
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2);
}

/* 取色结果 */
.picked-result {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.picked-swatch {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  border: 2px solid #e0e0e0;
  flex-shrink: 0;
}

.picked-values {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1;
}

.picked-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.picked-row:hover {
  background: #e8e8e8;
}

.picked-row .label {
  font-weight: 600;
  font-size: 0.85rem;
  min-width: 36px;
  color: #555;
}

.picked-row code {
  font-family: monospace;
  font-size: 0.9rem;
  color: #1a1a2e;
}

.picked-row .copy-hint {
  font-size: 0.75rem;
  color: #22c55e;
  margin-left: auto;
}

/* 主色调调色板 */
.palette-section {
  margin-bottom: 1.5rem;
}

.palette-section label {
  display: block;
  margin-bottom: 0.8rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.palette-colors {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.palette-item {
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.palette-item:hover {
  transform: scale(1.05);
}

.palette-swatch {
  width: 80px;
  height: 60px;
  border-radius: 10px;
  border: 2px solid #e0e0e0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 4px;
}

.palette-text {
  font-family: monospace;
  font-size: 0.7rem;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.palette-percent {
  display: block;
  margin-top: 0.3rem;
  font-size: 0.75rem;
  color: #666;
}

/* 复制按钮 */
.btn-copy {
  padding: 0.6rem 1.4rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: transform 0.2s;
}

.btn-copy:active {
  transform: scale(0.95);
}

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #22c55e;
  text-decoration: none;
  font-weight: 600;
}

.back-link:hover {
  text-decoration: underline;
}

@media (max-width: 600px) {
  .picked-result {
    flex-direction: column;
    text-align: center;
  }
  .picked-row .copy-hint {
    margin-left: 0.5rem;
  }
  .palette-swatch {
    width: 60px;
    height: 45px;
  }
}
</style>
