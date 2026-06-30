<template>
  <div class="tool-page">
    <h2>🧩 CSS Flexbox 可视化生成器</h2>
    <p class="subtitle">交互式调整 Flex 容器和子项属性，实时预览布局效果，一键复制完整 CSS 和 HTML 代码</p>

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
        <!-- 容器属性 -->
        <div class="panel-block">
          <h3>容器属性</h3>

          <div class="prop-group">
            <label>flex-direction</label>
            <div class="btn-group">
              <button
                v-for="v in flexDirectionOptions"
                :key="v"
                :class="['prop-btn', { active: containerProps.flexDirection === v }]"
                @click="containerProps.flexDirection = v"
              >{{ v }}</button>
            </div>
          </div>

          <div class="prop-group">
            <label>justify-content</label>
            <div class="btn-group">
              <button
                v-for="v in justifyContentOptions"
                :key="v"
                :class="['prop-btn', { active: containerProps.justifyContent === v }]"
                @click="containerProps.justifyContent = v"
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

          <div class="prop-group">
            <label>flex-wrap</label>
            <div class="btn-group">
              <button
                v-for="v in flexWrapOptions"
                :key="v"
                :class="['prop-btn', { active: containerProps.flexWrap === v }]"
                @click="containerProps.flexWrap = v"
              >{{ v }}</button>
            </div>
          </div>

          <div class="prop-group">
            <label>align-content</label>
            <div class="btn-group">
              <button
                v-for="v in alignContentOptions"
                :key="v"
                :class="['prop-btn', { active: containerProps.alignContent === v }]"
                @click="containerProps.alignContent = v"
              >{{ v }}</button>
            </div>
          </div>

          <div class="prop-group">
            <label>gap <span class="prop-value">{{ containerProps.gap }}px</span></label>
            <input
              type="range"
              v-model.number="containerProps.gap"
              min="0"
              max="40"
              step="2"
              class="range-input"
            />
          </div>
        </div>

        <!-- 子项属性（选中子项后调节） -->
        <div class="panel-block">
          <h3>子项属性 <span class="hint" v-if="!selectedItem">（点击预览区中的子项选中）</span></h3>
          <template v-if="selectedItem">
            <div class="selected-indicator" :style="{ background: itemColors[selectedItem.idx] }">
              子项 {{ selectedItem.idx + 1 }}
            </div>

            <div class="prop-group">
              <label>flex-grow <span class="prop-value">{{ items[selectedItem.idx].flexGrow }}</span></label>
              <input
                type="range"
                v-model.number="items[selectedItem.idx].flexGrow"
                min="0"
                max="5"
                step="1"
                class="range-input"
              />
            </div>

            <div class="prop-group">
              <label>flex-shrink <span class="prop-value">{{ items[selectedItem.idx].flexShrink }}</span></label>
              <input
                type="range"
                v-model.number="items[selectedItem.idx].flexShrink"
                min="0"
                max="5"
                step="1"
                class="range-input"
              />
            </div>

            <div class="prop-group">
              <label>flex-basis <span class="prop-value">{{ items[selectedItem.idx].flexBasis }}</span></label>
              <div class="btn-group small">
                <button
                  v-for="v in flexBasisOptions"
                  :key="v"
                  :class="['prop-btn', { active: items[selectedItem.idx].flexBasis === v }]"
                  @click="items[selectedItem.idx].flexBasis = v"
                >{{ v }}</button>
              </div>
            </div>

            <div class="prop-group">
              <label>order <span class="prop-value">{{ items[selectedItem.idx].order }}</span></label>
              <input
                type="range"
                v-model.number="items[selectedItem.idx].order"
                min="-2"
                max="5"
                step="1"
                class="range-input"
              />
            </div>
          </template>
        </div>
      </div>

      <!-- 右侧：实时预览 -->
      <div class="preview-area">
        <div class="preview-header">
          <span>实时预览</span>
          <div class="item-count-control">
            子项数量：
            <button class="btn-sm" @click="changeItemCount(-1)" :disabled="items.length <= 2">−</button>
            <span>{{ items.length }}</span>
            <button class="btn-sm" @click="changeItemCount(1)" :disabled="items.length >= 8">+</button>
          </div>
        </div>
        <div
          class="flex-preview"
          :style="containerStyle"
        >
          <div
            v-for="(item, idx) in items"
            :key="idx"
            :class="['flex-item', { selected: selectedItem && selectedItem.idx === idx }]"
            :style="itemStyle(item, idx)"
            @click="selectedItem = { idx }"
          >
            {{ idx + 1 }}
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
useHead({ title: 'CSS Flexbox 可视化生成器 - 野火小站' })

// 子项颜色
const itemColors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']

// 容器属性
const containerProps = reactive({
  flexDirection: 'row',
  justifyContent: 'flex-start',
  alignItems: 'stretch',
  flexWrap: 'nowrap',
  alignContent: 'stretch',
  gap: 0
})

// 属性选项
const flexDirectionOptions = ['row', 'row-reverse', 'column', 'column-reverse']
const justifyContentOptions = ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly']
const alignItemsOptions = ['stretch', 'flex-start', 'flex-end', 'center', 'baseline']
const flexWrapOptions = ['nowrap', 'wrap', 'wrap-reverse']
const alignContentOptions = ['stretch', 'flex-start', 'flex-end', 'center', 'space-between', 'space-around']
const flexBasisOptions = ['auto', '0', '100px', '150px', '200px', '25%', '50%']

// 子项数据
const items = reactive([
  { flexGrow: 0, flexShrink: 1, flexBasis: 'auto', order: 0 },
  { flexGrow: 0, flexShrink: 1, flexBasis: 'auto', order: 0 },
  { flexGrow: 0, flexShrink: 1, flexBasis: 'auto', order: 0 },
  { flexGrow: 0, flexShrink: 1, flexBasis: 'auto', order: 0 },
  { flexGrow: 0, flexShrink: 1, flexBasis: 'auto', order: 0 },
])

// 选中的子项
const selectedItem = ref(null)

// 当前预设名称
const activePreset = ref(null)

// 预设布局模板
const presets = [
  {
    name: '导航栏',
    icon: '☰',
    container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'nowrap', alignContent: 'stretch', gap: 16 },
    items: [
      { flexGrow: 0, flexShrink: 1, flexBasis: 'auto', order: 0 },
      { flexGrow: 1, flexShrink: 1, flexBasis: 'auto', order: 0 },
      { flexGrow: 0, flexShrink: 1, flexBasis: 'auto', order: 0 },
    ]
  },
  {
    name: '侧边栏',
    icon: '📋',
    container: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'stretch', flexWrap: 'nowrap', alignContent: 'stretch', gap: 0 },
    items: [
      { flexGrow: 0, flexShrink: 0, flexBasis: '200px', order: 0 },
      { flexGrow: 1, flexShrink: 1, flexBasis: 'auto', order: 0 },
    ]
  },
  {
    name: '卡片网格',
    icon: '🃏',
    container: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-start', flexWrap: 'wrap', alignContent: 'flex-start', gap: 12 },
    items: [
      { flexGrow: 0, flexShrink: 0, flexBasis: '150px', order: 0 },
      { flexGrow: 0, flexShrink: 0, flexBasis: '150px', order: 0 },
      { flexGrow: 0, flexShrink: 0, flexBasis: '150px', order: 0 },
      { flexGrow: 0, flexShrink: 0, flexBasis: '150px', order: 0 },
      { flexGrow: 0, flexShrink: 0, flexBasis: '150px', order: 0 },
      { flexGrow: 0, flexShrink: 0, flexBasis: '150px', order: 0 },
    ]
  },
  {
    name: '完美居中',
    icon: '⊕',
    container: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'nowrap', alignContent: 'stretch', gap: 0 },
    items: [
      { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', order: 0 },
    ]
  },
  {
    name: '等分布局',
    icon: '▤',
    container: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'stretch', flexWrap: 'nowrap', alignContent: 'stretch', gap: 8 },
    items: [
      { flexGrow: 1, flexShrink: 1, flexBasis: '0', order: 0 },
      { flexGrow: 1, flexShrink: 1, flexBasis: '0', order: 0 },
      { flexGrow: 1, flexShrink: 1, flexBasis: '0', order: 0 },
      { flexGrow: 1, flexShrink: 1, flexBasis: '0', order: 0 },
    ]
  },
  {
    name: '底部固定',
    icon: '⬇',
    container: { flexDirection: 'column', justifyContent: 'space-between', alignItems: 'stretch', flexWrap: 'nowrap', alignContent: 'stretch', gap: 0 },
    items: [
      { flexGrow: 1, flexShrink: 1, flexBasis: 'auto', order: 0 },
      { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', order: 0 },
    ]
  },
  {
    name: 'Holy Grail',
    icon: '⛪',
    container: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'stretch', flexWrap: 'nowrap', alignContent: 'stretch', gap: 0 },
    items: [
      { flexGrow: 0, flexShrink: 0, flexBasis: '100px', order: 0 },
      { flexGrow: 1, flexShrink: 1, flexBasis: 'auto', order: 0 },
      { flexGrow: 0, flexShrink: 0, flexBasis: '100px', order: 0 },
    ]
  },
  {
    name: '输入+按钮',
    icon: '✏️',
    container: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'stretch', flexWrap: 'nowrap', alignContent: 'stretch', gap: 8 },
    items: [
      { flexGrow: 1, flexShrink: 1, flexBasis: 'auto', order: 0 },
      { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', order: 0 },
    ]
  },
]

// 容器内联样式
const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection: containerProps.flexDirection,
  justifyContent: containerProps.justifyContent,
  alignItems: containerProps.alignItems,
  flexWrap: containerProps.flexWrap,
  alignContent: containerProps.alignContent,
  gap: containerProps.gap + 'px'
}))

// 子项内联样式
function itemStyle(item, idx) {
  return {
    background: itemColors[idx % itemColors.length],
    flexGrow: item.flexGrow,
    flexShrink: item.flexShrink,
    flexBasis: item.flexBasis,
    order: item.order
  }
}

// 生成 CSS 代码
const generatedCSS = computed(() => {
  let css = `.container {\n`
  css += `  display: flex;\n`
  css += `  flex-direction: ${containerProps.flexDirection};\n`
  css += `  justify-content: ${containerProps.justifyContent};\n`
  css += `  align-items: ${containerProps.alignItems};\n`
  css += `  flex-wrap: ${containerProps.flexWrap};\n`
  css += `  align-content: ${containerProps.alignContent};\n`
  css += `  gap: ${containerProps.gap}px;\n`
  css += `}\n`

  // 输出非默认值的子项属性
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const props = []
    if (item.flexGrow !== 0) props.push(`flex-grow: ${item.flexGrow}`)
    if (item.flexShrink !== 1) props.push(`flex-shrink: ${item.flexShrink}`)
    if (item.flexBasis !== 'auto') props.push(`flex-basis: ${item.flexBasis}`)
    if (item.order !== 0) props.push(`order: ${item.order}`)
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
  for (let i = 0; i < items.length; i++) {
    html += `  <div class="item-${i + 1}">子项 ${i + 1}</div>\n`
  }
  html += `</div>`
  return html
})

// 应用预设
function applyPreset(preset) {
  activePreset.value = preset.name
  Object.assign(containerProps, preset.container)
  // 重置子项数量
  items.splice(0, items.length, ...preset.items.map(it => ({ ...it })))
  selectedItem.value = null
}

// 增减子项数量
function changeItemCount(delta) {
  const newLen = items.length + delta
  if (newLen < 2 || newLen > 8) return
  if (delta > 0) {
    items.push({ flexGrow: 0, flexShrink: 1, flexBasis: 'auto', order: 0 })
  } else {
    items.pop()
    // 如果选中的子项被删除了，取消选中
    if (selectedItem.value && selectedItem.value.idx >= items.length) {
      selectedItem.value = null
    }
  }
  activePreset.value = null
}

// 复制按钮文本
const copyCSSText = ref('复制 CSS')
const copyHTMLText = ref('复制 HTML')

// 复制 CSS
function copyCSS() {
  navigator.clipboard.writeText(generatedCSS.value).then(() => {
    copyCSSText.value = '已复制 ✓'
    setTimeout(() => { copyCSSText.value = '复制 CSS' }, 1500)
  })
}

// 复制 HTML
function copyHTML() {
  navigator.clipboard.writeText(generatedHTML.value).then(() => {
    copyHTMLText.value = '已复制 ✓'
    setTimeout(() => { copyHTMLText.value = '复制 HTML' }, 1500)
  })
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
  font-size: 0.72rem;
  padding: 0.25rem 0.45rem;
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
.item-count-control {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.82rem;
  font-weight: 400;
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
.btn-sm:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.flex-preview {
  min-height: 300px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 12px;
  transition: all 0.3s ease;
}
.flex-item {
  min-width: 50px;
  min-height: 50px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0.8rem;
  box-sizing: border-box;
}
.flex-item:hover {
  opacity: 0.9;
  transform: scale(1.02);
}
.flex-item.selected {
  outline: 3px solid #1a1a1a;
  outline-offset: 2px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
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
  .flex-preview {
    min-height: 200px;
  }
}
</style>
