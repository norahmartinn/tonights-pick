# Desplegar en Cloudflare Workers

Esta app es **SSR** (TanStack Start): tiene server functions, llamadas a IA desde
el servidor y endpoints MCP. No funciona en hosting estático como GitHub Pages —
necesita un runtime. El build de nitro ya apunta a Cloudflare Workers.

## 1. Login en Cloudflare (una sola vez)

```bash
npx wrangler login
```

## 2. Backend de Supabase

Si partes de un proyecto de Supabase vacío, crea el esquema pegando
`supabase/bootstrap.sql` en el editor SQL del panel. Es idempotente y deja las
cuatro tablas (`profiles`, `favorites`, `history`, `feedback`) con sus políticas
de seguridad, índices y triggers.

Después, en *Authentication → Providers → Email*, desactiva **Confirm email**:
si no, nadie puede entrar sin pinchar un enlace, y el SMTP que trae Supabase de
serie manda muy pocos correos y suele acabar en spam.

## 3. Claves de entorno

Las `VITE_*` se incrustan en el bundle **al construir**, así que basta con
tenerlas en `.env` local antes de `npm run build`.

Las del servidor se cargan en tiempo de ejecución y hay que subirlas como
secretos del Worker:

```bash
npx wrangler secret put SUPABASE_URL              --name tonights-pick
npx wrangler secret put SUPABASE_PUBLISHABLE_KEY  --name tonights-pick
npx wrangler secret put SUPABASE_PROJECT_ID       --name tonights-pick

# IA — obligatorio, si no las recomendaciones fallan.
# En producción va por Groq, que es gratis y sin tarjeta. `ai.server.ts` acepta
# cualquier endpoint compatible con OpenAI, así que basta con apuntarlo ahí:
npx wrangler secret put OPENAI_API_KEY            --name tonights-pick  # key gsk_… de Groq
npx wrangler secret put AI_PROVIDER               --name tonights-pick  # openai
npx wrangler secret put AI_BASE_URL               --name tonights-pick  # https://api.groq.com/openai/v1
npx wrangler secret put AI_MODEL                  --name tonights-pick  # llama-3.3-70b-versatile

# Pósters y metadatos (token v4 gratuito de themoviedb.org). Técnicamente
# opcional, pero sin él el hueco del póster sale roto.
npx wrangler secret put TMDB_API_TOKEN            --name tonights-pick
```

Para usar OpenAI o Anthropic de pago en su lugar, pon `OPENAI_API_KEY` o
`ANTHROPIC_API_KEY` y borra `AI_BASE_URL` y `AI_MODEL`.

## 4. Construir y desplegar

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
