<template>
  <div class="tool-page">
    <h2>🎨 色彩和谐度分析器</h2>
    <p class="subtitle">输入多个颜色值，分析色彩和谐度，给出搭配评分和改进建议</p>

    <!-- 颜色输入区域 -->
    <div class="input-section">
      <label>添加颜色（点击色块或输入HEX）</label>
      <div class="color-add-row">
        <input type="color" v-model="newColor" class="color-picker" />
        <input
          v-model="newColor"
          class="hex-input"
          placeholder="#22c55e"
          maxlength="7"
          spellcheck="false"
        />
        <button class="btn-primary" @click="addColor">➕ 添加</button>
        <button class="btn-sm" @click="addRandomColor">🎲 随机</button>
      </div>
    </div>

    <!-- 已添加的颜色列表 -->
    <div v-if="colors.length > 0" class="colors-section">
      <div class="section-header">
        <h3>已添加的颜色（{{ colors.length }}/6）</h3>
        <div class="actions">
          <button class="btn-sm" @click="clearAll">清空</button>
        </div>
      </div>
      <div class="color-list">
        <div v-for="(color, index) in colors" :key="index" class="color-item">
          <div class="color-preview" :style="{ backgroundColor: color }" @click="copyColor(color)">
            <span class="color-hex" :style="{ color: textColorForBg(color) }">{{ color }}</span>
          </div>
          <button class="btn-xs btn-danger" @click="removeColor(index)">✕</button>
        </div>
      </div>
    </div>

    <!-- 色轮可视化 -->
    <div v-if="colors.length >= 2" class="wheel-section">
      <h3>🌈 色轮分布</h3>
      <div class="wheel-container">
        <canvas ref="wheelCanvas" class="wheel-canvas"></canvas>
      </div>
    </div>

    <!-- 和谐度分析结果 -->
    <div v-if="analysis" class="results-section">
      <h3>📊 和谐度分析</h3>

      <!-- 总分 -->
      <div class="score-card">
        <div class="score-circle" :style="{ background: scoreGradient }">
          <span class="score-num">{{ analysis.totalScore }}</span>
          <span class="score-label">综合评分</span>
        </div>
        <p class="score-desc">{{ analysis.verdict }}</p>
      </div>

      <!-- 和谐模式匹配 -->
      <div class="modes-section">
        <h4>匹配的和谐模式</h4>
        <div v-if="analysis.matchedModes.length > 0" class="mode-list">
          <div v-for="mode in analysis.matchedModes" :key="mode.name" class="mode-card" :class="mode.score >= 80 ? 'good' : mode.score >= 60 ? 'fair' : 'poor'">
            <span class="mode-icon">{{ mode.icon }}</span>
            <div class="mode-info">
              <span class="mode-name">{{ mode.name }}</span>
              <span class="mode-score">{{ mode.score }}分</span>
            </div>
            <span class="mode-bar">
              <span class="mode-bar-fill" :style="{ width: mode.score + '%' }"></span>
            </span>
          </div>
        </div>
        <p v-else class="empty-tip">未匹配到经典和谐模式，建议调整颜色</p>
      </div>

      <!-- 改进建议 -->
      <div class="tips-section">
        <h4>💡 改进建议</h4>
        <ul class="tips-list">
          <li v-for="(tip, i) in analysis.tips" :key="i">{{ tip }}</li>
        </ul>
      </div>

      <!-- 搭配预览 -->
      <div class="preview-section">
        <h4>🎨 搭配预览</h4>
        <div class="preview-row">
          <div v-for="(color, i) in colors" :key="i" class="preview-swatch" :style="{ backgroundColor: color }">
            <span :style="{ color: textColorForBg(color) }">Aa 示例文本</span>
          </div>
        </div>
        <div class="preview-demo">
          <div :style="{ backgroundColor: colors[0], color: textColorForBg(colors[0]) }" class="demo-heading">标题文字示例</div>
          <div :style="{ backgroundColor: colors[Math.min(1, colors.length - 1)], color: textColorForBg(colors[Math.min(1, colors.length - 1)]) }" class="demo-body">
            正文段落示例 — 当你选择了这套色彩方案，它将呈现这样的视觉效果。
          </div>
          <div :style="{ backgroundColor: colors[Math.min(2, colors.length - 1)], color: textColorForBg(colors[Math.min(2, colors.length - 1)]) }" class="demo-btn">
            按钮示例
          </div>
        </div>
      </div>

      <!-- 复制CSS变量 -->
      <div class="code-section">
        <label>CSS 变量代码</label>
        <div class="code-block">
          <code>{{ cssVarsCode }}</code>
        </div>
        <button class="btn-primary" @click="copyCss">{{ copyText }}</button>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '色彩和谐度分析器 - 野火小站' })

const newColor = ref('#22c55e')
const colors = ref([])
const wheelCanvas = ref(null)
const copyText = ref('复制代码')

// HEX转HSL
function hexToHsl(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255
  let g = parseInt(hex.slice(3, 5), 16) / 255
  let b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2
  if (max === min) { h = s = 0 }
  else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function isValidHex(hex) {
  return /^#[0-9a-fA-F]{6}$/.test(hex)
}

// 根据背景色选择文本颜色
function textColorForBg(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.5 ? '#1a1a2e' : '#ffffff'
}

// 添加颜色
function addColor() {
  if (!isValidHex(newColor.value)) return
  if (colors.value.length >= 6) return
  if (colors.value.includes(newColor.value)) return
  colors.value.push(newColor.value)
  drawWheel()
}

function addRandomColor() {
  const h = Math.floor(Math.random() * 360)
  const s = 40 + Math.floor(Math.random() * 50)
  const l = 30 + Math.floor(Math.random() * 40)
  const [hsl] = [h, s, l]
  // HSL转HEX
  const ss = s / 100; const ll = l / 100
  const a = ss * Math.min(ll, 1 - ll)
  const f = n => {
    const k = (n + hsl / 30) % 12
    const c = ll - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * c).toString(16).padStart(2, '0')
  }
  newColor.value = `#${f(0)}${f(8)}${f(4)}`
  addColor()
}

function removeColor(index) {
  colors.value.splice(index, 1)
  drawWheel()
}

function clearAll() {
  colors.value = []
}

function copyColor(color) {
  navigator.clipboard.writeText(color)
}

// 和谐度分析算法
const analysis = computed(() => {
  if (colors.value.length < 2) return null
  const hues = colors.value.map(c => hexToHsl(c)[0])
  const saturations = colors.value.map(c => hexToHsl(c)[1])
  const lightnesses = colors.value.map(c => hexToHsl(c)[2])

  // 计算色相角度差
  function angleDiff(a, b) {
    let d = Math.abs(a - b) % 360
    return d > 180 ? 360 - d : d
  }

  // 计算平均饱和度和明度
  const avgSat = saturations.reduce((a, b) => a + b, 0) / saturations.length
  const avgLight = lightnesses.reduce((a, b) => a + b, 0) / lightnesses.length

  // 饱和度一致性评分（饱和度接近得分更高）
  const satRange = Math.max(...saturations) - Math.min(...saturations)
  const satScore = Math.max(0, 100 - satRange * 1.5)

  // 明度一致性评分
  const lightRange = Math.max(...lightnesses) - Math.min(...lightnesses)
  const lightScore = Math.max(0, 100 - lightRange * 1.2)

  // 匹配和谐模式
  const modes = []

  // 互补色模式（2色，差180度）
  if (hues.length === 2) {
    const diff = angleDiff(hues[0], hues[1])
    const compScore = Math.max(0, 100 - Math.abs(diff - 180) * 3)
    if (compScore > 40) {
      modes.push({ name: '互补色', icon: '🔄', score: Math.round(compScore) })
    }
  }

  // 类比色模式（色相跨度<60度）
  const hueSpan = (() => {
    if (hues.length < 2) return 0
    const sorted = [...hues].sort((a, b) => a - b)
    let maxGap = 0
    for (let i = 0; i < sorted.length - 1; i++) {
      const gap = sorted[i + 1] - sorted[i]
      if (gap > maxGap) maxGap = gap
    }
    // 环形最大间距
    const wrapGap = 360 - sorted[sorted.length - 1] + sorted[0]
    maxGap = Math.max(maxGap, wrapGap)
    return 360 - maxGap
  })()

  if (hueSpan < 70) {
    const anaScore = Math.max(0, Math.round(100 - hueSpan * 1.5))
    modes.push({ name: '类比色', icon: '🌸', score: anaScore })
  }

  // 三色配色（3色，约120度间隔）
  if (hues.length >= 3) {
    const sorted = [...hues].sort((a, b) => a - b)
    let bestTriScore = 0
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        for (let k = j + 1; k < sorted.length; k++) {
          const d1 = angleDiff(sorted[i], sorted[j])
          const d2 = angleDiff(sorted[j], sorted[k])
          const d3 = angleDiff(sorted[k], sorted[i])
          // 理想三色差：120, 120, 120
          const score = 100 - (Math.abs(d1 - 120) + Math.abs(d2 - 120) + Math.abs(d3 - 120)) * 0.5
          bestTriScore = Math.max(bestTriScore, score)
        }
      }
    }
    if (bestTriScore > 40) {
      modes.push({ name: '三色配色', icon: '🎯', score: Math.round(bestTriScore) })
    }
  }

  // 分裂互补色（3色：基础色+与互补色两侧各30度）
  if (hues.length >= 3) {
    const sorted = [...hues].sort((a, b) => a - b)
    let bestSplitScore = 0
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        for (let k = j + 1; k < sorted.length; k++) {
          const angles = [sorted[i], sorted[j], sorted[k]]
          for (const base of angles) {
            const comp = (base + 180) % 360
            const target1 = (comp + 30) % 360
            const target2 = (comp - 30 + 360) % 360
            const others = angles.filter(a => a !== base)
            if (others.length >= 2) {
              const d1 = Math.min(angleDiff(others[0], target1), angleDiff(others[0], target2))
              const d2 = Math.min(angleDiff(others[1], target1), angleDiff(others[1], target2))
              const score = 100 - (d1 + d2) * 1.2
              bestSplitScore = Math.max(bestSplitScore, score)
            }
          }
        }
      }
    }
    if (bestSplitScore > 40) {
      modes.push({ name: '分裂互补色', icon: '✂️', score: Math.round(bestSplitScore) })
    }
  }

  // 四色配色（4色，约90度间隔）
  if (hues.length >= 4) {
    const sorted = [...hues].sort((a, b) => a - b)
    let bestQuadScore = 0
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        for (let k = j + 1; k < sorted.length; k++) {
          for (let l = k + 1; l < sorted.length; l++) {
            const angles = [sorted[i], sorted[j], sorted[k], sorted[l]]
            const ideal = [0, 90, 180, 270].map(d => (angles[0] + d) % 360)
            let totalDiff = 0
            for (const a of angles) {
              totalDiff += Math.min(...ideal.map(t => angleDiff(a, t)))
            }
            const score = Math.max(0, 100 - totalDiff * 1.5)
            bestQuadScore = Math.max(bestQuadScore, score)
          }
        }
      }
    }
    if (bestQuadScore > 40) {
      modes.push({ name: '四色配色', icon: '🔲', score: Math.round(bestQuadScore) })
    }
  }

  // 单色模式（色相接近，明度不同）
  if (hueSpan < 30 && lightRange > 15) {
    const monoScore = Math.round(Math.max(0, (100 - hueSpan * 3) * 0.7 + lightRange * 0.5))
    modes.push({ name: '单色系', icon: '💎', score: Math.min(95, monoScore) })
  }

  // 计算总分
  const modeScore = modes.length > 0 ? Math.max(...modes.map(m => m.score)) : 20
  const totalScore = Math.round(modeScore * 0.5 + satScore * 0.2 + lightScore * 0.2 + Math.min(hues.length, 5) * 4)

  // 生成评语
  let verdict = ''
  if (totalScore >= 85) verdict = '🏆 非常和谐！这套色彩搭配极具美感'
  else if (totalScore >= 70) verdict = '✨ 和谐度良好，可以用于正式设计'
  else if (totalScore >= 50) verdict = '👌 尚可，但还有优化空间'
  else if (totalScore >= 30) verdict = '⚠️ 和谐度一般，建议参考改进建议调整'
  else verdict = '❌ 和谐度较低，色彩搭配需要大幅调整'

  // 生成改进建议
  const tips = []
  if (modes.length === 0) tips.push('当前颜色未匹配到经典和谐模式，尝试使用互补色（色差180°）或类比色（色差<60°）')
  if (satRange > 40) tips.push('饱和度差异过大（范围' + satRange + '%），建议统一饱和度以提升和谐感')
  if (lightRange > 50) tips.push('明度差异过大（范围' + lightRange + '%），建议缩小明度跨度')
  if (hues.length === 2 && hueSpan > 60 && hueSpan < 120) tips.push('两个颜色的色相差在60°-120°之间，这是一个"尴尬区间"，建议调整为互补色（180°）或类比色（<60°）')
  if (hues.length >= 3 && hueSpan < 30) tips.push('色相非常接近，考虑拉开色相差距或充分利用明度差异制造层次')
  if (avgSat < 20) tips.push('整体饱和度偏低（平均' + avgSat + '%），适当提高饱和度能让色彩更鲜明')
  if (avgLight > 80 || avgLight < 15) tips.push('整体明度过' + (avgLight > 80 ? '高' : '低') + '（平均' + avgLight + '%），建议适度调整以提升可读性')
  if (tips.length === 0) tips.push('当前配色和谐度较高，可以考虑微调明度来增加层次感')

  return {
    totalScore: Math.min(100, Math.max(0, totalScore)),
    matchedModes: modes.sort((a, b) => b.score - a.score),
    verdict,
    tips
  }
})

const scoreGradient = computed(() => {
  const score = analysis.value?.totalScore || 0
  if (score >= 80) return 'linear-gradient(135deg, #22c55e, #10b981)'
  if (score >= 60) return 'linear-gradient(135deg, #f59e0b, #d97706)'
  return 'linear-gradient(135deg, #ef4444, #dc2626)'
})

// CSS变量代码
const cssVarsCode = computed(() => {
  const lines = colors.value.map((c, i) => `  --color-${i + 1}: ${c};`)
  return `:root {\n${lines.join('\n')}\n}`
})

function copyCss() {
  navigator.clipboard.writeText(cssVarsCode.value).then(() => {
    copyText.value = '已复制 ✓'
    setTimeout(() => { copyText.value = '复制代码' }, 1500)
  })
}

// 绘制色轮
function drawWheel() {
  if (!wheelCanvas.value || colors.value.length < 2) return

  const canvas = wheelCanvas.value
  const size = 280
  const dpr = window.devicePixelRatio || 1
  canvas.width = size * dpr
  canvas.height = size * dpr
  canvas.style.width = size + 'px'
  canvas.style.height = size + 'px'
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  const cx = size / 2
  const cy = size / 2
  const outerR = size / 2 - 10
  const innerR = outerR * 0.5

  // 绘制色轮环
  for (let angle = 0; angle < 360; angle++) {
    const startAngle = (angle - 0.5) * Math.PI / 180 - Math.PI / 2
    const endAngle = (angle + 0.5) * Math.PI / 180 - Math.PI / 2
    ctx.beginPath()
    ctx.arc(cx, cy, outerR, startAngle, endAngle)
    ctx.arc(cx, cy, innerR, endAngle, startAngle, true)
    ctx.closePath()
    ctx.fillStyle = `hsl(${angle}, 70%, 55%)`
    ctx.fill()
  }

  // 绘制颜色标记点
  colors.value.forEach((color, i) => {
    const [h] = hexToHsl(color)
    const angle = (h - 90) * Math.PI / 180
    const midR = (outerR + innerR) / 2
    const x = cx + Math.cos(angle) * midR
    const y = cy + Math.sin(angle) * midR

    // 外圈
    ctx.beginPath()
    ctx.arc(x, y, 12, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 3
    ctx.stroke()

    // 标号
    ctx.fillStyle = textColorForBg(color)
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText((i + 1).toString(), x, y)
  })

  // 中心文字
  ctx.fillStyle = '#333'
  ctx.font = 'bold 14px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${colors.value.length} 色`, cx, cy)
}

// 监听颜色变化重绘色轮
watch(colors, () => {
  nextTick(() => drawWheel())
}, { deep: true })

onMounted(() => {
  drawWheel()
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

.input-section {
  margin-bottom: 1.5rem;
}

.input-section label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.color-add-row {
  display: flex;
  gap: 0.8rem;
  align-items: center;
}

.color-picker {
  width: 48px;
  height: 48px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  cursor: pointer;
  padding: 2px;
  background: none;
}

.hex-input {
  flex: 1;
  max-width: 180px;
  padding: 0.6rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1.1rem;
  font-family: monospace;
  outline: none;
  transition: border-color 0.2s;
}

.hex-input:focus {
  border-color: #22c55e;
}

.btn-primary {
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: transform 0.2s;
}

.btn-primary:hover { opacity: 0.85; }
.btn-primary:active { transform: scale(0.95); }

.btn-sm {
  padding: 0.5rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn-sm:hover { border-color: #22c55e; color: #22c55e; }

.btn-xs {
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  background: white;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-xs.btn-danger { color: #e74c3c; }
.btn-xs.btn-danger:hover { background: #fef2f2; border-color: #e74c3c; }

.colors-section {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.section-header h3 {
  font-size: 1.1rem;
  margin-bottom: 0;
}

.color-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.color-item {
  position: relative;
}

.color-preview {
  width: 80px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 4px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.color-preview:hover {
  transform: scale(1.05);
}

.color-hex {
  font-family: monospace;
  font-size: 0.75rem;
  font-weight: 600;
}

.color-item .btn-xs {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 22px;
  height: 22px;
  font-size: 0.7rem;
}

/* 色轮 */
.wheel-section {
  margin-bottom: 2rem;
  text-align: center;
}

.wheel-container {
  display: flex;
  justify-content: center;
}

.wheel-canvas {
  border-radius: 50%;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

/* 分析结果 */
.results-section {
  margin-bottom: 2rem;
}

.results-section h3 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.score-card {
  text-align: center;
  margin-bottom: 2rem;
}

.score-circle {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  color: white;
  margin-bottom: 1rem;
}

.score-num {
  font-size: 2.8rem;
  font-weight: bold;
  line-height: 1;
}

.score-label {
  font-size: 0.85rem;
  opacity: 0.9;
}

.score-desc {
  font-size: 1rem;
  color: #555;
}

/* 和谐模式 */
.modes-section {
  margin-bottom: 2rem;
}

.modes-section h4 {
  font-size: 1rem;
  margin-bottom: 0.8rem;
}

.mode-card {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem 1rem;
  border-radius: 10px;
  margin-bottom: 0.6rem;
  background: #f9fafb;
}

.mode-card.good { border-left: 4px solid #22c55e; }
.mode-card.fair { border-left: 4px solid #f59e0b; }
.mode-card.poor { border-left: 4px solid #ef4444; }

.mode-icon {
  font-size: 1.3rem;
}

.mode-info {
  flex: 0 0 auto;
}

.mode-name {
  display: block;
  font-weight: 600;
  font-size: 0.9rem;
}

.mode-score {
  font-size: 0.8rem;
  color: #888;
}

.mode-bar {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.mode-bar-fill {
  display: block;
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.mode-card.good .mode-bar-fill { background: #22c55e; }
.mode-card.fair .mode-bar-fill { background: #f59e0b; }
.mode-card.poor .mode-bar-fill { background: #ef4444; }

.empty-tip {
  color: #aaa;
  font-size: 0.9rem;
}

/* 改进建议 */
.tips-section {
  margin-bottom: 2rem;
}

.tips-section h4 {
  font-size: 1rem;
  margin-bottom: 0.8rem;
}

.tips-list {
  padding-left: 1.5rem;
}

.tips-list li {
  margin-bottom: 0.5rem;
  color: #555;
  font-size: 0.9rem;
  line-height: 1.5;
}

/* 搭配预览 */
.preview-section {
  margin-bottom: 2rem;
}

.preview-section h4 {
  font-size: 1rem;
  margin-bottom: 0.8rem;
}

.preview-row {
  display: flex;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 1rem;
}

.preview-swatch {
  flex: 1;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 600;
}

.preview-demo {
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.demo-heading {
  padding: 1rem;
  font-size: 1.2rem;
  font-weight: bold;
}

.demo-body {
  padding: 1rem;
  font-size: 0.9rem;
  line-height: 1.6;
}

.demo-btn {
  padding: 0.6rem;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

/* 代码区 */
.code-section {
  margin-bottom: 2rem;
}

.code-section label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.code-block {
  background: #1a1a2e;
  border-radius: 10px;
  padding: 1.2rem;
  overflow-x: auto;
  margin-bottom: 0.8rem;
}

.code-block code {
  color: #a5d6a7;
  font-family: monospace;
  font-size: 0.9rem;
  white-space: pre;
  line-height: 1.6;
}

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #22c55e;
  text-decoration: none;
  font-weight: 600;
}

.back-link:hover {
  text-decoration: underline;
}

@media (max-width: 600px) {
  .color-add-row {
    flex-wrap: wrap;
  }
  .hex-input {
    max-width: none;
    flex: 1;
  }
  .preview-row {
    flex-direction: column;
  }
  .preview-swatch {
    min-height: 50px;
  }
  .wheel-canvas {
    width: 240px !important;
    height: 240px !important;
  }
}
</style>
