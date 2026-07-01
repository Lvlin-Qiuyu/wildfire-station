<template>
  <div class="tool-page">
    <h2>🔤 ASCII 文字艺术生成器</h2>
    <p class="subtitle">输入文字，选择字体风格，一键生成 ASCII 字符画，支持自定义宽度和字符集</p>

    <div class="controls">
      <!-- 输入文字 -->
      <div class="control-group">
        <label>输入文字</label>
        <input
          type="text"
          v-model="inputText"
          placeholder="输入英文或数字"
          maxlength="20"
          class="text-input"
          @input="generateArt"
        />
      </div>

      <!-- 字体选择 -->
      <div class="control-group">
        <label>字体风格</label>
        <div class="font-list">
          <button
            v-for="font in fonts"
            :key="font.name"
            :class="['font-btn', { active: selectedFont === font.name }]"
            @click="selectFont(font.name)"
          >
            <span class="font-preview">{{ font.preview }}</span>
            <span class="font-name">{{ font.name }}</span>
          </button>
        </div>
      </div>

      <!-- 字符集选择 -->
      <div class="control-row">
        <div class="control-group">
          <label>填充字符</label>
          <div class="chip-group">
            <button
              v-for="cs in charsets"
              :key="cs.label"
              :class="['chip', { active: selectedCharset === cs.label }]"
              @click="selectedCharset = cs.label; generateArt()"
            >{{ cs.label }}</button>
          </div>
        </div>
      </div>

      <!-- 宽度调节 -->
      <div class="control-row">
        <div class="control-group">
          <label>输出宽度 <b>{{ outputWidth }}</b></label>
          <input type="range" v-model.number="outputWidth" min="40" max="200" step="10" class="range-input" @input="generateArt" />
        </div>
      </div>
    </div>

    <!-- 生成按钮 -->
    <button class="btn-primary" @click="generateArt">✨ 生成 ASCII 艺术</button>

    <!-- 结果展示 -->
    <div v-if="artOutput" class="result-section">
      <div class="result-header">
        <span>输出结果</span>
        <div class="result-actions">
          <button class="btn-copy" @click="copyArt">{{ copyArtText }}</button>
          <button class="btn-copy btn-download" @click="downloadArt">{{ downloadArtText }}</button>
        </div>
      </div>
      <div class="result-box">
        <pre class="art-output">{{ artOutput }}</pre>
      </div>
      <div class="result-stats">
        共 {{ artOutput.split('\n').length }} 行 · {{ artOutput.length }} 个字符
      </div>
    </div>

    <!-- 空提示 -->
    <div v-else-if="inputText && !artOutput" class="empty-hint">
      <p>💡 提示：ASCII Art 仅支持英文大写字母（A-Z）和数字（0-9）</p>
      <p>中文、标点和小写字母将自动转大写或忽略</p>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'ASCII 文字艺术生成器 - 野火小站' })

// 输入与选项
const inputText = ref('HELLO')
const selectedFont = ref('Shadow')
const selectedCharset = ref('标准')
const outputWidth = ref(80)
const artOutput = ref('')
const copyArtText = ref('📋 复制')
const downloadArtText = ref('⬇️ 下载 TXT')

// 字符集定义
const charsets = [
  { label: '标准', chars: '@#W$98765432?abc;:+=-,._ ' },
  { label: '方块', chars: '█▓▒░ ' },
  { label: '点阵', chars: '●◉○◎ ' },
  { label: '简洁', chars: '#: ' },
  { label: '星号', chars: '*+. ' },
]

// 字体定义（5×7 像素位图，每个字符用 7 个 uint8 表示，每 uint8 的低 5 位是像素）
// 使用 JSON 编码的位图数据，1 = 填充，0 = 空白
const fontMaps = {
  Banner: {
    preview: '横幅',
    data: generateBannerFont()
  },
  Shadow: {
    preview: '阴影',
    data: generateShadowFont()
  },
  Mini: {
    preview: '迷你',
    data: generateMiniFont()
  },
  Block: {
    preview: '方块',
    data: generateBlockFont()
  },
  Slant: {
    preview: '倾斜',
    data: generateSlantFont()
  },
  Big: {
    preview: '大号',
    data: generateBigFont()
  },
}

// 字体列表
const fonts = computed(() => Object.entries(fontMaps).map(([name, f]) => ({ name, preview: f.preview })))

// 选择字体
function selectFont(name) {
  selectedFont.value = name
  generateArt()
}

// 生成 ASCII 艺术
function generateArt() {
  const text = inputText.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '')
  if (!text.trim()) {
    artOutput.value = ''
    return
  }

  const font = fontMaps[selectedFont.value]
  if (!font) return

  const charPixels = renderTextToPixels(text, font.data)
  const art = pixelsToArt(charPixels, outputWidth.value)
  artOutput.value = art
}

// 渲染文字为像素矩阵（每个字符的位图拼在一起）
function renderTextToPixels(text, fontData) {
  const charWidth = fontData.charWidth || 6
  const charHeight = fontData.height || 7
  const spacing = 1

  // 计算总宽度
  let totalWidth = 0
  for (let i = 0; i < text.length; i++) {
    if (text[i] === ' ') {
      totalWidth += charWidth
    } else {
      const glyph = fontData.glyphs[text[i]]
      if (glyph) {
        totalWidth += (glyph[0] ? glyph[0].length : charWidth) || charWidth
      } else {
        totalWidth += charWidth
      }
    }
    totalWidth += spacing
  }

  // 创建像素矩阵
  const pixels = Array.from({ length: charHeight }, () => new Array(totalWidth).fill(0))

  let x = 0
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === ' ') {
      x += charWidth + spacing
      continue
    }
    const glyph = fontData.glyphs[ch]
    if (!glyph) {
      x += charWidth + spacing
      continue
    }
    // glyph 是行数组，每行是 0/1 数组
    for (let row = 0; row < Math.min(glyph.length, charHeight); row++) {
      for (let col = 0; col < glyph[row].length; col++) {
        if (x + col < totalWidth) {
          pixels[row][x + col] = glyph[row][col]
        }
      }
    }
    x += (glyph[0] ? glyph[0].length : charWidth) + spacing
  }

  return { pixels, width: totalWidth, height: charHeight }
}

// 像素矩阵转 ASCII 文本
function pixelsToArt(pixelData, maxWidth) {
  const { pixels, width, height } = pixelData
  const cs = charsets.find(c => c.label === selectedCharset.value)
  const chars = cs ? cs.chars : '@#W$98765432?abc;:+=-,._ '

  // 如果像素宽度小于目标宽度，直接输出
  if (width <= maxWidth) {
    return pixels.map(row => row.map(p => p ? chars[0] : chars[chars.length - 1]).join('')).join('\n')
  }

  // 需要缩放：2x 横向 + 2x 纵向 = 等比例放大（ASCII 字符宽高约 1:2，需要补偿）
  // 策略：直接使用原始像素，如果超宽则说明字体太大
  // 改用简单的等比缩放
  const scale = maxWidth / width
  const newWidth = Math.floor(width * scale)
  const newHeight = height // 高度不变，保持清晰

  const result = []
  for (let row = 0; row < newHeight; row++) {
    const srcRow = Math.floor(row * height / newHeight)
    let line = ''
    for (let col = 0; col < newWidth; col++) {
      const srcCol = Math.floor(col * width / newWidth)
      const p = (pixels[srcRow] && pixels[srcRow][srcCol]) || 0
      line += p ? chars[0] : chars[chars.length - 1]
    }
    result.push(line)
  }
  return result.join('\n')
}

// ========== 字体生成函数 ==========

// Banner 字体（5×7 标准横幅）
function generateBannerFont() {
  const H = 7
  const W = 5
  const glyphs = {}

  // 辅助函数：从字符串模式生成位图
  function fromPattern(lines) {
    return lines.map(line =>
      line.padEnd(W, ' ').split('').map(ch => ch === '#' ? 1 : 0)
    )
  }

  const patterns = {
    A: [' ### ','#   #','#   #','#####','#   #','#   #','#   #'],
    B: ['#### ','#   #','#### ','#   #','#   #','#### ','    '],
    C: [' ### ','#   #','#    ','#    ','#   #',' ### ','    '],
    D: ['#### ','#   #','#   #','#   #','#   #','#### ','    '],
    E: ['#####','#    ','#### ','#    ','#    ','#####','    '],
    F: ['#####','#    ','#### ','#    ','#    ','#    ','    '],
    G: [' ### ','#   #','#    ','# ###','#   #',' ### ','    '],
    H: ['#   #','#   #','#####','#   #','#   #','#   #','    '],
    I: [' ### ','  #  ','  #  ','  #  ','  #  ',' ### ','    '],
    J: ['  ###','   # ','   # ','   # ','#  # ',' ##  ','    '],
    K: ['#   #','#  # ','# #  ','##   ','# #  ','#  # ','#   #'],
    L: ['#    ','#    ','#    ','#    ','#    ','#####','    '],
    M: ['#   #','## ##','# # #','#   #','#   #','#   #','    '],
    N: ['#   #','##  #','# # #','#  ##','#   #','#   #','    '],
    O: [' ### ','#   #','#   #','#   #','#   #',' ### ','    '],
    P: ['#### ','#   #','#### ','#    ','#    ','#    ','    '],
    Q: [' ### ','#   #','#   #','# # #','#  # ',' ## #','    '],
    R: ['#### ','#   #','#### ','# #  ','#  # ','#   #','    '],
    S: [' ### ','#    ',' ### ','    ','    ',' ### ','    '],
    T: ['#####','  #  ','  #  ','  #  ','  #  ','  #  ','    '],
    U: ['#   #','#   #','#   #','#   #','#   #',' ### ','    '],
    V: ['#   #','#   #','#   #',' # # ',' # # ','  #  ','    '],
    W: ['#   #','#   #','# # #','# # #',' ## #',' #  #','    '],
    X: ['#   #',' # # ','  #  ','  #  ',' # # ','#   #','    '],
    Y: ['#   #',' # # ','  #  ','  #  ','  #  ','  #  ','    '],
    Z: ['#####','   # ','  #  ',' #   ','#    ','#####','    '],
    0: [' ### ','#  ##','# # #','## # ','#   #',' ### ','    '],
    1: ['  #  ',' ##  ','  #  ','  #  ','  #  ',' ### ','    '],
    2: [' ### ','#   #','  ## ',' #   ','#    ','#####','    '],
    3: ['#### ','    #',' ### ','    #','    #','#### ','    '],
    4: ['#  # ','#  # ','#####','   # ','   # ','   # ','    '],
    5: ['#####','#    ','#### ','    #','    #','#### ','    '],
    6: [' ### ','#    ','#### ','#   #','#   #',' ### ','    '],
    7: ['#####','   # ','  #  ',' #   ',' #   ',' #   ','    '],
    8: [' ### ','#   #',' ### ','#   #','#   #',' ### ','    '],
    9: [' ### ','#   #',' ####','    #','    #',' ### ','    '],
  }

  for (const [ch, lines] of Object.entries(patterns)) {
    glyphs[ch] = fromPattern(lines)
  }

  return { height: H, charWidth: W, glyphs }
}

// Shadow 字体（带阴影效果的 7×9 字体）
function generateShadowFont() {
  const glyphs = {}

  function fromPattern(lines) {
    return lines.map(line => line.split('').map(ch => {
      if (ch === '@') return 1 // 主字符
      if (ch === '.') return 1 // 阴影
      return 0
    }))
  }

  const W = 7
  const patterns = {
    A: ['  ###  ',' #   # ','#     #','#     #','#######','#     #','#     #','#     #','       '],
    B: ['###### ','#     #','#     #','###### ','#     #','#     #','#     #','###### ','       '],
    C: [' ##### ','#     #','#      ','#      ','#      ','#     #',' ##### ','       ','       '],
    D: ['###### ','#     #','#     #','#     #','#     #','#     #','###### ','       ','       '],
    E: ['#######','#      ','#      ','#####  ','#      ','#      ','#######','       ','       '],
    F: ['#######','#      ','#      ','#####  ','#      ','#      ','#      ','       ','       '],
    G: [' ##### ','#     #','#      ','#      ','# #####','#     #',' ##### ','       ','       '],
    H: ['#     #','#     #','#     #','#######','#     #','#     #','#     #','       ','       '],
    I: ['  ###  ','   #   ','   #   ','   #   ','   #   ','   #   ','  ###  ','       ','       '],
    J: ['    ###','     # ','     # ','     # ','     # ','#    # ',' ##   ','       ','       '],
    K: ['#    # ','#   #  ','#  #   ','##     ','#  #   ','#   #  ','#    # ','       ','       '],
    L: ['#      ','#      ','#      ','#      ','#      ','#      ','#######','       ','       '],
    M: ['#     #','##   ##','# # # #','#  #  #','#     #','#     #','#     #','       ','       '],
    N: ['#     #','##    #','# #   #','#  #  #','#   # #','#    ##','#     #','       ','       '],
    O: [' ##### ','#     #','#     #','#     #','#     #','#     #',' ##### ','       ','       '],
    P: ['###### ','#     #','#     #','###### ','#      ','#      ','#      ','       ','       '],
    Q: [' ##### ','#     #','#     #','#     #','#  #  #','#   # ',' ##  ##','       ','       '],
    R: ['###### ','#     #','#     #','###### ','#  #   ','#   #  ','#    # ','       ','       '],
    S: [' ##### ','#      ','#      ',' ##### ','      #','      #',' ##### ','       ','       '],
    T: ['#######','   #   ','   #   ','   #   ','   #   ','   #   ','   #   ','       ','       '],
    U: ['#     #','#     #','#     #','#     #','#     #','#     #',' ##### ','       ','       '],
    V: ['#     #','#     #','#     #','#     #',' #   # ',' #   # ','  # #  ','   #   ','       '],
    W: ['#     #','#     #','#     #','# # # #','# # # #',' ## ## ','  #  # ','       ','       '],
    X: ['#   #  ',' # # # ','  # #  ','   #   ','  # #  ',' # # # ','#   #  ','       ','       '],
    Y: ['#     #',' #   # ','  # #  ','   #   ','   #   ','   #   ','   #   ','       ','       '],
    Z: ['#######','     # ','    #  ','   #   ','  #    ',' #     ','#######','       ','       '],
    0: [' ##### ','##   ##','# ## #','#    #','#    #','# ## #','##   ##',' ##### ','       '],
    1: ['   #   ','  ##   ','   #   ','   #   ','   #   ','   #   ','  ###  ','       ','       '],
    2: [' ##### ','#     #','      #','     # ','    #  ','   #   ','#######','       ','       '],
    3: [' ######','      #','      #',' ####  ','      #','      #',' ######','       ','       '],
    4: ['#    # ','#    # ','#    # ','###### ','     # ','     # ','     # ','       ','       '],
    5: ['#######','#      ','###### ','      #','      #','      #','###### ','       ','       '],
    6: [' ##### ','#      ','#      ','###### ','#     #','#     #',' ##### ','       ','       '],
    7: ['#######','     # ','    #  ','   #   ','  #    ','  #    ','  #    ','       ','       '],
    8: [' ##### ','#     #','#     #',' ##### ','#     #','#     #',' ##### ','       ','       '],
    9: [' ##### ','#     #','#     #',' ######','      #','      #',' ##### ','       ','       '],
  }

  for (const [ch, lines] of Object.entries(patterns)) {
    glyphs[ch] = fromPattern(lines)
  }

  return { height: 9, charWidth: W, glyphs }
}

// Mini 字体（3×5 迷你）
function generateMiniFont() {
  const glyphs = {}
  const W = 3

  function fromPattern(lines) {
    return lines.map(line => line.padEnd(W, ' ').split('').map(ch => ch === '#' ? 1 : 0))
  }

  const patterns = {
    A: [' # ','# #','###','# #','# #'],
    B: ['## ','# #','## ','# #','## '],
    C: ['## ','#  ','#  ','#  ','## '],
    D: ['## ','# #','# #','# #','## '],
    E: ['###','#  ','## ','#  ','###'],
    F: ['###','#  ','## ','#  ','#  '],
    G: ['## ','#  ','# #','# #','## '],
    H: ['# #','# #','###','# #','# #'],
    I: ['###',' # ',' # ',' # ','###'],
    J: ['###','  #','  #','# #',' ##'],
    K: ['# #','# #','## ','# #','# #'],
    L: ['#  ','#  ','#  ','#  ','###'],
    M: ['# #','###','# #','# #','# #'],
    N: ['# #','## #','# #','# #','# #'],
    O: ['## ','# #','# #','# #','## '],
    P: ['## ','# #','## ','#  ','#  '],
    Q: ['## ','# #','# #','# #','###'],
    R: ['## ','# #','## ','# #','# #'],
    S: ['## ','#  ',' # ','  #','## '],
    T: ['###',' # ',' # ',' # ',' # '],
    U: ['# #','# #','# #','# #','## '],
    V: ['# #','# #','# #',' # ',' # '],
    W: ['# #','# #','# #','###','# #'],
    X: ['# #','# #',' # ','# #','# #'],
    Y: ['# #','# #',' # ',' # ',' # '],
    Z: ['###','  #',' # ','#  ','###'],
    0: ['## ','# #','# #','# #','## '],
    1: [' # ','## ',' # ',' # ','###'],
    2: ['## ','# #',' # ','#  ','###'],
    3: ['###','  #','## ','  #','###'],
    4: ['# #','# #','###','  #','  #'],
    5: ['###','#  ','###','  #','## '],
    6: ['## ','#  ','###','# #','## '],
    7: ['###','  #',' # ',' # ',' # '],
    8: ['## ','# #','## ','# #','## '],
    9: ['## ','# #','###','  #','## '],
  }

  for (const [ch, lines] of Object.entries(patterns)) {
    glyphs[ch] = fromPattern(lines)
  }

  return { height: 5, charWidth: W, glyphs }
}

// Block 字体（实心粗体 6×7）
function generateBlockFont() {
  const glyphs = {}
  const W = 6

  function fromPattern(lines) {
    return lines.map(line => line.padEnd(W, ' ').split('').map(ch => ch === '#' ? 1 : 0))
  }

  const patterns = {
    A: [' ### ','#   #','#   #','#####','#   #','#   #','#   #'],
    B: ['#### ','#   #','#### ','#   #','#   #','#### ','    '],
    C: [' ####','#    ','#    ','#    ','#    ',' ####','    '],
    D: ['#### ','#   #','#   #','#   #','#   #','#### ','    '],
    E: ['#####','#    ','#### ','#    ','#    ','#####','    '],
    F: ['#####','#    ','#### ','#    ','#    ','#    ','    '],
    G: [' ####','#    ','#  ##','#   #','#   #',' ####','    '],
    H: ['#   #','#   #','#####','#   #','#   #','#   #','    '],
    I: [' ### ','  #  ','  #  ','  #  ','  #  ',' ### ','    '],
    J: ['  ###','   # ','   # ','   # ','#  # ',' ##  ','    '],
    K: ['#  # ','# #  ','##   ','# #  ','# #  ','#  # ','    '],
    L: ['#    ','#    ','#    ','#    ','#    ','#####','    '],
    M: ['#   #','## ##','# # #','#   #','#   #','#   #','    '],
    N: ['#   #','##  #','# # #','#  ##','#   #','#   #','    '],
    O: [' ### ','#   #','#   #','#   #','#   #',' ### ','    '],
    P: ['#### ','#   #','#### ','#    ','#    ','#    ','    '],
    Q: [' ### ','#   #','#   #','# # #','#  # ',' ## #','    '],
    R: ['#### ','#   #','#### ','# #  ','#  # ','#   #','    '],
    S: [' ####','#    ',' ### ','    ','    ','#### ','    '],
    T: ['#####','  #  ','  #  ','  #  ','  #  ','  #  ','    '],
    U: ['#   #','#   #','#   #','#   #','#   #',' ### ','    '],
    V: ['#   #','#   #','#   #',' # # ',' # # ','  #  ','    '],
    W: ['#   #','#   #','# # #','# # #',' ## #',' #  #','    '],
    X: ['#   #',' # # ','  #  ','  #  ',' # # ','#   #','    '],
    Y: ['#   #',' # # ','  #  ','  #  ','  #  ','  #  ','    '],
    Z: ['#####','   # ','  #  ',' #   ','#    ','#####','    '],
    0: [' ### ','#  ##','# # #','## # ','#   #',' ### ','    '],
    1: ['  #  ',' ##  ','  #  ','  #  ','  #  ',' ### ','    '],
    2: [' ### ','#   #','  ## ',' #   ','#    ','#####','    '],
    3: ['#### ','    #',' ### ','    #','    #','#### ','    '],
    4: ['#  # ','#  # ','#####','   # ','   # ','   # ','    '],
    5: ['#####','#    ','#### ','    #','    #','#### ','    '],
    6: [' ### ','#    ','#### ','#   #','#   #',' ### ','    '],
    7: ['#####','   # ','  #  ',' #   ',' #   ',' #   ','    '],
    8: [' ### ','#   #',' ### ','#   #','#   #',' ### ','    '],
    9: [' ### ','#   #',' ####','    #','    #',' ### ','    '],
  }

  for (const [ch, lines] of Object.entries(patterns)) {
    glyphs[ch] = fromPattern(lines)
  }

  return { height: 7, charWidth: W, glyphs }
}

// Slant 字体（倾斜风格 5×7，右斜）
function generateSlantFont() {
  const glyphs = {}

  function fromPattern(lines) {
    return lines.map(line => line.split('').map(ch => ch === '#' ? 1 : 0))
  }

  const patterns = {
    A: ['  #  ',' # # ','#   #','#####','#   #','#   #','#   #'],
    B: ['#### ','#   #','#### ','#   #','#   #','#### ','    '],
    C: [' ### ','#   #','#    ','#    ','#    ','#    ','    '],
    D: ['#### ','#   #','#   #','#   #','#   #','#### ','    '],
    E: ['#####','   # ','  ## ',' #   ','#    ','#####','    '],
    F: ['#####','   # ','  ## ',' #   ','#    ','#    ','    '],
    G: [' ### ','#   #','#    ','# ## ','#  # ',' ##  ','    '],
    H: ['#   #','#   #','#####','#   #','#   #','#   #','    '],
    I: [' ### ','  #  ','  #  ','  #  ','  #  ',' ### ','    '],
    J: ['   ##','   # ','   # ','   # ',' # # ','  #  ','    '],
    K: ['#  # ','# #  ','##   ','#    ','#    ','#    ','    '],
    L: ['#    ','#    ','#    ','#    ','#    ','#####','    '],
    M: ['##  # ','# # # ','#  #  ','#   # ','#   # ','#   #','    '],
    N: ['#   # ','##  # ','# # # ','#  ## ','#   # ','#   #','    '],
    O: [' ### ','#   #','#   #','#   #','#   #',' ### ','    '],
    P: ['#### ','#   #','#### ','#    ','#    ','#    ','    '],
    Q: [' ### ','#   #','#   #','# # #','#  # ',' # # ','    '],
    R: ['#### ','#   #','#### ','#  # ','#   # ','#   #','    '],
    S: [' ### ','#    ',' ### ','   # ','   # ','###  ','    '],
    T: ['#####','  #  ','  #  ','  #  ','  #  ','  #  ','    '],
    U: ['#   #','#   #','#   #','#   #',' ### ','    ','    '],
    V: ['#   #','#   #',' # # ',' # # ','  #  ','    ','    '],
    W: ['#   #','#   #','# # #','# # #',' # # ','    ','    '],
    X: ['#   #',' # # ','  #  ',' # # ','#   #','    ','    '],
    Y: ['#   #',' # # ','  #  ','  #  ','  #  ','    ','    '],
    Z: ['#####','    #','   # ','  #  ',' #   ','#    ','    '],
    0: [' ### ','#  ##','# # #','## # ','#  ##',' ### ','    '],
    1: ['  #  ',' ##  ','  #  ','  #  ','  #  ',' ### ','    '],
    2: [' ### ','#   #','  ## ',' #   ','#    ','#####','    '],
    3: ['#### ','    #',' ### ','    #','    #','#### ','    '],
    4: ['#   #','#   #','#####','    #','    #','    # ','    '],
    5: ['#####','#    ','#### ','    #','    #','#### ','    '],
    6: [' ### ','#    ','#### ','#   #','#   #',' ### ','    '],
    7: ['#####','    #','   # ','  #  ',' #   ','    ','    '],
    8: [' ### ','#   #',' ### ','#   #','#   #',' ### ','    '],
    9: [' ### ','#   #',' ####','    #','    #',' ### ','    '],
  }

  for (const [ch, lines] of Object.entries(patterns)) {
    glyphs[ch] = fromPattern(lines)
  }

  return { height: 7, charWidth: 5, glyphs }
}

// Big 字体（大号 10×12）
function generateBigFont() {
  const glyphs = {}
  const W = 10

  function fromPattern(lines) {
    return lines.map(line => line.padEnd(W, ' ').split('').map(ch => ch === '#' ? 1 : 0))
  }

  const patterns = {
    A: ['    ##    ','   ####   ','  ##  ##  ',' ##    ## ','##      ##','##########','##      ##','##      ##','##      ##','##      ##','          ','          '],
    B: ['########  ','##    ##  ','##    ##  ','##    ##  ','########  ','##    ##  ','##    ##  ','##    ##  ','##    ##  ','########  ','          ','          '],
    C: ['   #####  ','  ##   ## ',' ##     ## ','##        ','##        ','##        ','##        ',' ##     ## ','  ##   ## ','   #####  ','          ','          '],
    D: ['########  ','##    ##  ','##    ##  ','##    ##  ','##    ##  ','##    ##  ','##    ##  ','##    ##  ','##    ##  ','########  ','          ','          '],
    E: ['##########','##        ','##        ','##        ','######    ','##        ','##        ','##        ','##        ','##########','          ','          '],
    F: ['##########','##        ','##        ','##        ','######    ','##        ','##        ','##        ','##        ','##        ','          ','          '],
    G: ['   ###### ','  ##    ## ',' ##       ','##        ','##       ','##  ##### ','##    ## ',' ##    ## ','  ##   ## ','   ##### ','          ','          '],
    H: ['##      ##','##      ##','##      ##','##      ##','##########','##      ##','##      ##','##      ##','##      ##','##      ##','          ','          '],
    I: ['   ####   ','   ####   ','    ##    ','    ##    ','    ##    ','    ##    ','    ##    ','    ##    ','    ##    ','   ####   ','          ','          '],
    J: ['     #### ','     #### ','      ##  ','      ##  ','      ##  ','      ##  ','##    ##  ','##    ##  ',' ##  ##   ','  ## ##   ','   ##     ','          '],
    K: ['##    ##  ','##   ##   ','##  ##    ','## ##     ','###       ','###       ','## ##     ','##  ##    ','##   ##   ','##    ##  ','          ','          '],
    L: ['##        ','##        ','##        ','##        ','##        ','##        ','##        ','##        ','##        ','##########','          ','          '],
    M: ['##      ##','###    ###','####  ####','## ## ## ##','##  ##  ##','##      ##','##      ##','##      ##','##      ##','##      ##','          ','          '],
    N: ['##      ##','###     ##','####    ##','## ##   ##','##  ##  ##','##   ## ##','##    ####','##     ###','##      ##','##      ##','          ','          '],
    O: ['   #####  ','  ##   ## ',' ##     ## ','##       ##','##       ##','##       ##','##       ##','##       ##',' ##     ## ','  ##   ## ','   #####  ','          '],
    P: ['########  ','##    ##  ','##    ##  ','##    ##  ','########  ','##        ','##        ','##        ','##        ','##        ','          ','          '],
    Q: ['   #####  ','  ##   ## ',' ##     ## ','##       ##','##       ##','##     ## ','##  ## ## ',' ##   ##  ','  ##   ## ','   ###### ','          ','          '],
    R: ['########  ','##    ##  ','##    ##  ','##    ##  ','########  ','##   #    ','##    #   ','##     ## ','##      ##','##      ##','          ','          '],
    S: ['  ######  ',' ##     ## ','##        ','##        ',' ####     ','     ##   ','      ##  ','##    ##  ',' ##    ## ','  ###### ','          ','          '],
    T: ['##########','    ##    ','    ##    ','    ##    ','    ##    ','    ##    ','    ##    ','    ##    ','    ##    ','    ##    ','          ','          '],
    U: ['##      ##','##      ##','##      ##','##      ##','##      ##','##      ##','##      ##','##      ##',' ##    ## ','  ##  ##  ','   ####    ','          '],
    V: ['##      ##','##      ##','##      ##','##      ##','##      ##',' ##    ## ',' ##    ## ','  ##  ##  ','  ##  ##  ','   ####    ','          ','          '],
    W: ['##      ##','##      ##','##      ##','##      ##','## ## ## ##','## ## ## ##','## ## ## ##',' ##    ## ',' ##    ## ','  #  #   ','          ','          '],
    X: ['##    ##  ',' ##  ##   ','  ####    ','   ##     ','   ##     ','  ####    ',' ##  ##   ','##    ##  ','##    ##  ','          ','          ','          '],
    Y: ['##      ##',' ##    ## ','  ##  ##  ','   ####   ','    ##    ','    ##    ','    ##    ','    ##    ','    ##    ','          ','          ','          '],
    Z: ['##########','      ##  ','     ##   ','    ##    ','   ##     ','  ##      ',' ##       ','##        ','##        ','##########','          ','          '],
    0: ['   #####  ','  ##   ## ',' ##  # ## ','##    ### ','##   # ## ','###  #  ## ','###  #  ## ','## #  # ## ',' ## ##  ## ','  ##  ##  ','   #####  ','          '],
    1: ['    ##    ','   ###    ','  ## #    ','     #    ','    #     ','    #     ','    #     ','    #     ','    #     ','  #####   ','          ','          '],
    2: ['  ######  ',' ##    ## ','##      ##','       ## ','      ##  ','    ##    ','   ##     ','  ##      ',' ##       ','##########','          ','          '],
    3: ['######## ','       ## ','       ## ','      ## ','  #####   ','       ## ','       ## ','       ## ','       ## ','######## ','          ','          '],
    4: ['##    ## ','##    ## ','##    ## ','##    ## ','######## ','      ## ','      ## ','      ## ','      ## ','      ## ','          ','          '],
    5: ['##########','##        ','##        ','######## ','        ## ','        ## ','        ## ','        ## ','######## ','          ','          '],
    6: ['   ####   ','  ##   ## ',' ##       ','##        ','######   ','##     ## ','##     ## ','##     ## ',' ##   ##  ','  #####   ','          ','          '],
    7: ['##########','       ## ','      ## ','     ##  ','    ##   ','   ##    ','  ##     ','  ##     ','  ##     ','  ##     ','          ','          '],
    8: ['  #####   ',' ##    ## ','##      ##',' ##    ## ','  ##  ##  ',' ##    ## ','##      ##',' ##    ## ','  ##   ## ','   #####  ','          ','          '],
    9: ['  #####   ',' ##    ## ','##      ##',' ##    ## ','  ######  ','       ## ','       ## ','       ## ',' ##   ##  ','  #####   ','          ','          '],
  }

  for (const [ch, lines] of Object.entries(patterns)) {
    glyphs[ch] = fromPattern(lines)
  }

  return { height: 12, charWidth: W, glyphs }
}

// 复制结果
function copyArt() {
  navigator.clipboard.writeText(artOutput.value).then(() => {
    copyArtText.value = '已复制 ✓'
    setTimeout(() => { copyArtText.value = '📋 复制' }, 1500)
  })
}

// 下载为 TXT
function downloadArt() {
  const blob = new Blob([artOutput.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ascii-art-${inputText.value || 'output'}.txt`
  a.click()
  URL.revokeObjectURL(url)
  downloadArtText.value = '已下载 ✓'
  setTimeout(() => { downloadArtText.value = '⬇️ 下载 TXT' }, 1500)
}

// 初始生成
onMounted(() => {
  generateArt()
})
</script>

<style scoped>
.tool-page {
  max-width: 900px;
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
  line-height: 1.6;
}

/* 控件 */
.controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}
.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.control-group label {
  font-size: 0.88rem;
  font-weight: 500;
  color: #555;
}
.control-group label b {
  color: #16a34a;
  font-family: 'Courier New', monospace;
}
.control-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
.control-row .control-group {
  flex: 1;
  min-width: 200px;
}

/* 文本输入 */
.text-input {
  padding: 0.7rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  font-family: 'Courier New', monospace;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transition: border-color 0.2s;
  width: 100%;
}
.text-input:focus {
  outline: none;
  border-color: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

/* 字体列表 */
.font-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.font-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.6rem 0.8rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 70px;
}
.font-btn:hover {
  border-color: #22c55e;
  background: #f0fdf4;
}
.font-btn.active {
  border-color: #22c55e;
  background: #f0fdf4;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);
}
.font-preview {
  font-size: 0.72rem;
  font-family: 'Courier New', monospace;
  color: #22c55e;
  margin-bottom: 0.2rem;
  font-weight: 600;
}
.font-name {
  font-size: 0.78rem;
  color: #555;
}

/* 字符集 */
.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.chip {
  padding: 0.35rem 0.8rem;
  border: 2px solid #e5e7eb;
  border-radius: 20px;
  background: #fff;
  cursor: pointer;
  font-size: 0.82rem;
  transition: all 0.2s;
}
.chip:hover {
  border-color: #22c55e;
}
.chip.active {
  border-color: #22c55e;
  background: #22c55e;
  color: #fff;
}

/* 滑块 */
.range-input {
  width: 100%;
  accent-color: #22c55e;
  cursor: pointer;
}

/* 生成按钮 */
.btn-primary {
  padding: 0.7rem 1.6rem;
  background: #22c55e;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
  transition: background 0.2s;
}
.btn-primary:hover {
  background: #16a34a;
}

/* 结果区 */
.result-section {
  margin-bottom: 1rem;
}
.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.result-header span {
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
}
.result-actions {
  display: flex;
  gap: 0.5rem;
}
.btn-copy {
  padding: 0.4rem 0.8rem;
  background: #22c55e;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: opacity 0.2s;
}
.btn-copy:hover { opacity: 0.85; }
.btn-download {
  background: #3b82f6;
}
.result-box {
  background: #1e293b;
  border-radius: 10px;
  overflow: hidden;
  max-height: 500px;
  overflow-y: auto;
}
.art-output {
  margin: 0;
  padding: 1rem;
  color: #22c55e;
  font-family: 'Courier New', monospace;
  font-size: 0.78rem;
  line-height: 1.25;
  letter-spacing: 0.05em;
  white-space: pre;
  overflow-x: auto;
}
.result-stats {
  font-size: 0.78rem;
  color: #999;
  margin-top: 0.5rem;
}

/* 空提示 */
.empty-hint {
  text-align: center;
  padding: 2rem;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  color: #888;
  font-size: 0.9rem;
  line-height: 1.8;
}

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #22c55e;
  font-weight: 500;
}
.back-link:hover { text-decoration: underline; }

@media (max-width: 640px) {
  .tool-page {
    padding: 0.75rem;
  }
  .font-list {
    gap: 0.3rem;
  }
  .font-btn {
    min-width: 55px;
    padding: 0.4rem 0.5rem;
  }
  .art-output {
    font-size: 0.6rem;
  }
}
</style>
