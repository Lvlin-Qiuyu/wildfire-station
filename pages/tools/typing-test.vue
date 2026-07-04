<template>
  <div class="tool-page">
    <h2>⌨️ 打字速度测试器</h2>
    <p class="subtitle">显示随机中英文文本，计时打字并统计 WPM/准确率/错误数，实时高亮正确/错误字符</p>

    <!-- 设置区 -->
    <div class="settings-bar">
      <div class="setting-group">
        <label>语言</label>
        <div class="toggle-buttons">
          <button class="btn-toggle" :class="{ active: language === 'cn' }" @click="setLanguage('cn')">中文</button>
          <button class="btn-toggle" :class="{ active: language === 'en' }" @click="setLanguage('en')">English</button>
        </div>
      </div>
      <div class="setting-group">
        <label>时长</label>
        <div class="toggle-buttons">
          <button
            v-for="t in durations"
            :key="t"
            class="btn-toggle"
            :class="{ active: duration === t }"
            @click="duration = t"
          >{{ t }}秒</button>
        </div>
      </div>
      <button class="btn-new" @click="newTest">🔄 换一段</button>
    </div>

    <!-- 打字区域 -->
    <div class="typing-area">
      <!-- 待打字文本 -->
      <div class="text-display" ref="textDisplay">
        <span
          v-for="(char, index) in displayChars"
          :key="index"
          class="char"
          :class="getCharClass(index)"
        >{{ char === ' ' ? '\u00A0' : char }}</span>
        <span v-if="state === 'idle'" class="cursor blinking"></span>
      </div>

      <!-- 输入区 -->
      <textarea
        ref="inputArea"
        v-model="inputText"
        class="typing-input"
        :placeholder="state === 'idle' ? '点击此处开始打字...' : '继续打字...'"
        :disabled="state === 'done'"
        :class="{ 'has-error': hasError }"
        @input="onInput"
        @focus="onFocus"
        spellcheck="false"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
      ></textarea>
    </div>

    <!-- 实时统计 -->
    <div class="stats-row">
      <div class="stat-card" :class="{ highlight: state === 'typing' }">
        <div class="stat-label">⏱️ 剩余时间</div>
        <div class="stat-value" :class="{ warning: timeLeft <= 10 }">{{ timeLeft }}s</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">⚡ 速度</div>
        <div class="stat-value">{{ currentWPM }}</div>
        <div class="stat-unit">{{ wpmUnit }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">✅ 准确率</div>
        <div class="stat-value" :class="{ good: accuracy >= 95, warning: accuracy < 80 }">{{ accuracy }}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">❌ 错误</div>
        <div class="stat-value">{{ errors }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">📝 已打</div>
        <div class="stat-value">{{ typedCount }}/{{ totalChars }}</div>
      </div>
    </div>

    <!-- 进度条 -->
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: progress + '%' }"></div>
    </div>

    <!-- 完成结果 -->
    <div v-if="state === 'done'" class="result-panel">
      <h3>🎉 测试完成！</h3>
      <div class="result-stats">
        <div class="result-stat">
          <span class="result-label">打字速度</span>
          <span class="result-value">{{ finalWPM }} <small>{{ wpmUnit }}</small></span>
        </div>
        <div class="result-stat">
          <span class="result-label">准确率</span>
          <span class="result-value">{{ finalAccuracy }}%</span>
        </div>
        <div class="result-stat">
          <span class="result-label">总字符数</span>
          <span class="result-value">{{ totalChars }}</span>
        </div>
        <div class="result-stat">
          <span class="result-label">错误数</span>
          <span class="result-value">{{ errors }}</span>
        </div>
      </div>
      <div v-if="isBestRecord" class="best-record">🏆 新纪录！</div>
      <div class="best-history">
        <span class="best-label">历史最佳：</span>
        <span class="best-value">{{ bestWPM }} {{ bestWPMUnit }}</span>
      </div>
      <button class="btn-retry" @click="newTest">再试一次</button>
    </div>

    <!-- 自定义文本 -->
    <div class="custom-section">
      <details>
        <summary>自定义文本</summary>
        <textarea
          v-model="customText"
          class="custom-input"
          placeholder="粘贴自定义文本用于测试..."
          rows="4"
          spellcheck="false"
        ></textarea>
        <button class="btn-use-custom" @click="useCustomText">使用自定义文本</button>
      </details>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '打字速度测试器 - 野火小站' })

const textDisplay = ref(null)
const inputArea = ref(null)

const state = ref('idle') // idle | typing | done
const language = ref('cn')
const duration = ref(60)
const inputText = ref('')
const customText = ref('')

const timeLeft = ref(60)
const errors = ref(0)
const currentWPM = ref('0')
const accuracy = ref(100)

const finalWPM = ref(0)
const finalAccuracy = ref(0)
const isBestRecord = ref(false)

// 中文文本库
const cnTexts = [
  '春天的风吹过田野，带来泥土和花朵的芬芳。阳光洒在湖面上，波光粼粼，宛如碎金。远处的山峦在薄雾中若隐若现，勾勒出一幅恬静的山水画。',
  '代码是程序员的诗篇，每一行都承载着创造的热情。在键盘的敲击声中，逻辑与创意交织，算法与美学共鸣。优秀的代码不仅是工具，更是一种艺术的表达。',
  '清晨的咖啡香气弥漫在空气中，新的一天就此展开。窗外的城市开始苏醒，车水马龙，熙熙攘攘。这是平凡的一天，却也充满了无限的可能和期待。',
  '人工智能正在改变我们的生活方式。从智能助手到自动驾驶，从医疗诊断到科学研究，技术的进步让未来变得触手可及。我们需要拥抱变化，同时保持思考。',
  '读书是心灵的旅行，每一本书都是一扇通往新世界的窗户。在文字的海洋中，我们与伟大的思想对话，与遥远的时代共鸣，拓展着认知的边界。',
]

// 英文文本库
const enTexts = [
  'The quick brown fox jumps over the lazy dog. Programming is the art of telling another human being what one wants the computer to do. Every great developer you know got there by solving problems they were unqualified to solve.',
  'Technology is best when it brings people together. Innovation distinguishes between a leader and a follower. The only way to do great work is to love what you do. Stay hungry, stay foolish, and never stop learning.',
  'In the middle of difficulty lies opportunity. Success is not final, failure is not fatal. It is the courage to continue that counts. The future belongs to those who believe in the beauty of their dreams.',
  'Code is like humor. When you have to explain it, it is bad. First solve the problem, then write the code. Experience is the name everyone gives to their mistakes. Make it work, make it right, make it fast.',
  'The best error message is the one that never shows up. Talk is cheap, show me the code. Simplicity is the soul of efficiency. Before software can be reusable it first has to be usable.',
]

let currentText = ''
let timerInterval = null
let startTime = 0

const durations = [30, 60, 120]

// 显示字符列表
const displayChars = computed(() => currentText.split(''))

// 总字符数
const totalChars = computed(() => currentText.length)

// 已打字数
const typedCount = computed(() => inputText.value.length)

// 是否有错误
const hasError = computed(() => {
  if (inputText.value.length === 0) return false
  return inputText.value.slice(-1) !== currentText[inputText.value.length - 1]
})

// 进度
const progress = computed(() => {
  if (totalChars.value === 0) return 0
  return Math.min((typedCount.value / totalChars.value) * 100, 100)
})

// WPM 单位
const wpmUnit = computed(() => language.value === 'cn' ? '字/分' : 'WPM')

// 历史最佳
const bestWPM = ref(0)
const bestWPMUnit = ref('字/分')

// 加载历史记录
onMounted(() => {
  try {
    const saved = localStorage.getItem('typing-best')
    if (saved) {
      const data = JSON.parse(saved)
      bestWPM.value = data.wpm
      bestWPMUnit.value = data.unit
    }
  } catch {}
  pickRandomText()
})

// 设置语言
function setLanguage(lang) {
  language.value = lang
  newTest()
}

// 随机选文本
function pickRandomText() {
  const texts = language.value === 'cn' ? cnTexts : enTexts
  currentText = texts[Math.floor(Math.random() * texts.length)]
}

// 新测试
function newTest() {
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = null

  state.value = 'idle'
  inputText.value = ''
  timeLeft.value = duration.value
  errors.value = 0
  currentWPM.value = '0'
  accuracy.value = 100
  finalWPM.value = 0
  finalAccuracy.value = 0
  isBestRecord.value = false

  pickRandomText()

  nextTick(() => {
    inputArea.value?.focus()
    if (textDisplay.value) textDisplay.value.scrollTop = 0
  })
}

// 使用自定义文本
function useCustomText() {
  const text = customText.value.trim()
  if (!text) {
    alert('请输入自定义文本')
    return
  }
  currentText = text
  language.value = text.match(/[\u4e00-\u9fff]/) ? 'cn' : 'en'
  newTest()
}

// 输入处理
function onInput() {
  if (state.value === 'idle') {
    // 开始计时
    state.value = 'typing'
    startTime = Date.now()
    timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      timeLeft.value = Math.max(0, duration.value - elapsed)

      // 计算速度
      updateStats(elapsed)

      if (timeLeft.value <= 0) {
        finishTest()
      }
    }, 100)
  }

  if (state.value === 'typing') {
    const elapsed = (Date.now() - startTime) / 1000
    updateStats(elapsed)
  }
}

// 聚焦
function onFocus() {
  if (state.value === 'done') return
}

// 更新统计
function updateStats(elapsed) {
  if (elapsed <= 0) return
  const typed = inputText.value.length
  const correctChars = countCorrectChars()
  const elapsedMin = elapsed / 60

  // WPM 计算
  if (language.value === 'cn') {
    // 中文：字/分钟
    currentWPM.value = Math.round(correctChars / elapsedMin)
  } else {
    // 英文：标准 WPM = (字符数/5) / 分钟
    currentWPM.value = Math.round((correctChars / 5) / elapsedMin)
  }

  // 准确率
  accuracy.value = typed > 0 ? Math.round((correctChars / typed) * 100) : 100
}

// 计算正确字符数
function countCorrectChars() {
  let correct = 0
  for (let i = 0; i < inputText.value.length && i < currentText.length; i++) {
    if (inputText.value[i] === currentText[i]) correct++
  }
  return correct
}

// 字符样式
function getCharClass(index) {
  if (index >= inputText.value.length) return 'pending'
  if (inputText.value[index] === currentText[index]) return 'correct'
  return 'incorrect'
}

// 完成测试
function finishTest() {
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = null

  state.value = 'done'

  const typed = inputText.value.length
  const correctChars = countCorrectChars()
  const elapsedMin = duration.value / 60

  if (language.value === 'cn') {
    finalWPM.value = Math.round(correctChars / elapsedMin)
  } else {
    finalWPM.value = Math.round((correctChars / 5) / elapsedMin)
  }

  finalAccuracy.value = typed > 0 ? Math.round((correctChars / typed) * 100) : 100
  errors.value = typed - correctChars

  // 检查是否新纪录
  const currentUnit = wpmUnit.value
  if (bestWPMUnit.value !== currentUnit) {
    // 单位不同（切换了语言），重置
    bestWPM.value = 0
    bestWPMUnit.value = currentUnit
  }

  if (finalWPM.value > bestWPM.value) {
    bestWPM.value = finalWPM.value
    bestWPMUnit.value = currentUnit
    isBestRecord.value = true
    localStorage.setItem('typing-best', JSON.stringify({ wpm: bestWPM.value, unit: bestWPMUnit.value }))
  }
}

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<style scoped>
.tool-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

h2 { font-size: 1.6rem; margin-bottom: 0.5rem; }
.subtitle { color: #666; margin-bottom: 1.5rem; }

/* 设置栏 */
.settings-bar {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.setting-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.setting-group label {
  font-size: 0.85rem;
  color: #888;
  white-space: nowrap;
}

.toggle-buttons {
  display: flex;
  gap: 0.3rem;
}

.btn-toggle {
  padding: 0.3rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  font-size: 0.82rem;
  cursor: pointer;
  color: #555;
  transition: all 0.2s;
}

.btn-toggle:hover { border-color: #22c55e; color: #22c55e; }
.btn-toggle.active { background: #22c55e; color: white; border-color: #22c55e; }

.btn-new {
  margin-left: auto;
  padding: 0.4rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f8f9fa;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-new:hover { border-color: #22c55e; color: #22c55e; }

/* 打字区域 */
.typing-area {
  background: #fff;
  border-radius: 12px;
  padding: 1.2rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  border: 1px solid #eee;
  margin-bottom: 1rem;
}

.text-display {
  font-size: 1.15rem;
  line-height: 2;
  padding: 0.5rem;
  margin-bottom: 0.8rem;
  min-height: 60px;
  font-family: 'Courier New', monospace;
  user-select: none;
  word-break: break-all;
}

.char {
  transition: color 0.05s;
}

.char.pending { color: #bbb; }
.char.correct { color: #22c55e; }
.char.incorrect { color: #ef4444; background: #fef2f2; border-radius: 2px; }

.cursor {
  border-left: 2px solid #22c55e;
  animation: blink 1s step-end infinite;
  margin-left: -1px;
  padding-left: 1px;
}

@keyframes blink {
  0%, 100% { border-color: #22c55e; }
  50% { border-color: transparent; }
}

.blinking { animation: blink 1s step-end infinite; }

.typing-input {
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  font-family: 'Courier New', monospace;
  resize: none;
  outline: none;
  box-sizing: border-box;
  height: 60px;
  line-height: 1.5;
}

.typing-input:focus { border-color: #22c55e; }
.typing-input:disabled { background: #f9fafb; color: #9ca3af; }
.typing-input.has-error { border-color: #ef4444; }

/* 统计栏 */
.stats-row {
  display: flex;
  gap: 0.6rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.stat-card {
  flex: 1;
  min-width: 90px;
  background: #fff;
  border-radius: 10px;
  padding: 0.6rem;
  text-align: center;
  box-shadow: 0 1px 6px rgba(0,0,0,0.05);
  border: 1px solid #eee;
  transition: all 0.2s;
}

.stat-card.highlight { border-color: #22c55e; }

.stat-label { font-size: 0.75rem; color: #888; margin-bottom: 0.2rem; }

.stat-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: #2c3e50;
}

.stat-value.warning { color: #ef4444; }
.stat-value.good { color: #22c55e; }

.stat-unit { font-size: 0.7rem; color: #aaa; }

/* 进度条 */
.progress-bar {
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  margin-bottom: 1.5rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #10b981);
  border-radius: 2px;
  transition: width 0.1s;
}

/* 结果面板 */
.result-panel {
  background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
  border: 2px solid #bbf7d0;
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  margin-bottom: 1rem;
}

.result-panel h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.result-stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.result-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.result-label { font-size: 0.85rem; color: #666; margin-bottom: 0.3rem; }

.result-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #22c55e;
}

.result-value small { font-size: 0.7rem; color: #888; font-weight: 400; }

.best-record {
  font-size: 1.2rem;
  font-weight: 700;
  color: #f59e0b;
  margin-bottom: 0.5rem;
}

.best-history {
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 1rem;
}

.best-value { font-weight: 600; color: #22c55e; }

.btn-retry {
  padding: 0.7rem 2rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-retry:hover { opacity: 0.85; }

/* 自定义文本 */
.custom-section {
  margin-bottom: 1rem;
}

.custom-section details {
  background: #fff;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border: 1px solid #eee;
}

.custom-section summary {
  cursor: pointer;
  font-size: 0.9rem;
  color: #555;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.custom-input {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.85rem;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  margin-bottom: 0.5rem;
}

.custom-input:focus { border-color: #22c55e; }

.btn-use-custom {
  padding: 0.4rem 1rem;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-use-custom:hover { opacity: 0.85; }

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #22c55e;
  font-weight: 500;
}

.back-link:hover { text-decoration: underline; }

@media (max-width: 640px) {
  .settings-bar { gap: 0.8rem; }
  .stats-row { gap: 0.4rem; }
  .stat-card { min-width: 70px; }
  .result-stats { gap: 1rem; }
}
</style>
