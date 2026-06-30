<template>
  <div class="tool-page">
    <h2>📊 SVG 环形图生成器</h2>
    <p class="subtitle">生成单环进度条、多环饼图、仪表盘，纯 SVG 零依赖</p>

    <div class="layout">
      <!-- 配置面板 -->
      <div class="config-panel">
        <!-- 图表模式 -->
        <div class="config-section">
          <div class="config-label">图表模式</div>
          <div class="mode-tabs">
            <button v-for="m in modes" :key="m.value" :class="{ active: mode === m.value }" @click="mode = m.value">
              {{ m.icon }} {{ m.label }}
            </button>
          </div>
        </div>

        <!-- 数值输入 -->
        <div class="config-section">
          <div class="config-label">{{ mode === 'single' ? '进度值 (%)' : '分段数据' }}</div>
          <template v-if="mode === 'single'">
            <div class="range-row">
              <input type="range" v-model.number="singleValue" min="0" max="100" step="1" />
              <input type="number" v-model.number="singleValue" min="0" max="100" class="num-input" />
              <span class="unit">%</span>
            </div>
          </template>
          <template v-else-if="mode === 'multi'">
            <div class="segments-list">
              <div v-for="(seg, i) in segments" :key="i" class="segment-row">
                <input type="text" v-model="seg.label" placeholder="标签" class="seg-input seg-label" />
                <input type="number" v-model.number="seg.value" min="0" max="100" class="seg-input seg-value" />
                <input type="color" v-model="seg.color" class="seg-color" />
                <button class="seg-del" @click="segments.splice(i, 1)" :disabled="segments.length <= 1">✕</button>
              </div>
              <button class="btn-add" @click="addSegment">＋ 添加分段</button>
            </div>
          </template>
          <template v-else>
            <div class="range-row">
              <input type="range" v-model.number="gaugeValue" min="0" max="100" step="1" />
              <input type="number" v-model.number="gaugeValue" min="0" max="100" class="num-input" />
              <span class="unit">%</span>
            </div>
          </template>
        </div>

        <!-- 外观配置 -->
        <div class="config-section">
          <div class="config-label">外观设置</div>

          <div class="config-row">
            <span>颜色</span>
            <input type="color" v-model="ringColor" class="color-pick" />
            <label class="toggle-label">
              <input type="checkbox" v-model="useGradient" /> 渐变
            </label>
          </div>

          <div v-if="useGradient" class="config-row">
            <span>渐变终色</span>
            <input type="color" v-model="gradientEnd" class="color-pick" />
          </div>

          <div class="config-row">
            <span>环宽度</span>
            <input type="range" v-model.number="ringWidth" min="4" max="40" />
            <span class="range-val">{{ ringWidth }}px</span>
          </div>

          <div class="config-row">
            <span>大小</span>
            <input type="range" v-model.number="svgSize" min="100" max="400" step="10" />
            <span class="range-val">{{ svgSize }}px</span>
          </div>

          <div class="config-row">
            <span>动画时长</span>
            <input type="range" v-model.number="animDuration" min="0" max="3000" step="100" />
            <span class="range-val">{{ animDuration }}ms</span>
          </div>

          <div class="config-row">
            <span>起始角度</span>
            <input type="range" v-model.number="startAngle" min="0" max="360" step="5" />
            <span class="range-val">{{ startAngle }}°</span>
          </div>

          <div class="config-row">
            <span>中心文字</span>
            <input type="text" v-model="centerText" placeholder="可选" class="text-input" />
          </div>
        </div>
      </div>

      <!-- 预览与代码 -->
      <div class="preview-panel">
        <div class="preview-box">
          <div v-html="svgCode" class="svg-preview"></div>
        </div>

        <!-- 多环图例 -->
        <div v-if="mode === 'multi'" class="legend-row">
          <span v-for="(seg, i) in segments" :key="i" class="legend-item">
            <span class="legend-dot" :style="{ background: seg.color }"></span>
            {{ seg.label }} ({{ seg.value }}%)
          </span>
        </div>

        <!-- SVG 代码输出 -->
        <div class="code-section">
          <div class="section-header">
            <span>SVG 代码</span>
            <button class="btn-copy" @click="copySvg">📋 复制</button>
          </div>
          <pre class="code-block"><code>{{ svgCodeRaw }}</code></pre>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'SVG 环形图生成器 - 野火小站' })

const modes = [
  { value: 'single', label: '单环进度', icon: '⭕' },
  { value: 'multi', label: '多环饼图', icon: '🍩' },
  { value: 'gauge', label: '仪表盘', icon: '🏎️' },
]

const mode = ref('single')
const singleValue = ref(72)
const gaugeValue = ref(65)
const segments = ref([
  { label: '分类A', value: 40, color: '#3b82f6' },
  { label: '分类B', value: 30, color: '#10b981' },
  { label: '分类C', value: 20, color: '#f59e0b' },
])

const ringColor = ref('#3b82f6')
const useGradient = ref(false)
const gradientEnd = ref('#8b5cf6')
const ringWidth = ref(12)
const svgSize = ref(200)
const animDuration = ref(1000)
const startAngle = ref(-90)
const centerText = ref('')

function addSegment() {
  const colors = ['#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4']
  const idx = segments.value.length % colors.length
  segments.value.push({ label: `分类${String.fromCharCode(65 + segments.value.length)}`, value: 15, color: colors[idx] })
}

// 计算 SVG
const svgCode = computed(() => {
  return buildSvg(false)
})

const svgCodeRaw = computed(() => {
  return buildSvg(true)
})

function buildSvg(raw) {
  const size = svgSize.value
  const cx = size / 2
  const cy = size / 2
  const r = Math.max(1, cx - ringWidth.value)
  const circ = 2 * Math.PI * r
  const sw = ringWidth.value
  const animMs = animDuration.value
  const start = startAngle.value

  let arcs = ''
  let extras = ''
  let textEl = ''

  // 中心文字
  if (centerText.value) {
    textEl = `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" fill="#374151" font-size="${Math.max(12, size * 0.12)}" font-family="sans-serif" font-weight="600">${escapeHtml(centerText.value)}</text>`
  }

  if (mode.value === 'single') {
    const pct = Math.max(0, Math.min(100, singleValue.value))
    const dashLen = circ * pct / 100
    const dashOff = circ * (start / 360)
    const stroke = useGradient.value ? 'url(#ringGrad)' : ringColor.value
    arcs = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e5e7eb" stroke-width="${sw}" />`
    arcs += `\n<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${circ}" transform="rotate(${start} ${cx} ${cy})" data-target-offset="${circ - dashLen}"${animMs > 0 ? ` style="animation: ringAnim ${animMs}ms ease-out forwards;"` : ''} />`

    if (raw && centerText.value === '') {
      textEl = `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" fill="#374151" font-size="${Math.max(12, size * 0.12)}" font-family="sans-serif" font-weight="600">${pct}%</text>`
    }

    if (useGradient.value) {
      extras += `\n<defs>\n  <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">\n    <stop offset="0%" stop-color="${ringColor.value}" />\n    <stop offset="100%" stop-color="${gradientEnd.value}" />\n  </linearGradient>\n</defs>`
    }
  } else if (mode.value === 'multi') {
    let cumOffset = circ * (start / 360)
    const total = segments.value.reduce((s, seg) => s + seg.value, 0) || 1
    segments.value.forEach((seg, i) => {
      const segLen = circ * seg.value / total
      const stroke = seg.color
      const offset = circ - segLen
      arcs += (i === 0 ? '' : '\n') + `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="${i === segments.value.length - 1 ? 'round' : 'butt'}" stroke-dasharray="${segLen} ${circ - segLen}" stroke-dashoffset="${-cumOffset}" transform="rotate(${start} ${cx} ${cy})" />`
      cumOffset += segLen
    })
    // 背景环
    arcs = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#f3f4f6" stroke-width="${sw}" />\n` + arcs
  } else {
    // 仪表盘：270度弧
    const pct = Math.max(0, Math.min(100, gaugeValue.value))
    const arcAngle = 270
    const arcLen = circ * arcAngle / 360
    const valLen = arcLen * pct / 100
    const gap = circ - arcLen
    const stroke = useGradient.value ? 'url(#gaugeGrad)' : ringColor.value
    arcs = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e5e7eb" stroke-width="${sw}" stroke-dasharray="${arcLen} ${gap}" stroke-dashoffset="0" transform="rotate(${135} ${cx} ${cy})" />`
    arcs += `\n<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${valLen} ${circ - valLen}" stroke-dashoffset="0" transform="rotate(${135} ${cx} ${cy})" />`

    if (raw && centerText.value === '') {
      textEl = `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" fill="#374151" font-size="${Math.max(12, size * 0.12)}" font-family="sans-serif" font-weight="600">${pct}%</text>`
    }

    if (useGradient.value) {
      extras += `\n<defs>\n  <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">\n    <stop offset="0%" stop-color="${ringColor.value}" />\n    <stop offset="100%" stop-color="${gradientEnd.value}" />\n  </linearGradient>\n</defs>`
    }
  }

  let animStyle = ''
  if (animMs > 0 && mode.value === 'single') {
    animStyle = `<style>\n@keyframes ringAnim {\n  from { stroke-dashoffset: ${circ}; }\n  to { stroke-dashoffset: ${circ - circ * singleValue.value / 100}; }\n}\n</style>`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${animStyle}\n${extras}\n${arcs}\n${textEl}\n</svg>`
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

async function copySvg() {
  try {
    await navigator.clipboard.writeText(svgCodeRaw.value)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = svgCodeRaw.value
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
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

.subtitle {
  color: #666;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

.layout {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 1.5rem;
  align-items: start;
}

/* 配置面板 */
.config-panel {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.config-section {
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.config-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.config-label {
  font-size: 0.88rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.6rem;
}

.mode-tabs {
  display: flex;
  gap: 0.4rem;
}

.mode-tabs button {
  flex: 1;
  padding: 0.5rem 0.4rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.mode-tabs button.active {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border-color: transparent;
}

.mode-tabs button:hover:not(.active) {
  border-color: #10b981;
}

/* Range 行 */
.range-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.range-row input[type="range"] {
  flex: 1;
  accent-color: #10b981;
}

.num-input {
  width: 60px;
  padding: 0.35rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  text-align: center;
}

.num-input:focus {
  outline: none;
  border-color: #10b981;
}

.unit {
  font-size: 0.85rem;
  color: #888;
}

/* 分段输入 */
.segments-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.segment-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.seg-input {
  padding: 0.35rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.85rem;
}

.seg-input:focus {
  outline: none;
  border-color: #10b981;
}

.seg-label { flex: 1; min-width: 0; }
.seg-value { width: 60px; text-align: center; }

.seg-color {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  padding: 0;
  background: none;
}

.seg-del {
  width: 28px;
  height: 28px;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #fef2f2;
  color: #ef4444;
  cursor: pointer;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.seg-del:disabled { opacity: 0.3; cursor: not-allowed; }

.btn-add {
  padding: 0.4rem 0.75rem;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.btn-add:hover {
  border-color: #10b981;
  color: #10b981;
}

/* 配置行 */
.config-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
  font-size: 0.85rem;
  color: #6b7280;
}

.config-row > span:first-child {
  min-width: 65px;
  flex-shrink: 0;
}

.config-row input[type="range"] {
  flex: 1;
  accent-color: #10b981;
  min-width: 0;
}

.range-val {
  min-width: 50px;
  text-align: right;
  font-size: 0.82rem;
  font-family: monospace;
}

.color-pick {
  width: 32px;
  height: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  padding: 0;
  background: none;
}

.text-input {
  flex: 1;
  min-width: 0;
  padding: 0.35rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.85rem;
}

.text-input:focus {
  outline: none;
  border-color: #10b981;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  cursor: pointer;
  white-space: nowrap;
}

/* 预览面板 */
.preview-panel {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.preview-box {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  background: #f9fafb;
  border-radius: 10px;
  margin-bottom: 1rem;
  padding: 1.5rem;
}

.svg-preview {
  display: flex;
  align-items: center;
  justify-content: center;
}

.svg-preview :deep(circle) {
  transition: all 0.3s ease;
}

.legend-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: #6b7280;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.88rem;
  font-weight: 600;
  color: #374151;
}

.btn-copy {
  padding: 0.3rem 0.7rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 0.82rem;
  transition: all 0.2s;
}

.btn-copy:hover {
  border-color: #10b981;
  background: #ecfdf5;
}

.code-block {
  background: #1e293b;
  color: #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  font-size: 0.78rem;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
  margin: 0;
}

.back-link {
  display: inline-block;
  margin-top: 2.5rem;
  color: #22c55e;
  font-weight: 500;
}

.back-link:hover { text-decoration: underline; }

@media (max-width: 768px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .preview-box {
    min-height: 180px;
  }
}
</style>
