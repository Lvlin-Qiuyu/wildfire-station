<template>
  <div class="tool-page">
    <h2>📋 JSON 格式化与校验</h2>

    <div class="controls-row">
      <div class="indent-control">
        <label>缩进:</label>
        <button v-for="n in [2, 4]" :key="n" :class="{ active: indent === n }" @click="indent = n; reformat()">{{ n }}空格</button>
      </div>
      <div class="action-btns">
        <button class="btn-action" @click="reformat">🔄 格式化</button>
        <button class="btn-action" @click="minify">📦 压缩</button>
        <button class="btn-action" @click="clearAll">🗑️ 清空</button>
      </div>
    </div>

    <div class="editor-area">
      <div class="panel">
        <label>输入 JSON</label>
        <textarea
          v-model="inputJson"
          placeholder="粘贴 JSON 文本..."
          rows="12"
          spellcheck="false"
          @input="parseJson"
        ></textarea>
        <div v-if="error" class="error-msg">
          <span class="error-icon">⚠️</span>
          <span>{{ error }}</span>
        </div>
      </div>
      <div class="panel">
        <label>格式化结果</label>
        <div v-if="parsed" class="tree-view" @click="handleTreeClick">
          <TreeItem :data="parsedTree" :depth="0" />
        </div>
        <div v-else class="placeholder">格式化结果将显示在这里</div>
        <button v-if="outputJson" class="btn-copy" @click="copyOutput">{{ copyText }}</button>
      </div>
    </div>

    <div v-if="stats" class="stats-bar">
      <span>节点数: <strong>{{ stats.nodes }}</strong></span>
      <span>深度: <strong>{{ stats.depth }}</strong></span>
      <span>大小: <strong>{{ stats.size }}</strong></span>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'JSON 格式化与校验 - 野火小站' })

const inputJson = ref('')
const outputJson = ref('')
const parsed = ref(null)
const parsedTree = ref(null)
const error = ref('')
const indent = ref(2)
const copyText = ref('复制结果')
const collapsed = reactive(new Set())

const stats = computed(() => {
  if (!parsed.value) return null
  let nodes = 0, depth = 0
  function walk(val, d) {
    nodes++
    if (d > depth) depth = d
    if (val && typeof val === 'object') {
      for (const k in val) walk(val[k], d + 1)
    }
  }
  walk(parsed.value, 0)
  return { nodes, depth, size: formatBytes(new Blob([inputJson.value]).size) }
})

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(2) + ' MB'
}

function buildTree(value, key, path) {
  if (value === null) return { key, value: 'null', type: 'null', path }
  if (typeof value === 'number') return { key, value: String(value), type: 'number', path }
  if (typeof value === 'boolean') return { key, value: String(value), type: 'boolean', path }
  if (typeof value === 'string') return { key, value: `"${value}"`, type: 'string', path }
  if (Array.isArray(value)) {
    return {
      key,
      type: 'array',
      length: value.length,
      path,
      children: value.map((v, i) => buildTree(v, i, `${path}[${i}]`))
    }
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value)
    return {
      key,
      type: 'object',
      length: keys.length,
      path,
      children: keys.map(k => buildTree(value[k], k, path ? `${path}.${k}` : k))
    }
  }
  return { key, value: String(value), type: 'unknown', path }
}

function parseJson() {
  error.value = ''
  parsed.value = null
  parsedTree.value = null
  outputJson.value = ''

  if (!inputJson.value.trim()) return

  try {
    parsed.value = JSON.parse(inputJson.value)
    outputJson.value = JSON.stringify(parsed.value, null, indent.value)
    parsedTree.value = buildTree(parsed.value, 'root', '')
  } catch (e) {
    const match = e.message.match(/position\s+(\d+)/i)
    if (match) {
      const pos = parseInt(match[1])
      const before = inputJson.value.slice(0, pos)
      const line = before.split('\n').length
      const col = pos - before.lastIndexOf('\n')
      error.value = `${e.message}\n位置: 第 ${line} 行, 第 ${col} 列`
    } else {
      error.value = e.message
    }
  }
}

function reformat() {
  if (!parsed.value && inputJson.value.trim()) {
    parseJson()
    return
  }
  if (parsed.value) {
    outputJson.value = JSON.stringify(parsed.value, null, indent.value)
    inputJson.value = outputJson.value
  }
}

function minify() {
  if (!parsed.value && inputJson.value.trim()) {
    parseJson()
    if (!parsed.value) return
  }
  if (parsed.value) {
    outputJson.value = JSON.stringify(parsed.value)
    inputJson.value = outputJson.value
  }
}

function clearAll() {
  inputJson.value = ''
  outputJson.value = ''
  parsed.value = null
  parsedTree.value = null
  error.value = ''
}

function toggleCollapse(path) {
  if (collapsed.has(path)) {
    collapsed.delete(path)
  } else {
    collapsed.add(path)
  }
}

function handleTreeClick(e) {
  const target = e.target.closest('[data-path]')
  if (target) {
    e.stopPropagation()
    toggleCollapse(target.dataset.path)
  }
}

function copyOutput() {
  navigator.clipboard.writeText(outputJson.value).then(() => {
    copyText.value = '已复制 ✓'
    setTimeout(() => { copyText.value = '复制结果' }, 1500)
  })
}

// TreeItem component inline
const TreeItem = defineComponent({
  name: 'TreeItem',
  props: ['data', 'depth'],
  setup(props) {
    const isCollapsed = computed(() => {
      return props.data.path && collapsed.has(props.data.path)
    })
    const hasChildren = computed(() => props.data.children && props.data.children.length > 0)
    const isContainer = computed(() => props.data.type === 'object' || props.data.type === 'array')

    return () => {
      const d = props.data
      const indent = props.depth * 20 + 8

      if (isContainer.value && hasChildren.value) {
        const bracket = d.type === 'array' ? ['[', ']'] : ['{', '}']
        return h('div', { class: 'tree-node' }, [
          h('div', {
            class: ['tree-row', 'tree-toggle'],
            style: { paddingLeft: indent + 'px' },
            'data-path': d.path,
          }, [
            h('span', { class: 'tree-arrow' }, isCollapsed.value ? '▶' : '▼'),
            h('span', { class: 'tree-key' }, d.key !== 'root' ? `"${d.key}": ` : ''),
            h('span', { class: 'tree-bracket' }, bracket[0]),
            isCollapsed.value
              ? h('span', { class: 'tree-preview' }, ` ${d.length} items `)
              : null,
            isCollapsed.value
              ? h('span', { class: 'tree-bracket' }, bracket[1])
              : null,
            h('span', { class: 'tree-comment' }, isCollapsed.value ? `// ${d.length} ${d.type === 'array' ? 'items' : 'keys'}` : ''),
          ]),
          !isCollapsed.value
            ? h('div', { class: 'tree-children' },
              d.children.map((child, i) => h(TreeItem, { data: child, depth: props.depth + 1, key: i }))
            )
            : null,
          !isCollapsed.value
            ? h('div', {
                class: 'tree-row tree-closing',
                style: { paddingLeft: indent + 'px' },
              }, [
                h('span', { class: 'tree-bracket' }, bracket[1]),
              ])
            : null,
        ])
      }

      return h('div', { class: 'tree-node' }, [
        h('div', {
          class: 'tree-row',
          style: { paddingLeft: indent + 'px' },
        }, [
          h('span', { class: 'tree-key' }, d.key !== 'root' ? `"${d.key}": ` : ''),
          h('span', { class: `tree-value tree-${d.type}` }, d.value),
        ]),
      ])
    }
  }
})
</script>

<style scoped>
.tool-page {
  padding-top: 0.5rem;
}

h2 {
  font-size: 1.6rem;
  margin-bottom: 1.5rem;
}

.controls-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.indent-control {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.indent-control label {
  font-size: 0.9rem;
  font-weight: 600;
}

.indent-control button {
  padding: 0.3rem 0.8rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
}

.indent-control button.active {
  border-color: #22c55e;
  background: #f0fdf4;
  color: #22c55e;
  font-weight: 600;
}

.action-btns {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  padding: 0.4rem 0.8rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.btn-action:hover {
  border-color: #22c55e;
  background: #f0fdf4;
}

.editor-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.panel {
  display: flex;
  flex-direction: column;
}

.panel label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.panel textarea {
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-family: monospace;
  font-size: 0.85rem;
  outline: none;
  resize: vertical;
  box-sizing: border-box;
  transition: border-color 0.2s;
  line-height: 1.5;
}

.panel textarea:focus {
  border-color: #22c55e;
}

.error-msg {
  background: #fef2f2;
  color: #dc2626;
  padding: 0.6rem 0.8rem;
  border-radius: 6px;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  font-family: monospace;
  white-space: pre-wrap;
}

.placeholder {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 2rem;
  text-align: center;
  color: #999;
  font-size: 0.9rem;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tree-view {
  background: #1e1e2e;
  border-radius: 10px;
  padding: 0.8rem 0;
  overflow-x: auto;
  min-height: 200px;
  font-family: 'Fira Code', monospace;
  font-size: 0.82rem;
  line-height: 1.7;
}

.tree-row {
  padding: 0.1rem 0;
  white-space: nowrap;
}

.tree-toggle {
  cursor: pointer;
}

.tree-toggle:hover {
  background: rgba(255,255,255,0.05);
}

.tree-arrow {
  display: inline-block;
  width: 16px;
  color: #888;
  font-size: 0.7rem;
}

.tree-key {
  color: #7dd3fc;
}

.tree-value {
  color: #e0e0e0;
}

.tree-string { color: #a5d6a7; }
.tree-number { color: #fbbf24; }
.tree-boolean { color: #c084fc; }
.tree-null { color: #94a3b8; font-style: italic; }

.tree-bracket {
  color: #f8f8f2;
}

.tree-preview {
  color: #888;
  font-style: italic;
}

.tree-comment {
  color: #666;
  font-size: 0.75rem;
  margin-left: 0.5rem;
}

.tree-closing {
  color: #f8f8f2;
}

.btn-copy {
  padding: 0.4rem 1rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  margin-top: 0.5rem;
  align-self: flex-end;
  transition: transform 0.2s;
}

.btn-copy:active {
  transform: scale(0.95);
}

.stats-bar {
  display: flex;
  gap: 1.5rem;
  padding: 0.6rem 1rem;
  background: #f0fdf4;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #555;
  margin-bottom: 1rem;
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
  .editor-area {
    grid-template-columns: 1fr;
  }
  .controls-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
