<template>
  <div class="tool-page">
    <h2>🛠️ 多功能生成器套件</h2>
    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>

    <div class="tabs">
      <button v-for="tab in tabs" :key="tab.id" :class="['tab-btn', { active: activeTab === tab.id }]" @click="activeTab = tab.id">
        {{ tab.icon }} {{ tab.label }}
      </button>
    </div>

    <!-- 密码生成器 -->
    <div v-if="activeTab === 'password'" class="tab-content">
      <div class="controls">
        <div class="control-row">
          <div class="control-group">
            <label>密码长度 <b>{{ pwLength }}</b></label>
            <input type="range" v-model.number="pwLength" min="4" max="64" />
          </div>
          <div class="control-group">
            <label>生成数量 <b>{{ pwCount }}</b></label>
            <input type="range" v-model.number="pwCount" min="1" max="20" />
          </div>
        </div>
        <div class="check-row">
          <label class="toggle-label"><input type="checkbox" v-model="pwUpper" /> 大写字母 A-Z</label>
          <label class="toggle-label"><input type="checkbox" v-model="pwLower" /> 小写字母 a-z</label>
          <label class="toggle-label"><input type="checkbox" v-model="pwDigits" /> 数字 0-9</label>
          <label class="toggle-label"><input type="checkbox" v-model="pwSymbols" /> 特殊字符 !@#$</label>
          <label class="toggle-label"><input type="checkbox" v-model="pwExcludeAmbiguous" /> 排除易混字符</label>
        </div>
        <button class="btn-primary" @click="generatePasswords">🔑 生成密码</button>
      </div>
      <div v-if="passwords.length" class="result-list">
        <div v-for="(pw, idx) in passwords" :key="idx" class="result-item" @click="copyText(pw)">
          <code>{{ pw }}</code>
          <span class="copy-hint">点击复制</span>
        </div>
      </div>
    </div>

    <!-- UUID 生成器 -->
    <div v-if="activeTab === 'uuid'" class="tab-content">
      <div class="controls">
        <div class="control-group">
          <label>生成数量 <b>{{ uuidCount }}</b></label>
          <input type="range" v-model.number="uuidCount" min="1" max="50" />
        </div>
        <label class="toggle-label"><input type="checkbox" v-model="uuidUpper" /> 大写</label>
        <button class="btn-primary" @click="generateUUIDs">🆔 生成 UUID</button>
      </div>
      <div v-if="uuids.length" class="result-list">
        <div v-for="(u, idx) in uuids" :key="idx" class="result-item" @click="copyText(u)">
          <code>{{ u }}</code>
          <span class="copy-hint">点击复制</span>
        </div>
      </div>
    </div>

    <!-- 中文假文 -->
    <div v-if="activeTab === 'lorem'" class="tab-content">
      <div class="controls">
        <div class="control-row">
          <div class="control-group">
            <label>字数</label>
            <div class="chip-group">
              <button v-for="n in [50, 100, 200, 500]" :key="n" :class="['chip', { active: loremLen === n }]" @click="loremLen = n">{{ n }}</button>
            </div>
          </div>
        </div>
        <button class="btn-primary" @click="generateLorem">📝 生成假文</button>
      </div>
      <div v-if="loremText" class="lorem-output">
        <div class="lorem-header">
          <span>共 {{ loremText.length }} 字</span>
          <button class="btn-copy" @click="copyText(loremText)">📋 复制</button>
        </div>
        <div class="lorem-text">{{ loremText }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

useHead({ title: '多功能生成器套件 - 野火小站' })

const tabs = [
  { id: 'password', icon: '🔑', label: '密码生成器' },
  { id: 'uuid', icon: '🆔', label: 'UUID 生成器' },
  { id: 'lorem', icon: '📝', label: '中文假文' },
]
const activeTab = ref('password')

// Password
const pwLength = ref(16)
const pwCount = ref(5)
const pwUpper = ref(true)
const pwLower = ref(true)
const pwDigits = ref(true)
const pwSymbols = ref(true)
const pwExcludeAmbiguous = ref(false)
const passwords = ref([])

function generatePasswords() {
  let chars = ''
  if (pwUpper.value) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (pwLower.value) chars += 'abcdefghijklmnopqrstuvwxyz'
  if (pwDigits.value) chars += '0123456789'
  if (pwSymbols.value) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'
  if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz'
  if (pwExcludeAmbiguous.value) {
    const amb = 'Il1O0o'
    chars = chars.split('').filter(c => !amb.includes(c)).join('')
  }
  const arr = new Uint32Array(pwLength.value)
  passwords.value = Array.from({ length: pwCount.value }, () => {
    crypto.getRandomValues(arr)
    return Array.from(arr, v => chars[v % chars.length]).join('')
  })
}

// UUID
const uuidCount = ref(5)
const uuidUpper = ref(false)
const uuids = ref([])

function generateUUIDs() {
  uuids.value = Array.from({ length: uuidCount.value }, () => {
    let u = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (crypto.getRandomValues(new Uint8Array(1))[0] % 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
    return uuidUpper.value ? u.toUpperCase() : u
  })
}

// Lorem
const loremLen = ref(100)
const loremText = ref('')

const loremChars = '天地玄黄宇宙洪荒日月盈昃辰宿列张寒来暑往秋收冬藏闰余成岁律吕调阳云腾致雨露结为霜金生丽水玉出昆冈剑号巨阙珠称夜光果珍李柰菜重芥姜海咸河淡鳞潜羽翔龙师火帝鸟官人皇始制文字乃服衣裳推位让国有虞陶唐吊民伐罪周发殷汤坐朝问道垂拱平章爱育黎首臣伏戎羌遐迩一体率宾归王鸣凤在竹白驹食场化被草木赖及万方盖此身发四大五常恭惟鞠养岂敢毁伤女慕贞洁男效才良知过必改得能莫忘罔谈彼短靡恃己长信使可覆器欲难量墨悲丝染诗赞羔羊景行维贤克念作圣德建名立形端表正空谷传声虚堂习听祸因恶积福缘善庆尺璧非宝寸阴是竞资父事君曰严与敬'

function generateLorem() {
  let result = ''
  while (result.length < loremLen.value) {
    const start = Math.floor(Math.random() * (loremChars.length - 10))
    const len = Math.floor(Math.random() * 8) + 4
    let seg = ''
    for (let i = 0; i < len; i++) {
      seg += loremChars[(start + i) % loremChars.length]
    }
    result += seg
    if (Math.random() > 0.7) result += '，'
    if (Math.random() > 0.95) result += '。'
  }
  loremText.value = result.slice(0, loremLen.value).replace(/[，。]$/, '。')
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    // brief feedback handled by browser
  })
}
</script>

<style scoped>
.tool-page { max-width: 800px; margin: 0 auto; padding: 20px; }
.back-link { display: inline-block; margin-bottom: 16px; color: #10b981; text-decoration: none; }
.back-link:hover { text-decoration: underline; }
h2 { color: #1a1a2e; margin-bottom: 20px; }
.tabs { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
.tab-btn { padding: 10px 20px; border: 2px solid #ddd; border-radius: 8px; background: #fff; cursor: pointer; font-size: 14px; transition: all 0.2s; }
.tab-btn:hover { border-color: #22c55e; }
.tab-btn.active { border-color: #22c55e; background: #f0fdf4; color: #22c55e; font-weight: bold; }
.tab-content { animation: fadeIn 0.3s; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.controls { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
.control-row { display: flex; gap: 16px; flex-wrap: wrap; }
.control-group { flex: 1; min-width: 150px; }
.control-group label { display: block; font-size: 14px; color: #555; margin-bottom: 6px; }
.control-group input[type="range"] { width: 100%; accent-color: #22c55e; }
.check-row { display: flex; flex-wrap: wrap; gap: 14px; }
.toggle-label { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 14px; }
.toggle-label input { accent-color: #22c55e; }
.chip-group { display: flex; gap: 6px; }
.chip { padding: 6px 16px; border: 2px solid #ddd; border-radius: 20px; background: #fff; cursor: pointer; font-size: 14px; transition: all 0.2s; }
.chip:hover { border-color: #22c55e; }
.chip.active { border-color: #22c55e; background: #22c55e; color: #fff; }
.btn-primary { padding: 10px 24px; background: #22c55e; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 15px; align-self: flex-start; }
.btn-primary:hover { background: #16a34a; }
.result-list { display: flex; flex-direction: column; gap: 6px; }
.result-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #f8f9fa; border-radius: 8px; cursor: pointer; transition: background 0.2s; }
.result-item:hover { background: #f0fdf4; }
.result-item code { font-family: 'Courier New', monospace; font-size: 15px; word-break: break-all; }
.copy-hint { font-size: 12px; color: #999; white-space: nowrap; margin-left: 12px; }
.lorem-output { background: #f8f9fa; border-radius: 10px; overflow: hidden; }
.lorem-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #555; }
.btn-copy { padding: 6px 14px; background: #10b981; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; }
.btn-copy:hover { background: #059669; }
.lorem-text { padding: 16px; font-size: 15px; line-height: 1.8; color: #333; }
@media (max-width: 600px) { .tool-page { padding: 12px; } .control-row { flex-direction: column; } .check-row { flex-direction: column; gap: 8px; } }
</style>
