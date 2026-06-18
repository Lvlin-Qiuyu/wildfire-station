<template>
  <div class="tool-page">
    <h2>🖼️ 图片水印工具</h2>
    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>

    <div class="upload-area" :class="{ dragging: isDragging }" @dragover.prevent="isDragging = true" @dragleave="isDragging = false" @drop.prevent="handleDrop" @click="$refs.fileInput.click()">
      <input ref="fileInput" type="file" accept="image/*" hidden @change="handleFile" />
      <template v-if="!previewSrc">
        <div class="upload-icon">📁</div>
        <p>拖拽图片到此处或点击上传</p>
      </template>
      <img v-else :src="previewSrc" class="preview-img" />
    </div>

    <div class="controls" v-if="previewSrc">
      <div class="control-group">
        <label>水印文字</label>
        <input v-model="text" placeholder="请输入水印文字" />
      </div>
      <div class="control-row">
        <div class="control-group">
          <label>字体大小 <b>{{ fontSize }}</b>px</label>
          <input type="range" v-model.number="fontSize" min="12" max="120" />
        </div>
        <div class="control-group">
          <label>透明度 <b>{{ Math.round(opacity * 100) }}%</b></label>
          <input type="range" v-model.number="opacity" min="0" max="1" step="0.05" />
        </div>
        <div class="control-group">
          <label>旋转角度 <b>{{ angle }}°</b></label>
          <input type="range" v-model.number="angle" min="-180" max="180" />
        </div>
      </div>
      <div class="control-row">
        <div class="control-group">
          <label>颜色</label>
          <input type="color" v-model="color" />
        </div>
        <div class="control-group">
          <label>导出格式</label>
          <select v-model="format">
            <option value="png">PNG</option>
            <option value="jpeg">JPG</option>
          </select>
        </div>
      </div>
      <div class="control-group">
        <label>水印位置（9宫格）</label>
        <div class="grid-picker">
          <div v-for="pos in positions" :key="pos" :class="['grid-cell', { active: position === pos }]" @click="position = pos">
            {{ posLabels[pos] }}
          </div>
        </div>
      </div>
      <div class="control-group">
        <label class="toggle-label">
          <input type="checkbox" v-model="tileMode" />
          平铺水印模式
        </label>
      </div>
      <button class="btn-primary" @click="applyWatermark">应用水印并导出</button>
    </div>

    <div v-if="resultSrc" class="result">
      <h3>✅ 水印结果</h3>
      <img :src="resultSrc" class="result-img" />
      <button class="btn-secondary" @click="download">📥 下载图片</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

useHead({ title: '图片水印工具 - 野火小站' })

const positions = ['tl', 'tc', 'tr', 'ml', 'mc', 'mr', 'bl', 'bc', 'br']
const posLabels = { tl: '↖', tc: '↑', tr: '↗', ml: '←', mc: '⊕', mr: '→', bl: '↙', bc: '↓', br: '↘' }

const isDragging = ref(false)
const previewSrc = ref('')
const resultSrc = ref('')
const text = ref('野火小站')
const fontSize = ref(36)
const color = ref('#ffffff')
const opacity = ref(0.5)
const angle = ref(-30)
const position = ref('mc')
const format = ref('png')
const tileMode = ref(false)
const originalFile = ref(null)

function handleDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) loadFile(file)
}

function handleFile(e) {
  const file = e.target.files[0]
  if (file) loadFile(file)
}

function loadFile(file) {
  originalFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => { previewSrc.value = e.target.result; resultSrc.value = '' }
  reader.readAsDataURL(file)
}

function applyWatermark() {
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)

    ctx.globalAlpha = opacity.value
    ctx.fillStyle = color.value
    ctx.font = `bold ${fontSize.value}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const w = canvas.width, h = canvas.height
    const pad = Math.max(fontSize.value, 20)

    if (tileMode.value) {
      ctx.save()
      ctx.translate(w / 2, h / 2)
      ctx.rotate((angle.value * Math.PI) / 180)
      const step = Math.max(fontSize.value * 6, 150)
      for (let y = -h; y < h * 2; y += step) {
        for (let x = -w; x < w * 2; x += step) {
          ctx.fillText(text.value || '水印', x, y)
        }
      }
      ctx.restore()
    } else {
      const posMap = {
        tl: [pad, pad], tc: [w / 2, pad], tr: [w - pad, pad],
        ml: [pad, h / 2], mc: [w / 2, h / 2], mr: [w - pad, h / 2],
        bl: [pad, h - pad], bc: [w / 2, h - pad], br: [w - pad, h - pad]
      }
      const [cx, cy] = posMap[position.value]
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate((angle.value * Math.PI) / 180)
      ctx.fillText(text.value || '水印', 0, 0)
      ctx.restore()
    }

    resultSrc.value = canvas.toDataURL(`image/${format.value}`, 0.95)
  }
  img.src = previewSrc.value
}

function download() {
  const a = document.createElement('a')
  a.href = resultSrc.value
  a.download = `watermarked.${format.value === 'jpeg' ? 'jpg' : 'png'}`
  a.click()
}
</script>

<style scoped>
.tool-page { max-width: 800px; margin: 0 auto; padding: 20px; }
.back-link { display: inline-block; margin-bottom: 16px; color: #10b981; text-decoration: none; }
.back-link:hover { text-decoration: underline; }
h2 { color: #1a1a2e; margin-bottom: 20px; }
.upload-area { border: 2px dashed #22c55e; border-radius: 12px; padding: 40px; text-align: center; cursor: pointer; transition: all 0.3s; margin-bottom: 20px; min-height: 120px; display: flex; align-items: center; justify-content: center; }
.upload-area.dragging { border-color: #10b981; background: #f0fdf4; }
.upload-icon { font-size: 48px; margin-bottom: 8px; }
.preview-img { max-width: 100%; max-height: 400px; border-radius: 8px; }
.controls { display: flex; flex-direction: column; gap: 16px; }
.control-row { display: flex; gap: 16px; flex-wrap: wrap; }
.control-group { flex: 1; min-width: 150px; }
.control-group label { display: block; font-size: 14px; color: #555; margin-bottom: 6px; }
.control-group input[type="text"], .control-group select { width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; }
.control-group input[type="range"] { width: 100%; accent-color: #22c55e; }
.control-group input[type="color"] { width: 60px; height: 36px; border: none; border-radius: 6px; cursor: pointer; }
.toggle-label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.toggle-label input { accent-color: #22c55e; }
.grid-picker { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; max-width: 200px; }
.grid-cell { padding: 12px; text-align: center; border: 2px solid #ddd; border-radius: 6px; cursor: pointer; font-size: 18px; transition: all 0.2s; }
.grid-cell.active { border-color: #22c55e; background: #f0fdf4; color: #22c55e; }
.btn-primary { padding: 12px 24px; background: #22c55e; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; transition: background 0.2s; }
.btn-primary:hover { background: #16a34a; }
.result { margin-top: 24px; text-align: center; }
.result h3 { margin-bottom: 12px; }
.result-img { max-width: 100%; max-height: 400px; border-radius: 8px; border: 1px solid #e0e0e0; }
.btn-secondary { margin-top: 12px; padding: 10px 20px; background: #10b981; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; }
.btn-secondary:hover { background: #059669; }
@media (max-width: 600px) {
  .control-row { flex-direction: column; }
  .tool-page { padding: 12px; }
}
</style>
