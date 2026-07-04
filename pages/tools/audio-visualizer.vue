<template>
  <div class="tool-page">
    <h2>🎧 音频波形可视化工具</h2>
    <p class="subtitle">上传音频文件，显示波形图和频谱图，支持播放/暂停/跳转，鼠标悬浮显示时间点振幅值</p>

    <!-- 上传区域 -->
    <div class="upload-area" v-if="!audioFile" @click="triggerUpload" @dragover.prevent @drop.prevent="handleDrop">
      <input ref="fileInput" type="file" accept="audio/*" hidden @change="handleFileChange" />
      <div class="upload-content">
        <span class="upload-icon">🎶</span>
        <p>点击或拖拽音频文件到这里</p>
        <p class="upload-hint">支持 MP3、WAV、OGG、FLAC、AAC、M4A 等格式</p>
      </div>
    </div>

    <!-- 可视化区域 -->
    <div v-if="audioFile" class="visualizer-layout">
      <!-- 文件信息栏 -->
      <div class="file-bar">
        <span class="file-name">📁 {{ audioFile.name }}</span>
        <span class="file-size">{{ formatSize(audioFile.size) }}</span>
        <button class="btn-sm" @click="resetAudio">重新上传</button>
      </div>

      <!-- 波形图 -->
      <div class="section">
        <div class="section-header">
          <span class="section-title">〰️ 波形图（时域）</span>
          <span class="hover-info" v-if="hoverInfo">{{ hoverInfo }}</span>
        </div>
        <div class="canvas-container" ref="waveContainer">
          <canvas
            ref="waveCanvas"
            class="vis-canvas"
            @mousemove="onWaveMouseMove"
            @mouseleave="hoverInfo = ''"
            @click="onWaveClick"
          />
          <!-- 播放位置指示线 -->
          <div v-if="isPlaying || currentTime > 0" class="play-indicator" :style="{ left: playPosition + '%' }"></div>
        </div>
      </div>

      <!-- 频谱图 -->
      <div class="section">
        <div class="section-header">
          <span class="section-title">📊 频谱图（频域）</span>
        </div>
        <div class="canvas-container">
          <canvas ref="spectrumCanvas" class="vis-canvas" />
        </div>
      </div>

      <!-- 播放控制 -->
      <div class="player-section">
        <div class="time-display">
          <span class="time-current">{{ formatTime(currentTime) }}</span>
          <span class="time-total">/ {{ formatTime(duration) }}</span>
        </div>

        <!-- 进度条 -->
        <div class="progress-bar" ref="progressBar" @click="seekAudio">
          <div class="progress-fill" :style="{ width: (duration > 0 ? (currentTime / duration) * 100 : 0) + '%' }"></div>
        </div>

        <div class="player-controls">
          <button class="ctrl-btn" @click="togglePlay">
            {{ isPlaying ? '⏸️' : '▶️' }}
          </button>
          <button class="ctrl-btn" @click="stopAudio">⏹️</button>
          <div class="volume-group">
            <span class="volume-icon">{{ volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊' }}</span>
            <input type="range" v-model.number="volume" min="0" max="1" step="0.01" class="volume-slider" />
          </div>
          <div class="speed-group">
            <span class="speed-label">倍速</span>
            <select v-model.number="playbackRate" class="speed-select">
              <option :value="0.5">0.5x</option>
              <option :value="0.75">0.75x</option>
              <option :value="1">1.0x</option>
              <option :value="1.25">1.25x</option>
              <option :value="1.5">1.5x</option>
              <option :value="2">2.0x</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '音频波形可视化工具 - 野火小站' })

const fileInput = ref(null)
const waveContainer = ref(null)
const waveCanvas = ref(null)
const spectrumCanvas = ref(null)

const audioFile = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(1)
const playbackRate = ref(1)
const hoverInfo = ref('')
const playPosition = ref(0)

// 音频相关变量
let audioContext = null
let audioBuffer = null
let sourceNode = null
let analyserNode = null
let gainNode = null
let animFrameId = null
let startOffset = 0
let startTime = 0

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

// 加载音频
async function loadAudio(file) {
  audioFile.value = file
  stopAudio()

  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const arrayBuffer = await file.arrayBuffer()
    audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    duration.value = audioBuffer.duration

    nextTick(() => {
      drawWaveform()
      drawStaticSpectrum()
    })
  } catch (err) {
    alert('无法解码此音频文件')
  }
}

// 绘制波形
function drawWaveform() {
  const canvas = waveCanvas.value
  if (!canvas || !audioBuffer) return

  const container = waveContainer.value
  const dpr = window.devicePixelRatio || 1
  const w = container.clientWidth - 20
  const h = 160

  canvas.width = w * dpr
  canvas.height = h * dpr
  canvas.style.width = w + 'px'
  canvas.style.height = h + 'px'

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  const data = audioBuffer.getChannelData(0)
  const step = Math.ceil(data.length / w)
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

  // 波形渐变
  const gradient = ctx.createLinearGradient(0, 0, w, 0)
  gradient.addColorStop(0, '#22c55e')
  gradient.addColorStop(0.5, '#10b981')
  gradient.addColorStop(1, '#059669')

  // 绘制波形（镜像）
  ctx.fillStyle = gradient
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
}

// 绘制静态频谱（无播放时的近似）
function drawStaticSpectrum() {
  const canvas = spectrumCanvas.value
  if (!canvas || !audioBuffer) return

  const container = canvas.parentElement
  const dpr = window.devicePixelRatio || 1
  const w = container.clientWidth - 20
  const h = 120

  canvas.width = w * dpr
  canvas.height = h * dpr
  canvas.style.width = w + 'px'
  canvas.style.height = h + 'px'

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  const data = audioBuffer.getChannelData(0)
  const bars = Math.min(64, Math.floor(w / 6))
  const barWidth = (w - bars * 2) / bars

  // 简单频谱估算
  const barValues = []
  for (let i = 0; i < bars; i++) {
    const start = Math.floor((i / bars) * data.length * 0.5)
    const end = Math.floor(((i + 1) / bars) * data.length * 0.5)
    let sum = 0, count = 0
    for (let j = start; j < end && j < data.length; j++) {
      sum += data[j] * data[j]
      count++
    }
    barValues.push(count > 0 ? Math.sqrt(sum / count) : 0)
  }

  const maxVal = Math.max(...barValues, 0.01)

  ctx.fillStyle = '#f8faf8'
  ctx.fillRect(0, 0, w, h)

  for (let i = 0; i < bars; i++) {
    const normalized = barValues[i] / maxVal
    const barH = normalized * (h - 20)
    const x = i * (barWidth + 2) + 2
    const y = h - 10 - barH

    const gradient = ctx.createLinearGradient(x, y, x, h - 10)
    gradient.addColorStop(0, '#3b82f6')
    gradient.addColorStop(0.5, '#6366f1')
    gradient.addColorStop(1, '#8b5cf6')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.roundRect(x, y, barWidth, barH, [2, 2, 0, 0])
    ctx.fill()
  }
}

// 播放/暂停
function togglePlay() {
  if (!audioBuffer || !audioContext) return

  if (isPlaying.value) {
    // 暂停
    const elapsed = audioContext.currentTime - startTime
    startOffset += elapsed
    if (sourceNode) {
      sourceNode.stop()
      sourceNode = null
    }
    isPlaying.value = false
    cancelAnimationFrame(animFrameId)
  } else {
    // 播放
    sourceNode = audioContext.createBufferSource()
    analyserNode = audioContext.createAnalyser()
    analyserNode.fftSize = 2048

    gainNode = audioContext.createGain()
    gainNode.gain.value = volume.value

    sourceNode.buffer = audioBuffer
    sourceNode.playbackRate.value = playbackRate.value
    sourceNode.connect(analyserNode)
    analyserNode.connect(gainNode)
    gainNode.connect(audioContext.destination)

    sourceNode.onended = () => {
      if (isPlaying.value) {
        isPlaying.value = false
        currentTime.value = 0
        startOffset = 0
        playPosition.value = 0
        cancelAnimationFrame(animFrameId)
      }
    }

    startTime = audioContext.currentTime
    sourceNode.start(0, startOffset)
    isPlaying.value = true
    renderLoop()
  }
}

// 渲染循环
function renderLoop() {
  if (!isPlaying.value) return

  // 更新当前时间
  currentTime.value = startOffset + (audioContext.currentTime - startTime)
  if (duration.value > 0) {
    playPosition.value = (currentTime.value / duration.value) * 100
  }

  // 绘制实时频谱
  drawLiveSpectrum()

  animFrameId = requestAnimationFrame(renderLoop)
}

// 实时频谱
function drawLiveSpectrum() {
  const canvas = spectrumCanvas.value
  if (!canvas || !analyserNode) return

  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const w = canvas.width / dpr
  const h = canvas.height / dpr

  const bufferLength = analyserNode.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)
  analyserNode.getByteFrequencyData(dataArray)

  // 使用 CSS 像素坐标
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  ctx.fillStyle = '#f8faf8'
  ctx.fillRect(0, 0, w, h)

  const bars = Math.min(64, Math.floor(w / 6))
  const barWidth = (w - bars * 2) / bars

  for (let i = 0; i < bars; i++) {
    // 从频域数据中采样
    const idx = Math.floor((i / bars) * bufferLength * 0.6)
    const value = dataArray[idx] / 255
    const barH = value * (h - 20)
    const x = i * (barWidth + 2) + 2
    const y = h - 10 - barH

    const gradient = ctx.createLinearGradient(x, y, x, h - 10)
    gradient.addColorStop(0, '#3b82f6')
    gradient.addColorStop(0.5, '#6366f1')
    gradient.addColorStop(1, '#8b5cf6')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.roundRect(x, y, barWidth, barH, [2, 2, 0, 0])
    ctx.fill()
  }
}

// 停止
function stopAudio() {
  if (sourceNode) {
    try { sourceNode.stop() } catch {}
    sourceNode = null
  }
  isPlaying.value = false
  currentTime.value = 0
  startOffset = 0
  playPosition.value = 0
  cancelAnimationFrame(animFrameId)
}

// 跳转
function seekAudio(e) {
  if (!audioBuffer) return
  const bar = e.currentTarget
  const rect = bar.getBoundingClientRect()
  const ratio = (e.clientX - rect.left) / rect.width
  const seekTime = ratio * duration.value

  const wasPlaying = isPlaying.value
  if (isPlaying.value) {
    if (sourceNode) {
      try { sourceNode.stop() } catch {}
      sourceNode = null
    }
    cancelAnimationFrame(animFrameId)
  }

  startOffset = seekTime
  currentTime.value = seekTime
  playPosition.value = ratio * 100

  if (wasPlaying) {
    togglePlay()
  }
}

// 波形鼠标悬浮
function onWaveMouseMove(e) {
  const canvas = waveCanvas.value
  if (!canvas || !audioBuffer) return

  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const ratio = x / rect.width
  const time = ratio * duration.value

  // 获取该时间点的振幅
  const data = audioBuffer.getChannelData(0)
  const sampleIdx = Math.floor(ratio * data.length)
  const amplitude = data[sampleIdx] || 0

  hoverInfo.value = `${formatTime(time)} · 振幅: ${(amplitude * 100).toFixed(1)}%`
}

// 波形点击跳转
function onWaveClick(e) {
  const canvas = waveCanvas.value
  if (!canvas || !audioBuffer) return

  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const ratio = x / rect.width

  const wasPlaying = isPlaying.value
  if (isPlaying.value) {
    if (sourceNode) {
      try { sourceNode.stop() } catch {}
      sourceNode = null
    }
    cancelAnimationFrame(animFrameId)
  }

  startOffset = ratio * duration.value
  currentTime.value = startOffset
  playPosition.value = ratio * 100

  if (wasPlaying) togglePlay()
}

// 音量变化
watch(volume, (val) => {
  if (gainNode) gainNode.gain.value = val
})

// 播放速率变化
watch(playbackRate, (val) => {
  if (sourceNode) sourceNode.playbackRate.value = val
})

// 格式化时间
function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// 格式化大小
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

// 重置
function resetAudio() {
  stopAudio()
  audioFile.value = null
  audioBuffer = null
  if (audioContext) {
    audioContext.close()
    audioContext = null
  }
}

// 窗口调整
function onResize() {
  if (audioBuffer) {
    drawWaveform()
    drawStaticSpectrum()
  }
}

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  stopAudio()
  if (audioContext) audioContext.close()
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

/* 上传区域 */
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

/* 可视化布局 */
.visualizer-layout {
  background: #fff;
  border-radius: 12px;
  padding: 1.2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
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

.file-name { font-weight: 600; color: #333; font-size: 0.9rem; }
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

/* 区块 */
.section {
  margin-bottom: 1rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.section-title {
  font-size: 0.95rem;
  color: #555;
  font-weight: 600;
}

.hover-info {
  font-size: 0.8rem;
  color: #22c55e;
  font-family: 'Courier New', monospace;
  font-weight: 600;
}

.canvas-container {
  background: #f8faf8;
  border-radius: 8px;
  padding: 10px;
  position: relative;
}

.vis-canvas {
  display: block;
  border-radius: 4px;
}

.play-indicator {
  position: absolute;
  top: 10px;
  bottom: 10px;
  width: 2px;
  background: #ef4444;
  pointer-events: none;
  z-index: 1;
}

/* 播放器 */
.player-section {
  padding-top: 0.5rem;
}

.time-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: 'Courier New', monospace;
  margin-bottom: 0.8rem;
}

.time-current {
  font-size: 1.1rem;
  font-weight: 700;
  color: #22c55e;
}

.time-total {
  font-size: 0.9rem;
  color: #aaa;
}

.progress-bar {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  cursor: pointer;
  margin-bottom: 0.8rem;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #10b981);
  border-radius: 3px;
  transition: width 0.1s linear;
}

.player-controls {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.ctrl-btn {
  width: 40px;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 50%;
  background: #fff;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.ctrl-btn:hover {
  border-color: #22c55e;
  background: #f0fdf4;
}

.volume-group {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.volume-icon { font-size: 1rem; }

.volume-slider {
  width: 80px;
  height: 4px;
  accent-color: #22c55e;
  cursor: pointer;
}

.speed-group {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-left: auto;
}

.speed-label {
  font-size: 0.8rem;
  color: #888;
}

.speed-select {
  padding: 0.3rem 0.4rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.8rem;
  color: #555;
  background: #fff;
  cursor: pointer;
}

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
  .player-controls { justify-content: center; }
  .speed-group { margin-left: 0; }
}
</style>
