import { Fragment, useMemo, useState } from 'react'

const FLAGS: { flag: string; label: string }[] = [
  { flag: 'g', label: '全局' },
  { flag: 'i', label: '忽略大小写' },
  { flag: 'm', label: '多行' },
  { flag: 's', label: '单行(.匹配换行)' },
  { flag: 'u', label: 'Unicode' },
  { flag: 'y', label: '粘性' },
]

interface MatchInfo {
  index: number
  text: string
  groups: string[]
}

export default function RegexTester() {
  const [pattern, setPattern] = useState('\\b\\w+@\\w+\\.\\w+\\b')
  const [flags, setFlags] = useState('g')
  const [text, setText] = useState(
    '联系邮箱：alice@example.com 和 bob@test.org，欢迎来信。',
  )

  const { error, matches, segments } = useMemo(() => {
    if (!pattern) return { error: '', matches: [] as MatchInfo[], segments: null }
    let re: RegExp
    try {
      re = new RegExp(pattern, flags)
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : '正则表达式无效',
        matches: [] as MatchInfo[],
        segments: null,
      }
    }

    const found: MatchInfo[] = []
    const parts: { text: string; match: boolean }[] = []
    const global = flags.includes('g')

    if (!global) {
      const m = re.exec(text)
      if (m) {
        found.push({ index: m.index, text: m[0], groups: m.slice(1) })
        parts.push({ text: text.slice(0, m.index), match: false })
        parts.push({ text: m[0], match: true })
        parts.push({ text: text.slice(m.index + m[0].length), match: false })
      } else {
        parts.push({ text, match: false })
      }
      return { error: '', matches: found, segments: parts }
    }

    let last = 0
    let m: RegExpExecArray | null
    let guard = 0
    while ((m = re.exec(text)) !== null && guard < 10000) {
      guard++
      found.push({ index: m.index, text: m[0], groups: m.slice(1) })
      parts.push({ text: text.slice(last, m.index), match: false })
      parts.push({ text: m[0], match: true })
      last = m.index + m[0].length
      if (m[0] === '') re.lastIndex++ // 避免空匹配死循环
    }
    parts.push({ text: text.slice(last), match: false })
    return { error: '', matches: found, segments: parts }
  }, [pattern, flags, text])

  const toggleFlag = (f: string) =>
    setFlags((prev) => (prev.includes(f) ? prev.replace(f, '') : prev + f))

  const card =
    'rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900'

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-4 pb-6">
        <div className={card}>
          <label className="mb-1 block text-sm text-slate-500">正则表达式</label>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-800">
            <span className="text-slate-400">/</span>
            <input
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              spellCheck={false}
              className="flex-1 bg-transparent py-2 font-mono text-sm outline-none"
            />
            <span className="text-slate-400">/{flags}</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {FLAGS.map(({ flag, label }) => (
              <button
                key={flag}
                onClick={() => toggleFlag(flag)}
                title={label}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                  flags.includes(flag)
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800'
                }`}
              >
                {flag} · {label}
              </button>
            ))}
          </div>

          {error && (
            <p className="mt-3 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </p>
          )}
        </div>

        <div className={card}>
          <label className="mb-1 block text-sm text-slate-500">测试文本</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            className="h-32 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800"
          />

          {segments && (
            <div className="mt-3">
              <div className="mb-1 text-sm text-slate-500">
                匹配预览（共 {matches.length} 处）
              </div>
              <div className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-800">
                {segments.map((seg, i) =>
                  seg.match ? (
                    <mark
                      key={i}
                      className="rounded bg-amber-200 px-0.5 text-slate-900 dark:bg-amber-400/70"
                    >
                      {seg.text}
                    </mark>
                  ) : (
                    <Fragment key={i}>{seg.text}</Fragment>
                  ),
                )}
              </div>
            </div>
          )}
        </div>

        {matches.length > 0 && (
          <div className={card}>
            <div className="mb-2 text-sm text-slate-500">匹配结果</div>
            <div className="space-y-2">
              {matches.map((m, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-slate-200 px-1.5 text-xs text-slate-500 dark:bg-slate-700">
                      #{i + 1} @ {m.index}
                    </span>
                    <span className="font-mono">{m.text}</span>
                  </div>
                  {m.groups.length > 0 && (
                    <div className="mt-1 pl-2 text-xs text-slate-400">
                      分组：
                      {m.groups.map((g, gi) => (
                        <span key={gi} className="mr-2 font-mono">
                          ${gi + 1}={g ?? '∅'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
