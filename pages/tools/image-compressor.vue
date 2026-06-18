<template>
  <div class="tool-page">
    <h2>🖼️ 纯前端图片压缩</h2>

    <div class="upload-area"
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

    <div v-if="originalUrl" class="workspace">
      <!-- 设置 -->
      <div class="settings">
        <div class="setting-row">
          <label>输出格式</label>
          <div class="format-btns">
            <button v-for="f in formats" :key="f" :class="{ active: format === f }" @click="format = f; compress()">{{ f }}</button>
          </div>
        </div>
        <div class="setting-row">
          <label>质量: <strong>{{ quality }}%</strong></label>
          <input type="range" v-model.number="quality" min="1" max="100" @input="compress" />
        </div>
        <div class="setting-row">
          <label>最大宽度 (px, 0=不限制)</label>
          <input type="number" v-model.number="maxWidth" min="0" max="10000" @input="compress" />
        </div>
      </div>

      <!-- 对比 -->
      <div class="compare">
        <div class="compare-side">
          <h3>原图</h3>
          <div class="img-box">
            <img :src="originalUrl" alt="原图" />
          </div>
          <div class="file-info">
            <span>{{ originalSizeFormatted }}</span>
            <span>{{ originalWidth }} × {{ originalHeight }}</span>
          </div>
        </div>
        <div class="compare-side">
          <h3>压缩后</h3>
          <div class="img-box">
            <img v-if="compressedUrl" :src="compressedUrl" alt="压缩后" />
            <div v-else class="processing">处理中...</div>
          </div>
          <div v-if="compressedSize !== null" class="file-info">
            <span>{{ compressedSizeFormatted }}</span>
            <span class="ratio" :class="{ good: ratio < 70 }">{{ ratio }}%</span>
            <span>节省 {{ (100 - ratio).toFixed(1) }}%</span>
          </div>
        </div>
      </div>

      <!-- 下载 -->
      <div v-if="compressedUrl" class="actions">
        <button class="btn-download" @click="download">📥 下载压缩图片</button>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '纯前端图片压缩 - 野火小站' })

const fileInput = ref(null)
const isDragging = ref(false)
const originalUrl = ref('')
const compressedUrl = ref('')
const originalSize = ref(0)
const compressedSize = ref(null)
const originalWidth = ref(0)
const originalHeight = ref(0)
const quality = ref(80)
const format = ref('image/jpeg')
const maxWidth = ref(0)
const fileName = ref('')

const formats = ['image/jpeg', 'image/png', 'image/webp']

const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

const originalSizeFormatted = computed(() => formatSize(originalSize.value))
const compressedSizeFormatted = computed(() => compressedSize.value !== null ? formatSize(compressedSize.value) : '')

const ratio = computed(() => {
  if (!compressedSize.value || !originalSize.value) return 0
  return (compressedSize.value / originalSize.value * 100)
})

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
  fileName.value = file.name.replace(/\.[^.]+$/, '')
  originalSize.value = file.size
  compressedSize.value = null
  compressedUrl.value = ''

  const reader = new FileReader()
  reader.onload = (e) => {
    originalUrl.value = e.target.result
    const img = new Image()
    img.onload = () => {
      originalWidth.value = img.naturalWidth
      originalHeight.value = img.naturalHeight
      compress()
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

function compress() {
  if (!originalUrl.value) return
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    let w = img.naturalWidth
    let h = img.naturalHeight

    if (maxWidth.value > 0 && w > maxWidth.value) {
      const scale = maxWidth.value / w
      w = maxWidth.value
      h = Math.round(h * scale)
    }

    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, w, h)

    const mime = format.value
    const q = mime === 'image/png' ? undefined : quality.value / 100
    canvas.toBlob((blob) => {
      if (blob) {
        compressedSize.value = blob.size
        const url = URL.createObjectURL(blob)
        if (compressedUrl.value) URL.revokeObjectURL(compressedUrl.value)
        compressedUrl.value = url
      }
    }, mime, q)
  }
  img.src = originalUrl.value
}

function getExt() {
  const map = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
  return map[format.value] || 'jpg'
}

function download() {
  if (!compressedUrl.value) return
  const a = document.createElement('a')
  a.href = compressedUrl.value
  a.download = `${fileName.value || 'compressed'}.${getExt()}`
  a.click()
}
</script>

<style scoped>
.tool-page {
  padding-top: 0.5rem;
}

h2 {
  font-size: 1.6rem;
  margin-bottom: 1.5rem;
}

h3 {
  font-size: 1rem;
  margin-bottom: 0.5rem;
  color: #555;
}

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

.settings {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.2rem;
  margin-bottom: 1.5rem;
}

.setting-row {
  margin-bottom: 1rem;
}

.setting-row:last-child {
  margin-bottom: 0;
}

.setting-row label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.setting-row input[type="range"] {
  width: 100%;
  accent-color: #22c55e;
}

.setting-row input[type="number"] {
  width: 150px;
  padding: 0.5rem 0.7rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  outline: none;
  font-size: 0.95rem;
}

.setting-row input[type="number"]:focus {
  border-color: #22c55e;
}

.format-btns {
  display: flex;
  gap: 0.5rem;
}

.format-btns button {
  padding: 0.4rem 1rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.format-btns button.active {
  border-color: #22c55e;
  background: #f0fdf4;
  color: #22c55e;
  font-weight: 600;
}

.compare {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.img-box {
  background: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.img-box img {
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
}

.processing {
  color: #999;
  font-size: 0.9rem;
}

.file-info {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #666;
}

.ratio {
  font-weight: 700;
  color: #ef4444;
}

.ratio.good {
  color: #22c55e;
}

.actions {
  text-align: center;
  margin-bottom: 1rem;
}

.btn-download {
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
  .compare {
    grid-template-columns: 1fr;
  }
}
</style>
