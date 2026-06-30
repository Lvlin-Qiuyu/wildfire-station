<template>
  <div class="tool-page">
    <h2>📦 UTF-8 字节序列可视化查看器</h2>
    <p class="subtitle">输入任意文本，逐字符展示 Unicode 码点、UTF-8 字节序列、UTF-16 编码、HTML 实体等</p>

    <!-- 输入区域 -->
    <div class="input-section">
      <textarea
        v-model="inputText"
        placeholder="在此粘贴或输入文本，支持中文、英文、Emoji、特殊符号..."
        class="text-input"
        rows="5"
      ></textarea>
      <div class="input-actions">
        <button class="btn-clear" @click="inputText = ''">清空</button>
        <button class="btn-sample" @click="loadSample('emoji')">Emoji 示例</button>
        <button class="btn-sample" @click="loadSample('mixed')">混合文本</button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div v-if="charData.length" class="stats-bar">
      <div class="stat-item">
        <span class="stat-label">字符数</span>
        <span class="stat-value">{{ charData.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">UTF-8 字节数</span>
        <span class="stat-value">{{ totalBytes }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">UTF-16 代码单元</span>
        <span class="stat-value">{{ totalUtf16Units }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">显示模式</span>
        <div class="toggle-group">
          <button :class="['toggle-btn', { active: viewMode === 'detail' }]" @click="viewMode = 'detail'">详细表格</button>
          <button :class="['toggle-btn', { active: viewMode === 'compact' }]" @click="viewMode = 'compact'">紧凑视图</button>
        </div>
      </div>
    </div>

    <!-- 详细表格视图 -->
    <div v-if="charData.length && viewMode === 'detail'" class="result-section">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th class="col-index">#</th>
              <th class="col-char">字符</th>
              <th>Unicode 码点</th>
              <th>十进制</th>
              <th>UTF-8 字节序列</th>
              <th>字节数</th>
              <th>UTF-16 编码</th>
              <th>HTML 实体</th>
              <th class="col-action">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in charData" :key="idx">
              <td class="col-index">{{ idx + 1 }}</td>
              <td class="col-char">
                <span class="char-preview" :title="`U+${item.codePointHex}`">{{ item.char }}</span>
              </td>
              <td><code class="mono">{{ item.codePointHex }}</code></td>
              <td><code class="mono">{{ item.decimal }}</code></td>
              <td>
                <span class="byte-chips">
                  <span v-for="(b, bi) in item.utf8Bytes" :key="bi" class="byte-chip">{{ b }}</span>
                </span>
              </td>
              <td>{{ item.utf8ByteCount }}</td>
              <td><code class="mono">{{ item.utf16Hex }}</code></td>
              <td><code class="mono entity">{{ item.htmlEntity }}</code></td>
              <td class="col-action">
                <button class="btn-copy-row" @click="copyRow(item)" title="复制此行JSON">📋</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 紧凑视图 -->
    <div v-if="charData.length && viewMode === 'compact'" class="result-section compact-view">
      <div v-for="(item, idx) in charData" :key="idx" class="compact-row">
        <span class="compact-char">{{ item.char }}</span>
        <code class="compact-code">{{ item.codePointHex }}</code>
        <code class="compact-byte">{{ item.utf8BytesStr }}</code>
        <button class="btn-copy-row" @click="copyRow(item)" title="复制此行JSON">📋</button>
      </div>
    </div>

    <!-- 复制全部按钮 -->
    <div v-if="charData.length" class="copy-all-bar">
      <button class="btn-copy-all" @click="copyAll">{{ copyAllText }}</button>
      <button class="btn-copy-all btn-copy-json" @click="copyAllJson">复制全部 JSON</button>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'UTF-8 字节序列可视化查看器 - 野火小站' })

// 输入文本
const inputText = ref('')

// 显示模式：详细表格 / 紧凑视图
const viewMode = ref('detail')

// 复制按钮文本
const copyAllText = ref('复制全部数据')

// 逐字符分析结果
const charData = computed(() => {
  if (!inputText.value) return []
  const text = inputText.value
  const result = []
  // 使用 Array.from 正确处理 emoji 等代理对字符
  const chars = Array.from(text)
  for (const char of chars) {
    const codePoint = char.codePointAt(0)
    const utf8Bytes = getUtf8Bytes(codePoint)
    const utf16Hex = getUtf16Hex(char)
    result.push({
      char,
      codePoint: codePoint,
      codePointHex: `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`,
      decimal: codePoint,
      utf8Bytes,                // ['E4', 'B8', 'AD']
      utf8BytesStr: utf8Bytes.join(' '),
      utf8ByteCount: utf8Bytes.length,
      utf16Hex,                 // '4E2D' 或 'D83D DE00'
      htmlEntity: `&#x${codePoint.toString(16).toUpperCase()};`
    })
  }
  return result
})

// UTF-8 总字节数
const totalBytes = computed(() => charData.value.reduce((s, c) => s + c.utf8ByteCount, 0))

// UTF-16 总代码单元数
const totalUtf16Units = computed(() => {
  return inputText.value.length // JS 字符串 length 就是 UTF-16 代码单元数
})

// 使用 TextEncoder API 获取 UTF-8 字节
function getUtf8Bytes(codePoint) {
  const encoder = new TextEncoder()
  const char = String.fromCodePoint(codePoint)
  const bytes = encoder.encode(char)
  return Array.from(bytes).map(b => b.toString(16).toUpperCase().padStart(2, '0'))
}

// 获取 UTF-16 编码（十六进制）
function getUtf16Hex(char) {
  const units = []
  for (let i = 0; i < char.length; i++) {
    units.push(char.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0'))
  }
  return units.join(' ')
}

// 加载示例文本
function loadSample(type) {
  if (type === 'emoji') {
    inputText.value = '你好世界！🌍🚀🎉💻🍎📱'
  } else {
    inputText.value = 'Hello 世界！A©®™€£¥¢ƒªº¿¡'
  }
}

// 复制单行 JSON
function copyRow(item) {
  const obj = {
    char: item.char,
    unicode: item.codePointHex,
    decimal: item.decimal,
    utf8: item.utf8BytesStr,
    utf16: item.utf16Hex,
    htmlEntity: item.htmlEntity
  }
  navigator.clipboard.writeText(JSON.stringify(obj, null, 2))
}

// 复制全部数据（制表符分隔）
function copyAll() {
  let output = '字符\tUnicode\t十进制\tUTF-8字节\tUTF-16\tHTML实体\n'
  for (const item of charData.value) {
    output += `${item.char}\t${item.codePointHex}\t${item.decimal}\t${item.utf8BytesStr}\t${item.utf16Hex}\t${item.htmlEntity}\n`
  }
  navigator.clipboard.writeText(output).then(() => {
    copyAllText.value = '已复制 ✓'
    setTimeout(() => { copyAllText.value = '复制全部数据' }, 1500)
  })
}

// 复制全部 JSON
function copyAllJson() {
  const arr = charData.value.map(item => ({
    char: item.char,
    unicode: item.codePointHex,
    decimal: item.decimal,
    utf8: item.utf8BytesStr,
    utf16: item.utf16Hex,
    htmlEntity: item.htmlEntity
  }))
  navigator.clipboard.writeText(JSON.stringify(arr, null, 2))
}
</script>

<style scoped>
.tool-page {
  max-width: 1100px;
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

/* 输入区域 */
.input-section {
  background: #fff;
  border-radius: 10px;
  padding: 1.2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 1.2rem;
}
.text-input {
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
}
.text-input:focus {
  border-color: #22c55e;
  box-shadow: 0 0 0 3px rgba(34,197,94,0.15);
}
.input-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.6rem;
  flex-wrap: wrap;
}
.btn-clear, .btn-sample {
  padding: 0.4rem 0.9rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #f9fafb;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}
.btn-clear:hover {
  border-color: #ef4444;
  color: #ef4444;
}
.btn-sample:hover {
  border-color: #22c55e;
  color: #22c55e;
}

/* 统计栏 */
.stats-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  padding: 1rem 1.2rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  margin-bottom: 1.2rem;
}
.stat-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.stat-label {
  font-size: 0.85rem;
  color: #666;
}
.stat-value {
  font-weight: 700;
  color: #16a34a;
  font-size: 1.1rem;
}
.toggle-group {
  display: flex;
  border: 1px solid #22c55e;
  border-radius: 6px;
  overflow: hidden;
}
.toggle-btn {
  padding: 0.3rem 0.7rem;
  border: none;
  background: #fff;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}
.toggle-btn.active {
  background: #22c55e;
  color: #fff;
}

/* 结果区域 */
.result-section {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 1rem;
  overflow: hidden;
}
.table-wrap {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}
.data-table th {
  background: #f3f4f6;
  padding: 0.7rem 0.6rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.82rem;
  color: #555;
  white-space: nowrap;
  border-bottom: 2px solid #e5e7eb;
}
.data-table td {
  padding: 0.6rem;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}
.data-table tr:hover td {
  background: #f0fdf4;
}
.col-index { width: 40px; text-align: center; color: #999; }
.col-char { width: 60px; text-align: center; }
.col-action { width: 50px; text-align: center; }
.char-preview {
  font-size: 1.3rem;
  display: inline-block;
  min-width: 30px;
}
.mono {
  font-family: 'Courier New', monospace;
  font-size: 0.82rem;
  background: #f3f4f6;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  white-space: nowrap;
}
.entity {
  font-size: 0.78rem;
  color: #059669;
}
.byte-chips {
  display: flex;
  gap: 0.2rem;
  flex-wrap: nowrap;
}
.byte-chip {
  display: inline-block;
  background: #dbeafe;
  color: #1e40af;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.78rem;
  font-weight: 600;
}
.btn-copy-row {
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.2rem 0.4rem;
  transition: all 0.2s;
}
.btn-copy-row:hover {
  background: #f0fdf4;
  border-color: #22c55e;
}

/* 紧凑视图 */
.compact-view {
  padding: 0.8rem 1rem;
}
.compact-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.88rem;
}
.compact-row:last-child { border-bottom: none; }
.compact-char {
  font-size: 1.4rem;
  min-width: 32px;
  text-align: center;
}
.compact-code {
  font-family: 'Courier New', monospace;
  font-size: 0.82rem;
  color: #7c3aed;
  background: #f5f3ff;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
}
.compact-byte {
  font-family: 'Courier New', monospace;
  font-size: 0.82rem;
  color: #1e40af;
  background: #dbeafe;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 复制全部 */
.copy-all-bar {
  display: flex;
  gap: 0.8rem;
  margin-bottom: 1rem;
}
.btn-copy-all {
  padding: 0.55rem 1.2rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: opacity 0.2s;
}
.btn-copy-all:hover { opacity: 0.85; }
.btn-copy-json {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
}

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #22c55e;
  font-weight: 500;
}
.back-link:hover { text-decoration: underline; }

@media (max-width: 640px) {
  .stats-bar {
    flex-direction: column;
    align-items: flex-start;
  }
  .data-table {
    font-size: 0.78rem;
  }
  .compact-row {
    flex-wrap: wrap;
    gap: 0.4rem;
  }
}
</style>
