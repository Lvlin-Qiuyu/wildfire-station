<template>
  <div class="tool-page">
    <h2>🌐 HTTP 请求头构造器</h2>
    <p class="subtitle">可视化构造 HTTP 请求头，常见 Header 预设，生成 curl/fetch/axios 代码片段</p>

    <!-- 预设模板 -->
    <div class="preset-section">
      <label class="section-label">快速预设</label>
      <div class="preset-bar">
        <button
          v-for="preset in presets"
          :key="preset.name"
          class="preset-chip"
          @click="applyPreset(preset)"
        >
          {{ preset.name }}
        </button>
      </div>
    </div>

    <!-- 请求方法 & URL -->
    <div class="url-section">
      <div class="method-url-row">
        <select v-model="method" class="method-select">
          <option v-for="m in methods" :key="m" :value="m">{{ m }}</option>
        </select>
        <input
          v-model="url"
          class="url-input"
          placeholder="https://api.example.com/v1/users"
        />
      </div>
    </div>

    <!-- 请求头列表 -->
    <div class="headers-section">
      <div class="headers-header">
        <h3>请求头（Request Headers）</h3>
        <button class="btn-add" @click="addHeader">+ 添加请求头</button>
      </div>

      <div v-if="headers.length === 0" class="empty-tip">
        点击上方按钮或选择预设模板来添加请求头
      </div>

      <div v-for="(h, i) in headers" :key="i" class="header-row">
        <span class="row-num">{{ i + 1 }}</span>
        <input
          v-model="h.key"
          class="header-input"
          placeholder="Header 名称"
          list="header-suggestions"
        />
        <span class="header-colon">:</span>
        <input
          v-model="h.value"
          class="header-input value-input"
          placeholder="Header 值"
        />
        <button class="btn-del" @click="removeHeader(i)" title="删除">✕</button>
      </div>

      <!-- 常用 Header 建议列表 -->
      <datalist id="header-suggestions">
        <option v-for="s in commonHeaders" :key="s" :value="s" />
      </datalist>
    </div>

    <!-- Body（POST/PUT/PATCH 时显示） -->
    <div v-if="showBody" class="body-section">
      <div class="headers-header">
        <h3>请求体（Request Body）</h3>
        <select v-model="bodyType" class="body-type-select">
          <option value="json">JSON</option>
          <option value="form">Form Data</option>
          <option value="text">Text</option>
        </select>
      </div>
      <textarea
        v-model="body"
        class="text-input"
        :placeholder="bodyPlaceholder"
        rows="6"
      ></textarea>
    </div>

    <!-- 代码生成 -->
    <div class="code-section">
      <div class="code-header">
        <h3>代码片段</h3>
        <div class="code-tabs">
          <button
            v-for="tab in codeTabs"
            :key="tab.id"
            class="code-tab"
            :class="{ active: activeCodeTab === tab.id }"
            @click="activeCodeTab = tab.id"
          >
            {{ tab.name }}
          </button>
        </div>
      </div>
      <div class="code-block">
        <pre>{{ currentCodeSnippet }}</pre>
      </div>
      <div class="code-actions">
        <button class="btn-copy" @click="copyCode">{{ codeCopyText }}</button>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'HTTP 请求头构造器 - 野火小站' })

// ==================== 状态 ====================
const method = ref('GET')
const url = ref('')
const headers = reactive([])
const body = ref('')
const bodyType = ref('json')
const activeCodeTab = ref('curl')
const codeCopyText = ref('复制代码')

const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

// 是否显示请求体
const showBody = computed(() => ['POST', 'PUT', 'PATCH'].includes(method.value))

const bodyPlaceholder = computed(() => {
  if (bodyType.value === 'json') return '{\n  "key": "value"\n}'
  if (bodyType.value === 'form') return 'key1=value1&key2=value2'
  return '请求体内容...'
})

// 常用 Header 名称建议
const commonHeaders = [
  'Accept', 'Accept-Language', 'Authorization', 'Cache-Control',
  'Connection', 'Content-Type', 'Cookie', 'Host', 'Origin',
  'Referer', 'User-Agent', 'X-Request-Id', 'X-Requested-With',
  'X-API-Key', 'X-Forwarded-For', 'X-Real-IP', 'If-None-Match',
  'Range', 'Access-Control-Allow-Origin',
]

// ==================== 预设模板 ====================
const presets = [
  {
    name: '基础请求',
    method: 'GET',
    headers: [
      { key: 'Accept', value: 'application/json' },
      { key: 'User-Agent', value: 'Mozilla/5.0' },
    ],
  },
  {
    name: 'Bearer Token',
    method: 'GET',
    headers: [
      { key: 'Authorization', value: 'Bearer YOUR_TOKEN_HERE' },
      { key: 'Accept', value: 'application/json' },
    ],
  },
  {
    name: 'Basic Auth',
    method: 'GET',
    headers: [
      { key: 'Authorization', value: 'Basic dXNlcjpwYXNz' },
      { key: 'Accept', value: 'application/json' },
    ],
  },
  {
    name: 'CORS 请求',
    method: 'GET',
    headers: [
      { key: 'Origin', value: 'https://example.com' },
      { key: 'Access-Control-Request-Method', value: 'GET' },
    ],
  },
  {
    name: 'JSON POST',
    method: 'POST',
    headers: [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'Accept', value: 'application/json' },
    ],
  },
  {
    name: '表单提交',
    method: 'POST',
    headers: [
      { key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
    ],
  },
  {
    name: '文件上传',
    method: 'POST',
    headers: [
      { key: 'Content-Type', value: 'multipart/form-data; boundary=----WebKitFormBoundary' },
    ],
  },
  {
    name: 'API Key',
    method: 'GET',
    headers: [
      { key: 'X-API-Key', value: 'YOUR_API_KEY_HERE' },
      { key: 'Accept', value: 'application/json' },
    ],
  },
]

function applyPreset(preset) {
  method.value = preset.method
  headers.length = 0
  preset.headers.forEach(h => headers.push({ key: h.key, value: h.value }))
}

// ==================== 请求头管理 ====================
function addHeader() {
  headers.push({ key: '', value: '' })
}

function removeHeader(i) {
  headers.splice(i, 1)
}

// ==================== 代码生成 ====================
const codeTabs = [
  { id: 'curl', name: 'cURL' },
  { id: 'fetch', name: 'Fetch API' },
  { id: 'axios', name: 'Axios' },
]

// 构建有效的 Header 字符串
const validHeaders = computed(() => headers.filter(h => h.key && h.value))

const currentCodeSnippet = computed(() => {
  const targetUrl = url.value || 'https://api.example.com'
  const h = validHeaders.value
  const headerLines = h.map(item => `  '${item.key}': '${item.value}'`)

  if (activeCodeTab.value === 'curl') {
    let code = `curl -X ${method.value} '${targetUrl}'`
    h.forEach(item => {
      code += ` \\\n  -H '${item.key}: ${item.value}'`
    })
    if (showBody.value && body.value) {
      code += ` \\\n  -d '${body.value.replace(/'/g, "\\'")}'`
    }
    return code
  }

  if (activeCodeTab.value === 'fetch') {
    const options = [`  method: '${method.value}',`]
    if (headerLines.length > 0) {
      options.push(`  headers: {\n${headerLines.join(',\n')},\n  },`)
    }
    if (showBody.value && body.value) {
      options.push(`  body: JSON.stringify(${bodyType.value === 'json' ? '/* JSON 数据 */' : `'${body.value.replace(/'/g, "\\'")}'`}),`)
    }
    return `fetch('${targetUrl}', {\n${options.join('\n')}\n})\n  .then(res => res.json())\n  .then(data => console.log(data))\n  .catch(err => console.error(err))`
  }

  if (activeCodeTab.value === 'axios') {
    const config = [`  method: '${method.value}',`, `  url: '${targetUrl}',`]
    if (headerLines.length > 0) {
      config.push(`  headers: {\n${headerLines.join(',\n')},\n  },`)
    }
    if (showBody.value && body.value) {
      config.push(`  data: ${bodyType.value === 'json' ? '/* JSON 数据 */' : `'${body.value.replace(/'/g, "\\'")}'`},`)
    }
    return `axios({\n${config.join('\n')}\n})\n  .then(res => console.log(res.data))\n  .catch(err => console.error(err))`
  }

  return ''
})

function copyCode() {
  navigator.clipboard.writeText(currentCodeSnippet.value).then(() => {
    codeCopyText.value = '已复制 ✓'
    setTimeout(() => { codeCopyText.value = '复制代码' }, 1500)
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

h3 {
  font-size: 1.05rem;
  color: #333;
  margin-bottom: 0.8rem;
}

.subtitle {
  color: #888;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
}

/* 预设 */
.preset-section {
  margin-bottom: 1.2rem;
}

.section-label {
  display: block;
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
}

.preset-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.preset-chip {
  padding: 0.35rem 0.8rem;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  background: white;
  font-size: 0.85rem;
  color: #555;
  cursor: pointer;
  transition: all 0.15s;
}

.preset-chip:hover {
  border-color: #22c55e;
  color: #22c55e;
  background: #f0fdf4;
}

/* URL & Method */
.url-section {
  margin-bottom: 1.2rem;
}

.method-url-row {
  display: flex;
  gap: 0.6rem;
}

.method-select {
  padding: 0.7rem 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  background: #f8f9fa;
  outline: none;
  cursor: pointer;
  min-width: 110px;
  transition: border-color 0.2s;
}

.method-select:focus {
  border-color: #22c55e;
}

.url-input {
  flex: 1;
  padding: 0.7rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: 'Courier New', monospace;
  outline: none;
  transition: border-color 0.2s;
}

.url-input:focus {
  border-color: #22c55e;
}

/* 请求头 */
.headers-section {
  background: white;
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1.2rem;
}

.headers-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.headers-header h3 {
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
  padding: 1.5rem;
}

.header-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.row-num {
  font-size: 0.75rem;
  color: #bbb;
  min-width: 20px;
  text-align: center;
}

.header-input {
  flex: 1;
  padding: 0.5rem 0.7rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.9rem;
  font-family: 'Courier New', monospace;
  outline: none;
  transition: border-color 0.2s;
}

.header-input:focus {
  border-color: #22c55e;
}

.header-colon {
  color: #888;
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

/* Body */
.body-section {
  margin-bottom: 1.2rem;
}

.body-type-select {
  padding: 0.3rem 0.6rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.85rem;
  outline: none;
  cursor: pointer;
}

.text-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: 'Courier New', monospace;
  resize: vertical;
  background: white;
  line-height: 1.5;
  transition: border-color 0.2s;
}

.text-input:focus {
  outline: none;
  border-color: #10b981;
}

/* 代码片段 */
.code-section {
  margin-bottom: 1.5rem;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.code-header h3 {
  margin-bottom: 0;
}

.code-tabs {
  display: flex;
  gap: 0.3rem;
}

.code-tab {
  padding: 0.3rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 0.8rem;
  cursor: pointer;
  color: #666;
  transition: all 0.15s;
}

.code-tab.active {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border-color: transparent;
}

.code-block {
  background: #1a1a2e;
  border-radius: 10px;
  padding: 1.2rem;
  overflow-x: auto;
}

.code-block pre {
  color: #a5d6a7;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.6;
}

.code-actions {
  margin-top: 0.6rem;
  display: flex;
  justify-content: flex-end;
}

.btn-copy {
  padding: 0.45rem 1rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: opacity 0.2s;
}

.btn-copy:hover {
  opacity: 0.85;
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
  .method-url-row {
    flex-direction: column;
  }
  .method-select {
    min-width: 100%;
  }
  .header-row {
    flex-wrap: wrap;
  }
  .header-input {
    min-width: 0;
  }
  .code-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
