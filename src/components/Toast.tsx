import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { ErrorIcon, InfoIcon, SuccessIcon, WarningIcon } from './icons'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
  id: number
  type: ToastType
  message: string
}

interface ToastApi {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast 必须在 ToastProvider 内使用')
  return ctx
}

const TYPE_STYLE: Record<
  ToastType,
  { icon: typeof SuccessIcon; text: string; bg: string; border: string }
> = {
  success: {
    icon: SuccessIcon,
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    border: 'border-emerald-200 dark:border-emerald-500/30',
  },
  error: {
    icon: ErrorIcon,
    text: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-500/10',
    border: 'border-rose-200 dark:border-rose-500/30',
  },
  info: {
    icon: InfoIcon,
    text: 'text-brand-600 dark:text-brand-400',
    bg: 'bg-brand-50 dark:bg-brand-500/10',
    border: 'border-brand-200 dark:border-brand-500/30',
  },
  warning: {
    icon: WarningIcon,
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    border: 'border-amber-200 dark:border-amber-500/30',
  },
}

let counter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const push = useCallback((type: ToastType, message: string) => {
    const id = ++counter
    setItems((list) => [...list, { id, type, message }])
    setTimeout(() => {
      setItems((list) => list.filter((t) => t.id !== id))
    }, 2600)
  }, [])

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
      warning: (m) => push('warning', m),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed left-1/2 top-5 z-[1000] flex -translate-x-1/2 flex-col items-center gap-2">
          {items.map((item) => {
            const style = TYPE_STYLE[item.type]
            const Icon = style.icon
            return (
              <div
                key={item.id}
                className={`pointer-events-auto flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium shadow-md ${style.bg} ${style.border} ${style.text}`}
                style={{ animation: 'toast-in 0.25s ease-out' }}
                role="alert"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-slate-700 dark:text-slate-100">
                  {item.message}
                </span>
              </div>
            )
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}
