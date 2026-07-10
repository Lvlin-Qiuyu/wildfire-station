<template>
  <div class="tool-page">
    <h2>🏯 中国传统色卡</h2>
    <p class="tool-desc">收录中国传统色彩，按色系分类浏览，搜索色名查看色值</p>

    <!-- 搜索 -->
    <div class="input-section">
      <input
        v-model="searchText"
        class="search-input"
        placeholder="搜索色名，如「妃红」「靛蓝」「秋香」…"
        spellcheck="false"
      />
    </div>

    <!-- 色系分类 -->
    <div class="category-tabs">
      <button
        v-for="cat in categories"
        :key="cat.key"
        :class="['cat-btn', { active: activeCategory === cat.key }]"
        @click="activeCategory = cat.key"
      >
        {{ cat.icon }} {{ cat.label }}
      </button>
    </div>

    <!-- 色卡网格 -->
    <div class="color-grid">
      <div
        v-for="color in filteredColors"
        :key="color.name"
        class="color-card"
        @click="selectColor(color)"
      >
        <div class="color-swatch" :style="{ backgroundColor: color.hex }">
          <span class="swatch-label" :style="{ color: textColorForBg(color.hex) }">
            {{ color.name }}
          </span>
        </div>
        <div class="color-info">
          <span class="color-name">{{ color.name }}</span>
          <span class="color-hex">{{ color.hex }}</span>
        </div>
      </div>
    </div>

    <!-- 选中颜色详情 -->
    <div v-if="selectedColor" class="detail-panel">
      <h3>{{ selectedColor.name }}</h3>
      <div class="detail-row">
        <div class="detail-swatch" :style="{ backgroundColor: selectedColor.hex }"></div>
        <div class="detail-values">
          <div class="detail-item" v-for="item in selectedColorDetails" :key="item.label">
            <span class="detail-label">{{ item.label }}</span>
            <span class="detail-value">{{ item.value }}</span>
            <button class="btn-sm" @click="copyText(item.value)">{{ copyLabel }}</button>
          </div>
        </div>
      </div>
      <p v-if="selectedColor.desc" class="detail-desc">{{ selectedColor.desc }}</p>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '中国传统色卡 - 野火小站' })

const searchText = ref('')
const activeCategory = ref('all')
const selectedColor = ref(null)
const copyLabel = ref('复制')

// 中国传统色数据集
const colors = [
  // 红色系
  { name: '妃红', hex: '#ED5736', category: 'red', desc: '古时妃子所用胭脂色' },
  { name: '海棠红', hex: '#FF6B6B', category: 'red' },
  { name: '石榴红', hex: '#F25050', category: 'red' },
  { name: '樱桃色', hex: '#C24B5A', category: 'red' },
  { name: '银红', hex: '#F05672', category: 'red' },
  { name: '大红', hex: '#FF2121', category: 'red' },
  { name: '朱红', hex: '#FF4B33', category: 'red', desc: '朱砂之色' },
  { name: '朱砂', hex: '#FF461F', category: 'red' },
  { name: '赤丹', hex: '#FF4E20', category: 'red' },
  { name: '火红', hex: '#FF2D2D', category: 'red' },
  { name: '彤色', hex: '#F35336', category: 'red' },
  { name: '茜色', hex: '#CB3A56', category: 'red' },
  // 橙黄色系
  { name: '鹅黄', hex: '#FFF143', category: 'orange' },
  { name: '鸭黄', hex: '#FFD800', category: 'orange' },
  { name: '樱草色', hex: '#ECEB00', category: 'orange' },
  { name: '杏黄', hex: '#FFA400', category: 'orange' },
  { name: '杏红', hex: '#FF8C31', category: 'orange' },
  { name: '橘黄', hex: '#FF8936', category: 'orange' },
  { name: '橘红', hex: '#FF6A3D', category: 'orange' },
  { name: '姜黄', hex: '#FFC773', category: 'orange' },
  { name: '缃色', hex: '#F0C239', category: 'orange', desc: '浅黄色' },
  { name: '橙色', hex: '#FFA500', category: 'orange' },
  { name: '琥珀', hex: '#FFBF00', category: 'orange' },
  { name: '秋香', hex: '#D9B611', category: 'orange' },
  { name: '枯黄', hex: '#D3B17D', category: 'orange' },
  // 绿色系
  { name: '嫩绿', hex: '#A6E22E', category: 'green' },
  { name: '柳黄', hex: '#C9DD22', category: 'green' },
  { name: '柳绿', hex: '#AFDD22', category: 'green' },
  { name: '竹青', hex: '#789262', category: 'green', desc: '竹子之色' },
  { name: '葱黄', hex: '#A6D292', category: 'green' },
  { name: '葱绿', hex: '#01B448', category: 'green' },
  { name: '葱青', hex: '#0E926C', category: 'green' },
  { name: '油绿', hex: '#00BC12', category: 'green' },
  { name: '碧色', hex: '#1BD1A5', category: 'green' },
  { name: '青碧', hex: '#2EDFA3', category: 'green' },
  { name: '翡翠色', hex: '#3DE1AD', category: 'green' },
  { name: '草绿', hex: '#40DE5A', category: 'green' },
  { name: '松花色', hex: '#BCE672', category: 'green' },
  { name: '松花绿', hex: '#057748', category: 'green' },
  // 蓝色系
  { name: '靛青', hex: '#065279', category: 'blue', desc: '靛蓝染料之色' },
  { name: '靛蓝', hex: '#0652DD', category: 'blue' },
  { name: '蔚蓝', hex: '#70F3FF', category: 'blue' },
  { name: '碧蓝', hex: '#3EEDE7', category: 'blue' },
  { name: '宝蓝', hex: '#4B5CC4', category: 'blue' },
  { name: '藏青', hex: '#2E4E7E', category: 'blue' },
  { name: '藏蓝', hex: '#32528A', category: 'blue' },
  { name: '群青', hex: '#4C8DAE', category: 'blue', desc: '天然矿物颜料色' },
  { name: '花青', hex: '#003472', category: 'blue' },
  { name: '钴蓝', hex: '#1E3A8A', category: 'blue' },
  { name: '天青', hex: '#76D7C4', category: 'blue', desc: '雨后天色' },
  { name: '雨过天青', hex: '#87CEEB', category: 'blue' },
  // 紫色系
  { name: '紫色', hex: '#8E354A', category: 'purple' },
  { name: '雪青', hex: '#B0A0E9', category: 'purple' },
  { name: '丁香色', hex: '#CCA4E3', category: 'purple' },
  { name: '藕色', hex: '#E4C6D0', category: 'purple' },
  { name: '紫酱', hex: '#815476', category: 'purple' },
  { name: '紫檀', hex: '#4C221B', category: 'purple' },
  { name: '绛紫', hex: '#8C4356', category: 'purple' },
  { name: '青莲', hex: '#801DAE', category: 'purple' },
  { name: '紫棠', hex: '#915F6D', category: 'purple' },
  // 棕褐色系
  { name: '茶色', hex: '#B0926A', category: 'brown' },
  { name: '驼色', hex: '#A27B5C', category: 'brown' },
  { name: '栗色', hex: '#60281E', category: 'brown' },
  { name: '棕色', hex: '#6B4226', category: 'brown' },
  { name: '棕绿', hex: '#7B6D3E', category: 'brown' },
  { name: '棕黑', hex: '#724828', category: 'brown' },
  { name: '赭石', hex: '#845A33', category: 'brown', desc: '赤铁矿颜料色' },
  { name: '褐色', hex: '#8B6914', category: 'brown' },
  { name: '檀色', hex: '#B36D61', category: 'brown' },
  // 黑灰白系
  { name: '墨色', hex: '#50616D', category: 'mono', desc: '墨之色' },
  { name: '墨灰', hex: '#758A99', category: 'mono' },
  { name: '黛色', hex: '#4A4266', category: 'mono', desc: '古代妇女画眉用色' },
  { name: '黛黑', hex: '#424C50', category: 'mono' },
  { name: '玄青', hex: '#3D3B4F', category: 'mono' },
  { name: '鸦青', hex: '#424C50', category: 'mono' },
  { name: '苍色', hex: '#75878A', category: 'mono' },
  { name: '苍绿', hex: '#516D56', category: 'mono' },
  { name: '月白', hex: '#D6ECF0', category: 'mono', desc: '似月光之白' },
  { name: '霜色', hex: '#E9E7EF', category: 'mono' },
  { name: '象牙白', hex: '#FFFDDB', category: 'mono' },
  { name: '缟色', hex: '#F1E4C3', category: 'mono' },
]

const categories = [
  { key: 'all', icon: '🌈', label: '全部' },
  { key: 'red', icon: '🔴', label: '红' },
  { key: 'orange', icon: '🟠', label: '橙黄' },
  { key: 'green', icon: '🟢', label: '绿' },
  { key: 'blue', icon: '🔵', label: '蓝' },
  { key: 'purple', icon: '🟣', label: '紫' },
  { key: 'brown', icon: '🟤', label: '棕褐' },
  { key: 'mono', icon: '⚫', label: '黑白灰' },
]

const filteredColors = computed(() => {
  let result = colors
  if (activeCategory.value !== 'all') {
    result = result.filter(c => c.category === activeCategory.value)
  }
  if (searchText.value.trim()) {
    const q = searchText.value.trim().toLowerCase()
    result = result.filter(c => c.name.toLowerCase().includes(q))
  }
  return result
})

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex)
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  let h = 0, s = 0, l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break
      case gn: h = ((bn - rn) / d + 2) / 6; break
      case bn: h = ((rn - gn) / d + 4) / 6; break
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

const selectedColorDetails = computed(() => {
  if (!selectedColor.value) return []
  const c = selectedColor.value
  const { r, g, b } = hexToRgb(c.hex)
  const [h, s, l] = hexToHsl(c.hex)
  return [
    { label: 'HEX', value: c.hex },
    { label: 'RGB', value: `rgb(${r}, ${g}, ${b})` },
    { label: 'HSL', value: `hsl(${h}, ${s}%, ${l}%)` },
  ]
})

function selectColor(color) {
  selectedColor.value = color === selectedColor.value ? null : color
}

function textColorForBg(hex) {
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
.input-section {
  margin-bottom: 1rem;
}
.search-input {
  width: 100%;
  padding: 0.6rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}
.search-input:focus {
  border-color: #4f46e5;
}
.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1rem;
}
.cat-btn {
  padding: 0.35rem 0.7rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}
.cat-btn.active {
  background: #4f46e5;
  color: #fff;
  border-color: #4f46e5;
}
.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.6rem;
  margin-bottom: 1.5rem;
}
.color-card {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #eee;
  transition: transform 0.15s, box-shadow 0.15s;
}
.color-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.color-swatch {
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.swatch-label {
  font-size: 0.7rem;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
.color-info {
  padding: 0.3rem 0.4rem;
  background: #fafafa;
}
.color-name {
  display: block;
  font-size: 0.8rem;
  font-weight: 500;
  color: #333;
}
.color-hex {
  display: block;
  font-size: 0.7rem;
  color: #999;
  font-family: monospace;
}
.detail-panel {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}
.detail-panel h3 {
  margin: 0 0 0.8rem 0;
  font-size: 1.1rem;
}
.detail-row {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}
.detail-swatch {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  flex-shrink: 0;
  border: 1px solid #ddd;
}
.detail-values {
  flex: 1;
}
.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.3rem;
  font-size: 0.9rem;
}
.detail-label {
  color: #888;
  min-width: 2.5rem;
}
.detail-value {
  font-family: monospace;
  color: #333;
}
.btn-sm {
  padding: 0.15rem 0.5rem;
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
.detail-desc {
  margin-top: 0.8rem;
  color: #666;
  font-size: 0.85rem;
  font-style: italic;
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
  .color-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }
  .detail-swatch {
    width: 60px;
    height: 60px;
  }
}
</style>
