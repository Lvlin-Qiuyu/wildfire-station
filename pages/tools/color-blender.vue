<template>
  <div class="tool-page">
    <h2>🎨 颜色混合与插值器</h2>
    <p class="tool-desc">输入两个颜色，选择色彩空间和步数，自动生成中间渐变色序列</p>

    <div class="input-section">
      <div class="color-input-row">
        <div class="field">
          <label>起始颜色</label>
          <div class="color-row">
            <input type="color" v-model="color1" class="color-picker" />
            <input v-model="color1" class="hex-input" placeholder="#ff0000" maxlength="7" spellcheck="false" />
          </div>
        </div>
        <div class="field">
          <label>结束颜色</label>
          <div class="color-row">
            <input type="color" v-model="color2" class="color-picker" />
            <input v-model="color2" class="hex-input" placeholder="#0000ff" maxlength="7" spellcheck="false" />
          </div>
        </div>
      </div>

      <div class="options-row">
        <div class="field">
          <label>色彩空间</label>
          <div class="radio-group">
            <label v-for="s in colorSpaces" :key="s" :class="{ active: space === s }">
              <input type="radio" v-model="space" :value="s" />
              {{ s }}
            </label>
          </div>
        </div>
        <div class="field">
          <label>步数: <strong>{{ steps }}</strong></label>
          <input type="range" v-model.number="steps" min="2" max="20" class="slider" />
        </div>
      </div>
    </div>

    <!-- 色板预览 -->
    <div class="preview-section">
      <h3>渐变色板</h3>
      <canvas ref="canvasRef" class="preview-canvas"></canvas>
    </div>

    <!-- 中间色列表 -->
    <div class="swatches-section">
      <div
        v-for="(c, i) in blendedColors"
        :key="i"
        class="swatch-item"
        :style="{ backgroundColor: c }"
        @click="copyHex(c)"
      >
        <span class="swatch-label" :style="{ color: textColorForBg(c) }">
          {{ c }}
        </span>
      </div>
    </div>

    <!-- CSS 渐变代码 -->
    <div class="code-section">
      <label>CSS 渐变代码</label>
      <div class="code-block">
        <code>{{ gradientCSS }}</code>
      </div>
      <button class="btn-copy" @click="copyGradient">{{ copyText }}</button>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '颜色混合与插值器 - 野火小站' })

const color1 = ref('#22c55e')
const color2 = ref('#ef4444')
const space = ref('RGB')
const steps = ref(8)
const copyText = ref('复制代码')
const canvasRef = ref(null)

const colorSpaces = ['RGB', 'HSL', 'HSV']

// 解析HEX为RGB
function hexToRgb(hex) {
  hex = hex.replace('#', '')
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16)
  ]
}

// RGB转HEX
function rgbToHex(r, g, b) {
  const clamp = v => Math.max(0, Math.min(255, Math.round(v)))
  return '#' + [r, g, b].map(v => clamp(v).toString(16).padStart(2, '0')).join('')
}

// RGB → HSL
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2
  if (max === min) { h = s = 0 }
  else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [h * 360, s * 100, l * 100]
}

// HSL → RGB
function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100
  let r, g, b
  if (s === 0) { r = g = b = l }
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }
  return [r * 255, g * 255, b * 255]
}

// RGB → HSV
function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, v = max
  const d = max - min
  s = max === 0 ? 0 : d / max
  if (max === min) { h = 0 }
  else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  return [h * 360, s * 100, v * 100]
}

// HSV → RGB
function hsvToRgb(h, s, v) {
  h /= 360; s /= 100; v /= 100
  let r, g, b
  const i = Math.floor(h * 6)
  const f = h * 6 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break
    case 1: r = q; g = v; b = p; break
    case 2: r = p; g = v; b = t; break
    case 3: r = p; g = q; b = v; break
    case 4: r = t; g = p; b = v; break
    case 5: r = v; g = p; b = q; break
  }
  return [r * 255, g * 255, b * 255]
}

// 在指定色彩空间插值
function interpolate(c1, c2, t, mode) {
  const [r1, g1, b1] = hexToRgb(c1)
  const [r2, g2, b2] = hexToRgb(c2)

  if (mode === 'RGB') {
    return rgbToHex(
      r1 + (r2 - r1) * t,
      g1 + (g2 - g1) * t,
      b1 + (b2 - b1) * t
    )
  }

  if (mode === 'HSL') {
    const [h1, s1, l1] = rgbToHsl(r1, g1, b1)
    const [h2, s2, l2] = rgbToHsl(r2, g2, b2)
    // 处理色相环形插值
    let dh = h2 - h1
    if (dh > 180) dh -= 360
    if (dh < -180) dh += 360
    const h = (h1 + dh * t + 360) % 360
    const [r, g, b] = hslToRgb(h, s1 + (s2 - s1) * t, l1 + (l2 - l1) * t)
    return rgbToHex(r, g, b)
  }

  if (mode === 'HSV') {
    const [h1, s1, v1] = rgbToHsv(r1, g1, b1)
    const [h2, s2, v2] = rgbToHsv(r2, g2, b2)
    let dh = h2 - h1
    if (dh > 180) dh -= 360
    if (dh < -180) dh += 360
    const h = (h1 + dh * t + 360) % 360
    const [r, g, b] = hsvToRgb(h, s1 + (s2 - s1) * t, v1 + (v2 - v1) * t)
    return rgbToHex(r, g, b)
  }

  return rgbToHex(r1, g1, b1)
}

// 混合后的颜色序列
const blendedColors = computed(() => {
  const result = []
  for (let i = 0; i < steps.value; i++) {
    const t = steps.value === 1 ? 0 : i / (steps.value - 1)
    result.push(interpolate(color1.value, color2.value, t, space.value))
  }
  return result
})

// CSS渐变代码
const gradientCSS = computed(() => {
  const colors = blendedColors.value.join(', ')
  return `background: linear-gradient(to right, ${colors});`
})

// Canvas 渲染色板
watch(blendedColors, () => {
  nextTick(() => {
    const canvas = canvasRef.value
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    const colors = blendedColors.value
    const bw = w / colors.length
    colors.forEach((c, i) => {
      ctx.fillStyle = c
      ctx.fillRect(i * bw, 0, bw + 1, h)
    })
  })
}, { immediate: true })

function textColorForBg(hex) {
  const [r, g, b] = hexToRgb(hex)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#1a1a2e' : '#ffffff'
}

function copyHex(color) {
  navigator.clipboard.writeText(color)
}

function copyGradient() {
  navigator.clipboard.writeText(gradientCSS.value).then(() => {
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
  margin-bottom: 0.5rem;
}

h3 {
  font-size: 1.1rem;
  margin-bottom: 0.8rem;
  color: #333;
}

.tool-desc {
  color: #666;
  margin-bottom: 1.5rem;
}

.input-section {
  margin-bottom: 1.5rem;
}

.color-input-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.field {
  margin-bottom: 0.8rem;
}

.field label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.color-row {
  display: flex;
  gap: 0.6rem;
  align-items: center;
}

.color-picker {
  width: 44px;
  height: 44px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  padding: 2px;
  background: none;
  flex-shrink: 0;
}

.hex-input {
  flex: 1;
  padding: 0.6rem 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  font-family: monospace;
  outline: none;
  transition: border-color 0.2s;
}

.hex-input:focus {
  border-color: #22c55e;
}

.options-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 1rem;
}

.radio-group {
  display: flex;
  gap: 0.5rem;
}

.radio-group label {
  padding: 0.4rem 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
  user-select: none;
}

.radio-group label.active {
  border-color: #22c55e;
  background: #f0fdf4;
  color: #16a34a;
  font-weight: 600;
}

.radio-group input {
  display: none;
}

.slider {
  width: 100%;
  accent-color: #22c55e;
  cursor: pointer;
}

.preview-section {
  margin-bottom: 1.5rem;
}

.preview-canvas {
  width: 100%;
  height: 80px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.swatches-section {
  display: flex;
  gap: 0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.swatch-item {
  flex: 1;
  min-height: 80px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 0.5rem;
  cursor: pointer;
  transition: transform 0.2s;
}

.swatch-item:hover {
  transform: scaleY(1.08);
}

.swatch-label {
  font-family: monospace;
  font-size: 0.75rem;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.code-section {
  margin-bottom: 2rem;
}

.code-section label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.code-block {
  background: #1a1a2e;
  border-radius: 10px;
  padding: 1.2rem;
  overflow-x: auto;
  margin-bottom: 0.8rem;
}

.code-block code {
  color: #a5d6a7;
  font-family: monospace;
  font-size: 0.9rem;
  white-space: pre-wrap;
  word-break: break-all;
}

.btn-copy {
  padding: 0.5rem 1.2rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
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
  .color-input-row,
  .options-row {
    grid-template-columns: 1fr;
  }
  .swatches-section {
    flex-wrap: wrap;
  }
  .swatch-item {
    min-width: 25%;
  }
}
</style>
