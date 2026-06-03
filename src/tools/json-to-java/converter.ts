export type AnnotationType = 'none' | 'jackson' | 'fastjson'

export interface JavaOptions {
  rootClassName: string
  useLombok: boolean
  useWrapper: boolean
  annotation: AnnotationType
}

interface Field {
  jsonName: string
  javaName: string
  type: string
}

interface ClassDef {
  name: string
  fields: Field[]
}

function words(key: string): string[] {
  return key.split(/[^a-zA-Z0-9]+/).filter(Boolean)
}

function toPascal(key: string): string {
  const w = words(key)
  if (!w.length) return 'Field'
  return w.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('')
}

function toCamel(key: string): string {
  const p = toPascal(key)
  return p.charAt(0).toLowerCase() + p.slice(1)
}

// 驼峰 / 任意分隔 转下划线小写，如 conversationId -> conversation_id
function toSnake(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .toLowerCase()
    .replace(/^_+|_+$/g, '')
}

function singular(name: string): string {
  if (/ies$/.test(name)) return name.replace(/ies$/, 'y')
  if (/s$/.test(name) && !/ss$/.test(name)) return name.replace(/s$/, '')
  return name
}

export function jsonToJava(json: string, opts: JavaOptions): string {
  const data = JSON.parse(json)
  const classes: ClassDef[] = []
  const usedNames = new Set<string>()

  const uniqueName = (base: string): string => {
    let name = base || 'Item'
    let i = 1
    while (usedNames.has(name)) name = `${base}${i++}`
    usedNames.add(name)
    return name
  }

  const num = (v: number): string => {
    if (Number.isInteger(v)) {
      if (Math.abs(v) > 2147483647) return opts.useWrapper ? 'Long' : 'long'
      return opts.useWrapper ? 'Integer' : 'int'
    }
    return opts.useWrapper ? 'Double' : 'double'
  }

  // 推断某个值的 Java 类型，必要时递归生成类
  const inferType = (value: unknown, keyHint: string): string => {
    if (value === null || value === undefined) return 'Object'
    if (typeof value === 'string') return 'String'
    if (typeof value === 'boolean') return opts.useWrapper ? 'Boolean' : 'boolean'
    if (typeof value === 'number') return num(value)
    if (Array.isArray(value)) {
      const first = value.find((v) => v !== null && v !== undefined)
      const elemType =
        first === undefined ? 'Object' : inferType(first, singular(keyHint))
      return `List<${elemType}>`
    }
    // object
    return buildClass(value as Record<string, unknown>, toPascal(keyHint))
  }

  const buildClass = (obj: Record<string, unknown>, className: string): string => {
    const name = uniqueName(className)
    const def: ClassDef = { name, fields: [] }
    classes.push(def)
    for (const [jsonName, value] of Object.entries(obj)) {
      def.fields.push({
        jsonName,
        javaName: toCamel(jsonName),
        type: inferType(value, jsonName),
      })
    }
    return name
  }

  const rootName = toPascal(opts.rootClassName || 'Root')
  let rootType: string
  if (Array.isArray(data)) {
    const first = data.find((v: unknown) => v !== null && v !== undefined)
    rootType =
      first && typeof first === 'object' && !Array.isArray(first)
        ? `List<${buildClass(first as Record<string, unknown>, rootName)}>`
        : `List<${inferType(first, rootName)}>`
  } else if (data && typeof data === 'object') {
    rootType = buildClass(data as Record<string, unknown>, rootName)
  } else {
    throw new Error('根节点必须是对象或数组')
  }

  return render(classes, opts, rootType)
}

function render(classes: ClassDef[], opts: JavaOptions, rootType: string): string {
  const usesList = classes.some((c) => c.fields.some((f) => f.type.startsWith('List<')))
  const imports: string[] = []
  if (usesList) imports.push('import java.util.List;')
  if (opts.useLombok) imports.push('import lombok.Data;')
  if (opts.annotation === 'jackson')
    imports.push('import com.fasterxml.jackson.annotation.JsonProperty;')
  else if (opts.annotation === 'fastjson')
    imports.push('import com.alibaba.fastjson.annotation.JSONField;')

  const blocks = classes.map((def) => renderClass(def, opts))

  const header = imports.length ? imports.join('\n') + '\n\n' : ''
  const note =
    rootType.startsWith('List<') && classes.length
      ? `// 根节点为数组，请使用：${rootType}\n\n`
      : ''
  return header + note + blocks.join('\n\n') + '\n'
}

function renderClass(def: ClassDef, opts: JavaOptions): string {
  const lines: string[] = []
  if (opts.useLombok) lines.push('@Data')
  lines.push(`public class ${def.name} {`)

  for (const f of def.fields) {
    const snake = toSnake(f.jsonName)
    // 仅在序列化名与驼峰字段名不一致时添加注解，避免冗余
    if (opts.annotation !== 'none' && snake !== f.javaName) {
      if (opts.annotation === 'jackson') {
        lines.push(`    @JsonProperty("${snake}")`)
      } else {
        lines.push(`    @JSONField(name = "${snake}")`)
      }
    }
    lines.push(`    private ${f.type} ${f.javaName};`)
  }

  if (!opts.useLombok) {
    for (const f of def.fields) {
      const cap = f.javaName.charAt(0).toUpperCase() + f.javaName.slice(1)
      lines.push('')
      lines.push(`    public ${f.type} get${cap}() {`)
      lines.push(`        return ${f.javaName};`)
      lines.push('    }')
      lines.push('')
      lines.push(`    public void set${cap}(${f.type} ${f.javaName}) {`)
      lines.push(`        this.${f.javaName} = ${f.javaName};`)
      lines.push('    }')
    }
  }

  lines.push('}')
  return lines.join('\n')
}
