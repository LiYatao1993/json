import { Link } from 'react-router-dom'
import { getToolsByCategory, tools } from '../tools/registry'

export default function Home() {
  const grouped = getToolsByCategory()

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <section className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 px-6 py-10 text-white shadow-lg sm:px-10 sm:py-12">
        <h1 className="text-2xl font-bold sm:text-3xl">开发者在线工具集</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/85 sm:text-base">
          一站式聚合各类实用工具，全部在浏览器本地运行，输入数据不会上传到任何服务器。
          目前已收录 {tools.length} 个工具，更多持续添加中。
        </p>
      </section>

      {Object.entries(grouped).map(([category, list]) => (
        <div key={category} className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-700 dark:text-slate-200">
            {category}
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-400 dark:bg-slate-800">
              {list.length}
            </span>
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {list.map((tool) => {
              const Icon = tool.icon
              return (
                <Link
                  key={tool.id}
                  to={`/tools/${tool.id}`}
                  className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-500/50"
                >
                  <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-500 group-hover:text-white dark:bg-brand-500/15 dark:text-brand-300">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                    {tool.name}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {tool.description}
                  </p>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
