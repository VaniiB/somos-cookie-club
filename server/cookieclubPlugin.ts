import fs from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import path from 'node:path'
import type { Plugin } from 'vite'
import { handleCc, hydrateStore, type Store } from './ccCore.ts'

const secret = process.env.COOKIECLUB_SECRET || 'cookieclub-dev-secret'
const password = process.env.COOKIECLUB_PASSWORD || 'SCC-7741'

function readBody(req: IncomingMessage) {
  return new Promise<unknown>((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > 8_000_000) {
        reject(new Error('grande'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8')
        resolve(text ? JSON.parse(text) : {})
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  if (status === 204) {
    res.end()
    return
  }
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

export function cookieClubApi(): Plugin {
  const attach = (root: string) => {
    const dataDir = path.join(root, 'server', 'data')
    const dataFile = path.join(dataDir, 'cookieclub.json')

    function load(): Store {
      try {
        return hydrateStore(JSON.parse(fs.readFileSync(dataFile, 'utf8')) as Store)
      } catch {
        return hydrateStore(null)
      }
    }

    function save(store: Store) {
      fs.mkdirSync(dataDir, { recursive: true })
      fs.writeFileSync(dataFile, JSON.stringify(store, null, 2))
    }

    return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
      const url = (req.url ?? '').split('?')[0]
      if (!url.startsWith('/api/cc')) {
        next()
        return
      }

      void (async () => {
        try {
          const body = req.method === 'GET' || req.method === 'OPTIONS' ? {} : await readBody(req)
          const result = await handleCc(
            {
              method: req.method ?? 'GET',
              path: url,
              authorization: req.headers.authorization,
              body,
            },
            { load, save, secret, password },
          )
          send(res, result.status, result.json)
        } catch {
          if (!res.headersSent) send(res, 400, { error: 'No se pudo leer el pedido' })
        }
      })()
    }
  }

  return {
    name: 'cookieclub-api',
    configureServer(server) {
      server.middlewares.use(attach(server.config.root))
    },
    configurePreviewServer(server) {
      server.middlewares.use(attach(server.config.root))
    },
  }
}
