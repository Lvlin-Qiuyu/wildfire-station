<template>
  <div class="tool-page">
    <h2>📱 二维码工具</h2>

    <div class="tabs">
      <button :class="{ active: tab === 'generate' }" @click="tab = 'generate'">生成二维码</button>
      <button :class="{ active: tab === 'decode' }" @click="tab = 'decode'">解码二维码</button>
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
  padding: 0.6rem 1.5rem;
  border: none;
  background: transparent;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}

.tabs button.active {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  font-weight: 600;
}

.gen-area, .decode-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.gen-area label, .decode-area label {
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

.decode-preview-img {
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
  .gen-area, .decode-area {
    grid-template-columns: 1fr;
  }
}
</style>
