<template>
  <div class="tool-page">
    <h2>🖼️ 图片拼接工具</h2>
    <p class="subtitle">多图拼接、拖拽排序、多种布局，一键导出</p>

    <!-- 上传区 -->
    <div class="upload-area" :class="{ dragging: isDragging }"
      @click="triggerUpload" @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false" @drop.prevent="handleDrop">
      <input ref="fileInput" type="file" accept="image/*" multiple style="display:none" @change="handleFiles" />
      <span class="upload-icon">📁</span>
      <p>点击或拖拽上传多张图片</p>
      <span class="upload-formats">支持 JPG / PNG / WebP，可多选</span>
    </div>

    <div v-if="images.length > 0" class="workspace">
      <!-- 设置 -->
      <div class="settings">
        <div class="setting-row">
          <label>布局模式</label>
          <div class="layout-btns">
            <button v-for="l in layouts" :key="l.value" :class="{ active: layout === l.value }"
              @click="layout = l.value">{{ l.icon }} {{ l.label }}</button>
          </div>
        </div>
        <div class="setting-row">
          <label>间距: <strong>{{ gap }}px</strong></label>
          <input type="range" v-model.number="gap" min="0" max="50" />
        </div>
        <div class="setting-row">
          <label>圆角: <strong>{{ radius }}px</strong></label>
          <input type="range" v-model.number="radius" min="0" max="50" />
        </div>
        <div class="setting-row">
          <label>背景色</label>
          <input type="color" v-model="bgColor" />
        </div>
        <div class="setting-row">
          <label>输出质量: <strong>{{ (quality * 100).toFixed(0) }}%</strong></label>
          <input type="range" v-model.number="quality" min="0.1" max="1" step="0.05" />
        </div>
        <div class="setting-row">
          <label>输出格式</label>
          <div class="layout-btns">
            <button :class="{ active: outputFormat === 'png' }" @click="outputFormat = 'png'">PNG</button>
            <button :class="{ active: outputFormat === 'jpeg' }" @click="outputFormat = 'jpeg'">JPG</button>
          </div>
        </div>
      </div>

      <!-- 图片列表（可拖拽排序） -->
      <div class="image-list">
        <div class="image-list-header">
          <span>图片列表（{{ images.length }}张，拖拽排序）</span>
          <button class="btn-clear" @click="images = []; previewUrl = ''">清空</button>
        </div>
        <div class="image-items">
          <div v-for="(img, i) in images" :key="img.id" class="image-item"
            draggable="true" @dragstart="dragIdx = i" @dragover.prevent
            @drop.prevent="swapImages(i)" :class="{ dragging: dragIdx === i }">
            <span class="img-num">{{ i + 1 }}</span>
            <img :src="img.url" alt="" />
            <span class="img-name">{{ img.name }}</span>
            <span class="img-size">{{ img.w }}×{{ img.h }}</span>
            <button class="btn-remove" @click="removeImage(i)">✕</button>
          </div>
        </div>
      </div>

      <!-- 实时预览 -->
      <div class="preview-section">
        <h3>预览</h3>
        <div class="preview-box">
          <canvas ref="previewCanvas" v-show="previewUrl" />
          <div v-if="!previewUrl" class="preview-empty">点击下方按钮生成预览</div>
        </div>
      </div>

      <!-- 操作 -->
      <div class="actions">
        <button class="btn-preview" @click="generatePreview">预览拼接结果</button>
        <button v-if="previewUrl" class="btn-download" @click="download">📥 下载拼接图片</button>
        <button class="btn-add" @click="triggerUpload">+ 继续添加</button>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '图片拼接工具 - 野火小站' })

const fileInput = ref(null)
const previewCanvas = ref(null)
const isDragging = ref(false)
const dragIdx = ref(-1)
const images = ref([])
const layout = ref('vertical')
const gap = ref(8)
const radius = ref(0)
const bgColor = ref('#ffffff')
const quality = ref(0.92)
const outputFormat = ref('png')
const previewUrl = ref('')

const layouts = [
  { value: 'vertical', icon: '↕️', label: '纵向' },
  { value: 'horizontal', icon: '↔️', label: '横向' },
  { value: 'grid2', icon: '▦', label: '2列' },
  { value: 'grid3', icon: '▮▮▮', label: '3列' },
]

let idCounter = 0

function triggerUpload() { fileInput.value.click() }

function handleFiles(e) {
  const files = e.target.files || []
  Array.from(files).forEach(loadImageFile)
  fileInput.value.value = ''
}

function handleDrop(e) {
  isDragging.value = false
  const files = e.dataTransfer.files
  Array.from(files).forEach(f => { if (f.type.startsWith('image/')) loadImageFile(f) })
}

function loadImageFile(file) {
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      images.value.push({ id: ++idCounter, name: file.name, url: e.target.result, w: img.naturalWidth, h: img.naturalHeight })
      generatePreview()
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

function removeImage(i) {
  images.value.splice(i, 1)
  generatePreview()
}

function swapImages(targetIdx) {
  const from = dragIdx.value
  if (from === targetIdx || from < 0) return
  const list = images.value
  const [item] = list.splice(from, 1)
  list.splice(targetIdx, 0, item)
  generatePreview()
}

function generatePreview() {
  if (!images.value.length || !previewCanvas.value) return
  const canvas = previewCanvas.value
  const ctx = canvas.getContext('2d')
  const cols = layout.value === 'horizontal' ? images.value.length : layout.value === 'grid2' ? 2 : layout.value === 'grid3' ? 3 : 1
  const gapVal = gap.value
  const r = radius.value

  // 计算网格
  const cellW = layout.value === 'horizontal' ? images.value[0].w : layout.value === 'vertical' ? Math.max(...images.value.map(i => i.w)) : Math.max(...images.value.map(i => i.w))
  const cellH = layout.value === 'vertical' ? images.value.reduce((s, i) => s + i.h, 0) : layout.value === 'horizontal' ? images.value[0].h : Math.max(...images.value.map(i => i.h))
  const rows = Math.ceil(images.value.length / cols)
  const totalW = cols * cellW + (cols - 1) * gapVal + r * 2
  const totalH = layout.value === 'vertical' ? images.value.reduce((s, i) => s + i.h, 0) + (images.value.length - 1) * gapVal + r * 2 : rows * cellH + (rows - 1) * gapVal + r * 2

  canvas.width = totalW
  canvas.height = totalH

  // 背景
  ctx.fillStyle = bgColor.value
  roundRect(ctx, 0, 0, totalW, totalH, r)
  ctx.fill()

  // 绘制每张图
  let loaded = 0
  const total = images.value.length
  const onDone = () => { if (loaded >= total) previewUrl.value = 'generated' }

  images.value.forEach((item, idx) => {
    const img = new Image()
    img.onload = () => {
      const col = idx % cols
      const row = Math.floor(idx / cols)

      let x, y, drawW, drawH
      if (layout.value === 'vertical') {
        drawW = cellW
        drawH = item.h * (cellW / item.w)
        x = r
        y = r + idx * (drawH + gapVal)
      } else if (layout.value === 'horizontal') {
        drawW = item.w
        drawH = cellH
        x = r + idx * (drawW + gapVal)
        y = r
      } else {
        drawW = cellW
        drawH = item.h * (cellW / item.w)
        x = r + col * (cellW + gapVal)
        y = r + row * (drawH + gapVal)
      }

      // 绘制圆角图片
      ctx.save()
      roundRect(ctx, x, y, drawW, drawH, r)
      ctx.clip()
      ctx.drawImage(img, x, y, drawW, drawH)
      ctx.restore()

      loaded++
      onDone()
    }
    img.src = item.url
  })
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function download() {
  if (!previewCanvas.value) return
  const mime = outputFormat.value === 'png' ? 'image/png' : 'image/jpeg'
  const q = outputFormat.value === 'png' ? undefined : quality.value
  previewCanvas.value.toBlob((blob) => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `stitched.${outputFormat.value === 'png' ? 'png' : 'jpg'}`
    a.click()
  }, mime, q)
}
</script>

<style scoped>
.tool-page { padding-top: 0.5rem; }
h2 { font-size: 1.6rem; margin-bottom: 0.3rem; }
.subtitle { color: #888; font-size: 0.95rem; margin-bottom: 1.5rem; }

.upload-area {
  border: 2px dashed #ccc; border-radius: 14px; padding: 2.5rem 2rem;
  text-align: center; cursor: pointer; transition: all 0.3s; margin-bottom: 1.5rem;
}
.upload-area:hover, .upload-area.dragging { border-color: #22c55e; background: #f0fdf4; }
.upload-icon { font-size: 2.5rem; display: block; margin-bottom: 0.5rem; }
.upload-hint p { margin: 0.3rem 0; color: #555; }
.upload-formats { font-size: 0.8rem; color: #999; }

.settings { background: #f8f9fa; border-radius: 12px; padding: 1.2rem; margin-bottom: 1.5rem; }
.setting-row { margin-bottom: 1rem; }
.setting-row:last-child { margin-bottom: 0; }
.setting-row label { display: block; margin-bottom: 0.4rem; font-weight: 600; font-size: 0.9rem; }
.setting-row input[type="range"] { width: 100%; accent-color: #22c55e; }
.setting-row input[type="color"] { width: 50px; height: 32px; border: none; cursor: pointer; }

.layout-btns { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.layout-btns button {
  padding: 0.4rem 0.9rem; border: 2px solid #e0e0e0; background: white;
  border-radius: 6px; cursor: pointer; font-size: 0.85rem; transition: all 0.2s;
}
.layout-btns button.active { border-color: #22c55e; background: #f0fdf4; color: #22c55e; font-weight: 600; }

.image-list { margin-bottom: 1.5rem; }
.image-list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; font-size: 0.9rem; color: #555; }
.btn-clear { background: none; border: 1px solid #e0e0e0; border-radius: 6px; padding: 0.2rem 0.6rem; cursor: pointer; color: #888; font-size: 0.8rem; }
.btn-clear:hover { border-color: #ef4444; color: #ef4444; }

.image-items { display: flex; flex-direction: column; gap: 0.5rem; }
.image-item {
  display: flex; align-items: center; gap: 0.8rem; padding: 0.5rem 0.8rem;
  background: white; border: 2px solid #eee; border-radius: 10px; cursor: grab; transition: all 0.2s;
}
.image-item.dragging { opacity: 0.4; border-color: #22c55e; }
.image-item:hover { border-color: #ddd; }
.img-num { width: 24px; height: 24px; background: #22c55e; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; }
.image-item img { width: 50px; height: 50px; object-fit: cover; border-radius: 6px; flex-shrink: 0; }
.img-name { font-size: 0.85rem; color: #333; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.img-size { font-size: 0.75rem; color: #999; flex-shrink: 0; }
.btn-remove { background: none; border: none; cursor: pointer; color: #ccc; font-size: 1rem; padding: 0.2rem; }
.btn-remove:hover { color: #ef4444; }

.preview-section { margin-bottom: 1.5rem; }
.preview-section h3 { font-size: 1rem; margin-bottom: 0.5rem; color: #555; }
.preview-box { background: #f0f0f0; border-radius: 10px; overflow: auto; max-height: 500px; display: flex; align-items: center; justify-content: center; min-height: 150px; padding: 1rem; }
.preview-box canvas { max-width: 100%; height: auto; }
.preview-empty { color: #aaa; font-size: 0.9rem; }

.actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; margin-bottom: 1rem; }
.btn-preview, .btn-download, .btn-add {
  padding: 0.6rem 1.5rem; border-radius: 10px; cursor: pointer; font-size: 0.95rem; font-weight: 600; border: none; transition: all 0.2s;
}
.btn-preview { background: #f0f0f0; color: #333; }
.btn-preview:hover { background: #e0e0e0; }
.btn-download { background: linear-gradient(135deg, #22c55e, #10b981); color: white; }
.btn-download:active { transform: scale(0.95); }
.btn-add { background: white; border: 2px solid #e0e0e0; color: #555; }
.btn-add:hover { border-color: #22c55e; color: #22c55e; }

.back-link { display: inline-block; margin-top: 2rem; color: #22c55e; font-weight: 600; }
.back-link:hover { text-decoration: underline; }

@media (max-width: 600px) {
  .image-item img { width: 40px; height: 40px; }
  .actions { flex-direction: column; }
  .btn-preview, .btn-download, .btn-add { width: 100%; text-align: center; }
}
</style>
