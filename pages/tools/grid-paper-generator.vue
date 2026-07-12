<template>
  <div class="tool-page">
    <h2>📐 方格纸生成器</h2>
    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>

    <p class="subtitle">自定义生成方格纸，支持正方形、三角形、六边形网格，可导出 SVG 和 PNG。</p>

    <div class="controls">
      <div class="control-row">
        <div class="control-group">
          <label>网格类型</label>
          <select v-model="gridType">
            <option value="square">正方形</option>
            <option value="triangle">三角形</option>
            <option value="hexagon">六边形</option>
            <option value="dot">点阵</option>
          </select>
        </div>
        <div class="control-group">
          <label>网格大小 <b>{{ cellSize }}mm</b></label>
          <input type="range" v-model.number="cellSize" min="2" max="30" step="1" />
        </div>
        <div class="control-group">
          <label>线宽 <b>{{ lineWidth.toFixed(1) }}pt</b></label>
          <input type="range" v-model.number="lineWidth" min="0.1" max="2" step="0.1" />
        </div>
      </div>
      <div class="control-row">
        <div class="control-group">
          <label>网格颜色</label>
          <input type="color" v-model="gridColor" />
        </div>
        <div class="control-group">
          <label>背景颜色</label>
          <input type="color" v-model="bgColor" />
        </div>
        <div class="control-group">
          <label>坐标轴</label>
          <button :class="['toggle-btn', { active: showAxes }]" @click="showAxes = !showAxes">
            {{ showAxes ? '显示' : '隐藏' }}
          </button>
        </div>
        <div class="control-group">
          <label>编号</label>
          <button :class="['toggle-btn', { active: showNumbers }]" @click="showNumbers = !showNumbers">
            {{ showNumbers ? '显示' : '隐藏' }}
          </button>
        </div>
      </div>
    </div>

    <div class="preview-section">
      <div class="preview-box">
        <canvas ref="previewCanvas" class="preview-canvas"></canvas>
      </div>
    </div>

    <div class="export-bar">
      <button class="btn-export" @click="exportPNG">📥 导出 PNG</button>
      <button class="btn-export" @click="exportSVG">📥 导出 SVG</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'

useHead({ title: '方格纸生成器 - 野火小站' })

const gridType = ref('square')
const cellSize = ref(5)
const lineWidth = ref(0.3)
const gridColor = ref('#6b7280')
const bgColor = ref('#ffffff')
const showAxes = ref(false)
const showNumbers = ref(false)
const previewCanvas = ref(null)

const drawCanvas = () => {
  const canvas = previewCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const displayW = Math.min(700, window.innerWidth - 60)
  const displayH = 500
  canvas.style.width = displayW + 'px'
  canvas.style.height = displayH + 'px'
  canvas.width = displayW * dpr
  canvas.height = displayH * dpr
  ctx.scale(dpr, dpr)

  // mm to px (A4 approx 210×297mm, fit to display)
  const scale = displayW / 200
  const w = displayW
  const h = displayH

  ctx.fillStyle = bgColor.value
  ctx.fillRect(0, 0, w, h)

  ctx.strokeStyle = gridColor.value
  ctx.lineWidth = lineWidth.value

  if (gridType.value === 'square') {
    drawSquareGrid(ctx, w, h, scale)
  } else if (gridType.value === 'triangle') {
    drawTriangleGrid(ctx, w, h, scale)
  } else if (gridType.value === 'hexagon') {
    drawHexGrid(ctx, w, h, scale)
  } else if (gridType.value === 'dot') {
    drawDotGrid(ctx, w, h, scale)
  }

  if (showAxes.value) drawAxes(ctx, w, h, scale)
  if (showNumbers.value) drawNumbers(ctx, w, h, scale)
}

const drawSquareGrid = (ctx, w, h, scale) => {
  const cell = cellSize.value * scale
  for (let x = cell; x < w; x += cell) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
  }
  for (let y = cell; y < h; y += cell) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }
}

const drawTriangleGrid = (ctx, w, h, scale) => {
  const cell = cellSize.value * scale
  const rowH = cell * Math.sqrt(3) / 2
  for (let y = 0; y <= h + rowH; y += rowH) {
    const row = Math.round(y / rowH)
    const offset = row % 2 === 0 ? 0 : cell / 2
    // 水平线
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
    // 正斜线
    for (let x = offset; x <= w + cell; x += cell) {
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x - cell / 2, y + rowH)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + cell / 2, y + rowH)
      ctx.stroke()
    }
  }
}

const drawHexGrid = (ctx, w, h, scale) => {
  const r = cellSize.value * scale
  const colW = r * 1.5
  const rowH = r * Math.sqrt(3)
  for (let col = 0; col <= w / colW + 1; col++) {
    for (let row = 0; row <= h / rowH + 1; row++) {
      const cx = col * colW
      const cy = row * rowH + (col % 2 === 1 ? rowH / 2 : 0)
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6
        const hx = cx + r * Math.cos(angle)
        const hy = cy + r * Math.sin(angle)
        if (i === 0) ctx.moveTo(hx, hy)
        else ctx.lineTo(hx, hy)
      }
      ctx.closePath()
      ctx.stroke()
    }
  }
}

const drawDotGrid = (ctx, w, h, scale) => {
  const cell = cellSize.value * scale
  const dotR = Math.max(0.8, lineWidth.value * 1.2)
  ctx.fillStyle = gridColor.value
  for (let x = cell; x < w; x += cell) {
    for (let y = cell; y < h; y += cell) {
      ctx.beginPath()
      ctx.arc(x, y, dotR, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

const drawAxes = (ctx, w, h, scale) => {
  const cell = cellSize.value * scale
  ctx.strokeStyle = '#ef4444'
  ctx.lineWidth = lineWidth.value * 2
  ctx.beginPath()
  ctx.moveTo(cell, 0)
  ctx.lineTo(cell, h)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(0, h - cell)
  ctx.lineTo(w, h - cell)
  ctx.stroke()
}

const drawNumbers = (ctx, w, h, scale) => {
  const cell = cellSize.value * scale
  ctx.fillStyle = gridColor.value
  ctx.font = `${Math.min(10, cell * 0.4)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  let idx = 1
  // 横向编号
  for (let x = cell * 2; x < w; x += cell) {
    ctx.fillText(idx, x, h - cell / 2)
    if (++idx > 50) break
  }
  // 纵向编号
  idx = 1
  for (let y = h - cell * 1.5; y > 10; y -= cell) {
    ctx.fillText(idx, cell / 2, y)
    if (++idx > 50) break
  }
}

const generateSVG = () => {
  const svgW = 800
  const svgH = 1100
  const scale = 4
  const cell = cellSize.value * scale
  let lines = []

  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">`)
  lines.push(`  <rect width="${svgW}" height="${svgH}" fill="${bgColor.value}" />`)
  lines.push(`  <g stroke="${gridColor.value}" stroke-width="${lineWidth.value * scale}" fill="none">`)

  if (gridType.value === 'square') {
    for (let x = cell; x < svgW; x += cell) {
      lines.push(`    <line x1="${x}" y1="0" x2="${x}" y2="${svgH}" />`)
    }
    for (let y = cell; y < svgH; y += cell) {
      lines.push(`    <line x1="0" y1="${y}" x2="${svgW}" y2="${y}" />`)
    }
  } else if (gridType.value === 'hexagon') {
    const r = cell
    const colW = r * 1.5
    const rowH = r * Math.sqrt(3)
    for (let col = 0; col <= svgW / colW + 1; col++) {
      for (let row = 0; row <= svgH / rowH + 1; row++) {
        const cx = col * colW
        const cy = row * rowH + (col % 2 === 1 ? rowH / 2 : 0)
        let pts = []
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6
          pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`)
        }
        lines.push(`    <polygon points="${pts.join(' ')}" />`)
      }
    }
  } else if (gridType.value === 'dot') {
    const dotR = Math.max(1.5, lineWidth.value * 2)
    lines.push(`  </g>`)
    lines.push(`  <g fill="${gridColor.value}">`)
    for (let x = cell; x < svgW; x += cell) {
      for (let y = cell; y < svgH; y += cell) {
        lines.push(`    <circle cx="${x}" cy="${y}" r="${dotR}" />`)
      }
    }
    lines.push(`  </g>`)
    lines.push('</svg>')
    return lines.join('\n')
  }

  lines.push('  </g>')
  lines.push('</svg>')
  return lines.join('\n')
}

const exportPNG = () => {
  const canvas = document.createElement('canvas')
  const exportW = 1200
  const exportH = 1600
  canvas.width = exportW
  canvas.height = exportH
  const ctx = canvas.getContext('2d')
  const scale = exportW / 200
  ctx.fillStyle = bgColor.value
  ctx.fillRect(0, 0, exportW, exportH)
  ctx.strokeStyle = gridColor.value
  ctx.lineWidth = lineWidth.value * (exportW / 700)

  if (gridType.value === 'square') drawSquareGrid(ctx, exportW, exportH, scale)
  else if (gridType.value === 'triangle') drawTriangleGrid(ctx, exportW, exportH, scale)
  else if (gridType.value === 'hexagon') drawHexGrid(ctx, exportW, exportH, scale)
  else if (gridType.value === 'dot') drawDotGrid(ctx, exportW, exportH, scale)

  if (showAxes.value) drawAxes(ctx, exportW, exportH, scale)

  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = 'grid-paper.png'
  a.click()
}

const exportSVG = () => {
  const svg = generateSVG()
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'grid-paper.svg'
  a.click()
  URL.revokeObjectURL(url)
}

watch([gridType, cellSize, lineWidth, gridColor, bgColor, showAxes, showNumbers], () => {
  nextTick(drawCanvas)
})

onMounted(() => {
  nextTick(drawCanvas)
  window.addEventListener('resize', drawCanvas)
})
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
  margin-bottom: 1.25rem;
  font-size: 0.9rem;
}
.controls {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1.25rem;
}
.control-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.75rem;
}
.control-row:last-child { margin-bottom: 0; }
.control-group {
  flex: 1;
  min-width: 100px;
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
}
.control-group input[type="color"] {
  width: 48px;
  height: 36px;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 2px;
}
.toggle-btn {
  padding: 0.25rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
}
.toggle-btn.active {
  border-color: #22c55e;
  background: #f0fdf4;
  color: #16a34a;
}

.preview-section {
  margin-bottom: 1.25rem;
}
.preview-box {
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
  background: white;
}
.preview-canvas {
  width: 100%;
  display: block;
}

.export-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 0.75rem;
}
.btn-export {
  padding: 0.45rem 1rem;
  background: #22c55e;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
}
.btn-export:hover { background: #16a34a; }

@media (max-width: 640px) {
  .tool-page { padding: 1rem; }
  .control-row { gap: 0.5rem; }
}
</style>
