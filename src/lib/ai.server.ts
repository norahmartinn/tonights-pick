// Proveedor de IA propio — reemplaza el gateway de Lovable.
// Soporta OpenAI (o cualquier endpoint OpenAI-compatible vía AI_BASE_URL) y Anthropic.
//
// Variables de entorno:
//   AI_PROVIDER      "openai" | "anthropic"  (opcional; si no, se infiere por la clave presente)
//   OPENAI_API_KEY   clave de OpenAI (o del gateway compatible)
//   ANTHROPIC_API_KEY clave de Anthropic
//   AI_MODEL         (opcional) override del modelo
//   AI_BASE_URL      (opcional) base URL OpenAI-compatible, ej. https://openrouter.ai/api/v1

type Provider = "openai" | "anthropic";

function resolveProvider(): Provider {
  const explicit = (process.env.AI_PROVIDER || "").toLowerCase();
  if (explicit === "openai" || explicit === "anthropic") return explicit;
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  throw new Error("Missing AI credentials: set OPENAI_API_KEY or ANTHROPIC_API_KEY");
}

function stripFences(s: string): string {
  return s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

function friendlyError(status: number, body: string): Error {
  if (status === 429) return new Error("Too many requests right now — try again in a moment.");
  if (status === 402) return new Error("AI credits exhausted. Check your provider billing.");
  if (status === 401) return new Error("AI auth failed — check your API key.");
  return new Error(`Recommendation failed (${status}): ${body.slice(0, 200)}`);
}

/**
 * Envía un system + user prompt y devuelve el contenido de texto (que estos
 * prompts piden en JSON). El parseo JSON lo hace cada llamador, como antes.
 */
export async function chatJSON(system: string, user: string): Promise<string> {
  const provider = resolveProvider();

  if (provider === "anthropic") {
    const key = process.env.ANTHROPIC_API_KEY!;
    const model = process.env.AI_MODEL || "claude-haiku-4-5-20251001";
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        // Reforzamos que devuelva solo JSON (Anthropic no tiene response_format).
        system: `${system}\n\nReturn ONLY the raw JSON object. No markdown, no code fences, no commentary.`,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) throw friendlyError(res.status, await res.text().catch(() => ""));
    const json = await res.json();
    const text: string = json?.content?.[0]?.text ?? "{}";
    return stripFences(text);
  }

  // openai / OpenAI-compatible
  const key = process.env.OPENAI_API_KEY!;
  const base = process.env.AI_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.AI_MODEL || "gpt-4o-mini";
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw friendlyError(res.status, await res.text().catch(() => ""));
  const json = await res.json();
  const content: string = json?.choices?.[0]?.message?.content ?? "{}";
  return stripFences(content);
}

/** True si hay alguna credencial de IA configurada (para features opcionales). */
export function aiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
}
