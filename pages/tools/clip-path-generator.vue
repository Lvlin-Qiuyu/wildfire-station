<template>
  <div class="tool-page">
    <h2>✂️ CSS clip-path 裁剪路径生成器</h2>
    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>

    <p class="subtitle">可视化创建 CSS clip-path 形状，拖拽控制点调整多边形，支持预设形状，实时预览裁剪效果。</p>

    <!-- 类型选择 -->
    <div class="mode-tabs">
      <button :class="['mode-btn', { active: shapeType === 'polygon' }]" @click="setShape('polygon')">多边形</button>
      <button :class="['mode-btn', { active: shapeType === 'circle' }]" @click="setShape('circle')">圆形</button>
      <button :class="['mode-btn', { active: shapeType === 'ellipse' }]" @click="setShape('ellipse')">椭圆</button>
      <button :class="['mode-btn', { active: shapeType === 'inset' }]" @click="setShape('inset')">内嵌</button>
    </div>

    <div class="workspace">
      <!-- 编辑区 -->
      <div class="editor-panel">
        <!-- 预设形状 -->
        <div class="presets">
          <span class="presets-label">预设：</span>
          <button v-for="p in presets" :key="p.name" class="preset-btn" @click="applyPreset(p)">
            {{ p.name }}
          </button>
        </div>

        <!-- SVG 编辑画布 -->
        <div class="canvas-box" ref="canvasBox">
          <svg ref="editorSvg" viewBox="0 0 200 200" class="editor-svg"
            @mousedown="onDragStart" @mousemove="onDragMove" @mouseup="onDragEnd"
            @mouseleave="onDragEnd"
            @touchstart.prevent="onTouchStart" @touchmove.prevent="onTouchMove" @touchend.prevent="onDragEnd">
            <!-- 网格 -->
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" stroke-width="0.3"/>
              </pattern>
            </defs>
            <rect width="200" height="200" fill="url(#grid)" />
            <!-- 裁剪预览 -->
            <clipPath id="preview-clip">
              <polygon v-if="shapeType === 'polygon'" :points="polygonPoints" />
              <circle v-else-if="shapeType === 'circle'" :cx="circleParams.cx" :cy="circleParams.cy" :r="circleParams.r" />
              <ellipse v-else-if="shapeType === 'ellipse'" :cx="ellipseParams.cx" :cy="ellipseParams.cy" :rx="ellipseParams.rx" :ry="ellipseParams.ry" />
              <rect v-else-if="shapeType === 'inset'" :x="insetParams.left" :y="insetParams.top" :width="200 - insetParams.left - insetParams.right" :height="200 - insetParams.top - insetParams.bottom" />
            </clipPath>
            <rect width="200" height="200" fill="#3b82f6" clip-path="url(#preview-clip)" />
            <rect width="200" height="200" fill="none" stroke="#1f2937" stroke-width="0.5" />

            <!-- 控制点（仅多边形） -->
            <template v-if="shapeType === 'polygon'">
              <g v-for="(pt, i) in controlPoints" :key="i">
                <line :x1="pt.x" :y1="pt.y" :x2="polygonPoints[i * 2 + 2] || pt.x" :y2="polygonPoints[i * 2 + 3] || pt.y" stroke="#ef4444" stroke-width="0.3" stroke-dasharray="2,2" opacity="0.5" />
                <circle :cx="pt.x" :cy="pt.y" r="4" fill="#ef4444" stroke="white" stroke-width="1.5" style="cursor:grab" />
              </g>
            </template>

            <!-- 圆形控制点 -->
            <template v-if="shapeType === 'circle'">
              <circle :cx="circleParams.cx" :cy="circleParams.cy" r="4" fill="#ef4444" stroke="white" stroke-width="1.5" style="cursor:grab" @mousedown.stop="startCircleDrag($event, 'center')" />
              <circle :cx="circleParams.cx + circleParams.r" :cy="circleParams.cy" r="4" fill="#f59e0b" stroke="white" stroke-width="1.5" style="cursor:grab" @mousedown.stop="startCircleDrag($event, 'radius')" />
            </template>

            <!-- 椭圆控制点 -->
            <template v-if="shapeType === 'ellipse'">
              <circle :cx="ellipseParams.cx" :cy="ellipseParams.cy" r="4" fill="#ef4444" stroke="white" stroke-width="1.5" style="cursor:grab" @mousedown.stop="startEllipseDrag($event, 'center')" />
              <circle :cx="ellipseParams.cx + ellipseParams.rx" :cy="ellipseParams.cy" r="4" fill="#f59e0b" stroke="white" stroke-width="1.5" style="cursor:grab" @mousedown.stop="startEllipseDrag($event, 'rx')" />
              <circle :cx="ellipseParams.cx" :cy="ellipseParams.cy - ellipseParams.ry" r="4" fill="#8b5cf6" stroke="white" stroke-width="1.5" style="cursor:grab" @mousedown.stop="startEllipseDrag($event, 'ry')" />
            </template>
          </svg>
        </div>
      </div>

      <!-- 参数面板 -->
      <div class="params-panel">
        <!-- 多边形坐标 -->
        <div v-if="shapeType === 'polygon'" class="param-section">
          <div class="param-header">
            <label>控制点</label>
            <button class="btn-sm" @click="addPoint">+ 添加</button>
          </div>
          <div v-for="(pt, i) in controlPoints" :key="i" class="point-row">
            <span class="pt-label">P{{ i + 1 }}</span>
            <input type="number" v-model.number="pt.x" min="0" max="100" step="1" class="pt-input" @input="updateFromInputs" />
            <input type="number" v-model.number="pt.y" min="0" max="100" step="1" class="pt-input" @input="updateFromInputs" />
            <button class="btn-remove" @click="removePoint(i)" :disabled="controlPoints.length <= 3">×</button>
          </div>
        </div>

        <!-- 圆形参数 -->
        <div v-if="shapeType === 'circle'" class="param-section">
          <label>圆心 X (%)</label>
          <input type="range" v-model.number="circleParams.cx" min="0" max="200" step="1" />
          <label>圆心 Y (%)</label>
          <input type="range" v-model.number="circleParams.cy" min="0" max="200" step="1" />
          <label>半径 (%)</label>
          <input type="range" v-model.number="circleParams.r" min="1" max="100" step="1" />
        </div>

        <!-- 椭圆参数 -->
        <div v-if="shapeType === 'ellipse'" class="param-section">
          <label>圆心 X (%)</label>
          <input type="range" v-model.number="ellipseParams.cx" min="0" max="200" step="1" />
          <label>圆心 Y (%)</label>
          <input type="range" v-model.number="ellipseParams.cy" min="0" max="200" step="1" />
          <label>水平半径 (%)</label>
          <input type="range" v-model.number="ellipseParams.rx" min="1" max="100" step="1" />
          <label>垂直半径 (%)</label>
          <input type="range" v-model.number="ellipseParams.ry" min="1" max="100" step="1" />
        </div>

        <!-- inset参数 -->
        <div v-if="shapeType === 'inset'" class="param-section">
          <label>上 ({{ insetParams.top }}%)</label>
          <input type="range" v-model.number="insetParams.top" min="0" max="49" step="1" />
          <label>右 ({{ insetParams.right }}%)</label>
          <input type="range" v-model.number="insetParams.right" min="0" max="49" step="1" />
          <label>下 ({{ insetParams.bottom }}%)</label>
          <input type="range" v-model.number="insetParams.bottom" min="0" max="49" step="1" />
          <label>左 ({{ insetParams.left }}%)</label>
          <input type="range" v-model.number="insetParams.left" min="0" max="49" step="1" />
        </div>

        <!-- CSS代码输出 -->
        <div class="code-section">
          <div class="code-header">
            <label>CSS 代码</label>
            <button class="btn-copy" @click="copyCode">📋 复制</button>
          </div>
          <pre class="code-output"><code>clip-path: {{ cssCode }};</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'

useHead({ title: 'CSS clip-path 裁剪路径生成器 - 野火小站' })

const shapeType = ref('polygon')
const editorSvg = ref(null)

// 多边形控制点（百分比坐标 0-100）
const controlPoints = ref([
  { x: 50, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
])

// 圆形参数
const circleParams = reactive({ cx: 50, cy: 50, r: 50 })

// 椭圆参数
const ellipseParams = reactive({ cx: 50, cy: 50, rx: 50, ry: 50 })

// inset参数
const insetParams = reactive({ top: 0, right: 0, bottom: 0, left: 0 })

// 预设形状
const presets = [
  { name: '三角形', points: [{ x: 50, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }] },
  { name: '菱形', points: [{ x: 50, y: 0 }, { x: 100, y: 50 }, { x: 50, y: 100 }, { x: 0, y: 50 }] },
  { name: '五边形', points: pentagonPoints(5) },
  { name: '六边形', points: pentagonPoints(6) },
  { name: '星形', points: starPoints() },
  { name: '箭头', points: [{ x: 40, y: 0 }, { x: 100, y: 50 }, { x: 40, y: 100 }, { x: 40, y: 65 }, { x: 0, y: 65 }, { x: 0, y: 35 }, { x: 40, y: 35 }] },
  { name: '十字', points: [{ x: 33, y: 0 }, { x: 67, y: 0 }, { x: 67, y: 33 }, { x: 100, y: 33 }, { x: 100, y: 67 }, { x: 67, y: 67 }, { x: 67, y: 100 }, { x: 33, y: 100 }, { x: 33, y: 67 }, { x: 0, y: 67 }, { x: 0, y: 33 }, { x: 33, y: 33 }] },
  { name: '心形', points: [{ x: 50, y: 100 }, { x: 0, y: 35 }, { x: 15, y: 15 }, { x: 35, y: 0 }, { x: 50, y: 20 }, { x: 65, y: 0 }, { x: 85, y: 15 }, { x: 100, y: 35 }] },
]

function pentagonPoints(n) {
  const pts = []
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI / n) * i - Math.PI / 2
    pts.push({
      x: Math.round(50 + 50 * Math.cos(angle)),
      y: Math.round(50 + 50 * Math.sin(angle)),
    })
  }
  return pts
}

function starPoints() {
  const pts = []
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2
    const r = i % 2 === 0 ? 50 : 20
    pts.push({
      x: Math.round(50 + r * Math.cos(angle)),
      y: Math.round(50 + r * Math.sin(angle)),
    })
  }
  return pts
}

// SVG viewBox坐标（0-200）用于渲染，百分比（0-100）用于CSS输出
const polygonPoints = computed(() => {
  return controlPoints.value.map(p => `${p.x * 2} ${p.y * 2}`).join(' ')
})

// CSS代码
const cssCode = computed(() => {
  if (shapeType.value === 'polygon') {
    const pts = controlPoints.value.map(p => `${p.x}% ${p.y}%`).join(', ')
    return `polygon(${pts})`
  } else if (shapeType.value === 'circle') {
    return `circle(${circleParams.r}% at ${circleParams.cx}% ${circleParams.cy}%)`
  } else if (shapeType.value === 'ellipse') {
    return `ellipse(${ellipseParams.rx}% ${ellipseParams.ry}% at ${ellipseParams.cx}% ${ellipseParams.ry === undefined ? ellipseParams.cy : ellipseParams.cy}%)`
  } else if (shapeType.value === 'inset') {
    return `inset(${insetParams.top}% ${insetParams.right}% ${insetParams.bottom}% ${insetParams.left}%)`
  }
  return ''
})

const setShape = (type) => {
  shapeType.value = type
}

const applyPreset = (preset) => {
  shapeType.value = 'polygon'
  controlPoints.value = preset.points.map(p => ({ ...p }))
}

const addPoint = () => {
  const last = controlPoints.value[controlPoints.value.length - 1]
  const prev = controlPoints.value[controlPoints.value.length - 2] || { x: 50, y: 50 }
  controlPoints.value.push({
    x: Math.round((last.x + prev.x) / 2),
    y: Math.round((last.y + prev.y) / 2),
  })
}

const removePoint = (i) => {
  if (controlPoints.value.length > 3) {
    controlPoints.value.splice(i, 1)
  }
}

const updateFromInputs = () => {
  // computed 自动响应
}

// 拖拽逻辑（多边形）
const dragging = ref(-1)
let svgRect = null

const getSvgPoint = (e) => {
  if (!editorSvg.value) return null
  svgRect = editorSvg.value.getBoundingClientRect()
  const x = ((e.clientX - svgRect.left) / svgRect.width) * 200
  const y = ((e.clientY - svgRect.top) / svgRect.height) * 200
  return { x: Math.max(0, Math.min(200, x)), y: Math.max(0, Math.min(200, y)) }
}

const findNearestPoint = (pt, threshold = 10) => {
  const svg = editorSvg.value
  if (!svg) return -1
  const scaleX = svg.getBoundingClientRect().width / 200
  let minDist = threshold / scaleX
  let minIdx = -1
  controlPoints.value.forEach((cp, i) => {
    const dx = (cp.x * 2) - pt.x
    const dy = (cp.y * 2) - pt.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < minDist) {
      minDist = dist
      minIdx = i
    }
  })
  return minIdx
}

const onDragStart = (e) => {
  if (shapeType.value !== 'polygon') return
  const pt = getSvgPoint(e)
  const idx = findNearestPoint(pt)
  if (idx >= 0) {
    dragging.value = idx
    e.preventDefault()
  }
}

const onDragMove = (e) => {
  if (dragging.value < 0) return
  const pt = getSvgPoint(e)
  controlPoints.value[dragging.value].x = Math.round(Math.max(0, Math.min(100, pt.x / 2)))
  controlPoints.value[dragging.value].y = Math.round(Math.max(0, Math.min(100, pt.y / 2)))
}

const onDragEnd = () => {
  dragging.value = -1
}

const onTouchStart = (e) => {
  const touch = e.touches[0]
  onDragStart({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => {} })
}

const onTouchMove = (e) => {
  const touch = e.touches[0]
  onDragMove({ clientX: touch.clientX, clientY: touch.clientY })
}

// 圆形拖拽
const circleDragging = ref(null)
const startCircleDrag = (e, type) => {
  circleDragging.value = type
  const handler = (ev) => {
    const pt = getSvgPoint(ev)
    if (circleDragging.value === 'center') {
      circleParams.cx = Math.round(Math.max(0, Math.min(100, pt.x / 2)))
      circleParams.cy = Math.round(Math.max(0, Math.min(100, pt.y / 2)))
    } else if (circleDragging.value === 'radius') {
      const dx = pt.x / 2 - circleParams.cx
      const dy = pt.y / 2 - circleParams.cy
      circleParams.r = Math.round(Math.max(1, Math.min(100, Math.sqrt(dx * dx + dy * dy))))
    }
  }
  const up = () => {
    circleDragging.value = null
    window.removeEventListener('mousemove', handler)
    window.removeEventListener('mouseup', up)
  }
  window.addEventListener('mousemove', handler)
  window.addEventListener('mouseup', up)
}

// 椭圆拖拽
const ellipseDragging = ref(null)
const startEllipseDrag = (e, type) => {
  ellipseDragging.value = type
  const handler = (ev) => {
    const pt = getSvgPoint(ev)
    if (ellipseDragging.value === 'center') {
      ellipseParams.cx = Math.round(Math.max(0, Math.min(100, pt.x / 2)))
      ellipseParams.cy = Math.round(Math.max(0, Math.min(100, pt.y / 2)))
    } else if (ellipseDragging.value === 'rx') {
      ellipseParams.rx = Math.round(Math.max(1, Math.min(100, Math.abs(pt.x / 2 - ellipseParams.cx))))
    } else if (ellipseDragging.value === 'ry') {
      ellipseParams.ry = Math.round(Math.max(1, Math.min(100, Math.abs(pt.y / 2 - ellipseParams.cy))))
    }
  }
  const up = () => {
    ellipseDragging.value = null
    window.removeEventListener('mousemove', handler)
    window.removeEventListener('mouseup', up)
  }
  window.addEventListener('mousemove', handler)
  window.addEventListener('mouseup', up)
}

const copyCode = () => {
  const text = `clip-path: ${cssCode.value};`
  navigator.clipboard.writeText(text).then(() => {
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
  max-width: 900px;
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
.mode-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}
.mode-btn {
  flex: 1;
  padding: 0.6rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.mode-btn.active {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #2563eb;
  font-weight: 600;
}
.workspace {
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;
}
.editor-panel {
  flex: 1;
  min-width: 0;
}
.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 0.75rem;
}
.presets-label {
  font-size: 0.8rem;
  color: #6b7280;
  align-self: center;
  margin-right: 0.25rem;
}
.preset-btn {
  padding: 0.25rem 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
}
.preset-btn:hover {
  background: #eff6ff;
  border-color: #3b82f6;
}
.canvas-box {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
  aspect-ratio: 1;
}
.editor-svg {
  width: 100%;
  height: 100%;
  display: block;
  touch-action: none;
}

.params-panel {
  width: 280px;
  flex-shrink: 0;
}
.param-section {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
}
.param-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}
.param-header label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #374151;
}
.btn-sm {
  padding: 0.2rem 0.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.75rem;
}
.btn-sm:hover { background: #2563eb; }
.param-section label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.2rem;
}
.param-section input[type="range"] {
  width: 100%;
  margin-bottom: 0.5rem;
  height: 6px;
}
.point-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.35rem;
}
.pt-label {
  font-size: 0.7rem;
  color: #6b7280;
  min-width: 22px;
}
.pt-input {
  width: 55px;
  padding: 0.2rem 0.3rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  text-align: center;
}
.btn-remove {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 1rem;
  cursor: pointer;
  padding: 0;
}
.btn-remove:disabled { opacity: 0.3; cursor: not-allowed; }

.code-section {
  background: #1f2937;
  border-radius: 0.75rem;
  overflow: hidden;
}
.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #374151;
}
.code-header label {
  font-size: 0.8rem;
  color: #9ca3af;
}
.btn-copy {
  padding: 0.2rem 0.6rem;
  background: #374151;
  color: #f9fafb;
  border: 1px solid #4b5563;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.75rem;
}
.btn-copy:hover { background: #4b5563; }
.code-output {
  padding: 0.75rem;
  margin: 0;
  color: #d1d5db;
  font-size: 0.8rem;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

@media (max-width: 700px) {
  .workspace {
    flex-direction: column;
  }
  .params-panel {
    width: 100%;
  }
  .canvas-box {
    max-width: 400px;
    margin: 0 auto;
  }
}
</style>
