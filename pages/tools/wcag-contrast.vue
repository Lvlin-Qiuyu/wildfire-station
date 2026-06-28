<template>
  <div class="tool-page">
    <h2>🎨 WCAG 对比度检查器</h2>
    <p class="tool-desc">输入前景色和背景色，实时计算对比度比值，检查 WCAG 2.1 合规性</p>

    <div class="color-inputs">
      <!-- 前景色 -->
      <div class="color-section">
        <label>前景色（文字）</label>
        <div class="color-row">
          <input type="color" v-model="fgColor" class="color-picker" />
          <input
            v-model="fgColor"
            class="hex-input"
            placeholder="#ffffff"
            maxlength="7"
            spellcheck="false"
          />
        </div>
      </div>

      <!-- 交换按钮 -->
      <button class="btn-swap" @click="swapColors" title="交换前景/背景色">
        🔄
      </button>

      <!-- 背景色 -->
      <div class="color-section">
        <label>背景色</label>
        <div class="color-row">
          <input type="color" v-model="bgColor" class="color-picker" />
          <input
            v-model="bgColor"
            class="hex-input"
            placeholder="#000000"
            maxlength="7"
            spellcheck="false"
          />
        </div>
      </div>
    </div>

    <!-- 对比度比值 -->
    <div class="ratio-display" v-if="contrastRatio > 0">
      <div class="ratio-number">{{ contrastRatio.toFixed(2) }} : 1</div>
      <div class="ratio-label">对比度比值</div>
    </div>

    <!-- WCAG 合规性 -->
    <div class="compliance" v-if="contrastRatio > 0">
      <div class="compliance-grid">
        <div
          v-for="item in complianceItems"
          :key="item.label"
          class="compliance-item"
          :class="{ pass: item.pass, fail: !item.pass }"
        >
          <span class="badge">{{ item.pass ? '✅' : '❌' }}</span>
          <span class="level">{{ item.level }}</span>
          <span class="threshold">{{ item.threshold }}</span>
        </div>
      </div>
    </div>

    <!-- 文本预览 -->
    <div class="preview-section" v-if="contrastRatio > 0">
      <label>文本预览</label>
      <div class="preview-box" :style="{ color: fgColor, backgroundColor: bgColor }">
        <p class="preview-normal">正常文本示例 — 这是一段普通的正文文字</p>
        <p class="preview-large">大文本示例 — 这是大号标题文字（18px 加粗）</p>
        <p class="preview-small">小字示例 — 这是小号辅助文字（12px）</p>
      </div>
    </div>

    <!-- 快速复制 -->
    <div class="copy-section" v-if="contrastRatio > 0">
      <button class="btn-copy" @click="copyResult">{{ copyText }}</button>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'WCAG 对比度检查器 - 野火小站' })

const fgColor = ref('#ffffff')
const bgColor = ref('#1a1a2e')
const copyText = ref('复制结果')

// 校正 HEX 格式
function normalizeHex(hex) {
  hex = hex.replace(/^#/, '')
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('')
  }
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return '#' + hex.toLowerCase()
  }
  return null
}

// 将 HEX 转为 RGB
function hexToRgb(hex) {
  hex = normalizeHex(hex)
  if (!hex) return null
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  }
}

// 计算相对亮度（W3C WCAG 2.1 算法）
function relativeLuminance(rgb) {
  const [rs, gs, bs] = [rgb.r / 255, rgb.g / 255, rgb.b / 255]
  const r = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4)
  const g = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4)
  const b = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// 计算对比度比值
function contrastRatioCalc(l1, l2) {
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

// 计算对比度
const contrastRatio = computed(() => {
  const fg = hexToRgb(fgColor.value)
  const bg = hexToRgb(bgColor.value)
  if (!fg || !bg) return 0
  const lFg = relativeLuminance(fg)
  const lBg = relativeLuminance(bg)
  return contrastRatioCalc(lFg, lBg)
})

// WCAG 合规性检测项
const complianceItems = computed(() => {
  const r = contrastRatio.value
  return [
    { label: 'AA 正常文本', threshold: '≥ 4.5:1', level: 'AA', pass: r >= 4.5 },
    { label: 'AA 大文本', threshold: '≥ 3:1', level: 'AA', pass: r >= 3 },
    { label: 'AAA 正常文本', threshold: '≥ 7:1', level: 'AAA', pass: r >= 7 },
    { label: 'AAA 大文本', threshold: '≥ 4.5:1', level: 'AAA', pass: r >= 4.5 },
  ]
})

// 交换前景/背景色
function swapColors() {
  const tmp = fgColor.value
  fgColor.value = bgColor.value
  bgColor.value = tmp
}

// 复制结果
function copyResult() {
  const r = contrastRatio.value.toFixed(2)
  const passes = complianceItems.value
    .filter(i => i.pass)
    .map(i => `${i.label}(${i.threshold})`)
    .join(', ')
  const text = `对比度比值: ${r}:1\n通过标准: ${passes || '无'}`
  navigator.clipboard.writeText(text).then(() => {
    copyText.value = '已复制 ✓'
    setTimeout(() => { copyText.value = '复制结果' }, 1500)
  })
}
</script>

<style scoped>
.tool-page {
  padding-top: 0.5rem;
}

h2 {
  font-size: 1.6rem;
  margin-bottom: 0.5rem;
}

.tool-desc {
  color: #666;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

/* 颜色输入区 */
.color-inputs {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.color-section {
  flex: 1;
  min-width: 180px;
}

.color-section label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.color-row {
  display: flex;
  gap: 0.8rem;
  align-items: center;
}

.color-picker {
  width: 50px;
  height: 50px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  cursor: pointer;
  padding: 2px;
  background: none;
  flex-shrink: 0;
}

.hex-input {
  flex: 1;
  padding: 0.6rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1.05rem;
  font-family: monospace;
  outline: none;
  transition: border-color 0.2s;
}

.hex-input:focus {
  border-color: #22c55e;
}

.btn-swap {
  width: 44px;
  height: 44px;
  border: 2px solid #e0e0e0;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  background: white;
  transition: all 0.2s;
  flex-shrink: 0;
  margin-bottom: 2px;
}

.btn-swap:hover {
  border-color: #22c55e;
  background: #f0fdf4;
  transform: rotate(180deg);
}

/* 对比度显示 */
.ratio-display {
  text-align: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
  border-radius: 14px;
  margin-bottom: 1.5rem;
}

.ratio-number {
  font-size: 2.2rem;
  font-weight: 800;
  color: #1a1a2e;
}

.ratio-label {
  color: #666;
  font-size: 0.9rem;
  margin-top: 0.2rem;
}

/* 合规性 */
.compliance {
  margin-bottom: 1.5rem;
}

.compliance-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
}

.compliance-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.8rem 1rem;
  border-radius: 10px;
  border: 2px solid;
  transition: all 0.2s;
}

.compliance-item.pass {
  border-color: #22c55e;
  background: #f0fdf4;
}

.compliance-item.fail {
  border-color: #fecaca;
  background: #fef2f2;
}

.badge {
  font-size: 1.1rem;
}

.level {
  font-weight: 700;
  font-size: 0.9rem;
}

.threshold {
  color: #666;
  font-size: 0.85rem;
  margin-left: auto;
}

/* 文本预览 */
.preview-section {
  margin-bottom: 1.5rem;
}

.preview-section label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.preview-box {
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s;
}

.preview-normal {
  font-size: 16px;
  margin-bottom: 0.8rem;
}

.preview-large {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 0.8rem;
}

.preview-small {
  font-size: 12px;
  opacity: 0.85;
}

/* 复制按钮 */
.copy-section {
  text-align: center;
  margin-bottom: 1rem;
}

.btn-copy {
  padding: 0.6rem 1.4rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: transform 0.2s;
}

.btn-copy:active {
  transform: scale(0.95);
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
  .compliance-grid {
    grid-template-columns: 1fr;
  }
  .color-inputs {
    flex-direction: column;
    align-items: stretch;
  }
  .btn-swap {
    align-self: center;
    transform: rotate(90deg);
  }
  .btn-swap:hover {
    transform: rotate(270deg);
  }
}
</style>
