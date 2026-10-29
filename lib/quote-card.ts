// 小红书语录卡片：Canvas 绘制 → 导出 PNG
// 逻辑全部在浏览器本地完成，不上传任何内容

export type ThemeKey =
  | 'ink'
  | 'kraft'
  | 'night'
  | 'sakura'
  | 'forest'
  | 'ocean'
  | 'ember'
  | 'gold'
  | 'bamboo'
  | 'dusk'
  | 'retro'
  | 'pure'

export interface Theme {
  key: ThemeKey
  name: string
  /** 背景：从上到下的渐变 */
  bg: [string, string]
  /** 主文字颜色 */
  text: string
  /** 次要文字颜色 */
  muted: string
  /** 装饰线色 */
  line: string
  /** 引号装饰色 */
  quote: string
  /** 卡片纸面（内层）颜色，null 表示无内层卡片 */
  paper: string | null
}

export const themes: Theme[] = [
  {
    key: 'ink',
    name: '素纸',
    bg: ['#f7f3ea', '#ece4d4'],
    text: '#2b2724',
    muted: '#8a8071',
    line: '#d8cfbe',
    quote: '#d9b48a',
    paper: '#fffdf8',
  },
  {
    key: 'kraft',
    name: '牛皮',
    bg: ['#d9c3a1', '#c3a67c'],
    text: '#3f3221',
    muted: '#7b6749',
    line: '#b09368',
    quote: '#9a7b4f',
    paper: null,
  },
  {
    key: 'night',
    name: '深夜',
    bg: ['#1f1f24', '#0d0d10'],
    text: '#f2eee7',
    muted: '#8e8a84',
    line: '#34343b',
    quote: '#ff8a4d',
    paper: null,
  },
  {
    key: 'sakura',
    name: '樱粉',
    bg: ['#fdeef1', '#f6d9e1'],
    text: '#4a2e34',
    muted: '#a8828c',
    line: '#eecdd6',
    quote: '#e7a3b3',
    paper: '#fffafb',
  },
  {
    key: 'forest',
    name: '苔绿',
    bg: ['#e8eee4', '#d2ddc8'],
    text: '#2c3a2c',
    muted: '#7a8a74',
    line: '#c3d1b8',
    quote: '#8aa87a',
    paper: '#fbfdf9',
  },
  {
    key: 'ocean',
    name: '海蓝',
    bg: ['#e6eff4', '#cfe0ea'],
    text: '#21333d',
    muted: '#76899a',
    line: '#c2d6e3',
    quote: '#7fa6bf',
    paper: '#fbfdff',
  },
  {
    key: 'ember',
    name: '暖火',
    bg: ['#2a1710', '#150a06'],
    text: '#ffe9d6',
    muted: '#c49a7d',
    line: '#5a3423',
    quote: '#ff7a1a',
    paper: null,
  },
  {
    key: 'gold',
    name: '墨金',
    bg: ['#131313', '#080808'],
    text: '#f5efdf',
    muted: '#9c8f6e',
    line: '#4a4230',
    quote: '#c9a24b',
    paper: null,
  },
  {
    key: 'bamboo',
    name: '青竹',
    bg: ['#eef3ec', '#dde8dc'],
    text: '#2f3d2f',
    muted: '#7f8f7c',
    line: '#cdd9c9',
    quote: '#86a37f',
    paper: '#fcfdfa',
  },
  {
    key: 'dusk',
    name: '暮紫',
    bg: ['#efe8f5', '#ded2ec'],
    text: '#3b2c4a',
    muted: '#8b7c9e',
    line: '#d6c8e6',
    quote: '#a98cc7',
    paper: '#fcfaff',
  },
  {
    key: 'retro',
    name: '复古',
    bg: ['#f0e0c4', '#e2cba3'],
    text: '#3b2f20',
    muted: '#8a7450',
    line: '#cdb287',
    quote: '#b8672f',
    paper: '#f7ecd8',
  },
  {
    key: 'pure',
    name: '极简',
    bg: ['#ffffff', '#f4f4f4'],
    text: '#111111',
    muted: '#9a9a9a',
    line: '#e2e2e2',
    quote: '#d0d0d0',
    paper: null,
  },
]

export type RatioKey = 'auto' | '3:4' | '1:1' | '4:3'

export interface RenderOptions {
  quote: string
  source?: string
  author?: string
  theme: Theme
  /** 输出宽度（px） */
  width?: number
  /** 正文字号比例（相对宽度） */
  fontSizeScale?: number
  /** 是否显示底部署名 */
  showBrand?: boolean
  /** 画布比例，auto 为按内容自适应（最小 3:4） */
  ratio?: RatioKey
}

const PAD_RATIO = 0.1 // 左右留白占宽度比例

const SERIF = '"Songti SC", "STSong", "Noto Serif SC", "Noto Serif CJK SC", "Source Han Serif SC", serif'
const SANS = '"PingFang SC", "Helvetica Neue", "Noto Sans CJK SC", Arial, sans-serif'

/** 按宽度断行：中文逐字断，英文逐词断；支持手动换行 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  const paragraphs = text.split(/\r?\n/)

  for (const para of paragraphs) {
    const p = para.trim()
    if (!p) {
      lines.push('')
      continue
    }
    const tokens = p.match(/[A-Za-z0-9'’\-_.@%&+/:]+\s*|\s+|./gu) || []
    let line = ''
    for (const tk of tokens) {
      const test = line + tk
      if (ctx.measureText(test).width > maxWidth && line.trim()) {
        lines.push(line.trimEnd())
        line = tk.trimStart()
      } else {
        line = test
      }
    }
    if (line.trim()) lines.push(line.trimEnd())
  }
  return lines
}

/** 计算卡片尺寸并返回绘制参数（不改动画布） */
function layout(opts: RenderOptions) {
  const width = opts.width || 1242
  const pad = Math.round(width * PAD_RATIO)
  const contentW = width - pad * 2
  const baseSize = Math.round(width * 0.052 * (opts.fontSizeScale || 1))
  const lineHeight = Math.round(baseSize * 1.72)

  const quoteText = opts.quote.trim() || '在这里写下你想分享的句子。'
  const author = (opts.author || '').trim()
  const source = (opts.source || '').trim()
  const hasMeta = !!(author || source)

  const measure = document.createElement('canvas').getContext('2d')!
  measure.font = `500 ${baseSize}px ${SERIF}`
  const lines = wrapText(measure, quoteText, contentW)

  const topPad = Math.round(width * 0.15) // 顶部留白（含英文装饰）
  const quoteMarkH = Math.round(baseSize * 1.05)
  const gapAfterMark = Math.round(baseSize * 0.55)
  const metaTopGap = Math.round(baseSize * 1.5)
  const metaBlockH = hasMeta ? Math.round(baseSize * 0.4) + Math.round(baseSize * 0.95) : 0
  const bottomPad = opts.showBrand === false ? Math.round(width * 0.11) : Math.round(width * 0.14)

  const contentH =
    topPad + quoteMarkH + gapAfterMark + lines.length * lineHeight + metaTopGap + metaBlockH + bottomPad

  const ratio = opts.ratio || 'auto'
  let height: number
  if (ratio === '1:1') height = width
  else if (ratio === '3:4') height = Math.round((width * 4) / 3)
  else if (ratio === '4:3') height = Math.round((width * 3) / 4)
  else height = Math.max(contentH, Math.round((width * 4) / 3))

  return {
    width,
    height,
    pad,
    contentW,
    baseSize,
    lineHeight,
    lines,
    author,
    source,
    hasMeta,
    topPad,
    quoteMarkH,
    gapAfterMark,
    metaTopGap,
    metaBlockH,
    contentH,
    bottomPad,
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function renderQuoteCard(canvas: HTMLCanvasElement, opts: RenderOptions): void {
  const L = layout(opts)
  const theme = opts.theme
  const { width, height, pad, contentW, baseSize, lineHeight, lines } = L

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  canvas.style.width = '100%'
  canvas.style.height = 'auto'

  const ctx = canvas.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'

  // 1. 背景渐变
  const grad = ctx.createLinearGradient(0, 0, width * 0.35, height)
  grad.addColorStop(0, theme.bg[0])
  grad.addColorStop(1, theme.bg[1])
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, width, height)

  // 2. 内层纸面 / 细边框
  if (theme.paper) {
    const inset = Math.round(width * 0.045)
    const r = Math.round(width * 0.03)
    ctx.save()
    ctx.shadowColor = 'rgba(120, 100, 70, 0.18)'
    ctx.shadowBlur = Math.round(width * 0.028)
    ctx.shadowOffsetY = Math.round(width * 0.005)
    ctx.fillStyle = theme.paper
    roundRect(ctx, inset, inset, width - inset * 2, height - inset * 2, r)
    ctx.fill()
    ctx.restore()
  } else {
    const inset = Math.round(width * 0.04)
    ctx.strokeStyle = theme.line
    ctx.globalAlpha = 0.7
    ctx.lineWidth = Math.max(1, Math.round(width * 0.0015))
    ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2)
    ctx.globalAlpha = 1
  }

  // 3. 顶部英文小字
  const smallSize = Math.round(baseSize * 0.3)
  ctx.fillStyle = theme.muted
  ctx.globalAlpha = 0.85
  ctx.font = `400 ${smallSize}px ${SANS}`
  ctx.textAlign = 'center'
  ctx.letterSpacing = `${Math.round(width * 0.012)}px`
  ctx.fillText('Q U O T E', width / 2, Math.round(width * 0.075))
  ctx.letterSpacing = '0px'
  ctx.globalAlpha = 1

  // 4. 引号装饰（左上）
  let y = L.topPad
  ctx.textAlign = 'left'
  ctx.fillStyle = theme.quote
  ctx.font = `700 ${Math.round(L.quoteMarkH * 1.9)}px Georgia, "Times New Roman", serif`
  ctx.globalAlpha = 0.9
  ctx.fillText('“', pad - Math.round(width * 0.012), y + L.quoteMarkH)
  ctx.globalAlpha = 1

  // 5. 正文（在画布有效区域内垂直居中）
  const contentFromTop = L.topPad + L.quoteMarkH + L.gapAfterMark
  const contentBlockH = lines.length * lineHeight + L.metaTopGap + L.metaBlockH
  const spare = height - L.bottomPad - contentFromTop - contentBlockH
  const vOffset = spare > 0 ? Math.round(spare / 2.6) : 0

  y = contentFromTop + vOffset
  ctx.fillStyle = theme.text
  ctx.font = `500 ${baseSize}px ${SERIF}`
  for (const line of lines) {
    ctx.fillText(line, pad, y + baseSize)
    y += lineHeight
  }

  // 6. 署名：短横线 + 作者 ·《来源》
  if (L.hasMeta) {
    const lineY = y + Math.round(L.metaTopGap * 0.62)
    ctx.strokeStyle = theme.line
    ctx.lineWidth = Math.max(1, Math.round(width * 0.002))
    ctx.beginPath()
    ctx.moveTo(pad, lineY)
    ctx.lineTo(pad + Math.round(width * 0.07), lineY)
    ctx.stroke()

    const metaSize = Math.round(baseSize * 0.52)
    ctx.fillStyle = theme.muted
    ctx.font = `400 ${metaSize}px ${SERIF}`
    let meta = ''
    if (L.author && L.source) meta = `${L.author} ·《${L.source}》`
    else if (L.author) meta = L.author
    else meta = `《${L.source}》`
    ctx.fillText(meta, pad, lineY + Math.round(baseSize * 0.95))
  }

  // 7. 底部品牌署名
  if (opts.showBrand !== false) {
    ctx.textAlign = 'center'
    ctx.fillStyle = theme.muted
    ctx.globalAlpha = 0.55
    ctx.font = `400 ${Math.round(baseSize * 0.3)}px ${SANS}`
    ctx.letterSpacing = `${Math.round(width * 0.004)}px`
    ctx.fillText('野火小站 · WILDFIRE STATION', width / 2, height - Math.round(width * 0.06))
    ctx.letterSpacing = '0px'
    ctx.globalAlpha = 1
  }
}
