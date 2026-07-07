<template>
  <div class="tool-page">
    <h2>🧠 思维导图文本生成器</h2>
    <p class="subtitle">输入缩进大纲文本，自动生成树状思维导图，支持展开折叠、拖拽平移、缩放、导出PNG</p>

    <div class="editor-layout">
      <!-- 左栏：大纲输入 -->
      <div class="edit-panel">
        <div class="panel-header">
          <span class="panel-title">大纲文本</span>
          <button class="btn-sm" @click="pasteText">粘贴</button>
          <button class="btn-sm" @click="loadExample">示例</button>
          <button class="btn-sm" @click="outlineText = ''">清空</button>
        </div>
        <textarea
          v-model="outlineText"
          placeholder="输入缩进大纲文本，用 Tab 或空格缩进表示层级：&#10;&#10;项目管理&#10;  前端开发&#10;    Vue框架&#10;    React框架&#10;  后端开发&#10;    Node.js&#10;    Python"
          class="editor"
          spellcheck="false"
        ></textarea>
        <div class="editor-footer">
          <span>节点数：{{ nodeCount }}</span>
          <span>层级数：{{ depthCount }}</span>
        </div>
      </div>

      <!-- 右栏：Canvas 导图 -->
      <div class="canvas-panel">
        <div class="canvas-toolbar">
          <button class="btn-sm" @click="zoomIn">🔍+ 放大</button>
          <button class="btn-sm" @click="zoomOut">🔍- 缩小</button>
          <button class="btn-sm" @click="resetView">居中</button>
          <button class="btn-sm" @click="expandAll">展开全部</button>
          <button class="btn-sm" @click="collapseAll">折叠全部</button>
          <div class="toolbar-spacer"></div>
          <button class="btn-sm btn-primary" @click="exportPNG">🖼️ 导出PNG</button>
        </div>
        <div class="canvas-container" ref="canvasContainer">
          <canvas
            ref="mapCanvas"
            class="map-canvas"
            @mousedown="onCanvasMouseDown"
            @mousemove="onCanvasMouseMove"
            @mouseup="onCanvasMouseUp"
            @mouseleave="onCanvasMouseUp"
            @wheel.prevent="onWheel"
            @dblclick="onDblClick"
            @touchstart.prevent="onTouchStart"
            @touchmove.prevent="onTouchMove"
            @touchend.prevent="onTouchEnd"
          ></canvas>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '思维导图文本生成器 - 野火小站' })

const outlineText = ref('')
const mapCanvas = ref(null)
const canvasContainer = ref(null)

// 视图状态
let panX = 0, panY = 0, scale = 1
let isDragging = false
let dragStartX = 0, dragStartY = 0
let panStartX = 0, panStartY = 0
let canvasW = 600, canvasH = 500

// 节点颜色分配（按层级）
const levelColors = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
]

// 解析大纲文本为树结构
function parseOutline(text) {
  if (!text.trim()) return []
  const lines = text.split('\n').filter(line => line.trim().length > 0)
  if (lines.length === 0) return []

  // 检测缩进：Tab优先，否则空格
  const useTab = lines.some(l => l.startsWith('\t'))

  // 计算基础缩进
  const getIndent = (line) => {
    let count = 0
    for (const ch of line) {
      if (ch === '\t' || ch === ' ') count++
      else break
    }
    return useTab ? count : Math.floor(count / 2)
  }

  const getLabel = (line) => line.trim()

  // 构建虚拟根节点
  const root = { label: 'root', children: [], level: -1, expanded: true }
  const stack = [root]
  const minIndent = getIndent(lines[0])

  for (const line of lines) {
    const indent = getIndent(line)
    const label = getLabel(line)
    const level = Math.max(0, indent - minIndent)
    const node = {
      label,
      level,
      children: [],
      expanded: true,
      // 布局坐标（后续计算）
      x: 0, y: 0, width: 0, height: 0,
    }

    // 找到父节点：stack中最后一个level < 当前level的节点
    while (stack.length > 1 && stack[stack.length - 1].level >= level) {
      stack.pop()
    }

    stack[stack.length - 1].children.push(node)
    stack.push(node)
  }

  return root.children
}

// 树节点
const treeNodes = computed(() => parseOutline(outlineText.value))

// 节点总数
const nodeCount = computed(() => countNodes(treeNodes.value))
function countNodes(nodes) {
  let count = 0
  for (const n of nodes) {
    count++
    if (n.expanded) count += countNodes(n.children)
    else count += n.children.length // 折叠时也计算子节点数
  }
  return count
}

// 最大层级
const depthCount = computed(() => {
  function getDepth(nodes) {
    if (nodes.length === 0) return 0
    let max = 0
    for (const n of nodes) {
      const d = 1 + (n.expanded ? getDepth(n.children) : 0)
      if (d > max) max = d
    }
    return max
  }
  return getDepth(treeNodes.value)
})

// 布局算法（简化版 Reingold-Tilford，自上而下）
function layoutTree(nodes) {
  if (nodes.length === 0) return

  // 第一遍：计算节点尺寸
  const ctx = mapCanvas.value?.getContext('2d')
  const fontSize = 14
  const padding = { x: 12, y: 8 }
  const lineGap = 16 // 同级节点垂直间距

  function measureNode(node) {
    ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`
    const textW = ctx.measureText(node.label).width
    node.width = textW + padding.x * 2
    node.height = fontSize + padding.y * 2
    return node
  }

  // 测量所有节点
  function measureAll(nodes) {
    for (const n of nodes) {
      measureNode(n)
      if (n.expanded) measureAll(n.children)
    }
  }
  measureAll(nodes)

  // 第二遍：分配子树宽度
  function calcSubtreeWidth(node) {
    if (node.children.length === 0 || !node.expanded) {
      node.subtreeWidth = node.width
      return node.subtreeWidth
    }
    let totalW = 0
    for (const child of node.children) {
      totalW += calcSubtreeWidth(child)
    }
    totalW += (node.children.length - 1) * 20 // 兄弟间距
    node.subtreeWidth = Math.max(node.width, totalW)
    return node.subtreeWidth
  }

  for (const root of nodes) {
    calcSubtreeWidth(root)
  }

  // 第三遍：分配坐标
  function assignPositions(node, x, y) {
    node.x = x + node.subtreeWidth / 2 - node.width / 2
    node.y = y

    if (node.children.length === 0 || !node.expanded) return

    let childX = x
    for (const child of node.children) {
      assignPositions(child, childX, y + node.height + lineGap)
      childX += child.subtreeWidth + 20
    }
  }

  let startX = 0
  for (const root of nodes) {
    assignPositions(root, startX, 0)
    startX += root.subtreeWidth + 40
  }
}

// 计算包围盒
function getBounds(nodes) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  function traverse(list) {
    for (const n of list) {
      if (n.x < minX) minX = n.x
      if (n.y < minY) minY = n.y
      if (n.x + n.width > maxX) maxX = n.x + n.width
      if (n.y + n.height > maxY) maxY = n.y + n.height
      if (n.expanded) traverse(n.children)
    }
  }
  traverse(nodes)
  return { minX, minY, maxX, maxY }
}

// 绘制导图
function drawMap(forExport = false) {
  if (!mapCanvas.value) return
  const ctx = mapCanvas.value.getContext('2d')
  const dpr = window.devicePixelRatio || 1

  if (!forExport) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  ctx.clearRect(0, 0, canvasW, canvasH)

  const nodes = treeNodes.value
  if (nodes.length === 0) {
    // 空状态
    ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillStyle = '#ccc'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('在左侧输入大纲文本生成导图', canvasW / 2, canvasH / 2)
    return
  }

  // 布局
  layoutTree(nodes)

  const bounds = getBounds(nodes)
  const contentW = bounds.maxX - bounds.minX + 80
  const contentH = bounds.maxY - bounds.minY + 80

  if (forExport) {
    // 导出模式：固定大小，居中绘制
    const expW = Math.max(contentW, 800)
    const expH = Math.max(contentH, 600)
    mapCanvas.value.width = expW * 2
    mapCanvas.value.height = expH * 2
    ctx.setTransform(2, 0, 0, 2, 0, 0)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, expW, expH)
    panX = (expW - contentW) / 2 - bounds.minX + 40
    panY = (expH - contentH) / 2 - bounds.minY + 40
  } else {
    // 自动居中
    panX = (canvasW - contentW * scale) / 2 - bounds.minX * scale + 40 * scale
    panY = (canvasH - contentH * scale) / 2 - bounds.minY * scale + 40 * scale
  }

  ctx.save()
  if (!forExport) ctx.scale(scale, scale)
  ctx.translate(panX / (forExport ? 1 : scale), panY / (forExport ? 1 : scale))

  // 绘制连线
  function drawConnections(list) {
    for (const node of list) {
      if (!node.expanded || node.children.length === 0) continue
      for (const child of node.children) {
        const fromX = node.x + node.width / 2
        const fromY = node.y + node.height
        const toX = child.x + child.width / 2
        const toY = child.y
        const color = levelColors[(child.level || 0) % levelColors.length]

        // 贝塞尔曲线连接
        ctx.beginPath()
        ctx.moveTo(fromX, fromY)
        const midY = (fromY + toY) / 2
        ctx.bezierCurveTo(fromX, midY, toX, midY, toX, toY)
        ctx.strokeStyle = color + '60'
        ctx.lineWidth = 2
        ctx.stroke()
      }
      drawConnections(node.children)
    }
  }
  drawConnections(nodes)

  // 绘制节点
  function drawNodes(list) {
    for (const node of list) {
      const color = levelColors[(node.level || 0) % levelColors.length]

      // 节点背景圆角矩形
      const r = 8
      const x = node.x, y = node.y, w = node.width, h = node.height
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + w - r, y)
      ctx.quadraticCurveTo(x + w, y, x + w, y + r)
      ctx.lineTo(x + w, y + h - r)
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
      ctx.lineTo(x + r, y + h)
      ctx.quadraticCurveTo(x, y + h, x, y + h - r)
      ctx.lineTo(x, y + r)
      ctx.quadraticCurveTo(x, y, x + r, y)
      ctx.closePath()

      ctx.fillStyle = color + '18'
      ctx.fill()
      ctx.strokeStyle = color + '80'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // 节点文字
      const fontSize = node.level === 0 ? 16 : 14
      ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`
      ctx.fillStyle = '#2c3e50'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(node.label, x + w / 2, y + h / 2)

      // 折叠指示器
      if (node.children.length > 0) {
        const indicatorY = y + h + 4
        const indicatorX = x + w / 2
        ctx.beginPath()
        ctx.arc(indicatorX, indicatorY, 8, 0, Math.PI * 2)
        ctx.fillStyle = '#fff'
        ctx.fill()
        ctx.strokeStyle = color + '60'
        ctx.lineWidth = 1
        ctx.stroke()

        ctx.font = 'bold 12px sans-serif'
        ctx.fillStyle = '#888'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        if (node.expanded) {
          ctx.fillText('−', indicatorX, indicatorY)
        } else {
          const childCount = countDirectChildren(node)
          ctx.fillText('+' + childCount, indicatorX, indicatorY - 1)
        }
      }

      if (node.expanded) drawNodes(node.children)
    }
  }
  drawNodes(nodes)

  ctx.restore()
}

function countDirectChildren(node) {
  return node.children.length
}

// 点击检测
function hitTest(mx, my) {
  const nodes = treeNodes.value
  // 将鼠标坐标转换为画布坐标
  const cx = (mx - panX) / scale
  const cy = (my - panY) / scale

  function check(list) {
    for (const node of list) {
      if (cx >= node.x && cx <= node.x + node.width &&
          cy >= node.y && cy <= node.y + node.height) {
        return node
      }
      if (node.expanded) {
        const found = check(node.children)
        if (found) return found
      }
    }
    return null
  }
  return check(nodes)
}

// 检测折叠/展开按钮
function hitToggle(mx, my) {
  const nodes = treeNodes.value
  const cx = (mx - panX) / scale
  const cy = (my - panY) / scale

  function check(list) {
    for (const node of list) {
      if (node.children.length === 0) continue
      const toggleX = node.x + node.width / 2
      const toggleY = node.y + node.height + 4
      if (Math.abs(cx - toggleX) < 12 && Math.abs(cy - toggleY) < 12) {
        return node
      }
      if (node.expanded) {
        const found = check(node.children)
        if (found) return found
      }
    }
    return null
  }
  return check(nodes)
}

// 初始化画布
function initCanvas() {
  if (!mapCanvas.value || !canvasContainer.value) return
  const container = canvasContainer.value
  const dpr = window.devicePixelRatio || 1
  canvasW = container.clientWidth
  canvasH = Math.max(400, Math.min(600, window.innerHeight * 0.6))
  mapCanvas.value.width = canvasW * dpr
  mapCanvas.value.height = canvasH * dpr
  mapCanvas.value.style.width = canvasW + 'px'
  mapCanvas.value.style.height = canvasH + 'px'
  drawMap()
}

// 鼠标事件
function getCanvasPos(e) {
  const rect = mapCanvas.value.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

function onCanvasMouseDown(e) {
  const pos = getCanvasPos(e)
  isDragging = true
  dragStartX = pos.x
  dragStartY = pos.y
  panStartX = panX
  panStartY = panY
}

function onCanvasMouseMove(e) {
  if (!isDragging) return
  const pos = getCanvasPos(e)
  panX = panStartX + (pos.x - dragStartX)
  panY = panStartY + (pos.y - dragStartY)
  drawMap()
}

function onCanvasMouseUp(e) {
  if (!isDragging) return
  const pos = getCanvasPos(e)
  const dx = Math.abs(pos.x - dragStartX)
  const dy = Math.abs(pos.y - dragStartY)

  // 如果几乎没移动，视为点击
  if (dx < 3 && dy < 3) {
    const node = hitToggle(pos.x, pos.y)
    if (node) {
      node.expanded = !node.expanded
      drawMap()
    }
  }

  isDragging = false
}

function onWheel(e) {
  const pos = getCanvasPos(e)
  const delta = e.deltaY > 0 ? 0.9 : 1.1
  const newScale = Math.max(0.2, Math.min(3, scale * delta))

  // 以鼠标位置为中心缩放
  panX = pos.x - (pos.x - panX) * (newScale / scale)
  panY = pos.y - (pos.y - panY) * (newScale / scale)
  scale = newScale
  drawMap()
}

function onDblClick(e) {
  const pos = getCanvasPos(e)
  const node = hitTest(pos.x, pos.y)
  if (node && node.children.length > 0) {
    node.expanded = !node.expanded
    drawMap()
  }
}

// 触摸事件
let lastTouchDist = 0
function onTouchStart(e) {
  if (e.touches.length === 1) {
    const t = e.touches[0]
    onCanvasMouseDown({ clientX: t.clientX, clientY: t.clientY })
  } else if (e.touches.length === 2) {
    lastTouchDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    )
  }
}

function onTouchMove(e) {
  if (e.touches.length === 1) {
    const t = e.touches[0]
    onCanvasMouseMove({ clientX: t.clientX, clientY: t.clientY })
  } else if (e.touches.length === 2) {
    const dist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    )
    if (lastTouchDist > 0) {
      const ratio = dist / lastTouchDist
      scale = Math.max(0.2, Math.min(3, scale * ratio))
      drawMap()
    }
    lastTouchDist = dist
  }
}

function onTouchEnd() {
  isDragging = false
  lastTouchDist = 0
}

// 工具栏操作
function zoomIn() {
  scale = Math.min(3, scale * 1.2)
  drawMap()
}

function zoomOut() {
  scale = Math.max(0.2, scale / 1.2)
  drawMap()
}

function resetView() {
  scale = 1
  drawMap()
}

function expandAll() {
  function expand(list) {
    for (const n of list) { n.expanded = true; expand(n.children) }
  }
  expand(treeNodes.value)
  drawMap()
}

function collapseAll() {
  function collapse(list) {
    for (const n of list) {
      if (n.children.length > 0) n.expanded = false
      collapse(n.children)
    }
  }
  collapse(treeNodes.value)
  drawMap()
}

// 导出PNG
function exportPNG() {
  if (treeNodes.value.length === 0) return
  drawMap(true)
  const link = document.createElement('a')
  link.download = 'mind-map.png'
  link.href = mapCanvas.value.toDataURL('image/png')
  link.click()
  // 恢复正常画布
  initCanvas()
}

// 粘贴
async function pasteText() {
  try {
    outlineText.value = await navigator.clipboard.readText()
  } catch {}
}

// 示例
function loadExample() {
  outlineText.value = `项目管理
  前端开发
    Vue框架
      Vue 3 组合式API
      Pinia 状态管理
      Vue Router
    React框架
      Hooks
      Redux
      Next.js
  后端开发
    Node.js
      Express
      Koa
      NestJS
    Python
      Django
      FastAPI
      Flask
  数据库
    关系型
      MySQL
      PostgreSQL
    NoSQL
      MongoDB
      Redis
  运维部署
    Docker
    Kubernetes
    CI/CD
  质量保障
    单元测试
    E2E测试
    性能监控`
}

// 监听文本变化重绘
watch(outlineText, () => {
  nextTick(() => drawMap())
})

// 初始化
onMounted(() => {
  initCanvas()
  window.addEventListener('resize', initCanvas)
})

onUnmounted(() => {
  window.removeEventListener('resize', initCanvas)
})
</script>

<style scoped>
.tool-page { padding-top: 0.5rem; }
h2 { font-size: 1.6rem; margin-bottom: 0.3rem; }
.subtitle { color: #888; font-size: 0.95rem; margin-bottom: 1.5rem; }

.editor-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1.5rem;
  align-items: start;
}

.edit-panel {
  background: white;
  border: 1px solid #eee;
  border-radius: 12px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 1rem;
  background: #fafafa;
  border-bottom: 1px solid #eee;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.panel-title { font-weight: 600; font-size: 0.9rem; color: #555; }

.btn-sm {
  padding: 0.25rem 0.7rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 0.8rem;
  cursor: pointer;
  color: #666;
}
.btn-sm:hover { border-color: #10b981; color: #22c55e; }
.btn-sm.btn-primary {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
}
.btn-sm.btn-primary:hover { opacity: 0.85; }

.editor {
  width: 100%;
  min-height: 380px;
  padding: 0.8rem;
  border: none;
  font-size: 0.88rem;
  line-height: 1.7;
  resize: vertical;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  background: white;
  box-sizing: border-box;
  tab-size: 2;
}
.editor:focus { outline: none; }

.editor-footer {
  padding: 0.4rem 1rem;
  display: flex;
  gap: 1rem;
  font-size: 0.78rem;
  color: #aaa;
  border-top: 1px solid #f0f0f0;
}

.canvas-panel {
  background: white;
  border: 1px solid #eee;
  border-radius: 12px;
  overflow: hidden;
}

.canvas-toolbar {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.8rem;
  gap: 0.4rem;
  flex-wrap: wrap;
  border-bottom: 1px solid #f0f0f0;
}

.toolbar-spacer { flex: 1; }

.canvas-container {
  position: relative;
  background: #fafbfc;
  border-radius: 0 0 12px 12px;
  overflow: hidden;
}

.map-canvas {
  display: block;
  cursor: grab;
}
.map-canvas:active { cursor: grabbing; }

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #22c55e;
  font-weight: 500;
}
.back-link:hover { text-decoration: underline; }

@media (max-width: 768px) {
  .editor-layout {
    grid-template-columns: 1fr;
  }
  .editor { min-height: 200px; }
}
</style>
