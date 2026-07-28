# Tonight's Pick — desacoplado de Lovable

App de recomendación de películas/series.
Stack: **TanStack Start (SSR) + React 19 + Vite 8 + Supabase + Tailwind 4**.

## Arrancar
```bash
npm install
npm run dev            # http://localhost:8080
```
(En sandbox/entorno restringido: `npm run dev -- --host 127.0.0.1 --port 5173`)

## Qué se ha desacoplado de Lovable
- **Auth**: eliminado `@lovable.dev/cloud-auth-js`. El login por email/contraseña
  ya era Supabase nativo. El botón "Continue with Google" ahora usa
  `supabase.auth.signInWithOAuth` → actívalo en Supabase (Authentication →
  Providers → Google) o quita el botón si no lo quieres.
- **Motor de IA**: eliminado el gateway `ai.gateway.lovable.dev` / `LOVABLE_API_KEY`.
  Nueva capa propia en `src/lib/ai.server.ts`, usada por `recommend.functions.ts`,
  `feedback.functions.ts` y la tool MCP `recommend.ts`.

Sigue usando dos paquetes `@lovable.dev` que son solo tooling (no atan a su nube):
`@lovable.dev/vite-tanstack-config` (config de Vite) y `@lovable.dev/mcp-js`
(framework MCP). Quitarlos es otro refactor aparte.

## Configura las claves en `.env`
```
# UN proveedor de IA (si no pones AI_PROVIDER se infiere por la clave):
OPENAI_API_KEY="sk-..."            # OpenAI o gateway OpenAI-compatible
# o
ANTHROPIC_API_KEY="sk-ant-..."
AI_MODEL=""                        # opcional, override del modelo
AI_BASE_URL=""                     # opcional, base URL OpenAI-compatible (OpenRouter, Groq...)

TMDB_API_TOKEN=""                  # token v4 gratuito de themoviedb.org (pósters/metadatos)
```
Supabase ya viene configurado en `.env` (apunta a tu proyecto).

## Modelos por defecto (si no defines AI_MODEL)
- OpenAI: `gpt-4o-mini`
- Anthropic: `claude-haiku-4-5-20251001`
