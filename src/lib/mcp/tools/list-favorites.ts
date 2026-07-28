import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForCaller, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_favorites",
  title: "List favorites",
  description: "List the signed-in user's saved favorite movies and TV shows in Tonight.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).optional().describe("Max rows to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const { data, error } = await supabaseForCaller(ctx)
      .from("favorites")
      .select("id, title, genre, platform, rating, description, reason, poster_url, created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 50);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { favorites: data ?? [] },
    };
  },
});