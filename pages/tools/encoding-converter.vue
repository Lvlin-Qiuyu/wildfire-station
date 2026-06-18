<template>
  <div class="tool-page">
    <h2>🔤 万能编码转换器</h2>

    <div class="input-section">
      <label>输入文本</label>
      <textarea
        v-model="input"
        placeholder="在此输入要转换的文本..."
        rows="4"
      ></textarea>
    </div>

    <div v-if="input" class="encodings">
      <div v-for="enc in encodings" :key="enc.name" class="encoding-item">
        <div class="enc-header" @click="toggleExpand(enc.name)">
          <span class="enc-name">{{ enc.icon }} {{ enc.name }}</span>
          <span class="enc-toggle">{{ expandedSet.has(enc.name) ? '▼' : '▶' }}</span>
        </div>
        <div v-show="expandedSet.has(enc.name)" class="enc-body">
          <div class="enc-value" @click="copyResult(enc.name)">{{ enc.result }}</div>
          <button class="btn-copy" @click="copyResult(enc.name)">{{ copyTextMap[enc.name] || '复制' }}</button>
        </div>
      </div>
    </div>

    <div v-else class="placeholder-msg">
      💡 输入文本后，实时显示10种编码结果
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '万能编码转换器 - 野火小站' })

const input = ref('')
const expandedSet = ref(new Set(['Hex', 'Base64', 'URL编码']))
const copyTextMap = reactive({})

function toggleExpand(name) {
  if (expandedSet.value.has(name)) {
    expandedSet.value.delete(name)
  } else {
    expandedSet.value.add(name)
  }
}

function toHex(str) {
  return Array.from(str).map(c => c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()).join(' ')
}

function toOctal(str) {
  return Array.from(str).map(c => '\\' + c.charCodeAt(0).toString(8).padStart(3, '0')).join(' ')
}

function toBinary(str) {
  return Array.from(str).map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ')
}

function toUnicode(str) {
  return Array.from(str).map(c => {
    const code = c.codePointAt(0)
    return code > 0xFFFF ? `U+${code.toString(16).toUpperCase().padStart(2, '0')}` : `U+${code.toString(16).toUpperCase().padStart(4, '0')}`
  }).join(' ')
}

function toHtmlEntities(str) {
  return Array.from(str).map(c => `&#${c.codePointAt(0)};`).join('')
}

function toCssEscape(str) {
  return Array.from(str).map(c => {
    const hex = c.codePointAt(0).toString(16).toUpperCase().padStart(2, '0')
    return c.codePointAt(0) > 127 ? `\\${hex}` : c
  }).join('')
}

function toUrlEncoded(str) {
  return encodeURIComponent(str)
}

function toBase64(str) {
  try {
    return btoa(unescape(encodeURIComponent(str)))
  } catch { return '编码失败' }
}

function toUtf8Bytes(str) {
  const encoder = new TextEncoder()
  return Array.from(encoder.encode(str)).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
}

function toPunycode(str) {
  const ascii = Array.from(str).filter(c => c.charCodeAt(0) < 128).join('')
  const nonAscii = Array.from(str).filter(c => c.charCodeAt(0) >= 128)
  if (!nonAscii.length) return str
  const mapped = nonAscii.map(c => {
    const cp = c.codePointAt(0)
    if (cp === 0x3007) return 'zero'
    if (cp >= 0x4E00 && cp <= 0x9FFF) {
      const offset = cp - 0x4E00
      return String.fromCharCode(0x61 + Math.floor(offset / 26)) + String.fromCharCode(0x61 + offset % 26)
    }
    return 'xn--' + cp.toString(36)
  })
  return (ascii ? ascii + '.' : '') + 'xn--' + mapped.join('')
}

const encodings = computed(() => {
  if (!input.value) return []
  const s = input.value
  return [
    { name: 'Hex', icon: '🔢', result: toHex(s) },
    { name: 'Octal', icon: '🟣', result: toOctal(s) },
    { name: 'Binary', icon: '💻', result: toBinary(s) },
    { name: 'Unicode', icon: '🌐', result: toUnicode(s) },
    { name: 'HTML实体', icon: '📝', result: toHtmlEntities(s) },
    { name: 'CSS转义', icon: '🎨', result: toCssEscape(s) },
    { name: 'URL编码', icon: '🔗', result: toUrlEncoded(s) },
    { name: 'Base64', icon: '📦', result: toBase64(s) },
    { name: 'UTF-8字节', icon: '📊', result: toUtf8Bytes(s) },
    { name: 'Punycode', icon: '🏷️', result: toPunycode(s) },
  ]
})

function copyResult(name) {
  const enc = encodings.value.find(e => e.name === name)
  if (!enc) return
  navigator.clipboard.writeText(enc.result).then(() => {
    copyTextMap[name] = '已复制 ✓'
    setTimeout(() => { copyTextMap[name] = '复制' }, 1500)
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
  font-size: 1rem;
  outline: none;
  resize: vertical;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.input-section textarea:focus {
  border-color: #22c55e;
}

.placeholder-msg {
  text-align: center;
  color: #999;
  margin: 3rem 0;
  font-size: 1.1rem;
}

.encodings {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.encoding-item {
  background: #f8f9fa;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e9ecef;
}

.enc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.7rem 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.enc-header:hover {
  background: #f0fdf4;
}

.enc-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.enc-toggle {
  color: #999;
  font-size: 0.8rem;
}

.enc-body {
  padding: 0 1rem 0.8rem;
}

.enc-value {
  background: #1a1a2e;
  color: #a5d6a7;
  padding: 0.8rem;
  border-radius: 8px;
  font-family: monospace;
  font-size: 0.85rem;
  word-break: break-all;
  line-height: 1.5;
  margin-bottom: 0.6rem;
  cursor: pointer;
  white-space: pre-wrap;
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
</style>
