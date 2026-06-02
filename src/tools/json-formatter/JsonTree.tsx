import { useState } from 'react'

type Json = unknown

interface NodeProps {
  name: string | null
  value: Json
  isLast: boolean
  depth: number
}

function valueClass(value: Json): string {
  if (typeof value === 'string') return 'text-emerald-600 dark:text-emerald-400'
  if (typeof value === 'number') return 'text-sky-600 dark:text-sky-400'
  if (typeof value === 'boolean')
    return 'text-purple-600 dark:text-purple-400'
  if (value === null) return 'text-slate-400'
  return ''
}

function renderPrimitive(value: Json) {
  if (typeof value === 'string') return `"${value}"`
  if (value === null) return 'null'
  return String(value)
}

function TreeNode({ name, value, isLast, depth }: NodeProps) {
  const [open, setOpen] = useState(depth < 2)
  const isObject = value !== null && typeof value === 'object'

  const key =
    name !== null ? (
      <span className="text-rose-600 dark:text-rose-400">"{name}"</span>
    ) : null

  if (!isObject) {
    return (
      <div className="whitespace-pre" style={{ paddingLeft: depth * 16 }}>
        {key}
        {key && <span className="text-slate-400">: </span>}
        <span className={valueClass(value)}>{renderPrimitive(value)}</span>
        {!isLast && <span className="text-slate-400">,</span>}
      </div>
    )
  }

  const entries: [string | null, Json][] = Array.isArray(value)
    ? value.map((v, i) => [String(i), v])
    : Object.entries(value as Record<string, Json>)
  const isArray = Array.isArray(value)
  const openBrace = isArray ? '[' : '{'
  const closeBrace = isArray ? ']' : '}'

  return (
    <div>
      <div
        className="flex cursor-pointer items-center whitespace-pre rounded hover:bg-slate-100 dark:hover:bg-slate-800"
        style={{ paddingLeft: depth * 16 }}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="mr-1 inline-block w-3 select-none text-slate-400">
          {open ? '▾' : '▸'}
        </span>
        {key}
        {key && <span className="text-slate-400">: </span>}
        <span className="text-slate-400">{openBrace}</span>
        {!open && (
          <span className="text-slate-400">
            {' '}
            {entries.length} {isArray ? 'items' : 'keys'} {closeBrace}
            {!isLast && ','}
          </span>
        )}
      </div>
      {open && (
        <>
          {entries.map(([childName, childValue], i) => (
            <TreeNode
              key={childName ?? i}
              name={isArray ? null : childName}
              value={childValue}
              isLast={i === entries.length - 1}
              depth={depth + 1}
            />
          ))}
          <div
            className="whitespace-pre text-slate-400"
            style={{ paddingLeft: depth * 16 }}
          >
            <span className="mr-1 inline-block w-3" />
            {closeBrace}
            {!isLast && ','}
          </div>
        </>
      )}
    </div>
  )
}

export default function JsonTree({ data }: { data: Json }) {
  return (
    <div className="overflow-auto p-3 font-mono text-[13px] leading-relaxed">
      <TreeNode name={null} value={data} isLast depth={0} />
    </div>
  )
}
