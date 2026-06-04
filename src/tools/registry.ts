import { lazy } from 'react'
import type { ComponentType, LazyExoticComponent } from 'react'
import type { SVGProps } from 'react'
import {
  BracesIcon,
  CalendarIcon,
  ClockIcon,
  CodeIcon,
  CoffeeIcon,
  KeyIcon,
  LinkIcon,
  QrIcon,
  RegexIcon,
} from '../components/icons'

export type ToolCategory =
  | '编码 / 格式'
  | '文本处理'
  | '转换 / 计算'
  | '生成 / 安全'
  | '其它'

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
  {
    id: 'base64',
    name: 'Base64 编解码',
    description: '文本与 Base64 互转，支持图片转 Base64（Data URL）。',
    category: '编码 / 格式',
    keywords: ['base64', 'encode', 'decode', '编码', '解码', '图片'],
    icon: CodeIcon,
    component: lazy(() => import('./base64/Base64Tool')),
  },
  {
    id: 'json-to-java',
    name: 'JSON 转 Java 实体',
    description: '把 JSON 生成 Java 实体类，支持 Lombok、包装类型与 @JsonProperty。',
    category: '转换 / 计算',
    keywords: ['json', 'java', 'pojo', 'entity', '实体', '转换', 'lombok'],
    icon: CoffeeIcon,
    component: lazy(() => import('./json-to-java/JsonToJava')),
  },
  {
    id: 'url-codec',
    name: 'URL 编解码',
    description: 'encodeURIComponent / decodeURIComponent，可选整段 URL 模式。',
    category: '编码 / 格式',
    keywords: ['url', 'uri', 'encode', 'decode', '编码', '解码', '转义'],
    icon: LinkIcon,
    component: lazy(() => import('./url-codec/UrlCodec')),
  },
  {
    id: 'cron',
    name: 'Cron 表达式',
    description: '可视化生成与校验 Cron，支持 5/6 段、中文说明与下次执行时间预览。',
    category: '转换 / 计算',
    keywords: ['cron', 'crontab', 'quartz', '定时', '表达式', '调度'],
    icon: CalendarIcon,
    component: lazy(() => import('./cron/CronTool')),
  },
  {
    id: 'timestamp',
    name: '时间戳转换',
    description: '时间戳与日期互转，自动识别秒 / 毫秒，含本地、UTC、ISO。',
    category: '转换 / 计算',
    keywords: ['timestamp', 'time', 'date', '时间戳', '日期', 'unix'],
    icon: ClockIcon,
    component: lazy(() => import('./timestamp/TimestampTool')),
  },
  {
    id: 'regex-tester',
    name: '正则表达式测试',
    description: '实时匹配高亮，支持多种标志位与分组捕获展示。',
    category: '文本处理',
    keywords: ['regex', 'regexp', '正则', '匹配', '测试'],
    icon: RegexIcon,
    component: lazy(() => import('./regex-tester/RegexTester')),
  },
  {
    id: 'password-generator',
    name: '密码生成器',
    description: '生成随机、易记或 PIN 类型的强密码，可调长度与字符集。',
    category: '生成 / 安全',
    keywords: ['password', 'generator', '密码', '生成', 'pin', '随机'],
    icon: KeyIcon,
    component: lazy(() => import('./password-generator/PasswordGenerator')),
  },
  {
    id: 'qrcode',
    name: '二维码生成',
    description: '把文本或链接生成二维码，可调尺寸、容错级别与颜色，支持下载。',
    category: '生成 / 安全',
    keywords: ['qrcode', 'qr', '二维码', '生成'],
    icon: QrIcon,
    component: lazy(() => import('./qrcode/QrCodeTool')),
  },
]

export const toolsById = new Map(tools.map((t) => [t.id, t]))

export function getToolsByCategory(): Record<string, Tool[]> {
  return tools.reduce<Record<string, Tool[]>>((acc, tool) => {
    ;(acc[tool.category] ??= []).push(tool)
    return acc
  }, {})
}
