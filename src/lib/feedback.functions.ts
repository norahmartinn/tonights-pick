import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { chatJSON, aiConfigured } from "./ai.server";
import { z } from "zod";

export type Reaction = "love_it" | "like_it" | "not_for_me";

export type FeedbackEntry = {
  id: string;
  history_id: string | null;
  title: string;
  genre: string | null;
  year: string | null;
  reaction: Reaction;
  created_at: string;
};

export type TasteStats = {
  topGenres: { genre: string; count: number }[];
  releasePeriods: { period: string; count: number }[];
  topMoods: { mood: string; count: number }[];
  topDirectors: { name: string; count: number }[];
  topActors: { name: string; count: number }[];
  feedbackCounts: { love_it: number; like_it: number; not_for_me: number; total: number };
  accuracy: number;
  mostLiked: { title: string; genre: string | null; reaction: Reaction }[];
};

const FeedbackInput = z.object({
  historyId: z.string().uuid(),
  title: z.string(),
  genre: z.string().optional(),
  year: z.string().optional(),
  reaction: z.enum(["love_it", "like_it", "not_for_me"]),
});

export const submitFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => FeedbackInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("feedback")
      .upsert(
        {
          user_id: context.userId,
          history_id: data.historyId,
          title: data.title,
          genre: data.genre ?? null,
          year: data.year ?? null,
          reaction: data.reaction,
        },
        { onConflict: "user_id,history_id" }
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listFeedback = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FeedbackEntry[]> => {
    const { data } = await context.supabase
      .from("feedback")
      .select("id, history_id, title, genre, year, reaction, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    return (data ?? []) as FeedbackEntry[];
  });

export const getTasteStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TasteStats> => {
    const [{ data: favs }, { data: feedbackRows }, { data: historyRows }] = await Promise.all([
      context.supabase.from("favorites").select("title, genre").eq("user_id", context.userId),
      context.supabase
        .from("feedback")
        .select("title, genre, year, reaction, history_id")
        .eq("user_id", context.userId),
      context.supabase
        .from("history")
        .select("id, year, genre, mood, director, cast_members")
        .eq("user_id", context.userId)
        .limit(200),
    ]);

    const favorites = favs ?? [];
    const feedback = (feedbackRows ?? []) as FeedbackEntry[];
    const history = (historyRows ?? []) as Array<{
      id: string; year: string | null; genre: string | null;
      mood: string | null; director: string | null; cast_members: string | null;
    }>;
    const historyById = new Map(history.map((h) => [h.id, h]));
    // Weight per history item based on user reaction (defaults to 1)
    const reactionByHistory = new Map<string, Reaction>(
      feedback
        .filter((f) => f.history_id)
        .map((f) => [f.history_id as string, f.reaction])
    );
    function weightFor(historyId: string | null | undefined): number {
      if (!historyId) return 1;
      const r = reactionByHistory.get(historyId);
      if (r === "love_it") return 3;
      if (r === "like_it") return 1;
      if (r === "not_for_me") return -1;
      return 1;
    }

    // --- Genre counts ---
    const genreCounts: Record<string, number> = {};

    function addGenres(genreStr: string | null, weight: number) {
      if (!genreStr) return;
      for (const g of genreStr.split(/[,/·]/).map((s) => s.trim()).filter(Boolean)) {
        genreCounts[g] = (genreCounts[g] ?? 0) + weight;
      }
    }

    for (const fav of favorites) addGenres(fav.genre, 3);
    for (const f of feedback) {
      const w = f.reaction === "love_it" ? 3 : f.reaction === "like_it" ? 1 : -1;
      addGenres(f.genre, w);
    }

    const topGenres = Object.entries(genreCounts)
      .filter(([, c]) => c > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([genre, count]) => ({ genre, count }));

    // --- Release periods ---
    const periodCounts: Record<string, number> = {};
    const yearSources = [
      ...favorites.map((f) => ({ year: null as string | null, weight: 2 })), // favorites have no year
      ...(historyRows ?? []).map((h) => ({ year: h.year, weight: 1 })),
      ...feedback
        .filter((f) => f.reaction !== "not_for_me")
        .map((f) => ({ year: f.year, weight: f.reaction === "love_it" ? 3 : 1 })),
    ];
    for (const { year, weight } of yearSources) {
      if (!year) continue;
      const n = parseInt(year, 10);
      if (isNaN(n)) continue;
      const decade = `${Math.floor(n / 10) * 10}s`;
      periodCounts[decade] = (periodCounts[decade] ?? 0) + weight;
    }
    const releasePeriods = Object.entries(periodCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([period, count]) => ({ period, count }));

    // --- Moods / Directors / Actors (from history weighted by feedback) ---
    const moodCounts: Record<string, number> = {};
    const directorCounts: Record<string, number> = {};
    const actorCounts: Record<string, number> = {};
    for (const h of history) {
      const w = weightFor(h.id);
      if (w <= 0) continue;
      if (h.mood) {
        for (const m of h.mood.split(/[,/·]/).map((s) => s.trim().toLowerCase()).filter(Boolean)) {
          moodCounts[m] = (moodCounts[m] ?? 0) + w;
        }
      }
      if (h.director) {
        const d = h.director.trim();
        if (d) directorCounts[d] = (directorCounts[d] ?? 0) + w;
      }
      if (h.cast_members) {
        for (const a of h.cast_members.split(",").map((s) => s.trim()).filter(Boolean)) {
          actorCounts[a] = (actorCounts[a] ?? 0) + w;
        }
      }
    }
    const topMoods = Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([mood, count]) => ({ mood, count }));
    const topDirectors = Object.entries(directorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
    const topActors = Object.entries(actorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));

    // --- Feedback counts ---
    const feedbackCounts = { love_it: 0, like_it: 0, not_for_me: 0, total: feedback.length };
    for (const f of feedback) {
      if (f.reaction === "love_it") feedbackCounts.love_it++;
      else if (f.reaction === "like_it") feedbackCounts.like_it++;
      else feedbackCounts.not_for_me++;
    }
    const positive = feedbackCounts.love_it + feedbackCounts.like_it;
    const accuracy = feedbackCounts.total > 0 ? Math.round((positive / feedbackCounts.total) * 100) : 0;

    // --- Most liked (deduped by title, strongest reaction wins) ---
    const bestByTitle = new Map<string, FeedbackEntry>();
    for (const f of feedback) {
      if (f.reaction !== "love_it" && f.reaction !== "like_it") continue;
      const key = f.title.trim().toLowerCase();
      const prev = bestByTitle.get(key);
      if (!prev) { bestByTitle.set(key, f); continue; }
      const rank = (r: Reaction) => (r === "love_it" ? 2 : r === "like_it" ? 1 : 0);
      if (rank(f.reaction) > rank(prev.reaction)) bestByTitle.set(key, f);
    }
    const mostLiked = Array.from(bestByTitle.values())
      .sort((a, b) => (a.reaction === "love_it" ? -1 : 1) - (b.reaction === "love_it" ? -1 : 1))
      .slice(0, 6)
      .map((f) => ({ title: f.title, genre: f.genre, reaction: f.reaction as Reaction }));

    return { topGenres, releasePeriods, topMoods, topDirectors, topActors, feedbackCounts, accuracy, mostLiked };
  });

export type CharacterTwin = {
  name: string;
  source: string;
  why: string;
};

export const getCharacterTwin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CharacterTwin | null> => {
    if (!aiConfigured()) return null;

    const [{ data: favs }, { data: feedbackRows }, { data: historyRows }] = await Promise.all([
      context.supabase.from("favorites").select("title, genre").eq("user_id", context.userId).limit(20),
      context.supabase
        .from("feedback")
        .select("title, genre, reaction")
        .eq("user_id", context.userId)
        .in("reaction", ["love_it", "like_it"])
        .limit(30),
      context.supabase
        .from("history")
        .select("title, genre, mood")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    const loved = (feedbackRows ?? []).filter((f) => f.reaction === "love_it").map((f) => f.title);
    const liked = (feedbackRows ?? []).filter((f) => f.reaction === "like_it").map((f) => f.title);
    const favTitles = (favs ?? []).map((f) => f.title);
    const moods = Array.from(
      new Set(((historyRows ?? []) as Array<{ mood: string | null }>).map((h) => h.mood).filter(Boolean))
    ).slice(0, 8);

    if (!loved.length && !liked.length && !favTitles.length) return null;

    const system = `You are a playful pop-culture analyst. Given a user's viewing taste, name ONE well-known FICTIONAL CHARACTER from a movie or TV show whose personality and taste best match this user. Respond ONLY as compact JSON: {"name": string, "source": string, "why": string}. "source" is the film/show. "why" is 1-2 punchy sentences. No markdown.`;
    const userMsg = `Loved: ${loved.join(", ") || "—"}
Liked: ${liked.join(", ") || "—"}
Favorited: ${favTitles.join(", ") || "—"}
Common moods: ${moods.join(", ") || "—"}`;

    try {
      const content = await chatJSON(system, userMsg);
      const parsed = JSON.parse(content);
      if (!parsed?.name) return null;
      return {
        name: String(parsed.name),
        source: String(parsed.source ?? ""),
        why: String(parsed.why ?? ""),
      };
    } catch {
      return null;
    }
  });
