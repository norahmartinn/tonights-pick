import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { chatJSON } from "./ai.server";
import { z } from "zod";

const RecInput = z.object({
  prompt: z.string().min(2).max(500),
  exclude: z.array(z.string()).max(20).optional(),
  kind: z.enum(["any", "movie", "tv"]).optional(),
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
No markdown, no commentary.${tasteContext}`;

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
    const userMsg = `User mood / request: "${data.prompt}".${exclude}${kindInstruction}\nPick ONE perfect title.`;

    const content = await chatJSON(system, userMsg);
    let parsed: Recommendation;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("AI returned an invalid response. Please try again.");
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

    // Enrich with TMDB (authoritative source for poster/genre/rating/cast/director).
    try {
      const { findTitle } = await import("./tmdb.server");
      const tmdb = await findTitle(result.title, result.year, data.kind);
      if (tmdb) {
        result.title = tmdb.title || result.title;
        result.year = tmdb.year || result.year;
        result.genre = tmdb.genre || result.genre;
        result.rating = tmdb.rating || result.rating;
        result.poster_url = tmdb.poster_url || result.poster_url;
        result.director = tmdb.director || result.director;
        result.cast_members = tmdb.cast_members || result.cast_members;
        if (tmdb.description) result.description = tmdb.description;
        result.media_type = tmdb.media_type;
      }
    } catch {
      // non-blocking — fall back to AI-provided data
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