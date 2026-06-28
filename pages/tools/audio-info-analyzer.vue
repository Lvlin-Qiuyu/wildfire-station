<template>
  <div class="tool-page">
    <h2>🎵 多格式音频文件信息分析器</h2>
    <p class="subtitle">上传 MP3/WAV/FLAC/AAC 等音频文件，实时显示比特率、时长、声道、编码格式等详细信息</p>

    <!-- 上传区域 -->
    <div class="upload-area" v-if="!audioFile" @click="triggerUpload" @dragover.prevent @drop.prevent="handleDrop">
      <input ref="fileInput" type="file" accept="audio/*" hidden @change="handleFileChange" />
      <div class="upload-content">
        <span class="upload-icon">🎶</span>
        <p>点击或拖拽音频文件到这里</p>
        <p class="upload-hint">支持 MP3、WAV、FLAC、OGG、AAC、M4A、WMA、AIFF、Opus、AMR 等 15+ 种格式</p>
      </div>
    </div>

    <!-- 音频信息展示 -->
    <div v-if="audioFile" class="info-panel">
      <!-- 文件概览 -->
      <div class="file-bar">
        <span class="file-name">📁 {{ audioFile.name }}</span>
        <span class="file-info">{{ formatFileSize(audioFile.size) }}</span>
        <button class="btn-sm" @click="resetAudio">重新上传</button>
      </div>

      <!-- 解码中提示 -->
      <div v-if="decoding" class="decoding-tip">
        <span class="spinner">⏳</span> 正在解码音频文件...
      </div>

      <!-- 基本信息卡片 -->
      <div v-if="!decoding && audioInfo" class="info-grid">
        <div class="info-card">
          <div class="card-label">⏱️ 时长</div>
          <div class="card-value">{{ formatDuration(audioInfo.duration) }}</div>
          <div class="card-sub">{{ audioInfo.duration.toFixed(3) }} 秒</div>
        </div>
        <div class="info-card">
          <div class="card-label">🔊 声道数</div>
          <div class="card-value">{{ audioInfo.channels }}</div>
          <div class="card-sub">{{ audioInfo.channels === 1 ? '单声道 (Mono)' : audioInfo.channels === 2 ? '立体声 (Stereo)' : `${audioInfo.channels} 声道` }}</div>
        </div>
        <div class="info-card">
          <div class="card-label">📻 采样率</div>
          <div class="card-value">{{ formatNumber(audioInfo.sampleRate) }}</div>
          <div class="card-sub">Hz</div>
        </div>
        <div class="info-card">
          <div class="card-label">📊 比特率（估算）</div>
          <div class="card-value">{{ formatBitrate(audioInfo.bitrate) }}</div>
          <div class="card-sub">{{ formatFileSize(audioInfo.bitrate / 8) }}/秒</div>
        </div>
        <div class="info-card">
          <div class="card-label">📐 总采样数</div>
          <div class="card-value">{{ formatNumber(audioInfo.totalSamples) }}</div>
          <div class="card-sub">samples</div>
        </div>
        <div class="info-card">
          <div class="card-label">💿 格式详情</div>
          <div class="card-value">{{ audioInfo.formatType || '未知' }}</div>
          <div class="card-sub">MIME: {{ audioInfo.mimeType }}</div>
        </div>
      </div>

      <!-- 频谱可视化 -->
      <div class="section-title">📈 频谱概览</div>
      <div class="canvas-area">
        <canvas ref="spectrumCanvas" class="spectrum-canvas"></canvas>
      </div>

      <!-- 波形预览 -->
      <div class="section-title">〰️ 波形预览</div>
      <div class="canvas-area">
        <canvas ref="waveCanvas" class="wave-canvas"></canvas>
      </div>

      <!-- 详细参数表 -->
      <div class="section-title">📋 完整参数</div>
      <div class="detail-table-wrapper">
        <table class="detail-table">
          <tbody>
            <tr>
              <td class="td-label">文件名</td>
              <td>{{ audioFile.name }}</td>
            </tr>
            <tr>
              <td class="td-label">文件大小</td>
              <td>{{ formatFileSize(audioFile.size) }}（{{ audioFile.size }} 字节）</td>
            </tr>
            <tr>
              <td class="td-label">MIME 类型</td>
              <td>{{ audioInfo.mimeType }}</td>
            </tr>
            <tr>
              <td class="td-label">采样率</td>
              <td>{{ formatNumber(audioInfo.sampleRate) }} Hz</td>
            </tr>
            <tr>
              <td class="td-label">声道数</td>
              <td>{{ audioInfo.channels }}（{{ audioInfo.channels === 1 ? 'Mono' : 'Stereo' }}）</td>
            </tr>
            <tr>
              <td class="td-label">时长</td>
              <td>{{ formatDuration(audioInfo.duration) }}（{{ audioInfo.duration.toFixed(6) }} 秒）</td>
            </tr>
            <tr>
              <td class="td-label">比特率（估算）</td>
              <td>{{ formatBitrate(audioInfo.bitrate) }}</td>
            </tr>
            <tr>
              <td class="td-label">总采样数</td>
              <td>{{ formatNumber(audioInfo.totalSamples) }}</td>
            </tr>
            <tr>
              <td class="td-label">每个声道采样数</td>
              <td>{{ formatNumber(audioInfo.samplesPerChannel) }}</td>
            </tr>
            <tr>
              <td class="td-label">格式类型</td>
              <td>{{ audioInfo.formatType || '浏览器未提供' }}</td>
            </tr>
            <tr>
              <td class="td-label">音质评估</td>
              <td>
                <span class="quality-badge" :class="audioInfo.qualityClass">{{ audioInfo.quality }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 操作按钮 -->
      <div class="action-bar">
        <button class="btn-copy" @click="copyInfo">📋 复制信息</button>
        <button class="btn-copy btn-json" @click="copyJson">📄 复制 JSON</button>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '音频信息分析 - 野火小站' })

const fileInput = ref(null)
const spectrumCanvas = ref(null)
const waveCanvas = ref(null)

const audioFile = ref(null)
const decoding = ref(false)
const audioInfo = ref(null)

// 触发文件上传
function triggerUpload() {
  fileInput.value?.click()
}

// 处理文件选择
function handleFileChange(e) {
  const file = e.target.files?.[0]
  if (file) loadAudio(file)
}

// 处理拖拽
function handleDrop(e) {
  const file = e.dataTransfer.files?.[0]
  if (file && file.type.startsWith('audio/')) loadAudio(file)
}

// 加载并解码音频
async function loadAudio(file) {
  audioFile.value = file
  audioInfo.value = null
  decoding.value = true

  let audioContext = null
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const arrayBuffer = await file.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

    // 计算比特率
    const bitrate = (file.size * 8) / audioBuffer.duration

    // 音质评估
    const { quality, qualityClass } = assessQuality(bitrate, audioBuffer.sampleRate, audioBuffer.numberOfChannels)

    audioInfo.value = {
      duration: audioBuffer.duration,
      channels: audioBuffer.numberOfChannels,
      sampleRate: audioBuffer.sampleRate,
      totalSamples: audioBuffer.length * audioBuffer.numberOfChannels,
      samplesPerChannel: audioBuffer.length,
      bitrate,
      mimeType: file.type || '未知',
      formatType: getFormatName(file.name),
      quality,
      qualityClass,
    }

    // 绘制频谱和波形
    await nextTick()
    drawSpectrum(audioBuffer)
    drawWaveform(audioBuffer)
  } catch (err) {
    alert('无法解码此音频文件，请确认文件格式是否受支持')
  } finally {
    decoding.value = false
    if (audioContext) {
      audioContext.close()
    }
  }
}

// 根据文件扩展名推断格式
function getFormatName(filename) {
  const ext = filename.split('.').pop()?.toLowerCase()
  const map = {
    mp3: 'MPEG-1 Audio Layer III',
    wav: 'WAVE (PCM)',
    flac: 'FLAC (Free Lossless Audio Codec)',
    ogg: 'Ogg Vorbis',
    opus: 'Opus',
    aac: 'Advanced Audio Coding',
    m4a: 'MPEG-4 Audio (AAC)',
    wma: 'Windows Media Audio',
    aiff: 'Audio Interchange File Format',
    alac: 'Apple Lossless Audio Codec',
    amr: 'Adaptive Multi-Rate',
    mid: 'MIDI',
    midi: 'MIDI',
    mp4: 'MPEG-4 Audio',
    webm: 'WebM Audio',
    ape: 'Monkey\'s Audio',
    tak: 'Tom\'s Lossless Audio Kompressor',
  }
  return map[ext] || ext?.toUpperCase() || '未知'
}

// 音质评估
function assessQuality(bitrate, sampleRate, channels) {
  if (bitrate >= 320000) return { quality: '极佳（无损/高码率）', qualityClass: 'excellent' }
  if (bitrate >= 256000) return { quality: '优秀（高码率有损）', qualityClass: 'great' }
  if (bitrate >= 192000) return { quality: '良好（标准码率）', qualityClass: 'good' }
  if (bitrate >= 128000) return { quality: '一般（压缩明显）', qualityClass: 'fair' }
  return { quality: '较低（高度压缩）', qualityClass: 'poor' }
}

// 绘制频谱概览
function drawSpectrum(buffer) {
  const canvas = spectrumCanvas.value
  if (!canvas) return

  const dpr = window.devicePixelRatio || 1
  const containerWidth = canvas.parentElement.clientWidth - 40
  const h = 180

  canvas.width = containerWidth * dpr
  canvas.height = h * dpr
  canvas.style.width = containerWidth + 'px'
  canvas.style.height = h + 'px'

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  // 获取第一声道数据
  const data = buffer.getChannelData(0)
  const fftSize = 2048
  const bars = Math.min(64, Math.floor(containerWidth / 6))

  // 简单频谱计算：将数据分段取 RMS
  const barWidth = (containerWidth - bars * 2) / bars
  const barValues = []

  for (let i = 0; i < bars; i++) {
    const start = Math.floor((i / bars) * data.length * 0.5) // 只取前半段（有效频谱）
    const end = Math.floor(((i + 1) / bars) * data.length * 0.5)
    let sum = 0
    const count = end - start
    if (count > 0) {
      for (let j = start; j < end; j++) {
        sum += data[j] * data[j]
      }
      barValues.push(Math.sqrt(sum / count))
    } else {
      barValues.push(0)
    }
  }

  // 归一化
  const maxVal = Math.max(...barValues, 0.01)

  // 背景
  ctx.fillStyle = '#f8faf8'
  ctx.fillRect(0, 0, containerWidth, h)

  // 绘制频谱柱
  for (let i = 0; i < bars; i++) {
    const normalized = barValues[i] / maxVal
    const barH = normalized * (h - 30)
    const x = i * (barWidth + 2) + 2
    const y = h - 15 - barH

    // 渐变色
    const gradient = ctx.createLinearGradient(x, y, x, h - 15)
    gradient.addColorStop(0, '#22c55e')
    gradient.addColorStop(0.5, '#10b981')
    gradient.addColorStop(1, '#059669')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.roundRect(x, y, barWidth, barH, [3, 3, 0, 0])
    ctx.fill()
  }
}

// 绘制波形预览
function drawWaveform(buffer) {
  const canvas = waveCanvas.value
  if (!canvas) return

  const dpr = window.devicePixelRatio || 1
  const containerWidth = canvas.parentElement.clientWidth - 40
  const h = 120

  canvas.width = containerWidth * dpr
  canvas.height = h * dpr
  canvas.style.width = containerWidth + 'px'
  canvas.style.height = h + 'px'

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  const data = buffer.getChannelData(0)
  const samples = containerWidth
  const blockSize = Math.floor(data.length / samples)
  const filtered = []

  for (let i = 0; i < samples; i++) {
    let sum = 0
    const start = i * blockSize
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(data[start + j])
    }
    filtered.push(sum / blockSize)
  }

  const maxVal = Math.max(...filtered, 0.01)
  const centerY = h / 2

  // 背景
  ctx.fillStyle = '#f8faf8'
  ctx.fillRect(0, 0, containerWidth, h)

  // 中线
  ctx.strokeStyle = '#e0e0e0'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, centerY)
  ctx.lineTo(containerWidth, centerY)
  ctx.stroke()

  // 波形
  const gradient = ctx.createLinearGradient(0, 0, containerWidth, 0)
  gradient.addColorStop(0, '#22c55e')
  gradient.addColorStop(0.5, '#10b981')
  gradient.addColorStop(1, '#059669')

  ctx.fillStyle = gradient
  for (let i = 0; i < filtered.length; i++) {
    const amp = (filtered[i] / maxVal) * (h / 2 - 6)
    ctx.fillRect(i, centerY - amp, 1, amp * 2)
  }
}

// 格式化时长
function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 1000)
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

// 格式化数字（千分位）
function formatNumber(num) {
  return num.toLocaleString('zh-CN')
}

// 格式化比特率
function formatBitrate(bps) {
  if (bps >= 1000000) return (bps / 1000000).toFixed(2) + ' Mbps'
  if (bps >= 1000) return (bps / 1000).toFixed(1) + ' kbps'
  return bps.toFixed(0) + ' bps'
}

// 复制纯文本信息
function copyInfo() {
  if (!audioInfo.value || !audioFile.value) return
  const info = audioInfo.value
  const text = [
    `📁 文件名：${audioFile.value.name}`,
    `📊 文件大小：${formatFileSize(audioFile.value.size)}`,
    `⏱️ 时长：${formatDuration(info.duration)}`,
    `🔊 声道数：${info.channels}（${info.channels === 1 ? 'Mono' : 'Stereo'}）`,
    `📻 采样率：${formatNumber(info.sampleRate)} Hz`,
    `📉 比特率：${formatBitrate(info.bitrate)}`,
    `📐 总采样数：${formatNumber(info.totalSamples)}`,
    `💿 格式：${info.formatType}`,
    `🎯 音质：${info.quality}`,
  ].join('\n')

  navigator.clipboard.writeText(text).then(() => {
    alert('已复制到剪贴板')
  })
}

// 复制 JSON 信息
function copyJson() {
  if (!audioInfo.value || !audioFile.value) return
  const json = JSON.stringify({
    filename: audioFile.value.name,
    fileSize: audioFile.value.size,
    fileSizeFormatted: formatFileSize(audioFile.value.size),
    duration: audioInfo.value.duration,
    durationFormatted: formatDuration(audioInfo.value.duration),
    channels: audioInfo.value.channels,
    sampleRate: audioInfo.value.sampleRate,
    bitrate: Math.round(audioInfo.value.bitrate),
    bitrateFormatted: formatBitrate(audioInfo.value.bitrate),
    totalSamples: audioInfo.value.totalSamples,
    samplesPerChannel: audioInfo.value.samplesPerChannel,
    mimeType: audioInfo.value.mimeType,
    format: audioInfo.value.formatType,
    quality: audioInfo.value.quality,
  }, null, 2)

  navigator.clipboard.writeText(json).then(() => {
    alert('已复制 JSON 到剪贴板')
  })
}

// 重置
function resetAudio() {
  audioFile.value = null
  audioInfo.value = null
  decoding.value = false
}

// 窗口调整时重绘
onMounted(() => {
  window.addEventListener('resize', () => {
    // 简单处理：不自动重绘（需要重新上传）
  })
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

/* 上传区域 */
.upload-area {
  border: 2px dashed #c8e6c9;
  border-radius: 16px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  background: #f1f8f1;
  transition: all 0.2s;
  margin-bottom: 1.5rem;
}

.upload-area:hover {
  border-color: #22c55e;
  background: #e8f5e9;
}

.upload-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.5rem;
}

.upload-area p {
  color: #555;
  margin-bottom: 0.3rem;
}

.upload-hint {
  color: #aaa !important;
  font-size: 0.85rem;
}

/* 文件信息栏 */
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

.file-name {
  font-weight: 600;
  color: #333;
}

.file-info {
  color: #888;
  font-size: 0.85rem;
}

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

.btn-sm:hover {
  border-color: #22c55e;
  color: #16a34a;
}

/* 解码提示 */
.decoding-tip {
  text-align: center;
  padding: 2rem;
  color: #888;
  font-size: 1rem;
}

.spinner {
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 信息卡片网格 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.info-card {
  background: white;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 1rem 1.2rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.card-label {
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 0.4rem;
}

.card-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.2rem;
  font-variant-numeric: tabular-nums;
}

.card-sub {
  font-size: 0.8rem;
  color: #aaa;
}

/* 章节标题 */
.section-title {
  font-size: 1.1rem;
  color: #555;
  margin: 1.5rem 0 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

/* Canvas 区域 */
.canvas-area {
  background: #fafafa;
  border-radius: 12px;
  border: 1px solid #eee;
  padding: 20px;
  margin-bottom: 1rem;
}

.spectrum-canvas,
.wave-canvas {
  display: block;
}

/* 详细参数表 */
.detail-table-wrapper {
  overflow-x: auto;
  margin-bottom: 1.5rem;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #eee;
}

.detail-table td {
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
  border-bottom: 1px solid #f5f5f5;
}

.td-label {
  color: #888;
  font-weight: 500;
  width: 150px;
  background: #fafafa;
}

/* 音质标签 */
.quality-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.quality-badge.excellent {
  background: #dcfce7;
  color: #16a34a;
}

.quality-badge.great {
  background: #d1fae5;
  color: #059669;
}

.quality-badge.good {
  background: #fef9c3;
  color: #ca8a04;
}

.quality-badge.fair {
  background: #ffedd5;
  color: #ea580c;
}

.quality-badge.poor {
  background: #fee2e2;
  color: #dc2626;
}

/* 操作按钮 */
.action-bar {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

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

.btn-copy:hover {
  opacity: 0.85;
}

.btn-json {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
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
  .info-grid {
    grid-template-columns: 1fr 1fr;
  }
  .file-bar {
    flex-direction: column;
    align-items: flex-start;
  }
  .btn-sm {
    margin-left: 0;
  }
}
</style>
