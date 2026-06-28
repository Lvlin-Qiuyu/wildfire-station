<template>
  <div class="tool-page">
    <h2>📏 生活物品尺寸对比器</h2>
    <p class="description">屏幕尺寸、纸张尺寸、家具尺寸的可视化对比和适配建议，直观展示比例关系</p>

    <div class="control-section">
      <div class="item-selector">
        <label>选择第一个物品：</label>
        <select v-model="firstItem" @change="updateComparison">
          <option value="">请选择</option>
          <optgroup label="屏幕尺寸">
            <option v-for="item in screenSizes" :key="'screen1-'+item.id" :value="item">
              {{item.name}} ({{item.width}}×{{item.height}})
            </option>
          </optgroup>
          <optgroup label="纸张尺寸">
            <option v-for="item in paperSizes" :key="'paper1-'+item.id" :value="item">
              {{item.name}} ({{item.width}}×{{item.height}})
            </option>
          </optgroup>
          <optgroup label="家具尺寸">
            <option v-for="item in furnitureSizes" :key="'furniture1-'+item.id" :value="item">
              {{item.name}} ({{item.width}}×{{item.height}})
            </option>
          </optgroup>
        </select>
      </div>

      <div class="swap-btn">
        <button @click="swapItems" :disabled="!firstItem || !secondItem">
          ↔️ 交换
        </button>
      </div>

      <div class="item-selector">
        <label>选择第二个物品：</label>
        <select v-model="secondItem" @change="updateComparison">
          <option value="">请选择</option>
          <optgroup label="屏幕尺寸">
            <option v-for="item in screenSizes" :key="'screen2-'+item.id" :value="item">
              {{item.name}} ({{item.width}}×{{item.height}})
            </option>
          </optgroup>
          <optgroup label="纸张尺寸">
            <option v-for="item in paperSizes" :key="'paper2-'+item.id" :value="item">
              {{item.name}} ({{item.width}}×{{item.height}})
            </option>
          </optgroup>
          <optgroup label="家具尺寸">
            <option v-for="item in furnitureSizes" :key="'furniture2-'+item.id" :value="item">
              {{item.name}} ({{item.width}}×{{item.height}})
            </option>
          </optgroup>
        </select>
      </div>
    </div>

    <div v-if="comparisonResult" class="comparison-section">
      <div class="comparison-canvas">
        <div class="canvas-container">
          <div class="size-item first-item" :style="firstItemStyle">
            <div class="size-info">
              <div class="item-name">{{firstItem.name}}</div>
              <div class="item-size">{{firstItem.width}} × {{firstItem.height}}</div>
              <div class="item-area">面积：{{firstItemArea}} cm²</div>
            </div>
          </div>
          
          <div class="size-ratio" v-if="secondItem">
            <span class="ratio-text">{{ratioText}}</span>
          </div>
          
          <div class="size-item second-item" :style="secondItemStyle">
            <div class="size-info">
              <div class="item-name">{{secondItem.name}}</div>
              <div class="item-size">{{secondItem.width}} × {{secondItem.height}}</div>
              <div class="item-area">面积：{{secondItemArea}} cm²</div>
            </div>
          </div>
        </div>
      </div>

      <div class="comparison-info">
        <div class="info-grid">
          <div class="info-item">
            <span class="label">面积比例：</span>
            <span class="value">{{areaRatioText}}</span>
          </div>
          <div class="info-item">
            <span class="label">宽度比例：</span>
            <span class="value">{{widthRatioText}}</span>
          </div>
          <div class="info-item">
            <span class="label">高度比例：</span>
            <span class="value">{{heightRatioText}}</span>
          </div>
          <div class="info-item">
            <span class="label">适配建议：</span>
            <span class="value">{{adaptationSuggestion}}</span>
          </div>
        </div>
      </div>

      <div class="preset-comparisons">
        <h3>常用对比场景</h3>
        <div class="preset-grid">
          <button 
            v-for="preset in presets" 
            :key="preset.id"
            @click="loadPreset(preset)"
            class="preset-btn"
          >
            <div class="preset-icon">{{preset.icon}}</div>
            <div class="preset-name">{{preset.name}}</div>
          </button>
        </div>
      </div>
    </div>

    <div v-if="comparisonResult" class="actions">
      <button @click="copyComparisonResult" class="btn-copy">
        {{ copyText }}
      </button>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '生活物品尺寸对比器 - 野火小站' })

const firstItem = ref(null)
const secondItem = ref(null)
const copyText = ref('复制对比结果')
const scale = ref(1) // 缩放比例

// 尺寸数据
const screenSizes = [
  { id: 'phone-smart', name: '智能手机', width: 6.7, height: 15, unit: 'cm' },
  { id: 'tablet-ipad', name: 'iPad', width: 24.6, height: 18.9, unit: 'cm' },
  { id: 'laptop-13', name: '13寸笔记本', width: 30.4, height: 19.8, unit: 'cm' },
  { id: 'laptop-15', name: '15寸笔记本', width: 35.6, height: 24.8, unit: 'cm' },
  { id: 'monitor-24', name: '24寸显示器', width: 53.1, height: 30, unit: 'cm' },
  { id: 'monitor-27', name: '27寸显示器', width: 59.8, height: 33.6, unit: 'cm' },
  { id: 'monitor-32', name: '32寸显示器', width: 70.9, height: 39.9, unit: 'cm' }
]

const paperSizes = [
  { id: 'paper-a4', name: 'A4纸', width: 21, height: 29.7, unit: 'cm' },
  { id: 'paper-a3', name: 'A3纸', width: 29.7, height: 42, unit: 'cm' },
  { id: 'paper-letter', name: 'Letter', width: 21.6, height: 27.9, unit: 'cm' },
  { id: 'paper-legal', name: 'Legal', width: 21.6, height: 35.6, unit: 'cm' },
  { id: 'paper-a5', name: 'A5纸', width: 14.8, height: 21, unit: 'cm' },
  { id: 'paper-b5', name: 'B5纸', width: 17.6, height: 25, unit: 'cm' }
]

const furnitureSizes = [
  { id: 'sofa-small', name: '单人沙发', width: 80, height: 90, unit: 'cm' },
  { id: 'sofa-large', name: '双人沙发', width: 150, height: 90, unit: 'cm' },
  { id: 'table-coffee', name: '茶几', width: 100, height: 60, unit: 'cm' },
  { id: 'table-dining', name: '餐桌', width: 120, height: 80, unit: 'cm' },
  { id: 'bed-single', name: '单人床', width: 90, height: 200, unit: 'cm' },
  { id: 'bed-double', name: '双人床', width: 150, height: 200, unit: 'cm' },
  { id: 'desk', name: '书桌', width: 120, height: 60, unit: 'cm' },
  { id: 'wardrobe', name: '衣柜', width: 100, height: 60, unit: 'cm' }
]

const presets = [
  { id: 'phone-tablet', name: '手机 vs iPad', icon: '📱📱', first: 'phone-smart', second: 'tablet-ipad' },
  { id: 'laptop-monitor', name: '笔记本 vs 显示器', icon: '💻🖥️', first: 'laptop-15', second: 'monitor-24' },
  { id: 'paper-screen', name: 'A4纸 vs 显示器', icon: '📄🖥️', first: 'paper-a4', second: 'monitor-24' },
  { id: 'sofa-room', name: '沙发 vs 房间', icon: '🛋️🏠', first: 'sofa-large', second: { width: 300, height: 400, name: '标准房间', unit: 'cm' } }
]

// 计算属性
const firstItemStyle = computed(() => {
  if (!firstItem.value) return {}
  
  // 计算合适的显示尺寸
  const maxWidth = 200
  const maxHeight = 300
  const itemRatio = firstItem.value.width / firstItem.value.height
  
  let displayWidth = maxWidth
  let displayHeight = displayWidth / itemRatio
  
  if (displayHeight > maxHeight) {
    displayHeight = maxHeight
    displayWidth = displayHeight * itemRatio
  }
  
  return {
    width: `${displayWidth}px`,
    height: `${displayHeight}px`
  }
})

const secondItemStyle = computed(() => {
  if (!secondItem.value) return {}
  
  // 相对于第一个物品的比例
  const firstArea = firstItem.value.width * firstItem.value.height
  const secondArea = secondItem.value.width * secondItem.value.height
  const scale = Math.sqrt(firstArea / secondArea)
  
  const itemRatio = secondItem.value.width / secondItem.value.height
  const displayHeight = firstItemStyle.value.height
  const displayWidth = displayHeight / itemRatio * scale
  
  return {
    width: `${displayWidth}px`,
    height: `${displayHeight}px`
  }
})

const firstItemArea = computed(() => {
  return firstItem.value ? Math.round(firstItem.value.width * firstItem.value.height) : 0
})

const secondItemArea = computed(() => {
  return secondItem.value ? Math.round(secondItem.value.width * secondItem.value.height) : 0
})

const comparisonResult = computed(() => {
  return firstItem.value && secondItem.value
})

const ratioText = computed(() => {
  if (!firstItem.value || !secondItem.value) return ''
  
  const firstArea = firstItem.value.width * firstItem.value.height
  const secondArea = secondItem.value.width * secondItem.value.height
  const ratio = firstArea / secondArea
  
  return `${ratio.toFixed(2)}倍`
})

const areaRatioText = computed(() => {
  if (!firstItem.value || !secondItem.value) return ''
  
  const ratio = firstItemArea.value / secondItemArea.value
  return `${ratio.toFixed(2)}倍 (${Math.round(ratio * 100)}%)`
})

const widthRatioText = computed(() => {
  if (!firstItem.value || !secondItem.value) return ''
  
  const ratio = firstItem.value.width / secondItem.value.width
  return `${ratio.toFixed(2)}倍`
})

const heightRatioText = computed(() => {
  if (!firstItem.value || !secondItem.value) return ''
  
  const ratio = firstItem.value.height / secondItem.value.height
  return `${ratio.toFixed(2)}倍`
})

const adaptationSuggestion = computed(() => {
  if (!firstItem.value || !secondItem.value) return ''
  
  const widthRatio = firstItem.value.width / secondItem.value.width
  const heightRatio = firstItem.value.height / secondItem.value.height
  
  if (widthRatio > 1.5 || heightRatio > 1.5) {
    return '第一个物品明显大于第二个，可能需要考虑空间布局'
  } else if (widthRatio < 0.7 || heightRatio < 0.7) {
    return '第一个物品明显小于第二个，可能需要放大查看'
  } else {
    return '两个物品尺寸相近，比例协调'
  }
})

// 方法
const updateComparison = () => {
  // 更新对比结果
}

const swapItems = () => {
  const temp = firstItem.value
  firstItem.value = secondItem.value
  secondItem.value = temp
}

const loadPreset = (preset) => {
  if (preset.first.id) {
    firstItem.value = preset.first
  } else {
    firstItem.value = preset.first
  }
  
  if (preset.second.id) {
    secondItem.value = preset.second
  } else {
    secondItem.value = preset.second
  }
}

const copyComparisonResult = () => {
  if (!comparisonResult.value) return
  
  const result = `
物品对比：
${firstItem.value.name} vs ${secondItem.value.name}

尺寸对比：
${firstItem.value.width} × ${firstItem.value.height} ${firstItem.value.unit} vs ${secondItem.value.width} × ${secondItem.value.height} ${secondItem.value.unit}

面积比例：${areaRatioText.value}
宽度比例：${widthRatioText.value}
高度比例：${heightRatioText.value}
适配建议：${adaptationSuggestion.value}
  `.trim()

  navigator.clipboard.writeText(result).then(() => {
    copyText.value = '已复制'
    setTimeout(() => {
      copyText.value = '复制对比结果'
    }, 2000)
  }).catch(() => {
    alert('复制失败，请手动复制')
  })
}
</script>

<style scoped>
.tool-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

.description {
  color: #666;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.control-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.item-selector {
  flex: 1;
  min-width: 200px;
}

.item-selector label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.item-selector select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  background: white;
}

.swap-btn {
  display: flex;
  align-items: center;
}

.swap-btn button {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s ease;
}

.swap-btn button:hover:not(:disabled) {
  background: #5a6268;
}

.swap-btn button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.comparison-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.comparison-canvas {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.canvas-container {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
  position: relative;
}

.size-item {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #007bff;
  border-radius: 8px;
  background: #f8f9ff;
  position: relative;
  transition: all 0.3s ease;
}

.first-item {
  border-color: #007bff;
  background: #e3f2fd;
}

.second-item {
  border-color: #28a745;
  background: #e8f5e8;
}

.size-info {
  text-align: center;
  padding: 1rem;
}

.item-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.item-size {
  font-family: monospace;
  color: #666;
  margin-bottom: 0.25rem;
}

.item-area {
  font-size: 0.9rem;
  color: #888;
}

.size-ratio {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ratio-text {
  background: #ffc107;
  color: #333;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 1.1rem;
}

.comparison-info {
  margin-bottom: 2rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item {
  background: white;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.info-item .label {
  font-weight: 500;
  color: #666;
  display: block;
  margin-bottom: 0.5rem;
}

.info-item .value {
  color: #333;
  font-weight: 600;
}

.preset-comparisons {
  margin-bottom: 2rem;
}

.preset-comparisons h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.preset-btn {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.preset-btn:hover {
  border-color: #007bff;
  background: #f0f8ff;
}

.preset-icon {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.preset-name {
  font-size: 0.9rem;
  color: #333;
  font-weight: 500;
}

.actions {
  margin-bottom: 2rem;
}

.btn-copy {
  background: #28a745;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s ease;
}

.btn-copy:hover {
  background: #218838;
}

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
}

.back-link:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .tool-page {
    padding: 1rem;
  }
  
  .control-section {
    flex-direction: column;
  }
  
  .item-selector {
    width: 100%;
  }
  
  .canvas-container {
    flex-direction: column;
    gap: 1rem;
  }
  
  .size-ratio {
    order: -1;
  }
  
  .preset-grid {
    grid-template-columns: 1fr;
  }
}
</style>