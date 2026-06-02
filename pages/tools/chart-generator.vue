<template>
  <div class="tool-page">
    <h2>📊 图表生成器</h2>
    <p class="subtitle">粘贴数据，一键生成柱状图/折线图/饼图，支持导出PNG</p>

    <div class="chart-container">
      <!-- Chart Type Selector -->
      <div class="type-tabs">
        <button
          v-for="t in chartTypes"
          :key="t.value"
          :class="{ active: chartType === t.value }"
          @click="chartType = t.value"
        >{{ t.icon }} {{ t.label }}</button>
      </div>

      <!-- Title Input -->
      <div class="input-row">
        <label>图表标题</label>
        <input v-model="title" placeholder="输入标题（可选）" class="text-input" />
      </div>

      <!-- Color Theme -->
      <div class="input-row">
        <label>配色方案</label>
        <div class="theme-selector">
          <button
            v-for="(theme, key) in colorThemes"
            :key="key"
            :class="{ active: selectedTheme === key }"
            @click="selectedTheme = key"
          >
            <span class="theme-dots">
              <span v-for="c in theme.slice(0, 5)" :key="c" class="dot" :style="{ background: c }"></span>
            </span>
            <span class="theme-name">{{ key }}</span>
          </button>
        </div>
      </div>

      <!-- Data Input -->
      <div class="input-row">
        <label>数据输入 <span class="hint">（每行一条：标签,数值）</span></label>
        <textarea
          v-model="csvData"
          placeholder="例如：&#10;苹果,120&#10;香蕉,80&#10;橙子,150&#10;葡萄,200"
          class="data-textarea"
          rows="6"
        ></textarea>
      </div>

      <!-- Action buttons -->
      <div class="action-row">
        <button class="btn-preview" @click="renderChart">📊 生成图表</button>
        <button class="btn-export" @click="exportPNG" :disabled="!chartInstance" v-if="chartInstance">💾 导出PNG</button>
      </div>

      <!-- Chart Preview -->
      <div class="preview-area" v-if="chartInstance">
        <div class="canvas-wrapper">
          <canvas ref="chartCanvas"></canvas>
        </div>
      </div>

      <!-- Placeholder -->
      <div class="placeholder" v-else>
        <p>📝 输入数据后点击"生成图表"预览</p>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '图表生成器 - 野火小站' })

const chartCanvas = ref(null)
const chartInstance = ref(null)
const chartType = ref('bar')
const title = ref('')
const csvData = ref('')
const selectedTheme = ref('翡翠')

const chartTypes = [
  { value: 'bar', label: '柱状图', icon: '📊' },
  { value: 'line', label: '折线图', icon: '📈' },
  { value: 'pie', label: '饼图', icon: '🥧' },
  { value: 'doughnut', label: '环形图', icon: '🍩' },
]

const colorThemes = {
  '翡翠': ['#22c55e', '#10b981', '#06b6d4', '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'],
  '暖阳': ['#f59e0b', '#f97316', '#ef4444', '#ec4899', '#8b5cf6', '#6366f1', '#0ea5e9', '#22c55e'],
  '海洋': ['#0ea5e9', '#06b6d4', '#22c55e', '#10b981', '#14b8a6', '#6366f1', '#8b5cf6', '#3b82f6'],
  '彩虹': ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6'],
  '商务': ['#1e3a5f', '#2563eb', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
}

let ChartJS = null

function loadChartJS() {
  return new Promise((resolve, reject) => {
    if (window.Chart) {
      resolve(window.Chart)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js'
    script.onload = () => resolve(window.Chart)
    script.onerror = reject
    document.head.appendChild(script)
  })
}

function parseCSV(data) {
  const lines = data.trim().split('\n').filter(l => l.trim())
  const labels = []
  const values = []
  for (const line of lines) {
    // Support both comma and tab separation
    const parts = line.includes('\t') ? line.split('\t') : line.split(',')
    if (parts.length >= 2) {
      labels.push(parts[0].trim())
      const val = parseFloat(parts[1].trim())
      values.push(isNaN(val) ? 0 : val)
    }
  }
  return { labels, values }
}

async function renderChart() {
  const { labels, values } = parseCSV(csvData.value)
  if (labels.length === 0) return

  if (!ChartJS) {
    ChartJS = await loadChartJS()
  }

  if (chartInstance.value) {
    chartInstance.value.destroy()
    chartInstance.value = null
  }

  const theme = colorThemes[selectedTheme.value]
  const isPie = chartType.value === 'pie' || chartType.value === 'doughnut'

  const bgColors = labels.map((_, i) => theme[i % theme.length])
  const borderColors = bgColors.map(c => c)

  const config = {
    type: chartType.value,
    data: {
      labels,
      datasets: [{
        label: title.value || '数据',
        data: values,
        backgroundColor: isPie ? bgColors : bgColors.map(c => c + '99'),
        borderColor: borderColors,
        borderWidth: isPie ? 2 : 2,
        borderRadius: chartType.value === 'bar' ? 6 : 0,
        tension: 0.3,
        fill: chartType.value === 'line' ? { target: 'origin', above: bgColors[0] + '20' } : false,
        pointBackgroundColor: bgColors,
        pointRadius: chartType.value === 'line' ? 5 : 0,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: { duration: 600 },
      plugins: {
        title: {
          display: !!title.value,
          text: title.value,
          font: { size: 18, weight: 'bold' },
          color: '#2c3e50',
          padding: { bottom: 16 }
        },
        legend: {
          display: isPie,
          position: 'bottom',
          labels: {
            padding: 16,
            usePointStyle: true,
            font: { size: 13 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: 10,
          cornerRadius: 8,
        }
      },
      scales: isPie ? {} : {
        x: {
          grid: { display: false },
          ticks: { color: '#666' }
        },
        y: {
          beginAtZero: true,
          grid: { color: '#f0f0f0' },
          ticks: { color: '#666' }
        }
      }
    }
  }

  await nextTick()
  if (chartCanvas.value) {
    chartInstance.value = new ChartJS(chartCanvas.value, config)
  }
}

function exportPNG() {
  if (!chartInstance.value) return
  const link = document.createElement('a')
  link.download = (title.value || 'chart') + '.png'
  link.href = chartInstance.value.toBase64Image()
  link.click()
}

// Auto render on type/theme change when data exists
watch([chartType, selectedTheme], () => {
  if (csvData.value.trim() && chartInstance.value) {
    renderChart()
  }
})

onUnmounted(() => {
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }
})
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

.chart-container {
  max-width: 680px;
  margin: 0 auto;
}

.type-tabs {
  display: flex;
  gap: 0;
  background: #f0f0f0;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 1.2rem;
  padding: 3px;
}

.type-tabs button {
  flex: 1;
  padding: 0.55rem 0.5rem;
  border: none;
  background: transparent;
  border-radius: 10px;
  font-size: 0.85rem;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
  white-space: nowrap;
}

.type-tabs button.active {
  background: white;
  color: #333;
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

.input-row {
  margin-bottom: 1rem;
}

.input-row label {
  display: block;
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 0.4rem;
  font-weight: 500;
}

.hint {
  color: #aaa;
  font-weight: 400;
  font-size: 0.8rem;
}

.text-input {
  width: 100%;
  padding: 0.55rem 0.8rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.text-input:focus {
  border-color: #22c55e;
}

.data-textarea {
  width: 100%;
  padding: 0.7rem 0.8rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: 'SF Mono', 'Fira Code', monospace;
  outline: none;
  transition: border-color 0.2s;
  resize: vertical;
  box-sizing: border-box;
  line-height: 1.6;
}

.data-textarea:focus {
  border-color: #22c55e;
}

.theme-selector {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.theme-selector button {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.7rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.theme-selector button.active {
  border-color: #22c55e;
  background: #f0fdf4;
}

.theme-dots {
  display: flex;
  gap: 2px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.theme-name {
  color: #555;
}

.action-row {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.btn-preview {
  padding: 0.6rem 1.5rem;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-preview:hover {
  opacity: 0.85;
}

.btn-export {
  padding: 0.6rem 1.5rem;
  border-radius: 8px;
  border: 2px solid #22c55e;
  background: white;
  color: #22c55e;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-export:hover {
  background: #f0fdf4;
}

.btn-export:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.preview-area {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  margin-bottom: 1.5rem;
}

.canvas-wrapper {
  position: relative;
  width: 100%;
  max-height: 500px;
}

.canvas-wrapper canvas {
  width: 100% !important;
  max-height: 500px;
}

.placeholder {
  text-align: center;
  padding: 3rem 1rem;
  background: #fafafa;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  color: #bbb;
  font-size: 1rem;
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
  .type-tabs {
    flex-wrap: wrap;
  }
  .type-tabs button {
    font-size: 0.78rem;
    padding: 0.45rem 0.3rem;
  }
  .theme-selector {
    gap: 0.3rem;
  }
  .action-row {
    flex-direction: column;
  }
}
</style>
