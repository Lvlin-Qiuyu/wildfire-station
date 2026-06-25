<template>
  <div class="tool-page">
    <h2>📄 纸张尺寸对比工具</h2>
    <p class="subtitle">ISO 216 标准 A/B/C 系列，按真实比例可视化对比，可调 DPI 显示像素尺寸</p>

    <!-- 控制区域 -->
    <div class="controls">
      <div class="series-toggle">
        <button
          v-for="s in seriesList"
          :key="s"
          :class="{ active: activeSeries.includes(s) }"
          @click="toggleSeries(s)"
        >{{ s }} 系列</button>
      </div>
      <div class="settings-row">
        <div class="setting-item">
          <label>DPI</label>
          <select v-model="dpi" class="select-input">
            <option v-for="d in dpiOptions" :key="d" :value="d">{{ d }}</option>
          </select>
        </div>
        <div class="setting-item">
          <label>单位</label>
          <div class="unit-toggle">
            <button :class="{ active: unit === 'mm' }" @click="unit = 'mm'">mm</button>
            <button :class="{ active: unit === 'inch' }" @click="unit = 'inch'">inch</button>
          </div>
        </div>
        <div class="setting-item">
          <label>缩放</label>
          <input type="range" v-model.number="zoom" min="0.3" max="3" step="0.1" class="zoom-slider" />
          <span class="zoom-val">{{ zoom.toFixed(1) }}x</span>
        </div>
      </div>
    </div>

    <!-- Canvas 对比区域 -->
    <div class="canvas-area" ref="canvasContainer">
      <canvas ref="canvasEl"></canvas>
      <div v-if="selectedPapers.length === 0" class="empty-tip">选择上方的系列，对比图将在这里显示</div>
    </div>

    <!-- 选中纸张列表 -->
    <div class="paper-list" v-if="selectedPapers.length > 0">
      <h3>已选择纸张 ({{ selectedPapers.length }})</h3>
      <div class="paper-items">
        <div
          v-for="p in selectedPapers"
          :key="p.key"
          class="paper-item"
          :class="{ highlighted: highlightedKey === p.key }"
          @click="highlightedKey = highlightedKey === p.key ? null : p.key"
          @mouseenter="highlightedKey = p.key"
          @mouseleave="highlightedKey = null"
        >
          <span class="color-dot" :style="{ background: getColor(p) }"></span>
          <span class="paper-name">{{ p.key }}</span>
          <span class="paper-size">{{ formatDim(p) }}</span>
          <span class="paper-px">{{ formatPixels(p) }}</span>
        </div>
      </div>
    </div>

    <!-- 快速参考表 -->
    <div class="ref-table-section">
      <h3>📋 纸张尺寸参考表</h3>
      <div class="ref-tabs">
        <button
          v-for="s in seriesList"
          :key="s"
          :class="{ active: refSeries === s }"
          @click="refSeries = s"
        >{{ s }}</button>
      </div>
      <div class="ref-table-wrap">
        <table class="ref-table">
          <thead>
            <tr>
              <th>规格</th>
              <th>宽 × 高 (mm)</th>
              <th>宽 × 高 (inch)</th>
              <th>像素 ({{ dpi }} DPI)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in getSeriesData(refSeries)" :key="p.key">
              <td>{{ p.key }}</td>
              <td>{{ p.width.toFixed(1) }} × {{ p.height.toFixed(1) }}</td>
              <td>{{ mmToInch(p.width).toFixed(2) }} × {{ mmToInch(p.height).toFixed(2) }}</td>
              <td>{{ Math.round(p.width / 25.4 * dpi) }} × {{ Math.round(p.height / 25.4 * dpi) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '纸张尺寸对比工具 - 野火小站' })

const canvasEl = ref(null)
const canvasContainer = ref(null)
const activeSeries = ref(['A'])
const dpi = ref(96)
const unit = ref('mm')
const zoom = ref(1)
const refSeries = ref('A')
const highlightedKey = ref(null)

const dpiOptions = [72, 96, 120, 150, 300]
const seriesList = ['A', 'B', 'C']

// ISO 216 标准纸张尺寸（mm）
const paperData = {
  A: [
    { name: 'A0', width: 841, height: 1189 },
    { name: 'A1', width: 594, height: 841 },
    { name: 'A2', width: 420, height: 594 },
    { name: 'A3', width: 297, height: 420 },
    { name: 'A4', width: 210, height: 297 },
    { name: 'A5', width: 148, height: 210 },
    { name: 'A6', width: 105, height: 148 },
    { name: 'A7', width: 74, height: 105 },
    { name: 'A8', width: 52, height: 74 },
    { name: 'A9', width: 37, height: 52 },
    { name: 'A10', width: 26, height: 37 },
  ],
  B: [
    { name: 'B0', width: 1000, height: 1414 },
    { name: 'B1', width: 707, height: 1000 },
    { name: 'B2', width: 500, height: 707 },
    { name: 'B3', width: 353, height: 500 },
    { name: 'B4', width: 250, height: 353 },
    { name: 'B5', width: 176, height: 250 },
    { name: 'B6', width: 125, height: 176 },
    { name: 'B7', width: 88, height: 125 },
    { name: 'B8', width: 62, height: 88 },
    { name: 'B9', width: 44, height: 62 },
    { name: 'B10', width: 31, height: 44 },
  ],
  C: [
    { name: 'C0', width: 917, height: 1297 },
    { name: 'C1', width: 648, height: 917 },
    { name: 'C2', width: 458, height: 648 },
    { name: 'C3', width: 324, height: 458 },
    { name: 'C4', width: 229, height: 324 },
    { name: 'C5', width: 162, height: 229 },
    { name: 'C6', width: 114, height: 162 },
    { name: 'C7', width: 81, height: 114 },
    { name: 'C8', width: 57, height: 81 },
    { name: 'C9', width: 40, height: 57 },
    { name: 'C10', width: 28, height: 40 },
  ],
}

// 系列对应颜色
const seriesColors = {
  A: '#22c55e',
  B: '#3498db',
  C: '#9b59b6',
}

// 级别颜色深浅
function getColor(paper) {
  const idx = parseInt(paper.name.slice(1))
  const base = seriesColors[paper.series]
  const alpha = Math.max(0.3, 1 - idx * 0.07)
  return base + Math.round(alpha * 255).toString(16).padStart(2, '0')
}

// 切换系列
function toggleSeries(s) {
  const idx = activeSeries.value.indexOf(s)
  if (idx >= 0) {
    activeSeries.value.splice(idx, 1)
  } else {
    activeSeries.value.push(s)
  }
}

// 选中的纸张数据
const selectedPapers = computed(() => {
  const result = []
  activeSeries.value.forEach(s => {
    paperData[s].forEach(p => {
      result.push({ ...p, series: s, key: s + p.name })
    })
  })
  return result
})

// 格式化尺寸
function formatDim(p) {
  if (unit.value === 'mm') {
    return `${p.width} × ${p.height} mm`
  }
  return `${mmToInch(p.width).toFixed(2)} × ${mmToInch(p.height).toFixed(2)} in`
}

// 格式化像素
function formatPixels(p) {
  const pxW = Math.round(p.width / 25.4 * dpi.value)
  const pxH = Math.round(p.height / 25.4 * dpi.value)
  return `${pxW} × ${pxH} px`
}

// mm 转 inch
function mmToInch(mm) {
  return mm / 25.4
}

// 获取系列参考数据
function getSeriesData(s) {
  return paperData[s].map(p => ({ ...p, series: s, key: s + p.name }))
}

// 绘制 Canvas 对比图
function drawCanvas() {
  const canvas = canvasEl.value
  if (!canvas || selectedPapers.value.length === 0) return

  const dpr = window.devicePixelRatio || 1
  const containerWidth = canvasContainer.value.clientWidth - 40
  const padding = 60

  // 找最大尺寸来确定比例
  let maxW = 0, maxH = 0
  for (const p of selectedPapers.value) {
    maxW = Math.max(maxW, p.width)
    maxH = Math.max(maxH, p.height)
  }

  const baseScale = Math.min(
    (containerWidth - padding * 2) / maxW,
    500 / maxH
  )
  const scale = baseScale * zoom.value

  // 计算画布高度（只显示前6个最大的）
  const displayCount = Math.min(selectedPapers.value.length, 6)
  const totalH = padding * 2 + maxH * scale + 80
  canvas.width = containerWidth * dpr
  canvas.height = totalH * dpr
  canvas.style.width = containerWidth + 'px'
  canvas.style.height = totalH + 'px'

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, containerWidth, totalH)

  const centerX = containerWidth / 2
  const bottomY = padding + maxH * scale

  // 只绘制前6个
  const papers = selectedPapers.value.slice(0, displayCount)

  papers.forEach((p, i) => {
    const w = p.width * scale
    const h = p.height * scale
    const x = centerX - w / 2
    const y = bottomY - h
    const isHighlighted = highlightedKey.value === p.key
    const color = seriesColors[p.series]

    // 阴影
    ctx.shadowColor = 'rgba(0,0,0,0.08)'
    ctx.shadowBlur = 6
    ctx.shadowOffsetY = 3

    // 绘制矩形
    ctx.fillStyle = isHighlighted ? color + '50' : color + '15'
    ctx.strokeStyle = isHighlighted ? color : color + '80'
    ctx.lineWidth = isHighlighted ? 2.5 : 1.5
    ctx.beginPath()
    ctx.rect(x, y, w, h)
    ctx.fill()
    ctx.stroke()

    ctx.shadowColor = 'transparent'

    // 规格名称
    ctx.fillStyle = '#333'
    ctx.font = `bold ${Math.min(14, w / 4)}px system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    if (w > 30 && h > 20) {
      ctx.fillText(p.key, x + w / 2, y + h / 2)
    }

    // 尺寸标注（右上角）
    if (isHighlighted) {
      const label = formatDim(p)
      ctx.fillStyle = color
      ctx.font = 'bold 11px system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText(label, x + w + 6, y)

      // 像素标注
      const pxLabel = formatPixels(p)
      ctx.fillStyle = '#888'
      ctx.font = '10px system-ui, sans-serif'
      ctx.fillText(pxLabel, x + w + 6, y + 16)
    }
  })

  // 比例尺
  const scaleBarMm = maxW > 600 ? 200 : maxW > 300 ? 100 : maxW > 100 ? 50 : 20
  const barPx = scaleBarMm * scale
  const barX = 20
  const barY = bottomY + 30
  ctx.strokeStyle = '#999'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(barX, barY)
  ctx.lineTo(barX + barPx, barY)
  ctx.moveTo(barX, barY - 4)
  ctx.lineTo(barX, barY + 4)
  ctx.moveTo(barX + barPx, barY - 4)
  ctx.lineTo(barX + barPx, barY + 4)
  ctx.stroke()

  ctx.fillStyle = '#999'
  ctx.font = '11px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(
    unit.value === 'inch' ? `${mmToInch(scaleBarMm).toFixed(1)} inch` : `${scaleBarMm} mm`,
    barX + barPx / 2,
    barY + 16
  )

  // 如果有未显示的纸张，提示
  if (selectedPapers.value.length > displayCount) {
    ctx.fillStyle = '#aaa'
    ctx.font = '12px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`显示前 ${displayCount} 个（共 ${selectedPapers.value.length} 个），请参考下方列表查看全部`, centerX, totalH - 15)
  }
}

watch([activeSeries, dpi, unit, zoom, highlightedKey], () => {
  nextTick(drawCanvas)
})

onMounted(() => {
  window.addEventListener('resize', drawCanvas)
  nextTick(drawCanvas)
})

onUnmounted(() => {
  window.removeEventListener('resize', drawCanvas)
})
</script>

<style scoped>
.tool-page {
  padding-top: 0.5rem;
}

h2 {
  font-size: 1.6rem;
  margin-bottom: 0.3rem;
}

.subtitle {
  color: #888;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
}

/* 控制区域 */
.controls {
  margin-bottom: 1.5rem;
}

.series-toggle {
  display: flex;
  gap: 0;
  background: #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.series-toggle button {
  flex: 1;
  padding: 0.6rem 1rem;
  border: none;
  background: transparent;
  font-size: 0.95rem;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.series-toggle button.active {
  color: white;
  font-weight: 600;
}

.series-toggle button:nth-child(1).active {
  background: linear-gradient(135deg, #22c55e, #10b981);
}

.series-toggle button:nth-child(2).active {
  background: linear-gradient(135deg, #3498db, #2980b9);
}

.series-toggle button:nth-child(3).active {
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
}

.settings-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1.2rem;
  align-items: flex-end;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.setting-item label {
  font-size: 0.85rem;
  color: #888;
  font-weight: 600;
}

.select-input {
  padding: 0.4rem 0.6rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
}

.select-input:focus {
  outline: none;
  border-color: #10b981;
}

.unit-toggle {
  display: flex;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #ddd;
}

.unit-toggle button {
  padding: 0.4rem 0.75rem;
  border: none;
  background: white;
  font-size: 0.85rem;
  cursor: pointer;
  color: #666;
}

.unit-toggle button.active {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  font-weight: 600;
}

.zoom-slider {
  -webkit-appearance: none;
  width: 120px;
  height: 6px;
  border-radius: 3px;
  background: #e9ecef;
  outline: none;
}

.zoom-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, #22c55e, #10b981);
  cursor: pointer;
}

.zoom-val {
  font-size: 0.85rem;
  color: #888;
}

/* Canvas 区域 */
.canvas-area {
  background: #fafafa;
  border-radius: 12px;
  border: 1px solid #eee;
  padding: 20px;
  margin-bottom: 1.5rem;
  min-height: 350px;
  position: relative;
}

canvas {
  display: block;
}

.empty-tip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #ccc;
  font-size: 0.95rem;
}

/* 纸张列表 */
.paper-list {
  margin-bottom: 1.5rem;
}

.paper-list h3 {
  font-size: 1rem;
  color: #555;
  margin-bottom: 0.75rem;
}

.paper-items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.paper-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.7rem;
  background: white;
  border: 1px solid #eee;
  border-radius: 8px;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.15s;
}

.paper-item.highlighted {
  border-color: #10b981;
  box-shadow: 0 0 0 1px #10b981;
}

.color-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.paper-name {
  font-weight: 600;
  color: #333;
}

.paper-size {
  color: #666;
}

.paper-px {
  color: #aaa;
  font-size: 0.75rem;
}

/* 参考表 */
.ref-table-section {
  margin-bottom: 2rem;
}

.ref-table-section h3 {
  font-size: 1.05rem;
  margin-bottom: 0.8rem;
  color: #333;
}

.ref-tabs {
  display: flex;
  gap: 0;
  background: #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 0.8rem;
}

.ref-tabs button {
  flex: 1;
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  font-size: 0.9rem;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.ref-tabs button.active {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  font-weight: 600;
}

.ref-table-wrap {
  overflow-x: auto;
  border-radius: 10px;
  border: 1px solid #eee;
}

.ref-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.ref-table th {
  padding: 0.6rem 0.8rem;
  background: #f8f9fa;
  font-size: 0.85rem;
  font-weight: 600;
  color: #555;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.ref-table td {
  padding: 0.5rem 0.8rem;
  font-size: 0.85rem;
  color: #555;
  border-bottom: 1px solid #f5f5f5;
}

.ref-table tr:hover td {
  background: #f8fff8;
}

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #22c55e;
  font-weight: 500;
}

.back-link:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .settings-row {
    flex-direction: column;
  }
  .zoom-slider {
    width: 100%;
  }
}
</style>
