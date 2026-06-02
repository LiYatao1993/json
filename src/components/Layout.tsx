import { useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { getToolsByCategory } from '../tools/registry'
import { useTheme } from '../hooks/useTheme'
import {
  BracesIcon,
  GithubIcon,
  HomeIcon,
  MenuIcon,
  MoonIcon,
  SearchIcon,
  SunIcon,
} from './icons'

const GITHUB_URL = 'https://github.com/LiYatao1993/json'

export default function Layout() {
  const { theme, toggleTheme } = useTheme()
  const [query, setQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const grouped = useMemo(() => {
    const all = getToolsByCategory()
    const q = query.trim().toLowerCase()
    if (!q) return all
    const filtered: typeof all = {}
    for (const [category, list] of Object.entries(all)) {
      const matched = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.keywords.some((k) => k.toLowerCase().includes(q)),
      )
      if (matched.length) filtered[category] = matched
    }
    return filtered
  }, [query])

  const closeMobile = () => setMobileOpen(false)

  return (
    <div className="flex h-full bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-200">
      {/* 移动端遮罩 */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Link
          to="/"
          onClick={closeMobile}
          className="flex items-center gap-2 px-5 py-4 text-lg font-semibold"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
            <BracesIcon className="h-5 w-5" />
          </span>
          <span>
            工具集
            <span className="text-brand-500"> · DevTools</span>
          </span>
        </Link>

        <div className="px-4 pb-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索工具…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <NavLink
            to="/"
            end
            onClick={closeMobile}
            className={({ isActive }) =>
              `mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`
            }
          >
            <HomeIcon className="h-4 w-4" />
            首页
          </NavLink>

          {Object.entries(grouped).map(([category, list]) => (
            <div key={category} className="mt-4">
              <div className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {category}
              </div>
              {list.map((tool) => {
                const Icon = tool.icon
                return (
                  <NavLink
                    key={tool.id}
                    to={`/tools/${tool.id}`}
                    onClick={closeMobile}
                    className={({ isActive }) =>
                      `mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{tool.name}</span>
                  </NavLink>
                )
              })}
            </div>
          ))}

          {Object.keys(grouped).length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-slate-400">
              没有匹配的工具
            </p>
          )}
        </nav>

        <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-400 dark:border-slate-800">
          纯前端实现 · 数据不离开浏览器
        </div>
      </aside>

      {/* 主区域 */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            aria-label="打开菜单"
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          <div className="flex-1 text-sm text-slate-400">
            {location.pathname === '/' ? '所有工具' : ''}
          </div>

          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="GitHub 仓库"
          >
            <GithubIcon className="h-5 w-5" />
          </a>
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="切换主题"
          >
            {theme === 'dark' ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
          </button>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
