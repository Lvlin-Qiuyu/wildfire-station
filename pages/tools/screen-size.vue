<template>
  <div class="tool-page">
    <h2>📏 屏幕尺寸可视化对比</h2>
    <p class="subtitle">输入多个设备尺寸，按真实比例绘制对比，直观感受大小差异</p>

    <div class="controls">
      <div class="device-form">
        <input v-model="newDevice.name" placeholder="设备名称（如 MacBook Pro）" class="input name-input" />
        <input v-model.number="newDevice.widthInch" type="number" placeholder="宽度（英寸）" class="input" min="0.1" step="0.1" />
        <input v-model.number="newDevice.heightInch" type="number" placeholder="高度（英寸）" class="input" min="0.1" step="0.1" />
        <div class="unit-toggle">
          <button :class="{ active: unit === 'inch' }" @click="unit = 'inch'">英寸</button>
          <button :class="{ active: unit === 'cm' }" @click="unit = 'cm'">厘米</button>
        </div>
        <button class="btn-add" @click="addDevice">+ 添加</button>
      </div>

      <div class="presets">
        <span class="presets-label">快速添加：</span>
        <button v-for="p in presets" :key="p.name" class="btn-preset" @click="addPreset(p)">{{ p.name }}</button>
      </div>
    </div>

    <div class="canvas-area">
      <canvas ref="canvasEl"></canvas>
      <p v-if="devices.length === 0" class="empty-tip">添加设备后，对比图将在这里显示</p>
    </div>

    <div class="device-list" v-if="devices.length > 0">
      <h3>已添加设备 ({{ devices.length }})</h3>
      <div class="device-items">
        <div v-for="(d, i) in devices" :key="i" class="device-item" :style="{ borderColor: colors[i % colors.length] }">
          <span class="color-dot" :style="{ background: colors[i % colors.length] }"></span>
          <span class="device-info">{{ d.name }} — {{ formatSize(d) }}</span>
          <button class="btn-remove" @click="removeDevice(i)">✕</button>
        </div>
      </div>
    </div>

    <div class="actions" v-if="devices.length > 0">
      <button class="btn-clear" @click="devices = []">清空全部</button>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '屏幕尺寸对比 - 野火小站' })

const unit = ref('inch')
const canvasEl = ref(null)

const colors = ['#22c55e', '#3498db', '#2ecc71', '#9b59b6', '#e74c3c', '#f39c12', '#1abc9c', '#e67e22']

const devices = ref([])

const newDevice = reactive({
  name: '',
  widthInch: 0,
  heightInch: 0,
})

const presets = [
  { name: 'iPhone 15 Pro', w: 2.81, h: 6.13 },
  { name: 'iPhone 16 Pro Max', w: 2.99, h: 6.33 },
  { name: 'iPad Air', w: 8.56, h: 11.30 },
  { name: 'MacBook Air 13"', w: 11.51, h: 7.91 },
  { name: 'MacBook Pro 14"', w: 12.28, h: 8.74 },
  { name: 'MacBook Pro 16"', w: 14.01, h: 9.77 },
  { name: 'Dell 27"', w: 23.94, h: 13.46 },
  { name: 'LG 32"', w: 27.90, h: 15.70 },
  { name: '小米电视 55"', w: 48.35, h: 27.20 },
  { name: '索尼电视 65"', w: 56.65, h: 31.86 },
]

const INCH_TO_CM = 2.54

function toInch(val) {
  return unit.value === 'cm' ? val / INCH_TO_CM : val
}

function addDevice() {
  const name = newDevice.name.trim()
  let w = toInch(newDevice.widthInch)
  let h = toInch(newDevice.heightInch)
  if (!name || w <= 0 || h <= 0) return
  devices.value.push({ name, widthInch: w, heightInch: h })
  newDevice.name = ''
  newDevice.widthInch = 0
  newDevice.heightInch = 0
  drawCanvas()
}

function addPreset(p) {
  if (devices.value.find(d => d.name === p.name)) return
  devices.value.push({ name: p.name, widthInch: p.w, heightInch: p.h })
  drawCanvas()
}

function removeDevice(i) {
  devices.value.splice(i, 1)
  drawCanvas()
}

function formatSize(d) {
  if (unit.value === 'inch') {
    return `${d.widthInch.toFixed(1)} × ${d.heightInch.toFixed(1)} 英寸`
  }
  return `${(d.widthInch * INCH_TO_CM).toFixed(1)} × ${(d.heightInch * INCH_TO_CM).toFixed(1)} cm`
}

function diagonal(d) {
  return Math.sqrt(d.widthInch ** 2 + d.heightInch ** 2)
}

function drawCanvas() {
  const canvas = canvasEl.value
  if (!canvas || devices.value.length === 0) return

  const dpr = window.devicePixelRatio || 1
  const containerWidth = canvas.parentElement.clientWidth - 40
  const padding = 60

  // Find max dimensions to determine scale
  let maxW = 0, maxH = 0
  for (const d of devices.value) {
    maxW = Math.max(maxW, d.widthInch)
    maxH = Math.max(maxH, d.heightInch)
  }

  const scaleX = (containerWidth - padding * 2) / maxW
  const scaleY = 500 / maxH
  const scale = Math.min(scaleX, scaleY, 30)

  const totalHeight = padding * 2 + maxH * scale + 60
  canvas.width = containerWidth * dpr
  canvas.height = totalHeight * dpr
  canvas.style.width = containerWidth + 'px'
  canvas.style.height = totalHeight + 'px'

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, containerWidth, totalHeight)

  // Align devices at bottom-center
  const centerX = containerWidth / 2
  const bottomY = padding + maxH * scale

  for (let i = 0; i < devices.value.length; i++) {
    const d = devices.value[i]
    const w = d.widthInch * scale
    const h = d.heightInch * scale
    const x = centerX - w / 2
    const y = bottomY - h
    const color = colors[i % colors.length]

    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.1)'
    ctx.shadowBlur = 8
    ctx.shadowOffsetY = 4

    // Device rectangle
    ctx.fillStyle = color + '20'
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, 4)
    ctx.fill()
    ctx.stroke()

    ctx.shadowColor = 'transparent'

    // Label above
    ctx.fillStyle = '#333'
    ctx.font = 'bold 13px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(d.name, centerX, y - 24)

    // Dimensions
    ctx.fillStyle = '#888'
    ctx.font = '11px system-ui, sans-serif'
    ctx.fillText(formatSize(d), centerX, y - 8)

    // Diagonal line with label
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = color + '80'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + w, y + h)
    ctx.stroke()
    ctx.setLineDash([])

    // Diagonal label
    const diag = diagonal(d)
    const diagText = unit.value === 'inch'
      ? `${diag.toFixed(1)}"`
      : `${(diag * INCH_TO_CM).toFixed(1)} cm`
    const midX = x + w / 2 + 8
    const midY = y + h / 2 - 6
    ctx.fillStyle = color
    ctx.font = 'bold 11px system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(diagText, midX, midY)
  }

  // Scale bar
  const barInch = maxW > 20 ? 10 : maxW > 10 ? 5 : 2
  const barPx = barInch * scale
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
  const barLabel = unit.value === 'inch' ? `${barInch} 英寸` : `${(barInch * INCH_TO_CM).toFixed(0)} cm`
  ctx.fillText(barLabel, barX + barPx / 2, barY + 16)
}

watch(unit, () => drawCanvas())

onMounted(() => {
  window.addEventListener('resize', drawCanvas)
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

.controls {
  margin-bottom: 1.5rem;
}

.device-form {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: flex-end;
}

.name-input {
  flex: 2;
  min-width: 180px;
}

.input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  min-width: 100px;
}

.input:focus {
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
  padding: 0.5rem 0.75rem;
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

.btn-add {
  padding: 0.5rem 1.2rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
}

.btn-add:hover {
  opacity: 0.85;
}

.presets {
  margin-top: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}

.presets-label {
  font-size: 0.85rem;
  color: #888;
}

.btn-preset {
  padding: 0.25rem 0.6rem;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  background: white;
  font-size: 0.8rem;
  cursor: pointer;
  color: #555;
  transition: all 0.15s;
}

.btn-preset:hover {
  border-color: #10b981;
  color: #22c55e;
}

.canvas-area {
  background: #fafafa;
  border-radius: 12px;
  border: 1px solid #eee;
  padding: 20px;
  margin-bottom: 1.5rem;
  min-height: 300px;
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

.device-list {
  margin-bottom: 1rem;
}

.device-list h3 {
  font-size: 1rem;
  color: #555;
  margin-bottom: 0.75rem;
}

.device-items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.device-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.8rem;
  background: white;
  border: 1px solid #eee;
  border-radius: 8px;
  font-size: 0.85rem;
}

.color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.device-info {
  color: #555;
}

.btn-remove {
  background: none;
  border: none;
  color: #ccc;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0 0.2rem;
}

.btn-remove:hover {
  color: #e74c3c;
}

.actions {
  margin-bottom: 1.5rem;
}

.btn-clear {
  padding: 0.4rem 1rem;
  background: none;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #888;
  cursor: pointer;
}

.btn-clear:hover {
  border-color: #e74c3c;
  color: #e74c3c;
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
  .device-form {
    flex-direction: column;
  }
  .name-input {
    min-width: 100%;
  }
}
</style>
