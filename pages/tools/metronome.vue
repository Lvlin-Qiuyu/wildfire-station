<template>
  <div class="tool-page">
    <h2>🎵 在线节拍训练器</h2>
    <p class="subtitle">精确节拍声，支持 BPM 调节、拍号选择、重拍强调、视觉闪烁同步</p>

    <!-- 主控制面板 -->
    <div class="main-panel">
      <!-- BPM 大数字显示 -->
      <div class="bpm-display" :class="{ flash: isBeatFlash }">
        <div class="bpm-number">{{ bpm }}</div>
        <div class="bpm-label">BPM</div>
      </div>

      <!-- BPM 调节 -->
      <div class="control-section">
        <label class="control-label">速度调节</label>
        <div class="bpm-slider-row">
          <button class="btn-step" @click="adjustBpm(-10)">-10</button>
          <button class="btn-step" @click="adjustBpm(-1)">-1</button>
          <input
            type="range"
            v-model.number="bpm"
            min="30"
            max="300"
            step="1"
            class="bpm-slider"
          />
          <button class="btn-step" @click="adjustBpm(1)">+1</button>
          <button class="btn-step" @click="adjustBpm(10)">+10</button>
        </div>
        <div class="bpm-range-labels">
          <span>慢速 30</span>
          <span>中速 120</span>
          <span>极速 300</span>
        </div>
      </div>

      <!-- 拍号选择 -->
      <div class="control-section">
        <label class="control-label">拍号选择</label>
        <div class="time-sig-row">
          <button
            v-for="sig in timeSignatures"
            :key="sig.value"
            class="btn-sig"
            :class="{ active: timeSignature === sig.value }"
            @click="timeSignature = sig.value"
          >
            <span class="sig-main">{{ sig.numerator }}</span>
            <span class="sig-sep">/</span>
            <span class="sig-main">{{ sig.denominator }}</span>
            <span class="sig-label">{{ sig.label }}</span>
          </button>
        </div>
      </div>

      <!-- 音色选择 -->
      <div class="control-section">
        <label class="control-label">音色</label>
        <div class="sound-row">
          <button
            v-for="s in sounds"
            :key="s.value"
            class="btn-sound"
            :class="{ active: soundType === s.value }"
            @click="soundType = s.value"
          >{{ s.icon }} {{ s.label }}</button>
        </div>
      </div>

      <!-- 播放/暂停 -->
      <div class="play-section">
        <button class="btn-play" @click="togglePlay" :class="{ playing: isPlaying }">
          <span class="play-icon">{{ isPlaying ? '⏸' : '▶' }}</span>
          <span>{{ isPlaying ? '暂停' : '开始' }}</span>
        </button>
        <button class="btn-tap" @click="onTap" :class="{ 'tap-active': tapPressed }">
          🫵 TAP
        </button>
      </div>
    </div>

    <!-- 节拍可视化 -->
    <div class="visual-panel">
      <div class="section-title">🔔 节拍可视化</div>
      <div class="beat-dots">
        <div
          v-for="i in timeSignature"
          :key="i"
          class="beat-dot"
          :class="{
            active: currentBeat === i - 1 && isPlaying,
            accent: i === 1 && currentBeat === 0 && isPlaying,
          }"
        />
      </div>
      <div class="beat-labels">
        <span v-for="i in timeSignature" :key="i">
          {{ i === 1 ? '强' : '弱' }}
        </span>
      </div>

      <!-- TAP BPM 显示 -->
      <div v-if="tapBpm > 0" class="tap-result">
        <span class="tap-bpm-num">{{ tapBpm }}</span>
        <span class="tap-label">BPM（{{ tapCount }} 次敲击）</span>
        <button class="btn-apply-tap" @click="applyTapBpm">应用</button>
        <button class="btn-clear-tap" @click="clearTap">清除</button>
      </div>

      <!-- 速度描述 -->
      <div class="tempo-info">
        <span class="tempo-label">{{ getTempoLabel(bpm) }}</span>
        <span class="tempo-note">每拍 {{ (60 / bpm * 1000).toFixed(0) }}ms</span>
      </div>
    </div>

    <!-- 快捷键提示 -->
    <div class="shortcuts-panel">
      <div class="section-title">⌨️ 快捷键</div>
      <div class="shortcut-list">
        <span><kbd>Space</kbd> 播放/暂停</span>
        <span><kbd>T</kbd> TAP 敲击</span>
        <span><kbd>↑</kbd> BPM +1</span>
        <span><kbd>↓</kbd> BPM -1</span>
        <span><kbd>←</kbd> BPM -10</span>
        <span><kbd>→</kbd> BPM +10</span>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '在线节拍训练器 - 野火小站' })

// === 状态 ===
const bpm = ref(120)
const isPlaying = ref(false)
const currentBeat = ref(0)
const isBeatFlash = ref(false)
const timeSignature = ref(4)
const soundType = ref('click')

// TAP 状态
const tapPressed = ref(false)
const tapTimes = []
const tapBpm = ref(0)
const tapCount = ref(0)

// 音频上下文
let audioCtx = null
let schedulerTimer = null
let nextBeatTime = 0
const scheduleAheadTime = 0.1 // 提前调度100ms
const lookAheadInterval = 25  // 调度检查间隔25ms

// === 拍号选项 ===
const timeSignatures = [
  { value: 2, numerator: '2', denominator: '4', label: '二拍子' },
  { value: 3, numerator: '3', denominator: '4', label: '三拍子' },
  { value: 4, numerator: '4', denominator: '4', label: '四拍子' },
  { value: 6, numerator: '6', denominator: '8', label: '六拍子' },
]

// === 音色选项 ===
const sounds = [
  { value: 'click', icon: '🪵', label: '木鱼' },
  { value: 'beep', icon: '🔊', label: '电子' },
  { value: 'hi', icon: '🔔', label: '高音' },
  { value: 'cow', icon: '🐂', label: '牛铃' },
]

// === 初始化音频上下文 ===
function ensureAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
}

// === 播放节拍声 ===
function playClick(isAccent, time) {
  ensureAudioCtx()
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.connect(gain)
  gain.connect(audioCtx.destination)

  // 根据音色设置频率和波形
  const config = {
    click: { accent: 1000, normal: 800, wave: 'sine' },
    beep:  { accent: 1200, normal: 800, wave: 'square' },
    hi:    { accent: 2000, normal: 1500, wave: 'sine' },
    cow:   { accent: 800,  normal: 523, wave: 'triangle' },
  }
  const c = config[soundType.value] || config.click
  osc.type = c.wave
  osc.frequency.value = isAccent ? c.accent : c.normal

  // 强拍音量更大
  const volume = isAccent ? 0.6 : 0.3
  const duration = isAccent ? 0.06 : 0.04

  gain.gain.setValueAtTime(volume, time)
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration)

  osc.start(time)
  osc.stop(time + duration)
}

// === 调度器：精确时间调度 ===
function scheduler() {
  while (nextBeatTime < audioCtx.currentTime + scheduleAheadTime) {
    const beatInBar = currentBeat.value % timeSignature.value
    const isAccent = beatInBar === 0

    // 调度音频（精确时间）
    playClick(isAccent, nextBeatTime)

    // 视觉同步（使用 setTimeout 近似同步）
    const delayMs = (nextBeatTime - audioCtx.currentTime) * 1000
    const beatIdx = currentBeat.value
    const sigVal = timeSignature.value
    setTimeout(() => {
      isBeatFlash.value = true
      currentBeat.value = beatIdx % sigVal
      setTimeout(() => { isBeatFlash.value = false }, 80)
    }, Math.max(0, delayMs))

    // 计算下一拍时间
    nextBeatTime += 60.0 / bpm.value
    currentBeat.value++
  }
}

// === 播放/暂停 ===
function togglePlay() {
  if (isPlaying.value) {
    stopPlaying()
  } else {
    startPlaying()
  }
}

function startPlaying() {
  ensureAudioCtx()
  isPlaying.value = true
  currentBeat.value = 0
  nextBeatTime = audioCtx.currentTime + 0.05
  schedulerTimer = setInterval(scheduler, lookAheadInterval)
}

function stopPlaying() {
  isPlaying.value = false
  currentBeat.value = 0
  isBeatFlash.value = false
  if (schedulerTimer) {
    clearInterval(schedulerTimer)
    schedulerTimer = null
  }
}

// === BPM 调节 ===
function adjustBpm(delta) {
  bpm.value = Math.min(300, Math.max(30, bpm.value + delta))
}

// === TAP 敲击 ===
function onTap() {
  const now = Date.now()
  tapTimes.push(now)
  tapPressed.value = true
  setTimeout(() => tapPressed.value = false, 100)

  // 保留最近16次
  if (tapTimes.length > 16) tapTimes.shift()

  if (tapTimes.length >= 2) {
    let totalInterval = 0
    for (let i = 1; i < tapTimes.length; i++) {
      totalInterval += tapTimes[i] - tapTimes[i - 1]
    }
    const avgInterval = totalInterval / (tapTimes.length - 1)
    tapBpm.value = Math.round(60000 / avgInterval)
    tapBpm.value = Math.min(300, Math.max(30, tapBpm.value))
    tapCount.value = tapTimes.length
  } else {
    tapCount.value = tapTimes.length
  }
}

function applyTapBpm() {
  if (tapBpm.value > 0) {
    bpm.value = tapBpm.value
  }
}

function clearTap() {
  tapTimes.length = 0
  tapBpm.value = 0
  tapCount.value = 0
}

// === 速度描述 ===
function getTempoLabel(bpm) {
  if (bpm < 50) return '极慢 (Lento)'
  if (bpm < 70) return '缓慢 (Adagio)'
  if (bpm < 90) return '行板 (Andante)'
  if (bpm < 110) return '中板 (Moderato)'
  if (bpm < 130) return '小快板 (Allegretto)'
  if (bpm < 160) return '快板 (Allegro)'
  if (bpm < 200) return '急板 (Vivace)'
  return '极快 (Presto)'
}

// === 键盘快捷键 ===
function onKeyDown(e) {
  // 避免在输入框中触发
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

  switch (e.code) {
    case 'Space':
      e.preventDefault()
      togglePlay()
      break
    case 'KeyT':
      e.preventDefault()
      onTap()
      break
    case 'ArrowUp':
      e.preventDefault()
      adjustBpm(1)
      break
    case 'ArrowDown':
      e.preventDefault()
      adjustBpm(-1)
      break
    case 'ArrowRight':
      e.preventDefault()
      adjustBpm(10)
      break
    case 'ArrowLeft':
      e.preventDefault()
      adjustBpm(-10)
      break
  }
}

// === 生命周期 ===
onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  stopPlaying()
  if (audioCtx) {
    audioCtx.close()
    audioCtx = null
  }
})
</script>

<style scoped>
.tool-page {
  max-width: 680px;
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

/* 主面板 */
.main-panel {
  background: #fff;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 1.2rem;
}

/* BPM 显示 */
.bpm-display {
  text-align: center;
  padding: 2rem 1rem;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border-radius: 12px;
  transition: transform 0.05s;
}

.bpm-display.flash {
  transform: scale(1.02);
}

.bpm-number {
  font-size: 5rem;
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

/* 控制区域 */
.control-section {
  margin-bottom: 1.2rem;
}

.control-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #888;
  margin-bottom: 0.5rem;
}

/* BPM 滑块 */
.bpm-slider-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-step {
  padding: 0.35rem 0.7rem;
  border: 1px solid #c8e6c9;
  border-radius: 6px;
  background: white;
  font-size: 0.85rem;
  color: #555;
  cursor: pointer;
  font-weight: 600;
  flex-shrink: 0;
}

.btn-step:hover {
  border-color: #22c55e;
  color: #16a34a;
}

.bpm-slider {
  flex: 1;
  -webkit-appearance: none;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(90deg, #22c55e, #10b981);
  outline: none;
}

.bpm-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #22c55e;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.bpm-range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #aaa;
  margin-top: 0.3rem;
}

/* 拍号按钮 */
.time-sig-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-sig {
  padding: 0.5rem 1rem;
  border: 1.5px solid #e0e0e0;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.15s;
  min-width: 70px;
}

.btn-sig:hover {
  border-color: #22c55e;
}

.btn-sig.active {
  border-color: #22c55e;
  background: #f0fdf4;
}

.sig-main {
  font-size: 1.3rem;
  font-weight: 800;
  color: #2c3e50;
  line-height: 1.2;
}

.sig-sep {
  font-size: 1.1rem;
  color: #aaa;
}

.sig-label {
  font-size: 0.7rem;
  color: #888;
  margin-top: 0.15rem;
}

/* 音色选择 */
.sound-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-sound {
  padding: 0.45rem 0.9rem;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.15s;
}

.btn-sound:hover {
  border-color: #22c55e;
}

.btn-sound.active {
  border-color: #22c55e;
  background: #f0fdf4;
  font-weight: 600;
}

/* 播放按钮 */
.play-section {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.2rem;
  flex-wrap: wrap;
}

.btn-play {
  padding: 0.8rem 2rem;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.15s;
}

.btn-play:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(34, 197, 94, 0.4);
}

.btn-play.playing {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.play-icon {
  font-size: 1.2rem;
}

.btn-tap {
  padding: 0.8rem 1.5rem;
  border: 2px solid #22c55e;
  border-radius: 12px;
  background: white;
  color: #22c55e;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.1s;
  user-select: none;
}

.btn-tap:hover {
  background: #f0fdf4;
}

.btn-tap.tap-active {
  transform: scale(0.95);
  background: #dcfce7;
}

/* 可视化面板 */
.visual-panel {
  background: #fff;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 1.2rem;
}

.section-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #555;
  margin-bottom: 0.8rem;
}

/* 节拍点 */
.beat-dots {
  display: flex;
  justify-content: center;
  gap: 1.2rem;
  margin-bottom: 0.5rem;
}

.beat-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e8e8e8;
  transition: all 0.08s;
}

.beat-dot.active {
  background: #22c55e;
  transform: scale(1.3);
  box-shadow: 0 0 12px rgba(34, 197, 94, 0.5);
}

.beat-dot.accent {
  background: #16a34a;
  transform: scale(1.5);
  box-shadow: 0 0 20px rgba(22, 163, 74, 0.6);
}

.beat-labels {
  display: flex;
  justify-content: center;
  gap: 1.2rem;
  font-size: 0.75rem;
  color: #aaa;
}

/* TAP 结果 */
.tap-result {
  text-align: center;
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 10px;
}

.tap-bpm-num {
  font-size: 2.5rem;
  font-weight: 900;
  color: #22c55e;
  display: block;
  font-variant-numeric: tabular-nums;
}

.tap-label {
  font-size: 0.8rem;
  color: #888;
  display: block;
  margin-bottom: 0.5rem;
}

.btn-apply-tap {
  padding: 0.35rem 0.8rem;
  background: #22c55e;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  margin-right: 0.3rem;
}

.btn-clear-tap {
  padding: 0.35rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  color: #888;
  font-size: 0.8rem;
}

.btn-clear-tap:hover {
  border-color: #ef4444;
  color: #ef4444;
}

/* 速度信息 */
.tempo-info {
  text-align: center;
  margin-top: 1rem;
  padding-top: 0.8rem;
  border-top: 1px solid #f0f0f0;
}

.tempo-label {
  font-size: 0.95rem;
  color: #555;
  font-weight: 600;
}

.tempo-note {
  font-size: 0.8rem;
  color: #aaa;
  margin-left: 0.8rem;
}

/* 快捷键 */
.shortcuts-panel {
  background: #fff;
  border-radius: 16px;
  padding: 1.2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 1rem;
}

.shortcut-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.85rem;
  color: #666;
}

.shortcut-list kbd {
  padding: 0.15rem 0.5rem;
  background: #f1f1f1;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.8rem;
  margin-right: 0.3rem;
}

/* 返回链接 */
.back-link {
  display: inline-block;
  margin-top: 1.5rem;
  color: #22c55e;
  font-weight: 500;
}

.back-link:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .bpm-number { font-size: 3.5rem; }
  .bpm-slider-row { flex-wrap: wrap; }
  .btn-step { padding: 0.3rem 0.5rem; font-size: 0.8rem; }
  .btn-play { padding: 0.6rem 1.5rem; font-size: 1rem; }
  .beat-dots { gap: 0.8rem; }
  .beat-dot { width: 24px; height: 24px; }
  .shortcut-list { gap: 0.6rem; }
}
</style>
