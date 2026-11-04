export type CookieLine = 'clasica' | 'rellena'
export type CookieEffect = 'chips' | 'chocolate' | 'velvet' | 'mousse' | 'ddl' | 'frosting'
export type PackSize = 6 | 12
export type Bake = 'horneada' | 'congelada'

export type Cookie = {
  slug: string
  name: string
  shortName?: string
  tagline?: string
  line: CookieLine
  grams: number
  effect: CookieEffect
  effectLabel: string
  blurb: string
  inside: string
  image: string
  keywords?: string[]
}

export const WHATSAPP = '5491124862658'
export const PHONE_LABEL = '+54 9 11 2486-2658'
export const INSTAGRAM = 'https://instagram.com/somos.cookieclub'

export const cookiePrices: Record<CookieLine, Record<PackSize, number>> = {
  clasica: { 6: 18800, 12: 32800 },
  rellena: { 6: 25800, 12: 51800 },
}

export const cookies: Cookie[] = [
  {
    slug: 'vainilla-chips',
    name: 'Clásica con Chips',
    tagline: 'Vainilla y chips de chocolate',
    line: 'clasica',
    grams: 80,
    effect: 'chips',
    effectLabel: 'Llueven chips',
    blurb: 'Crocante por fuera, centro húmedo y chocolate real en cada mordisco. Estilo Nueva York. Sale horneada; si la pedís congelada, 15 minutos a 180°.',
    inside: 'Masa de vainilla y chips de chocolate negro. Sin relleno. 80 g.',
    image: '/cookies/vainilla-chips.png',
    keywords: ['chips', 'vainilla'],
  },
  {
    slug: 'doble-chocolate',
    name: 'Chocolate con Chips',
    tagline: 'Masa de chocolate y chips',
    line: 'clasica',
    grams: 80,
    effect: 'chocolate',
    effectLabel: 'Chorrea chocolate',
    blurb: 'Masa de chocolate con chips en gota. Oscura, densa y con corteza que cruje. Sale horneada; si la pedís congelada, 15 minutos a 180°.',
    inside: 'Masa de chocolate y chips de chocolate en gota. Sin relleno. 80 g.',
    image: '/cookies/doble-chocolate.png',
    keywords: ['doble', 'doble chocolate'],
  },
  {
    slug: 'red-velvet',
    name: 'Red Velvet',
    tagline: 'Miga roja y chocolate blanco',
    line: 'clasica',
    grams: 80,
    effect: 'velvet',
    effectLabel: 'Cae cacao rojo',
    blurb: 'Roja, con trocitos de chocolate blanco y ese perfume a cacao que no es torta de cumpleaños: es cookie. Sale horneada; si la pedís congelada, 15 minutos a 180°.',
    inside: 'Masa red velvet con trocitos de chocolate blanco. Sin relleno. 80 g.',
    image: '/cookies/red-velvet.png',
    keywords: ['red velvet', 'velvet'],
  },
  {
    slug: 'vainilla-mousse',
    name: 'Clásica Rellena',
    tagline: 'Rellena de mousse de chocolate',
    line: 'rellena',
    grams: 120,
    effect: 'mousse',
    effectLabel: 'Chorrea mousse',
    blurb: 'La clásica de vainilla, partida, con un centro de mousse de chocolate. Sale horneada; si la pedís congelada, 15 minutos a 180°.',
    inside: 'Masa de vainilla con chips, rellena de mousse de chocolate. 120 g.',
    image: '/cookies/vainilla-mousse.png?v=2',
    keywords: ['mousse', 'vainilla'],
  },
  {
    slug: 'chocolate-ddl',
    name: 'Chocolate rellena',
    tagline: 'Rellena de dulce de leche',
    line: 'rellena',
    grams: 120,
    effect: 'ddl',
    effectLabel: 'Chorrea dulce de leche',
    blurb: 'La de chocolate, partida, con dulce de leche argentino en el centro. Sale horneada; si la pedís congelada, 15 minutos a 180°.',
    inside: 'Masa de chocolate rellena de dulce de leche. 120 g.',
    image: '/cookies/chocolate-ddl.png?v=2',
    keywords: ['dulce', 'ddl', 'leche', 'chocolate'],
  },
  {
    slug: 'red-velvet-frosting',
    name: 'Red Velvet rellena',
    tagline: 'Rellena de frosting de queso',
    line: 'rellena',
    grams: 120,
    effect: 'frosting',
    effectLabel: 'Chorrea frosting',
    blurb: 'Miga roja, trocitos de chocolate blanco y frosting de queso crema en el centro. Sale horneada; si la pedís congelada, 15 minutos a 180°.',
    inside: 'Masa red velvet rellena de frosting de queso crema. 120 g.',
    image: '/cookies/red-velvet-frosting.png?v=3',
    keywords: ['frosting', 'queso', 'cream', 'red velvet'],
  },
]

export const bakeSteps = [
  {
    step: '01',
    title: 'Precalentá',
    body: 'Si las pedís congeladas: horno a 180° durante 10 minutos. Las cookies esperan en el freezer hasta ese momento.',
  },
  {
    step: '02',
    title: 'Directo del freezer',
    body: 'Ponelas congeladas sobre una bandeja con papel manteca o placa antiadherente. No las descongeles antes.',
  },
  {
    step: '03',
    title: '15 minutos',
    body: 'Hasta que los bordes estén dorados: corteza crocante y centro suave. Si las preferís más crujientes, dos minutos más.',
  },
  {
    step: '04',
    title: 'Cinco de descanso',
    body: 'Sacalas y dejálas enfriar 5 minutos antes de servir. Acompañalas con lo que más te guste.',
  },
]

export const timeSlots = Array.from({ length: 13 }, (_, i) => {
  const minutes = 9 * 60 + i * 30
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
})

export function money(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value)
}

export function lineLabel(line: CookieLine | 'mixto') {
  if (line === 'mixto') return 'Variada'
  return line === 'clasica' ? 'Clásicas' : 'Rellenas'
}

export function packKind(qty: Record<string, number>, list: { slug: string; line: CookieLine }[]): CookieLine | 'mixto' | null {
  const lines = new Set<CookieLine>()
  for (const cookie of list) {
    if ((qty[cookie.slug] ?? 0) > 0) lines.add(cookie.line)
  }
  if (lines.size === 0) return null
  if (lines.size > 1) return 'mixto'
  return [...lines][0]
}

export function packPrice(
  qty: Record<string, number>,
  list: { slug: string; line: CookieLine }[],
  prices: Record<CookieLine, Record<PackSize, number>>,
  pack: PackSize,
) {
  let total = 0
  for (const cookie of list) {
    const n = qty[cookie.slug] ?? 0
    if (!n) continue
    total += n * ((prices[cookie.line]?.[pack] ?? 0) / pack)
  }
  return Math.round(total)
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

export function suggestBox(raw: string, pack: PackSize, list: Cookie[] = cookies) {
  const q = normalize(raw)
  const wantsFilled = /rellen|bomba|mousse|dulce|frosting|queso|ddl/.test(q)
  const wantsClassic = /clasic|chips|sin relleno|crocant/.test(q)
  const mix = wantsFilled && wantsClassic
  const pool = mix
    ? list
    : list.filter((cookie) => cookie.line === (wantsFilled ? 'rellena' : 'clasica'))
  const usePool = pool.length ? pool : list
  if (usePool.length === 0) {
    return { qty: {}, note: 'No hay sabores cargados.' }
  }
  const weights = usePool.map((cookie) => {
    const hits = (cookie.keywords ?? []).reduce((score, keyword) => {
      return q.includes(normalize(keyword)) ? score + keyword.length : score
    }, 0)
    return 2 + hits
  })
  const qty = distribute(pack, usePool.map((cookie) => cookie.slug), weights)
  const note = mix
    ? 'Armé una box variada, clásicas y rellenas juntas.'
    : wantsFilled
      ? 'Pack con rellenas. Podés sumar clásicas en la misma box.'
      : 'Pack con clásicas. Podés sumar rellenas en la misma box.'
  return { qty, note }
}

function distribute(pack: number, slugs: string[], weights: number[]) {
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  const exact = weights.map((weight) => (weight / total) * pack)
  const counts = exact.map((value) => Math.floor(value))
  let left = pack - counts.reduce((sum, count) => sum + count, 0)
  const order = exact
    .map((value, index) => ({ index, rest: value - counts[index] }))
    .sort((a, b) => b.rest - a.rest)
  for (const item of order) {
    if (left <= 0) break
    counts[item.index] += 1
    left -= 1
  }
  const qty: Record<string, number> = {}
  slugs.forEach((slug, index) => {
    if (counts[index] > 0) qty[slug] = counts[index]
  })
  return qty
}
