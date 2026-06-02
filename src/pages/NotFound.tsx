import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-6xl font-bold text-brand-500">404</p>
      <p className="mt-4 text-lg font-medium text-slate-700 dark:text-slate-200">
        页面或工具不存在
      </p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
      >
        返回首页
      </Link>
    </div>
  )
}
