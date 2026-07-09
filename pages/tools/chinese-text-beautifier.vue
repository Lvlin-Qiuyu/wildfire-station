<template>
  <div class="tool-page">
    <h2>📖 中文文本美化器</h2>
    <p class="subtitle">智能排版中文内容，自动处理全半角转换、段落间距、标点规范化</p>

    <div class="editor-area">
      <div class="panel input-panel">
        <div class="panel-header">
          <span class="panel-title">原始文本</span>
          <button class="btn-sm" @click="pasteText">粘贴</button>
        </div>
        <textarea
          v-model="rawText"
          placeholder="粘贴需要美化的中文文本到这里..."
          class="editor"
        ></textarea>
      </div>

      <div class="panel output-panel">
        <div class="panel-header">
          <span class="panel-title">美化结果</span>
          <button class="btn-sm btn-primary" @click="copyResult">复制</button>
        </div>
        <div v-if="rawText" class="preview" v-html="beautifiedHtml"></div>
        <div v-else class="preview placeholder">美化后的文本将在这里实时预览</div>
      </div>
    </div>

    <div class="options">
      <h3>美化选项</h3>
      <div class="option-grid">
        <label v-for="opt in options" :key="opt.key" class="checkbox-label">
          <input type="checkbox" v-model="opt.enabled" />
          <span>{{ opt.label }}</span>
        </label>
      </div>
    </div>

    <div class="stats" v-if="rawText">
      <p>共 {{ rawText.length }} 字符 → 修改了 {{ changeCount }} 处</p>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '中文文本美化器 - 野火小站' })

const rawText = ref('')

const options = reactive([
  { key: 'full-half', label: '全半角转换', enabled: true },
  { key: 'spacing', label: '中英文间距', enabled: true },
  { key: 'punctuation', label: '标点规范化', enabled: true },
  { key: 'paragraph', label: '段落缩进', enabled: true },
  { key: 'quotes', label: '引号美化', enabled: false }
])

// 全半角转换
const fullHalfConvert = (text) => {
  if (!options.find(opt => opt.key === 'full-half')?.enabled) return text
  return text
    .replace(/[\uff01-\uff5e]/g, (char) => {
      const map = {
        '！': '!', '＂': '"', '＃': '#', '＄': '$', '％': '%',
        '＆': '&', '＇': "'", '（': '(', '）': ')', '＊': '*',
        '＋': '+', '，': ',', '－': '-', '．': '.', '／': '/',
        '０': '0', '１': '1', '２': '2', '３': '3', '４': '4',
        '５': '5', '６': '6', '７': '7', '８': '8', '９': '9',
        '：': ':', '；': ';', '＜': '<', '＝': '=', '＞': '>',
        '？': '?', '＠': '@', '［': '[', '＼': '\\', '］': ']',
        '＾': '^', '＿': '_', '｀': '`', '｛': '{', '｜': '|',
        '｝': '}', '～': '~'
      }
      return map[char] || char
    })
}

// 中英文间距处理
const spacingFix = (text) => {
  if (!options.find(opt => opt.key === 'spacing')?.enabled) return text
  return text
    .replace(/([a-zA-Z0-9])([\u4e00-\u9fa5])/g, '$1 $2')
    .replace(/([\u4e00-\u9fa5])([a-zA-Z0-9])/g, '$1 $2')
    .replace(/([a-zA-Z0-9])([,.!?;:])/g, '$1 $2')
    .replace(/([,.!?;:])([a-zA-Z0-9])/g, '$1 $2')
}

// 标点符号规范化
const punctuationNormalize = (text) => {
  if (!options.find(opt => opt.key === 'punctuation')?.enabled) return text
  return text
    .replace(/[，，]/g, '，')
    .replace(/[。。]/g, '。')
    .replace(/[！！]/g, '！')
    .replace(/[？？]/g, '？')
    .replace(/[；；]/g, '；')
    .replace(/[:：]/g, '：')
}

// 段落缩进
const paragraphIndent = (text) => {
  if (!options.find(opt => opt.key === 'paragraph')?.enabled) return text
  const paragraphs = text.split(/\n\s*\n/)
  return paragraphs
    .filter(p => p.trim().length > 0)
    .map(p => '　　' + p.trim())
    .join('\n\n')
}

// 引号美化
const quoteBeautify = (text) => {
  if (!options.find(opt => opt.key === 'quotes')?.enabled) return text
  return text
    .replace(/"([^"]+)"/g, '「$1」')
    .replace(/'([^']+)'/g, '『$1』')
}

// 计算美化后的文本
const beautifiedText = computed(() => {
  let result = rawText.value
  if (options.find(opt => opt.key === 'full-half')?.enabled) {
    result = fullHalfConvert(result)
  }
  if (options.find(opt => opt.key === 'spacing')?.enabled) {
    result = spacingFix(result)
  }
  if (options.find(opt => opt.key === 'punctuation')?.enabled) {
    result = punctuationNormalize(result)
  }
  if (options.find(opt => opt.key === 'paragraph')?.enabled) {
    result = paragraphIndent(result)
  }
  if (options.find(opt => opt.key === 'quotes')?.enabled) {
    result = quoteBeautify(result)
  }
  return result
})

// 美化后的HTML显示
const beautifiedHtml = computed(() => {
  return beautifiedText.value
    .replace(/\n/g, '<br>')
    .replace(/　/g, '&emsp;')
})

// 计算修改数量
const changeCount = computed(() => {
  return rawText.value.length - beautifiedText.value.length
})

// 粘贴文本
const pasteText = () => {
  navigator.clipboard.readText().then(text => {
    rawText.value = text
  })
}

// 复制结果
const copyResult = () => {
  navigator.clipboard.writeText(beautifiedText.value).then(() => {
    alert('已复制到剪贴板')
  })
}
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

.preview {
  padding: 16px;
  min-height: 300px;
  white-space: pre-wrap;
  line-height: 1.8;
}

.preview.placeholder {
  color: #999;
  font-style: italic;
}

.options {
  margin-bottom: 20px;
}

.options h3 {
  margin-bottom: 15px;
  color: #333;
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.checkbox-label:hover {
  background: #f0f0f0;
}

.checkbox-label input {
  margin-right: 8px;
}

.stats {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.stats p {
  margin: 0;
  color: #666;
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