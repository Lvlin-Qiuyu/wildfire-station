<template>
  <div class="tool-page">
    <h2>📋 JSON Schema 生成器</h2>
    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>

    <div class="input-section">
      <label>粘贴 JSON 数据（自动推断类型生成 Schema）</label>
      <textarea v-model="jsonInput" placeholder='粘贴 JSON，例如：&#10;{&#10;  "name": "张三",&#10;  "age": 25,&#10;  "active": true&#10;}' rows="10" spellcheck="false"></textarea>
      <div v-if="errorMsg" class="error-msg">⚠️ {{ errorMsg }}</div>
      <button class="btn-primary" @click="generateSchema" :disabled="!jsonInput.trim()">生成 Schema</button>
    </div>

    <div v-if="schemaOutput" class="output-section">
      <div class="output-header">
        <label>JSON Schema（Draft-07）</label>
        <button class="btn-copy" @click="copySchema">📋 复制</button>
      </div>
      <pre class="schema-output"><code>{{ schemaOutput }}</code></pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

useHead({ title: 'JSON Schema 生成器 - 野火小站' })

const jsonInput = ref('')
const schemaOutput = ref('')
const errorMsg = ref('')

function inferType(val, key) {
  if (val === null) return { type: 'null', description: key ? `字段 ${key}` : '' }
  if (Array.isArray(val)) {
    if (val.length === 0) return { type: 'array', items: {} }
    const items = inferType(val[0], '')
    return { type: 'array', items }
  }
  const t = typeof val
  if (t === 'string') {
    const schema = { type: 'string' }
    if (/^\d{4}-\d{2}-\d{2}/.test(val)) schema.format = 'date-time'
    else if (/^https?:\/\//.test(val)) schema.format = 'uri'
    else if (/^#[0-9a-fA-F]{6}$/.test(val)) schema.format = 'color'
    return schema
  }
  if (t === 'number') return Number.isInteger(val) ? { type: 'integer' } : { type: 'number' }
  if (t === 'boolean') return { type: 'boolean' }
  if (t === 'object') {
    const props = {}
    const required = []
    for (const [k, v] of Object.entries(val)) {
      props[k] = inferType(v, k)
      required.push(k)
    }
    return { type: 'object', properties: props, required }
  }
  return {}
}

function generateSchema() {
  errorMsg.value = ''
  schemaOutput.value = ''
  try {
    const parsed = JSON.parse(jsonInput.value)
    const schema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      ...inferType(parsed, 'root')
    }
    schemaOutput.value = JSON.stringify(schema, null, 2)
  } catch (e) {
    errorMsg.value = 'JSON 解析失败：' + e.message
  }
}

function copySchema() {
  navigator.clipboard.writeText(schemaOutput.value).then(() => {
    const btn = document.querySelector('.btn-copy')
    btn.textContent = '✅ 已复制'
    setTimeout(() => { btn.textContent = '📋 复制' }, 1500)
  })
}
</script>

<style scoped>
.tool-page { max-width: 800px; margin: 0 auto; padding: 20px; }
.back-link { display: inline-block; margin-bottom: 16px; color: #10b981; text-decoration: none; }
.back-link:hover { text-decoration: underline; }
h2 { color: #1a1a2e; margin-bottom: 20px; }
.input-section label { display: block; font-size: 14px; color: #555; margin-bottom: 6px; }
textarea { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 14px; resize: vertical; box-sizing: border-box; }
textarea:focus { outline: none; border-color: #22c55e; }
.error-msg { color: #ef4444; margin: 8px 0; font-size: 14px; }
.btn-primary { margin-top: 12px; padding: 10px 24px; background: #22c55e; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 15px; }
.btn-primary:hover { background: #16a34a; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.output-section { margin-top: 24px; }
.output-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.output-header label { font-size: 14px; color: #555; }
.btn-copy { padding: 6px 14px; background: #10b981; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; }
.btn-copy:hover { background: #059669; }
.schema-output { background: #1a1a2e; color: #e0e0e0; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 13px; line-height: 1.5; }
@media (max-width: 600px) { .tool-page { padding: 12px; } }
</style>
