import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForCaller, unauthenticated } from "../supabase";

function tally(rows: Array<{ value: string; weight: number }>) {
  const counts: Record<string, number> = {};
  for (const { value, weight } of rows) {
    for (const raw of (value ?? "").split(/[,/·]/).map((s) => s.trim()).filter(Boolean)) {
      counts[raw] = (counts[raw] ?? 0) + weight;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));
}

export default defineTool({
  name: "get_taste_profile",
  title: "Get taste profile",
  description:
    "Return the signed-in user's Tonight taste profile: top genres, moods, directors, and cast, aggregated from favorites and feedback.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const sb = supabaseForCaller(ctx);
    const [favs, feedback] = await Promise.all([
      sb.from("favorites").select("genre").limit(100),
      sb
        .from("feedback")
        .select("genre, mood, director, cast_members, reaction")
        .in("reaction", ["love_it", "like_it"])
        .limit(200),
    ]);
    if (favs.error) return { content: [{ type: "text", text: favs.error.message }], isError: true };
    if (feedback.error) return { content: [{ type: "text", text: feedback.error.message }], isError: true };

    const genres = tally([
      ...(favs.data ?? []).map((r) => ({ value: r.genre ?? "", weight: 2 })),
      ...(feedback.data ?? []).map((r) => ({
        value: r.genre ?? "",
        weight: r.reaction === "love_it" ? 2 : 1,
      })),
    ]);
    const moods = tally((feedback.data ?? []).map((r) => ({ value: r.mood ?? "", weight: 1 })));
    const directors = tally((feedback.data ?? []).map((r) => ({ value: r.director ?? "", weight: 1 })));
    const cast = tally((feedback.data ?? []).map((r) => ({ value: r.cast_members ?? "", weight: 1 })));

    const profile = { top_genres: genres, top_moods: moods, top_directors: directors, top_cast: cast };
    return {
      content: [{ type: "text", text: JSON.stringify(profile) }],
      structuredContent: profile,
    };
  },
});