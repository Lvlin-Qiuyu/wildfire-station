<template>
  <div class="tool-page">
    <h2>📋 文本比对</h2>
    <p class="tool-subtitle">对比两段文本的差异，类似代码 Diff 效果</p>

    <div class="panels">
      <div class="panel">
        <label>原始文本</label>
        <textarea
          v-model="textA"
          placeholder="粘贴第一段文本..."
          rows="10"
        ></textarea>
      </div>
      <div class="panel">
        <label>修改文本</label>
        <textarea
          v-model="textB"
          placeholder="粘贴第二段文本..."
          rows="10"
        ></textarea>
      </div>
    </div>

    <div class="actions">
      <button class="btn-primary" @click="computeDiff" :disabled="!textA && !textB">
        开始比对
      </button>
      <button class="btn-secondary" @click="clearAll">
        清空
      </button>
    </div>

    <div v-if="diffResult !== null" class="result-section">
      <div class="result-header">
        <h3>比对结果</h3>
        <span class="stats">
          <span class="stat-add">+{{ addedCount }} 新增</span>
          <span class="stat-del">-{{ deletedCount }} 删除</span>
          <span class="stat-keep">={{ keptCount }} 未变</span>
        </span>
      </div>
      <div class="diff-output" ref="diffContainer">
        <div
          v-for="(line, index) in diffResult"
          :key="index"
          :class="['diff-line', line.type]"
        >
          <span class="line-prefix">{{ line.type === 'added' ? '+' : line.type === 'deleted' ? '-' : ' ' }}</span>
          <span class="line-content">{{ line.text }}</span>
        </div>
        <div v-if="diffResult.length === 0" class="diff-empty">
          两段文本完全相同
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '文本比对 - 野火小站' })

const textA = ref('')
const textB = ref('')
const diffResult = ref(null)
const addedCount = ref(0)
const deletedCount = ref(0)
const keptCount = ref(0)

function computeDiff() {
  const linesA = textA.value.split('\n')
  const linesB = textB.value.split('\n')

  // LCS-based diff algorithm
  const result = []
  const lcs = computeLCS(linesA, linesB)

  let i = 0, j = 0, k = 0
  let addC = 0, delC = 0, keepC = 0

  while (k < lcs.length) {
    // skip deleted lines
    while (i < linesA.length && linesA[i] !== lcs[k]) {
      result.push({ type: 'deleted', text: linesA[i] })
      delC++
      i++
    }
    // skip added lines
    while (j < linesB.length && linesB[j] !== lcs[k]) {
      result.push({ type: 'added', text: linesB[j] })
      addC++
      j++
    }
    // matched line
    result.push({ type: 'kept', text: lcs[k] })
    keepC++
    i++
    j++
    k++
  }

  // remaining
  while (i < linesA.length) {
    result.push({ type: 'deleted', text: linesA[i] })
    delC++
    i++
  }
  while (j < linesB.length) {
    result.push({ type: 'added', text: linesB[j] })
    addC++
    j++
  }

  diffResult.value = result
  addedCount.value = addC
  deletedCount.value = delC
  keptCount.value = keepC
}

function computeLCS(a, b) {
  const m = a.length, n = b.length
  // optimize: use 1D DP with rollback
  const dp = new Array(n + 1).fill(0)
  const path = []

  for (let i = 1; i <= m; i++) {
    const prev = [0, ...dp]
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev[j - 1] + 1
      } else {
        dp[j] = Math.max(dp[j - 1], dp[j])
      }
    }
  }

  // backtrack to find LCS
  const lcs = []
  let i = m, j = n
  // need full 2D for backtracking, redo with 2D for large inputs
  // for simplicity, reconstruct with 2D only if sizes are manageable
  if (m * n <= 2000000) {
    const dp2 = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp2[i][j] = dp2[i - 1][j - 1] + 1
        } else {
          dp2[i][j] = Math.max(dp2[i - 1][j], dp2[i][j - 1])
        }
      }
    }
    i = m; j = n
    while (i > 0 && j > 0) {
      if (a[i - 1] === b[j - 1]) {
        lcs.unshift(a[i - 1])
        i--; j--
      } else if (dp2[i - 1][j] > dp2[i][j - 1]) {
        i--
      } else {
        j--
      }
    }
  } else {
    // fallback: simple line-by-line for very large inputs
    const setB = new Set(b)
    for (const line of a) {
      if (setB.has(line)) lcs.push(line)
    }
  }

  return lcs
}

function clearAll() {
  textA.value = ''
  textB.value = ''
  diffResult.value = null
  addedCount.value = 0
  deletedCount.value = 0
  keptCount.value = 0
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

.tool-subtitle {
  color: #888;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
}

.panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.panel label {
  font-weight: 600;
  font-size: 0.95rem;
  color: #555;
}

textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: 'Courier New', monospace;
  resize: vertical;
  background: white;
  transition: border-color 0.2s;
  line-height: 1.5;
  box-sizing: border-box;
}

textarea:focus {
  outline: none;
  border-color: #ff8c42;
}

.actions {
  display: flex;
  gap: 0.75rem;
  margin: 1.5rem 0;
}

.btn-primary {
  padding: 0.6rem 1.8rem;
  background: linear-gradient(135deg, #ff6b35, #ff8c42);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: opacity 0.2s;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.85;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 0.6rem 1.8rem;
  background: white;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.btn-secondary:hover {
  border-color: #ff8c42;
  color: #ff6b35;
}

.result-section {
  margin-top: 0.5rem;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.result-header h3 {
  font-size: 1.1rem;
  color: #2c3e50;
}

.stats {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  font-weight: 600;
}

.stat-add {
  color: #2da44e;
  background: #dafbe1;
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
}

.stat-del {
  color: #cf222e;
  background: #ffebe9;
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
}

.stat-keep {
  color: #666;
  background: #f0f0f0;
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
}

.diff-output {
  background: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  overflow: hidden;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  line-height: 1.6;
}

.diff-line {
  display: flex;
  padding: 0 1rem;
  border-bottom: 1px solid #e8e8e8;
}

.diff-line:last-child {
  border-bottom: none;
}

.diff-line .line-prefix {
  flex-shrink: 0;
  width: 1.5rem;
  text-align: center;
  user-select: none;
  font-weight: 700;
}

.diff-line .line-content {
  white-space: pre-wrap;
  word-break: break-all;
}

.diff-line.added {
  background: #dafbe1;
}

.diff-line.added .line-prefix {
  color: #2da44e;
}

.diff-line.added .line-content {
  color: #1a7f37;
}

.diff-line.deleted {
  background: #ffebe9;
}

.diff-line.deleted .line-prefix {
  color: #cf222e;
}

.diff-line.deleted .line-content {
  color: #a40e26;
}

.diff-line.kept {
  background: transparent;
}

.diff-line.kept .line-prefix {
  color: #bbb;
}

.diff-line.kept .line-content {
  color: #444;
}

.diff-empty {
  text-align: center;
  padding: 2rem;
  color: #2da44e;
  font-weight: 500;
  font-family: system-ui, sans-serif;
}

.back-link {
  display: inline-block;
  margin-top: 2.5rem;
  color: #ff6b35;
  font-weight: 500;
}

.back-link:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .panels {
    grid-template-columns: 1fr;
  }
  .result-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  .stats {
    font-size: 0.8rem;
  }
}
</style>
