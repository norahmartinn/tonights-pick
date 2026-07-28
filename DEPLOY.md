# Desplegar en Cloudflare Workers

Esta app es **SSR** (TanStack Start): tiene server functions, llamadas a IA desde
el servidor y endpoints MCP. No funciona en hosting estático como GitHub Pages —
necesita un runtime. El build de nitro ya apunta a Cloudflare Workers.

## 1. Login en Cloudflare (una sola vez)

```bash
npx wrangler login
```

## 2. Claves de entorno

Las `VITE_*` se incrustan en el bundle **al construir**, así que basta con
tenerlas en `.env` local antes de `npm run build`.

Las del servidor se cargan en tiempo de ejecución y hay que subirlas como
secretos del Worker:

```bash
npx wrangler secret put SUPABASE_URL              --name tonights-pick
npx wrangler secret put SUPABASE_PUBLISHABLE_KEY  --name tonights-pick
npx wrangler secret put SUPABASE_PROJECT_ID       --name tonights-pick

# IA — hace falta UNA de las dos, si no las recomendaciones fallan
npx wrangler secret put ANTHROPIC_API_KEY         --name tonights-pick
# o
npx wrangler secret put OPENAI_API_KEY            --name tonights-pick

# Opcional: pósters y metadatos de películas (token v4 gratuito de themoviedb.org)
npx wrangler secret put TMDB_API_TOKEN            --name tonights-pick
```

## 3. Construir y desplegar

```bash
npm run build
npx wrangler deploy --config .output/server/wrangler.json --name tonights-pick
```

Publicada en **https://tonights-pick.norahmartinn.workers.dev**

El `--name` es necesario porque nitro genera el Worker con el nombre por defecto
`tanstack-start-ts` (el del `package.json`).

## Qué necesita cada parte para funcionar

| Función | Requiere |
|---|---|
| Login / registro | Supabase (ya configurado) |
| Login con Google | Activar el provider en Supabase → Authentication → Providers |
| Recomendaciones, feedback | `ANTHROPIC_API_KEY` u `OPENAI_API_KEY` |
| Pósters y metadatos | `TMDB_API_TOKEN` (sin él la app funciona, pero sin carátulas) |
| Favoritos, historial, perfil | Supabase |
