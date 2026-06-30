<template>
  <div class="tool-page">
    <h2>📝 文本去重与排序</h2>
    <p class="subtitle">粘贴多行文本，一键去重、过滤空行、排序，实时处理即时生效</p>

    <div class="main-layout">
      <!-- 左侧：输入 + 操作面板 -->
      <div class="left-col">
        <div class="input-section">
          <div class="input-header">
            <label>输入文本</label>
            <button class="btn-clear" @click="clearAll">清空</button>
          </div>
          <textarea
            v-model="inputText"
            placeholder="在此粘贴多行文本，每行一条..."
            rows="14"
            class="text-input"
          ></textarea>
        </div>

        <!-- 操作面板 -->
        <div class="options-panel">
          <div class="option-group">
            <label class="toggle-label">
              <input type="checkbox" v-model="opts.dedup" />
              <span>去重</span>
            </label>
            <label class="toggle-label">
              <input type="checkbox" v-model="opts.trimSpaces" />
              <span>去首尾空格</span>
            </label>
            <label class="toggle-label">
              <input type="checkbox" v-model="opts.filterEmpty" />
              <span>过滤空行</span>
            </label>
            <label class="toggle-label" v-show="opts.dedup">
              <input type="checkbox" v-model="opts.caseInsensitive" />
              <span>去重时忽略大小写</span>
            </label>
          </div>
          <div class="sort-group">
            <label class="sort-label">排序方式：</label>
            <select v-model="opts.sortMode" class="sort-select">
              <option value="none">不排序</option>
              <option value="asc">升序 A→Z</option>
              <option value="desc">降序 Z→A</option>
              <option value="random">随机打乱</option>
            </select>
          </div>
        </div>

        <!-- 统计面板 -->
        <div class="stats-panel">
          <div class="stat-item">
            <span class="stat-label">原始行数</span>
            <span class="stat-value">{{ stats.original }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">处理前（过滤空行后）</span>
            <span class="stat-value">{{ stats.afterFilter }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">处理后（去重排序后）</span>
            <span class="stat-value highlight">{{ stats.final }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">删除行数</span>
            <span class="stat-value warn">{{ stats.removed }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">重复行数</span>
            <span class="stat-value warn">{{ stats.duplicates }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧：输出 -->
      <div class="right-col">
        <div class="output-section">
          <div class="output-header">
            <label>处理结果</label>
            <button class="btn-copy" @click="copyResult">{{ copyText }}</button>
          </div>
          <textarea
            :value="outputText"
            readonly
            rows="14"
            class="text-input output"
          ></textarea>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '文本去重与排序 - 野火小站' })

const inputText = ref('')
const copyText = ref('复制结果')

// 操作选项
const opts = reactive({
  dedup: true,
  filterEmpty: true,
  trimSpaces: true,
  caseInsensitive: false,
  sortMode: 'none',
})

// 统计数据
const stats = reactive({
  original: 0,
  afterFilter: 0,
  final: 0,
  removed: 0,
  duplicates: 0,
})

// Fisher-Yates 洗牌算法
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 实时计算结果
const outputText = computed(() => {
  // 按行拆分
  const rawLines = inputText.value.split('\n')
  stats.original = rawLines.length

  // 去首尾空格
  let lines = rawLines.map(line =>
    opts.trimSpaces ? line.trim() : line
  )

  // 统计过滤空行后的数量
  stats.afterFilter = lines.filter(l => l.length > 0).length

  // 过滤空行
  if (opts.filterEmpty) {
    lines = lines.filter(l => l.length > 0)
  }

  // 去重
  const beforeDedup = lines.length
  if (opts.dedup) {
    const seen = new Set()
    lines = lines.filter(line => {
      const key = opts.caseInsensitive ? line.toLowerCase() : line
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }
  stats.duplicates = beforeDedup - lines.length

  // 排序
  switch (opts.sortMode) {
    case 'asc':
      lines = [...lines].sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))
      break
    case 'desc':
      lines = [...lines].sort((a, b) => b.localeCompare(a, 'zh-Hans-CN'))
      break
    case 'random':
      lines = shuffle(lines)
      break
  }

  stats.final = lines.length
  stats.removed = stats.afterFilter - stats.final

  return lines.join('\n')
})

// 复制结果
function copyResult() {
  navigator.clipboard.writeText(outputText.value).then(() => {
    copyText.value = '已复制 ✓'
    setTimeout(() => { copyText.value = '复制结果' }, 1500)
  })
}

// 清空
function clearAll() {
  inputText.value = ''
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

/* 双栏布局 */
.main-layout {
  display: flex;
  gap: 1.2rem;
  align-items: flex-start;
}

.left-col {
  flex: 1;
  min-width: 0;
}

.right-col {
  flex: 1;
  min-width: 0;
}

/* 输入/输出区域 */
.input-section,
.output-section {
  margin-bottom: 1rem;
}

.input-header,
.output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
}

.input-header label,
.output-header label {
  font-weight: 600;
  font-size: 0.95rem;
}

.btn-clear {
  padding: 0.3rem 0.8rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  font-size: 0.85rem;
  color: #888;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-clear:hover {
  border-color: #e74c3c;
  color: #e74c3c;
}

.text-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: 'Courier New', monospace;
  resize: vertical;
  background: white;
  line-height: 1.6;
  transition: border-color 0.2s;
}

.text-input:focus {
  outline: none;
  border-color: #10b981;
}

.text-input.output {
  background: #f8fff8;
  color: #333;
}

/* 操作面板 */
.options-panel {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.option-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-bottom: 0.8rem;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.9rem;
  color: #555;
  cursor: pointer;
  padding: 0.3rem 0.6rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  transition: all 0.15s;
  user-select: none;
}

.toggle-label:hover {
  border-color: #10b981;
  color: #10b981;
}

.toggle-label input[type="checkbox"] {
  accent-color: #22c55e;
}

.sort-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sort-label {
  font-size: 0.9rem;
  color: #555;
  font-weight: 600;
}

.sort-select {
  padding: 0.35rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
}

.sort-select:focus {
  outline: none;
  border-color: #10b981;
}

/* 统计面板 */
.stats-panel {
  background: #f9fafb;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.6rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.4rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #888;
}

.stat-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: #333;
}

.stat-value.highlight {
  color: #22c55e;
}

.stat-value.warn {
  color: #f97316;
}

/* 复制按钮 */
.btn-copy {
  padding: 0.35rem 0.8rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: opacity 0.2s;
}

.btn-copy:hover {
  opacity: 0.85;
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
  .main-layout {
    flex-direction: column;
  }
  .stats-panel {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 480px) {
  .stats-panel {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
