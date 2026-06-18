<template>
  <div class="tool-page">
    <h2>🌈 CSS 渐变文字动画</h2>
    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>

    <div class="controls">
      <div class="control-group">
        <label>文字内容</label>
        <input v-model="text" placeholder="输入要展示的文字" />
      </div>
      <div class="control-row">
        <div class="control-group">
          <label>起始色</label>
          <input type="color" v-model="colorStart" />
        </div>
        <div class="control-group">
          <label>中间色（可选）</label>
          <input type="color" v-model="colorMiddle" />
          <label class="toggle-label" style="margin-top:4px"><input type="checkbox" v-model="useMiddle" /> 启用</label>
        </div>
        <div class="control-group">
          <label>结束色</label>
          <input type="color" v-model="colorEnd" />
        </div>
      </div>
      <div class="control-row">
        <div class="control-group">
          <label>动画方向</label>
          <select v-model="direction">
            <option value="to right">→ 水平</option>
            <option value="to left">← 水平反向</option>
            <option value="to bottom">↓ 垂直</option>
            <option value="to top">↑ 垂直反向</option>
            <option value="to bottom right">↘ 对角</option>
            <option value="to top right">↗ 对角反向</option>
          </select>
        </div>
        <div class="control-group">
          <label>动画类型</label>
          <select v-model="animType">
            <option value="flow">流动</option>
            <option value="blink">闪烁</option>
            <option value="pulse">脉冲</option>
          </select>
        </div>
        <div class="control-group">
          <label>速度 <b>{{ speed }}s</b></label>
          <input type="range" v-model.number="speed" min="0.5" max="10" step="0.5" />
        </div>
        <div class="control-group">
          <label>字体大小 <b>{{ fontSize }}px</b></label>
          <input type="range" v-model.number="fontSize" min="24" max="120" />
        </div>
      </div>
    </div>

    <div class="preview-section">
      <h3>预览效果</h3>
      <div class="preview-box">
        <div class="gradient-text" :style="previewStyle">{{ text || '野火小站' }}</div>
      </div>
    </div>

    <div class="code-section">
      <div class="code-header">
        <label>CSS 代码</label>
        <button class="btn-copy" @click="copyCode">📋 复制</button>
      </div>
      <pre class="code-output"><code>{{ cssCode }}</code></pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

useHead({ title: 'CSS 渐变文字动画 - 野火小站' })

const text = ref('野火小站')
const colorStart = ref('#22c55e')
const colorMiddle = ref('#3b82f6')
const colorEnd = ref('#f59e0b')
const useMiddle = ref(false)
const direction = ref('to right')
const animType = ref('flow')
const speed = ref(3)
const fontSize = ref(64)

const gradientColors = computed(() => {
  return useMiddle.value ? `${colorStart.value}, ${colorMiddle.value}, ${colorEnd.value}` : `${colorStart.value}, ${colorEnd.value}`
})

const animName = computed(() => `gradient-${animType.value}`)

const previewStyle = computed(() => ({
  fontSize: fontSize.value + 'px',
  backgroundImage: `linear-gradient(${direction.value}, ${gradientColors.value})`,
  animation: `${animName.value} ${speed.value}s ease infinite`
}))

const cssCode = computed(() => {
  const animDefs = {
    flow: `@keyframes gradient-flow {\n  0% { background-position: 0% 50%; }\n  50% { background-position: 100% 50%; }\n  100% { background-position: 0% 50%; }\n}`,
    blink: `@keyframes gradient-blink {\n  0%, 100% { opacity: 1; }\n  50% { opacity: 0.3; }\n}`,
    pulse: `@keyframes gradient-pulse {\n  0%, 100% { background-size: 100% 100%; filter: brightness(1); }\n  50% { background-size: 200% 200%; filter: brightness(1.3); }\n}`
  }
  const lines = [
    animDefs[animType.value],
    '',
    '.gradient-text {',
    `  font-size: ${fontSize.value}px;`,
    `  font-weight: bold;`,
    `  background-image: linear-gradient(${direction.value}, ${gradientColors.value});`,
    `  background-size: ${animType.value === 'flow' ? '200% 200%' : '100% 100%'};`,
    '  -webkit-background-clip: text;',
    '  background-clip: text;',
    '  -webkit-text-fill-color: transparent;',
    `  animation: gradient-${animType.value} ${speed.value}s ease infinite;`,
    '}'
  ]
  return lines.join('\n')
})

function copyCode() {
  navigator.clipboard.writeText(cssCode.value).then(() => {
    const btn = document.querySelector('.btn-copy')
    btn.textContent = '✅ 已复制'
    setTimeout(() => { btn.textContent = '📋 复制' }, 1500)
  })
}
</script>

<style scoped>
.tool-page { max-width: 800px; margin: 0 auto; padding: 20px; }
.back-link { display: inline-block; margin-bottom: 16px; color: #10b981; text-decoration: none; }
.back-link:hover { text-decoration: underline; }
h2 { color: #1a1a2e; margin-bottom: 20px; }
.controls { display: flex; flex-direction: column; gap: 16px; }
.control-row { display: flex; gap: 16px; flex-wrap: wrap; }
.control-group { flex: 1; min-width: 120px; }
.control-group > label:first-child { display: block; font-size: 14px; color: #555; margin-bottom: 6px; }
.control-group input[type="text"], .control-group select { width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box; }
.control-group input[type="color"] { width: 50px; height: 34px; border: none; border-radius: 6px; cursor: pointer; }
.control-group input[type="range"] { width: 100%; accent-color: #22c55e; }
.toggle-label { display: flex; align-items: center; gap: 4px; font-size: 13px; cursor: pointer; color: #555; }
.toggle-label input { accent-color: #22c55e; }
.preview-section { margin-top: 24px; }
.preview-section h3 { margin-bottom: 12px; font-size: 16px; color: #555; }
.preview-box { display: flex; align-items: center; justify-content: center; min-height: 180px; background: #1a1a2e; border-radius: 12px; padding: 40px 20px; }
.gradient-text { font-weight: bold; background-size: 200% 200%; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
@keyframes gradient-flow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
@keyframes gradient-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
@keyframes gradient-pulse { 0%, 100% { background-size: 100% 100%; filter: brightness(1); } 50% { background-size: 200% 200%; filter: brightness(1.3); } }
.code-section { margin-top: 24px; }
.code-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.code-header label { font-size: 14px; color: #555; }
.btn-copy { padding: 6px 14px; background: #10b981; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; }
.btn-copy:hover { background: #059669; }
.code-output { background: #1a1a2e; color: #e0e0e0; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 13px; line-height: 1.5; white-space: pre-wrap; }
@media (max-width: 600px) { .tool-page { padding: 12px; } .control-row { flex-direction: column; } }
</style>
