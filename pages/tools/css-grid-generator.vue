<template>
  <div class="tool-page">
    <h2>🧩 CSS Grid 可视化生成器</h2>
    <p class="subtitle">可视化创建 CSS Grid 布局，调节行列数、间距、对齐方式，支持网格区域划分，实时预览并一键复制代码</p>

    <!-- 预设布局模板 -->
    <div class="preset-section">
      <h3>预设布局模板</h3>
      <div class="preset-list">
        <button
          v-for="p in presets"
          :key="p.name"
          :class="['preset-btn', { active: activePreset === p.name }]"
          @click="applyPreset(p)"
        >
          <span class="preset-icon">{{ p.icon }}</span>
          {{ p.name }}
        </button>
      </div>
    </div>

    <div class="main-layout">
      <!-- 左侧：属性调节面板 -->
      <div class="panel">
        <!-- 网格容器属性 -->
        <div class="panel-block">
          <h3>容器属性</h3>

          <div class="prop-group">
            <label>columns <span class="prop-value">{{ columns }}</span></label>
            <div class="btn-group small">
              <button v-for="n in columnOptions" :key="n" :class="['prop-btn', { active: columns === n }]" @click="columns = n; adjustItems()">{{ n }}</button>
            </div>
          </div>

          <div class="prop-group">
            <label>rows <span class="prop-value">{{ rows }}</span></label>
            <div class="btn-group small">
              <button v-for="n in rowOptions" :key="n" :class="['prop-btn', { active: rows === n }]" @click="rows = n; adjustItems()">{{ n }}</button>
            </div>
          </div>

          <div class="prop-group">
            <label>gap <span class="prop-value">{{ containerProps.gap }}px</span></label>
            <input type="range" v-model.number="containerProps.gap" min="0" max="30" step="2" class="range-input" />
          </div>

          <div class="prop-group">
            <label>justify-items</label>
            <div class="btn-group">
              <button
                v-for="v in justifyItemsOptions"
                :key="v"
                :class="['prop-btn', { active: containerProps.justifyItems === v }]"
                @click="containerProps.justifyItems = v"
              >{{ v }}</button>
            </div>
          </div>

          <div class="prop-group">
            <label>align-items</label>
            <div class="btn-group">
              <button
                v-for="v in alignItemsOptions"
                :key="v"
                :class="['prop-btn', { active: containerProps.alignItems === v }]"
                @click="containerProps.alignItems = v"
              >{{ v }}</button>
            </div>
          </div>
        </div>

        <!-- 选中子项属性 -->
        <div class="panel-block">
          <h3>子项属性 <span class="hint" v-if="selectedItem === null">（点击预览区中的子项选中）</span></h3>
          <template v-if="selectedItem !== null">
            <div class="selected-indicator" :style="{ background: itemColors[selectedItem % itemColors.length] }">
              子项 {{ selectedItem + 1 }}
            </div>

            <div class="prop-group">
              <label>grid-column</label>
              <div class="span-control">
                <span>列：</span>
                <button class="btn-sm" @click="changeSpan('col', -1)">−</button>
                <span class="prop-value">{{ items[selectedItem].colSpan }}</span>
                <button class="btn-sm" @click="changeSpan('col', 1)">+</button>
              </div>
            </div>

            <div class="prop-group">
              <label>grid-row</label>
              <div class="span-control">
                <span>行：</span>
                <button class="btn-sm" @click="changeSpan('row', -1)">−</button>
                <span class="prop-value">{{ items[selectedItem].rowSpan }}</span>
                <button class="btn-sm" @click="changeSpan('row', 1)">+</button>
              </div>
            </div>

            <div class="prop-group">
              <label>grid-area 名称</label>
              <input
                type="text"
                v-model="items[selectedItem].areaName"
                :placeholder="'如 header / sidebar'"
                class="area-input"
                @input="syncAreaNames"
              />
            </div>
          </template>
        </div>

        <!-- 区域名称映射 -->
        <div class="panel-block" v-if="hasAreaNames">
          <h3>grid-template-areas</h3>
          <div class="area-map">
            <div v-for="(row, ri) in areaGrid" :key="ri" class="area-row">"{{ row.join(' ') }}"</div>
          </div>
          <p class="area-hint">💡 在子项属性中设置 area 名称来自动生成</p>
        </div>
      </div>

      <!-- 右侧：实时预览 -->
      <div class="preview-area">
        <div class="preview-header">
          <span>实时预览</span>
        </div>
        <div class="grid-preview" :style="gridContainerStyle">
          <div
            v-for="(item, idx) in items"
            :key="idx"
            :class="['grid-item', { selected: selectedItem === idx }]"
            :style="gridItemStyle(item)"
            @click="selectedItem = selectedItem === idx ? null : idx"
          >
            <span class="item-label">{{ idx + 1 }}</span>
            <span v-if="item.areaName" class="area-label">{{ item.areaName }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 代码输出 -->
    <div class="code-section">
      <div class="code-block">
        <div class="code-header">
          <span>CSS 代码</span>
          <button class="btn-copy" @click="copyCSS">{{ copyCSSText }}</button>
        </div>
        <pre class="code-pre"><code>{{ generatedCSS }}</code></pre>
      </div>
      <div class="code-block">
        <div class="code-header">
          <span>HTML 结构</span>
          <button class="btn-copy" @click="copyHTML">{{ copyHTMLText }}</button>
        </div>
        <pre class="code-pre"><code>{{ generatedHTML }}</code></pre>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'CSS Grid 可视化生成器 - 野火小站' })

// 子项颜色
const itemColors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']

// 网格行列
const columns = ref(3)
const rows = ref(3)
const columnOptions = [1, 2, 3, 4, 5, 6]
const rowOptions = [1, 2, 3, 4, 5, 6]

// 容器属性
const containerProps = reactive({
  gap: 10,
  justifyItems: 'stretch',
  alignItems: 'stretch',
})

// 属性选项
const justifyItemsOptions = ['stretch', 'start', 'end', 'center']
const alignItemsOptions = ['stretch', 'start', 'end', 'center']

// 子项数据
const items = ref([])

// 选中的子项
const selectedItem = ref(null)

// 当前预设名称
const activePreset = ref(null)

// 初始化子项
function initItems() {
  const arr = []
  for (let r = 0; r < rows.value; r++) {
    for (let c = 0; c < columns.value; c++) {
      arr.push({ colSpan: 1, rowSpan: 1, areaName: '' })
    }
  }
  items.value = arr
}

// 调整子项数量
function adjustItems() {
  const total = columns.value * rows.value
  const current = items.value.length

  if (total > current) {
    for (let i = current; i < total; i++) {
      items.value.push({ colSpan: 1, rowSpan: 1, areaName: '' })
    }
  } else if (total < current) {
    items.value.splice(total)
    if (selectedItem.value !== null && selectedItem.value >= total) {
      selectedItem.value = null
    }
  }
  activePreset.value = null
}

// 切换子项跨度
function changeSpan(type, delta) {
  if (selectedItem.value === null) return
  const item = items.value[selectedItem.value]
  const max = type === 'col' ? columns.value : rows.value
  const newVal = item[type === 'col' ? 'colSpan' : 'rowSpan'] + delta
  if (newVal >= 1 && newVal <= max) {
    item[type === 'col' ? 'colSpan' : 'rowSpan'] = newVal
  }
}

// 同步区域名称（重算 area grid）
function syncAreaNames() {
  // areaGrid 是 computed，自动更新
}

// 区域名称映射网格
const hasAreaNames = computed(() => items.value.some(it => it.areaName.trim()))

const areaGrid = computed(() => {
  const grid = []
  for (let r = 0; r < rows.value; r++) {
    const row = []
    for (let c = 0; c < columns.value; c++) {
      // 查找这个格子被哪个子项覆盖
      let found = false
      for (let i = 0; i < items.value.length; i++) {
        const item = items.value[i]
        if (item.areaName.trim()) {
          const itemRow = Math.floor(i / columns.value)
          const itemCol = i % columns.value
          if (r >= itemRow && r < itemRow + item.rowSpan && c >= itemCol && c < itemCol + item.colSpan) {
            row.push(item.areaName)
            found = true
            break
          }
        }
      }
      if (!found) row.push('.')
    }
    grid.push(row)
  }
  return grid
})

// 容器内联样式
const gridContainerStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${columns.value}, 1fr)`,
  gridTemplateRows: `repeat(${rows.value}, 1fr)`,
  gap: containerProps.gap + 'px',
  justifyItems: containerProps.justifyItems,
  alignItems: containerProps.alignItems,
}))

// 子项内联样式
function gridItemStyle(item) {
  return {
    background: itemColors[items.value.indexOf(item) % itemColors.length],
    gridColumn: `span ${item.colSpan}`,
    gridRow: `span ${item.rowSpan}`,
  }
}

// 生成 CSS 代码
const generatedCSS = computed(() => {
  let css = `.container {\n`
  css += `  display: grid;\n`
  css += `  grid-template-columns: repeat(${columns.value}, 1fr);\n`
  css += `  grid-template-rows: repeat(${rows.value}, 1fr);\n`
  css += `  gap: ${containerProps.gap}px;\n`
  css += `  justify-items: ${containerProps.justifyItems};\n`
  css += `  align-items: ${containerProps.alignItems};\n`

  // 如果有区域名称，添加 grid-template-areas
  if (hasAreaNames.value) {
    css += `  grid-template-areas:\n`
    for (const row of areaGrid.value) {
      css += `    "${row.join(' ')}"\n`
    }
  }

  css += `}\n`

  // 输出跨度和区域的子项
  for (let i = 0; i < items.value.length; i++) {
    const item = items.value[i]
    const props = []
    if (item.colSpan > 1) props.push(`grid-column: span ${item.colSpan}`)
    if (item.rowSpan > 1) props.push(`grid-row: span ${item.rowSpan}`)
    if (item.areaName.trim()) props.push(`grid-area: ${item.areaName}`)
    if (props.length) {
      css += `\n.item-${i + 1} {\n`
      css += `  ${props.join(';\n  ')};\n`
      css += `}\n`
    }
  }
  return css
})

// 生成 HTML 代码
const generatedHTML = computed(() => {
  let html = `<div class="container">\n`
  for (let i = 0; i < items.value.length; i++) {
    const item = items.value[i]
    let cls = `item-${i + 1}`
    if (item.areaName.trim()) cls += ` ${item.areaName}`
    html += `  <div class="${cls}">子项 ${i + 1}</div>\n`
  }
  html += `</div>`
  return html
})

// 预设布局模板
const presets = [
  {
    name: '经典三栏',
    icon: '📐',
    columns: 3, rows: 1,
    container: { gap: 10, justifyItems: 'stretch', alignItems: 'stretch' },
    items: [
      { colSpan: 1, rowSpan: 1, areaName: '' },
      { colSpan: 1, rowSpan: 1, areaName: '' },
      { colSpan: 1, rowSpan: 1, areaName: '' },
    ],
  },
  {
    name: '圣杯布局',
    icon: '⛪',
    columns: 3, rows: 2,
    container: { gap: 10, justifyItems: 'stretch', alignItems: 'stretch' },
    items: [
      { colSpan: 3, rowSpan: 1, areaName: 'header' },
      { colSpan: 1, rowSpan: 1, areaName: 'sidebar' },
      { colSpan: 1, rowSpan: 1, areaName: 'main' },
      { colSpan: 1, rowSpan: 1, areaName: 'aside' },
      { colSpan: 3, rowSpan: 1, areaName: 'footer' },
    ],
  },
  {
    name: '仪表盘',
    icon: '📊',
    columns: 4, rows: 3,
    container: { gap: 10, justifyItems: 'stretch', alignItems: 'stretch' },
    items: [
      { colSpan: 4, rowSpan: 1, areaName: '' },
      { colSpan: 2, rowSpan: 1, areaName: '' },
      { colSpan: 2, rowSpan: 1, areaName: '' },
      { colSpan: 2, rowSpan: 1, areaName: '' },
      { colSpan: 2, rowSpan: 1, areaName: '' },
      { colSpan: 4, rowSpan: 1, areaName: '' },
    ],
  },
  {
    name: '网格相册',
    icon: '🖼️',
    columns: 3, rows: 3,
    container: { gap: 8, justifyItems: 'center', alignItems: 'center' },
    items: Array(9).fill(null).map(() => ({ colSpan: 1, rowSpan: 1, areaName: '' })),
  },
  {
    name: '卡片布局',
    icon: '🃏',
    columns: 2, rows: 3,
    container: { gap: 12, justifyItems: 'stretch', alignItems: 'stretch' },
    items: Array(6).fill(null).map(() => ({ colSpan: 1, rowSpan: 1, areaName: '' })),
  },
  {
    name: '杂志封面',
    icon: '📰',
    columns: 3, rows: 3,
    container: { gap: 8, justifyItems: 'stretch', alignItems: 'stretch' },
    items: [
      { colSpan: 2, rowSpan: 2, areaName: '' },
      { colSpan: 1, rowSpan: 1, areaName: '' },
      { colSpan: 1, rowSpan: 1, areaName: '' },
      { colSpan: 1, rowSpan: 1, areaName: '' },
      { colSpan: 2, rowSpan: 1, areaName: '' },
      { colSpan: 3, rowSpan: 1, areaName: '' },
    ],
  },
]

// 应用预设
function applyPreset(preset) {
  activePreset.value = preset.name
  columns.value = preset.columns
  rows.value = preset.rows
  Object.assign(containerProps, preset.container)
  items.value = preset.items.map(it => ({ ...it }))
  selectedItem.value = null
}

// 复制按钮文本
const copyCSSText = ref('复制 CSS')
const copyHTMLText = ref('复制 HTML')

function copyCSS() {
  navigator.clipboard.writeText(generatedCSS.value).then(() => {
    copyCSSText.value = '已复制 ✓'
    setTimeout(() => { copyCSSText.value = '复制 CSS' }, 1500)
  })
}

function copyHTML() {
  navigator.clipboard.writeText(generatedHTML.value).then(() => {
    copyHTMLText.value = '已复制 ✓'
    setTimeout(() => { copyHTMLText.value = '复制 HTML' }, 1500)
  })
}

// 初始化
initItems()
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

/* 预设模板 */
.preset-section {
  margin-bottom: 1.2rem;
}
.preset-section h3 {
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 0.6rem;
}
.preset-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.preset-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.45rem 0.8rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}
.preset-btn:hover {
  border-color: #22c55e;
  background: #f0fdf4;
}
.preset-btn.active {
  border-color: #22c55e;
  background: #f0fdf4;
  color: #16a34a;
  font-weight: 600;
}
.preset-icon {
  font-size: 1rem;
}

/* 主布局 */
.main-layout {
  display: flex;
  gap: 1.2rem;
  margin-bottom: 1.2rem;
}

/* 属性面板 */
.panel {
  width: 280px;
  flex-shrink: 0;
}
.panel-block {
  background: #fff;
  border-radius: 10px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 1rem;
}
.panel-block h3 {
  font-size: 0.95rem;
  color: #333;
  margin-bottom: 0.8rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid #f3f4f6;
}
.hint {
  font-size: 0.78rem;
  color: #999;
  font-weight: 400;
}

.prop-group {
  margin-bottom: 0.7rem;
}
.prop-group label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.82rem;
  font-weight: 500;
  color: #666;
  margin-bottom: 0.3rem;
}
.prop-value {
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  color: #16a34a;
  font-weight: 600;
}
.btn-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}
.btn-group.small .prop-btn {
  font-size: 0.78rem;
  padding: 0.25rem 0.5rem;
}
.prop-btn {
  padding: 0.3rem 0.55rem;
  border: 1px solid #e5e7eb;
  border-radius: 5px;
  background: #fff;
  cursor: pointer;
  font-size: 0.78rem;
  font-family: 'Courier New', monospace;
  transition: all 0.15s;
}
.prop-btn:hover {
  border-color: #22c55e;
}
.prop-btn.active {
  background: #22c55e;
  color: #fff;
  border-color: #22c55e;
}

.range-input {
  width: 100%;
  accent-color: #22c55e;
  cursor: pointer;
}

.selected-indicator {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  color: #fff;
  font-size: 0.82rem;
  font-weight: 600;
  margin-bottom: 0.6rem;
}

.span-control {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
}
.btn-sm {
  width: 24px;
  height: 24px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.btn-sm:hover {
  border-color: #22c55e;
  color: #22c55e;
}

.area-input {
  width: 100%;
  padding: 0.35rem 0.6rem;
  border: 1px solid #e5e7eb;
  border-radius: 5px;
  font-size: 0.82rem;
  outline: none;
  transition: border-color 0.2s;
}
.area-input:focus {
  border-color: #22c55e;
}
.area-input::placeholder {
  color: #bbb;
}

.area-map {
  font-family: 'Courier New', monospace;
  font-size: 0.78rem;
  background: #f8f9fa;
  padding: 0.6rem;
  border-radius: 6px;
  line-height: 1.8;
}
.area-hint {
  font-size: 0.75rem;
  color: #999;
  margin-top: 0.4rem;
}

/* 预览区域 */
.preview-area {
  flex: 1;
  min-width: 0;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 1rem;
}
.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.8rem;
  font-size: 0.95rem;
  color: #555;
  font-weight: 600;
}

.grid-preview {
  min-height: 300px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 12px;
  transition: all 0.3s ease;
}
.grid-item {
  min-height: 50px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0.5rem;
  box-sizing: border-box;
  gap: 2px;
}
.grid-item:hover {
  opacity: 0.9;
  transform: scale(1.02);
}
.grid-item.selected {
  outline: 3px solid #1a1a1a;
  outline-offset: 2px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}
.item-label {
  font-size: 1rem;
}
.area-label {
  font-size: 0.72rem;
  opacity: 0.85;
  font-weight: 400;
}

/* 代码输出 */
.code-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}
.code-block {
  background: #1e293b;
  border-radius: 10px;
  overflow: hidden;
}
.code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 1rem;
  background: #334155;
}
.code-header span {
  color: #e2e8f0;
  font-size: 0.85rem;
  font-weight: 500;
}
.btn-copy {
  padding: 0.3rem 0.8rem;
  background: #22c55e;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: opacity 0.2s;
}
.btn-copy:hover { opacity: 0.85; }
.code-pre {
  margin: 0;
  padding: 1rem;
  overflow-x: auto;
  color: #e2e8f0;
  font-family: 'Courier New', monospace;
  font-size: 0.82rem;
  line-height: 1.6;
  white-space: pre;
}

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #22c55e;
  font-weight: 500;
}
.back-link:hover { text-decoration: underline; }

@media (max-width: 768px) {
  .main-layout {
    flex-direction: column;
  }
  .panel {
    width: 100%;
  }
  .grid-preview {
    min-height: 200px;
  }
}
</style>
