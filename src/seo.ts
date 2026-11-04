import { INSTAGRAM, PHONE_LABEL, WHATSAPP, type Cookie } from './data/cookieclub'

export const SITE_NAME = 'Somos Cookie Club'
export const LOCALITY = 'Palermo'
export const REGION = 'Buenos Aires'
export const STREET = 'Av. Cerviño y Lafinur'
export const GEO = { lat: -34.5784434, lng: -58.4131761 }

const KEYWORDS = 'Somos Cookie Club, Cookie Club, somos cookie club'
const HOME_DESCRIPTION = 'Somos Cookie Club. Cookies XL en Palermo.'
const SHARE_IMAGE = '/og.png?v=2'

export type PageSeo = {
  title: string
  description: string
  keywords: string
  robots: string
}

export function pageSeo(pathname: string, _cookies: Cookie[]): PageSeo {
  if (pathname.startsWith('/panel')) {
    return {
      title: SITE_NAME,
      description: HOME_DESCRIPTION,
      keywords: KEYWORDS,
      robots: 'noindex, nofollow',
    }
  }
  return {
    title: SITE_NAME,
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
    image: `${origin}${SHARE_IMAGE}`,
    logo: `${origin}/cookies/logo.png`,
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
  upsertMeta('property', 'og:title', SITE_NAME)
  upsertMeta('property', 'og:description', HOME_DESCRIPTION)
  upsertMeta('property', 'og:url', canonical)
  upsertMeta('property', 'og:image', `${origin}${SHARE_IMAGE}`)
  upsertMeta('property', 'og:image:width', '1200')
  upsertMeta('property', 'og:image:height', '1200')
  upsertMeta('property', 'og:image:alt', SITE_NAME)
  upsertMeta('name', 'twitter:card', 'summary')
  upsertMeta('name', 'twitter:title', SITE_NAME)
  upsertMeta('name', 'twitter:description', HOME_DESCRIPTION)
  upsertMeta('name', 'twitter:image', `${origin}${SHARE_IMAGE}`)
  upsertLink('canonical', canonical)
  upsertJsonLd('cc-jsonld', businessJsonLd(origin))
}
