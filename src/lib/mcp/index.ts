import { auth, defineMcp } from "@lovable.dev/mcp-js";
import recommendTool from "./tools/recommend";
import listFavoritesTool from "./tools/list-favorites";
import saveFavoriteTool from "./tools/save-favorite";
import removeFavoriteTool from "./tools/remove-favorite";
import listHistoryTool from "./tools/list-history";
import getTasteTool from "./tools/get-taste";

// Direct Supabase host — the .lovable.cloud proxy is rejected as issuer.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "tonight-mcp",
  title: "Tonight",
  version: "0.1.0",
  instructions:
    "Tonight recommends a movie or TV show for the signed-in user and manages their favorites, watch history, and taste profile. Use `recommend` to generate a personalized pick, `list_favorites` / `save_favorite` / `remove_favorite` to manage saved titles, `list_history` to review previous recommendations, and `get_taste_profile` to inspect the user's genre/mood preferences.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    recommendTool,
    listFavoritesTool,
    saveFavoriteTool,
    removeFavoriteTool,
    listHistoryTool,
    getTasteTool,
  ],
});