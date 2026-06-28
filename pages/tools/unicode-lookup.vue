<template>
  <div class="tool-page">
    <h2>🔤 Unicode字符查询工具</h2>
    <p class="subtitle">输入字符或代码点，查询Unicode详细信息、字符名称、编码等</p>

    <!-- 输入区域 -->
    <div class="input-section">
      <div class="input-modes">
        <button 
          :class="{ active: inputMode === 'char' }" 
          @click="inputMode = 'char'"
          class="mode-btn"
        >字符输入</button>
        <button 
          :class="{ active: inputMode === 'code' }" 
          @click="inputMode = 'code'"
          class="mode-btn"
        >代码点输入</button>
      </div>
      
      <div class="input-area">
        <input
          v-if="inputMode === 'char'"
          v-model="charInput"
          @input="analyzeChar"
          placeholder="输入要查询的字符，如：A, 中, 🚀"
          class="char-input"
          maxlength="10"
        />
        <input
          v-else
          v-model="codeInput"
          @input="analyzeCode"
          placeholder="输入Unicode代码点，如：65, 20013, 128640"
          class="code-input"
          maxlength="10"
        />
        <div class="input-hint" v-if="inputMode === 'char'">
          支持单个字符或emoji表情
        </div>
        <div class="input-hint" v-else>
          支持10进制、16进制（0x前缀）
        </div>
      </div>
    </div>

    <!-- 查询结果 -->
    <div v-if="unicodeInfo.char" class="result-section">
      <!-- 字符展示 -->
      <div class="char-display">
        <div class="char-big">{{ unicodeInfo.char }}</div>
        <div class="char-name">{{ unicodeInfo.name || '未知字符' }}</div>
      </div>

      <!-- 详细信息 -->
      <div class="details-grid">
        <div class="detail-item">
          <label>Unicode代码点</label>
          <div class="detail-value">
            <code>{{ unicodeInfo.codePoint }}</code>
          </div>
        </div>
        
        <div class="detail-item">
          <label>UTF-16编码</label>
          <div class="detail-value">
            <code>{{ unicodeInfo.utf16 }}</code>
            <button v-if="unicodeInfo.utf16" @click="copyToClipboard(unicodeInfo.utf16)" class="copy-btn">复制</button>
          </div>
        </div>
        
        <div class="detail-item">
          <label>UTF-8编码</label>
          <div class="detail-value">
            <code>{{ unicodeInfo.utf8 }}</code>
            <button v-if="unicodeInfo.utf8" @click="copyToClipboard(unicodeInfo.utf8)" class="copy-btn">复制</button>
          </div>
        </div>
        
        <div class="detail-item">
          <label>字符类别</label>
          <div class="detail-value">{{ unicodeInfo.category }}</div>
        </div>
        
        <div class="detail-item">
          <label>双向类别</label>
          <div class="detail-value">{{ unicodeInfo.bidi }}</div>
        </div>
        
        <div class="detail-item">
          <label>字符属性</label>
          <div class="detail-value">{{ unicodeInfo.property }}</div>
        </div>
      </div>

      <!-- 字符信息说明 -->
      <div class="info-section">
        <h3>字符信息说明</h3>
        <div class="info-grid">
          <div class="info-item">
            <strong>字符名称：</strong>{{ unicodeInfo.name || '无官方名称' }}
          </div>
          <div class="info-item">
            <strong>Unicode版本：</strong>{{ unicodeInfo.version || '未知' }}
          </div>
          <div class="info-item">
            <strong>是否控制字符：</strong>{{ unicodeInfo.isControl ? '是' : '否' }}
          </div>
          <div class="info-item">
            <strong>是否可打印：</strong>{{ unicodeInfo.isPrintable ? '是' : '否' }}
          </div>
        </div>
      </div>

      <!-- 相似字符推荐 -->
      <div v-if="unicodeInfo.similarChars && unicodeInfo.similarChars.length" class="similar-section">
        <h3>相似字符</h3>
        <div class="similar-chars">
          <button 
            v-for="char in unicodeInfo.similarChars" 
            :key="char" 
            @click="selectChar(char)"
            class="similar-char-btn"
          >{{ char }}</button>
        </div>
      </div>
    </div>

    <!-- 快速搜索 -->
    <div class="quick-search">
      <h3>快速搜索</h3>
      <div class="search-tags">
        <button 
          v-for="tag in searchTags" 
          :key="tag.name"
          @click="quickSearch(tag)"
          class="search-tag"
        >{{ tag.name }} ({{ tag.count }})</button>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'Unicode字符查询工具 - 野火小站' })

const inputMode = ref('char')
const charInput = ref('')
const codeInput = ref('')
const unicodeInfo = ref({
  char: '',
  codePoint: '',
  utf16: '',
  utf8: '',
  name: '',
  category: '',
  bidi: '',
  property: '',
  version: '',
  isControl: false,
  isPrintable: true,
  similarChars: []
})

const searchTags = ref([
  { name: '字母', count: 26 },
  { name: '数字', count: 10 },
  { name: '中文', count: 1000 },
  { name: 'Emoji', count: 1500 },
  { name: '符号', count: 200 },
  { name: '控制字符', count: 65 }
])

// 分析字符
const analyzeChar = () => {
  if (!charInput.value) {
    unicodeInfo.value = {
      char: '',
      codePoint: '',
      utf16: '',
      utf8: '',
      name: '',
      category: '',
      bidi: '',
      property: '',
      version: '',
      isControl: false,
      isPrintable: true,
      similarChars: []
    }
    return
  }

  const char = charInput.value
  const codePoint = char.codePointAt(0)
  
  unicodeInfo.value = {
    char: char,
    codePoint: `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`,
    utf16: getUTF16(char),
    utf8: getUTF8(codePoint),
    name: getCharName(char, codePoint),
    category: getCategory(codePoint),
    bidi: getBidiClass(codePoint),
    property: getProperty(codePoint),
    version: getVersion(codePoint),
    isControl: (codePoint >= 0x0000 && codePoint <= 0x001F) || (codePoint >= 0x007F && codePoint <= 0x009F),
    isPrintable: isPrintable(codePoint),
    similarChars: findSimilarChars(char, codePoint)
  }
}

// 分析代码点
const analyzeCode = () => {
  if (!codeInput.value) {
    unicodeInfo.value = {
      char: '',
      codePoint: '',
      utf16: '',
      utf8: '',
      name: '',
      category: '',
      bidi: '',
      property: '',
      version: '',
      isControl: false,
      isPrintable: true,
      similarChars: []
    }
    return
  }

  let codePoint
  if (codeInput.value.startsWith('0x')) {
    // 16进制
    codePoint = parseInt(codeInput.value.substring(2), 16)
  } else {
    // 10进制
    codePoint = parseInt(codeInput.value, 10)
  }

  if (isNaN(codePoint) || codePoint < 0 || codePoint > 0x10FFFF) {
    return
  }

  const char = String.fromCodePoint(codePoint)
  
  unicodeInfo.value = {
    char: char,
    codePoint: `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`,
    utf16: getUTF16(char),
    utf8: getUTF8(codePoint),
    name: getCharName(char, codePoint),
    category: getCategory(codePoint),
    bidi: getBidiClass(codePoint),
    property: getProperty(codePoint),
    version: getVersion(codePoint),
    isControl: (codePoint >= 0x0000 && codePoint <= 0x001F) || (codePoint >= 0x007F && codePoint <= 0x009F),
    isPrintable: isPrintable(codePoint),
    similarChars: findSimilarChars(char, codePoint)
  }
}

// 获取UTF-16编码
const getUTF16 = (char) => {
  const codeUnits = []
  for (let i = 0; i < char.length; i++) {
    codeUnits.push(char.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0'))
  }
  return codeUnits.join(' ')
}

// 获取UTF-8编码
const getUTF8 = (codePoint) => {
  if (codePoint <= 0x7F) {
    return codePoint.toString(16).toUpperCase().padStart(2, '0')
  } else if (codePoint <= 0x7FF) {
    const byte1 = 0xC0 | ((codePoint >> 6) & 0x1F)
    const byte2 = 0x80 | (codePoint & 0x3F)
    return `${byte1.toString(16).toUpperCase().padStart(2, '0')} ${byte2.toString(16).toUpperCase().padStart(2, '0')}`
  } else if (codePoint <= 0xFFFF) {
    const byte1 = 0xE0 | ((codePoint >> 12) & 0x0F)
    const byte2 = 0x80 | ((codePoint >> 6) & 0x3F)
    const byte3 = 0x80 | (codePoint & 0x3F)
    return `${byte1.toString(16).toUpperCase().padStart(2, '0')} ${byte2.toString(16).toUpperCase().padStart(2, '0')} ${byte3.toString(16).toUpperCase().padStart(2, '0')}`
  } else {
    const byte1 = 0xF0 | ((codePoint >> 18) & 0x07)
    const byte2 = 0x80 | ((codePoint >> 12) & 0x3F)
    const byte3 = 0x80 | ((codePoint >> 6) & 0x3F)
    const byte4 = 0x80 | (codePoint & 0x3F)
    return `${byte1.toString(16).toUpperCase().padStart(2, '0')} ${byte2.toString(16).toUpperCase().padStart(2, '0')} ${byte3.toString(16).toUpperCase().padStart(2, '0')} ${byte4.toString(16).toUpperCase().padStart(2, '0')}`
  }
}

// 获取字符名称
const getCharName = (char, codePoint) => {
  // 常见字符名称映射
  const nameMap = {
    0x0020: 'SPACE',
    0x0021: 'EXCLAMATION MARK',
    0x0022: 'QUOTATION MARK',
    0x0023: 'NUMBER SIGN',
    0x0024: 'DOLLAR SIGN',
    0x0025: 'PERCENT SIGN',
    0x0026: 'AMPERSAND',
    0x0027: 'APOSTROPHE',
    0x0028: 'LEFT PARENTHESIS',
    0x0029: 'RIGHT PARENTHESIS',
    0x002A: 'ASTERISK',
    0x002B: 'PLUS SIGN',
    0x002C: 'COMMA',
    0x002D: 'HYPHEN-MINUS',
    0x002E: 'FULL STOP',
    0x002F: 'SOLIDUS',
    0x0030: 'DIGIT ZERO',
    0x0031: 'DIGIT ONE',
    0x0032: 'DIGIT TWO',
    0x0033: 'DIGIT THREE',
    0x0034: 'DIGIT FOUR',
    0x0035: 'DIGIT FIVE',
    0x0036: 'DIGIT SIX',
    0x0037: 'DIGIT SEVEN',
    0x0038: 'DIGIT EIGHT',
    0x0039: 'DIGIT NINE'
  }

  if (nameMap[codePoint]) {
    return nameMap[codePoint]
  }

  // 数字
  if (codePoint >= 0x0030 && codePoint <= 0x0039) {
    return `DIGIT ${String.fromCharCode(codePoint)}`
  }

  // 大写字母
  if (codePoint >= 0x0041 && codePoint <= 0x005A) {
    return `LATIN CAPITAL LETTER ${String.fromCharCode(codePoint)}`
  }

  // 小写字母
  if (codePoint >= 0x0061 && codePoint <= 0x007A) {
    return `LATIN SMALL LETTER ${String.fromCharCode(codePoint)}`
  }

  // 中文字符
  if (codePoint >= 0x4E00 && codePoint <= 0x9FFF) {
    return `CJK UNIFIED IDEOGRAPH-${codePoint.toString(16).toUpperCase()}`
  }

  // Emoji
  if (codePoint >= 0x1F600) {
    return 'EMOTICON'
  }

  return `U+${codePoint.toString(16).toUpperCase()}`
}

// 获取字符类别
const getCategory = (codePoint) => {
  if (codePoint >= 0x0030 && codePoint <= 0x0039) return 'Number'
  if (codePoint >= 0x0041 && codePoint <= 0x005A) return 'Letter, uppercase'
  if (codePoint >= 0x0061 && codePoint <= 0x007A) return 'Letter, lowercase'
  if (codePoint >= 0x4E00 && codePoint <= 0x9FFF) return 'CJK Ideograph'
  if (codePoint >= 0x1F600 && codePoint <= 0x1F64F) return 'Emoji'
  if ((codePoint >= 0x0000 && codePoint <= 0x001F) || (codePoint >= 0x007F && codePoint <= 0x009F)) return 'Control'
  return 'Other'
}

// 获取双向类别
const getBidiClass = (codePoint) => {
  if (codePoint >= 0x0041 && codePoint <= 0x005A) return 'L'
  if (codePoint >= 0x0061 && codePoint <= 0x007A) return 'L'
  if (codePoint >= 0x0030 && codePoint <= 0x0039) return 'EN'
  if (codePoint >= 0x4E00 && codePoint <= 0x9FFF) return 'R'
  return 'ON'
}

// 获取字符属性
const getProperty = (codePoint) => {
  if (codePoint >= 0x0030 && codePoint <= 0x0039) return 'Decimal'
  if (codePoint >= 0x0041 && codePoint <= 0x005A) return 'Uppercase'
  if (codePoint >= 0x0061 && codePoint <= 0x007A) return 'Lowercase'
  if (codePoint >= 0x4E00 && codePoint <= 0x9FFF) return 'Ideograph'
  return 'General'
}

// 获取Unicode版本
const getVersion = (codePoint) => {
  if (codePoint <= 0xFFFF) return '1.1'
  if (codePoint <= 0xFFFFF) return '2.0'
  return '3.0+'
}

// 判断是否可打印
const isPrintable = (codePoint) => {
  return !((codePoint >= 0x0000 && codePoint <= 0x001F) || (codePoint >= 0x007F && codePoint <= 0x009F))
}

// 查找相似字符
const findSimilarChars = (char, codePoint) => {
  const similar = []
  
  // 相同类别的字符
  if (codePoint >= 0x0041 && codePoint <= 0x005A) {
    similar.push(String.fromCharCode(codePoint + 32)) // 对应小写
  }
  
  // 其他常见字符
  if (similar.length < 3) {
    const commonChars = ['A', 'a', '1', '中', '国', '🌟']
    for (const c of commonChars) {
      if (c !== char && similar.length < 3) {
        similar.push(c)
      }
    }
  }
  
  return similar
}

// 选择字符
const selectChar = (char) => {
  charInput.value = char
  analyzeChar()
}

// 快速搜索
const quickSearch = (tag) => {
  if (tag.name === '字母') {
    charInput.value = 'A'
    analyzeChar()
  } else if (tag.name === '数字') {
    charInput.value = '1'
    analyzeChar()
  } else if (tag.name === '中文') {
    charInput.value = '中'
    analyzeChar()
  } else if (tag.name === 'Emoji') {
    charInput.value = '😊'
    analyzeChar()
  } else if (tag.name === '符号') {
    charInput.value = '@'
    analyzeChar()
  } else if (tag.name === '控制字符') {
    codeInput.value = '0x0007'
    analyzeCode()
  }
}

// 复制到剪贴板
const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text)
  // 这里可以添加复制成功的提示
}
</script>

<style scoped>
.tool-page {
  @apply max-w-4xl mx-auto px-4 py-8;
}

.subtitle {
  @apply text-gray-600 mb-8;
}

.input-section {
  @apply bg-gray-50 rounded-lg p-6 mb-8;
}

.input-modes {
  @apply flex gap-2 mb-4;
}

.mode-btn {
  @apply px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors;
}

.mode-btn.active {
  @apply bg-blue-500 text-white border-blue-500;
}

.input-area {
  @apply space-y-2;
}

.char-input, .code-input {
  @apply w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.input-hint {
  @apply text-sm text-gray-500;
}

.result-section {
  @apply space-y-6;
}

.char-display {
  @apply text-center py-8 border border-gray-200 rounded-lg;
}

.char-big {
  @apply text-6xl mb-2;
}

.char-name {
  @apply text-lg text-gray-600 font-medium;
}

.details-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.detail-item {
  @apply bg-gray-50 rounded-lg p-4;
}

.detail-item label {
  @apply block text-sm font-medium text-gray-700 mb-2;
}

.detail-value {
  @apply flex items-center justify-between;
}

.detail-value code {
  @apply bg-gray-200 px-2 py-1 rounded text-sm font-mono;
}

.copy-btn {
  @apply ml-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors;
}

.info-section, .similar-section {
  @apply bg-gray-50 rounded-lg p-6;
}

.info-section h3, .similar-section h3 {
  @apply text-lg font-medium mb-4;
}

.info-grid {
  @apply space-y-2;
}

.info-item {
  @apply text-sm;
}

.similar-chars {
  @apply flex flex-wrap gap-2;
}

.similar-char-btn {
  @apply px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors text-lg;
}

.quick-search {
  @apply mt-8;
}

.quick-search h3 {
  @apply text-lg font-medium mb-4;
}

.search-tags {
  @apply flex flex-wrap gap-2;
}

.search-tag {
  @apply px-3 py-1 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors text-sm;
}

.back-link {
  @apply inline-block mt-8 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors;
}
</style>