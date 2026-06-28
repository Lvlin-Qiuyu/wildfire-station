<template>
  <div class="tool-page">
    <h2>📝 自然语言处理器</h2>
    <p class="subtitle">文本分析工具：词频统计、关键词提取、情感分析（基础版）、可读性评分</p>

    <!-- 文本输入 -->
    <div class="input-section">
      <label class="input-label">输入文本</label>
      <textarea
        v-model="inputText"
        @input="analyzeText"
        placeholder="在此输入要分析的文本..."
        rows="8"
        class="text-input"
      ></textarea>
      <div class="input-stats">
        <span>字符数：{{ charCount }}</span>
        <span>词数：{{ wordCount }}</span>
      </div>
    </div>

    <!-- 分析结果 -->
    <div v-if="analysisResults" class="results-section">
      <!-- 总览卡片 -->
      <div class="overview-cards">
        <div class="card">
          <div class="card-icon">📊</div>
          <div class="card-title">文本概览</div>
          <div class="card-content">
            <div class="stat-item">
              <label>总词数</label>
              <div>{{ analysisResults.totalWords }}</div>
            </div>
            <div class="stat-item">
              <label>句子数</label>
              <div>{{ analysisResults.sentenceCount }}</div>
            </div>
            <div class="stat-item">
              <label>段落数</label>
              <div>{{ analysisResults.paragraphCount }}</div>
            </div>
            <div class="stat-item">
              <label>平均句长</label>
              <div>{{ analysisResults.avgWordsPerSentence.toFixed(1) }}</div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-icon">😊</div>
          <div class="card-title">情感倾向</div>
          <div class="card-content">
            <div class="sentiment-score">
              <div class="sentiment-label">情感指数</div>
              <div class="sentiment-value" :class="getSentimentClass(analysisResults.sentiment)">
                {{ (analysisResults.sentiment * 100).toFixed(1) }}%
              </div>
            </div>
            <div class="sentiment-desc">{{ getSentimentDesc(analysisResults.sentiment) }}</div>
          </div>
        </div>

        <div class="card">
          <div class="card-icon">📖</div>
          <div class="card-title">可读性评分</div>
          <div class="card-content">
            <div class="readability-score">
              <div class="readability-label">Flesch-Kincaid</div>
              <div class="readability-value" :class="getReadabilityClass(analysisResults.readabilityScore)">
                {{ analysisResults.readabilityScore.toFixed(1) }}
              </div>
            </div>
            <div class="readability-desc">{{ getReadabilityDesc(analysisResults.readabilityScore) }}</div>
          </div>
        </div>
      </div>

      <!-- 词频统计 -->
      <div class="subsection">
        <div class="subsection-header">
          <h3>词频统计</h3>
          <div class="filter-controls">
            <label>排序：</label>
            <select v-model="wordFreqSort" @change="sortWordFreq" class="sort-select">
              <option value="frequency">频率</option>
              <option value="word">单词</option>
              <option value="length">长度</option>
            </select>
            <label>显示：</label>
            <select v-model="wordFreqLimit" @change="sortWordFreq" class="limit-select">
              <option :value="10">10个</option>
              <option :value="20">20个</option>
              <option :value="50">50个</option>
            </select>
          </div>
        </div>
        <div class="word-freq-list">
          <div 
            v-for="(item, index) in sortedWordFreq" 
            :key="item.word"
            class="freq-item"
            :class="{ 'stopword': item.isStopword }"
          >
            <span class="rank">{{ index + 1 }}</span>
            <span class="word">{{ item.word }}</span>
            <span class="bar-container">
              <span 
                class="bar" 
                :style="{ width: `${(item.frequency / maxFrequency) * 100}%` }"
              ></span>
            </span>
            <span class="frequency">{{ item.frequency }}次</span>
            <span class="percentage">{{ item.percentage }}%</span>
          </div>
        </div>
      </div>

      <!-- 关键词提取 -->
      <div class="subsection">
        <h3>关键词提取</h3>
        <div class="keywords-list">
          <div 
            v-for="(keyword, index) in analysisResults.keywords" 
            :key="keyword.word"
            class="keyword-item"
          >
            <span class="keyword-rank">{{ index + 1 }}.</span>
            <span class="keyword-word">{{ keyword.word }}</span>
            <span class="keyword-score">权重: {{ keyword.score.toFixed(3) }}</span>
          </div>
        </div>
      </div>

      <!-- 文本统计 -->
      <div class="subsection">
        <h3>详细统计</h3>
        <div class="detailed-stats">
          <div class="stat-grid">
            <div class="stat-item">
              <label>字符总数</label>
              <div>{{ analysisResults.charCount }}</div>
            </div>
            <div class="stat-item">
              <label>字符(不含空格)</label>
              <div>{{ analysisResults.charCountNoSpaces }}</div>
            </div>
            <div class="stat-item">
              <label>中文字数</label>
              <div>{{ analysisResults.chineseCount }}</div>
            </div>
            <div class="stat-item">
              <label>英文单词</label>
              <div>{{ analysisResults.englishWords }}</div>
            </div>
            <div class="stat-item">
              <label>数字数量</label>
              <div>{{ analysisResults.digitCount }}</div>
            </div>
            <div class="stat-item">
              <label>标点符号</label>
              <div>{{ analysisResults.punctuationCount }}</div>
            </div>
            <div class="stat-item">
              <label>平均词长</label>
              <div>{{ analysisResults.avgWordLength.toFixed(1) }}</div>
            </div>
            <div class="stat-item">
              <label>词汇丰富度</label>
              <div>{{ (analysisResults.lexicalDiversity * 100).toFixed(1) }}%</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 文档类型检测 -->
      <div class="subsection">
        <h3>文档类型分析</h3>
        <div class="doc-type-analysis">
          <div 
            v-for="(type, key) in analysisResults.docTypes" 
            :key="key"
            class="doc-type-item"
          >
            <div class="doc-type-label">{{ getDocTypeName(key) }}</div>
            <div class="doc-type-bar-container">
              <div 
                class="doc-type-bar" 
                :style="{ width: `${type.percentage}%` }"
                :class="`doc-type-${key}`"
              ></div>
            </div>
            <div class="doc-type-percentage">{{ type.percentage.toFixed(1) }}%</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 示例文本 -->
    <div class="examples-section">
      <h3>示例文本</h3>
      <div class="examples-grid">
        <button 
          v-for="example in examples" 
          :key="example.name"
          @click="loadExample(example.text)"
          class="example-btn"
        >{{ example.name }}</button>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '自然语言处理器 - 野火小站' })

const inputText = ref('')
const wordFreqSort = ref('frequency')
const wordFreqLimit = ref(10)
const analysisResults = ref(null)
const sortedWordFreq = ref([])
const maxFrequency = ref(1)

// 停用词列表
const stopWords = new Set([
  // 英文停用词
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
  'must', 'shall', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him',
  'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their', 'said', 'say', 'says', 'now', 'then', 'here',
  'there', 'when', 'where', 'what', 'who', 'which', 'how', 'why', 'if', 'because', 'so', 'just', 'only', 'very',
  'really', 'one', 'two', 'first', 'last', 'get', 'got', 'also', 'can', 'will', 'would', 'could', 'should',
  
  // 中文停用词
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要',
  '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '那', '里', '后', '可以', '但是', '还是', '对', '从',
  '她', '他', '它', '我们', '你们', '他们', '这个', '那个', '什么', '怎么', '为什么', '哪里', '哪个', '多', '少',
  '什么时候', '怎样', '吗', '呢', '啊', '吧', '呀', '哦', '哟', '嘿', '喂', '嘿', '哎呀', '哎呀呀', '不得了',
  '已经', '刚才', '现在', '明天', '今天', '昨天', '去年', '今年', '明年', '上午', '下午', '晚上', '时候', '时间'
])

// 示例文本
const examples = ref([
  {
    name: '科技新闻',
    text: '人工智能技术正在快速发展，深度学习算法在图像识别、自然语言处理等领域取得了显著进展。机器学习模型能够处理大量数据，从中提取有用的信息。神经网络架构不断创新，从传统的多层感知机到现在的Transformer模型，展现了强大的学习能力。未来，AI技术将在更多领域得到应用，推动社会进步和发展。'
  },
  {
    name: '产品描述',
    text: '这款智能手表采用最新的AMOLED显示屏，具有出色的视觉效果和低功耗特性。内置心率监测、血氧检测、睡眠分析等多种健康功能。支持50米防水设计，适合运动和日常使用。电池续航可达7天，快速充电技术让充电更加便捷。兼容iOS和Android系统，通过蓝牙5.0连接稳定可靠。多种表盘可选，满足不同场合的佩戴需求。'
  },
  {
    name: '文学作品',
    text: '春暖花开的季节，阳光透过树叶洒在大地上，形成斑驳的光影。微风轻拂，带来阵阵花香，让人心旷神怡。鸟儿在枝头欢快地歌唱，它们的歌声清脆悦耳，仿佛在诉说着春天的美好。远处的山峦披上了新绿，近处的花朵竞相绽放，整个世界都充满了生机与活力。这是一个充满希望和美好的季节，让人对未来充满期待。'
  }
])

// 分析文本
const analyzeText = () => {
  if (!inputText.value.trim()) {
    analysisResults.value = null
    sortedWordFreq.value = []
    return
  }

  // 基本统计
  const charCount = inputText.value.length
  const charCountNoSpaces = inputText.value.replace(/\s/g, '').length
  const words = extractWords(inputText.value)
  const wordCount = words.length
  const sentences = splitSentences(inputText.value)
  const paragraphs = inputText.value.split(/\n\s*\n/).filter(p => p.trim())

  // 词频统计
  const wordFreq = {}
  words.forEach(word => {
    const normalized = normalizeWord(word)
    if (normalized && normalized.length > 1) { // 过滤单字符
      wordFreq[normalized] = (wordFreq[normalized] || 0) + 1
    }
  })

  // 词频数组
  const wordFreqArray = Object.entries(wordFreq).map(([word, frequency]) => ({
    word,
    frequency,
    percentage: ((frequency / wordCount) * 100).toFixed(2),
    isStopword: stopWords.has(word.toLowerCase())
  }))

  // 计算最大频率
  maxFrequency.value = Math.max(...wordFreqArray.map(item => item.frequency))

  // 情感分析
  const sentiment = analyzeSentiment(inputText.value)

  // 可读性评分
  const readabilityScore = calculateReadability(words, sentences)

  // 关键词提取
  const keywords = extractKeywords(wordFreqArray, 10)

  // 文档类型分析
  const docTypes = analyzeDocumentType(inputText.value)

  // 其他统计
  const chineseCount = (inputText.value.match(/[\u4e00-\u9fff]/g) || []).length
  const englishWords = words.filter(word => /^[a-zA-Z]+$/.test(word)).length
  const digitCount = (inputText.value.match(/\d/g) || []).length
  const punctuationCount = (inputText.value.match(/[^\w\s\u4e00-\u9fff]/g) || []).length
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length
  const uniqueWords = new Set(words.map(normalizeWord)).size
  const lexicalDiversity = uniqueWords / words.length

  analysisResults.value = {
    charCount,
    charCountNoSpaces,
    chineseCount,
    englishWords,
    digitCount,
    punctuationCount,
    wordCount,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    avgWordsPerSentence: wordCount / sentences.length,
    avgWordLength,
    lexicalDiversity,
    totalWords: wordCount,
    wordFreq: wordFreqArray,
    keywords,
    sentiment,
    readabilityScore,
    docTypes,
    sentences,
    paragraphs
  }

  // 排序词频
  sortWordFreq()
}

// 提取单词
const extractWords = (text) => {
  // 中英文分词
  const englishMatches = text.match(/[a-zA-Z]+/g) || []
  const chineseMatches = text.match(/[\u4e00-\u9fff]+/g) || []
  
  return [...englishMatches, ...chineseMatches]
}

// 规范化单词
const normalizeWord = (word) => {
  return word.toLowerCase().replace(/[^\w\u4e00-\u9fff]/g, '')
}

// 分割句子
const splitSentences = (text) => {
  return text.split(/[。！？.!?]+/).filter(s => s.trim())
}

// 情感分析
const analyzeSentiment = (text) => {
  // 简单的情感词典分析
  const positiveWords = ['好', '棒', '优秀', '完美', '喜欢', '爱', '开心', '快乐', '满意', '成功', '美好', '出色', '卓越', '杰出', '很好', '非常好']
  const negativeWords = ['坏', '差', '糟糕', '失败', '讨厌', '恨', '难过', '痛苦', '不满', '错误', '问题', '困难', '麻烦', '很坏', '非常差']

  let score = 0
  const words = text.toLowerCase().split(/\s+/)
  
  words.forEach(word => {
    if (positiveWords.some(pw => word.includes(pw))) {
      score += 1
    } else if (negativeWords.some(nw => word.includes(nw))) {
      score -= 1
    }
  })

  // 归一化到 -1 到 1 之间
  const normalizedScore = Math.max(-1, Math.min(1, score / Math.max(words.length / 10, 1)))
  return normalizedScore
}

// 计算可读性分数
const calculateReadability = (words, sentences) => {
  if (sentences.length === 0) return 0

  const avgWordsPerSentence = words.length / sentences.length
  const avgCharsPerWord = words.reduce((sum, word) => sum + word.length, 0) / words.length
  
  // Flesch-Kincaid 简化版本
  // 原公式：206.835 - 1.015 * (总字数/句子数) - 84.6 * (总音节数/总字数)
  // 这里简化处理
  const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * (avgCharsPerWord / 2)
  
  return Math.max(0, Math.min(100, score))
}

// 提取关键词
const extractKeywords = (wordFreqArray, limit) => {
  // 基于词频和长度的简单关键词提取
  return wordFreqArray
    .filter(item => !item.isStopword && item.word.length >= 2)
    .sort((a, b) => {
      // 综合考虑词频和词长度
      const scoreA = a.frequency * a.word.length
      const scoreB = b.frequency * b.word.length
      return scoreB - scoreA
    })
    .slice(0, limit)
    .map((item, index) => ({
      word: item.word,
      score: item.frequency * item.word.length,
      rank: index + 1
    }))
}

// 分析文档类型
const analyzeDocumentType = (text) => {
  const types = {
    'news': { keywords: ['新闻', '报道', '消息', '事件', '最新', '记者', '发布'], score: 0 },
    'tech': { keywords: ['技术', '开发', '代码', '算法', '系统', '软件', '硬件'], score: 0 },
    'literature': { keywords: ['文学', '诗歌', '小说', '散文', '作者', '作品'], score: 0 },
    'business': { keywords: ['商业', '市场', '公司', '企业', '投资', '收益'], score: 0 },
    'education': { keywords: ['学习', '教育', '课程', '学生', '教师', '学校'], score: 0 },
    'life': { keywords: ['生活', '日常', '家庭', '朋友', '美食', '旅行'], score: 0 }
  }

  const lowerText = text.toLowerCase()
  
  Object.entries(types).forEach(([key, type]) => {
    type.keywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        type.score += 1
      }
    })
  })

  // 计算百分比
  const totalScore = Object.values(types).reduce((sum, type) => sum + type.score, 0)
  
  Object.entries(types).forEach(([key, type]) => {
    types[key].percentage = totalScore > 0 ? (type.score / totalScore * 100) : 0
  })

  return types
}

// 排序词频
const sortWordFreq = () => {
  if (!analysisResults.value) return

  let sorted = [...analysisResults.value.wordFreq]
  
  switch (wordFreqSort.value) {
    case 'frequency':
      sorted.sort((a, b) => b.frequency - a.frequency)
      break
    case 'word':
      sorted.sort((a, b) => a.word.localeCompare(b.word))
      break
    case 'length':
      sorted.sort((a, b) => b.word.length - a.word.length)
      break
  }

  sortedWordFreq.value = sorted.slice(0, wordFreqLimit.value)
}

// 获取情感描述
const getSentimentDesc = (sentiment) => {
  if (sentiment > 0.3) return '积极正面'
  if (sentiment > -0.3) return '中性平衡'
  return '消极负面'
}

// 获取情感样式类
const getSentimentClass = (sentiment) => {
  if (sentiment > 0.3) return 'positive'
  if (sentiment > -0.3) return 'neutral'
  return 'negative'
}

// 获取可读性描述
const getReadabilityDesc = (score) => {
  if (score >= 90) return '非常易读（小学水平）'
  if (score >= 80) return '易读（初中水平）'
  if (score >= 70) return '中等（高中水平）'
  if (score >= 60) return '较难（大学水平）'
  return '很难（专业水平）'
}

// 获取可读性样式类
const getReadabilityClass = (score) => {
  if (score >= 80) return 'easy'
  if (score >= 60) return 'medium'
  return 'hard'
}

// 获取文档类型名称
const getDocTypeName = (key) => {
  const typeNames = {
    'news': '新闻',
    'tech': '技术',
    'literature': '文学',
    'business': '商业',
    'education': '教育',
    'life': '生活'
  }
  return typeNames[key] || key
}

// 加载示例
const loadExample = (text) => {
  inputText.value = text
  analyzeText()
}

// 计算输入统计
const charCount = computed(() => inputText.value.length)
const wordCount = computed(() => {
  if (!inputText.value.trim()) return 0
  return extractWords(inputText.value).length
})
</script>

<style scoped>
.tool-page {
  @apply max-w-6xl mx-auto px-4 py-8;
}

.subtitle {
  @apply text-gray-600 mb-8;
}

.input-section {
  @apply bg-gray-50 rounded-lg p-6 mb-8;
}

.input-label {
  @apply block text-sm font-medium text-gray-700 mb-2;
}

.text-input {
  @apply w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.input-stats {
  @apply mt-2 text-sm text-gray-500 flex gap-4;
}

.results-section {
  @apply space-y-8;
}

.overview-cards {
  @apply grid grid-cols-1 md:grid-cols-3 gap-6;
}

.card {
  @apply bg-white border border-gray-200 rounded-lg p-6 shadow-sm;
}

.card-icon {
  @apply text-2xl mb-2;
}

.card-title {
  @apply text-lg font-semibold mb-4;
}

.card-content {
  @apply space-y-3;
}

.stat-item {
  @apply flex justify-between items-center py-1;
}

.stat-item label {
  @apply text-sm text-gray-600;
}

.stat-item div {
  @apply font-medium;
}

.sentiment-score {
  @apply text-center;
}

.sentiment-label {
  @apply text-sm text-gray-600 block mb-1;
}

.sentiment-value {
  @apply text-2xl font-bold;
}

.sentiment-value.positive {
  @apply text-green-600;
}

.sentiment-value.neutral {
  @apply text-yellow-600;
}

.sentiment-value.negative {
  @apply text-red-600;
}

.sentiment-desc {
  @apply text-sm text-gray-600 mt-2;
}

.readability-score {
  @apply text-center;
}

.readability-label {
  @apply text-sm text-gray-600 block mb-1;
}

.readability-value {
  @apply text-2xl font-bold;
}

.readability-value.easy {
  @apply text-green-600;
}

.readability-value.medium {
  @apply text-yellow-600;
}

.readability-value.hard {
  @apply text-red-600;
}

.readability-desc {
  @apply text-sm text-gray-600 mt-2;
}

.subsection {
  @apply bg-white border border-gray-200 rounded-lg p-6;
}

.subsection-header {
  @apply flex justify-between items-center mb-4;
}

.subsection-header h3 {
  @apply text-lg font-semibold;
}

.filter-controls {
  @apply flex items-center gap-2;
}

.sort-select, .limit-select {
  @apply px-2 py-1 border border-gray-300 rounded text-sm;
}

.word-freq-list {
  @apply space-y-2;
}

.freq-item {
  @apply flex items-center gap-3 p-2 border border-gray-200 rounded;
}

.freq-item.stopword {
  @apply opacity-60;
}

.rank {
  @apply w-8 text-sm font-medium;
}

.word {
  @apply flex-1 font-medium;
}

.bar-container {
  @apply flex-1 h-4 bg-gray-200 rounded overflow-hidden;
}

.bar {
  @apply h-full bg-blue-500 transition-all duration-300;
}

.frequency {
  @apply w-12 text-sm text-gray-600;
}

.percentage {
  @apply w-12 text-sm text-gray-500;
}

.keywords-list {
  @apply space-y-2;
}

.keyword-item {
  @apply flex items-center gap-3 p-2 border border-gray-200 rounded;
}

.keyword-rank {
  @apply w-8 text-sm font-medium;
}

.keyword-word {
  @apply flex-1 font-medium;
}

.keyword-score {
  @apply w-20 text-sm text-gray-600;
}

.detailed-stats {
  @apply space-y-4;
}

.stat-grid {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4;
}

.doc-type-analysis {
  @apply space-y-3;
}

.doc-type-item {
  @apply flex items-center gap-3;
}

.doc-type-label {
  @apply w-20 text-sm font-medium;
}

.doc-type-bar-container {
  @apply flex-1 h-4 bg-gray-200 rounded overflow-hidden;
}

.doc-type-bar {
  @apply h-full transition-all duration-300;
}

.doc-type-bar.news {
  @apply bg-blue-500;
}

.doc-type-bar.tech {
  @apply bg-green-500;
}

.doc-type-bar.literature {
  @apply bg-purple-500;
}

.doc-type-bar.business {
  @apply bg-yellow-500;
}

.doc-type-bar.education {
  @apply bg-red-500;
}

.doc-type-bar.life {
  @apply bg-pink-500;
}

.doc-type-percentage {
  @apply w-12 text-sm text-gray-600;
}

.examples-section {
  @apply mt-8;
}

.examples-section h3 {
  @apply text-lg font-semibold mb-4;
}

.examples-grid {
  @apply flex flex-wrap gap-2;
}

.example-btn {
  @apply px-4 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors text-sm;
}

.back-link {
  @apply inline-block mt-8 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors;
}
</style>