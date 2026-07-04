<template>
  <div class="tool-page">
    <h2>💰 还款计划表生成器</h2>
    <p class="subtitle">输入贷款参数，生成完整月度还款计划表（等额本息/等额本金），支持提前还款，可视化本金利息占比，可导出CSV</p>

    <!-- 贷款参数 -->
    <div class="section">
      <label>贷款参数</label>
      <div class="param-grid">
        <div class="param-item">
          <span class="param-label">贷款总额（元）</span>
          <input v-model.number="loanAmount" type="number" class="input-num" placeholder="1000000" />
        </div>
        <div class="param-item">
          <span class="param-label">年利率（%）</span>
          <input v-model.number="annualRate" type="number" step="0.01" class="input-num" placeholder="3.85" />
        </div>
        <div class="param-item">
          <span class="param-label">贷款期限</span>
          <div class="duration-row">
            <input v-model.number="loanYears" type="number" class="input-num input-short" placeholder="30" min="1" max="50" />
            <span class="param-unit">年</span>
            <span class="param-info">（{{ loanMonths }} 期）</span>
          </div>
        </div>
        <div class="param-item">
          <span class="param-label">还款方式</span>
          <div class="type-buttons">
            <button class="btn-type" :class="{ active: method === 'equal-payment' }" @click="method = 'equal-payment'">等额本息</button>
            <button class="btn-type" :class="{ active: method === 'equal-principal' }" @click="method = 'equal-principal'">等额本金</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 提前还款 -->
    <div class="section">
      <div class="section-header">
        <label>提前还款节点</label>
        <button class="btn-sm" @click="addPrepayment">+ 添加节点</button>
      </div>
      <p class="hint">可选。添加提前还款节点后，将从该期起重新计算剩余贷款</p>
      <div class="prepayment-list" v-if="prepayments.length > 0">
        <div v-for="(pp, i) in prepayments" :key="i" class="prepayment-item">
          <span>第</span>
          <input v-model.number="pp.month" type="number" class="input-xs" min="1" :max="loanMonths" />
          <span>期提前还款</span>
          <input v-model.number="pp.amount" type="number" class="input-xs" />
          <span>元</span>
          <button class="btn-remove" @click="prepayments.splice(i, 1)">✕</button>
        </div>
      </div>
    </div>

    <!-- 汇总概览 -->
    <div v-if="schedule.length > 0" class="summary-grid">
      <div class="summary-card">
        <div class="summary-label">💳 每月还款</div>
        <div class="summary-value">{{ summary.monthlyPayment }}</div>
        <div class="summary-sub">{{ method === 'equal-principal' ? '首月金额（递减）' : '每月固定' }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">📊 还款总额</div>
        <div class="summary-value">{{ summary.totalPayment }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">🔥 利息总额</div>
        <div class="summary-value interest">{{ summary.totalInterest }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">📈 利息占比</div>
        <div class="summary-value">{{ summary.interestRatio }}</div>
      </div>
    </div>

    <!-- 可视化图表 -->
    <div v-if="schedule.length > 0" class="chart-section">
      <h3>📊 本金与利息占比变化</h3>
      <div class="canvas-wrapper" ref="chartWrapper">
        <canvas ref="chartCanvas"></canvas>
      </div>
    </div>

    <!-- 还款明细表 -->
    <div v-if="schedule.length > 0" class="section table-section">
      <h3>📋 还款计划明细</h3>
      <div class="table-scroll">
        <table class="schedule-table">
          <thead>
            <tr>
              <th>期数</th>
              <th>月供</th>
              <th>本金</th>
              <th>利息</th>
              <th>剩余本金</th>
              <th v-if="hasPrepayments">提前还款</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in schedule" :key="i">
              <td>{{ row.month }}</td>
              <td>{{ formatMoney(row.payment) }}</td>
              <td>{{ formatMoney(row.principal) }}</td>
              <td>{{ formatMoney(row.interest) }}</td>
              <td>{{ formatMoney(row.remaining) }}</td>
              <td v-if="hasPrepayments">{{ row.prepayment ? formatMoney(row.prepayment) : '-' }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td>合计</td>
              <td>{{ formatMoney(summary.totalPaymentNum) }}</td>
              <td>{{ formatMoney(summary.totalPrincipalNum) }}</td>
              <td>{{ formatMoney(summary.totalInterestNum) }}</td>
              <td>-</td>
              <td v-if="hasPrepayments">{{ formatMoney(summary.totalPrepayment) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div v-if="schedule.length > 0" class="action-bar">
      <button class="btn-copy" @click="downloadCSV">📥 导出 CSV</button>
      <button class="btn-copy btn-json" @click="copySummary">📋 复制汇总</button>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '还款计划表生成器 - 野火小站' })

const loanAmount = ref(1000000)
const annualRate = ref(3.85)
const loanYears = ref(30)
const method = ref('equal-payment')

const prepayments = reactive([])

const chartCanvas = ref(null)
const chartWrapper = ref(null)

const loanMonths = computed(() => loanYears.value * 12)
const hasPrepayments = computed(() => prepayments.length > 0)

function addPrepayment() {
  prepayments.push({ month: Math.min(12, loanMonths.value), amount: 100000 })
}

// 格式化金额
function formatMoney(num) {
  if (num == null || isNaN(num)) return '-'
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// 生成还款计划
const schedule = computed(() => {
  if (!loanAmount.value || !annualRate.value || !loanYears.value) return []

  let principal = loanAmount.value
  const monthlyRate = annualRate.value / 100 / 12
  const totalMonths = loanMonths.value

  // 按期排序提前还款节点
  const ppMap = {}
  for (const pp of prepayments) {
    if (pp.month >= 1 && pp.month <= totalMonths && pp.amount > 0) {
      ppMap[pp.month] = (ppMap[pp.month] || 0) + pp.amount
    }
  }

  const rows = []
  let monthlyPayment = 0

  if (method.value === 'equal-payment' && monthlyRate > 0) {
    monthlyPayment = principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) / (Math.pow(1 + monthlyRate, totalMonths) - 1)
  }

  for (let m = 1; m <= totalMonths && principal > 0.01; m++) {
    const interest = principal * monthlyRate
    let pmtPrincipal, pmt

    if (method.value === 'equal-payment') {
      // 最后一期修正
      pmt = Math.min(monthlyPayment, principal + interest)
      pmtPrincipal = pmt - interest
    } else {
      // 等额本金
      const remainingMonths = totalMonths - m + 1
      pmtPrincipal = principal / remainingMonths
      pmt = pmtPrincipal + interest
    }

    pmtPrincipal = Math.min(pmtPrincipal, principal)

    // 提前还款
    const pp = ppMap[m] || 0

    rows.push({
      month: m,
      payment: pmt,
      principal: pmtPrincipal,
      interest,
      remaining: principal - pmtPrincipal,
      prepayment: pp || undefined,
    })

    principal -= pmtPrincipal
    if (pp) principal = Math.max(0, principal - pp)
  }

  return rows
})

// 汇总统计
const summary = computed(() => {
  const rows = schedule.value
  if (rows.length === 0) return {}

  const totalPayment = rows.reduce((s, r) => s + r.payment, 0)
  const totalInterest = rows.reduce((s, r) => s + r.interest, 0)
  const totalPrincipal = rows.reduce((s, r) => s + r.principal, 0)
  const totalPP = rows.reduce((s, r) => s + (r.prepayment || 0), 0)
  const firstPayment = rows[0]?.payment || 0

  return {
    monthlyPayment: formatMoney(firstPayment),
    totalPayment: formatMoney(totalPayment),
    totalInterest: formatMoney(totalInterest),
    interestRatio: loanAmount.value > 0 ? ((totalInterest / loanAmount.value) * 100).toFixed(1) + '%' : '-',
    totalPaymentNum: totalPayment,
    totalPrincipalNum: totalPrincipal,
    totalInterestNum: totalInterest,
    totalPrepayment: totalPP,
  }
})

// ========= 绘制图表 =========
function drawChart() {
  const canvas = chartCanvas.value
  const wrapper = chartWrapper.value
  if (!canvas || !wrapper) return

  const dpr = window.devicePixelRatio || 1
  const width = wrapper.clientWidth - 40
  const height = 350
  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = width + 'px'
  canvas.style.height = height + 'px'
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, width, height)

  const rows = schedule.value
  if (rows.length === 0) return

  const pad = { top: 20, right: 120, bottom: 40, left: 60 }
  const chartW = width - pad.left - pad.right
  const chartH = height - pad.top - pad.bottom
  const n = rows.length

  // 背景
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, width, height)

  // 堆叠面积图
  const barW = chartW / n

  for (let i = 0; i < n; i++) {
    const r = rows[i]
    const x = pad.left + i * barW
    const payment = r.payment || 0
    const maxPmt = Math.max(...rows.map(r => r.payment || 0), 1)

    // 利息部分（红色）
    const interestH = (r.interest / maxPmt) * chartH
    const principalH = ((r.principal || 0) / maxPmt) * chartH

    const yPrincipal = pad.top + chartH - principalH
    const yInterest = yPrincipal - interestH

    // 本金（绿色）
    ctx.fillStyle = '#22c55e'
    ctx.fillRect(x, yPrincipal, barW - 1, principalH)

    // 利息（红色）
    ctx.fillStyle = '#ef4444'
    ctx.fillRect(x, yInterest, barW - 1, interestH)
  }

  // Y轴
  ctx.fillStyle = '#888'
  ctx.font = '10px -apple-system, sans-serif'
  ctx.textAlign = 'right'
  const maxPmt = Math.max(...rows.map(r => r.payment || 0), 1)
  for (let i = 0; i <= 5; i++) {
    const y = pad.top + (chartH / 5) * i
    const val = maxPmt * (1 - i / 5)
    ctx.fillText(formatMoney(val), pad.left - 5, y + 4)

    ctx.strokeStyle = '#f0f0f0'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(pad.left, y)
    ctx.lineTo(pad.left + chartW, y)
    ctx.stroke()
  }

  // X轴标签
  ctx.textAlign = 'center'
  const step = Math.max(1, Math.floor(n / 10))
  for (let i = 0; i < n; i += step) {
    const x = pad.left + i * barW + barW / 2
    ctx.fillText(`${rows[i].month}期`, x, height - pad.bottom + 18)
  }

  // 图例
  const legendX = width - pad.right + 10
  ctx.fillStyle = '#22c55e'
  ctx.fillRect(legendX, pad.top, 12, 12)
  ctx.fillStyle = '#555'
  ctx.textAlign = 'left'
  ctx.font = '11px -apple-system, sans-serif'
  ctx.fillText('本金', legendX + 18, pad.top + 10)

  ctx.fillStyle = '#ef4444'
  ctx.fillRect(legendX, pad.top + 22, 12, 12)
  ctx.fillStyle = '#555'
  ctx.fillText('利息', legendX + 18, pad.top + 32)
}

// 导出CSV
function downloadCSV() {
  const rows = schedule.value
  if (rows.length === 0) return

  let csv = '\uFEFF期数,月供,本金,利息,剩余本金,提前还款\n'
  for (const r of rows) {
    csv += `${r.month},${r.payment.toFixed(2)},${r.principal.toFixed(2)},${r.interest.toFixed(2)},${Math.max(0, r.remaining).toFixed(2)},${r.prepayment || ''}\n`
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `还款计划表_${loanAmount.value}元_${loanYears.value}年.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

// 复制汇总
function copySummary() {
  const s = summary.value
  const text = [
    `贷款总额: ${formatMoney(loanAmount.value)} 元`,
    `年利率: ${annualRate.value}%`,
    `贷款期限: ${loanYears.value} 年（${loanMonths.value} 期）`,
    `还款方式: ${method.value === 'equal-payment' ? '等额本息' : '等额本金'}`,
    `每月还款: ${s.monthlyPayment} 元`,
    `还款总额: ${s.totalPayment} 元`,
    `利息总额: ${s.totalInterest} 元`,
    `利息占比: ${s.interestRatio}`,
  ].join('\n')
  navigator.clipboard.writeText(text).then(() => alert('已复制汇总信息'))
}

// 监听变化重绘
watch([schedule], () => nextTick(drawChart), { deep: true })
onMounted(() => window.addEventListener('resize', drawChart))
</script>

<style scoped>
.tool-page { padding-top: 0.5rem; }
h2 { font-size: 1.6rem; margin-bottom: 0.3rem; }
h3 { font-size: 1rem; color: #555; margin-bottom: 0.6rem; }
.subtitle { color: #888; font-size: 0.95rem; margin-bottom: 1.5rem; }

.section {
  background: white;
  border-radius: 12px;
  padding: 1.2rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border: 1px solid #eee;
}

.section label {
  display: block;
  font-weight: 600;
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 0.6rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.section-header label { margin-bottom: 0; }

.hint { font-size: 0.8rem; color: #aaa; margin-bottom: 0.8rem; }

.btn-sm {
  padding: 0.25rem 0.6rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #f8f9fa;
  font-size: 0.8rem;
  color: #555;
  cursor: pointer;
}

.btn-sm:hover { background: #e8e9ea; }

/* 参数网格 */
.param-grid { display: flex; flex-direction: column; gap: 1rem; }

.param-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.param-label { font-size: 0.85rem; color: #888; }

.input-num {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  box-sizing: border-box;
}

.input-num:focus { border-color: #22c55e; }
.input-short { max-width: 200px; }

.duration-row, .param-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.param-unit, .param-info { font-size: 0.85rem; color: #888; white-space: nowrap; }

/* 还款方式按钮 */
.type-buttons { display: flex; gap: 0.5rem; }

.btn-type {
  padding: 0.5rem 1.2rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: #f8f9fa;
  font-size: 0.9rem;
  color: #555;
  cursor: pointer;
}

.btn-type:hover { border-color: #22c55e; }
.btn-type.active { background: #f0fdf4; border-color: #22c55e; color: #16a34a; font-weight: 600; }

/* 提前还款 */
.prepayment-list { display: flex; flex-direction: column; gap: 0.5rem; }

.prepayment-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: #666;
  background: #f8f9fa;
  padding: 0.5rem 0.8rem;
  border-radius: 8px;
  flex-wrap: wrap;
}

.input-xs {
  width: 80px;
  padding: 0.35rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 0.85rem;
  outline: none;
}

.input-xs:focus { border-color: #22c55e; }

.btn-remove {
  width: 22px; height: 22px;
  border: none;
  background: #fee;
  color: #e74c3c;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
  margin-left: auto;
}

/* 汇总卡片 */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.summary-card {
  background: white;
  border-radius: 10px;
  padding: 1rem 1.2rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  border: 1px solid #eee;
}

.summary-label { font-size: 0.8rem; color: #888; margin-bottom: 0.3rem; }

.summary-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: #2c3e50;
  font-family: 'Courier New', monospace;
}

.summary-value.interest { color: #ef4444; }

.summary-sub { font-size: 0.75rem; color: #aaa; margin-top: 0.2rem; }

/* 图表 */
.chart-section {
  background: white;
  border-radius: 12px;
  padding: 1.2rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border: 1px solid #eee;
}

.canvas-wrapper {
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #eee;
  padding: 20px;
  overflow-x: auto;
}

/* 表格 */
.table-section { padding: 0; overflow: hidden; }

.table-scroll { overflow-x: auto; max-height: 500px; overflow-y: auto; }

.schedule-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.schedule-table th {
  background: #f8f9fa;
  padding: 0.6rem 0.8rem;
  font-weight: 600;
  color: #555;
  border-bottom: 2px solid #eee;
  position: sticky;
  top: 0;
  z-index: 1;
}

.schedule-table td {
  padding: 0.4rem 0.8rem;
  border-bottom: 1px solid #f5f5f5;
  text-align: right;
  font-family: 'Courier New', monospace;
  font-size: 0.82rem;
}

.schedule-table td:first-child { text-align: center; color: #888; }

.total-row td {
  background: #f0fdf4;
  font-weight: 700;
  border-top: 2px solid #22c55e;
}

/* 操作按钮 */
.action-bar { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1.5rem; }

.btn-copy {
  padding: 0.6rem 1.5rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  font-weight: 600;
}

.btn-copy:hover { opacity: 0.85; }
.btn-json { background: linear-gradient(135deg, #6366f1, #8b5cf6); }

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #22c55e;
  font-weight: 500;
}

.back-link:hover { text-decoration: underline; }

@media (max-width: 640px) {
  .summary-grid { grid-template-columns: 1fr 1fr; }
  .input-short { max-width: 100%; }
}
</style>
