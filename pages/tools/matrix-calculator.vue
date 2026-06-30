<template>
  <div class="tool-page">
    <h2>🔢 矩阵计算器</h2>
    <p class="subtitle">支持矩阵加减乘、行列式、转置、逆矩阵运算，维度可选 2×2 / 3×3 / 4×4</p>

    <!-- 维度选择 -->
    <div class="dimension-bar">
      <label>矩阵维度：</label>
      <button
        v-for="d in [2, 3, 4]"
        :key="d"
        :class="['dim-btn', { active: dimension === d }]"
        @click="changeDimension(d)"
      >
        {{ d }} × {{ d }}
      </button>
    </div>

    <!-- 矩阵输入区域 -->
    <div class="matrices-layout">
      <!-- 矩阵 A -->
      <div class="matrix-block">
        <div class="matrix-header">
          <span class="matrix-label">矩阵 A</span>
          <button class="btn-sm" @click="resetMatrix('a')">重置</button>
        </div>
        <div class="matrix-table-wrap">
          <table class="matrix-table">
            <tbody>
              <tr v-for="i in dimension" :key="'a-row-' + i">
                <td v-for="j in dimension" :key="'a-' + i + '-' + j">
                  <input
                    type="number"
                    class="cell-input"
                    v-model.number="matrixA[i - 1][j - 1]"
                    @keydown.enter="focusNext('a', i - 1, j - 1, $event)"
                    step="any"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 矩阵 B -->
      <div class="matrix-block">
        <div class="matrix-header">
          <span class="matrix-label">矩阵 B</span>
          <button class="btn-sm" @click="resetMatrix('b')">重置</button>
        </div>
        <div class="matrix-table-wrap">
          <table class="matrix-table">
            <tbody>
              <tr v-for="i in dimension" :key="'b-row-' + i">
                <td v-for="j in dimension" :key="'b-' + i + '-' + j">
                  <input
                    type="number"
                    class="cell-input"
                    v-model.number="matrixB[i - 1][j - 1]"
                    @keydown.enter="focusNext('b', i - 1, j - 1, $event)"
                    step="any"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 运算按钮 -->
    <div class="operation-bar">
      <button class="op-btn add" @click="compute('add')">A + B</button>
      <button class="op-btn sub" @click="compute('sub')">A - B</button>
      <button class="op-btn mul" @click="compute('mul')">A × B</button>
      <button class="op-btn det" @click="compute('det')">det(A)</button>
      <button class="op-btn trans" @click="compute('transpose')">Aᵀ</button>
      <button class="op-btn inv" @click="compute('inverse')">A⁻¹</button>
    </div>

    <!-- 结果区域 -->
    <div v-if="result" class="result-section">
      <div class="result-header">
        <h3>计算结果 — {{ resultLabel }}</h3>
        <button class="btn-copy" @click="copyResult">{{ copyText }}</button>
      </div>

      <!-- 行列式：大字号数值 -->
      <div v-if="result.type === 'scalar'" class="det-result">
        <span class="det-value">{{ result.value }}</span>
      </div>

      <!-- 矩阵结果：表格 -->
      <div v-else-if="result.type === 'matrix'" class="matrix-table-wrap result-table">
        <table class="matrix-table">
          <tbody>
            <tr v-for="(row, i) in result.value" :key="'r-' + i">
              <td v-for="(val, j) in row" :key="'r-' + i + '-' + j">
                <span class="result-cell">{{ formatNum(val) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 错误提示 -->
      <div v-else-if="result.type === 'error'" class="error-msg">
        ⚠️ {{ result.value }}
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '矩阵计算器 - 野火小站' })

const dimension = ref(2)
const matrixA = ref(createEmptyMatrix(2))
const matrixB = ref(createEmptyMatrix(2))
const result = ref(null)
const resultLabel = ref('')
const copyText = ref('复制结果')

// 创建空矩阵
function createEmptyMatrix(n) {
  return Array.from({ length: n }, () => Array(n).fill(0))
}

// 切换维度
function changeDimension(n) {
  dimension.value = n
  matrixA.value = createEmptyMatrix(n)
  matrixB.value = createEmptyMatrix(n)
  result.value = null
}

// 重置矩阵
function resetMatrix(which) {
  if (which === 'a') {
    matrixA.value = createEmptyMatrix(dimension.value)
  } else {
    matrixB.value = createEmptyMatrix(dimension.value)
  }
  result.value = null
}

// Tab/Enter 跳转下一个单元格
function focusNext(mat, row, col, e) {
  e.preventDefault()
  const n = dimension.value
  let nextRow = row
  let nextCol = col + 1
  if (nextCol >= n) {
    nextCol = 0
    nextRow++
    if (nextRow >= n) return
  }
  const prefix = mat === 'a' ? 'matrixA' : 'matrixB'
  const inputs = document.querySelectorAll(`.matrix-block:nth-child(${mat === 'a' ? 1 : 2}) .cell-input`)
  const idx = row * n + col + 1
  if (inputs[idx]) inputs[idx].focus()
}

// ==================== 矩阵运算 ====================

// 矩阵加法
function matAdd(A, B) {
  const n = A.length
  return A.map((row, i) => row.map((v, j) => v + B[i][j]))
}

// 矩阵减法
function matSub(A, B) {
  const n = A.length
  return A.map((row, i) => row.map((v, j) => v - B[i][j]))
}

// 矩阵乘法
function matMul(A, B) {
  const n = A.length
  const C = createEmptyMatrix(n)
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let sum = 0
      for (let k = 0; k < n; k++) {
        sum += A[i][k] * B[k][j]
      }
      C[i][j] = sum
    }
  }
  return C
}

// 转置
function matTranspose(A) {
  const n = A.length
  return A[0].map((_, j) => A.map(row => row[j]))
}

// ==================== 行列式（Laplace 展开 + 递归） ====================
function determinant(M) {
  const n = M.length
  if (n === 1) return M[0][0]
  if (n === 2) return M[0][0] * M[1][1] - M[0][1] * M[1][0]

  // 选第一行展开
  let det = 0
  for (let j = 0; j < n; j++) {
    const minor = getMinor(M, 0, j)
    det += ((-1) ** j) * M[0][j] * determinant(minor)
  }
  return det
}

// 获取余子式矩阵
function getMinor(M, row, col) {
  const n = M.length
  return M.filter((_, r) => r !== row)
    .map(r => r.filter((_, c) => c !== col))
}

// ==================== 逆矩阵（高斯-约旦消元法） ====================
function inverseMatrix(M) {
  const n = M.length
  // 构建增广矩阵 [M | I]
  const aug = M.map((row, i) => {
    const identityRow = Array(n).fill(0)
    identityRow[i] = 1
    return [...row, ...identityRow]
  })

  // 高斯-约旦消元
  for (let col = 0; col < n; col++) {
    // 部分主元选取：找到当前列绝对值最大的行
    let maxRow = col
    let maxVal = Math.abs(aug[col][col])
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > maxVal) {
        maxVal = Math.abs(aug[row][col])
        maxRow = row
      }
    }

    // 主元为 0 → 奇异矩阵
    if (maxVal < 1e-12) return null

    // 交换行
    if (maxRow !== col) {
      ;[aug[col], aug[maxRow]] = [aug[maxRow], aug[col]]
    }

    // 主元归一化
    const pivot = aug[col][col]
    for (let j = 0; j < 2 * n; j++) {
      aug[col][j] /= pivot
    }

    // 消去其他行
    for (let row = 0; row < n; row++) {
      if (row === col) continue
      const factor = aug[row][col]
      for (let j = 0; j < 2 * n; j++) {
        aug[row][j] -= factor * aug[col][j]
      }
    }
  }

  // 提取右半部分作为逆矩阵
  return aug.map(row => row.slice(n))
}

// ==================== 计算入口 ====================
const resultLabels = {
  add: 'A + B（矩阵加法）',
  sub: 'A - B（矩阵减法）',
  mul: 'A × B（矩阵乘法）',
  det: 'det(A)（矩阵 A 的行列式）',
  transpose: 'Aᵀ（矩阵 A 的转置）',
  inverse: 'A⁻¹（矩阵 A 的逆矩阵）',
}

function compute(op) {
  const A = matrixA.value.map(row => [...row])
  const B = matrixB.value.map(row => [...row])
  resultLabel.value = resultLabels[op]

  switch (op) {
    case 'add':
      result.value = { type: 'matrix', value: matAdd(A, B) }
      break
    case 'sub':
      result.value = { type: 'matrix', value: matSub(A, B) }
      break
    case 'mul':
      result.value = { type: 'matrix', value: matMul(A, B) }
      break
    case 'det': {
      const det = determinant(A)
      result.value = { type: 'scalar', value: formatNum(det) }
      break
    }
    case 'transpose':
      result.value = { type: 'matrix', value: matTranspose(A) }
      break
    case 'inverse': {
      const inv = inverseMatrix(A)
      if (inv === null) {
        result.value = { type: 'error', value: '矩阵 A 是奇异矩阵（行列式为 0），不可求逆' }
      } else {
        result.value = { type: 'matrix', value: inv }
      }
      break
    }
  }
}

// 格式化数字（最多 6 位小数）
function formatNum(val) {
  if (typeof val === 'string') return val
  if (Number.isInteger(val)) return String(val)
  return parseFloat(val.toFixed(6)).toString()
}

// 复制结果
function copyResult() {
  let text = ''
  if (result.value.type === 'scalar') {
    text = result.value.value
  } else if (result.value.type === 'matrix') {
    text = result.value.value.map(row => row.map(v => formatNum(v)).join('\t')).join('\n')
  } else {
    text = result.value.value
  }
  navigator.clipboard.writeText(text).then(() => {
    copyText.value = '已复制 ✓'
    setTimeout(() => { copyText.value = '复制结果' }, 1500)
  })
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

/* 维度选择 */
.dimension-bar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.dimension-bar label {
  font-weight: 600;
  font-size: 0.95rem;
  color: #555;
}

.dim-btn {
  padding: 0.4rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  color: #555;
}

.dim-btn:hover {
  border-color: #10b981;
  color: #10b981;
}

.dim-btn.active {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border-color: transparent;
  font-weight: 600;
}

/* 矩阵布局 */
.matrices-layout {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.matrix-block {
  flex: 1;
  min-width: 200px;
  max-width: 380px;
}

.matrix-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
}

.matrix-label {
  font-weight: 600;
  font-size: 1rem;
  color: #333;
}

.btn-sm {
  padding: 0.25rem 0.6rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 0.8rem;
  color: #888;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-sm:hover {
  border-color: #e74c3c;
  color: #e74c3c;
}

/* 矩阵表格 */
.matrix-table-wrap {
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
  background: #fafafa;
}

.matrix-table {
  border-collapse: collapse;
  width: 100%;
}

.matrix-table td {
  border: 1px solid #e0e0e0;
  padding: 0;
}

.cell-input {
  width: 100%;
  min-width: 60px;
  padding: 0.6rem 0.5rem;
  text-align: center;
  border: none;
  font-size: 1rem;
  font-family: 'Courier New', monospace;
  background: transparent;
  outline: none;
  transition: background 0.15s;
}

.cell-input:focus {
  background: #f0fdf4;
}

/* 运算按钮 */
.operation-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.op-btn {
  padding: 0.55rem 1.2rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
}

.op-btn:hover {
  opacity: 0.85;
  transform: translateY(-1px);
}

.op-btn.add { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.op-btn.sub { background: linear-gradient(135deg, #f97316, #ea580c); }
.op-btn.mul { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
.op-btn.det { background: linear-gradient(135deg, #ec4899, #db2777); }
.op-btn.trans { background: linear-gradient(135deg, #14b8a6, #0d9488); }
.op-btn.inv { background: linear-gradient(135deg, #22c55e, #16a34a); }

/* 结果区域 */
.result-section {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.result-header h3 {
  font-size: 1.05rem;
  color: #333;
}

.btn-copy {
  padding: 0.4rem 1rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  white-space: nowrap;
  transition: opacity 0.2s;
}

.btn-copy:hover {
  opacity: 0.85;
}

/* 行列式大字号 */
.det-result {
  text-align: center;
  padding: 2rem 0;
}

.det-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #22c55e;
  font-family: 'Courier New', monospace;
}

/* 结果矩阵 */
.result-table {
  max-width: 400px;
  margin: 0 auto;
}

.result-cell {
  display: block;
  padding: 0.6rem 0.5rem;
  text-align: center;
  font-family: 'Courier New', monospace;
  font-size: 0.95rem;
  color: #333;
}

/* 错误提示 */
.error-msg {
  text-align: center;
  padding: 1.5rem;
  color: #e74c3c;
  font-size: 1rem;
  font-weight: 500;
  background: #fef2f2;
  border-radius: 8px;
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

@media (max-width: 640px) {
  .matrices-layout {
    flex-direction: column;
    align-items: center;
  }
  .matrix-block {
    max-width: 100%;
  }
  .operation-bar {
    gap: 0.4rem;
  }
  .op-btn {
    padding: 0.45rem 0.8rem;
    font-size: 0.85rem;
  }
}
</style>
