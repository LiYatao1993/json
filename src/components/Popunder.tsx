import { useEffect } from 'react'

const POPUNDER_URL =
  'https://idealistic-revenue.com/b.3aVD0rPC3Np/vsb/mQVcJUZIDm0R3BM/TQAEy/Mlj-El3vLMTYcgxtMjD/IdyvM/jmES'

// 同一浏览器两次弹出之间的最小间隔，避免过度打扰
const COOLDOWN_MS = 1 * 60 * 60 * 1000
const STORAGE_KEY = 'pu-last-shown'

/**
 * Popunder 广告：用户首次点击页面（满足浏览器手势要求）时，
 * 在新标签打开直链，并尝试将其置于后台（popunder 效果）。
 * 通过 localStorage 做冷却，限制弹出频率。
 */
export default function Popunder() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // 忽略按钮/链接/输入等交互元素，避免抢占焦点导致复制等操作失效
      const target = e.target as HTMLElement | null
      if (
        target?.closest(
          'button, a, input, textarea, select, label, [role="button"]',
        )
      ) {
        return
      }

      const last = Number(localStorage.getItem(STORAGE_KEY) || '0')
      if (Date.now() - last < COOLDOWN_MS) return
      localStorage.setItem(STORAGE_KEY, String(Date.now()))

      const adWindow = window.open(POPUNDER_URL, '_blank')
      // 尝试把广告窗口切到后台，保持当前页面在前（部分浏览器会限制）
      if (adWindow) {
        try {
          adWindow.blur()
          window.focus()
        } catch {
          // 忽略浏览器的聚焦限制
        }
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return null
}
