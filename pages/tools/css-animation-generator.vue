<template>
  <div class="tool-page">
    <h2>🎬 CSS 关键帧动画生成器</h2>
    <p class="subtitle">可视化创建 @keyframes 动画，拖拽关键帧节点、调节属性值、实时预览，一键生成 CSS 代码</p>

    <div class="anim-layout">
      <!-- 左侧控制面板 -->
      <div class="control-panel">
        <!-- 基本设置 -->
        <div class="section">
          <label>基本设置</label>
          <div class="form-row">
            <div class="form-group">
              <span class="form-label">动画名称</span>
              <input v-model="animName" class="form-input" placeholder="myAnimation" spellcheck="false" />
            </div>
            <div class="form-group">
              <span class="form-label">时长</span>
              <div class="input-with-unit">
                <input v-model.number="duration" type="number" min="0.1" step="0.1" class="form-input short" />
                <span class="unit">秒</span>
              </div>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <span class="form-label">缓动函数</span>
              <select v-model="easing" class="form-select">
                <option value="linear">linear</option>
                <option value="ease">ease</option>
                <option value="ease-in">ease-in</option>
                <option value="ease-out">ease-out</option>
                <option value="ease-in-out">ease-in-out</option>
                <option value="cubic-bezier(0.68, -0.55, 0.265, 1.55)">弹性</option>
              </select>
            </div>
            <div class="form-group">
              <span class="form-label">循环</span>
              <select v-model="iteration" class="form-select">
                <option value="infinite">无限</option>
                <option value="1">1 次</option>
                <option value="2">2 次</option>
                <option value="3">3 次</option>
                <option value="5">5 次</option>
              </select>
            </div>
            <div class="form-group">
              <span class="form-label">方向</span>
              <select v-model="direction" class="form-select">
                <option value="normal">正向</option>
                <option value="reverse">反向</option>
                <option value="alternate">交替</option>
                <option value="alternate-reverse">交替反向</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 关键帧列表 -->
        <div class="section">
          <div class="section-header">
            <label>关键帧节点</label>
            <button class="btn-sm" @click="addKeyframe">+ 添加</button>
          </div>
          <div class="keyframe-list">
            <div v-for="(kf, index) in keyframes" :key="index" class="keyframe-item">
              <div class="kf-header">
                <input
                  v-model.number="kf.percent"
                  type="number"
                  min="0"
                  max="100"
                  class="kf-percent"
                />
                <span class="kf-unit">%</span>
                <button v-if="keyframes.length > 1" class="btn-remove" @click="removeKeyframe(index)">✕</button>
              </div>

              <!-- 属性编辑 -->
              <div class="kf-props">
                <div class="prop-row">
                  <span class="prop-label">位移 X</span>
                  <input v-model.number="kf.translateX" type="number" step="10" class="prop-input" />
                  <span class="prop-unit">px</span>
                </div>
                <div class="prop-row">
                  <span class="prop-label">位移 Y</span>
                  <input v-model.number="kf.translateY" type="number" step="10" class="prop-input" />
                  <span class="prop-unit">px</span>
                </div>
                <div class="prop-row">
                  <span class="prop-label">缩放</span>
                  <input v-model.number="kf.scale" type="number" step="0.1" min="0" class="prop-input" />
                  <span class="prop-unit">×</span>
                </div>
                <div class="prop-row">
                  <span class="prop-label">旋转</span>
                  <input v-model.number="kf.rotate" type="number" step="15" class="prop-input" />
                  <span class="prop-unit">deg</span>
                </div>
                <div class="prop-row">
                  <span class="prop-label">透明度</span>
                  <input v-model.number="kf.opacity" type="number" step="0.1" min="0" max="1" class="prop-input" />
                </div>
                <div class="prop-row">
                  <span class="prop-label">圆角</span>
                  <input v-model.number="kf.borderRadius" type="number" step="5" min="0" class="prop-input" />
                  <span class="prop-unit">%</span>
                </div>
                <div class="prop-row">
                  <span class="prop-label">背景色</span>
                  <input v-model="kf.backgroundColor" type="color" class="prop-color" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 预设动画 -->
        <div class="section">
          <label>预设模板</label>
          <div class="preset-buttons">
            <button class="btn-preset" @click="applyPreset('bounce')">弹跳</button>
            <button class="btn-preset" @click="applyPreset('fadeIn')">淡入</button>
            <button class="btn-preset" @click="applyPreset('pulse')">脉冲</button>
            <button class="btn-preset" @click="applyPreset('spin')">旋转</button>
            <button class="btn-preset" @click="applyPreset('shake')">抖动</button>
            <button class="btn-preset" @click="applyPreset('slideIn')">滑入</button>
            <button class="btn-preset" @click="applyPreset('morph')">变形</button>
          </div>
        </div>
      </div>

      <!-- 右侧预览和代码 -->
      <div class="preview-panel">
        <!-- 实时预览 -->
        <div class="section">
          <label>👁️ 实时预览</label>
          <div class="preview-box">
            <div class="preview-element" :style="previewStyle">
              <span>动画预览</span>
            </div>
          </div>
          <div class="preview-controls">
            <button class="btn-ctrl" @click="restartAnimation">🔄 重播</button>
            <button class="btn-ctrl" @click="togglePause">{{ isPaused ? '▶️ 播放' : '⏸️ 暂停' }}</button>
          </div>
        </div>

        <!-- 生成的 CSS -->
        <div class="section">
          <div class="section-header">
            <label>📋 生成的 CSS</label>
            <button class="btn-sm" @click="copyCSS">复制代码</button>
          </div>
          <pre class="code-output"><code>{{ generatedCSS }}</code></pre>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'CSS关键帧动画生成器 - 野火小站' })

const animName = ref('myAnimation')
const duration = ref(1)
const easing = ref('ease')
const iteration = ref('infinite')
const direction = ref('normal')
const isPaused = ref(false)

// 关键帧数据
const keyframes = reactive([
  { percent: 0, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 1, borderRadius: 10, backgroundColor: '#22c55e' },
  { percent: 50, translateX: 100, translateY: -50, scale: 1.2, rotate: 180, opacity: 0.7, borderRadius: 50, backgroundColor: '#3b82f6' },
  { percent: 100, translateX: 0, translateY: 0, scale: 1, rotate: 360, opacity: 1, borderRadius: 10, backgroundColor: '#22c55e' },
])

// 生成 keyframes CSS
const keyframesCSS = computed(() => {
  // 按百分比排序
  const sorted = [...keyframes].sort((a, b) => a.percent - b.percent)

  let css = `@keyframes ${animName.value} {\n`
  sorted.forEach(kf => {
    css += `  ${kf.percent}% {\n`
    css += `    transform: translate(${kf.translateX}px, ${kf.translateY}px) scale(${kf.scale}) rotate(${kf.rotate}deg);\n`
    css += `    opacity: ${kf.opacity};\n`
    css += `    border-radius: ${kf.borderRadius}%;\n`
    css += `    background-color: ${kf.backgroundColor};\n`
    css += `  }\n`
  })
  css += '}'
  return css
})

// 完整 CSS
const generatedCSS = computed(() => {
  return `.animated-element {\n  animation: ${animName.value} ${duration.value}s ${easing.value} ${iteration.value} ${direction.value};\n}\n\n${keyframesCSS.value}`
})

// 预览样式（内联 keyframes）
const previewStyle = computed(() => {
  return {
    animation: `${animName.value} ${duration.value}s ${easing.value} ${iteration.value} ${direction.value}`,
    animationPlayState: isPaused.value ? 'paused' : 'running',
  }
})

// 添加关键帧
function addKeyframe() {
  const pct = Math.round(Math.random() * 80 + 10)
  keyframes.push({
    percent: pct, translateX: 0, translateY: 0, scale: 1,
    rotate: 0, opacity: 1, borderRadius: 10, backgroundColor: '#22c55e',
  })
}

// 删除关键帧
function removeKeyframe(index) {
  if (keyframes.length > 1) keyframes.splice(index, 1)
}

// 重播动画
function restartAnimation() {
  if (!import.meta.client) return
  const el = document.querySelector('.preview-element')
  if (el) {
    el.style.animation = 'none'
    el.offsetHeight // 强制重绘
    el.style.animation = ''
  }
  isPaused.value = false
}

// 暂停/播放
function togglePause() {
  isPaused.value = !isPaused.value
}

// 复制 CSS
function copyCSS() {
  navigator.clipboard.writeText(generatedCSS.value).then(() => alert('CSS 代码已复制到剪贴板'))
}

// 预设动画
function applyPreset(name) {
  switch (name) {
    case 'bounce':
      keyframes.splice(0, keyframes.length,
        { percent: 0, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 1, borderRadius: 10, backgroundColor: '#22c55e' },
        { percent: 50, translateX: 0, translateY: -80, scale: 1.1, rotate: 0, opacity: 1, borderRadius: 10, backgroundColor: '#22c55e' },
        { percent: 100, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 1, borderRadius: 10, backgroundColor: '#22c55e' },
      )
      break
    case 'fadeIn':
      keyframes.splice(0, keyframes.length,
        { percent: 0, translateX: 0, translateY: 20, scale: 0.9, rotate: 0, opacity: 0, borderRadius: 10, backgroundColor: '#3b82f6' },
        { percent: 100, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 1, borderRadius: 10, backgroundColor: '#3b82f6' },
      )
      break
    case 'pulse':
      keyframes.splice(0, keyframes.length,
        { percent: 0, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 1, borderRadius: 10, backgroundColor: '#ef4444' },
        { percent: 50, translateX: 0, translateY: 0, scale: 1.15, rotate: 0, opacity: 0.8, borderRadius: 15, backgroundColor: '#ef4444' },
        { percent: 100, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 1, borderRadius: 10, backgroundColor: '#ef4444' },
      )
      break
    case 'spin':
      keyframes.splice(0, keyframes.length,
        { percent: 0, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 1, borderRadius: 50, backgroundColor: '#a855f7' },
        { percent: 100, translateX: 0, translateY: 0, scale: 1, rotate: 360, opacity: 1, borderRadius: 50, backgroundColor: '#a855f7' },
      )
      break
    case 'shake':
      keyframes.splice(0, keyframes.length,
        { percent: 0, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 1, borderRadius: 10, backgroundColor: '#f59e0b' },
        { percent: 20, translateX: -20, translateY: 0, scale: 1, rotate: -5, opacity: 1, borderRadius: 10, backgroundColor: '#f59e0b' },
        { percent: 40, translateX: 20, translateY: 0, scale: 1, rotate: 5, opacity: 1, borderRadius: 10, backgroundColor: '#f59e0b' },
        { percent: 60, translateX: -15, translateY: 0, scale: 1, rotate: -3, opacity: 1, borderRadius: 10, backgroundColor: '#f59e0b' },
        { percent: 80, translateX: 15, translateY: 0, scale: 1, rotate: 3, opacity: 1, borderRadius: 10, backgroundColor: '#f59e0b' },
        { percent: 100, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 1, borderRadius: 10, backgroundColor: '#f59e0b' },
      )
      break
    case 'slideIn':
      keyframes.splice(0, keyframes.length,
        { percent: 0, translateX: -200, translateY: 0, scale: 0.8, rotate: -10, opacity: 0, borderRadius: 10, backgroundColor: '#06b6d4' },
        { percent: 60, translateX: 10, translateY: 0, scale: 1.02, rotate: 1, opacity: 1, borderRadius: 10, backgroundColor: '#06b6d4' },
        { percent: 100, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 1, borderRadius: 10, backgroundColor: '#06b6d4' },
      )
      break
    case 'morph':
      keyframes.splice(0, keyframes.length,
        { percent: 0, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 1, borderRadius: 10, backgroundColor: '#22c55e' },
        { percent: 33, translateX: 50, translateY: -30, scale: 1.3, rotate: 120, opacity: 0.8, borderRadius: 50, backgroundColor: '#3b82f6' },
        { percent: 66, translateX: -50, translateY: 30, scale: 0.8, rotate: 240, opacity: 0.6, borderRadius: 25, backgroundColor: '#a855f7' },
        { percent: 100, translateX: 0, translateY: 0, scale: 1, rotate: 360, opacity: 1, borderRadius: 10, backgroundColor: '#22c55e' },
      )
      break
  }
  duration.value = name === 'spin' ? 1 : name === 'shake' ? 0.5 : 1
  restartAnimation()
}

// 注入动态 keyframes 样式
const styleEl = ref(null)
watch(keyframesCSS, (css) => {
  if (!import.meta.client) return
  if (styleEl.value) styleEl.value.remove()
  styleEl.value = document.createElement('style')
  styleEl.value.textContent = css
  document.head.appendChild(styleEl.value)
}, { immediate: true })

onUnmounted(() => {
  if (styleEl.value) styleEl.value.remove()
})
</script>

<style scoped>
.tool-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1rem;
}

h2 { font-size: 1.6rem; margin-bottom: 0.5rem; }
.subtitle { color: #666; margin-bottom: 1.5rem; }

.anim-layout {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

/* 控制面板 */
.control-panel {
  flex: 0 0 400px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section {
  background: #fff;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border: 1px solid #eee;
}

.section > label {
  font-weight: 600;
  font-size: 0.95rem;
  color: #555;
  display: block;
  margin-bottom: 0.6rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
}

.section-header label { margin-bottom: 0; }

.btn-sm {
  padding: 0.3rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #f8f9fa;
  font-size: 0.8rem;
  cursor: pointer;
  color: #555;
}

.btn-sm:hover { border-color: #22c55e; color: #22c55e; }

/* 表单 */
.form-row {
  display: flex;
  gap: 0.8rem;
  margin-bottom: 0.6rem;
  flex-wrap: wrap;
}

.form-group {
  flex: 1;
  min-width: 100px;
}

.form-label {
  font-size: 0.8rem;
  color: #888;
  display: block;
  margin-bottom: 0.2rem;
}

.form-input {
  width: 100%;
  padding: 0.4rem 0.6rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.85rem;
  outline: none;
  box-sizing: border-box;
}

.form-input:focus { border-color: #22c55e; }

.form-input.short { width: 60px; }

.form-select {
  width: 100%;
  padding: 0.4rem 0.6rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.85rem;
  background: #fff;
  outline: none;
}

.form-select:focus { border-color: #22c55e; }

.input-with-unit {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.unit {
  font-size: 0.8rem;
  color: #888;
}

/* 关键帧列表 */
.keyframe-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  max-height: 50vh;
  overflow-y: auto;
}

.keyframe-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 0.8rem;
  border: 1px solid #eee;
}

.kf-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}

.kf-percent {
  width: 60px;
  padding: 0.3rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  text-align: center;
  outline: none;
  font-weight: 600;
}

.kf-percent:focus { border-color: #22c55e; }

.kf-unit {
  font-size: 0.85rem;
  color: #888;
}

.btn-remove {
  margin-left: auto;
  width: 22px;
  height: 22px;
  border: none;
  background: #fee;
  color: #e74c3c;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
}

.btn-remove:hover { background: #fdd; }

.kf-props {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.prop-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.prop-label {
  font-size: 0.78rem;
  color: #888;
  min-width: 50px;
}

.prop-input {
  width: 60px;
  padding: 0.2rem 0.4rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.82rem;
  text-align: center;
  outline: none;
}

.prop-input:focus { border-color: #22c55e; }

.prop-unit {
  font-size: 0.75rem;
  color: #aaa;
  min-width: 20px;
}

.prop-color {
  width: 40px;
  height: 28px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
}

/* 预设按钮 */
.preset-buttons {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.btn-preset {
  padding: 0.4rem 0.8rem;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  background: #f8f9fa;
  font-size: 0.82rem;
  cursor: pointer;
  color: #555;
  transition: all 0.2s;
}

.btn-preset:hover {
  border-color: #22c55e;
  background: #f0fdf4;
  color: #22c55e;
}

/* 预览面板 */
.preview-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.preview-box {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.preview-element {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 0.7rem;
  text-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.preview-controls {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.8rem;
  justify-content: center;
}

.btn-ctrl {
  padding: 0.4rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-ctrl:hover { border-color: #22c55e; background: #f0fdf4; }

/* 代码输出 */
.code-output {
  background: #1e1e2e;
  color: #cdd6f4;
  border-radius: 8px;
  padding: 1rem;
  font-size: 0.82rem;
  line-height: 1.5;
  overflow-x: auto;
  margin: 0;
  font-family: 'Courier New', monospace;
  white-space: pre;
}

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #22c55e;
  font-weight: 500;
}

.back-link:hover { text-decoration: underline; }

@media (max-width: 768px) {
  .anim-layout { flex-direction: column; }
  .control-panel { flex: none; width: 100%; }
  .keyframe-list { max-height: 40vh; }
}
</style>
