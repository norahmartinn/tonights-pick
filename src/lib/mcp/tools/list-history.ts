import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForCaller, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_history",
  title: "List recommendation history",
  description:
    "List previous recommendations Tonight generated for the signed-in user, most recent first.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).optional().describe("Max rows to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const { data, error } = await supabaseForCaller(ctx)
      .from("history")
      .select("id, prompt, title, year, genre, platform, rating, description, poster_url, created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { history: data ?? [] },
    };
  },
});