<template>
  <div class="tool-page">
    <h2>🔐 经典密码编解码器</h2>
    <p class="tool-desc">凯撒密码、摩尔斯电码、维吉尼亚密码、栅栏密码、ROT13 五种经典算法双向转换</p>

    <!-- 算法选择 -->
    <div class="cipher-tabs">
      <button v-for="c in ciphers" :key="c.id" :class="{ active: activeCipher === c.id }" @click="activeCipher = c.id">
        {{ c.icon }} {{ c.name }}
      </button>
    </div>

    <!-- 输入输出 -->
    <div class="io-section">
      <div class="io-panel">
        <div class="io-header">
          <label>{{ isEncrypt ? '🟢 加密输入' : '🔵 解密输入' }}</label>
          <button class="btn-mode" @click="isEncrypt = !isEncrypt">
            {{ isEncrypt ? '切换解密 →' : '切换加密 →' }}
          </button>
        </div>
        <textarea v-model="inputText" placeholder="在此输入文本..." rows="4"></textarea>
      </div>
      <div class="io-panel">
        <div class="io-header">
          <label>{{ isEncrypt ? '🔒 加密结果' : '🔓 解密结果' }}</label>
          <button class="btn-copy" @click="copyResult">{{ copyBtnText }}</button>
        </div>
        <div class="output-box">{{ output }}</div>
      </div>
    </div>

    <!-- 凯撒参数 -->
    <div v-if="activeCipher === 'caesar'" class="params-section">
      <label>偏移量</label>
      <div class="shift-row">
        <input type="range" v-model.number="shift" min="1" max="25" />
        <span class="shift-val">{{ shift }}</span>
      </div>
      <button class="btn-brute" @click="showBrute = !showBrute">
        {{ showBrute ? '隐藏暴力破解' : '🗡️ 暴力破解全部' }}
      </button>
      <div v-if="showBrute" class="brute-results">
        <div v-for="i in 25" :key="i" class="brute-item" @click="shift = i; showBrute = false">
          <span class="brute-shift">偏移 {{ i }}</span>
          <span class="brute-text">{{ caesarProcess(inputText, isEncrypt ? -i : i) }}</span>
        </div>
      </div>
    </div>

    <!-- 摩尔斯参数 -->
    <div v-if="activeCipher === 'morse'" class="params-section">
      <label>分隔符</label>
      <div class="sep-row">
        <span>字母间</span>
        <input v-model="morseLetterSep" class="sep-input" placeholder=" / " />
        <span>单词间</span>
        <input v-model="morseWordSep" class="sep-input" placeholder=" / " />
      </div>
    </div>

    <!-- 维吉尼亚参数 -->
    <div v-if="activeCipher === 'vigenere'" class="params-section">
      <label>密钥（仅字母）</label>
      <input v-model="vigenereKey" class="key-input" placeholder="输入密钥，如 SECRET" spellcheck="false" />
    </div>

    <!-- 栅栏参数 -->
    <div v-if="activeCipher === 'railfence'" class="params-section">
      <label>栏数</label>
      <div class="shift-row">
        <input type="range" v-model.number="rails" min="2" max="10" />
        <span class="shift-val">{{ rails }}</span>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '经典密码编解码器 - 野火小站' })

const ciphers = [
  { id: 'caesar', name: '凯撒密码', icon: '🪙' },
  { id: 'morse', name: '摩尔斯电码', icon: '📡' },
  { id: 'vigenere', name: '维吉尼亚', icon: '🧩' },
  { id: 'railfence', name: '栅栏密码', icon: '🏗️' },
  { id: 'rot13', name: 'ROT13', icon: '🔄' },
]

const activeCipher = ref('caesar')
const isEncrypt = ref(true)
const inputText = ref('')
const shift = ref(3)
const morseLetterSep = ref(' ')
const morseWordSep = ref(' / ')
const vigenereKey = ref('')
const rails = ref(3)
const showBrute = ref(false)
const copyBtnText = ref('复制结果')

// 摩尔斯码表
const morseMap = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
  '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
  '8': '---..', '9': '----.', '.': '.-.-.-', ',': '--..--', '?': '..--..',
  '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...',
  ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-',
  '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.', "'": '.----.'
}
const morseReverse = Object.fromEntries(Object.entries(morseMap).map(([k, v]) => [v, k]))

// 凯撒密码
function caesarProcess(text, s) {
  return text.split('').map(c => {
    if (c >= 'A' && c <= 'Z') return String.fromCharCode(((c.charCodeAt(0) - 65 + s % 26 + 26) % 26) + 65)
    if (c >= 'a' && c <= 'z') return String.fromCharCode(((c.charCodeAt(0) - 97 + s % 26 + 26) % 26) + 97)
    return c
  }).join('')
}

// 摩尔斯电码
function morseEncrypt(text) {
  return text.toUpperCase().split(' ').map(word =>
    word.split('').map(c => morseMap[c] || c).join(morseLetterSep.value)
  ).join(morseWordSep.value)
}

function morseDecrypt(code) {
  const lSep = morseLetterSep.value
  const wSep = morseWordSep.value
  return code.split(wSep).map(word =>
    word.split(lSep).map(m => morseReverse[m] || m).join('')
  ).join(' ')
}

// 维吉尼亚密码
function vigenereProcess(text, key, encrypt) {
  if (!key) return '请输入密钥'
  const k = key.toUpperCase().replace(/[^A-Z]/g, '')
  if (!k) return '密钥无效'
  let ki = 0
  return text.split('').map(c => {
    const upper = c >= 'A' && c <= 'Z'
    const lower = c >= 'a' && c <= 'z'
    if (!upper && !lower) return c
    const base = upper ? 65 : 97
    const dir = encrypt ? 1 : -1
    const shift = (c.charCodeAt(0) - base + dir * (k.charCodeAt(ki % k.length) - 65) + 26) % 26
    ki++
    return String.fromCharCode(shift + base)
  }).join('')
}

// 栅栏密码
function railFenceEncrypt(text, r) {
  if (r < 2) return text
  const fence = Array.from({ length: r }, () => [])
  let rail = 0, dir = 1
  for (const c of text) {
    fence[rail].push(c)
    if (rail === 0) dir = 1
    if (rail === r - 1) dir = -1
    rail += dir
  }
  return fence.flat().join('')
}

function railFenceDecrypt(text, r) {
  if (r < 2) return text
  const n = text.length
  const pattern = []
  let rail = 0, dir = 1
  for (let i = 0; i < n; i++) {
    pattern.push(rail)
    if (rail === 0) dir = 1
    if (rail === r - 1) dir = -1
    rail += dir
  }
  // 计算每行长度
  const lens = Array(r).fill(0)
  pattern.forEach(r => lens[r]++)
  // 分割密文到各行
  const rows = []
  let pos = 0
  for (let i = 0; i < r; i++) {
    rows.push(text.slice(pos, pos + lens[i]))
    pos += lens[i]
  }
  // 按pattern顺序取出
  const indices = Array(r).fill(0)
  return pattern.map(r => rows[r][indices[r]++]).join('')
}

// ROT13
function rot13(text) {
  return caesarProcess(text, 13)
}

// 统一输出
const output = computed(() => {
  const t = inputText.value
  if (!t) return ''
  const enc = isEncrypt.value
  switch (activeCipher.value) {
    case 'caesar': return caesarProcess(t, enc ? shift.value : 26 - shift.value)
    case 'morse': return enc ? morseEncrypt(t) : morseDecrypt(t)
    case 'vigenere': return vigenereProcess(t, vigenereKey.value, enc)
    case 'railfence': return enc ? railFenceEncrypt(t, rails.value) : railFenceDecrypt(t, rails.value)
    case 'rot13': return rot13(t)
    default: return ''
  }
})

function copyResult() {
  navigator.clipboard.writeText(output.value).then(() => {
    copyBtnText.value = '已复制 ✓'
    setTimeout(() => { copyBtnText.value = '复制结果' }, 1500)
  })
}
</script>

<style scoped>
.tool-page { padding-top: 0.5rem; }
h2 { font-size: 1.6rem; margin-bottom: 0.5rem; }
.tool-desc { color: #666; margin-bottom: 1.5rem; font-size: 0.95rem; }

.cipher-tabs {
  display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.5rem;
}
.cipher-tabs button {
  padding: 0.6rem 1rem; border: 2px solid #e0e0e0; border-radius: 8px;
  background: white; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;
}
.cipher-tabs button.active { border-color: #22c55e; background: #f0fdf4; font-weight: 600; }

.io-section { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
.io-panel { background: #f8f9fa; border-radius: 10px; padding: 1rem; }
.io-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
.io-header label { font-weight: 600; font-size: 0.95rem; }

.io-panel textarea {
  width: 100%; padding: 0.8rem; border: 2px solid #e0e0e0; border-radius: 8px;
  font-size: 1rem; outline: none; resize: vertical; box-sizing: border-box; background: white;
  transition: border-color 0.2s;
}
.io-panel textarea:focus { border-color: #22c55e; }

.output-box {
  background: #1a1a2e; color: #a5d6a7; padding: 1rem; border-radius: 8px;
  font-family: monospace; font-size: 0.95rem; word-break: break-all; line-height: 1.6;
  min-height: 100px; white-space: pre-wrap;
}

.btn-mode {
  padding: 0.4rem 0.8rem; border: 2px solid #22c55e; border-radius: 6px;
  background: white; color: #22c55e; cursor: pointer; font-size: 0.85rem; transition: all 0.2s;
}
.btn-mode:hover { background: #f0fdf4; }

.btn-copy {
  padding: 0.4rem 0.8rem; background: linear-gradient(135deg, #22c55e, #10b981);
  color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem;
}
.btn-copy:active { transform: scale(0.95); }

/* 参数区 */
.params-section {
  background: #f8f9fa; border-radius: 10px; padding: 1rem; margin-bottom: 1rem;
}
.params-section label { display: block; font-weight: 600; font-size: 0.9rem; margin-bottom: 0.6rem; }

.shift-row { display: flex; align-items: center; gap: 1rem; }
.shift-row input[type="range"] {
  flex: 1; accent-color: #22c55e; height: 6px;
}
.shift-val {
  min-width: 2rem; text-align: center; font-weight: 700;
  font-size: 1.2rem; color: #22c55e;
}

.sep-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.sep-row span { font-size: 0.85rem; color: #666; }
.sep-input {
  width: 60px; padding: 0.4rem 0.6rem; border: 2px solid #e0e0e0; border-radius: 6px;
  font-size: 0.9rem; outline: none; font-family: monospace;
}
.sep-input:focus { border-color: #22c55e; }

.key-input {
  width: 100%; padding: 0.6rem 1rem; border: 2px solid #e0e0e0; border-radius: 8px;
  font-size: 1rem; font-family: monospace; text-transform: uppercase; outline: none;
  letter-spacing: 2px; transition: border-color 0.2s;
}
.key-input:focus { border-color: #22c55e; }

/* 暴力破解 */
.btn-brute {
  margin-top: 0.8rem; padding: 0.5rem 1rem; background: white; border: 2px solid #f59e0b;
  border-radius: 8px; cursor: pointer; font-size: 0.9rem; color: #f59e0b; font-weight: 600;
  transition: all 0.2s;
}
.btn-brute:hover { background: #fffbeb; }

.brute-results {
  margin-top: 0.8rem; max-height: 400px; overflow-y: auto; display: flex;
  flex-direction: column; gap: 0.4rem;
}
.brute-item {
  display: flex; gap: 1rem; padding: 0.5rem 0.8rem; background: white;
  border-radius: 6px; border: 1px solid #e0e0e0; cursor: pointer; transition: all 0.2s;
}
.brute-item:hover { border-color: #22c55e; background: #f0fdf4; }
.brute-shift { font-weight: 700; color: #22c55e; min-width: 4rem; font-size: 0.85rem; }
.brute-text { font-family: monospace; font-size: 0.85rem; word-break: break-all; }

.back-link { display: inline-block; margin-top: 2rem; color: #22c55e; text-decoration: none; font-weight: 600; }
.back-link:hover { text-decoration: underline; }

@media (max-width: 600px) {
  .cipher-tabs { gap: 0.3rem; }
  .cipher-tabs button { padding: 0.5rem 0.7rem; font-size: 0.8rem; }
  .sep-row { flex-direction: column; align-items: stretch; }
}
</style>
