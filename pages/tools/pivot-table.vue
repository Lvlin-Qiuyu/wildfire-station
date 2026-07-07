<template>
  <div class="tool-page">
    <h2>📊 数据透视表生成器</h2>
    <p class="subtitle">粘贴CSV表格数据，选择行列字段和聚合方式，自动生成交叉汇总透视表</p>

    <!-- CSV 输入区域 -->
    <div class="input-group">
      <label>CSV 数据输入</label>
      <div class="input-actions">
        <button class="btn-sm btn-primary" @click="loadSample">加载示例数据</button>
        <button class="btn-sm" @click="clearAll">清空</button>
      </div>
      <textarea
        v-model="csvInput"
        placeholder="粘贴 CSV 数据（逗号或 Tab 分隔），第一行为表头...&#10;例如：&#10;城市,季度,产品,销售额&#10;北京,Q1,手机,1200&#10;上海,Q1,手机,1500"
        rows="8"
      ></textarea>
    </div>

    <!-- 分隔符检测 -->
    <div v-if="columns.length" class="info-bar">
      <span>📋 检测到 <strong>{{ columns.length }}</strong> 列，<strong>{{ rows.length }}</strong> 行数据，分隔符：<strong>{{ detectedDelimiter === '\t' ? 'Tab' : '逗号' }}</strong></span>
    </div>

    <!-- 透视表配置 -->
    <div v-if="columns.length" class="config-section">
      <h3>透视表配置</h3>
      <div class="config-grid">
        <div class="config-item">
          <label>行分组字段</label>
          <select v-model="rowField">
            <option value="">（无）</option>
            <option v-for="c in columns" :key="'r-' + c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div class="config-item">
          <label>列分组字段</label>
          <select v-model="colField">
            <option value="">（无）</option>
            <option v-for="c in columns" :key="'c-' + c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div class="config-item">
          <label>值字段</label>
          <select v-model="valueField">
            <option value="">（无）</option>
            <option v-for="c in columns" :key="'v-' + c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div class="config-item">
          <label>聚合方式</label>
          <select v-model="aggMethod">
            <option value="sum">求和</option>
            <option value="count">计数</option>
            <option value="avg">平均值</option>
            <option value="max">最大值</option>
            <option value="min">最小值</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 透视表结果 -->
    <div v-if="pivotData.length" class="result-section">
      <div class="result-header">
        <h3>透视表结果</h3>
        <div class="result-actions">
          <button class="btn-sm btn-primary" @click="copyPivotTable">复制表格</button>
          <button class="btn-sm btn-primary" @click="exportCSV">导出 CSV</button>
        </div>
      </div>

      <!-- 汇总信息 -->
      <div class="summary-bar">
        <span>行分组: {{ rowField || '无' }} | 列分组: {{ colField || '无' }} | 值: {{ valueField }} | 聚合: {{ aggLabels[aggMethod] }}</span>
      </div>

      <!-- 透视表 HTML 渲染 -->
      <div class="pivot-table-wrapper">
        <table class="pivot-table">
          <thead>
            <tr>
              <th class="corner-cell">{{ rowField || '' }}</th>
              <th v-for="colKey in pivotColKeys" :key="colKey" class="col-header">{{ colKey }}</th>
              <th v-if="colField" class="col-header total-cell">合计</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rowKey in pivotRowKeys" :key="rowKey">
              <td class="row-label">{{ rowKey }}</td>
              <td v-for="colKey in pivotColKeys" :key="colKey" class="data-cell">
                {{ formatValue(pivotTable[rowKey]?.[colKey]) }}
              </td>
              <td v-if="colField" class="data-cell total-cell">
                <strong>{{ formatValue(rowTotals[rowKey]) }}</strong>
              </td>
            </tr>
            <tr v-if="colField" class="total-row">
              <td class="row-label total-cell"><strong>合计</strong></td>
              <td v-for="colKey in pivotColKeys" :key="colKey" class="data-cell total-cell">
                <strong>{{ formatValue(colTotals[colKey]) }}</strong>
              </td>
              <td class="data-cell total-cell">
                <strong>{{ formatValue(grandTotal) }}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '数据透视表生成器 - 野火小站' })

const csvInput = ref('')
const rowField = ref('')
const colField = ref('')
const valueField = ref('')
const aggMethod = ref('sum')
const errorMsg = ref('')
const copyTextMap = reactive({})

const aggLabels = {
  sum: '求和',
  count: '计数',
  avg: '平均值',
  max: '最大值',
  min: '最小值',
}

// ==================== CSV 解析 ====================

// 自动检测分隔符
const detectedDelimiter = computed(() => {
  const firstLine = csvInput.value.split('\n')[0] || ''
  const tabCount = (firstLine.match(/\t/g) || []).length
  const commaCount = (firstLine.match(/,/g) || []).length
  return tabCount > commaCount ? '\t' : ','
})

// 解析CSV为数组
const parsedData = computed(() => {
  if (!csvInput.value.trim()) return { headers: [], rows: [] }
  try {
    const delimiter = detectedDelimiter.value
    const lines = csvInput.value.trim().split('\n').filter(l => l.trim())
    if (lines.length < 2) return { headers: [], rows: [] }

    const headers = parseCSVLine(lines[0], delimiter)
    const rows = lines.slice(1).map(line => parseCSVLine(line, delimiter))

    // 确保每行列数一致
    const colCount = headers.length
    const normalized = rows.map(row => {
      while (row.length < colCount) row.push('')
      return row.slice(0, colCount)
    })

    return { headers, rows: normalized }
  } catch (e) {
    errorMsg.value = 'CSV 解析错误：' + e.message
    return { headers: [], rows: [] }
  }
})

// 解析单行CSV（处理引号）
function parseCSVLine(line, delimiter) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === delimiter) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
  }
  result.push(current.trim())
  return result
}

const columns = computed(() => parsedData.value.headers)
const rows = computed(() => parsedData.value.rows)

// ==================== 透视表计算 ====================

// 收集所有唯一值
const pivotRowKeys = computed(() => {
  if (!rowField.value) return ['总计']
  const colIdx = columns.value.indexOf(rowField.value)
  if (colIdx === -1) return []
  const keys = new Set(rows.value.map(r => r[colIdx]))
  return [...keys]
})

const pivotColKeys = computed(() => {
  if (!colField.value) return ['总计']
  const colIdx = columns.value.indexOf(colField.value)
  if (colIdx === -1) return []
  const keys = new Set(rows.value.map(r => r[colIdx]))
  return [...keys]
})

// 交叉汇总：pivotTable[rowKey][colKey] = 聚合值数组
const pivotTable = computed(() => {
  const rowIdx = rowField.value ? columns.value.indexOf(rowField.value) : -1
  const colIdx = colField.value ? columns.value.indexOf(colField.value) : -1
  const valIdx = valueField.value ? columns.value.indexOf(valueField.value) : -1

  const table = {}

  for (const row of rows.value) {
    const rk = rowIdx >= 0 ? row[rowIdx] : '总计'
    const ck = colIdx >= 0 ? row[colIdx] : '总计'
    if (!table[rk]) table[rk] = {}

    if (!table[rk][ck]) table[rk][ck] = []

    if (valIdx >= 0) {
      const num = parseFloat(row[valIdx])
      table[rk][ck].push(isNaN(num) ? 0 : num)
    } else {
      // 无值字段时，计数
      table[rk][ck].push(1)
    }
  }

  return table
})

// 聚合函数
function aggregate(values) {
  if (!values || values.length === 0) return null
  switch (aggMethod.value) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0)
    case 'count':
      return values.length
    case 'avg':
      return values.reduce((a, b) => a + b, 0) / values.length
    case 'max':
      return Math.max(...values)
    case 'min':
      return Math.min(...values)
    default:
      return values.reduce((a, b) => a + b, 0)
  }
}

const pivotData = computed(() => {
  if (!columns.value.length || !rows.value.length) return []
  if (!rowField.value && !colField.value) return []
  return pivotRowKeys.value
})

// 行合计
const rowTotals = computed(() => {
  const totals = {}
  for (const rk of pivotRowKeys.value) {
    const allValues = []
    for (const ck of pivotColKeys.value) {
      const vals = pivotTable.value[rk]?.[ck]
      if (vals) allValues.push(...vals)
    }
    totals[rk] = allValues.length > 0 ? aggregate(allValues) : null
  }
  return totals
})

// 列合计
const colTotals = computed(() => {
  const totals = {}
  for (const ck of pivotColKeys.value) {
    const allValues = []
    for (const rk of pivotRowKeys.value) {
      const vals = pivotTable.value[rk]?.[ck]
      if (vals) allValues.push(...vals)
    }
    totals[ck] = allValues.length > 0 ? aggregate(allValues) : null
  }
  return totals
})

// 总计
const grandTotal = computed(() => {
  const allValues = []
  for (const rk of pivotRowKeys.value) {
    for (const ck of pivotColKeys.value) {
      const vals = pivotTable.value[rk]?.[ck]
      if (vals) allValues.push(...vals)
    }
  }
  return allValues.length > 0 ? aggregate(allValues) : null
})

// 格式化数值
function formatValue(val) {
  if (val === null || val === undefined) return '-'
  if (aggMethod.value === 'count') return val
  return Number.isInteger(val) ? val.toString() : val.toFixed(2)
}

// ==================== 示例数据 ====================

function loadSample() {
  csvInput.value = `城市,季度,产品,销售额
北京,Q1,手机,1200
北京,Q1,电脑,2300
北京,Q2,手机,1500
北京,Q2,电脑,2100
北京,Q3,手机,1800
北京,Q3,电脑,2500
上海,Q1,手机,1500
上海,Q1,电脑,1800
上海,Q2,手机,2000
上海,Q2,电脑,2200
上海,Q3,手机,1700
上海,Q3,电脑,2600
广州,Q1,手机,800
广州,Q1,电脑,1200
广州,Q2,手机,1100
广州,Q2,电脑,1500
广州,Q3,手机,900
广州,Q3,电脑,1300`
  rowField.value = '城市'
  colField.value = '产品'
  valueField.value = '销售额'
  aggMethod.value = 'sum'
}

function clearAll() {
  csvInput.value = ''
  rowField.value = ''
  colField.value = ''
  valueField.value = ''
  aggMethod.value = 'sum'
  errorMsg.value = ''
}

// ==================== 复制与导出 ====================

function copyPivotTable() {
  let text = ''
  // 表头
  let header = rowField.value || ''
  for (const ck of pivotColKeys.value) {
    header += '\t' + ck
  }
  if (colField.value) header += '\t合计'
  text += header + '\n'

  // 数据行
  for (const rk of pivotRowKeys.value) {
    let line = rk
    for (const ck of pivotColKeys.value) {
      line += '\t' + formatValue(pivotTable.value[rk]?.[ck])
    }
    if (colField.value) {
      line += '\t' + formatValue(rowTotals.value[rk])
    }
    text += line + '\n'
  }

  // 合计行
  if (colField.value) {
    let line = '合计'
    for (const ck of pivotColKeys.value) {
      line += '\t' + formatValue(colTotals.value[ck])
    }
    line += '\t' + formatValue(grandTotal.value)
    text += line + '\n'
  }

  navigator.clipboard.writeText(text).then(() => {
    copyTextMap['pivot'] = '已复制 ✓'
    setTimeout(() => { copyTextMap['pivot'] = '' }, 1500)
  })
}

function exportCSV() {
  let csv = ''
  // 表头
  let header = (rowField.value || '').replace(/,/g, '，')
  for (const ck of pivotColKeys.value) {
    header += ',' + ck.replace(/,/g, '，')
  }
  if (colField.value) header += ',合计'
  csv += header + '\n'

  // 数据行
  for (const rk of pivotRowKeys.value) {
    let line = rk.replace(/,/g, '，')
    for (const ck of pivotColKeys.value) {
      line += ',' + formatValue(pivotTable.value[rk]?.[ck])
    }
    if (colField.value) {
      line += ',' + formatValue(rowTotals.value[rk])
    }
    csv += line + '\n'
  }

  // 合计行
  if (colField.value) {
    let line = '合计'
    for (const ck of pivotColKeys.value) {
      line += ',' + formatValue(colTotals.value[ck])
    }
    line += ',' + formatValue(grandTotal.value)
    csv += line + '\n'
  }

  // 添加BOM以支持中文
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'pivot-table.csv'
  a.click()
  URL.revokeObjectURL(url)
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

/* 输入区域 */
.input-group {
  margin-bottom: 1rem;
}

.input-group label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 600;
  font-size: 0.9rem;
  color: #555;
}

.input-actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

textarea {
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 0.9rem;
  outline: none;
  resize: vertical;
  box-sizing: border-box;
  transition: border-color 0.2s;
  font-family: 'Courier New', monospace;
  line-height: 1.5;
  background: white;
}

textarea:focus {
  border-color: #22c55e;
}

/* 信息栏 */
.info-bar {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 0.6rem 1rem;
  font-size: 0.85rem;
  color: #166534;
  margin-bottom: 1rem;
}

/* 配置区域 */
.config-section {
  background: #fafafa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 1.2rem;
  margin-bottom: 1.5rem;
}

.config-section h3 {
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 0.8rem;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.8rem;
}

.config-item label {
  display: block;
  margin-bottom: 0.3rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: #888;
}

.config-item select {
  width: 100%;
  padding: 0.5rem 0.7rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  background: white;
  color: #333;
  cursor: pointer;
}

.config-item select:focus {
  border-color: #22c55e;
}

/* 结果区域 */
.result-section {
  margin-bottom: 1.5rem;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.result-header h3 {
  font-size: 0.95rem;
  color: #555;
}

.result-actions {
  display: flex;
  gap: 0.5rem;
}

.summary-bar {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 0.5rem 0.8rem;
  font-size: 0.82rem;
  color: #888;
  margin-bottom: 0.8rem;
}

/* 透视表样式 */
.pivot-table-wrapper {
  overflow-x: auto;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
}

.pivot-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.pivot-table th,
.pivot-table td {
  padding: 0.6rem 0.8rem;
  border: 1px solid #e0e0e0;
  text-align: right;
  white-space: nowrap;
}

.pivot-table th {
  background: #f0fdf4;
  color: #166534;
  font-weight: 600;
  position: sticky;
  top: 0;
}

.corner-cell {
  text-align: center;
  background: #dcfce7;
}

.col-header {
  text-align: center;
}

.row-label {
  text-align: left;
  font-weight: 500;
  background: #fafafa;
  color: #555;
  position: sticky;
  left: 0;
  z-index: 1;
}

.data-cell {
  font-variant-numeric: tabular-nums;
  font-family: 'Courier New', monospace;
  font-size: 0.82rem;
}

.total-cell {
  background: #fef3c7;
  color: #92400e;
}

.total-row {
  background: #fef3c7;
}

/* 按钮 */
.btn-sm {
  padding: 0.3rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 0.8rem;
  cursor: pointer;
  color: #666;
}

.btn-sm:hover {
  border-color: #10b981;
  color: #22c55e;
}

.btn-sm.btn-primary {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
}

.btn-sm.btn-primary:hover {
  opacity: 0.85;
}

/* 错误提示 */
.error-msg {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 0.6rem 1rem;
  color: #dc2626;
  font-size: 0.85rem;
  margin-bottom: 1rem;
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
  .config-grid {
    grid-template-columns: 1fr 1fr;
  }
  .result-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  .pivot-table-wrapper {
    max-height: 400px;
    overflow-y: auto;
  }
}
</style>
