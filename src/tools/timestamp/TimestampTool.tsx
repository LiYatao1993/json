import { useEffect, useMemo, useState } from 'react'
import { CopyIcon } from '../../components/icons'
import { useToast } from '../../components/Toast'
import { copyText } from '../../utils/clipboard'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function formatLocal(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export default function TimestampTool() {
  const [now, setNow] = useState(() => Date.now())
  const [tsInput, setTsInput] = useState('')
  const [dateInput, setDateInput] = useState('')
  const toast = useToast()

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const copy = async (text: string) => {
    if (!text) return
    const ok = await copyText(text)
    toast[ok ? 'success' : 'error'](ok ? '复制成功' : '复制失败')
  }

  // 时间戳 -> 日期（自动判断秒/毫秒）
  const tsResult = useMemo(() => {
    const raw = tsInput.trim()
    if (!raw || !/^\d+$/.test(raw)) return null
    const num = Number(raw)
    const ms = raw.length <= 10 ? num * 1000 : num
    const d = new Date(ms)
    if (Number.isNaN(d.getTime())) return null
    return {
      local: formatLocal(d),
      utc: d.toUTCString(),
      iso: d.toISOString(),
    }
  }, [tsInput])

  // 日期 -> 时间戳
  const dateResult = useMemo(() => {
    if (!dateInput) return null
    const d = new Date(dateInput)
    if (Number.isNaN(d.getTime())) return null
    return { sec: Math.floor(d.getTime() / 1000), ms: d.getTime() }
  }, [dateInput])

  const card =
    'rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900'
  const field =
    'flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800'
  const inputCls =
    'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800'

  const copyBtn = (text: string) => (
    <button
      onClick={() => copy(text)}
      className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700"
    >
      <CopyIcon className="h-4 w-4" />
    </button>
  )

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-4 pb-6">
        {/* 当前时间 */}
        <div className={card}>
          <h3 className="mb-3 text-sm font-medium text-slate-600 dark:text-slate-300">
            当前时间
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className={field}>
              <span className="text-slate-500">秒</span>
              <span className="font-mono">{Math.floor(now / 1000)}</span>
              {copyBtn(String(Math.floor(now / 1000)))}
            </div>
            <div className={field}>
              <span className="text-slate-500">毫秒</span>
              <span className="font-mono">{now}</span>
              {copyBtn(String(now))}
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-400">{formatLocal(new Date(now))}</p>
        </div>

        {/* 时间戳 -> 日期 */}
        <div className={card}>
          <h3 className="mb-3 text-sm font-medium text-slate-600 dark:text-slate-300">
            时间戳 → 日期
          </h3>
          <input
            value={tsInput}
            onChange={(e) => setTsInput(e.target.value)}
            placeholder="输入时间戳（自动识别秒 / 毫秒）"
            className={inputCls}
          />
          {tsResult && (
            <div className="mt-3 space-y-2">
              <div className={field}>
                <span className="text-slate-500">本地时间</span>
                <span className="font-mono">{tsResult.local}</span>
                {copyBtn(tsResult.local)}
              </div>
              <div className={field}>
                <span className="text-slate-500">UTC</span>
                <span className="truncate font-mono">{tsResult.utc}</span>
                {copyBtn(tsResult.utc)}
              </div>
              <div className={field}>
                <span className="text-slate-500">ISO</span>
                <span className="truncate font-mono">{tsResult.iso}</span>
                {copyBtn(tsResult.iso)}
              </div>
            </div>
          )}
        </div>

        {/* 日期 -> 时间戳 */}
        <div className={card}>
          <h3 className="mb-3 text-sm font-medium text-slate-600 dark:text-slate-300">
            日期 → 时间戳
          </h3>
          <input
            type="datetime-local"
            step="1"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            className={inputCls}
          />
          {dateResult && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className={field}>
                <span className="text-slate-500">秒</span>
                <span className="font-mono">{dateResult.sec}</span>
                {copyBtn(String(dateResult.sec))}
              </div>
              <div className={field}>
                <span className="text-slate-500">毫秒</span>
                <span className="font-mono">{dateResult.ms}</span>
                {copyBtn(String(dateResult.ms))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
