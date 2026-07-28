import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { chatJSON } from "./ai.server";
import { z } from "zod";

const RecInput = z.object({
  prompt: z.string().min(2).max(500),
  exclude: z.array(z.string()).max(20).optional(),
  kind: z.enum(["any", "movie", "tv"]).optional(),
  /** Idioma de la interfaz: el texto generado debe salir en el mismo. */
  lang: z.enum(["en", "es"]).optional(),
});

export type Recommendation = {
  title: string;
  year?: string;
  genre: string;
  platform: string;
  rating: string;
  description: string;
  reason: string;
  poster_url?: string;
  history_id?: string;
  mood?: string;
  director?: string;
  cast_members?: string;
  media_type?: "movie" | "tv";
};

export const recommend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RecInput.parse(input))
  .handler(async ({ data, context }): Promise<Recommendation> => {
    // Build taste profile context from favorites + positive feedback
    let tasteContext = "";
    try {
      const [{ data: favs }, { data: feedbackRows }] = await Promise.all([
        context.supabase.from("favorites").select("title, genre").eq("user_id", context.userId).limit(20),
        context.supabase
          .from("feedback")
          .select("title, genre, reaction")
          .eq("user_id", context.userId)
          .in("reaction", ["love_it", "like_it"])
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      const genreCounts: Record<string, number> = {};
      for (const f of favs ?? []) {
        for (const g of (f.genre ?? "").split(/[,/·]/).map((s: string) => s.trim()).filter(Boolean)) {
          genreCounts[g] = (genreCounts[g] ?? 0) + 2;
        }
      }
      for (const f of feedbackRows ?? []) {
        for (const g of (f.genre ?? "").split(/[,/·]/).map((s: string) => s.trim()).filter(Boolean)) {
          genreCounts[g] = (genreCounts[g] ?? 0) + 1;
        }
      }

      const topGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([g]) => g);

      if (topGenres.length) {
        tasteContext = `\n\nUser taste profile (for tone, not to name-drop):\n- Preferred genres: ${topGenres.join(", ")}\nUse this loosely to personalize, but the user's current mood is the priority. Do NOT justify the pick by referencing the user's favorites or previously liked titles in the "reason" field — the reason must speak only to the current mood/request.`;
      }
    } catch {
      // non-blocking — continue without taste context
    }

    // Sin esto la ficha sale en inglés aunque la interfaz esté en español.
    const idiomaSalida =
      data.lang === "es"
        ? '\n\nIMPORTANT: write "description", "reason" and "mood" in SPANISH (España). Keep "title" in its original language and "platform" as the service name.'
        : '\n\nIMPORTANT: write "description", "reason" and "mood" in ENGLISH.';

    const system = `You are Tonight, a witty movie & TV recommender. Always return ONE single, specific real title (movie or show) that exists. Prefer well-known titles available on major streaming platforms. Respond ONLY as compact JSON matching this schema:
{
  "title": string,
  "year": string,
  "genre": string,                 // e.g. "Sci-fi thriller"
  "platform": string,              // e.g. "Netflix", "HBO Max", "Disney+", "Prime Video", "Apple TV+"
  "rating": string,                // IMDb-style like "8.1/10"
  "description": string,           // 1-2 sentence plot synopsis
  "reason": string,                // 1-2 sentence personalized explanation referencing the user's mood
  "poster_url": string,            // a TMDB image url if known, else ""
  "mood": string,                  // 1-3 words capturing the vibe, e.g. "cozy", "tense", "feel-good"
  "director": string,              // primary director (or showrunner for TV); "" if unknown
  "cast_members": string           // up to 3 lead actors, comma separated; "" if unknown
}
No markdown, no commentary.${idiomaSalida}${tasteContext}`;

    const exclude = data.exclude?.length
      ? `\nDo NOT recommend any of these (already shown): ${data.exclude.join(", ")}.`
      : "";
    const kind = data.kind ?? "any";
    const kindInstruction =
      kind === "movie"
        ? "\nIt MUST be a MOVIE (feature film). Do NOT recommend a TV series."
        : kind === "tv"
        ? "\nIt MUST be a TV SHOW / series. Do NOT recommend a movie."
        : "";
    // El modelo no sabe en qué día vive: sin esta línea, "reciente" o "de los
    // últimos cinco años" se resuelven contra su corte de entrenamiento y
    // devuelve cosas de hace una década.
    const hoy = new Date();
    const fecha = `Today is ${hoy.toISOString().slice(0, 10)}. The current year is ${hoy.getUTCFullYear()}. Resolve any relative time reference ("recent", "last five years", "this decade") against that date.`;

    // ¿Pide algo reciente? El modelo no puede saberlo por sí solo: su corte de
    // conocimiento es anterior. Detectamos la intención y le damos candidatos
    // reales de TMDB para que elija, en vez de dejarle inventar o tirar de
    // memoria vieja.
    const anioActual = hoy.getUTCFullYear();
    const textoPeticion = data.prompt.toLowerCase();

    // Año suelto en la petición ("de 2024", "en 2025")
    const anioSuelto = [...textoPeticion.matchAll(/\b(19|20)\d{2}\b/g)]
      .map((m) => Number(m[0]))
      .filter((a) => a >= anioActual - 6)
      .sort()[0];

    // "los últimos N años" / "last N years": hay que restar, no basta con
    // buscar la palabra "reciente".
    const NUMEROS: Record<string, number> = {
      un: 1, uno: 1, one: 1, dos: 2, two: 2, tres: 3, three: 3, cuatro: 4, four: 4,
      cinco: 5, five: 5, seis: 6, six: 6, siete: 7, seven: 7, ocho: 8, eight: 8,
      nueve: 9, nine: 9, diez: 10, ten: 10,
    };
    const rango = textoPeticion.match(
      /(?:últimos?|ultimos?|last|past)\s+(\d+|un|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:años|anos|years)/,
    );
    const anioPorRango = rango
      ? anioActual - (Number(rango[1]) || NUMEROS[rango[1]] || 0)
      : undefined;

    const pideNovedad =
      anioSuelto !== undefined ||
      anioPorRango !== undefined ||
      /\b(reciente|recientes|nuevo|nueva|novedad|estreno|estrenos|actual|actuales|este año|este ano|recent|new|latest|this year)\b/.test(
        textoPeticion,
      );

    // "menos de 90 minutos", "under 100 minutes", "que dure poco"
    const dur = textoPeticion.match(
      /(?:menos de|under|less than|shorter than|por debajo de)\s+(\d{2,3})\s*(?:min|minutos|minutes)/,
    );
    const duracionMax = dur ? Number(dur[1]) : undefined;

    // Si la petición nombra una nacionalidad, el filtro tiene que llegar a TMDB:
    // la lista de candidatos viene por popularidad y sin esto sale casi toda en
    // inglés, tumbando el idioma que pedía la usuaria.
    const IDIOMAS: [RegExp, string][] = [
      [/\b(españ|espan|spanish)/, "es"], [/\b(corean|korean)/, "ko"],
      [/\b(japon|japanese)/, "ja"], [/\b(franc|french)/, "fr"],
      [/\b(italian)/, "it"], [/\b(alem|german)/, "de"],
      [/\b(mexican|argentin|chilen|colombian)/, "es"],
      [/\b(brasil|brazil|portugu)/, "pt"], [/\b(dan[ié]s|danish)/, "da"],
      [/\b(sueca|swedish)/, "sv"], [/\b(china|chino|chinese)/, "zh"],
      [/\b(india|hindi|bollywood)/, "hi"], [/\b(turca|turkish)/, "tr"],
    ];
    const idiomaPedido = IDIOMAS.find(([re]) => re.test(textoPeticion))?.[1];

    let listaCandidatos = "";
    let titulosPermitidos: Set<string> | null = null;
    if (pideNovedad || duracionMax) {
      try {
        const { discoverRecent } = await import("./tmdb.server");
        const desde = pideNovedad ? (anioSuelto ?? anioPorRango ?? anioActual - 2) : null;
        const candidatos = await discoverRecent(data.kind, desde, 25, duracionMax, idiomaPedido);
        if (candidatos.length) {
          const motivo = [
            desde !== null ? `released from ${desde} onwards` : "",
            duracionMax ? `under ${duracionMax} minutes long` : "",
          ].filter(Boolean).join(" and ");
          titulosPermitidos = new Set(candidatos.map((c) => c.title.toLowerCase()));
          listaCandidatos =
            `\n\nThese are REAL titles ${motivo}, verified against a film database. ` +
            `Your training data cannot confirm this reliably, so you MUST pick one of these and nothing else:\n` +
            candidatos.map((c) => `- ${c.title} (${c.year})`).join("\n");
        }
      } catch {
        // si TMDB falla seguimos sin lista: mejor una respuesta imperfecta que ninguna
      }
    }

    const armarMensaje = (evitar: string[]) => {
      const veta = [...(data.exclude ?? []), ...evitar];
      const excluir = veta.length
        ? `\nDo NOT recommend any of these (already shown or unverifiable): ${veta.join(", ")}.`
        : "";
      return `${fecha}\n\nUser mood / request: "${data.prompt}".${excluir}${kindInstruction}${listaCandidatos}\nPick ONE perfect title.`;
    };

    const pedirTitulo = async (evitar: string[]): Promise<Recommendation> => {
      const content = await chatJSON(system, armarMensaje(evitar));
      try {
        return JSON.parse(content) as Recommendation;
      } catch {
        throw new Error("AI returned an invalid response. Please try again.");
      }
    };

    // Cloudflare marca el país en cada petición. Sirve para no decirle a
    // alguien de México que algo está en una plataforma que allí no existe.
    let pais = "ES";
    try {
      const { getRequest } = await import("@tanstack/react-start/server");
      const cabecera = getRequest()?.headers?.get("cf-ipcountry");
      if (cabecera && /^[A-Z]{2}$/.test(cabecera)) pais = cabecera;
    } catch {
      // sin cabecera nos quedamos con España
    }

    const { findTitle } = await import("./tmdb.server");

    let parsed = await pedirTitulo([]);

    // El modelo se salta la lista con cierta frecuencia aunque se le diga que es
    // obligatoria. Comprobarlo es barato; confiar, no.
    if (titulosPermitidos && parsed?.title && !titulosPermitidos.has(parsed.title.toLowerCase())) {
      const segundo = await pedirTitulo([parsed.title]).catch(() => null);
      if (segundo?.title && titulosPermitidos.has(segundo.title.toLowerCase())) parsed = segundo;
    }

    let tmdb = await findTitle(parsed.title ?? "", parsed.year, data.kind, pais, data.lang ?? "en").catch(() => null);

    // Si TMDB no lo encuentra, lo más probable es que el modelo se lo haya
    // inventado (pasa sobre todo con peticiones de nicho). Una segunda
    // oportunidad, vetando el título fantasma, en vez de mostrar una ficha falsa.
    if (!tmdb && parsed?.title) {
      const fantasma = parsed.title;
      const segundo = await pedirTitulo([fantasma]).catch(() => null);
      if (segundo?.title) {
        const verificado = await findTitle(segundo.title, segundo.year, data.kind, pais, data.lang ?? "en").catch(() => null);
        if (verificado) {
          parsed = segundo;
          tmdb = verificado;
        }
      }
    }

    const result: Recommendation = {
      title: parsed.title ?? "Unknown",
      year: parsed.year ?? "",
      genre: parsed.genre ?? "",
      platform: parsed.platform ?? "",
      rating: parsed.rating ?? "",
      description: parsed.description ?? "",
      reason: parsed.reason ?? "",
      poster_url: parsed.poster_url ?? "",
      mood: parsed.mood ?? "",
      director: parsed.director ?? "",
      cast_members: parsed.cast_members ?? "",
      media_type: data.kind === "movie" || data.kind === "tv" ? data.kind : undefined,
    };

    // TMDB manda sobre los metadatos: póster, géneros, nota, reparto y dirección.
    if (tmdb) {
      // TMDB sabe dónde se puede ver; el modelo se lo inventaba. Si no consta,
      // se deja vacío: la ficha oculta la etiqueta y no miente.
      result.platform = tmdb.platform;
      result.title = tmdb.title || result.title;
      result.year = tmdb.year || result.year;
      result.genre = tmdb.genre || result.genre;
      result.rating = tmdb.rating || result.rating;
      result.poster_url = tmdb.poster_url || result.poster_url;
      result.director = tmdb.director || result.director;
      result.cast_members = tmdb.cast_members || result.cast_members;
      if (tmdb.description) result.description = tmdb.description;
      result.media_type = tmdb.media_type;
    } else {
      // Ni el reintento se pudo verificar: al menos no enseñamos un póster roto.
      result.poster_url = "";
    }

    // Save to history and capture id for feedback
    try {
      const { data: historyRow } = await context.supabase
        .from("history")
        .insert({
          user_id: context.userId,
          prompt: data.prompt,
          title: result.title,
          year: result.year,
          genre: result.genre,
          platform: result.platform,
          rating: result.rating,
          description: result.description,
          reason: result.reason,
          poster_url: result.poster_url,
          mood: result.mood,
          director: result.director,
          cast_members: result.cast_members,
        })
        .select("id")
        .single();
      if (historyRow?.id) result.history_id = historyRow.id;
    } catch {
      // swallow — don't fail the recommendation if history write fails
    }

    return result;
  });