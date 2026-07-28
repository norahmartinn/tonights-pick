import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForCaller, unauthenticated } from "../supabase";

export default defineTool({
  name: "remove_favorite",
  title: "Remove favorite",
  description: "Remove a saved favorite from the signed-in user's Tonight favorites by its id.",
  inputSchema: {
    id: z.string().uuid().describe("The favorite row id (uuid) returned by list_favorites."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
  handler: async ({ id }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const { error } = await supabaseForCaller(ctx).from("favorites").delete().eq("id", id);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: "Favorite removed." }] };
  },
});