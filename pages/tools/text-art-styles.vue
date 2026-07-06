<template>
  <div class="tool-page">
    <h2>🔤 文字艺术生成器</h2>
    <p class="subtitle">生成倒置文字、镜像文字、全角文字、删除线、气泡文字等特殊Unicode文字样式</p>

    <div class="input-section">
      <label>输入文字</label>
      <textarea
        v-model="inputText"
        placeholder="在这里输入想要转换的文字..."
        rows="3"
        spellcheck="false"
      ></textarea>
    </div>

    <!-- 统计 -->
    <div v-if="inputText" class="stats">
      <div class="stat-card">
        <span class="stat-num">{{ inputText.length }}</span>
        <span class="stat-label">字符数</span>
      </div>
      <div class="stat-card">
        <span class="stat-num">{{ styles.length }}</span>
        <span class="stat-label">可用样式</span>
      </div>
    </div>

    <!-- 样式列表 -->
    <div v-if="inputText" class="styles-list">
      <div v-for="style in styles" :key="style.name" class="style-card">
        <div class="style-header">
          <span class="style-icon">{{ style.icon }}</span>
          <span class="style-name">{{ style.name }}</span>
          <button class="btn-copy" @click="copyText(style.transform(inputText))">📋 复制</button>
        </div>
        <div class="style-preview">{{ style.transform(inputText) }}</div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="placeholder">
      <p>✨ 输入文字后，自动生成多种特殊文字样式</p>
    </div>

    <!-- Unicode表情符号装饰 -->
    <div v-if="inputText" class="section">
      <h3>🎯 Unicode 装饰边框</h3>
      <p class="section-desc">给文字添加装饰性边框和符号</p>
      <div class="deco-list">
        <div v-for="deco in decorations" :key="deco.name" class="style-card">
          <div class="style-header">
            <span class="style-icon">{{ deco.icon }}</span>
            <span class="style-name">{{ deco.name }}</span>
            <button class="btn-copy" @click="copyText(deco.transform(inputText))">📋 复制</button>
          </div>
          <div class="style-preview deco-preview">{{ deco.transform(inputText) }}</div>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '文字艺术生成器 - 野火小站' })

const inputText = ref('')

// 倒置映射表
const flipMap = {
  'a': 'ɐ', 'b': 'q', 'c': 'ɔ', 'd': 'p', 'e': 'ǝ', 'f': 'ɟ', 'g': 'ƃ',
  'h': 'ɥ', 'i': 'ᴉ', 'j': 'ɾ', 'k': 'ʞ', 'l': 'l', 'm': 'ɯ', 'n': 'u',
  'o': 'o', 'p': 'd', 'q': 'b', 'r': 'ɹ', 's': 's', 't': 'ʇ', 'u': 'n',
  'v': 'ʌ', 'w': 'ʍ', 'x': 'x', 'y': 'ʎ', 'z': 'z',
  'A': '∀', 'B': 'ᗺ', 'C': 'Ɔ', 'D': 'ᗡ', 'E': 'Ǝ', 'F': 'Ⅎ', 'G': '⅁',
  'H': 'H', 'I': 'I', 'J': 'ſ', 'K': 'ꓘ', 'L': '˥', 'M': 'W', 'N': 'N',
  'O': 'O', 'P': 'Ԁ', 'Q': 'Ꝺ', 'R': 'ᴚ', 'S': 'S', 'T': '⊥', 'U': '∩',
  'V': 'Λ', 'W': 'M', 'X': 'X', 'Y': '⅄', 'Z': 'Z',
  '0': '0', '1': 'Ɩ', '2': 'ᄅ', '3': 'Ɛ', '4': 'ㄣ', '5': 'ϛ', '6': '9',
  '7': 'ㄥ', '8': '8', '9': '6',
  '.': '˙', ',': '\'', '\'': ',', '`': ',', '"': ',,', '!': '¡', '?': '¿',
  '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{', '<': '>', '>': '<',
  '&': '⅋', '_': '‾',
}

// 镜像映射（水平翻转）
const mirrorMap = {
  'a': 'a', 'b': 'd', 'c': 'c', 'd': 'b', 'e': 'ǝ', 'f': 'ɟ', 'g': 'ɓ',
  'h': 'ɥ', 'i': 'i', 'j': '与世界和解', 'k': 'ʞ', 'l': 'l', 'm': 'm', 'n': 'n',
  'o': 'o', 'p': 'q', 'q': 'p', 'r': 'ɾ', 's': 's', 't': 'ʇ', 'u': 'u',
  'v': 'v', 'w': 'w', 'x': 'x', 'y': 'ʎ', 'z': 'z',
  'A': 'A', 'B': 'ᗺ', 'C': 'Ↄ', 'D': 'ᗡ', 'E': 'Ǝ', 'F': 'Ⅎ', 'G': 'G',
  'H': 'H', 'I': 'I', 'J': 'ſ', 'K': 'ꓘ', 'L': 'ꓶ', 'M': 'W', 'N': 'И',
  'O': 'O', 'P': 'ꓨ', 'Q': 'Ꝺ', 'R': 'Я', 'S': 'S', 'T': '⊥', 'U': '∩',
  'V': 'Λ', 'W': 'M', 'X': 'X', 'Y': '⅄', 'Z': 'Ʃ',
  '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{',
  '<': '>', '>': '<', '/': '\\', '\\': '/',
}

// 小型大写字母映射
const smallCapsMap = {
  'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ꜰ', 'g': 'ɢ',
  'h': 'ʜ', 'i': 'ɪ', 'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ',
  'o': 'ᴏ', 'p': 'ᴘ', 'q': 'Q', 'r': 'ʀ', 's': 'ꜱ', 't': 'ᴛ', 'u': 'ᴜ',
  'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ',
}

// 上标映射
const superscriptMap = {
  'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ', 'f': 'ᶠ', 'g': 'ᵍ',
  'h': 'ʰ', 'i': 'ⁱ', 'j': 'ʲ', 'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'n': 'ⁿ',
  'o': 'ᵒ', 'p': 'ᵖ', 'q': 'q', 'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ', 'u': 'ᵘ',
  'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ',
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶',
  '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
}

// 下标映射
const subscriptMap = {
  'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ', 'k': 'ₖ', 'l': 'ₗ',
  'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ', 'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ',
  'u': 'ᵤ', 'v': 'ᵥ', 'x': 'ₓ',
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆',
  '7': '₇', '8': '₈', '9': '₉', '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
}

// 花体映射（数学符号风格）
const scriptMap = {
  'A': '𝒜', 'B': 'ℬ', 'C': '𝒞', 'D': '𝒟', 'E': 'ℰ', 'F': 'ℱ', 'G': '𝒢',
  'H': 'ℋ', 'I': 'ℐ', 'J': '𝒥', 'K': '𝒦', 'L': 'ℒ', 'M': 'ℳ', 'N': '𝒩',
  'O': '𝒪', 'P': '𝒫', 'Q': '𝒬', 'R': 'ℛ', 'S': '𝒮', 'T': '𝒯', 'U': '𝒰',
  'V': '𝒱', 'W': '𝒲', 'X': '𝒳', 'Y': '𝒴', 'Z': '𝒵',
  'a': '𝒶', 'b': '𝒷', 'c': '𝒸', 'd': '𝒹', 'e': 'ℯ', 'f': '𝒻', 'g': 'ℊ',
  'h': '𝒽', 'i': '𝒾', 'j': '𝒿', 'k': '𝓀', 'l': '𝓁', 'm': '𝓂', 'n': '𝓃',
  'o': 'ℴ', 'p': '𝓅', 'q': '𝓆', 'r': '𝓇', 's': '𝓈', 't': '𝓉', 'u': '𝓊',
  'v': '𝓋', 'w': '𝓌', 'x': '𝓍', 'y': '𝓎', 'z': '𝓏',
}

// 双线体映射
const doubleStruckMap = {
  'A': '𝔸', 'B': '𝔹', 'C': 'ℂ', 'D': '𝔻', 'E': '𝔼', 'F': '𝔽', 'G': '𝔾',
  'H': 'ℍ', 'I': '𝕀', 'J': '𝕁', 'K': '𝕂', 'L': '𝕃', 'M': '𝕄', 'N': 'ℕ',
  'O': '𝕆', 'P': 'ℙ', 'Q': 'ℚ', 'R': 'ℝ', 'S': '𝕊', 'T': '𝕋', 'U': '𝕌',
  'V': '𝕍', 'W': '𝕎', 'X': '𝕏', 'Y': '𝕐', 'Z': 'ℤ',
  'a': '𝕒', 'b': '𝕓', 'c': '𝕔', 'd': '𝕕', 'e': '𝕖', 'f': '𝕗', 'g': '𝕘',
  'h': '𝕙', 'i': '𝕚', 'j': '𝕛', 'k': '𝕜', 'l': '𝕝', 'm': '𝕞', 'n': '𝕟',
  'o': '𝕠', 'p': '𝕡', 'q': '𝕢', 'r': '𝕣', 's': '𝕤', 't': '𝕥', 'u': '𝕦',
  'v': '𝕧', 'w': '𝕨', 'x': '𝕩', 'y': '𝕪', 'z': '𝕫',
  '0': '𝟘', '1': '𝟙', '2': '𝟚', '3': '𝟛', '4': '𝟜', '5': '𝟝', '6': '𝟞',
  '7': '𝟟', '8': '𝟠', '9': '𝟡',
}

// 使用映射表转换
function mapTransform(text, map) {
  return [...text].map(c => map[c] || c).join('')
}

// 全角转换
function fullWidth(text) {
  return [...text].map(c => {
    const code = c.charCodeAt(0)
    if (code >= 33 && code <= 126) {
      return String.fromCharCode(code + 65248)
    }
    if (code === 32) return '\u3000'
    return c
  }).join('')
}

// 组合字符转换（添加装饰符号）
function combineChars(text, combiningChar) {
  return [...text].map(c => {
    if (c === ' ') return c
    return c + combiningChar
  }).join('')
}

// 样式列表
const styles = [
  {
    icon: '⬇️',
    name: '倒置文字',
    transform: (t) => [...t].reverse().map(c => flipMap[c] || c).join(''),
  },
  {
    icon: '🪞',
    name: '镜像文字',
    transform: (t) => [...t].reverse().map(c => mirrorMap[c] || c).join(''),
  },
  {
    icon: '🇼',
    name: '全角文字',
    transform: fullWidth,
  },
  {
    icon: '🅰️',
    name: '小型大写字母',
    transform: (t) => mapTransform(t, smallCapsMap),
  },
  {
    icon: 'ⁿ',
    name: '上标文字',
    transform: (t) => mapTransform(t, superscriptMap),
  },
  {
    icon: 'ₙ',
    name: '下标文字',
    transform: (t) => mapTransform(t, subscriptMap),
  },
  {
    icon: '𝓐',
    name: '花体文字',
    transform: (t) => mapTransform(t, scriptMap),
  },
  {
    icon: '𝔸',
    name: '双线体文字',
    transform: (t) => mapTransform(t, doubleStruckMap),
  },
  {
    icon: '🫧',
    name: '气泡文字',
    transform: (t) => mapTransform(t, { ...Object.fromEntries(Object.entries(doubleStruckMap).filter(([k]) => k >= '0' && k <= '9')), ...Object.fromEntries(
      Array.from({ length: 26 }, (_, i) => [String.fromCharCode(65 + i), String.fromCharCode(0x1D552 + i)])
    ), ...Object.fromEntries(
      Array.from({ length: 26 }, (_, i) => [String.fromCharCode(97 + i), String.fromCharCode(0x1D56C + i)])
    )}),
  },
  {
    icon: '🩻',
    name: '删除线文字',
    transform: (t) => combineChars(t, '\u0336'),
  },
  {
    icon: '⎽',
    name: '下划线文字',
    transform: (t) => combineChars(t, '\u0332'),
  },
  {
    icon: '📐',
    name: '上划线文字',
    transform: (t) => combineChars(t, '\u0305'),
  },
]

// 装饰边框样式
const decorations = [
  {
    icon: '🫧',
    name: '气泡框',
    transform: (t) => `⸢${t}⸣`,
  },
  {
    icon: '🏷️',
    name: '标签框',
    transform: (t) => `┌─${'─'.repeat(t.length)}─┐\n│ ${t} │\n└─${'─'.repeat(t.length)}─┘`,
  },
  {
    icon: '👑',
    name: '皇冠装饰',
    transform: (t) => `👑 ${t} 👑`,
  },
  {
    icon: '⭐',
    name: '星星装饰',
    transform: (t) => `✦ ${t} ✦`,
  },
  {
    icon: '🎀',
    name: '丝带装饰',
    transform: (t) => `🎀 ${t} 🎀`,
  },
  {
    icon: '🔥',
    name: '火焰装饰',
    transform: (t) => `🔥 ${t} 🔥`,
  },
  {
    icon: '💫',
    name: '菱形框',
    transform: (t) => `◈ ${t} ◈`,
  },
  {
    icon: '➰',
    name: '波浪下划线',
    transform: (t) => combineChars(t, '\u0330'),
  },
]

// 复制到剪贴板
function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    // 简单反馈（可选toast）
  }).catch(() => {
    // fallback
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  })
}
</script>

<style scoped>
.tool-page {
  max-width: 700px;
  margin: 0 auto;
  padding: 20px;
}
h2 { color: #1a1a2e; margin-bottom: 0.3rem; }
.subtitle { color: #888; font-size: 0.95rem; margin-bottom: 1.5rem; }
.back-link { display: inline-block; margin-top: 2rem; color: #22c55e; text-decoration: none; font-weight: 500; }
.back-link:hover { text-decoration: underline; }

.input-section { margin-bottom: 1.2rem; }
.input-section label {
  display: block;
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 0.4rem;
  font-weight: 500;
}
textarea {
  width: 100%;
  padding: 14px;
  border: 2px solid #ddd;
  border-radius: 10px;
  font-size: 15px;
  resize: vertical;
  box-sizing: border-box;
  font-family: inherit;
}
textarea:focus { border-color: #22c55e; outline: none; }

.stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 1.2rem;
}
.stat-card {
  text-align: center;
  padding: 14px 8px;
  background: #f0fdf4;
  border-radius: 10px;
}
.stat-num {
  display: block;
  font-size: 28px;
  font-weight: bold;
  color: #22c55e;
}
.stat-label {
  font-size: 12px;
  color: #555;
}

.styles-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 1.5rem;
}

.style-card {
  background: white;
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  border: 1px solid #f0f0f0;
  transition: border-color 0.2s;
}
.style-card:hover {
  border-color: #22c55e;
}

.style-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.style-icon {
  font-size: 1.2rem;
}
.style-name {
  flex: 1;
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
}
.btn-copy {
  padding: 5px 12px;
  background: #22c55e;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
}
.btn-copy:hover { background: #16a34a; }

.style-preview {
  font-size: 1.3rem;
  padding: 10px 14px;
  background: #f9fafb;
  border-radius: 8px;
  word-break: break-all;
  line-height: 1.6;
  min-height: 20px;
  color: #333;
}

.deco-preview {
  white-space: pre;
  font-size: 1rem;
}

.section {
  margin-bottom: 1.5rem;
}
.section h3 {
  font-size: 1rem;
  color: #1a1a2e;
  margin-bottom: 0.3rem;
}
.section-desc {
  color: #888;
  font-size: 0.85rem;
  margin-bottom: 12px;
}

.placeholder {
  text-align: center;
  padding: 3rem 1rem;
  background: #fafafa;
  border-radius: 12px;
  color: #bbb;
  font-size: 1rem;
}

.deco-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (max-width: 640px) {
  .tool-page { padding: 12px; }
  .stats { grid-template-columns: repeat(2, 1fr); }
  .style-preview { font-size: 1.1rem; }
}
</style>
