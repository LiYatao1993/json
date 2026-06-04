import { useEffect, useRef, useState } from 'react'
import { DownloadIcon, ImageIcon } from '../../components/icons'
import { useToast } from '../../components/Toast'

type Format = 'image/jpeg' | 'image/png' | 'image/webp'

const FORMAT_LABEL: Record<Format, string> = {
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
}
const EXT: Record<Format, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

interface Original {
  url: string
  size: number
  width: number
  height: number
  name: string
}

interface Result {
  url: string
  size: number
  width: number
  height: number
}

export default function ImageCompress() {
  const [original, setOriginal] = useState<Original | null>(null)
  const [format, setFormat] = useState<Format>('image/jpeg')
  const [quality, setQuality] = useState(0.8)
  const [scale, setScale] = useState(100)
  const [result, setResult] = useState<Result | null>(null)
  const resultUrlRef = useRef<string>('')
  const toast = useToast()

  const handleFile = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setOriginal({
        url,
        size: file.size,
        width: img.naturalWidth,
        height: img.naturalHeight,
        name: file.name.replace(/\.[^.]+$/, ''),
      })
    }
    img.onerror = () => toast.error('图片加载失败')
    img.src = url
  }

  useEffect(() => {
    if (!original) return
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (cancelled) return
      const w = Math.max(1, Math.round((img.naturalWidth * scale) / 100))
      const h = Math.max(1, Math.round((img.naturalHeight * scale) / 100))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob(
        (blob) => {
          if (!blob || cancelled) return
          if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
          const url = URL.createObjectURL(blob)
          resultUrlRef.current = url
          setResult({ url, size: blob.size, width: w, height: h })
        },
        format,
        quality,
      )
    }
    img.src = original.url
    return () => {
      cancelled = true
    }
  }, [original, format, quality, scale])

  useEffect(
    () => () => {
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
    },
    [],
  )

  const download = () => {
    if (!result || !original) return
    const a = document.createElement('a')
    a.href = result.url
    a.download = `${original.name}-compressed.${EXT[format]}`
    a.click()
    toast.success('已下载压缩后的图片')
  }

  const ratio =
    original && result
      ? Math.round((1 - result.size / original.size) * 100)
      : 0

  const card =
    'rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900'
  const isLossy = format !== 'image/png'

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-4 pb-6">
        {/* 上传 */}
        <label
          className={`${card} flex cursor-pointer flex-col items-center justify-center gap-2 border-dashed py-8 text-center transition hover:border-brand-400`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            handleFile(e.dataTransfer.files?.[0])
          }}
        >
          <ImageIcon className="h-8 w-8 text-slate-400" />
          <span className="text-sm text-slate-500">
            点击选择或拖拽图片到此处
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>

        {original && (
          <>
            {/* 选项 */}
            <div className={card}>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm text-slate-500">
                    输出格式
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as Format)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800"
                  >
                    {Object.entries(FORMAT_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-sm text-slate-500">
                    <span>质量</span>
                    <span>
                      {isLossy ? `${Math.round(quality * 100)}%` : '无损'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={quality}
                    disabled={!isLossy}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-600 disabled:opacity-40 dark:bg-slate-700"
                  />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-sm text-slate-500">
                    <span>缩放</span>
                    <span>{scale}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={scale}
                    onChange={(e) => setScale(Number(e.target.value))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-600 dark:bg-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* 对比 */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className={card}>
                <div className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                  原图
                </div>
                <img
                  src={original.url}
                  alt="原图"
                  className="mx-auto max-h-64 rounded-lg border border-slate-200 dark:border-slate-700"
                />
                <p className="mt-2 text-center text-sm text-slate-400">
                  {original.width}×{original.height} · {formatSize(original.size)}
                </p>
              </div>
              <div className={card}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    压缩后
                  </span>
                  <button
                    onClick={download}
                    disabled={!result}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
                  >
                    <DownloadIcon className="h-4 w-4" />
                    下载
                  </button>
                </div>
                {result && (
                  <>
                    <img
                      src={result.url}
                      alt="压缩后"
                      className="mx-auto max-h-64 rounded-lg border border-slate-200 dark:border-slate-700"
                    />
                    <p className="mt-2 text-center text-sm">
                      <span className="text-slate-400">
                        {result.width}×{result.height} · {formatSize(result.size)}
                      </span>
                      {ratio > 0 && (
                        <span className="ml-2 font-medium text-emerald-600 dark:text-emerald-400">
                          ↓ {ratio}%
                        </span>
                      )}
                      {ratio < 0 && (
                        <span className="ml-2 font-medium text-amber-600 dark:text-amber-400">
                          ↑ {Math.abs(ratio)}%（反而变大，建议换格式）
                        </span>
                      )}
                    </p>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
