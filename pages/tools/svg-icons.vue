<template>
  <div class="tool-page">
    <h2>🎨 SVG 图标生成器</h2>
    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>

    <div class="controls">
      <div class="control-group">
        <label>选择图标</label>
        <div class="icon-grid">
          <div v-for="(icon, idx) in icons" :key="idx" :class="['icon-cell', { active: selectedIdx === idx }]" @click="selectedIdx = idx" :title="icon.name">
            <div v-html="getSmallSvg(idx)"></div>
          </div>
        </div>
      </div>
      <div class="control-row">
        <div class="control-group">
          <label>颜色</label>
          <input type="color" v-model="color" />
        </div>
        <div class="control-group">
          <label>大小 <b>{{ size }}px</b></label>
          <input type="range" v-model.number="size" min="16" max="128" />
        </div>
        <div class="control-group">
          <label>描边宽度 <b>{{ strokeWidth }}</b></label>
          <input type="range" v-model.number="strokeWidth" min="0.5" max="6" step="0.5" />
        </div>
        <div class="control-group">
          <label>填充</label>
          <label class="toggle-label"><input type="checkbox" v-model="filled" /> 启用</label>
        </div>
      </div>
    </div>

    <div class="preview-section">
      <div class="preview-box">
        <div v-html="previewSvg"></div>
      </div>
    </div>

    <div class="code-section">
      <div class="code-header">
        <label>SVG 代码</label>
        <button class="btn-copy" @click="copyCode">📋 复制 SVG</button>
      </div>
      <pre class="code-output"><code>{{ svgCode }}</code></pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

useHead({ title: 'SVG 图标生成器 - 野火小站' })

const color = ref('#22c55e')
const size = ref(48)
const strokeWidth = ref(2)
const filled = ref(false)
const selectedIdx = ref(0)

const icons = [
  { name: '箭头右', path: 'M5 12h14m-4-4l4 4-4 4' },
  { name: '箭头左', path: 'M19 12H5m4-4l-4 4 4 4' },
  { name: '箭头上', path: 'M12 5v14m-4-4l4 4 4-4' },
  { name: '箭头下', path: 'M12 19V5m-4 4l4-4 4 4' },
  { name: '双箭头右', path: 'M5 12h14m-3-4l3 4-3 4M5 12l3-4-3 4M8 12l3-4-3 4' },
  { name: '对勾', path: 'M5 12l5 5L19 7' },
  { name: '叉号', path: 'M18 6L6 18M6 6l12 12' },
  { name: '加号', path: 'M12 5v14m-7-7h14' },
  { name: '减号', path: 'M5 12h14' },
  { name: '星星', d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
  { name: '心形', d: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' },
  { name: '闪电', d: 'M13 2L3 14h9l-1 10 10-12h-9l1-10z' },
  { name: '铃铛', d: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0' },
  { name: '搜索', path: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35' },
  { name: '菜单', path: 'M3 12h18M3 6h18M3 18h18' },
  { name: '关闭', path: 'M18 6L6 18M6 6l12 12' },
  { name: '警告', d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01' },
  { name: '信息', d: 'M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z' },
  { name: '用户', path: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
  { name: '首页', path: 'M3 12l9-9 9 9M5 10v10a1 1 0 0 0 1 1h3v-6h6v6h3a1 1 0 0 0 1-1V10' },
  { name: '设置齿轮', d: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' },
  { name: '书签', d: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z' },
  { name: '邮件', d: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 0l8 8m-8-8l8 8 8-8m-8 8l8-8' },
  { name: '电话', path: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z' },
  { name: '日历', d: 'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm-2-2v4M5 2v4m-3 4h20M8 10v6' },
  { name: '文件夹', d: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' },
  { name: '下载', path: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3' },
  { name: '上传', path: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12' },
  { name: '分享', d: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13' },
  { name: '点赞', d: 'M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z' },
  { name: '评论', d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  { name: '链接', d: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' },
]

function buildIconContent(icon, c, sw, isFilled) {
  if (icon.d) {
    return `<path d="${icon.d}" fill="${isFilled ? c : 'none'}" stroke="${c}" stroke-width="${isFilled ? 0 : sw}" stroke-linecap="round" stroke-linejoin="round"/>`
  }
  if (icon.path) {
    return `<path d="${icon.path}" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`
  }
  return ''
}

const svgCode = computed(() => {
  const icon = icons[selectedIdx.value]
  const content = buildIconContent(icon, color.value, strokeWidth.value, filled.value)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size.value}" height="${size.value}" viewBox="0 0 24 24">\n  ${content}\n</svg>`
})

const previewSvg = computed(() => {
  return svgCode.value
})

function getSmallSvg(idx) {
  const icon = icons[idx]
  const content = buildIconContent(icon, selectedIdx.value === idx ? '#22c55e' : '#555', 1.5, false)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">${content}</svg>`
}

function copyCode() {
  navigator.clipboard.writeText(svgCode.value).then(() => {
    const btn = document.querySelector('.btn-copy')
    btn.textContent = '✅ 已复制'
    setTimeout(() => { btn.textContent = '📋 复制 SVG' }, 1500)
  })
}
</script>

<style scoped>
.tool-page { max-width: 800px; margin: 0 auto; padding: 20px; }
.back-link { display: inline-block; margin-bottom: 16px; color: #10b981; text-decoration: none; }
.back-link:hover { text-decoration: underline; }
h2 { color: #1a1a2e; margin-bottom: 20px; }
.controls { display: flex; flex-direction: column; gap: 16px; }
.control-row { display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-end; }
.control-group { min-width: 120px; }
.control-group label { display: block; font-size: 14px; color: #555; margin-bottom: 6px; }
.control-group input[type="color"] { width: 50px; height: 34px; border: none; border-radius: 6px; cursor: pointer; }
.control-group input[type="range"] { width: 120px; accent-color: #22c55e; }
.toggle-label { display: flex; align-items: center; gap: 4px; font-size: 14px; cursor: pointer; }
.toggle-label input { accent-color: #22c55e; }
.icon-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(48px, 1fr)); gap: 4px; }
.icon-cell { padding: 10px; text-align: center; border: 2px solid #eee; border-radius: 8px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
.icon-cell:hover { border-color: #22c55e; }
.icon-cell.active { border-color: #22c55e; background: #f0fdf4; }
.preview-section { margin-top: 20px; }
.preview-box { display: flex; align-items: center; justify-content: center; min-height: 160px; background: #f8f9fa; border-radius: 12px; border: 1px solid #eee; }
.code-section { margin-top: 20px; }
.code-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.code-header label { font-size: 14px; color: #555; }
.btn-copy { padding: 6px 14px; background: #10b981; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; }
.btn-copy:hover { background: #059669; }
.code-output { background: #1a1a2e; color: #e0e0e0; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 13px; line-height: 1.5; }
@media (max-width: 600px) { .tool-page { padding: 12px; } .control-row { flex-direction: column; } }
</style>
