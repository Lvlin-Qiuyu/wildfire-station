<template>
  <div class="tool-page">
    <h2>📱 响应式断点测试器</h2>
    <p class="subtitle">在不同屏幕尺寸下预览网页效果，支持预设设备断点、可拖拽调整宽度、媒体查询状态显示</p>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="url-bar">
        <span class="url-icon">🔗</span>
        <input
          v-model="urlInput"
          class="url-input"
          placeholder="输入 URL（如 https://example.com）"
          @keydown.enter="loadUrl"
        />
        <button class="btn-go" @click="loadUrl">加载</button>
      </div>

      <div class="url-bar" style="margin-top: 0.5rem;">
        <span class="url-icon">📝</span>
        <input
          v-model="isCustomHtml ? customHtml : ''"
          class="url-input"
          :placeholder="isCustomHtml ? '在此输入 HTML 代码...' : '或切换到 HTML 模式输入代码'"
          :readonly="!isCustomHtml"
          spellcheck="false"
        />
        <button class="btn-toggle" @click="isCustomHtml = !isCustomHtml">
          {{ isCustomHtml ? 'URL 模式' : 'HTML 模式' }}
        </button>
      </div>
    </div>

    <!-- 设备预设按钮 -->
    <div class="device-presets">
      <button
        v-for="device in devices"
        :key="device.name"
        class="btn-device"
        :class="{ active: currentWidth === device.width }"
        @click="setWidth(device.width)"
      >
        <span class="device-icon">{{ device.icon }}</span>
        <span class="device-name">{{ device.name }}</span>
        <span class="device-size">{{ device.width }}×{{ device.height }}</span>
      </button>
    </div>

    <!-- 自定义宽度 -->
    <div class="custom-width-bar">
      <span class="width-label">自定义宽度</span>
      <input
        v-model.number="currentWidth"
        type="range"
        :min="320"
        :max="1920"
        step="1"
        class="width-slider"
      />
      <span class="width-value">{{ currentWidth }}px</span>
    </div>

    <!-- 媒体查询断点状态 -->
    <div class="breakpoint-status">
      <span class="bp-label">媒体查询状态</span>
      <div class="bp-list">
        <span
          v-for="bp in breakpoints"
          :key="bp.name"
          class="bp-tag"
          :class="{ active: currentWidth >= bp.min && currentWidth < bp.max }"
        >
          {{ bp.name }} (≥{{ bp.min }}px)
        </span>
      </div>
    </div>

    <!-- 预览区域 -->
    <div class="preview-wrapper" ref="previewWrapper">
      <div class="preview-frame-wrapper" :style="{ width: previewWidth + 'px' }">
        <!-- 可拖拽调整手柄 -->
        <div class="resize-handle" @mousedown="startResize">
          <div class="handle-grip"></div>
        </div>
        <!-- 帧信息栏 -->
        <div class="frame-info">
          <span>📐 {{ previewWidth }} × {{ frameHeight }}px</span>
          <span v-if="activeBreakpoint">📊 {{ activeBreakpoint }}</span>
        </div>
        <!-- iframe -->
        <iframe
          ref="previewFrame"
          class="preview-iframe"
          :style="{ width: previewWidth + 'px', height: frameHeight + 'px' }"
          sandbox="allow-scripts allow-same-origin"
        ></iframe>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '响应式断点测试器 - 野火小站' })

const previewWrapper = ref(null)
const previewFrame = ref(null)

const urlInput = ref('https://example.com')
const customHtml = ref('')
const isCustomHtml = ref(false)
const currentWidth = ref(375)
const frameHeight = ref(600)
const isResizing = ref(false)

// 预览宽度（受当前宽度驱动）
const previewWidth = computed(() => currentWidth.value)

// 设备预设
const devices = [
  { name: 'iPhone SE', icon: '📱', width: 375, height: 667 },
  { name: 'iPhone 14', icon: '📱', width: 390, height: 844 },
  { name: 'iPad Mini', icon: '📲', width: 768, height: 1024 },
  { name: 'iPad Pro', icon: '📲', width: 1024, height: 1366 },
  { name: '笔记本', icon: '💻', width: 1366, height: 768 },
  { name: '桌面', icon: '🖥️', width: 1920, height: 1080 },
]

// 媒体查询断点
const breakpoints = [
  { name: 'xs', min: 0, max: 576 },
  { name: 'sm', min: 576, max: 768 },
  { name: 'md', min: 768, max: 992 },
  { name: 'lg', min: 992, max: 1200 },
  { name: 'xl', min: 1200, max: 1400 },
  { name: '2xl', min: 1400, max: 9999 },
]

// 当前激活的断点
const activeBreakpoint = computed(() => {
  return breakpoints.find(bp => currentWidth.value >= bp.min && currentWidth.value < bp.max)?.name || ''
})

// 设置宽度
function setWidth(w) {
  currentWidth.value = w
  const device = devices.find(d => d.width === w)
  if (device) frameHeight.value = device.height
}

// 加载 URL
function loadUrl() {
  if (isCustomHtml.value) {
    loadHtmlContent(customHtml.value)
  } else {
    const url = urlInput.value.trim()
    if (!url) return
    const fullUrl = url.startsWith('http') ? url : 'https://' + url
    if (previewFrame.value) {
      previewFrame.value.src = fullUrl
    }
  }
}

// 加载 HTML 内容
function loadHtmlContent(html) {
  nextTick(() => {
    if (previewFrame.value) {
      const doc = previewFrame.value.contentDocument || previewFrame.value.contentWindow.document
      doc.open()
      doc.write(html || '<p style="padding:2rem;font-family:sans-serif;color:#888;">请输入 HTML 代码进行预览</p>')
      doc.close()
    }
  })
}

// 拖拽调整大小
function startResize(e) {
  isResizing.value = true
  const startX = e.clientX
  const startWidth = currentWidth.value

  function onMouseMove(ev) {
    if (!isResizing.value) return
    const delta = ev.clientX - startX
    const newWidth = Math.max(320, Math.min(1920, startWidth + delta))
    currentWidth.value = newWidth
  }

  function onMouseUp() {
    isResizing.value = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

// 监听 HTML 模式变化自动刷新
watch(isCustomHtml, () => {
  if (isCustomHtml.value) {
    loadHtmlContent(customHtml.value)
  } else {
    loadUrl()
  }
})

watch(customHtml, (val) => {
  if (isCustomHtml.value) loadHtmlContent(val)
})

// 初始加载
onMounted(() => {
  loadUrl()
})
</script>

<style scoped>
.tool-page {
  max-width: 100%;
  margin: 0 auto;
  padding: 1rem;
}

h2 { font-size: 1.6rem; margin-bottom: 0.5rem; }
.subtitle { color: #666; margin-bottom: 1.5rem; }

/* 工具栏 */
.toolbar {
  background: #fff;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border: 1px solid #eee;
  margin-bottom: 1rem;
}

.url-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.url-icon { font-size: 1.1rem; }

.url-input {
  flex: 1;
  padding: 0.5rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
}

.url-input:focus { border-color: #22c55e; }

.btn-go {
  padding: 0.5rem 1.2rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-go:hover { opacity: 0.85; }

.btn-toggle {
  padding: 0.5rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f8f9fa;
  font-size: 0.8rem;
  cursor: pointer;
  color: #555;
  white-space: nowrap;
}

.btn-toggle:hover { border-color: #22c55e; color: #22c55e; }

/* 设备预设 */
.device-presets {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.btn-device {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.6rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 90px;
}

.btn-device:hover { border-color: #22c55e; }

.btn-device.active {
  border-color: #22c55e;
  background: #f0fdf4;
}

.device-icon { font-size: 1.5rem; }
.device-name { font-size: 0.8rem; font-weight: 600; color: #555; margin-top: 0.2rem; }
.device-size { font-size: 0.7rem; color: #aaa; }

/* 自定义宽度 */
.custom-width-bar {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  background: #fff;
  padding: 0.8rem 1rem;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border: 1px solid #eee;
  margin-bottom: 0.8rem;
}

.width-label {
  font-size: 0.85rem;
  color: #888;
  white-space: nowrap;
}

.width-slider {
  flex: 1;
  accent-color: #22c55e;
  cursor: pointer;
}

.width-value {
  font-family: monospace;
  font-weight: 700;
  color: #22c55e;
  min-width: 60px;
  text-align: right;
}

/* 断点状态 */
.breakpoint-status {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.bp-label {
  font-size: 0.85rem;
  color: #888;
}

.bp-list {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.bp-tag {
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  background: #f3f4f6;
  color: #9ca3af;
  transition: all 0.2s;
}

.bp-tag.active {
  background: #22c55e;
  color: white;
}

/* 预览区 */
.preview-wrapper {
  background: #e5e7eb;
  border-radius: 12px;
  padding: 2rem;
  display: flex;
  justify-content: center;
  min-height: 500px;
  overflow-x: auto;
}

.preview-frame-wrapper {
  position: relative;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  overflow: hidden;
  transition: width 0.15s ease;
}

.resize-handle {
  position: absolute;
  right: -8px;
  top: 0;
  bottom: 0;
  width: 16px;
  cursor: ew-resize;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.resize-handle:hover .handle-grip,
.resize-handle:active .handle-grip {
  background: #22c55e;
}

.handle-grip {
  width: 4px;
  height: 40px;
  border-radius: 2px;
  background: #ccc;
  transition: background 0.2s;
}

.frame-info {
  display: flex;
  justify-content: space-between;
  padding: 0.4rem 0.8rem;
  background: #f1f5f9;
  font-size: 0.75rem;
  font-family: monospace;
  color: #64748b;
  border-bottom: 1px solid #e2e8f0;
}

.preview-iframe {
  border: none;
  display: block;
  background: white;
}

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #22c55e;
  font-weight: 500;
}

.back-link:hover { text-decoration: underline; }

@media (max-width: 640px) {
  .device-presets { gap: 0.3rem; }
  .btn-device { min-width: 70px; padding: 0.4rem 0.6rem; }
  .preview-wrapper { padding: 1rem; }
}
</style>
