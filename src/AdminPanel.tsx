import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { lineLabel, money, type Cookie, type CookieEffect, type CookieLine, type PackSize } from './data/cookieclub'
import { adminToken, ccApi, setAdminToken } from './api'
import { useCatalog } from './catalog'

type Change = { id: string; at: string; kind: string; detail: string }

const COOKIE_COLORS: Record<string, string> = {
  'vainilla-chips': '#c9a06a',
  'doble-chocolate': '#e0b56a',
  'red-velvet': '#8a2432',
  'vainilla-mousse': '#c47a2a',
  'chocolate-ddl': '#3a2218',
  'red-velvet-frosting': '#d4727e',
}
const FALLBACK_COLORS = ['#5c3a2a', '#8a6848', '#4a2a18', '#a35d3a', '#7a2430', '#2f2118']

function cookieColor(slug: string, index: number) {
  return COOKIE_COLORS[slug] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

type SaleSlice = { slug: string; name: string; unidades: number; color: string }

function sliceLuma(color: string) {
  const hex = color.replace('#', '')
  const n = parseInt(hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return (r * 299 + g * 587 + b * 114) / 1000
}

function PercentLabel({
  cx = 0,
  cy = 0,
  midAngle = 0,
  innerRadius = 0,
  outerRadius = 0,
  percent = 0,
  payload,
}: {
  cx?: number
  cy?: number
  midAngle?: number
  innerRadius?: number
  outerRadius?: number
  percent?: number
  payload?: SaleSlice
}) {
  if (percent < 0.06) return null
  const radian = (Math.PI / 180) * midAngle
  const radius = innerRadius + (outerRadius - innerRadius) * 0.52
  const x = cx + radius * Math.cos(-radian)
  const y = cy + radius * Math.sin(-radian)
  const light = payload?.color ? sliceLuma(payload.color) > 140 : false
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fill={light ? '#3a2218' : '#f7f1e8'}
      fontSize={12}
      fontWeight={600}
      fontFamily="Manrope, sans-serif"
    >
      {Math.round(percent * 100)}%
    </text>
  )
}

function SalesDonut({ sales }: { sales: SaleSlice[] }) {
  const [active, setActive] = useState<string | null>(null)
  const total = sales.reduce((sum, item) => sum + item.unidades, 0)
  const selected = sales.find((item) => item.slug === active)
  const pct = selected && total ? Math.round((selected.unidades / total) * 100) : 0

  return (
    <div>
      <div className="relative mx-auto h-72 w-full max-w-sm">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sales}
              dataKey="unidades"
              nameKey="name"
              innerRadius="58%"
              outerRadius="92%"
              paddingAngle={2}
              stroke="#f7f1e8"
              strokeWidth={3}
              label={PercentLabel}
              labelLine={false}
              onClick={(entry) => {
                const slug = (entry as unknown as SaleSlice | undefined)?.slug
                if (!slug) return
                setActive((current) => (current === slug ? null : slug))
              }}
            >
              {sales.map((item) => (
                <Cell
                  key={item.slug}
                  fill={item.color}
                  fillOpacity={!active || active === item.slug ? 1 : 0.28}
                  style={{ cursor: 'pointer', outline: 'none', transition: 'fill-opacity 180ms ease' }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="max-w-[46%] text-center">
            {selected ? (
              <>
                <p className="display text-lg leading-tight">{selected.name}</p>
                <p className="mt-1 text-[11px] tracking-[0.14em] uppercase text-[#8a6848]">
                  {selected.unidades} u. · {pct}%
                </p>
              </>
            ) : (
              <p className="text-[11px] tracking-[0.14em] uppercase text-[#8a6848]">Tocá una porción</p>
            )}
          </div>
        </div>
      </div>
      <ul className="mt-4 divide-y divide-[#5c3a2a]/10">
        {sales.map((item) => {
          const on = !active || active === item.slug
          return (
            <li key={item.slug}>
              <button
                type="button"
                onClick={() => setActive((current) => (current === item.slug ? null : item.slug))}
                className={`flex w-full items-center gap-3 py-3 text-left text-sm transition-opacity ${on ? 'opacity-100' : 'opacity-35'}`}
              >
                <span className="size-3 shrink-0 rounded-full" style={{ background: item.color }} />
                <span className="min-w-0 flex-1">{item.name}</span>
                <span className="tabular-nums text-[#5c3a2a]/70">{item.unidades}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

type StoredOrder = {
  id: string
  at: string
  name: string
  phone: string
  pack: number
  line: string
  bake: string
  items: { slug: string; name: string; qty: number }[]
  total: number
  mode: string
  day: string
  time: string
}

export function AdminPanel() {
  const [token, setToken] = useState(adminToken)
  const [error, setError] = useState('')
  const leave = useCallback(() => {
    setAdminToken('')
    setToken('')
  }, [])

  if (!token) {
    return (
      <Login
        onDone={(next) => {
          setAdminToken(next)
          setToken(next)
          setError('')
        }}
      />
    )
  }

  return (
    <Desk
      error={error}
      onError={setError}
      onLeave={leave}
    />
  )
}

function Login({ onDone }: { onDone: (token: string) => void }) {
  const [error, setError] = useState('')

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const password = String(new FormData(event.currentTarget).get('password') ?? '')
    try {
      const data = await ccApi<{ token: string }>('/api/cc/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      })
      onDone(data.token)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo entrar')
    }
  }

  return (
    <section className="cc-stack mx-auto max-w-md px-5 py-7">
      <h1 className="display text-5xl">Panel</h1>
      <p className="text-sm text-[#5c3a2a]/70">Entrá para cambiar precios, fotos y ver los pedidos.</p>
      <form onSubmit={onSubmit} className="cc-stack">
        <input
          name="password"
          type="password"
          required
          placeholder="Clave"
          className="rounded-2xl border border-[#5c3a2a]/20 bg-white px-4 py-3 text-sm"
        />
        <button className="w-fit rounded-full bg-[#5c3a2a] px-5 py-3 text-[11px] tracking-[0.14em] uppercase text-[#f6f0e6]">
          Entrar
        </button>
        {error && <p className="text-sm text-[#8a4030]">{error}</p>}
      </form>
    </section>
  )
}

function Desk({ onLeave, error, onError }: { onLeave: () => void; error: string; onError: (value: string) => void }) {
  const { cookies, prices, saveCookie, removeCookie, setPrices } = useCatalog()
  const [tab, setTab] = useState<'precios' | 'galletas' | 'pedidos' | 'cambios'>('precios')
  const [orders, setOrders] = useState<StoredOrder[]>([])
  const [changes, setChanges] = useState<Change[]>([])
  const [packPrices, setPackPrices] = useState(prices)
  const [saved, setSaved] = useState('')

  useEffect(() => {
    setPackPrices(prices)
  }, [prices])

  useEffect(() => {
    let live = true
    ccApi<{ orders: StoredOrder[]; changes?: Change[] }>('/api/cc/orders')
      .then((data) => {
        if (!live) return
        setOrders(data.orders)
        setChanges(data.changes ?? [])
      })
      .catch((reason) => {
        if (!live) return
        if (reason instanceof Error && /panel|clave/i.test(reason.message)) onLeave()
        else onError(reason instanceof Error ? reason.message : 'No se pudieron leer los pedidos')
      })
    return () => {
      live = false
    }
  }, [onLeave, onError])

  const sales = useMemo(() => {
    const totals = new Map<string, { name: string; slug: string; unidades: number }>()
    for (const order of orders) {
      for (const item of order.items) {
        const slug = item.slug || item.name
        const current = totals.get(slug) ?? { name: item.name, slug, unidades: 0 }
        current.unidades += item.qty
        totals.set(slug, current)
      }
    }
    return [...totals.values()]
      .sort((a, b) => b.unidades - a.unidades)
      .map((item, index) => ({
        ...item,
        name: cookies.find((cookie) => cookie.slug === item.slug)?.name ?? item.name,
        color: cookieColor(item.slug, index),
      }))
  }, [cookies, orders])

  async function onPrices(event: FormEvent) {
    event.preventDefault()
    try {
      await setPrices(packPrices)
      setSaved('Precios guardados.')
      onError('')
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : 'No se guardaron los precios')
    }
  }

  const tabs = [
    ['precios', 'Precios'],
    ['galletas', 'Galletas'],
    ['pedidos', 'Pedidos'],
    ['cambios', 'Cambios'],
  ] as const

  return (
    <section className="cc-stack mx-auto max-w-4xl px-5 py-7">
      <div className="flex items-end justify-between gap-4">
        <h1 className="display text-5xl">Panel</h1>
        <button type="button" onClick={onLeave} className="text-[11px] tracking-[0.14em] uppercase text-[#8a6848]">
          Salir
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tabs.map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={tab === id ? 'rounded-full bg-[#5c3a2a] px-4 py-2 text-[11px] tracking-[0.12em] uppercase text-[#f6f0e6]' : 'rounded-full border border-[#5c3a2a]/25 px-4 py-2 text-[11px] tracking-[0.12em] uppercase'}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'precios' && (
        <form onSubmit={onPrices} className="cc-stack">
          <h2 className="text-[12px] tracking-[0.22em] uppercase text-[#8a6848]">Precios de los packs</h2>
          {(['clasica', 'rellena'] as CookieLine[]).map((family) => (
            <div key={family} className="grid grid-cols-2 gap-7">
              {([6, 12] as PackSize[]).map((size) => (
                <label key={size} className="text-xs tracking-[0.12em] uppercase text-[#8a6848]">
                  {lineLabel(family)} x{size}
                  <input
                    type="number"
                    min={0}
                    value={packPrices[family][size]}
                    onChange={(event) =>
                      setPackPrices((current) => ({
                        ...current,
                        [family]: { ...current[family], [size]: Number(event.target.value) },
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-[#5c3a2a]/20 bg-white px-3 py-3 text-sm normal-case tracking-normal"
                  />
                </label>
              ))}
            </div>
          ))}
          <button className="w-fit rounded-full bg-[#5c3a2a] px-5 py-3 text-[11px] tracking-[0.14em] uppercase text-[#f6f0e6]">
            Guardar precios
          </button>
        </form>
      )}

      {tab === 'galletas' && (
        <CookieForm
          cookies={cookies}
          onSave={async (cookie) => {
            await saveCookie(cookie)
            setSaved('Galleta guardada.')
          }}
          onRemove={async (slug) => {
            if (cookies.length <= 1) return
            await removeCookie(slug)
            setSaved('Galleta quitada.')
          }}
          onError={onError}
        />
      )}

      {tab === 'pedidos' && (
        <div className="cc-stack">
          <p className="text-sm text-[#5c3a2a]/70">
            {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
            {sales[0] ? ` · se vende más ${sales[0].name}` : ''}
          </p>
          {sales.length > 0 ? (
            <SalesDonut sales={sales} />
          ) : (
            <p className="text-sm text-[#5c3a2a]/70">Cuando alguien reserve, el gráfico muestra qué galleta sale más.</p>
          )}
          <ul className="divide-y divide-[#5c3a2a]/10">
            {orders.map((order) => (
              <li key={order.id} className="cc-stack py-7">
                <p className="text-sm">
                  {new Date(order.at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })} · {order.name}
                </p>
                <p className="text-sm text-[#5c3a2a]/70">
                  {order.phone} · x{order.pack} {order.line} · {order.bake} · {money(order.total)}
                </p>
                <p className="text-sm text-[#5c3a2a]/70">
                  {order.items.map((item) => `${item.qty} ${item.name}`).join(' · ')}
                </p>
                <p className="text-sm text-[#5c3a2a]/60">
                  {order.mode} · {order.day} · {order.time}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'cambios' && (
        <div>
          {changes.length === 0 ? (
            <p className="text-sm text-[#5c3a2a]/70">Todavía no hay cambios. Precios, galletas y pedidos quedan en el servidor.</p>
          ) : (
            <ul className="divide-y divide-[#5c3a2a]/10">
              {changes.map((change) => (
                <li key={change.id} className="py-4 text-sm">
                  {new Date(change.at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })} · {change.detail}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {saved && <p className="text-sm">{saved}</p>}
      {error && <p className="text-sm text-[#8a4030]">{error}</p>}
    </section>
  )
}

function CookieForm({
  cookies,
  onSave,
  onRemove,
  onError,
}: {
  cookies: Cookie[]
  onSave: (cookie: Cookie) => Promise<void>
  onRemove: (slug: string) => Promise<void>
  onError: (value: string) => void
}) {
  const [slug, setSlug] = useState('')
  const [name, setName] = useState('')
  const [line, setLine] = useState<CookieLine>('clasica')
  const [grams, setGrams] = useState('80')
  const [inside, setInside] = useState('')
  const [blurb, setBlurb] = useState('')
  const [image, setImage] = useState('')
  const [effect, setEffect] = useState<CookieEffect>('chips')

  function load(cookie: Cookie) {
    setSlug(cookie.slug)
    setName(cookie.name)
    setLine(cookie.line)
    setGrams(String(cookie.grams))
    setInside(cookie.inside)
    setBlurb(cookie.blurb)
    setImage(cookie.image)
    setEffect(cookie.effect)
  }

  function reset() {
    setSlug('')
    setName('')
    setLine('clasica')
    setGrams('80')
    setInside('')
    setBlurb('')
    setImage('')
    setEffect('chips')
  }

  async function onFile(file: File) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('imagen'))
      reader.readAsDataURL(file)
    })
    const uploaded = await ccApi<{ url: string }>('/api/cc/upload', {
      method: 'POST',
      body: JSON.stringify({ dataUrl }),
    })
    setImage(uploaded.url)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const nextSlug =
      slug ||
      name
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    if (!nextSlug || !name || !image) return
    try {
      await onSave({
        slug: nextSlug,
        name,
        line,
        grams: Number(grams) || 80,
        inside: inside || name,
        blurb: blurb || inside || name,
        image,
        effect,
        effectLabel: '',
        keywords: name.toLowerCase().split(/\s+/),
      })
      onError('')
      if (!slug) reset()
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : 'No se guardó la galleta')
    }
  }

  return (
    <div className="cc-stack">
      <h2 className="text-[12px] tracking-[0.22em] uppercase text-[#8a6848]">Galletas</h2>
      <ul className="divide-y divide-[#5c3a2a]/10">
        {cookies.map((cookie) => (
          <li key={cookie.slug} className="flex items-center gap-7 py-7">
            <img src={cookie.image} alt="" className="size-16 object-contain" />
            <button type="button" onClick={() => load(cookie)} className="min-w-0 flex-1 text-left">
              <span className="block text-sm">{cookie.name}</span>
              <span className="text-xs text-[#5c3a2a]/55">
                {lineLabel(cookie.line)} · {cookie.grams} g
              </span>
            </button>
            <button
              type="button"
              className="text-xs tracking-[0.12em] uppercase text-[#8a4030]"
              onClick={() => void onRemove(cookie.slug)}
            >
              Quitar
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={(event) => void onSubmit(event)} className="cc-stack">
        <h2 className="text-[12px] tracking-[0.22em] uppercase text-[#8a6848]">{slug ? 'Editar galleta' : 'Nueva galleta'}</h2>
        <input value={name} onChange={(event) => setName(event.target.value)} required placeholder="Nombre" className="rounded-2xl border border-[#5c3a2a]/20 bg-white px-3 py-3 text-sm" />
        <div className="flex flex-wrap gap-3">
          {(['clasica', 'rellena'] as CookieLine[]).map((family) => (
            <button
              key={family}
              type="button"
              onClick={() => setLine(family)}
              className={
                line === family
                  ? 'rounded-full bg-[#5c3a2a] px-4 py-2 text-[11px] tracking-[0.12em] uppercase text-[#f6f0e6]'
                  : 'rounded-full border border-[#5c3a2a]/25 px-4 py-2 text-[11px] tracking-[0.12em] uppercase'
              }
            >
              {lineLabel(family)}
            </button>
          ))}
        </div>
        <input value={grams} onChange={(event) => setGrams(event.target.value)} type="number" min={1} placeholder="Gramos" className="rounded-2xl border border-[#5c3a2a]/20 bg-white px-3 py-3 text-sm" />
        <textarea value={blurb} onChange={(event) => setBlurb(event.target.value)} rows={3} placeholder="Descripción" className="rounded-2xl border border-[#5c3a2a]/20 bg-white px-3 py-3 text-sm" />
        <textarea value={inside} onChange={(event) => setInside(event.target.value)} rows={2} placeholder="Qué lleva adentro" className="rounded-2xl border border-[#5c3a2a]/20 bg-white px-3 py-3 text-sm" />
        <label className="text-sm">
          Foto
          <input
            type="file"
            accept="image/*"
            className="mt-2 block w-full text-sm"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void onFile(file).catch((reason) => onError(reason instanceof Error ? reason.message : 'No se subió la foto'))
            }}
          />
        </label>
        {image && <img src={image} alt="" className="w-40" />}
        <label className="text-xs tracking-[0.12em] uppercase text-[#8a6848]">
          Efecto al abrirla
          <select
            value={effect}
            onChange={(event) => setEffect(event.target.value as CookieEffect)}
            className="mt-2 w-full rounded-2xl border border-[#5c3a2a]/20 bg-white px-3 py-3 text-sm normal-case tracking-normal"
          >
            <option value="chips">Chips</option>
            <option value="chocolate">Chocolate</option>
            <option value="velvet">Red velvet</option>
            <option value="mousse">Mousse</option>
            <option value="ddl">Dulce de leche</option>
            <option value="frosting">Frosting</option>
          </select>
        </label>
        <div className="flex flex-wrap gap-3">
          <button className="rounded-full bg-[#5c3a2a] px-5 py-3 text-[11px] tracking-[0.14em] uppercase text-[#f6f0e6]">
            {slug ? 'Actualizar' : 'Agregar'}
          </button>
          {slug && (
            <button type="button" onClick={reset} className="rounded-full border border-[#5c3a2a]/25 px-5 py-3 text-[11px] tracking-[0.14em] uppercase">
              Nueva
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
