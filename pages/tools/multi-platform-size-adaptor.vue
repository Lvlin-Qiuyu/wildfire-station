<template>
  <div class="tool-page">
    <h2>📱 多平台素材尺寸快速适配器</h2>
    <p class="desc">上传一张图，一键生成所有主流社交平台的适配尺寸版本，支持批量下载</p>

    <!-- 上传区域 -->
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

    <!-- 原图信息 -->
    <div v-if="originalUrl" class="original-info">
      <img :src="originalUrl" class="original-thumb" alt="原图" />
      <div class="original-meta">
        <strong>原图信息</strong>
        <span>{{ originalWidth }} × {{ originalHeight }} px</span>
        <span>{{ formatSize(originalFileSize) }}</span>
        <span>{{ fileName }}</span>
      </div>
    </div>

    <!-- 适配模式选择 -->
    <div v-if="originalUrl" class="mode-section">
      <div class="mode-label">适配模式：</div>
      <div class="mode-btns">
        <button :class="{ active: cropMode === 'cover' }" @click="cropMode = 'cover'">裁剪填充（无留白）</button>
        <button :class="{ active: cropMode === 'contain' }" @click="cropMode = 'contain'">完整显示（可能有留白）</button>
        <button :class="{ active: cropMode === 'stretch' }" @click="cropMode = 'stretch'">拉伸填充（可能变形）</button>
      </div>
    </div>

    <!-- 平台选择 -->
    <div v-if="originalUrl" class="platform-section">
      <div class="platform-header">
        <span class="platform-label">选择平台：</span>
        <button class="select-all-btn" @click="toggleSelectAll">{{ isAllSelected ? '取消全选' : '全选' }}</button>
      </div>
      <div class="platform-grid">
        <label v-for="p in platformGroups" :key="p.key" class="platform-check" :class="{ checked: selectedPlatforms.has(p.key) }">
          <input type="checkbox" :value="p.key" v-model="selectedPlatformsArr" />
          <span class="check-icon">{{ selectedPlatforms.has(p.key) ? '✅' : '⬜' }}</span>
          <span class="platform-name">{{ p.name }}</span>
          <span class="platform-size">{{ p.width }}×{{ p.height }}</span>
        </label>
      </div>
    </div>

    <!-- 生成按钮 -->
    <div v-if="originalUrl && selectedPlatformsArr.length > 0" class="gen-section">
      <button class="btn-generate" @click="generateAll" :disabled="isGenerating">
        {{ isGenerating ? '生成中...' : '🚀 一键生成全部适配图' }}
      </button>
    </div>

    <!-- 结果展示 -->
    <div v-if="results.length > 0" class="results-section">
      <div class="results-header">
        <h3>生成结果（{{ results.length }}张）</h3>
        <button class="btn-download-all" @click="downloadAll">📦 批量下载全部</button>
      </div>
      <div class="results-grid">
        <div v-for="r in results" :key="r.key" class="result-card">
          <div class="result-preview">
            <img :src="r.url" :alt="r.name" />
          </div>
          <div class="result-info">
            <strong>{{ r.name }}</strong>
            <span>{{ r.width }}×{{ r.height }} px · {{ formatSize(r.size) }}</span>
          </div>
          <div class="result-actions">
            <button class="btn-sm" @click="copyImage(r)">📋 复制</button>
            <button class="btn-sm btn-sm-primary" @click="downloadSingle(r)">📥 下载</button>
          </div>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '多平台素材尺寸快速适配器 - 野火小站' })

// 响应式数据
const fileInput = ref(null)
const isDragging = ref(false)
const originalUrl = ref('')
const originalWidth = ref(0)
const originalHeight = ref(0)
const originalFileSize = ref(0)
const fileName = ref('')
const originalImage = ref(null) // Image 对象，缓存
const cropMode = ref('cover') // cover / contain / stretch
const isGenerating = ref(false)
const results = ref([])

// 平台预设列表（主流社交平台常见尺寸）
const platformGroups = [
  { key: 'wechat-cover', name: '微信 公众号封面', width: 900, height: 383 },
  { key: 'wechat-square', name: '微信 公众号次条封面', width: 200, height: 200 },
  { key: 'wechat-moment', name: '微信 朋友圈', width: 1080, height: 1080 },
  { key: 'wechat-miniapp', name: '微信 小程序码', width: 1280, height: 1280 },
  { key: 'weibo-og', name: '微博 正文大图', width: 1080, height: 1080 },
  { key: 'weibo-cover', name: '微博 文章封面', width: 1000, height: 562 },
  { key: 'douyin-video', name: '抖音 视频封面', width: 1080, height: 1920 },
  { key: 'douyin-live', name: '抖音 直播封面', width: 1080, height: 1920 },
  { key: 'xiaohongshu', name: '小红书 笔记封面', width: 1080, height: 1440 },
  { key: 'xiaohongshu-square', name: '小红书 方图', width: 1080, height: 1080 },
  { key: 'bilibili-cover', name: 'B站 视频封面', width: 1146, height: 717 },
  { key: 'twitter-og', name: 'X/Twitter 推文图', width: 1200, height: 675 },
  { key: 'twitter-header', name: 'X/Twitter 头图', width: 1500, height: 500 },
  { key: 'instagram-feed', name: 'Instagram 动态', width: 1080, height: 1080 },
  { key: 'instagram-story', name: 'Instagram Story', width: 1080, height: 1920 },
  { key: 'instagram-reel', name: 'Instagram Reel', width: 1080, height: 1920 },
  { key: 'facebook-og', name: 'Facebook 分享图', width: 1200, height: 630 },
  { key: 'facebook-cover', name: 'Facebook 封面', width: 820, height: 312 },
  { key: 'linkedin-post', name: 'LinkedIn 动态', width: 1200, height: 627 },
  { key: 'youtube-thumb', name: 'YouTube 缩略图', width: 1280, height: 720 },
  { key: 'youtube-banner', name: 'YouTube 频道横幅', width: 2560, height: 1440 },
]

// 平台选择（全选/取消）
const selectedPlatformsArr = ref(platformGroups.map(p => p.key))
const selectedPlatforms = computed(() => new Set(selectedPlatformsArr.value))
const isAllSelected = computed(() => selectedPlatformsArr.value.length === platformGroups.length)

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedPlatformsArr.value = []
  } else {
    selectedPlatformsArr.value = platformGroups.map(p => p.key)
  }
}

// 格式化文件大小
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

// 上传触发
function triggerUpload() {
  fileInput.value.click()
}

// 文件选择处理
function handleFile(e) {
  const file = e.target.files[0]
  if (file) loadImage(file)
}

// 拖拽上传处理
function handleDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) loadImage(file)
}

// 加载原始图片
function loadImage(file) {
  fileName.value = file.name.replace(/\.[^.]+$/, '')
  originalFileSize.value = file.size
  results.value = []

  const reader = new FileReader()
  reader.onload = (e) => {
    originalUrl.value = e.target.result
    const img = new Image()
    img.onload = () => {
      originalWidth.value = img.naturalWidth
      originalHeight.value = img.naturalHeight
      originalImage.value = img
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

// Canvas 裁剪/缩放核心算法
function adaptImage(img, targetW, targetH, mode) {
  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')

  const srcW = img.naturalWidth
  const srcH = img.naturalHeight

  // 留白时填充白色背景
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, targetW, targetH)

  if (mode === 'stretch') {
    // 拉伸：直接缩放填满
    ctx.drawImage(img, 0, 0, targetW, targetH)
  } else if (mode === 'contain') {
    // 完整显示：等比缩放居中
    const scale = Math.min(targetW / srcW, targetH / srcH)
    const w = srcW * scale
    const h = srcH * scale
    const x = (targetW - w) / 2
    const y = (targetH - h) / 2
    ctx.drawImage(img, x, y, w, h)
  } else {
    // cover：等比缩放后居中裁剪
    const scale = Math.max(targetW / srcW, targetH / srcH)
    const w = srcW * scale
    const h = srcH * scale
    const x = (targetW - w) / 2
    const y = (targetH - h) / 2
    ctx.drawImage(img, x, y, w, h)
  }

  return canvas
}

// 生成单个平台适配图
function generateOne(platform) {
  return new Promise((resolve) => {
    const canvas = adaptImage(originalImage.value, platform.width, platform.height, cropMode.value)

    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      resolve({
        key: platform.key,
        name: platform.name,
        width: platform.width,
        height: platform.height,
        size: blob.size,
        url,
        blob,
      })
    }, 'image/png')
  })
}

// 一键生成全部
async function generateAll() {
  isGenerating.value = true
  results.value = []

  // 释放之前的 URL
  const keys = selectedPlatformsArr.value
  const platforms = platformGroups.filter(p => keys.includes(p.key))

  for (const platform of platforms) {
    const result = await generateOne(platform)
    results.value.push(result)
  }

  isGenerating.value = false
}

// 下载单张
function downloadSingle(r) {
  const a = document.createElement('a')
  a.href = r.url
  a.download = `${fileName.value}-${r.name.replace(/\s+/g, '-')}.png`
  a.click()
}

// 复制图片到剪贴板
async function copyImage(r) {
  try {
    const response = await fetch(r.url)
    const blob = await response.blob()
    const item = new ClipboardItem({ 'image/png': blob })
    await navigator.clipboard.write([item])
    // 简单提示（使用内联消息）
    showToast('已复制到剪贴板')
  } catch {
    showToast('复制失败，请尝试下载后使用')
  }
}

// 批量下载全部
function downloadAll() {
  results.value.forEach((r, i) => {
    setTimeout(() => downloadSingle(r), i * 200)
  })
}

// 简易 toast 提示
function showToast(msg) {
  const existing = document.querySelector('.copy-toast')
  if (existing) existing.remove()
  const toast = document.createElement('div')
  toast.className = 'copy-toast'
  toast.textContent = msg
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 2000)
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

h3 {
  font-size: 1rem;
  margin-bottom: 0.5rem;
  color: #555;
}

.desc {
  color: #666;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
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

/* 原图信息 */
.original-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.original-thumb {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.original-meta {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.85rem;
  color: #666;
}

.original-meta strong {
  color: #2c3e50;
  font-size: 0.95rem;
}

/* 适配模式 */
.mode-section {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.2rem;
  margin-bottom: 1.5rem;
}

.mode-label,
.platform-label {
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
  display: block;
}

.mode-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.mode-btns button {
  padding: 0.5rem 1rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.mode-btns button.active {
  border-color: #22c55e;
  background: #f0fdf4;
  color: #22c55e;
  font-weight: 600;
}

/* 平台选择 */
.platform-section {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.2rem;
  margin-bottom: 1.5rem;
}

.platform-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.8rem;
}

.platform-header .platform-label {
  margin-bottom: 0;
}

.select-all-btn {
  padding: 0.3rem 0.8rem;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.select-all-btn:hover {
  border-color: #22c55e;
  color: #22c55e;
}

.platform-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.5rem;
}

.platform-check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.7rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 0.85rem;
}

.platform-check:hover {
  background: #e8f5e9;
}

.platform-check.checked {
  background: #f0fdf4;
}

.platform-check input[type="checkbox"] {
  display: none;
}

.check-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.platform-name {
  flex: 1;
  color: #2c3e50;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.platform-size {
  color: #999;
  font-size: 0.75rem;
  flex-shrink: 0;
}

/* 生成按钮 */
.gen-section {
  text-align: center;
  margin-bottom: 1.5rem;
}

.btn-generate {
  padding: 0.8rem 2.5rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1.05rem;
  font-weight: 600;
  transition: transform 0.2s, opacity 0.2s;
}

.btn-generate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-generate:active:not(:disabled) {
  transform: scale(0.95);
}

/* 结果展示 */
.results-section {
  margin-bottom: 1.5rem;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.btn-download-all {
  padding: 0.5rem 1.2rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: transform 0.2s;
}

.btn-download-all:active {
  transform: scale(0.95);
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.result-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border: 1px solid #eee;
}

.result-preview {
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  overflow: hidden;
}

.result-preview img {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
}

.result-info {
  padding: 0.7rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.result-info strong {
  font-size: 0.9rem;
  color: #2c3e50;
}

.result-info span {
  font-size: 0.78rem;
  color: #999;
}

.result-actions {
  padding: 0 1rem 0.7rem;
  display: flex;
  gap: 0.5rem;
}

.btn-sm {
  padding: 0.35rem 0.8rem;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.btn-sm:hover {
  border-color: #22c55e;
  color: #22c55e;
}

.btn-sm-primary {
  background: #f0fdf4;
  border-color: #22c55e;
  color: #22c55e;
  font-weight: 600;
}

.btn-sm-primary:hover {
  background: #22c55e;
  color: white;
}

/* 返回链接 */
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

/* 响应式 */
@media (max-width: 600px) {
  .mode-btns {
    flex-direction: column;
  }
  .platform-grid {
    grid-template-columns: 1fr;
  }
  .results-grid {
    grid-template-columns: 1fr;
  }
  .original-info {
    flex-direction: column;
    text-align: center;
  }
}
</style>

<!-- 全局 toast 样式（不被 scoped 限制） -->
<style>
.copy-toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: #2c3e50;
  color: white;
  padding: 0.6rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9rem;
  z-index: 9999;
  animation: toastIn 0.3s ease;
}

@keyframes toastIn {
  from { opacity: 0; transform: translateX(-50%) translateY(10px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
</style>
