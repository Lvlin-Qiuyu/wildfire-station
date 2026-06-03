<template>
  <div class="tool-page">
    <h2>🔍 正则表达式测试器</h2>

    <!-- 常用模板 -->
    <div class="templates">
      <span class="templates-label">常用模板：</span>
      <button
        v-for="t in templates"
        :key="t.name"
        class="tpl-btn"
        @click="applyTemplate(t)"
      >{{ t.name }}</button>
    </div>

    <!-- 正则输入 -->
    <div class="regex-input-row">
      <div class="regex-input-wrap">
        <span class="regex-slash">/</span>
        <input
          v-model="regexStr"
          class="regex-input"
          placeholder="输入正则表达式..."
          spellcheck="false"
        />
        <span class="regex-slash">/</span>
      </div>
      <div class="flags">
        <button
          v-for="f in ['g', 'i', 'm', 's']"
          :key="f"
          :class="['flag-btn', { active: flags.includes(f) }]"
          @click="toggleFlag(f)"
        >{{ f }}</button>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-msg">⚠️ {{ error }}</div>

    <!-- 测试文本 -->
    <div class="section">
      <label>测试文本</label>
      <textarea
        v-model="testText"
        placeholder="在这里输入要测试的文本..."
        rows="6"
        spellcheck="false"
      ></textarea>
    </div>

    <!-- 统计 -->
    <div v-if="!error && regexStr" class="stats">
      <span class="stat-item">匹配数：<strong>{{ matches.length }}</strong></span>
      <span v-if="matches.length" class="stat-item">总长度：<strong>{{ totalLen }}</strong></span>
    </div>

    <!-- 高亮文本 -->
    <div v-if="!error && regexStr && matches.length" class="section">
      <label>匹配高亮</label>
      <div class="highlight-box" v-html="highlightedHtml"></div>
    </div>

    <!-- 匹配详情 -->
    <div v-if="!error && matches.length" class="section">
      <label>匹配详情</label>
      <div class="match-list">
        <div v-for="(m, idx) in matches" :key="idx" class="match-item">
          <span class="match-idx">#{{ idx + 1 }}</span>
          <code class="match-value">{{ m[0] }}</code>
          <span class="match-pos">位置 {{ m.index }}–{{ m.index + m[0].length }}</span>
          <div v-if="m.length > 1" class="match-groups">
            <span v-for="(g, gi) in m.slice(1)" :key="gi" class="group-tag">
              ${{ gi + 1 }}: {{ g }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '正则表达式测试器 - 野火小站' })

const regexStr = ref('')
const testText = ref('')
const flags = ref(['g'])
const error = ref('')

const templates = [
  { name: '手机号', regex: '1[3-9]\\d{9}' },
  { name: '邮箱', regex: '[\\w.-]+@[\\w.-]+\\.\\w{2,}' },
  { name: '身份证', regex: '\\d{17}[\\dXx]' },
  { name: 'URL', regex: 'https?://[\\w\\-]+(\\.[\\w\\-]+)+[\\w\\-.,@?^=%&:/~+#]*' },
  { name: 'IP地址', regex: '(\\d{1,3}\\.){3}\\d{1,3}' },
  { name: '中文字符', regex: '[\\u4e00-\\u9fff]+' },
  { name: '日期', regex: '\\d{4}[-/]\\d{1,2}[-/]\\d{1,2}' },
  { name: 'HTML标签', regex: '<\\w+[^>]*>.*?</\\1>|<\\w+[^>]*/>' },
]

function applyTemplate(t) {
  regexStr.value = t.regex
}

function toggleFlag(f) {
  const arr = flags.value
  const idx = arr.indexOf(f)
  if (idx >= 0) arr.splice(idx, 1)
  else arr.push(f)
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const matches = computed(() => {
  if (!regexStr.value || !testText.value) return []
  error.value = ''
  try {
    const re = new RegExp(regexStr.value, flags.value.join(''))
    const results = []
    if (flags.value.includes('g')) {
      let m
      const safeRe = new RegExp(regexStr.value, flags.value.join(''))
      while ((m = safeRe.exec(testText.value)) !== null) {
        results.push(Array.from(m))
        if (!m[0]) safeRe.lastIndex++
      }
    } else {
      const m = re.exec(testText.value)
      if (m) results.push(Array.from(m))
    }
    return results
  } catch (e) {
    error.value = e.message.replace(/^Invalid regular expression: /, '')
    return []
  }
})

const totalLen = computed(() => matches.value.reduce((s, m) => s + m[0].length, 0))

const highlightedHtml = computed(() => {
  if (!matches.value.length) return escapeHtml(testText.value)
  const text = testText.value
  const parts = []
  let last = 0
  for (const m of matches.value) {
    const val = m[0]
    if (!val && last >= text.length) continue
    const start = m.index
    if (start > last) {
      parts.push(escapeHtml(text.slice(last, start)))
    }
    parts.push(`<span class="hl">${escapeHtml(text.slice(start, start + val.length))}</span>`)
    last = start + val.length
  }
  if (last < text.length) parts.push(escapeHtml(text.slice(last)))
  return parts.join('')
})
</script>

<style scoped>
.tool-page {
  padding-top: 0.5rem;
}
h2 {
  font-size: 1.6rem;
  margin-bottom: 1.2rem;
}
.templates {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 1.2rem;
}
.templates-label {
  font-size: 0.9rem;
  color: #888;
}
.tpl-btn {
  padding: 0.3rem 0.7rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}
.tpl-btn:hover {
  border-color: #22c55e;
  color: #22c55e;
}
.regex-input-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1rem;
}
.regex-input-wrap {
  display: flex;
  align-items: center;
  flex: 1;
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 0 0.6rem;
  background: #fff;
  transition: border-color 0.2s;
}
.regex-input-wrap:focus-within {
  border-color: #22c55e;
}
.regex-slash {
  font-size: 1.2rem;
  font-weight: 700;
  color: #22c55e;
  user-select: none;
}
.regex-input {
  flex: 1;
  border: none;
  outline: none;
  font-family: 'Courier New', monospace;
  font-size: 1.05rem;
  padding: 0.6rem 0.4rem;
  background: transparent;
}
.flags {
  display: flex;
  gap: 0.3rem;
}
.flag-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #f9f9f9;
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  font-weight: 600;
  color: #999;
  transition: all 0.2s;
}
.flag-btn.active {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: #fff;
  border-color: transparent;
}
.error-msg {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  border-radius: 8px;
  padding: 0.6rem 1rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}
.section {
  margin-bottom: 1.2rem;
}
.section label {
  display: block;
  font-weight: 600;
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 0.4rem;
}
textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: 'Courier New', monospace;
  resize: vertical;
  background: white;
  transition: border-color 0.2s;
  line-height: 1.5;
}
textarea:focus {
  outline: none;
  border-color: #10b981;
}
.stats {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  font-size: 0.95rem;
  color: #555;
}
.stat-item strong {
  color: #22c55e;
}
.highlight-box {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fafafa;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-all;
}
.match-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.match-item {
  padding: 0.6rem 0.8rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
}
.match-idx {
  font-size: 0.8rem;
  font-weight: 700;
  color: #22c55e;
  background: #f0fdf4;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
}
.match-value {
  font-size: 0.9rem;
  background: #fef9c3;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  word-break: break-all;
}
.match-pos {
  font-size: 0.8rem;
  color: #aaa;
}
.match-groups {
  width: 100%;
  padding-left: 2.2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}
.group-tag {
  font-size: 0.8rem;
  background: #e0f2fe;
  color: #0369a1;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
}
.back-link {
  display: inline-block;
  margin-top: 2.5rem;
  color: #22c55e;
  font-weight: 500;
}
.back-link:hover {
  text-decoration: underline;
}
</style>

<style>
.highlight-box .hl {
  background: #bbf7d0;
  border-radius: 3px;
  padding: 1px 2px;
  box-shadow: 0 0 0 1px #86efac;
}
</style>
