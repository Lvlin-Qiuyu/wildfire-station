<template>
  <div class="tool-page">
    <h2>🧮 数学表达式计算器</h2>
    <p class="subtitle">支持科学计算函数、常量、括号嵌套、历史记录，纯前端运行</p>

    <div class="calculator-layout">
      <!-- 计算器主体 -->
      <div class="calculator">
        <!-- 显示屏 -->
        <div class="display">
          <div class="expression">{{ expression || '&nbsp;' }}</div>
          <div class="result" :class="{ error: hasError }">{{ displayResult }}</div>
        </div>

        <!-- 模式切换 -->
        <div class="mode-tabs">
          <button :class="['mode-tab', { active: mode === 'basic' }]" @click="mode = 'basic'">基础</button>
          <button :class="['mode-tab', { active: mode === 'scientific' }]" @click="mode = 'scientific'">科学</button>
        </div>

        <!-- 科学函数区（仅科学模式显示） -->
        <div class="func-row" v-if="mode === 'scientific'">
          <button v-for="f in scientificFuncs" :key="f.label" class="btn-func" @click="appendFunc(f)">{{ f.label }}</button>
        </div>

        <!-- 主按键区 -->
        <div class="keys">
          <!-- 第1行：特殊操作 -->
          <button class="btn-special" @click="clear">AC</button>
          <button class="btn-special" @click="backspace">⌫</button>
          <button class="btn-op" @click="append('(')">(</button>
          <button class="btn-op" @click="append(')')">)</button>

          <!-- 第2行：7 8 9 ÷ ^ -->
          <button class="btn-num" @click="append('7')">7</button>
          <button class="btn-num" @click="append('8')">8</button>
          <button class="btn-num" @click="append('9')">9</button>
          <button class="btn-op" @click="append('÷')">÷</button>
          <button v-if="mode === 'scientific'" class="btn-op" @click="append('^')">^</button>

          <!-- 第3行：4 5 6 × √ -->
          <button class="btn-num" @click="append('4')">4</button>
          <button class="btn-num" @click="append('5')">5</button>
          <button class="btn-num" @click="append('6')">6</button>
          <button class="btn-op" @click="append('×')">×</button>
          <button v-if="mode === 'scientific'" class="btn-op" @click="append('√')">√</button>

          <!-- 第4行：1 2 3 − -->
          <button class="btn-num" @click="append('1')">1</button>
          <button class="btn-num" @click="append('2')">2</button>
          <button class="btn-num" @click="append('3')">3</button>
          <button class="btn-op" @click="append('−')">−</button>

          <!-- 第5行：0 . = + -->
          <button class="btn-num" @click="append('0')">0</button>
          <button class="btn-num" @click="append('.')">.</button>
          <button class="btn-op" @click="append('+')">+</button>
          <button class="btn-equal" @click="calculate">=</button>
        </div>

        <!-- 快捷常量（科学模式） -->
        <div class="constants-row" v-if="mode === 'scientific'">
          <button class="btn-const" @click="appendConst('π')">π = {{ piVal }}</button>
          <button class="btn-const" @click="appendConst('e')">e = {{ eVal }}</button>
          <button class="btn-const" @click="appendConst('φ')">φ = {{ phiVal }}</button>
        </div>
      </div>

      <!-- 历史记录 -->
      <div class="history-panel">
        <div class="history-header">
          <h3>历史记录</h3>
          <div class="history-actions">
            <button class="btn-tiny" @click="copyAllHistory" v-if="history.length">复制全部</button>
            <button class="btn-tiny btn-danger" @click="clearHistory" v-if="history.length">清空</button>
          </div>
        </div>
        <div class="history-list" v-if="history.length">
          <div
            v-for="(item, idx) in history"
            :key="idx"
            class="history-item"
            @click="reuseHistory(item)"
          >
            <div class="history-expr">{{ item.expression }}</div>
            <div class="history-result">= {{ item.result }}</div>
          </div>
        </div>
        <div v-else class="history-empty">暂无计算记录</div>
      </div>
    </div>

    <!-- 表达式参考 -->
    <div class="reference">
      <h3>表达式参考</h3>
      <div class="ref-grid">
        <div class="ref-item" v-for="ref in references" :key="ref.title">
          <span class="ref-title">{{ ref.title }}</span>
          <span class="ref-example">{{ ref.example }}</span>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({
  title: '数学表达式计算器 - 野火小站',
  script: [
    { src: 'https://cdn.jsdelivr.net/npm/mathjs@13/lib/browser/math.min.js', defer: true }
  ]
})

// 模式
const mode = ref('scientific')

// 表达式和结果
const expression = ref('')
const displayResult = ref('0')
const hasError = ref(false)

// 常量值
const piVal = Math.PI.toFixed(8)
const eVal = Math.E.toFixed(8)
const phiVal = ((1 + Math.sqrt(5)) / 2).toFixed(8)

// 科学函数列表
const scientificFuncs = [
  { label: 'sin', fn: 'sin(' },
  { label: 'cos', fn: 'cos(' },
  { label: 'tan', fn: 'tan(' },
  { label: 'ln', fn: 'ln(' },
  { label: 'log', fn: 'log(' },
  { label: '√', fn: 'sqrt(' },
  { label: 'abs', fn: 'abs(' },
  { label: '!', fn: 'fact(' },
  { label: 'eⁿ', fn: 'exp(' },
  { label: 'asin', fn: 'asin(' },
  { label: 'acos', fn: 'acos(' },
  { label: 'atan', fn: 'atan(' },
]

// 参考文档
const references = [
  { title: '三角函数', example: 'sin(π/6), cos(45°), tan(1)' },
  { title: '对数', example: 'ln(100), log(1000), log₂(8)' },
  { title: '幂运算', example: '2^10, e^2, 3^(1/3)' },
  { title: '阶乘', example: '5!, 10!' },
  { title: '常量', example: 'π, e, φ' },
  { title: '角度支持', example: 'sin(90°) 自动转换弧度' },
]

// 历史记录（从 localStorage 恢复）
const history = ref([])
try {
  const saved = localStorage.getItem('math-calc-history')
  if (saved) history.value = JSON.parse(saved)
} catch {}

// 追加字符到表达式
function append(char) {
  expression.value += char
  hasError.value = false
}

// 追加函数到表达式
function appendFunc(f) {
  expression.value += f.fn
  hasError.value = false
}

// 追加常量
function appendConst(name) {
  expression.value += name
  hasError.value = false
}

// 清除
function clear() {
  expression.value = ''
  displayResult.value = '0'
  hasError.value = false
}

// 退格
function backspace() {
  if (expression.value.length > 0) {
    // 检查是否需要删除多字符（如 "sin(" ）
    const funcs = ['sin(', 'cos(', 'tan(', 'asin(', 'acos(', 'atan(', 'sqrt(', 'abs(', 'fact(', 'exp(', 'ln(', 'log(', 'log₂(']
    for (const f of funcs) {
      if (expression.value.endsWith(f)) {
        expression.value = expression.value.slice(0, -f.length)
        return
      }
    }
    expression.value = expression.value.slice(0, -1)
  }
}

// 安全数学表达式求值（使用 mathjs 库，防止代码注入）
function evaluateExpression(expr) {
  let s = expr.trim()
  if (!s) throw new Error('请输入表达式')

  // 替换显示符号为 mathjs 可识别的标准符号
  s = s.replace(/×/g, '*')
  s = s.replace(/÷/g, '/')
  s = s.replace(/−/g, '-')

  // 处理角度：sin(90°) → sin(90 deg)
  s = s.replace(/(\d+\.?\d*)°/g, '$1 deg')

  // 处理 √( 前缀形式
  s = s.replace(/√\(/g, 'sqrt(')

  // 处理 log₂ → log2
  s = s.replace(/log₂/g, 'log2')

  // 处理阶乘：5! → factorial(5)
  s = s.replace(/(\d+)!/g, 'factorial($1)')

  // 使用 mathjs 安全求值（math.js 内置符号安全，只处理数学表达式）
  try {
    const result = math.evaluate(s)
    if (typeof result !== 'number') {
      // mathjs 可能返回 Matrix 等类型，尝试转为数字
      const num = Number(result)
      if (isNaN(num)) throw new Error('结果无效')
      if (!isFinite(num)) throw new Error('结果无限大')
      return num
    }
    if (!isFinite(result)) {
      throw new Error('结果无限大')
    }
    return result
  } catch (e) {
    throw new Error('计算错误')
  }
}

// 计算
function calculate() {
  if (!expression.value.trim()) return

  try {
    const result = evaluateExpression(expression.value)
    const rounded = Number.isInteger(result) ? result : parseFloat(result.toPrecision(12))

    displayResult.value = formatNumber(rounded)
    hasError.value = false

    // 添加到历史记录
    history.value.unshift({
      expression: expression.value,
      result: formatNumber(rounded),
      time: Date.now(),
    })
    // 保留最近 50 条
    if (history.value.length > 50) history.value.pop()
    // 保存到 localStorage
    try {
      localStorage.setItem('math-calc-history', JSON.stringify(history.value))
    } catch {}

    // 表达式变为结果，方便继续运算
    expression.value = String(rounded)
  } catch (e) {
    displayResult.value = e.message || '表达式错误'
    hasError.value = true
  }
}

// 格式化数字
function formatNumber(num) {
  if (Number.isInteger(num) && Math.abs(num) < 1e15) return String(num)
  const str = String(num)
  if (str.length > 15) return num.toExponential(8)
  return str
}

// 复用历史记录
function reuseHistory(item) {
  expression.value = String(item.result)
  hasError.value = false
}

// 复制全部历史
function copyAllHistory() {
  const text = history.value.map(h => `${h.expression} = ${h.result}`).join('\n')
  navigator.clipboard.writeText(text).then(() => {
    // 简单反馈
  })
}

// 清空历史
function clearHistory() {
  history.value = []
  try { localStorage.removeItem('math-calc-history') } catch {}
}

// 键盘快捷键
function onKeyDown(e) {
  // 不在输入框中时才响应
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

  const key = e.key
  if (/^[0-9.+\-*/()%^]$/.test(key)) {
    e.preventDefault()
    let char = key
    if (char === '*') char = '×'
    if (char === '/') char = '÷'
    if (char === '-') char = '−'
    if (char === '%') char = '%'
    append(char)
  } else if (key === 'Enter' || key === '=') {
    e.preventDefault()
    calculate()
  } else if (key === 'Backspace') {
    e.preventDefault()
    backspace()
  } else if (key === 'Escape' || key === 'Delete') {
    e.preventDefault()
    clear()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<style scoped>
.tool-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 1rem;
}

h2 {
  font-size: 1.6rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #666;
  margin-bottom: 1.5rem;
}

/* 计算器布局 */
.calculator-layout {
  display: flex;
  gap: 1.2rem;
  margin-bottom: 1.5rem;
}

/* 计算器主体 */
.calculator {
  flex: 0 0 340px;
  background: #1e293b;
  border-radius: 16px;
  padding: 1.2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
}

/* 显示屏 */
.display {
  background: #0f172a;
  border-radius: 12px;
  padding: 1rem 1.2rem;
  margin-bottom: 1rem;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
.expression {
  color: #94a3b8;
  font-size: 0.9rem;
  font-family: 'Courier New', monospace;
  word-break: break-all;
  min-height: 1.2em;
  text-align: right;
}
.result {
  color: #e2e8f0;
  font-size: 1.8rem;
  font-family: 'Courier New', monospace;
  text-align: right;
  word-break: break-all;
  font-weight: 600;
}
.result.error {
  color: #ef4444;
  font-size: 1rem;
}

/* 模式切换 */
.mode-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 0.8rem;
  background: #0f172a;
  border-radius: 8px;
  overflow: hidden;
}
.mode-tab {
  flex: 1;
  padding: 0.5rem;
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}
.mode-tab.active {
  background: #22c55e;
  color: #fff;
  font-weight: 600;
}

/* 科学函数行 */
.func-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
  margin-bottom: 0.5rem;
}
.btn-func {
  padding: 0.4rem;
  border: none;
  border-radius: 6px;
  background: #334155;
  color: #a5b4fc;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'Courier New', monospace;
}
.btn-func:hover {
  background: #475569;
}

/* 主按键区 */
.keys {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}
.btn-num {
  padding: 0.8rem;
  border: none;
  border-radius: 8px;
  background: #334155;
  color: #e2e8f0;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'Courier New', monospace;
}
.btn-num:hover {
  background: #475569;
}
.btn-num:active {
  transform: scale(0.95);
}
.btn-op {
  padding: 0.8rem;
  border: none;
  border-radius: 8px;
  background: #22c55e22;
  color: #22c55e;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'Courier New', monospace;
}
.btn-op:hover {
  background: #22c55e33;
}
.btn-op:active {
  transform: scale(0.95);
}
.btn-special {
  padding: 0.8rem;
  border: none;
  border-radius: 8px;
  background: #ef444422;
  color: #ef4444;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.15s;
  font-weight: 600;
}
.btn-special:hover {
  background: #ef444433;
}
.btn-equal {
  padding: 0.8rem;
  border: none;
  border-radius: 8px;
  background: #22c55e;
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.15s;
  font-weight: 700;
}
.btn-equal:hover {
  background: #16a34a;
}
.btn-equal:active {
  transform: scale(0.95);
}

/* 常量行 */
.constants-row {
  display: flex;
  gap: 6px;
  margin-top: 0.5rem;
}
.btn-const {
  flex: 1;
  padding: 0.4rem;
  border: none;
  border-radius: 6px;
  background: #334155;
  color: #fbbf24;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'Courier New', monospace;
}
.btn-const:hover {
  background: #475569;
}

/* 历史面板 */
.history-panel {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 1rem;
  min-width: 0;
}
.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.8rem;
}
.history-header h3 {
  font-size: 0.95rem;
  color: #555;
  margin: 0;
}
.history-actions {
  display: flex;
  gap: 0.3rem;
}
.btn-tiny {
  padding: 0.25rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  background: #fff;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s;
}
.btn-tiny:hover {
  border-color: #22c55e;
  color: #22c55e;
}
.btn-tiny.btn-danger:hover {
  border-color: #ef4444;
  color: #ef4444;
}

.history-list {
  max-height: 400px;
  overflow-y: auto;
}
.history-item {
  padding: 0.6rem;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background 0.15s;
}
.history-item:hover {
  background: #f0fdf4;
}
.history-expr {
  font-size: 0.82rem;
  color: #666;
  font-family: 'Courier New', monospace;
}
.history-result {
  font-size: 1rem;
  color: #2c3e50;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}
.history-empty {
  text-align: center;
  color: #bbb;
  padding: 2rem 0;
  font-size: 0.9rem;
}

/* 表达式参考 */
.reference {
  background: #fff;
  border-radius: 10px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 1rem;
}
.reference h3 {
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 0.6rem;
}
.ref-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.5rem;
}
.ref-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0.6rem;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 0.8rem;
}
.ref-title {
  color: #555;
  font-weight: 600;
}
.ref-example {
  color: #999;
  font-family: 'Courier New', monospace;
  font-size: 0.72rem;
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

@media (max-width: 768px) {
  .calculator-layout {
    flex-direction: column;
  }
  .calculator {
    flex: none;
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
  }
  .func-row {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
