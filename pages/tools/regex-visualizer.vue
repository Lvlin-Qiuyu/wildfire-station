<template>
  <div class="tool-page">
    <h2>🔍 正则表达式可视化调试器</h2>
    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>

    <div class="input-section">
      <div class="input-row">
        <div class="input-group">
          <label>正则表达式</label>
          <div class="regex-input-wrap">
            <span class="slash">/</span>
            <input v-model="pattern" placeholder="输入正则表达式..." spellcheck="false" @input="updateRegex" />
            <span class="slash">/</span>
            <input v-model="flags" class="flags-input" placeholder="gi" maxlength="5" @input="updateRegex" />
          </div>
        </div>
      </div>
      <div class="input-group" style="margin-top:12px">
        <label>测试文本</label>
        <textarea v-model="testText" placeholder="输入测试文本..." rows="4" spellcheck="false"></textarea>
      </div>
    </div>

    <!-- 正则结构解析 -->
    <div v-if="parsedTokens.length" class="section">
      <h3>🧩 正则结构解析</h3>
      <div class="token-list">
        <span v-for="(token, idx) in parsedTokens" :key="idx" :class="['token', token.type]" :title="token.desc">
          {{ token.text }}
        </span>
      </div>
      <div class="legend">
        <span class="legend-item"><span class="dot literal"></span>字面量</span>
        <span class="legend-item"><span class="dot charset"></span>字符类</span>
        <span class="legend-item"><span class="dot quantifier"></span>量词</span>
        <span class="legend-item"><span class="dot group"></span>分组</span>
        <span class="legend-item"><span class="dot anchor"></span>锚点</span>
        <span class="legend-item"><span class="dot escape"></span>转义</span>
      </div>
    </div>

    <!-- 匹配结果 -->
    <div v-if="matchResults.length" class="section">
      <h3>✅ 匹配结果（{{ matchResults.length }} 个匹配）</h3>
      <div class="match-text">
        <template v-for="(seg, idx) in highlightSegments" :key="idx">
          <span v-if="seg.match" class="match-highlight">{{ seg.text }}</span>
          <span v-else>{{ seg.text }}</span>
        </template>
      </div>

      <!-- 捕获组 -->
      <div v-if="captureGroups.length" class="captures">
        <h4>捕获组</h4>
        <div v-for="(cg, i) in captureGroups" :key="i" class="capture-item">
          <span class="group-label">$({{ i + 1 }})</span>
          <code v-for="(val, j) in cg.values" :key="j" class="group-val">{{ val }}</code>
        </div>
      </div>
    </div>

    <div v-if="errorMsg" class="error-msg">⚠️ {{ errorMsg }}</div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

useHead({ title: '正则表达式可视化调试器 - 野火小站' })

const pattern = ref('')
const flags = ref('g')
const testText = ref('')
const errorMsg = ref('')

const parsedTokens = computed(() => {
  if (!pattern.value) return []
  const tokens = []
  let i = 0
  const p = pattern.value
  while (i < p.length) {
    if (p[i] === '\\' && i + 1 < p.length) {
      tokens.push({ text: p.slice(i, i + 2), type: 'escape', desc: '转义序列' })
      i += 2
    } else if (p[i] === '[') {
      let j = i + 1
      if (j < p.length && p[j] === '^') j++
      if (j < p.length && p[j] === ']') j++
      while (j < p.length && p[j] !== ']') { if (p[j] === '\\' && j + 1 < p.length) j++; j++ }
      tokens.push({ text: p.slice(i, j + 1), type: 'charset', desc: '字符类' })
      i = j + 1
    } else if (p[i] === '(') {
      let j = i
      let depth = 0
      while (j < p.length) {
        if (p[j] === '[') { while (j < p.length && p[j] !== ']') j++; }
        if (p[j] === '(') depth++
        if (p[j] === ')') { depth--; if (depth === 0) break; }
        if (p[j] === '\\' && j + 1 < p.length) j++
        j++
      }
      const closing = j < p.length ? j + 1 : p.length
      const content = p.slice(i, closing)
      if (content.startsWith('(?=') || content.startsWith('(?!') || content.startsWith('(?<=') || content.startsWith('(?<!')) {
        tokens.push({ text: content, type: 'lookaround', desc: '断言/环视' })
      } else if (content.startsWith('?:')) {
        tokens.push({ text: content, type: 'group', desc: '非捕获分组' })
      } else if (content.startsWith('(?<')) {
        tokens.push({ text: content, type: 'group', desc: '命名分组' })
      } else {
        tokens.push({ text: content, type: 'group', desc: '捕获分组' })
      }
      i = closing
    } else if ('*+?{'.includes(p[i])) {
      let j = i
      if (p[i] === '{') { while (j < p.length && p[j] !== '}') j++; j++ }
      else if (p[i] === '?' && i + 1 < p.length && (p[i + 1] === '?' || p[i + 1] === '=' || p[i + 1] === '!')) { j += 2 }
      else { j++ }
      tokens.push({ text: p.slice(i, j), type: 'quantifier', desc: '量词' })
      i = j
    } else if (p[i] === '^' || p[i] === '$') {
      tokens.push({ text: p[i], type: 'anchor', desc: p[i] === '^' ? '行首锚点' : '行尾锚点' })
      i++
    } else if (p[i] === '|' && (i === 0 || !isGroupOpen(tokens))) {
      tokens.push({ text: '|', type: 'alternation', desc: '或' })
      i++
    } else if (p[i] === '|' && i > 0) {
      tokens.push({ text: '|', type: 'alternation', desc: '或' })
      i++
    } else if (p[i] === '.') {
      tokens.push({ text: '.', type: 'charset', desc: '任意字符' })
      i++
    } else if (p[i] === ')') {
      tokens.push({ text: ')', type: 'group', desc: '分组结束' })
      i++
    } else {
      let j = i
      while (j < p.length && !'\\[*+?{()|^$.]'.includes(p[j])) j++
      tokens.push({ text: p.slice(i, j), type: 'literal', desc: '字面量' })
      i = j
    }
  }
  return tokens
})

function isGroupOpen(tokens) {
  let depth = 0
  for (const t of tokens) {
    if (t.type === 'group' && t.text.endsWith(')')) continue
    if (t.text.startsWith('(')) depth++
  }
  return depth > 0
}

const matchResults = computed(() => {
  if (!pattern.value || !testText.value) return []
  errorMsg.value = ''
  try {
    const re = new RegExp(pattern.value, flags.value)
    const results = []
    if (flags.value.includes('g')) {
      let m
      while ((m = re.exec(testText.value)) !== null) {
        results.push(m)
        if (m[0].length === 0) re.lastIndex++
      }
    } else {
      const m = re.exec(testText.value)
      if (m) results.push(m)
    }
    return results
  } catch (e) {
    errorMsg.value = e.message
    return []
  }
})

const highlightSegments = computed(() => {
  if (!matchResults.value.length) return []
  const segs = []
  let lastEnd = 0
  for (const m of matchResults.value) {
    if (m.index > lastEnd) segs.push({ text: testText.value.slice(lastEnd, m.index), match: false })
    segs.push({ text: m[0], match: true })
    lastEnd = m.index + m[0].length
  }
  if (lastEnd < testText.value.length) segs.push({ text: testText.value.slice(lastEnd), match: false })
  return segs
})

const captureGroups = computed(() => {
  const groups = []
  for (const m of matchResults.value) {
    for (let i = 1; i < m.length; i++) {
      if (!groups[i - 1]) groups[i - 1] = { values: [] }
      if (m[i] !== undefined) groups[i - 1].values.push(m[i])
    }
  }
  return groups
})

function updateRegex() { /* reactive via computed */ }
</script>

<style scoped>
.tool-page { max-width: 800px; margin: 0 auto; padding: 20px; }
.back-link { display: inline-block; margin-bottom: 16px; color: #10b981; text-decoration: none; }
.back-link:hover { text-decoration: underline; }
h2 { color: #1a1a2e; margin-bottom: 20px; }
.input-section { margin-bottom: 20px; }
.input-row { display: flex; gap: 12px; }
.input-group { flex: 1; }
.input-group label { display: block; font-size: 14px; color: #555; margin-bottom: 6px; }
.regex-input-wrap { display: flex; align-items: center; border: 2px solid #ddd; border-radius: 8px; overflow: hidden; transition: border-color 0.2s; }
.regex-input-wrap:focus-within { border-color: #22c55e; }
.slash { padding: 0 10px; color: #22c55e; font-weight: bold; font-size: 18px; user-select: none; }
.regex-input-wrap input[type="text"] { flex: 1; padding: 10px; border: none; font-family: 'Courier New', monospace; font-size: 15px; outline: none; }
.flags-input { width: 40px !important; text-align: center; border-left: 1px solid #ddd; font-weight: bold; }
textarea { width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 14px; resize: vertical; box-sizing: border-box; }
textarea:focus { border-color: #22c55e; outline: none; }
.section { margin-top: 20px; }
.section h3 { font-size: 16px; color: #1a1a2e; margin-bottom: 10px; }
.token-list { display: flex; flex-wrap: wrap; gap: 4px; padding: 12px; background: #f8f9fa; border-radius: 8px; }
.token { padding: 4px 8px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 14px; }
.token.literal { background: #fef3c7; color: #92400e; }
.token.charset { background: #dbeafe; color: #1e40af; }
.token.quantifier { background: #fce7f3; color: #9d174d; }
.token.group { background: #d1fae5; color: #065f46; }
.token.anchor { background: #e0e7ff; color: #3730a3; }
.token.escape { background: #fee2e2; color: #991b1b; }
.token.alternation { background: #f3e8ff; color: #6b21a8; }
.token.lookaround { background: #ccfbf1; color: #134e4a; }
.legend { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; font-size: 13px; color: #555; }
.legend-item { display: flex; align-items: center; gap: 4px; }
.dot { width: 10px; height: 10px; border-radius: 2px; }
.dot.literal { background: #fef3c7; border: 1px solid #f59e0b; }
.dot.charset { background: #dbeafe; border: 1px solid #3b82f6; }
.dot.quantifier { background: #fce7f3; border: 1px solid #ec4899; }
.dot.group { background: #d1fae5; border: 1px solid #10b981; }
.dot.anchor { background: #e0e7ff; border: 1px solid #6366f1; }
.dot.escape { background: #fee2e2; border: 1px solid #ef4444; }
.match-text { padding: 12px; background: #f8f9fa; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.8; word-break: break-all; }
.match-highlight { background: rgba(34, 197, 94, 0.3); border-radius: 3px; padding: 2px 0; border-bottom: 2px solid #22c55e; }
.captures { margin-top: 12px; }
.captures h4 { font-size: 14px; color: #555; margin-bottom: 8px; }
.capture-item { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.group-label { background: #22c55e; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
.group-val { background: #f0fdf4; padding: 2px 8px; border-radius: 4px; font-size: 13px; }
.error-msg { color: #ef4444; margin-top: 12px; padding: 10px; background: #fef2f2; border-radius: 8px; }
@media (max-width: 600px) { .tool-page { padding: 12px; } .input-row { flex-direction: column; } }
</style>
