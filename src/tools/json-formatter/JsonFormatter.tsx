import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckIcon, CopyIcon, DownloadIcon, TrashIcon } from '../../components/icons'
import JsonTree from './JsonTree'

type IndentMode = '2' | '4' | 'tab'
type Mode = 'format' | 'minify'

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
  position?: number
}

/** 解析 JSON，失败时附带行列与字符位置信息 */
function parseJson(text: string): { data: unknown } | { error: ParseError } {
  try {
    return { data: JSON.parse(text) }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    // 优先用引擎给出的行列，其次根据 position 自行推算
    const lineColMatch = message.match(/line (\d+) column (\d+)/)
    const posMatch = message.match(/position (\d+)/)
    if (posMatch) {
      const position = Number(posMatch[1])
      const before = text.slice(0, position)
      const line = lineColMatch
        ? Number(lineColMatch[1])
        : before.split('\n').length
      const column = lineColMatch
        ? Number(lineColMatch[2])
        : position - before.lastIndexOf('\n')
      return { error: { message, line, column, position } }
    }
    return { error: { message } }
  }
}

interface ProcessResult {
  output: string
  parsed: unknown
  error: ParseError | null
}

/** 根据当前输入与选项计算输出，不直接操作状态，便于自动与手动复用 */
function process(
  input: string,
  mode: Mode,
  indent: IndentMode,
  sortKeys: boolean,
): ProcessResult {
  if (!input.trim()) return { output: '', parsed: undefined, error: null }
  const result = parseJson(input)
  if ('error' in result) {
    return { output: '', parsed: undefined, error: result.error }
  }
  const data = sortKeys ? sortKeysDeep(result.data) : result.data
  const output =
    mode === 'minify'
      ? JSON.stringify(data)
      : JSON.stringify(data, null, getIndent(indent))
  return { output, parsed: data, error: null }
}

export default function JsonFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<ParseError | null>(null)
  const [indent, setIndent] = useState<IndentMode>('2')
  const [sortKeys, setSortKeys] = useState(false)
  const [mode, setMode] = useState<Mode>('format')
  const [view, setView] = useState<'text' | 'tree'>('text')
  const [parsed, setParsed] = useState<unknown>(undefined)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // 输入或选项变化后，防抖自动格式化
  useEffect(() => {
    const timer = setTimeout(() => {
      const result = process(input, mode, indent, sortKeys)
      setOutput(result.output)
      setParsed(result.parsed)
      setError(result.error)
    }, 300)
    return () => clearTimeout(timer)
  }, [input, mode, indent, sortKeys])

  // 点击按钮立即处理（无需等待防抖）
  const apply = (nextMode: Mode) => {
    setMode(nextMode)
    const result = process(input, nextMode, indent, sortKeys)
    setOutput(result.output)
    setParsed(result.parsed)
    setError(result.error)
  }

  // 把光标定位到出错字符处
  const jumpToError = () => {
    if (error?.position == null || !inputRef.current) return
    const el = inputRef.current
    el.focus()
    el.setSelectionRange(error.position, error.position + 1)
  }

  // 出错行的内容与插入符位置，用于直观展示错误位置
  const errorSnippet = useMemo(() => {
    if (!error?.line) return null
    const lineText = input.split('\n')[error.line - 1] ?? ''
    const prefix = `${error.line} | `
    const caretPad = ' '.repeat(prefix.length + Math.max(0, (error.column ?? 1) - 1))
    return { text: `${prefix}${lineText}`, caret: `${caretPad}^` }
  }, [error, input])

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
  const btnGhost = `${btnBase} border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800`

  return (
    <div className="flex h-full flex-col gap-4">
      {/* 操作栏 */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 text-sm dark:bg-slate-800">
          <button
            onClick={() => apply('format')}
            className={`rounded-md px-3 py-1 font-medium transition ${
              mode === 'format'
                ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500'
            }`}
          >
            格式化
          </button>
          <button
            onClick={() => apply('minify')}
            className={`rounded-md px-3 py-1 font-medium transition ${
              mode === 'minify'
                ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500'
            }`}
          >
            压缩
          </button>
        </div>

        <span className="hidden text-xs text-slate-400 sm:inline">
          输入后自动处理
        </span>

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
        <div
          onClick={jumpToError}
          className={`shrink-0 rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300 ${
            error.position != null ? 'cursor-pointer' : ''
          }`}
          title={error.position != null ? '点击定位到出错位置' : undefined}
        >
          <div className="flex flex-wrap items-center gap-x-2 font-medium">
            <span>JSON 解析失败</span>
            {error.line && (
              <span className="rounded bg-rose-100 px-1.5 py-0.5 text-xs dark:bg-rose-500/20">
                第 {error.line} 行，第 {error.column} 列
              </span>
            )}
          </div>
          <div className="mt-1 text-rose-600/90 dark:text-rose-300/90">
            {error.message}
          </div>
          {errorSnippet && (
            <pre className="mt-2 overflow-x-auto rounded-md bg-rose-100/60 p-2 font-mono text-xs leading-relaxed text-rose-800 dark:bg-rose-500/10 dark:text-rose-200">
              {errorSnippet.text}
              {'\n'}
              <span className="text-rose-500">{errorSnippet.caret}</span>
            </pre>
          )}
        </div>
      )}

      {/* 输入 / 输出 */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex min-h-[220px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 dark:border-slate-800">
            输入
          </div>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder="在此粘贴 JSON，将自动格式化…"
            className="min-h-0 w-full flex-1 resize-none bg-transparent p-4 font-mono text-[13px] leading-relaxed outline-none"
          />
        </div>

        <div className="flex min-h-[220px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-2 dark:border-slate-800">
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

          <div className="min-h-0 flex-1 overflow-auto">
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
        <div className="flex shrink-0 flex-wrap gap-x-6 gap-y-1 px-1 text-xs text-slate-400">
          <span>行数：{stats.lines}</span>
          <span>字符：{stats.chars}</span>
          <span>大小：{stats.size}</span>
        </div>
      )}
    </div>
  )
}
