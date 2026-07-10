<template>
  <div class="tool-page">
    <h2>🎯 颜色命名查询器</h2>
    <p class="tool-desc">输入颜色值反向查找最近的CSS命名色，或搜索色名查看色值</p>

    <!-- 模式切换 -->
    <div class="mode-tabs">
      <button
        :class="['tab-btn', { active: mode === 'reverse' }]"
        @click="mode = 'reverse'"
      >
        🔍 反向查色名
      </button>
      <button
        :class="['tab-btn', { active: mode === 'forward' }]"
        @click="mode = 'forward'"
      >
        📖 正向查色值
      </button>
    </div>

    <!-- 反向查色名模式 -->
    <div v-if="mode === 'reverse'" class="input-section">
      <label>输入颜色值</label>
      <div class="input-row">
        <input type="color" v-model="inputColor" class="color-picker" />
        <input
          v-model="inputColor"
          class="text-input"
          placeholder="#FF6B6B 或 rgb(255,107,107)"
          spellcheck="false"
        />
      </div>

      <!-- 预览 -->
      <div class="preview-bar" :style="{ backgroundColor: validHex || '#ccc' }">
        <span :style="{ color: textColorFor(validHex) }">{{ validHex || '请输入颜色' }}</span>
      </div>

      <!-- 最接近的命名色 -->
      <div v-if="matchedColors.length" class="results">
        <h3>最接近的颜色名称</h3>
        <div class="match-list">
          <div
            v-for="(item, idx) in matchedColors"
            :key="item.name"
            class="match-item"
          >
            <span class="match-rank">#{{ idx + 1 }}</span>
            <div class="match-swatch" :style="{ backgroundColor: item.hex }"></div>
            <div class="match-info">
              <span class="match-name">{{ item.name }}</span>
              <span class="match-hex">{{ item.hex }}</span>
            </div>
            <span class="match-dist">Δ{{ item.distance.toFixed(2) }}</span>
            <button class="btn-sm" @click="copyText(item.hex)">{{ copyLabel }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 正向查色值模式 -->
    <div v-else class="input-section">
      <label>搜索色名</label>
      <input
        v-model="nameSearch"
        class="text-input"
        placeholder="输入色名，如「coral」「aliceblue」「tomato」…"
        spellcheck="false"
      />
      <div v-if="forwardResults.length" class="color-list">
        <div
          v-for="color in forwardResults"
          :key="color.name"
          class="color-list-item"
          @click="copyText(color.hex)"
        >
          <div class="list-swatch" :style="{ backgroundColor: color.hex }"></div>
          <span class="list-name">{{ color.name }}</span>
          <span class="list-hex">{{ color.hex }}</span>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '颜色命名查询器 - 野火小站' })

const mode = ref('reverse')
const inputColor = ref('#22c55e')
const nameSearch = ref('')
const copyLabel = ref('复制')

// CSS命名色 + 常用XKCD色名
const namedColors = [
  // CSS命名色（148种）
  { name: 'aliceblue', hex: '#f0f8ff' },
  { name: 'antiquewhite', hex: '#faebd7' },
  { name: 'aqua', hex: '#00ffff' },
  { name: 'aquamarine', hex: '#7fffd4' },
  { name: 'azure', hex: '#f0ffff' },
  { name: 'beige', hex: '#f5f5dc' },
  { name: 'bisque', hex: '#ffe4c4' },
  { name: 'black', hex: '#000000' },
  { name: 'blanchedalmond', hex: '#ffebcd' },
  { name: 'blue', hex: '#0000ff' },
  { name: 'blueviolet', hex: '#8a2be2' },
  { name: 'brown', hex: '#a52a2a' },
  { name: 'burlywood', hex: '#deb887' },
  { name: 'cadetblue', hex: '#5f9ea0' },
  { name: 'chartreuse', hex: '#7fff00' },
  { name: 'chocolate', hex: '#d2691e' },
  { name: 'coral', hex: '#ff7f50' },
  { name: 'cornflowerblue', hex: '#6495ed' },
  { name: 'cornsilk', hex: '#fff8dc' },
  { name: 'crimson', hex: '#dc143c' },
  { name: 'cyan', hex: '#00ffff' },
  { name: 'darkblue', hex: '#00008b' },
  { name: 'darkcyan', hex: '#008b8b' },
  { name: 'darkgoldenrod', hex: '#b8860b' },
  { name: 'darkgray', hex: '#a9a9a9' },
  { name: 'darkgreen', hex: '#006400' },
  { name: 'darkkhaki', hex: '#bdb76b' },
  { name: 'darkmagenta', hex: '#8b008b' },
  { name: 'darkolivegreen', hex: '#556b2f' },
  { name: 'darkorange', hex: '#ff8c00' },
  { name: 'darkorchid', hex: '#9932cc' },
  { name: 'darkred', hex: '#8b0000' },
  { name: 'darksalmon', hex: '#e9967a' },
  { name: 'darkseagreen', hex: '#8fbc8f' },
  { name: 'darkslateblue', hex: '#483d8b' },
  { name: 'darkslategray', hex: '#2f4f4f' },
  { name: 'darkturquoise', hex: '#00ced1' },
  { name: 'darkviolet', hex: '#9400d3' },
  { name: 'deeppink', hex: '#ff1493' },
  { name: 'deepskyblue', hex: '#00bfff' },
  { name: 'dimgray', hex: '#696969' },
  { name: 'dodgerblue', hex: '#1e90ff' },
  { name: 'firebrick', hex: '#b22222' },
  { name: 'floralwhite', hex: '#fffaf0' },
  { name: 'forestgreen', hex: '#228b22' },
  { name: 'fuchsia', hex: '#ff00ff' },
  { name: 'gainsboro', hex: '#dcdcdc' },
  { name: 'ghostwhite', hex: '#f8f8ff' },
  { name: 'gold', hex: '#ffd700' },
  { name: 'goldenrod', hex: '#daa520' },
  { name: 'gray', hex: '#808080' },
  { name: 'green', hex: '#008000' },
  { name: 'greenyellow', hex: '#adff2f' },
  { name: 'honeydew', hex: '#f0fff0' },
  { name: 'hotpink', hex: '#ff69b4' },
  { name: 'indianred', hex: '#cd5c5c' },
  { name: 'indigo', hex: '#4b0082' },
  { name: 'ivory', hex: '#fffff0' },
  { name: 'khaki', hex: '#f0e68c' },
  { name: 'lavender', hex: '#e6e6fa' },
  { name: 'lavenderblush', hex: '#fff0f5' },
  { name: 'lawngreen', hex: '#7cfc00' },
  { name: 'lemonchiffon', hex: '#fffacd' },
  { name: 'lightblue', hex: '#add8e6' },
  { name: 'lightcoral', hex: '#f08080' },
  { name: 'lightcyan', hex: '#e0ffff' },
  { name: 'lightgoldenrodyellow', hex: '#fafad2' },
  { name: 'lightgray', hex: '#d3d3d3' },
  { name: 'lightgreen', hex: '#90ee90' },
  { name: 'lightpink', hex: '#ffb6c1' },
  { name: 'lightsalmon', hex: '#ffa07a' },
  { name: 'lightseagreen', hex: '#20b2aa' },
  { name: 'lightskyblue', hex: '#87cefa' },
  { name: 'lightslategray', hex: '#778899' },
  { name: 'lightsteelblue', hex: '#b0c4de' },
  { name: 'lightyellow', hex: '#ffffe0' },
  { name: 'lime', hex: '#00ff00' },
  { name: 'limegreen', hex: '#32cd32' },
  { name: 'linen', hex: '#faf0e6' },
  { name: 'magenta', hex: '#ff00ff' },
  { name: 'maroon', hex: '#800000' },
  { name: 'mediumaquamarine', hex: '#66cdaa' },
  { name: 'mediumblue', hex: '#0000cd' },
  { name: 'mediumorchid', hex: '#ba55d3' },
  { name: 'mediumpurple', hex: '#9370db' },
  { name: 'mediumseagreen', hex: '#3cb371' },
  { name: 'mediumslateblue', hex: '#7b68ee' },
  { name: 'mediumspringgreen', hex: '#00fa9a' },
  { name: 'mediumturquoise', hex: '#48d1cc' },
  { name: 'mediumvioletred', hex: '#c71585' },
  { name: 'midnightblue', hex: '#191970' },
  { name: 'mintcream', hex: '#f5fffa' },
  { name: 'mistyrose', hex: '#ffe4e1' },
  { name: 'moccasin', hex: '#ffe4b5' },
  { name: 'navajowhite', hex: '#ffdead' },
  { name: 'navy', hex: '#000080' },
  { name: 'oldlace', hex: '#fdf5e6' },
  { name: 'olive', hex: '#808000' },
  { name: 'olivedrab', hex: '#6b8e23' },
  { name: 'orange', hex: '#ffa500' },
  { name: 'orangered', hex: '#ff4500' },
  { name: 'orchid', hex: '#da70d6' },
  { name: 'palegoldenrod', hex: '#eee8aa' },
  { name: 'palegreen', hex: '#98fb98' },
  { name: 'paleturquoise', hex: '#afeeee' },
  { name: 'palevioletred', hex: '#db7093' },
  { name: 'papayawhip', hex: '#ffefd5' },
  { name: 'peachpuff', hex: '#ffdab9' },
  { name: 'peru', hex: '#cd853f' },
  { name: 'pink', hex: '#ffc0cb' },
  { name: 'plum', hex: '#dda0dd' },
  { name: 'powderblue', hex: '#b0e0e6' },
  { name: 'purple', hex: '#800080' },
  { name: 'rebeccapurple', hex: '#663399' },
  { name: 'red', hex: '#ff0000' },
  { name: 'rosybrown', hex: '#bc8f8f' },
  { name: 'royalblue', hex: '#4169e1' },
  { name: 'saddlebrown', hex: '#8b4513' },
  { name: 'salmon', hex: '#fa8072' },
  { name: 'sandybrown', hex: '#f4a460' },
  { name: 'seagreen', hex: '#2e8b57' },
  { name: 'seashell', hex: '#fff5ee' },
  { name: 'sienna', hex: '#a0522d' },
  { name: 'silver', hex: '#c0c0c0' },
  { name: 'skyblue', hex: '#87ceeb' },
  { name: 'slateblue', hex: '#6a5acd' },
  { name: 'slategray', hex: '#708090' },
  { name: 'snow', hex: '#fffafa' },
  { name: 'springgreen', hex: '#00ff7f' },
  { name: 'steelblue', hex: '#4682b4' },
  { name: 'tan', hex: '#d2b48c' },
  { name: 'teal', hex: '#008080' },
  { name: 'thistle', hex: '#d8bfd8' },
  { name: 'tomato', hex: '#ff6347' },
  { name: 'turquoise', hex: '#40e0d0' },
  { name: 'violet', hex: '#ee82ee' },
  { name: 'wheat', hex: '#f5deb3' },
  { name: 'white', hex: '#ffffff' },
  { name: 'whitesmoke', hex: '#f5f5f5' },
  { name: 'yellow', hex: '#ffff00' },
  { name: 'yellowgreen', hex: '#9acd32' },
]

// 解析颜色值为HEX
function parseColor(str) {
  str = str.trim()
  // HEX格式
  if (/^#?([0-9a-fA-F]{3}){1,2}$/.test(str)) {
    const hex = str.startsWith('#') ? str : '#' + str
    if (hex.length === 4) {
      const r = hex[1] + hex[1]
      const g = hex[2] + hex[2]
      const b = hex[3] + hex[3]
      return `#${r}${g}${b}`
    }
    return hex.toLowerCase()
  }
  // rgb格式
  const rgbMatch = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0')
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0')
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0')
    return `#${r}${g}${b}`
  }
  return null
}

const validHex = computed(() => parseColor(inputColor.value))

function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  }
}

// 欧氏距离计算颜色差
function colorDistance(hex1, hex2) {
  const c1 = hexToRgb(hex1)
  const c2 = hexToRgb(hex2)
  return Math.sqrt(
    (c1.r - c2.r) ** 2 +
    (c1.g - c2.g) ** 2 +
    (c1.b - c2.b) ** 2
  )
}

// 计算匹配结果
const matchedColors = computed(() => {
  if (!validHex.value) return []
  return namedColors
    .map(c => ({ ...c, distance: colorDistance(validHex.value, c.hex) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 10)
})

// 正向搜索
const forwardResults = computed(() => {
  if (!nameSearch.value.trim()) return []
  const q = nameSearch.value.trim().toLowerCase()
  return namedColors.filter(c => c.name.includes(q))
})

function textColorFor(hex) {
  if (!hex) return '#333'
  const { r, g, b } = hexToRgb(hex)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128 ? '#1a1a1a' : '#ffffff'
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    copyLabel.value = '已复制'
    setTimeout(() => { copyLabel.value = '复制' }, 1500)
  })
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
  margin-bottom: 1rem;
  font-size: 0.9rem;
}
.mode-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.tab-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.tab-btn.active {
  background: #4f46e5;
  color: #fff;
  border-color: #4f46e5;
}
.input-section {
  margin-bottom: 1rem;
}
.input-section label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 500;
  color: #555;
}
.input-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.color-picker {
  width: 48px;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 2px;
  cursor: pointer;
}
.text-input {
  flex: 1;
  padding: 0.6rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  font-family: monospace;
}
.text-input:focus {
  border-color: #4f46e5;
}
.preview-bar {
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.8rem;
  font-family: monospace;
  font-weight: 600;
  font-size: 0.95rem;
}
.results {
  margin-top: 1.5rem;
}
.results h3 {
  margin-bottom: 0.8rem;
}
.match-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.match-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.8rem;
  border-radius: 8px;
  background: #f8f9fa;
  border: 1px solid #eee;
}
.match-rank {
  font-weight: 600;
  color: #888;
  min-width: 2rem;
  font-size: 0.85rem;
}
.match-swatch {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #ddd;
  flex-shrink: 0;
}
.match-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.match-name {
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
}
.match-hex {
  color: #888;
  font-family: monospace;
  font-size: 0.8rem;
}
.match-dist {
  color: #aaa;
  font-size: 0.8rem;
  font-family: monospace;
}
.btn-sm {
  padding: 0.2rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 0.75rem;
  color: #666;
}
.btn-sm:hover {
  background: #f0f0f0;
}
.color-list {
  margin-top: 1rem;
  max-height: 400px;
  overflow-y: auto;
}
.color-list-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}
.color-list-item:hover {
  background: #f0f0f0;
}
.list-swatch {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 1px solid #ddd;
  flex-shrink: 0;
}
.list-name {
  flex: 1;
  font-size: 0.85rem;
  color: #333;
}
.list-hex {
  font-family: monospace;
  font-size: 0.8rem;
  color: #888;
}
.back-link {
  display: inline-block;
  margin-top: 1.5rem;
  color: #4f46e5;
  text-decoration: none;
}
.back-link:hover {
  text-decoration: underline;
}
@media (max-width: 640px) {
  .match-item {
    flex-wrap: wrap;
  }
  .match-dist {
    display: none;
  }
}
</style>
