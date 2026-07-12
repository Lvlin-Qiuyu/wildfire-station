<template>
  <div class="tool-page">
    <h2>🔤 盲文转换器</h2>
    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>

    <p class="subtitle">文本与盲文 Unicode 互转，实时可视化显示盲文点位。支持英文、数字和常用标点。</p>

    <!-- 模式切换 -->
    <div class="mode-tabs">
      <button :class="['mode-btn', { active: mode === 'toBraille' }]" @click="mode = 'toBraille'">文本 → 盲文</button>
      <button :class="['mode-btn', { active: mode === 'toText' }]" @click="mode = 'toText'">盲文 → 文本</button>
    </div>

    <!-- 输入区 -->
    <div class="input-section">
      <label>{{ mode === 'toBraille' ? '输入文本' : '输入盲文 Unicode' }}</label>
      <textarea v-model="inputText"
        :placeholder="mode === 'toBraille' ? '输入英文、数字或标点...' : '粘贴盲文字符（⠃⠗⠁⠊⠇⠇⠑）...'"
        rows="3"
        @input="convert"></textarea>
    </div>

    <!-- 输出区 -->
    <div class="output-section">
      <div class="output-header">
        <label>{{ mode === 'toBraille' ? '盲文输出' : '文本输出' }}</label>
        <button class="btn-copy" @click="copyOutput">📋 复制</button>
      </div>
      <div class="output-box">{{ outputText }}</div>
    </div>

    <!-- 点位可视化 -->
    <div v-if="dots.length" class="dots-section">
      <label>点位可视化（每格 2×3 点阵）</label>
      <div class="dots-grid">
        <div v-for="(d, i) in dots" :key="i" class="dot-cell" :title="d.char">
          <svg viewBox="0 0 20 30" width="28" height="42">
            <!-- 点位1-6: 1=左上 2=中上 3=右上 4=左下 5=中下 6=右下 -->
            <circle v-for="n in 6" :key="n"
              :cx="[8, 10, 12, 8, 10, 12][n-1]"
              :cy="[5, 5, 5, 25, 25, 25][n-1]"
              :r="3"
              :fill="d.dots.includes(n) ? '#22c55e' : '#e5e7eb'" />
          </svg>
          <span class="dot-label">{{ d.char }}</span>
        </div>
      </div>
    </div>

    <!-- 盲文对照表 -->
    <details class="reference">
      <summary>📖 盲文点位对照表</summary>
      <div class="ref-grid">
        <div v-for="entry in referenceTable" :key="entry.char" class="ref-item">
          <svg viewBox="0 0 20 30" width="24" height="36">
            <circle v-for="n in 6" :key="n"
              :cx="[8, 10, 12, 8, 10, 12][n-1]"
              :cy="[5, 5, 5, 25, 25, 25][n-1]"
              :r="3"
              :fill="entry.dots.includes(n) ? '#374151' : '#e5e7eb'" />
          </svg>
          <span>{{ entry.char }}</span>
        </div>
      </div>
    </details>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

useHead({ title: '盲文转换器 - 野火小站' })

const mode = ref('toBraille')
const inputText = ref('')

// 盲文点位映射：每个字符对应的点位编号（1-6）
// 点位排列: 1 4 / 2 5 / 3 6
const charToDots = {
  'a': [1], 'b': [1,2], 'c': [1,4], 'd': [1,4,5], 'e': [1,5],
  'f': [1,2,4], 'g': [1,2,4,5], 'h': [1,2,5], 'i': [2,4], 'j': [2,4,5],
  'k': [1,3], 'l': [1,2,3], 'm': [1,3,4], 'n': [1,3,4,5], 'o': [1,3,5],
  'p': [1,2,3,4], 'q': [1,2,3,4,5], 'r': [1,2,3,5], 's': [2,3,4], 't': [2,3,4,5],
  'u': [1,3,6], 'v': [1,2,3,6], 'w': [2,4,5,6], 'x': [1,3,4,6], 'y': [1,3,4,5,6],
  'z': [1,3,5,6],
  '1': [1], '2': [1,2], '3': [1,4], '4': [1,4,5], '5': [1,5],
  '6': [1,2,4], '7': [1,2,4,5], '8': [1,2,5], '9': [2,4], '0': [2,4,5],
  '.': [2,5,6], ',': [2], '!': [2,3,5], '?': [2,3,6], ':': [2,5],
  ';': [2,3], '-': [3,6], '/': [2,5], ' ': [],
  "'": [2,3,6], '"': [2,3,5,6], '(': [2,3,5,6], ')': [2,3,5,6],
}

// 反向映射：点位 → 字符
const dotsToChar = Object.fromEntries(
  Object.entries(charToDots).map(([ch, dots]) => [dots.join(','), ch])
)

// 盲文 Unicode 基地址 0x2800，每个点位映射到对应bit
const dotToBit = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 }

const dotsToUnicode = (dots) => {
  let val = 0
  for (const d of dots) val |= (1 << (dotToBit[d] || 0))
  return String.fromCodePoint(0x2800 + val)
}

const unicodeToDots = (ch) => {
  const code = ch.codePointAt(0)
  if (code < 0x2800 || code > 0x28FF) return null
  const val = code - 0x2800
  const dots = []
  for (const [d, bit] of Object.entries(dotToBit)) {
    if (val & (1 << bit)) dots.push(Number(d))
  }
  return dots
}

// 转换
const outputText = computed(() => {
  if (!inputText.value) return ''

  if (mode.value === 'toBraille') {
    return inputText.value.toLowerCase().split('').map(ch => {
      const dots = charToDots[ch]
      return dots ? dotsToUnicode(dots) : ch
    }).join('')
  } else {
    return [...inputText.value].map(ch => {
      const dots = unicodeToDots(ch)
      if (!dots) return ch
      return dotsToChar[dots.join(',')] || ch
    }).join('')
  }
})

// 点位可视化数据
const dots = computed(() => {
  const chars = mode.value === 'toBraille'
    ? inputText.value.toLowerCase().split('')
    : [...inputText.value]

  return chars.map(ch => {
    let dotArr = null
    if (mode.value === 'toBraille') {
      dotArr = charToDots[ch] || null
    } else {
      dotArr = unicodeToDots(ch)
    }
    return { char: ch, dots: dotArr || [] }
  })
})

// 对照表
const referenceTable = computed(() => {
  return 'abcdefghijklmnopqrstuvwxyz0123456789.,!?'.split('').map(ch => ({
    char: ch, dots: charToDots[ch] || []
  }))
})

const convert = () => { /* computed 自动响应 */ }

const copyOutput = () => {
  navigator.clipboard.writeText(outputText.value).then(() => {
    const btn = document.querySelector('.btn-copy')
    if (btn) {
      const orig = btn.textContent
      btn.textContent = '✅ 已复制'
      setTimeout(() => btn.textContent = orig, 1500)
    }
  })
}
</script>

<style scoped>
.tool-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem;
}
.tool-page h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}
.back-link {
  display: inline-block;
  margin-bottom: 1rem;
  color: #6b7280;
  text-decoration: none;
  font-size: 0.875rem;
}
.subtitle {
  color: #6b7280;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}
.mode-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}
.mode-btn {
  flex: 1;
  padding: 0.6rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.mode-btn.active {
  border-color: #22c55e;
  background: #f0fdf4;
  color: #16a34a;
  font-weight: 600;
}
.input-section {
  margin-bottom: 1.25rem;
}
.input-section label {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #374151;
}
.input-section textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
}
.input-section textarea:focus {
  outline: none;
  border-color: #22c55e;
  box-shadow: 0 0 0 2px rgba(34,197,94,0.15);
}
.output-section {
  margin-bottom: 1.25rem;
}
.output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}
.output-header label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #374151;
}
.btn-copy {
  padding: 0.3rem 0.75rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.8rem;
}
.btn-copy:hover {
  background: #e5e7eb;
}
.output-box {
  min-height: 60px;
  padding: 0.75rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1.5rem;
  letter-spacing: 0.15em;
  word-break: break-all;
  line-height: 2;
}
.dots-section {
  margin-bottom: 1.5rem;
}
.dots-section > label {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
  color: #374151;
}
.dots-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  max-height: 260px;
  overflow-y: auto;
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}
.dot-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}
.dot-label {
  font-size: 0.6rem;
  color: #9ca3af;
}
.reference {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1rem;
}
.reference summary {
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
  color: #374151;
}
.ref-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.ref-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.35rem;
  background: white;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
  font-size: 0.75rem;
  color: #374151;
}
@media (max-width: 640px) {
  .tool-page { padding: 1rem; }
  .output-box { font-size: 1.25rem; }
}
</style>
