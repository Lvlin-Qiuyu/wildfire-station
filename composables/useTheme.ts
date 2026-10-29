export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'wildfire-theme'

export function useTheme() {
  // 默认亮色
  const theme = useState<Theme>('site-theme', () => 'light')

  function apply(t: Theme) {
    theme.value = t
    if (import.meta.client) {
      document.documentElement.setAttribute('data-theme', t)
      try {
        localStorage.setItem(STORAGE_KEY, t)
      } catch {}
    }
  }

  function toggle() {
    apply(theme.value === 'light' ? 'dark' : 'light')
  }

  function init() {
    if (!import.meta.client) return
    let saved: string | null = null
    try {
      saved = localStorage.getItem(STORAGE_KEY)
    } catch {}
    apply(saved === 'dark' ? 'dark' : 'light')
  }

  return { theme, toggle, init, apply }
}

/**
 * 首屏防闪烁脚本：在 <head> 里同步执行，
 * 读取用户上次选择并立刻设置 data-theme（默认亮色）。
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');document.documentElement.setAttribute('data-theme',t==='dark'?'dark':'light');}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`
