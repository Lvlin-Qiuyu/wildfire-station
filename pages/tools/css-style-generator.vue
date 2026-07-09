<template>
  <div class="tool-page">
    <h2>🎨 CSS样式生成器</h2>
    <p class="subtitle">拖拽式CSS样式编辑器，实时预览效果，一键复制CSS代码</p>

    <div class="css-generator">
      <div class="property-controls">
        <h3>样式属性</h3>
        <div class="property-group">
          <label>背景颜色</label>
          <input type="color" v-model="styleProperties.backgroundColor" />
        </div>
        <div class="property-group">
          <label>文字颜色</label>
          <input type="color" v-model="styleProperties.color" />
        </div>
        <div class="property-group">
          <label>字体大小</label>
          <input type="range" v-model="styleProperties.fontSize" :min="12" :max="48" />
          <span>{{ styleProperties.fontSize }}px</span>
        </div>
        <div class="property-group">
          <label>字体粗细</label>
          <select v-model="styleProperties.fontWeight">
            <option value="300">细体</option>
            <option value="400">正常</option>
            <option value="500">中等</option>
            <option value="600">半粗体</option>
            <option value="700">粗体</option>
            <option value="900">特粗体</option>
          </select>
        </div>
        <div class="property-group">
          <label>文本对齐</label>
          <select v-model="styleProperties.textAlign">
            <option value="left">左对齐</option>
            <option value="center">居中</option>
            <option value="right">右对齐</option>
            <option value="justify">两端对齐</option>
          </select>
        </div>
        <div class="property-group">
          <label>行高</label>
          <input type="range" v-model="styleProperties.lineHeight" :min="1" :max="3" :step="0.1" />
          <span>{{ styleProperties.lineHeight }}</span>
        </div>
        <div class="property-group">
          <label>边框</label>
          <select v-model="styleProperties.borderStyle">
            <option value="none">无边框</option>
            <option value="solid">实线</option>
            <option value="dashed">虚线</option>
            <option value="dotted">点线</option>
            <option value="double">双线</option>
          </select>
        </div>
        <div class="property-group" v-if="styleProperties.borderStyle !== 'none'">
          <label>边框颜色</label>
          <input type="color" v-model="styleProperties.borderColor" />
          <label>边框宽度</label>
          <input type="range" v-model="styleProperties.borderWidth" :min="1" :max="10" />
          <span>{{ styleProperties.borderWidth }}px</span>
        </div>
        <div class="property-group">
          <label>内边距</label>
          <input type="range" v-model="styleProperties.padding" :min="0" :max="50" />
          <span>{{ styleProperties.padding }}px</span>
        </div>
        <div class="property-group">
          <label>圆角</label>
          <input type="range" v-model="styleProperties.borderRadius" :min="0" :max="50" />
          <span>{{ styleProperties.borderRadius }}px</span>
        </div>
        <div class="property-group">
          <label>外边距</label>
          <input type="range" v-model="styleProperties.margin" :min="0" :max="50" />
          <span>{{ styleProperties.margin }}px</span>
        </div>
      </div>

      <div class="preview-area">
        <div class="preview-header">
          <span>实时预览</span>
          <button class="btn-primary" @click="copyCSS">复制CSS</button>
        </div>
        <div class="preview-box" :style="computedStyles">
          <p>这是一段示例文本，用于预览CSS样式效果。您可以调整左侧的属性来实时看到变化。</p>
        </div>
      </div>
    </div>

    <div class="css-output">
      <div class="output-header">
        <span>CSS代码</span>
        <button class="btn-secondary" @click="downloadCSS">下载</button>
      </div>
      <pre><code>{{ cssCode }}</code></pre>
    </div>

    <div class="preset-styles">
      <h3>预设样式</h3>
      <div class="preset-grid">
        <button v-for="preset in presets" :key="preset.name" @click="applyPreset(preset)" class="preset-btn">
          {{ preset.name }}
        </button>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'CSS样式生成器 - 野火小站' })

const styleProperties = reactive({
  backgroundColor: '#ffffff',
  color: '#333333',
  fontSize: 16,
  fontWeight: '400',
  textAlign: 'left',
  lineHeight: 1.6,
  borderStyle: 'none',
  borderColor: '#cccccc',
  borderWidth: 1,
  padding: 16,
  borderRadius: 0,
  margin: 0
})

const presets = [
  {
    name: '默认卡片',
    properties: {
      backgroundColor: '#ffffff',
      color: '#333333',
      fontSize: 16,
      fontWeight: '400',
      textAlign: 'left',
      lineHeight: 1.6,
      borderStyle: 'solid',
      borderColor: '#e0e0e0',
      borderWidth: 1,
      padding: 16,
      borderRadius: 8,
      margin: 0
    }
  },
  {
    name: '警告卡片',
    properties: {
      backgroundColor: '#fff3cd',
      color: '#856404',
      fontSize: 16,
      fontWeight: '500',
      textAlign: 'left',
      lineHeight: 1.5,
      borderStyle: 'solid',
      borderColor: '#ffeaa7',
      borderWidth: 1,
      padding: 12,
      borderRadius: 6,
      margin: 0
    }
  },
  {
    name: '成功卡片',
    properties: {
      backgroundColor: '#d4edda',
      color: '#155724',
      fontSize: 16,
      fontWeight: '500',
      textAlign: 'left',
      lineHeight: 1.5,
      borderStyle: 'solid',
      borderColor: '#c3e6cb',
      borderWidth: 1,
      padding: 12,
      borderRadius: 6,
      margin: 0
    }
  },
  {
    name: '标题样式',
    properties: {
      backgroundColor: '#007bff',
      color: '#ffffff',
      fontSize: 24,
      fontWeight: '700',
      textAlign: 'center',
      lineHeight: 1.3,
      borderStyle: 'none',
      borderColor: '#007bff',
      borderWidth: 0,
      padding: 20,
      borderRadius: 0,
      margin: 0
    }
  }
]

const computedStyles = computed(() => {
  const styles = {}
  if (styleProperties.backgroundColor !== '#ffffff') {
    styles.backgroundColor = styleProperties.backgroundColor
  }
  if (styleProperties.color !== '#333333') {
    styles.color = styleProperties.color
  }
  styles.fontSize = `${styleProperties.fontSize}px`
  styles.fontWeight = styleProperties.fontWeight
  styles.textAlign = styleProperties.textAlign
  styles.lineHeight = styleProperties.lineHeight
  if (styleProperties.borderStyle !== 'none') {
    styles.borderStyle = styleProperties.borderStyle
    styles.borderColor = styleProperties.borderColor
    styles.borderWidth = `${styleProperties.borderWidth}px`
  }
  styles.padding = `${styleProperties.padding}px`
  if (styleProperties.borderRadius > 0) {
    styles.borderRadius = `${styleProperties.borderRadius}px`
  }
  if (styleProperties.margin > 0) {
    styles.margin = `${styleProperties.margin}px`
  }
  return styles
})

const cssCode = computed(() => {
  let code = '.custom-style {\n'
  if (styleProperties.backgroundColor !== '#ffffff') {
    code += `  background-color: ${styleProperties.backgroundColor};\n`
  }
  if (styleProperties.color !== '#333333') {
    code += `  color: ${styleProperties.color};\n`
  }
  code += `  font-size: ${styleProperties.fontSize}px;\n`
  code += `  font-weight: ${styleProperties.fontWeight};\n`
  code += `  text-align: ${styleProperties.textAlign};\n`
  code += `  line-height: ${styleProperties.lineHeight};\n`
  
  if (styleProperties.borderStyle !== 'none') {
    code += `  border-style: ${styleProperties.borderStyle};\n`
    code += `  border-color: ${styleProperties.borderColor};\n`
    code += `  border-width: ${styleProperties.borderWidth}px;\n`
  }
  code += `  padding: ${styleProperties.padding}px;\n`
  
  if (styleProperties.borderRadius > 0) {
    code += `  border-radius: ${styleProperties.borderRadius}px;\n`
  }
  
  if (styleProperties.margin > 0) {
    code += `  margin: ${styleProperties.margin}px;\n`
  }
  code += '}'
  return code
})

const applyPreset = (preset) => {
  Object.assign(styleProperties, preset.properties)
}

const copyCSS = () => {
  navigator.clipboard.writeText(cssCode.value).then(() => {
    alert('CSS代码已复制到剪贴板')
  })
}

const downloadCSS = () => {
  const blob = new Blob([cssCode.value], { type: 'text/css' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'custom-style.css'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.tool-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.subtitle {
  color: #666;
  margin-bottom: 30px;
}

.css-generator {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

@media (max-width: 768px) {
  .css-generator {
    grid-template-columns: 1fr;
  }
}

.property-controls {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.property-controls h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
}

.property-group {
  margin-bottom: 15px;
}

.property-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
}

.property-group input[type="color"],
.property-group select {
  width: 100%;
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.property-group input[type="range"] {
  width: 100%;
  margin-bottom: 5px;
}

.property-group span {
  font-size: 12px;
  color: #666;
}

.preview-area {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.preview-header {
  background: #f8f9fa;
  padding: 12px 16px;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-box {
  padding: 20px;
  min-height: 200px;
  transition: all 0.3s ease;
}

.css-output {
  margin-bottom: 30px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.output-header {
  background: #f8f9fa;
  padding: 12px 16px;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.css-output pre {
  margin: 0;
  padding: 16px;
  background: #2d3748;
  color: #e2e8f0;
  overflow-x: auto;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 14px;
  line-height: 1.5;
}

.preset-styles {
  margin-bottom: 20px;
}

.preset-styles h3 {
  margin-bottom: 15px;
  color: #333;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
}

.preset-btn {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.preset-btn:hover {
  background: #f0f0f0;
  border-color: #007bff;
}

.btn-primary {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  padding: 8px 16px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: #545b62;
}

.back-link {
  display: inline-block;
  padding: 8px 16px;
  background: #6c757d;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  margin-top: 20px;
}

.back-link:hover {
  background: #545b62;
}
</style>