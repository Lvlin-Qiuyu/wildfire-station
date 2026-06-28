<template>
  <div class="tool-page">
    <h2>🧮 JSONPath 查询测试器</h2>
    <p class="tool-desc">输入 JSON 数据和 JSONPath 表达式，实时匹配并展示结果</p>

    <!-- 预设示例 -->
    <div class="presets-row">
      <label>预设示例:</label>
      <select v-model="selectedPreset" @change="applyPreset" class="preset-select">
        <option value="">选择示例...</option>
        <option v-for="(p, i) in presets" :key="i" :value="i">{{ p.name }}</option>
      </select>
      <button class="btn-action" @click="clearAll">🗑️ 清空</button>
      <button class="btn-ref-toggle" @click="showRef = !showRef">
        {{ showRef ? '收起语法参考' : '📖 语法参考' }}
      </button>
    </div>

    <!-- 语法参考面板 -->
    <div v-if="showRef" class="ref-panel">
      <table>
        <thead>
          <tr><th>语法</th><th>说明</th><th>示例</th></tr>
        </thead>
        <tbody>
          <tr><td><code>$</code></td><td>根节点</td><td><code>$</code></td></tr>
          <tr><td><code>.</code></td><td>子节点</td><td><code>$.store</code></td></tr>
          <tr><td><code>..</code></td><td>递归下降</td><td><code>$..author</code></td></tr>
          <tr><td><code>[n]</code></td><td>数组索引</td><td><code>$.books[0]</code></td></tr>
          <tr><td><code>[start:end]</code></td><td>数组切片</td><td><code>$.books[0:2]</code></td></tr>
          <tr><td><code>[*]</code></td><td>所有元素</td><td><code>$.books[*]</code></td></tr>
          <tr><td><code>[?()]</code></td><td>过滤表达式</td><td><code>$[?(@.price < 10)]</code></td></tr>
          <tr><td><code>@</code></td><td>当前节点</td><td><code>$[?(@.age > 18)]</code></td></tr>
          <tr><td><code>[,]</code></td><td>多选</td><td><code>$.books[0,2]</code></td></tr>
          <tr><td><code>length()</code></td><td>长度</td><td><code>$.books.length()</code></td></tr>
        </tbody>
      </table>
    </div>

    <!-- JSON 输入 -->
    <div class="input-area">
      <div class="panel-header">
        <label>JSON 数据</label>
        <button class="btn-action" @click="formatJson">🔄 格式化</button>
      </div>
      <textarea
        v-model="inputJson"
        placeholder="粘贴 JSON 数据..."
        rows="10"
        spellcheck="false"
        @input="runQuery"
      ></textarea>
      <div v-if="parseError" class="error-msg">
        <span class="error-icon">⚠️</span>
        <span>{{ parseError }}</span>
      </div>
    </div>

    <!-- JSONPath 表达式 -->
    <div class="expression-area">
      <label>JSONPath 表达式</label>
      <div class="expression-row">
        <span class="dollar-sign">$</span>
        <input
          v-model="pathExpression"
          placeholder="..store.book[*].author"
          spellcheck="false"
          @input="runQuery"
        />
      </div>
    </div>

    <!-- 结果展示 -->
    <div class="result-area">
      <div class="panel-header">
        <label>查询结果 <span v-if="resultCount >= 0" class="result-count">({{ resultCount }} 条)</span></label>
        <button v-if="resultJson" class="btn-action" @click="copyResult">{{ copyText }}</button>
      </div>
      <div class="result-box" v-if="resultJson">
        <pre><code v-html="highlightedResult"></code></pre>
      </div>
      <div v-else class="placeholder">
        {{ inputJson.trim() ? '结果将显示在这里' : '请先输入 JSON 数据' }}
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'JSONPath 查询测试器 - 野火小站' })

useHead({
  script: [
    { src: 'https://cdn.jsdelivr.net/npm/jsonpath-plus@7.2.0/dist/index-browser-umd.cjs', defer: true }
  ]
})

const inputJson = ref('')
const pathExpression = ref('')
const resultJson = ref('')
const parseError = ref('')
const resultCount = ref(-1)
const showRef = ref(false)
const selectedPreset = ref('')
const copyText = ref('复制结果')

// 预设示例
const presets = [
  {
    name: '书店 — 提取所有书名',
    json: `{
  "store": {
    "book": [
      { "category": "reference", "author": "Nigel Rees", "title": "Sayings of the Century", "price": 8.95 },
      { "category": "fiction", "author": "Evelyn Waugh", "title": "Sword of Honour", "price": 12.99 },
      { "category": "fiction", "author": "Herman Melville", "title": "Moby Dick", "isbn": "0-553-21311-3", "price": 8.99 },
      { "category": "fiction", "author": "J. R. R. Tolkien", "title": "The Lord of the Rings", "isbn": "0-395-19395-8", "price": 22.99 }
    ],
    "bicycle": { "color": "red", "price": 19.95 }
  }
}`,
    path: '$.store.book[*].title'
  },
  {
    name: '书店 — 价格小于10的书',
    json: `{
  "store": {
    "book": [
      { "category": "reference", "author": "Nigel Rees", "title": "Sayings of the Century", "price": 8.95 },
      { "category": "fiction", "author": "Evelyn Waugh", "title": "Sword of Honour", "price": 12.99 },
      { "category": "fiction", "author": "Herman Melville", "title": "Moby Dick", "isbn": "0-553-21311-3", "price": 8.99 },
      { "category": "fiction", "author": "J. R. R. Tolkien", "title": "The Lord of the Rings", "isbn": "0-395-19395-8", "price": 22.99 }
    ],
    "bicycle": { "color": "red", "price": 19.95 }
  }
}`,
    path: '$.store.book[?(@.price < 10)]'
  },
  {
    name: '用户列表 — 找成年用户',
    json: `{
  "users": [
    { "name": "张三", "age": 25, "city": "北京" },
    { "name": "李四", "age": 17, "city": "上海" },
    { "name": "王五", "age": 30, "city": "广州" },
    { "name": "赵六", "age": 15, "city": "深圳" }
  ]
}`,
    path: '$.users[?(@.age >= 18)]'
  },
  {
    name: '复杂嵌套 — 递归取所有 author',
    json: `{
  "library": {
    "section": {
      "shelves": [
        {
          "books": [
            { "author": "鲁迅", "title": "呐喊" },
            { "author": "老舍", "title": "骆驼祥子" }
          ]
        },
        {
          "books": [
            { "author": "莫言", "title": "红高粱" },
            { "author": "余华", "title": "活着" }
          ]
        }
      ]
    }
  }
}`,
    path: '$..author'
  },
  {
    name: '数组切片 — 前三个元素',
    json: `{
  "fruits": ["苹果", "香蕉", "橙子", "葡萄", "西瓜", "草莓"]
}`,
    path: '$.fruits[0:3]'
  }
]

// 应用预设
function applyPreset() {
  const idx = parseInt(selectedPreset.value)
  if (isNaN(idx)) return
  const preset = presets[idx]
  inputJson.value = preset.json
  pathExpression.value = preset.path.startsWith('$') ? preset.path.slice(1) : preset.path
  runQuery()
}

// 执行查询
function runQuery() {
  parseError.value = ''
  resultJson.value = ''
  resultCount.value = -1

  if (!inputJson.value.trim()) return

  // 解析 JSON
  let data
  try {
    data = JSON.parse(inputJson.value)
  } catch (e) {
    parseError.value = `JSON 解析错误: ${e.message}`
    return
  }

  // 如果没有表达式，直接显示整个 JSON
  if (!pathExpression.value.trim()) {
    resultJson.value = JSON.stringify(data, null, 2)
    resultCount.value = Array.isArray(data) ? data.length : 1
    return
  }

  // 构建完整路径
  let fullPath = pathExpression.value.trim()
  if (!fullPath.startsWith('$')) {
    fullPath = '$' + fullPath
  }

  // 使用 jsonpath-plus 查询
  try {
    if (typeof JSONPath === 'undefined') {
      parseError.value = 'JSONPath 库未加载，请刷新页面重试'
      return
    }
    const results = JSONPath({ path: fullPath, json: data })
    if (results && results.length > 0) {
      resultJson.value = JSON.stringify(results, null, 2)
      resultCount.value = results.length
    } else {
      resultJson.value = ''
      resultCount.value = 0
    }
  } catch (e) {
    parseError.value = `JSONPath 错误: ${e.message}`
  }
}

// 格式化 JSON
function formatJson() {
  if (!inputJson.value.trim()) return
  try {
    const data = JSON.parse(inputJson.value)
    inputJson.value = JSON.stringify(data, null, 2)
    runQuery()
  } catch (e) {
    parseError.value = `JSON 格式化错误: ${e.message}`
  }
}

// 清空
function clearAll() {
  inputJson.value = ''
  pathExpression.value = ''
  resultJson.value = ''
  parseError.value = ''
  resultCount.value = -1
  selectedPreset.value = ''
}

// 简单的 JSON 语法高亮
const highlightedResult = computed(() => {
  if (!resultJson.value) return ''
  return resultJson.value
    // 转义 HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // 高亮字符串（绿色）
    .replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, '<span class="hl-string">"$1"</span>')
    // 高亮数字（黄色）
    .replace(/\b(-?\d+\.?\d*)\b/g, '<span class="hl-number">$1</span>')
    // 高亮布尔值和 null（紫色）
    .replace(/\b(true|false|null)\b/g, '<span class="hl-boolean">$1</span>')
})

// 复制结果
function copyResult() {
  navigator.clipboard.writeText(resultJson.value).then(() => {
    copyText.value = '已复制 ✓'
    setTimeout(() => { copyText.value = '复制结果' }, 1500)
  })
}
</script>

<style scoped>
.tool-page {
  padding-top: 0.5rem;
}

h2 {
  font-size: 1.6rem;
  margin-bottom: 0.5rem;
}

.tool-desc {
  color: #666;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

/* 预设行 */
.presets-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.presets-row label {
  font-weight: 600;
  font-size: 0.9rem;
}

.preset-select {
  padding: 0.4rem 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.85rem;
  outline: none;
  cursor: pointer;
  min-width: 200px;
}

.preset-select:focus {
  border-color: #22c55e;
}

.btn-action {
  padding: 0.4rem 0.8rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-action:hover {
  border-color: #22c55e;
  background: #f0fdf4;
}

.btn-ref-toggle {
  padding: 0.4rem 0.8rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-ref-toggle:hover {
  border-color: #10b981;
  background: #f0fdf4;
}

/* 语法参考 */
.ref-panel {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
  overflow-x: auto;
}

.ref-panel table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.ref-panel th,
.ref-panel td {
  padding: 0.5rem 0.8rem;
  text-align: left;
  border-bottom: 1px solid #e8e8e8;
}

.ref-panel th {
  background: #f0f0f0;
  font-weight: 600;
}

.ref-panel code {
  background: #1e1e2e;
  color: #a5d6a7;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.8rem;
}

/* 输入区 */
.input-area {
  margin-bottom: 1rem;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
}

.panel-header label {
  font-weight: 600;
  font-size: 0.9rem;
}

textarea {
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-family: monospace;
  font-size: 0.85rem;
  outline: none;
  resize: vertical;
  box-sizing: border-box;
  transition: border-color 0.2s;
  line-height: 1.5;
}

textarea:focus {
  border-color: #22c55e;
}

.error-msg {
  background: #fef2f2;
  color: #dc2626;
  padding: 0.6rem 0.8rem;
  border-radius: 6px;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  font-family: monospace;
  white-space: pre-wrap;
}

.error-icon {
  margin-right: 0.3rem;
}

/* 表达式输入 */
.expression-area {
  margin-bottom: 1rem;
}

.expression-area label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.expression-row {
  display: flex;
  align-items: center;
  gap: 0;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.expression-row:focus-within {
  border-color: #22c55e;
}

.dollar-sign {
  padding: 0.7rem 0.8rem;
  background: #f0f0f0;
  font-family: monospace;
  font-size: 1rem;
  font-weight: 700;
  color: #555;
  border-right: 2px solid #e0e0e0;
  user-select: none;
}

.expression-row input {
  flex: 1;
  padding: 0.7rem 0.8rem;
  border: none;
  outline: none;
  font-family: monospace;
  font-size: 0.95rem;
}

/* 结果区 */
.result-area {
  margin-bottom: 1rem;
}

.result-count {
  color: #888;
  font-weight: normal;
  font-size: 0.85rem;
}

.result-box {
  background: #1e1e2e;
  border-radius: 10px;
  padding: 1rem;
  overflow-x: auto;
  max-height: 400px;
}

.result-box pre {
  margin: 0;
}

.result-box code {
  font-family: monospace;
  font-size: 0.85rem;
  line-height: 1.6;
  color: #e0e0e0;
}

/* 语法高亮颜色 */
:deep(.hl-string) {
  color: #a5d6a7;
}
:deep(.hl-number) {
  color: #fbbf24;
}
:deep(.hl-boolean) {
  color: #c084fc;
}

.placeholder {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 2rem;
  text-align: center;
  color: #999;
  font-size: 0.9rem;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #22c55e;
  text-decoration: none;
  font-weight: 600;
}

.back-link:hover {
  text-decoration: underline;
}

@media (max-width: 600px) {
  .presets-row {
    flex-direction: column;
    align-items: stretch;
  }
  .preset-select {
    min-width: auto;
  }
}
</style>
