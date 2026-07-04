<template>
  <div class="tool-page">
    <h2>🥁 音频节拍速度(BPM)检测器</h2>
    <p class="subtitle">上传音频文件自动检测 BPM（每分钟节拍数），支持手动 TAP 敲击校准，显示节奏分析结果</p>

    <!-- 上传区域 -->
    <div class="upload-area" v-if="!audioFile" @click="triggerUpload" @dragover.prevent @drop.prevent="handleDrop">
      <input ref="fileInput" type="file" accept="audio/*" hidden @change="handleFileChange" />
      <div class="upload-content">
        <span class="upload-icon">🥁</span>
        <p>点击或拖拽音频文件到这里</p>
        <p class="upload-hint">支持 MP3、WAV、OGG、FLAC、AAC 等格式</p>
      </div>
    </div>

    <!-- 分析区域 -->
    <div v-if="audioFile" class="analyzer-layout">
      <!-- 文件信息 -->
      <div class="file-bar">
        <span class="file-name">📁 {{ audioFile.name }}</span>
        <span class="file-size">{{ formatSize(audioFile.size) }}</span>
        <button class="btn-sm" @click="resetAudio">重新上传</button>
      </div>

      <!-- 解码中 -->
      <div v-if="analyzing" class="analyzing-tip">
        <span class="spinner">⏳</span> 正在分析节拍...
      </div>

      <!-- BPM 结果展示 -->
      <div v-if="!analyzing && bpmResult" class="result-section">
        <!-- BPM 主显示 -->
        <div class="bpm-display">
          <div class="bpm-number">{{ bpmResult.bpm }}</div>
          <div class="bpm-label">BPM</div>
          <div class="bpm-desc">{{ getBpmDescription(bpmResult.bpm) }}</div>
        </div>

        <!-- 分析信息卡片 -->
        <div class="info-grid">
          <div class="info-card">
            <div class="card-label">🎼 置信度</div>
            <div class="card-value" :class="bpmResult.confidence > 0.7 ? 'good' : bpmResult.confidence > 0.4 ? 'fair' : 'poor'">
              {{ (bpmResult.confidence * 100).toFixed(0) }}%
            </div>
            <div class="card-sub">{{ bpmResult.confidence > 0.7 ? '高' : bpmResult.confidence > 0.4 ? '中等' : '较低' }}</div>
          </div>
          <div class="info-card">
            <div class="card-label">🎵 节拍间隔</div>
            <div class="card-value">{{ bpmResult.avgInterval.toFixed(0) }} ms</div>
            <div class="card-sub">毫秒/拍</div>
          </div>
          <div class="info-card">
            <div class="card-label">🔊 检测到的节拍数</div>
            <div class="card-value">{{ bpmResult.beatCount }}</div>
            <div class="card-sub">个节拍</div>
          </div>
          <div class="info-card">
            <div class="card-label">⏱️ 音频时长</div>
            <div class="card-value">{{ formatDuration(bpmResult.duration) }}</div>
            <div class="card-sub">秒</div>
          </div>
        </div>

        <!-- 波形 + 节拍标注 -->
        <div class="section">
          <div class="section-title">〰️ 波形与节拍标注</div>
          <div class="canvas-container" ref="waveContainer">
            <canvas ref="waveCanvas" class="wave-canvas" />
          </div>
          <div class="beat-legend">
            <span class="legend-item"><span class="legend-bar"></span>红色标记 = 检测到的节拍</span>
          </div>
        </div>

        <!-- 节奏分类 -->
        <div class="section">
          <div class="section-title">🎵 节奏分类</div>
          <div class="genre-tags">
            <span
              v-for="genre in bpmResult.genres"
              :key="genre"
              class="genre-tag"
            >{{ genre }}</span>
          </div>
        </div>
      </div>

      <!-- TAP 手动校准 -->
      <div class="tap-section">
        <div class="section-title">🫵 手动 TAP 校准</div>
        <p class="tap-desc">跟着音乐的节奏反复点击按钮或按空格键，自动计算 BPM</p>

        <div class="tap-display">
          <button class="tap-btn" @click="onTap" :class="{ 'tap-active': tapPressed }">
            TAP
          </button>
          <div v-if="tapBpm > 0" class="tap-result">
            <span class="tap-bpm">{{ tapBpm }}</span>
            <span class="tap-label">BPM（{{ tapCount }} 次敲击）</span>
          </div>
        </div>

        <div v-if="tapBpm > 0" class="tap-actions">
          <button class="btn-use" @click="applyTapBpm">应用此 BPM</button>
          <button class="btn-clear-tap" @click="clearTap">清除</button>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-bar" v-if="bpmResult">
        <button class="btn-copy" @click="copyBpmInfo">📋 复制 BPM 信息</button>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '音频BPM检测器 - 野火小站' })

const fileInput = ref(null)
const waveContainer = ref(null)
const waveCanvas = ref(null)

const audioFile = ref(null)
const analyzing = ref(false)
const bpmResult = ref(null)

// TAP 状态
const tapPressed = ref(false)
const tapTimes = []
const tapBpm = ref(0)
const tapCount = ref(0)

// 触发上传
function triggerUpload() {
  fileInput.value?.click()
}

function handleFileChange(e) {
  const file = e.target.files?.[0]
  if (file) loadAudio(file)
}

function handleDrop(e) {
  const file = e.dataTransfer.files?.[0]
  if (file && file.type.startsWith('audio/')) loadAudio(file)
}

// 加载并分析音频
async function loadAudio(file) {
  audioFile.value = file
  bpmResult.value = null
  analyzing.value = true

  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const arrayBuffer = await file.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

    const bpm = detectBPM(audioBuffer)
    bpmResult.value = bpm

    nextTick(() => drawWaveWithBeats(audioBuffer, bpm.beats))

    audioContext.close()
  } catch (err) {
    alert('无法解码此音频文件，请确认格式是否受支持')
  } finally {
    analyzing.value = false
  }
}

// BPM 检测算法（自相关法）
function detectBPM(audioBuffer) {
  const data = audioBuffer.getChannelData(0)
  const sampleRate = audioBuffer.sampleRate
  const duration = audioBuffer.duration

  // 1. 降采样：计算能量包络
  const windowSize = Math.floor(sampleRate * 0.01) // 10ms 窗口
  const hopSize = Math.floor(windowSize / 2)
  const energyLen = Math.floor(data.length / hopSize)
  const energy = new Float32Array(energyLen)

  for (let i = 0; i < energyLen; i++) {
    const start = i * hopSize
    let sum = 0
    for (let j = start; j < Math.min(start + windowSize, data.length); j++) {
      sum += data[j] * data[j]
    }
    energy[i] = sum
  }

  // 2. 归一化
  let maxE = 0
  for (let i = 0; i < energyLen; i++) {
    if (energy[i] > maxE) maxE = energy[i]
  }
  if (maxE > 0) {
    for (let i = 0; i < energyLen; i++) energy[i] /= maxE
  }

  // 3. 自相关计算
  const minBpm = 60
  const maxBpm = 200
  const minLag = Math.floor(sampleRate / hopSize * 60 / maxBpm)
  const maxLag = Math.floor(sampleRate / hopSize * 60 / minBpm)
  const corrLen = maxLag + 1
  const corr = new Float32Array(corrLen)

  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0
    for (let i = 0; i < energyLen - lag; i++) {
      sum += energy[i] * energy[i + lag]
    }
    corr[lag] = sum / (energyLen - lag)
  }

  // 4. 找最大自相关值对应的 lag
  let bestLag = minLag
  let bestVal = 0
  for (let lag = minLag; lag <= maxLag; lag++) {
    if (corr[lag] > bestVal) {
      bestVal = corr[lag]
      bestLag = lag
    }
  }

  // 5. 计算 BPM
  const bpmInterval = bestLag * hopSize / sampleRate // 秒
  let bpm = Math.round(60 / bpmInterval)

  // BPM 修正：如果超过 200，可能需要折半
  if (bpm > 200) bpm = Math.round(bpm / 2)
  if (bpm < 60) bpm = Math.round(bpm * 2)

  // 6. 节拍检测：通过能量峰值
  const beats = detectBeats(energy, bpmInterval, hopSize, sampleRate, data.length)

  // 7. 置信度评估
  const confidence = Math.min(1, bestVal * 3) // 归一化

  // 8. 平均间隔
  const avgInterval = beats.length > 1
    ? beats.reduce((acc, b, i) => i > 0 ? acc + (b - beats[i-1]) : 0, 0) / (beats.length - 1) * 1000 / sampleRate
    : bpmInterval * 1000

  return {
    bpm,
    confidence,
    avgInterval,
    beatCount: beats.length,
    duration,
    beats,
    genres: getGenres(bpm)
  }
}

// 节拍峰值检测
function detectBeats(energy, interval, hopSize, sampleRate, dataLen) {
  const beats = []
  const expectedSamples = Math.floor(interval * sampleRate)
  const minGap = Math.floor(expectedSamples * 0.5) // 最小间隔

  // 计算能量差分（Onset 检测）
  const diff = new Float32Array(energy.length)
  for (let i = 1; i < energy.length; i++) {
    diff[i] = Math.max(0, energy[i] - energy[i - 1])
  }

  // 找阈值
  let sum = 0
  for (let i = 0; i < diff.length; i++) sum += diff[i]
  const avg = sum / diff.length
  const threshold = avg * 2.5

  // 检测峰值
  let lastBeat = -minGap
  for (let i = 2; i < diff.length; i++) {
    const samplePos = i * hopSize
    if (samplePos - lastBeat < minGap) continue

    if (diff[i] > threshold && diff[i] > diff[i-1] && diff[i] > diff[i-2] && diff[i] >= diff[i+1]) {
      beats.push(samplePos)
      lastBeat = samplePos
    }
  }

  return beats
}

// BPM 描述
function getBpmDescription(bpm) {
  if (bpm < 70) return '缓慢 - 冥想/氛围音乐'
  if (bpm < 90) return '慢速 - 慢摇/R&B'
  if (bpm < 110) return '中速 - 流行/民谣'
  if (bpm < 130) return '中快速 - 舞曲/电子'
  if (bpm < 150) return '快速 - 摇滚/朋克'
  if (bpm < 180) return '极快 - 鼓打贝斯/硬核'
  return '极速 - 碎拍/速度金属'
}

// 节奏分类
function getGenres(bpm) {
  if (bpm < 80) return ['冥想', '氛围', 'Chillout']
  if (bpm < 100) return ['慢摇', 'R&B', '灵魂乐']
  if (bpm < 120) return ['流行', '民谣', '乡村']
  if (bpm < 140) return ['House', '电子舞曲', 'Techno']
  if (bpm < 160) return ['摇滚', '朋克', 'Ska']
  if (bpm < 180) return ['鼓打贝斯', '硬核', 'Dubstep']
  return ['碎拍', '速度金属', '硬核电子']
}

// 绘制波形 + 节拍标注
function drawWaveWithBeats(audioBuffer, beats) {
  const canvas = waveCanvas.value
  if (!canvas) return

  const container = waveContainer.value
  const dpr = window.devicePixelRatio || 1
  const w = container.clientWidth - 20
  const h = 140

  canvas.width = w * dpr
  canvas.height = h * dpr
  canvas.style.width = w + 'px'
  canvas.style.height = h + 'px'

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  const data = audioBuffer.getChannelData(0)
  const centerY = h / 2

  // 背景
  ctx.fillStyle = '#f8faf8'
  ctx.fillRect(0, 0, w, h)

  // 中线
  ctx.strokeStyle = '#e8e8e8'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, centerY)
  ctx.lineTo(w, centerY)
  ctx.stroke()

  // 波形
  const gradient = ctx.createLinearGradient(0, 0, w, 0)
  gradient.addColorStop(0, '#22c55e')
  gradient.addColorStop(0.5, '#10b981')
  gradient.addColorStop(1, '#059669')

  ctx.fillStyle = gradient
  const step = Math.ceil(data.length / w)
  for (let i = 0; i < w; i++) {
    let min = 1, max = -1
    const start = i * step
    for (let j = 0; j < step && start + j < data.length; j++) {
      const val = data[start + j]
      if (val < min) min = val
      if (val > max) max = val
    }
    const top = (1 - max) * centerY
    const bottom = (1 - min) * centerY
    ctx.fillRect(i, top, 1, bottom - top)
  }

  // 节拍标记
  const maxSample = data.length
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([3, 3])

  beats.forEach(beat => {
    const x = (beat / maxSample) * w
    if (x >= 0 && x <= w) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
  })

  ctx.setLineDash([])
}

// TAP 手动校准
function onTap() {
  const now = Date.now()
  tapTimes.push(now)
  tapPressed.value = true
  setTimeout(() => tapPressed.value = false, 100)

  // 保留最近 32 次点击
  if (tapTimes.length > 32) tapTimes.shift()

  if (tapTimes.length >= 2) {
    // 计算平均间隔
    let totalInterval = 0
    for (let i = 1; i < tapTimes.length; i++) {
      totalInterval += tapTimes[i] - tapTimes[i - 1]
    }
    const avgInterval = totalInterval / (tapTimes.length - 1)
    tapBpm.value = Math.round(60000 / avgInterval)
    tapCount.value = tapTimes.length
  } else {
    tapCount.value = tapTimes.length
  }
}

// 应用 TAP BPM
function applyTapBpm() {
  if (!tapBpm.value || !bpmResult.value) return
  bpmResult.value = {
    ...bpmResult.value,
    bpm: tapBpm.value,
    genres: getGenres(tapBpm.value)
  }
}

// 清除 TAP
function clearTap() {
  tapTimes.length = 0
  tapBpm.value = 0
  tapCount.value = 0
}

// 复制 BPM 信息
function copyBpmInfo() {
  if (!bpmResult.value) return
  const r = bpmResult.value
  const text = [
    `🎵 BPM 检测结果`,
    ``,
    `BPM: ${r.bpm}`,
    `置信度: ${(r.confidence * 100).toFixed(0)}%`,
    `节拍间隔: ${r.avgInterval.toFixed(0)} ms`,
    `节拍数: ${r.beatCount}`,
    `音频时长: ${r.duration.toFixed(1)} 秒`,
    `节奏分类: ${r.genres.join('、')}`,
    `描述: ${getBpmDescription(r.bpm)}`,
  ].join('\n')

  navigator.clipboard.writeText(text).then(() => alert('已复制到剪贴板'))
}

// 格式化时长
function formatDuration(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function resetAudio() {
  audioFile.value = null
  bpmResult.value = null
  clearTap()
}

// 键盘空格键 TAP
function onKeyDown(e) {
  if (e.code === 'Space' && audioFile.value) {
    e.preventDefault()
    onTap()
  }
}

function onResize() {
  // 需要重新加载音频数据才能重绘
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
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

/* 上传 */
.upload-area {
  border: 2px dashed #c8e6c9;
  border-radius: 16px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  background: #f1f8f1;
  transition: all 0.2s;
}

.upload-area:hover { border-color: #22c55e; background: #e8f5e9; }
.upload-icon { font-size: 3rem; display: block; margin-bottom: 0.5rem; }
.upload-area p { color: #555; margin-bottom: 0.3rem; }
.upload-hint { color: #aaa !important; font-size: 0.85rem; }

/* 布局 */
.analyzer-layout {
  background: #fff;
  border-radius: 12px;
  padding: 1.2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

/* 文件信息 */
.file-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.6rem 1rem;
  background: #f1f8f1;
  border-radius: 8px;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.file-name { font-weight: 600; color: #333; }
.file-size { color: #888; font-size: 0.85rem; }

.btn-sm {
  margin-left: auto;
  padding: 0.3rem 0.8rem;
  border: 1px solid #c8e6c9;
  border-radius: 6px;
  background: white;
  font-size: 0.8rem;
  color: #555;
  cursor: pointer;
}

.btn-sm:hover { border-color: #22c55e; color: #16a34a; }

/* 解析提示 */
.analyzing-tip {
  text-align: center;
  padding: 2rem;
  color: #888;
}

.spinner { animation: spin 1s linear infinite; display: inline-block; }

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* BPM 主显示 */
.bpm-display {
  text-align: center;
  padding: 2rem 1rem;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border-radius: 12px;
}

.bpm-number {
  font-size: 4rem;
  font-weight: 900;
  color: #22c55e;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.bpm-label {
  font-size: 1.2rem;
  color: #16a34a;
  font-weight: 700;
  margin-top: 0.3rem;
}

.bpm-desc {
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.5rem;
}

/* 信息卡片 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.8rem;
  margin-bottom: 1.5rem;
}

.info-card {
  background: #fafafa;
  border-radius: 10px;
  padding: 0.8rem 1rem;
  text-align: center;
}

.card-label { font-size: 0.8rem; color: #888; margin-bottom: 0.3rem; }

.card-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: #2c3e50;
}

.card-value.good { color: #22c55e; }
.card-value.fair { color: #f59e0b; }
.card-value.poor { color: #ef4444; }

.card-sub { font-size: 0.75rem; color: #aaa; }

/* 区块 */
.section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #555;
  margin-bottom: 0.6rem;
}

.canvas-container {
  background: #f8faf8;
  border-radius: 8px;
  padding: 10px;
}

.wave-canvas { display: block; }

.beat-legend {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #888;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.legend-bar {
  width: 20px;
  height: 3px;
  background: rgba(239, 68, 68, 0.8);
  border-radius: 2px;
}

/* 节奏分类标签 */
.genre-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.genre-tag {
  padding: 0.3rem 0.8rem;
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 16px;
  font-size: 0.85rem;
  color: #16a34a;
}

/* TAP 区域 */
.tap-section {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.2rem;
  margin-bottom: 1rem;
}

.tap-desc {
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 1rem;
}

.tap-display {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.tap-btn {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid #22c55e;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  font-size: 1.4rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.1s;
  user-select: none;
}

.tap-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(34, 197, 94, 0.4);
}

.tap-btn:active,
.tap-btn.tap-active {
  transform: scale(0.95);
  background: linear-gradient(135deg, #16a34a, #15803d);
}

.tap-result {
  text-align: center;
}

.tap-bpm {
  font-size: 2.5rem;
  font-weight: 900;
  color: #22c55e;
  display: block;
  font-variant-numeric: tabular-nums;
}

.tap-label {
  font-size: 0.85rem;
  color: #888;
}

.tap-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 1rem;
}

.btn-use {
  padding: 0.5rem 1.2rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.btn-use:hover { opacity: 0.85; }

.btn-clear-tap {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  color: #555;
}

.btn-clear-tap:hover { border-color: #ef4444; color: #ef4444; }

/* 操作按钮 */
.action-bar {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.btn-copy {
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.btn-copy:hover { opacity: 0.85; }

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #22c55e;
  font-weight: 500;
}

.back-link:hover { text-decoration: underline; }

@media (max-width: 640px) {
  .file-bar { flex-direction: column; align-items: flex-start; }
  .btn-sm { margin-left: 0; }
  .bpm-number { font-size: 3rem; }
  .tap-btn { width: 80px; height: 80px; font-size: 1.2rem; }
}
</style>
