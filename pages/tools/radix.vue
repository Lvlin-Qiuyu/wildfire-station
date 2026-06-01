<template>
  <div class="tool-page">
    <h2>🔢 进制转换器</h2>

    <div class="input-row">
      <input
        v-model="rawInput"
        placeholder="输入数字..."
        class="main-input"
        @input="convertAll"
      />
    </div>

    <div class="results">
      <div v-for="base in bases" :key="base.name" class="result-card">
        <div class="result-header">
          <span class="base-badge">{{ base.label }}</span>
          <span class="base-name">{{ base.name }}</span>
        </div>
        <div class="result-value">
          <code v-if="results[base.name] !== undefined">{{ results[base.name] }}</code>
          <span v-else class="placeholder">-</span>
        </div>
        <button
          v-if="results[base.name]"
          class="btn-copy"
          @click="copy(results[base.name], base.name)"
        >
          {{ copied === base.name ? '已复制 ✓' : '复制' }}
        </button>
      </div>
    </div>

    <div class="tips">
      <p>💡 支持输入任意进制的数字，自动识别前缀：</p>
      <p><code>0x</code> 十六进制 &nbsp; <code>0o</code> 八进制 &nbsp; <code>0b</code> 二进制 &nbsp; 纯数字默认十进制</p>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '进制转换器 - 野火小站' })

const rawInput = ref('')
const copied = ref('')

const bases = [
  { name: 'bin', label: 'BIN', radix: 2, title: '二进制' },
  { name: 'oct', label: 'OCT', radix: 8, title: '八进制' },
  { name: 'dec', label: 'DEC', radix: 10, title: '十进制' },
  { name: 'hex', label: 'HEX', radix: 16, title: '十六进制' },
  { name: 'base64', label: 'B64', radix: null, title: 'Base64' },
]

const results = reactive({
  bin: undefined,
  oct: undefined,
  dec: undefined,
  hex: undefined,
  base64: undefined,
})

function parseInput(input) {
  const s = input.trim()
  if (!s) return null

  if (/^-?0x[0-9a-fA-F]+$/.test(s)) return parseInt(s, 16)
  if (/^-?0o[0-7]+$/.test(s)) return parseInt(s.slice(2), 8)
  if (/^-?0b[01]+$/.test(s)) return parseInt(s.slice(2), 2)
  if (/^-?\d+$/.test(s)) return parseInt(s, 10)

  return null
}

function convertAll() {
  const num = parseInput(rawInput.value)
  if (num === null || isNaN(num)) {
    bases.forEach(b => { results[b.name] = undefined })
    return
  }

  results.bin = (num >>> 0).toString(2)
  results.oct = (num >>> 0).toString(8)
  results.dec = num.toString(10)
  results.hex = (num >>> 0).toString(16).toUpperCase()

  // Base64 of the decimal string
  try {
    results.base64 = btoa(num.toString(10))
  } catch {
    results.base64 = undefined
  }
}

function copy(value, name) {
  navigator.clipboard.writeText(value).then(() => {
    copied.value = name
    setTimeout(() => { copied.value = '' }, 1500)
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

.input-row {
  margin-bottom: 1.5rem;
}

.main-input {
  width: 100%;
  padding: 0.9rem 1rem;
  border: 2px solid #ddd;
  border-radius: 10px;
  font-size: 1.1rem;
  font-family: 'Courier New', monospace;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.main-input:focus {
  outline: none;
  border-color: #10b981;
}

.results {
  display: grid;
  gap: 1rem;
}

.result-card {
  background: white;
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 1rem 1.2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: border-color 0.2s;
}

.result-card:hover {
  border-color: #10b981;
}

.result-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
}

.base-badge {
  font-size: 0.75rem;
  font-weight: 700;
  color: #22c55e;
  background: #fff3ed;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.base-name {
  font-size: 0.8rem;
  color: #999;
  margin-top: 0.25rem;
}

.result-value {
  flex: 1;
  min-width: 0;
}

.result-value code {
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  color: #2c3e50;
  word-break: break-all;
  display: block;
}

.placeholder {
  color: #ccc;
}

.btn-copy {
  flex-shrink: 0;
  padding: 0.4rem 1rem;
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

.tips {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.6;
}

.tips code {
  background: #e9ecef;
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  font-size: 0.85rem;
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
  .result-card {
    flex-wrap: wrap;
  }
  .result-header {
    min-width: 50px;
  }
}
</style>
