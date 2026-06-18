<template>
  <div class="tool-page">
    <h2>✏️ 社交文案助手</h2>
    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>

    <div class="input-section">
      <textarea v-model="text" placeholder="输入文案内容..." rows="6" spellcheck="false"></textarea>
    </div>

    <!-- 统计信息 -->
    <div v-if="text" class="stats">
      <div class="stat-card">
        <span class="stat-num">{{ charCount }}</span>
        <span class="stat-label">字符数</span>
      </div>
      <div class="stat-card">
        <span class="stat-num">{{ wordCount }}</span>
        <span class="stat-label">字数</span>
      </div>
      <div class="stat-card">
        <span class="stat-num">{{ segmentCount }}</span>
        <span class="stat-label">词数</span>
      </div>
      <div class="stat-card">
        <span class="stat-num">{{ lineCount }}</span>
        <span class="stat-label">行数</span>
      </div>
      <div class="stat-card">
        <span class="stat-num">{{ emojiCount }}</span>
        <span class="stat-label">Emoji</span>
      </div>
    </div>

    <!-- Emoji 分析 -->
    <div v-if="emojis.length" class="section">
      <h3>😀 Emoji 分析</h3>
      <div class="emoji-list">
        <div v-for="(e, idx) in emojis" :key="idx" class="emoji-item">
          <span class="emoji-char">{{ e.char }}</span>
          <span class="emoji-count">× {{ e.count }}</span>
        </div>
      </div>
    </div>

    <!-- Hashtag 建议 -->
    <div v-if="hashtags.length" class="section">
      <div class="section-header">
        <h3># Hashtag 建议</h3>
        <button class="btn-copy" @click="copyHashtags">📋 复制全部</button>
      </div>
      <div class="hashtag-list">
        <span v-for="(tag, idx) in hashtags" :key="idx" class="hashtag" @click="copyOne(tag)">#{{ tag }}</span>
      </div>
    </div>

    <!-- 平台限制 -->
    <div v-if="text" class="section">
      <h3>📱 平台限制检查</h3>
      <div class="platform-list">
        <div v-for="p in platformChecks" :key="p.name" :class="['platform-card', p.status]">
          <span class="platform-name">{{ p.name }}</span>
          <span class="platform-limit">{{ p.limit }}</span>
          <span class="platform-bar">
            <span class="bar-fill" :style="{ width: p.percent + '%' }"></span>
          </span>
          <span class="platform-status">{{ p.status === 'ok' ? '✅' : '⚠️' }} {{ p.statusText }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

useHead({ title: '社交文案助手 - 野火小站' })

const text = ref('')

const charCount = computed(() => text.value.length)
const wordCount = computed(() => {
  if (!text.value.trim()) return 0
  // 中文字 + 英文单词
  const chinese = (text.value.match(/[\u4e00-\u9fff]/g) || []).length
  const english = (text.value.match(/[a-zA-Z]+/g) || []).length
  return chinese + english
})
const segmentCount = computed(() => {
  if (!text.value.trim()) return 0
  return text.value.trim().split(/\s+/).length
})
const lineCount = computed(() => {
  if (!text.value) return 0
  return text.value.split('\n').length
})

const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu

const emojiCount = computed(() => (text.value.match(emojiRegex) || []).length)

const emojis = computed(() => {
  const matches = text.value.match(emojiRegex) || []
  const map = new Map()
  for (const m of matches) map.set(m, (map.get(m) || 0) + 1)
  return Array.from(map.entries()).map(([char, count]) => ({ char, count })).sort((a, b) => b.count - a.count)
})

const hashtags = computed(() => {
  const existing = new Set((text.value.match(/#[^\s#]+/g) || []).map(t => t.slice(1)))
  const chinese = (text.value.match(/[\u4e00-\u9fff]{2,}/g) || [])
  const english = (text.value.match(/[a-zA-Z]{3,}/g) || []).map(w => w.toLowerCase())
  const tags = [...new Set([...chinese, ...english])].filter(t => !existing.has(t)).slice(0, 10)
  return tags
})

const platformChecks = computed(() => {
  const len = charCount.value
  return [
    { name: '微博正文', limit: `0/${2000}`, percent: Math.min(100, (len / 2000) * 100), status: len <= 2000 ? 'ok' : 'warn', statusText: len <= 2000 ? `剩余 ${2000 - len} 字` : `超出 ${len - 2000} 字` },
    { name: '微博标题', limit: `0/${50}`, percent: Math.min(100, (len / 50) * 100), status: len <= 50 ? 'ok' : 'warn', statusText: len <= 50 ? `剩余 ${50 - len} 字` : `超出 ${len - 50} 字` },
    { name: '微信标题', limit: `0/${64}`, percent: Math.min(100, (len / 64) * 100), status: len <= 64 ? 'ok' : 'warn', statusText: len <= 64 ? `剩余 ${64 - len} 字` : `超出 ${len - 64} 字` },
    { name: '微信内容', limit: `0/${20000}`, percent: Math.min(100, (len / 20000) * 100), status: len <= 20000 ? 'ok' : 'warn', statusText: len <= 20000 ? `剩余 ${20000 - len} 字` : `超出 ${len - 20000} 字` },
    { name: 'Twitter/X', limit: `0/${280}`, percent: Math.min(100, (segmentCount.value / 280) * 100), status: segmentCount.value <= 280 ? 'ok' : 'warn', statusText: segmentCount.value <= 280 ? `剩余 ${280 - segmentCount.value}` : `超出 ${segmentCount.value - 280}` },
    { name: '小红书标题', limit: `0/${20}`, percent: Math.min(100, (wordCount.value / 20) * 100), status: wordCount.value <= 20 ? 'ok' : 'warn', statusText: wordCount.value <= 20 ? `剩余 ${20 - wordCount.value} 字` : `超出 ${wordCount.value - 20} 字` },
  ]
})

function copyHashtags() {
  const t = hashtags.value.map(h => `#${h}`).join(' ')
  navigator.clipboard.writeText(t)
}

function copyOne(tag) {
  navigator.clipboard.writeText(`#${tag}`)
}
</script>

<style scoped>
.tool-page { max-width: 700px; margin: 0 auto; padding: 20px; }
.back-link { display: inline-block; margin-bottom: 16px; color: #10b981; text-decoration: none; }
.back-link:hover { text-decoration: underline; }
h2 { color: #1a1a2e; margin-bottom: 20px; }
.input-section { margin-bottom: 20px; }
textarea { width: 100%; padding: 14px; border: 2px solid #ddd; border-radius: 10px; font-size: 15px; resize: vertical; box-sizing: border-box; }
textarea:focus { border-color: #22c55e; outline: none; }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 10px; margin-bottom: 20px; }
.stat-card { text-align: center; padding: 14px 8px; background: #f0fdf4; border-radius: 10px; }
.stat-num { display: block; font-size: 28px; font-weight: bold; color: #22c55e; }
.stat-label { font-size: 12px; color: #555; }
.section { margin-bottom: 20px; }
.section h3 { font-size: 16px; color: #1a1a2e; margin-bottom: 10px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.section-header h3 { margin-bottom: 0; }
.btn-copy { padding: 6px 14px; background: #10b981; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; }
.btn-copy:hover { background: #059669; }
.emoji-list { display: flex; flex-wrap: wrap; gap: 10px; }
.emoji-item { display: flex; align-items: center; gap: 4px; padding: 6px 12px; background: #fef3c7; border-radius: 8px; }
.emoji-char { font-size: 24px; }
.emoji-count { font-size: 14px; color: #92400e; font-weight: bold; }
.hashtag-list { display: flex; flex-wrap: wrap; gap: 8px; }
.hashtag { padding: 6px 14px; background: #e0f2fe; color: #0369a1; border-radius: 20px; cursor: pointer; font-size: 14px; transition: all 0.2s; }
.hashtag:hover { background: #22c55e; color: #fff; }
.platform-list { display: flex; flex-direction: column; gap: 8px; }
.platform-card { padding: 12px 16px; border-radius: 10px; display: grid; grid-template-columns: auto 1fr auto; gap: 8px; align-items: center; }
.platform-card.ok { background: #f0fdf4; }
.platform-card.warn { background: #fffbeb; }
.platform-name { font-weight: bold; font-size: 14px; min-width: 80px; }
.platform-limit { font-size: 12px; color: #888; }
.platform-bar { height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
.platform-card.ok .bar-fill { background: #22c55e; }
.platform-card.warn .bar-fill { background: #f59e0b; }
.platform-status { font-size: 13px; min-width: 100px; text-align: right; }
@media (max-width: 600px) { .tool-page { padding: 12px; } .stats { grid-template-columns: repeat(3, 1fr); } }
</style>
