import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { DownloadIcon } from '../../components/icons'
import { useToast } from '../../components/Toast'

type ErrorLevel = 'L' | 'M' | 'Q' | 'H'

export default function QrCodeTool() {
  const [text, setText] = useState('https://')
  const [size, setSize] = useState(256)
  const [level, setLevel] = useState<ErrorLevel>('M')
  const [fg, setFg] = useState('#000000')
  const [bg, setBg] = useState('#ffffff')
  const [error, setError] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const toast = useToast()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (!text) {
      const ctx = canvas.getContext('2d')
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
      return
    }
    QRCode.toCanvas(
      canvas,
      text,
      {
        width: size,
        margin: 2,
        errorCorrectionLevel: level,
        color: { dark: fg, light: bg },
      },
      (err) => setError(err ? '内容过长，无法生成二维码' : ''),
    )
  }, [text, size, level, fg, bg])

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas || !text) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = 'qrcode.png'
    a.click()
    toast.success('已下载 qrcode.png')
  }

  const card =
    'rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900'
  const inputCls =
    'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800'

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto grid max-w-4xl gap-4 pb-6 md:grid-cols-2">
        <div className={card}>
          <label className="mb-1 block text-sm text-slate-500">内容</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="输入文本或链接…"
            className={`${inputCls} h-28 resize-y font-mono`}
          />

          <div className="mt-4 space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-sm text-slate-500">
                <span>尺寸</span>
                <span>{size}px</span>
              </div>
              <input
                type="range"
                min={128}
                max={512}
                step={32}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-600 dark:bg-slate-700"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-500">
                容错级别
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as ErrorLevel)}
                className={inputCls}
              >
                <option value="L">L（约 7%）</option>
                <option value="M">M（约 15%）</option>
                <option value="Q">Q（约 25%）</option>
                <option value="H">H（约 30%）</option>
              </select>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-500">
                前景色
                <input
                  type="color"
                  value={fg}
                  onChange={(e) => setFg(e.target.value)}
                  className="h-8 w-10 cursor-pointer rounded border border-slate-200 dark:border-slate-700"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-500">
                背景色
                <input
                  type="color"
                  value={bg}
                  onChange={(e) => setBg(e.target.value)}
                  className="h-8 w-10 cursor-pointer rounded border border-slate-200 dark:border-slate-700"
                />
              </label>
            </div>
          </div>
        </div>

        <div className={`${card} flex flex-col items-center justify-center gap-4`}>
          {error ? (
            <p className="text-sm text-rose-500">{error}</p>
          ) : (
            <canvas
              ref={canvasRef}
              className="max-w-full rounded-lg"
              style={{ imageRendering: 'pixelated' }}
            />
          )}
          <button
            onClick={download}
            disabled={!text || !!error}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            <DownloadIcon className="h-4 w-4" />
            下载 PNG
          </button>
        </div>
      </div>
    </div>
  )
}
