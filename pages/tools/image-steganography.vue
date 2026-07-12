<template>
  <div class="tool-page">
    <h2>🔐 图像隐写工具</h2>
    <p class="subtitle">使用 LSB 隐写术在图片像素中隐藏秘密文本，也可从图片中提取隐藏信息。纯前端实现，数据不会离开你的设备。</p>

    <!-- 模式切换 -->
    <div class="mode-tabs">
      <button :class="['mode-btn', { active: mode === 'encode' }]" @click="mode = 'encode'">📝 嵌入文本</button>
      <button :class="['mode-btn', { active: mode === 'decode' }]" @click="mode = 'decode'">🔍 提取文本</button>
    </div>

    <!-- 上传区域 -->
    <div class="upload-area" v-if="!imageLoaded" :class="{ dragging: isDragging }"
      @click="triggerUpload" @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false" @drop.prevent="handleDrop"
    >
      <input ref="fileInput" type="file" accept="image/png" @change="handleFile" hidden />
      <div class="upload-content">
        <span class="upload-icon">🖼️</span>
        <p>点击或拖拽上传 PNG 图片</p>
        <p class="upload-hint">⚠️ 必须使用 PNG 格式（无损），JPEG 会丢失隐写信息</p>
      </div>
    </div>

    <!-- 工作区 -->
    <div v-if="imageLoaded" class="workspace">
      <!-- 图片信息 -->
      <div class="image-info-bar">
        <span>📁 {{ fileName }}</span>
        <span>{{ formatSize(fileSize) }}</span>
        <span>{{ imgWidth }} × {{ imgHeight }}</span>
        <button class="btn-sm" @click="resetAll">重新上传</button>
      </div>

      <!-- 图片预览 -->
      <div class="preview-box">
        <img :src="previewUrl" alt="图片预览" />
      </div>

      <!-- 嵌入模式 -->
      <div v-if="mode === 'encode'" class="encode-section">
        <div class="capacity-bar">
          <span>📦 容量估算：最多可隐藏约 <strong>{{ capacityChars }}</strong> 个字符</span>
          <span class="capacity-detail">（像素数 × 3通道 ÷ 8位，减去头部信息）</span>
        </div>

        <div class="input-group">
          <label>要隐藏的文本</label>
          <textarea v-model="secretText" placeholder="在此输入要隐藏的秘密文本..." rows="4"
            :maxlength="capacityChars" @input="onTextInput"></textarea>
          <div class="char-count">
            <span>{{ secretText.length }} / {{ capacityChars }} 字符</span>
            <span v-if="secretText.length > 0" :class="secretText.length <= capacityChars ? 'ok' : 'warn'">
              {{ secretText.length <= capacityChars ? '✅ 容量充足' : '⚠️ 超出容量，请缩短文本' }}
            </span>
          </div>
        </div>

        <!-- 进度条 -->
        <div v-if="encoding" class="progress-section">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
          <span class="progress-text">{{ progressText }}</span>
        </div>

        <!-- 结果 -->
        <div v-if="encodedUrl" class="result-section">
          <div class="result-bar">
            <span class="result-badge">✅ 隐写完成</span>
            <span class="result-info">含密图片已生成，肉眼看不出差异</span>
          </div>
          <div class="action-btns">
            <button class="btn-primary" @click="downloadEncoded">📥 下载含密 PNG</button>
            <button class="btn-secondary" @click="copyEncodedInfo">📋 复制信息</button>
          </div>
        </div>

        <div class="action-bar" v-if="!encoding && !encodedUrl">
          <button class="btn-primary" :disabled="!canEncode" @click="startEncode">
            {{ canEncode ? '🔐 嵌入文本到图片' : '请输入文本' }}
          </button>
        </div>
      </div>

      <!-- 解码模式 -->
      <div v-if="mode === 'decode'" class="decode-section">
        <div class="action-bar">
          <button class="btn-primary" @click="startDecode" :disabled="decoding">
            {{ decoding ? '🔍 正在提取...' : '🔍 提取隐藏文本' }}
          </button>
        </div>

        <!-- 进度 -->
        <div v-if="decoding" class="progress-section">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
          <span class="progress-text">{{ progressText }}</span>
        </div>

        <!-- 提取结果 -->
        <div v-if="decodedText !== null" class="result-section">
          <div class="result-bar">
            <span class="result-badge">✅ 提取完成</span>
            <span class="result-info" v-if="decodedText.length > 0">发现隐藏文本（{{ decodedText.length }} 字符）</span>
            <span class="result-info" v-else>未发现隐藏文本</span>
          </div>
          <div v-if="decodedText.length > 0" class="decode-result">
            <pre>{{ decodedText }}</pre>
          </div>
          <div v-if="decodedText.length > 0" class="action-btns">
            <button class="btn-secondary" @click="copyDecodedText">📋 复制文本</button>
          </div>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '图像隐写工具 - 野火小站' })

const fileInput = ref(null)
const isDragging = ref(false)
const mode = ref('encode')
const imageLoaded = ref(false)
const previewUrl = ref('')
const fileName = ref('')
const fileSize = ref(0)
const imgWidth = ref(0)
const imgHeight = ref(0)
const capacityChars = ref(0)

const secretText = ref('')
const encoding = ref(false)
const encodedUrl = ref('')
const encodedBlob = ref(null)

const decoding = ref(false)
const decodedText = ref(null)
const progressPercent = ref(0)
const progressText = ref('')

// 图片原始数据
let originalImageData = null

const canEncode = computed(() => secretText.value.length > 0 && secretText.value.length <= capacityChars.value)

// 格式化文件大小
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

// 触发上传
function triggerUpload() {
  fileInput.value?.click()
}

// 处理文件选择
function handleFile(e) {
  const file = e.target.files?.[0]
  if (file) loadImage(file)
}

// 处理拖拽
function handleDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer.files?.[0]
  if (file && file.type === 'image/png') {
    loadImage(file)
  } else if (file) {
    alert('请使用 PNG 格式图片，JPEG 格式会丢失隐写信息')
  }
}

// 输入文本
function onTextInput() {
  encodedUrl.value = ''
  encodedBlob.value = null
}

// 加载图片
function loadImage(file) {
  if (file.type !== 'image/png') {
    alert('⚠️ 隐写术必须使用 PNG 格式！\nJPEG 是有损压缩，会破坏隐写信息。')
    return
  }

  fileName.value = file.name
  fileSize.value = file.size
  encodedUrl.value = ''
  encodedBlob.value = null
  decodedText.value = null

  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target.result
    const img = new Image()
    img.onload = () => {
      imgWidth.value = img.naturalWidth
      imgHeight.value = img.naturalHeight

      // 计算容量：每个像素3个通道各1位，减去32位长度头
      const totalBits = imgWidth.value * imgHeight.value * 3
      capacityChars.value = Math.floor((totalBits - 32) / 16)  // UTF-8 每字符最多占2字节=16位（中文字符），保守估计

      // 获取像素数据
      const canvas = document.createElement('canvas')
      canvas.width = imgWidth.value
      canvas.height = imgHeight.value
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      originalImageData = ctx.getImageData(0, 0, imgWidth.value, imgHeight.value)

      imageLoaded.value = true
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

// 文本转二进制位
function textToBits(text) {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(text)
  const bits = []
  for (const byte of bytes) {
    for (let i = 7; i >= 0; i--) {
      bits.push((byte >> i) & 1)
    }
  }
  return bits
}

// 二进制位转文本
function bitsToText(bits) {
  const bytes = []
  for (let i = 0; i + 7 < bits.length; i += 8) {
    let byte = 0
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | bits[i + j]
    }
    bytes.push(byte)
  }
  const decoder = new TextDecoder('utf-8', { fatal: false })
  return decoder.decode(new Uint8Array(bytes))
}

// 嵌入文本
async function startEncode() {
  if (!canEncode.value || !originalImageData) return

  encoding.value = true
  progressPercent.value = 0
  progressText.value = '正在准备...'

  await nextTick()

  const textBits = textToBits(secretText.value)
  const lengthBits = []

  // 写入32位长度头（文本字节数）
  const encoder = new TextEncoder()
  const byteLength = encoder.encode(secretText.value).length
  for (let i = 31; i >= 0; i--) {
    lengthBits.push((byteLength >> i) & 1)
  }

  const allBits = [...lengthBits, ...textBits]
  const data = new Uint8ClampedArray(originalImageData.data)

  const totalPixels = imgWidth.value * imgHeight.value
  const requiredPixels = Math.ceil(allBits.length / 3)

  if (requiredPixels > totalPixels) {
    alert('文本过长，超出图片容量')
    encoding.value = false
    return
  }

  // 嵌入到 RGB 通道的最低位
  let bitIdx = 0
  for (let pixel = 0; pixel < requiredPixels && bitIdx < allBits.length; pixel++) {
    const baseIdx = pixel * 4  // RGBA

    // 处理 R 通道
    if (bitIdx < allBits.length) {
      data[baseIdx] = (data[baseIdx] & 0xFE) | allBits[bitIdx]
      bitIdx++
    }
    // 处理 G 通道
    if (bitIdx < allBits.length) {
      data[baseIdx + 1] = (data[baseIdx + 1] & 0xFE) | allBits[bitIdx]
      bitIdx++
    }
    // 处理 B 通道
    if (bitIdx < allBits.length) {
      data[baseIdx + 2] = (data[baseIdx + 2] & 0xFE) | allBits[bitIdx]
      bitIdx++
    }
  }

  progressText.value = '正在生成含密图片...'

  await new Promise(r => setTimeout(r, 50))

  // 绘制到 canvas 导出
  const canvas = document.createElement('canvas')
  canvas.width = imgWidth.value
  canvas.height = imgHeight.value
  const ctx = canvas.getContext('2d')
  const newData = new ImageData(data, imgWidth.value, imgHeight.value)
  ctx.putImageData(newData, 0, 0)

  progressPercent.value = 80
  progressText.value = '正在编码...'

  await new Promise(r => setTimeout(r, 50))

  canvas.toBlob((blob) => {
    if (blob) {
      encodedBlob.value = blob
      if (encodedUrl.value) URL.revokeObjectURL(encodedUrl.value)
      encodedUrl.value = URL.createObjectURL(blob)
      progressPercent.value = 100
      progressText.value = '✅ 完成！'
      setTimeout(() => {
        encoding.value = false
      }, 500)
    } else {
      encoding.value = false
      alert('生成含密图片失败')
    }
  }, 'image/png')
}

// 提取文本
async function startDecode() {
  if (!originalImageData) return

  decoding.value = true
  decodedText.value = null
  progressPercent.value = 0
  progressText.value = '正在读取像素数据...'

  await nextTick()

  const data = originalImageData.data

  // 先读取32位长度头
  const lengthBits = []
  let bitIdx = 0
  for (let pixel = 0; pixel < 11; pixel++) {  // 32位需要11个像素（11*3=33位）
    const baseIdx = pixel * 4
    if (bitIdx < 32) lengthBits.push(data[baseIdx] & 1)
    bitIdx++
    if (bitIdx < 32) lengthBits.push(data[baseIdx + 1] & 1)
    bitIdx++
    if (bitIdx < 32) lengthBits.push(data[baseIdx + 2] & 1)
    bitIdx++
  }

  // 解析长度
  let byteLength = 0
  for (let i = 0; i < 32; i++) {
    byteLength = (byteLength << 1) | lengthBits[i]
  }

  progressText.value = `发现长度标记：${byteLength} 字节`
  progressPercent.value = 20
  await new Promise(r => setTimeout(r, 50))

  // 合理性检查
  const maxBytes = Math.floor((imgWidth.value * imgHeight.value * 3 - 32) / 8)
  if (byteLength <= 0 || byteLength > maxBytes) {
    decodedText.value = ''
    decoding.value = false
    progressPercent.value = 100
    return
  }

  // 读取文本位
  const textBits = []
  const totalBitsNeeded = 32 + byteLength * 8
  const totalPixelsNeeded = Math.ceil(totalBitsNeeded / 3)

  for (let pixel = 0; pixel < totalPixelsNeeded; pixel++) {
    const baseIdx = pixel * 4
    // 跳过前32位（长度头）
    const startBit = pixel * 3
    if (startBit >= 32 && textBits.length < byteLength * 8) {
      if (startBit >= 32) textBits.push(data[baseIdx] & 1)
      if (startBit + 1 >= 32 && textBits.length < byteLength * 8) textBits.push(data[baseIdx + 1] & 1)
      if (startBit + 2 >= 32 && textBits.length < byteLength * 8) textBits.push(data[baseIdx + 2] & 1)
    }

    // 更新进度
    if (pixel % 10000 === 0) {
      progressPercent.value = 20 + Math.floor((pixel / totalPixelsNeeded) * 70)
      progressText.value = `正在提取第 ${pixel} / ${totalPixelsNeeded} 像素...`
      await new Promise(r => setTimeout(r, 0))
    }
  }

  progressPercent.value = 90
  progressText.value = '正在解码文本...'

  // 移除多余位（前面32位是长度头）
  const cleanBits = textBits.slice(0, byteLength * 8)
  decodedText.value = bitsToText(cleanBits)

  progressPercent.value = 100
  progressText.value = '✅ 完成！'
  setTimeout(() => {
    decoding.value = false
  }, 300)
}

// 下载含密图片
function downloadEncoded() {
  if (!encodedUrl.value) return
  const a = document.createElement('a')
  a.href = encodedUrl.value
  a.download = fileName.value.replace(/\.png$/i, '') + '_steganography.png'
  a.click()
}

// 复制含密信息
function copyEncodedInfo() {
  const info = `隐写信息：
- 原图：${fileName.value}
- 尺寸：${imgWidth.value} × ${imgHeight.value}
- 隐藏文本长度：${secretText.value.length} 字符
- 字节数：${new TextEncoder().encode(secretText.value).length} 字节`
  navigator.clipboard.writeText(info).then(() => alert('✅ 已复制到剪贴板'))
}

// 复制提取文本
function copyDecodedText() {
  if (!decodedText.value) return
  navigator.clipboard.writeText(decodedText.value).then(() => alert('✅ 已复制到剪贴板'))
}

// 重置
function resetAll() {
  imageLoaded.value = false
  previewUrl.value = ''
  secretText.value = ''
  encodedUrl.value = ''
  encodedBlob.value = null
  decodedText.value = null
  originalImageData = null
  if (previewUrl.value.startsWith('blob:')) URL.revokeObjectURL(previewUrl.value)
}

onUnmounted(() => {
  if (previewUrl.value.startsWith('blob:')) URL.revokeObjectURL(previewUrl.value)
  if (encodedUrl.value?.startsWith('blob:')) URL.revokeObjectURL(encodedUrl.value)
})
</script>

<style scoped>
.tool-page {
  max-width: 800px;
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
  font-size: 0.9rem;
}

/* 模式切换 */
.mode-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 1.5rem;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid #e0e0e0;
}

.mode-btn {
  flex: 1;
  padding: 0.7rem 1rem;
  border: none;
  background: white;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s;
}

.mode-btn.active {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
}

.mode-btn:not(.active):hover {
  background: #f0fdf4;
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
  background: #f8f9fa;
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

.upload-content p {
  margin: 0.3rem 0;
  color: #555;
}

.upload-hint {
  font-size: 0.8rem;
  color: #f59e0b !important;
  font-weight: 600;
}

/* 工作区 */
.workspace {
  background: #fff;
  border-radius: 12px;
  padding: 1.2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

/* 图片信息栏 */
.image-info-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.6rem 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  font-size: 0.85rem;
  color: #666;
}

.btn-sm {
  margin-left: auto;
  padding: 0.3rem 0.8rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  font-size: 0.8rem;
  color: #555;
  cursor: pointer;
}

.btn-sm:hover {
  border-color: #22c55e;
  color: #16a34a;
}

/* 预览 */
.preview-box {
  background: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  max-height: 300px;
}

.preview-box img {
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
}

/* 容量信息 */
.capacity-bar {
  background: #f0fdf4;
  border-radius: 8px;
  padding: 0.8rem 1rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.capacity-bar strong {
  color: #22c55e;
  font-size: 1.1rem;
}

.capacity-detail {
  display: block;
  font-size: 0.75rem;
  color: #999;
  margin-top: 0.3rem;
}

/* 输入区域 */
.input-group {
  margin-bottom: 1rem;
}

.input-group label {
  display: block;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.input-group textarea {
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 0.95rem;
  resize: vertical;
  outline: none;
  font-family: inherit;
}

.input-group textarea:focus {
  border-color: #22c55e;
}

.char-count {
  display: flex;
  justify-content: space-between;
  margin-top: 0.4rem;
  font-size: 0.8rem;
  color: #999;
}

.char-count .ok { color: #22c55e; }
.char-count .warn { color: #ef4444; }

/* 进度条 */
.progress-section {
  margin: 1rem 0;
  text-align: center;
}

.progress-bar {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #10b981);
  border-radius: 3px;
  transition: width 0.2s;
}

.progress-text {
  font-size: 0.85rem;
  color: #666;
}

/* 结果区域 */
.result-section {
  background: #f0fdf4;
  border-radius: 10px;
  padding: 1rem;
  margin-top: 1rem;
}

.result-bar {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.8rem;
  flex-wrap: wrap;
}

.result-badge {
  font-weight: 700;
  color: #16a34a;
}

.result-info {
  font-size: 0.85rem;
  color: #666;
}

.decode-result {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.8rem;
}

.decode-result pre {
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 0.9rem;
  color: #333;
  margin: 0;
}

/* 按钮 */
.action-bar {
  text-align: center;
  margin: 1rem 0;
}

.action-btns {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.btn-primary {
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

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn-primary:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 0.7rem 1.5rem;
  background: white;
  color: #22c55e;
  border: 2px solid #22c55e;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f0fdf4;
}

/* 返回链接 */
.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #22c55e;
  font-weight: 500;
}

.back-link:hover { text-decoration: underline; }

@media (max-width: 640px) {
  .tool-page { padding: 0.8rem; }
  .image-info-bar { flex-direction: column; align-items: flex-start; }
  .btn-sm { margin-left: 0; }
  .action-btns { flex-direction: column; }
  .btn-primary, .btn-secondary { width: 100%; text-align: center; }
}
</style>
