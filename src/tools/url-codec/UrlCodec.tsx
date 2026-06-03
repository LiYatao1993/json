import { useMemo, useState } from 'react'
import { CopyIcon } from '../../components/icons'
import { useToast } from '../../components/Toast'
import { copyText } from '../../utils/clipboard'

type Mode = 'encode' | 'decode'

export default function UrlCodec() {
  const [mode, setMode] = useState<Mode>('encode')
  const [whole, setWhole] = useState(false)
  const [input, setInput] = useState('')
  const toast = useToast()

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: '' }
    try {
      if (mode === 'encode') {
        return { output: whole ? encodeURI(input) : encodeURIComponent(input), error: '' }
      }
      return { output: whole ? decodeURI(input) : decodeURIComponent(input), error: '' }
    } catch {
      return { output: '', error: '解码失败：包含非法的转义序列' }
    }
  }, [input, mode, whole])

  const copy = async () => {
    if (!output) return
    const ok = await copyText(output)
    toast[ok ? 'success' : 'error'](ok ? '复制成功' : '复制失败')
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-4 pb-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 text-sm dark:bg-slate-800">
              {(['encode', 'decode'] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded-md px-4 py-1.5 font-medium transition ${
                    mode === m
                      ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-500'
                  }`}
                >
                  {m === 'encode' ? '编码' : '解码'}
                </button>
              ))}
            </div>
            <label className="flex cursor-pointer items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={whole}
                onChange={(e) => setWhole(e.target.checked)}
                className="h-4 w-4 accent-brand-600"
              />
              整段 URL（保留 {'://?&='} 等分隔符）
            </label>
          </div>

          <label className="mb-1 block text-sm text-slate-500">输入</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder={mode === 'encode' ? '输入要编码的内容…' : '输入要解码的内容…'}
            className="h-32 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800"
          />

          <div className="mt-3 flex items-center justify-between">
            <label className="text-sm text-slate-500">结果</label>
            <button
              onClick={copy}
              disabled={!output}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800"
            >
              <CopyIcon className="h-4 w-4" />
              复制
            </button>
          </div>
          <pre className="min-h-[80px] w-full overflow-auto whitespace-pre-wrap break-all rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-800">
            {error ? (
              <span className="text-rose-500">{error}</span>
            ) : (
              output || <span className="text-slate-400">结果…</span>
            )}
          </pre>
        </div>
      </div>
    </div>
  )
}
