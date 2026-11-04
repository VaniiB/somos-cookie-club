import crypto from 'node:crypto'
import { cookiePrices, cookies as seedCookies, type Cookie, type CookieLine, type PackSize } from '../src/data/cookieclub.ts'

export type OrderItem = { slug: string; name: string; qty: number }

export type StoredOrder = {
  id: string
  at: string
  name: string
  phone: string
  pack: number
  line: string
  bake: string
  items: OrderItem[]
  total: number
  mode: string
  address: string
  day: string
  time: string
  note: string
}

export type Change = {
  id: string
  at: string
  kind: string
  detail: string
}

export type Store = {
  catalogVersion: number
  cookies: Cookie[]
  prices: Record<CookieLine, Record<PackSize, number>>
  orders: StoredOrder[]
  changes: Change[]
}

export const CATALOG_VERSION = 11

export function sampleOrders(): StoredOrder[] {
  const ago = (days: number, hour: number) => {
    const date = new Date()
    date.setDate(date.getDate() - days)
    date.setHours(hour, 20, 0, 0)
    return date.toISOString()
  }
  const item = (slug: string, name: string, qty: number) => ({ slug, name, qty })
  return [
    {
      id: 'demo01',
      at: ago(1, 10),
      name: 'Luz',
      phone: '1124862658',
      pack: 6,
      line: 'clasica',
      bake: 'horneada',
      items: [
        item('vainilla-chips', 'Clásica con Chips', 3),
        item('doble-chocolate', 'Doble chocolate', 2),
        item('red-velvet', 'Red velvet', 1),
      ],
      total: 18800,
      mode: 'retiro',
      address: 'Av. Cerviño y Lafinur',
      day: 'Hoy',
      time: '10:00',
      note: '',
    },
    {
      id: 'demo02',
      at: ago(2, 12),
      name: 'Martín',
      phone: '1133334444',
      pack: 12,
      line: 'rellena',
      bake: 'congelada',
      items: [
        item('vainilla-mousse', 'Vainilla rellena de mousse de chocolate', 5),
        item('chocolate-ddl', 'Chocolate rellena de dulce de leche', 4),
        item('red-velvet-frosting', 'Red velvet rellena de frosting de queso', 3),
      ],
      total: 51800,
      mode: 'envio',
      address: 'Av. Santa Fe 3200',
      day: '2026-11-03',
      time: '11:30',
      note: '',
    },
    {
      id: 'demo03',
      at: ago(3, 9),
      name: 'Sofi',
      phone: '1144445555',
      pack: 6,
      line: 'rellena',
      bake: 'horneada',
      items: [
        item('chocolate-ddl', 'Chocolate rellena de dulce de leche', 4),
        item('vainilla-mousse', 'Vainilla rellena de mousse de chocolate', 2),
      ],
      total: 25800,
      mode: 'retiro',
      address: 'Av. Cerviño y Lafinur',
      day: 'Hoy',
      time: '09:30',
      note: '',
    },
    {
      id: 'demo04',
      at: ago(4, 14),
      name: 'Nico',
      phone: '1155556666',
      pack: 12,
      line: 'clasica',
      bake: 'horneada',
      items: [
        item('vainilla-chips', 'Clásica con Chips', 6),
        item('doble-chocolate', 'Doble chocolate', 4),
        item('red-velvet', 'Red velvet', 2),
      ],
      total: 32800,
      mode: 'envio',
      address: 'Av. Cabildo 2100',
      day: 'Hoy',
      time: '13:00',
      note: 'Timbre 3B',
    },
    {
      id: 'demo05',
      at: ago(5, 11),
      name: 'Vale',
      phone: '1166667777',
      pack: 6,
      line: 'clasica',
      bake: 'congelada',
      items: [
        item('red-velvet', 'Red velvet', 3),
        item('vainilla-chips', 'Clásica con Chips', 3),
      ],
      total: 18800,
      mode: 'retiro',
      address: 'Av. Cerviño y Lafinur',
      day: 'Hoy',
      time: '11:00',
      note: '',
    },
    {
      id: 'demo06',
      at: ago(6, 15),
      name: 'Fran',
      phone: '1177778888',
      pack: 12,
      line: 'rellena',
      bake: 'horneada',
      items: [
        item('red-velvet-frosting', 'Red velvet rellena de frosting de queso', 6),
        item('chocolate-ddl', 'Chocolate rellena de dulce de leche', 6),
      ],
      total: 51800,
      mode: 'envio',
      address: 'Av. Córdoba 4500',
      day: 'Hoy',
      time: '14:30',
      note: '',
    },
  ]
}

export function freshStore(): Store {
  return {
    catalogVersion: CATALOG_VERSION,
    cookies: seedCookies.map((cookie) => ({ ...cookie })),
    prices: {
      clasica: { ...cookiePrices.clasica },
      rellena: { ...cookiePrices.rellena },
    },
    orders: sampleOrders(),
    changes: [
      {
        id: 'seed01',
        at: new Date().toISOString(),
        kind: 'pedido',
        detail: 'Pedidos de ejemplo para el panel',
      },
    ],
  }
}

export function hydrateStore(parsed: Store | null | undefined): Store {
  const fresh = freshStore()
  if (!parsed?.prices?.clasica || !parsed.prices?.rellena) return fresh
  const orders = Array.isArray(parsed.orders) && parsed.orders.length ? parsed.orders : sampleOrders()
  const changes = Array.isArray(parsed.changes) ? parsed.changes : []
  if ((parsed.catalogVersion ?? 1) < CATALOG_VERSION || !parsed.cookies?.length) {
    return { ...fresh, prices: parsed.prices, orders, changes }
  }
  return { ...fresh, ...parsed, orders, changes, catalogVersion: CATALOG_VERSION }
}

function remember(store: Store, kind: string, detail: string) {
  store.changes.unshift({
    id: crypto.randomBytes(4).toString('hex'),
    at: new Date().toISOString(),
    kind,
    detail,
  })
  store.changes = store.changes.slice(0, 200)
}

export function tokenOk(header: string | undefined, secret: string) {
  if (!header?.startsWith('Bearer ')) return false
  const token = header.slice('Bearer '.length)
  const [body, sig] = token.split('.')
  if (!body || !sig) return false
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url')
  const left = Buffer.from(sig)
  const right = Buffer.from(expected)
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return false
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as { exp?: number }
    return typeof payload.exp === 'number' && payload.exp > Date.now()
  } catch {
    return false
  }
}

export function makeToken(secret: string) {
  const body = Buffer.from(JSON.stringify({ exp: Date.now() + 1000 * 60 * 60 * 12 })).toString('base64url')
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function samePassword(input: string, password: string) {
  const left = Buffer.from(password)
  const right = Buffer.from(input)
  if (left.length !== right.length) return false
  return crypto.timingSafeEqual(left, right)
}

export type CcResult = { status: number; json: unknown }

export async function handleCc(
  req: { method: string; path: string; authorization?: string; body: unknown },
  io: { load: () => Store | Promise<Store>; save: (store: Store) => void | Promise<void>; secret: string; password: string },
): Promise<CcResult> {
  const url = req.path.split('?')[0]
  const auth = tokenOk(req.authorization, io.secret)

  if (req.method === 'POST' && url === '/api/cc/login') {
    const body = (req.body ?? {}) as { password?: string }
    if (!samePassword(String(body.password ?? ''), io.password)) {
      return { status: 401, json: { error: 'Clave incorrecta' } }
    }
    return { status: 200, json: { token: makeToken(io.secret) } }
  }

  if (req.method === 'GET' && url === '/api/cc/catalog') {
    const store = await io.load()
    return { status: 200, json: { cookies: store.cookies, prices: store.prices } }
  }

  if (req.method === 'PUT' && url === '/api/cc/catalog') {
    if (!auth) return { status: 401, json: { error: 'Entrá al panel' } }
    const body = (req.body ?? {}) as Partial<Store>
    const current = await io.load()
    if (!body.cookies?.length || !body.prices?.clasica || !body.prices?.rellena) {
      return { status: 400, json: { error: 'Catálogo incompleto' } }
    }
    const next = { ...current, cookies: body.cookies, prices: body.prices, catalogVersion: CATALOG_VERSION }
    if (JSON.stringify(current.prices) !== JSON.stringify(body.prices)) {
      remember(next, 'precios', 'Actualizó los precios de los packs')
    }
    if (JSON.stringify(current.cookies) !== JSON.stringify(body.cookies)) {
      remember(next, 'galletas', 'Modificó galletas, fotos o descripciones')
    }
    await io.save(next)
    return { status: 200, json: { ok: true } }
  }

  if (req.method === 'POST' && url === '/api/cc/upload') {
    if (!auth) return { status: 401, json: { error: 'Entrá al panel' } }
    const body = (req.body ?? {}) as { dataUrl?: string }
    const match = String(body.dataUrl ?? '').match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
    if (!match) return { status: 400, json: { error: 'La foto no se pudo leer' } }
    return { status: 200, json: { url: body.dataUrl } }
  }

  if (req.method === 'POST' && url === '/api/cc/orders') {
    const body = (req.body ?? {}) as Partial<StoredOrder>
    if (!body.name || !body.phone || !Array.isArray(body.items) || !body.items.length) {
      return { status: 400, json: { error: 'Pedido incompleto' } }
    }
    const store = await io.load()
    const orderName = String(body.name)
    store.orders.unshift({
      id: crypto.randomBytes(6).toString('hex'),
      at: new Date().toISOString(),
      name: String(body.name),
      phone: String(body.phone),
      pack: Number(body.pack) || 6,
      line: String(body.line ?? ''),
      bake: String(body.bake ?? ''),
      items: body.items.map((item) => ({
        slug: String(item.slug),
        name: String(item.name),
        qty: Number(item.qty) || 0,
      })),
      total: Number(body.total) || 0,
      mode: String(body.mode ?? ''),
      address: String(body.address ?? ''),
      day: String(body.day ?? ''),
      time: String(body.time ?? ''),
      note: String(body.note ?? ''),
    })
    remember(store, 'pedido', `${orderName} · pack x${Number(body.pack) || 6} ${String(body.line ?? '')}`)
    await io.save(store)
    return { status: 200, json: { ok: true } }
  }

  if (req.method === 'GET' && url === '/api/cc/orders') {
    if (!auth) return { status: 401, json: { error: 'Entrá al panel' } }
    const store = await io.load()
    return { status: 200, json: { orders: store.orders, changes: store.changes } }
  }

  if (req.method === 'OPTIONS') return { status: 204, json: {} }
  return { status: 404, json: { error: 'No existe' } }
}
