<template>
  <div class="tool-page">
    <h2>🎨 SVG 无缝图案生成器</h2>
    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>

    <p class="subtitle">创建可平铺的 SVG 无缝图案，自定义形状、颜色、密度等参数，实时预览平铺效果。</p>

    <div class="controls">
      <div class="control-row">
        <div class="control-group">
          <label>形状类型</label>
          <select v-model="shape">
            <option v-for="s in shapes" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </div>
        <div class="control-group">
          <label>前景色</label>
          <input type="color" v-model="fillColor" />
        </div>
        <div class="control-group">
          <label>背景色</label>
          <input type="color" v-model="bgColor" />
        </div>
      </div>
      <div class="control-row">
        <div class="control-group">
          <label>单元大小 <b>{{ cellSize }}px</b></label>
          <input type="range" v-model.number="cellSize" min="10" max="80" />
        </div>
        <div class="control-group">
          <label>旋转角度 <b>{{ rotation }}°</b></label>
          <input type="range" v-model.number="rotation" min="0" max="360" />
        </div>
        <div class="control-group">
          <label>间距 <b>{{ gap }}px</b></label>
          <input type="range" v-model.number="gap" min="0" max="20" />
        </div>
        <div class="control-group">
          <label>不透明度 <b>{{ (opacity * 100).toFixed(0) }}%</b></label>
          <input type="range" v-model.number="opacity" min="0.1" max="1" step="0.05" />
        </div>
      </div>
      <div class="control-row">
        <div class="control-group">
          <label>形状大小 <b>{{ shapeSize }}%</b></label>
          <input type="range" v-model.number="shapeSize" min="20" max="100" step="5" />
        </div>
      </div>
    </div>

    <div class="preview-section">
      <div class="preview-box pattern-preview" v-html="patternHtml"></div>
    </div>

    <div class="code-section">
      <div class="code-tabs">
        <button :class="['code-tab', { active: codeTab === 'svg' }]" @click="codeTab = 'svg'">SVG 代码</button>
        <button :class="['code-tab', { active: codeTab === 'css' }]" @click="codeTab = 'css'">CSS 代码</button>
      </div>
      <div class="code-header">
        <span></span>
        <button class="btn-copy" @click="copyCode">📋 复制代码</button>
      </div>
      <pre class="code-output"><code>{{ codeTab === 'svg' ? svgCode : cssCode }}</code></pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

useHead({ title: 'SVG 无缝图案生成器 - 野火小站' })

const shapes = [
  { value: 'circle', label: '圆形' },
  { value: 'square', label: '方形' },
  { value: 'triangle', label: '三角形' },
  { value: 'diamond', label: '菱形' },
  { value: 'cross', label: '十字' },
  { value: 'hexagon', label: '六边形' },
  { value: 'wave', label: '波浪' },
  { value: 'star', label: '星形' },
  { value: 'dot', label: '点阵' },
]

const shape = ref('circle')
const fillColor = ref('#22c55e')
const bgColor = ref('#f0fdf4')
const cellSize = ref(30)
const rotation = ref(0)
const gap = ref(2)
const opacity = ref(1)
const shapeSize = ref(70)
const codeTab = ref('svg')

// 生成单个形状的 SVG 元素字符串
const shapeElement = computed(() => {
  const s = cellSize.value * (shapeSize.value / 100) / 2
  const gapOffset = gap.value / 2
  const center = cellSize.value / 2

  const transform = rotation.value !== 0 ? ` transform="rotate(${rotation} ${center} ${center})"` : ''

  const base = {
    circle: `<circle cx="${center}" cy="${center}" r="${Math.max(1, s)}"${transform} />`,
    square: `<rect x="${center - s}" y="${center - s}" width="${s * 2}" height="${s * 2}"${transform} />`,
    diamond: `<rect x="${center - s}" y="${center - s}" width="${s * 2}" height="${s * 2}"${transform} />`, // 用旋转实现
    cross: (() => {
      const w = s * 0.35
      return `<rect x="${center - w}" y="${center - s}" width="${w * 2}" height="${s * 2}"${transform} />
              <rect x="${center - s}" y="${center - w}" width="${s * 2}" height="${w * 2}"${transform} />`
    })(),
    triangle: `<polygon points="${center},${center - s} ${center - s * 0.866},${center + s * 0.5} ${center + s * 0.866},${center + s * 0.5}"${transform} />`,
    hexagon: (() => {
      const pts = Array.from({ length: 6 }, (_, i) => {
        const angle = (Math.PI / 3) * i - Math.PI / 2
        return `${center + s * Math.cos(angle)},${center + s * Math.sin(angle)}`
      }).join(' ')
      return `<polygon points="${pts}"${transform} />`
    })(),
    wave: `<path d="M ${gapOffset} ${center} Q ${center} ${center - s} ${cellSize.value - gapOffset} ${center}" fill="none" stroke-width="${Math.max(1, s * 0.2)}"${transform} />`,
    star: (() => {
      const pts = Array.from({ length: 10 }, (_, i) => {
        const r = i % 2 === 0 ? s : s * 0.4
        const angle = (Math.PI / 5) * i - Math.PI / 2
        return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`
      }).join(' ')
      return `<polygon points="${pts}"${transform} />`
    })(),
    dot: `<circle cx="${center}" cy="${center}" r="${Math.max(1, s * 0.3)}"${transform} />`,
  }

  return base[shape.value] || base.circle
})

// 生成完整 SVG pattern 单元
const patternUnit = computed(() => {
  const unit = cellSize.value + gap.value
  const isStroke = shape.value === 'wave'
  const fillAttr = isStroke ? '' : ` fill="${fillColor.value}"`
  const strokeAttr = isStroke ? ` fill="none" stroke="${fillColor.value}"` : ''
  const opAttr = opacity.value < 1 ? ` opacity="${opacity.value}"` : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${unit}" height="${unit}">
  <rect width="${unit}" height="${unit}" fill="${bgColor.value}" />
  <g${opAttr}>
    <g${fillAttr}${strokeAttr}>
      ${shapeElement.value}
    </g>
  </g>
</svg>`
})

// 内联 HTML 用于预览
const patternHtml = computed(() => {
  const unit = cellSize.value + gap.value
  const svgPattern = `<svg xmlns="http://www.w3.org/2000/svg" width="${unit}" height="${unit}">
    <defs><pattern id="p" width="${unit}" height="${unit}" patternUnits="userSpaceOnUse">
      <rect width="${unit}" height="${unit}" fill="${bgColor.value}" />
      <g${opacity.value < 1 ? ` opacity="${opacity.value}"` : ''}>
        <g${shape.value === 'wave' ? ` fill="none" stroke="${fillColor.value}"` : ` fill="${fillColor.value}"`}>
          ${shapeElement.value}
        </g>
      </g>
    </pattern></defs>
    <rect width="100%" height="100%" fill="url(#p)" />
  </svg>`
  return svgPattern
})

// SVG 代码（导出用）
const svgCode = computed(() => patternUnit.value)

// CSS 代码
const cssCode = computed(() => {
  const encoded = encodeURIComponent(shapeElement.value
    .replace(/\n/g, ' ')
    .replace(/>\s+</g, '><')
    .trim())
  const unit = cellSize.value + gap.value
  const bgEncoded = bgColor.value.replace('#', '%23')
  const fillAttr = shape.value === 'wave'
    ? `fill:none;stroke:${fillColor.value}`
    : `fill:${fillColor.value}`
  const opAttr = opacity.value < 1 ? `opacity:${opacity.value}` : ''

  return `background-color: ${bgColor.value};
background-image: url("data:image/svg+xml,${encoded}");
background-size: ${unit}px ${unit}px;`
})

// 复制代码
const copyCode = () => {
  const text = codeTab.value === 'svg' ? svgCode.value : cssCode.value
  navigator.clipboard.writeText(text).then(() => {
    // 使用 toast 提示
    const btn = document.querySelector('.btn-copy')
    if (btn) {
      const orig = btn.textContent
      btn.textContent = '✅ 已复制'
      setTimeout(() => btn.textContent = orig, 1500)
    }
  })
}
</script>

<style scoped>
.tool-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem;
}
.tool-page h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}
.back-link {
  display: inline-block;
  margin-bottom: 1rem;
  color: #6b7280;
  text-decoration: none;
  font-size: 0.875rem;
}
.subtitle {
  color: #6b7280;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}
.controls {
  background: #f9fafb;
  border-radius: 0.75rem;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}
.control-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}
.control-row:last-child {
  margin-bottom: 0;
}
.control-group {
  flex: 1;
  min-width: 120px;
}
.control-group label {
  display: block;
  font-size: 0.8rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
  font-weight: 500;
}
.control-group select,
.control-group input[type="range"] {
  width: 100%;
  height: 36px;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0 0.5rem;
  background: white;
  font-size: 0.875rem;
  cursor: pointer;
}
.control-group input[type="color"] {
  width: 48px;
  height: 36px;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 2px;
  cursor: pointer;
}
.preview-section {
  margin-bottom: 1.5rem;
}
.pattern-preview {
  width: 100%;
  min-height: 200px;
  max-height: 300px;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
}
.pattern-preview :deep(svg) {
  width: 100%;
  height: 100%;
  min-height: 200px;
  display: block;
}
.code-section {
  background: #1f2937;
  border-radius: 0.75rem;
  overflow: hidden;
}
.code-tabs {
  display: flex;
  border-bottom: 1px solid #374151;
}
.code-tab {
  flex: 1;
  padding: 0.5rem 1rem;
  background: transparent;
  color: #9ca3af;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
}
.code-tab.active {
  color: #f9fafb;
  background: #374151;
}
.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #374151;
}
.btn-copy {
  padding: 0.25rem 0.75rem;
  background: #374151;
  color: #f9fafb;
  border: 1px solid #4b5563;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.8rem;
}
.btn-copy:hover {
  background: #4b5563;
}
.code-output {
  padding: 1rem;
  margin: 0;
  overflow-x: auto;
  color: #d1d5db;
  font-size: 0.8rem;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
}
@media (max-width: 640px) {
  .tool-page {
    padding: 1rem;
  }
  .control-row {
    flex-direction: column;
    gap: 0.75rem;
  }
}
</style>
