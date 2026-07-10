<template>
  <div class="tool-page">
    <h2>🎵 音频基频检测器</h2>
    <p class="subtitle">Web Audio API + 自相关算法(ACF)检测麦克风实时音频的基频，用于乐器调音或唱歌练习</p>

    <!-- 控制区 -->
    <div class="control-panel">
      <button
        :class="['btn-main', { active: isListening, 'btn-stop': isListening }]"
        @click="toggleListening"
      >
        {{ isListening ? '⏹ 停止检测' : '🎤 开始检测' }}
      </button>
      <div class="status-info">
        <span :class="['status-dot', { active: isListening }]"></span>
        <span>{{ isListening ? '正在检测...' : '点击按钮开始检测' }}</span>
      </div>
    </div>

    <!-- 主显示区 -->
    <div class="display-area">
      <!-- 音高仪表盘 -->
      <div class="gauge-panel">
        <div class="gauge-wrapper">
          <svg class="gauge-svg" viewBox="0 0 300 150">
            <!-- 背景弧线 -->
            <path
              class="gauge-bg"
              d="M 30 140 A 120 120 0 0 1 270 140"
              fill="none"
            />
            <!-- 刻度线 -->
            <line v-for="(tick, i) in 60" :key="i"
              class="gauge-tick"
              :x1="150 + Math.cos(degToRad(-150 + i * 5)) * 100"
              :y1="140 + Math.sin(degToRad(-150 + i * 5)) * 100"
              :x2="150 + Math.cos(degToRad(-150 + i * 5)) * 110"
              :y2="140 + Math.sin(degToRad(-150 + i * 5)) * 110"
              :class="{ 'tick-major': i % 12 === 0 }"
            />
            <!-- 刻度标签 -->
            <text v-for="(label, i) in noteLabels" :key="i"
              class="gauge-label"
              :x="150 + Math.cos(degToRad(-150 + i * 25)) * 85"
              :y="140 + Math.sin(degToRad(-150 + i * 25)) * 85 + 4"
            >{{ label }}</text>
            <!-- 指针 -->
            <g v-if="currentPitch >= 0" :transform="`rotate(${gaugeRotation}, 150, 140)`">
              <line
                class="gauge-pointer"
                x1="150"
                y1="140"
                x2="150"
                y2="30"
              />
              <circle cx="150" cy="140" r="8" class="gauge-center" />
            </g>
          </svg>
        </div>
      </div>

      <!-- 数值显示 -->
      <div class="value-panel">
        <div class="pitch-display">
          <div class="hz-value">{{ currentPitch >= 0 ? currentPitch.toFixed(1) : '--.-' }}</div>
          <div class="hz-unit">Hz</div>
        </div>
        <div class="note-display">
          <div class="note-name">{{ currentNote || '--' }}</div>
          <div class="note-cents" :class="getCentClass()">
            {{ currentCents !== null ? (currentCents >= 0 ? '+' : '') + currentCents.toFixed(0) + '¢' : '--¢' }}
          </div>
        </div>
        <div class="octave-info">
          <span>八度：{{ currentOctave !== null ? currentOctave : '--' }}</span>
          <span>频率范围：{{ minFreq }} - {{ maxFreq }} Hz</span>
        </div>
      </div>
    </div>

    <!-- 波形显示 -->
    <div class="waveform-panel">
      <canvas ref="waveCanvas" class="wave-canvas"></canvas>
    </div>

    <!-- 历史记录 -->
    <div class="history-panel">
      <div class="history-header">
        <h4>检测历史</h4>
        <button class="btn-sm" @click="clearHistory">清空</button>
      </div>
      <div v-if="history.length === 0" class="empty-hint">暂无检测记录</div>
      <div v-else class="history-list">
        <div v-for="(item, idx) in history.slice(-10).reverse()" :key="idx" class="history-item">
          <span class="time">{{ item.time }}</span>
          <span class="note">{{ item.note }}</span>
          <span class="hz">{{ item.hz.toFixed(1) }} Hz</span>
          <span :class="['cents', item.centsClass]">{{ item.centsStr }}</span>
        </div>
      </div>
    </div>

    <!-- 设置 -->
    <div class="settings-panel">
      <h4>设置</h4>
      <div class="settings-grid">
        <div class="setting-row">
          <label>采样率</label>
          <select v-model="sampleRate" class="setting-select" :disabled="isListening">
            <option value="44100">44.1 kHz</option>
            <option value="48000">48 kHz</option>
          </select>
        </div>
        <div class="setting-row">
          <label>FFT 大小</label>
          <select v-model="fftSize" class="setting-select" :disabled="isListening">
            <option value="2048">2048</option>
            <option value="4096">4096</option>
            <option value="8192">8192</option>
          </select>
        </div>
        <div class="setting-row">
          <label>平滑窗口</label>
          <input type="range" min="1" max="10" v-model.number="smoothingWindow" class="setting-range" />
          <span class="setting-val">{{ smoothingWindow }}</span>
        </div>
        <div class="setting-row">
          <label>频率范围</label>
          <input type="number" v-model.number="minFreq" min="20" max="1000" class="setting-input" :disabled="isListening" />
          <span>-</span>
          <input type="number" v-model.number="maxFreq" min="100" max="4000" class="setting-input" :disabled="isListening" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
useHead({ title: '音频基频检测器 - 野火小站' })

const isListening = ref(false)
const currentPitch = ref(-1)
const currentNote = ref('')
const currentCents = ref(null)
const currentOctave = ref(null)
const gaugeRotation = ref(0)

// 设置
const sampleRate = ref(44100)
const fftSize = ref(2048)
const smoothingWindow = ref(3)
const minFreq = ref(80)
const maxFreq = ref(1000)

// 历史
const history = ref([])

// 音频上下文
let audioContext = null
let analyser = null
let microphone = null
let dataArray = null
let animationId = null
const pitchBuffer = []

// Canvas
const waveCanvas = ref(null)
let waveCtx = null

// 音名标签
const noteLabels = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// 音名到频率映射（A4 = 440Hz）
const A4_FREQ = 440
const A4_NOTE_INDEX = 9 // A4 在 C4 中的索引（0= C4）
const C4_OCTAVE = 4

// 角度转弧度
function degToRad(deg) {
  return deg * Math.PI / 180
}

// 频率到音名
function freqToNote(freq) {
  const noteNum = 12 * (Math.log2(freq / A4_FREQ)) + A4_NOTE_INDEX
  const noteIndex = Math.round(noteNum) % 12
  const cents = Math.round((noteNum - Math.round(noteNum)) * 100)
  const octave = C4_OCTAVE + Math.floor((Math.round(noteNum)) / 12) - 1

  return {
    note: noteLabels[noteIndex] || '?',
    octave,
    cents
  }
}

// 开始/停止检测
async function toggleListening() {
  if (isListening.value) {
    stopListening()
  } else {
    await startListening()
  }
}

async function startListening() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    audioContext = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: sampleRate.value
    })

    analyser = audioContext.createAnalyser()
    analyser.fftSize = fftSize.value
    analyser.smoothingTimeConstant = 0.8

    microphone = audioContext.createMediaStreamSource(stream)
    microphone.connect(analyser)

    const bufferLength = analyser.fftSize
    dataArray = new Float32Array(bufferLength)

    isListening.value = true
    updateWaveCanvas()
    detectPitch()
  } catch (err) {
    alert('无法访问麦克风：' + err.message)
  }
}

function stopListening() {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }

  if (audioContext) {
    audioContext.close()
    audioContext = null
  }

  if (microphone) {
    microphone.disconnect()
    microphone = null
  }

  analyser = null
  dataArray = null
  isListening.value = false
  currentPitch.value = -1
  currentNote.value = ''
  currentCents.value = null
  currentOctave.value = null
  gaugeRotation.value = 0
  pitchBuffer.length = 0
}

// 基频检测（自相关算法）
function detectPitch() {
  if (!isListening.value || !analyser) return

  analyser.getFloatTimeDomainData(dataArray)

  const pitch = autoCorrelate(dataArray, audioContext.sampleRate)

  if (pitch >= minFreq.value && pitch <= maxFreq.value) {
    pitchBuffer.push(pitch)
    if (pitchBuffer.length > smoothingWindow.value) {
      pitchBuffer.shift()
    }

    // 平滑处理
    const smoothedPitch = pitchBuffer.reduce((a, b) => a + b, 0) / pitchBuffer.length
    currentPitch.value = smoothedPitch

    const noteInfo = freqToNote(smoothedPitch)
    currentNote.value = noteInfo.note
    currentCents.value = noteInfo.cents
    currentOctave.value = noteInfo.octave

    // 计算指针角度（-150° 到 150°，C=0）
    const cents = noteInfo.cents
    gaugeRotation.value = -150 + (cents + 50) / 100 * 300
    gaugeRotation.value = Math.max(-150, Math.min(150, gaugeRotation.value))

    // 更新波形
    drawWaveform()

    // 添加历史记录（节流）
    if (history.value.length === 0 || 
        Date.now() - history.value[history.value.length - 1].timestamp > 500) {
      const centClass = getCentClass()
      const centsStr = (noteInfo.cents >= 0 ? '+' : '') + noteInfo.cents + '¢'
      history.value.push({
        time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
        note: noteInfo.note + noteInfo.octave,
        hz: smoothedPitch,
        cents: noteInfo.cents,
        centsStr,
        centsClass: centClass,
        timestamp: Date.now()
      })
    }
  } else {
    currentPitch.value = -1
  }

  animationId = requestAnimationFrame(detectPitch)
}

// 自相关算法
function autoCorrelate(buffer, sampleRate) {
  const SIZE = buffer.length
  let rms = 0

  for (let i = 0; i < SIZE; i++) {
    rms += buffer[i] * buffer[i]
  }
  rms = Math.sqrt(rms / SIZE)

  if (rms < 0.01) return -1

  let r1 = 0, r2 = SIZE - 1
  const threshold = 0.2

  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buffer[i]) < threshold) { r1 = i; break }
  }

  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buffer[SIZE - i]) < threshold) { r2 = SIZE - i; break }
  }

  buffer = buffer.slice(r1, r2)
  const newSize = buffer.length

  const c = new Array(newSize).fill(0)

  for (let i = 0; i < newSize; i++) {
    for (let j = 0; j < newSize - i; j++) {
      c[i] += buffer[j] * buffer[j + i]
    }
  }

  let d = 0
  while (c[d] > c[d + 1]) d++

  let maxVal = -1, maxPos = -1

  for (let i = d; i < newSize; i++) {
    if (c[i] > maxVal) {
      maxVal = c[i]
      maxPos = i
    }
  }

  let T0 = maxPos

  // 插值优化
  const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1]
  const a = (x1 + x3 - 2 * x2) / 2
  const b = (x3 - x1) / 2

  if (a) T0 = T0 - b / (2 * a)

  return sampleRate / T0
}

// 绘制波形
function drawWaveform() {
  if (!waveCanvas.value || !dataArray) return

  const canvas = waveCanvas.value
  const ctx = waveCtx
  const width = canvas.width
  const height = canvas.height

  ctx.clearRect(0, 0, width, height)
  ctx.beginPath()
  ctx.strokeStyle = '#10b981'
  ctx.lineWidth = 2

  const sliceWidth = width / dataArray.length
  let x = 0

  for (let i = 0; i < dataArray.length; i++) {
    const v = dataArray[i] * 0.5
    const y = height / 2 + v * height / 2

    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }

    x += sliceWidth
  }

  ctx.stroke()
}

// 更新 Canvas 尺寸
function updateWaveCanvas() {
  const canvas = waveCanvas.value
  if (!canvas) return

  const container = canvas.parentElement
  canvas.width = container.clientWidth
  canvas.height = 200
  waveCtx = canvas.getContext('2d')
}

// 获取音分样式类
function getCentClass() {
  if (currentCents.value === null) return ''
  const abs = Math.abs(currentCents.value)
  if (abs <= 5) return 'cents-perfect'
  if (abs <= 15) return 'cents-good'
  if (abs <= 30) return 'cents-fair'
  return 'cents-poor'
}

// 清空历史
function clearHistory() {
  history.value = []
}

// 监听窗口大小变化
onMounted(() => {
  window.addEventListener('resize', updateWaveCanvas)
})

onUnmounted(() => {
  stopListening()
  window.removeEventListener('resize', updateWaveCanvas)
})
</script>

<style scoped>
.tool-page { max-width: 800px; margin: 0 auto; padding: 1.5rem; }
.tool-page h2 { font-size: 1.8rem; margin-bottom: 0.5rem; color: #2c3e50; }
.subtitle { color: #888; margin-bottom: 1.5rem; font-size: 0.95rem; }

.control-panel {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.btn-main {
  padding: 0.8rem 2rem;
  font-size: 1rem;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
}
.btn-main:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16,185,129,0.3);
}
.btn-main.btn-stop {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}
.btn-main.btn-stop:hover {
  box-shadow: 0 4px 12px rgba(239,68,68,0.3);
}
.status-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #888;
  font-size: 0.9rem;
}
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ccc;
  transition: background 0.3s;
}
.status-dot.active {
  background: #10b981;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.display-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}
@media (max-width: 640px) {
  .display-area { grid-template-columns: 1fr; }
}

/* 仪表盘 */
.gauge-panel {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  border: 1px solid #eee;
}
.gauge-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 2/1;
}
.gauge-svg {
  width: 100%;
  height: 100%;
}
.gauge-bg {
  stroke: #eee;
  stroke-width: 20;
  stroke-linecap: round;
}
.gauge-tick {
  stroke: #ccc;
  stroke-width: 2;
}
.gauge-tick.tick-major {
  stroke: #999;
  stroke-width: 3;
}
.gauge-label {
  font-size: 14px;
  fill: #666;
  text-anchor: middle;
  font-weight: 500;
}
.gauge-pointer {
  stroke: #10b981;
  stroke-width: 4;
  stroke-linecap: round;
  transform-origin: 150px 140px;
  transition: transform 0.1s ease-out;
}
.gauge-center {
  fill: #10b981;
}

/* 数值显示 */
.value-panel {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  border: 1px solid #eee;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
}
.pitch-display {
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}
.hz-value {
  font-size: 3rem;
  font-weight: 700;
  color: #2c3e50;
  font-family: monospace;
}
.hz-unit {
  font-size: 0.9rem;
  color: #888;
  margin-top: 0.25rem;
}
.note-display {
  text-align: center;
}
.note-name {
  font-size: 2.5rem;
  font-weight: 700;
  color: #10b981;
  margin-bottom: 0.25rem;
}
.note-cents {
  font-size: 1.2rem;
  font-weight: 600;
  color: #888;
}
.note-cents.cents-perfect { color: #10b981; }
.note-cents.cents-good { color: #3b82f6; }
.note-cents.cents-fair { color: #f59e0b; }
.note-cents.cents-poor { color: #ef4444; }

.octave-info {
  display: flex;
  justify-content: space-around;
  font-size: 0.85rem;
  color: #888;
  border-top: 1px solid #f0f0f0;
  padding-top: 0.75rem;
}

/* 波形 */
.waveform-panel {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  border: 1px solid #eee;
  margin-bottom: 1.5rem;
}
.wave-canvas {
  width: 100%;
  background: #fafafa;
  border-radius: 8px;
}

/* 历史 */
.history-panel {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  border: 1px solid #eee;
  margin-bottom: 1.5rem;
}
.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}
.history-header h4 { font-size: 0.95rem; color: #555; }
.empty-hint { color: #aaa; text-align: center; padding: 1.5rem; font-size: 0.85rem; }
.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.history-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 0.85rem;
}
.history-item .time {
  color: #888;
  font-family: monospace;
  min-width: 60px;
}
.history-item .note {
  font-weight: 600;
  color: #10b981;
  min-width: 40px;
}
.history-item .hz {
  color: #666;
  font-family: monospace;
  min-width: 60px;
}
.history-item .cents {
  color: #888;
  font-size: 0.8rem;
}
.history-item .cents.cents-perfect { color: #10b981; }
.history-item .cents.cents-good { color: #3b82f6; }
.history-item .cents.cents-fair { color: #f59e0b; }
.history-item .cents.cents-poor { color: #ef4444; }

/* 设置 */
.settings-panel {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  border: 1px solid #eee;
}
.settings-panel h4 { font-size: 0.95rem; color: #555; margin-bottom: 0.75rem; }
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}
.setting-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}
.setting-row label {
  min-width: 70px;
  color: #666;
  font-weight: 500;
}
.setting-select, .setting-input {
  padding: 0.3rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.85rem;
  font-family: inherit;
}
.setting-select:focus, .setting-input:focus {
  outline: none;
  border-color: #10b981;
}
.setting-select:disabled, .setting-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}
.setting-range {
  accent-color: #10b981;
  flex: 1;
}
.setting-val {
  font-weight: 600;
  color: #10b981;
  min-width: 1.5rem;
  text-align: center;
}

/* 按钮样式 */
.btn-sm {
  padding: 0.3rem 0.75rem;
  font-size: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-sm:hover {
  border-color: #10b981;
  color: #10b981;
}

@media (max-width: 640px) {
  .tool-page { padding: 1rem; }
  .tool-page h2 { font-size: 1.4rem; }
  .control-panel { flex-direction: column; }
  .btn-main { width: 100%; }
  .settings-grid { grid-template-columns: 1fr; }
  .setting-row { flex-wrap: wrap; }
}
</style>
