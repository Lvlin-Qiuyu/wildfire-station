<template>
  <div class="tool-page">
    <h2>🚫 违禁词检测器</h2>
    <p class="subtitle">检测文案中的违禁词和敏感词，支持小红书/抖音/微博多平台规则，纯前端离线检测</p>

    <!-- 输入区域 -->
    <div class="input-section">
      <textarea
        v-model="text"
        placeholder="在此粘贴或输入要检测的文案内容..."
        rows="6"
        spellcheck="false"
      ></textarea>
    </div>

    <!-- 平台选择 -->
    <div class="platform-section">
      <label>检测平台</label>
      <div class="platform-btns">
        <button
          v-for="p in platforms"
          :key="p.id"
          :class="['platform-btn', { active: selectedPlatforms.includes(p.id) }]"
          @click="togglePlatform(p.id)"
        >
          {{ p.icon }} {{ p.name }}
        </button>
      </div>
    </div>

    <!-- 检测按钮 -->
    <div class="action-row">
      <button class="btn-primary" @click="checkText" :disabled="!text.trim()">🔍 开始检测</button>
      <button class="btn-sm" @click="clearAll">清空</button>
    </div>

    <!-- 检测结果 -->
    <div v-if="results.length > 0" class="results-section">
      <div class="section-header">
        <h3>📋 检测结果</h3>
        <span class="result-count">发现 {{ results.length }} 处风险</span>
      </div>

      <!-- 高亮预览 -->
      <div class="highlight-preview">
        <span v-for="(segment, i) in highlightedSegments" :key="i" :class="segment.type">
          {{ segment.text }}
        </span>
      </div>

      <!-- 风险列表 -->
      <div class="risk-list">
        <div v-for="(item, i) in results" :key="i" :class="['risk-card', item.level]">
          <div class="risk-header">
            <span :class="['risk-badge', item.level]">{{ levelLabel(item.level) }}</span>
            <span class="risk-word">{{ item.word }}</span>
          </div>
          <div class="risk-detail">
            <span class="risk-category">{{ item.category }}</span>
            <span v-if="item.suggestion" class="risk-suggestion">💡 替换建议：{{ item.suggestion }}</span>
          </div>
          <div class="risk-platforms">
            <span v-for="p in item.platforms" :key="p" class="risk-platform-tag">{{ p }}</span>
          </div>
        </div>
      </div>

      <!-- 一键替换 -->
      <div class="action-row">
        <button class="btn-primary" @click="autoReplace">✏️ 自动替换（保守模式）</button>
      </div>

      <!-- 替换后文本 -->
      <div v-if="replacedText" class="replaced-section">
        <div class="section-header">
          <h3>✅ 替换后文本</h3>
          <button class="btn-sm" @click="copyReplaced">📋 复制</button>
        </div>
        <div class="replaced-preview">{{ replacedText }}</div>
      </div>

      <!-- 统计概览 -->
      <div class="stats-overview">
        <div class="stat-item danger">
          <span class="stat-num">{{ dangerCount }}</span>
          <span class="stat-label">高风险</span>
        </div>
        <div class="stat-item warning">
          <span class="stat-num">{{ warningCount }}</span>
          <span class="stat-label">中风险</span>
        </div>
        <div class="stat-item info">
          <span class="stat-num">{{ infoCount }}</span>
          <span class="stat-label">低风险</span>
        </div>
        <div class="stat-item safe">
          <span class="stat-num">{{ safeScore }}</span>
          <span class="stat-label">安全评分</span>
        </div>
      </div>
    </div>

    <!-- 安全提示 -->
    <div v-if="results.length === 0 && hasChecked" class="safe-section">
      <span class="safe-icon">✅</span>
      <p>文案通过检测，未发现违禁词和敏感词</p>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '违禁词检测器 - 野火小站' })

const text = ref('')
const results = ref([])
const replacedText = ref('')
const hasChecked = ref(false)
const selectedPlatforms = ref(['xiaohongshu', 'douyin', 'weibo'])

// 平台列表
const platforms = [
  { id: 'xiaohongshu', name: '小红书', icon: '📕' },
  { id: 'douyin', name: '抖音', icon: '🎵' },
  { id: 'weibo', name: '微博', icon: '📢' },
  { id: 'wechat', name: '微信', icon: '💬' },
]

function togglePlatform(id) {
  const idx = selectedPlatforms.value.indexOf(id)
  if (idx >= 0) {
    if (selectedPlatforms.value.length > 1) {
      selectedPlatforms.value.splice(idx, 1)
    }
  } else {
    selectedPlatforms.value.push(id)
  }
}

// 违禁词库（分类）
const wordDatabase = [
  // === 绝对违禁词（高风险）===
  { word: '最', level: 'danger', category: '极限词', platforms: ['xiaohongshu', 'douyin', 'weibo', 'wechat'], suggestion: '去掉或改为"很"' },
  { word: '最佳', level: 'danger', category: '极限词', platforms: ['xiaohongshu', 'douyin', 'weibo', 'wechat'], suggestion: '改为"很好"' },
  { word: '最好', level: 'danger', category: '极限词', platforms: ['xiaohongshu', 'douyin', 'weibo', 'wechat'], suggestion: '改为"很好"' },
  { word: '第一', level: 'danger', category: '极限词', platforms: ['xiaohongshu', 'douyin', 'weibo', 'wechat'], suggestion: '改为"前列"' },
  { word: '首个', level: 'danger', category: '极限词', platforms: ['xiaohongshu', 'douyin', 'weibo', 'wechat'], suggestion: '改为"之一"' },
  { word: '唯一', level: 'danger', category: '极限词', platforms: ['xiaohongshu', 'douyin', 'weibo', 'wechat'], suggestion: '改为"独特"' },
  { word: '首个', level: 'danger', category: '极限词', platforms: ['xiaohongshu', 'douyin', 'weibo', 'wechat'], suggestion: '改为"之一"' },
  { word: '第一品牌', level: 'danger', category: '极限词', platforms: ['xiaohongshu', 'douyin', 'weibo', 'wechat'], suggestion: '改为"知名品牌"' },
  { word: '顶级', level: 'danger', category: '极限词', platforms: ['xiaohongshu', 'douyin', 'weibo', 'wechat'], suggestion: '改为"高端"' },
  { word: '极致', level: 'danger', category: '极限词', platforms: ['xiaohongshu', 'douyin', 'weibo', 'wechat'], suggestion: '改为"出色"' },
  { word: '绝对', level: 'danger', category: '极限词', platforms: ['xiaohongshu', 'douyin', 'weibo', 'wechat'], suggestion: '改为"非常"' },
  { word: '极品', level: 'danger', category: '极限词', platforms: ['xiaohongshu', 'douyin', 'weibo', 'wechat'], suggestion: '改为"优质"' },
  { word: '史上最', level: 'danger', category: '极限词', platforms: ['xiaohongshu', 'douyin', 'weibo', 'wechat'], suggestion: '去掉' },
  { word: '全网最', level: 'danger', category: '极限词', platforms: ['xiaohongshu', 'douyin', 'weibo'], suggestion: '去掉' },
  { word: '最便宜', level: 'danger', category: '价格违规', platforms: ['xiaohongshu', 'douyin', 'weibo', 'wechat'], suggestion: '改为"超值"' },
  { word: '最低价', level: 'danger', category: '价格违规', platforms: ['xiaohongshu', 'douyin', 'weibo', 'wechat'], suggestion: '改为"优惠"' },
  { word: '国家级', level: 'danger', category: '虚假宣传', platforms: ['xiaohongshu', 'douyin', 'weibo', 'wechat'], suggestion: '去掉' },
  { word: '世界级', level: 'danger', category: '极限词', platforms: ['xiaohongshu', 'douyin', 'weibo', 'wechat'], suggestion: '改为"国际"' },
  { word: '销量冠军', level: 'danger', category: '虚假宣传', platforms: ['xiaohongshu', 'douyin', 'weibo', 'wechat'], suggestion: '改为"热销"' },
  { word: '鼻祖', level: 'danger', category: '极限词', platforms: ['xiaohongshu', 'douyin', 'weibo', 'wechat'], suggestion: '改为"先驱"' },
  { word: '之王', level: 'danger', category: '极限词', platforms: ['xiaohongshu', 'douyin', 'weibo', 'wechat'], suggestion: '改为"佳品"' },
  { word: '万能', level: 'danger', category: '极限词', platforms: ['xiaohongshu', 'douyin', 'weibo', 'wechat'], suggestion: '改为"多功能"' },
  { word: '秒杀', level: 'danger', category: '促销违规', platforms: ['xiaohongshu', 'douyin', 'weibo', 'wechat'], suggestion: '改为"超值特惠"' },
  { word: '抢疯了', level: 'danger', category: '营销违规', platforms: ['xiaohongshu', 'douyin'], suggestion: '改为"热门"' },
  { word: '疯抢', level: 'danger', category: '营销违规', platforms: ['xiaohongshu', 'douyin'], suggestion: '改为"热购"' },
  { word: '加微信', level: 'danger', category: '引流违规', platforms: ['xiaohongshu', 'douyin', 'weibo'], suggestion: '改为"私信我"' },
  { word: '加V', level: 'danger', category: '引流违规', platforms: ['xiaohongshu', 'douyin'], suggestion: '改为"私信我"' },
  { word: '加粉', level: 'danger', category: '引流违规', platforms: ['xiaohongshu', 'douyin', 'weibo'], suggestion: '改为"关注我"' },
  { word: '微信号', level: 'danger', category: '引流违规', platforms: ['xiaohongshu', 'douyin', 'weibo'], suggestion: '避免直接写微信号' },

  // === 敏感词（中风险）===
  { word: '很好用', level: 'warning', category: '疑似推广', platforms: ['xiaohongshu', 'douyin'], suggestion: '改为"体验不错"' },
  { word: '超好用', level: 'warning', category: '疑似推广', platforms: ['xiaohongshu', 'douyin'], suggestion: '改为"用着不错"' },
  { word: '强烈推荐', level: 'warning', category: '疑似推广', platforms: ['xiaohongshu', 'douyin'], suggestion: '改为"推荐"' },
  { word: '必备', level: 'warning', category: '营销用语', platforms: ['xiaohongshu', 'douyin', 'weibo'], suggestion: '改为"推荐"' },
  { word: '必买', level: 'warning', category: '营销用语', platforms: ['xiaohongshu', 'douyin', 'weibo'], suggestion: '改为"值得入手"' },
  { word: '爆款', level: 'warning', category: '营销用语', platforms: ['xiaohongshu', 'douyin', 'weibo'], suggestion: '改为"热门"' },
  { word: '神器', level: 'warning', category: '营销用语', platforms: ['xiaohongshu', 'douyin'], suggestion: '改为"好物"' },
  { word: '种草', level: 'warning', category: '营销用语', platforms: ['weibo', 'wechat'], suggestion: '改为"推荐"' },
  { word: '赶紧买', level: 'warning', category: '促销违规', platforms: ['xiaohongshu', 'douyin', 'weibo'], suggestion: '改为"可以考虑"' },
  { word: '不买后悔', level: 'warning', category: '促销违规', platforms: ['xiaohongshu', 'douyin', 'weibo'], suggestion: '改为"值得拥有"' },
  { word: '大牌同款', level: 'warning', category: '侵权风险', platforms: ['xiaohongshu', 'douyin'], suggestion: '改为"平替好物"' },
  { word: '高仿', level: 'warning', category: '侵权风险', platforms: ['xiaohongshu', 'douyin', 'weibo'], suggestion: '避免使用' },
  { word: '原单', level: 'warning', category: '侵权风险', platforms: ['xiaohongshu', 'douyin'], suggestion: '避免使用' },
  { word: '代购', level: 'warning', category: '经营许可', platforms: ['xiaohongshu', 'douyin', 'weibo'], suggestion: '改为"分享"' },
  { word: '包邮', level: 'warning', category: '营销用语', platforms: ['xiaohongshu'], suggestion: '小红书限制明确标价' },
  { word: '特价', level: 'warning', category: '价格违规', platforms: ['xiaohongshu', 'douyin'], suggestion: '改为"优惠"' },
  { word: '只要', level: 'warning', category: '价格诱导', platforms: ['xiaohongshu', 'douyin'], suggestion: '改为"仅需"' },

  // === 注意词（低风险）===
  { word: '真的', level: 'info', category: '口语化', platforms: ['xiaohongshu', 'douyin'], suggestion: '保留或改为"确实"' },
  { word: '绝了', level: 'info', category: '口语化', platforms: ['xiaohongshu', 'douyin'], suggestion: '改为"太棒了"' },
  { word: '太好吃了', level: 'info', category: '口语化', platforms: ['xiaohongshu'], suggestion: '改为"味道很好"' },
  { word: '太美了', level: 'info', category: '口语化', platforms: ['xiaohongshu'], suggestion: '改为"很漂亮"' },
  { word: '买它', level: 'info', category: '口语化', platforms: ['xiaohongshu', 'douyin'], suggestion: '改为"推荐"' },
  { word: '码住', level: 'info', category: '平台用语', platforms: ['weibo'], suggestion: '保留' },
  { word: '收藏', level: 'info', category: '平台用语', platforms: ['xiaohongshu', 'douyin'], suggestion: '保留' },
  { word: '关注', level: 'info', category: '平台用语', platforms: ['xiaohongshu', 'douyin', 'weibo'], suggestion: '保留' },
]

function levelLabel(level) {
  const map = { danger: '高风险', warning: '中风险', info: '低风险' }
  return map[level] || ''
}

// 检测文案
function checkText() {
  const content = text.value
  if (!content.trim()) return

  const found = []
  const checkedWords = new Set()

  for (const item of wordDatabase) {
    // 检查该违禁词是否适用于选中的平台
    const applicablePlatforms = item.platforms.filter(p => selectedPlatforms.value.includes(p))
    if (applicablePlatforms.length === 0) continue

    // 搜索所有出现位置
    const regex = new RegExp(escapeRegex(item.word), 'gi')
    let match
    while ((match = regex.exec(content)) !== null) {
      const key = `${item.word}_${match.index}`
      if (!checkedWords.has(key)) {
        checkedWords.add(key)
        found.push({
          word: match[0],
          index: match.index,
          level: item.level,
          category: item.category,
          platforms: applicablePlatforms,
          suggestion: item.suggestion,
          originalWord: item.word,
        })
      }
    }
  }

  results.value = found.sort((a, b) => {
    const order = { danger: 0, warning: 1, info: 2 }
    return order[a.level] - order[b.level] || a.index - b.index
  })

  replacedText.value = ''
  hasChecked.value = true
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// 高亮文本片段
const highlightedSegments = computed(() => {
  if (results.value.length === 0) return [{ text: text.value, type: 'normal' }]

  const segments = []
  let lastIndex = 0
  const sorted = [...results.value].sort((a, b) => a.index - b.index)

  for (const result of sorted) {
    if (result.index > lastIndex) {
      segments.push({ text: text.value.slice(lastIndex, result.index), type: 'normal' })
    }
    segments.push({ text: result.word, type: result.level })
    lastIndex = result.index + result.word.length
  }

  if (lastIndex < text.value.length) {
    segments.push({ text: text.value.slice(lastIndex), type: 'normal' })
  }

  return segments
})

// 统计
const dangerCount = computed(() => results.value.filter(r => r.level === 'danger').length)
const warningCount = computed(() => results.value.filter(r => r.level === 'warning').length)
const infoCount = computed(() => results.value.filter(r => r.level === 'info').length)
const safeScore = computed(() => {
  const len = text.value.length
  if (len === 0) return 100
  const penalties = results.value.reduce((sum, r) => {
    return sum + (r.level === 'danger' ? 10 : r.level === 'warning' ? 3 : 1)
  }, 0)
  return Math.max(0, Math.round(100 - penalties * (50 / Math.max(1, len / 50))))
})

// 自动替换
function autoReplace() {
  let result = text.value
  const replacements = []

  // 按索引倒序替换，避免位移
  const sorted = [...results.value].filter(r => r.suggestion && r.level === 'danger').sort((a, b) => b.index - a.index)
  const uniqueMap = new Map()
  for (const r of sorted) {
    if (!uniqueMap.has(r.word)) {
      uniqueMap.set(r.word, r.suggestion)
    }
  }

  // 简单替换（从长词到短词避免部分替换问题）
  const words = [...uniqueMap.keys()].sort((a, b) => b.length - a.length)
  for (const word of words) {
    const replacement = uniqueMap.get(word)
    result = result.replaceAll(word, replacement)
  }

  replacedText.value = result
}

function copyReplaced() {
  if (!replacedText.value) return
  navigator.clipboard.writeText(replacedText.value).then(() => {
    alert('已复制替换后文本')
  })
}

function clearAll() {
  text.value = ''
  results.value = []
  replacedText.value = ''
  hasChecked.value = false
}
</script>

<style scoped>
.tool-page {
  padding-top: 0.5rem;
  max-width: 760px;
  margin: 0 auto;
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

/* 输入区 */
.input-section {
  margin-bottom: 1.2rem;
}

textarea {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 0.95rem;
  resize: vertical;
  box-sizing: border-box;
  font-family: inherit;
  line-height: 1.6;
}

textarea:focus {
  border-color: #22c55e;
  outline: none;
}

/* 平台选择 */
.platform-section {
  margin-bottom: 1.2rem;
}

.platform-section label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.platform-btns {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.platform-btn {
  padding: 0.45rem 0.9rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.platform-btn.active {
  background: #f0fdf4;
  border-color: #22c55e;
  color: #22c55e;
}

.platform-btn:hover:not(.active) {
  border-color: #22c55e;
}

/* 按钮 */
.btn-primary {
  padding: 0.6rem 1.4rem;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-primary:hover { opacity: 0.85; }
.btn-primary:active { transform: scale(0.95); }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-sm {
  padding: 0.5rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-sm:hover { border-color: #22c55e; color: #22c55e; }

.action-row {
  display: flex;
  gap: 0.8rem;
  margin-bottom: 1.5rem;
}

/* 结果区 */
.results-section {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.section-header h3 {
  font-size: 1.1rem;
  margin-bottom: 0;
}

.result-count {
  font-size: 0.85rem;
  color: #ef4444;
  font-weight: 600;
}

/* 高亮预览 */
.highlight-preview {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  line-height: 1.8;
  font-size: 0.95rem;
  word-break: break-all;
}

.highlight-preview .danger {
  background: #fecaca;
  color: #dc2626;
  padding: 1px 3px;
  border-radius: 3px;
  text-decoration: line-through;
}

.highlight-preview .warning {
  background: #fef3c7;
  color: #92400e;
  padding: 1px 3px;
  border-radius: 3px;
  border-bottom: 2px solid #f59e0b;
}

.highlight-preview .info {
  background: #e0f2fe;
  color: #0369a1;
  padding: 1px 3px;
  border-radius: 3px;
  border-bottom: 2px dashed #38bdf8;
}

/* 风险列表 */
.risk-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1.5rem;
}

.risk-card {
  background: white;
  border-radius: 10px;
  padding: 1rem;
  border: 1px solid #f0f0f0;
}

.risk-card.danger { border-left: 4px solid #ef4444; }
.risk-card.warning { border-left: 4px solid #f59e0b; }
.risk-card.info { border-left: 4px solid #38bdf8; }

.risk-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.4rem;
}

.risk-badge {
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.risk-badge.danger { background: #fef2f2; color: #ef4444; }
.risk-badge.warning { background: #fffbeb; color: #f59e0b; }
.risk-badge.info { background: #f0f9ff; color: #38bdf8; }

.risk-word {
  font-weight: 700;
  font-size: 1rem;
  color: #2c3e50;
}

.risk-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  font-size: 0.85rem;
  margin-bottom: 0.4rem;
}

.risk-category {
  color: #888;
}

.risk-suggestion {
  color: #22c55e;
}

.risk-platforms {
  display: flex;
  gap: 0.3rem;
}

.risk-platform-tag {
  font-size: 0.75rem;
  padding: 0.1rem 0.4rem;
  background: #f3f4f6;
  border-radius: 4px;
  color: #666;
}

/* 替换后 */
.replaced-section {
  margin-bottom: 2rem;
}

.replaced-preview {
  background: #f0fdf4;
  border: 1px solid #22c55e;
  border-radius: 10px;
  padding: 1rem;
  line-height: 1.8;
  font-size: 0.95rem;
  word-break: break-all;
  white-space: pre-wrap;
}

/* 统计概览 */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.8rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  border-radius: 10px;
}

.stat-item.danger { background: #fef2f2; }
.stat-item.warning { background: #fffbeb; }
.stat-item.info { background: #f0f9ff; }
.stat-item.safe { background: #f0fdf4; }

.stat-num {
  display: block;
  font-size: 1.6rem;
  font-weight: bold;
}

.stat-item.danger .stat-num { color: #ef4444; }
.stat-item.warning .stat-num { color: #f59e0b; }
.stat-item.info .stat-num { color: #38bdf8; }
.stat-item.safe .stat-num { color: #22c55e; }

.stat-label {
  font-size: 0.8rem;
  color: #888;
}

/* 安全提示 */
.safe-section {
  text-align: center;
  padding: 2rem;
  background: #f0fdf4;
  border-radius: 12px;
  margin-bottom: 2rem;
}

.safe-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 0.5rem;
}

.safe-section p {
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
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
  }
  .action-row {
    flex-direction: column;
  }
  .platform-btns {
    gap: 0.3rem;
  }
  .platform-btn {
    padding: 0.4rem 0.7rem;
    font-size: 0.8rem;
  }
}
</style>
