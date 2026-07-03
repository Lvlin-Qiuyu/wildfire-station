<template>
  <div class="tool-page">
    <h2>🌐 CIDR 子网计算器</h2>
    <p class="subtitle">输入 IP 地址和 CIDR 前缀，自动计算子网信息，可视化展示地址空间划分</p>

    <!-- 输入区域 -->
    <div class="input-section">
      <div class="input-row">
        <div class="input-group">
          <label>IP 地址</label>
          <input
            v-model="ipInput"
            class="ip-input"
            placeholder="例如 192.168.1.0"
            spellcheck="false"
            @keydown.enter="calculate"
          />
        </div>
        <div class="input-group">
          <label>CIDR 前缀</label>
          <div class="cidr-input-wrap">
            <span class="slash">/</span>
            <input
              v-model.number="prefixInput"
              type="number"
              class="prefix-input"
              min="0"
              max="32"
              placeholder="24"
              @keydown.enter="calculate"
            />
          </div>
        </div>
        <button class="btn-primary" @click="calculate">计算</button>
      </div>
      <div v-if="error" class="error-msg">⚠️ {{ error }}</div>
    </div>

    <!-- 计算结果 -->
    <div v-if="result" class="result-section">
      <!-- 基本信息卡片 -->
      <div class="info-cards">
        <div class="info-card">
          <span class="info-label">网络地址</span>
          <span class="info-value highlight">{{ result.network }}</span>
        </div>
        <div class="info-card">
          <span class="info-label">广播地址</span>
          <span class="info-value">{{ result.broadcast }}</span>
        </div>
        <div class="info-card">
          <span class="info-label">子网掩码</span>
          <span class="info-value">{{ result.mask }}</span>
        </div>
        <div class="info-card">
          <span class="info-label">掩码（十进制）</span>
          <span class="info-value mono">{{ result.maskDecimal }}</span>
        </div>
        <div class="info-card">
          <span class="info-label">CIDR 表示</span>
          <span class="info-value highlight">{{ result.network }}/{{ prefixInput }}</span>
        </div>
        <div class="info-card">
          <span class="info-label">IP 类别</span>
          <span class="info-value">{{ result.ipClass }}</span>
        </div>
        <div class="info-card">
          <span class="info-label">可用主机数</span>
          <span class="info-value accent">{{ result.hostCount.toLocaleString() }}</span>
        </div>
        <div class="info-card">
          <span class="info-label">总地址数</span>
          <span class="info-value">{{ result.totalCount.toLocaleString() }}</span>
        </div>
        <div class="info-card">
          <span class="info-label">第一可用 IP</span>
          <span class="info-value">{{ result.firstHost }}</span>
        </div>
        <div class="info-card">
          <span class="info-label">最后可用 IP</span>
          <span class="info-value">{{ result.lastHost }}</span>
        </div>
        <div class="info-card">
          <span class="info-label">二进制网络位</span>
          <span class="info-value mono small">{{ result.binaryNet }}</span>
        </div>
        <div class="info-card">
          <span class="info-label">通配符掩码</span>
          <span class="info-value">{{ result.wildcard }}</span>
        </div>
      </div>

      <!-- 地址空间可视化 -->
      <div class="section">
        <div class="section-header">
          <h3>地址空间可视化</h3>
          <button class="btn-tiny" @click="copyAddressInfo">复制信息</button>
        </div>
        <div class="address-viz">
          <div class="viz-legend">
            <span class="legend-item"><span class="legend-color net-color"></span>网络地址</span>
            <span class="legend-item"><span class="legend-color host-color"></span>可用主机</span>
            <span class="legend-item"><span class="legend-color bcast-color"></span>广播地址</span>
          </div>
          <canvas ref="vizCanvas" class="viz-canvas"></canvas>
        </div>
      </div>

      <!-- 子网拆分 -->
      <div class="section">
        <div class="section-header">
          <h3>子网拆分</h3>
          <div class="subnet-controls">
            <label>拆分为 /{{ splitPrefix }} 的子网</label>
            <input
              type="range"
              v-model.number="splitPrefix"
              :min="prefixInput + 1"
              :max="32"
              class="range-input"
            />
            <span class="range-value">{{ splitPrefix }}</span>
          </div>
        </div>
        <div v-if="splitPrefix > prefixInput" class="subnet-grid">
          <div class="subnet-item" v-for="(subnet, idx) in subnets" :key="idx" :style="{ '--bar-color': subnetColors[idx % subnetColors.length] }">
            <div class="subnet-header">
              <span class="subnet-index">子网 {{ idx + 1 }}</span>
              <span class="subnet-range">{{ subnet.network }} - {{ subnet.broadcast }}</span>
            </div>
            <div class="subnet-bar"></div>
            <div class="subnet-detail">
              <span>可用 IP: {{ subnet.hostCount.toLocaleString() }} 个</span>
              <span>{{ subnet.firstHost }} ~ {{ subnet.lastHost }}</span>
            </div>
          </div>
        </div>
        <div v-else class="subnet-empty">前缀必须大于当前 CIDR 前缀（/{{ prefixInput }}）</div>
      </div>

      <!-- 常用子网参考 -->
      <div class="section">
        <h3>常用 CIDR 前缀参考</h3>
        <div class="ref-grid">
          <div
            v-for="ref in commonRefs"
            :key="ref.prefix"
            class="ref-item"
            :class="{ active: prefixInput === ref.prefix }"
            @click="applyRef(ref)"
          >
            <span class="ref-prefix">/{{ ref.prefix }}</span>
            <span class="ref-info">{{ ref.mask }} · {{ ref.hosts }}</span>
          </div>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'CIDR 子网计算器 - 野火小站' })

const ipInput = ref('192.168.1.0')
const prefixInput = ref(24)
const error = ref('')
const result = ref(null)
const splitPrefix = ref(25)
const vizCanvas = ref(null)

// 子网颜色
const subnetColors = ['#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#ef4444', '#ec4899', '#06b6d4', '#f97316']

// IP 转数字
function ipToNum(ip) {
  const parts = ip.split('.').map(Number)
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0
}

// 数字转 IP
function numToIp(num) {
  return [
    (num >>> 24) & 0xFF,
    (num >>> 16) & 0xFF,
    (num >>> 8) & 0xFF,
    num & 0xFF
  ].join('.')
}

// 数字转二进制
function numToBin(num) {
  return ((num >>> 0).toString(2)).padStart(32, '0')
}

// IP 类别
function getIpClass(firstOctet) {
  if (firstOctet < 128) return 'A 类'
  if (firstOctet < 192) return 'B 类'
  if (firstOctet < 224) return 'C 类'
  if (firstOctet < 240) return 'D 类（组播）'
  return 'E 类（保留）'
}

// 验证 IP 地址
function validateIp(ip) {
  const parts = ip.split('.')
  if (parts.length !== 4) return false
  return parts.every(p => {
    const n = Number(p)
    return /^\d{1,3}$/.test(p) && n >= 0 && n <= 255 && String(n) === p
  })
}

// 计算
function calculate() {
  error.value = ''

  // 验证
  const ip = ipInput.value.trim()
  if (!validateIp(ip)) {
    error.value = '请输入有效的 IPv4 地址（如 192.168.1.0）'
    result.value = null
    return
  }

  const prefix = Number(prefixInput.value)
  if (isNaN(prefix) || prefix < 0 || prefix > 32) {
    error.value = 'CIDR 前缀必须在 0-32 之间'
    result.value = null
    return
  }

  // 子网掩码
  const maskNum = prefix === 0 ? 0 : (0xFFFFFFFF << (32 - prefix)) >>> 0

  // 计算
  const ipNum = ipToNum(ip)
  const networkNum = (ipNum & maskNum) >>> 0
  const broadcastNum = (networkNum | (~maskNum >>> 0)) >>> 0

  const network = numToIp(networkNum)
  const broadcast = numToIp(broadcastNum)
  const mask = numToIp(maskNum)
  const maskDecimal = maskNum >>> 0
  const wildcard = numToIp((~maskNum) >>> 0)
  const total = Math.pow(2, 32 - prefix)
  const hostCount = prefix >= 31 ? (prefix === 31 ? 2 : 1) : total - 2

  const firstOctet = (networkNum >>> 24) & 0xFF

  // 二进制网络位
  const binStr = numToBin(networkNum)
  const binaryNet = binStr.slice(0, prefix) + ' ' + binStr.slice(prefix)

  result.value = {
    network,
    broadcast,
    mask,
    maskDecimal,
    wildcard,
    ipClass: getIpClass(firstOctet),
    totalCount: total,
    hostCount,
    firstHost: prefix >= 31 ? network : numToIp((networkNum + 1) >>> 0),
    lastHost: prefix >= 31 ? broadcast : numToIp((broadcastNum - 1) >>> 0),
    binaryNet
  }

  // 更新拆分前缀默认值
  if (splitPrefix.value <= prefix) {
    splitPrefix.value = Math.min(prefix + 1, 32)
  }

  // 绘制可视化
  nextTick(() => drawVisualization())
}

// 拆分子网
const subnets = computed(() => {
  if (!result.value) return []
  const prefix = prefixInput.value
  const splitPfx = splitPrefix.value
  if (splitPfx <= prefix) return []

  const networkNum = ipToNum(result.value.network)
  const subnetCount = Math.pow(2, splitPfx - prefix)
  const subnetSize = Math.pow(2, 32 - splitPfx)
  const subMask = splitPfx === 0 ? 0 : (0xFFFFFFFF << (32 - splitPfx)) >>> 0

  const list = []
  for (let i = 0; i < Math.min(subnetCount, 64); i++) {
    const netNum = (networkNum + i * subnetSize) >>> 0
    const bcastNum = (netNum | (~subMask >>> 0)) >>> 0
    const hostC = splitPfx >= 31 ? (splitPfx === 31 ? 2 : 1) : subnetSize - 2
    list.push({
      network: numToIp(netNum),
      broadcast: numToIp(bcastNum),
      hostCount: hostC,
      firstHost: splitPfx >= 31 ? numToIp(netNum) : numToIp((netNum + 1) >>> 0),
      lastHost: splitPfx >= 31 ? numToIp(bcastNum) : numToIp((bcastNum - 1) >>> 0)
    })
  }
  return list
})

// 绘制地址空间可视化
function drawVisualization() {
  const canvas = vizCanvas.value
  if (!canvas || !result.value) return

  const wrapper = canvas.parentElement
  const dpr = window.devicePixelRatio || 1
  const width = wrapper.clientWidth - 32
  const height = 60
  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = width + 'px'
  canvas.style.height = height + 'px'

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, width, height)

  const prefix = prefixInput.value
  const total = Math.pow(2, 32 - prefix)

  // 网络地址（1个）
  const netWidth = Math.max(2, (1 / total) * width)
  ctx.fillStyle = '#ef4444'
  ctx.fillRect(0, 0, netWidth, height)

  // 广播地址（1个）
  ctx.fillStyle = '#f59e0b'
  ctx.fillRect(width - netWidth, 0, netWidth, height)

  // 可用主机
  ctx.fillStyle = '#22c55e'
  const hostWidth = width - netWidth * 2
  if (hostWidth > 0) {
    ctx.fillRect(netWidth, 0, hostWidth, height)
  }

  // 比例标签（如果地址空间较小，显示格子）
  if (total <= 256 && total > 8) {
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'
    ctx.lineWidth = 0.5
    const cellWidth = width / total
    for (let i = 1; i < total; i++) {
      ctx.beginPath()
      ctx.moveTo(i * cellWidth, 0)
      ctx.lineTo(i * cellWidth, height)
      ctx.stroke()
    }
  }
}

// 复制地址信息
function copyAddressInfo() {
  if (!result.value) return
  const r = result.value
  const text = [
    `CIDR: ${r.network}/${prefixInput.value}`,
    `网络地址: ${r.network}`,
    `广播地址: ${r.broadcast}`,
    `子网掩码: ${r.mask}`,
    `通配符掩码: ${r.wildcard}`,
    `IP 类别: ${r.ipClass}`,
    `可用主机数: ${r.hostCount.toLocaleString()}`,
    `总地址数: ${r.totalCount.toLocaleString()}`,
    `第一可用 IP: ${r.firstHost}`,
    `最后可用 IP: ${r.lastHost}`
  ].join('\n')
  navigator.clipboard.writeText(text).then(() => {
    // 复制成功
  })
}

// 常用参考
const commonRefs = [
  { prefix: 8, mask: '255.0.0.0', hosts: '16,777,214' },
  { prefix: 12, mask: '255.240.0.0', hosts: '1,048,574' },
  { prefix: 16, mask: '255.255.0.0', hosts: '65,534' },
  { prefix: 20, mask: '255.255.240.0', hosts: '4,094' },
  { prefix: 21, mask: '255.255.248.0', hosts: '2,046' },
  { prefix: 22, mask: '255.255.252.0', hosts: '1,022' },
  { prefix: 23, mask: '255.255.254.0', hosts: '510' },
  { prefix: 24, mask: '255.255.255.0', hosts: '254' },
  { prefix: 25, mask: '255.255.255.128', hosts: '126' },
  { prefix: 26, mask: '255.255.255.192', hosts: '62' },
  { prefix: 27, mask: '255.255.255.224', hosts: '30' },
  { prefix: 28, mask: '255.255.255.240', hosts: '14' },
  { prefix: 29, mask: '255.255.255.248', hosts: '6' },
  { prefix: 30, mask: '255.255.255.252', hosts: '2' },
  { prefix: 31, mask: '255.255.255.254', hosts: '2（P2P）' },
  { prefix: 32, mask: '255.255.255.255', hosts: '1（单主机）' },
]

function applyRef(ref) {
  prefixInput.value = ref.prefix
  if (splitPrefix.value <= prefixInput.value) {
    splitPrefix.value = Math.min(prefixInput.value + 1, 32)
  }
  calculate()
}

// 自动计算（输入变化时）
watch([ipInput, prefixInput], () => {
  if (ipInput.value.trim() && prefixInput.value >= 0 && prefixInput.value <= 32) {
    calculate()
  }
})

// 窗口变化重绘
function onResize() {
  if (result.value) drawVisualization()
}

onMounted(() => {
  window.addEventListener('resize', onResize)
  calculate()
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
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

/* 输入区域 */
.input-section {
  background: #fff;
  border-radius: 10px;
  padding: 1.2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 1.5rem;
}

.input-row {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  flex-wrap: wrap;
}

.input-group {
  flex: 1;
  min-width: 180px;
}

.input-group label {
  display: block;
  font-weight: 600;
  font-size: 0.85rem;
  color: #555;
  margin-bottom: 0.3rem;
}

.ip-input {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  font-family: 'Courier New', monospace;
  transition: border-color 0.2s;
}

.ip-input:focus {
  outline: none;
  border-color: #22c55e;
}

.cidr-input-wrap {
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.cidr-input-wrap:focus-within {
  border-color: #22c55e;
}

.slash {
  padding: 0.6rem 0.5rem;
  background: #f5f5f5;
  font-weight: 700;
  font-size: 1.1rem;
  color: #22c55e;
  border-right: 1px solid #ddd;
}

.prefix-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 0.6rem 0.5rem;
  font-size: 1rem;
  font-family: 'Courier New', monospace;
  width: 60px;
}

.btn-primary {
  padding: 0.6rem 1.5rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: opacity 0.2s;
  white-space: nowrap;
}

.btn-primary:hover {
  opacity: 0.85;
}

.error-msg {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  border-radius: 8px;
  padding: 0.6rem 1rem;
  margin-top: 0.8rem;
  font-size: 0.9rem;
}

/* 信息卡片 */
.info-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 0.8rem;
  margin-bottom: 1.5rem;
}

.info-card {
  background: #fff;
  border-radius: 10px;
  padding: 0.8rem 1rem;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.info-label {
  font-size: 0.8rem;
  color: #999;
}

.info-value {
  font-size: 1rem;
  color: #2c3e50;
  font-weight: 600;
  word-break: break-all;
}

.info-value.highlight {
  color: #22c55e;
}

.info-value.accent {
  color: #3b82f6;
}

.info-value.mono {
  font-family: 'Courier New', monospace;
}

.info-value.small {
  font-size: 0.75rem;
  letter-spacing: 1px;
}

/* 区块 */
.section {
  background: #fff;
  border-radius: 10px;
  padding: 1.2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 1.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.8rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.section-header h3 {
  font-size: 1rem;
  color: #555;
  margin: 0;
}

.btn-tiny {
  padding: 0.3rem 0.7rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  background: #fff;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.btn-tiny:hover {
  border-color: #22c55e;
  color: #22c55e;
}

/* 地址空间可视化 */
.viz-legend {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.6rem;
  font-size: 0.8rem;
  color: #888;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  display: inline-block;
}

.net-color { background: #ef4444; }
.host-color { background: #22c55e; }
.bcast-color { background: #f59e0b; }

.viz-canvas {
  display: block;
  width: 100%;
  border-radius: 6px;
}

/* 子网拆分 */
.subnet-controls {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.subnet-controls label {
  font-size: 0.85rem;
  color: #666;
  white-space: nowrap;
}

.range-input {
  flex: 1;
  max-width: 200px;
  accent-color: #22c55e;
}

.range-value {
  font-family: 'Courier New', monospace;
  font-weight: 700;
  color: #22c55e;
  min-width: 30px;
}

.subnet-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.6rem;
}

.subnet-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 0.8rem;
  border-left: 3px solid var(--bar-color, #22c55e);
}

.subnet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.3rem;
}

.subnet-index {
  font-weight: 600;
  font-size: 0.85rem;
  color: #555;
}

.subnet-range {
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  color: #999;
}

.subnet-bar {
  height: 6px;
  background: var(--bar-color, #22c55e);
  border-radius: 3px;
  margin-bottom: 0.3rem;
  opacity: 0.6;
}

.subnet-detail {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #888;
}

.subnet-empty {
  text-align: center;
  color: #bbb;
  padding: 1.5rem;
  font-size: 0.9rem;
}

/* 常用参考 */
.ref-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.4rem;
}

.ref-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0.6rem;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
}

.ref-item:hover {
  background: #f0fdf4;
  border-color: #86efac;
}

.ref-item.active {
  background: #dcfce7;
  border-color: #22c55e;
}

.ref-prefix {
  font-family: 'Courier New', monospace;
  font-weight: 700;
  color: #22c55e;
}

.ref-info {
  color: #888;
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

@media (max-width: 640px) {
  .input-row {
    flex-direction: column;
    align-items: stretch;
  }
  .info-cards {
    grid-template-columns: 1fr 1fr;
  }
  .subnet-grid {
    grid-template-columns: 1fr;
  }
  .ref-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
