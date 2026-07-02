<template>
  <div class="tool-page">
    <h2>🔗 URL 解析与构建器</h2>
    <p class="tool-desc">粘贴 URL 自动拆解各部分，可编辑修改后重新构建，支持查询参数增删</p>

    <div class="input-section">
      <label>输入 URL</label>
      <div class="url-input-row">
        <input
          v-model="rawUrl"
          class="url-input"
          placeholder="https://user:pass@example.com:8080/path?key=value#hash"
          @input="parseUrl"
        />
        <button class="btn-parse" @click="parseUrl">解析</button>
      </div>
    </div>

    <!-- 解析结果 -->
    <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
    <div v-if="parsed" class="parsed-section">
      <h3>URL 结构</h3>
      <div class="structure-grid">
        <div class="struct-item">
          <label>协议</label>
          <input v-model="parsed.protocol" @input="rebuildUrl" placeholder="https:" class="struct-input" />
        </div>
        <div class="struct-item">
          <label>认证信息</label>
          <input v-model="parsed.auth" @input="rebuildUrl" placeholder="user:pass" class="struct-input" />
        </div>
        <div class="struct-item">
          <label>主机名</label>
          <input v-model="parsed.hostname" @input="rebuildUrl" placeholder="example.com" class="struct-input" />
        </div>
        <div class="struct-item narrow">
          <label>端口</label>
          <input v-model="parsed.port" @input="rebuildUrl" placeholder="8080" class="struct-input" />
        </div>
        <div class="struct-item full">
          <label>路径</label>
          <input v-model="parsed.pathname" @input="rebuildUrl" placeholder="/path/to/page" class="struct-input" />
        </div>
      </div>

      <!-- 查询参数 -->
      <div class="params-section">
        <div class="params-header">
          <h3>查询参数</h3>
          <button class="btn-add" @click="addParam">+ 添加参数</button>
        </div>
        <div v-if="params.length === 0" class="empty-params">暂无查询参数</div>
        <div v-for="(p, i) in params" :key="i" class="param-row">
          <input v-model="p.key" @input="rebuildUrl" class="param-input" placeholder="参数名" />
          <span class="param-eq">=</span>
          <input v-model="p.value" @input="rebuildUrl" class="param-input" placeholder="参数值" />
          <button class="btn-del" @click="removeParam(i)" title="删除">✕</button>
        </div>
      </div>

      <!-- 锚点 -->
      <div class="hash-section">
        <label>锚点（Hash）</label>
        <input v-model="parsed.hash" @input="rebuildUrl" placeholder="#section" class="struct-input" />
      </div>

      <!-- 重建结果 -->
      <div class="result-section">
        <h3>构建结果</h3>
        <div class="result-box">
          <code class="result-url">{{ rebuiltUrl }}</code>
          <div class="result-actions">
            <button class="btn-copy" @click="copyUrl">{{ copyText }}</button>
            <button class="btn-json" @click="copyJson">{{ jsonCopyText }}</button>
          </div>
        </div>
      </div>

      <!-- JSON 导出 -->
      <div class="json-section">
        <h3>JSON 格式</h3>
        <div class="code-block">
          <pre>{{ jsonOutput }}</pre>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'URL 解析与构建器 - 野火小站' })

const rawUrl = ref('')
const copyText = ref('复制 URL')
const jsonCopyText = ref('复制 JSON')

const parsed = ref(null)
const params = ref([])
const errorMsg = ref('')

function parseUrl() {
  errorMsg.value = ''
  const url = rawUrl.value.trim()
  if (!url) { parsed.value = null; params.value = []; return }

  try {
    // 补全协议以支持无协议URL
    let fullUrl = url
    if (!/^[a-zA-Z]+:\/\//.test(fullUrl)) {
      fullUrl = 'https://' + fullUrl
    }
    const obj = new URL(fullUrl)

    // 解析查询参数为数组
    const queryArr = []
    obj.searchParams.forEach((value, key) => {
      queryArr.push({ key, value })
    })

    parsed.value = {
      protocol: obj.protocol,
      auth: obj.username ? (obj.password ? `${obj.username}:${obj.password}` : obj.username) : '',
      hostname: obj.hostname,
      port: obj.port,
      pathname: obj.pathname,
      hash: obj.hash,
    }
    params.value = queryArr
  } catch {
    // 尝试手动解析
    parsed.value = null
    params.value = []
    errorMsg.value = 'URL 格式无法解析，请检查输入'
  }
}

function rebuildUrl() {
  if (!parsed.value) return
  let url = parsed.value.protocol + '//'
  if (parsed.value.auth) {
    url += parsed.value.auth + '@'
  }
  url += parsed.value.hostname
  if (parsed.value.port) {
    url += ':' + parsed.value.port
  }
  if (parsed.value.pathname) {
    url += parsed.value.pathname
  }
  // 构建查询参数
  const validParams = params.value.filter(p => p.key)
  if (validParams.length > 0) {
    url += '?' + validParams.map(p =>
      encodeURIComponent(p.key) + '=' + encodeURIComponent(p.value)
    ).join('&')
  }
  if (parsed.value.hash) {
    url += parsed.value.hash
  }
  rawUrl.value = url
}

const rebuiltUrl = computed(() => {
  if (!parsed.value) return rawUrl.value
  let url = parsed.value.protocol + '//'
  if (parsed.value.auth) url += parsed.value.auth + '@'
  url += parsed.value.hostname
  if (parsed.value.port) url += ':' + parsed.value.port
  if (parsed.value.pathname) url += parsed.value.pathname
  const validParams = params.value.filter(p => p.key)
  if (validParams.length > 0) {
    url += '?' + validParams.map(p =>
      encodeURIComponent(p.key) + '=' + encodeURIComponent(p.value)
    ).join('&')
  }
  if (parsed.value.hash) url += parsed.value.hash
  return url
})

const jsonOutput = computed(() => {
  if (!parsed.value) return ''
  const obj = {
    protocol: parsed.value.protocol,
    auth: parsed.value.auth || null,
    hostname: parsed.value.hostname,
    port: parsed.value.port ? parseInt(parsed.value.port) : null,
    pathname: parsed.value.pathname,
    query: {},
    hash: parsed.value.hash || null,
  }
  params.value.forEach(p => {
    if (p.key) obj.query[p.key] = p.value
  })
  return JSON.stringify(obj, null, 2)
})

function addParam() {
  params.value.push({ key: '', value: '' })
}

function removeParam(i) {
  params.value.splice(i, 1)
  rebuildUrl()
}

function copyUrl() {
  navigator.clipboard.writeText(rebuiltUrl.value).then(() => {
    copyText.value = '已复制 ✓'
    setTimeout(() => { copyText.value = '复制 URL' }, 1500)
  })
}

function copyJson() {
  navigator.clipboard.writeText(jsonOutput.value).then(() => {
    jsonCopyText.value = '已复制 ✓'
    setTimeout(() => { jsonCopyText.value = '复制 JSON' }, 1500)
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

h3 {
  font-size: 1.05rem;
  margin-bottom: 0.8rem;
  color: #333;
}

.tool-desc {
  color: #666;
  margin-bottom: 1.5rem;
}

.input-section {
  margin-bottom: 1.5rem;
}

.input-section label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 600;
}

.url-input-row {
  display: flex;
  gap: 0.6rem;
}

.url-input {
  flex: 1;
  padding: 0.7rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: monospace;
  outline: none;
  transition: border-color 0.2s;
}

.url-input:focus {
  border-color: #22c55e;
}

.btn-parse {
  padding: 0.7rem 1.4rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  white-space: nowrap;
  transition: transform 0.2s;
}

.btn-parse:active {
  transform: scale(0.95);
}

.parsed-section {
  margin-bottom: 1.5rem;
}

.structure-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
  margin-bottom: 1.2rem;
}

.struct-item {
  display: flex;
  flex-direction: column;
}

.struct-item.narrow {
  max-width: 120px;
}

.struct-item.full {
  grid-column: 1 / -1;
}

.struct-item label {
  font-size: 0.8rem;
  color: #888;
  margin-bottom: 0.3rem;
}

.struct-input {
  padding: 0.55rem 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: monospace;
  outline: none;
  transition: border-color 0.2s;
}

.struct-input:focus {
  border-color: #22c55e;
}

.params-section {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.params-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.params-header h3 {
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

.empty-params {
  text-align: center;
  color: #aaa;
  font-size: 0.9rem;
  padding: 1rem;
}

.param-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
}

.param-input {
  flex: 1;
  padding: 0.5rem 0.7rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.9rem;
  font-family: monospace;
  outline: none;
  transition: border-color 0.2s;
}

.param-input:focus {
  border-color: #22c55e;
}

.param-eq {
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

.hash-section {
  margin-bottom: 1.2rem;
}

.hash-section label {
  display: block;
  font-size: 0.8rem;
  color: #888;
  margin-bottom: 0.3rem;
}

.result-section {
  margin-bottom: 1.2rem;
}

.result-box {
  background: #f0fdf4;
  border: 2px solid #22c55e;
  border-radius: 10px;
  padding: 1rem;
}

.result-url {
  display: block;
  font-family: monospace;
  font-size: 0.9rem;
  word-break: break-all;
  color: #16a34a;
  margin-bottom: 0.8rem;
}

.result-actions {
  display: flex;
  gap: 0.6rem;
}

.btn-copy, .btn-json {
  padding: 0.45rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: transform 0.2s;
}

.btn-copy {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
}

.btn-json {
  background: #6366f1;
  color: white;
}

.btn-copy:active, .btn-json:active {
  transform: scale(0.95);
}

.json-section {
  margin-bottom: 1.5rem;
}

.code-block {
  background: #1a1a2e;
  border-radius: 10px;
  padding: 1.2rem;
  overflow-x: auto;
}

.code-block pre {
  color: #a5d6a7;
  font-family: monospace;
  font-size: 0.85rem;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
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
  .structure-grid {
    grid-template-columns: 1fr;
  }
  .struct-item.narrow {
    max-width: 100%;
  }
  .param-row {
    flex-wrap: wrap;
  }
  .param-input {
    min-width: 0;
  }
  .result-actions {
    flex-direction: column;
  }
}
.error-msg {
  background: #fef2f2;
  color: #dc2626;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  margin-top: 1rem;
  text-align: center;
}
</style>
