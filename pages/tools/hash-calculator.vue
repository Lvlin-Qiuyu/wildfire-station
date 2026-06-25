<template>
  <div class="tool-page">
    <h2>🔐 哈希计算器</h2>
    <p class="subtitle">支持 MD5 / SHA-1 / SHA-256 / SHA-512，文本实时计算，文件拖拽上传</p>

    <!-- 模式切换 -->
    <div class="mode-switch">
      <button :class="{ active: mode === 'text' }" @click="switchMode('text')">📝 文本模式</button>
      <button :class="{ active: mode === 'file' }" @click="switchMode('file')">📁 文件模式</button>
    </div>

    <!-- 算法选择 -->
    <div class="algo-bar">
      <label class="check-all" @click="toggleAll">
        <input type="checkbox" :checked="allSelected" class="checkbox" />
        <span>全选 / 反选</span>
      </label>
      <label v-for="a in algorithms" :key="a.id" class="algo-chip" :class="{ active: a.enabled }">
        <input type="checkbox" v-model="a.enabled" class="checkbox" />
        <span>{{ a.name }}</span>
      </label>
    </div>

    <!-- 文本模式 -->
    <div v-if="mode === 'text'" class="text-section">
      <div class="text-header">
        <label>输入文本</label>
        <button class="btn-clear" @click="textInput = ''">清空</button>
      </div>
      <textarea
        v-model="textInput"
        placeholder="在此输入要计算哈希的文本..."
        rows="6"
        class="text-input"
      ></textarea>
      <div class="text-info">
        字符数：{{ textInput.length }} | 字节数：{{ textBytes.length }}
      </div>
    </div>

    <!-- 文件模式 -->
    <div v-if="mode === 'file'" class="file-section">
      <div
        class="drop-zone"
        :class="{ 'drag-over': isDragOver, 'has-file': !!fileInfo.name }"
        @dragover.prevent="isDragOver = true"
        @dragleave.prevent="isDragOver = false"
        @drop.prevent="handleDrop"
        @click="triggerFileInput"
      >
        <input
          type="file"
          ref="fileInputEl"
          @change="handleFileSelect"
          class="file-input-hidden"
        />
        <div v-if="!fileInfo.name" class="drop-hint">
          <span class="drop-icon">📁</span>
          <span>拖拽文件到此处，或点击选择文件</span>
        </div>
        <div v-else class="file-info-card">
          <span class="file-icon">📎</span>
          <div class="file-details">
            <span class="file-name">{{ fileInfo.name }}</span>
            <span class="file-size">{{ formatFileSize(fileInfo.size) }}</span>
          </div>
          <button class="btn-remove-file" @click.stop="clearFile">✕</button>
        </div>
      </div>
      <div v-if="fileComputing" class="progress-bar">
        <div class="progress-fill"></div>
      </div>
    </div>

    <!-- 结果区域 -->
    <div class="results-section" v-if="mode === 'text' || (mode === 'file' && hashResults.length > 0)">
      <h3>计算结果</h3>
      <div v-if="mode === 'text' && !textInput" class="no-input-tip">输入文本后，哈希值将实时显示</div>
      <div v-if="mode === 'file' && fileComputing" class="computing-tip">⏳ 正在计算文件哈希...</div>
      <div
        v-for="result in hashResults"
        :key="result.id"
        class="hash-item"
      >
        <div class="hash-header">
          <span class="hash-algo" :style="{ background: result.color }">{{ result.name }}</span>
          <button class="btn-copy" @click="copyHash(result.value)">
            {{ result.copied ? '已复制 ✓' : '复制' }}
          </button>
        </div>
        <div class="hash-value">{{ result.value }}</div>
      </div>
    </div>

    <!-- MD5 实现说明 -->
    <div class="notice">
      <p>💡 MD5 使用纯 JavaScript 实现（SparkMD5 算法），SHA-1/SHA-256/SHA-512 使用浏览器原生 Web Crypto API。</p>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '哈希计算器 - 野火小站' })

const mode = ref('text')
const textInput = ref('')
const isDragOver = ref(false)
const fileInputEl = ref(null)
const fileComputing = ref(false)
const fileInfo = reactive({ name: '', size: 0 })
const fileBuffer = ref(null)

// 算法配置
const algorithms = reactive([
  { id: 'md5', name: 'MD5', enabled: true, color: '#e74c3c' },
  { id: 'sha1', name: 'SHA-1', enabled: true, color: '#f39c12' },
  { id: 'sha256', name: 'SHA-256', enabled: true, color: '#22c55e' },
  { id: 'sha512', name: 'SHA-512', enabled: true, color: '#3498db' },
])

// 全选 / 反选
const allSelected = computed(() => algorithms.every(a => a.enabled))
function toggleAll() {
  const target = !allSelected.value
  algorithms.forEach(a => { a.enabled = target })
}

// 文本字节数
const textBytes = computed(() => {
  return new TextEncoder().encode(textInput.value)
})

// ==================== MD5 纯 JS 实现（SparkMD5 算法） ====================
function md5(str) {
  // 将字符串转为字节数组
  const bytes = new TextEncoder().encode(str)
  return md5Bytes(bytes)
}

function md5Bytes(bytes) {
  // 初始 MD5 状态
  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476

  // 预处理：追加填充位
  const msgLen = bytes.length
  const bitLen = msgLen * 8
  // 新长度 = 原长度 + 1字节(0x80) + 填充 + 8字节(长度)
  const newLen = ((msgLen + 8 + 1 + 63) & ~63)
  const msg = new Uint8Array(newLen)
  msg.set(bytes)
  msg[msgLen] = 0x80
  // 写入原始位长度（小端序，64位）
  const view = new DataView(msg.buffer)
  // 低32位
  view.setUint32(newLen - 8, bitLen >>> 0, true)
  // 高32位（超过2^32位时需要）
  if (bitLen > 0xFFFFFFFF) {
    view.setUint32(newLen - 4, Math.floor(bitLen / 0x100000000), true)
  }

  // 每轮常量 T[i] = floor(2^32 * |sin(i+1)|)
  const T = new Uint32Array(64)
  for (let i = 0; i < 64; i++) {
    T[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0
  }

  // 移位量
  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
  ]

  // 辅助函数
  const rotateLeft = (x, n) => ((x << n) | (x >>> (32 - n))) >>> 0

  // 处理每个 512-bit 块
  for (let offset = 0; offset < newLen; offset += 64) {
    const M = new Uint32Array(16)
    for (let j = 0; j < 16; j++) {
      M[j] = view.getUint32(offset + j * 4, true)
    }

    let A = a0, B = b0, C = c0, D = d0

    for (let i = 0; i < 64; i++) {
      let F, g
      if (i < 16) {
        F = (B & C) | (~B & D)
        g = i
      } else if (i < 32) {
        F = (D & B) | (~D & C)
        g = (5 * i + 1) % 16
      } else if (i < 48) {
        F = B ^ C ^ D
        g = (3 * i + 5) % 16
      } else {
        F = C ^ (B | ~D)
        g = (7 * i) % 16
      }
      F = (F + A + T[i] + M[g]) >>> 0
      A = D
      D = C
      C = B
      B = (B + rotateLeft(F, S[i])) >>> 0
    }

    a0 = (a0 + A) >>> 0
    b0 = (b0 + B) >>> 0
    c0 = (c0 + C) >>> 0
    d0 = (d0 + D) >>> 0
  }

  // 输出小端序 hex
  const hex = (n) => n.toString(16).padStart(8, '0')
  return hex(a0) + hex(b0) + hex(c0) + hex(d0)
}

// ==================== Web Crypto API（SHA-1/SHA-256/SHA-512） ====================
async function shaHash(algo, data) {
  const algoMap = {
    'sha1': 'SHA-1',
    'sha256': 'SHA-256',
    'sha512': 'SHA-512',
  }
  const buf = await crypto.subtle.digest(algoMap[algo], data)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ==================== 计算文本哈希 ====================
const hashResults = ref([])

async function computeTextHashes() {
  if (!textInput.value) {
    hashResults.value = []
    return
  }

  const enabledAlgos = algorithms.filter(a => a.enabled)
  if (enabledAlgos.length === 0) {
    hashResults.value = []
    return
  }

  const results = []
  for (const a of enabledAlgos) {
    let value = ''
    if (a.id === 'md5') {
      value = md5(textInput.value)
    } else {
      const data = new TextEncoder().encode(textInput.value)
      value = await shaHash(a.id, data)
    }
    results.push({ id: a.id, name: a.name, value, color: a.color, copied: false })
  }
  hashResults.value = results
}

// 防抖计算文本哈希
let textTimer = null
watch(textInput, () => {
  clearTimeout(textTimer)
  textTimer = setTimeout(computeTextHashes, 150)
})

// ==================== 文件处理 ====================
function switchMode(m) {
  mode.value = m
  hashResults.value = []
  clearFile()
}

function triggerFileInput() {
  fileInputEl.value?.click()
}

function handleFileSelect(e) {
  const file = e.target.files[0]
  if (file) processFile(file)
}

function handleDrop(e) {
  isDragOver.value = false
  const file = e.dataTransfer.files[0]
  if (file) processFile(file)
}

async function processFile(file) {
  fileInfo.name = file.name
  fileInfo.size = file.size
  fileComputing.value = true
  hashResults.value = []

  try {
    // 读取文件为 ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const enabledAlgos = algorithms.filter(a => a.enabled)
    const results = []

    for (const a of enabledAlgos) {
      if (a.id === 'md5') {
        const value = md5Bytes(new Uint8Array(arrayBuffer))
        results.push({ id: a.id, name: a.name, value, color: a.color, copied: false })
      } else {
        const value = await shaHash(a.id, arrayBuffer)
        results.push({ id: a.id, name: a.name, value, color: a.color, copied: false })
      }
    }
    hashResults.value = results
  } catch (err) {
    console.error('文件哈希计算失败:', err)
  } finally {
    fileComputing.value = false
  }
}

function clearFile() {
  fileInfo.name = ''
  fileInfo.size = 0
  fileBuffer.value = null
  if (fileInputEl.value) fileInputEl.value.value = ''
}

// ==================== 工具函数 ====================
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

function copyHash(value) {
  navigator.clipboard.writeText(value)
  const r = hashResults.value.find(r => r.value === value)
  if (r) {
    r.copied = true
    setTimeout(() => { r.copied = false }, 1500)
  }
}
</script>

<style scoped>
.tool-page {
  padding-top: 0.5rem;
}

h2 {
  font-size: 1.6rem;
  margin-bottom: 0.3rem;
}

.subtitle {
  color: #888;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
}

/* 模式切换 */
.mode-switch {
  display: flex;
  gap: 0;
  margin-bottom: 1rem;
  background: #e9ecef;
  border-radius: 8px;
  overflow: hidden;
}

.mode-switch button {
  flex: 1;
  padding: 0.6rem 1.5rem;
  border: none;
  background: transparent;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}

.mode-switch button.active {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  font-weight: 600;
}

/* 算法选择 */
.algo-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  align-items: center;
}

.check-all {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  color: #888;
  cursor: pointer;
  padding: 0.3rem 0.6rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  transition: all 0.15s;
}

.check-all:hover {
  border-color: #10b981;
  color: #22c55e;
}

.algo-chip {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.8rem;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  font-size: 0.85rem;
  cursor: pointer;
  color: #666;
  transition: all 0.15s;
}

.algo-chip.active {
  color: white;
  font-weight: 600;
  border-color: transparent;
}

.algo-chip input[type="checkbox"] {
  display: none;
}

/* 文本输入 */
.text-section {
  margin-bottom: 1.5rem;
}

.text-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.text-header label {
  font-weight: 600;
  font-size: 0.95rem;
}

.btn-clear {
  padding: 0.3rem 0.8rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  font-size: 0.85rem;
  color: #888;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-clear:hover {
  border-color: #e74c3c;
  color: #e74c3c;
}

.text-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: 'Courier New', monospace;
  resize: vertical;
  background: white;
  line-height: 1.5;
  transition: border-color 0.2s;
}

.text-input:focus {
  outline: none;
  border-color: #10b981;
}

.text-info {
  margin-top: 0.3rem;
  font-size: 0.8rem;
  color: #aaa;
}

/* 文件上传 */
.file-section {
  margin-bottom: 1.5rem;
}

.drop-zone {
  border: 2px dashed #ddd;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;
}

.drop-zone:hover {
  border-color: #10b981;
  background: #f8fff8;
}

.drop-zone.drag-over {
  border-color: #22c55e;
  background: #f0fdf4;
}

.drop-zone.has-file {
  padding: 1rem 1.5rem;
  text-align: left;
}

.file-input-hidden {
  display: none;
}

.drop-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #888;
  font-size: 0.95rem;
}

.drop-icon {
  font-size: 2rem;
}

.file-info-card {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.file-icon {
  font-size: 1.5rem;
}

.file-details {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.file-name {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
  word-break: break-all;
}

.file-size {
  font-size: 0.8rem;
  color: #888;
}

.btn-remove-file {
  background: none;
  border: none;
  color: #ccc;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.2rem;
}

.btn-remove-file:hover {
  color: #e74c3c;
}

.progress-bar {
  height: 3px;
  background: #e9ecef;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 0.8rem;
}

.progress-fill {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #22c55e, #10b981);
  animation: indeterminate 1.5s infinite ease-in-out;
}

@keyframes indeterminate {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(0%); }
  100% { transform: translateX(100%); }
}

/* 结果区域 */
.results-section {
  margin-bottom: 2rem;
}

.results-section h3 {
  font-size: 1.05rem;
  color: #333;
  margin-bottom: 1rem;
}

.no-input-tip,
.computing-tip {
  color: #aaa;
  font-size: 0.9rem;
}

.hash-item {
  background: white;
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 0.6rem;
}

.hash-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.hash-algo {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  color: white;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.btn-copy {
  padding: 0.3rem 0.8rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: opacity 0.2s;
}

.btn-copy:hover {
  opacity: 0.85;
}

.hash-value {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  color: #333;
  word-break: break-all;
  line-height: 1.5;
  background: #f9f9f9;
  padding: 0.6rem 0.8rem;
  border-radius: 6px;
  user-select: all;
}

/* 说明 */
.notice {
  background: #f8fff8;
  border-radius: 10px;
  padding: 1rem 1.2rem;
  margin-bottom: 1.5rem;
}

.notice p {
  font-size: 0.85rem;
  color: #666;
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

@media (max-width: 640px) {
  .algo-bar {
    gap: 0.4rem;
  }
  .hash-value {
    font-size: 0.8rem;
  }
}
</style>
