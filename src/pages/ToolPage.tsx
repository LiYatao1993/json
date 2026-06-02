import { Suspense } from 'react'
import { useParams } from 'react-router-dom'
import { toolsById } from '../tools/registry'
import NotFound from './NotFound'

export default function ToolPage() {
  const { id } = useParams()
  const tool = id ? toolsById.get(id) : undefined

  if (!tool) return <NotFound />

  const ToolComponent = tool.component

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
          <tool.icon className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold">{tool.name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {tool.description}
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="py-20 text-center text-sm text-slate-400">
            加载中…
          </div>
        }
      >
        <ToolComponent />
      </Suspense>
    </div>
  )
}
