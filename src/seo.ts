import { INSTAGRAM, PHONE_LABEL, WHATSAPP, type Cookie } from './data/cookieclub'

export const SITE_NAME = 'Somos Cookie Club'
export const LOCALITY = 'Palermo'
export const REGION = 'Buenos Aires'
export const STREET = 'Av. Cerviño y Lafinur'
export const GEO = { lat: -34.5784434, lng: -58.4131761 }

const KEYWORDS = [
  'cookies',
  'cookies Palermo',
  'cookies XL',
  'delivery de cookies',
  'cookies a domicilio',
  'envío de cookies Palermo',
  'cookies rellenas',
  'cookies clásicas',
  'cookie club',
  'Palermo',
  'retiro en Palermo',
  'Cerviño y Lafinur',
].join(', ')

const HOME_DESCRIPTION =
  'Cookies XL en Palermo, Buenos Aires. Delivery a domicilio y retiro en Av. Cerviño y Lafinur. Packs de 6 o 12, clásicas y rellenas, horneadas o congeladas. Pedí por WhatsApp.'

export type PageSeo = {
  title: string
  description: string
  keywords: string
  robots: string
}

export function pageSeo(pathname: string, cookies: Cookie[]): PageSeo {
  if (pathname.startsWith('/panel')) {
    return {
      title: `Panel · ${SITE_NAME}`,
      description: HOME_DESCRIPTION,
      keywords: KEYWORDS,
      robots: 'noindex, nofollow',
    }
  }
  if (pathname.startsWith('/pedido')) {
    return {
      title: `Pedir cookies en Palermo · Delivery o retiro · ${SITE_NAME}`,
      description:
        'Armá tu pack de cookies XL y pedí delivery en Palermo o retirá en Cerviño y Lafinur. Envío sin cargo a 10 cuadras. Horario de 9 a 15.',
      keywords: KEYWORDS,
      robots: 'index, follow',
    }
  }
  if (pathname === '/sabores') {
    return {
      title: `Sabores de cookies XL · Clásicas y rellenas · ${SITE_NAME} Palermo`,
      description:
        'Seis sabores de cookies XL en Palermo: clásicas de 80 g y rellenas de 120 g. Chocolate, vainilla, red velvet, dulce de leche y frosting. Delivery y retiro.',
      keywords: KEYWORDS,
      robots: 'index, follow',
    }
  }
  const product = pathname.match(/^\/sabores\/([^/]+)\/?$/)
  if (product) {
    const cookie = cookies.find((item) => item.slug === product[1])
    if (cookie) {
      return {
        title: `${cookie.name} · Cookie XL en Palermo · ${SITE_NAME}`,
        description: `${cookie.name} en Palermo. ${cookie.tagline ?? cookie.inside} Delivery de cookies y retiro en Cerviño y Lafinur.`,
        keywords: `${cookie.name}, ${cookie.keywords?.join(', ') ?? ''}, ${KEYWORDS}`,
        robots: 'index, follow',
      }
    }
  }
  return {
    title: `Cookies XL en Palermo | Delivery y retiro | ${SITE_NAME}`,
    description: HOME_DESCRIPTION,
    keywords: KEYWORDS,
    robots: 'index, follow',
  }
}

export function businessJsonLd(origin: string) {
  return {
    '@context': 'https://schema.org',
    '@type': ['Bakery', 'LocalBusiness'],
    name: SITE_NAME,
    alternateName: ['Cookie Club', 'Somos Cookie Club Palermo'],
    description: HOME_DESCRIPTION,
    url: origin,
    image: `${origin}/cookies/logo.png`,
    telephone: PHONE_LABEL,
    sameAs: [INSTAGRAM, `https://wa.me/${WHATSAPP}`],
    address: {
      '@type': 'PostalAddress',
      streetAddress: STREET,
      addressLocality: LOCALITY,
      addressRegion: REGION,
      addressCountry: 'AR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: GEO.lat,
      longitude: GEO.lng,
    },
    areaServed: [
      { '@type': 'Neighborhood', name: 'Palermo', containedInPlace: { '@type': 'City', name: 'Buenos Aires' } },
      { '@type': 'Neighborhood', name: 'Recoleta' },
      { '@type': 'Neighborhood', name: 'Colegiales' },
      { '@type': 'Neighborhood', name: 'Belgrano' },
    ],
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '09:00',
      closes: '15:00',
    },
    priceRange: '$$',
    servesCuisine: 'Cookies',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Packs de cookies XL',
      itemListElement: [
        { '@type': 'Offer', name: 'Pack x6 cookies clásicas', availability: 'https://schema.org/InStock' },
        { '@type': 'Offer', name: 'Pack x12 cookies clásicas', availability: 'https://schema.org/InStock' },
        { '@type': 'Offer', name: 'Pack x6 cookies rellenas', availability: 'https://schema.org/InStock' },
        { '@type': 'Offer', name: 'Pack x12 cookies rellenas', availability: 'https://schema.org/InStock' },
        { '@type': 'Offer', name: 'Delivery de cookies en Palermo', availability: 'https://schema.org/InStock' },
      ],
    },
    potentialAction: {
      '@type': 'OrderAction',
      target: `${origin}/pedido`,
      deliveryMethod: ['https://schema.org/OnSitePickup', 'https://schema.org/ParcelService'],
    },
  }
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`
  let tag = document.head.querySelector(selector) as HTMLMetaElement | null
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, key)
    document.head.appendChild(tag)
  }
  tag.content = content
}

function upsertLink(rel: string, href: string) {
  let tag = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!tag) {
    tag = document.createElement('link')
    tag.rel = rel
    document.head.appendChild(tag)
  }
  tag.href = href
}

function upsertJsonLd(id: string, data: unknown) {
  let tag = document.getElementById(id) as HTMLScriptElement | null
  if (!tag) {
    tag = document.createElement('script')
    tag.id = id
    tag.type = 'application/ld+json'
    document.head.appendChild(tag)
  }
  tag.textContent = JSON.stringify(data)
}

export function applySeo(pathname: string, cookies: Cookie[]) {
  const page = pageSeo(pathname, cookies)
  const origin = window.location.origin
  const canonical = `${origin}${pathname === '/' ? '/' : pathname}`
  document.title = page.title
  upsertMeta('name', 'description', page.description)
  upsertMeta('name', 'keywords', page.keywords)
  upsertMeta('name', 'robots', page.robots)
  upsertMeta('name', 'geo.region', 'AR-C')
  upsertMeta('name', 'geo.placename', 'Palermo, Buenos Aires')
  upsertMeta('name', 'geo.position', `${GEO.lat};${GEO.lng}`)
  upsertMeta('name', 'ICBM', `${GEO.lat}, ${GEO.lng}`)
  upsertMeta('property', 'og:type', 'website')
  upsertMeta('property', 'og:locale', 'es_AR')
  upsertMeta('property', 'og:site_name', SITE_NAME)
  upsertMeta('property', 'og:title', page.title)
  upsertMeta('property', 'og:description', page.description)
  upsertMeta('property', 'og:url', canonical)
  upsertMeta('property', 'og:image', `${origin}/cookies/vainilla-chips.png`)
  upsertMeta('name', 'twitter:card', 'summary_large_image')
  upsertMeta('name', 'twitter:title', page.title)
  upsertMeta('name', 'twitter:description', page.description)
  upsertLink('canonical', canonical)
  upsertJsonLd('cc-jsonld', businessJsonLd(origin))
}
