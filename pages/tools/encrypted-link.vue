<template>
  <div class="tool-page">
    <h2>🔐 加密文本分享链接生成器</h2>
    <p class="subtitle">AES-GCM 加密文本，生成包含密文的分享链接，接收方打开自动解密，零后端纯前端</p>

    <!-- URL# 自动解密结果 -->
    <div v-if="decodedFromUrl" class="decode-result-panel">
      <div class="section-title">📥 自动解密结果</div>
      <div class="decode-content">
        <pre>{{ decodedFromUrl }}</pre>
      </div>
      <div class="decode-actions">
        <button class="btn-copy" @click="copyText(decodedFromUrl)">📋 复制文本</button>
        <button class="btn-close" @click="decodedFromUrl = ''">关闭</button>
      </div>
    </div>

    <!-- 主面板 -->
    <div class="main-panel">
      <!-- 加密模式 -->
      <div class="mode-tabs">
        <button
          class="btn-mode"
          :class="{ active: mode === 'encrypt' }"
          @click="mode = 'encrypt'"
        >🔒 加密</button>
        <button
          class="btn-mode"
          :class="{ active: mode === 'decrypt' }"
          @click="mode = 'decrypt'"
        >🔓 解密</button>
      </div>

      <!-- 密码输入 -->
      <div class="field-group">
        <label class="field-label">🔐 加密密码</label>
        <div class="password-row">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="输入用于加密/解密的密码"
            class="input-main"
          />
          <button class="btn-toggle-pw" @click="showPassword = !showPassword">
            {{ showPassword ? '🙈' : '👁️' }}
          </button>
        </div>
        <p class="field-hint">密码会通过 PBKDF2 派生为 AES-256 密钥，请妥善保管</p>
      </div>

      <!-- 文本输入 -->
      <div class="field-group">
        <label class="field-label">{{ mode === 'encrypt' ? '📝 要加密的文本' : '📝 加密内容或分享链接' }}</label>
        <textarea
          v-model="inputText"
          :placeholder="mode === 'encrypt' ? '输入需要加密的文本内容...' : '粘贴加密内容或包含 # 的分享链接...'"
          rows="6"
          class="input-textarea"
        ></textarea>
      </div>

      <!-- 操作按钮 -->
      <div class="action-row">
        <button
          class="btn-primary"
          @click="handleAction"
          :disabled="!canProcess || processing"
        >
          {{ processing ? '⏳ 处理中...' : mode === 'encrypt' ? '🔒 加密生成链接' : '🔓 解密文本' }}
        </button>
      </div>

      <!-- 结果 -->
      <div v-if="result && !processing" class="result-section">
        <!-- 加密结果：分享链接 -->
        <div v-if="mode === 'encrypt'" class="result-card">
          <div class="result-label">🔗 加密分享链接</div>
          <div class="result-content">
            <code class="result-link">{{ result.link }}</code>
          </div>
          <p class="result-hint">复制此链接发送给对方，对方打开后输入相同密码即可解密</p>
          <div class="result-actions">
            <button class="btn-copy" @click="copyText(result.link)">📋 复制链接</button>
          </div>
        </div>

        <!-- 解密结果 -->
        <div v-if="mode === 'decrypt'" class="result-card">
          <div class="result-label">📄 解密结果</div>
          <div class="result-content">
            <pre class="result-text">{{ result.plainText }}</pre>
          </div>
          <div class="result-actions">
            <button class="btn-copy" @click="copyText(result.plainText)">📋 复制文本</button>
          </div>
        </div>
      </div>

      <!-- 错误 -->
      <div v-if="errorMsg" class="error-section">
        <span class="error-icon">⚠️</span> {{ errorMsg }}
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="info-panel">
      <div class="section-title">📖 使用说明</div>
      <div class="steps">
        <div class="step">
          <span class="step-num">1</span>
          <span>输入要加密的文本内容</span>
        </div>
        <div class="step">
          <span class="step-num">2</span>
          <span>设置一个加密密码（双方需使用相同密码）</span>
        </div>
        <div class="step">
          <span class="step-num">3</span>
          <span>点击加密，生成分享链接</span>
        </div>
        <div class="step">
          <span class="step-num">4</span>
          <span>将链接和密码告诉对方（通过其他安全渠道）</span>
        </div>
        <div class="step">
          <span class="step-num">5</span>
          <span>对方打开链接，输入密码即可解密</span>
        </div>
      </div>
      <div class="security-note">
        🔒 使用 AES-256-GCM 加密，PBKDF2 密钥派生，所有运算在浏览器本地完成，数据不会上传到任何服务器。
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '加密文本分享链接生成器 - 野火小站' })

const mode = ref('encrypt')
const password = ref('')
const showPassword = ref(false)
const inputText = ref('')
const processing = ref(false)
const errorMsg = ref('')
const decodedFromUrl = ref('')
const result = ref(null)

// 判断是否可以处理
const canProcess = computed(() => {
  return password.value.length > 0 && inputText.value.trim().length > 0
})

// 页面加载时检测 URL hash 自动解密
onMounted(() => {
  checkUrlHash()
})

// 检测 URL hash
async function checkUrlHash() {
  if (typeof window === 'undefined') return
  const hash = window.location.hash
  if (!hash || hash.length <= 1) return

  const hashContent = hash.slice(1) // 去掉 #
  // 判断是否是加密链接格式（base64 数据）
  if (hashContent.length > 10) {
    // 尝试解密提示
    inputText.value = window.location.href
    mode.value = 'decrypt'
  }
}

// 处理操作
async function handleAction() {
  errorMsg.value = ''
  result.value = null

  if (mode.value === 'encrypt') {
    await encryptAndGenerateLink()
  } else {
    await decryptContent()
  }
}

// === 加密 ===
async function encryptAndGenerateLink() {
  processing.value = true
  try {
    const plainText = inputText.value.trim()
    const data = new TextEncoder().encode(plainText)

    // 生成随机 salt 和 IV
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))

    // PBKDF2 派生密钥
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password.value),
      'PBKDF2',
      false,
      ['deriveKey']
    )

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    )

    // AES-GCM 加密
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    )

    // 合并 salt + iv + ciphertext 并编码为 base64
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
    combined.set(salt, 0)
    combined.set(iv, salt.length)
    combined.set(new Uint8Array(encrypted), salt.length + iv.length)

    const base64Content = uint8ArrayToBase64(combined)

    // 构造分享链接（使用当前页面 URL + hash）
    const baseUrl = window.location.origin + window.location.pathname
    // 检测是否是 Nuxt 部署路径
    const nuxtBase = window.location.pathname.includes('/wildfire-station/') ? '/wildfire-station' : ''
    const shareUrl = `${window.location.origin}${nuxtBase}/tools/encrypted-link#${base64Content}`

    result.value = { link: shareUrl }
  } catch (err) {
    errorMsg.value = '加密失败：' + (err.message || '未知错误')
  } finally {
    processing.value = false
  }
}

// === 解密 ===
async function decryptContent() {
  processing.value = true
  try {
    let input = inputText.value.trim()

    // 如果输入的是 URL，提取 hash 部分
    let hashContent = input
    if (input.startsWith('http://') || input.startsWith('https://')) {
      try {
        const url = new URL(input)
        hashContent = url.hash.slice(1) // 去掉 #
      } catch {
        errorMsg.value = '无效的 URL 格式'
        processing.value = false
        return
      }
    }

    // 如果输入以 # 开头（手动粘贴的 hash），去掉 #
    if (hashContent.startsWith('#')) {
      hashContent = hashContent.slice(1)
    }

    // Base64 解码
    const combined = base64ToUint8Array(hashContent)

    if (combined.length < 29) { // 至少 16(salt) + 12(iv) + 1(ciphertext)
      errorMsg.value = '加密数据格式无效：数据太短'
      processing.value = false
      return
    }

    // 提取 salt、iv、ciphertext
    const salt = combined.slice(0, 16)
    const iv = combined.slice(16, 28)
    const ciphertext = combined.slice(28)

    // PBKDF2 派生密钥
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password.value),
      'PBKDF2',
      false,
      ['deriveKey']
    )

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    )

    // AES-GCM 解密
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    )

    const plainText = new TextDecoder().decode(decrypted)
    result.value = { plainText }

    // 如果是从 URL hash 触发的，直接显示
    if (window.location.hash.length > 1) {
      decodedFromUrl.value = plainText
    }
  } catch (err) {
    errorMsg.value = '解密失败：密码错误或数据损坏'
  } finally {
    processing.value = false
  }
}

// === 工具函数 ===
function uint8ArrayToBase64(bytes) {
  // URL 安全 Base64（用 - 和 _ 替换 + 和 /）
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function base64ToUint8Array(base64) {
  // 还原 URL 安全 Base64
  const standard = base64
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  // 补齐 padding
  const pad = (4 - (standard.length % 4)) % 4
  const padded = standard + '='.repeat(pad)

  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

// 复制文本
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    // 简单提示（用 btn 文字反馈）
    alert('已复制到剪贴板')
  } catch {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('已复制到剪贴板')
  }
}
</script>

<style scoped>
.tool-page {
  max-width: 720px;
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

/* 自动解密结果面板 */
.decode-result-panel {
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border: 2px solid #22c55e;
  border-radius: 12px;
  padding: 1.2rem;
  margin-bottom: 1.2rem;
}

.decode-content {
  background: #fff;
  border-radius: 8px;
  padding: 1rem;
  margin: 0.5rem 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 0.95rem;
  line-height: 1.6;
  max-height: 300px;
  overflow-y: auto;
}

.decode-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.8rem;
}

/* 主面板 */
.main-panel {
  background: #fff;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 1.2rem;
}

/* 模式切换 */
.mode-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 1.2rem;
  background: #f1f1f1;
  border-radius: 10px;
  padding: 3px;
}

.btn-mode {
  flex: 1;
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #666;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-mode.active {
  background: #fff;
  color: #22c55e;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

/* 表单字段 */
.field-group {
  margin-bottom: 1.2rem;
}

.field-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #555;
  margin-bottom: 0.4rem;
}

.field-hint {
  font-size: 0.78rem;
  color: #aaa;
  margin-top: 0.3rem;
}

.password-row {
  display: flex;
  gap: 0.5rem;
}

.input-main {
  flex: 1;
  padding: 0.7rem 1rem;
  border: 1.5px solid #e0e0e0;
  border-radius: 10px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}

.input-main:focus {
  border-color: #22c55e;
}

.btn-toggle-pw {
  padding: 0.5rem 0.8rem;
  border: 1.5px solid #e0e0e0;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  font-size: 1rem;
  flex-shrink: 0;
}

.btn-toggle-pw:hover {
  border-color: #22c55e;
}

.input-textarea {
  width: 100%;
  padding: 0.7rem 1rem;
  border: 1.5px solid #e0e0e0;
  border-radius: 10px;
  font-size: 0.95rem;
  outline: none;
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
  line-height: 1.6;
  transition: border-color 0.2s;
}

.input-textarea:focus {
  border-color: #22c55e;
}

/* 操作按钮 */
.action-row {
  margin-bottom: 1.2rem;
}

.btn-primary {
  width: 100%;
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(34, 197, 94, 0.4);
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 结果区 */
.result-section {
  margin-bottom: 0.5rem;
}

.result-card {
  background: #f8faf8;
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid #e0e0e0;
}

.result-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #22c55e;
  margin-bottom: 0.5rem;
}

.result-content {
  background: #fff;
  border-radius: 8px;
  padding: 0.8rem;
  margin-bottom: 0.5rem;
}

.result-link {
  font-size: 0.8rem;
  word-break: break-all;
  color: #555;
  display: block;
  line-height: 1.6;
}

.result-text {
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #2c3e50;
  margin: 0;
  max-height: 300px;
  overflow-y: auto;
}

.result-hint {
  font-size: 0.78rem;
  color: #888;
  margin-bottom: 0.5rem;
}

.result-actions {
  display: flex;
  gap: 0.5rem;
}

/* 按钮 */
.btn-copy {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
}

.btn-copy:hover { opacity: 0.85; }

.btn-close {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  color: #888;
  font-size: 0.85rem;
}

.btn-close:hover {
  border-color: #ef4444;
  color: #ef4444;
}

/* 错误信息 */
.error-section {
  padding: 0.8rem 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  color: #dc2626;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.error-icon {
  margin-right: 0.3rem;
}

/* 使用说明 */
.info-panel {
  background: #fff;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 1rem;
}

.section-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #555;
  margin-bottom: 0.8rem;
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.step {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 0.9rem;
  color: #555;
}

.step-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f0fdf4;
  color: #22c55e;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.security-note {
  padding: 0.8rem 1rem;
  background: #f8faf8;
  border-radius: 8px;
  font-size: 0.82rem;
  color: #666;
  line-height: 1.6;
}

/* 返回链接 */
.back-link {
  display: inline-block;
  margin-top: 1.5rem;
  color: #22c55e;
  font-weight: 500;
}

.back-link:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  h2 { font-size: 1.3rem; }
  .mode-tabs { flex-direction: row; }
  .btn-mode { font-size: 0.85rem; padding: 0.5rem 0.5rem; }
  .password-row { flex-direction: column; }
  .btn-toggle-pw { align-self: flex-end; }
  .steps { gap: 0.5rem; }
}
</style>
