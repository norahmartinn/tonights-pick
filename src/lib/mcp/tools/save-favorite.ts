import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForCaller, unauthenticated } from "../supabase";

export default defineTool({
  name: "save_favorite",
  title: "Save favorite",
  description: "Save a movie or TV show to the signed-in user's Tonight favorites.",
  inputSchema: {
    title: z.string().min(1).describe("Title of the movie or show."),
    genre: z.string().optional().describe("Genre string, e.g. 'Sci-fi thriller'."),
    platform: z.string().optional().describe("Streaming platform, e.g. 'Netflix'."),
    rating: z.string().optional().describe("Rating string, e.g. '8.1/10'."),
    description: z.string().optional().describe("Short plot description."),
    reason: z.string().optional().describe("Why it matches the user."),
    poster_url: z.string().optional().describe("Poster image URL."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const { data, error } = await supabaseForCaller(ctx)
      .from("favorites")
      .insert({
        user_id: ctx.getUserId(),
        title: input.title,
        genre: input.genre ?? "",
        platform: input.platform ?? "",
        rating: input.rating ?? "",
        description: input.description ?? "",
        reason: input.reason ?? "",
        poster_url: input.poster_url ?? "",
      })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Saved "${data.title}" to favorites.` }],
      structuredContent: { favorite: data },
    };
  },
});