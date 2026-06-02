<template>
  <div class="tool-page">
    <h2>📱 二维码工具</h2>

    <div class="tabs">
      <button :class="{ active: tab === 'generate' }" @click="tab = 'generate'">生成二维码</button>
      <button :class="{ active: tab === 'decode' }" @click="tab = 'decode'">解码二维码</button>
      <button :class="{ active: tab === 'logo' }" @click="tab = 'logo'">Logo 嵌入</button>
    </div>

    <!-- 生成二维码 -->
    <div v-if="tab === 'generate'" class="section">
      <div class="gen-area">
        <div class="input-area">
          <label>输入文本或链接</label>
          <textarea v-model="qrText" placeholder="输入要生成二维码的内容..." rows="3"></textarea>
          <div class="size-select">
            <label>尺寸：</label>
            <select v-model.number="qrSize">
              <option :value="128">128 × 128</option>
              <option :value="200">200 × 200</option>
              <option :value="256">256 × 256</option>
              <option :value="512">512 × 512</option>
            </select>
          </div>
        </div>
        <div class="preview-area">
          <label>预览</label>
          <div class="qr-preview">
            <img v-if="qrDataUrl" :src="qrDataUrl" alt="二维码" :style="{ width: Math.min(qrSize, 256) + 'px', height: Math.min(qrSize, 256) + 'px' }" />
            <p v-else class="placeholder">二维码将在这里显示</p>
          </div>
          <button v-if="qrDataUrl" class="btn-download" @click="downloadQr">下载图片</button>
        </div>
      </div>
    </div>

    <!-- 解码二维码 -->
    <div v-if="tab === 'decode'" class="section">
      <div class="decode-area">
        <label>上传二维码图片</label>
        <div class="upload-box" @click="triggerUpload" @dragover.prevent @drop.prevent="handleDrop">
          <input ref="fileInput" type="file" accept="image/*" hidden @change="handleFileChange" />
          <p v-if="!decodePreview">📷 点击或拖拽图片到这里</p>
          <img v-else :src="decodePreview" class="decode-preview-img" alt="已上传的二维码" />
        </div>
        <div v-if="decodeResult" class="decode-result">
          <label>解码结果</label>
          <textarea :value="decodeResult" readonly rows="3"></textarea>
          <button class="btn-copy" @click="copyDecode">复制</button>
        </div>
        <p v-if="decodeError" class="error">{{ decodeError }}</p>
      </div>
    </div>

    <!-- Logo 嵌入 -->
    <div v-if="tab === 'logo'" class="section">
      <div class="logo-area">
        <div class="input-area">
          <label>输入文本或链接</label>
          <textarea v-model="logoText" placeholder="输入要生成二维码的内容..." rows="3"></textarea>

          <div class="size-select">
            <label>尺寸：</label>
            <select v-model.number="logoSize">
              <option :value="256">256 × 256</option>
              <option :value="512">512 × 512</option>
              <option :value="1024">1024 × 1024</option>
            </select>
          </div>

          <div class="logo-scale-area">
            <label>Logo 大小比例：<strong>{{ Math.round(logoScale * 100) }}%</strong></label>
            <input type="range" v-model.number="logoScale" min="0.1" max="0.4" step="0.01" class="scale-slider" />
            <div class="scale-labels">
              <span>10%</span>
              <span>40%</span>
            </div>
          </div>

          <div class="logo-upload-section">
            <label>上传 Logo 图片</label>
            <div class="upload-box small" @click="triggerLogoUpload" @dragover.prevent @drop.prevent="handleLogoDrop">
              <input ref="logoInput" type="file" accept="image/*" hidden @change="handleLogoFileChange" />
              <p v-if="!logoPreview">📷 点击或拖拽 Logo 图片</p>
              <img v-else :src="logoPreview" class="logo-preview-img" alt="Logo" />
            </div>
          </div>
        </div>

        <div class="preview-area">
          <label>预览</label>
          <div class="qr-preview">
            <img v-if="logoResultUrl" :src="logoResultUrl" alt="带 Logo 的二维码" :style="{ width: Math.min(logoSize, 256) + 'px', height: Math.min(logoSize, 256) + 'px' }" />
            <p v-else class="placeholder">带 Logo 的二维码将在这里显示</p>
          </div>
          <button v-if="logoResultUrl" class="btn-download" @click="downloadLogoQr">下载图片</button>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
import QRCode from 'qrcode'
import jsQR from 'jsqr'

useHead({ title: '二维码工具 - 野火小站' })

const tab = ref('generate')
const qrText = ref('')
const qrSize = ref(256)
const qrDataUrl = ref('')

// Decode
const fileInput = ref(null)
const decodePreview = ref('')
const decodeResult = ref('')
const decodeError = ref('')

// Logo embed
const logoText = ref('')
const logoSize = ref(512)
const logoScale = ref(0.2)
const logoInput = ref(null)
const logoPreview = ref('')
const logoImgEl = ref(null)
const logoResultUrl = ref('')

// Generate QR
watch([qrText, qrSize], () => {
  if (!qrText.value.trim()) {
    qrDataUrl.value = ''
    return
  }
  QRCode.toDataURL(qrText.value, {
    width: qrSize.value,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
  }).then(url => { qrDataUrl.value = url })
})

function downloadQr() {
  if (!qrDataUrl.value) return
  const a = document.createElement('a')
  a.href = qrDataUrl.value
  a.download = 'qrcode.png'
  a.click()
}

// Decode
function triggerUpload() {
  fileInput.value?.click()
}

function handleFileChange(e) {
  const file = e.target.files?.[0]
  if (file) processFile(file)
}

function handleDrop(e) {
  const file = e.dataTransfer.files?.[0]
  if (file && file.type.startsWith('image/')) processFile(file)
}

function processFile(file) {
  decodeError.value = ''
  decodeResult.value = ''

  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target.result
    decodePreview.value = dataUrl

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height)
      if (code) {
        decodeResult.value = code.data
      } else {
        decodeError.value = '未能识别二维码，请确认图片中包含有效的二维码'
      }
    }
    img.src = dataUrl
  }
  reader.readAsDataURL(file)
}

function copyDecode() {
  navigator.clipboard.writeText(decodeResult.value)
}

// Logo embed
function triggerLogoUpload() {
  logoInput.value?.click()
}

function handleLogoFileChange(e) {
  const file = e.target.files?.[0]
  if (file) loadLogoImage(file)
}

function handleLogoDrop(e) {
  const file = e.dataTransfer.files?.[0]
  if (file && file.type.startsWith('image/')) loadLogoImage(file)
}

function loadLogoImage(file) {
  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target.result
    logoPreview.value = dataUrl
    const img = new Image()
    img.onload = () => {
      logoImgEl.value = img
      generateLogoQr()
    }
    img.src = dataUrl
  }
  reader.readAsDataURL(file)
}

watch([logoText, logoSize, logoScale], () => {
  if (logoText.value.trim() && logoImgEl.value) {
    generateLogoQr()
  } else {
    logoResultUrl.value = ''
  }
})

function generateLogoQr() {
  if (!logoText.value.trim() || !logoImgEl.value) return

  const size = logoSize.value
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  QRCode.toCanvas(canvas, logoText.value, {
    width: size,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  }).then(() => {
    // Draw logo in center
    const logoImg = logoImgEl.value
    const logoPixelSize = size * logoScale.value
    const x = (size - logoPixelSize) / 2
    const y = (size - logoPixelSize) / 2
    const padding = logoPixelSize * 0.1
    const radius = padding * 0.5

    // White rounded background for logo
    ctx.fillStyle = '#ffffff'
    roundRect(ctx, x - padding, y - padding, logoPixelSize + padding * 2, logoPixelSize + padding * 2, radius)
    ctx.fill()

    // Draw logo image with rounded corners
    ctx.save()
    roundRect(ctx, x, y, logoPixelSize, logoPixelSize, radius * 0.6)
    ctx.clip()
    ctx.drawImage(logoImg, x, y, logoPixelSize, logoPixelSize)
    ctx.restore()

    logoResultUrl.value = canvas.toDataURL('image/png')
  }).catch(() => {
    logoResultUrl.value = ''
  })
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function downloadLogoQr() {
  if (!logoResultUrl.value) return
  const a = document.createElement('a')
  a.href = logoResultUrl.value
  a.download = 'qrcode-logo.png'
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

.tabs {
  display: flex;
  gap: 0;
  margin-bottom: 1.5rem;
  background: #e9ecef;
  border-radius: 8px;
  overflow: hidden;
}

.tabs button {
  flex: 1;
  padding: 0.6rem 1rem;
  border: none;
  background: transparent;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}

.tabs button.active {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  font-weight: 600;
}

.gen-area, .decode-area, .logo-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.gen-area label, .decode-area label, .logo-area label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #555;
}

textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
  background: white;
  line-height: 1.5;
}

textarea:focus {
  outline: none;
  border-color: #10b981;
}

textarea[readonly] {
  background: #f9f9f9;
}

.size-select {
  margin-top: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
}

.size-select select {
  padding: 0.3rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
}

.logo-scale-area {
  margin-top: 1rem;
}

.logo-scale-area label {
  margin-bottom: 0.4rem !important;
  font-size: 0.9rem;
}

.scale-slider {
  width: 100%;
  accent-color: #10b981;
  margin-top: 0.25rem;
}

.scale-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #aaa;
  margin-top: 0.15rem;
}

.logo-upload-section {
  margin-top: 1rem;
}

.upload-box {
  border: 2px dashed #ccc;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s;
  background: #fafafa;
}

.upload-box:hover {
  border-color: #10b981;
}

.upload-box.small {
  padding: 1rem;
}

.upload-box.small p {
  font-size: 0.9rem;
}

.qr-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px dashed #ddd;
}

.placeholder {
  color: #bbb;
}

.btn-download, .btn-copy {
  margin-top: 0.75rem;
  padding: 0.5rem 1.2rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: opacity 0.2s;
}

.btn-download:hover, .btn-copy:hover {
  opacity: 0.85;
}

.decode-preview-img, .logo-preview-img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
}

.decode-result {
  margin-top: 1.5rem;
}

.error {
  margin-top: 1rem;
  color: #e74c3c;
  font-size: 0.9rem;
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
  .gen-area, .decode-area, .logo-area {
    grid-template-columns: 1fr;
  }
  .tabs button {
    padding: 0.5rem 0.5rem;
    font-size: 0.85rem;
  }
}
</style>
