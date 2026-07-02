<template>
  <div class="tool-page">
    <h2>📝 在线测验生成器</h2>
    <p class="subtitle">粘贴JSON题目生成交互式测验，支持单选/多选/判断题，即时批改+统计</p>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>

    <!-- 输入区域 -->
    <div class="input-section">
      <div class="input-header">
        <label>JSON 题目数据</label>
        <div class="input-actions">
          <button class="btn-sm" @click="loadExample">加载示例</button>
          <button class="btn-sm" @click="clearInput">清空</button>
        </div>
      </div>
      <textarea
        v-model="jsonInput"
        class="input-area"
        placeholder='粘贴JSON格式题目数据，格式如下：&#10;[&#10;  {&#10;    "type": "single",&#10;    "question": "Vue 的作者是谁？",&#10;    "options": ["尤雨溪", "林纳斯", "丹·阿布拉莫夫"],&#10;    "answer": 0&#10;  },&#10;  {&#10;    "type": "multi",&#10;    "question": "以下哪些是前端框架？",&#10;    "options": ["Vue", "Django", "React", "Flask"],&#10;    "answer": [0, 2]&#10;  },&#10;  {&#10;    "type": "judge",&#10;    "question": "JavaScript 是弱类型语言",&#10;    "answer": true&#10;  }&#10;]'
        rows="10"
        spellcheck="false"
      ></textarea>
      <div v-if="parseError" class="parse-error">{{ parseError }}</div>
      <button class="btn-primary" @click="parseQuiz" :disabled="!jsonInput.trim()">
        🚀 生成测验
      </button>
    </div>

    <!-- 测验区域 -->
    <div v-if="parsed && questions.length > 0" class="quiz-area">
      <!-- 进度条 -->
      <div class="quiz-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="progress-text">
          {{ answeredCount }} / {{ questions.length }} 题已作答
        </div>
      </div>

      <!-- 题目列表 -->
      <div class="questions-list">
        <div v-for="(q, qi) in questions" :key="qi" :class="['question-card', { answered: q.userAnswer !== undefined, correct: submitted && isCorrect(q), wrong: submitted && !isCorrect(q) }]">
          <div class="question-header">
            <span class="question-number">{{ qi + 1 }}</span>
            <span class="question-type">{{ typeLabel(q.type) }}</span>
          </div>
          <div class="question-text">{{ q.question }}</div>

          <!-- 选项（单选/多选） -->
          <div v-if="q.type !== 'judge'" class="options-list">
            <div
              v-for="(opt, oi) in q.options"
              :key="oi"
              :class="['option-item', optionClass(q, oi)]"
              @click="selectOption(q, oi)"
            >
              <span class="option-marker">{{ optionMarker(oi) }}</span>
              <span class="option-text">{{ opt }}</span>
              <span v-if="submitted && isCorrectOption(q, oi)" class="option-icon">✅</span>
              <span v-else-if="submitted && isWrongOption(q, oi)" class="option-icon">❌</span>
            </div>
          </div>

          <!-- 判断题 -->
          <div v-else class="judge-options">
            <div
              :class="['option-item', judgeClass(q, true)]"
              @click="selectJudge(q, true)"
            >
              <span class="option-marker">✓</span>
              <span class="option-text">正确</span>
              <span v-if="submitted && q.answer === true && q.userAnswer === true" class="option-icon">✅</span>
              <span v-else-if="submitted && q.answer === true && q.userAnswer !== true" class="option-icon">❌</span>
              <span v-else-if="submitted && q.answer !== true && q.userAnswer === true" class="option-icon">❌</span>
            </div>
            <div
              :class="['option-item', judgeClass(q, false)]"
              @click="selectJudge(q, false)"
            >
              <span class="option-marker">✗</span>
              <span class="option-text">错误</span>
              <span v-if="submitted && q.answer === false && q.userAnswer === false" class="option-icon">✅</span>
              <span v-else-if="submitted && q.answer === false && q.userAnswer !== false" class="option-icon">❌</span>
              <span v-else-if="submitted && q.answer !== false && q.userAnswer === false" class="option-icon">❌</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="quiz-actions">
        <button v-if="!submitted" class="btn-primary btn-submit" @click="submitQuiz" :disabled="answeredCount < questions.length">
          ✅ 提交批改（{{ questions.length - answeredCount }}题未答）
        </button>
        <button v-if="submitted" class="btn-primary" @click="resetQuiz">🔄 重新作答</button>
        <button class="btn-sm" @click="parseQuiz">🔄 重新生成</button>
      </div>

      <!-- 统计结果 -->
      <div v-if="submitted" class="result-section">
        <div class="result-header">📊 测验结果</div>
        <div class="result-stats">
          <div class="stat-card correct-stat">
            <div class="stat-num">{{ correctCount }}</div>
            <div class="stat-label">正确</div>
          </div>
          <div class="stat-card wrong-stat">
            <div class="stat-num">{{ wrongCount }}</div>
            <div class="stat-label">错误</div>
          </div>
          <div class="stat-card rate-stat">
            <div class="stat-num">{{ rateText }}</div>
            <div class="stat-label">正确率</div>
          </div>
        </div>

        <!-- 可视化条 -->
        <div class="result-bar">
          <div class="bar-correct" :style="{ width: ratePercent + '%' }"></div>
          <div class="bar-wrong" :style="{ width: (100 - ratePercent) + '%' }"></div>
        </div>

        <div class="result-message">{{ resultMessage }}</div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="parsed && questions.length === 0" class="empty-state">
      <p>📋 未检测到有效题目，请检查JSON格式</p>
    </div>

    <!-- 格式说明 -->
    <details class="format-guide">
      <summary>📖 JSON 格式说明</summary>
      <div class="guide-content">
        <p>支持三种题型：<code>single</code>（单选）、<code>multi</code>（多选）、<code>judge</code>（判断）</p>
        <pre><code>[
  {
    "type": "single",
    "question": "问题内容",
    "options": ["选项A", "选项B", "选项C"],
    "answer": 0
  },
  {
    "type": "multi",
    "question": "多选题问题",
    "options": ["选项A", "选项B", "选项C", "选项D"],
    "answer": [0, 2]
  },
  {
    "type": "judge",
    "question": "判断题内容",
    "answer": true
  }
]</code></pre>
      </div>
    </details>
  </div>
</template>

<script setup>
useHead({ title: '在线测验生成器 - 野火小站' })

// ===== 状态 =====
const jsonInput = ref('')
const questions = ref([])
const parsed = ref(false)
const submitted = ref(false)
const parseError = ref('')

// ===== 计算属性 =====
const answeredCount = computed(() => questions.value.filter(q => q.userAnswer !== undefined).length)
const progressPercent = computed(() => questions.value.length > 0 ? (answeredCount.value / questions.value.length * 100) : 0)

const correctCount = computed(() => {
  if (!submitted.value) return 0
  return questions.value.filter(q => isCorrect(q)).length
})

const wrongCount = computed(() => {
  if (!submitted.value) return 0
  return questions.value.filter(q => !isCorrect(q)).length
})

const ratePercent = computed(() => {
  if (questions.value.length === 0) return 0
  return Math.round((correctCount.value / questions.value.length) * 100)
})

const rateText = computed(() => ratePercent.value + '%')

const resultMessage = computed(() => {
  const rate = ratePercent.value
  if (rate === 100) return '🎉 满分！太厉害了！'
  if (rate >= 80) return '👏 不错！掌握得很好！'
  if (rate >= 60) return '💪 还行，继续加油！'
  if (rate >= 40) return '📖 需要多复习一下～'
  return '😅 别灰心，再试一次吧！'
})

// ===== 方法 =====

// 题型标签
function typeLabel(type) {
  const map = { single: '单选题', multi: '多选题', judge: '判断题' }
  return map[type] || '未知'
}

// 选项标记
function optionMarker(idx) {
  return String.fromCharCode(65 + idx) // A, B, C, D...
}

// 选择单选/多选选项
function selectOption(q, oi) {
  if (submitted.value) return
  if (q.type === 'single') {
    q.userAnswer = oi
  } else if (q.type === 'multi') {
    if (!Array.isArray(q.userAnswer)) q.userAnswer = []
    const idx = q.userAnswer.indexOf(oi)
    if (idx === -1) {
      q.userAnswer.push(oi)
    } else {
      q.userAnswer.splice(idx, 1)
    }
    // 空数组视为未答
    if (q.userAnswer.length === 0) {
      delete q.userAnswer
    }
  }
}

// 选择判断题
function selectJudge(q, val) {
  if (submitted.value) return
  q.userAnswer = val
}

// 选项样式
function optionClass(q, oi) {
  const classes = []
  if (q.type === 'single') {
    classes.push('clickable')
    if (q.userAnswer === oi) classes.push('selected')
    if (submitted.value) {
      if (q.answer === oi) classes.push('correct-option')
      else if (q.userAnswer === oi && q.answer !== oi) classes.push('wrong-option')
    }
  } else if (q.type === 'multi') {
    classes.push('clickable')
    if (Array.isArray(q.userAnswer) && q.userAnswer.includes(oi)) classes.push('selected')
    if (submitted.value) {
      if (Array.isArray(q.answer) && q.answer.includes(oi)) classes.push('correct-option')
      else if (Array.isArray(q.userAnswer) && q.userAnswer.includes(oi) && !(Array.isArray(q.answer) && q.answer.includes(oi))) classes.push('wrong-option')
    }
  }
  return classes
}

function judgeClass(q, val) {
  const classes = ['clickable']
  if (q.userAnswer === val) classes.push('selected')
  if (submitted.value) {
    if (q.answer === val && q.userAnswer === val) classes.push('correct-option')
    else if (q.answer !== val && q.userAnswer === val) classes.push('wrong-option')
    else if (q.answer === val && q.userAnswer !== val) classes.push('correct-option')
  }
  return classes
}

function isCorrect(q) {
  if (q.userAnswer === undefined) return false
  if (q.type === 'single') return q.userAnswer === q.answer
  if (q.type === 'multi') {
    if (!Array.isArray(q.userAnswer) || !Array.isArray(q.answer)) return false
    const sorted1 = [...q.userAnswer].sort()
    const sorted2 = [...q.answer].sort()
    return sorted1.length === sorted2.length && sorted1.every((v, i) => v === sorted2[i])
  }
  if (q.type === 'judge') return q.userAnswer === q.answer
  return false
}

function isCorrectOption(q, oi) {
  if (q.type === 'single') return q.answer === oi
  if (q.type === 'multi') return Array.isArray(q.answer) && q.answer.includes(oi)
  return false
}

function isWrongOption(q, oi) {
  if (submitted.value && Array.isArray(q.userAnswer) && q.userAnswer.includes(oi) && !isCorrectOption(q, oi)) return true
  if (submitted.value && q.type === 'single' && q.userAnswer === oi && q.answer !== oi) return true
  return false
}

// 解析JSON
function parseQuiz() {
  parseError.value = ''
  submitted.value = false
  parsed.value = false
  questions.value = []

  const raw = jsonInput.value.trim()
  if (!raw) return

  try {
    const data = JSON.parse(raw)
    if (!Array.isArray(data)) {
      parseError.value = 'JSON 必须是数组格式 [{...}, {...}, ...]'
      parsed.value = true
      return
    }

    const valid = []
    for (const item of data) {
      if (!item.type || !item.question) continue
      if (item.type === 'single') {
        if (!Array.isArray(item.options) || item.answer === undefined) continue
        valid.push({
          type: 'single',
          question: item.question,
          options: item.options.map(String),
          answer: Number(item.answer),
        })
      } else if (item.type === 'multi') {
        if (!Array.isArray(item.options) || !Array.isArray(item.answer)) continue
        valid.push({
          type: 'multi',
          question: item.question,
          options: item.options.map(String),
          answer: item.answer.map(Number),
        })
      } else if (item.type === 'judge') {
        if (item.answer === undefined) continue
        valid.push({
          type: 'judge',
          question: item.question,
          answer: Boolean(item.answer),
        })
      }
    }

    questions.value = valid
    parsed.value = true

    // localStorage 保存进度
    if (valid.length > 0) {
      saveProgress()
    }
  } catch (e) {
    parseError.value = 'JSON 格式错误：' + e.message
    parsed.value = true
  }
}

// 提交批改
function submitQuiz() {
  submitted.value = true
  saveProgress()
}

// 重新作答
function resetQuiz() {
  submitted.value = false
  questions.value.forEach(q => {
    delete q.userAnswer
  })
  saveProgress()
}

// 进度存储
const STORAGE_KEY = 'quiz_maker_progress'

function saveProgress() {
  try {
    const data = {
      json: jsonInput.value,
      answers: questions.value.map(q => q.userAnswer),
      submitted: submitted.value,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const data = JSON.parse(raw)
    if (data.json) {
      jsonInput.value = data.json
      parseQuiz()
      // 恢复答案
      if (Array.isArray(data.answers)) {
        questions.value.forEach((q, i) => {
          if (data.answers[i] !== undefined) {
            q.userAnswer = data.answers[i]
          }
        })
      }
      if (data.submitted) {
        submitted.value = true
      }
    }
  } catch {}
}

// 加载示例
function loadExample() {
  jsonInput.value = JSON.stringify([
    { type: 'single', question: 'Vue 3 的响应式系统基于什么API？', options: ['Object.defineProperty', 'Proxy', 'MutationObserver', 'Reflect'], answer: 1 },
    { type: 'multi', question: '以下哪些是 JavaScript 的基本数据类型？', options: ['String', 'Object', 'Symbol', 'Array', 'BigInt', 'Number'], answer: [0, 2, 4, 5] },
    { type: 'judge', question: 'CSS 的 Flexbox 是一维布局模型，Grid 是二维布局模型', answer: true },
    { type: 'single', question: 'HTTP 状态码 304 表示什么？', options: ['请求成功', '永久重定向', '未修改（缓存）', '服务器错误'], answer: 2 },
    { type: 'multi', question: '以下哪些是合法的 CSS 选择器？', options: ['#id', '.class::after', '>child', '[attr="value"]', '??pseudo'], answer: [0, 1, 2, 3] },
    { type: 'judge', question: 'TypeScript 代码可以直接在浏览器中运行', answer: false },
    { type: 'single', question: 'Git 中，将本地分支推送到远程并建立关联的命令是？', options: ['git push origin main', 'git push -u origin main', 'git remote push main', 'git send origin main'], answer: 1 },
    { type: 'multi', question: '以下哪些属于 ES6 引入的新特性？', options: ['Promise', 'var 声明', '箭头函数', '解构赋值', 'GIL'], answer: [0, 2, 3] },
  ], null, 2)
  parseQuiz()
}

// 清空输入
function clearInput() {
  jsonInput.value = ''
  questions.value = []
  parsed.value = false
  submitted.value = false
  parseError.value = ''
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
}

// 初始化加载
onMounted(() => {
  loadProgress()
})
</script>

<style scoped>
.tool-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

h2 {
  font-size: 1.6rem;
  margin-bottom: 0.3rem;
}

.subtitle {
  color: #666;
  font-size: 0.95rem;
  margin-bottom: 1rem;
}

.back-link {
  display: inline-block;
  margin-bottom: 1rem;
  color: #22c55e;
  font-weight: 500;
}

.back-link:hover { text-decoration: underline; }

/* 输入区 */
.input-section {
  background: #fff;
  border-radius: 12px;
  padding: 1.2rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  margin-bottom: 1.5rem;
}

.input-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.input-header label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
}

.input-actions {
  display: flex;
  gap: 0.5rem;
}

.input-area {
  width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 0.8rem;
  font-size: 0.85rem;
  font-family: 'SF Mono', 'Fira Code', 'Courier New', monospace;
  resize: vertical;
  box-sizing: border-box;
  line-height: 1.5;
  transition: border-color 0.2s;
}

.input-area:focus {
  outline: none;
  border-color: #22c55e;
}

.parse-error {
  background: #fef2f2;
  color: #dc2626;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  margin: 0.5rem 0;
  font-size: 0.85rem;
  border: 1px solid #fecaca;
}

/* 按钮 */
.btn-primary {
  padding: 0.6rem 1.4rem;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  margin-top: 0.8rem;
}

.btn-primary:hover { opacity: 0.85; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-sm {
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  background: white;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-sm:hover { border-color: #22c55e; color: #22c55e; }

.btn-submit {
  margin-right: 0.5rem;
}

/* 进度条 */
.quiz-progress {
  margin-bottom: 1.2rem;
}

.progress-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.4rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #10b981);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.85rem;
  color: #888;
  text-align: right;
}

/* 题目卡片 */
.questions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.question-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border: 2px solid transparent;
  transition: border-color 0.3s;
}

.question-card.answered {
  border-color: #bbf7d0;
}

.question-card.correct {
  border-color: #22c55e;
  background: #f0fdf4;
}

.question-card.wrong {
  border-color: #ef4444;
  background: #fef2f2;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.6rem;
}

.question-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: #fff;
  border-radius: 50%;
  font-size: 0.8rem;
  font-weight: 700;
}

.question-type {
  font-size: 0.75rem;
  color: #888;
  background: #f5f5f5;
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
}

.question-text {
  font-size: 1rem;
  color: #2c3e50;
  margin-bottom: 0.8rem;
  line-height: 1.6;
  font-weight: 500;
}

/* 选项 */
.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.judge-options {
  display: flex;
  gap: 0.8rem;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.92rem;
  transition: all 0.2s;
}

.option-item.clickable {
  cursor: pointer;
}

.option-item.clickable:hover {
  border-color: #22c55e;
  background: #f0fdf4;
}

.option-item.selected {
  border-color: #22c55e;
  background: #f0fdf4;
  font-weight: 500;
}

.option-item.correct-option {
  border-color: #22c55e;
  background: #dcfce7;
}

.option-item.wrong-option {
  border-color: #ef4444;
  background: #fee2e2;
}

.option-marker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: #f5f5f5;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #666;
  flex-shrink: 0;
}

.option-item.selected .option-marker {
  background: #22c55e;
  color: #fff;
}

.option-text {
  flex: 1;
}

.option-icon {
  font-size: 1rem;
}

/* 操作按钮 */
.quiz-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.2rem;
  flex-wrap: wrap;
}

/* 统计结果 */
.result-section {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  margin-top: 1.5rem;
}

.result-header {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.result-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat-card {
  flex: 1;
  text-align: center;
  padding: 1rem;
  border-radius: 10px;
}

.stat-card .stat-num {
  display: block;
  font-size: 2rem;
  font-weight: 700;
}

.stat-card .stat-label {
  font-size: 0.85rem;
  color: #888;
  margin-top: 0.3rem;
}

.correct-stat {
  background: #f0fdf4;
}

.correct-stat .stat-num {
  color: #22c55e;
}

.wrong-stat {
  background: #fef2f2;
}

.wrong-stat .stat-num {
  color: #ef4444;
}

.rate-stat {
  background: #eff6ff;
}

.rate-stat .stat-num {
  color: #3b82f6;
}

.result-bar {
  height: 12px;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  margin-bottom: 0.8rem;
}

.bar-correct {
  background: linear-gradient(90deg, #22c55e, #10b981);
  transition: width 0.5s ease;
}

.bar-wrong {
  background: linear-gradient(90deg, #ef4444, #dc2626);
  transition: width 0.5s ease;
}

.result-message {
  text-align: center;
  font-size: 1.1rem;
  font-weight: 500;
  color: #555;
  margin-top: 0.5rem;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: #bbb;
  font-size: 1rem;
}

/* 格式说明 */
.format-guide {
  margin-top: 1.5rem;
  background: #fff;
  border-radius: 12px;
  padding: 1rem 1.2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.format-guide summary {
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  color: #555;
  user-select: none;
}

.guide-content {
  margin-top: 0.8rem;
  font-size: 0.85rem;
  color: #666;
  line-height: 1.6;
}

.guide-content code {
  background: #f5f5f5;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.guide-content pre {
  background: #1e293b;
  color: #e2e8f0;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
  margin-top: 0.5rem;
}

.guide-content pre code {
  background: none;
  color: inherit;
  font-size: 0.78rem;
  line-height: 1.5;
}

/* 响应式 */
@media (max-width: 640px) {
  .tool-page { padding: 0.5rem; }
  .question-card { padding: 1rem; }
  .judge-options { flex-direction: column; }
  .result-stats { flex-direction: column; }
  .quiz-actions { flex-direction: column; }
  .btn-submit, .btn-primary { width: 100%; text-align: center; }
}
</style>
