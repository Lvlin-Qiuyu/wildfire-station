<template>
  <div class="tool-page">
    <h2>🔲 CSS 阴影边框生成器</h2>

    <!-- 实时预览 -->
    <div class="preview-wrapper">
      <div class="preview-box" :style="previewStyle">
        <span class="preview-text">预览区域</span>
      </div>
    </div>

    <!-- 控制面板 -->
    <div class="panel-grid">
      <!-- 左列：阴影参数 -->
      <div class="panel">
        <h3 class="panel-title">阴影参数</h3>

        <div class="control-row">
          <label>X 偏移</label>
          <input type="range" v-model.number="shadow.x" min="-50" max="50" />
          <span class="val">{{ shadow.x }}px</span>
        </div>
        <div class="control-row">
          <label>Y 偏移</label>
          <input type="range" v-model.number="shadow.y" min="-50" max="50" />
          <span class="val">{{ shadow.y }}px</span>
        </div>
        <div class="control-row">
          <label>模糊</label>
          <input type="range" v-model.number="shadow.blur" min="0" max="100" />
          <span class="val">{{ shadow.blur }}px</span>
        </div>
        <div class="control-row">
          <label>扩展</label>
          <input type="range" v-model.number="shadow.spread" min="-50" max="50" />
          <span class="val">{{ shadow.spread }}px</span>
        </div>
        <div class="control-row">
          <label>颜色</label>
          <input type="color" v-model="shadow.color" class="color-picker" />
          <span class="val">{{ shadow.color }}</span>
        </div>
        <div class="control-row">
          <label>透明度</label>
          <input type="range" v-model.number="shadow.opacity" min="0" max="100" />
          <span class="val">{{ shadow.opacity }}%</span>
        </div>
        <div class="control-row">
          <label>内阴影</label>
          <button :class="['toggle-btn', { active: shadow.inset }]" @click="shadow.inset = !shadow.inset">
            {{ shadow.inset ? '开启' : '关闭' }}
          </button>
        </div>
      </div>

      <!-- 右列：边框参数 -->
      <div class="panel">
        <h3 class="panel-title">边框参数</h3>

        <div class="control-row">
          <label>宽度</label>
          <input type="range" v-model.number="border.width" min="0" max="20" />
          <span class="val">{{ border.width }}px</span>
        </div>
        <div class="control-row">
          <label>样式</label>
          <select v-model="border.style" class="select-input">
            <option v-for="s in borderStyles" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div class="control-row">
          <label>颜色</label>
          <input type="color" v-model="border.color" class="color-picker" />
          <span class="val">{{ border.color }}</span>
        </div>
        <div class="control-row">
          <label>圆角</label>
          <input type="range" v-model.number="border.radius" min="0" max="50" />
          <span class="val">{{ border.radius }}px</span>
        </div>

        <div class="control-row">
          <label>背景色</label>
          <input type="color" v-model="bgColor" class="color-picker" />
          <span class="val">{{ bgColor }}</span>
        </div>
      </div>
    </div>

    <!-- 预设 -->
    <div class="presets">
      <span class="presets-label">快速预设：</span>
      <button v-for="p in presets" :key="p.name" class="preset-btn" @click="applyPreset(p)">{{ p.name }}</button>
    </div>

    <!-- CSS 代码输出 -->
    <div class="code-output">
      <label>CSS 代码</label>
      <div class="code-block">
        <code>{{ cssCode }}</code>
      </div>
      <button class="btn-copy" @click="copyCode">{{ copyText }}</button>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'CSS 阴影边框生成器 - 野火小站' })

// 边框样式选项
const borderStyles = ['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'none']

// 阴影参数
const shadow = reactive({
  x: 5,
  y: 5,
  blur: 15,
  spread: 0,
  color: '#000000',
  opacity: 25,
  inset: false,
})

// 边框参数
const border = reactive({
  width: 1,
  style: 'solid',
  color: '#cccccc',
  radius: 12,
})

// 背景色
const bgColor = ref('#ffffff')

// 预设方案
const presets = [
  { name: '卡片', shadow: { x: 0, y: 4, blur: 12, spread: 0, color: '#000000', opacity: 10, inset: false }, border: { width: 1, style: 'solid', color: '#e5e7eb', radius: 12 } },
  { name: '按钮', shadow: { x: 0, y: 2, blur: 8, spread: 0, color: '#22c55e', opacity: 40, inset: false }, border: { width: 0, style: 'none', color: '#ccc', radius: 8 } },
  { name: '凹陷', shadow: { x: 2, y: 2, blur: 8, spread: 0, color: '#000000', opacity: 30, inset: true }, border: { width: 1, style: 'solid', color: '#d1d5db', radius: 6 } },
  { name: '发光', shadow: { x: 0, y: 0, blur: 30, spread: 5, color: '#3b82f6', opacity: 50, inset: false }, border: { width: 1, style: 'solid', color: '#93c5fd', radius: 12 } },
  { name: '硬边', shadow: { x: 4, y: 4, blur: 0, spread: 0, color: '#000000', opacity: 100, inset: false }, border: { width: 2, style: 'solid', color: '#374151', radius: 0 } },
  { name: '霓虹', shadow: { x: 0, y: 0, blur: 20, spread: 2, color: '#a855f7', opacity: 80, inset: false }, border: { width: 2, style: 'solid', color: '#c084fc', radius: 16 } },
]

// 应用预设
function applyPreset(p) {
  Object.assign(shadow, p.shadow)
  Object.assign(border, p.border)
}

// 计算 rgba 颜色值
function hexToRgba(hex, opacity) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const a = (opacity / 100).toFixed(2)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

// 阴影 CSS 字符串
const shadowValue = computed(() => {
  const inset = shadow.inset ? 'inset ' : ''
  const rgba = hexToRgba(shadow.color, shadow.opacity)
  return `${inset}${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.spread}px ${rgba}`
})

// 预览样式
const previewStyle = computed(() => ({
  background: bgColor.value,
  boxShadow: shadowValue.value,
  border: border.width > 0 && border.style !== 'none'
    ? `${border.width}px ${border.style} ${border.color}`
    : 'none',
  borderRadius: `${border.radius}px`,
}))

// 完整 CSS 代码
const cssCode = computed(() => {
  const lines = []
  lines.push('.element {')
  lines.push(`  box-shadow: ${shadowValue.value};`)
  if (border.width > 0 && border.style !== 'none') {
    lines.push(`  border: ${border.width}px ${border.style} ${border.color};`)
  }
  lines.push(`  border-radius: ${border.radius}px;`)
  lines.push(`  background: ${bgColor.value};`)
  lines.push('}')
  return lines.join('\n')
})

// 复制代码
const copyText = ref('复制代码')
function copyCode() {
  navigator.clipboard.writeText(cssCode.value).then(() => {
    copyText.value = '已复制 ✓'
    setTimeout(() => { copyText.value = '复制代码' }, 1500)
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

/* 预览区域 */
.preview-wrapper {
  margin-bottom: 1.5rem;
  padding: 2rem;
  background: repeating-conic-gradient(#e5e7eb 0% 25%, #f3f4f6 0% 50%) 50% / 20px 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-box {
  width: 70%;
  max-width: 320px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.preview-text {
  font-size: 1.1rem;
  font-weight: 600;
  color: #555;
}

/* 双列控制面板 */
.panel-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.2rem;
  margin-bottom: 1.2rem;
}

.panel {
  background: white;
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 1.2rem;
}

.panel-title {
  font-size: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f0f0f0;
  color: #333;
}

/* 控制行 */
.control-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.8rem;
}

.control-row:last-child {
  margin-bottom: 0;
}

.control-row label {
  font-weight: 600;
  min-width: 48px;
  color: #555;
  font-size: 0.9rem;
}

.control-row input[type="range"] {
  flex: 1;
  accent-color: #22c55e;
  height: 6px;
}

.val {
  font-family: 'Courier New', monospace;
  color: #22c55e;
  font-weight: 600;
  min-width: 52px;
  text-align: right;
  font-size: 0.85rem;
}

.color-picker {
  width: 36px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  padding: 2px;
  background: #f0f0f0;
}

.select-input {
  flex: 1;
  padding: 0.35rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
}

/* 开关按钮 */
.toggle-btn {
  padding: 0.3rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #f5f5f5;
  cursor: pointer;
  font-size: 0.85rem;
  color: #888;
  transition: all 0.2s;
}

.toggle-btn.active {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border-color: #22c55e;
}

/* 预设按钮 */
.presets {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.2rem;
  flex-wrap: wrap;
}

.presets-label {
  font-weight: 600;
  color: #555;
  font-size: 0.9rem;
}

.preset-btn {
  padding: 0.3rem 0.7rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #f9fafb;
  cursor: pointer;
  font-size: 0.85rem;
  color: #555;
  transition: all 0.2s;
}

.preset-btn:hover {
  border-color: #22c55e;
  color: #22c55e;
  background: #f0fdf4;
}

/* 代码输出 */
.code-output {
  background: white;
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 1.2rem;
}

.code-output label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.6rem;
  color: #555;
}

.code-block {
  background: #1e1e2e;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.8rem;
  overflow-x: auto;
}

.code-block code {
  color: #a6e3a1;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  white-space: pre-wrap;
  word-break: break-all;
}

.btn-copy {
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

.back-link {
  display: inline-block;
  margin-top: 2.5rem;
  color: #22c55e;
  font-weight: 500;
}

.back-link:hover {
  text-decoration: underline;
}

/* 移动端适配 */
@media (max-width: 640px) {
  .panel-grid {
    grid-template-columns: 1fr;
  }

  .preview-box {
    width: 80%;
    height: 120px;
  }

  .preview-wrapper {
    padding: 1.2rem;
  }

  .presets {
    gap: 0.4rem;
  }
}
</style>
