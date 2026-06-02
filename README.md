# 工具集 · DevTools

聚合各类开发者常用工具的在线网站，**完全由前端实现**：所有数据都在浏览器本地处理，不会上传到任何服务器。

> 当前已收录：**JSON 格式化**。更多工具持续添加中。

## 技术栈

- [Vite](https://vite.dev/) + [React 19](https://react.dev/) + TypeScript
- [React Router](https://reactrouter.com/) 路由
- [Tailwind CSS v4](https://tailwindcss.com/) 样式
- 工具组件按需懒加载（`React.lazy` 代码分割）

## 开发

```bash
npm install      # 安装依赖
npm run dev      # 启动开发服务器 (http://localhost:5173)
npm run build    # 生产构建，产物在 dist/
npm run preview  # 本地预览生产构建
```

## 功能：JSON 格式化

- 格式化 / 压缩 / 校验
- 可选缩进（2 空格 / 4 空格 / Tab）
- 递归键名排序
- 文本视图与可折叠树形视图切换
- 一键复制、下载为 `.json`
- 解析失败时给出错误信息及出错行列
- 输出统计（行数 / 字符数 / 体积）

## 项目结构

```
src/
├─ App.tsx                 # 路由配置（首页 / 工具页 / 404）
├─ components/
│  ├─ Layout.tsx           # 侧边栏 + 顶栏 + 搜索 + 主题切换
│  └─ icons.tsx            # 内联 SVG 图标
├─ hooks/
│  └─ useTheme.ts          # 深色 / 浅色主题
├─ pages/
│  ├─ Home.tsx             # 工具卡片首页
│  ├─ ToolPage.tsx         # 按 id 渲染对应工具
│  └─ NotFound.tsx
└─ tools/
   ├─ registry.ts          # 工具注册表（新增工具的唯一入口）
   └─ json-formatter/      # JSON 格式化工具
```

## 如何新增一个工具

1. 在 `src/tools/` 下新建工具组件，例如 `src/tools/my-tool/MyTool.tsx`，默认导出一个组件。
2. 在 `src/tools/registry.ts` 的 `tools` 数组中追加一条记录：

```ts
{
  id: 'my-tool',                 // 唯一标识，对应路由 /tools/my-tool
  name: '我的工具',
  description: '一句话描述。',
  category: '文本处理',
  keywords: ['关键词'],
  icon: SomeIcon,
  component: lazy(() => import('./my-tool/MyTool')),
}
```

路由、首页卡片、侧边栏导航与搜索都会自动更新，无需改动其它代码。
