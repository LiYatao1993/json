import { useMemo, useState } from 'react'
import { CopyIcon, DownloadIcon } from '../../components/icons'
import { useToast } from '../../components/Toast'
import { copyText } from '../../utils/clipboard'
import { jsonToJava, type JavaOptions } from './converter'

const SAMPLE = `{
  "userId": 1024,
  "user_name": "alice",
  "active": true,
  "balance": 99.5,
  "roles": ["admin", "user"],
  "profile": { "age": 30, "city": "Shanghai" }
}`

export default function JsonToJava() {
  const [input, setInput] = useState('')
  const [rootClassName, setRootClassName] = useState('Root')
  const [useLombok, setUseLombok] = useState(true)
  const [useWrapper, setUseWrapper] = useState(true)
  const [jsonProperty, setJsonProperty] = useState(false)
  const toast = useToast()

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: '' }
    const opts: JavaOptions = {
      rootClassName,
      useLombok,
      useWrapper,
      jsonProperty,
    }
    try {
      return { output: jsonToJava(input, opts), error: '' }
    } catch (e) {
      return {
        output: '',
        error: e instanceof Error ? e.message : 'JSON 解析失败',
      }
    }
  }, [input, rootClassName, useLombok, useWrapper, jsonProperty])

  const copy = async () => {
    if (!output) {
      toast.warning('暂无可复制的内容')
      return
    }
    const ok = await copyText(output)
    toast[ok ? 'success' : 'error'](ok ? '复制成功' : '复制失败')
  }

  const download = () => {
    if (!output) {
      toast.warning('暂无可下载的内容')
      return
    }
    const cls = (rootClassName || 'Root').replace(/[^a-zA-Z0-9]/g, '') || 'Root'
    const blob = new Blob([output], { type: 'text/x-java-source' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${cls.charAt(0).toUpperCase() + cls.slice(1)}.java`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('已下载 .java 文件')
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* 选项栏 */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <label className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
          根类名
          <input
            value={rootClassName}
            onChange={(e) => setRootClassName(e.target.value)}
            className="w-32 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800"
          />
        </label>
        <label className="flex cursor-pointer items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={useLombok}
            onChange={(e) => setUseLombok(e.target.checked)}
            className="h-4 w-4 accent-brand-600"
          />
          Lombok @Data
        </label>
        <label className="flex cursor-pointer items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={useWrapper}
            onChange={(e) => setUseWrapper(e.target.checked)}
            className="h-4 w-4 accent-brand-600"
          />
          包装类型
        </label>
        <label className="flex cursor-pointer items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={jsonProperty}
            onChange={(e) => setJsonProperty(e.target.checked)}
            className="h-4 w-4 accent-brand-600"
          />
          属性注解
          <span className="text-xs text-slate-400">(JsonProperty/JSONField)</span>
        </label>
        <button
          onClick={() => setInput(SAMPLE)}
          className="ml-auto rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          示例
        </button>
      </div>

      {error && (
        <div className="shrink-0 rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex min-h-[220px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="shrink-0 border-b border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 dark:border-slate-800">
            JSON 输入
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder="在此粘贴 JSON…"
            className="min-h-0 w-full flex-1 resize-none bg-transparent p-4 font-mono text-[13px] leading-relaxed outline-none"
          />
        </div>

        <div className="flex min-h-[220px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-2 dark:border-slate-800">
            <span className="text-sm font-medium text-slate-500">Java 实体类</span>
            <div className="flex items-center gap-1">
              <button
                onClick={copy}
                disabled={!output}
                className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800"
                title="复制"
              >
                <CopyIcon className="h-4 w-4" />
              </button>
              <button
                onClick={download}
                disabled={!output}
                className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800"
                title="下载 .java"
              >
                <DownloadIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          <pre className="min-h-0 flex-1 overflow-auto whitespace-pre p-4 font-mono text-[13px] leading-relaxed text-slate-800 dark:text-slate-200">
            {output || <span className="text-slate-400">生成的 Java 代码…</span>}
          </pre>
        </div>
      </div>
    </div>
  )
}
