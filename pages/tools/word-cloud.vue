<template>
  <div class="tool-page">
    <h2>📊 词云生成器</h2>
    <p class="subtitle">输入文本或粘贴内容，自动统计词频，生成可自定义配色的词云图，支持导出 PNG</p>

    <div class="wordcloud-container">
      <!-- 文本输入区域 -->
      <div class="input-row">
        <label>输入文本 <span class="hint">（支持中文和英文，自动分词统计词频）</span></label>
        <textarea
          v-model="rawText"
          placeholder="在这里粘贴或输入文本内容...&#10;&#10;例如：&#10;前端开发是一种创建用户界面的技术，前端工程师需要掌握HTML、CSS和JavaScript等技术。前端框架如Vue和React让前端开发变得更加高效。"
          class="data-textarea"
          rows="6"
        ></textarea>
      </div>

      <!-- 参数设置 -->
      <div class="settings-row">
        <div class="setting-item">
          <label>配色方案</label>
          <div class="theme-selector">
            <button
              v-for="(colors, key) in colorThemes"
              :key="key"
              :class="{ active: selectedTheme === key }"
              @click="selectedTheme = key"
            >
              <span class="theme-dots">
                <span v-for="c in colors.slice(0, 5)" :key="c" class="dot" :style="{ background: c }"></span>
              </span>
              <span class="theme-name">{{ key }}</span>
            </button>
          </div>
        </div>
        <div class="setting-item">
          <label>最大词数</label>
          <select v-model="maxWords" class="select-input">
            <option :value="30">30 个</option>
            <option :value="50">50 个</option>
            <option :value="80">80 个</option>
            <option :value="120">120 个</option>
          </select>
        </div>
        <div class="setting-item">
          <label>背景色</label>
          <div class="bg-options">
            <button
              v-for="bg in bgColors"
              :key="bg.value"
              :class="{ active: bgColor === bg.value }"
              :style="{ background: bg.value, border: bg.value === '#ffffff' ? '1px solid #ddd' : 'none' }"
              @click="bgColor = bg.value"
              class="bg-btn"
            ></button>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-row">
        <button class="btn-generate" @click="generateWordCloud">📊 生成词云</button>
        <button class="btn-export" @click="exportPNG" v-if="hasImage" @keydown.enter.prevent>💾 导出 PNG</button>
      </div>

      <!-- 词云展示区域 -->
      <div class="preview-area" v-if="hasImage">
        <canvas ref="cloudCanvas"></canvas>
      </div>

      <!-- 占位提示 -->
      <div class="placeholder" v-else>
        <p>📝 输入文本后点击"生成词云"预览</p>
      </div>

      <!-- 词频统计列表 -->
      <div class="stats-section" v-if="wordList.length > 0">
        <h3>📈 词频统计（前 {{ Math.min(wordList.length, 20) }} 个）</h3>
        <div class="word-stats">
          <div v-for="(item, i) in wordList.slice(0, 20)" :key="item.word" class="stat-item">
            <span class="stat-rank">{{ i + 1 }}</span>
            <span class="stat-word">{{ item.word }}</span>
            <div class="stat-bar-wrap">
              <div
                class="stat-bar"
                :style="{
                  width: (item.count / wordList[0].count * 100) + '%',
                  background: colorThemes[selectedTheme][i % colorThemes[selectedTheme].length]
                }"
              ></div>
            </div>
            <span class="stat-count">{{ item.count }} 次</span>
          </div>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '词云生成器 - 野火小站' })

const rawText = ref('')
const cloudCanvas = ref(null)
const selectedTheme = ref('翡翠')
const maxWords = ref(80)
const bgColor = ref('#ffffff')
const hasImage = ref(false)
const wordList = ref([])

// 配色方案
const colorThemes = {
  '翡翠': ['#22c55e', '#10b981', '#06b6d4', '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'],
  '暖阳': ['#f59e0b', '#f97316', '#ef4444', '#ec4899', '#8b5cf6', '#6366f1', '#0ea5e9', '#22c55e'],
  '海洋': ['#0ea5e9', '#06b6d4', '#22c55e', '#10b981', '#14b8a6', '#6366f1', '#8b5cf6', '#3b82f6'],
  '彩虹': ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6'],
  '夜空': ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#38bdf8', '#22d3ee', '#818cf8', '#e879f9'],
}

// 背景颜色选项
const bgColors = [
  { value: '#ffffff', label: '白色' },
  { value: '#f8fafc', label: '浅灰' },
  { value: '#1e293b', label: '深色' },
  { value: '#0f172a', label: '黑色' },
]

// 中文停用词
const cnStopWords = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也',
  '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '他', '她',
  '它', '们', '吗', '吧', '啊', '呢', '嗯', '哦', '哈', '呀', '什么', '那', '这个', '那个',
  '还', '可以', '没', '把', '让', '被', '从', '给', '对', '但', '而', '又', '与', '或', '如果',
  '因为', '所以', '但', '不过', '已经', '还是', '只', '更', '最', '能', '来', '得', '地',
  '过', '做', '用', '里', '后', '前', '中', '大', '小', '多', '少', '时', '个', '年',
  '为', '以', '及', '等', '其', '此', '之', '下', '当', '比', '向', '于', '可', '所',
])

// 英文停用词
const enStopWords = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall', 'can',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over', 'under',
  'again', 'further', 'then', 'once', 'and', 'but', 'or', 'nor', 'not', 'so', 'if',
  'it', 'its', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your',
  'he', 'him', 'his', 'she', 'her', 'they', 'them', 'their', 'what', 'which', 'who', 'whom',
])

/**
 * 文本分词与词频统计
 * 中文：按字和常见双字词进行统计
 * 英文：按空格分词
 */
function analyzeText(text) {
  const freq = {}

  // 英文分词
  const enWords = text.match(/[a-zA-Z]{2,}/g) || []
  for (const word of enWords) {
    const lower = word.toLowerCase()
    if (!enStopWords.has(lower) && lower.length >= 2) {
      freq[lower] = (freq[lower] || 0) + 1
    }
  }

  // 中文分词（按字和连续中文提取 2-4 字组合）
  const cnSegments = text.match(/[\u4e00-\u9fa5]{2,}/g) || []
  for (const seg of cnSegments) {
    // 单字统计（过滤停用词）
    for (let i = 0; i < seg.length; i++) {
      const ch = seg[i]
      if (!cnStopWords.has(ch)) {
        freq[ch] = (freq[ch] || 0) + 1
      }
    }
    // 双字组合统计
    for (let i = 0; i < seg.length - 1; i++) {
      const bigram = seg.substring(i, i + 2)
      if (!cnStopWords.has(bigram)) {
        freq[bigram] = (freq[bigram] || 0) + 1
      }
    }
    // 三字组合（过滤停用词组合）
    for (let i = 0; i < seg.length - 2; i++) {
      const trigram = seg.substring(i, i + 3)
      if (!cnStopWords.has(seg[i]) && !cnStopWords.has(seg[i + 1]) && !cnStopWords.has(seg[i + 2])) {
        freq[trigram] = (freq[trigram] || 0) + 1
      }
    }
  }

  // 转数组排序
  const result = Object.entries(freq)
    .map(([word, count]) => ({ word, count }))
    .filter(item => item.count >= 1)
    .sort((a, b) => b.count - a.count)

  return result
}

/**
 * 螺旋线放置算法生成词云
 */
function generateWordCloud() {
  const text = rawText.value.trim()
  if (!text) return

  // 分析词频
  const allWords = analyzeText(text)
  wordList.value = allWords.slice(0, maxWords.value)

  if (wordList.value.length === 0) return

  const canvas = cloudCanvas.value
  if (!canvas) return

  const dpr = window.devicePixelRatio || 1
  const containerWidth = canvas.parentElement.clientWidth - 48
  const canvasSize = Math.min(containerWidth, 700)
  const centerX = canvasSize / 2
  const centerY = canvasSize / 2

  canvas.width = canvasSize * dpr
  canvas.height = canvasSize * dpr
  canvas.style.width = canvasSize + 'px'
  canvas.style.height = canvasSize + 'px'

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  // 清除画布并填充背景
  ctx.fillStyle = bgColor.value
  ctx.fillRect(0, 0, canvasSize, canvasSize)

  const maxCount = wordList.value[0].count
  const minCount = wordList.value[wordList.value.length - 1].count
  const themeColors = colorThemes[selectedTheme.value]
  const placedRects = [] // 记录已放置词的矩形区域

  for (let i = 0; i < wordList.value.length; i++) {
    const item = wordList.value[i]
    // 根据词频映射字体大小（出现最多的最大，出现最少的最小）
    const ratio = maxCount === minCount ? 1 : (item.count - minCount) / (maxCount - minCount)
    const fontSize = Math.round(14 + ratio * 48)
    const fontWeight = ratio > 0.6 ? 'bold' : ratio > 0.3 ? '600' : 'normal'
    const color = themeColors[i % themeColors.length]

    ctx.font = `${fontWeight} ${fontSize}px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", system-ui, sans-serif`
    const metrics = ctx.measureText(item.word)
    const wordW = metrics.width + 8
    const wordH = fontSize + 6

    // 螺旋线搜索放置位置
    let placed = false
    const angleStep = 0.15
    const radiusStep = 1.5

    for (let r = 0; r < canvasSize / 2; r += radiusStep) {
      if (placed) break
      for (let angle = 0; angle < Math.PI * 2; angle += angleStep) {
        if (placed) break
        const x = centerX + r * Math.cos(angle) - wordW / 2
        const y = centerY + r * Math.sin(angle) - wordH / 2

        // 边界检查
        if (x < 4 || y < 4 || x + wordW > canvasSize - 4 || y + wordH > canvasSize - 4) continue

        // 碰撞检测
        let collision = false
        for (const rect of placedRects) {
          if (x < rect.x + rect.w + 3 && x + wordW + 3 > rect.x &&
              y < rect.y + rect.h + 2 && y + wordH + 2 > rect.y) {
            collision = true
            break
          }
        }

        if (!collision) {
          // 放置文字
          ctx.fillStyle = color
          ctx.font = `${fontWeight} ${fontSize}px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", system-ui, sans-serif`
          ctx.textBaseline = 'middle'
          ctx.textAlign = 'left'
          ctx.fillText(item.word, x + 4, y + wordH / 2)
          placedRects.push({ x, y, w: wordW, h: wordH })
          placed = true
        }
      }
    }
  }

  hasImage.value = true
}

/**
 * 导出词云为 PNG 图片
 */
function exportPNG() {
  const canvas = cloudCanvas.value
  if (!canvas) return
  const link = document.createElement('a')
  link.download = 'word-cloud.png'
  link.href = canvas.toDataURL('image/png')
  link.click()
}
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

.wordcloud-container {
  max-width: 740px;
  margin: 0 auto;
}

.input-row {
  margin-bottom: 1rem;
}

.input-row label {
  display: block;
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 0.4rem;
  font-weight: 500;
}

.hint {
  color: #aaa;
  font-weight: 400;
  font-size: 0.8rem;
}

.data-textarea {
  width: 100%;
  padding: 0.7rem 0.8rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: system-ui, sans-serif;
  outline: none;
  transition: border-color 0.2s;
  resize: vertical;
  box-sizing: border-box;
  line-height: 1.6;
}

.data-textarea:focus {
  border-color: #22c55e;
}

.settings-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1.2rem;
  margin-bottom: 1rem;
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

.theme-selector {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.theme-selector button {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.7rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.theme-selector button.active {
  border-color: #22c55e;
  background: #f0fdf4;
}

.theme-dots {
  display: flex;
  gap: 2px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.theme-name {
  color: #555;
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

.bg-options {
  display: flex;
  gap: 0.4rem;
}

.bg-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.bg-btn.active {
  box-shadow: 0 0 0 2px #22c55e;
  transform: scale(1.15);
}

.action-row {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.btn-generate {
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

.btn-generate:hover {
  opacity: 0.85;
}

.btn-export {
  padding: 0.6rem 1.5rem;
  border-radius: 8px;
  border: 2px solid #22c55e;
  background: white;
  color: #22c55e;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-export:hover {
  background: #f0fdf4;
}

.preview-area {
  background: #fafafa;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: center;
}

.preview-area canvas {
  max-width: 100%;
  border-radius: 4px;
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

.stats-section {
  margin-bottom: 1.5rem;
}

.stats-section h3 {
  font-size: 1rem;
  color: #555;
  margin-bottom: 0.75rem;
}

.word-stats {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.85rem;
}

.stat-rank {
  width: 22px;
  text-align: right;
  color: #aaa;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.stat-word {
  width: 60px;
  font-weight: 600;
  color: #333;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-bar-wrap {
  flex: 1;
  height: 14px;
  background: #f0f0f0;
  border-radius: 7px;
  overflow: hidden;
}

.stat-bar {
  height: 100%;
  border-radius: 7px;
  min-width: 4px;
  transition: width 0.3s ease;
}

.stat-count {
  width: 45px;
  text-align: right;
  color: #888;
  font-size: 0.8rem;
  flex-shrink: 0;
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
  .action-row {
    flex-direction: column;
  }
  .stat-word {
    width: 45px;
  }
}
</style>
