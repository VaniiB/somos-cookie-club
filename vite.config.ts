import { mkdirSync, writeFileSync } from 'node:fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { cookies } from './src/data/cookieclub.ts'
import { cookieClubApi } from './server/cookieclubPlugin.ts'

function sitemapPlugin(): Plugin {
  return {
    name: 'cc-sitemap',
    closeBundle() {
      const site = (process.env.VITE_SITE_URL || '').replace(/\/$/, '')
      const paths = ['/', '/sabores', '/pedido', ...cookies.map((cookie) => `/sabores/${cookie.slug}`)]
      const urls = paths
        .map((path) => {
          const loc = site ? `${site}${path}` : path
          return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>weekly</changefreq>\n  </url>`
        })
        .join('\n')
      mkdirSync('dist', { recursive: true })
      writeFileSync(
        'dist/sitemap.xml',
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      )
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), cookieClubApi(), sitemapPlugin()],
  server: {
    port: 5176,
  },
})
