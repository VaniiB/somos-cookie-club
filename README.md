# Somos Cookie Club

Tienda de cookies XL: packs de 6 o 12, retiro en Palermo o envío, pedido por WhatsApp y panel para precios, fotos y pedidos.

## Local

```bash
npm install
cp .env.example .env.local
```

En `.env.local` poné `VITE_GOOGLE_MAPS_KEY` (la clave no se sube al repo).

```bash
npm run dev
```

- Sitio: http://localhost:5176
- Panel: http://localhost:5176/panel
- Clave del panel: `SCC-7741` (o `COOKIECLUB_PASSWORD`)

## Netlify

1. Importá este repo en Netlify (GitHub → VaniiB/somos-cookie-club).
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Variables de entorno:
   - `VITE_GOOGLE_MAPS_KEY` — para el buscador de direcciones
   - `VITE_SITE_URL` — URL pública, sin barra final (ej. `https://tudominio.com`). Sirve para el sitemap.
   - `COOKIECLUB_PASSWORD` — clave del panel
   - `COOKIECLUB_SECRET` — firma de la sesión del panel (poné un texto largo al azar)

Los pedidos y el catálogo del panel se guardan en Netlify Blobs. En local quedan en `server/data/` (gitignored).

Para aparecer en Google: cuando el sitio esté online, creá el perfil en [Google Business](https://www.google.com/business/) como negocio en Palermo (Cerviño y Lafinur) y mandá el sitemap en Search Console. El código ya deja título, descripción, Palermo, delivery y datos de negocio listos para el buscador.
