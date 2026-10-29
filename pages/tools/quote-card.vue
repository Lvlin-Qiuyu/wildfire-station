<template>
  <div class="page">
    <NuxtLink to="/" class="back">← 返回工具箱</NuxtLink>
    <h1 class="page-title">🕯️ 语录卡片</h1>
    <p class="page-sub">输入一句想分享的话，一键生成小红书风格的摘抄图。图片在本地生成，不会上传。</p>

    <div class="layout">
      <!-- 左侧：表单 -->
      <section class="panel">
        <label class="field">
          <span class="label">语录 <em>必填</em></span>
          <textarea
            v-model="quote"
            rows="5"
            maxlength="300"
            placeholder="例如：所谓自由，不是随心所欲，而是自我主宰。"
          ></textarea>
          <span class="hint">{{ quote.length }} / 300</span>
        </label>

        <div class="row">
          <label class="field">
            <span class="label">作者 <span class="opt">选填</span></span>
            <input v-model="author" type="text" maxlength="30" placeholder="例如：康德" />
          </label>
          <label class="field">
            <span class="label">来源 <span class="opt">选填</span></span>
            <input v-model="source" type="text" maxlength="40" placeholder="例如：实践理性批判" />
          </label>
        </div>

        <div class="field">
          <span class="label">配色主题</span>
          <div class="themes">
            <button
              v-for="t in themes"
              :key="t.key"
              class="theme"
              :class="{ on: theme.key === t.key }"
              :style="{ background: `linear-gradient(160deg, ${t.bg[0]}, ${t.bg[1]})`, color: t.text }"
              @click="theme = t"
            >
              <span>{{ t.name }}</span>
            </button>
          </div>
        </div>

        <div class="row">
          <label class="field">
            <span class="label">字号 <span class="opt">{{ fontSizeLabel }}</span></span>
            <input v-model.number="fontSizeScale" type="range" min="0.8" max="1.25" step="0.05" />
          </label>
          <label class="field">
            <span class="label">比例</span>
            <div class="seg">
              <button :class="{ on: ratio === 'auto' }" @click="ratio = 'auto'">自适应</button>
              <button :class="{ on: ratio === '3:4' }" @click="ratio = '3:4'">3:4</button>
              <button :class="{ on: ratio === '1:1' }" @click="ratio = '1:1'">1:1</button>
            </div>
          </label>
        </div>

        <label class="check">
          <input v-model="showBrand" type="checkbox" />
          <span>底部显示「野火小站」署名</span>
        </label>

        <div class="actions">
          <button class="btn-primary" :disabled="!canExport" @click="exportPng">
            ⬇️ 下载图片
          </button>
          <button class="btn-ghost" :disabled="!canExport" @click="copyImage">
            复制到剪贴板
          </button>
        </div>
        <p v-if="!canExport" class="warn">先写一句语录吧 ✍️</p>
      </section>

      <!-- 右侧：预览 -->
      <section class="preview-wrap">
        <div class="preview-head">
          <span>预览</span>
          <span class="dim">1242px 宽 · PNG</span>
        </div>
        <div class="canvas-box">
          <canvas ref="canvasEl"></canvas>
        </div>
      </section>
    </div>

    <transition name="toast">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { themes as allThemes, renderQuoteCard, type Theme, type RatioKey } from '~/lib/quote-card'

useHead({ title: '语录卡片 - 野火小站' })

const quote = ref('')
const author = ref('')
const source = ref('')
const theme = ref<Theme>(allThemes[0])
const fontSizeScale = ref(1)
const ratio = ref<RatioKey>('auto')
const showBrand = ref(true)
const canvasEl = ref<HTMLCanvasElement | null>(null)
const toast = ref('')
const themes = allThemes

const canExport = computed(() => quote.value.trim().length > 0)
const fontSizeLabel = computed(() => `${Math.round(fontSizeScale.value * 100)}%`)

function draw() {
  const el = canvasEl.value
  if (!el) return
  renderQuoteCard(el, {
    quote: quote.value,
    author: author.value,
    source: source.value,
    theme: theme.value!,
    width: 1242,
    fontSizeScale: fontSizeScale.value,
    showBrand: showBrand.value,
    ratio: ratio.value,
  })
}

let raf: number | undefined
watch(
  [quote, author, source, theme, fontSizeScale, showBrand, ratio],
  () => {
    cancelAnimationFrame(raf!)
    raf = requestAnimationFrame(draw)
  },
)

onMounted(async () => {
  // 首次塞一条示例，方便直接看效果
  quote.value = '所谓自由，不是随心所欲，而是自我主宰。'
  author.value = '康德'
  await nextTick()
  draw()
  // 中文字体加载完成后重绘，避免首帧字体回退
  if (document.fonts?.ready) document.fonts.ready.then(() => draw())
})

function showToast(msg: string) {
  toast.value = msg
  setTimeout(() => (toast.value = ''), 1800)
}

async function exportPng() {
  const el = canvasEl.value
  if (!el) return
  draw()
  const url = el.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = `野火语录-${new Date().toISOString().slice(0, 10)}.png`
  document.body.appendChild(a)
  a.click()
  a.remove()
  showToast('已保存到下载文件夹 ✅')
}

async function copyImage() {
  const el = canvasEl.value
  if (!el) return
  draw()
  try {
    const blob: Blob = await new Promise((resolve) => el.toBlob((b) => resolve(b!), 'image/png'))
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    showToast('已复制，去小红书粘贴吧 ✅')
  } catch {
    showToast('当前浏览器不支持复制图片，请用下载 ⚠️')
  }
}
</script>

<style scoped>
.back {
  display: inline-block;
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 14px;
  transition: color 0.15s;
}
.back:hover {
  color: var(--accent-soft);
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 26px;
  align-items: start;
}

.panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 22px;
}

.field {
  display: block;
  margin-bottom: 16px;
}

.label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--text);
  margin-bottom: 7px;
  font-weight: 500;
}

.label em {
  font-style: normal;
  font-size: 10px;
  color: #fff;
  background: var(--accent-soft);
  padding: 1px 6px;
  border-radius: 4px;
}

.opt {
  font-size: 10px;
  color: var(--muted);
}

textarea,
input[type='text'] {
  width: 100%;
  background: var(--bg-soft);
  border: 1px solid var(--line);
  color: var(--text);
  border-radius: 10px;
  padding: 11px 13px;
  font-size: 14px;
  line-height: 1.7;
  resize: vertical;
  outline: none;
  transition: border-color 0.16s;
}

textarea:focus,
input[type='text']:focus {
  border-color: rgba(255, 106, 43, 0.6);
}

textarea {
  min-height: 110px;
}

.hint {
  display: block;
  text-align: right;
  font-size: 11px;
  color: var(--muted);
  margin-top: 4px;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.themes {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 7px;
}

.theme {
  position: relative;
  border: 2px solid transparent;
  border-radius: 9px;
  height: 46px;
  font-size: 11px;
  font-weight: 600;
  padding: 0;
  letter-spacing: 0.5px;
  transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
}

.theme:hover {
  transform: translateY(-2px);
}

.theme.on {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(255, 106, 43, 0.18);
}

input[type='range'] {
  width: 100%;
  accent-color: var(--accent);
}

.seg {
  display: flex;
  background: var(--bg-soft);
  border: 1px solid var(--line);
  border-radius: 9px;
  overflow: hidden;
}

.seg button {
  flex: 1;
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 12.5px;
  padding: 9px 0;
  transition: all 0.15s;
}

.seg button.on {
  background: var(--accent-dim);
  color: var(--accent-soft);
  font-weight: 600;
}

.check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--muted);
  margin: 4px 0 18px;
  cursor: pointer;
}

.check input {
  accent-color: var(--accent);
}

.actions {
  display: flex;
  gap: 10px;
}

.btn-primary,
.btn-ghost {
  flex: 1;
  border-radius: 10px;
  padding: 12px 0;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.16s;
}

.btn-primary {
  border: 0;
  background: linear-gradient(100deg, var(--accent), #ff9d3d);
  color: #fff;
  box-shadow: 0 6px 18px rgba(255, 106, 43, 0.28);
}

.btn-primary:hover:not(:disabled) {
  filter: brightness(1.06);
  transform: translateY(-1px);
}

.btn-ghost {
  border: 1px solid var(--line);
  background: transparent;
  color: var(--text);
}

.btn-ghost:hover:not(:disabled) {
  border-color: var(--accent-dim);
  background: var(--accent-dim);
}

.btn-primary:disabled,
.btn-ghost:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

.warn {
  font-size: 12px;
  color: var(--muted);
  text-align: center;
  margin: 10px 0 0;
}

.preview-wrap {
  position: sticky;
  top: 88px;
}

.preview-head {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 10px;
}

.dim {
  opacity: 0.6;
}

.canvas-box {
  margin: 0 auto;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--line);
  box-shadow: var(--shadow-hover);
  background: var(--panel-2);
}

canvas {
  display: block;
  width: 100%;
  height: auto;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 40px;
  transform: translateX(-50%);
  background: var(--panel);
  border: 1px solid var(--line);
  padding: 10px 18px;
  border-radius: 999px;
  font-size: 13px;
  z-index: 100;
  box-shadow: var(--shadow-hover);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .preview-wrap {
    position: static;
    order: -1;
  }
  .canvas-box {
    max-width: 340px !important;
  }
}

@media (max-width: 480px) {
  .row {
    grid-template-columns: 1fr;
  }
  .themes {
    grid-template-columns: repeat(3, 1fr);
  }
  .panel {
    padding: 16px;
  }
}
</style>
