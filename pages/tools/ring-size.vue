<template>
  <div class="tool-page">
    <h2>💍 戒指尺寸对照器</h2>
    <p class="subtitle">国际戒圈码互转（中国/美国/英国/日本/欧盟），提供两种测量方法，可视化对比</p>

    <div class="ring-container">
      <!-- 测量方法指引 -->
      <div class="method-tabs">
        <button :class="{ active: method === 'circumference' }" @click="method = 'circumference'">
          📏 纸条量周长法
        </button>
        <button :class="{ active: method === 'diameter' }" @click="method = 'diameter'">
          👓 戒指量内径法
        </button>
      </div>

      <!-- 纸条量周长法 -->
      <div class="method-panel" v-if="method === 'circumference'">
        <div class="method-steps">
          <div class="step">1️⃣ 用一根纸条或细线绕手指最粗处一圈</div>
          <div class="step">2️⃣ 用直尺量出纸条交叉处的长度（即手指周长）</div>
          <div class="step">3️⃣ 在下方输入周长数值</div>
        </div>
        <div class="measure-input">
          <label>手指周长</label>
          <div class="input-group">
            <input
              v-model.number="circumference"
              type="number"
              placeholder="例如 52"
              class="text-input"
              min="30"
              max="90"
              step="0.1"
            />
            <span class="unit-label">mm</span>
          </div>
        </div>
      </div>

      <!-- 戒指量内径法 -->
      <div class="method-panel" v-if="method === 'diameter'">
        <div class="method-steps">
          <div class="step">1️⃣ 将现有合适的戒指平放在桌面上</div>
          <div class="step">2️⃣ 用直尺量出戒指内圈的最大直径</div>
          <div class="step">3️⃣ 在下方输入直径数值</div>
        </div>
        <div class="measure-input">
          <label>戒指内径</label>
          <div class="input-group">
            <input
              v-model.number="diameter"
              type="number"
              placeholder="例如 16.5"
              class="text-input"
              min="10"
              max="30"
              step="0.1"
            />
            <span class="unit-label">mm</span>
          </div>
        </div>
      </div>

      <!-- 转换结果 -->
      <div class="result-card" v-if="matchResult">
        <h3>✅ 推荐尺寸</h3>
        <div class="result-grid">
          <div class="result-item">
            <span class="result-label">🇨🇳 中国码</span>
            <span class="result-value">{{ matchResult.cn }}</span>
          </div>
          <div class="result-item">
            <span class="result-label">🇺🇸 美国码</span>
            <span class="result-value">{{ matchResult.us }}</span>
          </div>
          <div class="result-item">
            <span class="result-label">🇬🇧 英国码</span>
            <span class="result-value">{{ matchResult.uk }}</span>
          </div>
          <div class="result-item">
            <span class="result-label">🇯🇵 日本码</span>
            <span class="result-value">{{ matchResult.jp }}</span>
          </div>
          <div class="result-item">
            <span class="result-label">🇪🇺 欧盟码</span>
            <span class="result-value">{{ matchResult.eu }}</span>
          </div>
          <div class="result-item">
            <span class="result-label">📏 内径</span>
            <span class="result-value">{{ matchResult.diameter }} mm</span>
          </div>
          <div class="result-item">
            <span class="result-label">📐 周长</span>
            <span class="result-value">{{ matchResult.circumference }} mm</span>
          </div>
        </div>
      </div>

      <!-- 戒圈可视化对比 -->
      <div class="visual-section" v-if="matchResult">
        <h3>🔍 戒圈大小对比</h3>
        <div class="ring-visual">
          <div class="ring-display">
            <!-- SVG 戒圈可视化 -->
            <svg ref="ringSvg" viewBox="0 0 300 300" class="ring-svg">
              <!-- 背景网格 -->
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" stroke-width="0.5"/>
                </pattern>
              </defs>
              <rect width="300" height="300" fill="url(#grid)" rx="8"/>
              
              <!-- 标尺线 -->
              <line x1="150" y1="0" x2="150" y2="300" stroke="#e0e0e0" stroke-width="0.5" stroke-dasharray="4"/>
              <line x1="0" y1="150" x2="300" y2="150" stroke="#e0e0e0" stroke-width="0.5" stroke-dasharray="4"/>
              
              <!-- 前一个尺寸（浅色对比） -->
              <circle
                v-if="compareRing"
                :cx="150"
                :cy="150"
                :r="compareRingRadius"
                fill="none"
                stroke="#e0e0e0"
                stroke-width="1.5"
                stroke-dasharray="5,3"
              />
              <text
                v-if="compareRing"
                :x="150"
                :y="150 - compareRingRadius - 6"
                text-anchor="middle"
                fill="#ccc"
                font-size="10"
              >{{ compareRing.cn }}号</text>
              
              <!-- 当前尺寸 -->
              <circle
                :cx="150"
                :cy="150"
                :r="currentRingRadius"
                fill="none"
                stroke="#22c55e"
                stroke-width="2.5"
              />
              <text
                :x="150"
                :y="150 - currentRingRadius - 8"
                text-anchor="middle"
                fill="#22c55e"
                font-weight="bold"
                font-size="12"
              >{{ matchResult.cn }}号</text>
              
              <!-- 后一个尺寸（浅色对比） -->
              <circle
                v-if="compareNextRing"
                :cx="150"
                :cy="150"
                :r="compareNextRingRadius"
                fill="none"
                stroke="#e0e0e0"
                stroke-width="1.5"
                stroke-dasharray="5,3"
              />
              <text
                v-if="compareNextRing"
                :x="150"
                :y="150 - compareNextRingRadius - 6"
                text-anchor="middle"
                fill="#ccc"
                font-size="10"
              >{{ compareNextRing.cn }}号</text>
              
              <!-- 中心直径标注 -->
              <line
                :x1="150 - currentRingRadius"
                :y1="150"
                :x2="150 + currentRingRadius"
                :y2="150"
                stroke="#f59e0b"
                stroke-width="1"
                stroke-dasharray="3,2"
              />
              <text
                x="150"
                y="165"
                text-anchor="middle"
                fill="#f59e0b"
                font-size="10"
              >⌀ {{ matchResult.diameter }}mm</text>
            </svg>
          </div>
        </div>
      </div>

      <!-- 完整对照表 -->
      <div class="table-section">
        <h3>📋 国际戒圈码对照表</h3>
        <div class="table-controls">
          <input
            v-model="tableFilter"
            placeholder="搜索尺寸码..."
            class="filter-input"
          />
        </div>
        <div class="table-wrap">
          <table class="ref-table">
            <thead>
              <tr>
                <th>🇨🇳 中国</th>
                <th>🇺🇸 美国</th>
                <th>🇬🇧 英国</th>
                <th>🇯🇵 日本</th>
                <th>🇪🇺 欧盟</th>
                <th>内径(mm)</th>
                <th>周长(mm)</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="ring in filteredRings"
                :key="ring.cn"
                :class="{ active: matchResult && ring.cn === matchResult.cn }"
              >
                <td>{{ ring.cn }}</td>
                <td>{{ ring.us }}</td>
                <td>{{ ring.uk }}</td>
                <td>{{ ring.jp }}</td>
                <td>{{ ring.eu }}</td>
                <td>{{ ring.diameter }}</td>
                <td>{{ ring.circumference }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '戒指尺寸对照器 - 野火小站' })

const method = ref('circumference')
const circumference = ref(null)
const diameter = ref(null)
const tableFilter = ref('')

// 国际戒圈码完整对照表（中国码 5-28）
const ringData = [
  { cn: 5, us: '-', uk: '-', jp: '-', eu: 39, diameter: 12.4, circumference: 39.0 },
  { cn: 6, us: '-', uk: 'A', jp: '-', eu: 40, diameter: 12.7, circumference: 40.0 },
  { cn: 7, us: 4, uk: 'A½', jp: '-', eu: 41, diameter: 13.1, circumference: 41.0 },
  { cn: 8, us: 4.5, uk: 'B', jp: 7, eu: 41.5, diameter: 13.2, circumference: 41.5 },
  { cn: 9, us: 5, uk: 'B½', jp: 8, eu: 42, diameter: 13.5, circumference: 42.0 },
  { cn: 10, us: 5.5, uk: 'C', jp: 9, eu: 42.5, diameter: 13.8, circumference: 43.0 },
  { cn: 11, us: 6, uk: 'C½', jp: 10, eu: 43.5, diameter: 13.9, circumference: 43.5 },
  { cn: 12, us: 6.5, uk: 'D', jp: 11, eu: 44, diameter: 14.1, circumference: 44.0 },
  { cn: 13, us: 7, uk: 'D½', jp: 12, eu: 45, diameter: 14.3, circumference: 45.0 },
  { cn: 14, us: 7.5, uk: 'E', jp: 13, eu: 45.5, diameter: 14.5, circumference: 45.5 },
  { cn: 15, us: 8, uk: 'E½', jp: 14, eu: 46, diameter: 14.8, circumference: 46.5 },
  { cn: 16, us: 8.5, uk: 'F', jp: 15, eu: 47, diameter: 15.0, circumference: 47.0 },
  { cn: 17, us: 9, uk: 'F½', jp: 16, eu: 47.5, diameter: 15.3, circumference: 48.0 },
  { cn: 18, us: 9.5, uk: 'G', jp: 17, eu: 48, diameter: 15.5, circumference: 48.5 },
  { cn: 19, us: 10, uk: 'G½', jp: 18, eu: 49, diameter: 15.7, circumference: 49.0 },
  { cn: 20, us: 10.5, uk: 'H', jp: 19, eu: 50, diameter: 16.0, circumference: 50.0 },
  { cn: 21, us: 11, uk: 'H½', jp: 20, eu: 50.5, diameter: 16.1, circumference: 50.5 },
  { cn: 22, us: 11.5, uk: 'I', jp: 21, eu: 51, diameter: 16.3, circumference: 51.0 },
  { cn: 23, us: 12, uk: 'I½', jp: 22, eu: 52, diameter: 16.5, circumference: 52.0 },
  { cn: 24, us: 12.5, uk: 'J', jp: 23, eu: 52.5, diameter: 16.7, circumference: 52.5 },
  { cn: 25, us: 13, uk: 'J½', jp: 24, eu: 53.5, diameter: 17.0, circumference: 53.5 },
  { cn: 26, us: 13.5, uk: 'K', jp: 25, eu: 54, diameter: 17.2, circumference: 54.0 },
  { cn: 27, us: 14, uk: 'L', jp: 26, eu: 55, diameter: 17.5, circumference: 55.0 },
  { cn: 28, us: 14.5, uk: 'L½', jp: 27, eu: 56, diameter: 17.8, circumference: 56.0 },
]

// 根据周长或直径查找最接近的戒圈码
const matchResult = computed(() => {
  let targetCirc = 0

  if (method.value === 'circumference' && circumference.value && circumference.value > 30) {
    targetCirc = circumference.value
  } else if (method.value === 'diameter' && diameter.value && diameter.value > 10) {
    targetCirc = diameter.value * Math.PI
  }

  if (targetCirc <= 0) return null

  // 找最接近的
  let closest = ringData[0]
  let minDiff = Infinity
  for (const ring of ringData) {
    const diff = Math.abs(ring.circumference - targetCirc)
    if (diff < minDiff) {
      minDiff = diff
      closest = ring
    }
  }
  return closest
})

// 前后相邻尺寸（用于可视化对比）
const currentIndex = computed(() => {
  if (!matchResult.value) return -1
  return ringData.findIndex(r => r.cn === matchResult.value.cn)
})

const compareRing = computed(() => {
  const idx = currentIndex.value
  return idx > 0 ? ringData[idx - 1] : null
})

const compareNextRing = computed(() => {
  const idx = currentIndex.value
  return idx >= 0 && idx < ringData.length - 1 ? ringData[idx + 1] : null
})

// SVG 半径映射（将内径映射到 SVG 坐标空间）
const ringScale = 6.5

const currentRingRadius = computed(() => {
  return matchResult.value ? matchResult.value.diameter / 2 * ringScale : 0
})

const compareRingRadius = computed(() => {
  return compareRing.value ? compareRing.value.diameter / 2 * ringScale : 0
})

const compareNextRingRadius = computed(() => {
  return compareNextRing.value ? compareNextRing.value.diameter / 2 * ringScale : 0
})

// 表格过滤
const filteredRings = computed(() => {
  const filter = tableFilter.value.trim().toLowerCase()
  if (!filter) return ringData
  return ringData.filter(r =>
    String(r.cn).includes(filter) ||
    String(r.us).includes(filter) ||
    String(r.uk).toLowerCase().includes(filter) ||
    String(r.jp).includes(filter) ||
    String(r.eu).includes(filter)
  )
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

.ring-container {
  max-width: 740px;
  margin: 0 auto;
}

/* 方法选择标签 */
.method-tabs {
  display: flex;
  gap: 0;
  background: #f0f0f0;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 1.2rem;
  padding: 3px;
}

.method-tabs button {
  flex: 1;
  padding: 0.6rem 0.5rem;
  border: none;
  background: transparent;
  border-radius: 10px;
  font-size: 0.9rem;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.method-tabs button.active {
  background: white;
  color: #333;
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

/* 方法指引 */
.method-panel {
  margin-bottom: 1.5rem;
}

.method-steps {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 10px;
  border-left: 3px solid #22c55e;
}

.step {
  font-size: 0.9rem;
  color: #555;
  line-height: 1.5;
}

.measure-input {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
}

.measure-input label {
  font-size: 0.9rem;
  color: #555;
  font-weight: 500;
  flex-shrink: 0;
  margin-bottom: 0.15rem;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.text-input {
  width: 140px;
  padding: 0.55rem 0.8rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}

.text-input:focus {
  border-color: #22c55e;
}

.unit-label {
  font-size: 0.9rem;
  color: #888;
  font-weight: 500;
}

/* 转换结果卡片 */
.result-card {
  background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  padding: 1.2rem;
  margin-bottom: 1.5rem;
}

.result-card h3 {
  font-size: 1rem;
  color: #166534;
  margin-bottom: 0.8rem;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 0.6rem;
}

.result-item {
  display: flex;
  flex-direction: column;
  background: white;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
}

.result-label {
  font-size: 0.78rem;
  color: #888;
  margin-bottom: 0.2rem;
}

.result-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #166534;
}

/* 可视化对比 */
.visual-section {
  margin-bottom: 1.5rem;
}

.visual-section h3 {
  font-size: 1rem;
  color: #555;
  margin-bottom: 0.8rem;
}

.ring-visual {
  display: flex;
  justify-content: center;
}

.ring-display {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border: 1px solid #eee;
}

.ring-svg {
  width: 240px;
  height: 240px;
}

/* 对照表 */
.table-section {
  margin-bottom: 1.5rem;
}

.table-section h3 {
  font-size: 1.05rem;
  color: #333;
  margin-bottom: 0.8rem;
}

.table-controls {
  margin-bottom: 0.8rem;
}

.filter-input {
  width: 100%;
  max-width: 240px;
  padding: 0.45rem 0.7rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.filter-input:focus {
  border-color: #22c55e;
}

.table-wrap {
  overflow-x: auto;
  border-radius: 10px;
  border: 1px solid #eee;
}

.ref-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.ref-table th {
  padding: 0.6rem 0.7rem;
  background: #f8f9fa;
  font-size: 0.85rem;
  font-weight: 600;
  color: #555;
  text-align: center;
  border-bottom: 1px solid #eee;
  white-space: nowrap;
}

.ref-table td {
  padding: 0.45rem 0.7rem;
  font-size: 0.85rem;
  color: #555;
  border-bottom: 1px solid #f5f5f5;
  text-align: center;
  white-space: nowrap;
}

.ref-table tr:hover td {
  background: #f8fff8;
}

.ref-table tr.active td {
  background: #dcfce7;
  font-weight: 600;
  color: #166534;
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
  .measure-input {
    flex-direction: column;
    align-items: flex-start;
  }
  .result-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .ring-svg {
    width: 200px;
    height: 200px;
  }
  .method-tabs button {
    font-size: 0.82rem;
    padding: 0.5rem 0.3rem;
  }
}
</style>
