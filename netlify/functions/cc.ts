import { connectLambda, getStore } from '@netlify/blobs'
import { handleCc, hydrateStore, type Store } from '../../server/ccCore.ts'

const secret = process.env.COOKIECLUB_SECRET || 'cookieclub-dev-secret'
const password = process.env.COOKIECLUB_PASSWORD || 'SCC-7741'

let memory: Store | null = null

type LambdaReq = {
  httpMethod: string
  path: string
  rawUrl?: string
  body: string | null
  headers: Record<string, string | undefined>
  blobs?: string
}

function apiPath(event: { path?: string; rawUrl?: string }) {
  const raw = event.rawUrl ? new URL(event.rawUrl).pathname : event.path ?? ''
  const match = raw.match(/\/api\/cc(?:\/[A-Za-z0-9_-]+)?/)
  if (match) return match[0]
  const trimmed = raw.replace(/^\/\.netlify\/functions\/cc/, '')
  return `/api/cc${trimmed}`.replace(/\/$/, '') || '/api/cc'
}

function json(status: number, payload: unknown) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: status === 204 ? '' : JSON.stringify(payload),
  }
}

function openStore(event: LambdaReq) {
  if (typeof event.blobs === 'string' && event.blobs) {
    const headers: Record<string, string> = {}
    for (const [key, value] of Object.entries(event.headers ?? {})) {
      if (value) headers[key] = value
    }
    try {
      connectLambda({ blobs: event.blobs, headers })
    } catch {
      // sin contexto de Blobs: seguimos con memoria
    }
  }
  try {
    return getStore('cookieclub')
  } catch {
    return null
  }
}

export async function handler(event: LambdaReq) {
  try {
    if (event.httpMethod === 'OPTIONS') return json(204, {})

    let body: unknown = {}
    if (event.body) {
      try {
        body = JSON.parse(event.body)
      } catch {
        return json(400, { error: 'No se pudo leer el pedido' })
      }
    }

    const blobs = openStore(event)
    const result = await handleCc(
      {
        method: event.httpMethod,
        path: apiPath(event),
        authorization: event.headers.authorization ?? event.headers.Authorization,
        body,
      },
      {
        async load() {
          if (blobs) {
            try {
              const parsed = (await blobs.get('state', { type: 'json' })) as Store | null
              memory = hydrateStore(parsed)
              return memory
            } catch {
              // caemos a memoria
            }
          }
          if (!memory) memory = hydrateStore(null)
          return memory
        },
        async save(store: Store) {
          memory = store
          if (!blobs) return
          try {
            await blobs.setJSON('state', store)
          } catch {
            // el panel sigue andando aunque Blobs falle
          }
        },
        secret,
        password,
      },
    )
    return json(result.status, result.json)
  } catch {
    return json(500, { error: 'No se pudo completar' })
  }
}
