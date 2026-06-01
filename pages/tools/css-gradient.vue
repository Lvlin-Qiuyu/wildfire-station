<template>
  <div class="tool-page">
    <h2>🎨 CSS 渐变生成器</h2>

    <div class="gradient-type-switch">
      <button
        v-for="t in types"
        :key="t.value"
        :class="{ active: gradientType === t.value }"
        @click="gradientType = t.value"
      >{{ t.label }}</button>
    </div>

    <div class="preview-box" :style="previewStyle">
      <span class="preview-text">预览区域</span>
    </div>

    <div class="controls">
      <div class="control-row">
        <label>角度</label>
        <input type="range" v-model.number="angle" min="0" max="360" />
        <span class="angle-value">{{ angle }}°</span>
      </div>

      <div class="stops-list">
        <div class="stops-header">
          <label>色标</label>
          <button class="btn-add" @click="addStop">+ 添加色标</button>
        </div>
        <div v-for="(stop, index) in stops" :key="index" class="stop-item">
          <input type="color" v-model="stop.color" class="color-picker" />
          <input
            type="number"
            v-model.number="stop.position"
            min="0"
            max="100"
            class="pos-input"
          />
          <span class="unit">%</span>
          <button v-if="stops.length > 2" class="btn-remove" @click="removeStop(index)">✕</button>
        </div>
      </div>
    </div>

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
useHead({ title: 'CSS 渐变生成器 - 野火小站' })

const types = [
  { label: '线性渐变', value: 'linear' },
  { label: '径向渐变', value: 'radial' },
  { label: '锥形渐变', value: 'conic' },
]

const gradientType = ref('linear')
const angle = ref(135)

const stops = reactive([
  { color: '#22c55e', position: 0 },
  { color: '#10b981', position: 50 },
  { color: '#ffd166', position: 100 },
])

const copyText = ref('复制代码')

const sortedStops = computed(() =>
  [...stops].sort((a, b) => a.position - b.position)
)

const stopsStr = computed(() =>
  sortedStops.value.map(s => `${s.color} ${s.position}%`).join(', ')
)

const cssCode = computed(() => {
  switch (gradientType.value) {
    case 'linear':
      return `background: linear-gradient(${angle.value}deg, ${stopsStr.value});`
    case 'radial':
      return `background: radial-gradient(circle, ${stopsStr.value});`
    case 'conic':
      return `background: conic-gradient(from ${angle.value}deg, ${stopsStr.value});`
    default:
      return ''
  }
})

const previewStyle = computed(() => {
  const val = stopsStr.value
  switch (gradientType.value) {
    case 'linear':
      return { background: `linear-gradient(${angle.value}deg, ${val})` }
    case 'radial':
      return { background: `radial-gradient(circle, ${val})` }
    case 'conic':
      return { background: `conic-gradient(from ${angle.value}deg, ${val})` }
    default:
      return {}
  }
})

function addStop() {
  const colors = ['#06d6a0', '#118ab2', '#ef476f', '#ffd166', '#073b4c', '#8338ec']
  const pos = Math.round(Math.random() * 100)
  stops.push({
    color: colors[stops.length % colors.length],
    position: pos,
  })
}

function removeStop(index) {
  stops.splice(index, 1)
}

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

.gradient-type-switch {
  display: flex;
  gap: 0;
  margin-bottom: 1.5rem;
  background: #e9ecef;
  border-radius: 8px;
  overflow: hidden;
}

.gradient-type-switch button {
  flex: 1;
  padding: 0.6rem 1rem;
  border: none;
  background: transparent;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}

.gradient-type-switch button.active {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  font-weight: 600;
}

.preview-box {
  width: 100%;
  height: 200px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(0,0,0,0.1);
}

.preview-text {
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
  text-shadow: 0 1px 4px rgba(0,0,0,0.3);
}

.controls {
  margin-bottom: 1.5rem;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.2rem;
}

.control-row label {
  font-weight: 600;
  min-width: 40px;
  color: #555;
}

.control-row input[type="range"] {
  flex: 1;
  accent-color: #22c55e;
}

.angle-value {
  font-family: 'Courier New', monospace;
  color: #22c55e;
  font-weight: 600;
  min-width: 40px;
  text-align: right;
}

.stops-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.stops-header label {
  font-weight: 600;
  color: #555;
}

.btn-add {
  padding: 0.35rem 0.8rem;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #555;
  transition: all 0.2s;
}

.btn-add:hover {
  background: #e8e8e8;
}

.stop-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.6rem;
}

.color-picker {
  width: 40px;
  height: 36px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  padding: 2px;
  background: #f0f0f0;
}

.pos-input {
  width: 60px;
  padding: 0.4rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  text-align: center;
}

.unit {
  color: #999;
  font-size: 0.85rem;
}

.btn-remove {
  padding: 0.3rem 0.5rem;
  border: none;
  background: #fee;
  color: #e74c3c;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.btn-remove:hover {
  background: #fdd;
}

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

@media (max-width: 640px) {
  .stop-item {
    flex-wrap: wrap;
  }
}
</style>
