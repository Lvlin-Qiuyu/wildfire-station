<template>
  <div class="tool-page">
    <h2>🧠 知识图谱绘制器</h2>
    <p class="subtitle">可视化创建节点和连线关系，支持拖拽、导出JSON和PNG</p>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <button :class="['tool-btn', { active: mode === 'add' }]" @click="mode = 'add'">➕ 添加节点</button>
        <button :class="['tool-btn', { active: mode === 'connect' }]" @click="mode = 'connect'">🔗 连线</button>
        <button :class="['tool-btn', { active: mode === 'move' }]" @click="mode = 'move'">✋ 移动</button>
        <button :class="['tool-btn', { active: mode === 'delete' }]" @click="mode = 'delete'">🗑️ 删除</button>
      </div>
      <div class="toolbar-right">
        <button class="btn-sm" @click="clearAll">清空</button>
        <button class="btn-sm" @click="autoLayout">📐 自动布局</button>
        <button class="btn-sm" @click="exportJSON">📥 导出JSON</button>
        <button class="btn-primary btn-sm" @click="exportPNG">🖼️ 导出PNG</button>
      </div>
    </div>

    <!-- 画布区域 -->
    <div class="canvas-container" ref="canvasContainer">
      <canvas
        ref="graphCanvas"
        class="graph-canvas"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseUp"
        @touchstart.prevent="onTouchStart"
        @touchmove.prevent="onTouchMove"
        @touchend.prevent="onTouchEnd"
      ></canvas>

      <!-- 添加节点弹窗 -->
      <div v-if="showNodeInput" class="node-input-popup" :style="{ left: nodeInputPos.x + 'px', top: nodeInputPos.y + 'px' }">
        <input
          v-model="newNodeLabel"
          class="node-input"
          placeholder="节点名称"
          @keyup.enter="confirmAddNode"
          @keyup.escape="cancelAddNode"
          ref="nodeInputRef"
        />
        <div class="node-color-row">
          <span
            v-for="c in nodeColors"
            :key="c"
            :class="['color-dot', { selected: newNodeColor === c }]"
            :style="{ backgroundColor: c }"
            @click="newNodeColor = c"
          ></span>
        </div>
        <div class="node-size-row">
          <label>大小：</label>
          <input type="range" v-model.number="newNodeSize" min="30" max="80" class="size-slider" />
        </div>
        <div class="popup-btns">
          <button class="btn-xs" @click="cancelAddNode">取消</button>
          <button class="btn-primary btn-xs" @click="confirmAddNode">确定</button>
        </div>
      </div>
    </div>

    <!-- 节点统计 -->
    <div class="stats-bar">
      <span>📌 节点：{{ nodes.length }}</span>
      <span>🔗 连线：{{ edges.length }}</span>
      <span class="mode-label">当前模式：{{ modeLabel }}</span>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '知识图谱绘制器 - 野火小站' })

// 画布引用
const graphCanvas = ref(null)
const canvasContainer = ref(null)
const nodeInputRef = ref(null)

// 交互状态
const mode = ref('add') // add | connect | move | delete
const nodes = ref([])
const edges = ref([])

// 添加节点相关
const showNodeInput = ref(false)
const newNodeLabel = ref('')
const newNodeColor = ref('#22c55e')
const newNodeSize = ref(50)
const nodeInputPos = ref({ x: 100, y: 100 })

// 连线临时状态
const connectFrom = ref(null) // 正在连线的起始节点id

// 拖拽状态
const dragging = ref(null)
const dragOffset = ref({ x: 0, y: 0 })
const mousePos = ref({ x: 0, y: 0 })

// 节点可选颜色
const nodeColors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']

const modeLabel = computed(() => {
  const map = { add: '添加节点', connect: '连线', move: '移动', delete: '删除' }
  return map[mode.value] || ''
})

// 画布尺寸
let canvasW = 800
let canvasH = 500

function initCanvas() {
  if (!graphCanvas.value || !canvasContainer.value) return
  const container = canvasContainer.value
  const dpr = window.devicePixelRatio || 1
  canvasW = container.clientWidth
  canvasH = Math.max(400, Math.min(600, window.innerHeight * 0.55))
  graphCanvas.value.width = canvasW * dpr
  graphCanvas.value.height = canvasH * dpr
  graphCanvas.value.style.width = canvasW + 'px'
  graphCanvas.value.style.height = canvasH + 'px'
  const ctx = graphCanvas.value.getContext('2d')
  ctx.scale(dpr, dpr)
  drawGraph()
}

// 绘制图谱
function drawGraph() {
  if (!graphCanvas.value) return
  const ctx = graphCanvas.value.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, canvasW, canvasH)

  // 背景网格
  ctx.strokeStyle = '#f0f0f0'
  ctx.lineWidth = 1
  for (let x = 0; x < canvasW; x += 40) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, canvasH)
    ctx.stroke()
  }
  for (let y = 0; y < canvasH; y += 40) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(canvasW, y)
    ctx.stroke()
  }

  // 绘制连线
  edges.value.forEach(edge => {
    const fromNode = nodes.value.find(n => n.id === edge.from)
    const toNode = nodes.value.find(n => n.id === edge.to)
    if (!fromNode || !toNode) return

    ctx.beginPath()
    ctx.moveTo(fromNode.x, fromNode.y)
    ctx.lineTo(toNode.x, toNode.y)
    ctx.strokeStyle = edge.color || '#999'
    ctx.lineWidth = 2
    ctx.stroke()

    // 箭头
    const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x)
    const toR = toNode.size / 2 + 5
    const arrowX = toNode.x - Math.cos(angle) * toR
    const arrowY = toNode.y - Math.sin(angle) * toR
    ctx.beginPath()
    ctx.moveTo(arrowX, arrowY)
    ctx.lineTo(arrowX - 10 * Math.cos(angle - 0.4), arrowY - 10 * Math.sin(angle - 0.4))
    ctx.lineTo(arrowX - 10 * Math.cos(angle + 0.4), arrowY - 10 * Math.sin(angle + 0.4))
    ctx.closePath()
    ctx.fillStyle = edge.color || '#999'
    ctx.fill()

    // 连线标签
    if (edge.label) {
      const midX = (fromNode.x + toNode.x) / 2
      const midY = (fromNode.y + toNode.y) / 2
      ctx.font = '11px sans-serif'
      ctx.fillStyle = '#666'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.fillText(edge.label, midX, midY - 4)
    }
  })

  // 正在拖拽连线（临时线）
  if (mode.value === 'connect' && connectFrom.value) {
    const fromNode = nodes.value.find(n => n.id === connectFrom.value)
    if (fromNode) {
      ctx.beginPath()
      ctx.moveTo(fromNode.x, fromNode.y)
      ctx.lineTo(mousePos.value.x, mousePos.value.y)
      ctx.strokeStyle = '#22c55e'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.stroke()
      ctx.setLineDash([])
    }
  }

  // 绘制节点
  nodes.value.forEach(node => {
    const r = node.size / 2

    // 节点圆
    ctx.beginPath()
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
    ctx.fillStyle = node.color
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 3
    ctx.stroke()

    // 高亮选中/连接中
    if (connectFrom.value === node.id) {
      ctx.beginPath()
      ctx.arc(node.x, node.y, r + 5, 0, Math.PI * 2)
      ctx.strokeStyle = '#22c55e'
      ctx.lineWidth = 2
      ctx.setLineDash([4, 4])
      ctx.stroke()
      ctx.setLineDash([])
    }

    // 节点文字
    ctx.font = `bold ${Math.max(11, Math.round(node.size / 4.5))}px sans-serif`
    ctx.fillStyle = getTextColor(node.color)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const maxTextW = node.size * 0.8
    let label = node.label
    if (ctx.measureText(label).width > maxTextW) {
      while (label.length > 1 && ctx.measureText(label + '…').width > maxTextW) {
        label = label.slice(0, -1)
      }
      label += '…'
    }
    ctx.fillText(label, node.x, node.y)
  })
}

function getTextColor(bgColor) {
  const hex = bgColor.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#1a1a2e' : '#ffffff'
}

// 命中检测：找到鼠标位置下的节点
function hitNode(x, y) {
  for (let i = nodes.value.length - 1; i >= 0; i--) {
    const node = nodes.value[i]
    const dx = x - node.x
    const dy = y - node.y
    if (dx * dx + dy * dy <= (node.size / 2) * (node.size / 2)) return node
  }
  return null
}

function getCanvasPos(e) {
  const rect = graphCanvas.value.getBoundingClientRect()
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
}

// 鼠标事件
function onMouseDown(e) {
  const pos = getCanvasPos(e)
  const node = hitNode(pos.x, pos.y)

  if (mode.value === 'add') {
    if (!node) {
      nodeInputPos.value = { x: pos.x + 10, y: pos.y + 10 }
      newNodeLabel.value = ''
      showNodeInput.value = true
      nextTick(() => nodeInputRef.value?.focus())
    }
  } else if (mode.value === 'connect') {
    if (node) {
      if (!connectFrom.value) {
        connectFrom.value = node.id
        drawGraph()
      } else if (connectFrom.value !== node.id) {
        // 创建连线
        const exists = edges.value.some(e =>
          (e.from === connectFrom.value && e.to === node.id) ||
          (e.from === node.id && e.to === connectFrom.value)
        )
        if (!exists) {
          edges.value.push({
            from: connectFrom.value,
            to: node.id,
            label: '',
            color: '#999'
          })
        }
        connectFrom.value = null
        drawGraph()
      }
    }
  } else if (mode.value === 'move') {
    if (node) {
      dragging.value = node
      dragOffset.value = { x: pos.x - node.x, y: pos.y - node.y }
    }
  } else if (mode.value === 'delete') {
    if (node) {
      nodes.value = nodes.value.filter(n => n.id !== node.id)
      edges.value = edges.value.filter(e => e.from !== node.id && e.to !== node.id)
      drawGraph()
    } else {
      // 检查是否点击了连线
      const edgeIdx = hitEdge(pos.x, pos.y)
      if (edgeIdx >= 0) {
        edges.value.splice(edgeIdx, 1)
        drawGraph()
      }
    }
  }
}

function onMouseMove(e) {
  const pos = getCanvasPos(e)
  mousePos.value = pos

  if (mode.value === 'move' && dragging.value) {
    dragging.value.x = pos.x - dragOffset.value.x
    dragging.value.y = pos.y - dragOffset.value.y
  }
  drawGraph()
}

function onMouseUp() {
  dragging.value = null
}

// 触摸事件转换
function onTouchStart(e) {
  if (e.touches.length === 1) {
    const touch = e.touches[0]
    onMouseDown({ clientX: touch.clientX, clientY: touch.clientY })
  }
}

function onTouchMove(e) {
  if (e.touches.length === 1) {
    const touch = e.touches[0]
    onMouseMove({ clientX: touch.clientX, clientY: touch.clientY })
  }
}

function onTouchEnd() {
  onMouseUp()
}

// 连线命中检测
function hitEdge(x, y) {
  const threshold = 8
  for (let i = edges.value.length - 1; i >= 0; i--) {
    const edge = edges.value[i]
    const fromNode = nodes.value.find(n => n.id === edge.from)
    const toNode = nodes.value.find(n => n.id === edge.to)
    if (!fromNode || !toNode) continue
    const dist = pointToSegmentDist(x, y, fromNode.x, fromNode.y, toNode.x, toNode.y)
    if (dist < threshold) return i
  }
  return -1
}

function pointToSegmentDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2)
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  const projX = x1 + t * dx
  const projY = y1 + t * dy
  return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2)
}

// 添加节点
function confirmAddNode() {
  const label = newNodeLabel.value.trim()
  if (!label) return
  nodes.value.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    label,
    x: nodeInputPos.value.x,
    y: nodeInputPos.value.y,
    color: newNodeColor.value,
    size: newNodeSize.value,
  })
  showNodeInput.value = false
  drawGraph()
}

function cancelAddNode() {
  showNodeInput.value = false
}

// 自动布局（简单圆形布局）
function autoLayout() {
  if (nodes.value.length === 0) return
  const cx = canvasW / 2
  const cy = canvasH / 2
  const radius = Math.min(canvasW, canvasH) * 0.35
  nodes.value.forEach((node, i) => {
    const angle = (i / nodes.value.length) * Math.PI * 2 - Math.PI / 2
    node.x = cx + Math.cos(angle) * radius
    node.y = cy + Math.sin(angle) * radius
  })
  drawGraph()
}

function clearAll() {
  if (!confirm('确定清空所有节点和连线？')) return
  nodes.value = []
  edges.value = []
  connectFrom.value = null
  drawGraph()
}

// 导出JSON
function exportJSON() {
  const data = JSON.stringify({ nodes: nodes.value, edges: edges.value }, null, 2)
  navigator.clipboard.writeText(data).then(() => {
    alert('JSON 已复制到剪贴板')
  })
}

// 导出PNG
function exportPNG() {
  if (!graphCanvas.value) return
  const link = document.createElement('a')
  link.download = 'knowledge-graph.png'
  link.href = graphCanvas.value.toDataURL('image/png')
  link.click()
}

// 监听窗口大小变化
function handleResize() {
  initCanvas()
}

onMounted(() => {
  initCanvas()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
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
  margin-bottom: 1.2rem;
}

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.toolbar-left, .toolbar-right {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.tool-btn {
  padding: 0.45rem 0.8rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tool-btn.active {
  background: #22c55e;
  color: white;
  border-color: #22c55e;
}

.tool-btn:hover:not(.active) {
  border-color: #22c55e;
  color: #22c55e;
}

.btn-sm {
  padding: 0.45rem 0.8rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-sm:hover { border-color: #22c55e; color: #22c55e; }

.btn-primary {
  padding: 0.45rem 0.8rem;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  font-size: 0.82rem;
  cursor: pointer;
}

.btn-xs {
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  background: white;
  font-size: 0.8rem;
  cursor: pointer;
}

/* 画布 */
.canvas-container {
  position: relative;
  background: #fafafa;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 0.8rem;
}

.graph-canvas {
  display: block;
  cursor: crosshair;
}

/* 添加节点弹窗 */
.node-input-popup {
  position: absolute;
  background: white;
  border-radius: 10px;
  padding: 0.8rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  z-index: 10;
  min-width: 200px;
}

.node-input {
  width: 100%;
  padding: 0.5rem 0.7rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.9rem;
  outline: none;
  box-sizing: border-box;
  margin-bottom: 0.5rem;
}

.node-input:focus { border-color: #22c55e; }

.node-color-row {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}

.color-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.2s;
}

.color-dot.selected {
  border-color: #333;
}

.node-size-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}

.size-slider {
  flex: 1;
  accent-color: #22c55e;
}

.popup-btns {
  display: flex;
  justify-content: flex-end;
  gap: 0.4rem;
}

/* 统计栏 */
.stats-bar {
  display: flex;
  gap: 1.5rem;
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 1rem;
}

.mode-label {
  color: #22c55e;
  font-weight: 600;
}

.back-link {
  display: inline-block;
  margin-top: 1.5rem;
  color: #22c55e;
  text-decoration: none;
  font-weight: 600;
}

.back-link:hover { text-decoration: underline; }

@media (max-width: 640px) {
  .toolbar {
    flex-direction: column;
  }
  .toolbar-left, .toolbar-right {
    width: 100%;
    justify-content: flex-start;
  }
  .graph-canvas {
    cursor: pointer;
  }
}
</style>
