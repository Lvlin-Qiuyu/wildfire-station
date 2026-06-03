<template>
  <div class="tool-page">
    <h2>🖼️ 图片格式转换</h2>

    <!-- 上传区域 -->
    <div
      class="upload-zone"
      :class="{ dragging: isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        multiple
        style="display: none"
        @change="handleFileSelect"
      />
      <div class="upload-icon">📁</div>
      <p>拖拽图片到此处，或点击上传</p>
      <span class="upload-hint">支持 PNG / JPG / WebP / GIF / BMP 等格式，可批量上传</span>
    </div>

    <!-- 设置面板 -->
    <div v-if="images.length" class="settings">
      <div class="setting-row">
        <label>目标格式</label>
        <div class="format-switch">
          <button
            v-for="fmt in formats"
            :key="fmt"
            :class="{ active: targetFormat === fmt }"
            @click="targetFormat = fmt"
          >{{ fmt }}</button>
        </div>
      </div>

      <div v-if="showQuality" class="setting-row">
        <label>质量 <strong>{{ quality }}</strong></label>
        <input
          type="range"
          v-model.number="quality"
          min="0.1"
          max="1"
          step="0.05"
          class="slider"
        />
        <span class="quality-hint">值越大质量越高，文件越大</span>
      </div>

      <div v-if="targetFormat === 'JPG'" class="setting-row">
        <label>背景色（透明区域填充）</label>
        <div class="color-row">
          <input type="color" v-model="bgColor" class="color-picker" />
          <span class="color-value">{{ bgColor }}</span>
        </div>
      </div>
    </div>

    <!-- 批量操作 -->
    <div v-if="images.length" class="batch-actions">
      <button class="btn-primary" @click="convertAll" :disabled="isConverting">
        {{ isConverting ? '转换中...' : '🔄 转换全部' }}
      </button>
      <button v-if="convertedImages.length === images.length" class="btn-primary btn-download" @click="downloadAll">
        ⬇️ 批量下载
      </button>
    </div>

    <!-- 图片列表 -->
    <div v-if="images.length" class="image-list">
      <div v-for="(img, index) in images" :key="index" class="image-card">
        <div class="image-previews">
          <div class="preview-box">
            <span class="preview-label">原始</span>
            <img :src="img.originalUrl" class="preview-img" />
            <span class="size-tag">{{ img.originalSize }}</span>
          </div>
          <div class="preview-arrow" v-if="img.convertedUrl">→</div>
          <div class="preview-box converted" v-if="img.convertedUrl">
            <span class="preview-label">转换后</span>
            <img :src="img.convertedUrl" class="preview-img" />
            <span class="size-tag">{{ img.convertedSize }}</span>
            <span v-if="img.sizeDiff !== null" class="diff-tag" :class="{ smaller: img.sizeDiff < 0 }">
              {{ img.sizeDiff > 0 ? '+' : '' }}{{ img.sizeDiff }}%
            </span>
          </div>
          <div class="preview-box empty" v-else>
            <span class="preview-label">转换后</span>
            <div class="placeholder">等待转换</div>
          </div>
        </div>
        <div class="image-info">
          <span class="image-name">{{ img.name }}</span>
          <div class="image-actions">
            <button class="btn-sm" @click="convertOne(index)" :disabled="isConverting">转换</button>
            <button v-if="img.convertedUrl" class="btn-sm btn-green" @click="downloadOne(index)">下载</button>
            <button class="btn-sm btn-danger" @click="removeImage(index)">移除</button>
          </div>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '图片格式转换 - 野火小站' })

const fileInput = ref(null)
const isDragging = ref(false)
const isConverting = ref(false)
const targetFormat = ref('PNG')
const quality = ref(0.92)
const bgColor = ref('#ffffff')
const formats = ['PNG', 'JPG', 'WebP']

const images = ref([])

const showQuality = computed(() => targetFormat.value === 'JPG' || targetFormat.value === 'WebP')

const convertedImages = computed(() => images.value.filter(i => i.convertedUrl))

function triggerFileInput() {
  fileInput.value.click()
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function handleFileSelect(e) {
  addFiles(Array.from(e.target.files))
  e.target.value = ''
}

function handleDrop(e) {
  isDragging.value = false
  addFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')))
}

function addFiles(files) {
  for (const file of files) {
    const url = URL.createObjectURL(file)
    images.value.push({
      name: file.name,
      file,
      originalUrl: url,
      originalSize: formatSize(file.size),
      convertedUrl: null,
      convertedBlob: null,
      convertedSize: '',
      sizeDiff: null
    })
  }
}

function removeImage(index) {
  const img = images.value[index]
  if (img.originalUrl) URL.revokeObjectURL(img.originalUrl)
  if (img.convertedUrl) URL.revokeObjectURL(img.convertedUrl)
  images.value.splice(index, 1)
}

async function convertOne(index) {
  isConverting.value = true
  try {
    const img = images.value[index]
    const bitmap = await createImageBitmap(img.file)
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext('2d')

    // JPG 不支持透明，填充背景色
    if (targetFormat.value === 'JPG') {
      ctx.fillStyle = bgColor.value
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    ctx.drawImage(bitmap, 0, 0)

    const mimeMap = { PNG: 'image/png', JPG: 'image/jpeg', WebP: 'image/webp' }
    const mimeType = mimeMap[targetFormat.value]
    const q = showQuality.value ? quality.value : undefined

    const blob = await new Promise(resolve => canvas.toBlob(resolve, mimeType, q))

    if (img.convertedUrl) URL.revokeObjectURL(img.convertedUrl)
    img.convertedUrl = URL.createObjectURL(blob)
    img.convertedBlob = blob
    img.convertedSize = formatSize(blob.size)
    img.sizeDiff = Math.round(((blob.size - img.file.size) / img.file.size) * 100)
  } catch (err) {
    console.error('转换失败:', err)
  }
  isConverting.value = false
}

async function convertAll() {
  for (let i = 0; i < images.value.length; i++) {
    await convertOne(i)
  }
}

function downloadOne(index) {
  const img = images.value[index]
  if (!img.convertedBlob) return
  const extMap = { PNG: '.png', JPG: '.jpg', WebP: '.webp' }
  const ext = extMap[targetFormat.value]
  const baseName = img.name.replace(/\.[^.]+$/, '')
  const a = document.createElement('a')
  a.href = img.convertedUrl
  a.download = baseName + ext
  a.click()
}

function downloadAll() {
  for (let i = 0; i < images.value.length; i++) {
    if (images.value[i].convertedBlob) {
      setTimeout(() => downloadOne(i), i * 300)
    }
  }
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

.upload-zone {
  border: 2px dashed #ccc;
  border-radius: 12px;
  padding: 2.5rem 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;
}

.upload-zone:hover,
.upload-zone.dragging {
  border-color: #10b981;
  background: #f0fdf4;
}

.upload-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.upload-zone p {
  color: #555;
  font-size: 1.05rem;
}

.upload-hint {
  display: block;
  margin-top: 0.3rem;
  font-size: 0.85rem;
  color: #999;
}

.settings {
  margin-top: 1.5rem;
  padding: 1.2rem;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.setting-row label {
  font-weight: 600;
  min-width: 80px;
  font-size: 0.95rem;
  color: #555;
}

.format-switch {
  display: flex;
  gap: 0;
  background: #e9ecef;
  border-radius: 6px;
  overflow: hidden;
}

.format-switch button {
  padding: 0.4rem 1.2rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s;
  color: #666;
}

.format-switch button.active {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  font-weight: 600;
}

.slider {
  flex: 1;
  min-width: 120px;
  accent-color: #10b981;
}

.quality-hint {
  font-size: 0.8rem;
  color: #999;
}

.color-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.color-picker {
  width: 36px;
  height: 36px;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  padding: 2px;
}

.color-value {
  font-family: monospace;
  font-size: 0.9rem;
  color: #666;
}

.batch-actions {
  display: flex;
  gap: 0.8rem;
  margin-top: 1.2rem;
  flex-wrap: wrap;
}

.btn-primary {
  padding: 0.55rem 1.5rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: opacity 0.2s;
}

.btn-primary:hover {
  opacity: 0.85;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-download {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.image-list {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.image-card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 1rem;
}

.image-previews {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.preview-box {
  text-align: center;
  min-width: 160px;
  max-width: 280px;
  flex: 1;
  position: relative;
}

.preview-label {
  display: block;
  font-size: 0.8rem;
  color: #999;
  margin-bottom: 0.3rem;
}

.preview-img {
  max-width: 100%;
  max-height: 150px;
  object-fit: contain;
  border-radius: 6px;
  border: 1px solid #eee;
}

.placeholder {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 6px;
  color: #ccc;
  font-size: 0.9rem;
}

.size-tag {
  display: inline-block;
  margin-top: 0.3rem;
  font-size: 0.8rem;
  color: #888;
}

.diff-tag {
  display: inline-block;
  margin-left: 0.3rem;
  font-size: 0.8rem;
  color: #ef4444;
  font-weight: 600;
}

.diff-tag.smaller {
  color: #22c55e;
}

.preview-arrow {
  font-size: 1.5rem;
  color: #ccc;
}

.image-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.8rem;
  padding-top: 0.8rem;
  border-top: 1px solid #f0f0f0;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.image-name {
  font-size: 0.9rem;
  color: #555;
  word-break: break-all;
}

.image-actions {
  display: flex;
  gap: 0.4rem;
}

.btn-sm {
  padding: 0.35rem 0.8rem;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.82rem;
  transition: all 0.2s;
}

.btn-sm:hover {
  border-color: #10b981;
  color: #10b981;
}

.btn-sm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-green {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
}

.btn-green:hover {
  opacity: 0.85;
}

.btn-danger {
  color: #ef4444;
  border-color: #fecaca;
}

.btn-danger:hover {
  background: #fef2f2;
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

@media (max-width: 640px) {
  .image-previews {
    flex-direction: column;
  }
  .preview-arrow {
    transform: rotate(90deg);
  }
  .setting-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
