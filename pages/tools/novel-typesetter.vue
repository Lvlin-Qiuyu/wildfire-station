<template>
  <div class="tool-page">
    <h2>📖 中文小说排版助手</h2>

    <div class="controls">
      <div class="control-item">
        <label>每行字数</label>
        <input type="range" v-model.number="charsPerLine" min="20" max="60" step="2" />
        <span class="val">{{ charsPerLine }}</span>
      </div>
      <div class="control-item">
        <label>段落间距</label>
        <input type="range" v-model.number="paraSpacing" min="0" max="2" step="0.5" />
        <span class="val">{{ paraSpacing }}em</span>
      </div>
      <div class="control-item">
        <label>字体大小</label>
        <input type="range" v-model.number="fontSize" min="14" max="24" step="1" />
        <span class="val">{{ fontSize }}px</span>
      </div>
    </div>

    <div class="actions-row">
      <label class="check-label"><input type="checkbox" v-model="convertPunctuation" /> 标点修正（英文→中文）</label>
      <label class="check-label"><input type="checkbox" v-model="convertTC" /> 繁体→简体</label>
      <label class="check-label"><input type="checkbox" v-model="convertSC" /> 简体→繁体</label>
      <label class="check-label"><input type="checkbox" v-model="smartParagraph" /> 智能分段</label>
      <label class="check-label"><input type="checkbox" v-model="addIndent" v-once /> 首行缩进</label>
    </div>

    <div class="editor-area">
      <div class="panel">
        <label>原文输入</label>
        <textarea
          v-model="rawText"
          placeholder="粘贴或输入小说文本..."
          rows="16"
        ></textarea>
      </div>
      <div class="panel">
        <label>排版预览</label>
        <button class="btn-copy" @click="copyResult">{{ copyText }}</button>
        <div class="preview-box" :style="previewStyle">
          <div v-for="(para, i) in formattedParagraphs" :key="i" class="preview-para">
            {{ para }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="stats" class="stats-bar">
      <span>段落: <strong>{{ stats.paragraphs }}</strong></span>
      <span>字数: <strong>{{ stats.chars }}</strong></span>
      <span>修正: <strong>{{ stats.fixes }}</strong></span>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '中文小说排版助手 - 野火小站' })

const rawText = ref('')
const charsPerLine = ref(36)
const paraSpacing = ref(1)
const fontSize = ref(18)
const convertPunctuation = ref(true)
const convertTC = ref(false)
const convertSC = ref(false)
const smartParagraph = ref(true)
const addIndent = ref(true)
const copyText = ref('复制排版文本')

const stats = computed(() => {
  if (!rawText.value.trim()) return null
  const paras = formattedParagraphs.value
  const totalChars = rawText.value.replace(/\s/g, '').length
  return {
    paragraphs: paras.length,
    chars: totalChars,
    fixes: fixCount.value,
  }
})

const fixCount = ref(0)

// Simplified / Traditional conversion tables (partial but practical)
const tcToSc = {
  '愛': '爱', '爺': '爷', '說': '说', '學': '学', '過': '过', '對': '对',
  '開': '开', '時': '时', '無': '无', '現': '现', '發': '发', '點': '点',
  '會': '会', '問': '问', '聽': '听', '國': '国', '長': '长', '們': '们',
  '這': '这', '個': '个', '還': '还', '進': '进', '種': '种', '為': '为',
  '話': '话', '讓': '让', '電': '电', '東': '东', '關': '关', '頭': '头',
  '機': '机', '裡': '里', '裏': '里', '門': '门', '傳': '传', '實': '实',
  '書': '书', '場': '场', '飛': '飞', '區': '区', '與': '与', '強': '强',
  '歲': '岁', '歡': '欢', '氣': '气', '風': '风', '萬': '万', '點': '点',
  '親': '亲', '動': '动', '邊': '边', '產': '产', '專': '专', '業': '业',
  '農': '农', '層': '层', '盡': '尽', '當': '当', '從': '从', '兩': '两',
  '來': '来', '備': '备', '節': '节', '貓': '猫', '熱': '热', '處': '处',
  '認': '认', '費': '费', '試': '试', '該': '该', '語': '语', '論': '论',
  '質': '质', '達': '达', '運': '运', '過': '过', '斷': '断', '難': '难',
  '體': '体', '價': '价', '極': '极', '響': '响', '雙': '双', '離': '离',
  '變': '变', '觀': '观', '間': '间', '歷': '历', '豐': '丰', '態': '态',
  '獨': '独', '續': '续', '獲': '获', '務': '务', '壓': '压', '險': '险',
  '導': '导', '齡': '龄', '網': '网', '餘': '余', '標': '标', '滿': '满',
  '確': '确', '麼': '么', '際': '际', '廣': '广', '慶': '庆', '戰': '战',
  '關': '关', '報': '报', '藝': '艺', '輕': '轻', '車': '车', '劍': '剑',
  '擊': '击', '數': '数', '數': '数', '複': '复', '慮': '虑', '感': '感',
  '裝': '装', '轉': '转', '圍': '围', '園': '园', '據': '据', '闖': '闯',
  '靈': '灵', '膽': '胆', '臉': '脸', '繼': '继', '總': '总', '響': '响',
  '畢': '毕', '創': '创', '聯': '联', '貴': '贵', '貧': '贫', '質': '质',
  '購': '购', '證': '证', '護': '护', '誠': '诚', '諾': '诺', '謝': '谢',
  '嚴': '严', '驚': '惊', '態': '态', '舊': '旧', '頭': '头', '見': '见',
  '幾': '几', '乾': '干', '練': '练', '級': '级', '羅': '罗', '討': '讨',
  '僅': '仅', '評': '评', '讀': '读', '課': '课', '調': '调', '財': '财',
  '貿': '贸', '軟': '软', '賣': '卖', '買': '买', '輪': '轮', '進': '进',
  '選': '选', '適': '适', '擇': '择', '樣': '样', '橫': '横', '歐': '欧',
  '歸': '归', '殺': '杀', '蓋': '盖', '築': '筑', '蘭': '兰', '監': '监',
  '盤': '盘', '眾': '众', '範': '范', '與': '与', '豈': '岂', '鹽': '盐',
  '鐵': '铁', '鎖': '锁', '鏡': '镜', '鐘': '钟', '鑽': '钻', '門': '门',
  '閉': '闭', '開': '开', '間': '间', '聞': '闻', '陳': '陈', '陽': '阳',
  '際': '际', '陸': '陆', '隨': '随', '險': '险', '隊': '队', '際': '际',
  '雜': '杂', '雲': '云', '電': '电', '霧': '雾', '靜': '静', '面': '面',
  '韓': '韩', '韻': '韵', '響': '响', '顯': '显', '隱': '隐', '願': '愿',
  '類': '类', '顧': '顾', '顏': '颜', '風': '风', '飛': '飞', '飲': '饮',
  '養': '养', '餓': '饿', '驚': '惊', '馬': '马', '鬼': '鬼', '鬥': '斗',
}

const scToTc = Object.fromEntries(Object.entries(tcToSc).map(([k, v]) => [v, k]))

function fixPunctuation(text) {
  const replacements = [
    [/,/g, '，'], [/\./g, '。'], [/!/g, '！'], [/\?/g, '？'],
    [/;/g, '；'], [/:/g, '：'],
    [/\((?=[^\x00-\x7F])/g, '（'], [/\)(?=[^\x00-\x7F]|$)/g, '）'],
  ]
  let count = 0
  let result = text
  for (const [regex, replacement] of replacements) {
    const matches = result.match(regex)
    if (matches) count += matches.length
    result = result.replace(regex, replacement)
  }
  return { text: result, count }
}

function convertChars(text, table) {
  let count = 0
  let result = ''
  for (const char of text) {
    if (table[char] !== undefined) {
      result += table[char]
      count++
    } else {
      result += char
    }
  }
  return { text: result, count }
}

function smartParagraphSplit(text) {
  // Split by existing newlines first
  let paragraphs = text.split(/\n+/).filter(p => p.trim())

  // If already has good paragraph breaks, use them
  if (paragraphs.length > 3) return paragraphs

  // Otherwise, try to split by dialog patterns
  const result = []
  let current = ''

  for (const char of text) {
    current += char
    // Split before dialog if preceded by description
    if (current.length > 50 && /[。！？\n]/.test(char)) {
      const nextPart = text.slice(current.length, current.length + 3)
      if (nextPart && /[「"『]/.test(nextPart[0])) {
        result.push(current.trim())
        current = ''
      }
    }
  }
  if (current.trim()) result.push(current.trim())

  return result.length > 1 ? result : paragraphs
}

const formattedParagraphs = computed(() => {
  if (!rawText.value.trim()) return []

  let text = rawText.value
  let fixes = 0

  // Convert punctuation
  if (convertPunctuation.value) {
    const r = fixPunctuation(text)
    text = r.text
    fixes += r.count
  }

  // Convert Traditional to Simplified
  if (convertTC.value) {
    const r = convertChars(text, tcToSc)
    text = r.text
    fixes += r.count
  }

  // Convert Simplified to Traditional
  if (convertSC.value) {
    const r = convertChars(text, scToTc)
    text = r.text
    fixes += r.count
  }

  fixCount.value = fixes

  // Smart paragraph split
  let paragraphs = smartParagraph.value
    ? smartParagraphSplit(text)
    : text.split(/\n+/).filter(p => p.trim())

  return paragraphs
})

const previewStyle = computed(() => ({
  fontSize: fontSize.value + 'px',
  maxWidth: (charsPerLine.value * fontSize.value * 0.7) + 'px',
}))

function copyResult() {
  const text = formattedParagraphs.value.join('\n\n')
  navigator.clipboard.writeText(text).then(() => {
    copyText.value = '已复制 ✓'
    setTimeout(() => { copyText.value = '复制排版文本' }, 1500)
  })
}
</script>

<style scoped>
.tool-page {
  padding-top: 0.5rem;
}

h2 {
  font-size: 1.6rem;
  margin-bottom: 1.5rem;
}

.controls {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1rem;
}

.control-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.control-item label {
  font-weight: 600;
  font-size: 0.85rem;
}

.control-item input[type="range"] {
  accent-color: #22c55e;
}

.control-item .val {
  font-family: monospace;
  font-size: 0.8rem;
  color: #22c55e;
  font-weight: 600;
}

.actions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.check-label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  cursor: pointer;
}

.check-label input {
  accent-color: #22c55e;
}

.editor-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.panel {
  display: flex;
  flex-direction: column;
}

.panel label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.panel textarea {
  width: 100%;
  height: 300px;
  padding: 0.8rem;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  font-size: 1rem;
  outline: none;
  resize: vertical;
  box-sizing: border-box;
  line-height: 1.8;
  transition: border-color 0.2s;
}

.panel textarea:focus {
  border-color: #22c55e;
}

.preview-box {
  padding: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  overflow-y: auto;
  max-height: 400px;
  line-height: 1.8;
  font-family: 'Noto Serif SC', 'SimSun', 'STSong', serif;
  color: #333;
  background: #fffef5;
}

.preview-para {
  text-indent: 2em;
  margin-bottom: 1em;
  word-break: break-all;
}

.btn-copy {
  padding: 0.4rem 1rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  align-self: flex-end;
  transition: transform 0.2s;
}

.btn-copy:active {
  transform: scale(0.95);
}

.stats-bar {
  display: flex;
  gap: 1.5rem;
  padding: 0.6rem 1rem;
  background: #f0fdf4;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #555;
}

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #22c55e;
  text-decoration: none;
  font-weight: 600;
}

.back-link:hover {
  text-decoration: underline;
}

@media (max-width: 600px) {
  .editor-area {
    grid-template-columns: 1fr;
  }
  .controls {
    grid-template-columns: 1fr;
  }
}
</style>
