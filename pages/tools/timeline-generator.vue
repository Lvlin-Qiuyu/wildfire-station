<template>
  <div class="tool-page">
    <h2>📊 时间线可视化生成器</h2>
    <p class="subtitle">输入事件列表，自动生成美观的垂直时间线图，支持导出PNG/SVG</p>

    <div class="timeline-container">
      <!-- 布局切换 -->
      <div class="type-tabs">
        <button :class="{ active: layout === 'vertical' }" @click="layout = 'vertical'">
          ↕️ 垂直
        </button>
        <button :class="{ active: layout === 'horizontal' }" @click="layout = 'horizontal'">
          ↔️ 水平
        </button>
      </div>

      <!-- 风格选择 -->
      <div class="input-row">
        <label>节点风格</label>
        <div class="style-selector">
          <button
            v-for="s in nodeStyles"
            :key="s.value"
            :class="{ active: nodeStyle === s.value }"
            @click="nodeStyle = s.value"
          >{{ s.icon }} {{ s.label }}</button>
        </div>
      </div>

      <!-- 主题色 -->
      <div class="input-row">
        <label>主题色</label>
        <div class="color-selector">
          <button
            v-for="c in themeColors"
            :key="c.value"
            :class="{ active: themeColor === c.value }"
            @click="themeColor = c.value"
          >
            <span class="color-dot" :style="{ background: c.value }"></span>
            <span>{{ c.label }}</span>
          </button>
        </div>
      </div>

      <!-- 事件数据输入 -->
      <div class="input-row">
        <label>事件列表 <span class="hint">（每行一条：日期 | 标题 | 描述）</span></label>
        <textarea
          v-model="rawData"
          placeholder="例如：&#10;2024-01-15 | 项目启动 | 完成需求分析和立项&#10;2024-03-20 | 第一个版本 | 发布 MVP&#10;2024-06-10 | 正式上线 | 完成全功能开发"
          class="data-textarea"
          rows="8"
        ></textarea>
      </div>

      <!-- 快速填充 -->
      <div class="input-row">
        <label>快速填充模板</label>
        <div class="template-buttons">
          <button v-for="t in templates" :key="t.name" @click="loadTemplate(t)" class="btn-template">
            {{ t.icon }} {{ t.name }}
          </button>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-row">
        <button class="btn-preview" @click="renderTimeline">📊 生成时间线</button>
        <button class="btn-export" @click="exportPNG" v-if="hasRendered">💾 导出PNG</button>
        <button class="btn-export" @click="exportSVG" v-if="hasRendered && layout === 'vertical'">📐 导出SVG</button>
      </div>

      <!-- 时间线预览 -->
      <div class="preview-area" v-if="hasRendered">
        <div class="canvas-wrapper" ref="canvasWrapper">
          <canvas ref="timelineCanvas"></canvas>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="placeholder" v-else>
        <p>📝 输入事件数据后点击"生成时间线"预览</p>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '时间线可视化生成器 - 野火小站' })

const timelineCanvas = ref(null)
const canvasWrapper = ref(null)
const layout = ref('vertical')
const nodeStyle = ref('circle')
const themeColor = ref('#22c55e')
const rawData = ref('')
const hasRendered = ref(false)

// 节点风格
const nodeStyles = [
  { value: 'circle', label: '圆形', icon: '⭕' },
  { value: 'diamond', label: '菱形', icon: '🔷' },
  { value: 'dot', label: '圆点', icon: '⚫' },
]

// 主题色
const themeColors = [
  { value: '#22c55e', label: '翡翠' },
  { value: '#3b82f6', label: '海洋' },
  { value: '#f59e0b', label: '暖阳' },
  { value: '#ef4444', label: '烈焰' },
  { value: '#8b5cf6', label: '紫韵' },
  { value: '#ec4899', label: '桃粉' },
]

// 快速模板
const templates = [
  {
    icon: '💼',
    name: '项目里程碑',
    data: `2024-01-10 | 需求评审 | 完成产品需求文档和原型评审
2024-02-15 | 开发启动 | 前后端团队开始编码
2024-04-01 | 内测上线 | 完成核心功能开发，开启内部测试
2024-05-20 | 公测发布 | 面向种子用户开放公测
2024-07-01 | 正式发布 | V1.0 正式版上线运营`,
  },
  {
    icon: '🎓',
    name: '学习计划',
    data: `第1周 | 基础入门 | 学习HTML/CSS基础语法
第3周 | 进阶提升 | 掌握JavaScript核心概念
第5周 | 框架学习 | Vue 3 组合式API和响应式
第7周 | 项目实战 | 独立完成一个完整项目
第9周 | 面试准备 | 算法和系统设计复习`,
  },
  {
    icon: '📜',
    name: '历史事件',
    data: `1969-07-20 | 阿波罗登月 | 阿姆斯特朗成为第一个登上月球的人
1989-11-09 | 柏林墙倒塌 | 冷战结束的标志性事件
1991-08-06 | 万维网公开 | Tim Berners-Lee 发布第一个网站
2007-01-09 | iPhone发布 | 史蒂夫·乔布斯发布初代iPhone
2022-11-30 | ChatGPT发布 | OpenAI发布ChatGPT改变世界`,
  },
]

function loadTemplate(t) {
  rawData.value = t.data
}

// 解析原始数据
function parseData(raw) {
  const lines = raw.trim().split('\n').filter(l => l.trim())
  return lines.map((line, i) => {
    const parts = line.split('|').map(s => s.trim())
    return {
      date: parts[0] || `事件 ${i + 1}`,
      title: parts[1] || '未命名',
      desc: parts[2] || '',
      index: i,
    }
  })
}

// 辅助：hex 转 rgba
function hexToRGBA(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// 辅助：绘制圆角矩形
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

// 绘制节点标记
function drawNode(ctx, x, y, style, color, isActive) {
  ctx.fillStyle = color
  ctx.strokeStyle = hexToRGBA(color, 0.3)
  ctx.lineWidth = 3

  if (style === 'circle') {
    const r = isActive ? 10 : 8
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    // 内圆
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(x, y, r - 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, r - 5, 0, Math.PI * 2)
    ctx.fill()
  } else if (style === 'diamond') {
    const s = isActive ? 10 : 8
    ctx.beginPath()
    ctx.moveTo(x, y - s)
    ctx.lineTo(x + s, y)
    ctx.lineTo(x, y + s)
    ctx.lineTo(x - s, y)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    const s2 = s - 3
    ctx.moveTo(x, y - s2)
    ctx.lineTo(x + s2, y)
    ctx.lineTo(x, y + s2)
    ctx.lineTo(x - s2, y)
    ctx.closePath()
    ctx.fill()
  } else {
    // dot
    const r = isActive ? 7 : 5
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

// 渲染垂直时间线
function renderVertical(ctx, events, w, h, dpr) {
  const padding = 40 * dpr
  const lineHeight = Math.max(80, (h - padding * 2) / events.length)
  const centerX = w / 2
  const cardWidth = Math.min(220, (centerX - padding - 40 * dpr) * 1.8)
  const color = themeColor.value

  // 绘制中线
  ctx.strokeStyle = hexToRGBA(color, 0.2)
  ctx.lineWidth = 2 * dpr
  ctx.setLineDash([4 * dpr, 4 * dpr])
  ctx.beginPath()
  ctx.moveTo(centerX, padding - 10 * dpr)
  ctx.lineTo(centerX, padding + lineHeight * events.length)
  ctx.stroke()
  ctx.setLineDash([])

  events.forEach((evt, i) => {
    const y = padding + i * lineHeight + lineHeight / 2
    const isLeft = i % 2 === 0
    const cardX = isLeft ? centerX - cardWidth - 30 * dpr : centerX + 30 * dpr

    // 连接线
    ctx.strokeStyle = hexToRGBA(color, 0.3)
    ctx.lineWidth = 2 * dpr
    ctx.beginPath()
    ctx.moveTo(centerX, y)
    ctx.lineTo(isLeft ? cardX + cardWidth : cardX, y)
    ctx.stroke()

    // 卡片背景
    const cardH = lineHeight * 0.75
    const cardY = y - cardH / 2
    roundRect(ctx, cardX, cardY, cardWidth, cardH, 8 * dpr)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = hexToRGBA(color, 0.15)
    ctx.lineWidth = 1.5 * dpr
    ctx.stroke()

    // 日期
    ctx.fillStyle = color
    ctx.font = `bold ${11 * dpr}px -apple-system, sans-serif`
    ctx.textAlign = isLeft ? 'right' : 'left'
    ctx.fillText(evt.date, isLeft ? cardX - 10 * dpr : cardX + cardWidth + 10 * dpr, y - 8 * dpr)

    // 标题
    ctx.fillStyle = '#1a1a2e'
    ctx.font = `bold ${13 * dpr}px -apple-system, sans-serif`
    ctx.textAlign = 'left'
    ctx.fillText(truncate(evt.title, 16), cardX + 12 * dpr, cardY + 22 * dpr)

    // 描述
    if (evt.desc) {
      ctx.fillStyle = '#666'
      ctx.font = `${11 * dpr}px -apple-system, sans-serif`
      // 自动换行
      const maxW = cardWidth - 24 * dpr
      const lines = wrapText(ctx, evt.desc, maxW, 2)
      lines.forEach((line, li) => {
        ctx.fillText(line, cardX + 12 * dpr, cardY + 40 * dpr + li * 15 * dpr)
      })
    }

    // 节点
    drawNode(ctx, centerX, y, nodeStyle.value, color, false)
  })
}

// 渲染水平时间线
function renderHorizontal(ctx, events, w, h, dpr) {
  const padding = 50 * dpr
  const spacing = Math.min(180 * dpr, (w - padding * 2) / events.length)
  const centerY = h / 2
  const color = themeColor.value

  // 中线
  ctx.strokeStyle = hexToRGBA(color, 0.2)
  ctx.lineWidth = 2 * dpr
  ctx.setLineDash([4 * dpr, 4 * dpr])
  ctx.beginPath()
  ctx.moveTo(padding - 20 * dpr, centerY)
  ctx.lineTo(padding + spacing * events.length, centerY)
  ctx.stroke()
  ctx.setLineDash([])

  events.forEach((evt, i) => {
    const x = padding + i * spacing + spacing / 2
    const isTop = i % 2 === 0

    // 连接线
    const lineLen = 40 * dpr
    ctx.strokeStyle = hexToRGBA(color, 0.3)
    ctx.lineWidth = 2 * dpr
    ctx.beginPath()
    ctx.moveTo(x, centerY)
    ctx.lineTo(x, isTop ? centerY - lineLen : centerY + lineLen)
    ctx.stroke()

    // 日期（轴上）
    ctx.fillStyle = '#666'
    ctx.font = `${10 * dpr}px -apple-system, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(evt.date, x, centerY + (isTop ? 18 * dpr : -10 * dpr))

    // 卡片
    const cardW = spacing - 10 * dpr
    const cardH = 65 * dpr
    const cardX = x - cardW / 2
    const cardY = isTop ? centerY - lineLen - cardH : centerY + lineLen

    roundRect(ctx, cardX, cardY, cardW, cardH, 8 * dpr)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = hexToRGBA(color, 0.15)
    ctx.lineWidth = 1.5 * dpr
    ctx.stroke()

    // 标题
    ctx.fillStyle = '#1a1a2e'
    ctx.font = `bold ${12 * dpr}px -apple-system, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(truncate(evt.title, 12), x, cardY + 24 * dpr)

    // 描述
    if (evt.desc) {
      ctx.fillStyle = '#666'
      ctx.font = `${10 * dpr}px -apple-system, sans-serif`
      ctx.fillText(truncate(evt.desc, 16), x, cardY + 42 * dpr)
    }

    // 节点
    drawNode(ctx, x, centerY, nodeStyle.value, color, false)
  })
}

// 文本截断
function truncate(text, maxLen) {
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text
}

// 自动换行
function wrapText(ctx, text, maxW, maxLines) {
  const lines = []
  let current = ''
  for (const char of text) {
    const test = current + char
    if (ctx.measureText(test).width > maxW && current) {
      lines.push(current)
      current = char
      if (lines.length >= maxLines) {
        lines[lines.length - 1] = truncate(lines[lines.length - 1], -1) + '…'
        return lines
      }
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

async function renderTimeline() {
  const events = parseData(rawData.value)
  if (events.length === 0) return

  await nextTick()
  const canvas = timelineCanvas.value
  if (!canvas) return

  const dpr = window.devicePixelRatio || 1

  let canvasW, canvasH
  if (layout.value === 'vertical') {
    const itemHeight = 110
    canvasW = Math.min(800, window.innerWidth - 40)
    canvasH = Math.max(400, events.length * itemHeight + 80)
  } else {
    canvasW = Math.min(1200, Math.max(600, events.length * 160 + 100))
    canvasH = 350
  }

  canvas.style.width = canvasW + 'px'
  canvas.style.height = canvasH + 'px'
  canvas.width = canvasW * dpr
  canvas.height = canvasH * dpr

  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 背景
  ctx.fillStyle = '#fafbfc'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  if (layout.value === 'vertical') {
    renderVertical(ctx, events, canvas.width, canvas.height, dpr)
  } else {
    renderHorizontal(ctx, events, canvas.width, canvas.height, dpr)
  }

  hasRendered.value = true
}

function exportPNG() {
  const canvas = timelineCanvas.value
  if (!canvas) return
  const link = document.createElement('a')
  link.download = 'timeline.png'
  link.href = canvas.toDataURL('image/png')
  link.click()
}

function exportSVG() {
  // 从Canvas导出简化的SVG
  const events = parseData(rawData.value)
  if (!events.length) return

  const padding = 40
  const lineHeight = 110
  const centerX = 400
  const color = themeColor.value
  const cardWidth = 200

  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="${events.length * lineHeight + 80}" viewBox="0 0 800 ${events.length * lineHeight + 80}">\n`
  svgContent += `  <rect width="800" height="${events.length * lineHeight + 80}" fill="#fafbfc"/>\n`
  // 中线
  svgContent += `  <line x1="${centerX}" y1="30" x2="${centerX}" y2="${padding + lineHeight * events.length}" stroke="${hexToRGBA(color, 0.2)}" stroke-width="2" stroke-dasharray="4,4"/>\n`

  events.forEach((evt, i) => {
    const y = padding + i * lineHeight + lineHeight / 2
    const isLeft = i % 2 === 0
    const cardX = isLeft ? centerX - cardWidth - 30 : centerX + 30

    svgContent += `  <line x1="${centerX}" y1="${y}" x2="${isLeft ? cardX + cardWidth : cardX}" y2="${y}" stroke="${hexToRGBA(color, 0.3)}" stroke-width="2"/>\n`
    svgContent += `  <rect x="${cardX}" y="${y - 38}" width="${cardWidth}" height="76" rx="8" fill="white" stroke="${hexToRGBA(color, 0.15)}" stroke-width="1.5"/>\n`
    svgContent += `  <text x="${isLeft ? cardX - 10 : cardX + cardWidth + 10}" y="${y - 8}" text-anchor="${isLeft ? 'end' : 'start'}" fill="${color}" font-size="11" font-weight="bold" font-family="sans-serif">${escapeXml(evt.date)}</text>\n`
    svgContent += `  <text x="${cardX + 12}" y="${y + 10}" fill="#1a1a2e" font-size="13" font-weight="bold" font-family="sans-serif">${escapeXml(truncate(evt.title, 16))}</text>\n`
    if (evt.desc) {
      svgContent += `  <text x="${cardX + 12}" y="${y + 30}" fill="#666" font-size="11" font-family="sans-serif">${escapeXml(truncate(evt.desc, 22))}</text>\n`
    }
    // 节点
    if (nodeStyle.value === 'circle') {
      svgContent += `  <circle cx="${centerX}" cy="${y}" r="8" fill="${color}"/>\n`
      svgContent += `  <circle cx="${centerX}" cy="${y}" r="4" fill="white"/>\n`
      svgContent += `  <circle cx="${centerX}" cy="${y}" r="2.5" fill="${color}"/>\n`
    } else if (nodeStyle.value === 'diamond') {
      svgContent += `  <polygon points="${centerX},${y - 8} ${centerX + 8},${y} ${centerX},${y + 8} ${centerX - 8},${y}" fill="${color}"/>\n`
    } else {
      svgContent += `  <circle cx="${centerX}" cy="${y}" r="5" fill="${color}"/>\n`
    }
  })

  svgContent += `</svg>`

  const blob = new Blob([svgContent], { type: 'image/svg+xml' })
  const link = document.createElement('a')
  link.download = 'timeline.svg'
  link.href = URL.createObjectURL(blob)
  link.click()
  URL.revokeObjectURL(link.href)
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// 自动重渲染
watch([layout, nodeStyle, themeColor], () => {
  if (rawData.value.trim() && hasRendered.value) {
    renderTimeline()
  }
})
</script>

<style scoped>
.tool-page {
  padding-top: 0.5rem;
}
h2 { font-size: 1.6rem; margin-bottom: 0.3rem; }
.subtitle { color: #888; font-size: 0.95rem; margin-bottom: 1.5rem; }
.timeline-container { max-width: 850px; margin: 0 auto; }

.type-tabs {
  display: flex;
  gap: 0;
  background: #f0f0f0;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 1.2rem;
  padding: 3px;
}
.type-tabs button {
  flex: 1;
  padding: 0.55rem;
  border: none;
  background: transparent;
  border-radius: 10px;
  font-size: 0.85rem;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}
.type-tabs button.active {
  background: white;
  color: #333;
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

.input-row { margin-bottom: 1rem; }
.input-row label {
  display: block;
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 0.4rem;
  font-weight: 500;
}
.hint { color: #aaa; font-weight: 400; font-size: 0.8rem; }

.style-selector, .color-selector {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.style-selector button, .color-selector button {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.7rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}
.style-selector button.active, .color-selector button.active {
  border-color: #22c55e;
  background: #f0fdf4;
}
.color-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: inline-block;
}

.template-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.btn-template {
  padding: 0.4rem 0.8rem;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}
.btn-template:hover {
  border-color: #22c55e;
  background: #f0fdf4;
}

.data-textarea {
  width: 100%;
  padding: 0.7rem 0.8rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: 'SF Mono', 'Fira Code', monospace;
  outline: none;
  transition: border-color 0.2s;
  resize: vertical;
  box-sizing: border-box;
  line-height: 1.6;
}
.data-textarea:focus { border-color: #22c55e; }

.action-row {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}
.btn-preview {
  padding: 0.6rem 1.5rem;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn-preview:hover { opacity: 0.85; }
.btn-export {
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  border: 2px solid #22c55e;
  background: white;
  color: #22c55e;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-export:hover { background: #f0fdf4; }

.preview-area {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  margin-bottom: 1.5rem;
  overflow-x: auto;
}
.canvas-wrapper {
  display: flex;
  justify-content: center;
}
.canvas-wrapper canvas {
  max-width: 100%;
  height: auto;
}

.placeholder {
  text-align: center;
  padding: 3rem 1rem;
  background: #fafafa;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  color: #bbb;
  font-size: 1rem;
}

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #22c55e;
  font-weight: 500;
}
.back-link:hover { text-decoration: underline; }

@media (max-width: 640px) {
  .type-tabs button { font-size: 0.78rem; padding: 0.45rem; }
  .action-row { flex-direction: column; }
  .style-selector, .color-selector { gap: 0.3rem; }
}
</style>
