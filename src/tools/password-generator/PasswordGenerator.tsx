import { useCallback, useEffect, useState } from 'react'
import { CheckIcon, CopyIcon, RefreshIcon } from '../../components/icons'
import { WORDS } from './words'

type PwType = 'random' | 'memorable' | 'pin'

const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const DIGITS = '0123456789'
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.?'

/** 基于 Web Crypto 的安全随机整数 [0, max) */
function randInt(max: number): number {
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return arr[0] % max
}

function pick<T>(list: T[]): T {
  return list[randInt(list.length)]
}

function genRandom(length: number, useNumbers: boolean, useSymbols: boolean) {
  const sets = [LOWER, UPPER]
  if (useNumbers) sets.push(DIGITS)
  if (useSymbols) sets.push(SYMBOLS)
  const all = sets.join('')
  const chars: string[] = []
  // 保证每个启用的字符集至少出现一次
  for (const s of sets) chars.push(s[randInt(s.length)])
  while (chars.length < length) chars.push(all[randInt(all.length)])
  // 洗牌
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randInt(i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.slice(0, length).join('')
}

function genMemorable(count: number, capitalize: boolean, fullWords: boolean) {
  const parts: string[] = []
  for (let i = 0; i < count; i++) {
    let w = pick(WORDS)
    if (!fullWords) w = w.slice(0, 3)
    if (capitalize) w = w.charAt(0).toUpperCase() + w.slice(1)
    parts.push(w)
  }
  return parts.join('-')
}

function genPin(digits: number) {
  let s = ''
  for (let i = 0; i < digits; i++) s += DIGITS[randInt(10)]
  return s
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2"
    >
      <span
        className={`relative h-6 w-10 rounded-full transition ${
          checked ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? 'left-[18px]' : 'left-0.5'
          }`}
        />
      </span>
      <span
        className={`text-sm ${
          checked
            ? 'text-slate-700 dark:text-slate-200'
            : 'text-slate-400'
        }`}
      >
        {label}
      </span>
    </button>
  )
}

const TABS: { id: PwType; label: string }[] = [
  { id: 'random', label: '随机' },
  { id: 'memorable', label: '容易记住' },
  { id: 'pin', label: 'PIN' },
]

export default function PasswordGenerator() {
  const [type, setType] = useState<PwType>('random')

  const [length, setLength] = useState(20)
  const [useNumbers, setUseNumbers] = useState(true)
  const [useSymbols, setUseSymbols] = useState(false)

  const [wordCount, setWordCount] = useState(3)
  const [capitalize, setCapitalize] = useState(false)
  const [fullWords, setFullWords] = useState(true)

  const [pinDigits, setPinDigits] = useState(4)

  const [password, setPassword] = useState('')
  const [copied, setCopied] = useState(false)

  const generate = useCallback(() => {
    if (type === 'random') setPassword(genRandom(length, useNumbers, useSymbols))
    else if (type === 'memorable')
      setPassword(genMemorable(wordCount, capitalize, fullWords))
    else setPassword(genPin(pinDigits))
  }, [
    type,
    length,
    useNumbers,
    useSymbols,
    wordCount,
    capitalize,
    fullWords,
    pinDigits,
  ])

  useEffect(() => {
    generate()
  }, [generate])

  const handleCopy = async () => {
    if (!password) return
    await navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const sliderClass =
    'h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-600 dark:bg-slate-700'

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        {/* 密码类型 */}
        <h2 className="mb-3 text-sm font-medium text-slate-500 dark:text-slate-400">
          选择密码类型
        </h2>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setType(tab.id)}
              className={`rounded-lg py-2 text-sm font-medium transition ${
                type === tab.id
                  ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 自定义 */}
        <h2 className="mb-4 mt-7 text-sm font-medium text-slate-500 dark:text-slate-400">
          自定义新密码
        </h2>

        {type === 'random' && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <span className="w-12 shrink-0 text-sm text-slate-600 dark:text-slate-300">
                字符
              </span>
              <input
                type="range"
                min={4}
                max={64}
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className={sliderClass}
              />
              <span className="w-14 shrink-0 rounded-lg border border-slate-200 py-1 text-center text-sm dark:border-slate-700">
                {length}
              </span>
            </div>
            <div className="flex items-center gap-8 border-t border-slate-100 pt-5 dark:border-slate-800">
              <Toggle checked={useNumbers} onChange={setUseNumbers} label="数字" />
              <Toggle checked={useSymbols} onChange={setUseSymbols} label="符号" />
            </div>
          </div>
        )}

        {type === 'memorable' && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <span className="w-12 shrink-0 text-sm text-slate-600 dark:text-slate-300">
                单词数
              </span>
              <input
                type="range"
                min={2}
                max={8}
                value={wordCount}
                onChange={(e) => setWordCount(Number(e.target.value))}
                className={sliderClass}
              />
              <span className="w-14 shrink-0 rounded-lg border border-slate-200 py-1 text-center text-sm dark:border-slate-700">
                {wordCount}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-slate-100 pt-5 dark:border-slate-800">
              <Toggle
                checked={capitalize}
                onChange={setCapitalize}
                label="首字母大写"
              />
              <Toggle
                checked={fullWords}
                onChange={setFullWords}
                label="使用完整单词"
              />
            </div>
          </div>
        )}

        {type === 'pin' && (
          <div className="flex items-center gap-4">
            <span className="w-12 shrink-0 text-sm text-slate-600 dark:text-slate-300">
              位数
            </span>
            <input
              type="range"
              min={3}
              max={12}
              value={pinDigits}
              onChange={(e) => setPinDigits(Number(e.target.value))}
              className={sliderClass}
            />
            <span className="w-14 shrink-0 rounded-lg border border-slate-200 py-1 text-center text-sm dark:border-slate-700">
              {pinDigits}
            </span>
          </div>
        )}

        {/* 生成结果 */}
        <h2 className="mb-3 mt-7 text-sm font-medium text-slate-500 dark:text-slate-400">
          生成密码
        </h2>
        <div className="flex min-h-[64px] items-center justify-center break-all rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-center font-mono text-lg font-medium tracking-wide dark:border-slate-700 dark:bg-slate-800/50">
          {password.split('').map((ch, i) => {
            let cls = 'text-slate-800 dark:text-slate-100'
            if (DIGITS.includes(ch)) cls = 'text-blue-500'
            else if (!/[a-zA-Z]/.test(ch)) cls = 'text-rose-500'
            return (
              <span key={i} className={cls}>
                {ch}
              </span>
            )
          })}
        </div>

        {/* 操作 */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleCopy}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            {copied ? (
              <>
                <CheckIcon className="h-4 w-4" />
                已复制
              </>
            ) : (
              <>
                <CopyIcon className="h-4 w-4" />
                复制密码
              </>
            )}
          </button>
          <button
            onClick={generate}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshIcon className="h-4 w-4" />
            刷新密码
          </button>
        </div>
      </div>
    </div>
  )
}
