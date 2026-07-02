<template>
  <div class="tool-page">
    <h2>🔐 TOTP 验证码生成器</h2>
    <p class="subtitle">纯前端实现 RFC 6238，输入 Base32 密钥生成一次性验证码，30秒倒计时动画</p>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>

    <!-- 密钥输入区域 -->
    <div class="key-section">
      <div class="key-header">
        <label>TOTP 密钥（Base32）</label>
        <button class="btn-sm" @click="toggleHelp">❓ 使用说明</button>
      </div>
      <div class="key-input-row">
        <input
          v-model="secretKey"
          class="key-input"
          placeholder="例如：JBSWY3DPEHPK3PXP"
          spellcheck="false"
          @input="onKeyChange"
        />
        <button class="btn-primary btn-generate" @click="generateCode" :disabled="!secretKey.trim()">
          🔄 生成
        </button>
      </div>

      <!-- 使用说明 -->
      <div v-if="showHelp" class="help-box">
        <h4>📖 如何获取密钥？</h4>
        <ul>
          <li><b>Google Authenticator / Microsoft Authenticator</b>：添加账户时选择"手动输入密钥"，复制 Base32 字符串</li>
          <li><b>GitHub / AWS / 各大平台</b>：开启两步验证时，选择"无法扫描二维码"或"使用手动输入"，显示的密钥即为 Base32 格式</li>
          <li><b>常见格式</b>：大写字母 A-Z 和数字 2-7，长度通常为 16 或 32 个字符</li>
        </ul>
      </div>
    </div>

    <!-- 设置选项 -->
    <div class="settings-section">
      <div class="setting-row">
        <div class="setting-group">
          <label>验证码位数</label>
          <div class="btn-group">
            <button :class="['btn-toggle', { active: digits === 6 }]" @click="digits = 6">6 位</button>
            <button :class="['btn-toggle', { active: digits === 8 }]" @click="digits = 8">8 位</button>
          </div>
        </div>
        <div class="setting-group">
          <label>哈希算法</label>
          <div class="btn-group">
            <button :class="['btn-toggle', { active: algorithm === 'SHA-1' }]" @click="algorithm = 'SHA-1'">SHA-1</button>
            <button :class="['btn-toggle', { active: algorithm === 'SHA-256' }]" @click="algorithm = 'SHA-256'">SHA-256</button>
            <button :class="['btn-toggle', { active: algorithm === 'SHA-512' }]" @click="algorithm = 'SHA-512'">SHA-512</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 验证码展示区域 -->
    <div v-if="currentCode" class="code-display">
      <!-- 倒计时圆环 -->
      <div class="countdown-ring">
        <svg viewBox="0 0 120 120" class="ring-svg">
          <!-- 背景环 -->
          <circle cx="60" cy="60" r="52" fill="none" stroke="#f0f0f0" stroke-width="6" />
          <!-- 进度环 -->
          <circle
            cx="60" cy="60" r="52"
            fill="none"
            :stroke="remainingPercent > 10 ? '#22c55e' : '#ef4444'"
            stroke-width="6"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="circumference * (1 - remainingPercent / 100)"
            transform="rotate(-90 60 60)"
            class="progress-circle"
          />
        </svg>
        <div class="ring-content">
          <div class="remaining-seconds" :style="{ color: remainingPercent > 10 ? '#2c3e50' : '#ef4444' }">
            {{ remainingSeconds }}s
          </div>
        </div>
      </div>

      <!-- 验证码数字 -->
      <div class="code-number" :class="{ warning: remainingSeconds <= 5 }">
        {{ formattedCode }}
      </div>

      <!-- 操作按钮 -->
      <div class="code-actions">
        <button class="btn-copy" @click="copyCode">
          📋 {{ copyLabel }}
        </button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!currentCode && !hasError" class="empty-state">
      <p>🔑 输入密钥后点击生成，验证码将自动每30秒更新</p>
    </div>

    <!-- 错误提示 -->
    <div v-if="hasError" class="error-state">
      <p>⚠️ {{ errorMessage }}</p>
    </div>

    <!-- 历史记录 -->
    <div v-if="codeHistory.length > 0" class="history-section">
      <div class="history-header">
        <span>📝 最近生成记录</span>
        <button class="btn-sm" @click="clearHistory">清空</button>
      </div>
      <div class="history-list">
        <div v-for="(item, idx) in codeHistory" :key="idx" class="history-item">
          <span class="history-code">{{ item.code }}</span>
          <span class="history-time">{{ item.time }}</span>
          <span class="history-algo">{{ item.algo }}</span>
        </div>
      </div>
    </div>

    <!-- 安全提示 -->
    <div class="security-note">
      <p>🛡️ 所有计算均在浏览器本地完成，密钥不会发送到任何服务器。页面关闭后数据自动清除。</p>
    </div>
  </div>
</template>

<script setup>
useHead({ title: 'TOTP 验证码生成器 - 野火小站' })

// ===== 配置 =====
const secretKey = ref('')
const digits = ref(6)
const algorithm = ref('SHA-1')
const showHelp = ref(false)

// ===== 验证码状态 =====
const currentCode = ref('')
const remainingSeconds = ref(30)
const hasError = ref(false)
const errorMessage = ref('')
const copyLabel = ref('复制验证码')

// ===== 历史记录 =====
const codeHistory = ref([])

// ===== 定时器 =====
let intervalId = null

// ===== 计算属性 =====
const remainingPercent = computed(() => (remainingSeconds.value / 30) * 100)

const circumference = computed(() => 2 * Math.PI * 52)

const formattedCode = computed(() => {
  const code = currentCode.value
  if (!code) return ''
  // 每4位一组加空格（8位时每4位），6位时中间加空格
  if (digits.value === 8) {
    return code.slice(0, 4) + ' ' + code.slice(4)
  }
  return code.slice(0, 3) + ' ' + code.slice(3)
})

// ===== Base32 解码 =====
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32Decode(str) {
  // 移除空格和连字符，转大写
  const cleaned = str.replace(/[\s-]/g, '').toUpperCase()
  let bits = ''
  for (const char of cleaned) {
    const idx = BASE32_CHARS.indexOf(char)
    if (idx === -1) {
      throw new Error(`无效的 Base32 字符：${char}`)
    }
    bits += idx.toString(2).padStart(5, '0')
  }
  // 将比特字符串转为字节数组
  const bytes = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2))
  }
  return new Uint8Array(bytes)
}

// ===== TOTP 生成（RFC 6238） =====
async function generateTOTP(secret, timeStep, codeDigits, algo) {
  const key = base32Decode(secret)
  // 计算时间步
  const epoch = Math.floor(Date.now() / 1000)
  const counter = Math.floor(epoch / timeStep)
  // 将计数器转为8字节大端
  const counterBytes = new Uint8Array(8)
  let tmp = counter
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = tmp & 0xff
    tmp = Math.floor(tmp / 256)
  }
  // HMAC 签名
  const cryptoKey = await crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: algo },
    false, ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, counterBytes)
  const hmac = new Uint8Array(signature)
  // 动态截断
  const offset = hmac[hmac.length - 1] & 0x0f
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  const otp = binary % Math.pow(10, codeDigits)
  return otp.toString().padStart(codeDigits, '0')
}

// ===== 生成并启动定时器 =====
async function generateCode() {
  hasError.value = false
  errorMessage.value = ''
  const key = secretKey.value.replace(/[\s-]/g, '').toUpperCase()
  if (!key) return

  try {
    currentCode.value = await generateTOTP(key, 30, digits.value, algorithm.value)
    startTimer()
    addHistory(currentCode.value, algorithm.value)
  } catch (e) {
    hasError.value = true
    errorMessage.value = e.message || '生成失败，请检查密钥格式'
  }
}

// ===== 30秒倒计时 =====
function startTimer() {
  if (intervalId) clearInterval(intervalId)
  // 计算当前秒数偏移
  const now = Math.floor(Date.now() / 1000)
  remainingSeconds.value = 30 - (now % 30)

  intervalId = setInterval(async () => {
    const now2 = Math.floor(Date.now() / 1000)
    const newRemaining = 30 - (now2 % 30)

    // 当新周期开始时自动刷新验证码
    if (newRemaining >= remainingSeconds.value) {
      try {
        const key = secretKey.value.replace(/[\s-]/g, '').toUpperCase()
        if (key) {
          currentCode.value = await generateTOTP(key, 30, digits.value, algorithm.value)
          addHistory(currentCode.value, algorithm.value)
        }
      } catch {
        // 静默处理
      }
    }

    remainingSeconds.value = newRemaining
  }, 500) // 每500ms更新一次保证精确
}

// ===== 复制 =====
function copyCode() {
  const code = currentCode.value.replace(/\s/g, '')
  navigator.clipboard.writeText(code).then(() => {
    copyLabel.value = '已复制 ✓'
    setTimeout(() => { copyLabel.value = '复制验证码' }, 2000)
  }).catch(() => {
    // 降级方案
    const ta = document.createElement('textarea')
    ta.value = code
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    copyLabel.value = '已复制 ✓'
    setTimeout(() => { copyLabel.value = '复制验证码' }, 2000)
  })
}

// ===== 历史记录 =====
function addHistory(code, algo) {
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
  // 避免连续重复
  if (codeHistory.value.length > 0 && codeHistory.value[0].code === code) return
  codeHistory.value.unshift({ code, time, algo })
  if (codeHistory.value.length > 20) codeHistory.value = codeHistory.value.slice(0, 20)
}

function clearHistory() {
  codeHistory.value = []
}

// ===== 帮助切换 =====
function toggleHelp() {
  showHelp.value = !showHelp.value
}

// ===== 输入变化处理 =====
function onKeyChange() {
  // 输入变化时清除错误
  hasError.value = false
  errorMessage.value = ''
}

// ===== 清理 =====
onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})
</script>

<style scoped>
.tool-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 1rem;
}

h2 {
  font-size: 1.6rem;
  margin-bottom: 0.3rem;
}

.subtitle {
  color: #666;
  font-size: 0.95rem;
  margin-bottom: 1rem;
}

.back-link {
  display: inline-block;
  margin-bottom: 1rem;
  color: #22c55e;
  font-weight: 500;
}

.back-link:hover { text-decoration: underline; }

/* 密钥输入 */
.key-section {
  background: #fff;
  border-radius: 12px;
  padding: 1.2rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  margin-bottom: 1rem;
}

.key-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.6rem;
}

.key-header label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
}

.key-input-row {
  display: flex;
  gap: 0.6rem;
}

.key-input {
  flex: 1;
  padding: 0.65rem 0.8rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 2px;
  text-transform: uppercase;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.key-input:focus {
  border-color: #22c55e;
}

/* 使用说明 */
.help-box {
  margin-top: 0.8rem;
  background: #eff6ff;
  border-radius: 10px;
  padding: 1rem;
  border: 1px solid #bfdbfe;
}

.help-box h4 {
  font-size: 0.9rem;
  color: #1e40af;
  margin-bottom: 0.5rem;
}

.help-box ul {
  padding-left: 1.2rem;
  font-size: 0.85rem;
  color: #475569;
  line-height: 1.8;
}

.help-box b {
  color: #1e293b;
}

/* 设置区 */
.settings-section {
  background: #fff;
  border-radius: 12px;
  padding: 1rem 1.2rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  margin-bottom: 1rem;
}

.setting-row {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.setting-group {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.setting-group label {
  font-size: 0.85rem;
  color: #555;
  white-space: nowrap;
}

.btn-group {
  display: flex;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.btn-toggle {
  padding: 0.35rem 0.7rem;
  border: none;
  background: #fff;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}

.btn-toggle:not(:last-child) {
  border-right: 1px solid #e0e0e0;
}

.btn-toggle:hover {
  background: #f0fdf4;
  color: #22c55e;
}

.btn-toggle.active {
  background: #22c55e;
  color: #fff;
}

/* 按钮 */
.btn-primary {
  padding: 0.55rem 1.2rem;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  white-space: nowrap;
}

.btn-primary:hover { opacity: 0.85; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-sm {
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  background: white;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-sm:hover { border-color: #22c55e; color: #22c55e; }

/* 验证码展示 */
.code-display {
  background: #fff;
  border-radius: 16px;
  padding: 2rem 1.5rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  text-align: center;
  margin-bottom: 1rem;
}

/* 倒计时圆环 */
.countdown-ring {
  position: relative;
  width: 100px;
  height: 100px;
  margin: 0 auto 1.2rem;
}

.ring-svg {
  width: 100%;
  height: 100%;
}

.progress-circle {
  transition: stroke-dashoffset 0.5s linear, stroke 0.3s;
}

.ring-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remaining-seconds {
  font-size: 1.6rem;
  font-weight: 700;
  transition: color 0.3s;
}

/* 验证码数字 */
.code-number {
  font-size: 2.8rem;
  font-weight: 700;
  color: #2c3e50;
  letter-spacing: 8px;
  font-family: 'SF Mono', 'Fira Code', 'Courier New', monospace;
  margin-bottom: 1rem;
  transition: color 0.3s;
}

.code-number.warning {
  color: #ef4444;
}

/* 操作按钮 */
.code-actions {
  display: flex;
  justify-content: center;
}

.btn-copy {
  padding: 0.5rem 1.2rem;
  background: #22c55e;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: opacity 0.2s;
}

.btn-copy:hover { opacity: 0.85; }

/* 空状态 / 错误状态 */
.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: #bbb;
}

.error-state {
  text-align: center;
  padding: 1.5rem 1rem;
  color: #dc2626;
  background: #fef2f2;
  border-radius: 12px;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

/* 历史记录 */
.history-section {
  background: #fff;
  border-radius: 12px;
  padding: 1rem 1.2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 1rem;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.6rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #555;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.5rem 0.8rem;
  background: #fafafa;
  border-radius: 8px;
  font-size: 0.82rem;
}

.history-code {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-weight: 600;
  color: #2c3e50;
  letter-spacing: 2px;
}

.history-time {
  color: #999;
  font-family: monospace;
}

.history-algo {
  font-size: 0.75rem;
  color: #888;
  background: #f5f5f5;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

/* 安全提示 */
.security-note {
  text-align: center;
  padding: 1rem;
  color: #999;
  font-size: 0.8rem;
}

/* 响应式 */
@media (max-width: 640px) {
  .tool-page { padding: 0.5rem; }
  .key-input-row { flex-direction: column; }
  .btn-generate { width: 100%; }
  .setting-row { flex-direction: column; gap: 0.8rem; }
  .code-number { font-size: 2.2rem; letter-spacing: 6px; }
}
</style>
