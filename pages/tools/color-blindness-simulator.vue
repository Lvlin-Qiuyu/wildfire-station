<template>
  <div class="tool-page">
    <h2>👁️ 色盲模拟与无障碍检测器</h2>
    <p class="tool-desc">基于 Brettel/Viénot 算法模拟8种色盲视觉，检测颜色对比度是否符合 WCAG 标准</p>

    <!-- 模式切换 -->
    <div class="mode-tabs">
      <button :class="{ active: mode === 'image' }" @click="mode = 'image'">🖼️ 图片模拟</button>
      <button :class="{ active: mode === 'color' }" @click="mode = 'color'">🎨 颜色检测</button>
    </div>

    <!-- 图片模式 -->
    <div v-if="mode === 'image'" class="image-section">
      <div class="upload-area" @click="$refs.fileInput.click()" @dragover.prevent @drop.prevent="handleDrop">
        <input ref="fileInput" type="file" accept="image/*" hidden @change="handleFile" />
        <template v-if="!originalImg">
          <div class="upload-icon">📁</div>
          <p>点击或拖拽上传图片</p>
        </template>
        <img v-else :src="originalImg" class="thumb" />
      </div>
      <canvas ref="cvs" class="hidden-canvas" />
      <div v-if="originalImg" class="sim-grid">
        <div v-for="item in blindnessTypes" :key="item.id" class="sim-card">
          <div class="sim-label">{{ item.icon }} {{ item.name }}</div>
          <canvas :ref="el => simCanvases[item.id] = el" class="sim-canvas" />
        </div>
      </div>
    </div>

    <!-- 颜色模式 -->
    <div v-if="mode === 'color'" class="color-section">
      <div class="color-input-row">
        <div class="color-field">
          <label>前景色</label>
          <div class="color-row">
            <input type="color" v-model="fgColor" />
            <input v-model="fgColor" class="hex-input" maxlength="7" spellcheck="false" />
          </div>
        </div>
        <button class="btn-swap" @click="swapColors">🔄</button>
        <div class="color-field">
          <label>背景色</label>
          <div class="color-row">
            <input type="color" v-model="bgColor" />
            <input v-model="bgColor" class="hex-input" maxlength="7" spellcheck="false" />
          </div>
        </div>
      </div>

      <!-- 对比度与WCAG -->
      <div v-if="validColors" class="results-panel">
        <div class="ratio-card">
          <span class="ratio-val">{{ ratio.toFixed(2) }}</span>
          <span class="ratio-unit">: 1</span>
        </div>
        <div class="wcag-grid">
          <div v-for="w in wcagItems" :key="w.label" class="wcag-item" :class="w.pass ? 'pass' : 'fail'">
            {{ w.pass ? '✅' : '❌' }} {{ w.label }}
          </div>
        </div>
        <div class="preview-box" :style="{ color: fgColor, backgroundColor: bgColor }">
          示例文本 Example Text 123
        </div>
      </div>

      <!-- 色盲模拟对比 -->
      <div v-if="validColors" class="sim-colors">
        <h4>各色盲类型下的颜色对比</h4>
        <div class="sim-color-grid">
          <div v-for="item in blindnessTypes" :key="item.id" class="sim-color-card">
            <div class="sim-color-name">{{ item.icon }} {{ item.name }}</div>
            <div class="sim-color-bar">
              <span class="bar-fg" :style="{ backgroundColor: simulateColor(fgColor, item.id) }">Aa</span>
              <span class="bar-bg" :style="{ backgroundColor: simulateColor(bgColor, item.id) }"></span>
            </div>
            <div class="sim-color-ratio" :class="simRatio(item.id) >= 4.5 ? 'pass' : 'fail'">
              {{ simRatio(item.id).toFixed(2) }}:1
            </div>
          </div>
        </div>
      </div>

      <!-- 批量检测 -->
      <div class="batch-section">
        <h4>批量颜色检测</h4>
        <div class="batch-inputs">
          <input v-model="batchInput" placeholder="输入多个HEX颜色，逗号分隔（如 #ff0000, #00ff00, #0000ff）" />
          <button class="btn-primary" @click="addBatchColors">添加</button>
        </div>
        <div v-if="batchColors.length" class="batch-results">
          <div v-for="(c, i) in batchColors" :key="i" class="batch-item">
            <span class="batch-swatch" :style="{ backgroundColor: c }"></span>
            <span class="batch-hex">{{ c }}</span>
            <span class="batch-ratio" :class="batchRatio(c, bgColor) >= 4.5 ? 'pass' : 'fail'">
              {{ batchRatio(c, bgColor).toFixed(2) }}:1
            </span>
            <button class="btn-tiny" @click="batchColors.splice(i, 1)">✕</button>
          </div>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '色盲模拟与无障碍检测器 - 野火小站' })

const mode = ref('image')
const originalImg = ref(null)
const fgColor = ref('#1a1a2e')
const bgColor = ref('#ffffff')
const batchInput = ref('')
const batchColors = ref([])
const simCanvases = reactive({})

// 8种色盲类型及变换矩阵（基于Viénot算法）
const blindnessTypes = [
  { id: 'protanopia', name: '红色盲', icon: '🔴', matrix: [0.567, 0.433, 0, 0.558, 0.442, 0, 0, 0.242, 0.758] },
  { id: 'deuteranopia', name: '绿色盲', icon: '🟢', matrix: [0.625, 0.375, 0, 0.7, 0.3, 0, 0, 0.3, 0.7] },
  { id: 'tritanopia', name: '蓝色盲', icon: '🔵', matrix: [0.95, 0.05, 0, 0, 0.433, 0.567, 0, 0.475, 0.525] },
  { id: 'protanomaly', name: '红色弱', icon: '🟠', matrix: [0.817, 0.183, 0, 0.333, 0.667, 0, 0, 0.125, 0.875] },
  { id: 'deuteranomaly', name: '绿色弱', icon: '🟩', matrix: [0.8, 0.2, 0, 0.258, 0.742, 0, 0, 0.142, 0.858] },
  { id: 'tritanomaly', name: '蓝色弱', icon: '🟦', matrix: [0.967, 0.033, 0, 0, 0.733, 0.267, 0, 0.183, 0.817] },
  { id: 'achromatopsia', name: '全色盲', icon: '⚪', matrix: [0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114] },
  { id: 'trichromat', name: '三色觉正常', icon: '🌈', matrix: [1, 0, 0, 0, 1, 0, 0, 0, 1] },
]

// HEX转RGB
function hexToRgb(hex) {
  hex = hex.replace('#', '')
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null
  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)]
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')
}

// 使用矩阵变换模拟色盲
function simulateColor(hex, type) {
  const rgb = hexToRgb(hex)
  if (!rgb) return '#000'
  const m = blindnessTypes.find(t => t.id === type)?.matrix || [1, 0, 0, 0, 1, 0, 0, 0, 1]
  const [r, g, b] = [
    m[0] * rgb[0] + m[1] * rgb[1] + m[2] * rgb[2],
    m[3] * rgb[0] + m[4] * rgb[1] + m[5] * rgb[2],
    m[6] * rgb[0] + m[7] * rgb[1] + m[8] * rgb[2],
  ]
  return rgbToHex(r, g, b)
}

// 相对亮度
function luminance(rgb) {
  const [rs, gs, bs] = [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255]
  const r = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4)
  const g = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4)
  const b = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function calcRatio(hex1, hex2) {
  const c1 = hexToRgb(hex1), c2 = hexToRgb(hex2)
  if (!c1 || !c2) return 0
  const l1 = luminance(c1), l2 = luminance(c2)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

const validColors = computed(() => hexToRgb(fgColor.value) && hexToRgb(bgColor.value))
const ratio = computed(() => validColors.value ? calcRatio(fgColor.value, bgColor.value) : 0)
const wcagItems = computed(() => {
  const r = ratio.value
  return [
    { label: 'AA 正常文本 ≥4.5', pass: r >= 4.5 },
    { label: 'AA 大文本 ≥3', pass: r >= 3 },
    { label: 'AAA 正常文本 ≥7', pass: r >= 7 },
    { label: 'AAA 大文本 ≥4.5', pass: r >= 4.5 },
  ]
})

function simRatio(typeId) {
  return calcRatio(simulateColor(fgColor.value, typeId), simulateColor(bgColor.value, typeId))
}

function batchRatio(c, bg) { return calcRatio(c, bg) }

function swapColors() {
  [fgColor.value, bgColor.value] = [bgColor.value, fgColor.value]
}

function addBatchColors() {
  batchInput.value.split(',').map(s => s.trim()).filter(s => /^#[0-9a-fA-F]{3,6}$/.test(s)).forEach(c => {
    if (!batchColors.value.includes(c)) batchColors.value.push(c)
  })
  batchInput.value = ''
}

// 图片上传与模拟
const cvs = ref(null)

function loadImage(file) {
  const reader = new FileReader()
  reader.onload = (e) => {
    originalImg.value = e.target.result
    nextTick(() => applySimulation())
  }
  reader.readAsDataURL(file)
}

function handleFile(e) {
  if (e.target.files[0]) loadImage(e.target.files[0])
}

function handleDrop(e) {
  if (e.dataTransfer.files[0]) loadImage(e.dataTransfer.files[0])
}

function applySimulation() {
  const img = new Image()
  img.onload = () => {
    // 获取源canvas
    const srcCanvas = cvs.value
    if (!srcCanvas) return
    const maxW = 200
    const scale = maxW / img.width
    const w = maxW, h = Math.round(img.height * scale)
    srcCanvas.width = w
    srcCanvas.height = h
    const ctx = srcCanvas.getContext('2d')
    ctx.drawImage(img, 0, 0, w, h)
    const srcData = ctx.getImageData(0, 0, w, h)

    // 对每种色盲类型生成模拟图
    blindnessTypes.forEach(bt => {
      const target = simCanvases[bt.id]
      if (!target) return
      target.width = w
      target.height = h
      const tCtx = target.getContext('2d')
      const outData = tCtx.createImageData(w, h)
      const d = srcData.data, o = outData.data
      const m = bt.matrix
      for (let i = 0; i < d.length; i += 4) {
        o[i] = Math.min(255, Math.max(0, m[0] * d[i] + m[1] * d[i + 1] + m[2] * d[i + 2]))
        o[i + 1] = Math.min(255, Math.max(0, m[3] * d[i] + m[4] * d[i + 1] + m[5] * d[i + 2]))
        o[i + 2] = Math.min(255, Math.max(0, m[6] * d[i] + m[7] * d[i + 1] + m[8] * d[i + 2]))
        o[i + 3] = d[i + 3]
      }
      tCtx.putImageData(outData, 0, 0)
    })
  }
  img.src = originalImg.value
}
</script>

<style scoped>
.tool-page { padding-top: 0.5rem; }
h2 { font-size: 1.6rem; margin-bottom: 0.5rem; }
.tool-desc { color: #666; margin-bottom: 1.5rem; font-size: 0.95rem; }

.mode-tabs {
  display: flex; gap: 0.5rem; margin-bottom: 1.5rem;
}
.mode-tabs button {
  padding: 0.6rem 1.2rem; border: 2px solid #e0e0e0; border-radius: 8px;
  background: white; cursor: pointer; font-size: 0.95rem; transition: all 0.2s;
}
.mode-tabs button.active {
  border-color: #22c55e; background: #f0fdf4; font-weight: 600;
}

/* 图片区 */
.upload-area {
  border: 2px dashed #ccc; border-radius: 12px; padding: 2rem;
  text-align: center; cursor: pointer; margin-bottom: 1.5rem; min-height: 120px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.upload-area:hover { border-color: #22c55e; background: #f0fdf4; }
.upload-icon { font-size: 2rem; margin-bottom: 0.5rem; }
.thumb { max-width: 200px; max-height: 150px; border-radius: 8px; }
.hidden-canvas { display: none; }

.sim-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}
.sim-card { background: #f8f9fa; border-radius: 10px; padding: 0.8rem; text-align: center; }
.sim-label { font-weight: 600; margin-bottom: 0.5rem; font-size: 0.9rem; }
.sim-canvas { width: 100%; border-radius: 6px; }

/* 颜色区 */
.color-section { display: flex; flex-direction: column; gap: 1.5rem; }
.color-input-row {
  display: flex; align-items: flex-end; gap: 1rem; flex-wrap: wrap;
}
.color-field { flex: 1; min-width: 180px; }
.color-field label { display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.9rem; }
.color-row { display: flex; gap: 0.8rem; align-items: center; }
.color-row input[type="color"] {
  width: 50px; height: 50px; border: 2px solid #e0e0e0; border-radius: 10px;
  cursor: pointer; padding: 2px; background: none; flex-shrink: 0;
}
.hex-input {
  flex: 1; padding: 0.6rem 1rem; border: 2px solid #e0e0e0; border-radius: 8px;
  font-size: 1.05rem; font-family: monospace; outline: none; transition: border-color 0.2s;
}
.hex-input:focus { border-color: #22c55e; }

.btn-swap {
  width: 44px; height: 44px; border: 2px solid #e0e0e0; border-radius: 50%;
  cursor: pointer; font-size: 1.2rem; background: white; flex-shrink: 0; transition: all 0.2s;
}
.btn-swap:hover { border-color: #22c55e; transform: rotate(180deg); }

.results-panel { display: flex; flex-direction: column; gap: 1rem; }
.ratio-card {
  text-align: center; padding: 1.5rem; background: linear-gradient(135deg, #f0fdf4, #ecfdf5); border-radius: 14px;
}
.ratio-val { font-size: 2.5rem; font-weight: 800; color: #1a1a2e; }
.ratio-unit { font-size: 1.2rem; color: #666; }

.wcag-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
.wcag-item {
  padding: 0.7rem 1rem; border-radius: 8px; font-size: 0.9rem; font-weight: 600;
  border: 2px solid;
}
.wcag-item.pass { border-color: #22c55e; background: #f0fdf4; }
.wcag-item.fail { border-color: #fecaca; background: #fef2f2; }

.preview-box {
  border-radius: 12px; padding: 1.5rem; font-size: 1.1rem; transition: all 0.3s;
}

.sim-colors h4, .batch-section h4 {
  font-size: 1rem; margin-bottom: 0.8rem;
}
.sim-color-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.8rem; }
.sim-color-card {
  background: #f8f9fa; border-radius: 10px; padding: 0.8rem; text-align: center;
}
.sim-color-name { font-size: 0.85rem; margin-bottom: 0.5rem; }
.sim-color-bar {
  display: flex; height: 32px; border-radius: 6px; overflow: hidden; margin-bottom: 0.4rem;
}
.bar-fg {
  flex: 1; display: flex; align-items: center; justify-content: center;
  font-size: 0.8rem; font-weight: 700;
}
.bar-bg { flex: 1; }
.sim-color-ratio { font-size: 0.85rem; font-weight: 600; }
.sim-color-ratio.pass { color: #22c55e; }
.sim-color-ratio.fail { color: #ef4444; }

/* 批量 */
.batch-inputs { display: flex; gap: 0.5rem; margin-bottom: 0.8rem; }
.batch-inputs input {
  flex: 1; padding: 0.6rem 1rem; border: 2px solid #e0e0e0; border-radius: 8px;
  font-size: 0.9rem; outline: none; transition: border-color 0.2s;
}
.batch-inputs input:focus { border-color: #22c55e; }
.btn-primary {
  padding: 0.6rem 1.2rem; background: linear-gradient(135deg, #22c55e, #10b981);
  color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem;
}
.btn-primary:hover { opacity: 0.9; }

.batch-results { display: flex; flex-direction: column; gap: 0.4rem; }
.batch-item {
  display: flex; align-items: center; gap: 0.8rem; padding: 0.5rem 0.8rem;
  background: #f8f9fa; border-radius: 8px;
}
.batch-swatch { width: 28px; height: 28px; border-radius: 6px; border: 1px solid #ddd; flex-shrink: 0; }
.batch-hex { font-family: monospace; font-size: 0.9rem; }
.batch-ratio { font-weight: 600; font-size: 0.9rem; margin-left: auto; }
.batch-ratio.pass { color: #22c55e; }
.batch-ratio.fail { color: #ef4444; }
.btn-tiny {
  background: none; border: none; color: #999; cursor: pointer; font-size: 1rem; padding: 0.2rem;
}
.btn-tiny:hover { color: #ef4444; }

.back-link { display: inline-block; margin-top: 2rem; color: #22c55e; text-decoration: none; font-weight: 600; }
.back-link:hover { text-decoration: underline; }

@media (max-width: 600px) {
  .wcag-grid { grid-template-columns: 1fr; }
  .color-input-row { flex-direction: column; align-items: stretch; }
  .btn-swap { align-self: center; }
  .sim-grid, .sim-color-grid { grid-template-columns: 1fr 1fr; }
}
</style>
