<template>
  <div class="tool-page">
    <h2>📝 Lorem Ipsum 智能文本生成器</h2>
    <p class="tool-desc">英文 Lorem Ipsum 标准词库 + 中文随机段落，参数可调，一键复制</p>

    <!-- 语言切换 -->
    <div class="lang-tabs">
      <button :class="{ active: lang === 'en' }" @click="lang = 'en'">🇬🇧 英文 Lorem</button>
      <button :class="{ active: lang === 'zh' }" @click="lang = 'zh'">🇨🇳 中文随机</button>
    </div>

    <!-- 参数调节 -->
    <div class="params-grid">
      <div class="param-item">
        <label>段落数</label>
        <div class="param-row">
          <input type="range" v-model.number="paraCount" min="1" max="20" />
          <span class="param-val">{{ paraCount }}</span>
        </div>
      </div>
      <div class="param-item">
        <label>每段句子数</label>
        <div class="param-row">
          <input type="range" v-model.number="sentencesPerPara" min="1" max="10" />
          <span class="param-val">{{ sentencesPerPara }}</span>
        </div>
      </div>
      <div class="param-item">
        <label>{{ lang === 'en' ? '每句词数范围' : '每句字数范围' }}</label>
        <div class="range-row">
          <input type="number" v-model.number="wordMin" min="3" max="30" class="num-input" />
          <span>~</span>
          <input type="number" v-model.number="wordMax" min="3" max="30" class="num-input" />
        </div>
      </div>
      <div class="param-item">
        <label>以 "Lorem ipsum..." 开头</label>
        <div class="toggle-row">
          <button :class="['toggle-btn', startWithLorem ? 'on' : '']" @click="startWithLorem = !startWithLorem">
            {{ startWithLorem ? '✅ 是' : '❌ 否' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-bar">
      <button class="btn-primary" @click="generate">🎲 生成文本</button>
      <button class="btn-secondary" @click="copyText">{{ copyTextBtn }}</button>
      <button class="btn-secondary" @click="copyHtml">{{ copyHtmlBtn }}</button>
    </div>

    <!-- 生成结果 -->
    <div v-if="result" class="result-section">
      <div class="result-label">
        <span>生成结果（{{ lang === 'en' ? wordCount : result.length }}字）</span>
        <button class="btn-tiny" @click="result = ''">清空</button>
      </div>
      <!-- 纯文本 -->
      <div class="result-tabs">
        <button :class="{ active: viewMode === 'text' }" @click="viewMode = 'text'">纯文本</button>
        <button :class="{ active: viewMode === 'html' }" @click="viewMode = 'html'">HTML预览</button>
      </div>
      <div v-if="viewMode === 'text'" class="result-box">{{ result }}</div>
      <div v-else class="result-box html-preview" v-html="htmlResult"></div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'Lorem Ipsum 智能文本生成器 - 野火小站' })

const lang = ref('en')
const paraCount = ref(3)
const sentencesPerPara = ref(5)
const wordMin = ref(5)
const wordMax = ref(15)
const startWithLorem = ref(true)
const result = ref('')
const viewMode = ref('text')
const copyTextBtn = ref('📋 复制纯文本')
const copyHtmlBtn = ref('📄 复制HTML')

// 英文 Lorem Ipsum 标准词库
const loremWords = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'perspiciatis', 'unde',
  'omnis', 'iste', 'natus', 'error', 'voluptatem', 'accusantium', 'doloremque',
  'laudantium', 'totam', 'rem', 'aperiam', 'eaque', 'ipsa', 'quae', 'ab', 'illo',
  'inventore', 'veritatis', 'quasi', 'architecto', 'beatae', 'vitae', 'dicta',
  'explicabo', 'nemo', 'ipsam', 'quia', 'voluptas', 'aspernatur', 'aut', 'odit',
  'fugit', 'consequuntur', 'magni', 'dolores', 'eos', 'ratione', 'sequi', 'nesciunt',
  'neque', 'porro', 'quisquam', 'nihil', 'impedit', 'quo', 'minus', 'quod',
  'maxime', 'placeat', 'facere', 'possimus', 'assumenda', 'repellendus', 'temporibus',
  'quibusdam', 'illum', 'corporis', 'suscipit', 'laboriosam', 'distinctio'
]

// 中文随机段落素材
const zhSentences = [
  '在这个信息爆炸的时代，我们每天都被海量的数据所包围，如何从中筛选出真正有价值的信息成为了一项重要的技能。',
  '技术的进步不断改变着我们的生活方式，从智能手机到人工智能，每一次革新都带来了前所未有的便利和挑战。',
  '学习是一种终身的过程，无论我们处于人生的哪个阶段，保持好奇心和求知欲都是推动个人成长的关键因素。',
  '优秀的用户体验设计不仅仅是关于美观的界面，更重要的是要让产品变得直观、易用且令人愉悦。',
  '在团队协作中，沟通是连接每个成员的桥梁，高效的沟通能够减少误解、提高效率并增强团队凝聚力。',
  '数据驱动决策已经成为现代企业管理的核心理念，通过分析数据我们可以更准确地把握市场趋势和用户需求。',
  '创造力并不局限于艺术领域，在科学、工程和商业中，创新的思维方式同样能够带来突破性的解决方案。',
  '时间管理是一门需要不断实践的艺术，合理规划时间、分清轻重缓急可以帮助我们更好地实现个人和职业目标。',
  '开放源代码运动推动了软件行业的快速发展，让全球开发者能够共同协作、共享知识、打造更优秀的产品。',
  '在快节奏的工作环境中，学会适当放松和调节情绪对于保持身心健康和长期的工作效率至关重要。',
  '云计算技术的普及使得企业不再需要大规模的硬件投入，按需使用计算资源大大降低了创业和技术创新的门槛。',
  '好的设计应该是无形的，当用户完全沉浸在任务中而不再注意到界面本身的存在时，设计就真正达到了它的目标。',
  '阅读不仅能够拓宽我们的知识面，还能培养批判性思维能力，帮助我们从多个角度理解和分析复杂的问题。',
  '可持续发展已经从概念走向实践，越来越多的企业和个人开始关注如何在日常生产和生活中减少对环境的影响。',
  '远程办公模式正在重塑传统的工作理念，它打破了地理限制，让全球人才协作变得更加灵活和高效。'
]

// 随机工具函数
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function pick(arr) { return arr[rand(0, arr.length - 1)] }

// 生成英文句子
function genEnSentence(wordCount) {
  const words = Array.from({ length: wordCount }, () => pick(loremWords))
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1)
  return words.join(' ') + '.'
}

// 生成英文段落
function genEnPara(sentenceCount) {
  return Array.from({ length: sentenceCount }, () => genEnSentence(rand(wordMin.value, wordMax.value))).join(' ')
}

// 生成中文段落
function genZhPara(sentenceCount) {
  const sentences = []
  for (let i = 0; i < sentenceCount; i++) {
    sentences.push(pick(zhSentences))
  }
  return sentences.join('')
}

// 英文字数统计
const wordCount = computed(() => {
  if (!result.value) return 0
  return result.value.split(/\s+/).filter(Boolean).length
})

// HTML格式结果
const htmlResult = computed(() => {
  if (!result.value) return ''
  return result.value.split('\n\n').map(p => `<p>${p}</p>`).join('\n')
})

// 生成文本
function generate() {
  const paras = []
  for (let i = 0; i < paraCount.value; i++) {
    if (lang.value === 'en') {
      const para = genEnPara(sentencesPerPara.value)
      paras.push(para)
    } else {
      paras.push(genZhPara(sentencesPerPara.value))
    }
  }
  if (lang.value === 'en' && startWithLorem.value && paras.length > 0) {
    paras[0] = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' + paras[0]
  }
  result.value = paras.join('\n\n')
}

// 复制功能
function copyText() {
  navigator.clipboard.writeText(result.value).then(() => {
    copyTextBtn.value = '已复制 ✓'
    setTimeout(() => { copyTextBtn.value = '📋 复制纯文本' }, 1500)
  })
}

function copyHtml() {
  navigator.clipboard.writeText(htmlResult.value).then(() => {
    copyHtmlBtn.value = '已复制 ✓'
    setTimeout(() => { copyHtmlBtn.value = '📄 复制HTML' }, 1500)
  })
}

// 初始生成
generate()
</script>

<style scoped>
.tool-page { padding-top: 0.5rem; }
h2 { font-size: 1.6rem; margin-bottom: 0.5rem; }
.tool-desc { color: #666; margin-bottom: 1.5rem; font-size: 0.95rem; }

.lang-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
.lang-tabs button {
  padding: 0.6rem 1.2rem; border: 2px solid #e0e0e0; border-radius: 8px;
  background: white; cursor: pointer; font-size: 0.95rem; transition: all 0.2s;
}
.lang-tabs button.active { border-color: #22c55e; background: #f0fdf4; font-weight: 600; }

.params-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;
}
.param-item {
  background: #f8f9fa; border-radius: 10px; padding: 0.8rem 1rem;
}
.param-item label { display: block; font-weight: 600; font-size: 0.85rem; margin-bottom: 0.5rem; }
.param-row { display: flex; align-items: center; gap: 0.8rem; }
.param-row input[type="range"] { flex: 1; accent-color: #22c55e; }
.param-val { min-width: 1.5rem; text-align: center; font-weight: 700; color: #22c55e; font-size: 1.1rem; }

.range-row { display: flex; align-items: center; gap: 0.5rem; }
.num-input {
  width: 60px; padding: 0.4rem 0.6rem; border: 2px solid #e0e0e0; border-radius: 6px;
  font-size: 0.9rem; text-align: center; outline: none;
}
.num-input:focus { border-color: #22c55e; }

.toggle-row { display: flex; }
.toggle-btn {
  padding: 0.4rem 0.8rem; border: 2px solid #e0e0e0; border-radius: 6px;
  background: white; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;
}
.toggle-btn.on { border-color: #22c55e; background: #f0fdf4; }

.action-bar {
  display: flex; gap: 0.8rem; flex-wrap: wrap; margin-bottom: 1.5rem;
}
.btn-primary {
  padding: 0.7rem 1.5rem; background: linear-gradient(135deg, #22c55e, #10b981);
  color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;
}
.btn-primary:hover { opacity: 0.9; }
.btn-secondary {
  padding: 0.7rem 1.2rem; background: white; border: 2px solid #22c55e; color: #22c55e;
  border-radius: 8px; cursor: pointer; font-size: 0.95rem; transition: all 0.2s;
}
.btn-secondary:hover { background: #f0fdf4; }
.btn-secondary:active { transform: scale(0.95); }

.result-section { margin-bottom: 1.5rem; }
.result-label {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 0.5rem; font-weight: 600; font-size: 0.9rem;
}
.btn-tiny {
  background: none; border: none; color: #999; cursor: pointer; font-size: 0.85rem;
}
.btn-tiny:hover { color: #ef4444; }

.result-tabs { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
.result-tabs button {
  padding: 0.4rem 0.8rem; border: 2px solid #e0e0e0; border-radius: 6px;
  background: white; cursor: pointer; font-size: 0.85rem; transition: all 0.2s;
}
.result-tabs button.active { border-color: #22c55e; background: #f0fdf4; font-weight: 600; }

.result-box {
  background: #f8f9fa; padding: 1.2rem; border-radius: 10px; border: 1px solid #e9ecef;
  font-size: 0.95rem; line-height: 1.8; white-space: pre-wrap; max-height: 500px;
  overflow-y: auto; font-family: 'Georgia', serif;
}
.html-preview { white-space: normal; }
.html-preview :deep(p) { margin-bottom: 1em; }

.back-link { display: inline-block; margin-top: 2rem; color: #22c55e; text-decoration: none; font-weight: 600; }
.back-link:hover { text-decoration: underline; }

@media (max-width: 600px) {
  .params-grid { grid-template-columns: 1fr; }
  .action-bar { flex-direction: column; }
  .action-bar button { width: 100%; }
}
</style>
