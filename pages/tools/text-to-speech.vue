<template>
  <div class="tool-page">
    <h2>🔊 文本转语音朗读器</h2>
    <p class="tool-desc">使用浏览器内置语音合成，将文本转为语音朗读</p>

    <!-- 文本输入 -->
    <div class="input-section">
      <textarea
        v-model="inputText"
        class="text-area"
        placeholder="输入要朗读的文本…"
        rows="5"
        spellcheck="false"
      ></textarea>
      <div class="char-count">{{ inputText.length }} 字符</div>
    </div>

    <!-- 语音设置 -->
    <div class="settings">
      <div class="setting-row">
        <label>语言</label>
        <select v-model="selectedLang" @change="updateVoices" class="select-input">
          <option v-for="lang in languages" :key="lang.code" :value="lang.code">
            {{ lang.label }}
          </option>
        </select>
      </div>
      <div class="setting-row">
        <label>语音角色</label>
        <select v-model="selectedVoice" class="select-input">
          <option v-for="voice in filteredVoices" :key="voice.name" :value="voice.name">
            {{ voice.name }} ({{ voice.lang }})
          </option>
        </select>
      </div>
      <div class="setting-row">
        <label>语速 <span class="val">{{ rate.toFixed(1) }}x</span></label>
        <input type="range" v-model.number="rate" min="0.1" max="3" step="0.1" class="slider" />
      </div>
      <div class="setting-row">
        <label>音调 <span class="val">{{ pitch.toFixed(1) }}</span></label>
        <input type="range" v-model.number="pitch" min="0" max="2" step="0.1" class="slider" />
      </div>
      <div class="setting-row">
        <label>音量 <span class="val">{{ volume.toFixed(0) }}%</span></label>
        <input type="range" v-model.number="volume" min="0" max="1" step="0.05" class="slider" />
      </div>
    </div>

    <!-- 播放控制 -->
    <div class="playback-controls">
      <button class="btn-play" @click="speak" :disabled="!inputText.trim()">
        ▶ 播放
      </button>
      <button class="btn-ctrl" @click="pauseOrResume">
        {{ isPaused ? '▶ 继续' : '⏸ 暂停' }}
      </button>
      <button class="btn-ctrl" @click="stopSpeech">⏹ 停止</button>
    </div>

    <!-- 状态 -->
    <div v-if="status" class="status-bar">{{ status }}</div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '文本转语音朗读器 - 野火小站' })

const inputText = ref('野火小站，一个简洁实用的在线工具集合。')
const rate = ref(1.0)
const pitch = ref(1.0)
const volume = ref(1.0)
const selectedLang = ref('zh-CN')
const selectedVoice = ref('')
const isPaused = ref(false)
const status = ref('')

const languages = [
  { code: 'zh-CN', label: '中文（普通话）' },
  { code: 'zh-TW', label: '中文（粤语/繁体）' },
  { code: 'en-US', label: '英语（美式）' },
  { code: 'en-GB', label: '英语（英式）' },
  { code: 'ja-JP', label: '日语' },
  { code: 'ko-KR', label: '韩语' },
  { code: 'fr-FR', label: '法语' },
  { code: 'de-DE', label: '德语' },
  { code: 'es-ES', label: '西班牙语' },
  { code: 'ru-RU', label: '俄语' },
]

const allVoices = ref([])

const filteredVoices = computed(() => {
  if (!selectedLang.value) return allVoices.value
  const langPrefix = selectedLang.value.split('-')[0]
  return allVoices.value.filter(v => v.lang.startsWith(langPrefix))
})

function loadVoices() {
  const voices = speechSynthesis.getVoices()
  allVoices.value = voices.map(v => ({
    name: v.name,
    lang: v.lang,
  }))
  if (filteredVoices.value.length && !selectedVoice.value) {
    selectedVoice.value = filteredVoices.value[0].name
  }
}

function updateVoices() {
  loadVoices()
}

onMounted(() => {
  loadVoices()
  speechSynthesis.addEventListener('voiceschanged', loadVoices)
})

onUnmounted(() => {
  speechSynthesis.cancel()
})

function speak() {
  speechSynthesis.cancel()
  isPaused.value = false

  const utter = new SpeechSynthesisUtterance(inputText.value)
  const voice = allVoices.value.find(v => v.name === selectedVoice.value)
  if (voice) utter.voice = voice
  utter.lang = selectedLang.value
  utter.rate = rate.value
  utter.pitch = pitch.value
  utter.volume = volume.value

  utter.onstart = () => { status.value = '🔄 正在朗读…' }
  utter.onend = () => { status.value = '✅ 朗读完成'; isPaused.value = false }
  utter.onerror = (e) => { status.value = '❌ 朗读出错: ' + e.error }
  utter.onpause = () => { status.value = '⏸ 已暂停' }
  utter.onresume = () => { status.value = '🔄 继续朗读…' }

  speechSynthesis.speak(utter)
}

function pauseOrResume() {
  if (isPaused.value) {
    speechSynthesis.resume()
    isPaused.value = false
    status.value = '🔄 继续朗读…'
  } else {
    speechSynthesis.pause()
    isPaused.value = true
    status.value = '⏸ 已暂停'
  }
}

function stopSpeech() {
  speechSynthesis.cancel()
  isPaused.value = false
  status.value = ''
}
</script>

<style scoped>
.tool-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}
.tool-desc {
  color: #888;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}
.input-section {
  margin-bottom: 1rem;
}
.text-area {
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  resize: vertical;
  outline: none;
  font-family: inherit;
  line-height: 1.6;
}
.text-area:focus { border-color: #4f46e5; }
.char-count {
  text-align: right;
  font-size: 0.8rem;
  color: #999;
  margin-top: 0.3rem;
}
.settings {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
}
.setting-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.6rem;
}
.setting-row label {
  min-width: 5rem;
  font-size: 0.9rem;
  color: #555;
}
.val {
  color: #888;
  font-size: 0.85rem;
}
.select-input {
  flex: 1;
  padding: 0.4rem 0.6rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  background: #fff;
  outline: none;
}
.slider {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: #ddd;
  border-radius: 3px;
  outline: none;
}
.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #4f46e5;
  cursor: pointer;
}
.playback-controls {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.btn-play {
  padding: 0.6rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: #4f46e5;
  color: #fff;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-play:hover { background: #4338ca; }
.btn-play:disabled { background: #ccc; cursor: not-allowed; }
.btn-ctrl {
  padding: 0.6rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s;
}
.btn-ctrl:hover { background: #f0f0f0; }
.status-bar {
  padding: 0.5rem 0.8rem;
  background: #f0fdf4;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #166534;
  margin-bottom: 1rem;
}
.back-link {
  display: inline-block;
  margin-top: 1.5rem;
  color: #4f46e5;
  text-decoration: none;
}
.back-link:hover { text-decoration: underline; }
@media (max-width: 640px) {
  .setting-row { flex-wrap: wrap; }
  .setting-row label { min-width: 100%; }
  .slider { width: 100%; }
}
</style>
