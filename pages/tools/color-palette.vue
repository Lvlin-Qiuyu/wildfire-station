<template>
  <div class="tool-page">
    <h2>🎨 智能色彩搭配</h2>

    <div class="input-section">
      <label>选择主色</label>
      <div class="color-input-row">
        <input type="color" v-model="baseColor" class="color-picker" />
        <input
          v-model="baseColor"
          class="hex-input"
          placeholder="#22c55e"
          maxlength="7"
          spellcheck="false"
        />
        <button class="btn-random" @click="randomColor">🎲 随机</button>
      </div>
    </div>

    <!-- 调色板组 -->
    <div v-for="group in palettes" :key="group.name" class="palette-group">
      <h3>{{ group.icon }} {{ group.name }}</h3>
      <div class="color-swatches">
        <div
          v-for="color in group.colors"
          :key="color"
          class="swatch"
          :style="{ backgroundColor: color }"
          @click="copyColor(color)"
        >
          <span class="swatch-hex" :style="{ color: textColorForBg(color) }">{{ color }}</span>
        </div>
      </div>
    </div>

    <!-- CSS变量代码 -->
    <div class="code-section">
      <label>CSS 变量代码</label>
      <div class="code-block">
        <code>{{ cssVarsCode }}</code>
      </div>
      <button class="btn-copy" @click="copyCss">{{ copyText }}</button>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '智能色彩搭配 - 野火小站' })

const baseColor = ref('#22c55e')
const copyText = ref('复制代码')

function hexToHsl(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255
  let g = parseInt(hex.slice(3, 5), 16) / 255
  let b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2
  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = n => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

function makeHex(h, s, l) {
  h = ((h % 360) + 360) % 360
  s = Math.max(0, Math.min(100, s))
  l = Math.max(0, Math.min(100, l))
  return hslToHex(h, s, l)
}

const palettes = computed(() => {
  const [h, s, l] = hexToHsl(baseColor.value)
  return [
    {
      icon: '🔄',
      name: '互补色',
      colors: [baseColor.value, makeHex(h + 180, s, l)]
    },
    {
      icon: '🌸',
      name: '类比色',
      colors: [
        makeHex(h - 30, s, l),
        baseColor.value,
        makeHex(h + 30, s, l)
      ]
    },
    {
      icon: '🎯',
      name: '三色配色',
      colors: [
        baseColor.value,
        makeHex(h + 120, s, l),
        makeHex(h + 240, s, l)
      ]
    },
    {
      icon: '✂️',
      name: '分裂互补色',
      colors: [
        baseColor.value,
        makeHex(h + 150, s, l),
        makeHex(h + 210, s, l)
      ]
    }
  ]
})

const cssVarsCode = computed(() => {
  const [h, s, l] = hexToHsl(baseColor.value)
  return `:root {
  --color-primary: ${baseColor.value};
  --color-complement: ${makeHex(h + 180, s, l)};
  --color-analogous-1: ${makeHex(h - 30, s, l)};
  --color-analogous-2: ${makeHex(h + 30, s, l)};
  --color-triadic-1: ${makeHex(h + 120, s, l)};
  --color-triadic-2: ${makeHex(h + 240, s, l)};
  --color-split-1: ${makeHex(h + 150, s, l)};
  --color-split-2: ${makeHex(h + 210, s, l)};
}`
})

function textColorForBg(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#1a1a2e' : '#ffffff'
}

function copyColor(color) {
  navigator.clipboard.writeText(color)
}

function copyCss() {
  navigator.clipboard.writeText(cssVarsCode.value).then(() => {
    copyText.value = '已复制 ✓'
    setTimeout(() => { copyText.value = '复制代码' }, 1500)
  })
}

function randomColor() {
  const h = Math.floor(Math.random() * 360)
  const s = 50 + Math.floor(Math.random() * 40)
  const l = 35 + Math.floor(Math.random() * 35)
  baseColor.value = makeHex(h, s, l)
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

h3 {
  font-size: 1.1rem;
  margin-bottom: 0.8rem;
  color: #333;
}

.input-section {
  margin-bottom: 2rem;
}

.input-section label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.color-input-row {
  display: flex;
  gap: 0.8rem;
  align-items: center;
}

.color-picker {
  width: 50px;
  height: 50px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  cursor: pointer;
  padding: 2px;
  background: none;
}

.hex-input {
  flex: 1;
  max-width: 200px;
  padding: 0.6rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1.1rem;
  font-family: monospace;
  outline: none;
  transition: border-color 0.2s;
}

.hex-input:focus {
  border-color: #22c55e;
}

.btn-random {
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: transform 0.2s;
}

.btn-random:active {
  transform: scale(0.95);
}

.palette-group {
  margin-bottom: 2rem;
}

.color-swatches {
  display: flex;
  gap: 0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.swatch {
  flex: 1;
  min-height: 100px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 0.6rem;
  cursor: pointer;
  transition: transform 0.2s;
  position: relative;
}

.swatch:hover {
  transform: scaleY(1.05);
}

.swatch-hex {
  font-family: monospace;
  font-size: 0.85rem;
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
  white-space: pre;
  line-height: 1.6;
}

.btn-copy {
  padding: 0.6rem 1.4rem;
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
  .color-swatches {
    flex-direction: column;
  }
  .swatch {
    min-height: 70px;
  }
}
</style>
