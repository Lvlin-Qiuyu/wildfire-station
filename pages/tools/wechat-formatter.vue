<template>
  <div class="tool-page">
    <h2>📱 公众号文章排版器</h2>
    <p class="subtitle">输入Markdown或纯文本，生成微信公众号兼容的格式化HTML，一键复制内联代码</p>

    <!-- 主题选择 -->
    <div class="theme-bar">
      <span class="theme-label">主题配色：</span>
      <button
        v-for="theme in themes"
        :key="theme.key"
        :class="['theme-btn', { active: currentTheme === theme.key }]"
        :style="{ '--theme-color': theme.color }"
        @click="currentTheme = theme.key"
      >
        {{ theme.icon }} {{ theme.name }}
      </button>
    </div>

    <div class="editor-layout">
      <!-- 左栏：输入 -->
      <div class="edit-panel">
        <div class="panel-header">
          <span class="panel-title">Markdown / 纯文本输入</span>
          <button class="btn-sm" @click="pasteText">粘贴</button>
          <button class="btn-sm" @click="loadExample">示例</button>
          <button class="btn-sm" @click="mdInput = ''">清空</button>
        </div>
        <textarea
          v-model="mdInput"
          placeholder="# 标题&#10;&#10;这是一段**加粗**和*斜体*文字。&#10;&#10;> 引用内容&#10;&#10;1. 有序列表&#10;2. 第二项&#10;&#10;`行内代码`&#10;&#10;```&#10;代码块&#10;```"
          class="editor"
          spellcheck="false"
        ></textarea>
      </div>

      <!-- 右栏：手机预览 -->
      <div class="preview-panel">
        <div class="phone-frame">
          <div class="phone-header">
            <span class="phone-status-bar">{{ currentThemeName }}</span>
            <div class="phone-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
          <div class="phone-content" v-html="renderedHtml"></div>
        </div>
      </div>
    </div>

    <!-- 操作区 -->
    <div class="actions-bar">
      <button class="btn-sm btn-primary" @click="copyHtml" :disabled="!mdInput.trim()">
        📋 复制内联HTML代码
      </button>
      <button class="btn-sm" @click="copyRichText" :disabled="!mdInput.trim()">
        📝 复制富文本
      </button>
      <button class="btn-sm" @click="downloadHtml" :disabled="!mdInput.trim()">
        💾 下载HTML文件
      </button>
      <span class="char-count" v-if="mdInput">字数：{{ mdInput.length }} | 段落：{{ paragraphCount }}</span>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '公众号文章排版器 - 野火小站' })

const mdInput = ref('')
const currentTheme = ref('simple')

// 主题定义
const themes = [
  { key: 'simple', name: '简约', icon: '📄', color: '#333333' },
  { key: 'business', name: '商务', icon: '💼', color: '#1a5276' },
  { key: 'fresh', name: '清新', icon: '🌿', color: '#27ae60' },
  { key: 'warm', name: '暖色', icon: '🌻', color: '#d35400' },
]

const currentThemeName = computed(() => {
  const t = themes.find(t => t.key === currentTheme.value)
  return t ? t.name : '简约'
})

// 段落数
const paragraphCount = computed(() => {
  if (!mdInput.value) return 0
  return mdInput.value.split('\n').filter(l => l.trim().length > 0).length
})

// 渲染HTML（全部内联样式，微信兼容）
const renderedHtml = computed(() => {
  if (!mdInput.value.trim()) return '<p style="color:#ccc;text-align:center;padding:40px 20px;">输入内容后预览效果</p>'
  return renderMarkdown(mdInput.value, currentTheme.value)
})

// Markdown 渲染器（轻量级，生成内联样式）
function renderMarkdown(text, themeKey) {
  const theme = getThemeStyles(themeKey)
  const lines = text.split('\n')
  let html = ''
  let i = 0
  let inCodeBlock = false
  let codeBlockLang = ''
  let codeContent = ''
  let inList = false
  let listType = '' // 'ol' or 'ul'
  let listItems = []

  function flushList() {
    if (listItems.length > 0) {
      const tag = listType === 'ol' ? 'ol' : 'ul'
      const startNum = listType === 'ol' ? 'start="1"' : ''
      const listStyle = listType === 'ol' ? 'decimal' : 'disc'
      html += `<${tag} ${startNum} style="margin:0 0 16px 0;padding-left:20px;color:${theme.text};">`
      listItems.forEach((item, idx) => {
        const num = listType === 'ol' ? `${idx + 1}. ` : '• '
        html += `<li style="margin-bottom:8px;line-height:1.8;list-style:${listStyle};">${num}${item}</li>`
      })
      html += `</${tag}>`
      listItems = []
      inList = false
      listType = ''
    }
  }

  while (i < lines.length) {
    const line = lines[i]

    // 代码块
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // 结束代码块
        html += renderCodeBlock(codeContent, theme)
        codeContent = ''
        inCodeBlock = false
        i++
        continue
      } else {
        // 开始代码块
        flushList()
        inCodeBlock = true
        codeBlockLang = line.trim().slice(3).trim()
        i++
        continue
      }
    }

    if (inCodeBlock) {
      codeContent += (codeContent ? '\n' : '') + line
      i++
      continue
    }

    const trimmed = line.trim()

    // 空行
    if (trimmed === '') {
      flushList()
      i++
      continue
    }

    // 标题 h1-h6
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)/)
    if (headingMatch) {
      flushList()
      const level = headingMatch[1].length
      const content = inlineFormat(headingMatch[2], theme)
      const sizes = { 1: 24, 2: 22, 3: 20, 4: 18, 5: 16, 6: 15 }
      html += `<h${level} style="font-size:${sizes[level]}px;font-weight:bold;color:${theme.heading};margin:24px 0 12px 0;line-height:1.4;">${content}</h${level}>`
      i++
      continue
    }

    // 引用块
    if (trimmed.startsWith('>')) {
      flushList()
      const quoteText = trimmed.replace(/^>\s*/, '')
      const content = inlineFormat(quoteText || '&nbsp;', theme)
      html += `<blockquote style="margin:16px 0;padding:12px 16px;border-left:4px solid ${theme.accent};background:${theme.quoteBg};color:${theme.quoteText};font-size:15px;line-height:1.8;">${content}</blockquote>`
      i++
      continue
    }

    // 水平线
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushList()
      html += `<hr style="border:none;border-top:1px solid #ddd;margin:24px 0;" />`
      i++
      continue
    }

    // 有序列表
    const olMatch = trimmed.match(/^(\d+)\.\s+(.+)/)
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        flushList()
        inList = true
        listType = 'ol'
      }
      listItems.push(inlineFormat(olMatch[2], theme))
      i++
      continue
    }

    // 无序列表
    const ulMatch = trimmed.match(/^[-*+]\s+(.+)/)
    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        flushList()
        inList = true
        listType = 'ul'
      }
      listItems.push(inlineFormat(ulMatch[1], theme))
      i++
      continue
    }

    // 普通段落
    flushList()
    html += `<p style="margin:0 0 16px 0;font-size:15px;line-height:2;color:${theme.text};text-align:justify;">${inlineFormat(trimmed, theme)}</p>`
    i++
  }

  flushList()
  return html
}

// 行内格式化（加粗/斜体/行内代码/链接）
// 注意：此函数返回的是包含HTML标签的文本，HTML转义在外层处理前已完成
// 由于用户输入的Markdown内容，我们不转义以保留格式化标签
function inlineFormat(text, theme) {
  // 先转义HTML特殊字符（保护非Markdown文本）
  text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // 行内代码
  text = text.replace(/`([^`]+)`/g, (match, code) => {
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return `<code style="background:#f3f4f6;color:#e74c3c;padding:2px 6px;border-radius:3px;font-size:13px;font-family:Menlo,Monaco,Consolas,monospace;">${escaped}</code>`
  })

  // 加粗+斜体
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, `<strong><em>$1</em></strong>`)

  // 加粗
  text = text.replace(/\*\*(.+?)\*\*/g, `<strong style="color:${theme.heading};font-weight:bold;">$1</strong>`)

  // 斜体
  text = text.replace(/\*(.+?)\*/g, `<em>$1</em>`)

  // 链接
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" style="color:${theme.accent};text-decoration:none;border-bottom:1px solid ${theme.accent};">$1</a>`)

  return text
}

// 代码块渲染
function renderCodeBlock(code, theme) {
  const escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return `<pre style="background:#1e1e2e;color:#cdd6f4;padding:16px;border-radius:8px;font-size:13px;line-height:1.6;overflow-x:auto;margin:16px 0;font-family:Menlo,Monaco,Consolas,monospace;"><code>${escaped}</code></pre>`
}

// 获取主题样式
function getThemeStyles(key) {
  const styles = {
    simple: {
      heading: '#333333',
      text: '#3f3f3f',
      accent: '#576b95',
      quoteBg: '#f7f7f7',
      quoteText: '#666666',
    },
    business: {
      heading: '#1a5276',
      text: '#2c3e50',
      accent: '#2980b9',
      quoteBg: '#eaf2f8',
      quoteText: '#34495e',
    },
    fresh: {
      heading: '#27ae60',
      text: '#2c3e50',
      accent: '#27ae60',
      quoteBg: '#e8f8f5',
      quoteText: '#1e8449',
    },
    warm: {
      heading: '#d35400',
      text: '#4a4a4a',
      accent: '#e67e22',
      quoteBg: '#fef5e7',
      quoteText: '#a04000',
    },
  }
  return styles[key] || styles.simple
}

// 生成完整的内联HTML（用于复制）
function getFullHtml() {
  const theme = getThemeStyles(currentTheme.value)
  return `<section style="padding:16px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,'PingFang SC','Hiragino Sans GB',sans-serif;font-size:15px;line-height:2;color:${theme.text};">
${renderMarkdown(mdInput.value, currentTheme.value)}
</section>`
}

// 复制HTML代码
function copyHtml() {
  const html = getFullHtml()
  navigator.clipboard.writeText(html).catch(() => fallbackCopy(html))
}

// 复制富文本（可以用富文本粘贴到微信编辑器）
function copyRichText() {
  const html = getFullHtml()
  // 使用ClipboardItem复制富文本
  if (navigator.clipboard && navigator.clipboard.write) {
    const blob = new Blob([html], { type: 'text/html' })
    const item = new ClipboardItem({ 'text/html': blob, 'text/plain': new Blob([mdInput.value], { type: 'text/plain' }) })
    navigator.clipboard.write([item]).catch(() => {
      // 降级：复制纯HTML代码
      copyHtml()
    })
  } else {
    // 降级
    copyHtml()
  }
}

// 下载HTML文件
function downloadHtml() {
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>公众号文章</title></head><body>${getFullHtml()}</body></html>`
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'wechat-article.html'
  a.click()
  URL.revokeObjectURL(url)
}

// 粘贴
async function pasteText() {
  try {
    mdInput.value = await navigator.clipboard.readText()
  } catch {}
}

// 降级复制
function fallbackCopy(text) {
  const ta = document.createElement('textarea')
  ta.value = text
  document.body.appendChild(ta)
  ta.select()
  document.execCommand('copy')
  document.body.removeChild(ta)
}

// 示例
function loadExample() {
  mdInput.value = `# 如何提升编程效率

在当今快节奏的开发环境中，**提升编程效率**是每个开发者都在追求的目标。

## 一、善用快捷键

熟练掌握IDE快捷键可以*显著提高*编码速度。以下是常用的快捷键：

1. \`Ctrl+C\` / \`Ctrl+V\` - 复制粘贴
2. \`Ctrl+Z\` - 撤销
3. \`Ctrl+Shift+F\` - 全局搜索

> 💡 小贴士：每天花10分钟练习一个新快捷键，一个月后你会发现自己效率翻倍。

## 二、使用AI辅助工具

AI编程助手正在改变开发者的工作方式：

- 代码自动补全
- 智能重构建议
- Bug 自动检测与修复

## 三、建立个人代码库

将常用的工具函数、组件模板整理成个人代码库，避免重复造轮子。

\`\`\`javascript
// 示例：通用的防抖函数
function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}
\`\`\`

---

*持续学习和改进，才是提升效率的根本之道。*`
}
</script>

<style scoped>
.tool-page { padding-top: 0.5rem; }
h2 { font-size: 1.6rem; margin-bottom: 0.3rem; }
.subtitle { color: #888; font-size: 0.95rem; margin-bottom: 1.2rem; }

/* 主题选择栏 */
.theme-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.2rem;
  flex-wrap: wrap;
}

.theme-label {
  font-size: 0.9rem;
  color: #555;
  font-weight: 500;
}

.theme-btn {
  padding: 0.35rem 0.8rem;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 0.82rem;
  transition: all 0.2s;
  color: #555;
}
.theme-btn:hover {
  border-color: var(--theme-color);
  color: var(--theme-color);
}
.theme-btn.active {
  border-color: var(--theme-color);
  background: var(--theme-color);
  color: white;
}

/* 编辑器布局 */
.editor-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 1.5rem;
  align-items: start;
  margin-bottom: 1rem;
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
.btn-sm:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-sm.btn-primary {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
}
.btn-sm.btn-primary:hover { opacity: 0.85; }

.editor {
  width: 100%;
  min-height: 400px;
  padding: 0.8rem;
  border: none;
  font-size: 0.88rem;
  line-height: 1.7;
  resize: vertical;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  background: white;
  box-sizing: border-box;
}
.editor:focus { outline: none; }

/* 手机预览 */
.preview-panel {
  position: sticky;
  top: 1rem;
}

.phone-frame {
  background: white;
  border-radius: 24px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.1);
  overflow: hidden;
  max-width: 320px;
  margin: 0 auto;
}

.phone-header {
  background: #fafafa;
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
}

.phone-status-bar {
  font-size: 0.75rem;
  color: #888;
}

.phone-dots {
  display: flex;
  gap: 4px;
}
.phone-dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ddd;
}

.phone-content {
  padding: 16px;
  max-height: 500px;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.7;
  word-break: break-word;
}

/* 操作栏 */
.actions-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.char-count {
  font-size: 0.8rem;
  color: #aaa;
  margin-left: auto;
}

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
