<template>
  <div class="tool-page xhs-editor">
    <h2>📱 小红书笔记排版助手</h2>
    <p class="subtitle">左栏编辑内容，右栏实时预览小红书笔记卡片效果</p>

    <div class="editor-layout">
      <!-- 左栏：编辑器 -->
      <div class="edit-panel">
        <!-- 基本信息输入 -->
        <div class="input-group">
          <label>标题</label>
          <input v-model="title" placeholder="输入笔记标题（建议20字以内）" maxlength="30" />
          <span class="char-count">{{ title.length }}/30</span>
        </div>

        <div class="input-group">
          <label>正文内容</label>
          <textarea
            v-model="body"
            placeholder="输入正文内容...&#10;支持使用 [emoji] 标签自动替换表情&#10;换行会自动分段"
            rows="10"
            spellcheck="false"
          ></textarea>
          <span class="char-count">{{ body.length }} 字符</span>
        </div>

        <div class="input-group">
          <label>话题标签 <span class="hint">（用空格分隔，不需要加 #）</span></label>
          <input v-model="tagsInput" placeholder="例如：好物推荐 生活日常 美食" />
        </div>

        <!-- Emoji 快捷插入 -->
        <div class="emoji-section">
          <div class="section-header">
            <label>😊 快捷插入 Emoji</label>
          </div>
          <div class="emoji-categories">
            <button
              v-for="cat in emojiCategories"
              :key="cat.name"
              :class="{ active: activeEmojiCat === cat.name }"
              @click="activeEmojiCat = cat.name"
            >{{ cat.icon }} {{ cat.name }}</button>
          </div>
          <div class="emoji-grid">
            <button
              v-for="emoji in currentEmojis"
              :key="emoji"
              class="emoji-btn"
              @click="insertEmoji(emoji)"
              :title="emoji"
            >{{ emoji }}</button>
          </div>
        </div>

        <!-- 格式工具 -->
        <div class="format-section">
          <label>🔧 格式工具</label>
          <div class="format-buttons">
            <button @click="addSeparator">➖ 插入分隔线</button>
            <button @click="addHighlight">✨ 插入高亮文字</button>
            <button @click="addList">📝 插入列表</button>
            <button @click="copyContent">📋 复制全文</button>
          </div>
        </div>
      </div>

      <!-- 右栏：预览 -->
      <div class="preview-panel">
        <div class="phone-frame">
          <div class="phone-header">
            <span class="phone-notch"></span>
          </div>
          <div class="phone-content">
            <!-- 用户信息 -->
            <div class="xhs-user">
              <div class="avatar">📱</div>
              <div class="user-info">
                <span class="username">小红书用户</span>
                <span class="post-time">{{ currentTime }}</span>
              </div>
              <button class="follow-btn">+ 关注</button>
            </div>

            <!-- 标题 -->
            <h3 class="xhs-title" v-if="title">{{ title }}</h3>

            <!-- 正文 -->
            <div class="xhs-body" v-if="parsedBody">
              <p v-for="(para, i) in parsedBody" :key="i" :class="{ separator: para.isSeparator, highlight: para.isHighlight, list-item: para.isListItem }">
                <span v-if="para.isSeparator" class="sep-line">- - - - - - - - - -</span>
                <span v-else-if="para.isHighlight" class="highlight-text">✨ {{ para.text }}</span>
                <span v-else-if="para.isListItem" class="list-text">📝 {{ para.text }}</span>
                <span v-else>{{ formatTextSafe(para.text) }}</span>
              </p>
            </div>

            <!-- 标签 -->
            <div class="xhs-tags" v-if="parsedTags.length">
              <span class="xhs-tag" v-for="tag in parsedTags" :key="tag">#{{ tag }}</span>
            </div>

            <!-- 底部操作栏 -->
            <div class="xhs-actions">
              <div class="action-btn"><span>❤️</span><span>赞</span></div>
              <div class="action-btn"><span>💬</span><span>评论</span></div>
              <div class="action-btn"><span>⭐</span><span>收藏</span></div>
              <div class="action-btn"><span>↗️</span><span>分享</span></div>
            </div>
          </div>
        </div>

        <!-- 预览统计 -->
        <div class="preview-stats">
          <div class="stat-item">
            <span class="stat-label">标题字数</span>
            <span class="stat-value" :class="{ warn: title.length > 20 }">{{ title.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">正文行数</span>
            <span class="stat-value">{{ parsedBody.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">标签数</span>
            <span class="stat-value" :class="{ warn: parsedTags.length > 10 }">{{ parsedTags.length }}</span>
          </div>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '小红书笔记排版助手 - 野火小站' })

const title = ref('')
const body = ref('')
const tagsInput = ref('')
const activeEmojiCat = ref('常用')

// 当前时间
const currentTime = computed(() => {
  const now = new Date()
  return `${now.getMonth() + 1}月${now.getDate()}日`
})

// Emoji 分类
const emojiCategories = [
  { name: '常用', icon: '⭐', emojis: ['✨', '🔥', '💡', '❤️', '👍', '🎉', '🎯', '💪', '🌟', '😊', '🥰', '😘', '🤩', '💕', '🎀', '🌈', '☀️', '🍀', '🎈', '⭐'] },
  { name: '美食', icon: '🍔', emojis: ['🍔', '🍕', '🍜', '🍣', '🍰', '🧋', '☕', '🥤', '🍦', '🍩', '🥐', '🌮', '🍱', '🥗', '🍜', '🍖', '🧁', '🍪', '🍗', '🥘'] },
  { name: '旅行', icon: '✈️', emojis: ['✈️', '🌍', '🗺️', '📸', '🏖️', '🏔️', '🌅', '🏙️', '🌆', '🏕️', '🧳', '🚗', '🚂', '⛵', '🗼', '🏰', '🌴', '🌺', '🎐', '🎆'] },
  { name: '生活', icon: '🏠', emojis: ['🏠', '🛋️', '📚', '🎧', '💻', '📱', '🎮', '🎬', '🎭', '🎨', '🏋️', '🧘', '🛍️', '💄', '👗', '👠', '👜', '💎', '🐱', '🐶'] },
  { name: '心情', icon: '😄', emojis: ['😄', '🥳', '😍', '🥺', '😤', '🥲', '😅', '🙃', '😇', '🤔', '😴', '🤯', '😭', '😤', '😬', '🙄', '😴', '🥱', '😬', '😌'] },
]

// 当前 emoji 列表
const currentEmojis = computed(() => {
  const cat = emojiCategories.find(c => c.name === activeEmojiCat.value)
  return cat ? cat.emojis : []
})

// 解析标签
const parsedTags = computed(() => {
  if (!tagsInput.value.trim()) return []
  return tagsInput.value.trim().split(/[\s,，]+/).filter(Boolean).slice(0, 10)
})

// 解析正文（支持特殊标记）
const parsedBody = computed(() => {
  if (!body.value.trim()) return []
  return body.value.split('\n').map(line => ({
    text: line,
    isSeparator: line.trim() === '---',
    isHighlight: line.trim().startsWith('==') && line.trim().endsWith('=='),
    isListItem: line.trim().startsWith('- ') || line.trim().startsWith('* '),
  }))
})

// 格式化文本（emoji 替换、高亮标记等）
function formatText(text) {
  // [仅用于非XSS场景] 替换 [emoji-name] 标签
  const emojiMap = {
    '心': '❤️', '星星': '⭐', '火焰': '🔥', '灯泡': '💡', '礼物': '🎁',
    '彩虹': '🌈', '太阳': '☀️', '月亮': '🌙', '花朵': '🌸', '树叶': '🍃',
    '猫': '🐱', '狗': '🐶', '兔': '🐰', '熊': '🐻', '蝴蝶': '🦋',
    '皇冠': '👑', '钻石': '💎', '钱': '💰', '闪电': '⚡', '铃铛': '🔔',
  }
  let result = text.replace(/\[(.+?)\]/g, (match, name) => emojiMap[name] || match)
  // 处理列表项标记
  if (result.startsWith('- ') || result.startsWith('* ')) {
    result = result.slice(2)
  }
  return result
}

// 安全版本：先转义HTML再替换emoji，防止XSS
function formatTextSafe(text) {
  // 先转义HTML特殊字符
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  // 再替换emoji
  const emojiMap = {
    '心': '❤️', '星星': '⭐', '火焰': '🔥', '灯泡': '💡', '礼物': '🎁',
    '彩虹': '🌈', '太阳': '☀️', '月亮': '🌙', '花朵': '🌸', '树叶': '🍃',
    '猫': '🐱', '狗': '🐶', '兔': '🐰', '熊': '🐻', '蝴蝶': '🦋',
    '皇冠': '👑', '钻石': '💎', '钱': '💰', '闪电': '⚡', '铃铛': '🔔',
  }
  let result = escaped.replace(/\[(.+?)\]/g, (match, name) => emojiMap[name] || match)
  if (result.startsWith('- ') || result.startsWith('* ')) {
    result = result.slice(2)
  }
  return result
}

// 插入 emoji
function insertEmoji(emoji) {
  const textarea = document.querySelector('.edit-panel textarea')
  if (textarea) {
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const before = body.value.slice(0, start)
    const after = body.value.slice(end)
    body.value = before + emoji + after
    nextTick(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length
      textarea.focus()
    })
  } else {
    body.value += emoji
  }
}

// 格式工具
function addSeparator() {
  body.value += (body.value ? '\n' : '') + '---\n'
}

function addHighlight() {
  body.value += (body.value ? '\n' : '') + '==输入高亮文字==\n'
}

function addList() {
  body.value += (body.value ? '\n' : '') + '- 列表项1\n- 列表项2\n- 列表项3\n'
}

// 复制内容
function copyContent() {
  const tagsStr = parsedTags.value.map(t => `#${t}`).join(' ')
  const content = [title.value, '', body.value, '', tagsStr].filter(Boolean).join('\n')
  navigator.clipboard.writeText(content).catch(() => {
    const ta = document.createElement('textarea')
    ta.value = content
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  })
}
</script>

<style scoped>
.tool-page {
  padding-top: 0.5rem;
}
h2 { font-size: 1.6rem; margin-bottom: 0.3rem; }
.subtitle { color: #888; font-size: 0.95rem; margin-bottom: 1.5rem; }

.editor-layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 1.5rem;
  align-items: start;
}

/* 左栏编辑器 */
.edit-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-group {
  position: relative;
}
.input-group label {
  display: block;
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 0.4rem;
  font-weight: 500;
}
.hint { color: #aaa; font-weight: 400; font-size: 0.8rem; }
.input-group input,
.input-group textarea {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1.5px solid #e0e0e0;
  border-radius: 10px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
  font-family: inherit;
}
.input-group textarea {
  font-size: 0.9rem;
  resize: vertical;
  line-height: 1.6;
}
.input-group input:focus,
.input-group textarea:focus {
  border-color: #22c55e;
}
.char-count {
  position: absolute;
  right: 12px;
  top: 0;
  font-size: 0.75rem;
  color: #aaa;
}

/* Emoji 部分 */
.emoji-section,
.format-section {
  background: #f9fafb;
  border-radius: 12px;
  padding: 14px;
}
.emoji-section label,
.format-section label {
  display: block;
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 0.5rem;
  font-weight: 500;
}
.section-header {
  margin-bottom: 0.5rem;
}

.emoji-categories {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.emoji-categories button {
  padding: 4px 10px;
  border: 1.5px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}
.emoji-categories button.active {
  border-color: #22c55e;
  background: #f0fdf4;
}

.emoji-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.emoji-btn {
  width: 38px;
  height: 38px;
  border: 1.5px solid transparent;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.emoji-btn:hover {
  border-color: #22c55e;
  background: #f0fdf4;
  transform: scale(1.15);
}

/* 格式按钮 */
.format-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.format-buttons button {
  padding: 6px 14px;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}
.format-buttons button:hover {
  border-color: #22c55e;
  background: #f0fdf4;
}

/* 右栏预览 */
.preview-panel {
  position: sticky;
  top: 1rem;
}

.phone-frame {
  background: white;
  border-radius: 24px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.1);
  overflow: hidden;
  max-width: 360px;
  margin: 0 auto;
}

.phone-header {
  background: #fff;
  padding: 8px 0;
  display: flex;
  justify-content: center;
  border-bottom: 1px solid #f0f0f0;
}
.phone-notch {
  width: 120px;
  height: 4px;
  background: #ddd;
  border-radius: 2px;
}

.phone-content {
  padding: 16px;
}

/* 小红书用户信息 */
.xhs-user {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}
.avatar {
  width: 36px;
  height: 36px;
  background: #f0fdf4;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}
.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.username {
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
}
.post-time {
  font-size: 0.75rem;
  color: #999;
}
.follow-btn {
  padding: 4px 14px;
  border-radius: 20px;
  border: none;
  background: #ff2442;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: default;
}

/* 小红书标题 */
.xhs-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #333;
  line-height: 1.5;
  margin-bottom: 12px;
}

/* 小红书正文 */
.xhs-body {
  font-size: 0.9rem;
  color: #333;
  line-height: 1.8;
  margin-bottom: 16px;
}
.xhs-body p {
  margin-bottom: 6px;
}
.sep-line {
  color: #ddd;
  font-size: 0.8rem;
}
.highlight-text {
  background: linear-gradient(120deg, #fff5a0 0%, #ffe480 100%);
  padding: 2px 6px;
  border-radius: 4px;
}
.list-text {
  display: flex;
  align-items: flex-start;
  gap: 4px;
}

/* 标签 */
.xhs-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}
.xhs-tag {
  color: #ff2442;
  font-size: 0.8rem;
  font-weight: 500;
}

/* 操作栏 */
.xhs-actions {
  display: flex;
  justify-content: space-around;
  padding-top: 14px;
  border-top: 1px solid #f0f0f0;
}
.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  color: #999;
  cursor: default;
}
.action-btn span:first-child {
  font-size: 1.1rem;
}

/* 预览统计 */
.preview-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 12px;
  max-width: 360px;
  margin-left: auto;
  margin-right: auto;
}
.stat-item {
  text-align: center;
  padding: 10px;
  background: #f0fdf4;
  border-radius: 8px;
}
.stat-label {
  display: block;
  font-size: 0.7rem;
  color: #888;
  margin-bottom: 4px;
}
.stat-value {
  display: block;
  font-size: 1.2rem;
  font-weight: 700;
  color: #22c55e;
}
.stat-value.warn { color: #f59e0b; }

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
  .preview-panel {
    position: static;
    order: -1;
  }
  .phone-frame {
    max-width: 100%;
  }
}
</style>
