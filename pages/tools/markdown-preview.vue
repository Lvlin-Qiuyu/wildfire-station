<template>
  <div class="tool-page">
    <h2>📝 Markdown 实时预览</h2>

    <div class="editor-wrapper">
      <div class="editor-pane">
        <div class="pane-header">
          <span>输入 Markdown</span>
          <div class="header-btns">
            <button class="btn-sm" @click="loadExample">📋 示例</button>
            <button class="btn-sm" @click="clearMd">🗑️</button>
          </div>
        </div>
        <textarea
          v-model="markdown"
          placeholder="在此输入 Markdown 文本..."
          spellcheck="false"
        ></textarea>
      </div>
      <div class="preview-pane">
        <div class="pane-header">
          <span>预览</span>
          <button class="btn-copy" @click="copyHtml">{{ copyText }}</button>
        </div>
        <div class="preview-body markdown-body" v-html="renderedHtml"></div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'Markdown 实时预览 - 野火小站' })

const markdown = ref('')
const copyText = ref('复制 HTML')

const exampleMd = `# Markdown 实时预览

## 基本语法

这是一段**加粗文本**和*斜体文本*，还有~~删除线~~文本。

### 列表

- 无序列表项 1
- 无序列表项 2
  - 嵌套项

1. 有序列表项 1
2. 有序列表项 2

### 链接和图片

[访问 GitHub](https://github.com)

![示例图片](https://picsum.photos/400/200)

### 代码

行内代码 \`const x = 1\`

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
  return 42;
}
\`\`\`

### 引用

> 这是一段引用文本
> 可以多行

### 表格

| 功能 | 状态 | 说明 |
|------|------|------|
| 加粗 | ✅ | 支持 |
| 斜体 | ✅ | 支持 |
| 表格 | ✅ | 支持 |

### 分隔线

---

以上是 Markdown 基本语法的演示。
`

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function highlightCode(code, lang) {
  let escaped = escapeHtml(code)
  // Keywords
  const keywords = /\b(function|const|let|var|if|else|for|while|return|import|export|from|class|extends|new|this|async|await|try|catch|throw|typeof|instanceof|switch|case|break|default|true|false|null|undefined)\b/g
  escaped = escaped.replace(keywords, '<span class="kw">$1</span>')
  // Strings
  escaped = escaped.replace(/(["'`])(?:(?!\1|\\).|\\.)*?\1/g, '<span class="str">$&</span>')
  // Comments
  escaped = escaped.replace(/(\/\/.*$)/gm, '<span class="cmt">$1</span>')
  escaped = escaped.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="cmt">$1</span>')
  // Numbers
  escaped = escaped.replace(/\b(\d+\.?\d*)\b/g, '<span class="num">$1</span>')
  return escaped
}

function parseMd(md) {
  let html = escapeHtml(md)
  const lines = html.split('\n')
  let result = []
  let inCode = false
  let inList = false
  let listType = ''
  let inTable = false
  let tableRows = []
  let inBlockquote = false

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]

    // Code blocks
    if (line.match(/^```/)) {
      if (inCode) {
        inCode = false
        result.push('</code></pre>')
      } else {
        inCode = true
        const lang = line.replace(/^```\s*/, '').replace(/&lt;.*?&gt;/, '')
        result.push(`<pre class="code-block"><code class="lang-${lang}">`)
      }
      continue
    }

    if (inCode) {
      result.push(line)
      continue
    }

    // Empty line resets list/table
    if (!line.trim()) {
      if (inList) { result.push(listType === 'ul' ? '</ul>' : '</ol>'); inList = false }
      if (inBlockquote) { result.push('</blockquote>'); inBlockquote = false }
      if (inTable) {
        result.push(buildTable(tableRows))
        tableRows = []
        inTable = false
      }
      continue
    }

    // Table rows
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (inTable || line.trim().match(/^\|[\s-|]+\|$/)) {
        if (!inTable) {
          inTable = true
          continue // skip separator
        }
        inTable = true
        const cells = line.trim().slice(1, -1).split('|').map(c => c.trim())
        tableRows.push(cells)
        continue
      }
      inTable = true
      const cells = line.trim().slice(1, -1).split('|').map(c => c.trim())
      tableRows.push(cells)
      continue
    }

    if (inTable) {
      result.push(buildTable(tableRows))
      tableRows = []
      inTable = false
    }

    // Headings
    const hMatch = line.match(/^(#{1,6})\s+(.+)/)
    if (hMatch) {
      const level = hMatch[1].length
      result.push(`<h${level}>${hMatch[2]}</h${level}>`)
      continue
    }

    // Blockquote
    if (line.startsWith('&gt;')) {
      if (!inBlockquote) { result.push('<blockquote>'); inBlockquote = true }
      result.push(`<p>${line.replace(/^&gt;\s?/, '')}</p>`)
      continue
    } else if (inBlockquote) {
      result.push('</blockquote>')
      inBlockquote = false
    }

    // Horizontal rule
    if (line.match(/^(-{3,}|\*{3,}|_{3,})$/)) {
      result.push('<hr />')
      continue
    }

    // Unordered list
    if (line.match(/^(\s*)[*+-]\s/)) {
      if (!inList || listType !== 'ul') {
        if (inList) result.push(listType === 'ul' ? '</ul>' : '</ol>')
        result.push('<ul>')
        inList = true
        listType = 'ul'
      }
      const indent = line.match(/^(\s*)/)[1].length
      result.push(`<li>${line.replace(/^\s*[*+-]\s/, '')}</li>`)
      continue
    }

    // Ordered list
    if (line.match(/^\s*\d+\.\s/)) {
      if (!inList || listType !== 'ol') {
        if (inList) result.push(listType === 'ul' ? '</ul>' : '</ol>')
        result.push('<ol>')
        inList = true
        listType = 'ol'
      }
      result.push(`<li>${line.replace(/^\s*\d+\.\s/, '')}</li>`)
      continue
    }

    if (inList) {
      result.push(listType === 'ul' ? '</ul>' : '</ol>')
      inList = false
    }

    // Paragraph
    result.push(`<p>${line}</p>`)
  }

  // Close any open tags
  if (inList) result.push(listType === 'ul' ? '</ul>' : '</ol>')
  if (inBlockquote) result.push('</blockquote>')
  if (inTable && tableRows.length) result.push(buildTable(tableRows))

  let output = result.join('\n')

  // Post-processing inline elements
  output = processInline(output)

  // Process code blocks
  output = output.replace(/<pre class="code-block"><code class="lang-(\w+)">([\s\S]*?)<\/code><\/pre>/g, (m, lang, code) => {
    return `<pre class="code-block"><code>${highlightCode(code, lang)}</code></pre>`
  })

  return output
}

function processInline(html) {
  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>')
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
  return html
}

function buildTable(rows) {
  if (!rows.length) return ''
  let html = '<table><thead><tr>'
  rows[0].forEach(cell => { html += `<th>${cell}</th>` })
  html += '</tr></thead><tbody>'
  for (let i = 1; i < rows.length; i++) {
    html += '<tr>'
    rows[i].forEach(cell => { html += `<td>${cell}</td>` })
    html += '</tr>'
  }
  html += '</tbody></table>'
  return html
}

const renderedHtml = computed(() => parseMd(markdown.value))

function loadExample() {
  markdown.value = exampleMd
}

function clearMd() {
  markdown.value = ''
}

function copyHtml() {
  navigator.clipboard.writeText(renderedHtml.value).then(() => {
    copyText.value = '已复制 ✓'
    setTimeout(() => { copyText.value = '复制 HTML' }, 1500)
  })
}
</script>

<style scoped>
.tool-page {
  padding-top: 0.5rem;
}

h2 {
  font-size: 1.6rem;
  margin-bottom: 1.5rem;
}

.editor-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
  min-height: 500px;
}

.pane-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  font-weight: 600;
  font-size: 0.9rem;
  border-bottom: 2px solid #e9ecef;
  margin-bottom: 0.5rem;
}

.header-btns {
  display: flex;
  gap: 0.4rem;
}

.btn-sm {
  padding: 0.2rem 0.6rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.editor-pane textarea {
  width: 100%;
  height: calc(100% - 40px);
  min-height: 400px;
  padding: 0.8rem;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  font-family: monospace;
  font-size: 0.9rem;
  outline: none;
  resize: none;
  box-sizing: border-box;
  line-height: 1.6;
}

.editor-pane textarea:focus {
  border-color: #22c55e;
}

.preview-body {
  height: calc(100% - 40px);
  min-height: 400px;
  overflow-y: auto;
  padding: 0.8rem;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  line-height: 1.7;
  box-sizing: border-box;
}

.preview-body :deep(h1) {
  font-size: 1.8rem;
  margin: 1rem 0 0.5rem;
  padding-bottom: 0.3rem;
  border-bottom: 2px solid #22c55e;
}

.preview-body :deep(h2) {
  font-size: 1.4rem;
  margin: 0.8rem 0 0.4rem;
}

.preview-body :deep(h3) {
  font-size: 1.2rem;
  margin: 0.6rem 0 0.3rem;
}

.preview-body :deep(p) {
  margin: 0.4rem 0;
}

.preview-body :deep(strong) {
  color: #16a34a;
}

.preview-body :deep(a) {
  color: #22c55e;
  text-decoration: underline;
}

.preview-body :deep(code.inline-code) {
  background: #f0fdf4;
  color: #16a34a;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.85em;
}

.preview-body :deep(pre.code-block) {
  background: #1e1e2e;
  border-radius: 8px;
  padding: 1rem;
  overflow-x: auto;
  margin: 0.8rem 0;
}

.preview-body :deep(pre.code-block code) {
  font-family: monospace;
  font-size: 0.85rem;
  line-height: 1.6;
  color: #e0e0e0;
}

.preview-body :deep(blockquote) {
  border-left: 4px solid #22c55e;
  padding: 0.5rem 1rem;
  margin: 0.6rem 0;
  background: #f0fdf4;
  border-radius: 0 6px 6px 0;
  color: #555;
}

.preview-body :deep(blockquote p) {
  margin: 0.2rem 0;
}

.preview-body :deep(hr) {
  border: none;
  border-top: 2px solid #e9ecef;
  margin: 1rem 0;
}

.preview-body :deep(ul),
.preview-body :deep(ol) {
  padding-left: 1.5rem;
  margin: 0.4rem 0;
}

.preview-body :deep(li) {
  margin: 0.2rem 0;
}

.preview-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0.8rem 0;
}

.preview-body :deep(th),
.preview-body :deep(td) {
  border: 1px solid #ddd;
  padding: 0.5rem 0.8rem;
  text-align: left;
  font-size: 0.9rem;
}

.preview-body :deep(th) {
  background: #f0fdf4;
  font-weight: 600;
}

.preview-body :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 0.5rem 0;
}

.preview-body :deep(.kw) { color: #c084fc; }
.preview-body :deep(.str) { color: #a5d6a7; }
.preview-body :deep(.cmt) { color: #6b7280; font-style: italic; }
.preview-body :deep(.num) { color: #fbbf24; }

.btn-copy {
  padding: 0.3rem 0.8rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: transform 0.2s;
}

.btn-copy:active {
  transform: scale(0.95);
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
  .editor-wrapper {
    grid-template-columns: 1fr;
    min-height: auto;
  }
  .editor-pane textarea,
  .preview-body {
    min-height: 250px;
    height: 250px;
  }
}
</style>
