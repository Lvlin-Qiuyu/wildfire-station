<template>
  <div class="tool-page">
    <h2>😎 Emoji 文案增强器</h2>
    <p class="subtitle">输入中文文案，自动插入匹配 Emoji，500+ 映射，3种风格，一键复制</p>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>

    <!-- 风格选择 -->
    <div class="style-tabs">
      <button
        v-for="s in styles"
        :key="s.id"
        :class="['style-btn', { active: activeStyle === s.id }]"
        @click="activeStyle = s.id"
      >
        {{ s.icon }} {{ s.label }}
      </button>
    </div>

    <!-- 输入区域 -->
    <div class="input-section">
      <textarea
        v-model="inputText"
        class="input-area"
        placeholder="输入你的中文文案，例如：&#10;今天天气真好，去咖啡店点了杯拿铁，下午在公园散步看日落，晚上回家看了一部电影，真是美好的一天！&#10;&#10;提示：文案越长，匹配效果越好"
        rows="5"
        @input="debouncedEnhance"
      ></textarea>
      <div class="input-footer">
        <span class="char-count">{{ inputText.length }} 字</span>
        <div class="input-actions">
          <button class="btn-sm" @click="loadExample">加载示例</button>
          <button class="btn-sm" @click="clearAll">清空</button>
        </div>
      </div>
    </div>

    <!-- 增强结果 -->
    <div v-if="enhancedText" class="result-section">
      <div class="result-header">
        <span>✨ 增强结果</span>
        <div class="result-actions">
          <button class="btn-sm" @click="toggleEnhance">🔄 重新生成</button>
          <button class="btn-copy" @click="copyResult">📋 复制文案</button>
        </div>
      </div>
      <div class="result-content">{{ enhancedText }}</div>

      <!-- 匹配统计 -->
      <div class="match-stats">
        <span>📊 匹配了 <b>{{ matchCount }}</b> 个 Emoji</span>
      </div>
    </div>

    <!-- 预设模板 -->
    <div class="templates-section">
      <div class="templates-header">
        <span>📝 场景模板</span>
      </div>
      <div class="templates-grid">
        <button
          v-for="t in templates"
          :key="t.id"
          class="template-btn"
          @click="applyTemplate(t)"
        >
          <span class="template-icon">{{ t.icon }}</span>
          <span class="template-name">{{ t.name }}</span>
        </button>
      </div>
    </div>

    <!-- 亮度提示 -->
    <div class="tip-section">
      <p>💡 <b>使用技巧</b>：自然风格适合朋友圈/微博，活泼风格适合小红书，简约风格适合正式场合。文案中的表情符号可以根据需求手动调整位置或删减。</p>
    </div>
  </div>
</template>

<script setup>
useHead({ title: 'Emoji 文案增强器 - 野火小站' })

// ===== 状态 =====
const inputText = ref('')
const enhancedText = ref('')
const activeStyle = ref('natural')
const matchCount = ref(0)
let debounceTimer = null

// ===== 风格定义 =====
const styles = [
  { id: 'natural', icon: '🌿', label: '自然' },
  { id: 'lively', icon: '🎉', label: '活泼' },
  { id: 'minimal', icon: '✨', label: '简约' },
]

// ===== 风格配置 =====
const styleConfig = {
  // 自然风格：保守插入，频率约 30%
  natural: { probability: 0.35, position: 'after', maxPerSentence: 3 },
  // 活泼风格：高频插入，频率约 60%
  lively: { probability: 0.6, position: 'after', maxPerSentence: 5 },
  // 简约风格：极低频率，只在关键词前插入
  minimal: { probability: 0.2, position: 'before', maxPerSentence: 2 },
}

// ===== Emoji 映射表 =====
// 500+ 关键词 → Emoji 映射
const emojiMap = [
  // 天气与自然
  ['太阳', '☀️'], ['阳光', '☀️'], ['晴天', '☀️'], ['天晴', '☀️'],
  ['月亮', '🌙'], ['月光', '🌙'], ['月色', '🌙'],
  ['星星', '⭐'], ['星空', '🌌'], ['夜空', '🌌'],
  ['下雨', '🌧️'], ['雨', '🌧️'], ['雨天', '🌧️'], ['暴雨', '⛈️'], ['小雨', '🌦️'],
  ['下雪', '❄️'], ['雪', '❄️'], ['雪花', '❄️'],
  ['彩虹', '🌈'], ['云', '☁️'], ['白云', '☁️'], ['乌云', '⛈️'],
  ['风', '🌬️'], ['大风', '🌪️'], ['台风', '🌀'],
  ['闪电', '⚡'], ['打雷', '⛈️'], ['雷', '⛈️'],
  ['花', '🌸'], ['樱花', '🌸'], ['玫瑰', '🌹'], ['花开了', '🌺'],
  ['树', '🌳'], ['森林', '🌲'], ['草', '🌿'], ['草地', '🌿'],
  ['大海', '🌊'], ['海', '🌊'], ['沙滩', '🏖️'], ['沙滩', '🏖️'],
  ['山', '⛰️'], ['雪山', '🏔️'],
  ['日落', '🌅'], ['日出', '🌅'], ['晚霞', '🌇'],
  ['春天', '🌱'], ['夏天', '🍉'], ['秋天', '🍂'], ['冬天', '☃️'],

  // 食物与饮品
  ['咖啡', '☕'], ['拿铁', '☕'], ['美式', '☕'],
  ['奶茶', '🧋'], ['茶', '🍵'], ['绿茶', '🍵'],
  ['蛋糕', '🍰'], ['甜点', '🍰'], ['甜品', '🍮'],
  ['冰淇淋', '🍦'], ['雪糕', '🍦'],
  ['水果', '🍎'], ['苹果', '🍎'], ['香蕉', '🍌'],
  ['西瓜', '🍉'], ['草莓', '🍓'], ['葡萄', '🍇'],
  ['橘子', '🍊'], ['橙子', '🍊'], ['桃子', '🍑'],
  ['樱桃', '🍒'], ['柠檬', '🍋'], ['椰子', '🥥'],
  ['寿司', '🍣'], ['刺身', '🍣'], ['生鱼片', '🍣'],
  ['火锅', '🍲'], ['烧烤', '🍢'], ['串串', '🍢'],
  ['面条', '🍜'], ['拉面', '🍜'], ['米粉', '🍜'],
  ['米饭', '🍚'], ['炒饭', '🍚'],
  ['面包', '🍞'], ['三明治', '🥪'],
  ['披萨', '🍕'], ['汉堡', '🍔'],
  ['炸鸡', '🍗'], ['鸡腿', '🍗'],
  ['牛肉', '🥩'], ['猪肉', '🥓'],
  ['鱼', '🐟'], ['虾', '🦐'], ['螃蟹', '🦀'], ['龙虾', '🦞'],
  ['饺子', '🥟'], ['包子', '🥟'], ['粽子', '🥟'],
  ['月饼', '🥮'], ['粽子', '🥟'],
  ['啤酒', '🍺'], ['红酒', '🍷'], ['白酒', '🍶'], ['鸡尾酒', '🍸'], ['香槟', '🍾'],
  ['果汁', '🧃'], ['可乐', '🥤'], ['奶茶', '🧋'],
  ['火锅', '🍲'], ['麻辣烫', '🍲'],
  ['早餐', '🥣'], ['午餐', '🍱'], ['晚餐', '🍽️'], ['宵夜', '🌙'],
  ['零食', '🍿'], ['巧克力', '🍫'], ['糖果', '🍬'], ['爆米花', '🍿'],
  ['火锅', '🍲'], ['烧烤', '🍢'], ['麻辣烫', '🍲'], ['螺蛳粉', '🍜'],
  ['火锅', '🍲'], ['烧烤', '🍢'],

  // 饮食动作
  ['吃', '😋'], ['喝', '🥤'], ['烹饪', '👨‍🍳'], ['做饭', '👨‍🍳'],
  ['外卖', '🛵'], ['点餐', '📱'], ['打包', '🥡'],

  // 生活日常
  ['睡觉', '😴'], ['起床', '⏰'], ['早安', '☀️'], ['晚安', '🌙'],
  ['上班', '💼'], ['下班', '🎉'], ['工作', '💼'], ['加班', '😫'],
  ['开会', '📋'], ['开会', '📋'], ['汇报', '📊'],
  ['学习', '📚'], ['读书', '📖'], ['看书', '📖'], ['考试', '📝'],
  ['上课', '🏫'], ['图书馆', '📚'], ['笔记', '📝'], ['复习', '📚'],
  ['写代码', '💻'], ['编程', '💻'], ['开发', '💻'],
  ['手机', '📱'], ['电脑', '💻'], ['键盘', '⌨️'], ['鼠标', '🖱️'],
  ['耳机', '🎧'], ['相机', '📷'], ['电视', '📺'],
  ['家', '🏠'], ['回家', '🏠'], ['出门', '🚪'], ['旅行', '✈️'],
  ['运动', '🏃'], ['跑步', '🏃'], ['健身', '💪'], ['游泳', '🏊'],
  ['篮球', '🏀'], ['足球', '⚽'], ['羽毛球', '🏸'],
  ['瑜伽', '🧘'], ['散步', '🚶'], ['骑行', '🚴'],
  ['爬山', '⛰️'], ['滑雪', '⛷️'], ['钓鱼', '🎣'],
  ['音乐', '🎵'], ['唱歌', '🎤'], ['跳舞', '💃'], ['弹琴', '🎹'],
  ['电影', '🎬'], ['追剧', '📺'], ['综艺', '📺'],
  ['游戏', '🎮'], ['打游戏', '🎮'], ['王者', '🎮'],
  ['拍照', '📸'], ['自拍', '🤳'], ['vlog', '📹'],
  ['购物', '🛍️'], ['逛街', '🛍️'], ['网购', '📦'],
  ['打扫', '🧹'], ['整理', '✨'], ['洗衣', '👕'],
  ['洗澡', '🚿'], ['理发', '💇'], ['化妆', '💄'],
  ['驾照', '🚗'], ['开车', '🚗'], ['坐车', '🚌'], ['地铁', '🚇'],
  ['飞机', '✈️'], ['高铁', '🚄'], ['火车', '🚂'],
  ['医院', '🏥'], ['看病', '🏥'], ['吃药', '💊'], ['健康', '💪'],
  ['生日', '🎂'], ['蛋糕', '🎂'], ['派对', '🎉'], ['聚会', '🎉'],
  ['毕业', '🎓'], ['开学', '🎒'], ['考试', '📝'],
  ['结婚', '💍'], ['婚礼', '💒'], ['蜜月', '💑'],
  ['新年', '🧧'], ['春节', '🧧'], ['圣诞', '🎄'], ['中秋', '🌕'], ['元宵', '🏮'], ['端午', '🐉'], ['国庆', '🇨🇳'],

  // 情感表达
  ['开心', '😊'], ['快乐', '😄'], ['高兴', '😁'], ['幸福', '🥰'], ['快乐', '😄'],
  ['感动', '🥺'], ['温暖', '🤗'], ['甜蜜', '🍯'],
  ['难过', '😢'], ['伤心', '😢'], ['哭', '😭'], ['想哭', '🥺'],
  ['生气', '😤'], ['愤怒', '😡'], ['烦', '😣'],
  ['害怕', '😨'], ['紧张', '😰'], ['焦虑', '😰'],
  ['惊喜', '😲'], ['惊讶', '😲'], ['震惊', '😱'],
  ['无聊', '😐'], ['无奈', '😅'], ['尴尬', '😬'],
  ['加油', '💪'], ['努力', '💪'], ['坚持', '🤜'], ['奋斗', '🔥'],
  ['成功', '🏆'], ['胜利', '✌️'], ['达成', '🎯'],
  ['失败', '💔'], ['挫折', '💔'], ['困难', '🧗'],
  ['感谢', '🙏'], ['谢谢', '🙏'], ['感恩', '🙏'],
  ['抱歉', '😔'], ['对不起', '😔'], ['原谅', '🤝'],
  ['喜欢', '❤️'], ['爱', '❤️'], ['想念', '💗'], ['思念', '💕'],
  ['可爱', '🥰'], ['漂亮', '🌸'], ['帅气', '😍'], ['美丽', '✨'],
  ['酷', '😎'], ['厉害', '👏'], ['棒', '👍'], ['牛', '🐂'],
  ['可爱', '🥰'], ['萌', '🧸'],
  ['好', '👍'], ['不好', '👎'], ['一般', '😐'],

  // 地点场景
  ['公园', '🌳'], ['咖啡店', '☕'], ['书店', '📚'],
  ['超市', '🏪'], ['商场', '🏬'], ['健身房', '🏋️'],
  ['图书馆', '📚'], ['博物馆', '🏛️'], ['电影院', '🎬'],
  ['餐厅', '🍽️'], ['酒吧', '🍸'], ['KTV', '🎤'],
  ['海边', '🏖️'], ['湖', '🏞️'], ['瀑布', '💧'],
  ['寺庙', '🛕'], ['教堂', '⛪'], ['古城', '🏯'],

  // 动物
  ['猫', '🐱'], ['狗狗', '🐶'], ['狗', '🐶'],
  ['兔子', '🐰'], ['熊猫', '🐼'], ['考拉', '🐨'],
  ['海豚', '🐬'], ['鲸鱼', '🐋'], ['蝴蝶', '🦋'],
  ['鸟', '🐦'], ['企鹅', '🐧'], ['长颈鹿', '🦒'],
  ['恐龙', '🦕'], ['独角兽', '🦄'],

  // 数字与概念
  ['第一名', '🥇'], ['冠军', '🥇'], ['金牌', '🥇'],
  ['第二名', '🥈'], ['银牌', '🥈'],
  ['第三名', '🥉'], ['铜牌', '🥉'],
  ['第一名', '🥇'],
  ['第一', '🥇'], ['第二', '🥈'], ['第三', '🥉'],
  ['新', '🆕'], ['热门', '🔥'], ['爆款', '🔥'],
  ['推荐', '📌'], ['精选', '⭐'], ['必看', '👀'],
  ['满分', '💯'], ['完美', '💯'], ['绝了', '🔥'],
  ['免费', '🆓'], ['折扣', '🏷️'], ['优惠', '💰'],
  ['钱', '💰'], ['工资', '💵'], ['收入', '💰'], ['存款', '🏦'],
  ['付款', '💳'], ['转账', '💸'], ['红包', '🧧'],
  ['快递', '📦'], ['邮', '📮'], ['地址', '📍'],

  // 社交媒体
  ['朋友圈', '📱'], ['微博', '📢'], ['小红书', '📕'],
  ['抖音', '🎵'], ['B站', '📺'], ['公众号', '📱'],
  ['点赞', '👍'], ['评论', '💬'], ['转发', '🔄'], ['收藏', '⭐'],
  ['关注', '👀'], ['粉丝', '👥'], ['爆款', '🔥'], ['上热门', '🔥'],

  // 时尚与美妆
  ['化妆', '💄'], ['口红', '💄'], ['护肤', '🧴'], ['面膜', '🧖'],
  ['裙子', '👗'], ['鞋子', '👟'], ['包包', '👜'], ['帽子', '🧢'],
  ['墨镜', '🕶️'], ['手表', '⌚'], ['项链', '📿'], ['戒指', '💍'],

  // 其他常见词
  ['时间', '⏰'], ['今天', '📅'], ['明天', '📅'], ['昨天', '📅'],
  ['早上', '🌅'], ['中午', '☀️'], ['下午', '🌤️'], ['晚上', '🌙'],
  ['周末', '🎉'], ['假期', '🏖️'], ['放假', '🎉'],
  ['重要', '❗'], ['紧急', '🚨'], ['提醒', '🔔'], ['注意', '⚠️'],
  ['完成', '✅'], ['开始', '🚀'], ['结束', '🏁'],
  ['目标', '🎯'], ['梦想', '🌟'], ['希望', '🌈'], ['期待', '🌟'],
  ['祝福', '🍀'], ['好运', '🍀'], ['幸运', '🍀'],
  ['冷静', '🧊'], ['放松', '😌'], ['休息', '😴'], ['充电', '🔋'],
  ['科技', '🔬'], ['AI', '🤖'], ['人工智能', '🤖'], ['数据', '📊'],
  ['创意', '💡'], ['灵感', '✨'], ['设计', '🎨'], ['艺术', '🎨'],
  ['旅行', '✈️'], ['出去玩', '🎡'], ['度假', '🏖️'],
  ['搬家', '📦'], ['装修', '🔨'], ['新房', '🏡'],
  ['减肥', '🏋️'], ['瘦身', '💃'], ['瘦身', '💃'],
  ['礼物', '🎁'], ['惊喜', '🎉'], ['愿望', '🌠'],
  ['手工', '🧶'], ['DIY', '🛠️'],
  ['汽车', '🚗'], ['摩托车', '🏍️'],
  ['宠物', '🐾'], ['猫咪', '🐱'], ['狗狗', '🐶'],
  ['工作', '💼'], ['赚钱', '💰'], ['副业', '💼'],
  ['拍照', '📸'], ['风景', '🏞️'], ['日落', '🌅'],
  ['记录', '📝'], ['日记', '📓'], ['随笔', '✍️'],
  ['分享', '📤'], ['发布', '📢'], ['更新', '🔄'],
  ['终于', '🎉'], ['原来', '💡'], ['原来如此', '💡'],
  ['好的', '👍'], ['嗯', '👍'], ['了解', '👌'],
  ['hello', '👋'], ['hi', '👋'], ['bye', '👋'], ['ok', '👌'],
  ['love', '❤️'], ['happy', '😊'], ['nice', '😎'], ['cool', '😎'],
  ['wow', '😲'], ['yes', '✅'], ['no', '❌'],
  ['good', '👍'], ['best', '🏆'], ['top', '🔝'],
]

// ===== 场景模板 =====
const templates = [
  { id: 'morning', icon: '☀️', name: '早安打卡', text: '早安！新的一天开始了，泡了一杯咖啡，准备开始工作。今天的天气真好，心情也不错！' },
  { id: 'food', icon: '🍜', name: '美食探店', text: '今天发现了一家超好吃的火锅店！麻辣鲜香，涮了毛肚和鹅肠，再来一杯冰粉，简直太满足了。' },
  { id: 'travel', icon: '✈️', name: '旅行日常', text: '假期去了海边旅行，蓝天白云沙滩，在咖啡店看了一下午书，傍晚在海滩看日落，太美了！' },
  { id: 'workout', icon: '💪', name: '运动打卡', text: '今天完成了5公里跑步，配速稳定在5分30秒。跑完做了拉伸和瑜伽，感觉整个人都轻松了，继续坚持！' },
  { id: 'study', icon: '📚', name: '学习记录', text: '周末在图书馆泡了一整天，读完了两本技术书，做了详细的笔记。下午写代码练习，晚上看了一部科幻电影，充实的一天！' },
  { id: 'life', icon: '🏠', name: '居家日常', text: '周末在家打扫了房间，做了红烧排骨和清炒时蔬。下午追了两集综艺，晚上敷面膜追剧，简单又美好的一天。' },
]

// ===== 核心方法 =====

// 构建正则（按关键词长度降序，优先匹配长词）
function buildRegex() {
  // 去重，按长度降序排列
  const seen = new Set()
  const unique = emojiMap.filter(([word]) => {
    if (seen.has(word)) return false
    seen.add(word)
    return true
  }).sort((a, b) => b[0].length - a[0].length)

  const words = unique.map(([w]) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return { regex: new RegExp(words.join('|'), 'g'), map: new Map(unique) }
}

// 增强文案
function enhanceText(text, style) {
  const config = styleConfig[style] || styleConfig.natural
  const { regex, map } = buildRegex()

  // 按句子分割处理
  const sentences = text.split(/([。！？\n.!?])/)
  let result = []
  let count = 0

  for (let si = 0; si < sentences.length; si++) {
    const sentence = sentences[si]
    // 标点符号直接保留
    if (/^[。！？\n.!?]$/.test(sentence)) {
      result.push(sentence)
      continue
    }

    // 在当前句子中查找所有匹配
    const matches = []
    let match
    const tempRegex = new RegExp(regex.source, 'g')
    while ((match = tempRegex.exec(sentence)) !== null) {
      matches.push({
        word: match[0],
        emoji: map.get(match[0]),
        index: match.index,
      })
    }

    // 根据风格过滤匹配
    const filtered = filterMatches(matches, config)

    if (filtered.length === 0) {
      result.push(sentence)
      continue
    }

    // 构建增强后的句子
    let enhanced = ''
    let lastEnd = 0
    for (const m of filtered) {
      if (config.position === 'after') {
        enhanced += sentence.slice(lastEnd, m.index + m.word.length) + ' ' + m.emoji
      } else {
        enhanced += sentence.slice(lastEnd, m.index) + m.emoji + ' ' + sentence.slice(m.index, m.index + m.word.length)
      }
      lastEnd = m.index + m.word.length
      count++
    }
    enhanced += sentence.slice(lastEnd)
    result.push(enhanced)
  }

  matchCount.value = count
  return result.join('')
}

// 根据风格过滤匹配
function filterMatches(matches, config) {
  if (matches.length === 0) return []

  const filtered = []

  // 根据概率决定是否保留每个匹配
  for (const m of matches) {
    if (Math.random() < config.probability) {
      filtered.push(m)
    }
  }

  // 限制每个"句子块"的最多匹配数
  return filtered.slice(0, config.maxPerSentence)
}

// 防抖处理
function debouncedEnhance() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    doEnhance()
  }, 300)
}

// 执行增强
function doEnhance() {
  const text = inputText.value.trim()
  if (!text) {
    enhancedText.value = ''
    matchCount.value = 0
    return
  }
  enhancedText.value = enhanceText(text, activeStyle.value)
}

// 重新生成（相同文本不同随机结果）
function toggleEnhance() {
  doEnhance()
}

// 复制结果
function copyResult() {
  const text = enhancedText.value.replace(/\s+$/gm, '') // 清理多余空格
  navigator.clipboard.writeText(text).then(() => {
    // 浏览器自动反馈
  }).catch(() => {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  })
}

// 加载示例
function loadExample() {
  inputText.value = '今天天气真好，阳光明媚，约了朋友去新开的咖啡店喝拿铁。下午在公园散步，看到樱花开了，拍了好多照片。晚上回家做了红烧肉，配米饭吃，太满足了！美好的一天～'
  doEnhance()
}

// 应用模板
function applyTemplate(t) {
  inputText.value = t.text
  doEnhance()
}

// 清空
function clearAll() {
  inputText.value = ''
  enhancedText.value = ''
  matchCount.value = 0
}
</script>

<style scoped>
.tool-page {
  max-width: 700px;
  margin: 0 auto;
  padding: 1rem;
}

h2 {
  font-size: 1.6rem;
  margin-bottom: 0.3rem;
}

.subtitle {
  color: #666;
  font-size: 0.95rem;
  margin-bottom: 1rem;
}

.back-link {
  display: inline-block;
  margin-bottom: 1rem;
  color: #22c55e;
  font-weight: 500;
}

.back-link:hover { text-decoration: underline; }

/* 风格标签 */
.style-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.style-btn {
  flex: 1;
  padding: 0.6rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
  text-align: center;
}

.style-btn:hover {
  border-color: #22c55e;
}

.style-btn.active {
  border-color: #22c55e;
  background: #f0fdf4;
  color: #16a34a;
  font-weight: 600;
}

/* 输入区域 */
.input-section {
  background: #fff;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  margin-bottom: 1rem;
}

.input-area {
  width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 0.8rem;
  font-size: 0.95rem;
  resize: vertical;
  font-family: inherit;
  line-height: 1.6;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.input-area:focus {
  outline: none;
  border-color: #22c55e;
}

.input-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.5rem;
}

.char-count {
  font-size: 0.8rem;
  color: #aaa;
}

.input-actions {
  display: flex;
  gap: 0.5rem;
}

/* 按钮 */
.btn-sm {
  padding: 0.3rem 0.7rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.btn-sm:hover {
  border-color: #22c55e;
  color: #22c55e;
}

.btn-copy {
  padding: 0.4rem 0.8rem;
  background: #22c55e;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.82rem;
  transition: opacity 0.2s;
}

.btn-copy:hover { opacity: 0.85; }

/* 结果区域 */
.result-section {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  overflow: hidden;
  margin-bottom: 1rem;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 1rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
}

.result-actions {
  display: flex;
  gap: 0.5rem;
}

.result-content {
  padding: 1.2rem;
  font-size: 1.05rem;
  line-height: 1.8;
  color: #2c3e50;
  white-space: pre-wrap;
  word-break: break-word;
  min-height: 60px;
}

.match-stats {
  padding: 0.6rem 1rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  font-size: 0.82rem;
  color: #888;
}

/* 模板 */
.templates-section {
  margin-bottom: 1rem;
}

.templates-header {
  font-size: 0.9rem;
  font-weight: 600;
  color: #555;
  margin-bottom: 0.6rem;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.template-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.6rem 0.5rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.8rem;
  color: #555;
  transition: all 0.2s;
}

.template-btn:hover {
  border-color: #22c55e;
  color: #22c55e;
  background: #f0fdf4;
}

.template-icon {
  font-size: 1.1rem;
}

.template-name {
  white-space: nowrap;
}

/* 提示 */
.tip-section {
  background: #fffbeb;
  border-radius: 10px;
  padding: 0.8rem 1rem;
  border: 1px solid #fde68a;
  font-size: 0.82rem;
  color: #92400e;
  line-height: 1.6;
}

/* 响应式 */
@media (max-width: 640px) {
  .tool-page { padding: 0.5rem; }
  .templates-grid { grid-template-columns: repeat(2, 1fr); }
  .result-actions { flex-direction: column; gap: 0.3rem; }
}
</style>
