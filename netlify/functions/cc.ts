import { getStore } from '@netlify/blobs'
import { handleCc, hydrateStore, type Store } from '../../server/ccCore.ts'

const secret = process.env.COOKIECLUB_SECRET || 'cookieclub-dev-secret'
const password = process.env.COOKIECLUB_PASSWORD || 'SCC-7741'

function apiPath(event: { path?: string; rawUrl?: string }) {
  const raw = event.rawUrl ? new URL(event.rawUrl).pathname : event.path ?? ''
  const match = raw.match(/\/api\/cc(?:\/[A-Za-z0-9_-]+)?/)
  if (match) return match[0]
  const trimmed = raw.replace(/^\/\.netlify\/functions\/cc/, '')
  return `/api/cc${trimmed}`.replace(/\/$/, '') || '/api/cc'
}

export async function handler(event: {
  httpMethod: string
  path: string
  rawUrl?: string
  body: string | null
  headers: Record<string, string | undefined>
}) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, body: '' }
  }
  let body: unknown = {}
  if (event.body) {
    try {
      body = JSON.parse(event.body)
    } catch {
      return { statusCode: 400, body: JSON.stringify({ error: 'No se pudo leer el pedido' }) }
    }
  }
  const blobs = getStore('cookieclub')
  const result = await handleCc(
    {
      method: event.httpMethod,
      path: apiPath(event),
      authorization: event.headers.authorization ?? event.headers.Authorization,
      body,
    },
    {
      async load() {
        const parsed = (await blobs.get('state', { type: 'json' })) as Store | null
        return hydrateStore(parsed)
      },
      async save(store: Store) {
        await blobs.setJSON('state', store)
      },
      secret,
      password,
    },
  )
  return {
    statusCode: result.status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: result.status === 204 ? '' : JSON.stringify(result.json),
  }
}
