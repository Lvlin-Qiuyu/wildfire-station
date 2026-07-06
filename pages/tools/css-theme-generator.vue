<template>
  <div class="tool-page">
    <h2>🎨 CSS 变量主题生成器</h2>
    <p class="subtitle">定义 CSS 自定义属性，自动生成明暗两套主题，实时预览组件效果</p>

    <!-- 主题切换 -->
    <div class="theme-switch">
      <button :class="{ active: theme === 'light' }" @click="theme = 'light'">☀️ 浅色主题</button>
      <button :class="{ active: theme === 'dark' }" @click="theme = 'dark'">🌙 深色主题</button>
    </div>

    <!-- 颜色变量编辑 -->
    <div class="variables-section">
      <h3>🎨 自定义属性</h3>
      <div class="var-grid">
        <div v-for="v in variables" :key="v.key" class="var-item">
          <label>{{ v.label }}</label>
          <div class="var-row">
            <input type="color" v-model="v.value" class="color-picker" />
            <input type="text" v-model="v.value" class="hex-input" maxlength="7" />
            <button class="reset-btn" @click="v.value = v.default" title="重置默认值">↺</button>
          </div>
        </div>
      </div>
      <div class="add-var-section">
        <input type="text" v-model="newVarName" placeholder="变量名（如 --accent）" class="var-name-input" />
        <input type="color" v-model="newVarColor" class="color-picker" />
        <input type="text" v-model="newVarColor" class="hex-input small" maxlength="7" />
        <button class="add-btn" @click="addVariable">+ 添加</button>
      </div>
    </div>

    <!-- 实时预览 -->
    <div class="preview-section">
      <h3>👁️ 组件预览</h3>
      <div class="preview-wrapper" :class="theme">
        <div class="preview-card">
          <div class="preview-card-header">卡片标题</div>
          <div class="preview-card-body">
            <p>这是一段示例文本，展示主题颜色效果。好的主题设计应该兼顾可读性和美观性。</p>
            <button class="preview-btn primary">主要按钮</button>
            <button class="preview-btn secondary">次要按钮</button>
          </div>
        </div>

        <div class="preview-form">
          <input type="text" placeholder="输入框示例" class="preview-input" />
          <div class="preview-toggle">
            <span class="toggle-label">开关</span>
            <div :class="['toggle-switch', { on: toggleOn }]" @click="toggleOn = !toggleOn">
              <div class="toggle-knob"></div>
            </div>
          </div>
        </div>

        <div class="preview-alerts">
          <div class="alert success">✅ 操作成功！数据已保存。</div>
          <div class="alert warning">⚠️ 警告：存储空间即将满。</div>
          <div class="alert error">❌ 错误：网络连接超时。</div>
          <div class="alert info">ℹ️ 提示：新版本已发布。</div>
        </div>

        <div class="preview-badge-row">
          <span class="badge">标签一</span>
          <span class="badge">标签二</span>
          <span class="badge accent">特色标签</span>
        </div>
      </div>
    </div>

    <!-- 生成的 CSS 代码 -->
    <div class="code-section">
      <h3>💻 生成的 CSS 代码</h3>
      <div class="code-tabs">
        <button :class="{ active: codeTab === 'root' }" @click="codeTab = 'root'">:root</button>
        <button :class="{ active: codeTab === 'dark' }" @click="codeTab = 'dark'">.dark</button>
        <button :class="{ active: codeTab === 'usage' }" @click="codeTab = 'usage'">用法示例</button>
      </div>
      <div class="code-block">
        <pre>{{ currentCode }}</pre>
      </div>
      <div class="code-actions">
        <button class="copy-btn" @click="copyCSS">{{ copyText }}</button>
        <button class="download-btn" @click="downloadCSS">📥 下载 CSS 文件</button>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'CSS变量主题生成器 - 野火小站' })

const theme = ref('light')
const toggleOn = ref(true)
const codeTab = ref('root')
const copyText = ref('📋 复制代码')

const newVarName = ref('')
const newVarColor = ref('#6366f1')

// 默认颜色变量
const variables = reactive([
  { key: '--primary', label: '主色 (primary)', value: '#22c55e', default: '#22c55e' },
  { key: '--primary-text', label: '主色文字', value: '#ffffff', default: '#ffffff' },
  { key: '--secondary', label: '辅助色 (secondary)', value: '#3b82f6', default: '#3b82f6' },
  { key: '--accent', label: '强调色 (accent)', value: '#f59e0b', default: '#f59e0b' },
  { key: '--background', label: '背景色', value: '#ffffff', default: '#ffffff' },
  { key: '--surface', label: '卡片背景', value: '#f8fafc', default: '#f8fafc' },
  { key: '--text', label: '正文文字', value: '#1e293b', default: '#1e293b' },
  { key: '--text-secondary', label: '次要文字', value: '#64748b', default: '#64748b' },
  { key: '--border', label: '边框色', value: '#e2e8f0', default: '#e2e8f0' },
  { key: '--danger', label: '危险色', value: '#ef4444', default: '#ef4444' },
  { key: '--warning', label: '警告色', value: '#f59e0b', default: '#f59e0b' },
  { key: '--success', label: '成功色', value: '#22c55e', default: '#22c55e' },
  { key: '--info', label: '信息色', value: '#3b82f6', default: '#3b82f6' },
  { key: '--radius', label: '圆角', value: '8px', default: '8px' },
])

// 预设暗色主题值
const darkDefaults = {
  '--primary': '#22c55e',
  '--primary-text': '#ffffff',
  '--secondary': '#60a5fa',
  '--accent': '#fbbf24',
  '--background': '#0f172a',
  '--surface': '#1e293b',
  '--text': '#f1f5f9',
  '--text-secondary': '#94a3b8',
  '--border': '#334155',
  '--danger': '#f87171',
  '--warning': '#fbbf24',
  '--success': '#4ade80',
  '--info': '#60a5fa',
  '--radius': '8px',
}

// 添加自定义变量
function addVariable() {
  if (!newVarName.value.trim()) return
  const key = newVarName.value.trim().startsWith('--') ? newVarName.value.trim() : `--${newVarName.value.trim()}`
  // 避免重复
  if (variables.find(v => v.key === key)) return
  variables.push({
    key,
    label: key,
    value: newVarColor.value,
    default: newVarColor.value,
  })
  newVarName.value = ''
}

// 获取当前主题的变量值
function getThemeVars(isDark) {
  return variables.map(v => {
    const val = isDark ? (darkDefaults[v.key] || v.value) : v.value
    return `  ${v.key}: ${val};`
  }).join('\n')
}

// 生成 CSS 代码
const currentCode = computed(() => {
  if (codeTab.value === 'root') {
    return `:root {\n${getThemeVars(false)}\n}`
  }
  if (codeTab.value === 'dark') {
    return `.dark {\n${getThemeVars(true)}\n}`
  }
  if (codeTab.value === 'usage') {
    return `/* 使用主题变量 */
.button {
  background-color: var(--primary);
  color: var(--primary-text);
  border-radius: var(--radius);
}

.card {
  background-color: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
}

body {
  background-color: var(--background);
  color: var(--text);
}

/* 切换深色主题 */
document.documentElement.classList.toggle('dark')`
  }
  return ''
})

// 获取当前主题变量映射（用于预览）
const themeVars = computed(() => {
  const isDark = theme.value === 'dark'
  const map = {}
  variables.forEach(v => {
    map[v.key] = isDark ? (darkDefaults[v.key] || v.value) : v.value
  })
  return map
})

// 复制 CSS
function copyCSS() {
  navigator.clipboard.writeText(currentCode.value)
  copyText.value = '✅ 已复制'
  setTimeout(() => { copyText.value = '📋 复制代码' }, 1500)
}

// 下载 CSS 文件
function downloadCSS() {
  const code = `/* 主题变量 - 野火小站 CSS变量主题生成器 */\n\n:root {\n${getThemeVars(false)}\n}\n\n.dark {\n${getThemeVars(true)}\n}`
  const blob = new Blob([code], { type: 'text/css' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'theme-variables.css'
  a.click()
  URL.revokeObjectURL(url)
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

h3 {
  font-size: 1.05rem;
  margin-bottom: 0.8rem;
  color: #333;
}

/* 主题切换 */
.theme-switch {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.theme-switch button {
  flex: 1;
  padding: 0.7rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.theme-switch button.active {
  border-color: #22c55e;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  font-weight: 600;
}

/* 变量编辑区 */
.var-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.var-item {
  padding: 0.6rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.var-item label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: #555;
  margin-bottom: 0.3rem;
}

.var-row {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}

.color-picker {
  width: 32px;
  height: 32px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  padding: 1px;
  background: none;
  flex-shrink: 0;
}

.hex-input {
  flex: 1;
  padding: 0.3rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.85rem;
  font-family: monospace;
  min-width: 0;
}

.hex-input:focus {
  outline: none;
  border-color: #22c55e;
}

.hex-input.small {
  width: 80px;
  flex: none;
}

.reset-btn {
  width: 28px;
  height: 28px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  flex-shrink: 0;
  transition: background 0.2s;
}

.reset-btn:hover {
  background: #fee2e2;
}

.add-var-section {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.var-name-input {
  padding: 0.4rem 0.6rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.85rem;
  font-family: monospace;
  width: 180px;
}

.var-name-input:focus {
  outline: none;
  border-color: #22c55e;
}

.add-btn {
  padding: 0.4rem 0.8rem;
  background: #22c55e;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
}

.add-btn:hover {
  background: #16a34a;
}

/* 预览区域 */
.preview-section {
  margin-bottom: 1.5rem;
}

.preview-wrapper {
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s;
  border: 1px solid #e2e8f0;
}

.preview-wrapper.light {
  background: #ffffff;
  color: #1e293b;
}

.preview-wrapper.dark {
  background: #0f172a;
  color: #f1f5f9;
  border-color: #334155;
}

.preview-card {
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1rem;
  border: 1px solid;
}

.preview-wrapper.light .preview-card {
  border-color: #e2e8f0;
}

.preview-wrapper.dark .preview-card {
  border-color: #334155;
}

.preview-card-header {
  padding: 0.8rem 1rem;
  font-weight: 600;
}

.preview-wrapper.light .preview-card-header {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.preview-wrapper.dark .preview-card-header {
  background: #1e293b;
  border-bottom: 1px solid #334155;
}

.preview-card-body {
  padding: 1rem;
}

.preview-card-body p {
  margin-bottom: 0.8rem;
  line-height: 1.5;
  opacity: 0.8;
}

.preview-btn {
  padding: 0.4rem 1rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  margin-right: 0.5rem;
  transition: opacity 0.2s;
}

.preview-btn.primary {
  background: #22c55e;
  color: white;
}

.preview-btn.secondary {
  background: transparent;
  border: 1px solid;
}

.preview-wrapper.light .preview-btn.secondary {
  border-color: #22c55e;
  color: #22c55e;
}

.preview-wrapper.dark .preview-btn.secondary {
  border-color: #4ade80;
  color: #4ade80;
}

.preview-form {
  margin-bottom: 1rem;
}

.preview-input {
  width: 100%;
  padding: 0.5rem 0.8rem;
  border-radius: 6px;
  border: 1px solid;
  font-size: 0.9rem;
  margin-bottom: 0.8rem;
  box-sizing: border-box;
}

.preview-wrapper.light .preview-input {
  border-color: #e2e8f0;
  background: white;
  color: #1e293b;
}

.preview-wrapper.dark .preview-input {
  border-color: #334155;
  background: #1e293b;
  color: #f1f5f9;
}

.preview-toggle {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.toggle-label {
  font-size: 0.9rem;
  opacity: 0.8;
}

.toggle-switch {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
}

.preview-wrapper.light .toggle-switch {
  background: #cbd5e1;
}

.preview-wrapper.dark .toggle-switch {
  background: #475569;
}

.toggle-switch.on {
  background: #22c55e !important;
}

.toggle-knob {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.toggle-switch.on .toggle-knob {
  transform: translateX(20px);
}

/* Alert 样式 */
.preview-alerts {
  margin-bottom: 1rem;
}

.alert {
  padding: 0.6rem 0.8rem;
  border-radius: 6px;
  font-size: 0.85rem;
  margin-bottom: 0.4rem;
}

.preview-wrapper.light .alert.success {
  background: #f0fdf4;
  color: #166534;
}

.preview-wrapper.dark .alert.success {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

.preview-wrapper.light .alert.warning {
  background: #fffbeb;
  color: #92400e;
}

.preview-wrapper.dark .alert.warning {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
}

.preview-wrapper.light .alert.error {
  background: #fef2f2;
  color: #991b1b;
}

.preview-wrapper.dark .alert.error {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

.preview-wrapper.light .alert.info {
  background: #eff6ff;
  color: #1e40af;
}

.preview-wrapper.dark .alert.info {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

/* 标签 */
.preview-badge-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge {
  padding: 0.3rem 0.8rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 500;
}

.preview-wrapper.light .badge {
  background: #f1f5f9;
  color: #475569;
}

.preview-wrapper.dark .badge {
  background: #334155;
  color: #94a3b8;
}

.badge.accent {
  background: #22c55e;
  color: white;
}

/* 代码区 */
.code-section {
  margin-bottom: 1.5rem;
}

.code-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.8rem;
}

.code-tabs button {
  padding: 0.4rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 0.85rem;
}

.code-tabs button.active {
  border-color: #22c55e;
  background: #f0fdf4;
  color: #16a34a;
  font-weight: 600;
}

.code-block {
  background: #1a1a2e;
  border-radius: 10px;
  padding: 1.2rem;
  overflow-x: auto;
  margin-bottom: 0.8rem;
}

.code-block pre {
  color: #a5d6a7;
  font-family: monospace;
  font-size: 0.85rem;
  line-height: 1.6;
  white-space: pre;
  margin: 0;
}

.code-actions {
  display: flex;
  gap: 0.8rem;
}

.copy-btn, .download-btn {
  padding: 0.5rem 1.2rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: transform 0.2s;
}

.copy-btn {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
}

.download-btn {
  background: #3b82f6;
  color: white;
}

.copy-btn:active, .download-btn:active {
  transform: scale(0.95);
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
  .var-grid {
    grid-template-columns: 1fr 1fr;
  }
  .add-var-section {
    flex-direction: column;
    align-items: stretch;
  }
  .var-name-input {
    width: auto;
  }
}
</style>
