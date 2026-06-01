<template>
  <div class="tool-page">
    <h2>📖 中文文本排版美化</h2>
    <p class="subtitle">一键修正标点、中英文间距、段首缩进，让排版整齐美观</p>

    <div class="editor-area">
      <div class="panel input-panel">
        <div class="panel-header">
          <span class="panel-title">原始文本</span>
          <button class="btn-sm" @click="pasteText">粘贴</button>
        </div>
        <textarea
          v-model="rawText"
          placeholder="粘贴需要排版的中文文本到这里..."
          class="editor"
        ></textarea>
      </div>

      <div class="panel output-panel">
        <div class="panel-header">
          <span class="panel-title">排版结果</span>
          <button class="btn-sm btn-primary" @click="copyResult">复制</button>
        </div>
        <div v-if="rawText" class="preview" v-html="formattedHtml"></div>
        <div v-else class="preview placeholder">排版后的文本将在这里实时预览</div>
      </div>
    </div>

    <div class="options">
      <h3>排版选项</h3>
      <label v-for="opt in options" :key="opt.key" class="checkbox-label">
        <input type="checkbox" v-model="opt.enabled" />
        <span>{{ opt.label }}</span>
      </label>
    </div>

    <div class="stats" v-if="rawText">
      <p>共 {{ rawText.length }} 字符 → 修改了 {{ changeCount }} 处</p>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '中文文本排版 - 野火小站' })

const rawText = ref('')

const options = reactive([
  { key: 'punctuation', label: '修正全角标点（半角转全角）', enabled: true },
  { key: 'spacing', label: '中英文之间加空格', enabled: true },
  { key: 'indent', label: '段首缩进两个中文字符', enabled: true },
  { key: 'trimLines', label: '去除多余空行（连续空行变一个）', enabled: true },
  { key: 'trimSpaces', label: '去除行首尾多余空格', enabled: true },
  { key: 'trimParagraphSpace', label: '去除段首段尾多余空格', enabled: true },
])

const changeCount = ref(0)

const formatted = computed(() => {
  if (!rawText.value) return ''
  let text = rawText.value
  const original = text

  // Trim spaces per line
  if (options.find(o => o.key === 'trimSpaces')?.enabled) {
    text = text.split('\n').map(line => line.trim()).join('\n')
  }

  // Trim paragraph start/end spaces
  if (options.find(o => o.key === 'trimParagraphSpace')?.enabled) {
    text = text.trim()
  }

  // Punctuation: half-width CJK punctuation → full-width
  if (options.find(o => o.key === 'punctuation')?.enabled) {
    const map = {
      ',': '，', '.': '。', '!': '！', '?': '？',
      ':': '：', ';': '；', '(': '（', ')': '）',
      '[': '【', ']': '】', '{': '｛', '}': '｝',
    }
    // Only replace when surrounding chars are CJK
    const cjkRe = /[\u4e00-\u9fff\u3400-\u4dbf]/
    for (const [half, full] of Object.entries(map)) {
      text = text.replace(new RegExp(`([${cjkRe.source}])(\\s*)${half.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), `$1$2${full}`)
      text = text.replace(new RegExp(`${half.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s*)([${cjkRe.source}])`, 'g'), `${full}$2$3`)
    }
    // Also replace consecutive commas/periods that should be full-width in CJK context
  }

  // Spacing between CJK and English/numbers
  if (options.find(o => o.key === 'spacing')?.enabled) {
    // CJK followed by English/number
    text = text.replace(/([\u4e00-\u9fff\u3400-\u4dbf])([a-zA-Z0-9])/g, '$1 $2')
    // English/number followed by CJK
    text = text.replace(/([a-zA-Z0-9])([\u4e00-\u9fff\u3400-\u4dbf])/g, '$1 $2')
    // CJK followed by English/number after punctuation
    text = text.replace(/([，。！？：；）】｝])([a-zA-Z0-9])/g, '$1 $2')
    // English/number before CJK punctuation
    text = text.replace(/([a-zA-Z0-9])([（【｛，。！？：；])/g, '$1 $2')
  }

  // Trim multiple empty lines
  if (options.find(o => o.key === 'trimLines')?.enabled) {
    text = text.replace(/\n{3,}/g, '\n\n')
  }

  // Paragraph indent
  if (options.find(o => o.key === 'indent')?.enabled) {
    text = text.replace(/\n\s*\n/g, '\n\n')
    const paragraphs = text.split('\n')
    text = paragraphs.map((line, i) => {
      const trimmed = line.trim()
      if (trimmed && (i === 0 || paragraphs[i - 1].trim() === '')) {
        // First line of a paragraph — add indent
        return '\u3000\u3000' + trimmed
      }
      return line
    }).join('\n')
  }

  // Count changes
  changeCount.value = countDiff(original, text)

  return text
})

const formattedHtml = computed(() => {
  return formatted.value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
})

function countDiff(a, b) {
  let count = 0
  const maxLen = Math.max(a.length, b.length)
  for (let i = 0; i < maxLen; i++) {
    if (a[i] !== b[i]) count++
  }
  return count
}

function copyResult() {
  navigator.clipboard.writeText(formatted.value)
}

async function pasteText() {
  try {
    const text = await navigator.clipboard.readText()
    rawText.value = text
  } catch {
    // Clipboard API might not work in all browsers
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

.editor-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.panel {
  background: white;
  border: 1px solid #eee;
  border-radius: 12px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 1rem;
  background: #fafafa;
  border-bottom: 1px solid #eee;
}

.panel-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: #555;
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
  border-color: #ff8c42;
  color: #ff6b35;
}

.btn-sm.btn-primary {
  background: linear-gradient(135deg, #ff6b35, #ff8c42);
  color: white;
  border: none;
}

.btn-sm.btn-primary:hover {
  opacity: 0.85;
}

.editor {
  width: 100%;
  min-height: 300px;
  padding: 1rem;
  border: none;
  font-size: 0.95rem;
  line-height: 1.8;
  resize: vertical;
  font-family: inherit;
  background: white;
  box-sizing: border-box;
}

.editor:focus {
  outline: none;
}

.preview {
  padding: 1rem;
  min-height: 300px;
  line-height: 1.8;
  font-size: 0.95rem;
  color: #333;
  white-space: pre-wrap;
  word-break: break-all;
}

.preview.placeholder {
  color: #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.options {
  background: #fafafa;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
}

.options h3 {
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 0.75rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #555;
  cursor: pointer;
  margin-bottom: 0.3rem;
}

.checkbox-label input[type="checkbox"] {
  accent-color: #ff8c42;
}

.stats {
  font-size: 0.85rem;
  color: #aaa;
  margin-bottom: 1.5rem;
}

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #ff6b35;
  font-weight: 500;
}

.back-link:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .editor-area {
    grid-template-columns: 1fr;
  }
}
</style>
