# Tonight's Pick

App de recomendación de películas y series: le cuentas tu estado de ánimo y te
devuelve **una** propuesta, con plataforma, valoración y el porqué.

Stack: **TanStack Start (SSR) + React 19 + Vite 8 + Supabase + Tailwind 4**.
En producción: **Cloudflare Workers** → https://tonights-pick.norahmartinn.workers.dev

## Arrancar en local
```bash
npm install
npm run dev            # http://localhost:8080
```
(En sandbox o entorno restringido: `npm run dev -- --host 127.0.0.1 --port 5173`)

Necesitas un `.env` con las claves — parte de `.env.example`. Para desplegar,
mira `DEPLOY.md`.

## Claves en `.env`

```
# Supabase (proyecto propio)
SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY / SUPABASE_PROJECT_ID
VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY / VITE_SUPABASE_PROJECT_ID

# IA — va por Groq, gratis y sin tarjeta. `ai.server.ts` acepta cualquier
# endpoint compatible con OpenAI, así que basta con apuntarlo ahí:
AI_PROVIDER="openai"
OPENAI_API_KEY="gsk_..."                        # key de Groq
AI_BASE_URL="https://api.groq.com/openai/v1"
AI_MODEL="llama-3.3-70b-versatile"

# Pósters y metadatos: token v4 gratuito de themoviedb.org.
# Sin él la app funciona, pero el hueco del póster sale roto.
TMDB_API_TOKEN="..."
```

Para usar OpenAI o Anthropic de pago, pon `OPENAI_API_KEY` o `ANTHROPIC_API_KEY`
y borra `AI_BASE_URL` y `AI_MODEL`. Los modelos por defecto son `gpt-4o-mini` y
`claude-haiku-4-5-20251001` respectivamente.

## Historia: qué se desacopló de Lovable

La app nació en Lovable y ya no depende de ellos en tiempo de ejecución:

- **Auth**: fuera `@lovable.dev/cloud-auth-js`. El login por email/contraseña ya
  era Supabase nativo; "Continue with Google" usa `supabase.auth.signInWithOAuth`.
- **Motor de IA**: fuera el gateway `ai.gateway.lovable.dev` / `LOVABLE_API_KEY`.
  Capa propia en `src/lib/ai.server.ts`, usada por `recommend.functions.ts`,
  `feedback.functions.ts` y la tool MCP `recommend.ts`.
- **Base de datos**: migrada de un proyecto de Supabase de la organización de
  Lovable a uno propio. El esquema se levanta con `supabase/bootstrap.sql`.
- **Metadatos y marca**: imagen de previsualización propia (`public/og-image.png`)
  en lugar de una alojada en su almacenamiento, y fuera el reporte de errores a
  su telemetría.

Quedan dos paquetes `@lovable.dev` que son **solo herramientas de construcción**
y no atan a su nube: `@lovable.dev/vite-tanstack-config` (config de Vite) y
`@lovable.dev/mcp-js` (framework del servidor MCP). Quitarlos es un refactor
aparte: el primero implicaría reescribir `vite.config.ts` con los plugins a
mano, y el segundo supondría rehacer o eliminar el servidor MCP de `src/lib/mcp/`.
