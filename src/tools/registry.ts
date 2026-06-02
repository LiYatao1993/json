import { lazy } from 'react'
import type { ComponentType, LazyExoticComponent } from 'react'
import type { SVGProps } from 'react'
import { BracesIcon } from '../components/icons'

export type ToolCategory = '编码 / 格式' | '文本处理' | '其它'

export interface Tool {
  /** 唯一标识，同时用于路由路径 /tools/:id */
  id: string
  /** 工具名称 */
  name: string
  /** 一句话描述 */
  description: string
  /** 所属分类，用于首页与侧边栏分组 */
  category: ToolCategory
  /** 搜索关键词 */
  keywords: string[]
  /** 列表 / 卡片图标 */
  icon: ComponentType<SVGProps<SVGSVGElement>>
  /** 懒加载的工具页面组件 */
  component: LazyExoticComponent<ComponentType>
}

/**
 * 工具注册表。
 * 新增一个工具只需：
 *   1. 在 src/tools/ 下新建工具组件；
 *   2. 在此数组追加一条记录。
 * 路由与首页 / 侧边栏会自动更新。
 */
export const tools: Tool[] = [
  {
    id: 'json-formatter',
    name: 'JSON 格式化',
    description: '格式化、压缩、校验 JSON，支持键排序、转义与树形预览。',
    category: '编码 / 格式',
    keywords: ['json', 'format', 'beautify', 'minify', '格式化', '压缩', '校验'],
    icon: BracesIcon,
    component: lazy(() => import('./json-formatter/JsonFormatter')),
  },
]

export const toolsById = new Map(tools.map((t) => [t.id, t]))

export function getToolsByCategory(): Record<string, Tool[]> {
  return tools.reduce<Record<string, Tool[]>>((acc, tool) => {
    ;(acc[tool.category] ??= []).push(tool)
    return acc
  }, {})
}
