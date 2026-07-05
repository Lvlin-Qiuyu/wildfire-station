<template>
  <div class="tool-page">
    <h2>🔐 HMAC 签名生成器</h2>
    <p class="subtitle">输入消息和密钥，生成 HMAC-SHA256/SHA1/SHA512 签名，支持 Base64 和 Hex 输出</p>

    <!-- 算法选择 -->
    <div class="algo-bar">
      <label v-for="a in algorithms" :key="a.id" class="algo-chip" :class="{ active: a.enabled }">
        <input type="radio" :value="a.id" v-model="selectedAlgo" class="radio-hidden" />
        <span>{{ a.name }}</span>
      </label>
    </div>

    <!-- 输入区域 -->
    <div class="input-section">
      <div class="field-group">
        <div class="field-header">
          <label>密钥（Secret Key）</label>
          <div class="field-actions">
            <button class="btn-sm" @click="clearKey">清空</button>
          </div>
        </div>
        <textarea
          v-model="secretKey"
          placeholder="输入 HMAC 密钥..."
          rows="3"
          class="text-input"
        ></textarea>
      </div>

      <div class="field-group">
        <div class="field-header">
          <label>消息内容</label>
          <div class="field-actions">
            <button class="btn-sm" @click="clearMessage">清空</button>
          </div>
        </div>
        <textarea
          v-model="message"
          placeholder="输入要签名的消息内容..."
          rows="5"
          class="text-input"
        ></textarea>
      </div>
    </div>

    <!-- 输出格式 -->
    <div class="format-bar">
      <label class="format-label">输出格式：</label>
      <label v-for="fmt in formats" :key="fmt.id" class="format-chip" :class="{ active: outputFormat === fmt.id }">
        <input type="radio" :value="fmt.id" v-model="outputFormat" class="radio-hidden" />
        <span>{{ fmt.name }}</span>
      </label>
    </div>

    <!-- 生成按钮 -->
    <button class="btn-generate" @click="generateHmac" :disabled="computing">
      {{ computing ? '计算中...' : '🔑 生成签名' }}
    </button>

    <!-- 结果区域 -->
    <div v-if="error" class="error-msg">{{ error }}</div>
    <div v-if="result" class="result-section">
      <h3>签名结果</h3>
      <div class="result-card">
        <div class="result-header">
          <span class="algo-badge">{{ currentAlgoName }}</span>
          <span class="format-badge">{{ currentFormatName }}</span>
        </div>
        <div class="result-value">{{ result }}</div>
        <div class="result-actions">
          <button class="btn-copy" @click="copyResult">{{ copyText }}</button>
          <button class="btn-copy-all" @click="copyAllInfo">复制全部信息</button>
        </div>
      </div>
    </div>

    <!-- 说明 -->
    <div class="notice">
      <p>💡 使用浏览器原生 Web Crypto API 的 SubtleCrypto.sign() 生成 HMAC，密钥和消息仅在本地处理，不会上传到任何服务器。</p>
      <p>🔒 HMAC（Hash-based Message Authentication Code）常用于 API 签名验证、消息完整性校验等场景。</p>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'HMAC 签名生成器 - 野火小站' })

const secretKey = ref('')
const message = ref('')
const selectedAlgo = ref('sha256')
const outputFormat = ref('hex')
const result = ref('')
const error = ref('')
const computing = ref(false)
const copyText = ref('复制')

// 算法列表
const algorithms = reactive([
  { id: 'sha256', name: 'HMAC-SHA256' },
  { id: 'sha1', name: 'HMAC-SHA1' },
  { id: 'sha512', name: 'HMAC-SHA512' },
])

// 输出格式列表
const formats = reactive([
  { id: 'hex', name: 'Hex（十六进制）' },
  { id: 'base64', name: 'Base64' },
])

const currentAlgoName = computed(() => algorithms.find(a => a.id === selectedAlgo.value)?.name || '')
const currentFormatName = computed(() => formats.find(f => f.id === outputFormat.value)?.name || '')

// 清空输入
function clearKey() {
  secretKey.value = ''
  result.value = ''
  error.value = ''
}

function clearMessage() {
  message.value = ''
  result.value = ''
  error.value = ''
}

// ==================== HMAC 生成 ====================
async function generateHmac() {
  if (!secretKey.value || !message.value) {
    error.value = '请输入密钥和消息内容'
    result.value = ''
    return
  }

  error.value = ''
  computing.value = true
  result.value = ''

  try {
    // 将密钥和消息编码为 Uint8Array
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secretKey.value)
    const msgData = encoder.encode(message.value)

    // 使用 Web Crypto API 生成 HMAC
    // 算法名映射（Web Crypto API 标准名称）
    const algoNames = { sha256: 'SHA-256', sha1: 'SHA-1', sha512: 'SHA-512' }

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: algoNames[selectedAlgo.value] },
      false,
      ['sign']
    )

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData)
    const bytes = new Uint8Array(signature)

    // 按选择的格式输出
    if (outputFormat.value === 'hex') {
      result.value = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
    } else {
      // Base64
      let binary = ''
      bytes.forEach(b => { binary += String.fromCharCode(b) })
      result.value = btoa(binary)
    }
  } catch (e) {
    error.value = '签名生成失败：' + (e.message || '未知错误')
  } finally {
    computing.value = false
  }
}

// ==================== 复制功能 ====================
function copyResult() {
  if (!result.value) return
  navigator.clipboard.writeText(result.value).then(() => {
    copyText.value = '已复制 ✓'
    setTimeout(() => { copyText.value = '复制' }, 1500)
  })
}

function copyAllInfo() {
  if (!result.value) return
  const info = [
    `算法: ${currentAlgoName.value}`,
    `格式: ${currentFormatName.value}`,
    `密钥: ${secretKey.value}`,
    `消息: ${message.value}`,
    `签名: ${result.value}`,
  ].join('\n')
  navigator.clipboard.writeText(info)
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

h3 {
  font-size: 1.05rem;
  color: #333;
  margin-bottom: 0.8rem;
}

.subtitle {
  color: #888;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
}

/* 算法选择 */
.algo-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.2rem;
}

.algo-chip {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.9rem;
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
  background: linear-gradient(135deg, #22c55e, #10b981);
}

.radio-hidden {
  display: none;
}

/* 输入区域 */
.input-section {
  margin-bottom: 1.2rem;
}

.field-group {
  margin-bottom: 1rem;
}

.field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
}

.field-header label {
  font-weight: 600;
  font-size: 0.95rem;
}

.field-actions {
  display: flex;
  gap: 0.4rem;
}

.btn-sm {
  padding: 0.25rem 0.7rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 0.8rem;
  cursor: pointer;
  color: #888;
  transition: all 0.15s;
}

.btn-sm:hover {
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

/* 输出格式 */
.format-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.2rem;
}

.format-label {
  font-weight: 600;
  font-size: 0.9rem;
  color: #555;
}

.format-chip {
  padding: 0.3rem 0.7rem;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  font-size: 0.85rem;
  cursor: pointer;
  color: #666;
  transition: all 0.15s;
}

.format-chip.active {
  color: white;
  font-weight: 600;
  border-color: transparent;
  background: linear-gradient(135deg, #6366f1, #818cf8);
}

/* 生成按钮 */
.btn-generate {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
  margin-bottom: 1.2rem;
}

.btn-generate:hover {
  opacity: 0.9;
}

.btn-generate:active {
  transform: scale(0.98);
}

.btn-generate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 错误信息 */
.error-msg {
  background: #fef2f2;
  color: #dc2626;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

/* 结果区域 */
.result-section {
  margin-bottom: 1.5rem;
}

.result-card {
  background: white;
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 1rem;
}

.result-header {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.8rem;
}

.algo-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.format-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  background: linear-gradient(135deg, #6366f1, #818cf8);
  color: white;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.result-value {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  color: #333;
  word-break: break-all;
  line-height: 1.6;
  background: #f9f9f9;
  padding: 0.8rem;
  border-radius: 6px;
  user-select: all;
  margin-bottom: 0.8rem;
}

.result-actions {
  display: flex;
  gap: 0.6rem;
}

.btn-copy {
  padding: 0.4rem 1rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: opacity 0.2s;
}

.btn-copy:hover {
  opacity: 0.85;
}

.btn-copy-all {
  padding: 0.4rem 1rem;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: opacity 0.2s;
}

.btn-copy-all:hover {
  opacity: 0.85;
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
  margin-bottom: 0.3rem;
}

.notice p:last-child {
  margin-bottom: 0;
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
  .result-value {
    font-size: 0.8rem;
  }
  .result-actions {
    flex-direction: column;
  }
}
</style>
