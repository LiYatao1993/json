export interface CronFields {
  second: Set<number>
  minute: Set<number>
  hour: Set<number>
  dom: Set<number>
  month: Set<number>
  dow: Set<number>
  secondStar: boolean
  minuteStar: boolean
  hourStar: boolean
  domStar: boolean
  monthStar: boolean
  dowStar: boolean
}

const MONTH_NAMES: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
}
const DOW_NAMES: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
}

const DOW_TEXT = ['日', '一', '二', '三', '四', '五', '六']

function parseField(
  raw: string,
  min: number,
  max: number,
  names?: Record<string, number>,
): { set: Set<number>; star: boolean } {
  const field = raw.trim().toLowerCase()
  if (field === '*' || field === '?') {
    const set = new Set<number>()
    for (let i = min; i <= max; i++) set.add(i)
    return { set, star: true }
  }

  const set = new Set<number>()
  const resolve = (tok: string): number => {
    if (names && tok in names) return names[tok]
    const n = Number(tok)
    if (!Number.isInteger(n)) throw new Error(`无效的值：${tok}`)
    return n
  }

  for (const part of field.split(',')) {
    let step = 1
    let rangePart = part
    if (part.includes('/')) {
      const [base, s] = part.split('/')
      step = Number(s)
      if (!Number.isInteger(step) || step <= 0) throw new Error(`无效的步长：${part}`)
      rangePart = base
    }

    let start = min
    let end = max
    if (rangePart === '*' || rangePart === '') {
      // 保持全范围
    } else if (rangePart.includes('-')) {
      const [a, b] = rangePart.split('-')
      start = resolve(a)
      end = resolve(b)
    } else {
      start = resolve(rangePart)
      end = part.includes('/') ? max : start
    }

    if (start < min || end > max || start > end) {
      throw new Error(`超出范围 [${min}-${max}]：${part}`)
    }
    for (let i = start; i <= end; i += step) set.add(i)
  }

  if (!set.size) throw new Error('字段为空')
  return { set, star: false }
}

export function parseCron(
  expr: string,
  hasSeconds: boolean,
): { fields: CronFields } | { error: string } {
  const tokens = expr.trim().split(/\s+/).filter(Boolean)
  const expected = hasSeconds ? 6 : 5
  if (tokens.length !== expected) {
    return {
      error: `需要 ${expected} 个字段，当前为 ${tokens.length} 个`,
    }
  }

  try {
    const idx = hasSeconds ? 1 : 0
    const second = hasSeconds
      ? parseField(tokens[0], 0, 59)
      : { set: new Set([0]), star: false }
    const minute = parseField(tokens[idx], 0, 59)
    const hour = parseField(tokens[idx + 1], 0, 23)
    const dom = parseField(tokens[idx + 2], 1, 31)
    const month = parseField(tokens[idx + 3], 1, 12, MONTH_NAMES)
    const dowRaw = parseField(tokens[idx + 4], 0, 7, DOW_NAMES)

    // 归一化星期：7 视为 0（周日）
    const dow = new Set<number>()
    dowRaw.set.forEach((v) => dow.add(v === 7 ? 0 : v))

    return {
      fields: {
        second: second.set,
        minute: minute.set,
        hour: hour.set,
        dom: dom.set,
        month: month.set,
        dow,
        secondStar: second.star,
        minuteStar: minute.star,
        hourStar: hour.star,
        domStar: dom.star,
        monthStar: month.star,
        dowStar: dowRaw.star,
      },
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : '解析失败' }
  }
}

function dayMatches(d: Date, f: CronFields): boolean {
  const domOk = f.dom.has(d.getDate())
  const dowOk = f.dow.has(d.getDay())
  if (f.domStar && f.dowStar) return true
  if (f.domStar) return dowOk
  if (f.dowStar) return domOk
  return domOk || dowOk
}

export function nextRuns(
  f: CronFields,
  hasSeconds: boolean,
  count: number,
  from: Date = new Date(),
): Date[] {
  const results: Date[] = []
  const d = new Date(from.getTime())
  d.setMilliseconds(0)
  if (hasSeconds) d.setSeconds(d.getSeconds() + 1)
  else {
    d.setSeconds(0)
    d.setMinutes(d.getMinutes() + 1)
  }

  let guard = 0
  while (results.length < count && guard++ < 200000) {
    if (!f.month.has(d.getMonth() + 1)) {
      d.setMonth(d.getMonth() + 1, 1)
      d.setHours(0, 0, 0, 0)
      continue
    }
    if (!dayMatches(d, f)) {
      d.setDate(d.getDate() + 1)
      d.setHours(0, 0, 0, 0)
      continue
    }
    if (!f.hour.has(d.getHours())) {
      d.setHours(d.getHours() + 1, 0, 0, 0)
      continue
    }
    if (!f.minute.has(d.getMinutes())) {
      d.setMinutes(d.getMinutes() + 1, 0, 0)
      continue
    }
    if (hasSeconds && !f.second.has(d.getSeconds())) {
      d.setSeconds(d.getSeconds() + 1)
      continue
    }
    results.push(new Date(d.getTime()))
    if (hasSeconds) d.setSeconds(d.getSeconds() + 1)
    else d.setMinutes(d.getMinutes() + 1)
  }
  return results
}

function listOf(set: Set<number>, fmt: (n: number) => string): string {
  return [...set]
    .sort((a, b) => a - b)
    .map(fmt)
    .join('、')
}

export function describeCron(f: CronFields, hasSeconds: boolean): string {
  const parts: string[] = []
  parts.push(f.monthStar ? '每月' : `${listOf(f.month, (n) => `${n}`)} 月`)

  if (f.domStar && f.dowStar) {
    parts.push('每天')
  } else {
    const seg: string[] = []
    if (!f.domStar) seg.push(`${listOf(f.dom, (n) => `${n}`)} 号`)
    if (!f.dowStar) seg.push(`周 ${listOf(f.dow, (n) => DOW_TEXT[n])}`)
    parts.push(seg.join(' 且 '))
  }

  const hour = f.hourStar ? '每小时' : `${listOf(f.hour, (n) => `${n}`)} 时`
  const minute = f.minuteStar ? '每分' : `${listOf(f.minute, (n) => `${n}`)} 分`
  let time = `${hour} ${minute}`
  if (hasSeconds) {
    time += ' ' + (f.secondStar ? '每秒' : `${listOf(f.second, (n) => `${n}`)} 秒`)
  }
  parts.push(time)

  return parts.join('，') + ' 执行'
}

export function formatDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  const week = '日一二三四五六'[d.getDay()]
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(
    d.getHours(),
  )}:${p(d.getMinutes())}:${p(d.getSeconds())} 周${week}`
}
