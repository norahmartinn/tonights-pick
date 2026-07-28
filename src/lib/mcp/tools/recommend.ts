import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForCaller, unauthenticated } from "../supabase";
import { chatJSON, aiConfigured } from "../../ai.server";

type Recommendation = {
  title: string;
  year: string;
  genre: string;
  platform: string;
  rating: string;
  description: string;
  reason: string;
  poster_url: string;
  mood: string;
  director: string;
  cast_members: string;
};

export default defineTool({
  name: "recommend",
  title: "Recommend a movie or show",
  description:
    "Generate ONE personalized movie or TV recommendation for the signed-in Tonight user based on a mood prompt (e.g. 'a smart comedy', 'something like Harry Potter'). Also saves it to the user's history.",
  inputSchema: {
    prompt: z
      .string()
      .min(2)
      .max(500)
      .describe("The user's mood or request, e.g. 'a movie to watch with my parents'."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  handler: async ({ prompt }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    if (!aiConfigured()) return { content: [{ type: "text", text: "AI is not configured." }], isError: true };

    const sb = supabaseForCaller(ctx);

    // Taste context from favorites + positive feedback.
    let tasteContext = "";
    try {
      const [{ data: favs }, { data: feedbackRows }] = await Promise.all([
        sb.from("favorites").select("title, genre").limit(20),
        sb
          .from("feedback")
          .select("title, genre, reaction")
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
        tasteContext = `\n\nUser taste profile (for tone, not to name-drop):\n- Preferred genres: ${topGenres.join(", ")}\nDo NOT justify the pick by referencing the user's favorites or previously liked titles in the reason.`;
      }
    } catch {
      // non-blocking
    }

    const system = `You are Tonight, a witty movie & TV recommender. Return ONE real, specific title. Respond ONLY as compact JSON:
{"title":string,"year":string,"genre":string,"platform":string,"rating":string,"description":string,"reason":string,"poster_url":string,"mood":string,"director":string,"cast_members":string}
No markdown.${tasteContext}`;

    let parsed: Recommendation;
    try {
      const content = await chatJSON(system, `User mood: "${prompt}". Pick ONE perfect title.`);
      parsed = JSON.parse(content);
    } catch (e) {
      return {
        content: [{ type: "text", text: e instanceof Error ? e.message : "AI request failed." }],
        isError: true,
      };
    }
    const rec: Recommendation = {
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
    };

    // Enrich with TMDB when available.
    try {
      const { findTitle } = await import("@/lib/tmdb.server");
      const tmdb = await findTitle(rec.title, rec.year);
      if (tmdb) {
        rec.title = tmdb.title || rec.title;
        rec.year = tmdb.year || rec.year;
        rec.genre = tmdb.genre || rec.genre;
        rec.rating = tmdb.rating || rec.rating;
        rec.poster_url = tmdb.poster_url || rec.poster_url;
        rec.director = tmdb.director || rec.director;
        rec.cast_members = tmdb.cast_members || rec.cast_members;
        if (tmdb.description) rec.description = tmdb.description;
      }
    } catch {
      // non-blocking
    }

    // Save to history under the caller.
    try {
      await sb.from("history").insert({
        user_id: ctx.getUserId(),
        prompt,
        title: rec.title,
        year: rec.year,
        genre: rec.genre,
        platform: rec.platform,
        rating: rec.rating,
        description: rec.description,
        reason: rec.reason,
        poster_url: rec.poster_url,
        mood: rec.mood,
        director: rec.director,
        cast_members: rec.cast_members,
      });
    } catch {
      // swallow
    }

    const summary = `${rec.title}${rec.year ? ` (${rec.year})` : ""} — ${rec.genre}. On ${rec.platform || "unknown platform"}. ${rec.description} Why: ${rec.reason}`;
    return {
      content: [{ type: "text", text: summary }],
      structuredContent: { recommendation: rec },
    };
  },
});