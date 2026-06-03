import { useMemo, useState } from 'react'
import { CopyIcon, DownloadIcon } from '../../components/icons'
import { useToast } from '../../components/Toast'
import { copyText } from '../../utils/clipboard'

type Mode = 'encode' | 'decode'

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin)
}

function base64ToUtf8(b64: string): string {
  const bin = atob(b64.trim())
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

// 根据 Base64 前缀推断图片类型，拼成可渲染的 Data URL
function toImageSrc(raw: string): string {
  const s = raw.trim().replace(/\s/g, '')
  if (!s) return ''
  if (s.startsWith('data:')) return s
  let mime = 'image/png'
  if (s.startsWith('/9j/')) mime = 'image/jpeg'
  else if (s.startsWith('iVBOR')) mime = 'image/png'
  else if (s.startsWith('R0lGOD')) mime = 'image/gif'
  else if (s.startsWith('UklGR')) mime = 'image/webp'
  else if (s.startsWith('PHN2Zy') || s.startsWith('PD94')) mime = 'image/svg+xml'
  else if (s.startsWith('Qk')) mime = 'image/bmp'
  return `data:${mime};base64,${s}`
}

export default function Base64Tool() {
  const [mode, setMode] = useState<Mode>('encode')
  const [input, setInput] = useState('')
  const [imageBase64, setImageBase64] = useState('')
  const [b64ImgInput, setB64ImgInput] = useState('')
  const [imgError, setImgError] = useState(false)
  const toast = useToast()

  const b64ImgSrc = useMemo(() => toImageSrc(b64ImgInput), [b64ImgInput])

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: '' }
    try {
      return {
        output: mode === 'encode' ? utf8ToBase64(input) : base64ToUtf8(input),
        error: '',
      }
    } catch {
      return {
        output: '',
        error: mode === 'decode' ? '不是合法的 Base64 字符串' : '编码失败',
      }
    }
  }, [input, mode])

  const handleImage = (file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImageBase64(String(reader.result))
    reader.readAsDataURL(file)
  }

  const copy = async (text: string) => {
    if (!text) return
    const ok = await copyText(text)
    toast[ok ? 'success' : 'error'](ok ? '复制成功' : '复制失败')
  }

  const downloadImage = () => {
    if (!b64ImgSrc || imgError) return
    const ext = (b64ImgSrc.match(/^data:image\/(\w+)/)?.[1] || 'png').replace(
      'svg+xml',
      'svg',
    )
    const a = document.createElement('a')
    a.href = b64ImgSrc
    a.download = `image.${ext}`
    a.click()
    toast.success(`已下载 image.${ext}`)
  }

  const card =
    'rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900'

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-4 pb-6">
        {/* 文本编解码 */}
        <div className={card}>
          <div className="mb-3 flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 text-sm dark:bg-slate-800 sm:w-fit">
            {(['encode', 'decode'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-md px-4 py-1.5 font-medium transition sm:flex-none ${
                  mode === m
                    ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500'
                }`}
              >
                {m === 'encode' ? '编码' : '解码'}
              </button>
            ))}
          </div>

          <label className="mb-1 block text-sm text-slate-500">
            {mode === 'encode' ? '原文' : 'Base64'}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder={mode === 'encode' ? '输入要编码的文本…' : '输入要解码的 Base64…'}
            className="h-32 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800"
          />

          <div className="mt-3 flex items-center justify-between">
            <label className="text-sm text-slate-500">
              {mode === 'encode' ? 'Base64' : '原文'}
            </label>
            <button
              onClick={() => copy(output)}
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

        {/* 图片转 Base64 */}
        <div className={card}>
          <h3 className="mb-3 text-sm font-medium text-slate-600 dark:text-slate-300">
            图片转 Base64（Data URL）
          </h3>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImage(e.target.files?.[0])}
            className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-500/15 dark:file:text-brand-300"
          />
          {imageBase64 && (
            <div className="mt-3 space-y-2">
              <img
                src={imageBase64}
                alt="预览"
                className="max-h-40 rounded-lg border border-slate-200 dark:border-slate-700"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => copy(imageBase64)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <CopyIcon className="h-4 w-4" />
                  复制 Data URL
                </button>
              </div>
              <pre className="max-h-32 overflow-auto break-all rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800">
                {imageBase64}
              </pre>
            </div>
          )}
        </div>

        {/* Base64 转图片 */}
        <div className={card}>
          <h3 className="mb-3 text-sm font-medium text-slate-600 dark:text-slate-300">
            Base64 转图片
          </h3>
          <textarea
            value={b64ImgInput}
            onChange={(e) => {
              setB64ImgInput(e.target.value)
              setImgError(false)
            }}
            spellCheck={false}
            placeholder="粘贴图片的 Base64 或 Data URL（自动识别 png/jpeg/gif/webp/svg…）"
            className="h-28 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800"
          />
          {b64ImgSrc && (
            <div className="mt-3 space-y-2">
              {imgError ? (
                <p className="text-sm text-rose-500">
                  无法解析为图片，请检查 Base64 内容是否完整
                </p>
              ) : (
                <>
                  <img
                    src={b64ImgSrc}
                    alt="预览"
                    onError={() => setImgError(true)}
                    className="max-h-48 rounded-lg border border-slate-200 dark:border-slate-700"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={downloadImage}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <DownloadIcon className="h-4 w-4" />
                      下载图片
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
