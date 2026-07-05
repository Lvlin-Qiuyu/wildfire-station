<template>
  <div class="tool-page">
    <h2>📖 中英文混排优化器</h2>
    <p class="subtitle">自动在中英文之间插入空格、修正标点全半角，支持自定义规则，一键优化排版</p>

    <div class="editor-area">
      <div class="panel input-panel">
        <div class="panel-header">
          <span class="panel-title">原始文本</span>
          <button class="btn-sm" @click="pasteText">粘贴</button>
        </div>
        <textarea
          v-model="rawText"
          placeholder="粘贴需要优化的中英文混排文本到这里...&#10;&#10;例如：使用Vue3和TypeScript开发,支持React/Vue/Angular等框架."
          class="editor"
        ></textarea>
      </div>

      <div class="panel output-panel">
        <div class="panel-header">
          <span class="panel-title">优化结果</span>
          <button class="btn-sm btn-primary" @click="copyResult">{{ copyText }}</button>
        </div>
        <div v-if="rawText" class="preview" v-html="formattedHtml"></div>
        <div v-else class="preview placeholder">优化后的文本将在这里实时预览</div>
      </div>
    </div>

    <!-- 优化选项 -->
    <div class="options">
      <h3>优化选项</h3>
      <label v-for="opt in options" :key="opt.key" class="checkbox-label">
        <input type="checkbox" v-model="opt.enabled" />
        <span>{{ opt.label }}</span>
      </label>
    </div>

    <!-- 自定义规则 -->
    <div class="custom-section">
      <div class="custom-header">
        <h3>自定义替换规则</h3>
        <button class="btn-add" @click="addCustomRule">+ 添加规则</button>
      </div>
      <div v-if="customRules.length === 0" class="empty-tip">暂无自定义规则</div>
      <div v-for="(rule, i) in customRules" :key="i" class="rule-row">
        <input v-model="rule.from" class="rule-input" placeholder="查找文本" />
        <span class="rule-arrow">→</span>
        <input v-model="rule.to" class="rule-input" placeholder="替换为" />
        <button class="btn-del" @click="removeCustomRule(i)" title="删除">✕</button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats" v-if="rawText">
      <p>共 {{ rawText.length }} 字符 → 修改了 {{ changeCount }} 处</p>
    </div>

    <!-- 快速示例 -->
    <div class="notice">
      <p>💡 <strong>典型场景：</strong>技术文档排版、公众号文章、README 文件、API 文档中英文混排优化。</p>
      <p>📌 优化器会自动处理中文与英文/数字之间的间距，以及全角半角标点的统一。</p>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '中英文混排优化器 - 野火小站' })

const rawText = ref('')
const copyText = ref('复制')

// 优化选项
const options = reactive([
  { key: 'spacing', label: '中英文/数字之间加空格', enabled: true },
  { key: 'fullPunctuation', label: '中文语境下半角标点转全角', enabled: true },
  { key: 'halfPunctuation', label: '英文语境下全角标点转半角', enabled: true },
  { key: 'trimSpaces', label: '去除行首尾多余空格', enabled: true },
  { key: 'trimLines', label: '去除多余空行（连续空行合并为一个）', enabled: true },
  { key: 'fixBrackets', label: '修正括号全半角（中文环境用全角，英文用半角）', enabled: true },
])

// 自定义规则
const customRules = reactive([])

function addCustomRule() {
  customRules.push({ from: '', to: '' })
}

function removeCustomRule(i) {
  customRules.splice(i, 1)
}

const changeCount = ref(0)

// ==================== 中文标点映射（半角→全角） ====================
const halfToFullPunctuation = {
  ',': '，', '.': '。', '!': '！', '?': '？',
  ':': '：', ';': '；', '(': '（', ')': '）',
}

// ==================== 英文标点映射（全角→半角） ====================
const fullToHalfPunctuation = {
  '，': ',', '。': '.', '！': '!', '？': '?',
  '：': ':', '；': ';', '（': '(', '）': ')',
}

// CJK 字符匹配正则
const cjkRe = /[\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303f\uff00-\uffef]/

// 判断是否为中文字符
function isCJK(char) {
  return /[\u4e00-\u9fff\u3400-\u4dbf]/.test(char)
}

// ==================== 核心优化逻辑 ====================
const formatted = computed(() => {
  if (!rawText.value) return ''
  let text = rawText.value
  const original = text

  // 1. 去除行首尾多余空格
  if (options.find(o => o.key === 'trimSpaces')?.enabled) {
    text = text.split('\n').map(line => line.trim()).join('\n')
  }

  // 2. 去除多余空行
  if (options.find(o => o.key === 'trimLines')?.enabled) {
    text = text.replace(/\n{3,}/g, '\n\n')
  }

  // 3. 中文语境下半角标点转全角
  if (options.find(o => o.key === 'fullPunctuation')?.enabled) {
    for (const [half, full] of Object.entries(halfToFullPunctuation)) {
      const escaped = half.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      // 前面是中文字符或全角标点
      text = text.replace(new RegExp(`([\\u4e00-\\u9fff\\u3400-\\u4dbf\\uff00-\\uffef])\\s*${escaped}`, 'g'), `$1${full}`)
      // 后面是中文字符或全角标点
      text = text.replace(new RegExp(`${escaped}\\s*([\\u4e00-\\u9fff\\u3400-\\u4dbf\\uff00-\\uffef])`, 'g'), `${full}$1`)
      // 行首且前面有中文内容
      text = text.replace(new RegExp(`^(\\s*)${escaped}(?=[\\u4e00-\\u9fff])`, 'gm'), `$1${full}`)
    }
  }

  // 4. 英文语境下全角标点转半角
  if (options.find(o => o.key === 'halfPunctuation')?.enabled) {
    for (const [full, half] of Object.entries(fullToHalfPunctuation)) {
      const escaped = full.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      // 前后都是英文字母或数字
      text = text.replace(new RegExp(`([a-zA-Z0-9])\\s*${escaped}\\s*([a-zA-Z0-9])`, 'g'), `$1${half}$2`)
      // 英文后面跟全角标点
      text = text.replace(new RegExp(`([a-zA-Z0-9])\\s*${escaped}`, 'g'), `$1${half}`)
    }
  }

  // 5. 括号全半角修正
  if (options.find(o => o.key === 'fixBrackets')?.enabled) {
    // 中文环境：半角括号→全角
    text = text.replace(/([\u4e00-\u9fff])\(/g, '$1（')
    text = text.replace(/\)([\u4e00-\u9fff])/g, '）$1')
    text = text.replace(/\(([\u4e00-\u9fff])/g, '（$1')
    text = text.replace(/([\u4e00-\u9fff])\)/g, '$1）')
  }

  // 6. 中英文/数字之间加空格（间距优化核心）
  if (options.find(o => o.key === 'spacing')?.enabled) {
    // 中文后面跟英文字母或数字
    text = text.replace(/([\u4e00-\u9fff\u3400-\u4dbf])([a-zA-Z0-9])/g, '$1 $2')
    // 英文字母或数字后面跟中文
    text = text.replace(/([a-zA-Z0-9])([\u4e00-\u9fff\u3400-\u4dbf])/g, '$1 $2')
    // 中文后面跟特殊符号再跟英文（如 Vue3, React18）
    // 不在常见技术名词中加空格（如 Vue3, React18, Node.js）
    // 先撤销技术名词中被错误加空格的情况
    const techTerms = [
      'Vue 3', 'Vue 2', 'React 18', 'React 17', 'React 16',
      'Node js', 'CSS 3', 'HTML 5', 'iOS', 'macOS', 'iPhone',
      'iPad', 'AirPods', 'Apple Watch',
      'Wi-Fi', 'Wi Fi', 'USB C', '5 G', '4 G', '3 G',
      'H 264', 'H 265', 'MP 3', 'MP 4',
    ]
    for (const term of techTerms) {
      const correct = term.replace(/\s/g, '')
      text = text.replace(new RegExp(term.replace(/\s/g, '\\s+'), 'g'), correct)
    }
  }

  // 7. 自定义替换规则
  for (const rule of customRules) {
    if (rule.from) {
      try {
        const regex = new RegExp(rule.from, 'g')
        text = text.replace(regex, rule.to)
      } catch {
        // 正则语法错误时忽略
      }
    }
  }

  // 统计修改处数
  changeCount.value = countDiff(original, text)

  return text
})

// HTML 安全转义
const formattedHtml = computed(() => {
  return formatted.value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
})

// ==================== 工具函数 ====================
function countDiff(a, b) {
  let count = 0
  const maxLen = Math.max(a.length, b.length)
  for (let i = 0; i < maxLen; i++) {
    if (a[i] !== b[i]) count++
  }
  return count
}

function copyResult() {
  if (!formatted.value) return
  navigator.clipboard.writeText(formatted.value).then(() => {
    copyText.value = '已复制 ✓'
    setTimeout(() => { copyText.value = '复制' }, 1500)
  })
}

async function pasteText() {
  try {
    const text = await navigator.clipboard.readText()
    rawText.value = text
  } catch {
    // 剪贴板 API 可能不可用
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

h3 {
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 0.75rem;
}

.subtitle {
  color: #888;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
}

/* 编辑器 */
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
  transition: all 0.15s;
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

.editor {
  width: 100%;
  min-height: 280px;
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
  min-height: 280px;
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

/* 选项 */
.options {
  background: #fafafa;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
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
  accent-color: #10b981;
}

/* 自定义规则 */
.custom-section {
  background: white;
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.custom-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.custom-header h3 {
  margin-bottom: 0;
}

.btn-add {
  padding: 0.35rem 0.8rem;
  background: #22c55e;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: transform 0.2s;
}

.btn-add:active {
  transform: scale(0.95);
}

.empty-tip {
  text-align: center;
  color: #aaa;
  font-size: 0.9rem;
  padding: 0.8rem;
}

.rule-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.rule-input {
  flex: 1;
  padding: 0.5rem 0.7rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.9rem;
  font-family: 'Courier New', monospace;
  outline: none;
  transition: border-color 0.2s;
}

.rule-input:focus {
  border-color: #22c55e;
}

.rule-arrow {
  color: #22c55e;
  font-weight: 600;
}

.btn-del {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fef2f2;
  color: #ef4444;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  flex-shrink: 0;
  transition: background 0.2s;
}

.btn-del:hover {
  background: #fee2e2;
}

/* 统计 */
.stats {
  font-size: 0.85rem;
  color: #aaa;
  margin-bottom: 1rem;
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
  .editor-area {
    grid-template-columns: 1fr;
  }
  .rule-row {
    flex-wrap: wrap;
  }
  .rule-input {
    min-width: 0;
  }
}
</style>
