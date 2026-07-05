<template>
  <div class="tool-page">
    <h2>🎓 费曼学习法笔记</h2>
    <p class="subtitle">四步引导：概念解释→简化→类比→知识缺口，结构化输出 Markdown</p>

    <!-- 笔记列表 / 新建选择 -->
    <div v-if="view === 'list'" class="list-view">
      <div class="list-actions">
        <button class="btn-primary" @click="createNote">➕ 新建笔记</button>
      </div>

      <div v-if="notes.length === 0" class="empty-state">
        <p>📝 还没有笔记，点击上方按钮开始</p>
      </div>

      <div v-for="note in notes" :key="note.id" class="note-card" @click="openNote(note.id)">
        <div class="note-header">
          <h3>{{ note.topic }}</h3>
          <div class="note-meta">
            <span class="note-step">步骤 {{ note.currentStep }}/4</span>
            <span class="note-date">{{ note.updatedAt }}</span>
          </div>
        </div>
        <div class="step-progress">
          <div v-for="s in 4" :key="s" class="step-dot" :class="{ active: s <= note.currentStep, done: s < note.currentStep }">
            {{ s <= note.currentStep ? (s < note.currentStep ? '✓' : s) : s }}
          </div>
        </div>
        <button class="btn-xs btn-danger" @click.stop="deleteNote(note.id)">✕ 删除</button>
      </div>
    </div>

    <!-- 编辑视图 -->
    <div v-if="view === 'edit' && currentNote" class="edit-view">
      <div class="edit-header">
        <button class="btn-back" @click="saveAndBack">← 返回列表</button>
        <div class="step-tabs">
          <button
            v-for="(step, i) in steps"
            :key="i"
            :class="['step-tab', { active: currentStepIndex === i, done: i < currentStepIndex }]"
            @click="currentStepIndex = i"
          >
            <span class="step-num">{{ i + 1 }}</span>
            {{ step.label }}
          </button>
        </div>
      </div>

      <!-- 主题输入（始终可见） -->
      <div class="topic-section">
        <label>学习主题</label>
        <input v-model="currentNote.topic" class="text-input" placeholder="例如：什么是机器学习？" />
      </div>

      <!-- 步骤内容 -->
      <div class="step-content">
        <div class="step-title">
          <span class="step-badge">步骤 {{ currentStepIndex + 1 }}</span>
          {{ steps[currentStepIndex].label }}
        </div>
        <p class="step-hint">{{ steps[currentStepIndex].hint }}</p>
        <textarea
          v-model="currentStepContent"
          class="text-input textarea"
          :placeholder="steps[currentStepIndex].placeholder"
          rows="8"
          spellcheck="false"
        ></textarea>
      </div>

      <!-- 步骤导航 -->
      <div class="step-nav">
        <button class="btn-sm" @click="prevStep" :disabled="currentStepIndex === 0">← 上一步</button>
        <button v-if="currentStepIndex < 3" class="btn-primary" @click="nextStep">下一步 →</button>
        <button v-else class="btn-primary" @click="finishAndPreview">✅ 完成 & 预览</button>
      </div>

      <!-- 实时预览 -->
      <div v-if="showPreview" class="preview-section">
        <div class="section-header">
          <h3>📋 Markdown 预览</h3>
          <div class="preview-actions">
            <button class="btn-sm" @click="copyMarkdown">📋 复制</button>
            <button class="btn-sm" @click="downloadMarkdown">💾 下载</button>
          </div>
        </div>
        <div class="markdown-preview" v-html="renderedMarkdown"></div>
        <div class="code-block">
          <code>{{ markdownOutput }}</code>
        </div>
      </div>
    </div>

    <NuxtLink v-if="view === 'list'" to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '费曼学习法笔记 - 野火小站' })

// 视图状态
const view = ref('list')
const notes = ref([])
const currentNote = ref(null)
const currentStepIndex = ref(0)
const showPreview = ref(false)

// 四个步骤
const steps = [
  {
    label: '概念解释',
    hint: '用你自己的话，简单地解释这个概念，就像在教一个小白。如果你解释不清楚，说明你还没真正理解。',
    placeholder: '用最简单的语言解释这个概念，假设对方完全没有任何背景知识...'
  },
  {
    label: '简化表达',
    hint: '回顾你的解释，找出可以使用更简单、更直观的表达的地方。删掉专业术语，用日常语言替换。',
    placeholder: '回顾上一步的解释，用更简单、更直白的语言重新描述...'
  },
  {
    label: '类比与比喻',
    hint: '找一个生活中熟悉的场景、事物来类比这个概念。好的类比能让复杂概念变得一目了然。',
    placeholder: '用一个生活中的例子或比喻来解释这个概念...'
  },
  {
    label: '知识缺口',
    hint: '在解释过程中，哪些地方你发现自己说不清楚？这些就是你的知识缺口。记录下来，作为后续学习的方向。',
    placeholder: '列出你在解释过程中发现自己不太理解的部分...'
  }
]

const STORAGE_KEY = 'feynman_notes'

// 当前步骤内容
const currentStepContent = computed({
  get: () => currentNote.value?.steps?.[currentStepIndex.value]?.content || '',
  set: (val) => {
    if (!currentNote.value) return
    if (!currentNote.value.steps[currentStepIndex.value]) {
      currentNote.value.steps[currentStepIndex.value] = { content: '' }
    }
    currentNote.value.steps[currentStepIndex.value].content = val
    currentNote.value.currentStep = Math.max(currentNote.value.currentStep, currentStepIndex.value + 1)
    currentNote.value.updatedAt = new Date().toLocaleDateString('zh-CN')
    saveNotes()
  }
})

// 加载/保存
function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) notes.value = JSON.parse(raw)
  } catch {}
}

function saveNotes() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes.value))
  } catch {}
}

// 笔记CRUD
function createNote() {
  const note = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    topic: '',
    steps: [{ content: '' }, { content: '' }, { content: '' }, { content: '' }],
    currentStep: 1,
    createdAt: new Date().toLocaleDateString('zh-CN'),
    updatedAt: new Date().toLocaleDateString('zh-CN'),
  }
  notes.value.unshift(note)
  saveNotes()
  openNote(note.id)
}

function openNote(id) {
  currentNote.value = notes.value.find(n => n.id === id)
  currentStepIndex.value = 0
  showPreview.value = false
  view.value = 'edit'
}

function deleteNote(id) {
  if (!confirm('确定删除此笔记？')) return
  notes.value = notes.value.filter(n => n.id !== id)
  saveNotes()
}

function saveAndBack() {
  if (currentNote.value) {
    currentNote.value.updatedAt = new Date().toLocaleDateString('zh-CN')
    saveNotes()
  }
  view.value = 'list'
  currentNote.value = null
}

// 步骤导航
function prevStep() {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--
    showPreview.value = false
  }
}

function nextStep() {
  if (currentStepIndex.value < 3) {
    currentStepIndex.value++
    showPreview.value = false
  }
}

function finishAndPreview() {
  showPreview.value = !showPreview.value
}

// 生成Markdown
const markdownOutput = computed(() => {
  if (!currentNote.value) return ''
  const n = currentNote.value
  let md = `# ${n.topic || '未命名'}\n\n`
  md += `> 费曼学习法笔记 · ${n.updatedAt}\n\n`

  n.steps.forEach((step, i) => {
    if (step?.content?.trim()) {
      md += `## ${steps[i].label}\n\n`
      md += step.content.trim() + '\n\n'
    }
  })

  md += `---\n*由 [野火小站](https://lvlin-qiuyu.github.io/wildfire-station/) 费曼学习法笔记生成*`
  return md
})

// 简单Markdown渲染（纯前端，无需外部库）
const renderedMarkdown = computed(() => {
  let html = markdownOutput.value
  // 先转义 HTML 实体，防止 XSS
  html = html.replace(/&/g, '&amp;')
  html = html.replace(/</g, '&lt;')
  html = html.replace(/>/g, '&gt;')
  html = html.replace(/"/g, '&quot;')
  // 标题
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')
  // 引用
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
  // 粗体
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  // 斜体
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  // 分隔线
  html = html.replace(/^---$/gm, '<hr>')
  // 列表项
  html = html.replace(/^[*-] (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
  // 换行
  html = html.replace(/\n\n/g, '<br><br>')
  html = html.replace(/\n/g, '<br>')
  return html
})

function copyMarkdown() {
  navigator.clipboard.writeText(markdownOutput.value).then(() => {
    alert('Markdown 已复制到剪贴板')
  })
}

function downloadMarkdown() {
  if (!currentNote.value) return
  const blob = new Blob([markdownOutput.value], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = (currentNote.value.topic || '费曼笔记') + '.md'
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  loadNotes()
})
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

/* 按钮 */
.btn-primary {
  padding: 0.55rem 1.2rem;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary:hover { opacity: 0.85; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-sm {
  padding: 0.5rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-sm:hover { border-color: #22c55e; color: #22c55e; }
.btn-sm:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-xs {
  width: auto;
  padding: 0.3rem 0.7rem;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  background: white;
  font-size: 0.8rem;
  cursor: pointer;
}

.btn-xs.btn-danger { color: #e74c3c; }
.btn-xs.btn-danger:hover { background: #fef2f2; border-color: #e74c3c; }

.btn-back {
  background: none;
  border: none;
  color: #22c55e;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.3rem 0;
}

.btn-back:hover { text-decoration: underline; }

.text-input {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
  font-family: inherit;
}

.text-input:focus { border-color: #22c55e; }

.textarea {
  resize: vertical;
  line-height: 1.6;
  min-height: 160px;
}

/* 列表视图 */
.list-actions {
  margin-bottom: 1rem;
}

.empty-state {
  text-align: center;
  padding: 2.5rem 1rem;
  color: #bbb;
}

.note-card {
  background: white;
  border-radius: 12px;
  padding: 1.2rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  margin-bottom: 0.8rem;
  border: 1px solid #f0f0f0;
  cursor: pointer;
  position: relative;
  transition: border-color 0.2s;
}

.note-card:hover { border-color: #22c55e; }

.note-header h3 {
  font-size: 1.1rem;
  margin-bottom: 0.3rem;
  color: #2c3e50;
}

.note-meta {
  display: flex;
  gap: 0.8rem;
  margin-bottom: 0.6rem;
}

.note-step {
  font-size: 0.8rem;
  color: #22c55e;
  background: #f0fdf4;
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
}

.note-date {
  font-size: 0.8rem;
  color: #ccc;
}

.step-progress {
  display: flex;
  gap: 0.5rem;
}

.step-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  background: #f3f4f6;
  color: #999;
}

.step-dot.active {
  background: #22c55e;
  color: white;
}

.step-dot.done {
  background: #10b981;
  color: white;
}

.note-card .btn-xs {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

/* 编辑视图 */
.edit-header {
  margin-bottom: 1.5rem;
}

.step-tabs {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.8rem;
  overflow-x: auto;
  padding-bottom: 4px;
}

.step-tab {
  padding: 0.5rem 0.8rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  font-size: 0.82rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.step-tab.active {
  background: #22c55e;
  color: white;
  border-color: #22c55e;
}

.step-tab.done {
  background: #f0fdf4;
  color: #22c55e;
  border-color: #22c55e;
}

.step-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: bold;
  background: rgba(255,255,255,0.3);
}

.step-tab:not(.active):not(.done) .step-num {
  background: #f3f4f6;
}

/* 主题输入 */
.topic-section {
  margin-bottom: 1.5rem;
}

.topic-section label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 600;
  font-size: 0.9rem;
}

/* 步骤内容 */
.step-content {
  background: #fafafa;
  border-radius: 12px;
  padding: 1.2rem;
  margin-bottom: 1.2rem;
}

.step-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.step-badge {
  display: inline-block;
  background: #22c55e;
  color: white;
  padding: 0.15rem 0.5rem;
  border-radius: 8px;
  font-size: 0.75rem;
}

.step-hint {
  color: #888;
  font-size: 0.88rem;
  margin-bottom: 0.8rem;
  line-height: 1.5;
}

/* 步骤导航 */
.step-nav {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

/* 预览 */
.preview-section {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.section-header h3 {
  font-size: 1.1rem;
  margin-bottom: 0;
}

.preview-actions {
  display: flex;
  gap: 0.5rem;
}

.markdown-preview {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  line-height: 1.8;
  font-size: 0.95rem;
}

.markdown-preview :deep(h1) { font-size: 1.5rem; margin-bottom: 0.5rem; }
.markdown-preview :deep(h2) { font-size: 1.2rem; margin-bottom: 0.5rem; color: #22c55e; }
.markdown-preview :deep(h3) { font-size: 1.05rem; margin-bottom: 0.3rem; }
.markdown-preview :deep(blockquote) {
  border-left: 3px solid #22c55e;
  padding-left: 1rem;
  color: #666;
  font-style: italic;
}
.markdown-preview :deep(hr) { border: none; border-top: 1px solid #e0e0e0; margin: 1rem 0; }
.markdown-preview :deep(ul) { padding-left: 1.5rem; }
.markdown-preview :deep(li) { margin-bottom: 0.3rem; }

.code-block {
  background: #1a1a2e;
  border-radius: 10px;
  padding: 1.2rem;
  overflow-x: auto;
}

.code-block code {
  color: #a5d6a7;
  font-family: monospace;
  font-size: 0.85rem;
  white-space: pre;
  line-height: 1.6;
}

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #22c55e;
  text-decoration: none;
  font-weight: 600;
}

.back-link:hover { text-decoration: underline; }

@media (max-width: 640px) {
  .step-tabs {
    gap: 0.3rem;
  }
  .step-tab {
    padding: 0.4rem 0.6rem;
    font-size: 0.78rem;
  }
  .step-nav {
    flex-direction: column;
    gap: 0.5rem;
  }
  .step-nav .btn-primary,
  .step-nav .btn-sm {
    width: 100%;
    text-align: center;
  }
}
</style>
