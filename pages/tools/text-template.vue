<template>
  <div class="tool-page">
    <h2>📝 文本变量替换与模板生成器</h2>
    <p class="subtitle">定义变量列表和模板文本，批量生成个性化文本，支持序号递增和日期插入</p>

    <div class="tpl-layout">
      <!-- 左侧：变量和模板 -->
      <div class="input-panel">
        <!-- 变量定义 -->
        <div class="section">
          <div class="section-header">
            <label>📋 变量列表</label>
            <div class="header-actions">
              <button class="btn-sm" @click="addVariable">+ 添加变量</button>
              <button class="btn-sm" @click="clearVariables">清空</button>
            </div>
          </div>
          <div class="var-list">
            <div v-for="(v, index) in variables" :key="index" class="var-item">
              <input
                v-model="v.name"
                class="var-name"
                placeholder="变量名（如 name）"
                spellcheck="false"
              />
              <div class="var-values">
                <div v-for="(val, vi) in v.values" :key="vi" class="var-value-row">
                  <input
                    v-model="v.values[vi]"
                    class="var-value"
                    placeholder="值"
                    spellcheck="false"
                  />
                  <button class="btn-remove" @click="v.values.splice(vi, 1)" v-if="v.values.length > 1">✕</button>
                </div>
                <button class="btn-add-val" @click="v.values.push('')">+ 添加值</button>
              </div>
              <button v-if="variables.length > 1" class="btn-remove-row" @click="variables.splice(index, 1)">删除变量</button>
            </div>
          </div>
          <div class="built-in-vars">
            <span class="built-in-label">内置变量：</span>
            <code v-for="b in builtInVars" :key="b" class="built-in-tag" @click="insertBuiltIn(b)">{{ '{{' + b + '}}' }}</code>
          </div>
        </div>

        <!-- 模板文本 -->
        <div class="section">
          <div class="section-header">
            <label>📄 模板文本</label>
            <button class="btn-sm" @click="loadSampleTemplate">加载示例</button>
          </div>
          <textarea
            v-model="template"
            class="template-input"
            placeholder="在模板中使用 {{变量名}} 插入变量&#10;例如：亲爱的{{name}}，您的订单{{orderNo}}已发货..."
            rows="8"
            spellcheck="false"
          ></textarea>
        </div>

        <!-- 生成按钮 -->
        <button class="btn-primary" @click="generate">🚀 生成结果</button>
      </div>

      <!-- 右侧：输出 -->
      <div class="output-panel">
        <div class="section">
          <div class="section-header">
            <label>📊 生成结果（{{ results.length }} 条）</label>
            <div class="header-actions">
              <button class="btn-sm" @click="copyAll">📋 复制全部</button>
              <button class="btn-sm" @click="copySeparated">📋 复制（分隔符）</button>
            </div>
          </div>

          <!-- 统计信息 -->
          <div v-if="results.length > 0" class="stats-bar">
            <div class="stat-item">
              <span class="stat-label">组合数</span>
              <span class="stat-value">{{ results.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">变量数</span>
              <span class="stat-value">{{ effectiveVarCount }}</span>
            </div>
          </div>

          <!-- 输出列表 -->
          <div v-if="results.length === 0" class="empty-tip">
            <span>💡</span>
            <p>定义变量并填写模板后，点击「生成结果」</p>
          </div>

          <div v-else class="result-list">
            <div v-for="(text, i) in results" :key="i" class="result-item">
              <div class="result-index">#{{ i + 1 }}</div>
              <div class="result-text">{{ text }}</div>
              <button class="btn-copy-single" @click="copySingle(text)" title="复制">📋</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '文本变量替换与模板生成器 - 野火小站' })

const variables = reactive([
  { name: 'name', values: ['张三', '李四', '王五'] },
  { name: 'product', values: ['笔记本电脑', '手机', '平板'] },
])

const template = ref('亲爱的{{name}}，您购买的{{product}}已发货，订单号{{orderNo}}，预计{{date}}送达。')
const results = ref([])

// 内置变量
const builtInVars = ['序号', 'date', 'datetime', 'year', 'month', 'day']

// 有效变量数（至少有一个值）
const effectiveVarCount = computed(() => {
  return variables.filter(v => v.values.some(val => val.trim())).length
})

// 添加变量
function addVariable() {
  variables.push({ name: '', values: [''] })
}

// 清空变量
function clearVariables() {
  variables.splice(0, variables.length)
  variables.push({ name: '', values: [''] })
}

// 插入内置变量
function insertBuiltIn(name) {
  template.value += `{{${name}}}`
}

// 加载示例模板
function loadSampleTemplate() {
  variables.splice(0, variables.length)
  variables.push(
    { name: 'name', values: ['张三', '李四', '王五'] },
    { name: 'department', values: ['技术部', '市场部', '产品部'] },
    { name: 'date', values: ['2026-07-01', '2026-07-02', '2026-07-03'] },
  )
  template.value = '通知：{{name}}（{{department}}），您的绩效评估将于{{date}}进行，请提前做好准备。'
}

// 生成结果
function generate() {
  if (!template.value.trim()) {
    alert('请输入模板文本')
    return
  }

  // 收集有效变量（有名字且有值）
  const effectiveVars = variables.filter(v => v.name.trim() && v.values.some(val => val.trim()))
  if (effectiveVars.length === 0) {
    alert('请至少定义一个变量并填写值')
    return
  }

  // 获取所有变量的有效值列表
  const varValueLists = effectiveVars.map(v => ({
    name: v.name.trim(),
    values: v.values.filter(val => val.trim())
  }))

  // 计算笛卡尔积
  const combinations = cartesianProduct(varValueLists.map(v => v.values))

  // 限制组合数
  const maxCombinations = 500
  const selectedCombinations = combinations.slice(0, maxCombinations)

  // 替换生成
  results.value = selectedCombinations.map((combo, i) => {
    let text = template.value
    const now = new Date()

    // 替换用户变量
    varValueLists.forEach((v, vi) => {
      text = text.replaceAll(`{{${v.name}}}`, combo[vi])
    })

    // 替换内置变量
    text = text.replaceAll('{{序号}}', String(i + 1))
    text = text.replaceAll('{{date}}', formatDate(now, 'date'))
    text = text.replaceAll('{{datetime}}', formatDate(now, 'datetime'))
    text = text.replaceAll('{{year}}', String(now.getFullYear()))
    text = text.replaceAll('{{month}}', String(now.getMonth() + 1).padStart(2, '0'))
    text = text.replaceAll('{{day}}', String(now.getDate()).padStart(2, '0'))

    // 替换 date 变量组中的值（如果变量名是 date）
    // 已在上面处理

    return text
  })

  if (combinations.length > maxCombinations) {
    results.value.push(`⚠️ 组合总数 ${combinations.length} 超过上限 ${maxCombinations}，只显示前 ${maxCombinations} 条`)
  }
}

// 笛卡尔积
function cartesianProduct(arrays) {
  return arrays.reduce((acc, arr) => {
    const result = []
    acc.forEach(combo => {
      arr.forEach(item => {
        result.push([...combo, item])
      })
    })
    return result
  }, [[]])
}

// 日期格式化
function formatDate(date, type) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')

  if (type === 'date') return `${y}-${m}-${d}`
  if (type === 'datetime') return `${y}-${m}-${d} ${h}:${min}:${s}`
  return `${y}-${m}-${d}`
}

// 复制全部
function copyAll() {
  if (results.value.length === 0) return
  const text = results.value.join('\n')
  navigator.clipboard.writeText(text).then(() => alert(`已复制 ${results.value.length} 条结果`))
}

// 复制（带分隔符）
function copySeparated() {
  if (results.value.length === 0) return
  const text = results.value.join('\n---\n')
  navigator.clipboard.writeText(text).then(() => alert('已复制（带分隔符）'))
}

// 复制单条
function copySingle(text) {
  navigator.clipboard.writeText(text)
}
</script>

<style scoped>
.tool-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1rem;
}

h2 { font-size: 1.6rem; margin-bottom: 0.5rem; }
.subtitle { color: #666; margin-bottom: 1.5rem; }

.tpl-layout {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

/* 输入面板 */
.input-panel {
  flex: 0 0 420px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section {
  background: #fff;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border: 1px solid #eee;
}

.section > label, .section-header label {
  font-weight: 600;
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 0.5rem;
  display: block;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
}

.section-header label { margin-bottom: 0; }

.header-actions {
  display: flex;
  gap: 0.4rem;
}

.btn-sm {
  padding: 0.3rem 0.7rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #f8f9fa;
  font-size: 0.8rem;
  cursor: pointer;
  color: #555;
}

.btn-sm:hover { border-color: #22c55e; color: #22c55e; }

/* 变量列表 */
.var-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  max-height: 40vh;
  overflow-y: auto;
}

.var-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 0.6rem;
  border: 1px solid #eee;
}

.var-name {
  width: 100%;
  padding: 0.35rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  outline: none;
  box-sizing: border-box;
  margin-bottom: 0.4rem;
}

.var-name:focus { border-color: #22c55e; }

.var-values {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.var-value-row {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.var-value {
  flex: 1;
  padding: 0.3rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 0.85rem;
  outline: none;
}

.var-value:focus { border-color: #22c55e; }

.btn-remove {
  width: 22px;
  height: 22px;
  border: none;
  background: #fee;
  color: #e74c3c;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
  flex-shrink: 0;
}

.btn-remove:hover { background: #fdd; }

.btn-add-val {
  padding: 0.2rem 0.5rem;
  border: 1px dashed #ddd;
  border-radius: 5px;
  background: transparent;
  font-size: 0.75rem;
  cursor: pointer;
  color: #888;
}

.btn-add-val:hover { border-color: #22c55e; color: #22c55e; }

.btn-remove-row {
  margin-top: 0.3rem;
  padding: 0.2rem 0.5rem;
  border: none;
  background: #fee;
  color: #e74c3c;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
}

.btn-remove-row:hover { background: #fdd; }

/* 内置变量 */
.built-in-vars {
  margin-top: 0.6rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.built-in-label {
  font-size: 0.78rem;
  color: #888;
}

.built-in-tag {
  padding: 0.15rem 0.5rem;
  background: #e0f2fe;
  color: #0369a1;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  font-family: monospace;
}

.built-in-tag:hover { background: #bae6fd; }

/* 模板输入 */
.template-input {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  font-family: inherit;
}

.template-input:focus { border-color: #22c55e; }

/* 生成按钮 */
.btn-primary {
  padding: 0.8rem 1.5rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary:hover { opacity: 0.85; }

/* 输出面板 */
.output-panel {
  flex: 1;
  min-width: 0;
}

.stats-bar {
  display: flex;
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.stat-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.stat-label { font-size: 0.75rem; color: #888; }
.stat-value { font-size: 1.2rem; font-weight: 700; color: #22c55e; }

/* 空状态 */
.empty-tip {
  text-align: center;
  padding: 3rem 2rem;
  color: #bbb;
}

.empty-tip span {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.5rem;
}

/* 结果列表 */
.result-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 65vh;
  overflow-y: auto;
}

.result-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.6rem 0.8rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #eee;
  transition: background 0.15s;
}

.result-item:hover { background: #f0fdf4; }

.result-index {
  font-size: 0.75rem;
  font-weight: 700;
  color: #22c55e;
  min-width: 30px;
  padding-top: 2px;
}

.result-text {
  flex: 1;
  font-size: 0.9rem;
  line-height: 1.6;
  color: #333;
  word-break: break-all;
  white-space: pre-wrap;
}

.btn-copy-single {
  padding: 0.3rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.9rem;
  opacity: 0.5;
  flex-shrink: 0;
}

.btn-copy-single:hover { opacity: 1; }

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #22c55e;
  font-weight: 500;
}

.back-link:hover { text-decoration: underline; }

@media (max-width: 768px) {
  .tpl-layout { flex-direction: column; }
  .input-panel { flex: none; width: 100%; }
  .var-list { max-height: 30vh; }
  .result-list { max-height: 50vh; }
}
</style>
