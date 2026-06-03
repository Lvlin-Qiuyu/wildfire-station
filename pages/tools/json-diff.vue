<template>
  <div class="tool-page">
    <h2>📄 JSON 对比工具</h2>

    <div class="options-row">
      <label class="toggle-label">
        <input type="checkbox" v-model="ignoreOrder" />
        忽略数组顺序
      </label>
    </div>

    <div class="panels">
      <div class="panel">
        <label>JSON A（左侧）</label>
        <textarea
          v-model="jsonA"
          placeholder="粘贴或输入 JSON..."
          rows="10"
          spellcheck="false"
          @paste="onPasteA"
        ></textarea>
        <div v-if="errorA" class="parse-error">⚠️ {{ errorA }}</div>
      </div>

      <div class="panel">
        <label>JSON B（右侧）</label>
        <textarea
          v-model="jsonB"
          placeholder="粘贴或输入 JSON..."
          rows="10"
          spellcheck="false"
          @paste="onPasteB"
        ></textarea>
        <div v-if="errorB" class="parse-error">⚠️ {{ errorB }}</div>
      </div>
    </div>

    <!-- 统计 -->
    <div v-if="stats" class="stats-bar">
      <span class="stat added">+ {{ stats.added }} 新增</span>
      <span class="stat removed">- {{ stats.removed }} 删除</span>
      <span class="stat changed">~ {{ stats.changed }} 修改</span>
      <span class="stat equal">= {{ stats.equal }} 相同</span>
    </div>

    <!-- Diff 结果 -->
    <div v-if="diffResult.length" class="section">
      <label>对比结果</label>
      <div class="diff-list">
        <div v-for="(item, idx) in diffResult" :key="idx" :class="['diff-item', item.type]">
          <span class="diff-icon">{{ item.type === 'added' ? '+' : item.type === 'removed' ? '−' : item.type === 'changed' ? '~' : '=' }}</span>
          <span class="diff-path">{{ item.path }}</span>
          <span class="diff-val-old" v-if="item.type === 'removed' || item.type === 'changed'">
            {{ formatVal(item.oldVal) }}
          </span>
          <span class="diff-arrow" v-if="item.type === 'changed'">→</span>
          <span class="diff-val-new" v-if="item.type === 'added' || item.type === 'changed'">
            {{ formatVal(item.newVal) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 格式化预览 -->
    <div class="section" style="display:flex;gap:1rem;">
      <div class="panel" style="flex:1">
        <label>格式化 A</label>
        <pre class="formatted" v-html="highlightJSON(parsedA, errorA)"></pre>
      </div>
      <div class="panel" style="flex:1">
        <label>格式化 B</label>
        <pre class="formatted" v-html="highlightJSON(parsedB, errorB)"></pre>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'JSON 对比工具 - 野火小站' })

const jsonA = ref('')
const jsonB = ref('')
const ignoreOrder = ref(false)

function tryParse(raw) {
  if (!raw.trim()) return { data: null, error: '' }
  try {
    return { data: JSON.parse(raw), error: '' }
  } catch (e) {
    return { data: null, error: e.message }
  }
}

function onPasteA(e) {
  setTimeout(() => {
    const r = tryParse(jsonA.value)
    if (!r.error && r.data !== null) {
      jsonA.value = JSON.stringify(r.data, null, 2)
    }
  }, 0)
}
function onPasteB(e) {
  setTimeout(() => {
    const r = tryParse(jsonB.value)
    if (!r.error && r.data !== null) {
      jsonB.value = JSON.stringify(r.data, null, 2)
    }
  }, 0)
}

const { data: parsedA, error: errorA } = (() => {
  const data = computed(() => tryParse(jsonA.value).data)
  const error = computed(() => tryParse(jsonA.value).error)
  return { data, error }
})()
const { data: parsedB, error: errorB } = (() => {
  const data = computed(() => tryParse(jsonB.value).data)
  const error = computed(() => tryParse(jsonB.value).error)
  return { data, error }
})()

// 递归比较
function compare(a, b, path, ignoreArrayOrder) {
  const result = []
  if (a === b) return result

  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    result.push({ type: 'changed', path, oldVal: a, newVal: b })
    return result
  }

  if (Array.isArray(a) !== Array.isArray(b)) {
    result.push({ type: 'changed', path, oldVal: a, newVal: b })
    return result
  }

  if (Array.isArray(a)) {
    if (ignoreArrayOrder) {
      const sortedA = [...a].sort(JSON.stringify)
      const sortedB = [...b].sort(JSON.stringify)
      const max = Math.max(sortedA.length, sortedB.length)
      // Count by sorted comparison
      const usedB = new Set()
      for (let i = 0; i < sortedA.length; i++) {
        const ai = sortedA[i]
        let found = false
        for (let j = 0; j < sortedB.length; j++) {
          if (usedB.has(j)) continue
          if (JSON.stringify(ai) === JSON.stringify(sortedB[j])) {
            usedB.add(j)
            found = true
            break
          }
        }
        if (!found) {
          result.push({ type: 'removed', path: `${path}[${i}]`, oldVal: ai, newVal: undefined })
        }
      }
      for (let j = 0; j < sortedB.length; j++) {
        if (!usedB.has(j)) {
          result.push({ type: 'added', path: `${path}[${j}]`, oldVal: undefined, newVal: sortedB[j] })
        }
      }
    } else {
      const max = Math.max(a.length, b.length)
      for (let i = 0; i < max; i++) {
        const p = `${path}[${i}]`
        if (i >= a.length) {
          result.push({ type: 'added', path: p, oldVal: undefined, newVal: b[i] })
        } else if (i >= b.length) {
          result.push({ type: 'removed', path: p, oldVal: a[i], newVal: undefined })
        } else {
          result.push(...compare(a[i], b[i], p, ignoreArrayOrder))
        }
      }
    }
    return result
  }

  // Object
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const key of allKeys) {
    const p = path ? `${path}.${key}` : `$${key}`
    if (!(key in a)) {
      result.push({ type: 'added', path: p, oldVal: undefined, newVal: b[key] })
    } else if (!(key in b)) {
      result.push({ type: 'removed', path: p, oldVal: a[key], newVal: undefined })
    } else {
      result.push(...compare(a[key], b[key], p, ignoreArrayOrder))
    }
  }
  return result
}

const diffResult = computed(() => {
  if (parsedA.value === null || parsedB.value === null) return []
  if (errorA.value || errorB.value) return []
  return compare(parsedA.value, parsedB.value, '', ignoreOrder.value)
})

const stats = computed(() => {
  if (!diffResult.value.length) return null
  let added = 0, removed = 0, changed = 0, equal = 0
  for (const d of diffResult.value) {
    if (d.type === 'added') added++
    else if (d.type === 'removed') removed++
    else if (d.type === 'changed') changed++
    else equal++
  }
  return { added, removed, changed, equal }
})

function formatVal(v) {
  if (v === undefined) return 'undefined'
  return typeof v === 'object' ? JSON.stringify(v, null, 0) : String(v)
}

// JSON 语法高亮
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function highlightJSON(data, error) {
  if (error || data === null || data === undefined) return '<span style="color:#aaa">等待输入...</span>'
  const raw = JSON.stringify(data, null, 2)
  return raw.replace(/("(?:\\.|[^"\\])*")\s*:/g, '<span style="color:#7c3aed">$1</span>:')
    .replace(/:\s*("(?:\\.|[^"\\])*")/g, ': <span style="color:#16a34a">$1</span>')
    .replace(/:\s*(-?\d+\.?\d*(?:[eE][+-]?\d+)?)/g, ': <span style="color:#2563eb">$1</span>')
    .replace(/:\s*(true|false)/g, ': <span style="color:#dc2626">$1</span>')
    .replace(/:\s*(null)/g, ': <span style="color:#999">$1</span>')
}
</script>

<style scoped>
.tool-page {
  padding-top: 0.5rem;
}
h2 {
  font-size: 1.6rem;
  margin-bottom: 1.2rem;
}
.options-row {
  margin-bottom: 1rem;
}
.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  font-size: 0.95rem;
  color: #555;
}
.toggle-label input[type="checkbox"] {
  accent-color: #22c55e;
  width: 16px;
  height: 16px;
}
.panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}
.panel {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.panel label {
  font-weight: 600;
  font-size: 0.95rem;
  color: #555;
}
textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
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
.parse-error {
  font-size: 0.85rem;
  color: #dc2626;
}
.stats-bar {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
  font-size: 0.95rem;
}
.stat {
  padding: 0.3rem 0.8rem;
  border-radius: 6px;
  font-weight: 600;
}
.stat.added { background: #f0fdf4; color: #16a34a; }
.stat.removed { background: #fef2f2; color: #dc2626; }
.stat.changed { background: #fef9c3; color: #a16207; }
.stat.equal { background: #f3f4f6; color: #6b7280; }
.section {
  margin-bottom: 1.2rem;
}
.section > label {
  display: block;
  font-weight: 600;
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 0.4rem;
}
.diff-list {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  max-height: 400px;
  overflow-y: auto;
}
.diff-item {
  padding: 0.45rem 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.88rem;
  border-bottom: 1px solid #f3f4f6;
  font-family: 'Courier New', monospace;
}
.diff-item:last-child { border-bottom: none; }
.diff-item.added { background: #f0fdf4; }
.diff-item.removed { background: #fef2f2; }
.diff-item.changed { background: #fffbeb; }
.diff-item.equal { background: #f9fafb; }
.diff-icon {
  font-weight: 700;
  width: 16px;
  text-align: center;
  flex-shrink: 0;
}
.diff-item.added .diff-icon { color: #16a34a; }
.diff-item.removed .diff-icon { color: #dc2626; }
.diff-item.changed .diff-icon { color: #a16207; }
.diff-item.equal .diff-icon { color: #9ca3af; }
.diff-path {
  color: #7c3aed;
  font-weight: 600;
  flex-shrink: 0;
}
.diff-val-old {
  color: #dc2626;
  word-break: break-all;
}
.diff-val-new {
  color: #16a34a;
  word-break: break-all;
}
.diff-arrow {
  color: #a16207;
  flex-shrink: 0;
}
.formatted {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fafafa;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
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
@media (max-width: 640px) {
  .panels {
    grid-template-columns: 1fr;
  }
}
</style>
