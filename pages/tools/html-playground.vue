<template>
  <div class="tool-page">
    <h2>🌐 HTML 实时预览沙盒</h2>
    <p class="subtitle">输入 HTML/CSS/JS 代码，实时在 iframe 中预览渲染结果，支持全屏预览、代码分享</p>

    <!-- 预设模板 -->
    <div class="template-bar">
      <span class="template-label">预设模板：</span>
      <button v-for="t in templates" :key="t.name" class="btn-template" @click="loadTemplate(t)">
        {{ t.icon }} {{ t.name }}
      </button>
    </div>

    <!-- 编辑区域 -->
    <div class="editor-layout">
      <!-- 编辑器标签 -->
      <div class="editor-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="btn-tab"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.icon }} {{ tab.name }}
        </button>
      </div>

      <!-- 代码编辑器 -->
      <div class="editor-panels">
        <!-- HTML -->
        <div v-show="activeTab === 'html'" class="editor-panel">
          <textarea
            v-model="htmlCode"
            class="code-editor"
            placeholder="在此输入 HTML 代码..."
            spellcheck="false"
            @input="debouncedUpdate"
          ></textarea>
        </div>

        <!-- CSS -->
        <div v-show="activeTab === 'css'" class="editor-panel">
          <textarea
            v-model="cssCode"
            class="code-editor"
            placeholder="在此输入 CSS 代码..."
            spellcheck="false"
            @input="debouncedUpdate"
          ></textarea>
        </div>

        <!-- JavaScript -->
        <div v-show="activeTab === 'js'" class="editor-panel">
          <textarea
            v-model="jsCode"
            class="code-editor"
            placeholder="在此输入 JavaScript 代码..."
            spellcheck="false"
            @input="debouncedUpdate"
          ></textarea>
        </div>
      </div>

      <!-- 预览区域 -->
      <div class="preview-panel">
        <div class="preview-header">
          <span class="preview-title">👁️ 实时预览</span>
          <div class="preview-actions">
            <button class="btn-icon" @click="toggleFullscreen" title="全屏预览">
              {{ isFullscreen ? '退缩' : '放大' }}
            </button>
            <button class="btn-icon" @click="refreshPreview" title="刷新">🔄</button>
            <button class="btn-icon" @click="shareCode" title="分享链接">🔗</button>
          </div>
        </div>
        <div class="preview-frame" :class="{ fullscreen: isFullscreen }">
          <iframe ref="previewFrame" class="preview-iframe" sandbox="allow-scripts allow-same-origin"></iframe>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-bar">
      <button class="btn-copy" @click="copyAllCode">📋 复制全部代码</button>
      <button class="btn-copy btn-json" @click="downloadHTML">📥 下载 HTML</button>
      <button class="btn-copy btn-copy2" @click="clearAll">🗑️ 清空</button>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'HTML实时预览沙盒 - 野火小站' })

const htmlCode = ref('')
const cssCode = ref('')
const jsCode = ref('')
const activeTab = ref('html')
const isFullscreen = ref(false)

const previewFrame = ref(null)

const tabs = [
  { key: 'html', name: 'HTML', icon: '📄' },
  { key: 'css', name: 'CSS', icon: '🎨' },
  { key: 'js', name: 'JavaScript', icon: '⚡' },
]

// 预设模板
const templates = [
  {
    name: '空白',
    icon: '📝',
    html: '<div class="container">\n  <h1>Hello World</h1>\n  <p>开始编写你的 HTML 代码吧！</p>\n</div>',
    css: '.container {\n  text-align: center;\n  padding: 2rem;\n  font-family: sans-serif;\n}\n\nh1 { color: #22c55e; }\np { color: #666; }',
    js: '// 在此编写 JavaScript\ndocument.querySelector("h1").addEventListener("click", () => {\n  document.querySelector("h1").textContent = "🎉 被点击了！";\n});',
  },
  {
    name: '卡片',
    icon: '🃏',
    html: '<div class="card">\n  <div class="card-header">\n    <h2>野火小站</h2>\n    <span class="badge">在线工具箱</span>\n  </div>\n  <div class="card-body">\n    <p>简洁实用的在线工具集合，涵盖加密解密、格式转换、可视化等多个领域。</p>\n  </div>\n  <div class="card-footer">\n    <button onclick="handleClick()">了解更多</button>\n  </div>\n</div>',
    css: '.card {\n  max-width: 320px;\n  margin: 2rem auto;\n  background: white;\n  border-radius: 12px;\n  box-shadow: 0 4px 20px rgba(0,0,0,0.1);\n  overflow: hidden;\n  font-family: sans-serif;\n}\n\n.card-header {\n  padding: 1.2rem;\n  background: linear-gradient(135deg, #22c55e, #10b981);\n  color: white;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n\n.badge {\n  background: rgba(255,255,255,0.2);\n  padding: 0.2rem 0.6rem;\n  border-radius: 10px;\n  font-size: 0.8rem;\n}\n\n.card-body { padding: 1.2rem; color: #666; line-height: 1.6; }\n\n.card-footer { padding: 1rem 1.2rem; text-align: right; }\n\n.card-footer button {\n  background: #22c55e;\n  color: white;\n  border: none;\n  padding: 0.5rem 1.2rem;\n  border-radius: 6px;\n  cursor: pointer;\n  font-size: 0.9rem;\n}\n\n.card-footer button:hover { opacity: 0.85; }',
    js: 'function handleClick() {\n  const btn = document.querySelector("button");\n  btn.textContent = "🔥 前往野火小站";\n  btn.style.background = "#ef4444";\n}',
  },
  {
    name: '表格',
    icon: '📊',
    html: '<table class="styled-table">\n  <thead>\n    <tr>\n      <th>工具名称</th>\n      <th>分类</th>\n      <th>状态</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr><td>AES 加密</td><td>安全</td><td><span class="badge green">在线</span></td></tr>\n    <tr><td>JSON 格式化</td><td>开发</td><td><span class="badge green">在线</span></td></tr>\n    <tr><td>正则测试</td><td>开发</td><td><span class="badge green">在线</span></td></tr>\n    <tr><td>Markdown 预览</td><td>编辑</td><td><span class="badge green">在线</span></td></tr>\n  </tbody>\n</table>',
    css: '.styled-table {\n  width: 90%;\n  max-width: 500px;\n  margin: 2rem auto;\n  border-collapse: collapse;\n  font-family: sans-serif;\n  box-shadow: 0 2px 12px rgba(0,0,0,0.1);\n  border-radius: 8px;\n  overflow: hidden;\n}\n\n.styled-table th {\n  background: #22c55e;\n  color: white;\n  padding: 0.8rem 1rem;\n  text-align: left;\n}\n\n.styled-table td {\n  padding: 0.7rem 1rem;\n  border-bottom: 1px solid #eee;\n}\n\n.styled-table tr:hover { background: #f0fdf4; }\n\n.badge {\n  display: inline-block;\n  padding: 0.15rem 0.5rem;\n  border-radius: 10px;\n  font-size: 0.8rem;\n}\n\n.badge.green { background: #dcfce7; color: #16a34a; }',
    js: '// 行点击高亮\nconst rows = document.querySelectorAll("tbody tr");\nrows.forEach(row => {\n  row.style.cursor = "pointer";\n  row.addEventListener("click", () => {\n    rows.forEach(r => r.style.background = "");\n    row.style.background = "#dcfce7";\n  });\n});',
  },
  {
    name: '动画',
    icon: '✨',
    html: '<div class="animation-demo">\n  <div class="box" id="box1">弹跳</div>\n  <div class="box" id="box2">旋转</div>\n  <div class="box" id="box3">脉冲</div>\n  <div class="box" id="box4">摇摆</div>\n</div>',
    css: '.animation-demo {\n  display: flex;\n  justify-content: center;\n  gap: 2rem;\n  padding: 3rem;\n  flex-wrap: wrap;\n  font-family: sans-serif;\n}\n\n.box {\n  width: 80px;\n  height: 80px;\n  background: linear-gradient(135deg, #22c55e, #10b981);\n  border-radius: 12px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  color: white;\n  font-size: 0.75rem;\n  font-weight: 600;\n}\n\n#box1 { animation: bounce 1s ease infinite; }\n#box2 { animation: spin 2s linear infinite; }\n#box3 { animation: pulse 1.5s ease-in-out infinite; }\n#box4 { animation: swing 1s ease-in-out infinite; }\n\n@keyframes bounce {\n  0%, 100% { transform: translateY(0); }\n  50% { transform: translateY(-30px); }\n}\n\n@keyframes spin { to { transform: rotate(360deg); } }\n@keyframes pulse {\n  0%, 100% { transform: scale(1); }\n  50% { transform: scale(1.15); }\n}\n\n@keyframes swing {\n  0%, 100% { transform: rotate(0); }\n  25% { transform: rotate(15deg); }\n  75% { transform: rotate(-15deg); }\n}',
    js: '// 点击盒子停止/恢复动画\nconst boxes = document.querySelectorAll(".box");\nboxes.forEach(box => {\n  box.style.cursor = "pointer";\n  box.addEventListener("click", () => {\n    box.style.animationPlayState =\n      box.style.animationPlayState === "paused" ? "running" : "paused";\n    box.textContent = box.style.animationPlayState === "paused" ? "暂停" : box.textContent;\n  });\n});',
  },
  {
    name: '表单',
    icon: '📝',
    html: '<form class="form" onsubmit="return handleSubmit(event)">\n  <div class="field">\n    <label>用户名</label>\n    <input type="text" placeholder="请输入用户名" id="username" />\n  </div>\n  <div class="field">\n    <label>邮箱</label>\n    <input type="email" placeholder="请输入邮箱" id="email" />\n  </div>\n  <div class="field">\n    <label>留言</label>\n    <textarea placeholder="写点什么..." id="message" rows="3"></textarea>\n  </div>\n  <button type="submit">提交</button>\n  <div id="result"></div>\n</form>',
    css: '.form {\n  max-width: 400px;\n  margin: 2rem auto;\n  padding: 1.5rem;\n  font-family: sans-serif;\n  background: white;\n  border-radius: 12px;\n  box-shadow: 0 4px 20px rgba(0,0,0,0.08);\n}\n\n.field { margin-bottom: 1rem; }\n\nlabel {\n  display: block;\n  font-size: 0.85rem;\n  color: #555;\n  margin-bottom: 0.3rem;\n  font-weight: 600;\n}\n\ninput, textarea {\n  width: 100%;\n  padding: 0.6rem;\n  border: 2px solid #e0e0e0;\n  border-radius: 8px;\n  font-size: 0.9rem;\n  outline: none;\n  box-sizing: border-box;\n  font-family: inherit;\n}\n\ninput:focus, textarea:focus { border-color: #22c55e; }\n\nbutton[type="submit"] {\n  width: 100%;\n  padding: 0.7rem;\n  background: #22c55e;\n  color: white;\n  border: none;\n  border-radius: 8px;\n  font-size: 1rem;\n  cursor: pointer;\n}\n\nbutton[type="submit"]:hover { opacity: 0.85; }\n\n#result {\n  margin-top: 1rem;\n  padding: 0.8rem;\n  border-radius: 8px;\n  display: none;\n}\n\n#result.success {\n  display: block;\n  background: #f0fdf4;\n  color: #16a34a;\n  text-align: center;\n}',
    js: 'function handleSubmit(e) {\n  e.preventDefault();\n  const name = document.getElementById("username").value;\n  const email = document.getElementById("email").value;\n  const msg = document.getElementById("message").value;\n  \n  if (!name || !email) {\n    alert("请填写用户名和邮箱");\n    return false;\n  }\n  \n  const result = document.getElementById("result");\n  result.className = "success";\n  result.textContent = `✅ 提交成功！用户: ${name}`;\n  return false;\n}',
  },
]

// 加载模板
function loadTemplate(t) {
  htmlCode.value = t.html
  cssCode.value = t.css
  jsCode.value = t.js
  updatePreview()
}

// 防抖更新预览
let debounceTimer = null
function debouncedUpdate() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(updatePreview, 300)
}

// 更新预览
function updatePreview() {
  const frame = previewFrame.value
  if (!frame) return

  const fullHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${cssCode.value}</style>
</head>
<body>${htmlCode.value}
<script>${jsCode.value}<\/script>
</body>
</html>`

  // 使用 srcdoc 设置 iframe 内容
  frame.srcdoc = fullHTML
}

// 刷新预览
function refreshPreview() {
  updatePreview()
}

// 全屏切换
function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

// 分享代码（通过 URL hash 编码）
function shareCode() {
  const data = {
    h: htmlCode.value,
    c: cssCode.value,
    j: jsCode.value,
  }
  try {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))))
    const url = window.location.origin + window.location.pathname + '#code=' + encoded
    navigator.clipboard.writeText(url).then(() => {
      alert('分享链接已复制到剪贴板！')
    })
  } catch {
    alert('代码太长，无法生成分享链接')
  }
}

// 复制全部代码
function copyAllCode() {
  const fullHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>HTML 沙盒</title>
<style>
${cssCode.value}
</style>
</head>
<body>
${htmlCode.value}
<script>
${jsCode.value}
<\/script>
</body>
</html>`
  navigator.clipboard.writeText(fullHTML).then(() => alert('已复制完整 HTML 代码'))
}

// 下载 HTML 文件
function downloadHTML() {
  const fullHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>HTML 沙盒</title>
<style>
${cssCode.value}
</style>
</head>
<body>
${htmlCode.value}
<script>
${jsCode.value}
<\/script>
</body>
</html>`
  const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'playground.html'
  link.click()
  URL.revokeObjectURL(link.href)
}

// 清空
function clearAll() {
  htmlCode.value = ''
  cssCode.value = ''
  jsCode.value = ''
  updatePreview()
}

// 初始化：从 URL hash 恢复代码
onMounted(() => {
  const hash = window.location.hash
  if (hash.startsWith('#code=')) {
    try {
      const encoded = hash.slice(6)
      const data = JSON.parse(decodeURIComponent(escape(atob(encoded))))
      if (data.h) htmlCode.value = data.h
      if (data.c) cssCode.value = data.c
      if (data.j) jsCode.value = data.j
      updatePreview()
    } catch {
      // 忽略解析失败
    }
  }

  // 加载默认模板
  if (!htmlCode.value && !cssCode.value) {
    loadTemplate(templates[0])
  }
})
</script>

<style scoped>
.tool-page { padding-top: 0.5rem; }
h2 { font-size: 1.6rem; margin-bottom: 0.3rem; }
.subtitle { color: #888; font-size: 0.95rem; margin-bottom: 1rem; }

/* 模板栏 */
.template-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.template-label {
  font-size: 0.85rem;
  color: #888;
  font-weight: 600;
}

.btn-template {
  padding: 0.35rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #f8f9fa;
  font-size: 0.8rem;
  color: #555;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-template:hover {
  border-color: #22c55e;
  color: #16a34a;
  background: #f0fdf4;
}

/* 编辑器布局 */
.editor-layout {
  display: flex;
  flex-direction: column;
  gap: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  border: 1px solid #eee;
  overflow: hidden;
  margin-bottom: 1rem;
}

/* 编辑器标签 */
.editor-tabs {
  display: flex;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.btn-tab {
  flex: 1;
  padding: 0.7rem 1rem;
  border: none;
  background: transparent;
  font-size: 0.9rem;
  color: #888;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.btn-tab:hover { color: #555; background: #f0f0f0; }

.btn-tab.active {
  color: #16a34a;
  font-weight: 600;
  background: white;
}

.btn-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #22c55e;
}

/* 编辑器面板 */
.editor-panels {
  position: relative;
}

.editor-panel {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.code-editor {
  width: 100%;
  height: 280px;
  padding: 1rem;
  border: none;
  resize: vertical;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
  outline: none;
  background: #1e1e2e;
  color: #cdd6f4;
  tab-size: 2;
  box-sizing: border-box;
}

/* 预览面板 */
.preview-panel {
  border-top: 2px solid #eee;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.preview-title {
  font-size: 0.85rem;
  color: #888;
  font-weight: 600;
}

.preview-actions {
  display: flex;
  gap: 0.3rem;
}

.btn-icon {
  padding: 0.25rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon:hover {
  border-color: #22c55e;
  background: #f0fdf4;
}

.preview-frame {
  height: 350px;
  position: relative;
}

.preview-frame.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100vh;
  z-index: 9999;
  background: white;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
}

/* 操作按钮 */
.action-bar { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1.5rem; }

.btn-copy {
  padding: 0.6rem 1.5rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  font-weight: 600;
}

.btn-copy:hover { opacity: 0.85; }
.btn-json { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
.btn-copy2 { background: linear-gradient(135deg, #f59e0b, #f97316); }

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #22c55e;
  font-weight: 500;
}

.back-link:hover { text-decoration: underline; }

@media (max-width: 768px) {
  .code-editor { height: 200px; font-size: 0.8rem; }
  .preview-frame { height: 280px; }
}
</style>
