<template>
  <div class="tool-page">
    <h2>📦 Base32/Base85/Base91 编解码器</h2>
    <p class="subtitle">支持 Base32(RFC4648)、Base32hex、Base85(Ascii85/Z85)、Base91 多种编码的实时双向编解码</p>

    <!-- 模式选择 -->
    <div class="mode-tabs">
      <button
        v-for="mode in modes"
        :key="mode.value"
        :class="['mode-tab', { active: activeMode === mode.value }]"
        @click="activeMode = mode.value"
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
            <div class="result-meta">
              <span class="ratio-tag" :class="enc.ratio <= 1 ? 'good' : 'warn'">
                {{ enc.ratio <= 1 ? '↓' : '↑' }} {{ (enc.ratio * 100).toFixed(1) }}%
              </span>
              <button class="btn-sm btn-primary" @click="copyText(enc.value, enc.name)">
                {{ copyTextMap[enc.name] || '复制' }}
              </button>
            </div>
          </div>
          <div class="result-value">{{ enc.value }}</div>
          <div class="result-footer">
            <span>长度: {{ enc.value.length }} 字符</span>
            <span>原长度: {{ encodeBytesLength }} 字节</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 解码模式 -->
    <div v-if="activeMode === 'decode'" class="panel-section">
      <div class="input-group">
        <label>输入编码文本（自动检测编码格式）</label>
        <textarea
          v-model="decodeInput"
          placeholder="粘贴 Base32 / Base32hex / Base85 / Z85 / Base91 编码字符串..."
          rows="3"
        ></textarea>
      </div>

      <div v-if="decodeInput" class="results">
        <!-- 自动检测结果 -->
        <div v-if="autoDetect" class="detect-card">
          <span class="detect-icon">🔍</span>
          <span>自动检测：<strong>{{ autoDetect }}</strong></span>
        </div>

        <div v-for="dec in decodeResults" :key="dec.name" class="result-item">
          <div class="result-header">
            <span class="result-name">{{ dec.icon }} {{ dec.name }}</span>
            <span v-if="dec.error" class="decode-error">{{ dec.error }}</span>
            <button v-else class="btn-sm btn-primary" @click="copyText(dec.value, 'dec-' + dec.name)">
              {{ copyTextMap['dec-' + dec.name] || '复制' }}
            </button>
          </div>
          <div v-if="!dec.error" class="result-value decode-result">{{ dec.value }}</div>
        </div>
      </div>
    </div>

    <!-- 效率对比 -->
    <div v-if="activeMode === 'encode' && encodeInput" class="efficiency-section">
      <h3>📊 编码效率对比</h3>
      <div class="efficiency-table">
        <div class="eff-header">
          <span class="eff-name">编码</span>
          <span class="eff-ratio">压缩率</span>
          <span class="eff-bar-label">对比</span>
        </div>
        <div v-for="enc in encodeResults" :key="'eff-' + enc.name" class="eff-row">
          <span class="eff-name">{{ enc.icon }} {{ enc.name }}</span>
          <span class="eff-ratio">{{ (enc.ratio * 100).toFixed(1) }}%</span>
          <div class="eff-bar-wrap">
            <div
              class="eff-bar"
              :style="{ width: Math.min(enc.ratio / maxRatio * 100, 100) + '%' }"
              :class="enc.ratio <= 1 ? 'bar-good' : 'bar-warn'"
            ></div>
          </div>
        </div>
      </div>
      <p class="eff-note">原始文本 {{ encodeBytesLength }} 字节。压缩率 &lt; 100% 表示编码后更短（二进制数据），&gt; 100% 表示编码后更长（文本数据常见）</p>
    </div>

    <!-- 字符集参考 -->
    <div class="reference">
      <h3>📋 字符集参考</h3>
      <div class="charset-list">
        <div v-for="cs in charsets" :key="cs.name" class="charset-item">
          <div class="charset-name">{{ cs.icon }} {{ cs.name }}</div>
          <div class="charset-info">
            <span>字符数: <strong>{{ cs.count }}</strong></span>
            <span>基数: <strong>{{ cs.base }}</strong></span>
          </div>
          <code class="charset-chars">{{ cs.chars }}</code>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'Base32/Base85/Base91 编解码器 - 野火小站' })

const activeMode = ref('encode')
const encodeInput = ref('')
const decodeInput = ref('')
const copyTextMap = reactive({})

const modes = [
  { label: '编码', value: 'encode' },
  { label: '解码', value: 'decode' },
]

// ==================== 字符集定义 ====================

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const BASE32HEX_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUV'
const BASE85_CHARS = '!"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstu'
const Z85_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-:+=^!/*?&<>()[]{}@%$#'
const BASE91_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,-./:;<=>?@[]^_`{|}~"'

const charsets = [
  { name: 'Base32 (RFC4648)', icon: '📦', chars: BASE32_CHARS, count: 32, base: '2^5' },
  { name: 'Base32hex', icon: '🔢', chars: BASE32HEX_CHARS, count: 32, base: '2^5' },
  { name: 'Base85 (Ascii85)', icon: '📐', chars: '!"#$%&\'..u (95个ASCII可打印)', count: 85, base: '85' },
  { name: 'Z85 (ZeroMQ)', icon: '🔌', chars: Z85_CHARS, count: 85, base: '85' },
  { name: 'Base91 (basE91)', icon: '🧬', chars: BASE91_CHARS, count: 91, base: '91' },
]

// ==================== 编码算法 ====================

function textToBytes(text) {
  return new TextEncoder().encode(text)
}

function bytesToText(bytes) {
  return new TextDecoder().decode(bytes)
}

// Base32 (RFC4648) 编码
function base32Encode(bytes) {
  const alphabet = BASE32_CHARS
  let bits = ''
  for (const b of bytes) {
    bits += b.toString(2).padStart(8, '0')
  }
  // 补齐到5的倍数
  while (bits.length % 5 !== 0) bits += '0'
  let result = ''
  for (let i = 0; i < bits.length; i += 5) {
    result += alphabet[parseInt(bits.substring(i, i + 5), 2)]
  }
  // Padding
  const padLen = (8 - (bytes.length % 8)) % 8
  result += '='.repeat(Math.floor(padLen * 5 / 8))
  // 修正padding长度
  if (bytes.length % 8 !== 0) {
    const fullGroups = Math.ceil(bytes.length / 5)
    const encodedLen = Math.ceil(bytes.length * 8 / 5)
    const paddedLen = encodedLen + ((8 - encodedLen % 8) % 8)
    result = result.substring(0, paddedLen).padEnd(paddedLen, '=')
  }
  // 简化：重新计算
  result = ''
  bits = ''
  for (const b of bytes) {
    bits += b.toString(2).padStart(8, '0')
  }
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.substring(i, Math.min(i + 5, bits.length))
    if (chunk.length < 5) break
    result += alphabet[parseInt(chunk, 2)]
  }
  // 不加padding保持简洁
  return result
}

// Base32 (RFC4648) 解码
function base32Decode(str) {
  const alphabet = BASE32_CHARS
  // 去掉padding
  str = str.replace(/=+$/, '')
  let bits = ''
  for (const c of str) {
    const idx = alphabet.indexOf(c.toUpperCase())
    if (idx === -1) throw new Error(`无效字符: "${c}"`)
    bits += idx.toString(2).padStart(5, '0')
  }
  const bytes = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2))
  }
  return new Uint8Array(bytes)
}

// Base32hex 编码
function base32hexEncode(bytes) {
  const alphabet = BASE32HEX_CHARS
  let bits = ''
  for (const b of bytes) {
    bits += b.toString(2).padStart(8, '0')
  }
  let result = ''
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.substring(i, Math.min(i + 5, bits.length))
    if (chunk.length < 5) break
    result += alphabet[parseInt(chunk, 2)]
  }
  return result
}

// Base32hex 解码
function base32hexDecode(str) {
  const alphabet = BASE32HEX_CHARS
  str = str.replace(/=+$/, '')
  let bits = ''
  for (const c of str) {
    const idx = alphabet.indexOf(c.toUpperCase())
    if (idx === -1) throw new Error(`无效字符: "${c}"`)
    bits += idx.toString(2).padStart(5, '0')
  }
  const bytes = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2))
  }
  return new Uint8Array(bytes)
}

// Base85 (Ascii85) 编码
function base85Encode(bytes) {
  if (bytes.length === 0) return ''
  const result = []
  let i = 0
  while (i < bytes.length) {
    // 取最多4字节
    let num = 0n
    const chunk = bytes.slice(i, Math.min(i + 4))
    for (const b of chunk) {
      num = num * 256n + BigInt(b)
    }
    const padding = 4 - chunk.length
    // 乘以 85^(4-padding)
    let encoded = ''
    for (let j = 0; j < 4 - padding; j++) {
      const remainder = num % 85n
      encoded = String.fromCharCode(Number(remainder) + 33) + encoded
      num = num / 85n
    }
    result.push(encoded)
    i += 4
  }
  return result.join('')
}

// Base85 (Ascii85) 解码
function base85Decode(str) {
  const bytes = []
  let i = 0
  while (i < str.length) {
    let num = 0n
    const chunkLen = Math.min(4, str.length - i)
    for (let j = 0; j < chunkLen; j++) {
      const c = str.charCodeAt(i + j)
      if (c < 33 || c > 117) throw new Error(`无效字符: "${str[i + j]}"`)
      num = num * 85n + BigInt(c - 33)
    }
    const padding = 4 - chunkLen
    const fullBytes = []
    for (let j = 0; j < 4; j++) {
      fullBytes.unshift(Number(num & 0xffn))
      num = num >> 8n
    }
    bytes.push(...fullBytes.slice(padding))
    i += 4
  }
  return new Uint8Array(bytes)
}

// Z85 编码
function z85Encode(bytes) {
  // Z85 需要4字节对齐
  if (bytes.length === 0) return ''
  // 填充到4的倍数
  const padLen = (4 - (bytes.length % 4)) % 4
  const padded = new Uint8Array(bytes.length + padLen)
  padded.set(bytes)

  const result = []
  for (let i = 0; i < padded.length; i += 4) {
    let num = 0n
    for (let j = 0; j < 4; j++) {
      num = num * 256n + BigInt(padded[i + j])
    }
    const chars = []
    for (let j = 0; j < 5; j++) {
      const rem = Number(num % 85n)
      num = num / 85n
      chars.unshift(Z85_CHARS[rem])
    }
    result.push(chars.join(''))
  }
  return result.join('') + ':'  // 标记原始长度
}

// Z85 解码
function z85Decode(str) {
  // 去掉长度标记
  str = str.replace(/:$/, '')
  if (str.length === 0) return new Uint8Array(0)
  // 需要5字符对齐
  const padLen = (5 - (str.length % 5)) % 5
  const padded = str + Z85_CHARS[0].repeat(padLen)

  const bytes = []
  for (let i = 0; i < padded.length; i += 5) {
    let num = 0n
    for (let j = 0; j < 5; j++) {
      const idx = Z85_CHARS.indexOf(padded[i + j])
      if (idx === -1) throw new Error(`无效字符: "${padded[i + j]}"`)
      num = num * 85n + BigInt(idx)
    }
    for (let j = 3; j >= 0; j--) {
      bytes.unshift(Number(num & 0xffn))
      num = num >> 8n
    }
  }
  return new Uint8Array(bytes)
}

// Base91 编码 (basE91)
function base91Encode(bytes) {
  if (bytes.length === 0) return ''
  let b = 0n
  let n = 0
  let o = 0
  const result = []
  const base = 91n

  for (const byte of bytes) {
    b |= BigInt(byte) << BigInt(n)
    n += 8
    if (n > 13) {
      let v = b & 8191n // 13位掩码
      if (v > 88n) {
        v |= 8192n
        b >>= 13
        n -= 13
      } else {
        b >>= 14
        n -= 14
      }
      result.push(BASE91_CHARS[Number(v % base)])
      result.push(BASE91_CHARS[Number(v / base)])
    }
  }

  if (n > 0) {
    result.push(BASE91_CHARS[Number(b % base)])
    if (n > 7 || b > 90n) {
      result.push(BASE91_CHARS[Number(b / base)])
    }
  }

  return result.join('')
}

// Base91 解码
function base91Decode(str) {
  const v = -1
  let b = 0n
  let n = 0
  const result = []
  const base = 91n

  for (const c of str) {
    const d = BigInt(BASE91_CHARS.indexOf(c))
    if (d === -1n) throw new Error(`无效字符: "${c}"`)
    if (v === -1) {
      // 第一个字符
      v = Number(d)
    }
  }

  // 完整的basE91解码
  let o = 0
  let c1 = -1
  const bytes = []

  for (let i = 0; i < str.length; i++) {
    const d = BASE91_CHARS.indexOf(str[i])
    if (d === -1) continue

    if (c1 === -1) {
      c1 = d
    } else {
      c1 += d * 91
      const h = c1 & 8191
      if (h > 88) {
        c1 >>= 13
      } else {
        c1 >>= 14
      }
      o += 13 - (h > 88 ? 0 : 1)
      while (o >= 8) {
        o -= 8
        bytes.push((c1 >> o) & 255)
      }
      c1 = -1
    }
  }

  if (c1 !== -1) {
    bytes.push((c1 << (8 - (o))) & 255)
  }

  return new Uint8Array(bytes)
}

// ==================== 编码结果 ====================

const encodeBytesLength = computed(() => {
  if (!encodeInput.value) return 0
  return textToBytes(encodeInput.value).length
})

const encodeResults = computed(() => {
  if (!encodeInput.value) return []
  const bytes = textToBytes(encodeInput.value)
  const originalLen = bytes.length
  const results = []

  const encodings = [
    { name: 'Base32 (RFC4648)', icon: '📦', fn: base32Encode },
    { name: 'Base32hex', icon: '🔢', fn: base32hexEncode },
    { name: 'Base85 (Ascii85)', icon: '📐', fn: base85Encode },
    { name: 'Z85 (ZeroMQ)', icon: '🔌', fn: z85Encode },
    { name: 'Base91 (basE91)', icon: '🧬', fn: base91Encode },
  ]

  for (const enc of encodings) {
    try {
      const value = enc.fn(bytes)
      results.push({
        name: enc.name,
        icon: enc.icon,
        value,
        ratio: originalLen > 0 ? value.length / originalLen : 0,
      })
    } catch {
      results.push({
        name: enc.name,
        icon: enc.icon,
        value: '编码失败',
        ratio: 0,
      })
    }
  }

  return results
})

const maxRatio = computed(() => {
  if (!encodeResults.value.length) return 1
  return Math.max(...encodeResults.value.map(r => r.ratio))
})

// ==================== 解码结果与自动检测 ====================

// 自动检测编码类型
const autoDetect = computed(() => {
  if (!decodeInput.value) return null
  const str = decodeInput.value.trim()

  // Base32 检测：只含 A-Z, 2-7，可能含 =
  if (/^[A-Z2-7]+=*$/i.test(str) && str.length % 8 <= 2) {
    return 'Base32 (RFC4648)'
  }

  // Base32hex 检测：只含 0-9, A-V
  if (/^[0-9A-V]+=*$/i.test(str) && str.length % 8 <= 2) {
    return 'Base32hex'
  }

  // Base85/Ascii85 检测：只含 ASCII 33-117
  if (/^[\x21-\x75]+$/.test(str) && str.length % 4 === 0) {
    return 'Base85 (Ascii85)'
  }

  // Z85 检测：只含 Z85 字符集
  if (/^[0-9a-zA-Z.\-:+=^!/*?&<>()\[\]{}@%$#]+$/.test(str) && str.length % 5 === 0) {
    return 'Z85 (ZeroMQ)'
  }

  // Base91 检测：包含 Base91 字符集
  if (BASE91_CHARS.split('').every(c => str.includes(c) || !str.includes(c))) {
    const valid = str.split('').every(c => BASE91_CHARS.includes(c))
    if (valid) return 'Base91 (basE91)'
  }

  return null
})

const decodeResults = computed(() => {
  if (!decodeInput.value) return []
  const input = decodeInput.value.trim()
  const results = []

  const decodings = [
    { name: 'Base32 (RFC4648)', icon: '📦', fn: base32Decode },
    { name: 'Base32hex', icon: '🔢', fn: base32hexDecode },
    { name: 'Base85 (Ascii85)', icon: '📐', fn: base85Decode },
    { name: 'Z85 (ZeroMQ)', icon: '🔌', fn: z85Decode },
    { name: 'Base91 (basE91)', icon: '🧬', fn: base91Decode },
  ]

  for (const dec of decodings) {
    try {
      const bytes = dec.fn(input)
      const value = bytesToText(bytes)
      // 检查是否包含有效UTF-8文本
      const isValid = value && !value.includes('\ufffd')
      results.push({
        name: dec.name,
        icon: dec.icon,
        value: isValid ? value : '[解码结果非有效UTF-8文本]',
        error: isValid ? null : '结果非有效文本',
      })
    } catch (e) {
      results.push({
        name: dec.name,
        icon: dec.icon,
        value: '',
        error: e.message.substring(0, 40),
      })
    }
  }

  return results
})

// ==================== 工具函数 ====================

function copyText(text, key) {
  navigator.clipboard.writeText(text).then(() => {
    copyTextMap[key] = '已复制 ✓'
    setTimeout(() => { copyTextMap[key] = '' }, 1500)
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

.result-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ratio-tag {
  font-size: 0.75rem;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-weight: 500;
}

.ratio-tag.good {
  background: #dcfce7;
  color: #166534;
}

.ratio-tag.warn {
  background: #fef3c7;
  color: #92400e;
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
  font-size: 0.82rem;
  color: #a5d6a7;
  background: #1a1a2e;
  word-break: break-all;
  line-height: 1.5;
  min-height: 2.4rem;
}

.decode-result {
  color: #333;
  background: #fafafa;
}

.result-footer {
  padding: 0.3rem 1rem;
  font-size: 0.75rem;
  color: #aaa;
  background: white;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 1rem;
}

/* 自动检测 */
.detect-card {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  color: #1e40af;
  margin-bottom: 0.8rem;
}

.detect-icon {
  font-size: 1rem;
}

/* 效率对比 */
.efficiency-section {
  background: #fafafa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 1.2rem;
  margin-bottom: 1.5rem;
}

.efficiency-section h3 {
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 0.8rem;
}

.efficiency-table {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.eff-header {
  display: grid;
  grid-template-columns: 160px 70px 1fr;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #888;
  padding-bottom: 0.3rem;
  border-bottom: 1px solid #eee;
}

.eff-row {
  display: grid;
  grid-template-columns: 160px 70px 1fr;
  gap: 0.5rem;
  font-size: 0.82rem;
  align-items: center;
}

.eff-name {
  color: #555;
}

.eff-ratio {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #333;
}

.eff-bar-wrap {
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.eff-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.bar-good {
  background: linear-gradient(135deg, #22c55e, #10b981);
}

.bar-warn {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.eff-note {
  font-size: 0.78rem;
  color: #999;
  margin-top: 0.6rem;
  line-height: 1.4;
}

/* 按钮 */
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

/* 字符集参考 */
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

.charset-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.charset-item {
  background: white;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 0.6rem 0.8rem;
}

.charset-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #10b981;
  margin-bottom: 0.2rem;
}

.charset-info {
  display: flex;
  gap: 1rem;
  font-size: 0.78rem;
  color: #888;
  margin-bottom: 0.3rem;
}

.charset-chars {
  font-size: 0.72rem;
  color: #555;
  background: #f8f9fa;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  word-break: break-all;
  font-family: 'Courier New', monospace;
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
  .eff-header,
  .eff-row {
    grid-template-columns: 120px 60px 1fr;
  }
  .result-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.3rem;
  }
  .result-footer {
    flex-direction: column;
    gap: 0.2rem;
  }
}
</style>
