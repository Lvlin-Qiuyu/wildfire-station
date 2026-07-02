<template>
  <div class="tool-page">
    <h2>📦 Base58 / Base62 编解码器</h2>
    <p class="subtitle">Base58 / Base58Check / Base62 文本互转，比特币地址风格验证，CTF 和区块链常用</p>

    <!-- 模式选择 -->
    <div class="mode-tabs">
      <button
        v-for="mode in modes"
        :key="mode.value"
        :class="['mode-tab', { active: activeMode === mode.value }]"
        @click="switchMode(mode.value)"
      >
        {{ mode.label }}
      </button>
    </div>

    <!-- 编码模式 -->
    <div v-if="activeMode === 'encode'" class="panel-section">
      <div class="input-group">
        <label>输入文本</label>
        <textarea
          v-model="encodeInput"
          placeholder="输入要编码的文本..."
          rows="3"
        ></textarea>
      </div>

      <div v-if="encodeInput" class="results">
        <div v-for="enc in encodeResults" :key="enc.name" class="result-item">
          <div class="result-header">
            <span class="result-name">{{ enc.icon }} {{ enc.name }}</span>
            <button class="btn-sm btn-primary" @click="copyText(enc.value, enc.name)">
              {{ copyTextMap[enc.name] || '复制' }}
            </button>
          </div>
          <div class="result-value">{{ enc.value }}</div>
        </div>
      </div>
    </div>

    <!-- 解码模式 -->
    <div v-if="activeMode === 'decode'" class="panel-section">
      <div class="input-group">
        <label>输入编码文本</label>
        <textarea
          v-model="decodeInput"
          placeholder="输入 Base58 / Base62 编码字符串..."
          rows="3"
        ></textarea>
      </div>

      <div v-if="decodeInput" class="results">
        <div v-for="dec in decodeResults" :key="dec.name" class="result-item">
          <div class="result-header">
            <span class="result-name">{{ dec.icon }} {{ dec.name }}</span>
            <span v-if="dec.error" class="decode-error">{{ dec.error }}</span>
            <button v-else class="btn-sm btn-primary" @click="copyText(dec.value, 'decode-' + dec.name)">
              {{ copyTextMap['decode-' + dec.name] || '复制' }}
            </button>
          </div>
          <div v-if="!dec.error" class="result-value">{{ dec.value }}</div>
        </div>
      </div>
    </div>

    <!-- 验证模式 -->
    <div v-if="activeMode === 'verify'" class="panel-section">
      <div class="input-group">
        <label>输入比特币地址</label>
        <textarea
          v-model="verifyInput"
          placeholder="输入比特币地址（如 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa）..."
          rows="2"
        ></textarea>
      </div>

      <div v-if="verifyInput" class="verify-result">
        <div class="verify-card" :class="verifyResult.valid ? 'valid' : 'invalid'">
          <div class="verify-icon">{{ verifyResult.valid ? '✅' : '❌' }}</div>
          <div class="verify-info">
            <h4>{{ verifyResult.valid ? '地址有效' : '地址无效' }}</h4>
            <p v-if="verifyResult.type">类型：{{ verifyResult.type }}</p>
            <p v-if="verifyResult.error">{{ verifyResult.error }}</p>
          </div>
        </div>

        <!-- Base58Check 解码详情 -->
        <div v-if="verifyResult.details" class="details-card">
          <h4>Base58Check 解码详情</h4>
          <div class="detail-row">
            <span class="detail-label">版本字节（Version）</span>
            <span class="detail-value">{{ verifyResult.details.version }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">载荷（Payload）</span>
            <span class="detail-value detail-mono">{{ verifyResult.details.payload }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">校验和（Checksum）</span>
            <span class="detail-value detail-mono">{{ verifyResult.details.checksum }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 参考信息 -->
    <div class="reference">
      <h3>字母表参考</h3>
      <div class="alpha-table">
        <div class="alpha-row">
          <span class="alpha-label">Base58</span>
          <code class="alpha-code">123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz</code>
        </div>
        <div class="alpha-row">
          <span class="alpha-label">Base62</span>
          <code class="alpha-code">0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz</code>
        </div>
      </div>
      <p class="ref-note">Base58 去掉了 0/O/I/l 等易混淆字符，广泛用于比特币地址、IPFS CID 等</p>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'Base58/Base62 编解码器 - 野火小站' })

const activeMode = ref('encode')
const encodeInput = ref('')
const decodeInput = ref('')
const verifyInput = ref('')
const copyTextMap = reactive({})

const modes = [
  { label: '编码', value: 'encode' },
  { label: '解码', value: 'decode' },
  { label: '验证', value: 'verify' },
]

function switchMode(mode) {
  activeMode.value = mode
}

// ==================== Base58 算法 ====================

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const BASE62_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

// Base58 编码（输入 Uint8Array）
function base58Encode(bytes) {
  let num = BigInt('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''))
  let str = ''
  while (num > 0n) {
    str = BASE58_ALPHABET[Number(num % 58n)] + str
    num = num / 58n
  }
  // 前导零 → 前导 '1'
  for (const byte of bytes) {
    if (byte === 0) str = '1' + str
    else break
  }
  return str || '1'
}

// Base58 解码（返回 Uint8Array）
function base58Decode(str) {
  let num = 0n
  for (const char of str) {
    const idx = BASE58_ALPHABET.indexOf(char)
    if (idx === -1) throw new Error(`无效字符: "${char}"`)
    num = num * 58n + BigInt(idx)
  }
  // 转为字节数组
  let hex = num.toString(16)
  if (hex.length % 2) hex = '0' + hex
  const result = []
  for (let i = 0; i < hex.length; i += 2) {
    result.push(parseInt(hex.substring(i, i + 2), 16))
  }
  // 前导 '1' → 前导 0x00
  const leadingOnes = str.match(/^1+/)?.[0].length || 0
  for (let i = 0; i < leadingOnes; i++) {
    result.unshift(0)
  }
  return new Uint8Array(result)
}

// Base62 编码
function base62Encode(bytes) {
  let num = BigInt('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''))
  let str = ''
  while (num > 0n) {
    str = BASE62_ALPHABET[Number(num % 62n)] + str
    num = num / 62n
  }
  return str || '0'
}

// Base62 解码
function base62Decode(str) {
  let num = 0n
  for (const char of str) {
    const idx = BASE62_ALPHABET.indexOf(char)
    if (idx === -1) throw new Error(`无效字符: "${char}"`)
    num = num * 62n + BigInt(idx)
  }
  let hex = num.toString(16)
  if (hex.length % 2) hex = '0' + hex
  const result = []
  for (let i = 0; i < hex.length; i += 2) {
    result.push(parseInt(hex.substring(i, i + 2), 16))
  }
  return new Uint8Array(result)
}

// 文本转 Uint8Array（UTF-8）
function textToBytes(text) {
  return new TextEncoder().encode(text)
}

// Uint8Array 转文本（UTF-8）
function bytesToText(bytes) {
  return new TextDecoder().decode(bytes)
}

// Base58Check 编码（4字节校验和）
function base58CheckEncode(payload, version = 0x00) {
  // version(1 byte) + payload + checksum(4 bytes)
  const full = new Uint8Array(1 + payload.length + 4)
  full[0] = version
  full.set(payload, 1)

  // 双 SHA-256 校验和
  const checksum = doubleSha256(full.slice(0, full.length - 4)).slice(0, 4)
  full.set(checksum, 1 + payload.length)

  return base58Encode(full)
}

// Base58Check 解码
function base58CheckDecode(str) {
  const bytes = base58Decode(str)
  if (bytes.length < 5) throw new Error('数据太短')

  const payload = bytes.slice(0, bytes.length - 4)
  const checksum = bytes.slice(bytes.length - 4)
  const expectedChecksum = doubleSha256(payload).slice(0, 4)

  if (!arraysEqual(checksum, expectedChecksum)) {
    throw new Error('校验和不匹配')
  }

  return {
    version: payload[0],
    payload: payload.slice(1),
    versionByte: '0x' + payload[0].toString(16).padStart(2, '0'),
    payloadHex: Array.from(payload.slice(1)).map(b => b.toString(16).padStart(2, '0')).join(''),
    checksumHex: Array.from(checksum).map(b => b.toString(16).padStart(2, '0')).join(''),
  }
}

// SHA-256 双哈希
function doubleSha256(data) {
  const hash1 = sha256(data)
  return sha256(hash1)
}

// 纯 JS SHA-256 实现
function sha256(data) {
  // 使用 SubtleCrypto API
  return crypto.subtle.digestSync
    ? new Uint8Array(crypto.subtle.digestSync('SHA-256', data))
    : syncSha256(data)
}

// 同步 SHA-256 回退实现（简化版）
function syncSha256(data) {
  // 对于 Base58Check 场景，我们使用 Web Crypto API 异步方式
  // 但为简化同步计算，这里提供纯 JS 实现
  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ])

  // 预处理
  const msg = new Uint8Array(data)
  const msgLen = msg.length
  const bitLen = msgLen * 8

  // 填充
  let paddedLen = msgLen + 1
  while (paddedLen % 64 !== 56) paddedLen++
  paddedLen += 8

  const padded = new Uint8Array(paddedLen)
  padded.set(msg)
  padded[msgLen] = 0x80

  // 64位大端长度
  const hi = Math.floor(bitLen / 0x100000000)
  const lo = bitLen >>> 0
  const view = new DataView(padded.buffer)
  view.setUint32(paddedLen - 8, hi, false)
  view.setUint32(paddedLen - 4, lo, false)

  // 初始化哈希值
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19

  // 处理每个 512 位块
  for (let offset = 0; offset < paddedLen; offset += 64) {
    const w = new Uint32Array(64)
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false)
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotl(w[i-15], 7) ^ rotl(w[i-15], 18) ^ (w[i-15] >>> 3)
      const s1 = rotl(w[i-2], 17) ^ rotl(w[i-2], 19) ^ (w[i-2] >>> 10)
      w[i] = (w[i-16] + s0 + w[i-7] + s1) >>> 0
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7

    for (let i = 0; i < 64; i++) {
      const S1 = rotl(e, 6) ^ rotl(e, 11) ^ rotl(e, 25)
      const ch = (e & f) ^ (~e & g)
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0
      const S0 = rotl(a, 2) ^ rotl(a, 13) ^ rotl(a, 22)
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const temp2 = (S0 + maj) >>> 0

      h = g
      g = f
      f = e
      e = (d + temp1) >>> 0
      d = c
      c = b
      b = a
      a = (temp1 + temp2) >>> 0
    }

    h0 = (h0 + a) >>> 0
    h1 = (h1 + b) >>> 0
    h2 = (h2 + c) >>> 0
    h3 = (h3 + d) >>> 0
    h4 = (h4 + e) >>> 0
    h5 = (h5 + f) >>> 0
    h6 = (h6 + g) >>> 0
    h7 = (h7 + h) >>> 0
  }

  // 输出哈希值
  const hash = new Uint8Array(32)
  const hv = new DataView(hash.buffer)
  hv.setUint32(0, h0, false)
  hv.setUint32(4, h1, false)
  hv.setUint32(8, h2, false)
  hv.setUint32(12, h3, false)
  hv.setUint32(16, h4, false)
  hv.setUint32(20, h5, false)
  hv.setUint32(24, h6, false)
  hv.setUint32(28, h7, false)

  return hash
}

function rotl(x, n) {
  return ((x << n) | (x >>> (32 - n))) >>> 0
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

// ==================== 编码结果 ====================

const encodeResults = computed(() => {
  if (!encodeInput.value) return []
  const bytes = textToBytes(encodeInput.value)
  return [
    { name: 'Base58', icon: '🔑', value: base58Encode(bytes) },
    { name: 'Base58Check', icon: '🔐', value: base58CheckEncode(bytes) },
    { name: 'Base62', icon: '📝', value: base62Encode(bytes) },
  ]
})

// ==================== 解码结果 ====================

const decodeResults = computed(() => {
  if (!decodeInput.value) return []
  const input = decodeInput.value.trim()
  const results = []

  // 尝试 Base58 解码
  try {
    const bytes = base58Decode(input)
    results.push({ name: 'Base58', icon: '🔑', value: bytesToText(bytes), error: null })
  } catch (e) {
    results.push({ name: 'Base58', icon: '🔑', value: '', error: e.message })
  }

  // 尝试 Base62 解码
  try {
    const bytes = base62Decode(input)
    results.push({ name: 'Base62', icon: '📝', value: bytesToText(bytes), error: null })
  } catch (e) {
    results.push({ name: 'Base62', icon: '📝', value: '', error: e.message })
  }

  return results
})

// ==================== 比特币地址验证 ====================

const verifyResult = computed(() => {
  if (!verifyInput.value) return { valid: false, error: '请输入地址' }

  const addr = verifyInput.value.trim()

  // 快速判断地址类型
  let expectedVersion = null
  let type = ''

  if (addr.startsWith('1')) {
    expectedVersion = 0x00
    type = 'P2PKH（传统地址）'
  } else if (addr.startsWith('3')) {
    expectedVersion = 0x05
    type = 'P2SH（多签地址）'
  } else if (addr.startsWith('bc1q')) {
    type = 'Bech32（原生 SegWit）'
    return { valid: false, error: 'Bech32 地址暂不支持验证，请使用 Base58 格式地址' }
  } else if (addr.startsWith('bc1p')) {
    type = 'Bech32m（Taproot）'
    return { valid: false, error: 'Bech32m 地址暂不支持验证，请使用 Base58 格式地址' }
  } else {
    return { valid: false, error: '无法识别的地址格式（期望以 1 或 3 开头）' }
  }

  try {
    const decoded = base58CheckDecode(addr)
    if (decoded.version !== expectedVersion) {
      return { valid: false, error: `版本字节不匹配：期望 ${type}，实际版本 0x${decoded.version.toString(16).padStart(2, '0')}` }
    }
    if (decoded.payload.length !== 20) {
      return { valid: false, error: `载荷长度错误：期望 20 字节，实际 ${decoded.payload.length} 字节` }
    }
    return {
      valid: true,
      type,
      details: {
        version: `0x${decoded.versionByte}（十进制 ${decoded.version}）`,
        payload: decoded.payloadHex,
        checksum: decoded.checksumHex,
      },
    }
  } catch (e) {
    return { valid: false, error: e.message }
  }
})

// ==================== 工具函数 ====================

function copyText(text, key) {
  navigator.clipboard.writeText(text).then(() => {
    copyTextMap[key] = '已复制 ✓'
    setTimeout(() => { copyTextMap[key] = '复制' }, 1500)
  })
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

/* 模式标签 */
.mode-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.mode-tab {
  padding: 0.5rem 1.2rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  color: #666;
}

.mode-tab:hover {
  border-color: #10b981;
  color: #10b981;
}

.mode-tab.active {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border-color: #22c55e;
}

/* 输入区域 */
.panel-section {
  margin-bottom: 1.5rem;
}

.input-group {
  margin-bottom: 1rem;
}

.input-group label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 600;
  font-size: 0.9rem;
  color: #555;
}

textarea {
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 0.95rem;
  outline: none;
  resize: vertical;
  box-sizing: border-box;
  transition: border-color 0.2s;
  font-family: 'Courier New', monospace;
  line-height: 1.5;
  background: white;
}

textarea:focus {
  border-color: #22c55e;
}

/* 结果展示 */
.results {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.result-item {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  overflow: hidden;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 1rem;
  background: white;
  border-bottom: 1px solid #e9ecef;
}

.result-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: #555;
}

.decode-error {
  font-size: 0.8rem;
  color: #ef4444;
  background: #fef2f2;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
}

.result-value {
  padding: 0.8rem 1rem;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: #1a1a2e;
  word-break: break-all;
  line-height: 1.5;
  background: #1a1a2e;
  color: #a5d6a7;
  border-radius: 0;
}

.btn-sm {
  padding: 0.25rem 0.7rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 0.8rem;
  cursor: pointer;
  color: #666;
}

.btn-sm:hover {
  border-color: #10b981;
  color: #22c55e;
}

.btn-sm.btn-primary {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
}

.btn-sm.btn-primary:hover {
  opacity: 0.85;
}

/* 验证结果 */
.verify-result {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.verify-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.2rem;
  border-radius: 10px;
  border: 1px solid;
}

.verify-card.valid {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.verify-card.invalid {
  background: #fef2f2;
  border-color: #fecaca;
}

.verify-icon {
  font-size: 1.8rem;
}

.verify-info h4 {
  font-size: 1.1rem;
  margin-bottom: 0.2rem;
}

.verify-card.valid .verify-info h4 {
  color: #15803d;
}

.verify-card.invalid .verify-info h4 {
  color: #dc2626;
}

.verify-info p {
  font-size: 0.85rem;
  color: #666;
}

.details-card {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  padding: 1rem 1.2rem;
}

.details-card h4 {
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 0.6rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0;
  border-bottom: 1px solid #eee;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 0.82rem;
  color: #888;
}

.detail-value {
  font-size: 0.85rem;
  color: #333;
  font-weight: 500;
}

.detail-mono {
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
}

/* 参考信息 */
.reference {
  background: #fafafa;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
}

.reference h3 {
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 0.75rem;
}

.alpha-table {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 0.6rem;
}

.alpha-row {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
}

.alpha-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #10b981;
  min-width: 60px;
}

.alpha-code {
  font-size: 0.78rem;
  color: #333;
  background: white;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  border: 1px solid #eee;
  word-break: break-all;
  font-family: 'Courier New', monospace;
}

.ref-note {
  font-size: 0.8rem;
  color: #999;
  line-height: 1.5;
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
  .mode-tabs {
    flex-wrap: wrap;
  }
  .result-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.3rem;
  }
  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.2rem;
  }
}
</style>
