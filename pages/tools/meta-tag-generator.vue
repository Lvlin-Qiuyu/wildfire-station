<template>
  <div class="tool-page">
    <h2>🏷️ Meta 标签生成器</h2>
    <p class="subtitle">生成 SEO 与社交媒体分享用的 Meta 标签，实时预览各平台效果</p>

    <div class="layout">
      <!-- 左侧：表单 -->
      <div class="form-panel">
        <div class="field-group">
          <div class="field">
            <label>页面标题</label>
            <input type="text" v-model="title" placeholder="例如：野火小站 - 在线工具箱" maxlength="100" />
            <div class="char-count" :class="{ warn: title.length > 60 }">
              {{ title.length }} / 70（建议 ≤ 60 字符）
            </div>
          </div>

          <div class="field">
            <label>页面描述</label>
            <textarea v-model="description" placeholder="简要描述页面内容…" rows="3" maxlength="300"></textarea>
            <div class="char-count" :class="{ warn: description.length > 160 }">
              {{ description.length }} / 300（建议 ≤ 160 字符）
            </div>
          </div>

          <div class="field">
            <label>关键词</label>
            <input type="text" v-model="keywords" placeholder="逗号分隔，如：在线工具,前端,开发" />
          </div>

          <div class="field">
            <label>页面 URL</label>
            <input type="url" v-model="url" placeholder="https://example.com/page" />
          </div>

          <div class="field">
            <label>图片 URL</label>
            <input type="url" v-model="imageUrl" placeholder="https://example.com/og-image.png" />
            <div v-if="imageUrl" class="img-preview">
              <img :src="imageUrl" alt="预览" @error="imgError = true" />
              <div v-if="imgError" class="img-error">⚠️ 图片加载失败</div>
            </div>
          </div>

          <div class="field-row">
            <div class="field flex-1">
              <label>网站名称</label>
              <input type="text" v-model="siteName" placeholder="野火小站" />
            </div>
            <div class="field flex-1">
              <label>Twitter 账号</label>
              <input type="text" v-model="twitterHandle" placeholder="@youraccount" />
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：预览与代码 -->
      <div class="preview-panel">
        <!-- 社交平台预览 -->
        <div class="platform-section">
          <div class="section-title">📱 平台分享预览</div>

          <!-- 微信风格 -->
          <div class="platform-card wechat-card">
            <div class="card-header-bar wechat-bar">
              <span class="wechat-icon">💬</span> 微信分享预览
            </div>
            <div class="card-body">
              <div class="card-row">
                <div class="card-thumb" v-if="imageUrl && !imgError">
                  <img :src="imageUrl" />
                </div>
                <div class="card-info">
                  <div class="card-title">{{ title || '页面标题' }}</div>
                  <div class="card-desc">{{ description || '页面描述内容将显示在这里' }}</div>
                  <div class="card-site">{{ siteName || url || 'example.com' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Facebook 风格 -->
          <div class="platform-card fb-card">
            <div class="card-header-bar fb-bar">
              <span>📘</span> Facebook 分享预览
            </div>
            <div class="card-body">
              <div class="card-site-top">{{ siteName || url || 'example.com' }}</div>
              <div class="card-title">{{ title || '页面标题' }}</div>
              <div class="card-desc">{{ description || '页面描述内容将显示在这里' }}</div>
              <div class="card-img-area" v-if="imageUrl && !imgError">
                <img :src="imageUrl" />
              </div>
            </div>
          </div>

          <!-- Twitter/X 风格 -->
          <div class="platform-card tw-card">
            <div class="card-header-bar tw-bar">
              <span>🐦</span> Twitter/X 分享预览
            </div>
            <div class="card-body">
              <div class="card-img-area tw-img" v-if="imageUrl && !imgError">
                <img :src="imageUrl" />
              </div>
              <div class="card-title">{{ title || '页面标题' }}</div>
              <div class="card-desc">{{ description || '页面描述内容将显示在这里' }}</div>
              <div class="card-site">{{ url || 'https://example.com' }}</div>
            </div>
          </div>

          <!-- Discord 嵌入风格 -->
          <div class="platform-card discord-card">
            <div class="card-header-bar discord-bar">
              <span>🎮</span> Discord 嵌入预览
            </div>
            <div class="card-body discord-body">
              <div class="discord-site">{{ siteName || 'example.com' }}</div>
              <div class="discord-title">{{ title || '页面标题' }}</div>
              <div class="discord-desc">{{ description || '页面描述内容' }}</div>
              <div class="discord-img" v-if="imageUrl && !imgError">
                <img :src="imageUrl" />
              </div>
              <div class="discord-footer" v-if="url">
                🔗 {{ url }}
              </div>
            </div>
          </div>
        </div>

        <!-- HTML 代码输出 -->
        <div class="code-section">
          <div class="section-header">
            <span class="section-title">📝 生成的 Meta 标签</span>
            <button class="btn-copy" @click="copyCode">📋 复制代码</button>
          </div>
          <pre class="code-block"><code>{{ generatedCode }}</code></pre>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'Meta 标签生成器 - 野火小站' })

const title = ref('')
const description = ref('')
const keywords = ref('')
const url = ref('')
const imageUrl = ref('')
const siteName = ref('')
const twitterHandle = ref('')
const imgError = ref(false)

// 生成 Meta 标签代码
const generatedCode = computed(() => {
  const lines = []
  lines.push('<!-- 基本 Meta 标签 -->')
  lines.push(`<meta charset="UTF-8">`)
  lines.push(`<meta name="viewport" content="width=device-width, initial-scale=1.0">`)
  if (title.value) lines.push(`<title>${esc(title.value)}</title>`)
  if (description.value) lines.push(`<meta name="description" content="${esc(description.value)}">`)
  if (keywords.value) lines.push(`<meta name="keywords" content="${esc(keywords.value)}">`)
  if (url.value) lines.push(`<link rel="canonical" href="${esc(url.value)}">`)

  lines.push('')
  lines.push('<!-- Open Graph / Facebook -->')
  lines.push(`<meta property="og:type" content="website">`)
  if (title.value) lines.push(`<meta property="og:title" content="${esc(title.value)}">`)
  if (description.value) lines.push(`<meta property="og:description" content="${esc(description.value)}">`)
  if (url.value) lines.push(`<meta property="og:url" content="${esc(url.value)}">`)
  if (imageUrl.value) lines.push(`<meta property="og:image" content="${esc(imageUrl.value)}">`)
  if (siteName.value) lines.push(`<meta property="og:site_name" content="${esc(siteName.value)}">`)

  lines.push('')
  lines.push('<!-- Twitter Card -->')
  lines.push(`<meta name="twitter:card" content="${imageUrl.value ? 'summary_large_image' : 'summary'}">`)
  if (twitterHandle.value) lines.push(`<meta name="twitter:site" content="${esc(twitterHandle.value)}">`)
  if (title.value) lines.push(`<meta name="twitter:title" content="${esc(title.value)}">`)
  if (description.value) lines.push(`<meta name="twitter:description" content="${esc(description.value)}">`)
  if (imageUrl.value) lines.push(`<meta name="twitter:image" content="${esc(imageUrl.value)}">`)

  return lines.join('\n')
})

function esc(str) {
  return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(generatedCode.value)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = generatedCode.value
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
}
</script>

<style scoped>
.tool-page {
  padding-top: 0.5rem;
}

h2 {
  font-size: 1.6rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #666;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

.layout {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 1.5rem;
  align-items: start;
}

/* 表单面板 */
.form-panel {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.field.flex-1 {
  flex: 1;
}

.field label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
}

.field input,
.field textarea {
  padding: 0.6rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  width: 100%;
}

.field input:focus,
.field textarea:focus {
  outline: none;
  border-color: #10b981;
}

.field textarea {
  resize: vertical;
  line-height: 1.5;
}

.char-count {
  font-size: 0.78rem;
  color: #9ca3af;
  text-align: right;
}

.char-count.warn {
  color: #f59e0b;
  font-weight: 600;
}

.field-row {
  display: flex;
  gap: 0.75rem;
}

.img-preview {
  margin-top: 0.5rem;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  max-height: 150px;
}

.img-preview img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  display: block;
}

.img-error {
  padding: 0.75rem;
  text-align: center;
  font-size: 0.85rem;
  color: #f59e0b;
  background: #fffbeb;
}

/* 预览面板 */
.preview-panel {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
}

/* 平台卡片 */
.platform-card {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 1rem;
  background: white;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}

.card-header-bar {
  padding: 0.5rem 0.75rem;
  font-size: 0.82rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.wechat-bar { background: #07c160; color: white; }
.fb-bar { background: #1877f2; color: white; }
.tw-bar { background: #1d1d1f; color: white; }
.discord-bar { background: #5865f2; color: white; }

.card-body {
  padding: 0.75rem;
}

/* 微信卡片 */
.card-row {
  display: flex;
  gap: 0.75rem;
}

.card-thumb {
  width: 60px;
  height: 60px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
}

.card-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a1a1a;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-desc {
  font-size: 0.78rem;
  color: #888;
  margin-top: 0.2rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-site {
  font-size: 0.72rem;
  color: #aaa;
  margin-top: 0.25rem;
}

/* Facebook 卡片 */
.card-site-top {
  font-size: 0.72rem;
  color: #65676b;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}

.fb-card .card-title {
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.fb-card .card-desc {
  font-size: 0.82rem;
  color: #65676b;
  margin-bottom: 0.5rem;
}

.card-img-area {
  border-radius: 8px;
  overflow: hidden;
  margin-top: 0.5rem;
  max-height: 200px;
}

.card-img-area img {
  width: 100%;
  display: block;
  max-height: 200px;
  object-fit: cover;
}

/* Twitter 卡片 */
.tw-img {
  border-radius: 16px 16px 0 0;
  margin: -0.75px -0.75px 0.5rem;
  max-height: 180px;
}

.tw-card .card-title {
  font-size: 0.95rem;
}

.tw-card .card-desc {
  font-size: 0.82rem;
}

.tw-card .card-site {
  color: #1d9bf0;
  font-size: 0.78rem;
}

/* Discord 嵌入 */
.discord-body {
  background: #2f3136;
  border-left: 4px solid #5865f2;
}

.discord-site {
  font-size: 0.72rem;
  color: #b5bac1;
  margin-bottom: 0.15rem;
}

.discord-title {
  font-size: 1rem;
  font-weight: 600;
  color: #00aff4;
  margin-bottom: 0.25rem;
}

.discord-desc {
  font-size: 0.88rem;
  color: #dcddde;
  margin-bottom: 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.discord-img {
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.5rem;
  max-height: 200px;
}

.discord-img img {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  display: block;
}

.discord-footer {
  font-size: 0.78rem;
  color: #b5bac1;
}

/* 代码区域 */
.code-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.btn-copy {
  padding: 0.35rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.btn-copy:hover {
  border-color: #10b981;
  background: #ecfdf5;
}

.code-block {
  background: #1e293b;
  color: #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  font-size: 0.78rem;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 350px;
  overflow-y: auto;
  margin: 0;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
}

.back-link {
  display: inline-block;
  margin-top: 2.5rem;
  color: #22c55e;
  font-weight: 500;
}

.back-link:hover { text-decoration: underline; }

@media (max-width: 768px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .field-row {
    flex-direction: column;
  }
  .platform-card:last-child {
    margin-bottom: 0;
  }
}
</style>
