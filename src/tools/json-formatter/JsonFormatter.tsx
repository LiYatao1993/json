import { useMemo, useState } from 'react'
import { CheckIcon, CopyIcon, DownloadIcon, TrashIcon } from '../../components/icons'
import JsonTree from './JsonTree'

type IndentMode = '2' | '4' | 'tab'

const SAMPLE = `{
  "name": "DevTools",
  "version": 1,
  "active": true,
  "tags": ["json", "formatter", "tools"],
  "owner": { "id": 1024, "email": "dev@example.com" },
  "extra": null
}`

function getIndent(mode: IndentMode): string | number {
  if (mode === 'tab') return '\t'
  return Number(mode)
}

/** 递归对对象键排序 */
function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep)
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortKeysDeep((value as Record<string, unknown>)[key])
        return acc
      }, {})
  }
  return value
}

interface ParseError {
  message: string
  line?: number
  column?: number
}

/** 解析 JSON，失败时附带行列信息 */
function parseJson(text: string): { data: unknown } | { error: ParseError } {
  try {
    return { data: JSON.parse(text) }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    const posMatch = message.match(/position (\d+)/)
    if (posMatch) {
      const pos = Number(posMatch[1])
      const before = text.slice(0, pos)
      const line = before.split('\n').length
      const column = pos - before.lastIndexOf('\n')
      return { error: { message, line, column } }
    }
    return { error: { message } }
  }
}

export default function JsonFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<ParseError | null>(null)
  const [indent, setIndent] = useState<IndentMode>('2')
  const [sortKeys, setSortKeys] = useState(false)
  const [view, setView] = useState<'text' | 'tree'>('text')
  const [parsed, setParsed] = useState<unknown>(undefined)
  const [copied, setCopied] = useState(false)

  const run = (mode: 'format' | 'minify' | 'validate') => {
    if (!input.trim()) {
      setError({ message: '请输入 JSON 内容' })
      setOutput('')
      setParsed(undefined)
      return
    }
    const result = parseJson(input)
    if ('error' in result) {
      setError(result.error)
      setOutput('')
      setParsed(undefined)
      return
    }
    setError(null)
    const data = sortKeys ? sortKeysDeep(result.data) : result.data
    setParsed(data)
    if (mode === 'validate') {
      setOutput(JSON.stringify(data, null, getIndent(indent)))
      return
    }
    if (mode === 'minify') {
      setOutput(JSON.stringify(data))
      return
    }
    setOutput(JSON.stringify(data, null, getIndent(indent)))
  }

  const handleCopy = async () => {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleDownload = () => {
    if (!output) return
    const blob = new Blob([output], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'formatted.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleClear = () => {
    setInput('')
    setOutput('')
    setError(null)
    setParsed(undefined)
  }

  const stats = useMemo(() => {
    if (!output) return null
    const bytes = new Blob([output]).size
    return {
      lines: output.split('\n').length,
      chars: output.length,
      size: bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`,
    }
  }, [output])

  const btnBase =
    'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-50'
  const btnPrimary = `${btnBase} bg-brand-600 text-white hover:bg-brand-700`
  const btnGhost = `${btnBase} border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800`

  return (
    <div className="space-y-4">
      {/* 操作栏 */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <button className={btnPrimary} onClick={() => run('format')}>
          格式化
        </button>
        <button className={btnGhost} onClick={() => run('minify')}>
          压缩
        </button>
        <button className={btnGhost} onClick={() => run('validate')}>
          校验
        </button>

        <div className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-700" />

        <label className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
          缩进
          <select
            value={indent}
            onChange={(e) => setIndent(e.target.value as IndentMode)}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm outline-none dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="2">2 空格</option>
            <option value="4">4 空格</option>
            <option value="tab">Tab</option>
          </select>
        </label>

        <label className="flex cursor-pointer items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={sortKeys}
            onChange={(e) => setSortKeys(e.target.checked)}
            className="h-4 w-4 accent-brand-600"
          />
          键排序
        </label>

        <div className="ml-auto flex items-center gap-2">
          <button
            className={btnGhost}
            onClick={() => setInput(SAMPLE)}
            title="填入示例数据"
          >
            示例
          </button>
          <button className={btnGhost} onClick={handleClear}>
            <TrashIcon className="h-4 w-4" />
            清空
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300">
          解析失败：{error.message}
          {error.line && (
            <span className="ml-1 font-medium">
              （第 {error.line} 行，第 {error.column} 列）
            </span>
          )}
        </div>
      )}

      {/* 输入 / 输出 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 dark:border-slate-800">
            输入
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder="在此粘贴 JSON…"
            className="h-[460px] w-full resize-none rounded-b-xl bg-transparent p-4 font-mono text-[13px] leading-relaxed outline-none"
          />
        </div>

        <div className="flex flex-col rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2 dark:border-slate-800">
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 text-sm dark:bg-slate-800">
              <button
                onClick={() => setView('text')}
                className={`rounded-md px-2.5 py-1 transition ${
                  view === 'text'
                    ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500'
                }`}
              >
                文本
              </button>
              <button
                onClick={() => setView('tree')}
                disabled={parsed === undefined}
                className={`rounded-md px-2.5 py-1 transition disabled:opacity-40 ${
                  view === 'tree'
                    ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500'
                }`}
              >
                树形
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                disabled={!output}
                className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800"
                title="复制"
              >
                {copied ? (
                  <CheckIcon className="h-4 w-4 text-emerald-500" />
                ) : (
                  <CopyIcon className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={handleDownload}
                disabled={!output}
                className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800"
                title="下载"
              >
                <DownloadIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="h-[460px] overflow-auto">
            {view === 'tree' && parsed !== undefined ? (
              <JsonTree data={parsed} />
            ) : (
              <pre className="h-full w-full whitespace-pre p-4 font-mono text-[13px] leading-relaxed text-slate-800 dark:text-slate-200">
                {output || (
                  <span className="text-slate-400">结果将显示在这里…</span>
                )}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* 统计 */}
      {stats && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 px-1 text-xs text-slate-400">
          <span>行数：{stats.lines}</span>
          <span>字符：{stats.chars}</span>
          <span>大小：{stats.size}</span>
        </div>
      )}
    </div>
  )
}
