<template>
  <div class="tool-page">
    <h2>⚙️ TOML / INI 配置转换器</h2>
    <p class="subtitle">TOML↔JSON、INI↔JSON 四种转换，支持预设模板，纯前端解析</p>

    <!-- 转换方向选择 -->
    <div class="format-bar">
      <div class="format-group">
        <label>输入格式</label>
        <select v-model="inputFormat" class="format-select">
          <option value="toml">TOML</option>
          <option value="ini">INI</option>
          <option value="json">JSON</option>
        </select>
      </div>
      <div class="swap-icon" title="交换输入输出" @click="swapFormats" style="cursor:pointer">⇄</div>
      <div class="format-group">
        <label>输出格式</label>
        <select v-model="outputFormat" class="format-select">
          <option value="json">JSON</option>
          <option value="toml">TOML</option>
          <option value="ini">INI</option>
        </select>
      </div>
    </div>

    <!-- 预设模板 -->
    <div class="template-bar">
      <label>预设模板：</label>
      <button v-for="tpl in templates" :key="tpl.name" class="tpl-btn" @click="loadTemplate(tpl)">{{ tpl.icon }} {{ tpl.name }}</button>
    </div>

    <!-- 双栏编辑器 -->
    <div class="editor-area">
      <div class="panel">
        <div class="panel-header">
          <label>输入</label>
          <span class="btn-clear" @click="inputText = ''; outputText = ''; errorMsg = ''">清空</span>
        </div>
        <textarea
          v-model="inputText"
          :placeholder="inputPlaceholder"
          rows="18"
          spellcheck="false"
          @input="convert"
        ></textarea>
      </div>

      <div class="panel">
        <div class="panel-header">
          <label>输出</label>
          <span v-if="outputText" class="btn-copy" @click="copyOutput">{{ copyLabel }}</span>
        </div>
        <textarea
          :value="outputText"
          readonly
          rows="18"
          class="output-area"
          placeholder="转换结果将显示在这里..."
        ></textarea>
        <div v-if="errorMsg" class="error-msg">⚠️ {{ errorMsg }}</div>
      </div>
    </div>

    <div class="notice">
      <p>💡 所有转换在浏览器本地完成，数据不会上传到任何服务器。TOML/INI 使用自研轻量解析器，覆盖常见格式。</p>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'TOML/INI配置转换器 - 野火小站' })

const inputText = ref('')
const inputFormat = ref('toml')
const outputFormat = ref('json')
const outputText = ref('')
const errorMsg = ref('')
const copyLabel = ref('复制')

const inputPlaceholder = computed(() => {
  const map = {
    toml: '[title]\nkey = "value"\n\n[section.subsection]\nnum = 42',
    ini: '[section]\nkey = value\n; 这是注释\n\n[section.sub]\nflag = true',
    json: '{\n  "key": "value",\n  "section": {\n    "num": 42\n  }\n}',
  }
  return map[inputFormat.value] || ''
})

// ==================== 预设模板 ====================
const templates = [
  {
    name: 'Nuxt 配置',
    icon: '⚡',
    format: 'toml',
    content: `# Nuxt Configuration
[app]
head = { title = "My App", meta = [{ charset = "utf-8" }] }

[runtimeConfig]
public = { apiBase = "/api" }
private = { secretKey = "your-secret" }

[modules]
path = "~/modules"

[routeRules]
"/api/**" = { cors = true }
"/_nuxt/**" = { headers = { "cache-control" = "public, max-age=31536000" } }`,
  },
  {
    name: 'Docker 配置',
    icon: '🐳',
    format: 'toml',
    content: `# Docker Compose Config
[services.web]
image = "nginx:alpine"
ports = ["80:80", "443:443"]
restart = "unless-stopped"

[services.web.environment]
NODE_ENV = "production"
PORT = "80"

[services.db]
image = "postgres:16"
volumes = ["pgdata:/var/lib/postgresql/data"]

[services.redis]
image = "redis:7-alpine"
ports = ["6379:6379"]

[volumes]
pgdata = {}`,
  },
  {
    name: 'SSH 配置',
    icon: '🔐',
    format: 'ini',
    content: `; SSH Client Configuration
Host github
    HostName github.com
    User git
    Port 22
    IdentityFile ~/.ssh/id_ed25519

Host server
    HostName 192.168.1.100
    User admin
    Port 2222
    ForwardAgent yes

Host work
    HostName 10.0.0.5
    User deploy
    ProxyJump server`,
  },
]

function loadTemplate(tpl) {
  inputFormat.value = tpl.format
  inputText.value = tpl.content
  convert()
}

function swapFormats() {
  const tmpFormat = inputFormat.value
  inputFormat.value = outputFormat.value
  outputFormat.value = tmpFormat
  inputText.value = outputText.value
  convert()
}

// ==================== TOML 简单解析器 ====================
function parseTOML(text) {
  const result = {}
  const lines = text.split('\n')
  let currentSection = null

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim()
    // 空行或注释
    if (!line || line.startsWith('#')) continue
    // 移除行内注释（# 后面的内容，但不在引号内）
    line = removeInlineComment(line)

    // 表头 [section] 或 [section.sub]
    const tableMatch = line.match(/^\[([^\]]+)\]$/)
    if (tableMatch) {
      currentSection = tableMatch[1].trim()
      continue
    }

    // 键值对
    const kvMatch = line.match(/^([^=]+?)=(.*)$/)
    if (kvMatch) {
      const key = kvMatch[1].trim()
      let val = kvMatch[2].trim()
      const parsedVal = parseTomlValue(val)
      setNestedValue(result, currentSection, key, parsedVal)
    }
  }
  return result
}

function removeInlineComment(line) {
  let inString = false
  let stringChar = ''
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inString) {
      if (ch === stringChar && line[i - 1] !== '\\') inString = false
    } else {
      if (ch === '"' || ch === "'") { inString = true; stringChar = ch }
      else if (ch === '#' && (i === 0 || line[i - 1] === ' ')) return line.slice(0, i).trim()
    }
  }
  return line
}

function parseTomlValue(val) {
  // 字符串
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    return val.slice(1, -1).replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"')
  }
  // 三引号字符串（简单处理）
  if (val.startsWith('"""') || val.startsWith("'''")) return val.slice(3, -3)
  // 布尔
  if (val === 'true') return true
  if (val === 'false') return false
  // 数字
  if (/^-?\d+(\.\d+)?$/.test(val)) return Number(val)
  // 数组（简单支持）
  if (val.startsWith('[') && val.endsWith(']')) {
    const inner = val.slice(1, -1).trim()
    if (!inner) return []
    return inner.split(',').map(item => parseTomlValue(item.trim()))
  }
  // 内联表（简单支持）
  if (val.startsWith('{') && val.endsWith('}')) {
    const inner = val.slice(1, -1).trim()
    if (!inner) return {}
    const obj = {}
    inner.split(',').forEach(pair => {
      const eq = pair.indexOf('=')
      if (eq !== -1) {
        obj[pair.slice(0, eq).trim()] = parseTomlValue(pair.slice(eq + 1).trim())
      }
    })
    return obj
  }
  return val
}

function setNestedValue(obj, section, key, value) {
  const parts = section ? section.split('.') : []
  parts.push(key)
  let current = obj
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) current[parts[i]] = {}
    current = current[parts[i]]
  }
  // 如果目标已经是对象而新值也是对象，合并
  const lastKey = parts[parts.length - 1]
  if (typeof value === 'object' && value !== null && !Array.isArray(value) && typeof current[lastKey] === 'object' && current[lastKey] !== null && !Array.isArray(current[lastKey])) {
    Object.assign(current[lastKey], value)
  } else {
    current[lastKey] = value
  }
}

// ==================== TOML 序列化 ====================
function toTOML(obj, prefix = '') {
  let result = ''
  const simpleKeys = []
  const objectKeys = []
  const arrayTableKeys = []

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue
    if (typeof value === 'object' && !Array.isArray(value)) {
      if (Object.keys(value).length > 0) objectKeys.push(key)
      else simpleKeys.push(key)
    } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      arrayTableKeys.push(key)
    } else {
      simpleKeys.push(key)
    }
  }

  // 简单键值对
  for (const key of simpleKeys) {
    result += `${key} = ${formatTomlValue(obj[key])}\n`
  }
  if (simpleKeys.length > 0) result += '\n'

  // 对象（表）
  for (const key of objectKeys) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    result += `[${fullKey}]\n`
    result += toTOML(obj[key], fullKey)
  }

  // 数组表
  for (const key of arrayTableKeys) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    for (const item of obj[key]) {
      result += `[[${fullKey}]]\n`
      if (typeof item === 'object') {
        for (const [k, v] of Object.entries(item)) {
          result += `${k} = ${formatTomlValue(v)}\n`
        }
        result += '\n'
      }
    }
  }

  return result
}

function formatTomlValue(val) {
  if (typeof val === 'string') return `"${val.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`
  if (typeof val === 'boolean') return val ? 'true' : 'false'
  if (val === null || val === undefined) return '""'
  if (typeof val === 'object') {
    if (Array.isArray(val)) {
      if (val.length === 0) return '[]'
      // 检查是否是简单数组
      if (val.every(v => typeof v !== 'object')) {
        return `[${val.map(v => formatTomlValue(v)).join(', ')}]`
      }
      // 内联表数组（简单支持）
      return `[${val.map(v => formatTomlValue(v)).join(', ')}]`
    }
    // 内联表
    const pairs = Object.entries(val).map(([k, v]) => `${k} = ${formatTomlValue(v)}`)
    return `{ ${pairs.join(', ')} }`
  }
  return String(val)
}

// ==================== INI 解析器 ====================
function parseINI(text) {
  const result = {}
  let currentSection = ''

  for (const rawLine of text.split('\n')) {
    let line = rawLine.trim()
    // 空行或注释（; 或 #）
    if (!line || line.startsWith(';') || line.startsWith('#')) continue

    // 节 [section]
    const sectionMatch = line.match(/^\[([^\]]+)\]$/)
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim()
      continue
    }

    // 键值对
    const eqIndex = line.indexOf('=')
    if (eqIndex !== -1) {
      const key = line.slice(0, eqIndex).trim()
      const val = line.slice(eqIndex + 1).trim()
      // 去掉引号
      const cleanVal = ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
        ? val.slice(1, -1) : val
      if (!result[currentSection]) result[currentSection] = {}
      result[currentSection][key] = autoParseValue(cleanVal)
    }
  }
  return result
}

function autoParseValue(val) {
  if (val === 'true') return true
  if (val === 'false') return false
  if (/^-?\d+(\.\d+)?$/.test(val)) return Number(val)
  return val
}

// ==================== INI 序列化 ====================
function toINI(obj) {
  let result = ''
  for (const [section, values] of Object.entries(obj)) {
    if (typeof values !== 'object' || values === null || Array.isArray(values)) continue
    result += `[${section}]\n`
    for (const [key, val] of Object.entries(values)) {
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        // 嵌套对象作为 key.subkey = value
        for (const [subKey, subVal] of Object.entries(val)) {
          result += `${key}.${subKey} = ${formatINIValue(subVal)}\n`
        }
      } else {
        result += `${key} = ${formatINIValue(val)}\n`
      }
    }
    result += '\n'
  }
  return result.trim()
}

function formatINIValue(val) {
  if (typeof val === 'string') return val.includes(' ') ? `"${val}"` : val
  return String(val)
}

// ==================== 转换逻辑 ====================
function convert() {
  errorMsg.value = ''
  outputText.value = ''

  if (!inputText.value.trim()) return

  try {
    let data = null

    // 解析输入
    if (inputFormat.value === 'toml') {
      data = parseTOML(inputText.value)
    } else if (inputFormat.value === 'ini') {
      data = parseINI(inputText.value)
    } else if (inputFormat.value === 'json') {
      data = JSON.parse(inputText.value)
    }

    // 序列化输出
    if (outputFormat.value === 'json') {
      outputText.value = JSON.stringify(data, null, 2)
    } else if (outputFormat.value === 'toml') {
      outputText.value = toTOML(data)
    } else if (outputFormat.value === 'ini') {
      outputText.value = toINI(data)
    }
  } catch (e) {
    errorMsg.value = e.message || '转换失败，请检查输入格式'
  }
}

function copyOutput() {
  navigator.clipboard.writeText(outputText.value).then(() => {
    copyLabel.value = '已复制 ✓'
    setTimeout(() => { copyLabel.value = '复制' }, 1500)
  })
}

// 监听格式切换
watch([inputFormat, outputFormat], convert)
</script>

<style scoped>
.tool-page { padding-top: 0.5rem; }
h2 { font-size: 1.6rem; margin-bottom: 0.3rem; }
.subtitle { color: #888; font-size: 0.95rem; margin-bottom: 1.5rem; }

.format-bar {
  display: flex; align-items: flex-end; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;
}
.format-group { display: flex; flex-direction: column; gap: 0.3rem; }
.format-group label { font-size: 0.85rem; font-weight: 600; color: #555; }
.format-select {
  padding: 0.5rem 0.8rem; border: 2px solid #e0e0e0; border-radius: 8px;
  font-size: 0.95rem; background: white; cursor: pointer; transition: border-color 0.2s;
}
.format-select:focus { outline: none; border-color: #10b981; }
.swap-icon { font-size: 1.4rem; color: #10b981; padding-bottom: 0.3rem; }

.template-bar {
  display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap;
}
.template-bar label { font-size: 0.85rem; font-weight: 600; color: #555; }
.tpl-btn {
  padding: 0.35rem 0.7rem; border: 1px solid #e0e0e0; border-radius: 6px;
  background: white; font-size: 0.82rem; cursor: pointer; transition: all 0.15s;
}
.tpl-btn:hover { border-color: #10b981; color: #22c55e; background: #f0fdf4; }

.editor-area {
  display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;
}
.panel { display: flex; flex-direction: column; }
.panel-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;
}
.panel-header label { font-weight: 600; font-size: 0.95rem; }
.btn-clear { font-size: 0.82rem; color: #888; cursor: pointer; }
.btn-clear:hover { color: #e74c3c; }

textarea {
  width: 100%; padding: 0.75rem; border: 2px solid #e0e0e0; border-radius: 10px;
  font-family: 'Courier New', monospace; font-size: 0.88rem; resize: vertical;
  background: white; line-height: 1.5; box-sizing: border-box;
}
textarea:focus { outline: none; border-color: #22c55e; }
.output-area { background: #f9f9f9; color: #333; }

.error-msg {
  background: #fef2f2; color: #dc2626; padding: 0.6rem 0.8rem;
  border-radius: 6px; margin-top: 0.5rem; font-size: 0.85rem;
}

.btn-copy {
  padding: 0.3rem 0.7rem; border-radius: 6px; font-size: 0.82rem; cursor: pointer;
  background: linear-gradient(135deg, #22c55e, #10b981); color: white;
  transition: opacity 0.2s;
}
.btn-copy:hover { opacity: 0.85; }

.notice {
  background: #f8fff8; border-radius: 10px; padding: 1rem 1.2rem; margin-bottom: 1.5rem;
}
.notice p { font-size: 0.85rem; color: #666; }

.back-link {
  display: inline-block; margin-top: 2rem; color: #22c55e; font-weight: 500;
}
.back-link:hover { text-decoration: underline; }

@media (max-width: 640px) {
  .editor-area { grid-template-columns: 1fr; }
}
</style>
