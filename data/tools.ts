export interface Tool {
  id: string
  name: string
  category: ToolCategory
  desc: string
  icon: string
  to?: string
  coming?: boolean
  hot?: boolean
}

export type ToolCategory = '内容创作' | '文本处理' | '图片处理' | '开发者' | '计算转换' | '学习效率'

export const categories: { key: ToolCategory; icon: string }[] = [
  { key: '内容创作', icon: '✍️' },
  { key: '文本处理', icon: '📝' },
  { key: '图片处理', icon: '🖼️' },
  { key: '开发者', icon: '⌨️' },
  { key: '计算转换', icon: '🔢' },
  { key: '学习效率', icon: '📚' },
]

export const tools: Tool[] = [
  // —— 已上线 ——
  {
    id: 'quote-card',
    name: '语录卡片',
    category: '内容创作',
    desc: '输入一句语录，一键生成小红书风格分享图',
    icon: '🕯️',
    to: '/tools/quote-card',
    hot: true,
  },

  // —— 规划中（占位，展示工具箱全貌）——
  { id: 'md-preview', name: 'Markdown 预览', category: '文本处理', desc: '实时渲染 Markdown，支持导出 HTML', icon: '📄', coming: true },
  { id: 'word-count', name: '字数统计', category: '文本处理', desc: '中英文精确计数，含阅读时长估算', icon: '🔡', coming: true },
  { id: 'text-diff', name: '文本对比', category: '文本处理', desc: '逐字逐行对比两段文本的差异', icon: '🔀', coming: true },
  { id: 'img-compress', name: '图片压缩', category: '图片处理', desc: '本地压缩，画质几乎无损，不上传服务器', icon: '🗜️', coming: true },
  { id: 'img-crop', name: '图片裁剪', category: '图片处理', desc: '按比例裁剪，适配各平台封面尺寸', icon: '✂️', coming: true },
  { id: 'watermark', name: '加水印', category: '图片处理', desc: '批量给图片添加文字或图片水印', icon: '💧', coming: true },
  { id: 'json-format', name: 'JSON 格式化', category: '开发者', desc: '格式化、压缩、校验 JSON 数据', icon: '🧾', coming: true },
  { id: 'base64', name: 'Base64 编解码', category: '开发者', desc: '文本与文件的双向 Base64 转换', icon: '🔐', coming: true },
  { id: 'regex', name: '正则测试', category: '开发者', desc: '实时匹配高亮，附带常用正则速查', icon: '🧪', coming: true },
  { id: 'qrcode', name: '二维码生成', category: '开发者', desc: '自定义颜色与 Logo 的二维码生成器', icon: '🔳', coming: true },
  { id: 'unit', name: '单位换算', category: '计算转换', desc: '长度、重量、温度、面积一键换算', icon: '📏', coming: true },
  { id: 'timestamp', name: '时间戳转换', category: '计算转换', desc: 'Unix 时间戳与日期格式互转', icon: '⏱️', coming: true },
  { id: 'bmi', name: 'BMI 计算', category: '计算转换', desc: '身高体重指数与健康区间评估', icon: '⚖️', coming: true },
  { id: 'pomodoro', name: '番茄钟', category: '学习效率', desc: '专注计时 + 休息提醒，可自定义时长', icon: '🍅', coming: true },
  { id: 'flashcard', name: '记忆卡片', category: '学习效率', desc: '间隔重复复习，数据本地保存', icon: '🃏', coming: true },
]

export function useTools() {
  const grouped = computed(() =>
    categories.map((c) => ({
      ...c,
      items: tools.filter((t) => t.category === c.key),
    })),
  )
  return { tools, categories, grouped }
}
