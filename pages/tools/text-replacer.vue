<template>
  <div class="tool-page">
    <h2>🔤 多规则文本批量替换器</h2>
    <p class="subtitle">添加多组查找替换规则（支持正则），一键全部应用，实时预览替换前后对比</p>

    <!-- 输入区域 -->
    <div class="editor-area">
      <div class="panel input-panel">
        <div class="panel-header">
          <span class="panel-title">原始文本</span>
          <div class="panel-actions">
            <button class="btn-sm" @click="clearInput">清空</button>
            <button class="btn-sm" @click="pasteText">粘贴</button>
          </div>
        </div>
        <textarea
          v-model="rawText"
          placeholder="粘贴需要批量替换的文本到这里..."
          class="editor"
        ></textarea>
      </div>

      <div class="panel output-panel">
        <div class="panel-header">
          <span class="panel-title">替换结果</span>
          <button class="btn-sm btn-primary" @click="copyResult">{{ copyBtnText }}</button>
        </div>
        <div v-if="rawText && rules.length" class="preview diff-preview" v-html="diffHtml"></div>
        <div v-else class="preview placeholder">替换后的文本将在这里实时预览，差异部分会高亮显示</div>
      </div>
    </div>

    <!-- 替换规则列表 -->
    <div class="rules-section">
      <div class="rules-header">
        <h3>替换规则</h3>
        <div class="rules-actions">
          <button class="btn-sm" @click="addRule">+ 添加规则</button>
          <button class="btn-sm" @click="clearAllRules">清空规则</button>
        </div>
      </div>

      <div v-for="(rule, index) in rules" :key="rule.id" class="rule-card">
        <div class="rule-top">
          <span class="rule-num">规则 {{ index + 1 }}</span>
          <button class="btn-del" @click="removeRule(index)" title="删除此规则">×</button>
        </div>
        <div class="rule-fields">
          <div class="field-group">
            <label>查找</label>
            <input
              type="text"
              v-model="rule.search"
              placeholder="要查找的文本或正则表达式..."
              class="rule-input"
            />
          </div>
          <div class="field-group">
            <label>替换为</label>
            <input
              type="text"
              v-model="rule.replace"
              placeholder="替换后的文本..."
              class="rule-input"
            />
          </div>
        </div>
        <div class="rule-options">
          <label class="checkbox-label">
            <input type="checkbox" v-model="rule.regex" />
            <span>正则表达式</span>
          </label>
          <label class="checkbox-label" v-if="rule.regex">
            <input type="checkbox" v-model="rule.caseSensitive" />
            <span>大小写敏感</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="rule.wholeWord" />
            <span>全词匹配</span>
          </label>
          <span v-if="rule.regex && rule.error" class="rule-error">⚠️ {{ rule.error }}</span>
          <span v-else-if="rule.search && getMatchCount(rule)" class="rule-match">
            匹配 {{ getMatchCount(rule) }} 处
          </span>
        </div>
      </div>

      <div v-if="rules.length === 0" class="empty-rules">
        暂无规则，点击上方按钮添加
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats" v-if="rawText && rules.length">
      <p>共 {{ rawText.length }} 字符 · {{ rules.length }} 条规则 · 替换了 {{ totalReplacements }} 处</p>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '多规则文本批量替换器 - 野火小站' })

const rawText = ref('')
const copyBtnText = ref('复制')

// 规则列表，每个规则有唯一 id
let ruleIdCounter = 0
const rules = ref([])

function createRule() {
  return {
    id: ++ruleIdCounter,
    search: '',
    replace: '',
    regex: false,
    caseSensitive: false,
    wholeWord: false,
    error: '',
  }
}

function addRule() {
  rules.value.push(createRule())
}

function removeRule(index) {
  rules.value.splice(index, 1)
}

function clearAllRules() {
  rules.value = []
}

function clearInput() {
  rawText.value = ''
}

async function pasteText() {
  try {
    const text = await navigator.clipboard.readText()
    rawText.value = text
  } catch {
    // 剪贴板 API 可能不可用
  }
}

// 对单条规则获取匹配数
function getMatchCount(rule) {
  if (!rule.search || !rawText.value) return 0
  try {
    const pattern = buildPattern(rule)
    if (!pattern) return 0
    return (rawText.value.match(new RegExp(pattern, buildFlags(rule))) || []).length
  } catch {
    return 0
  }
}

// 构建正则 pattern 字符串
function buildPattern(rule) {
  if (!rule.search) return ''
  if (rule.regex) {
    // 验证正则是否合法
    try {
      new RegExp(rule.search)
      rule.error = ''
    } catch (e) {
      rule.error = e.message
      return ''
    }
    return rule.search
  } else {
    // 普通文本：转义特殊字符
    return rule.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
}

// 构建 flags
function buildFlags(rule) {
  const flags = ['g']
  if (!rule.caseSensitive) flags.push('i')
  return flags.join('')
}

// 应用全部规则，返回替换后的文本
const replacedText = computed(() => {
  if (!rawText.value) return ''
  let text = rawText.value
  for (const rule of rules.value) {
    if (!rule.search) continue
    const pattern = buildPattern(rule)
    if (!pattern) continue

    let flags = buildFlags(rule)
    let finalPattern = pattern

    // 全词匹配：包裹 \b
    if (rule.wholeWord) {
      finalPattern = `\\b${pattern}\\b`
    }

    try {
      const regex = new RegExp(finalPattern, flags)
      text = text.replace(regex, rule.replace)
    } catch {
      // 跳过无效规则
    }
  }
  return text
})

// 计算总替换次数
const totalReplacements = computed(() => {
  if (!rawText.value || !rules.value.length) return 0
  let count = 0
  for (const rule of rules.value) {
    if (!rule.search) continue
    try {
      const pattern = buildPattern(rule)
      if (!pattern) continue
      let finalPattern = pattern
      if (rule.wholeWord) finalPattern = `\\b${pattern}\\b`
      const regex = new RegExp(finalPattern, buildFlags(rule))
      const matches = rawText.value.match(regex)
      if (matches) count += matches.length
    } catch {
      // 跳过
    }
  }
  return count
})

// 生成差异高亮 HTML（逐字符比较太细，按行比较更好）
const diffHtml = computed(() => {
  if (!replacedText.value) return ''

  // 对替换后文本进行高亮：找到每条规则替换的部分并高亮
  const original = rawText.value
  const replaced = replacedText.value

  // 简单方案：逐字符对比，相同部分正常显示，不同部分高亮
  let html = ''
  const maxLen = Math.max(original.length, replaced.length)
  let diffStart = -1

  for (let i = 0; i <= maxLen; i++) {
    const origChar = i < original.length ? original[i] : null
    const replChar = i < replaced.length ? replaced[i] : null

    if (origChar !== replChar) {
      // 开始差异段
      if (diffStart === -1) diffStart = i
    } else {
      // 结束差异段
      if (diffStart !== -1) {
        // 输出差异段（高亮显示替换后的内容）
        const diffText = replaced.substring(diffStart, i)
        html += `<span class="diff-highlight">${escapeHtml(diffText)}</span>`
        diffStart = -1
      }
      // 输出相同字符
      if (replChar !== null) {
        html += escapeHtml(replChar)
      }
    }
  }
  // 处理尾部差异
  if (diffStart !== -1) {
    const diffText = replaced.substring(diffStart)
    html += `<span class="diff-highlight">${escapeHtml(diffText)}</span>`
  }

  // 换行转 <br>
  html = html.replace(/\n/g, '<br>')

  return html
})

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function copyResult() {
  if (!replacedText.value) return
  navigator.clipboard.writeText(replacedText.value).then(() => {
    copyBtnText.value = '已复制 ✓'
    setTimeout(() => { copyBtnText.value = '复制' }, 1500)
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

.panel-actions {
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

/* 差异高亮 */
.diff-highlight {
  background: rgba(34, 197, 94, 0.2);
  color: #15803d;
  border-radius: 3px;
  padding: 0 2px;
  border-bottom: 2px solid #22c55e;
}

/* 规则区域 */
.rules-section {
  background: #fafafa;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
}

.rules-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.rules-header h3 {
  font-size: 0.95rem;
  color: #555;
}

.rules-actions {
  display: flex;
  gap: 0.4rem;
}

.rule-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 0.8rem 1rem;
  margin-bottom: 0.6rem;
}

.rule-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.rule-num {
  font-size: 0.82rem;
  font-weight: 600;
  color: #10b981;
}

.btn-del {
  width: 22px;
  height: 22px;
  border: none;
  background: #fee2e2;
  color: #ef4444;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  line-height: 1;
  transition: opacity 0.2s;
}

.btn-del:hover {
  opacity: 0.7;
}

.rule-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
  margin-bottom: 0.5rem;
}

.field-group label {
  display: block;
  font-size: 0.8rem;
  color: #888;
  margin-bottom: 0.25rem;
}

.rule-input {
  width: 100%;
  padding: 0.45rem 0.6rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.rule-input:focus {
  border-color: #10b981;
}

.rule-options {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.82rem;
  color: #666;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  accent-color: #10b981;
}

.rule-error {
  font-size: 0.8rem;
  color: #ef4444;
}

.rule-match {
  font-size: 0.8rem;
  color: #10b981;
}

.empty-rules {
  text-align: center;
  color: #bbb;
  padding: 1.5rem;
  font-size: 0.9rem;
}

.stats {
  font-size: 0.85rem;
  color: #aaa;
  margin-bottom: 1.5rem;
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
  .rule-fields {
    grid-template-columns: 1fr;
  }
}
</style>
