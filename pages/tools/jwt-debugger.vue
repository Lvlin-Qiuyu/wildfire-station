<template>
  <div class="tool-page">
    <h2>🔐 JWT 令牌调试工具</h2>

    <div class="input-section">
      <label>粘贴 JWT Token</label>
      <textarea
        v-model="jwtInput"
        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        rows="4"
        spellcheck="false"
      ></textarea>
    </div>

    <div v-if="error" class="error-msg">⚠️ {{ error }}</div>

    <div v-if="parsed" class="jwt-visual">
      <div class="jwt-header-part" :class="{ expanded: showHeader }" @click="showHeader = !showHeader">
        <div class="part-label">Header</div>
        <div class="part-preview">{{ parts[0] }}</div>
      </div>
      <div class="jwt-dot">.</div>
      <div class="jwt-payload-part" :class="{ expanded: showPayload }" @click="showPayload = !showPayload">
        <div class="part-label">Payload</div>
        <div class="part-preview">{{ parts[1] }}</div>
      </div>
      <div class="jwt-dot">.</div>
      <div class="jwt-sig-part">
        <div class="part-label">Signature</div>
        <div class="part-preview">{{ parts[2] }}</div>
      </div>
    </div>

    <div v-if="parsed" class="panels">
      <!-- Header -->
      <div class="panel header-panel">
        <div class="panel-header" @click="showHeader = !showHeader">
          <span class="panel-badge red">HEADER</span>
          <span class="panel-toggle">{{ showHeader ? '▼' : '▶' }}</span>
        </div>
        <div v-show="showHeader" class="panel-body">
          <pre class="json-highlight" v-html="highlightedHeader"></pre>
          <button class="btn-copy" @click="copy(decodedHeader)">{{ headerCopyText }}</button>
        </div>
      </div>

      <!-- Payload -->
      <div class="panel payload-panel">
        <div class="panel-header" @click="showPayload = !showPayload">
          <span class="panel-badge blue">PAYLOAD</span>
          <span class="panel-toggle">{{ showPayload ? '▼' : '▶' }}</span>
        </div>
        <div v-show="showPayload" class="panel-body">
          <pre class="json-highlight" v-html="highlightedPayload"></pre>
          <button class="btn-copy" @click="copy(decodedPayload)">{{ payloadCopyText }}</button>
          <!-- Claims -->
          <div v-if="claims.length" class="claims-list">
            <h4>📋 注册声明</h4>
            <div v-for="c in claims" :key="c.key" class="claim-item" :class="{ warn: c.warn }">
              <span class="claim-key">{{ c.key }}</span>
              <span class="claim-value">{{ c.value }}</span>
              <span v-if="c.warn" class="claim-warn">{{ c.warn }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Signature -->
      <div class="panel sig-panel">
        <div class="panel-header">
          <span class="panel-badge green">SIGNATURE</span>
        </div>
        <div class="panel-body">
          <div class="sig-algo">
            签名算法: <strong>{{ algorithm }}</strong>
          </div>
          <div class="sig-text">{{ parts[2] }}</div>
          <button class="btn-copy" @click="copy(parts[2])">复制签名</button>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'JWT 调试工具 - 野火小站' })

const jwtInput = ref('')
const error = ref('')
const parsed = ref(false)
const parts = ref([])
const decodedHeader = ref('')
const decodedPayload = ref('')
const showHeader = ref(true)
const showPayload = ref(true)
const headerCopyText = ref('复制')
const payloadCopyText = ref('复制')

function base64UrlDecode(str) {
  let b = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = b.length % 4
  if (pad) b += '='.repeat(4 - pad)
  return decodeURIComponent(atob(b).split('').map(c =>
    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  ).join(''))
}

function highlightJson(json) {
  try {
    const obj = JSON.parse(json)
    const formatted = JSON.stringify(obj, null, 2)
    return formatted
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"([^"]+)"(?=\s*:)/g, '<span class="json-key">"$1"</span>')
      .replace(/:\s*"([^"]*)"/g, ': <span class="json-string">"$1"</span>')
      .replace(/:\s*(\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
      .replace(/:\s*(true|false)/g, ': <span class="json-bool">$1</span>')
      .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>')
  } catch {
    return json
  }
}

const highlightedHeader = computed(() => highlightJson(decodedHeader.value))
const highlightedPayload = computed(() => highlightJson(decodedPayload.value))

const algorithm = computed(() => {
  try {
    const obj = JSON.parse(decodedHeader.value)
    return obj.alg || '未知'
  } catch { return '未知' }
})

const claims = computed(() => {
  try {
    const obj = JSON.parse(decodedPayload.value)
    const result = []
    const now = Math.floor(Date.now() / 1000)

    if (obj.sub) result.push({ key: 'sub', value: obj.sub })
    if (obj.iss) result.push({ key: 'iss', value: obj.iss })
    if (obj.aud) result.push({ key: 'aud', value: Array.isArray(obj.aud) ? obj.aud.join(', ') : obj.aud })
    if (obj.exp) {
      const d = new Date(obj.exp * 1000)
      const expired = now > obj.exp
      result.push({ key: 'exp', value: d.toLocaleString('zh-CN'), warn: expired ? '⚠️ 已过期' : '✅ 未过期' })
    }
    if (obj.nbf) {
      const d = new Date(obj.nbf * 1000)
      const active = now >= obj.nbf
      result.push({ key: 'nbf', value: d.toLocaleString('zh-CN'), warn: active ? '' : '⏳ 尚未生效' })
    }
    if (obj.iat) result.push({ key: 'iat', value: new Date(obj.iat * 1000).toLocaleString('zh-CN') })
    if (obj.jti) result.push({ key: 'jti', value: obj.jti })

    return result
  } catch { return [] }
})

watch(jwtInput, (val) => {
  error.value = ''
  parsed.value = false
  if (!val.trim()) return

  const segs = val.trim().split('.')
  if (segs.length !== 3) {
    error.value = 'JWT 格式错误：需要3个部分，用 `.` 分隔'
    return
  }

  try {
    decodedHeader.value = base64UrlDecode(segs[0])
    JSON.parse(decodedHeader.value)
  } catch {
    error.value = 'Header 解码失败，不是有效的 Base64URL JSON'
    return
  }

  try {
    decodedPayload.value = base64UrlDecode(segs[1])
    JSON.parse(decodedPayload.value)
  } catch {
    error.value = 'Payload 解码失败，不是有效的 Base64URL JSON'
    return
  }

  parts.value = segs
  parsed.value = true
  showHeader.value = true
  showPayload.value = true
})

function copy(text) {
  navigator.clipboard.writeText(text).then(() => {
    // visual feedback omitted for brevity
  })
}
</script>

<style scoped>
.tool-page {
  padding-top: 0.5rem;
}

h2 {
  font-size: 1.6rem;
  margin-bottom: 1.5rem;
}

h4 {
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
  color: #555;
}

.input-section label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.input-section textarea {
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-family: monospace;
  font-size: 0.9rem;
  outline: none;
  resize: vertical;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.input-section textarea:focus {
  border-color: #22c55e;
}

.error-msg {
  background: #fef2f2;
  color: #dc2626;
  padding: 0.8rem 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  font-size: 0.95rem;
}

.jwt-visual {
  display: flex;
  align-items: center;
  margin: 1.5rem 0;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.jwt-header-part {
  flex: 1.5;
  background: #fee2e2;
  padding: 0.6rem;
  cursor: pointer;
}

.jwt-payload-part {
  flex: 2;
  background: #dbeafe;
  padding: 0.6rem;
  cursor: pointer;
}

.jwt-sig-part {
  flex: 1.5;
  background: #d1fae5;
  padding: 0.6rem;
}

.jwt-dot {
  padding: 0 0.3rem;
  font-weight: 700;
  font-size: 1.2rem;
  color: #666;
}

.part-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #888;
  margin-bottom: 0.2rem;
}

.part-preview {
  font-family: monospace;
  font-size: 0.65rem;
  color: #555;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panels {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.panel {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(0,0,0,0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 1rem;
  cursor: pointer;
}

.header-panel .panel-header {
  background: #fee2e2;
}

.payload-panel .panel-header {
  background: #dbeafe;
}

.sig-panel .panel-header {
  background: #d1fae5;
}

.panel-badge {
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 700;
  color: white;
}

.panel-badge.red { background: #ef4444; }
.panel-badge.blue { background: #3b82f6; }
.panel-badge.green { background: #22c55e; }

.panel-toggle {
  font-size: 0.8rem;
  color: #888;
}

.panel-body {
  padding: 1rem;
  background: #1a1a2e;
}

.json-highlight {
  margin: 0;
  font-family: monospace;
  font-size: 0.85rem;
  line-height: 1.6;
  color: #e0e0e0;
  overflow-x: auto;
  white-space: pre-wrap;
}

.json-key { color: #7dd3fc; }
.json-string { color: #86efac; }
.json-number { color: #fbbf24; }
.json-bool { color: #c084fc; }
.json-null { color: #94a3b8; }

.claims-list {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #333;
}

.claim-item {
  display: flex;
  gap: 0.5rem;
  padding: 0.3rem 0;
  font-size: 0.85rem;
  align-items: center;
  flex-wrap: wrap;
}

.claim-key {
  font-weight: 700;
  color: #7dd3fc;
  min-width: 40px;
}

.claim-value {
  color: #e0e0e0;
  flex: 1;
}

.claim-warn {
  font-size: 0.8rem;
  color: #fbbf24;
}

.claim-item.warn .claim-key { color: #f87171; }

.sig-panel .panel-body {
  background: #f0fdf4;
}

.sig-algo {
  margin-bottom: 0.8rem;
  font-size: 0.95rem;
  color: #333;
}

.sig-text {
  font-family: monospace;
  font-size: 0.8rem;
  color: #666;
  word-break: break-all;
  background: white;
  padding: 0.6rem;
  border-radius: 6px;
  margin-bottom: 0.8rem;
}

.btn-copy {
  padding: 0.4rem 1rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: transform 0.2s;
}

.btn-copy:active {
  transform: scale(0.95);
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
  .jwt-visual {
    flex-direction: column;
  }
  .jwt-dot {
    text-align: center;
    padding: 0;
  }
  .jwt-header-part,
  .jwt-payload-part,
  .jwt-sig-part {
    flex: unset;
  }
}
</style>
