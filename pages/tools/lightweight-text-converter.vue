<template>
  <div class="tool-page">
    <h2>🔄 轻量级文本格式转换器</h2>
    <p class="subtitle">支持TXT、Markdown、HTML、JSON之间的格式转换和互相导出</p>

    <!-- 格式选择 -->
    <div class="format-bar">
      <div class="format-group">
        <label>输入格式</label>
        <select v-model="inputFormat" class="format-select">
          <option value="txt">纯文本 TXT</option>
          <option value="md">Markdown</option>
          <option value="html">HTML</option>
          <option value="json">JSON</option>
        </select>
      </div>
      <div class="swap-icon" title="交换输入输出">⇄</div>
      <div class="format-group">
        <label>输出格式</label>
        <select v-model="outputFormat" class="format-select">
          <option value="txt">纯文本 TXT</option>
          <option value="md">Markdown</option>
          <option value="html">HTML</option>
          <option value="json">JSON</option>
        </select>
      </div>
    </div>

    <div class="editor-area">
      <div class="panel input-panel">
        <div class="panel-header">
          <span class="panel-title">输入内容</span>
          <button class="btn-sm" @click="loadSampleData">加载示例</button>
        </div>
        <textarea
          v-model="inputText"
          placeholder="粘贴或输入需要转换的文本..."
          class="editor"
        ></textarea>
      </div>

      <div class="panel output-panel">
        <div class="panel-header">
          <span class="panel-title">转换结果</span>
          <div class="output-actions">
            <button class="btn-sm btn-primary" @click="copyResult">复制</button>
            <button class="btn-sm btn-secondary" @click="downloadResult">下载</button>
          </div>
        </div>
        <div class="output-content" v-if="convertedText">
          <pre>{{ convertedText }}</pre>
        </div>
        <div class="output-placeholder" v-else>
          转换后的内容将在这里显示
        </div>
      </div>
    </div>

    <!-- 格式说明 -->
    <div class="format-info">
      <div class="info-grid">
        <div class="info-item" v-if="inputFormat === 'txt'">
          <h4>纯文本格式说明</h4>
          <p>最基本的文本格式，不包含任何格式标记，适合简单的文本内容。</p>
          <pre>这是一段纯文本内容
可以包含换行和空格</pre>
        </div>
        <div class="info-item" v-else-if="inputFormat === 'md'">
          <h4>Markdown格式说明</h4>
          <p>轻量级标记语言，支持标题、列表、粗体、斜体等基本格式。</p>
          <pre># 标题
**粗体** *斜体*
- 列表项
- 另一个项目</pre>
        </div>
        <div class="info-item" v-else-if="inputFormat === 'html'">
          <h4>HTML格式说明</h4>
          <p>超文本标记语言，支持丰富的格式和结构化内容。</p>
          <pre>&lt;h1&gt;标题&lt;/h1&gt;
&lt;p&gt;段落内容&lt;/p&gt;
&lt;strong&gt;粗体&lt;/strong&gt;</pre>
        </div>
        <div class="info-item" v-else-if="inputFormat === 'json'">
          <h4>JSON格式说明</h4>
          <p>JavaScript对象表示法，用于数据交换和配置文件。</p>
          <pre>{
  "name": "示例",
  "items": ["item1", "item2"],
  "count": 2
}</pre>
        </div>
      </div>
    </div>

    <!-- 转换统计 -->
    <div class="conversion-stats" v-if="convertedText">
      <h3>转换统计</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">输入字符数：</span>
          <span class="stat-value">{{ inputText.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">输出字符数：</span>
          <span class="stat-value">{{ convertedText.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">字符变化：</span>
          <span class="stat-value" :class="characterChangeType">
            {{ characterChange }}
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-label">转换时间：</span>
          <span class="stat-value">{{ conversionTime }}ms</span>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '轻量级文本格式转换器 - 野火小站' })

const inputText = ref('')
const inputFormat = ref('txt')
const outputFormat = ref('md')
const convertedText = ref('')
const conversionTime = ref(0)

// 字符变化类型
const characterChangeType = computed(() => {
  const diff = inputText.value.length - convertedText.value.length
  if (diff > 0) return 'increase'
  if (diff < 0) return 'decrease'
  return 'same'
})

// 字符变化描述
const characterChange = computed(() => {
  const diff = inputText.value.length - convertedText.value.length
  if (diff === 0) return '无变化'
  const change = Math.abs(diff)
  const direction = diff > 0 ? '减少' : '增加'
  return `${change} 字符${direction}`
})

// 文本转换函数
const convertText = () => {
  if (!inputText.value) {
    convertedText.value = ''
    return
  }

  const startTime = performance.now()

  try {
    let text = inputText.value
    let result = ''

    // 转换为目标格式
    switch (inputFormat.value) {
      case 'txt':
        text = inputText.value
        break
      
      case 'md':
        text = convertMarkdownToHtml(inputText.value)
        break
      
      case 'html':
        // 解析HTML为纯文本
        text = extractTextFromHtml(inputText.value)
        break
      
      case 'json':
        if (isValidJson(inputText.value)) {
          try {
            const parsed = JSON.parse(inputText.value)
            text = JSON.stringify(parsed, null, 2)
          } catch (e) {
            throw new Error('JSON解析失败')
          }
        } else {
          text = inputText.value // 保留原样
        }
        break
    }

    // 从文本转换为目标格式
    switch (outputFormat.value) {
      case 'txt':
        result = text
        break
      
      case 'md':
        result = textToMarkdown(text)
        break
      
      case 'html':
        if (inputFormat.value === 'md') {
          result = text // 已经是HTML
        } else {
          result = escapeHtml(text)
        }
        break
      
      case 'json':
        try {
          // 尝试解析为对象再格式化
          const parsed = text
          result = JSON.stringify(JSON.parse(parsed), null, 2)
        } catch (e) {
          // 如果不是有效的JSON，转为字符串JSON
          result = JSON.stringify(text, null, 2)
        }
        break
    }

    const endTime = performance.now()
    conversionTime.value = Math.round(endTime - startTime)
    convertedText.value = result
  } catch (error) {
    convertedText.value = `转换失败: ${error.message}`
    conversionTime.value = 0
  }
}

// Markdown转HTML
const convertMarkdownToHtml = (text) => {
  return text
    // 标题
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // 粗体
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    // 斜体
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    // 链接
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
    // 代码
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // 行内代码块
    .replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')
    // 无序列表
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    // 有序列表
    .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>')
    // 换行
    .replace(/\n/g, '<br>')
}

// 从HTML提取文本
const extractTextFromHtml = (html) => {
  // 移除标签
  return html
    .replace(/<[^>]+>/g, ' ')
    // 移除HTML实体
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // 清理多余空格
    .replace(/\s+/g, ' ')
    .trim()
}

// 文本转Markdown
const textToMarkdown = (text) => {
  return text
    // 转义特殊字符
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/`/g, '\\`')
    .replace(/#/g, '\\#')
    // 标准化换行
    .replace(/\n\s*\n/g, '\n\n')
}

// HTML转义
const escapeHtml = (text) => {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// 验证JSON
const isValidJson = (text) => {
  try {
    JSON.parse(text)
    return true
  } catch (e) {
    return false
  }
}

// 加载示例数据
const loadSampleData = () => {
  const samples = {
    txt: '这是一段纯文本示例。\n\n它包含多个段落和换行。\n没有特殊的格式标记。',
    md: `# 项目文档

## 功能特性

- **快速转换**：支持多种格式互转
- **实时预览**：即时查看转换结果
- **格式说明**：提供格式使用指南

### 详细说明

这是一个功能强大的文本格式转换工具。`,
    html: `<h1>网页标题</h1>
<p>这是一个段落。</p>
<p><strong>粗体文本</strong>和<em>斜体文本</em>。</p>
<ul>
  <li>列表项1</li>
  <li>列表项2</li>
</ul>`,
    json: `{
  "name": "示例项目",
  "version": "1.0.0",
  "dependencies": {
    "vue": "^3.0.0",
    "nuxt": "^3.0.0"
  },
  "features": [
    "文本转换",
    "格式预览",
    "批量处理"
  ]
}`
  }

  inputText.value = samples[inputFormat.value]
}

// 交换输入输出格式
const swapFormats = () => {
  const temp = inputFormat.value
  inputFormat.value = outputFormat.value
  outputFormat.value = temp
  convertText()
}

// 复制结果
const copyResult = () => {
  if (!convertedText.value) return
  navigator.clipboard.writeText(convertedText.value).then(() => {
    alert('已复制到剪贴板')
  })
}

// 下载结果
const downloadResult = () => {
  if (!convertedText.value) return
  
  const blob = new Blob([convertedText.value], { 
    type: 'text/plain;charset=utf-8' 
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `converted-text.${outputFormat.value}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 监听格式和文本变化
watch([inputFormat, outputFormat, inputText], () => {
  convertText()
}, { immediate: true })

// 组件挂载时加载示例
onMounted(() => {
  loadSampleData()
})
</script>

<style scoped>
.tool-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.subtitle {
  color: #666;
  margin-bottom: 30px;
}

.format-bar {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 25px;
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.format-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
}

.format-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-width: 150px;
}

.swap-icon {
  font-size: 24px;
  cursor: pointer;
  color: #007bff;
  transition: transform 0.2s;
  padding: 8px;
}

.swap-icon:hover {
  transform: rotate(180deg);
}

.editor-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

@media (max-width: 768px) {
  .editor-area {
    grid-template-columns: 1fr;
  }
}

.panel {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.panel-header {
  background: #f8f9fa;
  padding: 12px 16px;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-title {
  font-weight: 600;
  color: #333;
}

.editor {
  width: 100%;
  height: 300px;
  padding: 16px;
  border: none;
  resize: vertical;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
}

.output-content {
  padding: 16px;
  min-height: 300px;
  background: #f8f9fa;
  overflow: auto;
}

.output-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 14px;
  line-height: 1.5;
}

.output-placeholder {
  padding: 16px;
  min-height: 300px;
  color: #999;
  font-style: italic;
  display: flex;
  align-items: center;
  justify-content: center;
}

.output-actions {
  display: flex;
  gap: 8px;
}

.format-info {
  margin-bottom: 30px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
}

.format-info h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

.info-item {
  background: white;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.info-item h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #555;
}

.info-item p {
  margin-bottom: 10px;
  color: #666;
}

.info-item pre {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.4;
  overflow-x: auto;
}

.conversion-stats {
  margin-bottom: 20px;
}

.conversion-stats h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.stat-item {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.stat-label {
  display: block;
  color: #666;
  font-size: 14px;
  margin-bottom: 4px;
}

.stat-value {
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.stat-value.increase {
  color: #dc3545;
}

.stat-value.decrease {
  color: #28a745;
}

.stat-value.same {
  color: #6c757d;
}

.btn-sm {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-sm:hover {
  background: #f0f0f0;
}

.btn-primary {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border-color: #6c757d;
}

.btn-secondary:hover {
  background: #545b62;
}

.back-link {
  display: inline-block;
  padding: 8px 16px;
  background: #6c757d;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  margin-top: 20px;
}

.back-link:hover {
  background: #545b62;
}
</style>