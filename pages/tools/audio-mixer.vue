<template>
  <div class="tool-page">
    <h2>🎵 多轨音频混合器</h2>
    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>

    <p class="subtitle">上传多个音频文件，独立调节音量和声像，混合后导出 WAV 文件。纯前端实现。</p>

    <!-- 上传区域 -->
    <div class="upload-area" :class="{ dragging: isDragging }"
      @click="triggerUpload" @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false" @drop.prevent="handleDrop">
      <input ref="fileInput" type="file" accept="audio/*" multiple @change="handleFiles" hidden />
      <div class="upload-content">
        <span class="upload-icon">📁</span>
        <p>点击或拖拽上传音频文件（支持多个）</p>
        <p class="upload-hint">支持 MP3 / WAV / OGG / AAC / FLAC 等格式</p>
      </div>
    </div>

    <!-- 播放控制 -->
    <div v-if="tracks.length" class="playback-bar">
      <button class="btn-play" @click="togglePlay">{{ isPlaying ? '⏸ 暂停' : '▶ 播放' }}</button>
      <button class="btn-stop" @click="stopPlay" :disabled="!isPlaying">⏹ 停止</button>
      <span class="time-display">{{ formatTime(currentTime) }} / {{ formatTime(maxDuration) }}</span>
      <div class="progress-bar-wrap">
        <div class="progress-bar" :style="{ width: progressPercent + '%' }"></div>
      </div>
    </div>

    <!-- 轨道列表 -->
    <div v-if="tracks.length" class="tracks">
      <div v-for="(track, idx) in tracks" :key="track.id" class="track-card">
        <div class="track-header">
          <span class="track-drag" title="拖拽排序">⠿</span>
          <span class="track-name" :title="track.name">{{ track.name }}</span>
          <span class="track-info">{{ track.duration.toFixed(1) }}s</span>
          <button class="btn-remove" @click="removeTrack(idx)" title="移除">×</button>
        </div>
        <div class="waveform-box">
          <canvas :ref="el => setCanvas(el, idx)" class="waveform-canvas"></canvas>
        </div>
        <div class="track-controls">
          <div class="control-item">
            <label>音量</label>
            <input type="range" v-model.number="track.volume" min="0" max="1.5" step="0.01" />
            <span class="control-val">{{ (track.volume * 100).toFixed(0) }}%</span>
          </div>
          <div class="control-item">
            <label>声像</label>
            <input type="range" v-model.number="track.pan" min="-1" max="1" step="0.01" />
            <span class="control-val">{{ track.pan < -0.05 ? 'L' + Math.abs(Math.round(track.pan * 100)) : track.pan > 0.05 ? 'R' + Math.round(track.pan * 100) : 'C' }}</span>
          </div>
          <div class="control-item">
            <label>静音</label>
            <button :class="['btn-mute', { active: track.muted }]" @click="track.muted = !track.muted">{{ track.muted ? '🔇' : '🔊' }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 导出 -->
    <div v-if="tracks.length" class="export-bar">
      <button class="btn-export" @click="exportMix" :disabled="isExporting">
        {{ isExporting ? '⏳ 混合导出中...' : '📥 导出 WAV' }}
      </button>
      <span v-if="exportProgress" class="export-progress">{{ exportProgress }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

useHead({ title: '多轨音频混合器 - 野火小站' })

const fileInput = ref(null)
const isDragging = ref(false)
const tracks = ref([])
const isPlaying = ref(false)
const isExporting = ref(false)
const exportProgress = ref('')
const currentTime = ref(0)
let audioCtx = null
let sources = []
let startTime = 0
let timerInterval = null
const canvasRefs = []

const triggerUpload = () => fileInput.value?.click()

const handleDrop = (e) => {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files?.length) loadAudioFiles(files)
}

const handleFiles = (e) => {
  const files = e.target?.files
  if (files?.length) loadAudioFiles(files)
}

const loadAudioFiles = async (files) => {
  if (!audioCtx) audioCtx = new AudioContext()

  for (const file of files) {
    try {
      const buffer = await file.arrayBuffer()
      const audioBuffer = await audioCtx.decodeAudioData(buffer)
      const id = Date.now() + Math.random()
      tracks.value.push({
        id,
        name: file.name.replace(/\.[^.]+$/, ''),
        buffer: audioBuffer,
        duration: audioBuffer.duration,
        volume: 1,
        pan: 0,
        muted: false,
        waveformData: extractWaveform(audioBuffer, 300),
      })
      // 等DOM更新后绘制波形
      await new Promise(r => setTimeout(r, 50))
      drawWaveform(tracks.value.length - 1)
    } catch (err) {
      console.warn('无法解码音频:', file.name, err)
    }
  }
}

const extractWaveform = (buffer, samples) => {
  const data = buffer.getChannelData(0)
  const blockSize = Math.floor(data.length / samples)
  const result = []
  for (let i = 0; i < samples; i++) {
    let sum = 0
    const start = i * blockSize
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(data[start + j] || 0)
    }
    result.push(sum / blockSize)
  }
  return result
}

const setCanvas = (el, idx) => {
  if (el) canvasRefs[idx] = el
}

const drawWaveform = (idx) => {
  const track = tracks.value[idx]
  const canvas = canvasRefs[idx]
  if (!track || !canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)
  const w = rect.width
  const h = rect.height
  ctx.clearRect(0, 0, w, h)

  const data = track.waveformData
  if (!data || !data.length) return

  const max = Math.max(...data) || 1
  ctx.fillStyle = track.muted ? '#9ca3af' : '#22c55e'
  const barWidth = Math.max(1, w / data.length - 0.5)
  for (let i = 0; i < data.length; i++) {
    const barH = (data[i] / max) * h * 0.85
    const x = (i / data.length) * w
    ctx.fillRect(x, (h - barH) / 2, barWidth, barH)
  }
}

const maxDuration = computed(() => {
  if (!tracks.value.length) return 0
  return Math.max(...tracks.value.map(t => t.duration))
})

const progressPercent = computed(() => {
  if (!maxDuration.value) return 0
  return Math.min(100, (currentTime.value / maxDuration.value) * 100)
})

const togglePlay = () => {
  if (isPlaying.value) {
    pausePlay()
  } else {
    startPlay()
  }
}

const startPlay = () => {
  if (!audioCtx) audioCtx = new AudioContext()
  if (audioCtx.state === 'suspended') audioCtx.resume()
  stopSources()

  startTime = audioCtx.currentTime - currentTime.value
  sources = []

  for (const track of tracks.value) {
    const source = audioCtx.createBufferSource()
    source.buffer = track.buffer

    const gainNode = audioCtx.createGain()
    gainNode.gain.value = track.muted ? 0 : track.volume

    const panNode = audioCtx.createStereoPanner()
    panNode.pan.value = track.pan

    source.connect(gainNode).connect(panNode).connect(audioCtx.destination)
    source.start(0, currentTime.value)
    sources.push({ source, gainNode, track })

    source.onended = () => {
      if (currentTime.value >= maxDuration.value - 0.1) {
        stopPlay()
      }
    }
  }

  isPlaying.value = true
  timerInterval = setInterval(() => {
    currentTime.value = audioCtx.currentTime - startTime
    if (currentTime.value >= maxDuration.value) {
      stopPlay()
    }
  }, 50)
}

const pausePlay = () => {
  stopSources()
  isPlaying.value = false
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const stopPlay = () => {
  stopSources()
  currentTime.value = 0
  isPlaying.value = false
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const stopSources = () => {
  for (const { source } of sources) {
    try { source.stop() } catch {}
  }
  sources = []
}

const removeTrack = (idx) => {
  tracks.value.splice(idx, 1)
  canvasRefs.splice(idx, 1)
}

const exportMix = async () => {
  if (!tracks.value.length) return
  isExporting.value = true
  exportProgress.value = '准备中...'

  try {
    const duration = maxDuration.value
    const sampleRate = audioCtx ? audioCtx.sampleRate : 44100
    const offline = new OfflineAudioContext(2, Math.ceil(duration * sampleRate), sampleRate)

    for (const track of tracks.value) {
      const source = offline.createBufferSource()
      source.buffer = track.buffer

      const gain = offline.createGain()
      gain.gain.value = track.muted ? 0 : track.volume

      const pan = offline.createStereoPanner()
      pan.pan.value = track.pan

      source.connect(gain).connect(pan).connect(offline.destination)
      source.start(0)
    }

    exportProgress.value = '渲染中...'

    const rendered = await offline.startRendering()
    exportProgress.value = '编码WAV...'
    const wav = encodeWav(rendered)
    const blob = new Blob([wav], { type: 'audio/wav' })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mix_' + new Date().toISOString().slice(0, 10) + '.wav'
    a.click()
    URL.revokeObjectURL(url)

    exportProgress.value = '✅ 导出完成'
  } catch (err) {
    console.error('导出失败:', err)
    exportProgress.value = '❌ 导出失败: ' + err.message
  } finally {
    isExporting.value = false
    setTimeout(() => { exportProgress.value = '' }, 3000)
  }
}

const encodeWav = (audioBuffer) => {
  const numChannels = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const format = 1 // PCM
  const bitsPerSample = 16

  const channels = []
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(audioBuffer.getChannelData(ch))
  }
  const numSamples = audioBuffer.length
  const dataSize = numSamples * numChannels * (bitsPerSample / 8)
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  // WAV header
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, format, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true)
  view.setUint16(32, numChannels * (bitsPerSample / 8), true)
  view.setUint16(34, bitsPerSample, true)
  writeString(view, 36, 'data')
  view.setUint32(40, dataSize, true)

  let offset = 44
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i] || 0))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
      offset += 2
    }
  }

  return buffer
}

const writeString = (view, offset, str) => {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}

const formatTime = (s) => {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

onUnmounted(() => {
  stopSources()
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<style scoped>
.tool-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem;
}
.tool-page h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}
.back-link {
  display: inline-block;
  margin-bottom: 1rem;
  color: #6b7280;
  text-decoration: none;
  font-size: 0.875rem;
}
.subtitle {
  color: #6b7280;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}
.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 0.75rem;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 1.5rem;
  background: #f9fafb;
}
.upload-area:hover, .upload-area.dragging {
  border-color: #22c55e;
  background: #f0fdf4;
}
.upload-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.5rem;
}
.upload-hint {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

.playback-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #1f2937;
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.btn-play, .btn-stop {
  padding: 0.4rem 1rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
}
.btn-play {
  background: #22c55e;
  color: white;
}
.btn-play:hover { background: #16a34a; }
.btn-stop {
  background: #4b5563;
  color: white;
}
.btn-stop:disabled { opacity: 0.4; cursor: not-allowed; }
.time-display {
  color: #9ca3af;
  font-size: 0.8rem;
  font-family: monospace;
  min-width: 80px;
}
.progress-bar-wrap {
  flex: 1;
  height: 6px;
  background: #374151;
  border-radius: 3px;
  min-width: 80px;
}
.progress-bar {
  height: 100%;
  background: #22c55e;
  border-radius: 3px;
  transition: width 0.1s linear;
}

.tracks {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.track-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1rem;
}
.track-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.track-drag {
  cursor: grab;
  color: #9ca3af;
  font-size: 1.1rem;
}
.track-name {
  flex: 1;
  font-weight: 500;
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.track-info {
  color: #9ca3af;
  font-size: 0.75rem;
}
.btn-remove {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0 0.25rem;
  line-height: 1;
}
.waveform-box {
  background: #f9fafb;
  border-radius: 0.5rem;
  overflow: hidden;
  margin-bottom: 0.75rem;
}
.waveform-canvas {
  width: 100%;
  height: 60px;
  display: block;
}
.track-controls {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}
.control-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 140px;
}
.control-item label {
  font-size: 0.75rem;
  color: #6b7280;
  min-width: 36px;
}
.control-item input[type="range"] {
  flex: 1;
  max-width: 120px;
  height: 6px;
}
.control-val {
  font-size: 0.75rem;
  color: #9ca3af;
  min-width: 32px;
  text-align: right;
  font-family: monospace;
}
.btn-mute {
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  font-size: 1rem;
}
.btn-mute.active {
  background: #fecaca;
  border-color: #ef4444;
}

.export-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 0.75rem;
}
.btn-export {
  padding: 0.5rem 1.25rem;
  background: #22c55e;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
}
.btn-export:hover { background: #16a34a; }
.btn-export:disabled { opacity: 0.6; cursor: not-allowed; }
.export-progress {
  font-size: 0.85rem;
  color: #16a34a;
}

@media (max-width: 640px) {
  .tool-page { padding: 1rem; }
  .playback-bar { padding: 0.5rem 0.75rem; gap: 0.5rem; }
  .track-controls { gap: 0.75rem; }
  .control-item { min-width: 100%; }
}
</style>
