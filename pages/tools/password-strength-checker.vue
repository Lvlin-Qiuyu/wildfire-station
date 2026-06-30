<template>
  <div class="tool-page">
    <h2>🔒 密码强度检测器</h2>
    <p class="subtitle">分析密码安全性，检测弱密码、连续字符、重复模式，估算暴力破解时间</p>

    <!-- 密码输入 -->
    <div class="input-section">
      <div class="password-wrap">
        <input
          :type="showPassword ? 'text' : 'password'"
          v-model="password"
          placeholder="输入要检测的密码..."
          class="password-input"
          @input="analyze"
        />
        <button class="btn-toggle" @click="showPassword = !showPassword" :title="showPassword ? '隐藏密码' : '显示密码'">
          {{ showPassword ? '🙈' : '👁️' }}
        </button>
      </div>
    </div>

    <!-- 强度条 -->
    <div v-if="password" class="strength-section">
      <div class="strength-bar-wrap">
        <div class="strength-bar">
          <div
            class="strength-fill"
            :style="{ width: strengthPercent + '%', background: strengthColor }"
          ></div>
        </div>
        <span class="strength-label" :style="{ color: strengthColor }">{{ strengthLabel }}</span>
        <span class="strength-score">{{ score }} / 100</span>
      </div>
    </div>

    <!-- 评分详情 -->
    <div v-if="password" class="detail-section">
      <h3>评分详情</h3>
      <div class="detail-grid">
        <!-- 密码长度 -->
        <div class="detail-card" :class="{ good: scoreDetails.lengthScore > 0 }">
          <div class="detail-icon">{{ scoreDetails.lengthScore > 0 ? '✅' : '❌' }}</div>
          <div class="detail-info">
            <span class="detail-name">密码长度</span>
            <span class="detail-desc">{{ password.length }} 个字符（{{ lengthDesc }}）</span>
          </div>
          <span class="detail-points">+{{ scoreDetails.lengthScore }}</span>
        </div>

        <!-- 大写字母 -->
        <div class="detail-card" :class="{ good: scoreDetails.hasUpper }">
          <div class="detail-icon">{{ scoreDetails.hasUpper ? '✅' : '❌' }}</div>
          <div class="detail-info">
            <span class="detail-name">大写字母</span>
            <span class="detail-desc">{{ scoreDetails.hasUpper ? '包含大写字母' : '缺少大写字母' }}</span>
          </div>
          <span class="detail-points">+{{ scoreDetails.upperScore }}</span>
        </div>

        <!-- 小写字母 -->
        <div class="detail-card" :class="{ good: scoreDetails.hasLower }">
          <div class="detail-icon">{{ scoreDetails.hasLower ? '✅' : '❌' }}</div>
          <div class="detail-info">
            <span class="detail-name">小写字母</span>
            <span class="detail-desc">{{ scoreDetails.hasLower ? '包含小写字母' : '缺少小写字母' }}</span>
          </div>
          <span class="detail-points">+{{ scoreDetails.lowerScore }}</span>
        </div>

        <!-- 数字 -->
        <div class="detail-card" :class="{ good: scoreDetails.hasDigit }">
          <div class="detail-icon">{{ scoreDetails.hasDigit ? '✅' : '❌' }}</div>
          <div class="detail-info">
            <span class="detail-name">数字</span>
            <span class="detail-desc">{{ scoreDetails.hasDigit ? '包含数字' : '缺少数字' }}</span>
          </div>
          <span class="detail-points">+{{ scoreDetails.digitScore }}</span>
        </div>

        <!-- 特殊字符 -->
        <div class="detail-card" :class="{ good: scoreDetails.hasSpecial }">
          <div class="detail-icon">{{ scoreDetails.hasSpecial ? '✅' : '❌' }}</div>
          <div class="detail-info">
            <span class="detail-name">特殊字符</span>
            <span class="detail-desc">{{ scoreDetails.specialCount > 0 ? `${scoreDetails.specialCount} 个特殊字符` : '缺少特殊字符' }}</span>
          </div>
          <span class="detail-points">+{{ scoreDetails.specialScore }}</span>
        </div>

        <!-- 连续字符 -->
        <div class="detail-card" :class="{ warn: scoreDetails.sequentialCount > 0 }">
          <div class="detail-icon">{{ scoreDetails.sequentialCount > 0 ? '⚠️' : '✅' }}</div>
          <div class="detail-info">
            <span class="detail-name">连续字符</span>
            <span class="detail-desc">{{ scoreDetails.sequentialCount > 0 ? `检测到 ${scoreDetails.sequentialCount} 组连续字符` : '未检测到连续字符' }}</span>
          </div>
          <span class="detail-points penalty">{{ scoreDetails.sequentialPenalty }}</span>
        </div>

        <!-- 重复字符 -->
        <div class="detail-card" :class="{ warn: scoreDetails.repeatCount > 0 }">
          <div class="detail-icon">{{ scoreDetails.repeatCount > 0 ? '⚠️' : '✅' }}</div>
          <div class="detail-info">
            <span class="detail-name">重复字符</span>
            <span class="detail-desc">{{ scoreDetails.repeatCount > 0 ? `检测到 ${scoreDetails.repeatCount} 组重复字符` : '未检测到重复字符' }}</span>
          </div>
          <span class="detail-points penalty">{{ scoreDetails.repeatPenalty }}</span>
        </div>

        <!-- 常见弱密码 -->
        <div class="detail-card" :class="{ bad: scoreDetails.isCommon }">
          <div class="detail-icon">{{ scoreDetails.isCommon ? '🚨' : '✅' }}</div>
          <div class="detail-info">
            <span class="detail-name">常见弱密码</span>
            <span class="detail-desc">{{ scoreDetails.isCommon ? '该密码在常见弱密码列表中' : '不是常见弱密码' }}</span>
          </div>
          <span class="detail-points penalty">{{ scoreDetails.commonPenalty }}</span>
        </div>
      </div>
    </div>

    <!-- 暴力破解时间 -->
    <div v-if="password && crackTime" class="crack-section">
      <h3>暴力破解时间估算</h3>
      <div class="crack-card">
        <div class="crack-icon">⏱️</div>
        <div class="crack-info">
          <span class="crack-label">假设攻击速度：{{ crackTime.speed }}</span>
          <span class="crack-value">{{ crackTime.display }}</span>
        </div>
      </div>
      <div class="crack-note">基于字符集大小（{{ crackTime.charsetSize }} 个字符）和密码长度（{{ password.length }} 个字符）估算</div>
    </div>

    <!-- 改进建议 -->
    <div v-if="password && suggestions.length > 0" class="suggestions-section">
      <h3>改进建议</h3>
      <div class="suggestion-list">
        <div v-for="(s, i) in suggestions" :key="i" class="suggestion-item">
          <span class="suggestion-icon">💡</span>
          <span class="suggestion-text">{{ s }}</span>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '密码强度检测器 - 野火小站' })

const password = ref('')
const showPassword = ref(false)
const score = ref(0)
const strengthPercent = ref(0)
const strengthLabel = ref('')
const strengthColor = ref('')
const crackTime = ref(null)
const suggestions = ref([])

// 评分详情
const scoreDetails = reactive({
  lengthScore: 0,
  hasUpper: false,
  hasLower: false,
  hasDigit: false,
  hasSpecial: false,
  specialCount: 0,
  upperScore: 0,
  lowerScore: 0,
  digitScore: 0,
  specialScore: 0,
  sequentialCount: 0,
  sequentialPenalty: 0,
  repeatCount: 0,
  repeatPenalty: 0,
  isCommon: false,
  commonPenalty: 0,
})

// 长度描述
const lengthDesc = computed(() => {
  const len = password.value.length
  if (len < 6) return '过短'
  if (len < 8) return '较短'
  if (len < 12) return '一般'
  if (len < 16) return '良好'
  return '优秀'
})

// 常见弱密码列表（top 50）
const commonPasswords = new Set([
  '123456', 'password', '12345678', 'qwerty', '123456789', '12345', '1234', '111111',
  '1234567', 'dragon', '123123', 'baseball', 'abc123', 'football', 'monkey', 'letmein',
  'shadow', 'master', '666666', 'qwertyuiop', '123321', 'mustang', '1234567890',
  'michael', '654321', 'superman', '1qaz2wsx', '7777777', '121212', '000000',
  '123qwe', 'killer', 'trustno1', 'jordan', 'jennifer', 'zxcvbnm', 'asdfgh',
  'hunter', 'buster', 'soccer', 'harley', 'batman', 'andrew', 'tigger', 'sunshine',
  'iloveyou', '2000', 'charlie', 'robert', 'thomas', 'hockey', 'ranger', 'daniel',
  'starwars', 'klaster', '112233', 'george', 'computer', 'michelle', 'jessica',
  'pepper', '1111', 'zxcvbn', '555555', '11111111', '131313', 'freedom',
  '777777', 'pass', 'maggie', '159753', 'aaaaaa', 'ginger', 'princess',
  'joshua', 'cheese', 'amanda', 'summer', 'love', 'ashley', 'nicole',
  'chelsea', 'biteme', 'matthew', 'access', 'yankees', '987654321', 'dallas',
  'austin', 'thunder', 'taylor', 'matrix', 'mobilemail', 'mom', 'monitor',
  'monitoring', 'montana', 'moon', 'moscow', 'password1', 'password123',
  'admin', 'admin123', 'root', 'welcome', 'welcome1', 'p@ssw0rd', 'passw0rd',
])

// 分析密码强度
function analyze() {
  if (!password.value) {
    score.value = 0
    strengthPercent.value = 0
    strengthLabel.value = ''
    strengthColor.value = ''
    crackTime.value = null
    suggestions.value = []
    return
  }

  const pwd = password.value
  let s = 0
  const newSuggestions = []

  // 重置详情
  scoreDetails.lengthScore = 0
  scoreDetails.hasUpper = false
  scoreDetails.hasLower = false
  scoreDetails.hasDigit = false
  scoreDetails.hasSpecial = false
  scoreDetails.specialCount = 0
  scoreDetails.upperScore = 0
  scoreDetails.lowerScore = 0
  scoreDetails.digitScore = 0
  scoreDetails.specialScore = 0
  scoreDetails.sequentialCount = 0
  scoreDetails.sequentialPenalty = 0
  scoreDetails.repeatCount = 0
  scoreDetails.repeatPenalty = 0
  scoreDetails.isCommon = false
  scoreDetails.commonPenalty = 0

  // 1. 密码长度评分
  const len = pwd.length
  if (len >= 4) scoreDetails.lengthScore = 5
  if (len >= 6) scoreDetails.lengthScore = 10
  if (len >= 8) scoreDetails.lengthScore = 15
  if (len >= 12) scoreDetails.lengthScore = 22
  if (len >= 16) scoreDetails.lengthScore = 28
  if (len >= 20) scoreDetails.lengthScore = 32
  s += scoreDetails.lengthScore

  if (len < 6) newSuggestions.push('密码长度至少需要 6 个字符')
  if (len >= 6 && len < 8) newSuggestions.push('建议密码长度至少 8 个字符，12 个以上更安全')

  // 2. 大写字母
  scoreDetails.hasUpper = /[A-Z]/.test(pwd)
  if (scoreDetails.hasUpper) {
    scoreDetails.upperScore = 10
    s += 10
  } else {
    newSuggestions.push('添加大写字母可以增加密码强度')
  }

  // 3. 小写字母
  scoreDetails.hasLower = /[a-z]/.test(pwd)
  if (scoreDetails.hasLower) {
    scoreDetails.lowerScore = 10
    s += 10
  } else {
    newSuggestions.push('添加小写字母可以增加密码强度')
  }

  // 4. 数字
  scoreDetails.hasDigit = /\d/.test(pwd)
  if (scoreDetails.hasDigit) {
    scoreDetails.digitScore = 10
    s += 10
  } else {
    newSuggestions.push('添加数字可以增加密码强度')
  }

  // 5. 特殊字符
  const specialChars = pwd.match(/[^a-zA-Z0-9]/g)
  scoreDetails.specialCount = specialChars ? specialChars.length : 0
  scoreDetails.hasSpecial = scoreDetails.specialCount > 0
  if (scoreDetails.specialCount === 1) {
    scoreDetails.specialScore = 10
    s += 10
  } else if (scoreDetails.specialCount >= 2) {
    scoreDetails.specialScore = 15
    s += 15
  } else {
    newSuggestions.push('添加特殊字符（如 !@#$%^&*）可以显著提高密码强度')
  }

  // 6. 连续字符检测（字母序列和数字序列）
  const seqPatterns = []
  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const digits = '0123456789'
  const allSeqs = [lower, upper, digits]
  for (const seq of allSeqs) {
    for (let i = 0; i < seq.length - 2; i++) {
      seqPatterns.push(seq.substring(i, i + 3))
    }
  }
  // 反向序列
  for (const seq of allSeqs) {
    for (let i = seq.length - 1; i >= 2; i--) {
      seqPatterns.push(seq.substring(i - 2, i + 1).split('').reverse().join(''))
    }
  }

  let seqCount = 0
  const pwdLower = pwd.toLowerCase()
  for (const pattern of seqPatterns) {
    if (pwdLower.includes(pattern.toLowerCase())) {
      seqCount++
    }
  }
  scoreDetails.sequentialCount = Math.min(seqCount, 3)
  scoreDetails.sequentialPenalty = -scoreDetails.sequentialCount * 5
  s += scoreDetails.sequentialPenalty

  if (scoreDetails.sequentialCount > 0) {
    newSuggestions.push('避免使用连续字符序列（如 abc、123、qwe）')
  }

  // 7. 重复字符检测（3个及以上连续相同字符）
  const repeatRegex = /(.)\1{2,}/g
  const repeats = pwd.match(repeatRegex)
  scoreDetails.repeatCount = repeats ? repeats.length : 0
  scoreDetails.repeatPenalty = -scoreDetails.repeatCount * 5
  s += scoreDetails.repeatPenalty

  if (scoreDetails.repeatCount > 0) {
    newSuggestions.push('避免连续重复字符（如 aaa、111）')
  }

  // 8. 常见弱密码检测
  scoreDetails.isCommon = commonPasswords.has(pwd.toLowerCase())
  if (scoreDetails.isCommon) {
    scoreDetails.commonPenalty = -50
    s += scoreDetails.commonPenalty
    newSuggestions.unshift('🚨 该密码在常见弱密码列表中，请立即更换！')
  }

  // 额外奖励：混合类型多
  const types = [scoreDetails.hasUpper, scoreDetails.hasLower, scoreDetails.hasDigit, scoreDetails.hasSpecial].filter(Boolean).length
  if (types >= 3 && len >= 8) s += 5
  if (types === 4 && len >= 12) s += 8

  // 限制分数范围
  score.value = Math.max(0, Math.min(100, s))

  // 更新强度条
  if (score.value <= 20) {
    strengthPercent.value = score.value * 5
    strengthLabel.value = '极弱'
    strengthColor.value = '#ef4444'
  } else if (score.value <= 40) {
    strengthPercent.value = 20 + (score.value - 20) * 2.5
    strengthLabel.value = '弱'
    strengthColor.value = '#f97316'
  } else if (score.value <= 60) {
    strengthPercent.value = 45 + (score.value - 40) * 1.5
    strengthLabel.value = '中等'
    strengthColor.value = '#eab308'
  } else if (score.value <= 80) {
    strengthPercent.value = 75 + (score.value - 60)
    strengthLabel.value = '强'
    strengthColor.value = '#22c55e'
  } else {
    strengthPercent.value = 95 + (score.value - 80) * 0.25
    strengthLabel.value = '极强'
    strengthColor.value = '#15803d'
  }
  strengthPercent.value = Math.min(100, strengthPercent.value)

  // 暴力破解时间估算
  let charsetSize = 0
  if (/[a-z]/.test(pwd)) charsetSize += 26
  if (/[A-Z]/.test(pwd)) charsetSize += 26
  if (/\d/.test(pwd)) charsetSize += 10
  if (/[^a-zA-Z0-9]/.test(pwd)) charsetSize += 33
  if (charsetSize === 0) charsetSize = 1

  const combinations = Math.pow(charsetSize, pwd.length)
  // 假设每秒 100 亿次尝试（高性能 GPU 集群）
  const attacksPerSec = 1e10
  const seconds = combinations / attacksPerSec

  crackTime.value = {
    charsetSize,
    speed: '100亿次/秒（GPU 集群）',
    display: formatTime(seconds),
  }

  suggestions.value = newSuggestions
}

// 格式化时间
function formatTime(seconds) {
  if (!isFinite(seconds) || seconds > 1e30) return '几乎不可能（超出宇宙年龄）'
  if (seconds < 0.001) return '瞬间破解'
  if (seconds < 1) return '不到 1 秒'
  if (seconds < 60) return `${Math.round(seconds)} 秒`
  if (seconds < 3600) return `${Math.round(seconds / 60)} 分钟`
  if (seconds < 86400) return `${Math.round(seconds / 3600)} 小时`
  if (seconds < 86400 * 30) return `${Math.round(seconds / 86400)} 天`
  if (seconds < 86400 * 365) return `${Math.round(seconds / (86400 * 30))} 个月`
  if (seconds < 86400 * 365 * 100) return `${Math.round(seconds / (86400 * 365))} 年`
  if (seconds < 86400 * 365 * 1e6) return `${(seconds / (86400 * 365 * 1000)).toFixed(1)} 千年`
  if (seconds < 86400 * 365 * 1e9) return `${(seconds / (86400 * 365 * 1e6)).toFixed(1)} 百万年`
  return `${(seconds / (86400 * 365 * 1e9)).toFixed(1)} 十亿年`
}
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

/* 密码输入 */
.input-section {
  margin-bottom: 1.5rem;
}

.password-wrap {
  display: flex;
  gap: 0;
  max-width: 600px;
}

.password-input {
  flex: 1;
  padding: 0.8rem 1rem;
  border: 2px solid #ddd;
  border-right: none;
  border-radius: 10px 0 0 10px;
  font-size: 1.1rem;
  font-family: 'Courier New', monospace;
  background: white;
  transition: border-color 0.2s;
}

.password-input:focus {
  outline: none;
  border-color: #10b981;
}

.btn-toggle {
  padding: 0.8rem 1rem;
  border: 2px solid #ddd;
  border-left: 1px solid #eee;
  border-radius: 0 10px 10px 0;
  background: #f9fafb;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-toggle:hover {
  background: #f0fdf4;
  border-color: #10b981;
}

/* 强度条 */
.strength-section {
  margin-bottom: 1.5rem;
}

.strength-bar-wrap {
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: 600px;
}

.strength-bar {
  flex: 1;
  height: 10px;
  background: #e5e7eb;
  border-radius: 5px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  border-radius: 5px;
  transition: width 0.4s ease, background 0.4s ease;
}

.strength-label {
  font-weight: 700;
  font-size: 1rem;
  white-space: nowrap;
  min-width: 3rem;
}

.strength-score {
  font-size: 0.85rem;
  color: #888;
  white-space: nowrap;
}

/* 评分详情 */
.detail-section {
  margin-bottom: 1.5rem;
}

.detail-section h3 {
  font-size: 1.05rem;
  color: #333;
  margin-bottom: 0.8rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.6rem;
}

.detail-card {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 0.8rem 1rem;
  transition: border-color 0.2s;
}

.detail-card.good {
  border-color: #bbf7d0;
}

.detail-card.warn {
  border-color: #fde68a;
}

.detail-card.bad {
  border-color: #fecaca;
}

.detail-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.detail-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.detail-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: #333;
}

.detail-desc {
  font-size: 0.8rem;
  color: #888;
}

.detail-points {
  font-weight: 700;
  font-size: 0.85rem;
  color: #22c55e;
  white-space: nowrap;
}

.detail-points.penalty {
  color: #ef4444;
}

/* 暴力破解时间 */
.crack-section {
  margin-bottom: 1.5rem;
}

.crack-section h3 {
  font-size: 1.05rem;
  color: #333;
  margin-bottom: 0.8rem;
}

.crack-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 1rem 1.5rem;
}

.crack-icon {
  font-size: 2rem;
}

.crack-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.crack-label {
  font-size: 0.8rem;
  color: #888;
}

.crack-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: #f97316;
}

.crack-note {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #aaa;
}

/* 改进建议 */
.suggestions-section {
  margin-bottom: 1.5rem;
}

.suggestions-section h3 {
  font-size: 1.05rem;
  color: #333;
  margin-bottom: 0.8rem;
}

.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 0.7rem 1rem;
}

.suggestion-icon {
  flex-shrink: 0;
}

.suggestion-text {
  font-size: 0.9rem;
  color: #92400e;
}

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
  .detail-grid {
    grid-template-columns: 1fr;
  }
  .strength-bar-wrap {
    flex-wrap: wrap;
  }
}
</style>
