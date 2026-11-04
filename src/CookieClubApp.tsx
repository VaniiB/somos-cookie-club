import { Component, createContext, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { ShoppingBag } from 'lucide-react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AddressField, isFreeDelivery, type PlacePoint } from './AddressField'
import { AdminPanel } from './AdminPanel'
import { CatalogProvider, useCatalog } from './catalog'
import { ccApi } from './api'
import {
  INSTAGRAM,
  PHONE_LABEL,
  WHATSAPP,
  bakeSteps,
  lineLabel,
  money,
  packKind,
  packPrice,
  suggestBox,
  timeSlots,
  type Bake,
  type Cookie,
  type CookieEffect,
  type CookieLine,
  type PackSize,
} from './data/cookieclub'
import { applySeo } from './seo'
import './cookieclub.css'

const today = new Date().toISOString().slice(0, 10)

type Qty = Record<string, number>

type OrderApi = {
  pack: PackSize
  qty: Qty
  notice: string
  total: number
  line: CookieLine | 'mixto' | null
  bake: Bake
  setPack: (pack: PackSize) => void
  setBake: (bake: Bake) => void
  add: (slug: string, delta: number) => void
  fill: (qty: Qty) => void
  clear: () => void
}

const OrderContext = createContext<OrderApi | null>(null)

function useOrder() {
  const value = useContext(OrderContext)
  if (!value) throw new Error('Pedido fuera del club')
  return value
}

function sum(qty: Qty) {
  return Object.values(qty).reduce((total, count) => total + count, 0)
}


function trim(qty: Qty, max: number) {
  const next = { ...qty }
  let total = sum(next)
  const keys = Object.keys(next)
  for (let index = keys.length - 1; index >= 0 && total > max; index -= 1) {
    const key = keys[index]
    const cut = Math.min(next[key] ?? 0, total - max)
    next[key] = (next[key] ?? 0) - cut
    total -= cut
    if (next[key] === 0) delete next[key]
  }
  return next
}

export function CookieClubApp() {
  return (
    <CatalogProvider>
      <Club />
    </CatalogProvider>
  )
}

class RouteGuard extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed) {
      return (
        <section className="px-5 py-16">
          <p className="text-sm">Algo falló en esta pantalla.</p>
          <Link to="/" className="mt-4 inline-block text-sm underline">
            Volver al inicio
          </Link>
        </section>
      )
    }
    return this.props.children
  }
}

function Club() {
  const catalog = useCatalog()
  const location = useLocation()
  const navigate = useNavigate()
  const [homeTick, setHomeTick] = useState(0)
  const [pack, setPackSize] = useState<PackSize>(6)
  const [qty, setQty] = useState<Qty>({})
  const [notice, setNotice] = useState('')
  const [bake, setBake] = useState<Bake>('horneada')

  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtml = html.style.background
    const prevBody = body.style.background
    html.style.background = '#f7f1e8'
    body.style.background = '#f7f1e8'
    return () => {
      html.style.background = prevHtml
      body.style.background = prevBody
    }
  }, [])

  useEffect(() => {
    applySeo(location.pathname, catalog.cookies)
  }, [catalog.cookies, location.pathname])

  const api = useMemo<OrderApi>(() => {
    const total = sum(qty)
    return {
      pack,
      qty,
      notice,
      total,
      bake,
      line: packKind(qty, catalog.cookies),
      setPack(next) {
        setPackSize(next)
        setQty((current) => trim(current, next))
        setNotice('')
      },
      setBake,
      add(slug, delta) {
        const cookie = catalog.cookies.find((item) => item.slug === slug)
        if (!cookie) return
        setQty((current) => {
          if (delta > 0 && sum(current) >= pack) {
            setNotice(`El pack x${pack} ya está completo.`)
            return current
          }
          const next = { ...current, [slug]: Math.max(0, (current[slug] ?? 0) + delta) }
          if (next[slug] === 0) delete next[slug]
          setNotice('')
          return next
        })
      },
      fill(next) {
        setQty(next)
        setNotice('')
      },
      clear() {
        setQty({})
        setNotice('')
      },
    }
  }, [bake, catalog.cookies, notice, pack, qty])

  return (
    <OrderContext.Provider value={api}>
      <div className="cc-root">
        <div className="cc-grain" aria-hidden />
        <div className="relative z-10 flex min-h-dvh w-full min-w-0 flex-col [&>*]:min-w-0 [&>*]:w-full">
          <header className="sticky top-0 z-[80] grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-[#5c3a2a]/10 bg-[#f7f1e8] px-4 py-3 md:px-10">
            <Link
              to="/"
              className="min-w-0"
              onClick={(event) => {
                const atHome = location.pathname === '/'
                if (!atHome) return
                event.preventDefault()
                window.scrollTo({ top: 0, behavior: 'instant' })
                setHomeTick((tick) => tick + 1)
                navigate('/')
              }}
            >
              <img src="/cookies/logo.png" alt="Somos Cookie Club" className="h-8 w-[7.5rem] object-contain object-left md:h-11 md:w-[12rem]" />
            </Link>
            <nav className="flex items-center gap-4 whitespace-nowrap text-[11px] uppercase tracking-wider text-[#5c3a2a]/80">
              <Link to="/sabores">Sabores</Link>
              <Link to="/pedido" aria-label={`Carrito ${api.total} de ${api.pack}`} className="relative">
                <ShoppingBag className="size-5" strokeWidth={1.6} />
                <span className="absolute -right-2 -top-2 grid min-w-4 place-items-center rounded-full bg-[#5c3a2a] px-1 text-[9px] text-[#f6f0e6]">
                  {api.total}
                </span>
              </Link>
            </nav>
          </header>
          <div className="flex flex-1 flex-col bg-[#f7f1e8]">
            <RouteGuard>
              <Routes>
                <Route index element={<Home key={homeTick} />} />
                <Route path="sabores" element={<Shop />} />
                <Route path="sabores/:slug" element={<Product />} />
                <Route path="pedido" element={<Order />} />
                <Route path="panel" element={<AdminPanel />} />
                <Route path="hornear" element={<Navigate to="/" replace />} />
                <Route path="entregas" element={<Navigate to="/" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </RouteGuard>
          </div>
          <footer className="mt-auto border-t border-[#5c3a2a]/10 px-5 py-8 text-xs text-[#5c3a2a]/70 md:px-10">
            <address className="flex flex-wrap items-center justify-between gap-3 not-italic">
              <p>
                <strong className="font-medium text-[#3a2a22]">Somos Cookie Club</strong>
                {' · '}
                cookies XL en Palermo, Buenos Aires. Delivery a domicilio y retiro en Av. Cerviño y Lafinur, todos los
                días de 9 a 15 hs.
              </p>
              <p className="flex flex-wrap gap-4">
                <a href={INSTAGRAM} target="_blank" rel="noreferrer">
                  @somos.cookieclub
                </a>
                <a href={`https://wa.me/${WHATSAPP}`}>{PHONE_LABEL}</a>
                <Link to="/panel">Panel</Link>
              </p>
            </address>
          </footer>
        </div>
      </div>
    </OrderContext.Provider>
  )
}

function Home() {
  return (
    <section className="flex min-h-[calc(100dvh-3.75rem)] flex-col px-2 md:px-10 md:pb-8">
      <ChipRain />
      <CookieWheel />
    </section>
  )
}

function CookieWheel() {
  const { cookies: list } = useCatalog()
  const n = list.length
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState(false)
  const [wide, setWide] = useState(() => window.matchMedia('(min-width: 768px)').matches)
  const dragging = useRef(false)
  const moved = useRef(false)
  const lastX = useRef(0)
  const acc = useRef(0)
  const order = useOrder()
  const cookie = list[active] ?? list[0]

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const apply = () => setWide(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    if (hover || open || n < 2) return undefined
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return undefined
    const id = window.setInterval(() => setActive((i) => (i + 1) % n), 3200)
    return () => window.clearInterval(id)
  }, [hover, n, open])

  function shift(dir: number) {
    setActive((i) => (i + dir + n) % n)
    setOpen(false)
  }

  function offsetOf(index: number) {
    let d = index - active
    if (d > n / 2) d -= n
    if (d < -n / 2) d += n
    return d
  }

  if (!cookie) return <p className="mt-10 text-sm">El catálogo está vacío.</p>
  const count = order.qty[cookie.slug] ?? 0
  const step = wide ? 360 : 0

  const stage = (
    <div
      className={
        open
          ? 'relative mx-auto h-[min(72vw,46vh)] w-full select-none overflow-hidden'
          : 'relative mx-auto mt-2 min-h-0 w-full flex-1 select-none overflow-hidden md:mt-4 md:h-[min(92vw,640px)] md:flex-none'
      }
      style={{ touchAction: 'pan-y' }}
      onPointerDown={(event) => {
        if (event.button !== 0) return
        dragging.current = true
        moved.current = false
        lastX.current = event.clientX
        acc.current = 0
        event.currentTarget.setPointerCapture(event.pointerId)
      }}
      onPointerMove={(event) => {
        if (!dragging.current) return
        const dx = event.clientX - lastX.current
        lastX.current = event.clientX
        acc.current += dx
        if (Math.abs(acc.current) > 6) moved.current = true
        if (acc.current > 80) {
          shift(-1)
          acc.current = 0
        } else if (acc.current < -80) {
          shift(1)
          acc.current = 0
        }
      }}
      onPointerUp={() => {
        dragging.current = false
      }}
      onPointerCancel={() => {
        dragging.current = false
      }}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setHover(true)
      }}
      onPointerLeave={() => {
        setHover(false)
        dragging.current = false
      }}
    >
      {list.map((item, index) => {
        const d = offsetOf(index)
        const hidden = wide ? Math.abs(d) > 1 : d !== 0
        return (
          <button
            key={item.slug}
            type="button"
            aria-label={item.name}
            className={
              open
                ? 'absolute left-1/2 top-1/2 w-[min(72vw,46vh,560px)] border-0 bg-transparent p-0 transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]'
                : 'absolute left-1/2 top-1/2 w-[min(90vw,calc(100dvh-16rem),620px)] border-0 bg-transparent p-0 transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] md:w-[min(92vw,620px)]'
            }
            style={{
              opacity: hidden ? 0 : 1,
              pointerEvents: hidden ? 'none' : 'auto',
              zIndex: 20 - Math.abs(d),
              transform: `translate(-50%, -50%) translateX(${d * step}px) scale(${d === 0 ? 1 : 0.78})`,
            }}
            onClick={() => {
              if (moved.current) return
              if (d !== 0) {
                setActive(index)
                setOpen(false)
                return
              }
              setOpen(true)
            }}
          >
            <CookieShot src={item.image} spin={d === 0 && wide} alt={`${item.name}, cookie XL en Palermo`} />
          </button>
        )
      })}
    </div>
  )

  return (
    <div className={open ? '' : 'flex min-h-0 flex-1 flex-col'}>
      <p className="shrink-0 pt-6 text-center text-[10px] tracking-[0.22em] uppercase text-[#8a6848] md:pt-10 md:text-[11px] md:tracking-[0.28em]">
        {lineLabel(cookie.line)} · {cookie.grams} g
      </p>
      <h1 className="display mx-auto mt-8 w-full shrink-0 px-4 text-center text-[clamp(1.85rem,7.4vw,4.75rem)] leading-none tracking-[-0.03em] md:mt-10 md:px-0">
        <span className="inline-block whitespace-nowrap">{cookie.shortName ?? cookie.name}</span>
      </h1>
      {cookie.tagline && (
        <p className="mt-3 shrink-0 px-6 text-center text-[10px] tracking-[0.22em] uppercase text-[#8a6848] md:text-[11px] md:tracking-[0.28em]">
          {cookie.tagline}
        </p>
      )}
      {open ? (
        <div className="sticky top-[3.6rem] z-20 -mx-2 bg-[#f7f1e8] px-2 pb-4 pt-2">
          {stage}
          <div className="mt-4 flex justify-center">
            <AddRow cookie={cookie} count={count} />
          </div>
        </div>
      ) : (
        stage
      )}
      {open && (
        <article className="mx-auto max-w-xl px-4 pb-12 pt-6">
          <p className="text-sm leading-relaxed text-[#5c3a2a]/80">{cookie.inside}</p>
          <p className="mt-2 text-sm leading-relaxed text-[#5c3a2a]/65">{cookie.blurb}</p>
          <ol className="mt-5 space-y-2 text-sm leading-relaxed text-[#5c3a2a]/75">
            {bakeSteps.map((item) => (
              <li key={item.step}>
                <span className="text-[#8a6848]">{item.title}. </span>
                {item.body}
              </li>
            ))}
          </ol>
          <button type="button" onClick={() => setOpen(false)} className="mt-6 text-sm text-[#5c3a2a]/60">
            Cerrar
          </button>
        </article>
      )}
      {!open && (
        <p className="shrink-0 py-5 text-center text-[10px] tracking-[0.16em] uppercase text-[#8a6848] md:py-6 md:text-[11px]">
          {String(active + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
          <span className="hidden md:inline"> · Arrastrá para pasar · click para abrir</span>
          <span className="md:hidden"> · Deslizá · tocá para abrir</span>
        </p>
      )}
    </div>
  )
}

function Shop() {
  const { cookies: list, prices } = useCatalog()
  return (
    <section className="px-5 pb-20 md:px-10">
      <ChipRain />
      <h1 className="display pt-6 text-5xl sm:text-6xl">Sabores</h1>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-[#5c3a2a]/70">
        Entrá a cada galleta. El pack se arma después: clásicas y rellenas pueden ir juntas.
      </p>
      {(['clasica', 'rellena'] as CookieLine[]).map((line) => (
        <div key={line} className="mt-14">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#5c3a2a]/15 pb-3">
            <h2 className="text-[12px] tracking-[0.22em] uppercase text-[#8a6848]">{lineLabel(line)}</h2>
            <p className="text-sm text-[#5c3a2a]/70">
              x6 {money(prices[line][6])} · x12 {money(prices[line][12])}
            </p>
          </div>
          <div className="mt-8 grid gap-12 md:grid-cols-3">
            {list
              .filter((cookie) => cookie.line === line)
              .map((cookie) => (
                <Link key={cookie.slug} to={`/sabores/${cookie.slug}`} className="block">
                  <CookieShot src={cookie.image} spin className="mx-auto w-[min(88vw,420px)] md:w-full" alt={`${cookie.name}, cookie XL en Palermo`} />
                  <h3 className="display mt-6 text-3xl leading-tight sm:text-4xl">{cookie.name}</h3>
                  <p className="mt-2 text-sm text-[#5c3a2a]/60">{cookie.grams} g</p>
                </Link>
              ))}
          </div>
        </div>
      ))}
      <div className="mt-16 border-t border-[#5c3a2a]/15 pt-10">
        <h2 className="display text-4xl sm:text-5xl">Elegí tu box</h2>
        <BoxPicker />
      </div>
    </section>
  )
}

function Product() {
  const { slug } = useParams()
  const { cookies: list } = useCatalog()
  const cookie = list.find((item) => item.slug === slug)
  const order = useOrder()
  if (!cookie) return <Navigate to="/sabores" replace />
  const count = order.qty[cookie.slug] ?? 0

  return (
    <section className="px-5 pb-20 md:grid md:grid-cols-[1.05fr_0.95fr] md:gap-10 md:px-10">
      <div className="sticky top-[3.6rem] z-20 -mx-5 bg-[#f7f1e8] px-5 pb-4 pt-2 md:static md:mx-0 md:bg-transparent md:px-0 md:pb-0 md:pt-0">
        <p className="text-center text-[11px] tracking-[0.2em] uppercase text-[#8a6848] md:text-left">
          {lineLabel(cookie.line)} · {cookie.grams} g
        </p>
        <h1 className="display mt-3 text-center text-4xl leading-[0.95] sm:text-5xl md:text-left md:text-6xl">{cookie.name}</h1>
        <div className="relative mx-auto mt-4 w-[min(72vw,46vh,560px)] md:w-full">
          <CookieShot src={cookie.image} spin alt={`${cookie.name}, cookie XL en Palermo`} />
          <Atmosphere effect={cookie.effect} />
        </div>
        <div className="mt-4">
          <AddRow cookie={cookie} count={count} />
        </div>
      </div>
      <div className="pt-6 md:pt-6">
        <p className="max-w-md leading-relaxed text-[#5c3a2a]/80">{cookie.inside}</p>
        <p className="mt-3 max-w-md leading-relaxed text-[#5c3a2a]/65">{cookie.blurb}</p>
        <ol className="mt-5 max-w-md space-y-2 text-sm leading-relaxed text-[#5c3a2a]/75">
          {bakeSteps.map((item) => (
            <li key={item.step}>
              <span className="text-[#8a6848]">{item.title}. </span>
              {item.body}
            </li>
          ))}
        </ol>
        <Link to="/pedido" className="mt-8 inline-block text-sm underline decoration-[#8a6848] underline-offset-4">
          Seguir al pedido
        </Link>
      </div>
    </section>
  )
}

function Order() {
  const order = useOrder()
  const { cookies: list, prices } = useCatalog()
  const [mode, setMode] = useState('retiro')
  const [place, setPlace] = useState<{ address: string; point: PlacePoint } | null>(null)
  const [dayMode, setDayMode] = useState<'hoy' | 'otro'>('hoy')
  const [otherDay, setOtherDay] = useState('')
  const [formError, setFormError] = useState('')
  const [ideaNote, setIdeaNote] = useState('')
  const price = packPrice(order.qty, list, prices, order.pack)
  const free = place ? isFreeDelivery(place.point) : false
  const ready = order.total === order.pack

  function onSuggest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const idea = String(data.get('idea') ?? '')
    const suggestion = suggestBox(idea, order.pack, list)
    setIdeaNote(suggestion.note)
    order.fill(suggestion.qty)
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!ready) return
    const data = new FormData(event.currentTarget)
    const phone = String(data.get('phone') ?? '').replace(/\D/g, '')
    if (phone.length < 8) {
      setFormError('El teléfono necesita al menos 8 números.')
      return
    }
    if (mode === 'envio' && !place) {
      setFormError('Elegí la dirección del listado.')
      return
    }
    if (dayMode === 'otro' && !otherDay) {
      setFormError('Elegí el día.')
      return
    }
    setFormError('')
    const name = String(data.get('name') ?? '')
    const time = String(data.get('time') ?? '')
    const note = String(data.get('note') ?? '')
    const day = dayMode === 'hoy' ? 'Hoy' : otherDay
    const items = list
      .filter((cookie) => (order.qty[cookie.slug] ?? 0) > 0)
      .map((cookie) => ({ slug: cookie.slug, name: cookie.name, qty: order.qty[cookie.slug] ?? 0 }))
    const modeLabel =
      mode === 'retiro'
        ? 'Retiro en Cerviño y Lafinur'
        : free
          ? 'Envío a domicilio sin cargo (dentro de 10 cuadras)'
          : 'Envío a domicilio, a cotizar'
    const lines = items.map((item) => `- ${item.qty} ${item.name}`)
    const text = [
      'Hola Cookie Club, quiero reservar un pack:',
      '',
      `${name} · ${data.get('phone')}`,
      `Pack x${order.pack} ${order.line ? lineLabel(order.line) : ''} · ${order.bake === 'horneada' ? 'Horneadas' : 'Congeladas'} · ${money(price)}`,
      ...lines,
      '',
      modeLabel,
      mode === 'retiro' ? 'Retiro: Av. Cerviño y Lafinur, Palermo' : `Dirección: ${place?.address}`,
      `Día: ${day}`,
      `Horario: ${time}`,
      note ? `Nota: ${note}` : '',
    ]
      .filter(Boolean)
      .join('\n')
    try {
      await ccApi('/api/cc/orders', {
        method: 'POST',
        body: JSON.stringify({
          name,
          phone: String(data.get('phone') ?? ''),
          pack: order.pack,
          line: order.line ?? '',
          bake: order.bake,
          items,
          total: price,
          mode: modeLabel,
          address: mode === 'retiro' ? 'Av. Cerviño y Lafinur, Palermo' : place?.address,
          day,
          time,
          note,
        }),
      })
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : 'No se pudo guardar el pedido')
      return
    }
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <section className="grid min-h-[calc(100dvh-3.75rem)] gap-12 bg-[#f7f1e8] px-5 pb-20 md:grid-cols-[1.1fr_0.9fr] md:px-10">
      <div>
        <h1 className="display pt-6 text-5xl sm:text-6xl">Tu box</h1>
        <p className="mt-3 max-w-md text-pretty text-sm leading-relaxed text-[#5c3a2a]/70">
          Elegí 6 o 12. Podés mezclar clásicas y rellenas en la misma box.
        </p>
        <BoxPicker />
        <form onSubmit={onSuggest} className="mt-8 grid gap-3">
          <input
            name="idea"
            required
            placeholder="Ej: más dulce de leche y un poco de red velvet"
            className="w-full rounded-full border border-[#5c3a2a]/20 bg-white/40 px-4 py-3 text-sm outline-none"
          />
          <button className="w-fit rounded-full border border-[#5c3a2a]/30 px-5 py-3 text-[11px] tracking-[0.14em] uppercase">
            Sugerí
          </button>
        </form>
        {ideaNote && <p className="mt-3 max-w-md text-sm text-[#5c3a2a]/75">{ideaNote}</p>}
      </div>
      <form onSubmit={(event) => void send(event)} className="h-fit rounded-[28px] border border-[#5c3a2a]/15 bg-white/35 p-6">
        <h2 className="display text-4xl">Reservar</h2>
        <p className="mt-2 text-sm text-[#5c3a2a]/70">Nombre, teléfono, dirección, día y horario. Se abre WhatsApp y queda guardado en el club.</p>
        <div className="mt-6 space-y-3">
          <Field name="name" label="Nombre" required />
          <Field name="phone" label="Teléfono" required type="tel" />
          <div className="flex flex-wrap gap-2">
            {([
              ['retiro', 'Retirar'],
              ['envio', 'Envío a domicilio'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={pill(mode === value)}
              >
                {label}
              </button>
            ))}
          </div>
          {mode === 'envio' && (
            <>
              <AddressField onPick={(address, point) => setPlace({ address, point })} />
              {place && (
                <p className="text-sm text-[#5c3a2a]">
                  {free ? 'Dentro de las 10 cuadras. El envío no tiene cargo.' : 'Más lejos que 10 cuadras. El envío se cotiza por WhatsApp.'}
                </p>
              )}
            </>
          )}
          {mode === 'retiro' && <p className="text-sm">Retiro en Av. Cerviño y Lafinur, Palermo.</p>}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setDayMode('hoy')} className={pill(dayMode === 'hoy')}>
              Hoy
            </button>
            <button type="button" onClick={() => setDayMode('otro')} className={pill(dayMode === 'otro')}>
              Otro día
            </button>
          </div>
          {dayMode === 'otro' && <Field name="date" label="Día" required type="date" min={today} onValue={setOtherDay} />}
          <label className="block text-xs tracking-[0.14em] uppercase text-[#8a6848]">
            Horario
            <select name="time" required className="mt-2 w-full rounded-2xl border border-[#5c3a2a]/20 bg-transparent px-3 py-3 text-sm normal-case tracking-normal text-[#3f2b22]">
              {timeSlots.map((slot) => (
                <option key={slot}>{slot}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs tracking-[0.14em] uppercase text-[#8a6848]">
            Nota
            <textarea name="note" rows={3} placeholder="Timbre, piso" className="mt-2 w-full rounded-2xl border border-[#5c3a2a]/20 bg-white px-3 py-3 text-sm normal-case tracking-normal outline-none" />
          </label>
        </div>
        {formError && <p className="mt-4 text-sm text-[#8a4030]">{formError}</p>}
        <button
          disabled={!ready}
          className="mt-6 w-full rounded-full bg-[#5c3a2a] px-6 py-3 text-[11px] tracking-[0.16em] uppercase text-[#f6f0e6] disabled:opacity-40"
        >
          Mandar pedido por WhatsApp
        </button>
        <p className="mt-3 text-xs leading-relaxed text-[#5c3a2a]/60">
          Horario de 9 a 15. Si estás a más de 10 cuadras, el envío se cotiza en el chat.
        </p>
      </form>
    </section>
  )
}

function BoxPicker() {
  const order = useOrder()
  const { cookies: list, prices } = useCatalog()
  const [tab, setTab] = useState<CookieLine>('clasica')
  const price = packPrice(order.qty, list, prices, order.pack)
  const ready = order.total === order.pack
  const slots = useMemo(() => {
    const filled: Cookie[] = []
    for (const cookie of list) {
      const qty = order.qty[cookie.slug] ?? 0
      for (let i = 0; i < qty; i += 1) filled.push(cookie)
    }
    return Array.from({ length: order.pack }, (_, index) => filled[index] ?? null)
  }, [list, order.pack, order.qty])

  return (
    <div>
      <div className="mt-6 flex flex-wrap gap-2">
        {([6, 12] as PackSize[]).map((size) => (
          <button key={size} type="button" onClick={() => order.setPack(size)} className={pill(order.pack === size)}>
            Pack x{size}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(['horneada', 'congelada'] as Bake[]).map((value) => (
          <button key={value} type="button" onClick={() => order.setBake(value)} className={pill(order.bake === value)}>
            {value === 'horneada' ? 'Horneadas' : 'Congeladas'}
          </button>
        ))}
      </div>
      <div className="mt-6 flex gap-4 text-[11px] tracking-[0.16em] uppercase">
        {(['clasica', 'rellena'] as CookieLine[]).map((line) => (
          <button
            key={line}
            type="button"
            onClick={() => setTab(line)}
            className={tab === line ? 'border-b border-[#5c3a2a] pb-1 text-[#3f2b22]' : 'pb-1 text-[#5c3a2a]/45'}
          >
            {lineLabel(line)}
          </button>
        ))}
      </div>
      <div className={`mt-6 grid gap-2 ${order.pack === 6 ? 'grid-cols-3' : 'grid-cols-4 sm:grid-cols-6'}`}>
        {slots.map((cookie, index) => (
          <div key={index} className="aspect-square rounded-2xl border border-[#5c3a2a]/15 bg-white/35 p-1.5">
            {cookie ? <img src={cookie.image} alt={cookie.name} className="h-full w-full object-contain" /> : null}
          </div>
        ))}
      </div>
      <ul className="mt-6 divide-y divide-[#5c3a2a]/10">
        {list
          .filter((cookie) => cookie.line === tab)
          .map((cookie) => (
            <li key={cookie.slug} className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-3 py-4">
              <img src={cookie.image} alt={cookie.name} className="size-14 object-contain" />
              <div className="min-w-0">
                <p className="display text-xl leading-tight sm:text-2xl">{cookie.name}</p>
                <p className="mt-1 text-xs text-[#5c3a2a]/55">{cookie.grams} g</p>
              </div>
              <Stepper
                value={order.qty[cookie.slug] ?? 0}
                onDec={() => order.add(cookie.slug, -1)}
                onInc={() => order.add(cookie.slug, 1)}
                disableInc={order.total >= order.pack}
              />
            </li>
          ))}
      </ul>
      <p className="mt-4 text-sm">
        {order.total}/{order.pack}
        {order.line ? ` · ${lineLabel(order.line)}` : ''} · {ready ? money(price) : `Faltan ${order.pack - order.total} para cerrar el pack`} · {order.bake === 'horneada' ? 'Horneadas' : 'Congeladas'}
      </p>
      {order.notice && <p className="mt-2 text-sm text-[#8a4030]">{order.notice}</p>}
    </div>
  )
}

function AddRow({ cookie, count }: { cookie: Cookie; count: number }) {
  const order = useOrder()
  const full = order.total >= order.pack
  return (
    <div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Stepper
          value={count}
          onDec={() => order.add(cookie.slug, -1)}
          onInc={() => order.add(cookie.slug, 1)}
          disableInc={full}
        />
        <button
          type="button"
          disabled={full}
          onClick={() => order.add(cookie.slug, 1)}
          className="rounded-full bg-[#5c3a2a] px-5 py-2.5 text-[11px] tracking-[0.14em] uppercase text-[#f6f0e6] disabled:opacity-30"
        >
          Agregar al pack
        </button>
      </div>
      {order.notice && <p className="mt-3 text-center text-sm text-[#8a4030]">{order.notice}</p>}
    </div>
  )
}

type IntroChip = {
  id: string
  left: string
  bottom: string
  size: string
  delay: string
  duration: string
  spin: string
  drift: string
  z: number
}

function rainLayout(): IntroChip[] {
  const w = window.innerWidth
  const h = window.innerHeight
  const min = Math.min(w, h)
  const size = Math.round(min * 0.56)
  const gap = size * 0.5
  const cols = Math.ceil(w / gap) + 1
  const rows = Math.ceil(h / gap) + 1
  const items: IntroChip[] = []
  let n = 0
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const jitter = ((n * 19) % 17) - 8
      items.push({
        id: `rain-${n}`,
        left: `${col * gap + (row % 2 ? gap * 0.42 : 0) - size * 0.32 + jitter}px`,
        bottom: `${row * gap - size * 0.18}px`,
        size: `${size + ((n % 3) - 1) * Math.round(min * 0.04)}px`,
        delay: `${(row * 0.22 + ((col * 3 + row) % cols) * 0.07).toFixed(2)}s`,
        duration: `${1.35 + (n % 4) * 0.18}s`,
        spin: `${((n % 15) - 7) * 6}deg`,
        drift: `${((n % 9) - 4) * 12}px`,
        z: row + 1,
      })
      n += 1
    }
  }
  return items
}

function introSeen() {
  try {
    return sessionStorage.getItem('cc-intro-seen') === '1'
  } catch {
    return false
  }
}

function markIntroSeen() {
  try {
    sessionStorage.setItem('cc-intro-seen', '1')
  } catch {
    /* private mode */
  }
}

function ChipRain() {
  const [show, setShow] = useState(() => !introSeen())
  const [pieces, setPieces] = useState<IntroChip[]>([])

  function hide() {
    markIntroSeen()
    setShow(false)
  }

  useEffect(() => {
    if (!show) return undefined
    const next = rainLayout()
    setPieces(next)
    const last = next.reduce((max, piece) => Math.max(max, parseFloat(piece.delay) + parseFloat(piece.duration)), 0)
    const id = window.setTimeout(hide, (last + 1.5) * 1000)
    return () => window.clearTimeout(id)
  }, [show])

  if (!show) return null
  return (
    <div className="cc-intro" role="dialog" aria-label="Bienvenida Cookie Club">
      {pieces.map((piece) => (
        <img
          key={piece.id}
          src="/cookies/vainilla-chips.png"
          alt=""
          className="cc-intro-chip"
          style={
            {
              left: piece.left,
              bottom: piece.bottom,
              width: piece.size,
              zIndex: piece.z,
              animationDuration: piece.duration,
              animationDelay: piece.delay,
              '--spin': piece.spin,
              '--drift': piece.drift,
            } as CSSProperties
          }
        />
      ))}
      <div className="cc-intro-brand">
        <img src="/cookies/logo.png" alt="Somos Cookie Club" className="cc-intro-logo" />
      </div>
      <button type="button" className="cc-intro-skip" onClick={hide}>
        Saltar
      </button>
    </div>
  )
}

function CookieShot({ src, spin, className, alt }: { src: string; spin?: boolean; className?: string; alt?: string }) {
  return (
    <span className={`cc-shot ${spin ? 'cc-clock' : ''} ${className ?? ''}`}>
      <img src={src} alt={alt ?? ''} draggable={false} />
    </span>
  )
}

function pill(on: boolean) {
  return on
    ? 'rounded-full bg-[#5c3a2a] px-4 py-2 text-[11px] tracking-[0.12em] uppercase text-[#f6f0e6]'
    : 'rounded-full border border-[#5c3a2a]/25 px-4 py-2 text-[11px] tracking-[0.12em] uppercase'
}

function Field({
  name,
  label,
  type = 'text',
  required,
  placeholder,
  min,
  onValue,
}: {
  name: string
  label: string
  type?: string
  required?: boolean
  placeholder?: string
  min?: string
  onValue?: (value: string) => void
}) {
  return (
    <label className="block text-xs tracking-[0.14em] uppercase text-[#8a6848]">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        min={min}
        onChange={onValue ? (event) => onValue(event.target.value) : undefined}
        className="mt-2 w-full rounded-2xl border border-[#5c3a2a]/20 bg-white px-3 py-3 text-sm normal-case tracking-normal text-[#3f2b22] outline-none"
      />
    </label>
  )
}

function Stepper({
  value,
  onDec,
  onInc,
  disableInc,
}: {
  value: number
  onDec: () => void
  onInc: () => void
  disableInc?: boolean
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <button type="button" onClick={onDec} aria-label="Sacar una" className="grid size-8 place-items-center rounded-full border border-[#5c3a2a]/30">
        −
      </button>
      <span className="w-4 text-center text-sm">{value}</span>
      <button type="button" onClick={onInc} disabled={disableInc} aria-label="Sumar una" className="grid size-8 place-items-center rounded-full border border-[#5c3a2a]/30 disabled:opacity-30">
        +
      </button>
    </div>
  )
}

function Atmosphere({ effect }: { effect: CookieEffect }) {
  const pieces = useMemo(() => buildPieces(effect), [effect])
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {pieces.map((piece) => (
        <span key={piece.id} className={piece.kind === 'drip' ? 'cc-drip' : 'cc-fall'} style={piece.style} />
      ))}
    </div>
  )
}

function buildPieces(effect: CookieEffect) {
  const drip = effect === 'chocolate' || effect === 'mousse' || effect === 'ddl' || effect === 'frosting'
  const count = drip ? 8 : 18
  return Array.from({ length: count }, (_, index) => {
    const left = (index * 47) % 100
    const delay = `${(index % 6) * 0.28}s`
    const duration = `${drip ? 3.4 + (index % 4) * 0.45 : 3.1 + (index % 5) * 0.35}s`
    const size = drip ? 8 + (index % 3) * 5 : 7 + (index % 4) * 3
    return {
      id: `${effect}-${index}`,
      kind: drip ? 'drip' : 'fall',
      style: {
        left: `${left}%`,
        width: size,
        height: drip ? size * 3.2 : size,
        animationDelay: delay,
        animationDuration: duration,
        background:
          effect === 'chips'
            ? '#4a2a18'
            : effect === 'velvet'
              ? '#7a2430'
              : effect === 'ddl'
                ? '#c47a2a'
                : effect === 'frosting'
                  ? '#f3ead8'
                  : '#3a2218',
      } as CSSProperties,
    }
  })
}

