<template>
  <div class="tool-page">
    <h2>🔗 URL 编解码</h2>

    <!-- 模式切换 -->
    <div class="mode-switch">
      <button
        :class="{ active: mode === 'encode' }"
        @click="mode = 'encode'"
      >编码</button>
      <button
        :class="{ active: mode === 'decode' }"
        @click="mode = 'decode'"
      >解码</button>
    </div>

    <!-- 编码选项 -->
    <div v-if="mode === 'encode'" class="options">
      <label class="option-label">
        <input type="radio" v-model="encodeMode" value="full" />
        完整编码（编码所有特殊字符）
      </label>
      <label class="option-label">
        <input type="radio" v-model="encodeMode" value="safe" />
        安全编码（保留 URL 安全字符：/:?=& 等）
      </label>
    </div>

    <!-- 输入输出面板 -->
    <div class="panels">
      <div class="panel">
        <label>{{ mode === 'encode' ? '原文' : '编码后的 URL' }}</label>
        <textarea
          v-model="input"
          :placeholder="mode === 'encode' ? '输入要编码的文本...' : '输入要解码的 URL 字符串...'"
          rows="6"
          @input="onInputChange"
        ></textarea>
      </div>

      <div class="panel">
        <label>{{ mode === 'encode' ? '编码结果' : '解码结果' }}</label>
        <textarea
          :value="output"
          readonly
          rows="6"
          placeholder="结果将在这里显示..."
        ></textarea>
        <button v-if="output" class="btn-copy" @click="copyResult">
          {{ copyText }}
        </button>
      </div>
    </div>

    <!-- 对比信息 -->
    <div v-if="input && output" class="compare-info">
      <span>原文长度: <strong>{{ input.length }}</strong></span>
      <span>结果长度: <strong>{{ output.length }}</strong></span>
      <span>变化: <strong>{{ diffText }}</strong></span>
    </div>

    <!-- 场景模板 -->
    <div class="templates">
      <h3>📋 常用场景</h3>
      <div class="template-grid">
        <button
          v-for="t in templates"
          :key="t.label"
          class="template-btn"
          @click="applyTemplate(t)"
        >
          <span class="tpl-label">{{ t.label }}</span>
          <span class="tpl-desc">{{ t.desc }}</span>
        </button>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'URL 编解码 - 野火小站' })

const mode = ref('encode')
const encodeMode = ref('full')
const input = ref('')
const copyText = ref('复制')

const templates = [
  {
    label: '空格编码',
    desc: 'hello world',
    input: 'hello world',
    encodeMode: 'full'
  },
  {
    label: '中文 URL',
    desc: '中文路径参数',
    input: 'https://example.com/搜索?q=野火小站',
    encodeMode: 'safe'
  },
  {
    label: '查询参数',
    desc: '带特殊字符',
    input: 'name=John Doe&email=john@example.com&message=Hello, 世界!',
    encodeMode: 'full'
  },
  {
    label: '带 # 号',
    desc: '锚点 & 片段',
    input: 'https://example.com/page#section=概述&lang=中文',
    encodeMode: 'safe'
  },
  {
    label: '表情符号',
    desc: 'Emoji in URL',
    input: 'https://example.com/api?q=🔥野火小站🦞',
    encodeMode: 'safe'
  },
  {
    label: '已编码 URL',
    desc: '解码示例',
    input: 'https%3A%2F%2Fexample.com%2F%E9%87%8E%E7%81%AB%E5%B0%8F%E7%AB%99%3Fq%3D%E5%B7%A5%E5%85%B7',
    encodeMode: 'full',
    forceDecode: true
  }
]

function onInputChange() {
  // 实时计算，computed 已处理
}

function encodeFull(str) {
  return encodeURIComponent(str).replace(/%20/g, '+')
}

function encodeSafe(str) {
  // 按段落处理：按 & 和 = 分割，只编码值部分
  const parts = str.split('?')
  const base = parts[0]
  if (parts.length <= 1) return encodeFull(str)

  const queryParts = parts.slice(1).join('?')
  const params = queryParts.split('&')
  const encoded = params.map(param => {
    const [key, ...rest] = param.split('=')
    const value = rest.join('=')
    if (value !== undefined) {
      return encodeURIComponent(key) + '=' + encodeURIComponent(value).replace(/%20/g, '+')
    }
    return encodeURIComponent(key)
  })
  return base + '?' + encoded.join('&')
}

const output = computed(() => {
  if (!input.value.trim()) return ''
  try {
    if (mode.value === 'encode') {
      if (encodeMode.value === 'full') {
        return encodeFull(input.value)
      } else {
        return encodeSafe(input.value)
      }
    } else {
      return decodeURIComponent(input.value.trim())
    }
  } catch {
    return '⚠️ 输入内容无效，无法转换'
  }
})

const diffText = computed(() => {
  if (!output.value || output.value.startsWith('⚠️')) return '-'
  const diff = output.value.length - input.value.length
  if (diff === 0) return '无变化'
  return (diff > 0 ? '+' : '') + diff + ' 字符'
})

function applyTemplate(tpl) {
  if (tpl.forceDecode) {
    mode.value = 'decode'
  } else {
    mode.value = 'encode'
  }
  input.value = tpl.input
  encodeMode.value = tpl.encodeMode || 'full'
}

function copyResult() {
  navigator.clipboard.writeText(output.value).then(() => {
    copyText.value = '已复制 ✓'
    setTimeout(() => { copyText.value = '复制' }, 1500)
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

.mode-switch {
  display: flex;
  gap: 0;
  margin-bottom: 1.5rem;
  background: #e9ecef;
  border-radius: 8px;
  overflow: hidden;
}

.mode-switch button {
  flex: 1;
  padding: 0.6rem 1.5rem;
  border: none;
  background: transparent;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}

.mode-switch button.active {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  font-weight: 600;
}

.options {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.2rem;
  padding: 0.8rem 1rem;
  background: #f8fdf9;
  border-radius: 8px;
  border: 1px solid #d1fae5;
  flex-wrap: wrap;
}

.option-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.92rem;
  color: #555;
  cursor: pointer;
}

.option-label input[type="radio"] {
  accent-color: #10b981;
}

.panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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
  font-size: 0.95rem;
  font-family: 'Courier New', monospace;
  resize: vertical;
  background: white;
  transition: border-color 0.2s;
  line-height: 1.5;
  word-break: break-all;
}

textarea:focus {
  outline: none;
  border-color: #10b981;
}

textarea[readonly] {
  background: #f9f9f9;
  color: #333;
}

.btn-copy {
  align-self: flex-end;
  padding: 0.5rem 1.2rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: opacity 0.2s;
}

.btn-copy:hover {
  opacity: 0.85;
}

.compare-info {
  display: flex;
  gap: 1.5rem;
  margin-top: 1rem;
  padding: 0.6rem 1rem;
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #777;
  flex-wrap: wrap;
}

.compare-info strong {
  color: #333;
}

.templates {
  margin-top: 2rem;
}

.templates h3 {
  font-size: 1.1rem;
  margin-bottom: 0.8rem;
  color: #444;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.6rem;
}

.template-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
  padding: 0.7rem 0.9rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.template-btn:hover {
  border-color: #10b981;
  background: #f0fdf4;
}

.tpl-label {
  font-weight: 600;
  font-size: 0.9rem;
  color: #333;
}

.tpl-desc {
  font-size: 0.78rem;
  color: #999;
  word-break: break-all;
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
  .template-grid {
    grid-template-columns: 1fr 1fr;
  }
  .options {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
