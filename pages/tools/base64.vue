<template>
  <div class="tool-page">
    <h2>🔤 Base64 编解码</h2>

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

    <div class="panels">
      <div class="panel">
        <label>{{ mode === 'encode' ? '原文' : 'Base64 字符串' }}</label>
        <textarea
          v-model="input"
          :placeholder="mode === 'encode' ? '输入要编码的文本...' : '输入要解码的 Base64 字符串...'"
          rows="6"
        ></textarea>
      </div>

      <div class="panel">
        <label>{{ mode === 'encode' ? 'Base64 结果' : '解码结果' }}</label>
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

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'Base64 编解码 - 野火小站' })

const mode = ref('encode')
const input = ref('')
const copyText = ref('复制')

const output = computed(() => {
  if (!input.value.trim()) return ''
  try {
    if (mode.value === 'encode') {
      return btoa(unescape(encodeURIComponent(input.value)))
    } else {
      return decodeURIComponent(escape(atob(input.value.trim())))
    }
  } catch {
    return '⚠️ 输入内容无效，无法转换'
  }
})

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
  background: linear-gradient(135deg, #ff6b35, #ff8c42);
  color: white;
  font-weight: 600;
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
}

textarea:focus {
  outline: none;
  border-color: #ff8c42;
}

textarea[readonly] {
  background: #f9f9f9;
  color: #333;
}

.btn-copy {
  align-self: flex-end;
  padding: 0.5rem 1.2rem;
  background: linear-gradient(135deg, #ff6b35, #ff8c42);
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

.back-link {
  display: inline-block;
  margin-top: 2.5rem;
  color: #ff6b35;
  font-weight: 500;
}

.back-link:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .panels {
    grid-template-columns: 1fr;
  }
}
</style>
