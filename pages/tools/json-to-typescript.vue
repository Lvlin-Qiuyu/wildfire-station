<template>
  <div class="tool-page">
    <h2>🔷 JSON/YAML 转 TypeScript</h2>
    <p class="subtitle">粘贴 JSON 或 YAML 数据，自动生成 TypeScript interface / type 定义</p>

    <!-- 选项栏 -->
    <div class="options-bar">
      <div class="option-group">
        <label>输入类型</label>
        <select v-model="inputType" class="opt-select">
          <option value="auto">自动识别</option>
          <option value="json">JSON</option>
          <option value="yaml">YAML</option>
        </select>
      </div>
      <div class="option-group">
        <label>根类型名称</label>
        <input v-model="rootName" class="name-input" placeholder="RootType" />
      </div>
      <div class="option-group">
        <label class="checkbox-label">
          <input type="checkbox" v-model="exportKeyword" />
          添加 export
        </label>
      </div>
      <div class="option-group">
        <label class="checkbox-label">
          <input type="checkbox" v-model="useType" />
          使用 type（而非 interface）
        </label>
      </div>
    </div>

    <!-- 编辑区 -->
    <div class="editor-area">
      <div class="panel">
        <div class="panel-header">
          <label>输入数据</label>
          <span class="btn-clear" @click="inputData = ''; tsOutput = ''; errorMsg = ''">清空</span>
        </div>
        <textarea
          v-model="inputData"
          placeholder="粘贴 JSON 或 YAML 数据..."
          rows="14"
          spellcheck="false"
          @input="generate"
        ></textarea>
        <div v-if="errorMsg" class="error-msg">⚠️ {{ errorMsg }}</div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <label>TypeScript 定义</label>
          <span v-if="tsOutput" class="btn-copy" @click="copyResult">{{ copyLabel }}</span>
        </div>
        <div v-if="tsOutput" class="code-block">
          <pre><code>{{ tsOutput }}</code></pre>
        </div>
        <div v-else class="placeholder">
          TypeScript 类型定义将显示在这里
        </div>
        <div v-if="interfaceCount > 0" class="stats-bar">
          共生成 <strong>{{ interfaceCount }}</strong> 个类型定义
        </div>
      </div>
    </div>

    <div class="notice">
      <p>💡 递归遍历所有嵌套对象生成 interface，自动处理数组、null、可选字段。YAML 解析使用 js-yaml 库。</p>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({
  title: 'JSON/YAML 转 TypeScript - 野火小站',
  script: [{ src: 'https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js', defer: true }],
})

const inputData = ref('')
const inputType = ref('auto')
const rootName = ref('RootType')
const exportKeyword = ref(true)
const useType = ref(false)
const tsOutput = ref('')
const errorMsg = ref('')
const interfaceCount = ref(0)
const copyLabel = ref('复制')

// ==================== 解析输入 ====================
function parseInput(text) {
  const trimmed = text.trim()
  if (!trimmed) return null

  // 自动识别格式
  let type = inputType.value
  if (type === 'auto') {
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      type = 'json'
    } else {
      type = 'yaml'
    }
  }

  if (type === 'json') {
    return JSON.parse(trimmed)
  }
  if (type === 'yaml') {
    if (typeof window !== 'undefined' && window.jsyaml) {
      return window.jsyaml.load(trimmed)
    }
    throw new Error('YAML 库未加载')
  }
  return null
}

// ==================== 类型推断引擎 ====================
// 收集所有出现过的类型信息
const typeMap = reactive(new Map())

function resetTypes() {
  typeMap.clear()
}

// 推断 TypeScript 类型字符串
function inferType(value, propName, parentPath) {
  if (value === null) return 'null'

  if (Array.isArray(value)) {
    if (value.length === 0) return 'unknown[]'
    // 分析数组元素类型
    const itemTypes = new Set(value.map(item => inferType(item, propName, parentPath + '_item')))
    if (itemTypes.size === 1) {
      return `${[...itemTypes][0]}[]`
    }
    // 混合类型数组 → 联合类型
    const types = value.map(item => inferType(item, propName, parentPath + '_item'))
    return `(${mergeUnionTypes(types)})[]`
  }

  if (typeof value === 'object') {
    const typeName = toPascalCase(propName)
    const entries = Object.entries(value)
    const fields = entries.map(([key, val]) => {
      const fieldType = inferType(val, key, parentPath + '.' + key)
      const isOptional = val === null || val === undefined || (Array.isArray(value) && value.length === 0)
      // 记录嵌套对象类型
      if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        extractObjectType(val, typeName + toPascalCase(key), parentPath + '.' + key)
      }
      return { key, fieldType, isOptional: val === null || val === undefined }
    })

    typeMap.set(typeName, fields)
    return typeName
  }

  if (typeof value === 'string') {
    // 检查是否像日期
    if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(value)) return 'string'
    return 'string'
  }
  if (typeof value === 'number') return Number.isInteger(value) ? 'number' : 'number'
  if (typeof value === 'boolean') return 'boolean'

  return 'unknown'
}

// 递归提取嵌套对象类型
function extractObjectType(obj, typeName, path) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return
  if (typeMap.has(typeName)) return

  const entries = Object.entries(obj)
  const fields = entries.map(([key, val]) => {
    if (val === null) return { key, fieldType: 'null', isOptional: true }
    if (Array.isArray(val)) {
      if (val.length > 0 && typeof val[0] === 'object' && !Array.isArray(val[0])) {
        const itemTypeName = typeName + toPascalCase(key) + 'Item'
        extractObjectType(val[0], itemTypeName, path + '.' + key)
        return { key, fieldType: `${itemTypeName}[]`, isOptional: false }
      }
      return { key, fieldType: inferType(val, key, path), isOptional: false }
    }
    if (typeof val === 'object') {
      const nestedName = typeName + toPascalCase(key)
      extractObjectType(val, nestedName, path + '.' + key)
      return { key, fieldType: nestedName, isOptional: false }
    }
    return { key, fieldType: inferType(val, key, path), isOptional: false }
  })

  typeMap.set(typeName, fields)
}

// 合并联合类型（去重）
function mergeUnionTypes(types) {
  const unique = [...new Set(types)]
  return unique.join(' | ')
}

// 驼峰转 PascalCase
function toPascalCase(str) {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
    .replace(/^(.)/, (_, c) => c.toUpperCase())
    .replace(/Id$/, 'ID')
}

// ==================== 生成 TypeScript ====================
function generateTsCode() {
  resetTypes()

  const data = parseInput(inputData.value)
  if (data === null) return

  // 处理根数据
  if (typeof data === 'object' && !Array.isArray(data)) {
    const rootFields = Object.entries(data).map(([key, val]) => {
      let fieldType
      if (val === null) {
        return { key, fieldType: 'null', isOptional: true }
      }
      if (Array.isArray(val)) {
        if (val.length > 0 && typeof val[0] === 'object' && !Array.isArray(val[0])) {
          const itemTypeName = toPascalCase(rootName.value) + toPascalCase(key) + 'Item'
          extractObjectType(val[0], itemTypeName, rootName.value + '.' + key)
          fieldType = `${itemTypeName}[]`
        } else {
          fieldType = inferType(val, key, rootName.value + '.' + key)
        }
      } else if (typeof val === 'object') {
        const nestedName = toPascalCase(rootName.value) + toPascalCase(key)
        extractObjectType(val, nestedName, rootName.value + '.' + key)
        fieldType = nestedName
      } else {
        fieldType = inferType(val, key, rootName.value + '.' + key)
      }
      return { key, fieldType, isOptional: val === null || val === undefined }
    })
    typeMap.set(rootName.value, rootFields)
  } else if (Array.isArray(data)) {
    if (data.length > 0 && typeof data[0] === 'object' && !Array.isArray(data[0])) {
      const itemTypeName = rootName.value + 'Item'
      extractObjectType(data[0], itemTypeName, rootName.value)
      const rootFields = [{ key: 'items', fieldType: `${itemTypeName}[]`, isOptional: false }]
      typeMap.set(rootName.value, rootFields)
    }
  }

  // 生成代码
  const kw = exportKeyword.value ? 'export ' : ''
  const lines = []
  const rootIdx = findRootIndex()
  const entries = [...typeMap.entries()]

  // 先输出根类型
  if (rootIdx >= 0) {
    lines.push(formatInterface(entries[rootIdx][0], entries[rootIdx][1], kw))
    entries.splice(rootIdx, 1)
  }

  // 按依赖顺序输出嵌套类型
  entries.forEach(([name, fields]) => {
    lines.push(formatInterface(name, fields, kw))
  })

  tsOutput.value = lines.join('\n\n')
  interfaceCount.value = typeMap.size
}

function findRootIndex() {
  const entries = [...typeMap.keys()]
  return entries.indexOf(rootName.value)
}

function formatInterface(name, fields, kw) {
  const keyword = useType.value ? 'type' : 'interface'
  const lines = [`${kw}${keyword} ${name} ${useType.value ? '= ' : '{'}`]

  if (useType.value) {
    const fieldStrs = fields.map(f => {
      const optional = f.isOptional ? '?' : ''
      return `  ${f.key}${optional}: ${f.fieldType}`
    })
    lines[0] += '{'
    lines.push(...fieldStrs)
    lines.push('}')
  } else {
    fields.forEach(f => {
      const optional = f.isOptional ? '?' : ''
      lines.push(`  ${f.key}${optional}: ${f.fieldType};`)
    })
    lines.push('}')
  }

  return lines.join('\n')
}

// ==================== 主生成函数 ====================
function generate() {
  errorMsg.value = ''
  tsOutput.value = ''
  interfaceCount.value = 0

  if (!inputData.value.trim()) return

  try {
    generateTsCode()
  } catch (e) {
    errorMsg.value = '解析失败：' + (e.message || '请检查输入数据格式')
  }
}

function copyResult() {
  navigator.clipboard.writeText(tsOutput.value).then(() => {
    copyLabel.value = '已复制 ✓'
    setTimeout(() => { copyLabel.value = '复制' }, 1500)
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

.options-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.2rem;
  flex-wrap: wrap;
  align-items: flex-end;
}
.option-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.option-group label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #555;
}
.opt-select {
  padding: 0.4rem 0.6rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
}
.opt-select:focus {
  outline: none;
  border-color: #10b981;
}
.name-input {
  padding: 0.4rem 0.6rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.9rem;
  width: 140px;
}
.name-input:focus {
  outline: none;
  border-color: #10b981;
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.88rem !important;
  font-weight: 400 !important;
  cursor: pointer;
  padding-top: 0.3rem;
}
.checkbox-label input[type="checkbox"] {
  accent-color: #10b981;
}

.editor-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}
.panel {
  display: flex;
  flex-direction: column;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
}
.panel-header label {
  font-weight: 600;
  font-size: 0.95rem;
}

textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-family: 'Courier New', monospace;
  font-size: 0.88rem;
  resize: vertical;
  background: white;
  line-height: 1.5;
  box-sizing: border-box;
}
textarea:focus {
  outline: none;
  border-color: #10b981;
}

.code-block {
  background: #1e1e2e;
  border-radius: 10px;
  padding: 1rem 1.2rem;
  overflow-x: auto;
  min-height: 200px;
}
.code-block pre {
  margin: 0;
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 0.88rem;
  line-height: 1.7;
  color: #e0e0e0;
}
.code-block code {
  color: inherit;
}

.placeholder {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 2rem;
  text-align: center;
  color: #999;
  font-size: 0.9rem;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats-bar {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #666;
  background: #f0fdf4;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
}

.error-msg {
  background: #fef2f2;
  color: #dc2626;
  padding: 0.6rem 0.8rem;
  border-radius: 6px;
  margin-top: 0.5rem;
  font-size: 0.85rem;
}

.btn-clear {
  font-size: 0.82rem;
  color: #888;
  cursor: pointer;
}
.btn-clear:hover {
  color: #e74c3c;
}

.btn-copy {
  padding: 0.3rem 0.7rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 0.82rem;
  cursor: pointer;
}
.btn-copy:hover {
  opacity: 0.85;
}

.notice {
  background: #f8fff8;
  border-radius: 10px;
  padding: 1rem 1.2rem;
  margin-bottom: 1.5rem;
}
.notice p {
  font-size: 0.85rem;
  color: #666;
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
}
</style>
