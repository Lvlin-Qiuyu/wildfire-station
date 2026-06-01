<template>
  <div class="tool-page">
    <h2>🎵 音频剪辑工具</h2>
    <p class="subtitle">上传音频，可视化波形，精确裁剪区间并导出</p>

    <!-- Upload -->
    <div class="upload-area" v-if="!audioFile" @click="triggerUpload" @dragover.prevent @drop.prevent="handleDrop">
      <input ref="fileInput" type="file" accept="audio/*" hidden @change="handleFileChange" />
      <div class="upload-content">
        <span class="upload-icon">🎶</span>
        <p>点击或拖拽音频文件到这里</p>
        <p class="upload-hint">支持 MP3, WAV, OGG, M4A, FLAC 等格式</p>
      </div>
    </div>

    <!-- Editor -->
    <div v-if="audioFile" class="editor">
      <!-- File info bar -->
      <div class="file-bar">
        <span class="file-name">📁 {{ audioFile.name }}</span>
        <span class="file-info">{{ formatTime(audioDuration) }} · {{ (audioFile.size / 1024).toFixed(1) }} KB</span>
        <button class="btn-sm" @click="resetAudio">重新上传</button>
      </div>

      <!-- Waveform canvas -->
      <div class="waveform-wrapper">
        <canvas ref="waveCanvas" class="waveform-canvas"></canvas>
        <!-- Selection overlay -->
        <div
          class="selection-region"
          :style="selectionStyle"
        ></div>
        <!-- Playhead -->
        <div class="playhead" :style="{ left: playheadPos + '%' }"></div>
      </div>

      <!-- Time labels -->
      <div class="time-axis">
        <span>{{ formatTime(0) }}</span>
        <span>{{ formatTime(audioDuration / 2) }}</span>
        <span>{{ formatTime(audioDuration) }}</span>
      </div>

      <!-- Selection inputs -->
      <div class="selection-controls">
        <div class="control-group">
          <label>起始时间</label>
          <div class="time-input">
            <input type="number" v-model.number="startMin" min="0" :max="Math.floor(audioDuration/60)" @change="clampSelection" />
            <span>:</span>
            <input type="number" v-model.number="startSec" min="0" :max="59" @change="clampSelection" />
            <span>.<input type="number" v-model.number="startMs" min="0" :max="999" step="10" @change="clampSelection" style="width:52px" /></span>
          </div>
        </div>
        <div class="control-group">
          <label>结束时间</label>
          <div class="time-input">
            <input type="number" v-model.number="endMin" min="0" :max="Math.floor(audioDuration/60)" @change="clampSelection" />
            <span>:</span>
            <input type="number" v-model.number="endSec" min="0" :max="59" @change="clampSelection" />
            <span>.<input type="number" v-model.number="endMs" min="0" :max="999" step="10" @change="clampSelection" style="width:52px" /></span>
          </div>
        </div>
        <div class="control-group">
          <label>选中时长</label>
          <div class="duration-display">{{ formatTime(selectionDuration) }}</div>
        </div>
      </div>

      <!-- Playback controls -->
      <div class="playback-controls">
        <button class="btn-play" @click="playSelection" :disabled="isPlaying">
          ▶ 播放选中
        </button>
        <button class="btn-play btn-stop" @click="stopPlayback" :disabled="!isPlaying">
          ⏹ 停止
        </button>
      </div>

      <!-- Export -->
      <div class="export-area">
        <h3>导出设置</h3>
        <div class="export-row">
          <label>输出格式</label>
          <select v-model="exportFormat">
            <option value="wav">WAV（无损）</option>
            <option value="webm">WebM</option>
          </select>
        </div>
        <button class="btn-export" @click="exportAudio" :disabled="isExporting">
          {{ isExporting ? '导出中...' : '📥 导出裁剪音频' }}
        </button>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '音频剪辑 - 野火小站' })

const fileInput = ref(null)
const waveCanvas = ref(null)

const audioFile = ref(null)
const audioDuration = ref(0)
const audioBuffer = ref(null)
const waveformData = ref([])
const isPlaying = ref(false)
const isExporting = ref(false)
const exportFormat = ref('wav')

// Selection (in seconds, float)
const selectionStart = ref(0)
const selectionEnd = ref(0)

const startMin = ref(0)
const startSec = ref(0)
const startMs = ref(0)
const endMin = ref(0)
const endSec = ref(0)
const endMs = ref(0)

const playheadPos = ref(0)

let audioContext = null
let sourceNode = null
let animFrame = null

const selectionDuration = computed(() => selectionEnd.value - selectionStart.value)

const selectionStyle = computed(() => {
  if (!audioDuration.value) return {}
  const left = (selectionStart.value / audioDuration.value) * 100
  const width = (selectionDuration.value / audioDuration.value) * 100
  return {
    left: left + '%',
    width: Math.max(width, 0) + '%',
  }
})

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

async function loadAudio(file) {
  audioFile.value = file
  stopPlayback()

  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
  }

  const arrayBuffer = await file.arrayBuffer()
  try {
    audioBuffer.value = await audioContext.decodeAudioData(arrayBuffer)
  } catch {
    alert('无法解码此音频文件，请尝试其他格式')
    return
  }

  audioDuration.value = audioBuffer.value.duration

  // Initialize selection
  selectionStart.value = 0
  selectionEnd.value = audioDuration.value
  syncInputsFromSelection()

  // Draw waveform
  drawWaveform()
}

function drawWaveform() {
  const canvas = waveCanvas.value
  if (!canvas || !audioBuffer.value) return

  const dpr = window.devicePixelRatio || 1
  const containerWidth = canvas.parentElement.clientWidth
  canvas.width = containerWidth * dpr
  canvas.height = 120 * dpr
  canvas.style.width = containerWidth + 'px'
  canvas.style.height = '120px'

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  const data = audioBuffer.value.getChannelData(0)
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

  // Normalize
  const maxVal = Math.max(...filtered, 0.01)
  waveformData.value = filtered.map(v => v / maxVal)

  // Draw
  const h = 120
  const centerY = h / 2

  // Background
  ctx.fillStyle = '#f8faf8'
  ctx.fillRect(0, 0, containerWidth, h)

  // Grid lines
  ctx.strokeStyle = '#e8f5e9'
  ctx.lineWidth = 1
  for (let y = 0; y < h; y += 20) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(containerWidth, y)
    ctx.stroke()
  }

  // Waveform
  const gradient = ctx.createLinearGradient(0, 0, containerWidth, 0)
  gradient.addColorStop(0, '#22c55e')
  gradient.addColorStop(0.5, '#10b981')
  gradient.addColorStop(1, '#059669')

  ctx.fillStyle = gradient
  for (let i = 0; i < filtered.length; i++) {
    const amp = (filtered[i] / maxVal) * (h / 2 - 4)
    const x = i
    ctx.fillRect(x, centerY - amp, 1, amp * 2)
  }
}

function syncInputsFromSelection() {
  const s = selectionStart.value
  const e = selectionEnd.value
  startMin.value = Math.floor(s / 60)
  startSec.value = Math.floor(s % 60)
  startMs.value = Math.round((s % 1) * 1000)
  endMin.value = Math.floor(e / 60)
  endSec.value = Math.floor(e % 60)
  endMs.value = Math.round((e % 1) * 1000)
}

function clampSelection() {
  const s = Math.max(0, startMin.value * 60 + startSec.value + startMs.value / 1000)
  const e = Math.min(audioDuration.value, endMin.value * 60 + endSec.value + endMs.value / 1000)
  selectionStart.value = Math.min(s, e)
  selectionEnd.value = Math.max(s, e)
  syncInputsFromSelection()
}

function playSelection() {
  if (!audioBuffer.value || !audioContext) return

  stopPlayback()

  const startOffset = selectionStart.value
  const duration = selectionDuration.value

  sourceNode = audioContext.createBufferSource()
  sourceNode.buffer = audioBuffer.value
  sourceNode.connect(audioContext.destination)
  sourceNode.onended = () => {
    isPlaying.value = false
    playheadPos.value = 0
    if (animFrame) cancelAnimationFrame(animFrame)
  }

  isPlaying.value = true
  sourceNode.start(0, startOffset, duration)

  // Animate playhead
  const startTime = performance.now()
  const updatePlayhead = () => {
    const elapsed = (performance.now() - startTime) / 1000
    if (elapsed >= duration) {
      playheadPos.value = 100
      return
    }
    playheadPos.value = ((startOffset + elapsed) / audioDuration.value) * 100
    animFrame = requestAnimationFrame(updatePlayhead)
  }
  animFrame = requestAnimationFrame(updatePlayhead)
}

function stopPlayback() {
  if (sourceNode) {
    try { sourceNode.stop() } catch {}
    sourceNode = null
  }
  if (animFrame) {
    cancelAnimationFrame(animFrame)
    animFrame = null
  }
  isPlaying.value = false
  playheadPos.value = 0
}

function exportAudio() {
  if (!audioBuffer.value || !audioContext) return
  isExporting.value = true

  try {
    const sampleRate = audioBuffer.value.sampleRate
    const channels = audioBuffer.value.numberOfChannels
    const startSample = Math.floor(selectionStart.value * sampleRate)
    const endSample = Math.floor(selectionEnd.value * sampleRate)
    const length = endSample - startSample

    if (length <= 0) {
      alert('请选择有效的裁剪区间')
      isExporting.value = false
      return
    }

    const offlineCtx = new OfflineAudioContext(channels, length, sampleRate)
    const newBuffer = offlineCtx.createBuffer(channels, length, sampleRate)

    for (let ch = 0; ch < channels; ch++) {
      const oldData = audioBuffer.value.getChannelData(ch)
      const newData = newBuffer.getChannelData(ch)
      for (let i = 0; i < length; i++) {
        newData[i] = oldData[startSample + i]
      }
    }

    const source = offlineCtx.createBufferSource()
    source.buffer = newBuffer
    source.connect(offlineCtx.destination)
    source.start()

    offlineCtx.startRendering().then(renderedBuffer => {
      if (exportFormat.value === 'wav') {
        downloadWav(renderedBuffer)
      } else {
        downloadWebM(renderedBuffer)
      }
      isExporting.value = false
    })
  } catch (err) {
    alert('导出失败：' + err.message)
    isExporting.value = false
  }
}

function downloadWav(buffer) {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const length = buffer.length
  const bytesPerSample = 2 // 16-bit

  const dataSize = length * numChannels * bytesPerSample
  const headerSize = 44
  const totalSize = headerSize + dataSize

  const arrayBuffer = new ArrayBuffer(totalSize)
  const view = new DataView(arrayBuffer)

  // WAV header
  writeString(view, 0, 'RIFF')
  view.setUint32(4, totalSize - 8, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true)
  view.setUint16(32, numChannels * bytesPerSample, true)
  view.setUint16(34, bytesPerSample * 8, true)
  writeString(view, 36, 'data')
  view.setUint32(40, dataSize, true)

  // Interleave channels
  let offset = headerSize
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = buffer.getChannelData(ch)[i]
      const clamped = Math.max(-1, Math.min(1, sample))
      view.setInt16(offset, clamped * 0x7FFF, true)
      offset += 2
    }
  }

  const blob = new Blob([arrayBuffer], { type: 'audio/wav' })
  downloadBlob(blob, getExportName('.wav'))
}

function downloadWebM(buffer) {
  // Use MediaRecorder for WebM
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const length = buffer.length

  const offlineCtx = new OfflineAudioContext(numChannels, length, sampleRate)
  const source = offlineCtx.createBufferSource()
  source.buffer = buffer
  source.connect(offlineCtx.destination)
  source.start()

  const dest = new AudioContext()
  const mediaDest = dest.createMediaStreamDestination()

  offlineCtx.startRendering().then(rendered => {
    const src = dest.createBufferSource()
    src.buffer = rendered
    src.connect(mediaDest)

    const recorder = new MediaRecorder(mediaDest.stream, { mimeType: 'audio/webm' })
    const chunks = []
    recorder.ondataavailable = (e) => chunks.push(e.data)
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' })
      downloadBlob(blob, getExportName('.webm'))
      dest.close()
    }

    recorder.start()
    src.start()
    src.onended = () => recorder.stop()
  })
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

function getExportName(ext) {
  const baseName = audioFile.value?.name?.replace(/\.[^.]+$/, '') || 'audio'
  return `${baseName}_trimmed${ext}`
}

function writeString(view, offset, str) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 1000)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
}

function resetAudio() {
  stopPlayback()
  audioFile.value = null
  audioBuffer.value = null
  audioDuration.value = 0
  waveformData.value = []
}

onMounted(() => {
  window.addEventListener('resize', () => { if (audioFile.value) drawWaveform() })
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

/* Upload */
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

/* Editor */
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

/* Waveform */
.waveform-wrapper {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
  cursor: crosshair;
  user-select: none;
}

.waveform-canvas {
  display: block;
}

.selection-region {
  position: absolute;
  top: 0;
  height: 100%;
  background: rgba(34, 197, 94, 0.15);
  border-left: 2px solid #22c55e;
  border-right: 2px solid #22c55e;
  pointer-events: none;
}

.playhead {
  position: absolute;
  top: 0;
  width: 2px;
  height: 100%;
  background: #ef4444;
  pointer-events: none;
  transition: left 0.05s linear;
}

.time-axis {
  display: flex;
  justify-content: space-between;
  padding: 0.3rem 0;
  color: #aaa;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}

/* Selection controls */
.selection-controls {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
  margin: 1rem 0;
}

.control-group label {
  display: block;
  font-size: 0.85rem;
  color: #555;
  margin-bottom: 0.3rem;
}

.time-input {
  display: flex;
  align-items: center;
  gap: 0.2rem;
}

.time-input input {
  width: 38px;
  padding: 0.3rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  text-align: center;
  font-size: 0.9rem;
  background: white;
}

.time-input input:focus {
  outline: none;
  border-color: #22c55e;
}

.time-input span {
  color: #888;
}

.duration-display {
  padding: 0.3rem 0.6rem;
  background: #f1f8f1;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #16a34a;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  text-align: center;
}

/* Playback */
.playback-controls {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.btn-play {
  padding: 0.5rem 1.5rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  font-weight: 600;
}

.btn-play:hover { opacity: 0.85; }
.btn-play:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-stop {
  background: #6b7280;
}

/* Export */
.export-area {
  background: #f1f8f1;
  border-radius: 12px;
  padding: 1rem 1.5rem;
}

.export-area h3 {
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 0.75rem;
}

.export-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.export-row label {
  font-size: 0.9rem;
  color: #666;
}

.export-row select {
  padding: 0.3rem 0.6rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
}

.btn-export {
  padding: 0.6rem 2rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  font-weight: 600;
}

.btn-export:hover { opacity: 0.85; }
.btn-export:disabled { opacity: 0.5; cursor: not-allowed; }

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
  .selection-controls {
    grid-template-columns: 1fr;
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
