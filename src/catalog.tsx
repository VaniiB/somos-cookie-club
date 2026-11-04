import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { cookiePrices, cookies as seedCookies, type Cookie, type CookieLine, type PackSize } from './data/cookieclub'
import { ccApi } from './api'

export type Prices = Record<CookieLine, Record<PackSize, number>>

type CatalogApi = {
  cookies: Cookie[]
  prices: Prices
  ready: boolean
  saveCookie: (cookie: Cookie) => Promise<void>
  removeCookie: (slug: string) => Promise<void>
  setPrices: (prices: Prices) => Promise<void>
}

const CatalogContext = createContext<CatalogApi | null>(null)

function seed(): { cookies: Cookie[]; prices: Prices } {
  return {
    cookies: seedCookies.map((cookie) => ({ ...cookie })),
    prices: {
      clasica: { ...cookiePrices.clasica },
      rellena: { ...cookiePrices.rellena },
    },
  }
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const initial = seed()
  const [cookies, setCookies] = useState(initial.cookies)
  const [prices, setPricesState] = useState(initial.prices)
  const [ready, setReady] = useState(false)

  const refresh = useCallback(async () => {
    const data = await ccApi<{ cookies: Cookie[]; prices: Prices }>('/api/cc/catalog')
    setCookies(data.cookies)
    setPricesState(data.prices)
  }, [])

  useEffect(() => {
    let live = true
    refresh()
      .catch(() => {
        if (!live) return
      })
      .finally(() => {
        if (live) setReady(true)
      })
    return () => {
      live = false
    }
  }, [refresh])

  const persist = useCallback(
    async (nextCookies: Cookie[], nextPrices: Prices) => {
      await ccApi('/api/cc/catalog', {
        method: 'PUT',
        body: JSON.stringify({ cookies: nextCookies, prices: nextPrices }),
      })
      setCookies(nextCookies)
      setPricesState(nextPrices)
    },
    [],
  )

  const api = useMemo<CatalogApi>(
    () => ({
      cookies,
      prices,
      ready,
      async saveCookie(cookie) {
        const exists = cookies.some((item) => item.slug === cookie.slug)
        const next = exists ? cookies.map((item) => (item.slug === cookie.slug ? cookie : item)) : [...cookies, cookie]
        await persist(next, prices)
      },
      async removeCookie(slug) {
        await persist(
          cookies.filter((item) => item.slug !== slug),
          prices,
        )
      },
      async setPrices(next) {
        await persist(cookies, next)
      },
    }),
    [cookies, persist, prices, ready],
  )

  return <CatalogContext.Provider value={api}>{children}</CatalogContext.Provider>
}

export function useCatalog() {
  const value = useContext(CatalogContext)
  if (!value) throw new Error('Catálogo fuera del club')
  return value
}
