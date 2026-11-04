import { useEffect, useRef, useState } from 'react'

export type PlacePoint = { lat: number; lng: number }

type Props = {
  onPick: (address: string, point: PlacePoint) => void
}

const ORIGIN = { lat: -34.5784434, lng: -58.4131761 }
const FREE_KM = 1.1

let loading: Promise<void> | null = null

function loadMaps(key: string) {
  if (window.google?.maps?.places) return Promise.resolve()
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&language=es&region=AR`
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('maps'))
      document.head.appendChild(script)
    })
  }
  return loading
}

function distanceKm(point: PlacePoint) {
  const r = 6371
  const dLat = ((point.lat - ORIGIN.lat) * Math.PI) / 180
  const dLng = ((point.lng - ORIGIN.lng) * Math.PI) / 180
  const a1 = (ORIGIN.lat * Math.PI) / 180
  const a2 = (point.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a1) * Math.cos(a2) * Math.sin(dLng / 2) ** 2
  return r * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export function isFreeDelivery(point: PlacePoint) {
  return distanceKm(point) <= FREE_KM
}

export function AddressField({ onPick }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const onPickRef = useRef(onPick)
  const [error, setError] = useState('')
  const key = import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined

  useEffect(() => {
    onPickRef.current = onPick
  }, [onPick])

  useEffect(() => {
    if (!key) return
    let listener: { remove: () => void } | undefined
    let alive = true
    loadMaps(key)
      .then(() => {
        if (!alive || !inputRef.current || !window.google?.maps?.places) return
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'ar' },
          fields: ['formatted_address', 'geometry'],
          types: ['address'],
        })
        listener = autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          const loc = place.geometry?.location
          if (!place.formatted_address || !loc) return
          onPickRef.current(place.formatted_address, { lat: loc.lat(), lng: loc.lng() })
        })
      })
      .catch(() => setError('No se pudo cargar el buscador de direcciones.'))
    return () => {
      alive = false
      listener?.remove()
    }
  }, [key])

  return (
    <label className="relative block text-xs tracking-[0.14em] uppercase text-[#8a6848]">
      Dirección
      <input
        ref={inputRef}
        name="address"
        autoComplete="off"
        placeholder="Escribí y elegí del listado"
        className="mt-2 w-full rounded-2xl border border-[#5c3a2a]/20 bg-white px-3 py-3 text-sm normal-case tracking-normal text-[#3f2b22] outline-none"
      />
      {!key && <span className="mt-2 block text-xs normal-case tracking-normal text-[#8a4030]">Falta la clave de Google para buscar direcciones.</span>}
      {error && <span className="mt-2 block text-xs normal-case tracking-normal text-[#8a4030]">{error}</span>}
    </label>
  )
}

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete: new (
            input: HTMLInputElement,
            opts: Record<string, unknown>,
          ) => {
            addListener: (event: string, handler: () => void) => { remove: () => void }
            getPlace: () => {
              formatted_address?: string
              geometry?: { location?: { lat: () => number; lng: () => number } }
            }
          }
        }
      }
    }
  }
}
