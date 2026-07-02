<template>
  <div class="tool-page">
    <h2>📖 Markdown 大纲目录生成器</h2>
    <p class="subtitle">粘贴 Markdown 文档，自动解析标题层级，生成嵌套目录 TOC，支持多种格式</p>

    <!-- 输入区域 -->
    <div class="editor-area">
      <div class="panel input-panel">
        <div class="panel-header">
          <span class="panel-title">Markdown 文档</span>
          <div class="panel-actions">
            <button class="btn-sm" @click="clearInput">清空</button>
            <button class="btn-sm" @click="pasteText">粘贴</button>
          </div>
        </div>
        <textarea
          v-model="rawMarkdown"
          placeholder="粘贴 Markdown 文档到这里...&#10;&#10;支持解析 # ~ ###### 各级标题"
          class="editor"
        ></textarea>
      </div>

      <div class="panel output-panel">
        <div class="panel-header">
          <span class="panel-title">生成结果</span>
          <div class="panel-actions">
            <button class="btn-sm" @click="copyResult">{{ copyBtnText }}</button>
            <button class="btn-sm" @click="downloadResult">下载</button>
          </div>
        </div>
        <pre v-if="rawMarkdown" class="preview-code">{{ tocOutput }}</pre>
        <div v-else class="preview placeholder">目录将在这里实时生成</div>
      </div>
    </div>

    <!-- 选项区域 -->
    <div class="options">
      <h3>格式选项</h3>
      <div class="options-grid">
        <!-- 格式选择 -->
        <div class="option-group">
          <label class="option-label">输出格式</label>
          <div class="format-buttons">
            <button
              v-for="fmt in formats"
              :key="fmt.value"
              :class="['btn-format', { active: selectedFormat === fmt.value }]"
              @click="selectedFormat = fmt.value"
            >
              {{ fmt.label }}
            </button>
          </div>
        </div>

        <!-- 缩进选择 -->
        <div class="option-group">
          <label class="option-label">缩进方式</label>
          <div class="format-buttons">
            <button
              v-for="ind in indents"
              :key="ind.value"
              :class="['btn-format', { active: selectedIndent === ind.value }]"
              @click="selectedIndent = ind.value"
            >
              {{ ind.label }}
            </button>
          </div>
        </div>

        <!-- 最大层级 -->
        <div class="option-group">
          <label class="option-label">
            最大层级：<strong>{{ maxLevel }}</strong>
          </label>
          <input
            type="range"
            v-model.number="maxLevel"
            min="1"
            max="6"
            step="1"
            class="range-slider"
          />
          <div class="range-labels">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
            <span>6</span>
          </div>
        </div>

        <!-- 开关选项 -->
        <div class="option-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="orderedList" />
            <span>有序列表编号</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="includeLevel" />
            <span>显示层级标记</span>
          </label>
        </div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats" v-if="headings.length">
      <p>解析到 {{ headings.length }} 个标题（h{{ minHeadingLevel }} ~ h{{ maxHeadingLevel }}）</p>
    </div>

    <!-- 空状态 -->
    <div v-if="!rawMarkdown" class="demo-section">
      <button class="btn-sm btn-primary" @click="loadDemo">加载示例文档</button>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'Markdown 大纲目录生成器 - 野火小站' })

const rawMarkdown = ref('')
const copyBtnText = ref('复制')
const selectedFormat = ref('github')
const selectedIndent = ref('two-space')
const maxLevel = ref(6)
const orderedList = ref(false)
const includeLevel = ref(false)

// 格式选项
const formats = [
  { label: 'GitHub', value: 'github' },
  { label: 'Notion', value: 'notion' },
  { label: 'Hexo', value: 'hexo' },
  { label: '纯文本', value: 'plain' },
]

// 缩进选项
const indents = [
  { label: '2空格', value: 'two-space' },
  { label: '4空格', value: 'four-space' },
  { label: 'Tab', value: 'tab' },
  { label: '无缩进', value: 'none' },
]

// 解析 Markdown 标题
const headings = computed(() => {
  if (!rawMarkdown.value) return []
  const lines = rawMarkdown.value.split('\n')
  const result = []
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/)
    if (match) {
      const level = match[1].length
      const text = match[2].trim()
      // 生成锚点：小写、去特殊字符、空格变连字符
      const anchor = text
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fff\s-]/g, '')
        .replace(/\s+/g, '-')
      result.push({ level, text, anchor, lineNum: result.length + 1 })
    }
  }
  return result
})

// 解析到的标题层级范围
const minHeadingLevel = computed(() => {
  if (!headings.value.length) return 1
  return Math.min(...headings.value.map(h => h.level))
})

const maxHeadingLevel = computed(() => {
  if (!headings.value.length) return 1
  return Math.max(...headings.value.map(h => h.level))
})

// 获取缩进字符串
function getIndent(level) {
  const depth = level - minHeadingLevel.value
  if (selectedIndent.value === 'none' || depth <= 0) return ''
  const unit = selectedIndent.value === 'tab' ? '\t' : selectedIndent.value === 'four-space' ? '    ' : '  '
  return unit.repeat(depth)
}

// 生成 TOC 文本
const tocOutput = computed(() => {
  if (!headings.value.length) return ''

  const filtered = headings.value.filter(h => h.level <= maxLevel.value)
  const lines = []

  filtered.forEach((h, index) => {
    const indent = getIndent(h.level)

    switch (selectedFormat.value) {
      case 'github': {
        // GitHub 风格：- [text](#anchor)
        const prefix = orderedList.value ? `${index + 1}. ` : '- '
        const levelTag = includeLevel.value ? ` [h${h.level}]` : ''
        lines.push(`${indent}${prefix}[${h.text}]${levelTag}(#${h.anchor})`)
        break
      }
      case 'notion': {
        // Notion 风格：使用 [[text]] 链接格式，或 tab 缩进
        const levelTag = includeLevel.value ? `[H${h.level}] ` : ''
        lines.push(`${indent}${levelTag}${h.text}`)
        break
      }
      case 'hexo': {
        // Hexo 风格：使用 {% toc %} 或传统列表格式
        const prefix = orderedList.value ? `${index + 1}. ` : '- '
        const levelTag = includeLevel.value ? `[H${h.level}] ` : ''
        lines.push(`${indent}${prefix}${levelTag}${h.text}`)
        break
      }
      case 'plain': {
        // 纯文本风格：无链接
        const bullet = orderedList.value ? `${index + 1}.` : '•'
        const levelTag = includeLevel.value ? `[H${h.level}] ` : ''
        lines.push(`${indent}${bullet} ${levelTag}${h.text}`)
        break
      }
    }
  })

  return lines.join('\n')
})

function clearInput() {
  rawMarkdown.value = ''
}

async function pasteText() {
  try {
    const text = await navigator.clipboard.readText()
    rawMarkdown.value = text
  } catch {
    // 剪贴板 API 可能不可用
  }
}

function copyResult() {
  if (!tocOutput.value) return
  navigator.clipboard.writeText(tocOutput.value).then(() => {
    copyBtnText.value = '已复制 ✓'
    setTimeout(() => { copyBtnText.value = '复制' }, 1500)
  })
}

function downloadResult() {
  if (!tocOutput.value) return
  const blob = new Blob([tocOutput.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'toc.md'
  a.click()
  URL.revokeObjectURL(url)
}

// 示例文档
function loadDemo() {
  rawMarkdown.value = `# 野火小站使用指南

## 快速开始

### 环境准备

#### Node.js 安装

##### 版本要求

###### 常见问题

#### 包管理器配置

### 项目初始化

### 开发命令

## 工具开发

### 创建新工具

#### 文件结构

#### 代码规范

### 测试与部署

## 进阶用法

### 自定义主题

### API 集成

#### 授权配置

#### 数据缓存

## 常见问题 FAQ

### 部署问题

### 性能优化
`
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

.editor-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.panel {
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
}

.panel-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: #555;
}

.panel-actions {
  display: flex;
  gap: 0.4rem;
}

.btn-sm {
  padding: 0.25rem 0.7rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 0.8rem;
  cursor: pointer;
  color: #666;
}

.btn-sm:hover {
  border-color: #10b981;
  color: #22c55e;
}

.btn-sm.btn-primary {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
}

.btn-sm.btn-primary:hover {
  opacity: 0.85;
}

.editor {
  width: 100%;
  min-height: 300px;
  padding: 1rem;
  border: none;
  font-size: 0.95rem;
  line-height: 1.8;
  resize: vertical;
  font-family: inherit;
  background: white;
  box-sizing: border-box;
}

.editor:focus {
  outline: none;
}

.preview {
  padding: 1rem;
  min-height: 300px;
  line-height: 1.8;
  font-size: 0.95rem;
  color: #333;
  white-space: pre-wrap;
  word-break: break-all;
}

.preview.placeholder {
  color: #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-code {
  padding: 1rem;
  min-height: 300px;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  line-height: 1.7;
  color: #333;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  background: white;
}

/* 选项区域 */
.options {
  background: #fafafa;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
}

.options h3 {
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 0.75rem;
}

.options-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.option-label {
  font-size: 0.82rem;
  color: #888;
  font-weight: 600;
}

.format-buttons {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.btn-format {
  padding: 0.3rem 0.7rem;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.82rem;
  transition: all 0.2s;
  color: #666;
}

.btn-format:hover {
  border-color: #10b981;
  color: #10b981;
}

.btn-format.active {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border-color: #22c55e;
}

.range-slider {
  width: 100%;
  max-width: 300px;
  accent-color: #10b981;
  cursor: pointer;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  max-width: 300px;
  font-size: 0.72rem;
  color: #bbb;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.88rem;
  color: #555;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  accent-color: #10b981;
}

.stats {
  font-size: 0.85rem;
  color: #aaa;
  margin-bottom: 1.5rem;
}

.demo-section {
  text-align: center;
  margin-bottom: 1.5rem;
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
  .editor-area {
    grid-template-columns: 1fr;
  }
  .format-buttons {
    flex-wrap: wrap;
  }
}
</style>
