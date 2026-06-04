import { useMemo, useState } from 'react'
import { CopyIcon } from '../../components/icons'
import { useToast } from '../../components/Toast'
import { copyText } from '../../utils/clipboard'
import { describeCron, formatDate, nextRuns, parseCron } from './cron'

interface Preset {
  label: string
  five: string
  six: string
}

const PRESETS: Preset[] = [
  { label: '每分钟', five: '* * * * *', six: '0 * * * * *' },
  { label: '每 5 分钟', five: '*/5 * * * *', six: '0 */5 * * * *' },
  { label: '每小时整点', five: '0 * * * *', six: '0 0 * * * *' },
  { label: '每天 0 点', five: '0 0 * * *', six: '0 0 0 * * *' },
  { label: '每天 9:30', five: '30 9 * * *', six: '0 30 9 * * *' },
  { label: '每周一 9 点', five: '0 9 * * 1', six: '0 0 9 * * 1' },
  { label: '每月 1 号 0 点', five: '0 0 1 * *', six: '0 0 0 1 * *' },
  { label: '工作日 18 点', five: '0 18 * * 1-5', six: '0 0 18 * * 1-5' },
]

const FIELDS5 = ['分', '时', '日', '月', '周']
const FIELDS6 = ['秒', '分', '时', '日', '月', '周']

export default function CronTool() {
  const [hasSeconds, setHasSeconds] = useState(false)
  const [expr, setExpr] = useState('0 9 * * 1')
  const toast = useToast()

  const result = useMemo(() => {
    const parsed = parseCron(expr, hasSeconds)
    if ('error' in parsed) return { error: parsed.error }
    return {
      description: describeCron(parsed.fields, hasSeconds),
      runs: nextRuns(parsed.fields, hasSeconds, 6),
    }
  }, [expr, hasSeconds])

  const switchMode = (six: boolean) => {
    setHasSeconds(six)
    // 在 5/6 段之间转换表达式
    const tokens = expr.trim().split(/\s+/).filter(Boolean)
    if (six && tokens.length === 5) setExpr('0 ' + expr.trim())
    else if (!six && tokens.length === 6) setExpr(tokens.slice(1).join(' '))
  }

  const usePreset = (p: Preset) => setExpr(hasSeconds ? p.six : p.five)

  const copy = async () => {
    const ok = await copyText(expr.trim())
    toast[ok ? 'success' : 'error'](ok ? '已复制表达式' : '复制失败')
  }

  const fields = hasSeconds ? FIELDS6 : FIELDS5
  const card =
    'rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900'

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-4 pb-6">
        {/* 段位切换 */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 text-sm dark:bg-slate-800 sm:w-fit">
          <button
            onClick={() => switchMode(false)}
            className={`flex-1 rounded-md px-4 py-1.5 font-medium transition sm:flex-none ${
              !hasSeconds
                ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500'
            }`}
          >
            5 段（标准）
          </button>
          <button
            onClick={() => switchMode(true)}
            className={`flex-1 rounded-md px-4 py-1.5 font-medium transition sm:flex-none ${
              hasSeconds
                ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500'
            }`}
          >
            6 段（含秒 Quartz/Spring）
          </button>
        </div>

        {/* 表达式输入 */}
        <div className={card}>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-800">
            <input
              value={expr}
              onChange={(e) => setExpr(e.target.value)}
              spellCheck={false}
              className="flex-1 bg-transparent py-2.5 font-mono text-base outline-none"
            />
            <button
              onClick={copy}
              className="shrink-0 rounded-md p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
              title="复制"
            >
              <CopyIcon className="h-4 w-4" />
            </button>
          </div>

          {/* 字段图例 */}
          <div
            className="mt-2 grid gap-1 text-center text-xs text-slate-400"
            style={{ gridTemplateColumns: `repeat(${fields.length}, 1fr)` }}
          >
            {fields.map((f) => (
              <span key={f}>{f}</span>
            ))}
          </div>

          {'error' in result ? (
            <p className="mt-3 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300">
              表达式无效：{result.error}
            </p>
          ) : (
            <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              {result.description}
            </p>
          )}
        </div>

        {/* 常用模板 */}
        <div className={card}>
          <h3 className="mb-3 text-sm font-medium text-slate-600 dark:text-slate-300">
            常用模板
          </h3>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => usePreset(p)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-brand-500/10"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 接下来的执行时间 */}
        {!('error' in result) && (
          <div className={card}>
            <h3 className="mb-3 text-sm font-medium text-slate-600 dark:text-slate-300">
              接下来 {result.runs.length} 次执行
            </h3>
            {result.runs.length === 0 ? (
              <p className="text-sm text-slate-400">在可预见范围内没有匹配的时间</p>
            ) : (
              <ol className="space-y-1.5">
                {result.runs.map((d, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 font-mono text-sm dark:bg-slate-800"
                  >
                    <span className="text-xs text-slate-400">#{i + 1}</span>
                    {formatDate(d)}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
