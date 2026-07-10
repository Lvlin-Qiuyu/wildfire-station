<template>
  <div class="tool-page">
    <h2>🔒 数据脱敏工具</h2>
    <p class="subtitle">内置PII正则规则库，多种脱敏策略，实时预览脱敏前/后对比，支持自定义规则</p>

    <div class="editor-area">
      <!-- 输入区 -->
      <div class="panel input-panel">
        <div class="panel-header">
          <span class="panel-title">输入文本</span>
          <button class="btn-sm" @click="pasteText">粘贴</button>
          <button class="btn-sm" @click="loadSample">示例</button>
          <button class="btn-sm" @click="inputText = ''; maskedText = ''; matchCount = 0">清空</button>
        </div>
        <textarea
          v-model="inputText"
          placeholder="粘贴需要脱敏的文本到这里..."
          class="editor"
          @input="debounceMask"
        ></textarea>
        <div v-if="inputText" class="char-info">
          <span>字符数：{{ inputText.length }}</span>
          <span v-if="matchCount > 0" class="match-count">匹配 {{ matchCount }} 处敏感数据</span>
        </div>
      </div>

      <!-- 脱敏结果 -->
      <div class="panel output-panel">
        <div class="panel-header">
          <span class="panel-title">脱敏结果</span>
          <div class="header-actions">
            <button class="btn-sm btn-primary" @click="copyMasked" :disabled="!maskedText">复制脱敏文本</button>
          </div>
        </div>
        <div v-if="!inputText" class="preview placeholder">输入文本后自动脱敏，实时预览效果</div>
        <div v-else class="preview result-preview">
          <pre class="masked-text">{{ maskedText || inputText }}</pre>
        </div>
      </div>
    </div>

    <!-- 规则配置区 -->
    <div class="config-area">
      <!-- 内置规则 -->
      <div class="panel config-panel">
        <div class="panel-header">
          <span class="panel-title">内置脱敏规则</span>
          <button class="btn-sm" @click="selectAllRules">全选</button>
          <button class="btn-sm" @click="deselectAllRules">取消全选</button>
        </div>
        <div class="rules-grid">
          <label v-for="rule in builtInRules" :key="rule.id" :class="['rule-item', { active: rule.enabled }]">
            <input type="checkbox" v-model="rule.enabled" @change="debounceMask" />
            <span class="rule-icon">{{ rule.icon }}</span>
            <span class="rule-name">{{ rule.name }}</span>
            <span class="rule-example">{{ rule.example }}</span>
          </label>
        </div>
      </div>

      <!-- 脱敏策略 -->
      <div class="panel config-panel">
        <div class="panel-header">
          <span class="panel-title">脱敏策略</span>
        </div>
        <div class="strategy-grid">
          <label v-for="s in strategies" :key="s.value" :class="['strategy-item', { active: maskStrategy === s.value }]" @click="maskStrategy = s.value; debounceMask()">
            <input type="radio" :value="s.value" v-model="maskStrategy" />
            <span class="strategy-name">{{ s.name }}</span>
            <span class="strategy-desc">{{ s.desc }}</span>
          </label>
        </div>
        <div class="strategy-options">
          <div class="option-row">
            <label>掩码字符</label>
            <div class="char-options">
              <button
                v-for="ch in ['*', '●', 'X', 'x', '#', '_']"
                :key="ch"
                :class="['char-btn', { active: maskChar === ch }]"
                @click="maskChar = ch; debounceMask()"
              >{{ ch }}</button>
            </div>
          </div>
          <div class="option-row">
            <label>首尾保留数</label>
            <div class="slider-row">
              <input type="range" min="0" max="4" v-model.number="keepEnd" @input="debounceMask" />
              <span class="slider-val">{{ keepEnd }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 自定义规则 -->
      <div class="panel config-panel">
        <div class="panel-header">
          <span class="panel-title">自定义正则规则</span>
          <button class="btn-sm" @click="addCustomRule">+ 添加规则</button>
        </div>
        <div v-if="customRules.length === 0" class="empty-hint">暂无自定义规则，点击上方按钮添加</div>
        <div v-for="(rule, idx) in customRules" :key="idx" class="custom-rule-row">
          <input v-model="rule.name" placeholder="规则名称" class="rule-input name-input" />
          <input v-model="rule.pattern" placeholder="正则表达式（不含//）" class="rule-input pattern-input" />
          <label class="enable-check">
            <input type="checkbox" v-model="rule.enabled" @change="debounceMask" />
            <span>启用</span>
          </label>
          <button class="btn-sm btn-danger" @click="removeCustomRule(idx)">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
useHead({ title: '数据脱敏工具 - 野火小站' })

const inputText = ref('')
const maskedText = ref('')
const matchCount = ref(0)
const maskStrategy = ref('partial')  // full | partial | headtail | custom
const maskChar = ref('*')
const keepEnd = ref(1)

// 脱敏策略
const strategies = [
  { value: 'full', name: '全部掩码', desc: '138****5678' },
  { value: 'partial', name: '部分掩码', desc: '138****5678（默认）' },
  { value: 'headtail', name: '首尾保留', desc: '138****678' },
  { value: 'hash', name: '哈希替换', desc: '138[HASH]78' },
]

// 内置PII规则
const builtInRules = ref([
  {
    id: 'phone', icon: '📱', name: '手机号', example: '138****5678', enabled: true,
    // 1开头11位数字
    pattern: /(?<!\d)(1[3-9]\d{9})(?!\d)/g,
    type: 'phone'
  },
  {
    id: 'idcard', icon: '🪪', name: '身份证号', example: '110***********1234', enabled: true,
    // 15或18位身份证
    pattern: /(?<!\d)(\d{6}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx])(?!\d)/g,
    type: 'idcard'
  },
  {
    id: 'bankcard', icon: '💳', name: '银行卡号', example: '6222****1234', enabled: true,
    // 16-19位银行卡
    pattern: /(?<!\d)(\d{16,19})(?!\d)/g,
    type: 'bankcard'
  },
  {
    id: 'email', icon: '📧', name: '邮箱地址', example: 't***@qq.com', enabled: true,
    pattern: /([\w.-]+@[\w.-]+\.\w{2,})/g,
    type: 'email'
  },
  {
    id: 'ipv4', icon: '🌐', name: 'IPv4 地址', example: '192.168.*.*', enabled: true,
    pattern: /(?<!\d)((?:\d{1,3}\.){3}\d{1,3})(?!\d)/g,
    type: 'ipv4'
  },
  {
    id: 'ipv6', icon: '🌐', name: 'IPv6 地址', example: '2001:***::1', enabled: false,
    pattern: /([0-9a-fA-F]{1,4}(?::[0-9a-fA-F]{1,4}){5,7})/g,
    type: 'ipv6'
  },
  {
    id: 'name', icon: '👤', name: '中文姓名', example: '张*、李**', enabled: true,
    pattern: /([\u4e00-\u9fa5]{2,4}(?:\s+[\u4e00-\u9fa5]{2,4})*)(?=\s|，|。|、|：|；|！|？|[^\u4e00-\u9fa5]|$)/g,
    type: 'name'
  },
  {
    id: 'address', icon: '🏠', name: '详细地址', example: '北京市***', enabled: false,
    pattern: /([\u4e00-\u9fa5]{2,}(?:省|市|区|县|镇|乡|村|街道|路|号|栋|楼|室|幢|座|层|幢|号)[\u4e00-\u9fa5\d]*(?:号|室|栋|楼|层)?)/g,
    type: 'address'
  },
  {
    id: 'plate', icon: '🚗', name: '车牌号', example: '京A****', enabled: true,
    pattern: /([京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤川青藏琼宁][A-Z][A-Z0-9]{5,6})/g,
    type: 'plate'
  },
  {
    id: 'passport', icon: '🛂', name: '护照号', example: 'E******', enabled: false,
    pattern: /([A-Za-z]\d{8}|[A-Za-z]{1,2}\d{7,8})/g,
    type: 'passport'
  },
])

// 自定义规则
const customRules = ref([])

// 防抖
let debounceTimer = null
function debounceMask() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(applyMasking, 200)
}

// 执行脱敏
function applyMasking() {
  if (!inputText.value) {
    maskedText.value = ''
    matchCount.value = 0
    return
  }

  let text = inputText.value
  let totalMatches = 0

  // 收集所有启用的规则
  const allRules = [
    ...builtInRules.value.filter(r => r.enabled),
    ...customRules.value.filter(r => r.enabled && r.pattern),
  ]

  for (const rule of allRules) {
    try {
      const regex = rule.pattern instanceof RegExp
        ? new RegExp(rule.pattern.source, rule.pattern.flags)
        : new RegExp(rule.pattern, 'g')

      let match
      const matches = []
      // 先收集所有匹配
      const testRegex = new RegExp(regex.source, regex.flags)
      while ((match = testRegex.exec(text)) !== null) {
        matches.push({ index: match.index, length: match[0].length, text: match[0] })
        totalMatches++
      }

      // 倒序替换避免偏移
      for (let i = matches.length - 1; i >= 0; i--) {
        const m = matches[i]
        const masked = maskValue(m.text, rule.type || 'custom')
        text = text.slice(0, m.index) + masked + text.slice(m.index + m.length)
      }
    } catch (e) {
      // 正则语法错误则跳过
    }
  }

  maskedText.value = text
  matchCount.value = totalMatches
}

// 脱敏单值
function maskValue(value, type) {
  const len = value.length
  const keep = Math.min(keepEnd.value, Math.floor(len / 2))

  switch (maskStrategy.value) {
    case 'full':
      return maskChar.value.repeat(len)

    case 'partial':
      // 默认保留首尾1-2个字符
      if (len <= 2) return maskChar.value.repeat(len)
      const head = Math.min(keep, 2)
      const tail = Math.min(keep, 2)
      const maskLen = len - head - tail
      if (type === 'email') {
        // 邮箱特殊处理：用户名部分掩码
        const atIdx = value.indexOf('@')
        if (atIdx > 1) {
          const local = value.slice(0, atIdx)
          const domain = value.slice(atIdx)
          const localHead = local.charAt(0)
          return localHead + maskChar.value.repeat(local.length - 1) + domain
        }
      }
      if (type === 'ipv4') {
        // IP地址：最后一段掩码
        const parts = value.split('.')
        return parts.slice(0, -1).join('.') + '.' + maskChar.value.repeat(parts[parts.length - 1].length)
      }
      if (type === 'name') {
        // 姓名：保留姓氏，其余掩码
        const chars = [...value]
        return chars[0] + maskChar.value.repeat(chars.length - 1)
      }
      if (maskLen <= 0) return maskChar.value.repeat(len)
      return value.slice(0, head) + maskChar.value.repeat(maskLen) + value.slice(len - tail)

    case 'headtail':
      if (len <= 2) return maskChar.value.repeat(len)
      return value.slice(0, keep) + maskChar.value.repeat(len - keep * 2) + value.slice(len - keep)

    case 'hash':
      if (len <= 2) return '[HASH]'
      return value.slice(0, keep) + '[HASH]' + value.slice(len - keep)

    default:
      return value
  }
}

// 全选/取消
function selectAllRules() {
  builtInRules.value.forEach(r => r.enabled = true)
  debounceMask()
}
function deselectAllRules() {
  builtInRules.value.forEach(r => r.enabled = false)
  debounceMask()
}

// 自定义规则管理
function addCustomRule() {
  customRules.value.push({ name: '', pattern: '', enabled: true })
}
function removeCustomRule(idx) {
  customRules.value.splice(idx, 1)
  debounceMask()
}

// 示例文本
function loadSample() {
  inputText.value = `客户张三于2024年1月15日下单，手机号13812345678，身份证号110101199003071234，银行卡号6222021234567890123。
邮箱地址zhangsan@qq.com，收货地址北京市朝阳区建国路88号国贸大厦3栋501室，车牌号京A12345。
紧急联系人李四，联系电话13987654321，邮箱lisi@163.com。
该订单的IP地址为192.168.1.100，服务器IPv6为2001:db8:85a3::8a2e:370:7334。`
  debounceMask()
}

// 粘贴
async function pasteText() {
  try {
    const text = await navigator.clipboard.readText()
    inputText.value = text
    debounceMask()
  } catch {
    alert('无法读取剪贴板，请手动粘贴')
  }
}

// 复制
async function copyMasked() {
  try {
    await navigator.clipboard.writeText(maskedText.value)
    alert('已复制脱敏文本')
  } catch {
    const ta = document.createElement('textarea')
    ta.value = maskedText.value
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    alert('已复制脱敏文本')
  }
}
</script>

<style scoped>
.tool-page { max-width: 1200px; margin: 0 auto; padding: 1.5rem; }
.tool-page h2 { font-size: 1.8rem; margin-bottom: 0.5rem; color: #2c3e50; }
.subtitle { color: #888; margin-bottom: 1.5rem; font-size: 0.95rem; }

.editor-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}
@media (max-width: 768px) {
  .editor-area { grid-template-columns: 1fr; }
}

.panel {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  border: 1px solid #eee;
}
.panel-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}
.panel-title { font-weight: 600; font-size: 1rem; }
.header-actions { display: flex; gap: 0.5rem; margin-left: auto; align-items: center; }

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
.btn-sm:hover { border-color: #10b981; color: #10b981; }
.btn-sm.btn-primary { background: #10b981; color: white; border-color: #10b981; }
.btn-sm.btn-primary:hover { background: #059669; }
.btn-sm.btn-danger { color: #ef4444; border-color: #fca5a5; }
.btn-sm.btn-danger:hover { background: #ef4444; color: white; }
.btn-sm:disabled { opacity: 0.5; cursor: not-allowed; }

.editor {
  width: 100%;
  min-height: 180px;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 0.9rem;
  line-height: 1.6;
  resize: vertical;
  font-family: inherit;
}
.editor:focus { outline: none; border-color: #10b981; box-shadow: 0 0 0 2px rgba(16,185,129,0.1); }

.char-info {
  display: flex; gap: 1rem; margin-top: 0.5rem;
  font-size: 0.8rem; color: #888;
}
.match-count { color: #ef4444; font-weight: 600; }

.preview {
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aaa;
  font-size: 0.95rem;
  text-align: center;
  padding: 2rem;
}
.placeholder { border: 2px dashed #eee; border-radius: 8px; }
.result-preview { flex-direction: column; padding: 1rem; background: #fafafa; border-radius: 8px; }
.masked-text {
  width: 100%; white-space: pre-wrap; word-break: break-all; font-size: 0.9rem;
  font-family: inherit; color: #2c3e50; line-height: 1.6; margin: 0;
}

/* 规则配置 */
.config-area { display: flex; flex-direction: column; gap: 1rem; }
.config-panel { margin-bottom: 0; }

.rules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.5rem;
}
.rule-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85rem;
}
.rule-item:hover { border-color: #10b981; }
.rule-item.active { border-color: #10b981; background: #f0fdf4; }
.rule-item input[type="checkbox"] { accent-color: #10b981; }
.rule-icon { font-size: 1.2rem; }
.rule-name { font-weight: 500; white-space: nowrap; }
.rule-example { color: #888; font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.strategy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.strategy-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  border: 1px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85rem;
}
.strategy-item:hover { border-color: #10b981; }
.strategy-item.active { border-color: #10b981; background: #f0fdf4; }
.strategy-item input[type="radio"] { accent-color: #10b981; }
.strategy-name { font-weight: 600; }
.strategy-desc { color: #888; font-size: 0.8rem; font-family: monospace; }

.strategy-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid #f0f0f0;
}
.option-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.85rem;
}
.option-row label { min-width: 80px; font-weight: 500; color: #555; }
.char-options { display: flex; gap: 0.3rem; }
.char-btn {
  width: 2rem; height: 2rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.char-btn:hover { border-color: #10b981; }
.char-btn.active { background: #10b981; color: white; border-color: #10b981; }

.slider-row { display: flex; align-items: center; gap: 0.5rem; }
.slider-row input[type="range"] { accent-color: #10b981; }
.slider-val { font-weight: 600; color: #10b981; min-width: 1.5rem; text-align: center; }

/* 自定义规则 */
.empty-hint { color: #aaa; font-size: 0.85rem; text-align: center; padding: 1rem; }
.custom-rule-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}
.rule-input {
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
  font-size: 0.85rem;
  font-family: inherit;
}
.rule-input:focus { outline: none; border-color: #10b981; }
.name-input { width: 100px; }
.pattern-input { flex: 1; min-width: 150px; font-family: monospace; }
.enable-check {
  display: flex; align-items: center; gap: 0.3rem;
  font-size: 0.85rem; cursor: pointer; white-space: nowrap;
}
.enable-check input { accent-color: #10b981; }

@media (max-width: 640px) {
  .tool-page { padding: 1rem; }
  .tool-page h2 { font-size: 1.4rem; }
  .rules-grid { grid-template-columns: 1fr; }
  .custom-rule-row { flex-direction: column; align-items: stretch; }
  .name-input, .pattern-input { width: 100%; }
}
</style>
